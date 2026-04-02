import { z } from "zod";

const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

export const createStudentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phoneNumber: z.string().min(9, "Phone number must be at least 9 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  
  grade: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Grade ID").optional(),
  
  address: addressSchema.optional(),
});

export const updateSchoolStudentSchema = createStudentSchema.partial().omit({ password: true });

export const updateSchoolProfileSchema = z.object({
  contactEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  contactPhone: z.string().min(9, "Phone number must be at least 9 digits").optional().or(z.literal("")),
  logoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  address: addressSchema.optional(),
});