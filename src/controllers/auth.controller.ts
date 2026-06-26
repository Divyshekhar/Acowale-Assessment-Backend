import type { Request, Response } from "express";
import { HttpStatus } from "../constants/http-status";
import { authService } from "../services/auth.service";
import type { LoginBody } from "../validators/auth.validator";
import { clearAuthCookie, setAuthCookie } from "../utils/cookie";
import { sendSuccess } from "../utils/response";

export const authController = {
  async login(req: Request, res: Response): Promise<void> {
    const body = req.body as LoginBody;
    const result = await authService.login(body);

    setAuthCookie(res, result.token);
    sendSuccess(res, HttpStatus.OK, "Logged in successfully", result.user);
  },

  async logout(_req: Request, res: Response): Promise<void> {
    clearAuthCookie(res);
    sendSuccess(res, HttpStatus.OK, "Logged out successfully", null);
  },

  async me(req: Request, res: Response): Promise<void> {
    const user = await authService.getCurrentUser(req.user?.id ?? "");
    sendSuccess(res, HttpStatus.OK, "Current admin fetched successfully", user);
  },
};
