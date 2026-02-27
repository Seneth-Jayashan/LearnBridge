import { z } from "zod";

const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

export const createDonorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(9, "Phone number must be at least 9 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  address: addressSchema.optional(),
});

export const registerTeacherSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(9, "Phone number must be at least 9 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  schoolId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid School ID").optional().or(z.literal("")),
});

export const updateUserProfileSchema = z.object({
  firstName: z.string().min(1, "First name cannot be empty").optional(),
  lastName: z.string().min(1, "Last name cannot be empty").optional(),
  email: z.string().email("Invalid email address").optional(),
  phoneNumber: z.string().min(9, "Phone number must be at least 9 digits").optional(),
  address: addressSchema.optional(),
});

export const updateUserPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const restoreUserSchema = z.object({
  identifier: z.string().min(1, "Identifier (Email, Phone, or RegNumber) is required"),
});