import type { ErrorRequestHandler } from "express";
import jwt from "jsonwebtoken";
import { Prisma } from "../../generated/prisma/client";
import { ZodError } from "zod";
import { env } from "../config/env";
import { HttpStatus } from "../constants/http-status";
import { logger } from "../lib/logger";
import { ApiError } from "../utils/api-error";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next): void => {
  const normalized = normalizeError(error);

  logger.error({ err: error }, normalized.message);

  res.status(normalized.statusCode).json({
    success: false,
    message: normalized.message,
    errors: normalized.errors,
    ...(env.NODE_ENV === "production" ? {} : { stack: error instanceof Error ? error.stack : undefined }),
  });
};

const normalizeError = (error: unknown): { statusCode: number; message: string; errors?: unknown } => {
  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      errors: error.errors,
    };
  }

  if (error instanceof ZodError) {
    return {
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: "Validation failed",
      errors: error.issues,
    };
  }

  if (error instanceof jwt.JsonWebTokenError) {
    return {
      statusCode: HttpStatus.UNAUTHORIZED,
      message: "Invalid authentication token",
    };
  }

  if (error instanceof jwt.TokenExpiredError) {
    return {
      statusCode: HttpStatus.UNAUTHORIZED,
      message: "Authentication token expired",
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return {
        statusCode: HttpStatus.CONFLICT,
        message: "Duplicate record",
        errors: error.meta,
      };
    }

    if (error.code === "P2025") {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: "Resource not found",
      };
    }
  }

  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    message: "Internal server error",
  };
};
