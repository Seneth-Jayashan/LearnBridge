import express from "express";
import {
  updateUserProfile,
  updateUserPassword,
} from "../controllers/UserController.js"; // your teammate's controller
import { protect, restrictTo  } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

router.get("/profile", protect,restrictTo("donor"), async (req, res) => {
  try {
    res.status(200).json(req.user); // req.user already attached by protect middleware
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/profile", protect, restrictTo("donor"), updateUserProfile);
router.put("/profile/change-password", protect, restrictTo("donor"), updateUserPassword);

export default router;