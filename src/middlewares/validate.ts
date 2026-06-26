import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";

type ValidationSchemas = {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
};

export const validate =
  (schemas: ValidationSchemas) => (req: Request, _res: Response, next: NextFunction): void => {
    if (schemas.body) {
      setRequestValue(req, "body", schemas.body.parse(req.body));
    }

    if (schemas.params) {
      setRequestValue(req, "params", schemas.params.parse(req.params));
    }

    if (schemas.query) {
      setRequestValue(req, "query", schemas.query.parse(req.query));
    }

    next();
  };

const setRequestValue = (req: Request, key: "body" | "params" | "query", value: unknown): void => {
  Object.defineProperty(req, key, {
    value,
    configurable: true,
    enumerable: true,
    writable: true,
  });
};
