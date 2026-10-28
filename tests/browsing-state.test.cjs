const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const jotai = require('jotai/vanilla');
const root = require('node:path').resolve(__dirname, '..') + '/';
function load(file, mocks = {}) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(root + file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    {
      exports,
      require: (name) => {
        if (!(name in mocks)) throw new Error('Unexpected dependency ' + name);
        return mocks[name];
      },
    },
  );
  return exports;
}
test('ratings handle decimal strings, numbers and missing or invalid values', () => {
  const { ratingLabel, remainingStock } = load('lib/product-display.ts');
  assert.equal(ratingLabel('4.60'), '4.6');
  assert.equal(ratingLabel(4.2), '4.2');
  for (const input of [null, undefined, '', 'bad', NaN, Infinity, -1, 6, 0])
    assert.equal(ratingLabel(input), 'No reviews yet');
  assert.equal(remainingStock(5, 2), 3);
  assert.equal(remainingStock(1, 3), 0);
  assert.equal(remainingStock(NaN, 0), 0);
});
test('manual browsing area is persisted, hydrated and GPS selection clears it', async () => {
  let value = null;
  const storage = {
    getItem: async () => value,
    setItem: async (_, next) => {
      value = next;
    },
    removeItem: async () => {
      value = null;
    },
  };
  const atoms = load('lib/atoms/location.ts', {
    jotai,
    '@react-native-async-storage/async-storage': { default: storage },
  });
  const store = jotai.createStore();
  const area = {
    city: 'Ibadan',
    address: 'Ibadan',
    source: 'manual',
    timestamp: 1,
  };
  store.set(atoms.selectBrowsingLocationAtom, area);
  await new Promise((r) => setImmediate(r));
  assert.equal(JSON.parse(value).city, 'Ibadan');
  const another = jotai.createStore();
  await another.set(atoms.initializeLocationAtom);
  assert.equal(another.get(atoms.locationAtom).city, 'Ibadan');
  store.set(atoms.selectBrowsingLocationAtom, {
    source: 'gps',
    coords: { latitude: 0, longitude: 0 },
    timestamp: 2,
  });
  await new Promise((r) => setImmediate(r));
  assert.equal(value, null);
});
test('late storage hydration cannot overwrite a selection made while loading', async () => {
  let resolve;
  const storage = {
    getItem: () =>
      new Promise((r) => {
        resolve = r;
      }),
    setItem: async () => {},
    removeItem: async () => {},
  };
  const atoms = load('lib/atoms/location.ts', {
    jotai,
    '@react-native-async-storage/async-storage': { default: storage },
  });
  const store = jotai.createStore();
  const pending = store.set(atoms.initializeLocationAtom);
  store.set(atoms.selectBrowsingLocationAtom, {
    city: 'Abuja',
    source: 'manual',
    timestamp: 2,
  });
  resolve(JSON.stringify({ city: 'Lagos', source: 'manual', timestamp: 1 }));
  await pending;
  assert.equal(store.get(atoms.locationAtom).city, 'Abuja');
});

test('markdown labels agree for numeric/string API prices and reject missing or invalid original prices', () => {
  const { productDiscount } = load('lib/product-display.ts');
  for (const original of [3500, '3500.00']) {
    const d = productDiscount('2500.00', original);
    assert.equal(d.hasDiscount, true);
    assert.equal(d.label, '29% off');
  }
  for (const original of [null, undefined, '', 0, 'invalid', 2000, 2500])
    assert.equal(productDiscount(2500, original).hasDiscount, false);
  assert.equal(productDiscount(99.9, 100).label, '<1% off');
});
