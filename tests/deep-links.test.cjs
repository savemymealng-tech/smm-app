const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript");
const exportsForTest = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("lib/deep-links.ts", "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText,
  { exports: exportsForTest, URL, URLSearchParams },
);
const { resolveAppLink: resolve } = exportsForTest;
test("normalizes native, universal and plural legacy routes", () => {
  for (const url of [
    "savemymeal://product/12",
    "https://savemymeal.com/products/12",
    "/app/product/12",
  ])
    assert.equal(resolve(url), "/product/12");
  assert.equal(
    resolve("https://savemymeal.com/ref/AMAKA"),
    "/signup?referral_code=AMAKA",
  );
  assert.equal(
    resolve("savemymeal://payment/callback?trxref=abc"),
    "/payment/callback?trxref=abc",
  );
  assert.equal(resolve("/orders/group-123"), "/order/group-123");
});
test("preserves encoded authentication and referral parameters exactly once", () => {
  assert.equal(
    resolve(
      "/app/redirect?path=/verify-otp&params=" +
        encodeURIComponent("code=123456&email=person%2Btest%40example.com"),
    ),
    "/verify-otp?code=123456&email=person%2Btest%40example.com",
  );
  assert.equal(
    resolve(
      "/app/redirect?path=/verify-otp&params=code%3D123456&email=a%40b.com",
    ),
    "/verify-otp?code=123456&email=a%40b.com",
  );
  assert.equal(
    resolve("/app/reset-password?token=a%2Bb%3D"),
    "/reset-password?token=a%2Bb%3D",
  );
});
test("rejects foreign, malformed and arbitrary destinations without crashing", () => {
  for (const url of [
    "https://evil.com/product/1",
    "javascript:alert(1)",
    "//evil.com",
    "/app/redirect?path=https://evil.com",
    "/app/redirect?path=//evil.com",
    "/products/new",
    "/admin",
    "%",
    "/app/redirect?path=/app/redirect",
  ])
    assert.equal(resolve(url), null, url);
  assert.equal(
    resolve("/signup?referral_code=AMAKA&returnTo=https://evil.com"),
    "/signup?referral_code=AMAKA",
  );
});
test("frontend and mobile share the same URL contract", () =>
  assert.equal(
    fs.readFileSync("lib/deep-links.ts", "utf8"),
    fs.readFileSync("../frontend/app/lib/deep-links.ts", "utf8"),
  ));

test("published association identifies the supplied signing team and Play certificate", async () => {
  const mobile = JSON.parse(fs.readFileSync("app.json", "utf8")).expo;
  assert.equal(mobile.scheme, "savemymeal");
  const publicAndroid = JSON.parse(
    fs.readFileSync("../frontend/public/.well-known/assetlinks.json", "utf8"),
  );
  assert.equal(publicAndroid[0].target.package_name, mobile.android.package);
  assert.ok(
    publicAndroid[0].target.sha256_cert_fingerprints.includes(
      "23:75:44:70:8E:F3:4F:10:B4:32:D3:B4:5F:CC:71:20:6A:0B:16:66:92:84:28:47:34:F7:4F:86:5B:7A:53:50",
    ),
  );
  const output = {};
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync(
        "../frontend/app/routes/app/apple-association.ts",
        "utf8",
      ),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
        },
      },
    ).outputText,
    { exports: output, Response },
  );
  const response = output.loader();
  assert.match(response.headers.get("content-type"), /application\/json/);
  const apple = await response.json();
  assert.equal(
    apple.applinks.details[0].appID,
    "4K7T4ZHR24." + mobile.ios.bundleIdentifier,
  );
  assert.ok(apple.applinks.details[0].paths.includes("NOT /products/edit/*"));
});
