import { beforeEach, describe, expect, test } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { HttpStatus } from "../../../src/constants/http-status";
import { createRateLimiter } from "../../../src/middlewares/rate-limit";

type MockResponse = Pick<Response, "setHeader" | "status" | "json"> & {
  headers: Record<string, string>;
  statusCode?: number;
  body?: unknown;
};

const createMockRequest = (ip: string): Request =>
  ({
    ip,
    socket: {
      remoteAddress: ip,
    },
  }) as Request;

const createMockResponse = (): MockResponse => {
  const response: MockResponse = {
    headers: {},
    setHeader(name: string, value: number | string | readonly string[]) {
      response.headers[name] = Array.isArray(value) ? value.join(",") : String(value);
      return asResponse(response);
    },
    status(statusCode: number) {
      response.statusCode = statusCode;
      return asResponse(response);
    },
    json(body: unknown) {
      response.body = body;
      return asResponse(response);
    },
  };

  return response;
};

const asResponse = (response: MockResponse): Response => response as unknown as Response;

describe("createRateLimiter", () => {
  let currentTime = 1_000;

  beforeEach(() => {
    currentTime = 1_000;
  });

  test("allows requests until the configured limit is reached", () => {
    const limiter = createRateLimiter({
      windowMs: 1_000,
      maxRequests: 2,
      message: "Too many requests",
      now: () => currentTime,
    });
    const req = createMockRequest("127.0.0.1");
    const firstRes = createMockResponse();
    const secondRes = createMockResponse();
    let nextCalls = 0;
    const next: NextFunction = () => {
      nextCalls += 1;
    };

    limiter(req, asResponse(firstRes), next);
    limiter(req, asResponse(secondRes), next);

    expect(nextCalls).toBe(2);
    expect(firstRes.headers["RateLimit-Limit"]).toBe("2");
    expect(firstRes.headers["RateLimit-Remaining"]).toBe("1");
    expect(secondRes.headers["RateLimit-Remaining"]).toBe("0");
    expect(secondRes.statusCode).toBeUndefined();
  });

  test("blocks requests over the configured limit", () => {
    const limiter = createRateLimiter({
      windowMs: 1_000,
      maxRequests: 1,
      message: "Too many requests",
      now: () => currentTime,
    });
    const req = createMockRequest("127.0.0.1");
    const allowedRes = createMockResponse();
    const blockedRes = createMockResponse();
    let nextCalls = 0;
    const next: NextFunction = () => {
      nextCalls += 1;
    };

    limiter(req, asResponse(allowedRes), next);
    limiter(req, asResponse(blockedRes), next);

    expect(nextCalls).toBe(1);
    expect(blockedRes.statusCode).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(blockedRes.headers["Retry-After"]).toBe("1");
    expect(blockedRes.body).toEqual({
      success: false,
      message: "Too many requests",
    });
  });

  test("starts a new window after the previous window expires", () => {
    const limiter = createRateLimiter({
      windowMs: 1_000,
      maxRequests: 1,
      message: "Too many requests",
      now: () => currentTime,
    });
    const req = createMockRequest("127.0.0.1");
    let nextCalls = 0;
    const next: NextFunction = () => {
      nextCalls += 1;
    };

    limiter(req, asResponse(createMockResponse()), next);
    currentTime = 2_001;
    const resetRes = createMockResponse();
    limiter(req, asResponse(resetRes), next);

    expect(nextCalls).toBe(2);
    expect(resetRes.headers["RateLimit-Remaining"]).toBe("0");
    expect(resetRes.statusCode).toBeUndefined();
  });

  test("uses independent buckets for different clients", () => {
    const limiter = createRateLimiter({
      windowMs: 1_000,
      maxRequests: 1,
      message: "Too many requests",
      now: () => currentTime,
    });
    let nextCalls = 0;
    const next: NextFunction = () => {
      nextCalls += 1;
    };

    limiter(createMockRequest("127.0.0.1"), asResponse(createMockResponse()), next);
    limiter(createMockRequest("127.0.0.2"), asResponse(createMockResponse()), next);

    expect(nextCalls).toBe(2);
  });
});
