const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}) {
  const out = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    {
      exports: out,
      require: (name) => {
        if (!(name in mocks)) throw Error('Unexpected dependency ' + name);
        return mocks[name];
      },
      Date,
      Promise,
    },
  );
  return out;
}
const trace = load('lib/location-diagnostic-trace.ts');
test('location trace records shapes and redacts numeric native error data without recording coordinates', () => {
  trace.beginLocationTrace();
  trace.traceLocation(
    'callback',
    trace.locationShape({
      coords: { latitude: 6.1234, longitude: 3.5678, accuracy: 10 },
      timestamp: 123,
    }),
  );
  trace.traceLocation(
    'error',
    trace.safeLocationError(
      Object.assign(Error('Provider failed near 6.1234,3.5678'), {
        code: 'ERR_PROVIDER',
      }),
    ),
  );
  const value = JSON.stringify(trace.getLocationTrace());
  assert.ok(value.includes('ERR_PROVIDER'));
  assert.ok(value.includes('latType'));
  assert.ok(!value.includes('6.1234'));
  assert.ok(!value.includes('3.5678'));
  trace.beginLocationTrace();
  assert.equal(trace.getLocationTrace().events.length, 0);
});
test('on-device report includes permissions and provider state but excludes history and raw position values', async () => {
  const api = load('lib/location-diagnostics.ts', {
    'expo-location': {
      getForegroundPermissionsAsync: async () => ({
        status: 'granted',
        granted: true,
        canAskAgain: true,
        android: { accuracy: 'coarse' },
        secret: 'private',
      }),
      getProviderStatusAsync: async () => ({
        locationServicesEnabled: true,
        gpsAvailable: true,
        networkAvailable: false,
        latitude: 6.1234,
      }),
    },
    'expo-application': {
      nativeApplicationVersion: '1.0.1',
      nativeBuildVersion: '16',
      applicationId: 'com.savemymeal.app',
    },
    'expo-constants': { default: { executionEnvironment: 'standalone' } },
    'react-native': {
      AppState: { currentState: 'active' },
      Platform: { OS: 'android', Version: 36 },
    },
    './location-diagnostic-trace': trace,
    './locationAccess': { withLocationTimeout: (promise) => promise },
  });
  const report = await api.collectLocationDiagnostics();
  assert.equal(report.permission.androidAccuracy, 'coarse');
  assert.equal(report.providers.networkAvailable, false);
  assert.equal(report.executionEnvironment, 'standalone');
  assert.equal(report.providers.latitude, undefined);
  assert.equal(report.permission.secret, undefined);
  assert.ok(!JSON.stringify(report).includes('6.1234'));
});

test('synchronous native inspection failures still produce a readable support report', async () => {
  const api = load('lib/location-diagnostics.ts', {
    'expo-location': {
      getForegroundPermissionsAsync() {
        throw Object.assign(Error('Permission bridge failed'), {
          code: 'ERR_BRIDGE',
        });
      },
      getProviderStatusAsync() {
        throw Error('Provider bridge failed');
      },
    },
    'expo-application': {
      nativeApplicationVersion: '1.0.1',
      nativeBuildVersion: '17',
      applicationId: 'com.savemymeal.app',
    },
    'expo-constants': { default: { executionEnvironment: 'standalone' } },
    'react-native': {
      AppState: { currentState: 'active' },
      Platform: { OS: 'android', Version: 36 },
    },
    './location-diagnostic-trace': trace,
    './locationAccess': { withLocationTimeout: (promise) => promise },
  });
  const report = await api.collectLocationDiagnostics();
  assert.equal(report.permission.code, 'ERR_BRIDGE');
  assert.equal(report.providers.message, 'Provider bridge failed');
  assert.ok(report.trace);
  assert.equal(report.buildNumber, '17');
});
