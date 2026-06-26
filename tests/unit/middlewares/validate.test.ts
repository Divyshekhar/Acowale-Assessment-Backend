import { describe, expect, test } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { validate } from "../../../src/middlewares/validate";

describe("validate", () => {
  test("replaces readonly query values with parsed values", () => {
    const req = {} as Request;
    const res = {} as Response;
    let nextCalls = 0;
    const next: NextFunction = () => {
      nextCalls += 1;
    };

    Object.defineProperty(req, "query", {
      value: {
        page: "2",
        limit: "10",
      },
      configurable: true,
      enumerable: true,
      writable: false,
    });

    validate({
      query: z.object({
        page: z.coerce.number(),
        limit: z.coerce.number(),
      }),
    })(req, res, next);

    expect(req.query).toEqual({
      page: 2,
      limit: 10,
    });
    expect(nextCalls).toBe(1);
  });
});
