import type { CookieOptions, Response } from "express";
import { AUTH_COOKIE_NAME } from "../constants/auth";
import { env } from "../config/env";

const accessTokenCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  sameSite: "lax",
  secure: env.NODE_ENV === "production",
  path: "/",
});

export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...accessTokenCookieOptions(),
    maxAge: parseJwtMaxAge(env.JWT_EXPIRES_IN),
  });
};

export const clearAuthCookie = (res: Response): void => {
  res.clearCookie(AUTH_COOKIE_NAME, accessTokenCookieOptions());
};

const parseJwtMaxAge = (expiresIn: string): number | undefined => {
  const match = /^(\d+)([smhd])$/.exec(expiresIn);

  if (!match) {
    return undefined;
  }

  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  } as const;

  return value * multipliers[unit as keyof typeof multipliers];
};
