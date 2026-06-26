export const FEEDBACK_STATUS_TRANSITIONS = {
  PENDING: ["IN_REVIEW"],
  IN_REVIEW: ["RESOLVED", "REJECTED"],
  RESOLVED: [],
  REJECTED: [],
} as const;

export const FEEDBACK_SORT_FIELDS = ["createdAt", "updatedAt", "category", "status"] as const;
