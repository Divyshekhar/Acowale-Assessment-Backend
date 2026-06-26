import { rateLimitPolicies } from "../constants/rate-limit";
import { createRateLimiter } from "./rate-limit";

export const authLoginRateLimiter = createRateLimiter({
  ...rateLimitPolicies.authLogin,
  keyPrefix: "auth-login",
});

export const feedbackCreateRateLimiter = createRateLimiter({
  ...rateLimitPolicies.feedbackCreate,
  keyPrefix: "feedback-create",
});
