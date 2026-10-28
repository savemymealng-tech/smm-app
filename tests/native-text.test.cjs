const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  vm = require('node:vm'),
  ts = require('typescript'),
  React = require('react');
const productDisplay = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/product-display.ts', 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText,
  { exports: productDisplay },
);
const vendorDisplay = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/vendor-display.ts', 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText,
  { exports: vendorDisplay },
);
function load(file, browsingLocation = null) {
  const exports = {};
  const mocks = {
    jotai: { useAtomValue: () => browsingLocation },
    '@/lib/atoms/location': { locationAtom: {} },
    react: { ...React, useState: (v) => [v, () => {}] },
    'react/jsx-runtime': require('react/jsx-runtime'),
    'lucide-react-native': {
      Star: () => null,
      MapPin: () => null,
      ChevronRight: () => null,
      BadgeCheck: () => null,
      ShoppingBag: () => null,
      Sparkles: () => null,
    },
    '@/lib/vendor-display': vendorDisplay,
    '@/components/ui/screen-kit': { palette: { green: '#008236' } },
    '@/lib/order-display': { formatMoney: (v) => String(v) },
    'react-native': {
      StyleSheet: { create: (s) => s },
      View: 'View',
      Text: 'Text',
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
    '@/lib/product-display': productDisplay,
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
  ['components/product/ProductCard.tsx', 'ProductCard', 'item'],
  ['components/product/VendorInfoCard.tsx', 'VendorInfoCard', 'vendor'],
  ['components/vendor/VendorInfoCard.tsx', 'VendorInfoCard', 'vendor'],
  ['components/vendor/VendorCard.tsx', 'VendorCard', 'item'],
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

function textContent(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join('');
  if (typeof node.type === 'function')
    return textContent(node.type(node.props));
  return textContent(node.props?.children);
}
test('product cards use the shared browsing location when a list does not supply coordinates', () => {
  const component = load('components/product/ProductCard.tsx', {
    coords: { latitude: 0, longitude: 0 },
  }).ProductCard;
  const item = {
    id: 1,
    name: 'Meal',
    price: '80',
    original_price: '100',
    quantity_available: 5,
    vendor: { latitude: '0', longitude: '0' },
  };
  const node = component({ item });
  const image = node.props.children[0];
  assert.match(textContent(image), /0 away/);
  assert.match(textContent(image), /20% off/);
  assert.doesNotMatch(textContent(node.props.children[1]), /away/);
  assert.doesNotMatch(
    textContent(
      component({ item, userLocation: { latitude: 1, longitude: 1 } }),
    ),
    /\b0 away/,
  );
});
test('product cards hide unknown distance and preserve API kilometres as a fallback', () => {
  const component = load('components/product/ProductCard.tsx').ProductCard;
  const item = {
    id: 1,
    name: 'Meal',
    price: '100',
    quantity_available: 5,
    vendor: { latitude: '', longitude: null },
  };
  assert.doesNotMatch(textContent(component({ item })), /away|NaN/);
  assert.match(
    textContent(component({ item: { ...item, distance: '1.5' } })),
    /1500 away/,
  );
});
