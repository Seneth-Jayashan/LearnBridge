import crypto from "crypto";
import ResourceRequest from "../models/ResourceRequest.js";

const PAYHERE_MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID;
const PAYHERE_SECRET = process.env.PAYHERE_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

// ─── GENERATE PAYHERE HASH ────────────────────────────────────────────────────
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

// ─── INITIATE PAYMENT ─────────────────────────────────────────────────────────
// POST /api/payments/initiate/:needId
// Donor only
export const initiatePayment = async (req, res) => {
  try {
    const need = await ResourceRequest.findById(req.params.needId).populate(
      "schoolId",
      "name"
    );

    if (!need) {
      return res.status(404).json({ message: "Need not found" });
    }

    if (need.status !== "Open") {
      return res.status(400).json({
        message: `This need is already ${need.status}`,
      });
    }

    const donor = req.user;
    const orderId = `ORDER_${need._id}_${Date.now()}`;
    const amount = need.amount.toFixed(2);
    const currency = "LKR";

    const hash = generateHash(
      PAYHERE_MERCHANT_ID,
      orderId,
      amount,
      currency,
      PAYHERE_SECRET
    );

    // Save orderId to need so we can verify on callback
    need.paymentOrderId = orderId;
    need.paymentStatus = "Pending";
    await need.save();

    // PayHere payment data — sent to frontend
    const paymentData = {
      sandbox: true, // set false in production
      merchant_id: PAYHERE_MERCHANT_ID,
      return_url: `${FRONTEND_URL}/donor/payment-success`,
      cancel_url: `${FRONTEND_URL}/donor/payment-cancel`,
      notify_url: `${BACKEND_URL}/api/payments/notify`,
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
      custom_1: need._id.toString(), // pass needId for callback
      custom_2: donor._id.toString(), // pass donorId for callback
    };

    res.status(200).json(paymentData);
  } catch (err) {
    console.error("initiatePayment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── PAYHERE NOTIFY CALLBACK ──────────────────────────────────────────────────
// POST /api/payments/notify
// Called by PayHere server after payment
export const paymentNotify = async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payment_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      custom_1: needId,
      custom_2: donorId,
      method,
    } = req.body;

    // Verify hash
    const hashedSecret = crypto
      .createHash("md5")
      .update(PAYHERE_SECRET)
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

    if (!need) {
      return res.status(404).send("Need not found");
    }

    // status_code 2 = Success
    if (status_code === "2") {
      need.status = "Pledged";
      need.donorId = donorId;
      need.pledgedDate = new Date();
      need.paymentStatus = "Completed";
      need.paymentMethod = method;
      await need.save();
      console.log(`Payment success for need ${needId}`);
    }

    // status_code 0 = Pending
    if (status_code === "0") {
      need.paymentStatus = "Pending";
      await need.save();
    }

    // status_code -1 = Cancelled
    if (status_code === "-1") {
      need.paymentStatus = "Cancelled";
      need.paymentOrderId = null;
      await need.save();
    }

    // status_code -2 = Failed
    if (status_code === "-2") {
      need.paymentStatus = "Failed";
      need.paymentOrderId = null;
      await need.save();
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("paymentNotify error:", err);
    res.status(500).send("Server error");
  }
};