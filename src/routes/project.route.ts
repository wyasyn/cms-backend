import { Router } from "express";
import { authenticateToken } from "../middlewares/auth";
import {
  createProject,
  deleteProject,
  getAllProjects,
  getAllProjectsAdmin,
  getProjectById,
  updateProject,
} from "../controllers/project.controller";

const router = Router();

// Get all projects (public - published only)
router.get("/", getAllProjects);

// Get single project (public)
router.get("/:id", getProjectById);

// Get all projects for admin (admin/editor)
router.get("/admin/all", authenticateToken, getAllProjectsAdmin);

// Create project (admin/editor)
router.post("/", authenticateToken, createProject);

// Update project (admin/editor)
router.put("/:id", authenticateToken, updateProject);

// Delete project (admin/editor)
router.delete("/:id", authenticateToken, deleteProject);

export default router;
