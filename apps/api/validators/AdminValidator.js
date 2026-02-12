import { z } from "zod";

// Reusable Address Schema
const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

// --- Create User Schema ---
export const createUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(9, "Phone number must be at least 9 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "teacher", "donor", "student"]).optional(),
  
  // Grade and Level are optional (mostly for students)
  grade: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Grade ID").optional(),
  level: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Level ID").optional(),
  
  address: addressSchema.optional(),
});

// --- Update User Schema ---
// extend 'createUser' but make everything optional
export const updateUserSchema = createUserSchema.partial().omit({ password: true }); 
// Note: We usually don't allow password updates via the general 'update profile' route

// --- Utility Schemas ---
export const checkPhoneSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
});

export const checkEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
});