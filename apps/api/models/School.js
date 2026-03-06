import mongoose from "mongoose";

const schoolSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
    },
    contactEmail: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    logoUrl: { type: String, trim: true },
    
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    
    isVerified: { type: Boolean, default: false },
    
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const School = mongoose.model("School", schoolSchema);
export default School;