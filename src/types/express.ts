import type { User } from "../../generated/prisma/client";

export type AuthenticatedUser = Pick<User, "id" | "name" | "email" | "createdAt" | "updatedAt">;

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthenticatedUser;
  }
}
