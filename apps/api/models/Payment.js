// backend/models/Payment.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    needId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResourceRequest",
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    itemName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "LKR",
    },
    paymentMethod: {
      type: String,
      default: "PayHere",
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Cancelled"],
      default: "Pending",
    },
    // Donor details snapshot at time of payment
    donorSnapshot: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      address: String,
      city: String,
    },
    // School details snapshot
    schoolSnapshot: {
      firstName: String,
      lastName: String,
      email: String,
    },
    // PayHere details
    paymentId: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;