const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const axios = require('axios');
function fixture() {
  let now = 100000;
  const exports = {};
  class Clock extends Date {
    static now() {
      return now;
    }
  }
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('lib/api/rate-limit.ts', 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    {
      exports,
      Date: Clock,
      URL,
      require: (name) => {
        assert.equal(name, 'axios');
        return axios;
      },
    },
  );
  let calls = 0,
    limited = true;
  const client = axios.create({
    baseURL: 'https://test.invalid/api/v1',
    adapter: async (config) => {
      calls++;
      if (limited)
        throw new axios.AxiosError(
          'blocked',
          'ERR_BAD_REQUEST',
          config,
          undefined,
          {
            status: 429,
            statusText: 'Too Many Requests',
            headers: { 'retry-after': '2' },
            config,
            data: {
              success: false,
              rateLimit: { scope: 'general', retryAfterSeconds: 2 },
            },
          },
        );
      return {
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        data: { success: true },
      };
    },
  });
  exports.attachRateLimitHandling(client);
  return {
    ...exports,
    client,
    calls: () => calls,
    advance: (ms) => {
      now += ms;
    },
    unblock: () => {
      limited = false;
    },
  };
}
test('Retry-After accepts seconds and dates; invalid values use a safe fallback', () => {
  const f = fixture();
  assert.equal(f.retryAfterSeconds('2'), 2);
  assert.equal(
    f.retryAfterSeconds(
      'Wed, 21 Oct 2015 07:28:00 GMT',
      60,
      Date.parse('Wed, 21 Oct 2015 07:27:30 GMT'),
    ),
    30,
  );
  assert.equal(f.retryAfterSeconds('invalid', 7), 7);
  assert.equal(f.retryAfterSeconds(undefined, undefined), 60);
});
test('429 pauses reads and mutations, does not replay them and recovers without extending cooldown', async () => {
  const f = fixture();
  await assert.rejects(f.client.get('/meals'), (e) => f.isRateLimited(e));
  assert.equal(f.calls(), 1);
  f.advance(100);
  await assert.rejects(
    f.client.post('/customers/orders', {}),
    (e) => e.code === 'ERR_RATE_LIMITED',
  );
  assert.equal(f.calls(), 1);
  f.advance(1900);
  f.unblock();
  await f.client.get('/meals');
  assert.equal(f.calls(), 2);
});
test('a location cooldown does not block unrelated browsing, but shares search and resolve quota', async () => {
  const f = fixture();
  const client = axios.create({
    baseURL: 'https://other.invalid/api/v1',
    adapter: async (config) => {
      if (config.url === '/locations/browsing')
        throw new axios.AxiosError(
          'blocked',
          'ERR_BAD_REQUEST',
          config,
          undefined,
          {
            status: 429,
            statusText: 'blocked',
            config,
            headers: { 'retry-after': '10' },
            data: { rateLimit: { scope: 'location' } },
          },
        );
      return { status: 200, statusText: 'OK', headers: {}, config, data: {} };
    },
  });
  f.attachRateLimitHandling(client);
  await assert.rejects(client.get('/locations/browsing'));
  await client.get('/meals');
  await assert.rejects(
    client.get('/locations/browsing/resolve'),
    (e) => e.code === 'ERR_RATE_LIMITED',
  );
});
test('server-side frontend usage can disable shared client cooldowns', async () => {
  const f = fixture();
  let calls = 0;
  const client = axios.create({
    adapter: async (config) => {
      calls++;
      throw new axios.AxiosError(
        'blocked',
        'ERR_BAD_REQUEST',
        config,
        undefined,
        {
          status: 429,
          statusText: 'blocked',
          headers: { 'retry-after': '60' },
          config,
          data: {},
        },
      );
    },
  });
  f.attachRateLimitHandling(client, () => false);
  await assert.rejects(client.get('/meals'));
  await assert.rejects(client.get('/meals'));
  assert.equal(calls, 2);
});


test('mobile API preserves 429 status and retry delay after normalizing Axios errors', async () => {
  const helper = fixture();
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync('lib/api/client.ts','utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const mocks = {
    axios,
    './rate-limit': helper,
    'expo-secure-store': { getItemAsync: async () => null, setItemAsync: async () => {}, deleteItemAsync: async () => {} },
    '../utils/jwt': { isTokenExpired: () => false, isTokenExpiringSoon: () => false },
    './config': { API_CONFIG: { BASE_URL:'https://mobile.invalid/api/v1', TIMEOUT:1000, ENDPOINTS:{AUTH:{REFRESH:'/auth/refresh'}} } },
  };
  vm.runInNewContext(source, { exports, console: {log(){},error(){}}, require: name => {assert.ok(name in mocks, name);return mocks[name];} });
  const client=exports.default;let calls=0;
  client.defaults.adapter=async config=>{calls++;throw new axios.AxiosError('blocked','ERR_BAD_REQUEST',config,undefined,{status:429,statusText:'blocked',headers:{'retry-after':'2'},config,data:{error:'Please wait',rateLimit:{scope:'general',retryAfterSeconds:2}}});};
  await assert.rejects(client.get('/meals'),error=>error.statusCode===429&&error.retryAfterSeconds===2);
  await assert.rejects(client.post('/customers/orders',{}),error=>error.statusCode===429);
  assert.equal(calls,1);
});
