import assert from "node:assert/strict";
import test from "node:test";

import { errorHandler } from "../src/middleware/error.middleware.js";
import { allowedMimeTypes, createR2Key } from "../src/utils/r2Keys.js";

test("active SVG content is not accepted for public uploads", () => {
  assert.equal(allowedMimeTypes.has("image/svg+xml"), false);
});

test("R2 keys use the allowlisted MIME extension instead of the supplied filename extension", () => {
  const key = createR2Key({
    folder: "projects",
    filename: "payload.html",
    contentType: "image/png"
  });

  assert.match(key, /-payload\.png$/);
  assert.doesNotMatch(key, /\.html$/);
});

test("production 500 responses do not disclose internal errors", () => {
  const previousEnvironment = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  let response;
  const res = {
    status(status) {
      response = { status };
      return this;
    },
    json(body) {
      response.body = body;
      return this;
    }
  };

  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    errorHandler(new Error("mongodb://private-host/internal"), {}, res, () => {});
  } finally {
    console.error = originalConsoleError;
    process.env.NODE_ENV = previousEnvironment;
  }

  assert.equal(response.status, 500);
  assert.equal(response.body.message, "Server error");
  assert.equal(response.body.errors, undefined);
  assert.equal(response.body.stack, undefined);
});