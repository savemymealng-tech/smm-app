const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const memory = new Map();
const storage = {
  getItem: async (key) => memory.get(key) || null,
  setItem: async (key, value) => memory.set(key, value),
};
const api = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/location-search.ts', 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText,
  {
    exports: api,
    require: () => ({ __esModule: true, default: storage }),
    Date,
    Math,
    Promise,
    Number,
    JSON,
  },
);
const plain = (x) => JSON.parse(JSON.stringify(x));
test('Google history contains only user query, ID and permitted coordinate cache', () => {
  const now = Date.now();
  const result = api.cleanRecent(
    [
      {
        id: 'place123',
        place_id: 'place123',
        name: 'Google address',
        address: 'Google formatted address',
        city: 'Google city',
        source: 'google',
        searchText: 'Lekki',
        usedAt: now,
        latitude: 6.4,
        longitude: 3.5,
        resolved_at: now,
      },
    ],
    now,
  );
  assert.equal(result[0].name, 'Lekki');
  assert.equal(result[0].address, undefined);
  assert.equal(result[0].city, undefined);
  assert.equal(result[0].latitude, 6.4);
});
test('expired Google coordinates are removed without extending their lifetime on reuse', () => {
  const now = Date.now();
  const item = {
    id: 'place123',
    place_id: 'place123',
    source: 'google',
    searchText: 'Lekki',
    latitude: 6,
    longitude: 3,
    resolved_at: now - api.GOOGLE_COORD_TTL,
    usedAt: now,
  };
  const result = api.cleanRecent([item], now)[0];
  assert.equal(result.latitude, undefined);
  assert.equal(result.resolved_at, undefined);
  assert.equal(result.place_id, 'place123');
});
test('recent history is capped at 10 and searched locally', () => {
  const items = Array.from({ length: 15 }, (_, id) => ({
    id: String(id),
    source: 'smm_city',
    name: 'Lagos',
    searchText: 'Lagos',
  }));
  assert.equal(api.cleanRecent(items).length, 10);
  assert.equal(api.filterRecent(items, 'LAG').length, 10);
  assert.equal(api.filterRecent(items, 'Abuja').length, 0);
});
test('history is isolated per account and supports clear history', async () => {
  await api.saveRecentAreas(
    [
      {
        id: 'city:Lagos',
        source: 'smm_city',
        searchText: 'Lagos',
        name: 'Lagos',
      },
    ],
    'user:1',
  );
  assert.equal((await api.loadRecentAreas('user:1')).length, 1);
  assert.equal((await api.loadRecentAreas('user:2')).length, 0);
  await api.saveRecentAreas([], 'user:1');
  assert.deepEqual(plain(await api.loadRecentAreas('user:1')), []);
});
test('installation identifier is stable and search sessions use valid UUIDs', async () => {
  const [one, two] = await Promise.all([
    api.locationDeviceId(),
    api.locationDeviceId(),
  ]);
  assert.equal(one, two);
  assert.match(api.newSearchSession(), /^[a-f0-9-]{36}$/);
});

test('partial resolve responses retain Google identity and numeric coordinates for recent history', () => {
  const now = Date.now();
  const area = {
    id: 'place123',
    place_id: 'place123',
    name: 'Lekki, Lagos',
    source: 'google',
  };
  const resolved = api.resolvedSearchArea(
    area,
    { latitude: '6.45', longitude: '3.47', resolved_at: now + 60000 },
    now,
  );
  const recent = api.cleanRecent(
    [{ ...resolved, searchText: 'Lekki', usedAt: now }],
    now,
  );
  assert.equal(recent.length, 1);
  assert.equal(recent[0].id, 'place123');
  assert.equal(recent[0].place_id, 'place123');
  assert.equal(recent[0].source, 'google');
  assert.equal(recent[0].latitude, 6.45);
  assert.equal(recent[0].longitude, 3.47);
  assert.equal(recent[0].resolved_at, now);
  assert.throws(
    () => api.resolvedSearchArea(area, { latitude: null, longitude: 3.4 }),
    /valid coordinates/,
  );
});
test('a slow history read cannot overwrite a newly selected place or its coordinates', async () => {
  const scope = 'history-race';
  await api.saveRecentAreas([], scope);
  const originalGet = storage.getItem;
  let release;
  storage.getItem = (key) => {
    storage.getItem = originalGet;
    const value = memory.get(key) || null;
    return new Promise((resolve) => (release = () => resolve(value)));
  };
  const loading = api.loadRecentAreas(scope);
  while (!release) await Promise.resolve();
  const now = Date.now();
  const saving = api.rememberRecentArea(
    {
      id: 'place123',
      place_id: 'place123',
      name: 'Lekki',
      source: 'google',
      searchText: 'Lekki',
      latitude: 6.45,
      longitude: 3.47,
      resolved_at: now,
      usedAt: now,
    },
    scope,
  );
  release();
  await loading;
  assert.equal((await saving).saved, true);
  const restored = await api.loadRecentAreas(scope);
  assert.equal(restored[0].latitude, 6.45);
  assert.equal(restored[0].longitude, 3.47);
  assert.equal(restored[0].place_id, 'place123');
});
test('rapid saved selections merge against persisted history, and clearing wins over preceding writes', async () => {
  const scope = 'history-merge';
  await api.saveRecentAreas([], scope);
  await Promise.all([
    api.rememberRecentArea(
      {
        id: 'city:Lagos',
        source: 'smm_city',
        name: 'Lagos',
        searchText: 'Lagos',
        usedAt: Date.now(),
      },
      scope,
    ),
    api.rememberRecentArea(
      {
        id: 'city:Abuja',
        source: 'smm_city',
        name: 'Abuja',
        searchText: 'Abuja',
        usedAt: Date.now(),
      },
      scope,
    ),
  ]);
  assert.deepEqual(
    plain((await api.loadRecentAreas(scope)).map((item) => item.id)),
    ['city:Abuja', 'city:Lagos'],
  );
  const write = api.rememberRecentArea(
    {
      id: 'city:Ibadan',
      source: 'smm_city',
      name: 'Ibadan',
      searchText: 'Ibadan',
      usedAt: Date.now(),
    },
    scope,
  );
  const clear = api.saveRecentAreas([], scope);
  await Promise.all([write, clear]);
  assert.equal((await api.loadRecentAreas(scope)).length, 0);
});

test('corrupt old history is replaced when a new location is selected', async () => {
  memory.set('smm_recent_areas_v1:corrupt', '{invalid json');
  const result = await api.rememberRecentArea(
    {
      id: 'city:Lagos',
      name: 'Lagos',
      source: 'smm_city',
      searchText: 'Lagos',
      usedAt: Date.now(),
    },
    'corrupt',
  );
  assert.equal(result.saved, true);
  assert.equal((await api.loadRecentAreas('corrupt'))[0].id, 'city:Lagos');
});
