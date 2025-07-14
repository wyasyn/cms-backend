import { Router, Request, Response, NextFunction } from "express";
import { body, param, query } from "express-validator";
import Skill from "../models/Skill";
import { authenticateToken, AuthRequest } from "../middlewares/auth";
import { handleValidationErrors } from "../middlewares/validation";

const router = Router();

// Get all skills with filtering and pagination
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("category").optional().isString(),
    query("level")
      .optional()
      .isIn(["beginner", "intermediate", "advanced", "expert"]),
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
      const filter: any = { status: "active" };

      if (req.query.category) filter.category = req.query.category;
      if (req.query.level) filter.level = req.query.level;
      if (req.query.featured !== undefined)
        filter.featured = req.query.featured === "true";

      // Search functionality
      if (req.query.search) {
        const searchRegex = new RegExp(req.query.search as string, "i");
        filter.$or = [
          { name: searchRegex },
          { description: searchRegex },
          { category: searchRegex },
        ];
      }

      // Get skills with pagination
      const skills = await Skill.find(filter)
        .sort({ featured: -1, sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Skill.countDocuments(filter);

      res.json({
        success: true,
        data: skills,
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
      console.error("Error fetching skills:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch skills",
      });
    }
  }
);

// Get skill by slug
router.get(
  "/:slug",
  [param("slug").isString().isLength({ min: 1 })],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const skill = await Skill.findOne({
        slug: req.params.slug,
        status: "active",
      });

      if (!skill) {
        return res.status(404).json({
          success: false,
          message: "Skill not found",
        });
      }

      return res.json({
        success: true,
        data: skill,
      });
    } catch (error) {
      console.error("Error fetching skill:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch skill",
      });
    }
  }
);

// Admin: Create skill
router.post(
  "/",
  authenticateToken,
  [
    body("name").notEmpty().trim().isLength({ min: 2, max: 50 }),
    body("level")
      .optional()
      .isIn(["beginner", "intermediate", "advanced", "expert"]),
    body("category").optional().isString(),
    body("description").optional().isString(),
    body("image").optional().isURL(),
    body("yearsOfExperience").optional().isInt({ min: 0, max: 50 }),
    body("proficiencyPercentage").optional().isInt({ min: 0, max: 100 }),
    body("featured").optional().isBoolean(),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const skill = new Skill(req.body);
      await skill.save();

      return res.status(201).json({
        success: true,
        message: "Skill created successfully",
        data: skill,
      });
    } catch (error: any) {
      console.error("Error creating skill:", error);

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Skill with this name already exists",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create skill",
        error: error.message,
      });
    }
  }
);

// Admin: Update skill
router.put(
  "/:id",
  authenticateToken,
  [
    param("id").isMongoId(),
    body("name").optional().trim().isLength({ min: 2, max: 50 }),
    body("level")
      .optional()
      .isIn(["beginner", "intermediate", "advanced", "expert"]),
    body("category").optional().isString(),
    body("description").optional().isString(),
    body("image").optional().isURL(),
    body("yearsOfExperience").optional().isInt({ min: 0, max: 50 }),
    body("proficiencyPercentage").optional().isInt({ min: 0, max: 100 }),
    body("featured").optional().isBoolean(),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!skill) {
        return res.status(404).json({
          success: false,
          message: "Skill not found",
        });
      }

      return res.json({
        success: true,
        message: "Skill updated successfully",
        data: skill,
      });
    } catch (error: any) {
      console.error("Error updating skill:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update skill",
        error: error.message,
      });
    }
  }
);

// Admin: Delete skill
router.delete(
  "/:id",
  authenticateToken,
  [param("id").isMongoId()],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const skill = await Skill.findByIdAndDelete(req.params.id);

      if (!skill) {
        return res.status(404).json({
          success: false,
          message: "Skill not found",
        });
      }

      return res.json({
        success: true,
        message: "Skill deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting skill:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete skill",
        error: error.message,
      });
    }
  }
);

export default router;
