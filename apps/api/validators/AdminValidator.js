import { z } from "zod";

const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

// ==========================================
// --- USER VALIDATION ---
// ==========================================

export const createUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(9, "Phone number must be at least 9 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["super_admin","school_admin", "teacher", "donor", "student"]).optional(),
  
  grade: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Grade ID").optional(),
  
  address: addressSchema.optional(),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true }); 

// ==========================================
// --- SCHOOL VALIDATION ---
// ==========================================

export const createSchoolWithAdminSchema = z.object({
  schoolData: z.object({
    name: z.string().min(1, "School name is required"),
    contactEmail: z.string().email("Invalid school email").optional().or(z.literal("")),
    contactPhone: z.string().optional(),
    address: addressSchema.optional(),
  }),
  adminData: z.object({
    firstName: z.string().min(1, "Admin first name is required"),
    lastName: z.string().min(1, "Admin last name is required"),
    email: z.string().email("Invalid admin email"),
    phoneNumber: z.string().min(9, "Admin phone must be at least 9 digits"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
});

export const updateSchoolSchema = z.object({
  name: z.string().min(1, "School name cannot be empty").optional(),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  logoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  address: addressSchema.optional(),
});

// ==========================================
// --- UTILITY SCHEMAS ---
// ==========================================

export const checkPhoneSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
});

export const checkEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
});