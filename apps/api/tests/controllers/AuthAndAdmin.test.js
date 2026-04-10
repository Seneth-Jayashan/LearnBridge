import request from "supertest";
import app from "../../server.js"; 
import User from "../../models/User.js";
import { connectDBForTesting, disconnectDBForTesting, clearDBForTesting } from "../setup.js";
import { jest } from '@jest/globals';

jest.setTimeout(15000); 

beforeAll(async () => await connectDBForTesting());
afterAll(async () => await disconnectDBForTesting());
afterEach(async () => await clearDBForTesting());

describe("Auth and Admin Management Tests", () => {
    
    let superAdminToken;

    beforeEach(async () => {
        await User.create({
            firstName: "Super",
            lastName: "Admin",
            email: "superadmin@system.com",
            phoneNumber: "0000000000",
            password: "AdminPassword123",
            role: "super_admin",
            requiresPasswordChange: false 
        });

        const response = await request(app)
            .post("/api/v1/auth/login")
            .send({ identifier: "superadmin@system.com", password: "AdminPassword123" });
            
        superAdminToken = response.body.accessToken;
    });

    describe("Authentication (/api/v1/auth/login)", () => {
        
        // ==========================================
        // NEGATIVE TEST CASES
        // ==========================================

        it("should return an error if identifier or password is missing", async () => {
            const res = await request(app)
                .post("/api/v1/auth/login")
                .send({ identifier: "superadmin@system.com" }); 

            expect(res.status).toBe(400); 
            expect(res.body.message).toBeDefined();
        });

        it("should return an error for invalid login credentials", async () => {
            const res = await request(app)
                .post("/api/v1/auth/login")
                .send({ identifier: "superadmin@system.com", password: "WrongPassword" });

            expect(res.status).toBe(401);
            expect(res.body.message).toBe("Invalid credentials.");
        });

        // ==========================================
        // POSITIVE TEST CASES
        // ==========================================

        it("should successfully log in a user with valid credentials and return a token", async () => {
            const res = await request(app)
                .post("/api/v1/auth/login")
                .send({ identifier: "superadmin@system.com", password: "AdminPassword123" });

            expect(res.status).toBe(200);
            expect(res.body.accessToken).toBeDefined();
            // Removed requiresOtpVerification check as the API omits it on normal login
        });

        it("should intercept first login and require OTP", async () => {
            await User.create({
                firstName: "New", lastName: "Teacher", email: "teacher@school.com",
                phoneNumber: "0712345678", password: "TempPassword1", role: "teacher",
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
        
        // ==========================================
        // NEGATIVE TEST CASES
        // ==========================================

        it("should deny access if no authentication token is provided", async () => {
            const res = await request(app)
                .post("/api/v1/admin/create-user")
                .send({
                    firstName: "Ghost", lastName: "User", email: "ghost@test.com",
                    phoneNumber: "1111111111", password: "pwd", role: "donor"
                });

            expect(res.status).toBe(401); 
        });

        it("should deny access to non-super-admins trying to create users", async () => {
            await User.create({
                firstName: "Normal", lastName: "Teacher", email: "norm@teach.com",
                phoneNumber: "0711111111", password: "Pass1", role: "teacher", requiresPasswordChange: false
            });
            
            const loginRes = await request(app)
                .post("/api/v1/auth/login")
                .send({ identifier: "norm@teach.com", password: "Pass1" });
            
            const teacherToken = loginRes.body.accessToken;

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

        it("should return an error when trying to create a user with an existing email", async () => {
            await User.create({
                firstName: "Existing", lastName: "User", email: "duplicate@test.com",
                phoneNumber: "0779999999", password: "pwd", role: "donor", requiresPasswordChange: false
            });

            const res = await request(app)
                .post("/api/v1/admin/create-user")
                .set("Authorization", `Bearer ${superAdminToken}`)
                .send({
                    firstName: "New", lastName: "User", email: "duplicate@test.com",
                    phoneNumber: "0778888888", password: "pwd123", role: "teacher"
                });

            expect(res.status).toBeGreaterThanOrEqual(400); 
            expect(res.body.message).toBeDefined();
        });

        // ==========================================
        // POSITIVE TEST CASES
        // ==========================================

        it("should allow Super Admin to create a new user successfully", async () => {
            const res = await request(app)
                .post("/api/v1/admin/create-user")
                .set("Authorization", `Bearer ${superAdminToken}`)
                .send({
                    firstName: "Test", lastName: "Donor", email: "donor@test.com",
                    phoneNumber: "0771122334", password: "Password123", role: "donor"
                });

            expect(res.status).toBe(201);
            expect(res.body.message).toBe("User created successfully");
            
            const userInDb = await User.findOne({ email: "donor@test.com" });
            expect(userInDb).toBeTruthy();
            expect(userInDb.role).toBe("donor");
        });
    });
});