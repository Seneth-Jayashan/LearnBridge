import request from "supertest";
import app from "../../server.js"; // Adjust path to your Express app
import User from "../../models/User.js";
import { connectDBForTesting, disconnectDBForTesting, clearDBForTesting } from "../setup.js";
import { jest } from '@jest/globals';
jest.setTimeout(15000); // Gives tests 15 seconds before failing

beforeAll(async () => await connectDBForTesting());
afterAll(async () => await disconnectDBForTesting());
afterEach(async () => await clearDBForTesting());

describe("Auth and Admin Management Tests", () => {
    
    let superAdminToken;

    // Helper function to create a super admin and get a token before testing protected routes
    beforeEach(async () => {
        const superAdmin = await User.create({
            firstName: "Super",
            lastName: "Admin",
            email: "superadmin@system.com",
            phoneNumber: "0000000000",
            password: "AdminPassword123",
            role: "super_admin",
            requiresPasswordChange: false // Bypass first login OTP for tests
        });

        // Login to get token
        const response = await request(app)
            .post("/api/v1/auth/login")
            .send({ identifier: "superadmin@system.com", password: "AdminPassword123" });
            
        superAdminToken = response.body.accessToken;
    });

    describe("Authentication (/api/v1/auth)", () => {
        it("should return an error for invalid login credentials", async () => {
            const res = await request(app)
                .post("/api/v1/auth/login")
                .send({ identifier: "superadmin@system.com", password: "WrongPassword" });

            expect(res.status).toBe(401);
            expect(res.body.message).toBe("Invalid credentials.");
        });

        it("should intercept first login and require OTP", async () => {
            // Create a fresh user that requires password change
            await User.create({
                firstName: "New",
                lastName: "Teacher",
                email: "teacher@school.com",
                phoneNumber: "0712345678",
                password: "TempPassword1",
                role: "teacher",
                requiresPasswordChange: true
            });

            const res = await request(app)
                .post("/api/v1/auth/login")
                .send({ identifier: "teacher@school.com", password: "TempPassword1" });

            expect(res.status).toBe(200);
            expect(res.body.requiresOtpVerification).toBe(true);
            expect(res.body.message).toContain("First login detected");
        });
    });

    describe("Super Admin Actions (/api/v1/admin)", () => {
        it("should allow Super Admin to create a new user", async () => {
            const res = await request(app)
                .post("/api/v1/admin/create-user")
                .set("Authorization", `Bearer ${superAdminToken}`)
                .send({
                    firstName: "Test",
                    lastName: "Donor",
                    email: "donor@test.com",
                    phoneNumber: "0771122334",
                    password: "Password123",
                    role: "donor"
                });

            expect(res.status).toBe(201);
            expect(res.body.message).toBe("User created successfully");
            
            // Verify in DB
            const userInDb = await User.findOne({ email: "donor@test.com" });
            expect(userInDb).toBeTruthy();
            expect(userInDb.role).toBe("donor");
        });

        it("should deny access to non-super-admins trying to create users", async () => {
            // Create a normal teacher token
            const teacher = await User.create({
                firstName: "Normal", lastName: "Teacher", email: "norm@teach.com",
                phoneNumber: "0711111111", password: "Pass1", role: "teacher", requiresPasswordChange: false
            });
            const loginRes = await request(app).post("/api/v1/auth/login").send({ identifier: "norm@teach.com", password: "Pass1" });
            const teacherToken = loginRes.body.accessToken;

            // Try to access admin route
            const res = await request(app)
                .post("/api/v1/admin/create-user")
                .set("Authorization", `Bearer ${teacherToken}`)
                .send({
                    firstName: "Hacker", lastName: "Man", email: "hack@hack.com",
                    phoneNumber: "000", password: "pwd", role: "super_admin"
                });

            expect(res.status).toBe(403);
            expect(res.body.message).toBe("You do not have permission to perform this action");
        });
    });
});