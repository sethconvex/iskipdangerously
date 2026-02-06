import { RateLimiter, MINUTE } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // fal.ai: 2 requests per minute to stay well within limits
  falAi: { kind: "fixed window", rate: 2, period: MINUTE },
  // Per-user generation: 5 per minute
  falAiPerUser: { kind: "token bucket", rate: 5, period: MINUTE, capacity: 5 },
});
