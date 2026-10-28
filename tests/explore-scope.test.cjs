const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  vm = require('node:vm'),
  ts = require('typescript');
const output = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/explore-scope.ts', 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText,
  { exports: output },
);
const scope = output.exploreScope;
test('saved Lagos selection does not imply filtering when location filter is off', () => {
  const result = scope(
    false,
    { city: 'Lagos', coords: { latitude: 6.5, longitude: 3.3 } },
    10,
  );
  assert.equal(result.active, false);
  assert.equal(Object.keys(result.params).length, 0);
  assert.match(result.label, /all areas/);
  assert.doesNotMatch(result.label, /Lagos/);
});
test('city-only results claim Lagos only when the request includes the Lagos city filter', () => {
  const result = scope(true, { city: ' Lagos ' }, 10);
  assert.equal(result.params.city, 'Lagos');
  assert.equal(result.label, 'In Lagos');
  assert.equal(result.active, true);
});
test('coordinate selection uses a radius rather than claiming the entire city', () => {
  const result = scope(
    true,
    { city: 'Lagos', coords: { latitude: 0, longitude: 0 } },
    20,
  );
  assert.equal(result.params.latitude, 0);
  assert.equal(result.params.longitude, 0);
  assert.equal(result.params.radius, 20);
  assert.equal(result.params.city, undefined);
  assert.match(result.label, /20 km radius/);
});
test('missing and invalid areas cannot label unrestricted requests as local', () => {
  for (const location of [
    null,
    {},
    { coords: { latitude: NaN, longitude: 3 } },
    { city: '  ' },
  ]) {
    const result = scope(true, location, 10);
    assert.equal(result.active, false);
    assert.match(result.label, /all areas/);
    assert.equal(Object.keys(result.params).length, 0);
  }
});
