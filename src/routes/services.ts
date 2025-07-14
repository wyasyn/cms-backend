import { body, param, query } from "express-validator";
import Service from "../models/Service";
import { authenticateToken, AuthRequest } from "../middlewares/auth";
import { Router, Request, Response } from "express";
import { handleValidationErrors } from "../middlewares/validation";

const router = Router();

// Get all services with filtering and pagination
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("category").optional().isString(),
    query("status").optional().isIn(["active", "inactive", "draft"]),
    query("featured").optional().isBoolean(),
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
      if (req.query.status) filter.status = req.query.status;
      else filter.status = "active"; // Default to active only
      if (req.query.featured !== undefined)
        filter.featured = req.query.featured === "true";

      // Search functionality
      if (req.query.search) {
        const searchRegex = new RegExp(req.query.search as string, "i");
        filter.$or = [
          { title: searchRegex },
          { description: searchRegex },
          { shortDescription: searchRegex },
          { tags: { $in: [searchRegex] } },
        ];
      }

      // Get services with pagination
      const services = await Service.find(filter)
        .sort({ featured: -1, sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Service.countDocuments(filter);

      return res.json({
        success: true,
        data: services,
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
      console.error("Error fetching services:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch services",
      });
    }
  }
);

// Get service by slug
router.get(
  "/:slug",
  [param("slug").isString().isLength({ min: 1 })],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const service = await Service.findOne({
        slug: req.params.slug,
        status: "active",
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }

      return res.json({
        success: true,
        data: service,
      });
    } catch (error) {
      console.error("Error fetching service:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch service",
      });
    }
  }
);

// Admin: Create service
router.post(
  "/",
  authenticateToken,
  [
    body("title").notEmpty().trim().isLength({ min: 3, max: 100 }),
    body("description").notEmpty().isLength({ min: 10 }),
    body("shortDescription").optional().isLength({ max: 200 }),
    body("image").optional().isURL(),
    body("gallery").optional().isArray(),
    body("gallery.*").optional().isURL(),
    body("price.amount").optional().isFloat({ min: 0 }),
    body("price.currency").optional().isIn(["USD", "EUR", "GBP", "UGX"]),
    body("price.type").optional().isIn(["fixed", "hourly", "project"]),
    body("status").optional().isIn(["active", "inactive", "draft"]),
    body("featured").optional().isBoolean(),
    body("category").optional().isString(),
    body("tags").optional().isArray(),
    body("features").optional().isArray(),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const service = new Service(req.body);
      await service.save();

      return res.status(201).json({
        success: true,
        message: "Service created successfully",
        data: service,
      });
    } catch (error: any) {
      console.error("Error creating service:", error);

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Service with this slug already exists",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create service",
        error: error.message,
      });
    }
  }
);

// Admin: Update service
router.put(
  "/:id",
  authenticateToken,
  [
    param("id").isMongoId(),
    body("title").optional().trim().isLength({ min: 3, max: 100 }),
    body("description").optional().isLength({ min: 10 }),
    body("shortDescription").optional().isLength({ max: 200 }),
    body("image").optional().isURL(),
    body("status").optional().isIn(["active", "inactive", "draft"]),
    body("featured").optional().isBoolean(),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }

      return res.json({
        success: true,
        message: "Service updated successfully",
        data: service,
      });
    } catch (error: any) {
      console.error("Error updating service:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update service",
        error: error.message,
      });
    }
  }
);

// Admin: Delete service
router.delete(
  "/:id",
  authenticateToken,
  [param("id").isMongoId()],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const service = await Service.findByIdAndDelete(req.params.id);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }

      return res.json({
        success: true,
        message: "Service deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting service:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete service",
        error: error.message,
      });
    }
  }
);

export default router;
