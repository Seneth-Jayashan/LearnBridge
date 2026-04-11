import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import User from '../../models/User.js';
import School from '../../models/School.js';
import ResourceRequest from '../../models/ResourceRequest.js';
import { connectDBForTesting, disconnectDBForTesting, clearDBForTesting } from '../setup.js';
import { email } from 'zod';

beforeAll(async () => {
    await connectDBForTesting();
    process.env.JWT_SECRET = 'test_secret_key_for_jwt_12345';
});

afterAll(async () => await disconnectDBForTesting());
afterEach(async () => await clearDBForTesting());

describe('School Admin API Integration Tests', () => {
    let adminToken, schoolId, adminId;
    let mockGradeId, mockLevelId;

    beforeEach(async () => {
        // 1. Create a mock School
        const school = await School.create({
            name: 'Hogwarts School of Witchcraft and Wizardry',
            isVerified: true
        });
        schoolId = school._id;

        // 2. Create the School Admin user
        const admin = await User.create({
            firstName: 'Albus', lastName: 'Dumbledore',
            email: 'albus@hogwarts.com', phoneNumber: '0770001111',
            password: 'ElderWandPassword1!',
            role: 'school_admin',
            school: schoolId,
            isActive: true
        });
        adminId = admin._id;

        // Link admin to school
        school.admins.push(adminId);
        await school.save();

        // 3. Log in the School Admin to get the token
        const loginRes = await request(app)
            .post('/api/v1/auth/login')
            .send({ identifier: 'albus@hogwarts.com', password: 'ElderWandPassword1!' });
        
        adminToken = loginRes.body.accessToken;

        // 4. Generate mock Object IDs for Grade and Level for student creation tests
        mockGradeId = new mongoose.Types.ObjectId().toString();
        mockLevelId = new mongoose.Types.ObjectId().toString();
    });

    // ==========================================
    // 1. SCHOOL PROFILE
    // ==========================================
    describe('School Profile Management', () => {
        it('[POSITIVE] GET /my-school should return the admin\'s school details', async () => {
            const response = await request(app)
                .get('/api/v1/school-admin/my-school')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Hogwarts School of Witchcraft and Wizardry');
        });

        it('[POSITIVE] PUT /my-school should update the school contact info', async () => {
            const response = await request(app)
                .put('/api/v1/school-admin/my-school')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    contactEmail: 'headmaster@hogwarts.com',
                    contactPhone: '0779998888',
                    address: { city: 'Highlands', state: 'Scotland' }
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('School profile updated successfully');
            expect(response.body.school.contactEmail).toBe('headmaster@hogwarts.com');
            expect(response.body.school.address.city).toBe('Highlands');
        });
    });

    // ==========================================
    // 2. STUDENT MANAGEMENT
    // ==========================================
    describe('Student Management', () => {
        it('[POSITIVE] POST /students should create a new student assigned to the school', async () => {
            const response = await request(app)
                .post('/api/v1/school-admin/students')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    firstName: 'Harry', lastName: 'Potter',
                    email: 'harry@hogwarts.com',
                    phoneNumber: '0771234567',
                    password: 'Gryffindor123!',
                    grade: mockGradeId,
                    level: mockLevelId
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Student created successfully');
            expect(response.body.studentRegNumber).toBeDefined();

            // Verify in DB
            const studentInDb = await User.findById(response.body.studentId);
            expect(studentInDb.school.toString()).toBe(schoolId.toString());
            expect(studentInDb.role).toBe('student');
        });

        it('[NEGATIVE] POST /students should fail if grade or level is missing', async () => {
            const response = await request(app)
                .post('/api/v1/school-admin/students')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    firstName: 'Ron', lastName: 'Weasley',
                    phoneNumber: '0777654321',
                    password: 'Password123!'
                    // Missing grade and level
                });

            expect(response.status).toBe(400);
        });

        it('[POSITIVE] GET & PATCH /students should fetch and deactivate a student', async () => {
            // Seed a student
            const student = await User.create({
                firstName: 'Hermione', lastName: 'Granger',
                email: 'hermione@hogwarts.com', // <--- ADD THIS LINE
                phoneNumber: '0771112222', password: 'Password123!',
                role: 'student', school: schoolId, grade: mockGradeId, level: mockLevelId, isActive: true
            });

            // GET Students
            const getRes = await request(app)
                .get('/api/v1/school-admin/students')
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(getRes.status).toBe(200);
            expect(getRes.body.length).toBe(1);
            expect(getRes.body[0].firstName).toBe('Hermione');

            // PATCH Deactivate Student
            const patchRes = await request(app)
                .patch(`/api/v1/school-admin/students/${student._id}/deactivate`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(patchRes.status).toBe(200);
            expect(patchRes.body.message).toMatch(/deactivated/);

            const dbStudent = await User.findById(student._id);
            expect(dbStudent.isActive).toBe(false);
        });
    });

    // ==========================================
    // 3. TEACHER MANAGEMENT
    // ==========================================
    describe('Teacher Management', () => {
        let pendingTeacherId;

        beforeEach(async () => {
            // Seed a pending teacher for this school
            const teacher = await User.create({
                firstName: 'Severus', lastName: 'Snape',
                email: 'snape@hogwarts.com', phoneNumber: '0776665555',
                password: 'PotionsMaster1!', role: 'teacher',
                school: schoolId, isSchoolVerified: false
            });
            pendingTeacherId = teacher._id;
        });

        it('[POSITIVE] GET /teachers/pending should return unverified teachers', async () => {
            const response = await request(app)
                .get('/api/v1/school-admin/teachers/pending')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].firstName).toBe('Severus');
        });

        it('[POSITIVE] PATCH /teachers/:id/verify should verify a pending teacher', async () => {
            const response = await request(app)
                .patch(`/api/v1/school-admin/teachers/${pendingTeacherId}/verify`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Teacher verified successfully.');

            const dbTeacher = await User.findById(pendingTeacherId);
            expect(dbTeacher.isSchoolVerified).toBe(true);
        });

        it('[NEGATIVE] PATCH /teachers/:id/verify should fail if teacher belongs to another school', async () => {
            // Seed a teacher for a different school
            const otherSchoolTeacher = await User.create({
                firstName: 'Remus', lastName: 'Lupin',
                email: 'lupin@other.com', phoneNumber: '0779998888',
                password: 'Password123!', role: 'teacher',
                school: new mongoose.Types.ObjectId(), // Different school ID
                isSchoolVerified: false
            });

            const response = await request(app)
                .patch(`/api/v1/school-admin/teachers/${otherSchoolTeacher._id}/verify`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Teacher does not belong to your school.');
        });

        it('[POSITIVE] DELETE /teachers/:id/remove should un-link the teacher from the school', async () => {
            const response = await request(app)
                .delete(`/api/v1/school-admin/teachers/${pendingTeacherId}/remove`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);

            const dbTeacher = await User.findById(pendingTeacherId);
            expect(dbTeacher.school).toBeNull();
            expect(dbTeacher.isSchoolVerified).toBe(true); // Becomes standalone
        });
    });

    // ==========================================
    // 4. NEEDS (RESOURCE REQUESTS)
    // ==========================================
    describe('Resource Needs Management', () => {
        let needId;

        beforeEach(async () => {
            const need = await ResourceRequest.create({
                schoolId: adminId, // The controller uses req.user._id (admin's ID)
                schoolObjectId: schoolId,
                itemName: 'New Computers',
                quantity: 10,
                amount: 50000,
                status: 'Open'
            });
            needId = need._id;
        });

        it('[POSITIVE] POST /needs should create a new donation request', async () => {
            const response = await request(app)
                .post('/api/v1/school-admin/needs')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    itemName: 'Library Books',
                    quantity: 100,
                    amount: 500,
                    description: 'Books for the new semester',
                    urgency: 'High'
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Need posted successfully');
            expect(response.body.need.itemName).toBe('Library Books');
        });

        it('[NEGATIVE] POST /needs should return 400 if amount is invalid', async () => {
            const response = await request(app)
                .post('/api/v1/school-admin/needs')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    itemName: 'Library Books', quantity: 100, amount: -50 // Invalid amount
                });

            expect(response.status).toBe(400);
        });

        it('[POSITIVE] GET /school/my-needs should fetch needs posted by this admin', async () => {
            const response = await request(app)
                .get('/api/v1/school-admin/school/my-needs')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].itemName).toBe('New Computers');
        });

        it('[POSITIVE] PUT /school/:id should update an open need', async () => {
            const response = await request(app)
                .put(`/api/v1/school-admin/school/${needId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ quantity: 15, urgency: 'High' });

            expect(response.status).toBe(200);
            expect(response.body.need.quantity).toBe(15);
            expect(response.body.need.urgency).toBe('High');
        });

        it('[NEGATIVE] PUT /school/:id should fail if the need is not Open', async () => {
            // Manually change status to Fulfilled
            await ResourceRequest.findByIdAndUpdate(needId, { status: 'Fulfilled' });

            const response = await request(app)
                .put(`/api/v1/school-admin/school/${needId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ quantity: 20 });

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/Cannot edit a need that is already pledged/);
        });

        it('[POSITIVE] DELETE /school/:id should remove the need', async () => {
            const response = await request(app)
                .delete(`/api/v1/school-admin/school/${needId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Need deleted successfully');

            const checkNeed = await ResourceRequest.findById(needId);
            expect(checkNeed).toBeNull();
        });
    });
});