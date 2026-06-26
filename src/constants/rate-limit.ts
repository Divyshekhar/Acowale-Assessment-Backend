export const rateLimitPolicies = {
  authLogin: {
    windowMs: 15 * 60 * 1_000,
    maxRequests: 5,
    message: "Too many login attempts. Please try again later.",
  },
  feedbackCreate: {
    windowMs: 60 * 1_000,
    maxRequests: 10,
    message: "Too many feedback submissions. Please try again later.",
  },
} as const;
