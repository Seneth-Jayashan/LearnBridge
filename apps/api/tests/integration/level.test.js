import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import User from '../../models/User.js';
import Level from '../../models/Level.js';
import { connectDBForTesting, disconnectDBForTesting, clearDBForTesting } from '../setup.js';

beforeAll(async () => {
    await connectDBForTesting();
    process.env.JWT_SECRET = 'test_secret_key_for_jwt_12345';
});

afterAll(async () => await disconnectDBForTesting());
afterEach(async () => await clearDBForTesting());

describe('Level API Integration Tests', () => {
    let superAdminToken, regularUserToken;

    beforeEach(async () => {
        // 1. Create a Super Admin for restricted management routes
        await User.create({
            firstName: 'Nick', lastName: 'Fury', email: 'fury@shield.com',
            phoneNumber: '0770000000', password: 'SuperSecretPassword1!',
            role: 'super_admin', isActive: true
        });
        const saLogin = await request(app).post('/api/v1/auth/login').send({ identifier: 'fury@shield.com', password: 'SuperSecretPassword1!' });
        superAdminToken = saLogin.body.accessToken;

        // 2. Create a Regular User (Student) to test public read access & write restrictions
        const student = await User.create({
            firstName: 'Peter', lastName: 'Parker', email: 'peter@avengers.com',
            phoneNumber: '0773334444', password: 'SpiderMan123!',
            role: 'student', isActive: true
        });
        const studentLogin = await request(app).post('/api/v1/auth/login').send({ identifier: student.regNumber, password: 'SpiderMan123!' });
        regularUserToken = studentLogin.body.accessToken;
    });

    // ==========================================
    // 1. CREATE LEVEL TESTS
    // ==========================================
    describe('POST /api/v1/levels', () => {
        it('[POSITIVE] should allow super_admin to create a new level', async () => {
            const response = await request(app)
                .post('/api/v1/levels')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ name: 'Middle School', description: 'Grades 6 through 8' });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Level created successfully');
            expect(response.body.level.name).toBe('Middle School');

            const dbLevel = await Level.findById(response.body.level._id);
            expect(dbLevel).toBeTruthy();
        });

        it('[NEGATIVE] should prevent duplicate level names', async () => {
            await Level.create({ name: 'High School' });

            const response = await request(app)
                .post('/api/v1/levels')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ name: 'High School' });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Level with this name already exists');
        });

        it('[NEGATIVE] should block non-admins from creating levels', async () => {
            const response = await request(app)
                .post('/api/v1/levels')
                .set('Authorization', `Bearer ${regularUserToken}`)
                .send({ name: 'University' });

            expect(response.status).toBe(403); 
        });

        it('[NEGATIVE] should fail Zod validation if name is missing', async () => {
            const response = await request(app)
                .post('/api/v1/levels')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ description: 'Missing name completely' });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Validation Error');
            expect(response.body.errors[0].message).toMatch(/Invalid input: expected string, received undefined/);
        });
    });

    // ==========================================
    // 2. READ LEVEL TESTS
    // ==========================================
    describe('GET /api/v1/levels', () => {
        let testLevelId;

        beforeEach(async () => {
            const level = await Level.create({ name: 'Primary', description: 'Early education' });
            testLevelId = level._id;
            await Level.create({ name: 'Secondary' });
        });

        it('[POSITIVE] should allow any authenticated user to get all levels', async () => {
            const response = await request(app)
                .get('/api/v1/levels')
                .set('Authorization', `Bearer ${regularUserToken}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(2);
        });

        it('[POSITIVE] should allow fetching a specific level by ID', async () => {
            const response = await request(app)
                .get(`/api/v1/levels/${testLevelId}`)
                .set('Authorization', `Bearer ${regularUserToken}`);

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Primary');
        });

        it('[NEGATIVE] should return 404 for a non-existent level ID', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/v1/levels/${fakeId}`)
                .set('Authorization', `Bearer ${regularUserToken}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Level not found');
        });
    });

    // ==========================================
    // 3. UPDATE LEVEL TESTS
    // ==========================================
    describe('PUT /api/v1/levels/:id', () => {
        let testLevelId;

        beforeEach(async () => {
            const level = await Level.create({ name: 'Pre-School', description: 'Kindergarten' });
            testLevelId = level._id;
        });

        it('[POSITIVE] should allow super_admin to update a level', async () => {
            const response = await request(app)
                .put(`/api/v1/levels/${testLevelId}`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ name: 'Early Childhood', description: 'Ages 3 to 5' });

            expect(response.status).toBe(200);
            expect(response.body.level.name).toBe('Early Childhood');
            expect(response.body.level.description).toBe('Ages 3 to 5');
        });

        it('[NEGATIVE] should prevent updating to an already existing name', async () => {
            await Level.create({ name: 'Nursery' });

            const response = await request(app)
                .put(`/api/v1/levels/${testLevelId}`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ name: 'Nursery' }); // Trying to take Nursery's name

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Level with this name already exists');
        });

        it('[NEGATIVE] should prevent non-admins from updating a level', async () => {
            const response = await request(app)
                .put(`/api/v1/levels/${testLevelId}`)
                .set('Authorization', `Bearer ${regularUserToken}`)
                .send({ name: 'Hacked Name' });

            expect(response.status).toBe(403);
        });
    });

    // ==========================================
    // 4. DELETE LEVEL TESTS
    // ==========================================
    describe('DELETE /api/v1/levels/:id', () => {
        let testLevelId;

        beforeEach(async () => {
            const level = await Level.create({ name: 'Level To Delete' });
            testLevelId = level._id;
        });

        it('[POSITIVE] should allow super_admin to delete a level', async () => {
            const response = await request(app)
                .delete(`/api/v1/levels/${testLevelId}`)
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Level deleted successfully');

            const dbCheck = await Level.findById(testLevelId);
            expect(dbCheck).toBeNull();
        });

        it('[NEGATIVE] should block non-admins from deleting a level', async () => {
            const response = await request(app)
                .delete(`/api/v1/levels/${testLevelId}`)
                .set('Authorization', `Bearer ${regularUserToken}`);

            expect(response.status).toBe(403);
            
            // Ensure it wasn't actually deleted
            const dbCheck = await Level.findById(testLevelId);
            expect(dbCheck).toBeTruthy();
        });
    });

    // ==========================================
    // 5. SEED DEFAULTS TESTS
    // ==========================================
    describe('POST /api/v1/levels/seed-defaults', () => {
        it('[POSITIVE] should create the 4 default levels on an empty DB', async () => {
            const response = await request(app)
                .post('/api/v1/levels/seed-defaults')
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.created).toBe(4);
            expect(response.body.updated).toBe(0);

            const count = await Level.countDocuments();
            expect(count).toBe(4);
        });

        it('[POSITIVE] should be idempotent and update existing instead of duplicating', async () => {
            // First run
            await request(app)
                .post('/api/v1/levels/seed-defaults')
                .set('Authorization', `Bearer ${superAdminToken}`);
            
            // Modify one level manually
            await Level.updateOne({ name: 'Primary Education' }, { description: 'Tampered Description' });

            // Second run
            const response = await request(app)
                .post('/api/v1/levels/seed-defaults')
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.created).toBe(0); 
            expect(response.body.updated).toBe(4); // Seed now normalizes all default descriptions
            
            const count = await Level.countDocuments();
            expect(count).toBe(4); // Still 4 total
        });
    });
});