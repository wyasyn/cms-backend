import { Router, Request, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import Pricing from "../models/Pricing";
import { authenticateToken, AuthRequest } from "../middlewares/auth";
import { handleValidationErrors } from "../middlewares/validation";

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
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Build filter object
      const filter: any = {};

      if (req.query.category) filter.category = req.query.category;
      if (req.query.type) filter.type = req.query.type;
      if (req.query.status) filter.status = req.query.status;
      else filter.status = "active"; // Default to active only
      if (req.query.featured !== undefined)
        filter.isFeatured = req.query.featured === "true";
      if (req.query.popular !== undefined)
        filter.isPopular = req.query.popular === "true";
      if (req.query.currency) filter["price.currency"] = req.query.currency;
      if (req.query.period) filter["price.period"] = req.query.period;

      // Price range filtering
      if (req.query.minPrice || req.query.maxPrice) {
        filter["price.amount"] = {};
        if (req.query.minPrice)
          filter["price.amount"].$gte = parseFloat(
            req.query.minPrice as string
          );
        if (req.query.maxPrice)
          filter["price.amount"].$lte = parseFloat(
            req.query.maxPrice as string
          );
      }

      // Search functionality
      if (req.query.search) {
        const searchRegex = new RegExp(req.query.search as string, "i");
        filter.$or = [
          { name: searchRegex },
          { title: searchRegex },
          { description: searchRegex },
          { shortDescription: searchRegex },
          { category: searchRegex },
          { "features.name": searchRegex },
        ];
      }

      // Get pricing plans with pagination
      const pricingPlans = await Pricing.find(filter)
        .populate("services", "title slug")
        .sort({ isFeatured: -1, isPopular: -1, sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Pricing.countDocuments(filter);

      res.json({
        success: true,
        data: pricingPlans,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      console.error("Error fetching pricing plans:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch pricing plans",
      });
    }
  }
);

// Get pricing plan by slug
router.get(
  "/:slug",
  [param("slug").isString().isLength({ min: 1 })],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const pricingPlan = await Pricing.findOne({
        slug: req.params.slug,
        status: "active",
      }).populate("services", "title slug description");

      if (!pricingPlan) {
        return res.status(404).json({
          success: false,
          message: "Pricing plan not found",
        });
      }

      // Increment view count
      await Pricing.findByIdAndUpdate(
        pricingPlan._id,
        { $inc: { "analytics.views": 1 } },
        { new: false }
      );

      return res.json({
        success: true,
        data: pricingPlan,
      });
    } catch (error) {
      console.error("Error fetching pricing plan:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch pricing plan",
      });
    }
  }
);

// Track pricing plan click
router.post(
  "/:slug/click",
  [param("slug").isString().isLength({ min: 1 })],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const pricingPlan = await Pricing.findOneAndUpdate(
        { slug: req.params.slug, status: "active" },
        { $inc: { "analytics.clicks": 1 } },
        { new: true }
      );

      if (!pricingPlan) {
        return res.status(404).json({
          success: false,
          message: "Pricing plan not found",
        });
      }

      return res.json({
        success: true,
        message: "Click tracked successfully",
      });
    } catch (error) {
      console.error("Error tracking click:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to track click",
      });
    }
  }
);

// Track pricing plan conversion
router.post(
  "/:slug/conversion",
  [param("slug").isString().isLength({ min: 1 })],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const pricingPlan = await Pricing.findOneAndUpdate(
        { slug: req.params.slug, status: "active" },
        { $inc: { "analytics.conversions": 1 } },
        { new: true }
      );

      if (!pricingPlan) {
        return res.status(404).json({
          success: false,
          message: "Pricing plan not found",
        });
      }

      return res.json({
        success: true,
        message: "Conversion tracked successfully",
      });
    } catch (error) {
      console.error("Error tracking conversion:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to track conversion",
      });
    }
  }
);

// Get pricing statistics
router.get("/analytics/stats", async (req, res) => {
  try {
    const stats = await Pricing.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: null,
          totalPlans: { $sum: 1 },
          totalViews: { $sum: "$analytics.views" },
          totalClicks: { $sum: "$analytics.clicks" },
          totalConversions: { $sum: "$analytics.conversions" },
          averagePrice: { $avg: "$price.amount" },
          minPrice: { $min: "$price.amount" },
          maxPrice: { $max: "$price.amount" },
        },
      },
    ]);

    const typeStats = await Pricing.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          averagePrice: { $avg: "$price.amount" },
          totalViews: { $sum: "$analytics.views" },
          totalClicks: { $sum: "$analytics.clicks" },
          totalConversions: { $sum: "$analytics.conversions" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalPlans: 0,
          totalViews: 0,
          totalClicks: 0,
          totalConversions: 0,
          averagePrice: 0,
          minPrice: 0,
          maxPrice: 0,
        },
        byType: typeStats,
      },
    });
  } catch (error) {
    console.error("Error fetching pricing statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pricing statistics",
    });
  }
});

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
  async (req: AuthRequest, res: Response) => {
    try {
      const pricingPlan = new Pricing(req.body);
      await pricingPlan.save();

      return res.status(201).json({
        success: true,
        message: "Pricing plan created successfully",
        data: pricingPlan,
      });
    } catch (error: any) {
      console.error("Error creating pricing plan:", error);

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Pricing plan with this name already exists",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create pricing plan",
        error: error.message,
      });
    }
  }
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
  async (req: AuthRequest, res: Response) => {
    try {
      const pricingPlan = await Pricing.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!pricingPlan) {
        return res.status(404).json({
          success: false,
          message: "Pricing plan not found",
        });
      }

      return res.json({
        success: true,
        message: "Pricing plan updated successfully",
        data: pricingPlan,
      });
    } catch (error: any) {
      console.error("Error updating pricing plan:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update pricing plan",
        error: error.message,
      });
    }
  }
);

// Admin: Delete pricing plan
router.delete(
  "/:id",
  authenticateToken,
  [param("id").isMongoId()],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const pricingPlan = await Pricing.findByIdAndDelete(req.params.id);

      if (!pricingPlan) {
        return res.status(404).json({
          success: false,
          message: "Pricing plan not found",
        });
      }

      return res.json({
        success: true,
        message: "Pricing plan deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting pricing plan:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete pricing plan",
        error: error.message,
      });
    }
  }
);

export default router;
