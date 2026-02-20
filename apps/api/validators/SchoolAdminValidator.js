import { z } from "zod";

// Reusable Address Schema
const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

// --- Create Student Schema ---
// Used by School Admins to manually create students in their school
export const createStudentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(9, "Phone number must be at least 9 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  
  // Grade and Level IDs (Mongo ObjectIDs)
  grade: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Grade ID").optional(),
  level: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Level ID").optional(),
  
  address: addressSchema.optional(),
});