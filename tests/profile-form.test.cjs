const { test } = require('node:test'),
  assert = require('node:assert/strict');
const fs = require('node:fs'),
  vm = require('node:vm'),
  ts = require('typescript');
const output = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/profile-form.ts', 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText,
  { exports: output },
);
const { profileForm, normalizeProfile, profileChanges, profileErrors } = output;
test('untouched optional fields are not sent as invalid empty updates', () => {
  const initial = profileForm({ first_name: 'Ada', username: 'ada' });
  assert.equal(Object.keys(profileChanges(initial, initial)).length, 0);
  const changes = profileChanges(
    { ...initial, first_name: ' Adanna ' },
    initial,
  );
  assert.equal(changes.first_name, 'Adanna');
  assert.equal(Object.keys(changes).length, 1);
});
test('optional fields can be cleared intentionally', () => {
  const initial = profileForm({
    first_name: 'Ada',
    username: 'ada',
    city: 'Lagos',
    phone: '08012345678',
  });
  const changes = profileChanges({ ...initial, city: '', phone: '' }, initial);
  assert.equal(changes.city, '');
  assert.equal(changes.phone, '');
});
test('required identity fields reject whitespace and phone validation agrees with backend', () => {
  const initial = profileForm({ first_name: 'Ada', username: 'ada' });
  assert.equal(Object.keys(profileErrors(initial)).length, 0);
  assert.ok(
    profileErrors({ ...initial, first_name: ' ', username: '\t' }).first_name,
  );
  assert.ok(profileErrors({ ...initial, phone: '12345' }).phone);
  assert.equal(
    profileErrors({ ...initial, phone: '+234 801 234 5678' }).phone,
    undefined,
  );
  assert.equal(
    normalizeProfile({ ...initial, phone: '0801-234-5678' }).phone,
    '08012345678',
  );
});

function profileHooks() {
  let cached = {
    id: '1',
    first_name: 'Ada',
    username: 'ada',
    profile_picture_url: '/old.jpg',
  };
  let auth;
  const events = [];
  const exports = {};
  const mocks = {
    '@tanstack/react-query': {
      useMutation: (options) => options,
      useQuery: (options) => options,
      useQueryClient: () => ({
        async cancelQueries() {
          events.push('cancel');
        },
        getQueryData: () => cached,
        setQueryData(key, value) {
          cached = value;
          events.push('cache');
        },
        invalidateQueries() {
          events.push('invalidate');
        },
      }),
    },
    jotai: {
      useAtom: () => [
        null,
        (value) => {
          auth = value;
        },
      ],
      useAtomValue: () => ({ user: null }),
      useSetAtom: () => () => {},
    },
    '../api': {
      api: {
        tokenManager: {
          getAccessToken: async () => 'fixture',
          getRefreshToken: async () => 'refresh',
        },
      },
    },
    '../atoms/auth': {},
  };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('lib/hooks/use-profile.ts', 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    { exports, require: (name) => mocks[name] },
  );
  return { hooks: exports, cache: () => cached, auth: () => auth, events };
}
test('text saves preserve existing photo and cancel stale requests before refreshing profile', async () => {
  const state = profileHooks();
  await state.hooks
    .useUpdateProfile()
    .onSuccess({ id: '1', first_name: 'Adanna' });
  assert.equal(state.cache().profile_picture_url, '/old.jpg');
  assert.equal(state.auth().user.first_name, 'Adanna');
  assert.deepEqual(state.events, ['cancel', 'cache', 'invalidate']);
});
test('photo saves update the profile even when auth user has not been hydrated', async () => {
  const state = profileHooks();
  await state.hooks.useUploadProfilePicture().onSuccess({ url: '/new.jpg' });
  assert.equal(state.cache().profile_picture_url, '/new.jpg');
  assert.equal(state.auth().user.profile_picture_url, '/new.jpg');
  assert.equal(state.auth().user.id, '1');
});
