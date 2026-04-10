import request from 'supertest';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import { connectDBForTesting, disconnectDBForTesting, clearDBForTesting } from '../setup.js';

// Mock Cloudinary Service so we don't do real uploads during testing
jest.unstable_mockModule('../../services/CloudinaryService.js', () => ({
    uploadFileToCloudinary: jest.fn().mockResolvedValue({ secure_url: 'https://res.cloudinary.com/demo/raw/upload/test-file.pdf' }),
    deleteCloudinaryAssetFromUrl: jest.fn().mockResolvedValue(true),
    getCloudinaryFileNameFromUrl: jest.fn().mockReturnValue('test-file.pdf'),
    createSignedDownloadUrlFromCloudinaryUrl: jest.fn().mockReturnValue('https://res.cloudinary.com/signed-url/test-file.pdf'),
}));

const { default: app } = await import('../../server.js');
const { default: User } = await import('../../models/User.js');
const { default: Module } = await import('../../models/Module.js');
const { default: Grade } = await import('../../models/Grade.js');
const { default: Assignment } = await import('../../models/Assignment.js');
const { default: AssignmentSubmission } = await import('../../models/AssignmentSubmission.js');

beforeAll(async () => {
    await connectDBForTesting();
    process.env.JWT_SECRET = 'test_secret_key_for_jwt_12345';
});

afterAll(async () => await disconnectDBForTesting());
afterEach(async () => await clearDBForTesting());

describe('Assignment API Integration Tests', () => {
    let superAdminToken, teacherToken, studentToken;
    let teacherId, studentId, gradeId, moduleId;

    // Seed the database with necessary entities before EVERY test
    beforeEach(async () => {
        // 1. Create a Grade
        const grade = await Grade.create({ name: 'Grade 10' });
        gradeId = grade._id;

        // 2. Create a Module
        const module = await Module.create({
            name: 'Mathematics',
            grade: gradeId,
            description: 'Algebra basics'
        });
        moduleId = module._id;

        // 3. Create Super Admin
        await User.create({
            firstName: 'Nick', lastName: 'Fury', email: 'fury@shield.com',
            phoneNumber: '0770000000', password: 'SuperSecretPassword1!',
            role: 'super_admin', isActive: true
        });
        const saLogin = await request(app).post('/api/v1/auth/login').send({ identifier: 'fury@shield.com', password: 'SuperSecretPassword1!' });
        superAdminToken = saLogin.body.accessToken;

        // 4. Create Teacher
        const teacher = await User.create({
            firstName: 'Tony', lastName: 'Stark', email: 'tony@avengers.com',
            phoneNumber: '0771112222', password: 'IronMan123!',
            role: 'teacher', isActive: true
        });
        teacherId = teacher._id;
        const teacherLogin = await request(app).post('/api/v1/auth/login').send({ identifier: 'tony@avengers.com', password: 'IronMan123!' });
        teacherToken = teacherLogin.body.accessToken;

        // 5. Create Student (Assigned to Grade 10)
        const student = await User.create({
            firstName: 'Peter', lastName: 'Parker', email: 'peter@avengers.com',
            phoneNumber: '0773334444', password: 'SpiderMan123!',
            role: 'student', isActive: true, grade: gradeId
        });
        studentId = student._id;
        const studentLogin = await request(app).post('/api/v1/auth/login').send({ identifier: student.regNumber, password: 'SpiderMan123!' });
        studentToken = studentLogin.body.accessToken;
    });

    // ==========================================
    // 1. ASSIGNMENT MANAGEMENT TESTS (TEACHERS/ADMINS)
    // ==========================================
    describe('Teacher Assignment Management', () => {
        it('[POSITIVE] POST /api/v1/assignments should create an assignment', async () => {
            const payload = {
                title: 'Solve Algebra Equations',
                description: 'Complete questions 1 to 10 on page 42.',
                module: moduleId.toString(),
                materialUrl: 'https://example.com/math-worksheet.pdf',
                dueDate: new Date(Date.now() + 86400000).toISOString() // Tomorrow
            };

            const response = await request(app)
                .post('/api/v1/assignments')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send(payload);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Assignment created successfully');
            expect(response.body.assignment.title).toBe('Solve Algebra Equations');
            expect(response.body.assignment.module.toString()).toBe(moduleId.toString());
            expect(response.body.assignment.createdBy.toString()).toBe(teacherId.toString());

            // Verify in DB
            const dbAssignment = await Assignment.findById(response.body.assignment._id);
            expect(dbAssignment).toBeTruthy();
        });

        it('[NEGATIVE] POST /api/v1/assignments should fail if title is missing (Zod Validator)', async () => {
            const response = await request(app)
                .post('/api/v1/assignments')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    module: moduleId.toString(), // Missing title
                    description: 'Test description'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Validation Error');
            expect(response.body.errors[0].message).toMatch(/Invalid input: expected string, received undefined/i);
        });

        it('[POSITIVE] PUT /api/v1/assignments/:id should update an existing assignment', async () => {
            const assignment = await Assignment.create({
                title: 'Old Title',
                module: moduleId,
                createdBy: teacherId
            });

            const response = await request(app)
                .put(`/api/v1/assignments/${assignment._id}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({ title: 'Updated Math Title' });

            expect(response.status).toBe(200);
            expect(response.body.assignment.title).toBe('Updated Math Title');
        });

        it('[NEGATIVE] PUT /api/v1/assignments/:id should forbid teacher from updating another teacher\'s assignment', async () => {
            // Create assignment by someone else (Super Admin)
            const assignment = await Assignment.create({
                title: 'Admin Assignment',
                module: moduleId,
                createdBy: new mongoose.Types.ObjectId() // Random ID
            });

            const response = await request(app)
                .put(`/api/v1/assignments/${assignment._id}`)
                .set('Authorization', `Bearer ${teacherToken}`) // Teacher tries to update
                .send({ title: 'Hacked Title' });

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('You do not have permission to update this assignment');
        });

        it('[POSITIVE] DELETE /api/v1/assignments/:id should delete assignment and its submissions', async () => {
            const assignment = await Assignment.create({ title: 'To Be Deleted', module: moduleId, createdBy: teacherId });
            
            // Seed a dummy submission
            await AssignmentSubmission.create({ assignment: assignment._id, student: studentId, fileUrl: 'http://test.com' });

            const response = await request(app)
                .delete(`/api/v1/assignments/${assignment._id}`)
                .set('Authorization', `Bearer ${teacherToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Assignment deleted successfully');

            // Verify cascading delete
            const dbAssignment = await Assignment.findById(assignment._id);
            const dbSubmissions = await AssignmentSubmission.find({ assignment: assignment._id });
            expect(dbAssignment).toBeNull();
            expect(dbSubmissions.length).toBe(0);
        });
    });

    // ==========================================
    // 2. STUDENT VIEW AND SUBMISSION TESTS
    // ==========================================
    describe('Student Assignment Workflows', () => {
        let testAssignmentId;

        beforeEach(async () => {
            const assignment = await Assignment.create({
                title: 'Student Test Assignment',
                description: 'Please submit your PDF.',
                module: moduleId,
                createdBy: teacherId,
                dueDate: new Date(Date.now() + 86400000) // Tomorrow
            });
            testAssignmentId = assignment._id;
        });

        it('[POSITIVE] GET /api/v1/assignments should fetch assignments relevant to student grade', async () => {
            const response = await request(app)
                .get('/api/v1/assignments')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].title).toBe('Student Test Assignment');
            // Check if submission status is populated
            expect(response.body[0]).toHaveProperty('studentSubmission');
        });

        it('[POSITIVE] POST /api/v1/assignments/:id/submit should submit an assignment (On time)', async () => {
            // Because Multer is involved, we mock a form-data submission. 
            // In a real test we'd use .attach() for a buffer, but your controller 
            // gracefully handles `submissionUrl` fallback, so we'll test using that logic.
            
            // Mocking req.files logic by simulating multer payload or hitting the Cloudinary URL path
            // For Supertest handling the multer 'submission' field:
            const response = await request(app)
                .post(`/api/v1/assignments/${testAssignmentId}/submit`)
                .set('Authorization', `Bearer ${studentToken}`)
                .attach('submission', Buffer.from('fake pdf content'), 'my-work.pdf')
                .field('notes', 'Here is my homework!');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Assignment submitted successfully');
            expect(response.body.submissionStatus).toBe('on_time');
            expect(response.body.submission.notes).toBe('Here is my homework!');
            expect(response.body.submission.fileUrl).toBe('https://res.cloudinary.com/demo/raw/upload/test-file.pdf'); // From our Cloudinary mock
        });

        it('[POSITIVE] POST /api/v1/assignments/:id/submit should submit an assignment (Late)', async () => {
            // Change assignment due date to yesterday
            await Assignment.findByIdAndUpdate(testAssignmentId, {
                dueDate: new Date(Date.now() - 86400000)
            });

            const response = await request(app)
                .post(`/api/v1/assignments/${testAssignmentId}/submit`)
                .set('Authorization', `Bearer ${studentToken}`)
                .attach('submission', Buffer.from('fake pdf content'), 'my-late-work.pdf');

            expect(response.status).toBe(200);
            expect(response.body.submissionStatus).toBe('late');
            expect(response.body.submission.isLate).toBe(true);
        });

        it('[NEGATIVE] POST /api/v1/assignments/:id/submit should fail if no file is provided', async () => {
            const response = await request(app)
                .post(`/api/v1/assignments/${testAssignmentId}/submit`)
                .set('Authorization', `Bearer ${studentToken}`)
                // Sending just text, no file attached
                .field('notes', 'Forgot my attachment');

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Please upload your assignment work file');
        });

        it('[POSITIVE] GET /api/v1/assignments/:id/my-submission should return the student\'s submission', async () => {
            // Pre-seed a submission
            await AssignmentSubmission.create({
                assignment: testAssignmentId,
                student: studentId,
                fileUrl: 'http://my-submission.com/doc.pdf',
                notes: 'Test notes'
            });

            const response = await request(app)
                .get(`/api/v1/assignments/${testAssignmentId}/my-submission`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(response.body.submission.notes).toBe('Test notes');
            expect(response.body.submission.fileUrl).toBe('http://my-submission.com/doc.pdf');
        });
    });

    // ==========================================
    // 3. TEACHER SUBMISSION VIEWS
    // ==========================================
    describe('Teacher Submission Views', () => {
        let testAssignmentId;

        beforeEach(async () => {
            const assignment = await Assignment.create({ title: 'Grading Test', module: moduleId, createdBy: teacherId });
            testAssignmentId = assignment._id;

            await AssignmentSubmission.create({
                assignment: testAssignmentId,
                student: studentId,
                fileUrl: 'http://test.com/file.pdf'
            });
        });

        it('[POSITIVE] GET /api/v1/assignments/:id/submissions should allow teacher to view all submissions', async () => {
            const response = await request(app)
                .get(`/api/v1/assignments/${testAssignmentId}/submissions`)
                .set('Authorization', `Bearer ${teacherToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);
            expect(response.body[0].student.firstName).toBe('Peter'); // Populated student details
        });

        it('[NEGATIVE] GET /api/v1/assignments/:id/submissions should deny students access to all submissions', async () => {
            const response = await request(app)
                .get(`/api/v1/assignments/${testAssignmentId}/submissions`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(403); // Standard HTTP Forbidden
        });
    });
});