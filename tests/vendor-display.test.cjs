const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm'),
  ts = require('typescript');
const exportsForTest = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/vendor-display.ts', 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText,
  { exports: exportsForTest },
);
const { vendorRating, vendorFlags, vendorDistanceMeters } = exportsForTest;
test('vendor ratings reject invalid or missing values instead of presenting invented ratings', () => {
  for (const value of [
    undefined,
    null,
    '',
    0,
    -1,
    6,
    'bad',
    true,
    NaN,
    Infinity,
  ])
    assert.equal(vendorRating(value), null);
  assert.equal(vendorRating('4.60'), '4.6');
});
test('vendor distances preserve valid zero coordinates and consistently interpret API kilometres', () => {
  assert.equal(
    vendorDistanceMeters(
      { latitude: '0', longitude: '0' },
      { latitude: 0, longitude: 0 },
    ),
    0,
  );
  assert.equal(vendorDistanceMeters({ distance: '1.5' }), 1500);
  assert.equal(vendorDistanceMeters({ distance: '2 km' }), 2000);
  assert.equal(vendorDistanceMeters({ distance: '250 m' }), 250);
  assert.equal(vendorDistanceMeters({ distance: 0 }), 0);
  for (const distance of ['', 'invalid', -1, NaN, Infinity])
    assert.equal(vendorDistanceMeters({ distance }), null);
  assert.equal(
    vendorDistanceMeters(
      { latitude: '', longitude: '' },
      { latitude: 0, longitude: 0 },
    ),
    null,
  );
  assert.equal(
    vendorDistanceMeters(
      { latitude: true, longitude: false },
      { latitude: 0, longitude: 0 },
    ),
    null,
  );
});
test('featured and verification labels reflect explicit backend flags', () => {
  assert.equal(
    vendorFlags({ verification_status: 'approved', is_featured: true })
      .verified,
    true,
  );
  assert.equal(
    vendorFlags({ verification_status: 'pending', isVerified: true }).verified,
    false,
  );
  assert.equal(
    vendorFlags({ is_featured: false, featured: true }).featured,
    false,
  );
  assert.equal(vendorFlags({}).featured, false);
});
