const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm'),
  ts = require('typescript');
const exportsForTest = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/offer-display.ts', 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText,
  { exports: exportsForTest },
);
const { offerDisplay } = exportsForTest;
test('offer cards use naira for fixed savings and kobo conversion only for minimum spend', () => {
  const result = offerDisplay({
    benefit: 'fixed',
    value: 1500,
    minimum_spend_kobo: 200000,
  });
  assert.equal(result.saving, '₦1,500 off');
  assert.equal(result.detail, 'Min. order ₦2,000');
});
test('percentage and audience labels remain accurate across campaigns and deals', () => {
  assert.equal(
    offerDisplay({ benefit: 'percentage', value: '15', audience: 'first' })
      .saving,
    '15% off',
  );
  assert.equal(offerDisplay({ audience: 'first' }).audience, 'First order');
  assert.equal(
    offerDisplay({ audience: 'returning' }).audience,
    'Returning customers',
  );
  assert.equal(offerDisplay({ audience: 'nth' }).audience, 'Selected orders');
});
test('invalid savings and missing minimums do not advertise fabricated amounts', () => {
  for (const value of [undefined, NaN, 0, 'invalid'])
    assert.equal(offerDisplay({ value }).saving, 'Special offer');
  assert.equal(offerDisplay({}).detail, 'Eligibility checked at checkout');
});
