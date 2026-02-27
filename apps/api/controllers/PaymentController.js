// backend/controllers/paymentController.js
import crypto from "crypto";
import ResourceRequest from "../models/ResourceRequest.js";
import Payment from "../models/Payment.js";

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
    const MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID;
    const MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET;
    const FRONTEND_URL = process.env.FRONTEND_URL;
    const BACKEND_URL = process.env.BACKEND_URL;

    if (!MERCHANT_ID || !MERCHANT_SECRET) {
      return res.status(500).json({ message: "Payment configuration missing." });
    }

    const need = await ResourceRequest.findById(req.params.needId)
    .populate( "schoolId", "firstName lastName email" )
    .populate({ path: "schoolObjectId", model: "School", select: "name" });

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

    const hash = generateHash(MERCHANT_ID, orderId, amount, currency, MERCHANT_SECRET);

    // ── Create pending Payment record ──────────────────────
    await Payment.create({
      donorId: donor._id,
      needId: need._id,
      orderId,
      itemName: need.itemName,
      quantity: need.quantity,
      amount: need.amount,
      currency,
      status: "Pending",
      donorSnapshot: {
        firstName: donor.firstName || "",
        lastName: donor.lastName || "",
        email: donor.email || "",
        phone: donor.phoneNumber || "",
        address: donor.address?.street || "",
        city: donor.address?.city || "",
      },
      schoolSnapshot: {
        firstName: need.schoolObjectId?.name || "",
        email: need.schoolId?.email || "",
      },
    });

    // Update need
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

// ─── CONFIRM PAYMENT FROM FRONTEND ────────────────────────────
    export const confirmPayment = async (req, res) => {
      try {
        const { orderId, needId } = req.body;

        const need = await ResourceRequest.findById(needId);
        if (!need) {
          return res.status(404).json({ message: "Need not found" });
        }

        if (need.paymentOrderId !== orderId) {
          return res.status(400).json({ message: "Order ID mismatch" });
        }

        // ── Webhook already handled it ─────────────────────────
        if (need.status === "Fulfilled") {
          return res.status(200).json({ message: "Already fulfilled by webhook", need });
        }

        // ── Check Payment record ───────────────────────────────
        const payment = await Payment.findOne({ orderId });

        if (!payment) {
          return res.status(404).json({ message: "Payment record not found" });
        }

        // ── Webhook confirmed → just return success ────────────
        if (payment.status === "Completed") {
          return res.status(200).json({ message: "Confirmed by webhook", need });
        }

        // ── Webhook not yet fired → handle as backup ───────────
        console.log("Webhook not received yet — using frontend as backup");

        need.status = "Fulfilled";
        need.donorId = req.user._id;
        need.pledgedDate = new Date();
        need.fulfilledDate = new Date();
        need.paymentStatus = "Completed";
        need.paymentMethod = "PayHere";
        await need.save();

        await Payment.findOneAndUpdate(
          { orderId },
          {
            status: "Completed",
            paidAt: new Date(),
          }
        );

        res.status(200).json({ message: "Payment confirmed, need fulfilled!", need });
      } catch (err) {
        console.error("confirmPayment error:", err.message);
        res.status(500).json({ message: "Server error" });
      }
    };

// ─── PAYHERE NOTIFY CALLBACK ──────────────────────────────────
export const paymentNotify = async (req, res) => {
  try {
    const MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET;

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
      payment_id,
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
      need.status = "Fulfilled";        
      need.donorId = donorId;
      need.pledgedDate = new Date();
      need.fulfilledDate = new Date();  
      need.paymentStatus = "Completed";
      need.paymentMethod = method;
      await need.save();

      // ── Update Payment record ────────────────────────────
      await Payment.findOneAndUpdate(
        { orderId: order_id },
        {
          status: "Completed",
          paymentId: payment_id,
          paymentMethod: method,
          paidAt: new Date(),
        }
      );
    } else if (status_code === "0") {
      need.paymentStatus = "Pending";
      await need.save();
      await Payment.findOneAndUpdate({ orderId: order_id }, { status: "Pending" });
    } else if (status_code === "-1") {
      need.paymentStatus = "Cancelled";
      need.paymentOrderId = null;
      await need.save();
      await Payment.findOneAndUpdate({ orderId: order_id }, { status: "Cancelled" });
    } else if (status_code === "-2") {
      need.paymentStatus = "Failed";
      need.paymentOrderId = null;
      await need.save();
      await Payment.findOneAndUpdate({ orderId: order_id }, { status: "Failed" });
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("paymentNotify error:", err.message);
    res.status(500).send("Server error");
  }
};

// ─── GET MY PAYMENT HISTORY — Donor ───────────────────────────
// GET /api/v1/payments/my-history
export const getMyPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ donorId: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (err) {
    console.error("getMyPaymentHistory error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── RESET PAYMENT STATUS (testing) ──────────────────────────
export const resetPaymentStatus = async (req, res) => {
  try {
    const need = await ResourceRequest.findById(req.params.needId);
    if (!need) return res.status(404).json({ message: "Need not found" });

    need.paymentOrderId = null;
    need.paymentStatus = null;
    await need.save();

    // also delete pending payment record
    await Payment.deleteOne({
      needId: req.params.needId,
      status: "Pending",
    });

    res.status(200).json({ message: "Reset successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};