import type { NextFunction, Request, Response } from "express";
import { AUTH_COOKIE_NAME } from "../constants/auth";
import { HttpStatus } from "../constants/http-status";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { ApiError } from "../utils/api-error";
import { verifyAccessToken } from "../utils/jwt";

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME];

    if (typeof token !== "string" || token.length === 0) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists");
    }

    req.user = user;
    next();
  } catch (error) {
    logger.warn({ err: error }, "Authentication failed");
    next(error);
  }
};
