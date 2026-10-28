const { test } = require('node:test');
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm'),
  ts = require('typescript');
function load(file, mocks = {}) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    {
      exports,
      require: (n) => {
        assert.ok(n in mocks, 'Unexpected dependency ' + n);
        return mocks[n];
      },
    },
  );
  return exports;
}
const display = load('lib/cart-display.ts');
const item = (id = '1', quantity = 2) => ({
  id,
  productId: id,
  vendorId: '4',
  quantity,
  unitPrice: 100,
  totalPrice: 100 * quantity,
  product: { name: 'Rice', quantity_available: 5, available_for_pickup: true },
  fulfillment_method: 'pickup',
});
test('cart stock preserves sold-out zero and distinguishes unknown stock', () => {
  assert.equal(display.stockAvailable({ quantity_available: 0 }), 0);
  assert.equal(display.stockAvailable({ stockCount: 0 }), 0);
  assert.equal(display.stockAvailable({}), null);
  assert.match(
    display.cartIssue({ ...item(), product: { quantity_available: 0 } }),
    /Sold out/,
  );
  assert.match(display.cartIssue({ ...item(), quantity: 6 }), /Only 5/);
  assert.equal(display.cartIssue(item()), null);
  assert.match(
    display.cartIssue({
      ...item(),
      product: { expiry_date: '2020-01-01T00:00:00Z' },
    }),
    /expired/,
  );
  assert.match(
    display.cartIssue({ ...item(), fulfillment_method: 'delivery' }),
    /pickup/,
  );
});
test('cart display uses stored prices and groups stable vendor identities', () => {
  const [result] = display.displayItems({
    items: [
      {
        id: 9,
        product_id: 1,
        quantity: 2,
        price_snapshot: 90,
        product: { price: '100', vendor_id: 4 },
      },
    ],
  });
  assert.equal(result.unitPrice, 90);
  assert.equal(result.totalPrice, 180);
  assert.equal(result.vendorId, '4');
  const groups = display.groupCart([
    item('1'),
    item('2'),
    { ...item('3'), vendorId: '5' },
  ]);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].items.length, 2);
});
function fixture() {
  const { syncGuestCart } = load('lib/cart-sync.ts');
  const storageValues = new Map(),
    cart = new Map(),
    calls = [],
    merged = [];
  let failProduct = null,
    timeout = false,
    active = true;
  const storage = {
    getItem: async (k) => storageValues.get(k) || null,
    setItem: async (k, v) => storageValues.set(k, v),
  };
  const api = {
    getCart: async () => ({
      items: [...cart].map(([product_id, quantity]) => ({
        product_id,
        quantity,
        fulfillment_method: 'pickup',
      })),
    }),
    addToCart: async (data) => {
      calls.push([
        'add',
        data.product_id,
        data.quantity,
        data.fulfillment_method,
      ]);
      if (data.product_id === failProduct) throw new Error('Sold out');
      cart.set(
        data.product_id,
        (cart.get(data.product_id) || 0) + data.quantity,
      );
      if (timeout) {
        timeout = false;
        throw new Error('Connection lost after server applied request');
      }
      return api.getCart();
    },
    updateCart: async (data) => {
      calls.push(['update', data.product_id, data.quantity]);
      if (data.product_id === failProduct) throw new Error('Sold out');
      cart.set(data.product_id, data.quantity);
      return api.getCart();
    },
  };
  const options = {
    userId: '7',
    items: [item()],
    api,
    storage,
    isActive: () => active,
    onMerged: async (id, qty) => {
      merged.push([id, qty]);
    },
  };
  return {
    syncGuestCart,
    options,
    cart,
    calls,
    merged,
    storageValues,
    fail: (id) => (failProduct = id),
    timeout: () => (timeout = true),
    deactivate: () => (active = false),
  };
}
test('guest import combines quantities once and preserves pickup', async () => {
  const f = fixture();
  f.cart.set(1, 3);
  await f.syncGuestCart(f.options);
  assert.equal(f.cart.get(1), 5);
  assert.deepEqual(f.calls, [['update', 1, 5]]);
  assert.deepEqual(f.merged, [['1', 2]]);
});
test('a retry after an ambiguous add response does not add the guest quantity twice', async () => {
  const f = fixture();
  f.timeout();
  await assert.rejects(f.syncGuestCart(f.options), /Connection lost/);
  assert.equal(f.cart.get(1), 2);
  assert.equal(f.merged.length, 0);
  await f.syncGuestCart(f.options);
  assert.equal(f.cart.get(1), 2);
  assert.equal(f.calls.length, 1);
  assert.equal(f.merged.length, 1);
});
test('simultaneous import calls share one job', async () => {
  const f = fixture();
  const first = f.syncGuestCart(f.options),
    second = f.syncGuestCart(f.options);
  assert.equal(first, second);
  await Promise.all([first, second]);
  assert.equal(f.calls.length, 1);
});
test('partially completed imports retain only unresolved guest items for retry', async () => {
  const f = fixture();
  f.options.items = [item('1'), item('2')];
  f.fail(2);
  await assert.rejects(f.syncGuestCart(f.options), /Sold out/);
  assert.deepEqual(f.merged, [['1', 2]]);
  f.fail(null);
  await f.syncGuestCart({ ...f.options, items: [item('2')] });
  assert.equal(f.cart.get(1), 2);
  assert.equal(f.cart.get(2), 2);
  assert.equal(f.calls.filter((c) => c[1] === 1).length, 1);
});
test('completed server import resumes local cleanup after a storage failure', async () => {
  const f = fixture();
  f.options.onMerged = async () => {
    throw new Error('Local storage unavailable');
  };
  await assert.rejects(f.syncGuestCart(f.options), /Local storage/);
  await f.syncGuestCart({
    ...f.options,
    onMerged: async (id) => f.merged.push(id),
  });
  assert.equal(f.cart.get(1), 2);
  assert.equal(f.calls.length, 1);
  assert.deepEqual(f.merged, ['1']);
});
test('import does not remove saved items or send requests after sign-out', async () => {
  const f = fixture();
  f.deactivate();
  await f.syncGuestCart(f.options);
  assert.equal(f.calls.length, 0);
  assert.equal(f.merged.length, 0);
});
test('the cart hook exposes server fees and does not mask a failed account cart with guest data', () => {
  const auth = { isAuthenticated: true },
    guest = [item()],
    sync = { pending: false, error: '' };
  let response = {
    data: {
      items: [
        {
          id: 1,
          product_id: 1,
          quantity: 2,
          price_snapshot: 100,
          product: { price: '150', vendor_id: 4 },
        },
      ],
      subtotal: '200.00',
      service_fee: '4.25',
      delivery_fee: '0.00',
      tax: '1.00',
    },
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: () => {},
  };
  const hooks = load('lib/hooks/use-hybrid-cart.ts', {
    '@/components/ui/toast': { toast: { error() {} } },
    '@tanstack/react-query': {
      useQuery: () => response,
      useQueryClient: () => ({}),
      useIsMutating: () => 0,
    },
    jotai: {
      useAtomValue: () => auth,
      useAtom: (key) =>
        key === 'local' ? [guest, () => {}] : [sync, () => {}],
    },
    react: { useMemo: (f) => f() },
    '../api': { api: { cart: { getCart() {} } } },
    '../atoms/auth': { authAtom: 'auth' },
    '../atoms/cart': { persistCartAtom: 'local', cartSyncAtom: 'sync' },
    '../cart-display': display,
  });
  const cart = hooks.useHybridCart();
  assert.equal(cart.serviceFee, 4.25);
  assert.equal(cart.tax, 1);
  assert.equal(cart.subtotal, 200);
  assert.equal(cart.cart[0].unitPrice, 100);
  response = { ...response, data: undefined, isError: true };
  const failed = hooks.useHybridCart();
  assert.equal(failed.isError, true);
  assert.equal(failed.cart.length, 0);
});
test('rapid guest updates compose immediately and storage writes stay in order', async () => {
  const { createStore, atom } = require('jotai/vanilla');
  const writes = [];
  const module = load('lib/atoms/cart.ts', {
    jotai: { atom },
    '@react-native-async-storage/async-storage': {
      default: {
        setItem: async (_, value) => {
          await new Promise((r) => setImmediate(r));
          writes.push(JSON.parse(value));
        },
        getItem: async () => null,
      },
    },
  });
  const store = createStore();
  const first = store.set(module.persistCartAtom, (prev) => [
    ...prev,
    item('1', 1),
  ]);
  const second = store.set(module.persistCartAtom, (prev) =>
    prev.map((i) => ({ ...i, quantity: i.quantity + 1 })),
  );
  assert.equal(store.get(module.cartAtom)[0].quantity, 2);
  await Promise.all([first, second]);
  assert.equal(writes[0][0].quantity, 1);
  assert.equal(writes[1][0].quantity, 2);
});

test('pickup address does not repeat the selected city', () => {
  assert.equal(
    display.pickupAddress({
      address: '12 Bodija Road, Ibadan',
      city: 'Ibadan',
    }),
    '12 Bodija Road, Ibadan',
  );
  assert.equal(
    display.pickupAddress({ address: '12 Bodija Road', city: 'Ibadan' }),
    '12 Bodija Road, Ibadan',
  );
});
test('late guest cart hydration cannot overwrite an item added during startup', async () => {
  const { atom, createStore } = require('jotai/vanilla');
  let resolve;
  const module = load('lib/atoms/cart.ts', {
    jotai: { atom },
    '@react-native-async-storage/async-storage': {
      default: {
        getItem: () => new Promise((r) => (resolve = r)),
        setItem: async () => {},
      },
    },
  });
  const store = createStore();
  const init = store.set(module.initCartAtom);
  await store.set(module.persistCartAtom, [item('new')]);
  resolve(JSON.stringify([item('old')]));
  await init;
  assert.equal(store.get(module.cartAtom)[0].id, 'new');
  assert.equal(store.get(module.cartReadyAtom), true);
});
