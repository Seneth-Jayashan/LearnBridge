import request from 'supertest';
import app from '../../server.js';
import User from '../../models/User.js'; // Adjust path based on your structure
import jwt from 'jsonwebtoken';
import { connectDBForTesting, disconnectDBForTesting, clearDBForTesting } from '../setup.js';

beforeAll(async () => {
    await connectDBForTesting();
    // Ensure a JWT secret exists for testing token generation
    process.env.JWT_SECRET = 'test_secret_key_for_jwt_12345';
});

afterAll(async () => await disconnectDBForTesting());
afterEach(async () => await clearDBForTesting());

describe('Authentication & Authorization API Integration Tests', () => {
    
    let standardUser, studentUser, firstLoginUser, inactiveUser, lockedUser;
    let standardUserPlainPassword = 'StandardPassword123!';
    let studentUserPlainPassword = 'StudentPassword123!';
    let firstLoginPlainPassword = 'TempPassword123!';

    // Seed the database with various user states before each test
    beforeEach(async () => {
        // 1. Standard Active User
        standardUser = await User.create({
            firstName: 'Bruce', lastName: 'Wayne',
            email: 'bruce@wayne.com', phoneNumber: '0771112222',
            password: standardUserPlainPassword, 
            role: 'teacher', isActive: true, isLocked: false, requiresPasswordChange: false
        });

        // 2. Student User (ADDED PHONE NUMBER)
        studentUser = await User.create({
            firstName: 'Dick', lastName: 'Grayson',
            email: 'dick@wayne.com', regNumber: 'STU10001', phoneNumber: '0772223333', 
            password: studentUserPlainPassword, 
            role: 'student', isActive: true, isLocked: false, requiresPasswordChange: false
        });

        // 3. New User 
        firstLoginUser = await User.create({
            firstName: 'Jason', lastName: 'Todd',
            email: 'jason@wayne.com', phoneNumber: '0773334444',
            password: firstLoginPlainPassword, 
            role: 'teacher', isActive: true, isLocked: false, requiresPasswordChange: true
        });

        // 4. Inactive User (ADDED PHONE NUMBER)
        inactiveUser = await User.create({
            firstName: 'Tim', lastName: 'Drake',
            email: 'tim@wayne.com', phoneNumber: '0774445555',
            password: 'Password123!', 
            role: 'donor', isActive: false 
        });

        // 5. Locked User (ADDED PHONE NUMBER)
        lockedUser = await User.create({
            firstName: 'Damian', lastName: 'Wayne',
            email: 'damian@wayne.com', phoneNumber: '0775556666',
            password: 'Password123!', 
            role: 'donor', isLocked: true 
        });
    });

    // ==========================================
    // 1. POST /api/v1/auth/login
    // ==========================================
    describe('POST /api/v1/auth/login', () => {
        
        it('[POSITIVE] should login successfully with email and return tokens', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({ identifier: standardUser.email, password: standardUserPlainPassword });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Login successful');
            expect(response.body.accessToken).toBeDefined();
            expect(response.body.user.firstName).toBe('Bruce');
            
            // Verify Refresh Token was set as a cookie
            const cookies = response.headers['set-cookie'];
            expect(cookies[0]).toMatch(/refreshToken=/);
        });

        it('[POSITIVE] should login successfully with Student Registration Number', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({ identifier: studentUser.regNumber, password: studentUserPlainPassword });

            expect(response.status).toBe(200);
            expect(response.body.user.role).toBe('student');
        });

        it('[POSITIVE] should intercept login for new users and trigger OTP flow', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({ identifier: firstLoginUser.email, password: firstLoginPlainPassword });

            expect(response.status).toBe(200);
            expect(response.body.requiresOtpVerification).toBe(true);
            expect(response.body.userId).toBe(firstLoginUser._id.toString());
            expect(response.body.accessToken).toBeUndefined(); // Should NOT issue token yet
        });

        it('[NEGATIVE] should return 400 if validation fails (missing password)', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({ identifier: standardUser.email });

            expect(response.status).toBe(400); // Zod Validation error
        });

        it('[NEGATIVE] should return 401 for incorrect password', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({ identifier: standardUser.email, password: 'WrongPassword123!' });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Invalid credentials.');
        });

        it('[NEGATIVE] should return 404 for a user that does not exist', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({ identifier: 'ghost@nowhere.com', password: 'Password123!' });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('User not found.');
        });

        it('[NEGATIVE] should return 403 for inactive accounts', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({ identifier: inactiveUser.email, password: 'Password123!' });

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Account is inactive.');
        });

        it('[NEGATIVE] should return 403 for locked accounts', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({ identifier: lockedUser.email, password: 'Password123!' });

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Account is locked.');
        });
    });

    // ==========================================
    // 2. FIRST LOGIN FLOW
    // ==========================================
    describe('First Login Interception Flow', () => {
        let plainOtp;

        beforeEach(async () => {
            // Generate a real OTP on the user model so we can test the verification
            plainOtp = firstLoginUser.generateOTP();
            await firstLoginUser.save();
        });

        it('[POSITIVE] verify-first-login-otp should accept valid OTP and return reset token', async () => {
            const response = await request(app)
                .post('/api/v1/auth/verify-first-login-otp')
                .send({ userId: firstLoginUser._id, otp: plainOtp });

            expect(response.status).toBe(200);
            expect(response.body.resetToken).toBeDefined();
        });

        it('[NEGATIVE] verify-first-login-otp should reject invalid OTP', async () => {
            const response = await request(app)
                .post('/api/v1/auth/verify-first-login-otp')
                .send({ userId: firstLoginUser._id, otp: '000000' });

            expect(response.status).toBe(400);
        });

        it('[POSITIVE] setup-new-password should update password and log user in', async () => {
            // Create a valid reset token simulating the previous step's output
            const validResetToken = jwt.sign(
                { id: firstLoginUser._id, intent: 'first_login_reset' }, 
                process.env.JWT_SECRET, 
                { expiresIn: '15m' }
            );

            const response = await request(app)
                .post('/api/v1/auth/setup-new-password')
                .send({ resetToken: validResetToken, newPassword: 'BrandNewSecurePassword1!' });

            expect(response.status).toBe(200);
            expect(response.body.accessToken).toBeDefined();
            
            // Verify in DB that the requirement is lifted
            const updatedUser = await User.findById(firstLoginUser._id);
            // Assuming your updatePassword method handles setting requiresPasswordChange to false
            const isMatch = await updatedUser.comparePassword('BrandNewSecurePassword1!');
            expect(isMatch).toBe(true);
        });

        it('[NEGATIVE] setup-new-password should reject tokens with wrong intent', async () => {
            const badToken = jwt.sign({ id: firstLoginUser._id, intent: 'wrong_intent' }, process.env.JWT_SECRET);

            const response = await request(app)
                .post('/api/v1/auth/setup-new-password')
                .send({ resetToken: badToken, newPassword: 'NewPassword123!' });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid token intent.');
        });
    });

    // ==========================================
    // 3. SESSION MANAGEMENT (Refresh, Logout, Me)
    // ==========================================
    describe('Session Management & Protected Routes', () => {
        let validAccessToken;
        let validRefreshToken;

        beforeEach(async () => {
            // Login to get real tokens for these tests
            const loginRes = await request(app)
                .post('/api/v1/auth/login')
                .send({ identifier: standardUser.email, password: standardUserPlainPassword });

            validAccessToken = loginRes.body.accessToken;
            // Extract the refresh token from the Set-Cookie header
            const cookieString = loginRes.headers['set-cookie'][0];
            validRefreshToken = cookieString.split(';')[0].split('=')[1];
        });

        it('[POSITIVE] GET /me should return user details with valid token', async () => {
            const response = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', `Bearer ${validAccessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.user.email).toBe(standardUser.email);
            expect(response.body.user.password).toBeUndefined(); // Should exclude password
        });

        it('[NEGATIVE] GET /me should return 401 with missing token', async () => {
            const response = await request(app).get('/api/v1/auth/me');
            expect(response.status).toBe(401);
        });

        it('[POSITIVE] POST /refresh should issue a new access token', async () => {
            const response = await request(app)
                .post('/api/v1/auth/refresh')
                .set('Cookie', [`refreshToken=${validRefreshToken}`]); // Inject the cookie

            expect(response.status).toBe(200);
            expect(response.body.accessToken).toBeDefined();
            expect(response.body.accessToken).not.toBe(validAccessToken); // Should be a brand new token
        });

        it('[NEGATIVE] POST /refresh should fail if refresh token is invalid', async () => {
            // Create a fake refresh token
            const fakeToken = jwt.sign({ id: standardUser._id }, process.env.JWT_SECRET);
            
            const response = await request(app)
                .post('/api/v1/auth/refresh')
                .set('Cookie', [`refreshToken=${fakeToken}`]);

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Invalid refresh token');
        });

        it('[POSITIVE] POST /logout should clear the refresh token from DB and cookies', async () => {
            const response = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', `Bearer ${validAccessToken}`)
                .set('Cookie', [`refreshToken=${validRefreshToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Logged out successfully.');

            // Verify cookie was cleared
            const cookies = response.headers['set-cookie'];
            expect(cookies[0]).toMatch(/refreshToken=;/); // Indicates cleared cookie

            // Verify token was removed from DB
            const userInDb = await User.findById(standardUser._id);
            const tokenExists = userInDb.refreshToken.some(rt => rt.token === validRefreshToken);
            expect(tokenExists).toBe(false);
        });
    });

    // ==========================================
    // 4. PASSWORD RECOVERY (Forgot / Reset)
    // ==========================================
    describe('Password Recovery Flow', () => {
        it('[POSITIVE] forgot-password should return success for valid email', async () => {
            const response = await request(app)
                .post('/api/v1/auth/forgot-password')
                .send({ identifier: standardUser.email });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('OTP sent.');
        });

        it('[NEGATIVE] forgot-password should return 404 for unknown email', async () => {
            const response = await request(app)
                .post('/api/v1/auth/forgot-password')
                .send({ identifier: 'unknown@email.com' });

            expect(response.status).toBe(404);
        });

        it('[NEGATIVE] reset-password should reject invalid OTP', async () => {
            const response = await request(app)
                .post('/api/v1/auth/reset-password')
                .send({ 
                    identifier: standardUser.email, 
                    otp: '000000', 
                    newPassword: 'NewSecurePassword1!' 
                });

            expect(response.status).toBe(400); // Invalid OTP
        });
    });
});