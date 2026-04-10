import mongoose from "mongoose";
import User from "../../models/User.js";
import { connectDBForTesting, disconnectDBForTesting, clearDBForTesting } from "../setup.js";

beforeAll(async () => await connectDBForTesting());
afterAll(async () => await disconnectDBForTesting());
afterEach(async () => await clearDBForTesting());

describe("User Model Unit Tests", () => {
    
    describe("Schema Validation", () => {
        
        // ==========================================
        // NEGATIVE TEST CASES
        // ==========================================

        it("should throw a validation error if required fields are missing", async () => {
            const user = new User({
                // Missing firstName, lastName, email, phoneNumber, password
                role: "donor"
            });

            let error;
            try {
                await user.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
            expect(error.errors.firstName).toBeDefined();
            expect(error.errors.lastName).toBeDefined();
            expect(error.errors.email).toBeDefined();
            expect(error.errors.password).toBeDefined();
        });

        it("should throw a validation error if an invalid role is provided", async () => {
            const user = new User({
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com",
                phoneNumber: "0771234567",
                password: "Password123",
                role: "super_hacker" // Not in the allowed enum
            });

            let error;
            try {
                await user.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
            expect(error.errors.role).toBeDefined();
        });

        // ==========================================
        // POSITIVE TEST CASES
        // ==========================================

        it("should successfully save a valid user and apply default values", async () => {
            const user = new User({
                firstName: "Valid",
                lastName: "User",
                email: "valid@example.com",
                phoneNumber: "0771234567",
                password: "Password123"
            });
            const savedUser = await user.save();

            expect(savedUser._id).toBeDefined();
            expect(savedUser.email).toBe("valid@example.com");
            expect(savedUser.isActive).toBe(true); 
        });
    });

    describe("Hooks and Instance Methods", () => {
        
        // ==========================================
        // POSITIVE TEST CASES
        // ==========================================

        it("should hash the password before saving (Pre-save hook)", async () => {
            const user = new User({
                firstName: "John",
                lastName: "Doe",
                email: "hash@example.com",
                phoneNumber: "0771234567",
                password: "Password123"
            });
            await user.save();
            
            expect(user.password).not.toBe("Password123");
            expect(user.password).toBeDefined();
            expect(user.password).toMatch(/^\$2[aby]\$/); // Verify bcrypt format
        });

        it("should correctly compare passwords (comparePassword method)", async () => {
            const user = new User({
                firstName: "Jane",
                lastName: "Doe",
                email: "jane@example.com",
                phoneNumber: "0777654321",
                password: "SecurePassword1!"
            });
            await user.save();

            const isMatch = await user.comparePassword("SecurePassword1!");
            const isNotMatch = await user.comparePassword("WrongPassword");

            expect(isMatch).toBe(true);
            expect(isNotMatch).toBe(false);
        });

        it("should generate a 6-digit OTP and set expiration (generateOTP method)", () => {
            const user = new User();
            const otp = user.generateOTP();

            expect(otp).toBeDefined();
            expect(otp.toString().length).toBe(6);
            expect(user.otp).toBe(otp);
            expect(user.otpExpires.getTime()).toBeGreaterThan(Date.now());
            expect(user.otpAttempts).toBe(0);
        });
    });
});