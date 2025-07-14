import { Router } from "express";
import { authenticateToken } from "../middlewares/auth";
import {
  getPageContent,
  getAllPages,
  updatePageContent,
} from "../controllers/content.controller";

const router = Router();

// Public - View content by page
router.get("/:page", getPageContent);

// Admin/Editor - Get all content
router.get("/", authenticateToken, getAllPages);

// Admin/Editor - Update/create content by page
router.put("/:page", authenticateToken, updatePageContent);

export default router;
