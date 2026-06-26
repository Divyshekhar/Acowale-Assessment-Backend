import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export type JwtPayload = {
  sub: string;
};

export const signAccessToken = (userId: string): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign({}, env.JWT_SECRET, {
    ...options,
    subject: userId,
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  const payload = jwt.verify(token, env.JWT_SECRET);

  if (typeof payload === "string" || typeof payload.sub !== "string") {
    throw new jwt.JsonWebTokenError("Invalid token payload");
  }

  return { sub: payload.sub };
};
