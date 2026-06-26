import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/authenticate";
import { authLoginRateLimiter } from "../middlewares/rate-limiters";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/async-handler";
import { loginBodySchema } from "../validators/auth.validator";

export const authRouter = Router();

authRouter.post(
  "/login",
  authLoginRateLimiter,
  validate({ body: loginBodySchema }),
  asyncHandler(authController.login),
);
authRouter.post("/logout", authenticate, asyncHandler(authController.logout));
authRouter.get("/me", authenticate, asyncHandler(authController.me));
