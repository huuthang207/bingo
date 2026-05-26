import assert from "node:assert/strict";
import test from "node:test";
import { rateLimit } from "./rateLimit.js";

function createResponse() {
  return {
    statusCode: 200,
    body: null as unknown,
    headers: new Map<string, string>(),
    setHeader(name: string, value: string) {
      this.headers.set(name, value);
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
}

test("rateLimit returns 429 after the configured request limit", () => {
  const middleware = rateLimit({ keyPrefix: `test-${Date.now()}`, windowMs: 60_000, maxRequests: 2 });
  const request = { ip: "127.0.0.1", socket: {} };
  const firstResponse = createResponse();
  const secondResponse = createResponse();
  const thirdResponse = createResponse();
  let nextCount = 0;
  const next = () => {
    nextCount += 1;
  };

  middleware(request as never, firstResponse as never, next);
  middleware(request as never, secondResponse as never, next);
  middleware(request as never, thirdResponse as never, next);

  assert.equal(nextCount, 2);
  assert.equal(thirdResponse.statusCode, 429);
  assert.deepEqual(thirdResponse.body, { message: "Bạn thao tác quá nhanh. Hãy thử lại sau." });
  assert.ok(thirdResponse.headers.has("Retry-After"));
});
