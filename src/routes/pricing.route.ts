import { Router } from "express";
import { body, param, query } from "express-validator";
import { authenticateToken } from "../middlewares/auth";
import { handleValidationErrors } from "../middlewares/validation";
import {
  createPricingPlan,
  deletePricingPlan,
  getPricingPlans,
  getPricingPlansBySlug,
  getPricingStats,
  trackPricingPlanClick,
  trackPricingPlanConversion,
  updatePricingPlan,
} from "../controllers/pricing.controller";

const router = Router();

// Get all pricing plans with filtering and pagination
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("category").optional().isString(),
    query("type")
      .optional()
      .isIn(["basic", "standard", "premium", "enterprise", "custom"]),
    query("status")
      .optional()
      .isIn(["active", "inactive", "draft", "archived"]),
    query("featured").optional().isBoolean(),
    query("popular").optional().isBoolean(),
    query("currency").optional().isIn(["USD", "EUR", "GBP", "UGX"]),
    query("minPrice").optional().isFloat({ min: 0 }),
    query("maxPrice").optional().isFloat({ min: 0 }),
    query("period")
      .optional()
      .isIn(["one-time", "monthly", "yearly", "weekly", "hourly"]),
    query("search").optional().isString(),
  ],
  handleValidationErrors,
  getPricingPlans
);

// Get pricing plan by slug
router.get(
  "/:slug",
  [param("slug").isString().isLength({ min: 1 })],
  handleValidationErrors,
  getPricingPlansBySlug
);

// Track pricing plan click
router.post(
  "/:slug/click",
  [param("slug").isString().isLength({ min: 1 })],
  handleValidationErrors,
  trackPricingPlanClick
);

// Track pricing plan conversion
router.post(
  "/:slug/conversion",
  [param("slug").isString().isLength({ min: 1 })],
  handleValidationErrors,
  trackPricingPlanConversion
);

// Get pricing statistics
router.get("/analytics/stats", getPricingStats);

// Admin: Create pricing plan
router.post(
  "/",
  authenticateToken,
  [
    body("name").notEmpty().trim().isLength({ min: 2, max: 50 }),
    body("title").notEmpty().trim().isLength({ max: 100 }),
    body("description").notEmpty().isLength({ min: 10 }),
    body("price.amount").notEmpty().isFloat({ min: 0 }),
    body("price.currency").optional().isIn(["USD", "EUR", "GBP", "UGX"]),
    body("price.period")
      .optional()
      .isIn(["one-time", "monthly", "yearly", "weekly", "hourly"]),
    body("type")
      .optional()
      .isIn(["basic", "standard", "premium", "enterprise", "custom"]),
    body("features").optional().isArray(),
    body("features.*.name").optional().isString(),
    body("features.*.included").optional().isBoolean(),
    body("status").optional().isIn(["active", "inactive", "draft", "archived"]),
    body("isPopular").optional().isBoolean(),
    body("isFeatured").optional().isBoolean(),
  ],
  handleValidationErrors,
  createPricingPlan
);

// Admin: Update pricing plan
router.put(
  "/:id",
  authenticateToken,
  [
    param("id").isMongoId(),
    body("name").optional().trim().isLength({ min: 2, max: 50 }),
    body("title").optional().trim().isLength({ max: 100 }),
    body("description").optional().isLength({ min: 10 }),
    body("price.amount").optional().isFloat({ min: 0 }),
    body("price.currency").optional().isIn(["USD", "EUR", "GBP", "UGX"]),
    body("price.period")
      .optional()
      .isIn(["one-time", "monthly", "yearly", "weekly", "hourly"]),
    body("type")
      .optional()
      .isIn(["basic", "standard", "premium", "enterprise", "custom"]),
    body("status").optional().isIn(["active", "inactive", "draft", "archived"]),
    body("isPopular").optional().isBoolean(),
    body("isFeatured").optional().isBoolean(),
  ],
  handleValidationErrors,
  updatePricingPlan
);

// Admin: Delete pricing plan
router.delete(
  "/:id",
  authenticateToken,
  [param("id").isMongoId()],
  handleValidationErrors,
  deletePricingPlan
);

export default router;
