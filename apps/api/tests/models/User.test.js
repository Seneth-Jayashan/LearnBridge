import mongoose from "mongoose";
import User from "../../models/User.js";
import { connectDBForTesting, disconnectDBForTesting, clearDBForTesting } from "../setup.js";

beforeAll(async () => await connectDBForTesting());
afterAll(async () => await disconnectDBForTesting());
afterEach(async () => await clearDBForTesting());

describe("User Model Unit Tests", () => {
    
    it("should hash the password before saving", async () => {
        const user = new User({
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            phoneNumber: "0771234567",
            password: "Password123"
        });
        await user.save();
        
        expect(user.password).not.toBe("Password123");
        expect(user.password).toBeDefined();
    });

    it("should correctly compare passwords", async () => {
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

    it("should generate a 6-digit OTP and set expiration", () => {
        const user = new User();
        const otp = user.generateOTP();

        expect(otp.toString().length).toBe(6);
        expect(user.otp).toBe(otp);
       expect(user.otpExpires.getTime()).toBeGreaterThan(Date.now());
        expect(user.otpAttempts).toBe(0);
    });
});