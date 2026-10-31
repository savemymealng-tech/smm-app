const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function harness(actions) {
  let cursor = 0;
  const slots = [],
    api = {};
  const react = {
    useRef: (value) => {
      const n = cursor++;
      return (slots[n] ||= { current: value });
    },
    useState: (value) => {
      const n = cursor++;
      if (!(n in slots)) slots[n] = value;
      return [
        slots[n],
        (value) => {
          slots[n] = value;
        },
      ];
    },
    useCallback: (callback) => callback,
  };
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync('lib/hooks/use-detail-refresh.ts', 'utf8'),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
        },
      },
    ).outputText,
    { exports: api, require: () => react, Promise },
  );
  const render = (jobs = actions) => {
    cursor = 0;
    return api.useDetailRefresh(jobs);
  };
  return { render, state: render() };
}
test('detail refresh waits for all resources and prevents duplicate refresh requests', async () => {
  let complete,
    calls = 0;
  const h = harness([
    () => {
      calls++;
      return new Promise((resolve) => (complete = resolve));
    },
    async () => {
      calls++;
    },
  ]);
  const work = h.state.refresh();
  await Promise.resolve();
  assert.equal(h.render().refreshing, true);
  await h.state.refresh();
  assert.equal(calls, 2);
  complete();
  await work;
  assert.equal(h.render().refreshing, false);
  assert.equal(h.render().refreshError, '');
});
test('a failed resource keeps successful refreshes and allows retry', async () => {
  let successful = 0;
  const h = harness([
    async () => {
      throw Error('offline');
    },
    async () => {
      successful++;
    },
  ]);
  await h.state.refresh();
  assert.equal(successful, 1);
  assert.equal(h.render().refreshing, false);
  assert.match(h.render().refreshError, /could not refresh/);
  const latest = h.render([
    async () => {
      successful++;
    },
  ]);
  await latest.refresh();
  assert.equal(successful, 2);
  assert.equal(h.render().refreshError, '');
});
