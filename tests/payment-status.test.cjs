const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript");
const output = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("lib/payment-status.ts", "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText,
  { exports: output },
);
test("payment callbacks understand actual server result shapes and keep pending/refunded payments distinct", () => {
  const status = output.paymentVerificationStatus;
  assert.equal(
    status({ success: true, payment: { status: "success" } }),
    "success",
  );
  assert.equal(status({ pending: true, status: "ongoing" }), "pending");
  assert.equal(status({ failed: true, status: "reversed" }), "failed");
  assert.equal(status({ payment: { status: "refunded" } }), "refunded");
  assert.equal(status("success"), null);
  assert.equal(status(null), null);
});
