import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "Identifier (Email, Phone, or Student ID) is required"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, "Identifier (Email, Phone, or Student ID) is required"),
});

export const resetPasswordSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  otp: z.union([z.string(), z.number()]).refine((val) => val.toString().length === 6, {
    message: "OTP must be 6 digits",
  }),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});