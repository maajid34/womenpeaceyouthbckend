import assert from "node:assert/strict";
import test, { after, before } from "node:test";

process.env.FRONTEND_URL = "https://somaliwomenyouthpeace.org";
process.env.NODE_ENV = "test";

const { default: app } = await import("../src/app.js");
let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("liveness endpoint reports a running API process", async () => {
  const response = await fetch(`${baseUrl}/api/health/live`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, service: "swyp-api" });
});

test("readiness endpoint reports a disconnected test database", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).database, "unavailable");
});

test("removed content types are not exposed as working APIs", async () => {
  for (const type of ["events", "gallery"]) {
    const response = await fetch(`${baseUrl}/api/${type}`);
    assert.notEqual(response.status, 200);
  }
});
