import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // limit to 10 login attempts per 15 minutes
  message: "Too many login attempts. Please try again later.",
});
