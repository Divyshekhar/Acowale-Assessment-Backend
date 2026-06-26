import bcrypt from "bcrypt";
import { HttpStatus } from "../constants/http-status";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { signAccessToken } from "../utils/jwt";
import type { AuthenticatedUser } from "../types/express";

type LoginInput = {
  email: string;
  password: string;
};

type LoginResult = {
  token: string;
  user: AuthenticatedUser;
};

export const authService = {
  async login(input: LoginInput): Promise<LoginResult> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }

    const passwordMatches = await bcrypt.compare(input.password, user.password);

    if (!passwordMatches) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }

    const token = signAccessToken(user.id);

    return {
      token,
      user: sanitizeUser(user),
    };
  },

  async getCurrentUser(userId: string): Promise<AuthenticatedUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, "Admin user not found");
    }

    return user;
  },
};

const sanitizeUser = (user: {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}): AuthenticatedUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
