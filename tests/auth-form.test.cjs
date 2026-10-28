const { test } = require('node:test'),
  assert = require('node:assert/strict');
const fs = require('node:fs'),
  vm = require('node:vm'),
  ts = require('typescript');
function load(file) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    { exports },
  );
  return exports;
}
const {
  loginErrors,
  signupErrors,
  normalizePhone,
  verificationEmail,
  emailError,
} = load('lib/auth-form.ts');
test('email validation rejects malformed entries and accepts surrounding whitespace', () => {
  assert.equal(emailError(' ada@example.com '), undefined);
  for (const email of ['', 'ada', 'ada@', 'ada @example.com'])
    assert.ok(emailError(email));
});
test('signup validation keeps password confirmation exact and normalizes Nigerian phone formatting', () => {
  const form = {
    email: 'ada@example.com',
    password: ' secret ',
    confirmPassword: ' secret ',
    phone: '+234 801 234 5678',
  };
  assert.equal(Object.keys(signupErrors(form)).length, 0);
  assert.equal(normalizePhone(form.phone), '+2348012345678');
  assert.ok(
    signupErrors({ ...form, confirmPassword: 'secret' }).confirmPassword,
  );
  assert.ok(signupErrors({ ...form, phone: '1234' }).phone);
  assert.ok(loginErrors(form.email, 'short').password);
});
test('verification routing supports structured API errors without treating every forbidden response as unverified', () => {
  assert.equal(
    verificationEmail(
      {
        statusCode: 403,
        responseData: {
          data: {
            details: { code: 'EMAIL_NOT_VERIFIED', email: 'ada@example.com' },
          },
        },
      },
      'other@example.com',
    ),
    'ada@example.com',
  );
  assert.equal(
    verificationEmail(
      { error: 'Please verify your email' },
      ' ada@example.com ',
    ),
    'ada@example.com',
  );
  assert.equal(
    verificationEmail(
      { statusCode: 403, error: 'Account suspended' },
      'ada@example.com',
    ),
    null,
  );
});
const { initializeApp } = load('lib/startup.ts');
const tick = () => new Promise((resolve) => setImmediate(resolve));
test('startup does not wait for cart storage once authentication is ready', async () => {
  let finishCart,
    ready = 0;
  const cart = new Promise((resolve) => {
    finishCart = resolve;
  });
  initializeApp({
    restoreAuth: async () => {},
    restoreCart: () => cart,
    onReady: () => ready++,
    onError: () => {},
  });
  await tick();
  assert.equal(ready, 1);
  finishCart();
});
test('startup exits on authentication failure and cleanup suppresses late state updates', async () => {
  let ready = 0,
    errors = 0;
  initializeApp({
    restoreAuth: async () => {
      throw new Error('offline');
    },
    restoreCart: async () => {},
    onReady: () => ready++,
    onError: () => errors++,
  });
  await tick();
  assert.equal(ready, 1);
  assert.equal(errors, 1);
  let finishAuth;
  const auth = new Promise((resolve) => {
    finishAuth = resolve;
  });
  const cancel = initializeApp({
    restoreAuth: () => auth,
    restoreCart: async () => {},
    onReady: () => ready++,
    onError: () => {},
  });
  cancel();
  finishAuth();
  await tick();
  assert.equal(ready, 1);
});
