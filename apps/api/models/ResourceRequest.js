// backend/models/ResourceRequest.js
import mongoose from "mongoose";

const resourceRequestSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    schoolObjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",      
      default: null,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    urgency: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Open", "Pledged", "Fulfilled"],
      default: "Open",
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    pledgedDate: {
      type: Date,
      default: null,
    },
    fulfilledDate: {
      type: Date,
      default: null,
    },
    // PayHere payment fields
    paymentOrderId: {
      type: String,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Cancelled"],
      default: null,
    },
    paymentMethod: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const ResourceRequest = mongoose.model("ResourceRequest", resourceRequestSchema);
export default ResourceRequest;