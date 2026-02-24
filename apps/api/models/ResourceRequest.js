import mongoose from "mongoose";

const resourceRequestSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",  // references the schoolAdmin user
      required: true,
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
      ref: "User",  // references the donor user who pledged
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
  },
  { timestamps: true } // gives createdAt and updatedAt automatically
);

const ResourceRequest = mongoose.model("ResourceRequest", resourceRequestSchema);
export default ResourceRequest;