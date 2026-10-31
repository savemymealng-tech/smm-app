const { test } = require('node:test');
const assert = require('node:assert/strict');
const { optimizeReleaseDefaults } = require('../plugins/with-android-release-optimization');

test('release optimiser replaces disabled optimisation defaults and preserves library keep rules', () => {
  const source = `release { minifyEnabled enableMinifyInReleaseBuilds; proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro" }`;
  const result = optimizeReleaseDefaults(source);
  assert.ok(result.includes('proguard-android-optimize.txt'));
  assert.ok(result.includes('"proguard-rules.pro"'));
  assert.equal(optimizeReleaseDefaults(result), result);
  assert.ok(optimizeReleaseDefaults("getDefaultProguardFile('proguard-android.txt')").includes('proguard-android-optimize.txt'));
});
test('unknown native templates fail clearly instead of silently skipping release optimisation', () => {
  assert.throws(() => optimizeReleaseDefaults('release {}'), /expected the release ProGuard defaults/);
});
