// backend/routes/paymentRoutes.js
import express from "express";
import {
  initiatePayment,
  paymentNotify,
  confirmPayment,
  resetPaymentStatus,
  getMyPaymentHistory,
} from "../controllers/PaymentController.js";
import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

// Donor initiates payment for a need
router.post("/initiate/:needId", protect, restrictTo("donor"), initiatePayment);

// PayHere server callback — must be public (no auth)
router.post("/notify", paymentNotify);

router.post("/confirm", protect, restrictTo("donor"), confirmPayment);
router.get("/my-history", protect, restrictTo("donor"), getMyPaymentHistory); 
router.put("/reset/:needId", protect, resetPaymentStatus);

export default router;