import request from 'supertest';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import { connectDBForTesting, disconnectDBForTesting, clearDBForTesting } from '../setup.js';

// Mock Cloudinary Service
jest.unstable_mockModule('../../services/CloudinaryService.js', () => ({
    uploadFileToCloudinary: jest.fn().mockResolvedValue({ secure_url: 'https://res.cloudinary.com/demo/image/upload/thumbnail.jpg' }),
    deleteCloudinaryAssetFromUrl: jest.fn().mockResolvedValue(true),
    getCloudinaryFileNameFromUrl: jest.fn().mockReturnValue('thumbnail.jpg'),
    createSignedDownloadUrlFromCloudinaryUrl: jest.fn().mockReturnValue('https://res.cloudinary.com/signed-url/thumbnail.jpg'),
}));

const { default: app } = await import('../../server.js');
const { default: User } = await import('../../models/User.js');
const { default: Grade } = await import('../../models/Grade.js');
const { default: Level } = await import('../../models/Level.js');
const { default: Module } = await import('../../models/Module.js');
const { default: Lesson } = await import('../../models/Lesson.js');
const { default: Assignment } = await import('../../models/Assignment.js');
const { default: AssignmentSubmission } = await import('../../models/AssignmentSubmission.js');

beforeAll(async () => {
    await connectDBForTesting();
    process.env.JWT_SECRET = 'test_secret_key_for_jwt_12345';
});

afterAll(async () => await disconnectDBForTesting());
afterEach(async () => await clearDBForTesting());

describe('Module API Integration Tests', () => {
    let superAdminToken, studentToken, alStudentToken;
    let superAdminId, studentId, alStudentId;
    let grade10Id, grade12Id, olLevelId, alLevelId;

    beforeEach(async () => {
        // 1. Create Levels
        const olLevel = await Level.create({ name: 'Senior Secondary – G.C.E. O/L' });
        olLevelId = olLevel._id;

        const alLevel = await Level.create({ name: 'Advanced Level – G.C.E. A/L' });
        alLevelId = alLevel._id;

        // 2. Create Grades
        const grade10 = await Grade.create({ name: '10' }); // O/L
        grade10Id = grade10._id;

        const grade12 = await Grade.create({ name: '12' }); // A/L
        grade12Id = grade12._id;

        // 3. Create Super Admin
        const sa = await User.create({
            firstName: 'Nick', lastName: 'Fury', email: 'fury@shield.com',
            phoneNumber: '0770000000', password: 'SuperSecretPassword1!',
            role: 'super_admin', isActive: true
        });
        superAdminId = sa._id;
        const saLogin = await request(app).post('/api/v1/auth/login').send({ identifier: 'fury@shield.com', password: 'SuperSecretPassword1!' });
        superAdminToken = saLogin.body.accessToken;

        // 4. Create Grade 10 Student
        const s1 = await User.create({
            firstName: 'Peter', lastName: 'Parker', email: 'peter@avengers.com',
            phoneNumber: '0773334444', password: 'SpiderMan123!',
            role: 'student', grade: grade10Id, isActive: true
        });
        studentId = s1._id;
        const s1Login = await request(app).post('/api/v1/auth/login').send({ identifier: s1.regNumber, password: 'SpiderMan123!' });
        studentToken = s1Login.body.accessToken;

        // 5. Create Grade 12 A/L Student (Science Stream)
        const s2 = await User.create({
            firstName: 'Gwen', lastName: 'Stacy', email: 'gwen@avengers.com',
            phoneNumber: '0774445555', password: 'SpiderGwen123!',
            role: 'student', grade: grade12Id, stream: 'Biology Stream', isActive: true
        });
        alStudentId = s2._id;
        const s2Login = await request(app).post('/api/v1/auth/login').send({ identifier: s2.regNumber, password: 'SpiderGwen123!' });
        alStudentToken = s2Login.body.accessToken;
    });

    // ==========================================
    // 1. CREATE MODULE TESTS & BUSINESS RULES
    // ==========================================
    describe('POST /api/v1/modules', () => {
        it('[POSITIVE] should create a standard O/L module', async () => {
            const response = await request(app)
                .post('/api/v1/modules')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .field('name', 'Mathematics Core')
                .field('description', 'Basic Math')
                .field('level', olLevelId.toString())
                .field('grade', grade10Id.toString());

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Module created successfully');
            expect(response.body.module.name).toBe('Mathematics Core');
            expect(response.body.module.subjectStream).toBeNull();
        });

        it('[POSITIVE] should create an A/L module with a valid stream', async () => {
            const response = await request(app)
                .post('/api/v1/modules')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .field('name', 'Botany')
                .field('level', alLevelId.toString())
                .field('grade', grade12Id.toString())
                .field('subjectStream', 'Biology Stream')
                .attach('thumbnail', Buffer.from('fake image'), 'thumb.jpg');

            expect(response.status).toBe(201);
            expect(response.body.module.subjectStream).toBe('Biology Stream');
            expect(response.body.module.thumbnailUrl).toBe('https://res.cloudinary.com/demo/image/upload/thumbnail.jpg');
        });

        it('[NEGATIVE] should reject A/L Grade 12 module if subjectStream is missing', async () => {
            const response = await request(app)
                .post('/api/v1/modules')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({
                    name: 'Physics Advanced',
                    level: alLevelId.toString(),
                    grade: grade12Id.toString()
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Subject stream is required for grades 12 and 13.');
        });

        it('[NEGATIVE] should reject duplicate module (same name, level, grade, stream)', async () => {
            await Module.create({ name: 'History', level: olLevelId, grade: grade10Id });

            const response = await request(app)
                .post('/api/v1/modules')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({
                    name: 'History',
                    level: olLevelId.toString(),
                    grade: grade10Id.toString()
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/Module with this name already exists/);
        });

        it('[NEGATIVE] should block students from creating modules', async () => {
            const response = await request(app)
                .post('/api/v1/modules')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ name: 'Hacked Module', level: olLevelId, grade: grade10Id });

            expect(response.status).toBe(403);
        });
    });

    // ==========================================
    // 2. READ & FILTER MODULES
    // ==========================================
    describe('GET /api/v1/modules', () => {
        let olModuleId, alModuleId;

        beforeEach(async () => {
            // Create O/L Module
            const m1 = await Module.create({ name: 'O/L Science', level: olLevelId, grade: grade10Id });
            olModuleId = m1._id;
            
            // To make it visible to the student logic, it needs an attached lesson without a strict school binding
            await Lesson.create({ title: 'Science Lesson 1', module: olModuleId, createdBy: superAdminId });

            // Create A/L Module
            const m2 = await Module.create({ name: 'A/L Biology', level: alLevelId, grade: grade12Id, subjectStream: 'Biology Stream' });
            alModuleId = m2._id;
            await Lesson.create({ title: 'Bio Lesson 1', module: alModuleId, createdBy: superAdminId });
        });

        it('[POSITIVE] Admin should fetch all modules', async () => {
            const response = await request(app)
                .get('/api/v1/modules')
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(2);
        });

        it('[POSITIVE] Grade 10 student should only see Grade 10 modules', async () => {
            const response = await request(app)
                .get('/api/v1/modules')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].name).toBe('O/L Science');
        });

        it('[POSITIVE] text search aggregation should match module names', async () => {
            const response = await request(app)
                .get('/api/v1/modules?q=Biology')
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].name).toBe('A/L Biology');
        });
    });

    // ==========================================
    // 3. UPDATE MODULE TESTS
    // ==========================================
    describe('PUT /api/v1/modules/:id', () => {
        let testModuleId;

        beforeEach(async () => {
            const mod = await Module.create({ name: 'Old Name', level: olLevelId, grade: grade10Id });
            testModuleId = mod._id;
        });

        it('[POSITIVE] should update module name', async () => {
            const response = await request(app)
                .put(`/api/v1/modules/${testModuleId}`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ name: 'New Name' });

            expect(response.status).toBe(200);
            expect(response.body.module.name).toBe('New Name');
        });

        it('[POSITIVE] should clear subjectStream if downgraded from A/L to O/L', async () => {
            // First, make it an A/L module
            const alMod = await Module.create({ name: 'Bio', level: alLevelId, grade: grade12Id, subjectStream: 'Biology Stream' });

            // Now downgrade it to Grade 10
            const response = await request(app)
                .put(`/api/v1/modules/${alMod._id}`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ level: olLevelId.toString(), grade: grade10Id.toString() });

            expect(response.status).toBe(200);
            expect(response.body.module.subjectStream).toBeNull();
        });
    });

    // ==========================================
    // 4. DELETE MODULE & CASCADING TESTS
    // ==========================================
    describe('DELETE /api/v1/modules/:id', () => {
        let testModuleId;

        beforeEach(async () => {
            const mod = await Module.create({ name: 'To Be Deleted', level: olLevelId, grade: grade10Id });
            testModuleId = mod._id;

            // Seed cascading data
            await Lesson.create({ title: 'Lesson 1', module: testModuleId, createdBy: superAdminId });
            const assignment = await Assignment.create({ title: 'Assignment 1', module: testModuleId, createdBy: superAdminId });
            
            await AssignmentSubmission.create({
                assignment: assignment._id,
                student: studentId,
                fileUrl: 'http://test.com/file.pdf'
            });
        });

        it('[POSITIVE] should delete module and cascade delete lessons, assignments, and submissions', async () => {
            const response = await request(app)
                .delete(`/api/v1/modules/${testModuleId}`)
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Module deleted successfully');
            expect(response.body.deletedLessons).toBe(1);
            expect(response.body.deletedAssignments).toBe(1);
            expect(response.body.deletedAssignmentSubmissions).toBe(1);

            // Verify in DB
            const modCheck = await Module.findById(testModuleId);
            const lessonCheck = await Lesson.find({ module: testModuleId });
            const assignmentCheck = await Assignment.find({ module: testModuleId });
            const submissionCheck = await AssignmentSubmission.find(); // Should be empty

            expect(modCheck).toBeNull();
            expect(lessonCheck.length).toBe(0);
            expect(assignmentCheck.length).toBe(0);
            expect(submissionCheck.length).toBe(0);
        });
    });
});