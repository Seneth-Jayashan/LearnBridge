import { jest } from '@jest/globals';
import request from "supertest";
import mongoose from "mongoose";
import app from "../../server.js"; 
import User from "../../models/User.js";
import School from "../../models/School.js";
import { connectDBForTesting, disconnectDBForTesting, clearDBForTesting } from "../setup.js";

jest.setTimeout(15000); 
beforeAll(async () => await connectDBForTesting());
afterAll(async () => await disconnectDBForTesting());
afterEach(async () => await clearDBForTesting());

describe("School Management (School Admin) Tests", () => {
    let adminToken;
    let schoolId;
    let unauthorizedToken; // Using a donor token to test RBAC reliably

    beforeEach(async () => {
        // 1. Setup the baseline School
        const school = await School.create({
            name: "Springfield Elementary",
            contactEmail: "info@springfield.com",
            contactPhone: "0112233445",
            isVerified: true
        });
        schoolId = school._id;

        // 2. Setup the School Admin
        const admin = await User.create({
            firstName: "Principal", lastName: "Skinner",
            email: "skinner@springfield.com", phoneNumber: "0771112222",
            password: "AdminPassword1", role: "school_admin",
            school: schoolId, isSchoolVerified: true, requiresPasswordChange: false
        });

        school.admins.push(admin._id);
        await school.save();

        const loginRes = await request(app)
            .post("/api/v1/auth/login")
            .send({ identifier: "skinner@springfield.com", password: "AdminPassword1" });
            
        adminToken = loginRes.body.accessToken;

        // 3. Setup a standard Donor to test forbidden access routes (reliable login)
        await User.create({
            firstName: "Test", lastName: "Donor",
            email: "donor@springfield.com", phoneNumber: "0770001111",
            password: "DonorPassword1", role: "donor",
            requiresPasswordChange: false
        });

        const donorLoginRes = await request(app)
            .post("/api/v1/auth/login")
            .send({ identifier: "donor@springfield.com", password: "DonorPassword1" });
        
        unauthorizedToken = donorLoginRes.body.accessToken;
    });

    describe("PUT /api/v1/school-admin/my-school", () => {

        // ==========================================
        // NEGATIVE TEST CASES
        // ==========================================

        it("should return 401 if no authentication token is provided", async () => {
            const res = await request(app)
                .put("/api/v1/school-admin/my-school")
                .field("contactEmail", "hacked@email.com");

            expect(res.status).toBe(401);
        });

        it("should return 403 Forbidden if a non-admin attempts to update the school", async () => {
            const res = await request(app)
                .put("/api/v1/school-admin/my-school")
                .set("Authorization", `Bearer ${unauthorizedToken}`)
                .field("contactEmail", "hacked@email.com");

            expect(res.status).toBe(403);
            expect(res.body.message).toBeDefined(); 
        });

        // ==========================================
        // POSITIVE TEST CASES
        // ==========================================

        it("should update standard school details successfully", async () => {
            const res = await request(app)
                .put("/api/v1/school-admin/my-school")
                .set("Authorization", `Bearer ${adminToken}`)
                .field("contactEmail", "new-email@springfield.com")
                .field("address[city]", "Springfield City");

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("School profile updated successfully");
            expect(res.body.school.contactEmail).toBe("new-email@springfield.com");
            expect(res.body.school.address.city).toBe("Springfield City");
        });

        it("should mock an image upload to Cloudinary and return the mock URL", async () => {
            const res = await request(app)
                .put("/api/v1/school-admin/my-school")
                .set("Authorization", `Bearer ${adminToken}`)
                .attach("logo", Buffer.from("fake-image-data"), { filename: "logo.png", contentType: "image/png" });

            expect(res.status).toBe(200);
            expect(res.body.school.logoUrl).toBe("https://mock-cloudinary.com/logo.png"); 
        });
    });

    describe("POST /api/v1/school-admin/students", () => {

        // ==========================================
        // NEGATIVE TEST CASES
        // ==========================================

        it("should fail validation if grade is missing", async () => {
             const mockLevelId = new mongoose.Types.ObjectId().toString();

             const res = await request(app)
                .post("/api/v1/school-admin/students")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    firstName: "Milhouse", lastName: "Van Houten",
                    email: "milhouse@springfield.com", 
                    phoneNumber: "0775556666", password: "Password123",
                    level: mockLevelId // grade is explicitly omitted
                });

            expect(res.status).toBe(400); 
            expect(res.body.message).toBe("Grade is required when creating a Student.");
        });

        // ==========================================
        // POSITIVE TEST CASES
        // ==========================================

        it("should successfully create a new student and push to school students array", async () => {
            const mockGradeId = new mongoose.Types.ObjectId().toString(); 
            const mockLevelId = new mongoose.Types.ObjectId().toString();

            const res = await request(app)
                .post("/api/v1/school-admin/students")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    firstName: "Bart", lastName: "Simpson", email: "bart@springfield.com", 
                    phoneNumber: "0773334444", password: "Password123",
                    grade: mockGradeId, level: mockLevelId
                });

            expect(res.status).toBe(201);
            expect(res.body.message).toBe("Student created successfully");
            expect(res.body.studentRegNumber).toBeDefined();

            const newStudent = await User.findById(res.body.studentId);
            expect(newStudent.role).toBe("student");
            expect(newStudent.school.toString()).toBe(schoolId.toString());

            const updatedSchool = await School.findById(schoolId);
            expect(updatedSchool.students).toContainEqual(newStudent._id);
        });
    });

    describe("GET /api/v1/school-admin/students", () => {

        // ==========================================
        // NEGATIVE TEST CASES
        // ==========================================

        it("should deny access to unauthorized roles attempting to view the student list", async () => {
            const res = await request(app)
                .get("/api/v1/school-admin/students")
                .set("Authorization", `Bearer ${unauthorizedToken}`);

            expect(res.status).toBe(403);
        });

        // ==========================================
        // POSITIVE TEST CASES
        // ==========================================

        it("should fetch all students belonging to the admin's school", async () => {
            await User.create({
                firstName: "Lisa", lastName: "Simpson", email: "lisa@springfield.com", 
                phoneNumber: "0778889999", password: "Pwd1",
                role: "student", school: schoolId, requiresPasswordChange: true
            });

            const res = await request(app)
                .get("/api/v1/school-admin/students")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            
            // Includes Lisa
            expect(res.body.length).toBeGreaterThanOrEqual(1); 
            
            const allMatchSchool = res.body.every(student => student.school.toString() === schoolId.toString());
            expect(allMatchSchool).toBe(true);
        });
    });
});