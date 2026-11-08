// Run with: node --test tests/location-permissions.test.cjs (no native build).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  vm.runInNewContext(
    source,
    {
      exports,
      require: (name) => {
        assert.ok(name in mocks, `Unexpected dependency: ${name}`);
        return mocks[name];
      },
      setTimeout,
      clearTimeout,
      Promise,
      Date,
      console: { log() {}, error() {} },
    },
    { filename: file },
  );
  return exports;
}

function fixture(status = 'granted', services = true) {
  const state = {
    status,
    services,
    prompts: 0,
    positions: 0,
    settings: 0,
    location: null,
    effects: [],
  };
  const native = {
    getForegroundPermissionsAsync: async () => ({
      status: state.status,
      canAskAgain: state.canAskAgain ?? true,
    }),
    hasServicesEnabledAsync: async () => state.services,
    enableNetworkProviderAsync: async () => {
      state.providerPrompts = (state.providerPrompts || 0) + 1;
      if (state.enableServices) state.services = true;
      else throw Error('Declined');
    },
    getLastKnownPositionAsync: async () => state.lastKnown || null,
    requestForegroundPermissionsAsync: async () => {
      state.prompts++;
      state.status = state.answer ?? 'denied';
      state.canAskAgain = false;
      return { status: state.status, canAskAgain: false };
    },
    Accuracy: { Balanced: 3, High: 4 },
    watchPositionAsync: async (options, onPosition, onError) => {
      state.positions++;
      state.watches = (state.watches || 0) + 1;
      state.watchOptions = options;
      if (!options.mayShowUserSettingsDialog)
        state.backgroundPosition = onPosition;
      const subscription = {
        remove() {
          state.removes = (state.removes || 0) + 1;
        },
      };
      if (state.failGPS || state.failWatch) throw new Error('GPS unavailable');
      if (state.lateRegistration)
        return new Promise((resolve) => {
          state.finishRegistration = () => resolve(subscription);
        });
      if (!state.hangGPS)
        queueMicrotask(() => {
          if (state.transientWatchError)
            onError('Location temporarily unavailable');
          onPosition({
            coords: { latitude: 6.5, longitude: 3.4, accuracy: 30 },
            timestamp: Date.now(),
          });
        });
      return subscription;
    },
    getCurrentPositionAsync: async () => {
      state.positions++;
      if (state.failGPS || state.failSingle) throw new Error('GPS unavailable');
      if (state.hangGPS) return new Promise(() => {});
      return { coords: { latitude: 6.5, longitude: 3.4 }, timestamp: 123 };
    },
    reverseGeocodeAsync: async () => [{ city: 'Lagos' }],
  };
  const platform = {
    get OS() {
      return state.platform || 'ios';
    },
  };
  const access = load('lib/locationAccess.ts', {
    'expo-location': native,
    './location-diagnostic-trace': {
      traceLocation() {},
      safeLocationError: (error) => ({ message: String(error) }),
      locationShape: () => ({}),
    },
    'react-native': { Platform: platform },
  });
  const hook = load('lib/hooks/useLocation.ts', {
    'expo-location': native,
    '../locationAccess': access,
    '../location-diagnostic-trace': {
      beginLocationTrace() {},
      traceLocation() {},
      safeLocationError: (error) => ({ message: String(error) }),
    },
    '../atoms/location': {
      locationAtom: 'location',
      locationReadyAtom: 'ready',
      locationRevisionAtom: 'revision',
      initializeLocationAtom: 'init',
      selectBrowsingLocationAtom: 'select',
    },
    jotai: {
      useAtom: () => [
        state.location,
        (value) => {
          state.location = value;
        },
      ],
      useAtomValue: () => true,
      useSetAtom: (key) =>
        key === 'select'
          ? (value) => {
              state.location = value;
              state.revision = (state.revision || 0) + 1;
            }
          : () => {},
      useStore: () => ({
        get: (key) =>
          key === 'location' ? state.location : state.revision || 0,
      }),
    },
    react: {
      useCallback: (fn) => fn,
      useRef: (current) => ({ current }),
      useState: (value) => [value, () => {}],
      useEffect: (fn) => state.effects.push(fn),
    },
    'react-native': {
      Platform: platform,
      AppState: {
        addEventListener: (_, fn) => {
          state.resume = fn;
          return { remove() {} };
        },
      },
      Linking: {
        openSettings: async () => {
          state.settings++;
        },
      },
    },
  }).useLocation();
  return { state, access, hook };
}
const flush = () => new Promise((resolve) => setImmediate(resolve));

for (const status of ['denied', 'restricted', 'undetermined']) {
  test(`${status}: mounting and refreshing never prompts or redirects`, async () => {
    const { state, hook } = fixture(status);
    state.effects.forEach((fn) => fn());
    await flush();
    await hook.refreshLocation();
    assert.equal(state.prompts, 0);
    assert.equal(state.positions, 0);
    assert.equal(state.settings, 0);
    assert.equal(state.location, null);
  });
}
for (const status of ['denied', 'restricted']) {
  test(`${status}: repeated explicit attempts do not request again`, async () => {
    const { state, hook } = fixture(status);
    state.canAskAgain = false;
    await hook.requestLocation();
    await hook.requestLocation();
    assert.equal(state.prompts, 0);
    assert.equal(state.settings, 0);
    assert.equal(state.positions, 0);
  });
}
test('disabled services: no prompt or GPS even with permission granted', async () => {
  for (const status of ['granted', 'undetermined', 'denied']) {
    const { state, hook } = fixture(status, false);
    await hook.requestLocation();
    assert.equal(state.prompts, 0);
    assert.equal(state.positions, 0);
    assert.equal(state.settings, 0);
  }
});
test('undetermined: user action prompts once; denial is respected', async () => {
  const { state, hook } = fixture('undetermined');
  await hook.requestLocation();
  await hook.requestLocation();
  assert.equal(state.prompts, 1);
  assert.equal(state.positions, 0);
});
test('undetermined and cannot ask again: no request', async () => {
  const { state, hook } = fixture('undetermined');
  state.canAskAgain = false;
  await hook.requestLocation();
  assert.equal(state.prompts, 0);
});
test('undetermined: granting on user action gets current coordinates and address', async () => {
  const { state, hook } = fixture('undetermined');
  state.answer = 'granted';
  await hook.requestLocation();
  assert.equal(state.prompts, 1);
  assert.equal(state.location.coords.latitude, 6.5);
  assert.equal(state.location.address, 'Lagos');
});
test('granted: mount fetches GPS without asking permission', async () => {
  const { state } = fixture();
  state.effects.forEach((fn) => fn());
  await flush();
  assert.equal(state.positions, 1);
  assert.equal(state.prompts, 0);
  assert.equal(state.location.address, 'Lagos');
});
test('Settings return: grant restores GPS; revocation or services off clears stale coordinates', async () => {
  const { state } = fixture('denied');
  state.effects.forEach((fn) => fn());
  await flush();
  state.status = 'granted';
  state.resume('active');
  await flush();
  assert.ok(state.location);
  state.status = 'denied';
  state.resume('active');
  await flush();
  assert.equal(state.location, null);
  state.status = 'granted';
  state.resume('active');
  await flush();
  assert.ok(state.location);
  state.services = false;
  state.resume('active');
  await flush();
  assert.equal(state.location, null);
  assert.equal(state.prompts, 0);
  assert.equal(state.settings, 0);
});
test('GPS failure remains non-blocking and clears stale coordinates', async () => {
  const { state, hook } = fixture();
  state.failGPS = true;
  await hook.requestLocation();
  assert.equal(state.location, null);
  assert.equal(state.settings, 0);
});
test('concurrent permission actions share one native request', async () => {
  const { state, access } = fixture('undetermined');
  await Promise.all([
    access.getLocationAccess(true),
    access.getLocationAccess(true),
  ]);
  assert.equal(state.prompts, 1);
});

test('manual city survives automatic refresh and denied permission', async () => {
  const { state, hook } = fixture('denied');
  state.location = {
    city: 'Ibadan',
    address: 'Ibadan',
    source: 'manual',
    timestamp: 1,
  };
  await hook.refreshLocation();
  assert.equal(state.location.city, 'Ibadan');
  assert.equal(state.positions, 0);
});
test('choosing another area while GPS is pending discards stale GPS result', async () => {
  const { state, hook } = fixture();
  const pending = hook.requestLocation();
  state.location = { city: 'Abuja', source: 'manual', timestamp: 1 };
  state.revision = 1;
  await pending;
  assert.equal(state.location.city, 'Abuja');
});

test('explicit retry can request an Android permission that is denied but still requestable', async () => {
  const { state, hook } = fixture('denied');
  state.platform = 'android';
  state.canAskAgain = true;
  state.answer = 'granted';
  await hook.requestLocation();
  assert.equal(state.prompts, 1);
  assert.equal(state.location.coords.latitude, 6.5);
});
test('explicit Android action can enable location services through the native provider dialog', async () => {
  const { state, hook } = fixture('granted', false);
  state.platform = 'android';
  state.enableServices = true;
  await hook.requestLocation();
  assert.equal(state.providerPrompts, 1);
  assert.equal(state.location.coords.longitude, 3.4);
});
test('failed fresh GPS can use a recent accurate native fix; old fixes are rejected', async () => {
  const { state, hook } = fixture();
  state.failGPS = true;
  state.lastKnown = {
    coords: { latitude: 6.6, longitude: 3.5, accuracy: 100 },
    timestamp: Date.now() - 1000,
  };
  await hook.requestLocation();
  assert.equal(state.location.coords.latitude, 6.6);
  state.lastKnown.timestamp = Date.now() - 180000;
  state.location = null;
  await hook.requestLocation();
  assert.equal(state.location, null);
});
test('GPS failure does not erase a manually chosen browsing area', async () => {
  const { state, hook } = fixture();
  state.location = { city: 'Ibadan', source: 'manual', timestamp: 1 };
  state.failGPS = true;
  await hook.requestLocation();
  assert.equal(state.location.city, 'Ibadan');
});

test('a stalled native GPS request times out and uses a recent accurate fix', async () => {
  const { state, access } = fixture();
  state.hangGPS = true;
  state.lastKnown = {
    coords: { latitude: 6.6, longitude: 3.5, accuracy: 50 },
    timestamp: Date.now() - 1000,
  };
  const result = await access.getPositionForBrowsing(true, 5);
  assert.equal(result.coords.latitude, 6.6);
});
test('imprecise cached coordinates are not used as a fallback', async () => {
  const { state, access } = fixture();
  state.failGPS = true;
  state.lastKnown = {
    coords: { latitude: 6.6, longitude: 3.5, accuracy: 2000 },
    timestamp: Date.now() - 1000,
  };
  await assert.rejects(access.getPositionForBrowsing(true), /GPS unavailable/);
});

test('Android gets an active fix despite transient provider unavailability and stops watching', async () => {
  const { state, hook } = fixture();
  state.platform = 'android';
  state.transientWatchError = true;
  await hook.requestLocation();
  assert.equal(state.location.coords.latitude, 6.5);
  assert.equal(state.watches, 1);
  assert.equal(state.removes, 1);
  assert.equal(state.watchOptions.accuracy, 3);
});
test('simultaneous Android consumers share one subscription', async () => {
  const { state, access } = fixture();
  state.platform = 'android';
  await Promise.all([
    access.getPositionForBrowsing(true),
    access.getPositionForBrowsing(true),
  ]);
  assert.equal(state.watches, 1);
  assert.equal(state.removes, 1);
});
test('timed-out Android subscription is removed even when registration completes late', async () => {
  const { state, access } = fixture();
  state.platform = 'android';
  state.lateRegistration = true;
  state.failSingle = true;
  await assert.rejects(access.getPositionForBrowsing(true, 5), /timed out/);
  state.finishRegistration();
  await flush();
  assert.equal(state.removes, 1);
});
test('recent Android approximate fixes remain usable for browsing', async () => {
  const { state, access } = fixture();
  state.platform = 'android';
  state.failGPS = true;
  state.lastKnown = {
    coords: { latitude: 6.4, longitude: 3.5, accuracy: 2500 },
    timestamp: Date.now() - 1000,
  };
  assert.equal(
    (await access.getPositionForBrowsing(true)).coords.latitude,
    6.4,
  );
});
test('explicit Android action is not swallowed by a background location request', async () => {
  const { state, hook } = fixture();
  state.platform = 'android';
  state.lateRegistration = true;
  const background = hook.refreshLocation();
  while (!state.finishRegistration) await Promise.resolve();
  const finishBackground = state.finishRegistration;
  state.lateRegistration = false;
  await hook.requestLocation();
  assert.equal(state.location.source, 'gps');
  assert.equal(state.watches, 2);
  // Complete the old provider operation without letting it replace the chosen fix.
  finishBackground();
  state.backgroundPosition({
    coords: { latitude: 1, longitude: 2, accuracy: 10 },
    timestamp: Date.now(),
  });
  await background;
  assert.equal(state.location.coords.latitude, 6.5);
});

test('Android can recover with a one-shot position when subscription registration fails', async () => {
  const { state, access } = fixture();
  state.platform = 'android';
  state.failWatch = true;
  const position = await access.getPositionForBrowsing(true);
  assert.equal(position.coords.latitude, 6.5);
  assert.equal(state.watches, 1);
});
