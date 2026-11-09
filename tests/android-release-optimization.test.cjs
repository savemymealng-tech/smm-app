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

test('optimised releases retain the Kotlin metadata used to decode Expo native option records', () => {
  const config = require('../app.json').expo;
  const build = config.plugins.find(item => Array.isArray(item) && item[0] === 'expo-build-properties')[1].android;
  const rules = build.extraProguardRules;
  assert.equal(build.enableMinifyInReleaseBuilds, true);
  assert.equal(build.enableShrinkResourcesInReleaseBuilds, true);
  assert.match(rules, /-keep class kotlin\.Metadata \{ \*; \}/);
  assert.match(rules, /-keepattributes [^\n]*RuntimeVisibleAnnotations/);
  assert.match(rules, /-keepattributes [^\n]*Signature/);
  assert.match(rules, /-keep class expo\.modules\.kotlin\.records\.\*\* \{ \*; \}/);
  assert.match(rules, /-keep class \* implements expo\.modules\.kotlin\.records\.Record \{ \*; \}/);
  assert.doesNotMatch(rules, /(?:^|\n)-(?:dontoptimize|dontobfuscate|dontshrink)(?:\s|$)/);
  assert.doesNotMatch(rules, /-keep class (?:kotlin|expo)\.\*\*/);
});
