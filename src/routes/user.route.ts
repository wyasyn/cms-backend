import { Router } from "express";

import { authenticateToken, requireRole } from "../middlewares/auth";
import {
  createUser,
  deleteUser,
  getAllUsers,
  updateUser,
} from "../controllers/user.controller";

const router = Router();

// Get all users (admin only)
router.get("/", authenticateToken, requireRole(["admin"]), getAllUsers);

// Create new user (admin only)
router.post("/", authenticateToken, requireRole(["admin"]), createUser);

// Update user (admin only)
router.put("/:id", authenticateToken, requireRole(["admin"]), updateUser);

// Delete user (admin only)
router.delete("/:id", authenticateToken, requireRole(["admin"]), deleteUser);

export default router;
