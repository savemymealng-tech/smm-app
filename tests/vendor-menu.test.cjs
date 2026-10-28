const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const output = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("lib/vendor-menu.ts", "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText,
  { exports: output },
);
const ids = (items) => Array.from(items, (item) => item.id);
test("all products stay unique while secondary categories remain selectable", () => {
  const first = {
    id: 1,
    categories: [
      { id: 10, name: "Meals" },
      { id: 20, name: "Bakery" },
      { id: 20, name: "Bakery" },
    ],
  };
  const menu = output.buildVendorMenu([
    first,
    { id: 2, categories: [{ id: 20, name: "Bakery" }] },
    first,
  ]);
  assert.deepEqual(ids(menu.products), [1, 2]);
  assert.deepEqual(ids(menu.productsByCategory.get("category:20")), [1, 2]);
  assert.equal(menu.categories.find((c) => c.key === "category:20").count, 2);
});
test("uncategorized products have a working Other filter distinct from a named Other category", () => {
  const menu = output.buildVendorMenu([
    { id: 1, categories: [] },
    { id: 2 },
    { id: 3, categories: [{ id: 10, name: "Other" }] },
  ]);
  assert.deepEqual(ids(menu.productsByCategory.get("uncategorized")), [1, 2]);
  assert.deepEqual(ids(menu.productsByCategory.get("category:10")), [3]);
  assert.equal(menu.categories.at(-1).key, "uncategorized");
});
test("category identity uses IDs so equal display names do not merge unrelated categories", () => {
  const menu = output.buildVendorMenu([
    { id: 1, categories: [{ id: 10, name: "Meals" }] },
    { id: 2, categories: [{ id: 20, name: "Meals" }] },
  ]);
  assert.equal(menu.categories.length, 2);
  assert.deepEqual(ids(menu.productsByCategory.get("category:10")), [1]);
});
test("unloaded and empty menus return a safe empty collection", () => {
  assert.equal(output.buildVendorMenu(undefined).categories.length, 0);
  assert.equal(output.buildVendorMenu([]).products.length, 0);
});

function vendorApiWithPages(responses) {
  const calls = [];
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync("lib/api/vendors.ts", "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    {
      exports,
      require(name) {
        if (name === "./client")
          return {
            default: {
              async get(url, options) {
                calls.push(options);
                const response = responses.shift();
                if (response instanceof Error) throw response;
                return { data: response };
              },
            },
          };
        if (name === "./config")
          return {
            API_CONFIG: {
              ENDPOINTS: {
                VENDORS: { PRODUCTS: (id) => `/vendors/${id}/products` },
              },
            },
          };
        throw new Error(`Unexpected import: ${name}`);
      },
    },
  );
  return { api: exports.vendorsApi, calls };
}
test("vendor menu loads subsequent product pages, deduplicates IDs and forwards cancellation", async () => {
  const { api, calls } = vendorApiWithPages([
    { success: true, data: [{ id: 1 }], totalPages: 2 },
    { success: true, data: [{ id: 1 }, { id: 2 }], totalPages: 2 },
  ]);
  const signal = new AbortController().signal;
  assert.deepEqual(ids(await api.getVendorProducts(3, signal)), [1, 2]);
  assert.deepEqual(
    calls.map((call) => call.params.page),
    [1, 2],
  );
  assert.ok(calls.every((call) => call.signal === signal));
});
test("a failed later page is reported instead of presenting a partial menu", async () => {
  const { api } = vendorApiWithPages([
    { success: true, data: [{ id: 1 }], totalPages: 2 },
    new Error("Connection lost"),
  ]);
  await assert.rejects(api.getVendorProducts(3), /Connection lost/);
});
