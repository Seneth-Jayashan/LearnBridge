import request from 'supertest';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import { connectDBForTesting, disconnectDBForTesting, clearDBForTesting } from '../setup.js';

// Mock Cloudinary Service to prevent actual network requests
jest.unstable_mockModule('../../services/CloudinaryService.js', () => ({
    uploadFileToCloudinary: jest.fn().mockResolvedValue({ secure_url: 'https://res.cloudinary.com/demo/raw/upload/kb-attachment.pdf' }),
    deleteCloudinaryAssetFromUrl: jest.fn().mockResolvedValue(true),
    getCloudinaryFileNameFromUrl: jest.fn().mockReturnValue('kb-attachment.pdf'),
    createSignedDownloadUrlFromCloudinaryUrl: jest.fn().mockReturnValue('https://res.cloudinary.com/signed-url/kb-attachment.pdf'),
}));

const { default: app } = await import('../../server.js');
const { default: User } = await import('../../models/User.js');
const { default: KnowledgeBase } = await import('../../models/KnowledgeBase.js');
const { default: Lesson } = await import('../../models/Lesson.js'); // Needed for the delete dependency check

beforeAll(async () => {
    await connectDBForTesting();
    process.env.JWT_SECRET = 'test_secret_key_for_jwt_12345';
});

afterAll(async () => await disconnectDBForTesting());
afterEach(async () => await clearDBForTesting());

describe('Knowledge Base API Integration Tests', () => {
    let superAdminToken, teacherToken, teacher2Token, studentToken;
    let superAdminId, teacherId, teacher2Id;

    beforeEach(async () => {
        // 1. Create Super Admin
        const sa = await User.create({
            firstName: 'Nick', lastName: 'Fury', email: 'fury@shield.com',
            phoneNumber: '0770000000', password: 'SuperSecretPassword1!',
            role: 'super_admin', isActive: true
        });
        superAdminId = sa._id;
        const saLogin = await request(app).post('/api/v1/auth/login').send({ identifier: 'fury@shield.com', password: 'SuperSecretPassword1!' });
        superAdminToken = saLogin.body.accessToken;

        // 2. Create Teacher 1
        const t1 = await User.create({
            firstName: 'Tony', lastName: 'Stark', email: 'tony@avengers.com',
            phoneNumber: '0771112222', password: 'IronMan123!',
            role: 'teacher', isActive: true
        });
        teacherId = t1._id;
        const t1Login = await request(app).post('/api/v1/auth/login').send({ identifier: 'tony@avengers.com', password: 'IronMan123!' });
        teacherToken = t1Login.body.accessToken;

        // 3. Create Teacher 2 (For RBAC tests)
        const t2 = await User.create({
            firstName: 'Bruce', lastName: 'Banner', email: 'bruce@avengers.com',
            phoneNumber: '0772223333', password: 'HulkSmash123!',
            role: 'teacher', isActive: true
        });
        teacher2Id = t2._id;
        const t2Login = await request(app).post('/api/v1/auth/login').send({ identifier: 'bruce@avengers.com', password: 'HulkSmash123!' });
        teacher2Token = t2Login.body.accessToken;

        // 4. Create Student (Should only access public routes)
        const student = await User.create({
            firstName: 'Peter', lastName: 'Parker', email: 'peter@avengers.com',
            phoneNumber: '0773334444', password: 'SpiderMan123!',
            role: 'student', isActive: true
        });
        const studentLogin = await request(app).post('/api/v1/auth/login').send({ identifier: student.regNumber, password: 'SpiderMan123!' });
        studentToken = studentLogin.body.accessToken;
    });

    // ==========================================
    // 1. PUBLIC ROUTES TESTS
    // ==========================================
    describe('Public Routes (GET /api/v1/knowledge-base/public)', () => {
        let publishedEntryId, unpublishedEntryId;

        beforeEach(async () => {
            const pubEntry = await KnowledgeBase.create({
                title: 'How to Use LearnBridge',
                content: 'Step 1: Login...',
                category: 'Guides',
                isPublished: true,
                createdBy: superAdminId,
                attachmentUrl: ['https://res.cloudinary.com/demo/raw/upload/guide.pdf']
            });
            publishedEntryId = pubEntry._id;

            const unpubEntry = await KnowledgeBase.create({
                title: 'Draft: Future Updates',
                content: 'Coming soon...',
                isPublished: false,
                createdBy: superAdminId
            });
            unpublishedEntryId = unpubEntry._id;
        });

        it('[POSITIVE] should fetch only published entries', async () => {
            const response = await request(app).get('/api/v1/knowledge-base/public');

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].title).toBe('How to Use LearnBridge');
        });

        it('[POSITIVE] should allow searching public entries via query string', async () => {
            const response = await request(app).get('/api/v1/knowledge-base/public?q=LearnBridge');

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
        });

        it('[POSITIVE] should get a signed download URL for a public attachment', async () => {
            const response = await request(app).get(`/api/v1/knowledge-base/public/${publishedEntryId}/attachment-download`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('downloadUrl');
            expect(response.body.downloadUrl).toMatch(/signed-url/);
        });

        it('[NEGATIVE] should deny attachment download for unpublished entries', async () => {
            const response = await request(app).get(`/api/v1/knowledge-base/public/${unpublishedEntryId}/attachment-download`);

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Article is not public');
        });
    });

    // ==========================================
    // 2. MANAGEMENT: CREATE ENTRY
    // ==========================================
    describe('POST /api/v1/knowledge-base', () => {
        it('[POSITIVE] should allow a teacher to create an entry with an attachment', async () => {
            const response = await request(app)
                .post('/api/v1/knowledge-base')
                .set('Authorization', `Bearer ${teacherToken}`)
                .field('title', 'Physics 101')
                .field('content', 'Gravity is a force...')
                .field('category', 'Science')
                .field('isPublished', 'true')
                .attach('attachment', Buffer.from('fake doc content'), 'physics.pdf');

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Knowledge base entry created');
            expect(response.body.entry.title).toBe('Physics 101');
            expect(response.body.entry.attachmentUrl[0]).toBe('https://res.cloudinary.com/demo/raw/upload/kb-attachment.pdf'); // Mocked
        });

        it('[NEGATIVE] should fail Zod validation if content is missing', async () => {
            const response = await request(app)
                .post('/api/v1/knowledge-base')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({ title: 'No Content Entry' });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Validation Error');
            expect(response.body.errors[0].message).toMatch(/Invalid input: expected string, received undefined/);
        });

        it('[NEGATIVE] should forbid students from creating entries', async () => {
            const response = await request(app)
                .post('/api/v1/knowledge-base')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ title: 'Student Hack', content: 'Trying to bypass auth' });

            expect(response.status).toBe(403);
        });
    });

    // ==========================================
    // 3. MANAGEMENT: READ ENTRIES
    // ==========================================
    describe('GET /api/v1/knowledge-base (Protected)', () => {
        beforeEach(async () => {
            await KnowledgeBase.create({ title: 'Teacher 1 Article', content: '...', createdBy: teacherId });
            await KnowledgeBase.create({ title: 'Teacher 2 Article', content: '...', createdBy: teacher2Id });
        });

        it('[POSITIVE] should fetch entries scoped to the teacher', async () => {
            const response = await request(app)
                .get('/api/v1/knowledge-base')
                .set('Authorization', `Bearer ${teacherToken}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].title).toBe('Teacher 1 Article');
        });

        it('[POSITIVE] should allow super_admin to see all entries', async () => {
            const response = await request(app)
                .get('/api/v1/knowledge-base')
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(2);
        });
    });

    // ==========================================
    // 4. MANAGEMENT: UPDATE ENTRY
    // ==========================================
    describe('PUT /api/v1/knowledge-base/:id', () => {
        let entryId;

        beforeEach(async () => {
            const entry = await KnowledgeBase.create({
                title: 'Initial Title',
                content: 'Initial Content',
                createdBy: teacherId
            });
            entryId = entry._id;
        });

        it('[POSITIVE] should allow a teacher to update their own entry', async () => {
            const response = await request(app)
                .put(`/api/v1/knowledge-base/${entryId}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({ title: 'Updated Title' });

            expect(response.status).toBe(200);
            expect(response.body.entry.title).toBe('Updated Title');
        });

        it('[NEGATIVE] should prevent a teacher from updating another teacher\'s entry', async () => {
            const response = await request(app)
                .put(`/api/v1/knowledge-base/${entryId}`)
                .set('Authorization', `Bearer ${teacher2Token}`) // Wrong teacher
                .send({ title: 'Hacked Title' });

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('You do not have permission to update this entry');
        });
    });

    // ==========================================
    // 5. MANAGEMENT: DELETE ENTRY
    // ==========================================
    describe('DELETE /api/v1/knowledge-base/:id', () => {
        let entryId;

        beforeEach(async () => {
            const entry = await KnowledgeBase.create({
                title: 'To Be Deleted',
                content: 'Trash content',
                createdBy: teacherId,
                attachmentUrl: ['https://test.com/file.pdf']
            });
            entryId = entry._id;
        });

        it('[POSITIVE] should allow super_admin to delete any entry', async () => {
            const response = await request(app)
                .delete(`/api/v1/knowledge-base/${entryId}`)
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Knowledge base entry deleted');

            const dbEntry = await KnowledgeBase.findById(entryId);
            expect(dbEntry).toBeNull();
        });

        it('[NEGATIVE] should prevent a teacher from deleting another teacher\'s entry', async () => {
            const response = await request(app)
                .delete(`/api/v1/knowledge-base/${entryId}`)
                .set('Authorization', `Bearer ${teacher2Token}`); // Wrong teacher

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('You do not have permission to delete this entry');
        });
    });
});