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
    
    // Arrays for easy population, though querying Users by { school: schoolId } is often better
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    
    // --- NEW: Super Admin Verification ---
    isVerified: { type: Boolean, default: false }, // Super Admin must verify
    
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const School = mongoose.model("School", schoolSchema);
export default School;