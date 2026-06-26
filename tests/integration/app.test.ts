import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { EventEmitter } from "node:events";
import httpMocks from "node-mocks-http";
import type { Body, RequestMethod } from "node-mocks-http";
import type { Request, Response } from "express";

jest.mock("../../src/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    feedback: {
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      groupBy: jest.fn(),
      update: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

jest.mock("../../src/lib/logger", () => ({
  logger: (() => {
    const testLogger = {
      child: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };

    testLogger.child.mockReturnValue(testLogger);

    return testLogger;
  })(),
}));

jest.mock("../../src/middlewares/request-logger", () => ({
  requestLogger: (_request: unknown, _response: unknown, next: () => void) => {
    next();
  },
}));

import { createApp } from "../../src/app";
import { authLoginRateLimiter, feedbackCreateRateLimiter } from "../../src/middlewares/rate-limiters";

const app = createApp({ enableRequestLogger: false });

type MockResponse = Response & {
  _getStatusCode: () => number;
  _getHeaders: () => Record<string, string | number | string[]>;
  _getData: () => string;
};

type JsonResponse<T = unknown> = {
  status: number;
  headers: Record<string, string | number | string[]>;
  body: T;
};

beforeEach(() => {
  authLoginRateLimiter.reset();
  feedbackCreateRateLimiter.reset();
});

describe("app endpoints", () => {
  test("GET /health returns service status", async () => {
    const response = await requestJson<{ status: string; timestamp: string }>({
      method: "GET",
      url: "/health",
    });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("UP");
    expect(new Date(response.body.timestamp).toString()).not.toBe("Invalid Date");
  });

  test("unknown routes return the standard 404 envelope", async () => {
    const response = await requestJson<{ success: boolean; message: string }>({
      method: "GET",
      url: "/missing-route",
    });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Route GET /missing-route not found");
  });

  test("GET /api/v1/auth/me requires authentication", async () => {
    const response = await requestJson<{ success: boolean; message: string }>({
      method: "GET",
      url: "/api/v1/auth/me",
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Authentication required");
  });

  test("GET /api/v1/feedback requires authentication", async () => {
    const response = await requestJson<{ success: boolean; message: string }>({
      method: "GET",
      url: "/api/v1/feedback",
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Authentication required");
  });

  test("GET /api/v1/analytics requires authentication", async () => {
    const response = await requestJson<{ success: boolean; message: string }>({
      method: "GET",
      url: "/api/v1/analytics",
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Authentication required");
  });

  test("POST /api/v1/feedback rejects missing required category and comment", async () => {
    const response = await requestJson<{ success: boolean; message: string; errors: unknown[] }>({
      method: "POST",
      url: "/api/v1/feedback",
      body: {},
    });

    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
    expect(JSON.stringify(response.body.errors)).toContain("category");
    expect(JSON.stringify(response.body.errors)).toContain("comment");
  });

  test("POST /api/v1/feedback rejects invalid categories before creation", async () => {
    const response = await requestJson<{ success: boolean; message: string; errors: unknown[] }>({
      method: "POST",
      url: "/api/v1/feedback",
      body: {
        category: "INVALID",
        comment: "The category should be validated.",
      },
    });

    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
    expect(JSON.stringify(response.body.errors)).toContain("category");
    expect(JSON.stringify(response.body.errors)).toContain("PRODUCT");
  });

  test("POST /api/v1/auth/login is rate limited", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await requestJson({
        method: "POST",
        url: "/api/v1/auth/login",
        body: {},
      });

      expect(response.status).toBe(422);
    }

    const blocked = await requestJson<{ success: boolean; message: string }>({
      method: "POST",
      url: "/api/v1/auth/login",
      body: {},
    });

    expect(blocked.status).toBe(429);
    expect(blocked.headers["retry-after"]).toBeTruthy();
    expect(blocked.body).toEqual({
      success: false,
      message: "Too many login attempts. Please try again later.",
    });
  });
});

const requestJson = async <T = unknown>(options: {
  method: RequestMethod;
  url: string;
  body?: Body;
  headers?: Record<string, string>;
}): Promise<JsonResponse<T>> => {
  const req = httpMocks.createRequest({
    method: options.method,
    url: options.url,
    headers: {
      ...(options.body === undefined ? {} : { "content-type": "application/json" }),
      ...options.headers,
    },
    body: options.body,
  }) as Request;

  const res = httpMocks.createResponse({
    eventEmitter: EventEmitter,
  }) as MockResponse;

  await new Promise<void>((resolve, reject) => {
    res.on("end", resolve);
    res.on("error", reject);
    const expressApp = app as unknown as { handle: (request: Request, response: Response) => void };
    expressApp.handle(req, res);
  });

  return {
    status: res._getStatusCode(),
    headers: normalizeHeaders(res._getHeaders()),
    body: JSON.parse(res._getData()) as T,
  };
};

const normalizeHeaders = (
  headers: Record<string, string | number | string[]>,
): Record<string, string | number | string[]> =>
  Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
