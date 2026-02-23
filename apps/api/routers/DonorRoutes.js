import express from "express";
import {
  updateUserProfile,
  updateUserPassword,
} from "../controllers/UserController.js"; // your teammate's controller
import { protect, donorOnly } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

router.get("/profile", protect, donorOnly, async (req, res) => {
  try {
    res.status(200).json(req.user); // req.user already attached by protect middleware
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/profile", protect, donorOnly, updateUserProfile);
router.put("/profile/change-password", protect, donorOnly, updateUserPassword);

export default router;