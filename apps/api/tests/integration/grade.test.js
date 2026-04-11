import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import User from '../../models/User.js';
import Grade from '../../models/Grade.js';
import { connectDBForTesting, disconnectDBForTesting, clearDBForTesting } from '../setup.js';

beforeAll(async () => {
    await connectDBForTesting();
    process.env.JWT_SECRET = 'test_secret_key_for_jwt_12345';
});

afterAll(async () => await disconnectDBForTesting());
afterEach(async () => await clearDBForTesting());

describe('Grade API Integration Tests', () => {
    let superAdminToken, regularUserToken;

    beforeEach(async () => {
        // 1. Create a Super Admin for restricted routes
        await User.create({
            firstName: 'Nick', lastName: 'Fury', email: 'fury@shield.com',
            phoneNumber: '0770000000', password: 'SuperSecretPassword1!',
            role: 'super_admin', isActive: true
        });
        const saLogin = await request(app).post('/api/v1/auth/login').send({ identifier: 'fury@shield.com', password: 'SuperSecretPassword1!' });
        superAdminToken = saLogin.body.accessToken;

        // 2. Create a Regular User (Student) to test access restrictions
        const student = await User.create({
            firstName: 'Peter', lastName: 'Parker', email: 'peter@avengers.com',
            phoneNumber: '0773334444', password: 'SpiderMan123!',
            role: 'student', isActive: true
        });
        const studentLogin = await request(app).post('/api/v1/auth/login').send({ identifier: student.regNumber, password: 'SpiderMan123!' });
        regularUserToken = studentLogin.body.accessToken;
    });

    // ==========================================
    // 1. CREATE GRADE TESTS
    // ==========================================
    describe('POST /api/v1/grades', () => {
        it('[POSITIVE] should allow super_admin to create a new grade', async () => {
            const response = await request(app)
                .post('/api/v1/grades')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ name: 'Grade 10', description: 'O-Level Preparation' });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Grade created successfully');
            expect(response.body.grade.name).toBe('Grade 10');

            const dbGrade = await Grade.findById(response.body.grade._id);
            expect(dbGrade).toBeTruthy();
        });

        it('[NEGATIVE] should prevent duplicate grade names', async () => {
            await Grade.create({ name: 'Grade 11' });

            const response = await request(app)
                .post('/api/v1/grades')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ name: 'Grade 11' });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Grade with this name already exists');
        });

        it('[NEGATIVE] should block non-admins from creating grades', async () => {
            const response = await request(app)
                .post('/api/v1/grades')
                .set('Authorization', `Bearer ${regularUserToken}`)
                .send({ name: 'Grade 12' });

            expect(response.status).toBe(403); 
        });

        it('[NEGATIVE] should fail Zod validation if name is missing', async () => {
            const response = await request(app)
                .post('/api/v1/grades')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ description: 'Missing name' });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Validation Error');
            expect(response.body.errors[0].message).toMatch(/Invalid input: expected string, received undefined/);
        });
    });

    // ==========================================
    // 2. READ GRADE TESTS
    // ==========================================
    describe('GET /api/v1/grades', () => {
        let testGradeId;

        beforeEach(async () => {
            const grade = await Grade.create({ name: 'Grade 9', description: 'Middle School' });
            testGradeId = grade._id;
            await Grade.create({ name: 'Grade 8' });
        });

        it('[POSITIVE] should allow any authenticated user to get all grades', async () => {
            const response = await request(app)
                .get('/api/v1/grades')
                .set('Authorization', `Bearer ${regularUserToken}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(2);
        });

        it('[POSITIVE] should allow fetching a specific grade by ID', async () => {
            const response = await request(app)
                .get(`/api/v1/grades/${testGradeId}`)
                .set('Authorization', `Bearer ${regularUserToken}`);

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Grade 9');
        });

        it('[NEGATIVE] should return 404 for a non-existent grade ID', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/v1/grades/${fakeId}`)
                .set('Authorization', `Bearer ${regularUserToken}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Grade not found');
        });
    });

    // ==========================================
    // 3. UPDATE GRADE TESTS
    // ==========================================
    describe('PUT /api/v1/grades/:id', () => {
        let testGradeId;

        beforeEach(async () => {
            const grade = await Grade.create({ name: 'Grade 7', description: 'Old Description' });
            testGradeId = grade._id;
        });

        it('[POSITIVE] should allow super_admin to update a grade', async () => {
            const response = await request(app)
                .put(`/api/v1/grades/${testGradeId}`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ name: 'Grade 7 Advanced', description: 'New Description' });

            expect(response.status).toBe(200);
            expect(response.body.grade.name).toBe('Grade 7 Advanced');
            expect(response.body.grade.description).toBe('New Description');
        });

        it('[NEGATIVE] should prevent updating to an already existing name', async () => {
            await Grade.create({ name: 'Grade 6' });

            const response = await request(app)
                .put(`/api/v1/grades/${testGradeId}`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ name: 'Grade 6' }); // Trying to take Grade 6's name

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Grade with this name already exists');
        });
    });

    // ==========================================
    // 4. DELETE GRADE TESTS
    // ==========================================
    describe('DELETE /api/v1/grades/:id', () => {
        let testGradeId;

        beforeEach(async () => {
            const grade = await Grade.create({ name: 'Grade 5' });
            testGradeId = grade._id;
        });

        it('[POSITIVE] should allow super_admin to delete a grade', async () => {
            const response = await request(app)
                .delete(`/api/v1/grades/${testGradeId}`)
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Grade deleted successfully');

            const dbCheck = await Grade.findById(testGradeId);
            expect(dbCheck).toBeNull();
        });

        it('[NEGATIVE] should block non-admins from deleting a grade', async () => {
            const response = await request(app)
                .delete(`/api/v1/grades/${testGradeId}`)
                .set('Authorization', `Bearer ${regularUserToken}`);

            expect(response.status).toBe(403);
            
            // Ensure it wasn't deleted
            const dbCheck = await Grade.findById(testGradeId);
            expect(dbCheck).toBeTruthy();
        });
    });

    // ==========================================
    // 5. SEED DEFAULTS TESTS
    // ==========================================
    describe('POST /api/v1/grades/seed-defaults', () => {
        it('[POSITIVE] should create 13 default grades on empty DB', async () => {
            const response = await request(app)
                .post('/api/v1/grades/seed-defaults')
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.created).toBe(13);
            expect(response.body.updated).toBe(0);

            const count = await Grade.countDocuments();
            expect(count).toBe(13);
        });

        it('[POSITIVE] should be idempotent and update existing instead of duplicating', async () => {
            // First run
            await request(app)
                .post('/api/v1/grades/seed-defaults')
                .set('Authorization', `Bearer ${superAdminToken}`);
            
            // Modify one grade manually
            await Grade.updateOne({ name: '1' }, { description: 'Hacked Description' });

            // Second run
            const response = await request(app)
                .post('/api/v1/grades/seed-defaults')
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.created).toBe(0); 
            expect(response.body.updated).toBe(13); // Seed now normalizes all default descriptions
            
            const count = await Grade.countDocuments();
            expect(count).toBe(13); // Still 13
        });
    });
});