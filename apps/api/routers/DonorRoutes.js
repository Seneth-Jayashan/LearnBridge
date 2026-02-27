import express from "express";
import {
  updateUserProfile,
  updateUserPassword,
} from "../controllers/UserController.js"; // your teammate's controller
import {
  getAllNeeds,
  pledgeDonation,
  getMyDonations,
  markFulfilled,
  getOverviewStats,
  getImpactReport,
} from "../controllers/DonationController.js";
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

router.get("/my", protect, restrictTo("donor"), getMyDonations);
router.get("/overview", protect,restrictTo("donor"), getOverviewStats);
router.get("/impact", protect,restrictTo("donor"), getImpactReport);
router.get("/", protect,restrictTo("donor"), getAllNeeds);
router.put("/:id/pledge", protect, restrictTo("donor"), pledgeDonation);
router.put("/:id/complete", protect, restrictTo("donor"), markFulfilled);

export default router;