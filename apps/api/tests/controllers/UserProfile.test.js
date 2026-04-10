import request from "supertest";
import mongoose from "mongoose";
import app from "../../server.js"; // Adjust path to your Express app
import User from "../../models/User.js";
import { connectDBForTesting, disconnectDBForTesting, clearDBForTesting } from "../setup.js";

beforeAll(async () => await connectDBForTesting());
afterAll(async () => await disconnectDBForTesting());
afterEach(async () => await clearDBForTesting());

describe("User Profile Management Tests", () => {
    let userToken;
    let userId;

    // Setup: Create a standard user and log them in before each test
    beforeEach(async () => {
        const user = await User.create({
            firstName: "Jane",
            lastName: "Doe",
            email: "jane.doe@example.com",
            phoneNumber: "0771234567",
            password: "OldPassword123",
            role: "donor",
            requiresPasswordChange: false
        });
        userId = user._id;

        const loginRes = await request(app)
            .post("/api/v1/auth/login")
            .send({ identifier: "jane.doe@example.com", password: "OldPassword123" });
            
        userToken = loginRes.body.accessToken;
    });

    describe("PUT /api/v1/users/profile", () => {
        it("should update the user's first and last name", async () => {
            const res = await request(app)
                .put("/api/v1/users/profile")
                .set("Authorization", `Bearer ${userToken}`)
                .send({
                    firstName: "Janet",
                    lastName: "Smith"
                });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Profile updated successfully");
            expect(res.body.user.firstName).toBe("Janet");
            expect(res.body.user.lastName).toBe("Smith");

            // Verify DB update
            const updatedUser = await User.findById(userId);
            expect(updatedUser.firstName).toBe("Janet");
        });

        it("should reject an email that is already taken by another user", async () => {
            // Create a secondary user to hog an email
            await User.create({
                firstName: "Bob", lastName: "Builder",
                email: "bob@example.com", phoneNumber: "0779999999",
                password: "Password1", role: "donor"
            });

            const res = await request(app)
                .put("/api/v1/users/profile")
                .set("Authorization", `Bearer ${userToken}`)
                .send({ email: "bob@example.com" });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain("already taken");
        });
    });

    describe("PUT /api/v1/users/update-password", () => {
        it("should successfully change the password when current password is correct", async () => {
            const res = await request(app)
                .put("/api/v1/users/update-password")
                .set("Authorization", `Bearer ${userToken}`)
                .send({
                    currentPassword: "OldPassword123",
                    newPassword: "NewSecurePassword456"
                });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Password updated successfully");

            // Verify we can login with the new password
            const newLoginRes = await request(app)
                .post("/api/v1/auth/login")
                .send({ identifier: "jane.doe@example.com", password: "NewSecurePassword456" });
            
            expect(newLoginRes.status).toBe(200);
        });

        it("should fail if the current password is wrong", async () => {
            const res = await request(app)
                .put("/api/v1/users/update-password")
                .set("Authorization", `Bearer ${userToken}`)
                .send({
                    currentPassword: "WrongOldPassword",
                    newPassword: "NewSecurePassword456"
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Current password is incorrect");
        });
    });

    describe("DELETE /api/v1/users/profile", () => {
        it("should soft-delete the user's profile", async () => {
            const res = await request(app)
                .delete("/api/v1/users/profile")
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Profile deleted successfully");

            // Verify soft delete in DB
            const deletedUser = await User.findById(userId);
            expect(deletedUser.isDeleted).toBe(true);
            expect(deletedUser.isActive).toBe(false);
        });
    });
});