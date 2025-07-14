import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import {
  authenticateToken,
  requireRole,
  AuthRequest,
} from "../middlewares/auth";

const router = Router();

// Get all users (admin only)
router.get(
  "/",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      const users = await User.find({}, "-password").sort({ createdAt: -1 });
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Create new user (admin only)
router.post(
  "/",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { username, email, password, role } = req.body;

      const existingUser = await User.findOne({
        $or: [{ username }, { email }],
      });

      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User({
        username,
        email,
        password: hashedPassword,
        role: role || "editor",
      });

      await user.save();

      const { password: _, ...userWithoutPassword } = user.toObject();
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// Update user (admin only)
router.put(
  "/:id",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { username, email, role, isActive, profile } = req.body;

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { username, email, role, isActive, profile },
        { new: true, runValidators: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json(user);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// Delete user (admin only)
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json({ message: "User deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
