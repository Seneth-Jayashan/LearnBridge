import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phoneNumber: { type: String, required: true }, 
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["super_admin", "school_admin", "teacher", "donor", "student"],
      default: "student",
    },
    school: { type: mongoose.Schema.Types.ObjectId, ref: "School", default: null },
    isSchoolVerified: { type: Boolean, default: true },
    regNumber: { type: String, unique: true, sparse: true, trim: true },
    grade: { type: mongoose.Schema.Types.ObjectId, ref: "Grade" },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
    },
    otp: { type: Number },
    otpExpires: { type: Date },
    otpAttempts: { type: Number, default: 0 },
    lastLogin: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
    refreshToken: [
      {
        token: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    
    requiresPasswordChange: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const SALT_WORK_FACTOR = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  if (!this.isNew) {
    this.requiresPasswordChange = false;
  }

  const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.pre("save", async function () {
  if (this.role === "student" && !this.regNumber) {
    const lastStudent = await this.constructor
      .findOne({ role: "student" })
      .sort({ regNumber: -1 });

    const lastRegNumber = lastStudent && lastStudent.regNumber
      ? parseInt(lastStudent.regNumber.slice(3))
      : 0;

    this.regNumber = `STU${String(lastRegNumber + 1).padStart(6, "0")}`;
  }
});


userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updatePassword = async function (newPassword) {
  this.password = newPassword;
  await this.save(); 
  return true;
};

userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000);
  this.otp = otp;
  this.otpExpires = Date.now() + 10 * 60 * 1000;
  this.otpAttempts = 0;
  return otp;
};

userSchema.methods.verifyOTP = function (otp) {
  if (this.otpAttempts >= 5) {
    this.isLocked = true;
    return { success: false, message: "Account locked due to too many failed OTP attempts." };
  }
  if (Date.now() > this.otpExpires) {
    return { success: false, message: "OTP has expired." };
  }
  if (parseInt(otp) === this.otp) {
    this.otp = null;
    this.otpExpires = null;
    this.otpAttempts = 0;
    return { success: true, message: "OTP verified successfully." };
  } else {
    this.otpAttempts += 1;
    return { success: false, message: "Invalid OTP." };
  }
};

const User = mongoose.model("User", userSchema);
export default User;