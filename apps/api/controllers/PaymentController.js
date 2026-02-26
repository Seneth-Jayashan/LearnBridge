// backend/controllers/paymentController.js
import crypto from "crypto";
import ResourceRequest from "../models/ResourceRequest.js";

// ── Generate Hash ──────────────────────────────────────────────
const generateHash = (merchantId, orderId, amount, currency, secret) => {
  const hashedSecret = crypto
    .createHash("md5")
    .update(secret)
    .digest("hex")
    .toUpperCase();

  const hashStr = `${merchantId}${orderId}${amount}${currency}${hashedSecret}`;

  return crypto
    .createHash("md5")
    .update(hashStr)
    .digest("hex")
    .toUpperCase();
};

// ─── INITIATE PAYMENT ─────────────────────────────────────────
export const initiatePayment = async (req, res) => {
  try {
    // ← read directly inside function every time
    const MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID;
    const MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET;
    const FRONTEND_URL = process.env.FRONTEND_URL;
    const BACKEND_URL = process.env.BACKEND_URL;


    if (!MERCHANT_ID || !MERCHANT_SECRET) {
      return res.status(500).json({
        message: "Payment configuration missing. Check .env file.",
      });
    }

    const need = await ResourceRequest.findById(req.params.needId).populate(
      "schoolId", "firstName lastName email"
    );
    if (!need) {
      return res.status(404).json({ message: "Need not found" });
    }

    if (need.status !== "Open" && need.paymentStatus !== "Pending") {
      return res.status(400).json({
        message: `This need is already ${need.status}`,
      });
    }

    if (!need.amount || need.amount <= 0) {
      return res.status(400).json({ message: "This need has no amount set." });
    }

    const donor = req.user;
    const orderId = `ORDER_${need._id}_${Date.now()}`;
    const amount = parseFloat(need.amount).toFixed(2);
    const currency = process.env.PAYHERE_CURRENCY || "LKR";

    const hash = generateHash(
      MERCHANT_ID,
      orderId,
      amount,
      currency,
      MERCHANT_SECRET
    );

    need.paymentOrderId = orderId;
    need.paymentStatus = "Pending";
    await need.save();

    const paymentData = {
      sandbox: true,
      merchant_id: MERCHANT_ID,
      return_url: process.env.PAYHERE_RETURN_URL || `${FRONTEND_URL}/donor/payment-success`,
      cancel_url: process.env.PAYHERE_CANCEL_URL || `${FRONTEND_URL}/donor/payment-cancel`,
      notify_url: process.env.PAYHERE_NOTIFY_URL || `${BACKEND_URL}/api/v1/payments/notify`,
      order_id: orderId,
      items: need.itemName,
      amount,
      currency,
      hash,
      first_name: donor.firstName || "Donor",
      last_name: donor.lastName || "",
      email: donor.email,
      phone: donor.phoneNumber || "0771234567",
      address: donor.address?.street || "No 1, Main Street",
      city: donor.address?.city || "Colombo",
      country: "Sri Lanka",
      custom_1: need._id.toString(),
      custom_2: donor._id.toString(),
    };

    res.status(200).json(paymentData);
  } catch (err) {
    console.error("initiatePayment error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── PAYHERE NOTIFY ───────────────────────────────────────────
export const paymentNotify = async (req, res) => {
  try {
    const MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET; // ← read here too

    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      custom_1: needId,
      custom_2: donorId,
      method,
    } = req.body;

    const hashedSecret = crypto
      .createHash("md5")
      .update(MERCHANT_SECRET)
      .digest("hex")
      .toUpperCase();

    const localSig = crypto
      .createHash("md5")
      .update(
        `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${hashedSecret}`
      )
      .digest("hex")
      .toUpperCase();

    if (localSig !== md5sig) {
      console.error("PayHere hash mismatch");
      return res.status(400).send("Hash mismatch");
    }

    const need = await ResourceRequest.findById(needId);
    if (!need) return res.status(404).send("Need not found");

    if (status_code === "2") {
      need.status = "Pledged";
      need.donorId = donorId;
      need.pledgedDate = new Date();
      need.paymentStatus = "Completed";
      need.paymentMethod = method;
      await need.save();
    } else if (status_code === "0") {
      need.paymentStatus = "Pending";
      await need.save();
    } else if (status_code === "-1") {
      need.paymentStatus = "Cancelled";
      need.paymentOrderId = null;
      await need.save();
    } else if (status_code === "-2") {
      need.paymentStatus = "Failed";
      need.paymentOrderId = null;
      await need.save();
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("paymentNotify error:", err.message);
    res.status(500).send("Server error");
  }
};

// ─── RESET PAYMENT STATUS (testing only) ─────────────────────
export const resetPaymentStatus = async (req, res) => {
  try {
    const need = await ResourceRequest.findById(req.params.needId);
    if (!need) return res.status(404).json({ message: "Need not found" });

    need.paymentOrderId = null;
    need.paymentStatus = null;
    await need.save();

    res.status(200).json({ message: "Reset successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};