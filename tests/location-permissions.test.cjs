// Run with: node --test tests/location-permissions.test.cjs (no native build).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(source, { exports, require: (name) => {
    assert.ok(name in mocks, `Unexpected dependency: ${name}`);
    return mocks[name];
  }, console: { log() {}, error() {} } }, { filename: file });
  return exports;
}

function fixture(status = 'granted', services = true) {
  const state = { status, services, prompts: 0, positions: 0, settings: 0, location: null, effects: [] };
  const native = {
    getForegroundPermissionsAsync: async () => ({ status: state.status, canAskAgain: state.canAskAgain ?? true }),
    hasServicesEnabledAsync: async () => state.services,
    requestForegroundPermissionsAsync: async () => {
      state.prompts++;
      state.status = state.answer ?? 'denied';
      return { status: state.status, canAskAgain: false };
    },
    Accuracy: { Balanced: 3 },
    getCurrentPositionAsync: async () => {
      state.positions++;
      if (state.failGPS) throw new Error('GPS unavailable');
      return { coords: { latitude: 6.5, longitude: 3.4 }, timestamp: 123 };
    },
    reverseGeocodeAsync: async () => [{ city: 'Lagos' }],
  };
  const access = load('lib/locationAccess.ts', { 'expo-location': native });
  const hook = load('lib/hooks/useLocation.ts', {
    'expo-location': native,
    '../locationAccess': access,
    '../atoms/location': { locationAtom: {} },
    jotai: { useAtom: () => [state.location, (value) => { state.location = value; }] },
    react: {
      useCallback: (fn) => fn,
      useRef: (current) => ({ current }),
      useState: (value) => [value, () => {}],
      useEffect: (fn) => state.effects.push(fn),
    },
    'react-native': {
      AppState: { addEventListener: (_, fn) => { state.resume = fn; return { remove() {} }; } },
      Linking: { openSettings: async () => { state.settings++; } },
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
  await Promise.all([access.getLocationAccess(true), access.getLocationAccess(true)]);
  assert.equal(state.prompts, 1);
});
