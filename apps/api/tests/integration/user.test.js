import request from 'supertest';
import app from '../../server.js';
import mongoose from 'mongoose';
import User from '../../models/User.js'; // Adjust path based on your folder structure
import { connectDBForTesting, disconnectDBForTesting, clearDBForTesting } from '../setup.js';

beforeAll(async () => {
    await connectDBForTesting();
    process.env.JWT_SECRET = 'test_secret_key_for_jwt_12345';
});

afterAll(async () => await disconnectDBForTesting());
afterEach(async () => await clearDBForTesting());

describe('User API Integration Tests', () => {

    // ==========================================
    // 1. PUBLIC REGISTRATION (Donors & Teachers)
    // ==========================================
    describe('POST /api/v1/users/register-donor', () => {
        it('[POSITIVE] should successfully register a new donor', async () => {
            const response = await request(app)
                .post('/api/v1/users/register-donor')
                .send({
                    firstName: 'Tony',
                    lastName: 'Stark',
                    email: 'tony@starkindustries.com',
                    phoneNumber: '0779998888',
                    password: 'IronManPassword123!'
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Donor profile created successfully');
            expect(response.body.userId).toBeDefined();

            const userInDb = await User.findById(response.body.userId);
            expect(userInDb.role).toBe('donor');
            expect(userInDb.email).toBe('tony@starkindustries.com');
        });

        it('[NEGATIVE] should return 400 if email is already in use', async () => {
            // Seed existing user
            await User.create({
                firstName: 'Existing', lastName: 'User',
                email: 'taken@email.com', phoneNumber: '0771231234',
                password: 'Password123!', role: 'donor'
            });

            const response = await request(app)
                .post('/api/v1/users/register-donor')
                .send({
                    firstName: 'New', lastName: 'Guy',
                    email: 'taken@email.com', // Duplicate
                    phoneNumber: '0779999999',
                    password: 'Password123!'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Email or phone number already in use');
        });

        it('[NEGATIVE] should fail Zod validation if password is too short', async () => {
            const response = await request(app)
                .post('/api/v1/users/register-donor')
                .send({
                    firstName: 'Short', lastName: 'Pass',
                    email: 'short@pass.com', phoneNumber: '0771112233',
                    password: '123' // Too short
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/v1/users/register-teacher', () => {
        it('[POSITIVE] should successfully register a standalone teacher', async () => {
            const response = await request(app)
                .post('/api/v1/users/register-teacher')
                .send({
                    firstName: 'Charles', lastName: 'Xavier',
                    email: 'profx@xmen.com', phoneNumber: '0774445555',
                    password: 'MindReader123!'
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Standalone Teacher registered successfully.');
            
            const teacher = await User.findOne({ email: 'profx@xmen.com' });
            expect(teacher.isSchoolVerified).toBe(true); // Standalone teachers are true by default
            expect(teacher.school).toBeNull();
        });

        it('[POSITIVE] should register a teacher linked to a school and set unverified', async () => {
            const mockSchoolId = new mongoose.Types.ObjectId().toString();

            const response = await request(app)
                .post('/api/v1/users/register-teacher')
                .send({
                    firstName: 'Logan', lastName: 'Howlett',
                    email: 'wolverine@xmen.com', phoneNumber: '0775556666',
                    password: 'Adamantium123!',
                    schoolId: mockSchoolId
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toMatch(/Awaiting School Admin verification/);

            const teacher = await User.findOne({ email: 'wolverine@xmen.com' });
            expect(teacher.isSchoolVerified).toBe(false);
            expect(teacher.school.toString()).toBe(mockSchoolId);
        });
    });


    // ==========================================
    // 2. PROTECTED PROFILE ROUTES
    // ==========================================
    describe('Protected Profile Routes', () => {
        let userToken, targetUserId;

        beforeEach(async () => {
            // Seed a user and log them in
            const user = await User.create({
                firstName: 'Peter', lastName: 'Parker',
                email: 'peter@dailybugle.com', phoneNumber: '0772223333',
                password: 'SpiderMan123!', role: 'teacher'
            });
            targetUserId = user._id;

            // Log in to get token
            const loginRes = await request(app)
                .post('/api/v1/auth/login')
                .send({ identifier: 'peter@dailybugle.com', password: 'SpiderMan123!' });
            
            userToken = loginRes.body.accessToken;
        });

        describe('PUT /api/v1/users/profile', () => {
            it('[POSITIVE] should update user details successfully', async () => {
                const response = await request(app)
                    .put('/api/v1/users/profile')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({
                        firstName: 'Spidey',
                        address: { city: 'New York' }
                    });

                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Profile updated successfully');
                expect(response.body.user.firstName).toBe('Spidey');
                expect(response.body.user.address.city).toBe('New York');

                const updatedDbUser = await User.findById(targetUserId);
                expect(updatedDbUser.firstName).toBe('Spidey');
            });

            it('[NEGATIVE] should return 400 if updating to an already taken email', async () => {
                // Seed a second user
                await User.create({
                    firstName: 'Miles', lastName: 'Morales',
                    email: 'miles@brooklyn.com', phoneNumber: '0779999999',
                    password: 'Password123!', role: 'student'
                });

                const response = await request(app)
                    .put('/api/v1/users/profile')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({ email: 'miles@brooklyn.com' }); // Trying to steal Miles' email

                expect(response.status).toBe(400);
                expect(response.body.message).toBe('Email or phone number is already taken by another account.');
            });
        });

        describe('PUT /api/v1/users/update-password', () => {
            it('[POSITIVE] should successfully update the password', async () => {
                const response = await request(app)
                    .put('/api/v1/users/update-password')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({
                        currentPassword: 'SpiderMan123!',
                        newPassword: 'NewWebShooter123!'
                    });

                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Password updated successfully');

                const userInDb = await User.findById(targetUserId);
                const isMatch = await userInDb.comparePassword('NewWebShooter123!');
                expect(isMatch).toBe(true);
            });

            it('[NEGATIVE] should fail if current password is incorrect', async () => {
                const response = await request(app)
                    .put('/api/v1/users/update-password')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({
                        currentPassword: 'WrongCurrentPassword!',
                        newPassword: 'NewWebShooter123!'
                    });

                expect(response.status).toBe(400);
                expect(response.body.message).toBe('Current password is incorrect');
            });
        });

        describe('DELETE /api/v1/users/profile', () => {
            it('[POSITIVE] should soft delete the user profile', async () => {
                const response = await request(app)
                    .delete('/api/v1/users/profile')
                    .set('Authorization', `Bearer ${userToken}`);

                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Profile deleted successfully');

                const deletedUser = await User.findById(targetUserId);
                expect(deletedUser.isDeleted).toBe(true);
                expect(deletedUser.isActive).toBe(false);
            });
        });
    });

    // ==========================================
    // 3. ACCOUNT RESTORATION
    // ==========================================
    describe('POST /api/v1/users/restore', () => {
        let softDeletedUser;

        beforeEach(async () => {
            softDeletedUser = await User.create({
                firstName: 'Barry', lastName: 'Allen',
                email: 'barry@starlabs.com', phoneNumber: '0776667777',
                password: 'FlashPassword123!', role: 'donor',
                isDeleted: true, isActive: false
            });
        });

        it('[POSITIVE] should restore a soft-deleted account', async () => {
            const response = await request(app)
                .post('/api/v1/users/restore')
                .send({ identifier: 'barry@starlabs.com' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Profile restored successfully');

            const restoredUser = await User.findById(softDeletedUser._id);
            expect(restoredUser.isDeleted).toBe(false);
            expect(restoredUser.isActive).toBe(true);
        });

        it('[NEGATIVE] should return 400 if user is not deleted', async () => {
            // Restore it first manually
            softDeletedUser.isDeleted = false;
            softDeletedUser.isActive = true;
            await softDeletedUser.save();

            const response = await request(app)
                .post('/api/v1/users/restore')
                .send({ identifier: 'barry@starlabs.com' });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('User profile is not deleted');
        });

        it('[NEGATIVE] should return 404 for unknown identifier', async () => {
            const response = await request(app)
                .post('/api/v1/users/restore')
                .send({ identifier: 'nobody@starlabs.com' });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('User not found');
        });
    });
});