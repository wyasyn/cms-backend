import { Router } from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
} from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth";
import { loginLimiter } from "../middlewares/loginLimiter";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginLimiter, loginUser);
router.get("/me", authenticateToken, getCurrentUser);

export default router;
