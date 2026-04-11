import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import User from '../../models/User.js';
import School from '../../models/School.js';
import { connectDBForTesting, disconnectDBForTesting, clearDBForTesting } from '../setup.js';

beforeAll(async () => {
    await connectDBForTesting();
    process.env.JWT_SECRET = 'test_secret_key_for_jwt_12345';
});

afterAll(async () => await disconnectDBForTesting());
afterEach(async () => await clearDBForTesting());

describe('Super Admin API Integration Tests', () => {
    let superAdminToken;
    let superAdminId;

    // Seed the database with a Super Admin and get a token before EVERY test
    beforeEach(async () => {
        const superAdmin = await User.create({
            firstName: 'Nick',
            lastName: 'Fury',
            email: 'fury@shield.com',
            phoneNumber: '0770000000',
            password: 'SuperSecretPassword1!',
            role: 'super_admin',
            isActive: true
        });
        superAdminId = superAdmin._id;

        const loginRes = await request(app)
            .post('/api/v1/auth/login')
            .send({ identifier: 'fury@shield.com', password: 'SuperSecretPassword1!' });

        superAdminToken = loginRes.body.accessToken;
    });

    // ==========================================
    // 1. SCHOOL MANAGEMENT TESTS
    // ==========================================
    describe('School Management', () => {
        it('[POSITIVE] POST /api/v1/admin/create-school should create a school and its admin', async () => {
            const payload = {
                schoolData: {
                    name: 'Xavier Institute',
                    contactEmail: 'info@xmen.com',
                    contactPhone: '0112233445',
                    address: { city: 'Westchester' }
                },
                adminData: {
                    firstName: 'Charles',
                    lastName: 'Xavier',
                    email: 'admin@xmen.com',
                    phoneNumber: '0774445555',
                    password: 'MindReader123!'
                }
            };

            const response = await request(app)
                .post('/api/v1/admin/create-school')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send(payload);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('School and Admin created successfully');
            expect(response.body.school.name).toBe('Xavier Institute');
            expect(response.body.school.isVerified).toBe(true);

            // Verify the new School Admin was created in the DB
            const schoolAdminInDb = await User.findOne({ email: 'admin@xmen.com' });
            expect(schoolAdminInDb).toBeTruthy();
            expect(schoolAdminInDb.role).toBe('school_admin');
            expect(schoolAdminInDb.school.toString()).toBe(response.body.school._id);
        });

        it('[NEGATIVE] POST /api/v1/admin/create-school should fail if school admin email is taken', async () => {
            // Take the email first
            await User.create({
                firstName: 'Taken', lastName: 'Email',
                email: 'admin@xmen.com', phoneNumber: '0779998888',
                password: 'Password123!', role: 'donor'
            });

            const payload = {
                schoolData: { name: 'New School' },
                adminData: {
                    firstName: 'Charles', lastName: 'Xavier',
                    email: 'admin@xmen.com', // Duplicate
                    phoneNumber: '0774445555', password: 'Password123!'
                }
            };

            const response = await request(app)
                .post('/api/v1/admin/create-school')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send(payload);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('School Admin email or phone already in use.');
        });

        it('[POSITIVE] GET & PUT & DELETE /api/v1/admin/schools should manage schools', async () => {
            // 1. Create a dummy school manually
            const school = await School.create({ name: 'Midtown High', isVerified: true });

            // 2. Test GET All
            const getRes = await request(app)
                .get('/api/v1/admin/schools')
                .set('Authorization', `Bearer ${superAdminToken}`);
            expect(getRes.status).toBe(200);
            expect(getRes.body.length).toBe(1);

            // 3. Test PUT (Update)
            const updateRes = await request(app)
                .put(`/api/v1/admin/schools/${school._id}`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                // Using .field() because the route uses uploadLogo (Multer) middleware
                .field('name', 'Midtown Science High')
                .field('isActive', 'false');
            
            expect(updateRes.status).toBe(200);
            expect(updateRes.body.school.name).toBe('Midtown Science High');
            expect(updateRes.body.school.isActive).toBe(false);

            // 4. Test DELETE
            const deleteRes = await request(app)
                .delete(`/api/v1/admin/schools/${school._id}`)
                .set('Authorization', `Bearer ${superAdminToken}`);
            
            expect(deleteRes.status).toBe(200);
            
            const schoolInDb = await School.findById(school._id);
            expect(schoolInDb).toBeNull();
        });
    });

    // ==========================================
    // 2. USER MANAGEMENT TESTS
    // ==========================================
    describe('User Management', () => {
        let dummyUserId;

        beforeEach(async () => {
            const dummy = await User.create({
                firstName: 'Steve', lastName: 'Rogers',
                email: 'steve@avengers.com', phoneNumber: '0771231234',
                password: 'CaptainPassword1!', role: 'donor',
                isActive: true, isLocked: false
            });
            dummyUserId = dummy._id;
        });

        it('[POSITIVE] POST /api/v1/admin/create-user should create a user directly', async () => {
            const response = await request(app)
                .post('/api/v1/admin/create-user')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({
                    firstName: 'Natasha', lastName: 'Romanoff',
                    email: 'natasha@avengers.com', phoneNumber: '0779997777',
                    password: 'BlackWidow123!', role: 'teacher'
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('User created successfully');
            
            const dbUser = await User.findOne({ email: 'natasha@avengers.com' });
            expect(dbUser).toBeTruthy();
            expect(dbUser.requiresPasswordChange).toBe(true);
        });

        it('[NEGATIVE] POST /api/v1/admin/create-user should fail to create student without grade', async () => {
            const response = await request(app)
                .post('/api/v1/admin/create-user')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({
                    firstName: 'Peter', lastName: 'Parker',
                    email: 'peter@avengers.com', phoneNumber: '0778889999',
                    password: 'SpiderMan123!', role: 'student'
                    // Missing 'grade' and 'level'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/Grade is required/);
        });

        it('[POSITIVE] PUT /api/v1/admin/users/:id should update user details', async () => {
            const response = await request(app)
                .put(`/api/v1/admin/users/${dummyUserId}`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ firstName: 'Captain' });

            expect(response.status).toBe(200);
            expect(response.body.user.firstName).toBe('Captain');
        });

        it('[POSITIVE] DELETE /api/v1/admin/users/:id should hard delete the user', async () => {
            const response = await request(app)
                .delete(`/api/v1/admin/users/${dummyUserId}`)
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(response.status).toBe(200);

            const checkUser = await User.findById(dummyUserId);
            expect(checkUser).toBeNull(); // Hard deleted
        });
    });

    // ==========================================
    // 3. USER STATUS & SECURITY TESTS
    // ==========================================
    describe('User Status Toggles', () => {
        let toggleUserId;

        beforeEach(async () => {
            const user = await User.create({
                firstName: 'Bruce', lastName: 'Banner',
                email: 'bruce@avengers.com', phoneNumber: '0770001111',
                password: 'HulkSmash123!', role: 'donor',
                isActive: true, isLocked: false, isDeleted: true // Starting as deleted for restore test
            });
            toggleUserId = user._id;
        });

        it('[POSITIVE] PATCH toggle-status should swap isActive', async () => {
            const response = await request(app)
                .patch(`/api/v1/admin/users/${toggleUserId}/toggle-status`)
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(response.status).toBe(200);
            
            const dbUser = await User.findById(toggleUserId);
            expect(dbUser.isActive).toBe(false); // Flipped from true to false
        });

        it('[POSITIVE] PATCH toggle-lock should swap isLocked', async () => {
            const response = await request(app)
                .patch(`/api/v1/admin/users/${toggleUserId}/toggle-lock`)
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(response.status).toBe(200);
            
            const dbUser = await User.findById(toggleUserId);
            expect(dbUser.isLocked).toBe(true); // Flipped from false to true
        });

        it('[POSITIVE] PATCH restore should set isDeleted to false', async () => {
            const response = await request(app)
                .patch(`/api/v1/admin/users/${toggleUserId}/restore`)
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(response.status).toBe(200);
            
            const dbUser = await User.findById(toggleUserId);
            expect(dbUser.isDeleted).toBe(false);
            expect(dbUser.isActive).toBe(true);
        });

        it('[NEGATIVE] Admins cannot toggle their own lock status', async () => {
            const response = await request(app)
                .patch(`/api/v1/admin/users/${superAdminId}/toggle-lock`) // Target self
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('You cannot lock or unlock your own account.');
        });
    });

    // ==========================================
    // 4. UTILITY ROUTES TESTS
    // ==========================================
    describe('Frontend Utility Checks', () => {
        beforeEach(async () => {
            await User.create({
                firstName: 'Thor', lastName: 'Odinson',
                email: 'thor@asgard.com', phoneNumber: '0779998888',
                password: 'Thunder123!', role: 'donor'
            });
        });

        it('[POSITIVE] POST /check-email should return exists: true for taken email', async () => {
            const response = await request(app)
                .post('/api/v1/admin/check-email')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ email: 'thor@asgard.com' });

            expect(response.status).toBe(200);
            expect(response.body.exists).toBe(true);
        });

        it('[POSITIVE] POST /check-email should return exists: false for available email', async () => {
            const response = await request(app)
                .post('/api/v1/admin/check-email')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ email: 'loki@asgard.com' });

            expect(response.status).toBe(200);
            expect(response.body.exists).toBe(false);
        });

        it('[POSITIVE] POST /check-phone should return exists: true for taken phone', async () => {
            const response = await request(app)
                .post('/api/v1/admin/check-phone')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ phoneNumber: '0779998888' });

            expect(response.status).toBe(200);
            expect(response.body.exists).toBe(true);
        });
    });
});