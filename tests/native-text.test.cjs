const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  vm = require('node:vm'),
  ts = require('typescript'),
  React = require('react');
function load(file) {
  const exports = {};
  const mocks = {
    react: { ...React, useState: (v) => [v, () => {}] },
    'react/jsx-runtime': require('react/jsx-runtime'),
    'react-native': {
      View: 'View',
      Pressable: 'Pressable',
      Modal: 'Modal',
      Dimensions: { get: () => ({ width: 390, height: 844 }) },
    },
    'expo-router': { router: { push() {} }, useRouter: () => ({ push() {} }) },
    '@/components/ui/text': { Text: 'Text' },
    '@/components/ui/badge': { Badge: 'View' },
    '@/components/ui/avatar': {
      Avatar: 'View',
      AvatarFallback: 'View',
      AvatarImage: () => null,
    },
    '@/components/ui/icon-symbol': { IconSymbol: () => null },
    '@/components/ui/app-image': { AppImage: () => null },
    '@/constants/theme': { Colors: { light: { tint: '#008236' } } },
    '@/lib/product-display': {
      ratingLabel: (v) => (Number(v) > 0 ? String(v) : 'No reviews yet'),
    },
    '@/lib/utils': {
      getImageSource: () => ({ uri: 'preview' }),
      formatCurrency: (v) => String(v),
      formatDistance: (v) => String(v),
      formatTime12Hour: (v) => v,
      getEffectivePickupDay: () => 'Today',
      calculateDistance: () => 0,
    },
  };
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  vm.runInNewContext(source, {
    exports,
    require: (n) => {
      if (n.startsWith('@/assets/')) return 1;
      assert.ok(n in mocks, 'Missing mock ' + n);
      return mocks[n];
    },
  });
  return exports;
}
function check(node, inText = false) {
  if (node == null || typeof node === 'boolean') return;
  if (Array.isArray(node)) {
    node.forEach((n) => check(n, inText));
    return;
  }
  if (typeof node === 'string' || typeof node === 'number') {
    assert.ok(
      inText || node === '',
      `Bare native text child ${JSON.stringify(node)}`,
    );
    return;
  }
  if (typeof node.type === 'function') {
    check(node.type(node.props), inText);
    return;
  }
  check(node.props?.children, node.type === 'Text' || inText);
}
const files = [
  ['components/product/ProductInfoCard.tsx', 'ProductInfoCard', 'product'],
  ['components/explore/ProductCard.tsx', 'ProductCard', 'item'],
  ['components/product/VendorInfoCard.tsx', 'VendorInfoCard', 'vendor'],
  ['components/vendor/VendorInfoCard.tsx', 'VendorInfoCard', 'vendor'],
];
for (const [file, name, prop] of files)
  test(`${name} (${file}) does not leak zero ratings, distances or discounts into native views`, () => {
    const component = load(file)[name];
    for (const value of [0, '0', null, undefined, '', 4.5]) {
      const item = {
        id: 1,
        name: 'Meal',
        business_name: 'Kitchen',
        price: '100',
        original_price: 0,
        average_rating: value,
        rating: value,
        distance: 0,
        quantity_available: 0,
        order_count: 0,
        description: '',
        vendor: { latitude: 0, longitude: 0 },
        available_for_pickup: true,
      };
      check(component({ [prop]: item }));
    }
  });

test('checkout and order-detail containers do not contain stray literal text nodes', () => {
  for (const file of [
    'app/checkout.tsx',
    'components/orders/pickup-details.tsx',
  ]) {
    const source = ts.createSourceFile(
      file,
      fs.readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    function walk(node) {
      if (
        ts.isJsxElement(node) &&
        ['View', 'Card', 'Pressable'].includes(
          node.openingElement.tagName.getText(source),
        )
      ) {
        for (const child of node.children) {
          assert.ok(
            !(
              ts.isJsxExpression(child) &&
              child.expression &&
              (ts.isStringLiteral(child.expression) ||
                ts.isNumericLiteral(child.expression))
            ),
            file + ': bare text expression inside a native container',
          );
          if (ts.isJsxText(child))
            assert.equal(
              child.text.trim(),
              '',
              file + ': bare text inside a native container',
            );
        }
      }
      ts.forEachChild(node, walk);
    }
    walk(source);
  }
});
