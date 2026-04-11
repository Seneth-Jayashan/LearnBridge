import request from 'supertest';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import { connectDBForTesting, disconnectDBForTesting, clearDBForTesting } from '../setup.js';

// Mock Cloudinary Service
jest.unstable_mockModule('../../services/CloudinaryService.js', () => ({
    uploadFileToCloudinary: jest.fn().mockResolvedValue({ secure_url: 'https://res.cloudinary.com/demo/raw/upload/test-media.pdf' }),
    deleteCloudinaryAssetFromUrl: jest.fn().mockResolvedValue(true),
    getCloudinaryFileNameFromUrl: jest.fn().mockReturnValue('test-media.pdf'),
    createSignedDownloadUrlFromCloudinaryUrl: jest.fn().mockReturnValue('https://res.cloudinary.com/signed-url/test-media.pdf'),
}));

// Mock Zoom Service
jest.unstable_mockModule('../../services/ZoomService.js', () => ({
    createZoomMeeting: jest.fn().mockResolvedValue({
        id: '987654321',
        join_url: 'https://zoom.us/j/987654321',
        start_url: 'https://zoom.us/s/987654321',
        password: 'securepassword',
        start_time: '2026-05-01T10:00:00Z',
        duration: 60
    })
}));

const { default: app } = await import('../../server.js');
const { default: User } = await import('../../models/User.js');
const { default: Grade } = await import('../../models/Grade.js');
const { default: Module } = await import('../../models/Module.js');
const { default: Lesson } = await import('../../models/Lesson.js');

beforeAll(async () => {
    await connectDBForTesting();
    process.env.JWT_SECRET = 'test_secret_key_for_jwt_12345';
});

afterAll(async () => await disconnectDBForTesting());
afterEach(async () => await clearDBForTesting());

describe('Lesson API Integration Tests', () => {
    let superAdminToken, teacherToken, teacher2Token, studentToken;
    let teacherId, teacher2Id, gradeId, moduleId;

    beforeEach(async () => {
        // 1. Create Grade & Module
        const grade = await Grade.create({ name: 'Grade 11' });
        gradeId = grade._id;

        const module = await Module.create({
            name: 'Physics',
            grade: gradeId,
            description: 'Mechanics'
        });
        moduleId = module._id;

        // 2. Create Users
        await User.create({
            firstName: 'Nick', lastName: 'Fury', email: 'fury@shield.com',
            phoneNumber: '0770000000', password: 'SuperSecretPassword1!',
            role: 'super_admin', isActive: true
        });
        const saLogin = await request(app).post('/api/v1/auth/login').send({ identifier: 'fury@shield.com', password: 'SuperSecretPassword1!' });
        superAdminToken = saLogin.body.accessToken;

        const t1 = await User.create({
            firstName: 'Tony', lastName: 'Stark', email: 'tony@avengers.com',
            phoneNumber: '0771112222', password: 'IronMan123!',
            role: 'teacher', isActive: true
        });
        teacherId = t1._id;
        const t1Login = await request(app).post('/api/v1/auth/login').send({ identifier: 'tony@avengers.com', password: 'IronMan123!' });
        teacherToken = t1Login.body.accessToken;

        const t2 = await User.create({
            firstName: 'Bruce', lastName: 'Banner', email: 'bruce@avengers.com',
            phoneNumber: '0772223333', password: 'HulkSmash123!',
            role: 'teacher', isActive: true
        });
        teacher2Id = t2._id;
        const t2Login = await request(app).post('/api/v1/auth/login').send({ identifier: 'bruce@avengers.com', password: 'HulkSmash123!' });
        teacher2Token = t2Login.body.accessToken;

        const student = await User.create({
            firstName: 'Peter', lastName: 'Parker', email: 'peter@avengers.com',
            phoneNumber: '0773334444', password: 'SpiderMan123!',
            role: 'student', grade: gradeId, isActive: true
        });
        const studentLogin = await request(app).post('/api/v1/auth/login').send({ identifier: student.regNumber, password: 'SpiderMan123!' });
        studentToken = studentLogin.body.accessToken;
    });

    // ==========================================
    // 1. CREATE LESSON TESTS
    // ==========================================
    describe('POST /api/v1/lessons', () => {
        it('[POSITIVE] should create a lesson with a material URL', async () => {
            const response = await request(app)
                .post('/api/v1/lessons')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    title: 'Intro to Mechanics',
                    module: moduleId.toString(),
                    materialUrl: 'https://example.com/notes.pdf'
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Lesson created successfully');
            expect(response.body.lesson.title).toBe('Intro to Mechanics');
        });

        it('[POSITIVE] should create a lesson with an integrated Zoom meeting', async () => {
            const response = await request(app)
                .post('/api/v1/lessons')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    title: 'Live Q&A Session',
                    module: moduleId.toString(),
                    videoUrl: 'https://example.com/recording.mp4',
                    createZoomMeeting: true,
                    zoomStartTime: new Date(Date.now() + 86400000).toISOString()
                });

            expect(response.status).toBe(201);
            expect(response.body.onlineMeeting).toBeTruthy();
            expect(response.body.onlineMeeting.meetingId).toBe('987654321');
        });

        it('[NEGATIVE] should fail if neither material nor video is provided', async () => {
            const response = await request(app)
                .post('/api/v1/lessons')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    title: 'Empty Lesson',
                    module: moduleId.toString()
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/Please upload at least one lesson resource/i);
        });

        it('[NEGATIVE] should fail Zod validation if createZoomMeeting is true but no time is provided', async () => {
            const response = await request(app)
                .post('/api/v1/lessons')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    title: 'Missing Time Lesson',
                    module: moduleId.toString(),
                    materialUrl: 'https://test.com/file.pdf',
                    createZoomMeeting: true
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Validation Error');
            expect(response.body.errors[0].message).toMatch(/Zoom date\/time is required/i);
        });
    });

    // ==========================================
    // 2. READ LESSON TESTS
    // ==========================================
    describe('GET /api/v1/lessons', () => {
        let lessonId;

        beforeEach(async () => {
            const lesson = await Lesson.create({
                title: 'Newton Laws',
                module: moduleId,
                materialUrl: 'https://test.com/newton.pdf',
                createdBy: teacherId
            });
            lessonId = lesson._id;
        });

        it('[POSITIVE] should allow a student to fetch lessons matching their grade', async () => {
            const response = await request(app)
                .get('/api/v1/lessons')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].title).toBe('Newton Laws');
        });

        it('[NEGATIVE] should deny a student from fetching a specific lesson by ID', async () => {
            const response = await request(app)
                .get(`/api/v1/lessons/${lessonId}`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(403);
        });
    });

    // ==========================================
    // 3. UPDATE LESSON TESTS
    // ==========================================
    describe('PUT /api/v1/lessons/:id', () => {
        let lessonId;

        beforeEach(async () => {
            const lesson = await Lesson.create({
                title: 'Old Title',
                module: moduleId,
                materialUrl: 'https://test.com/doc.pdf',
                createdBy: teacherId
            });
            lessonId = lesson._id;
        });

        it('[POSITIVE] should allow the creator teacher to update the lesson', async () => {
            const response = await request(app)
                .put(`/api/v1/lessons/${lessonId}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({ title: 'Updated Title' });

            expect(response.status).toBe(200);
            expect(response.body.lesson.title).toBe('Updated Title');
        });

        it('[NEGATIVE] should prevent another teacher from updating the lesson', async () => {
            const response = await request(app)
                .put(`/api/v1/lessons/${lessonId}`)
                .set('Authorization', `Bearer ${teacher2Token}`) // Teacher 2
                .send({ title: 'Hacked Title' });

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('You do not have permission to update this lesson');
        });
    });

    // ==========================================
    // 4. DELETE LESSON TESTS
    // ==========================================
    describe('DELETE /api/v1/lessons/:id', () => {
        let lessonId;

        beforeEach(async () => {
            const lesson = await Lesson.create({
                title: 'To Be Deleted',
                module: moduleId,
                materialUrl: 'https://test.com/doc.pdf',
                createdBy: teacherId
            });
            lessonId = lesson._id;
        });

        it('[POSITIVE] should allow super_admin to delete any lesson', async () => {
            const response = await request(app)
                .delete(`/api/v1/lessons/${lessonId}`)
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(response.status).toBe(200);
            
            const dbCheck = await Lesson.findById(lessonId);
            expect(dbCheck).toBeNull();
        });

        it('[NEGATIVE] should prevent unauthorized teacher from deleting', async () => {
            const response = await request(app)
                .delete(`/api/v1/lessons/${lessonId}`)
                .set('Authorization', `Bearer ${teacher2Token}`);

            expect(response.status).toBe(403);
        });
    });

    // ==========================================
    // 5. DOWNLOAD ROUTES
    // ==========================================
    describe('Download Routes', () => {
        let lessonId;

        beforeEach(async () => {
            const lesson = await Lesson.create({
                title: 'Downloads Lesson',
                module: moduleId,
                materialUrl: 'https://test.com/doc.pdf',
                videoUrl: 'https://test.com/vid.mp4',
                createdBy: teacherId
            });
            lessonId = lesson._id;
        });

        it('[POSITIVE] should provide signed URL for material download', async () => {
            const response = await request(app)
                .get(`/api/v1/lessons/${lessonId}/material-download`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('downloadUrl');
        });

        it('[POSITIVE] should provide video URL', async () => {
            const response = await request(app)
                .get(`/api/v1/lessons/${lessonId}/video-download`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(response.body.downloadUrl).toBe('https://test.com/vid.mp4');
        });
    });
});