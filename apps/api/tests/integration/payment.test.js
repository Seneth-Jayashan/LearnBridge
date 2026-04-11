import request from 'supertest';
import mongoose from 'mongoose';
import crypto from 'crypto';
import app from '../../server.js';
import User from '../../models/User.js';
import School from '../../models/School.js';
import ResourceRequest from '../../models/ResourceRequest.js';
import Payment from '../../models/Payment.js';
import { connectDBForTesting, disconnectDBForTesting, clearDBForTesting } from '../setup.js';

beforeAll(async () => {
    await connectDBForTesting();
    process.env.JWT_SECRET = 'test_secret_key_for_jwt_12345';
    process.env.PAYHERE_MERCHANT_ID = 'TEST_MERCHANT_123';
    process.env.PAYHERE_MERCHANT_SECRET = 'TEST_SECRET_ABC';
    process.env.PAYHERE_CURRENCY = 'LKR';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.BACKEND_URL = 'http://localhost:5000';
});

afterAll(async () => await disconnectDBForTesting());
afterEach(async () => await clearDBForTesting());

// ─── Helper: generate a valid PayHere md5sig ──────────────────────────────────
const generatePayHereHash = (merchantId, orderId, amount, currency, statusCode, secret) => {
    const hashedSecret = crypto
        .createHash('md5')
        .update(secret)
        .digest('hex')
        .toUpperCase();

    return crypto
        .createHash('md5')
        .update(`${merchantId}${orderId}${amount}${currency}${statusCode}${hashedSecret}`)
        .digest('hex')
        .toUpperCase();
};

describe('Payment API Integration Tests', () => {
    let donorToken, donorId, schoolId, adminId, openNeed;

    beforeEach(async () => {
        // 1. Create a School
        const school = await School.create({
            name: 'Riverside High',
            isVerified: true,
        });
        schoolId = school._id;

        // 2. Create a School Admin (needed for need's schoolId reference)
        const admin = await User.create({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@riverside.com',
            phoneNumber: '0770001111',
            password: 'AdminPass1!',
            role: 'school_admin',
            school: schoolId,
            isActive: true,
        });
        adminId = admin._id;

        // 3. Create a Donor
        const donor = await User.create({
            firstName: 'Mark',
            lastName: 'Donor',
            email: 'mark@donors.com',
            phoneNumber: '0771234567',
            password: 'DonorPass1!',
            role: 'donor',
            isActive: true,
            address: { street: '10 Main St', city: 'Colombo' },
        });
        donorId = donor._id;

        // 4. Log in as donor
        const loginRes = await request(app)
            .post('/api/v1/auth/login')
            .send({ identifier: 'mark@donors.com', password: 'DonorPass1!' });

        donorToken = loginRes.body.accessToken;

        // 5. Create an open need with a valid amount
        openNeed = await ResourceRequest.create({
            schoolId: adminId,
            schoolObjectId: schoolId,
            itemName: 'Laptops',
            quantity: 5,
            amount: 150000,
            status: 'Open',
            urgency: 'High',
        });
    });

    // ==========================================
    // 1. POST /initiate/:needId — Initiate Payment
    // ==========================================
    describe('POST /api/v1/payments/initiate/:needId — Initiate Payment', () => {
        it('[POSITIVE] should return PayHere payment data for a valid open need', async () => {
            const response = await request(app)
                .post(`/api/v1/payments/initiate/${openNeed._id}`)
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.merchant_id).toBe('TEST_MERCHANT_123');
            expect(response.body.order_id).toBeDefined();
            expect(response.body.amount).toBe('150000.00');
            expect(response.body.currency).toBe('LKR');
            expect(response.body.items).toBe('Laptops');
            expect(response.body.hash).toBeDefined();
            expect(response.body.first_name).toBe('Mark');
            expect(response.body.email).toBe('mark@donors.com');
            expect(response.body.custom_1).toBe(openNeed._id.toString());
            expect(response.body.custom_2).toBe(donorId.toString());

            // Verify a pending Payment record was created in DB
            const payment = await Payment.findOne({ needId: openNeed._id });
            expect(payment).not.toBeNull();
            expect(payment.status).toBe('Pending');
            expect(payment.amount).toBe(150000);

            // Verify need was updated with paymentOrderId and paymentStatus
            const updatedNeed = await ResourceRequest.findById(openNeed._id);
            expect(updatedNeed.paymentOrderId).toBeDefined();
            expect(updatedNeed.paymentStatus).toBe('Pending');
        });

        it('[NEGATIVE] should return 404 if the need does not exist', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .post(`/api/v1/payments/initiate/${fakeId}`)
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Need not found');
        });

        it('[NEGATIVE] should return 400 if the need has no amount set', async () => {
            const noAmountNeed = await ResourceRequest.create({
                schoolId: adminId,
                schoolObjectId: schoolId,
                itemName: 'Chairs',
                quantity: 10,
                amount: 0,
                status: 'Open',
            });

            const response = await request(app)
                .post(`/api/v1/payments/initiate/${noAmountNeed._id}`)
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/no amount set/i);
        });

        it('[NEGATIVE] should return 400 if the need is already Fulfilled', async () => {
            await ResourceRequest.findByIdAndUpdate(openNeed._id, {
                status: 'Fulfilled',
                paymentStatus: 'Completed',
            });

            const response = await request(app)
                .post(`/api/v1/payments/initiate/${openNeed._id}`)
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/already Fulfilled/i);
        });

        it('[NEGATIVE] should return 401 if no auth token is provided', async () => {
            const response = await request(app)
                .post(`/api/v1/payments/initiate/${openNeed._id}`);

            expect(response.status).toBe(401);
        });
    });

    // ==========================================
    // 2. POST /notify — PayHere Webhook Callback
    // ==========================================
    describe('POST /api/v1/payments/notify — PayHere Webhook', () => {
        let orderId;

        beforeEach(async () => {
            // Simulate an initiated payment (pending state)
            orderId = `ORDER_${openNeed._id}_${Date.now()}`;

            await Payment.create({
                donorId,
                needId: openNeed._id,
                orderId,
                itemName: 'Laptops',
                quantity: 5,
                amount: 150000,
                currency: 'LKR',
                status: 'Pending',
                donorSnapshot: { firstName: 'Mark', lastName: 'Donor', email: 'mark@donors.com' },
                schoolSnapshot: { firstName: 'Riverside High', email: 'admin@riverside.com' },
            });

            openNeed.paymentOrderId = orderId;
            openNeed.paymentStatus = 'Pending';
            await openNeed.save();
        });

        it('[POSITIVE] should mark need as Fulfilled and payment as Completed on status_code=2', async () => {
            const sig = generatePayHereHash(
                'TEST_MERCHANT_123',
                orderId,
                '150000.00',
                'LKR',
                '2',
                'TEST_SECRET_ABC'
            );

            const response = await request(app)
                .post('/api/v1/payments/notify')
                .send({
                    merchant_id: 'TEST_MERCHANT_123',
                    order_id: orderId,
                    payhere_amount: '150000.00',
                    payhere_currency: 'LKR',
                    status_code: '2',
                    md5sig: sig,
                    custom_1: openNeed._id.toString(),
                    custom_2: donorId.toString(),
                    method: 'VISA',
                    payment_id: 'PH_PAY_001',
                });

            expect(response.status).toBe(200);
            expect(response.text).toBe('OK');

            // Verify need is Fulfilled
            const updatedNeed = await ResourceRequest.findById(openNeed._id);
            expect(updatedNeed.status).toBe('Fulfilled');
            expect(updatedNeed.paymentStatus).toBe('Completed');
            expect(updatedNeed.paymentMethod).toBe('VISA');

            // Verify payment record is Completed
            const payment = await Payment.findOne({ orderId });
            expect(payment.status).toBe('Completed');
            expect(payment.paymentId).toBe('PH_PAY_001');
        });

        it('[POSITIVE] should set paymentStatus to Pending on status_code=0', async () => {
            const sig = generatePayHereHash(
                'TEST_MERCHANT_123',
                orderId,
                '150000.00',
                'LKR',
                '0',
                'TEST_SECRET_ABC'
            );

            const response = await request(app)
                .post('/api/v1/payments/notify')
                .send({
                    merchant_id: 'TEST_MERCHANT_123',
                    order_id: orderId,
                    payhere_amount: '150000.00',
                    payhere_currency: 'LKR',
                    status_code: '0',
                    md5sig: sig,
                    custom_1: openNeed._id.toString(),
                    custom_2: donorId.toString(),
                });

            expect(response.status).toBe(200);

            const updatedNeed = await ResourceRequest.findById(openNeed._id);
            expect(updatedNeed.paymentStatus).toBe('Pending');

            const payment = await Payment.findOne({ orderId });
            expect(payment.status).toBe('Pending');
        });

        it('[POSITIVE] should set paymentStatus to Cancelled on status_code=-1', async () => {
            const sig = generatePayHereHash(
                'TEST_MERCHANT_123',
                orderId,
                '150000.00',
                'LKR',
                '-1',
                'TEST_SECRET_ABC'
            );

            const response = await request(app)
                .post('/api/v1/payments/notify')
                .send({
                    merchant_id: 'TEST_MERCHANT_123',
                    order_id: orderId,
                    payhere_amount: '150000.00',
                    payhere_currency: 'LKR',
                    status_code: '-1',
                    md5sig: sig,
                    custom_1: openNeed._id.toString(),
                    custom_2: donorId.toString(),
                });

            expect(response.status).toBe(200);

            const updatedNeed = await ResourceRequest.findById(openNeed._id);
            expect(updatedNeed.paymentStatus).toBe('Cancelled');
            expect(updatedNeed.paymentOrderId).toBeNull();

            const payment = await Payment.findOne({ orderId });
            expect(payment.status).toBe('Cancelled');
        });

        it('[POSITIVE] should set paymentStatus to Failed on status_code=-2', async () => {
            const sig = generatePayHereHash(
                'TEST_MERCHANT_123',
                orderId,
                '150000.00',
                'LKR',
                '-2',
                'TEST_SECRET_ABC'
            );

            const response = await request(app)
                .post('/api/v1/payments/notify')
                .send({
                    merchant_id: 'TEST_MERCHANT_123',
                    order_id: orderId,
                    payhere_amount: '150000.00',
                    payhere_currency: 'LKR',
                    status_code: '-2',
                    md5sig: sig,
                    custom_1: openNeed._id.toString(),
                    custom_2: donorId.toString(),
                });

            expect(response.status).toBe(200);

            const updatedNeed = await ResourceRequest.findById(openNeed._id);
            expect(updatedNeed.paymentStatus).toBe('Failed');
            expect(updatedNeed.paymentOrderId).toBeNull();

            const payment = await Payment.findOne({ orderId });
            expect(payment.status).toBe('Failed');
        });

        it('[NEGATIVE] should return 400 if the hash signature is invalid', async () => {
            const response = await request(app)
                .post('/api/v1/payments/notify')
                .send({
                    merchant_id: 'TEST_MERCHANT_123',
                    order_id: orderId,
                    payhere_amount: '150000.00',
                    payhere_currency: 'LKR',
                    status_code: '2',
                    md5sig: 'INVALID_HASH_TAMPERED',
                    custom_1: openNeed._id.toString(),
                    custom_2: donorId.toString(),
                });

            expect(response.status).toBe(400);
            expect(response.text).toBe('Hash mismatch');

            // Need should NOT be updated
            const unchangedNeed = await ResourceRequest.findById(openNeed._id);
            expect(unchangedNeed.status).toBe('Open');
        });

        it('[NEGATIVE] should return 404 if the need referenced in custom_1 does not exist', async () => {
            const fakeNeedId = new mongoose.Types.ObjectId();
            const sig = generatePayHereHash(
                'TEST_MERCHANT_123',
                orderId,
                '150000.00',
                'LKR',
                '2',
                'TEST_SECRET_ABC'
            );

            const response = await request(app)
                .post('/api/v1/payments/notify')
                .send({
                    merchant_id: 'TEST_MERCHANT_123',
                    order_id: orderId,
                    payhere_amount: '150000.00',
                    payhere_currency: 'LKR',
                    status_code: '2',
                    md5sig: sig,
                    custom_1: fakeNeedId.toString(),
                    custom_2: donorId.toString(),
                });

            expect(response.status).toBe(404);
            expect(response.text).toBe('Need not found');
        });
    });

    // ==========================================
    // 3. POST /confirm — Confirm Payment (Frontend Fallback)
    // ==========================================
    describe('POST /api/v1/payments/confirm — Confirm Payment', () => {
        let orderId;

        beforeEach(async () => {
            orderId = `ORDER_${openNeed._id}_${Date.now()}`;

            await Payment.create({
                donorId,
                needId: openNeed._id,
                orderId,
                itemName: 'Laptops',
                quantity: 5,
                amount: 150000,
                currency: 'LKR',
                status: 'Pending',
                donorSnapshot: { firstName: 'Mark', lastName: 'Donor', email: 'mark@donors.com' },
                schoolSnapshot: { firstName: 'Riverside High', email: 'admin@riverside.com' },
            });

            openNeed.paymentOrderId = orderId;
            openNeed.paymentStatus = 'Pending';
            await openNeed.save();
        });

        it('[POSITIVE] should fulfill need via frontend fallback when webhook has not fired', async () => {
            const response = await request(app)
                .post('/api/v1/payments/confirm')
                .set('Authorization', `Bearer ${donorToken}`)
                .send({ orderId, needId: openNeed._id.toString() });

            expect(response.status).toBe(200);
            expect(response.body.message).toMatch(/confirmed/i);

            const updatedNeed = await ResourceRequest.findById(openNeed._id);
            expect(updatedNeed.status).toBe('Fulfilled');
            expect(updatedNeed.paymentStatus).toBe('Completed');

            const payment = await Payment.findOne({ orderId });
            expect(payment.status).toBe('Completed');
        });

        it('[POSITIVE] should return success immediately if webhook already fulfilled the need', async () => {
            // Simulate webhook already having run
            await ResourceRequest.findByIdAndUpdate(openNeed._id, { status: 'Fulfilled' });

            const response = await request(app)
                .post('/api/v1/payments/confirm')
                .set('Authorization', `Bearer ${donorToken}`)
                .send({ orderId, needId: openNeed._id.toString() });

            expect(response.status).toBe(200);
            expect(response.body.message).toMatch(/Already fulfilled by webhook/i);
        });

        it('[POSITIVE] should return success if payment record is already Completed', async () => {
            // Simulate webhook updating the Payment record
            await Payment.findOneAndUpdate({ orderId }, { status: 'Completed' });

            const response = await request(app)
                .post('/api/v1/payments/confirm')
                .set('Authorization', `Bearer ${donorToken}`)
                .send({ orderId, needId: openNeed._id.toString() });

            expect(response.status).toBe(200);
            expect(response.body.message).toMatch(/Confirmed by webhook/i);
        });

        it('[NEGATIVE] should return 400 if orderId does not match the need\'s paymentOrderId', async () => {
            const response = await request(app)
                .post('/api/v1/payments/confirm')
                .set('Authorization', `Bearer ${donorToken}`)
                .send({ orderId: 'WRONG_ORDER_ID', needId: openNeed._id.toString() });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Order ID mismatch');
        });

        it('[NEGATIVE] should return 404 if the need does not exist', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .post('/api/v1/payments/confirm')
                .set('Authorization', `Bearer ${donorToken}`)
                .send({ orderId, needId: fakeId.toString() });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Need not found');
        });

        it('[NEGATIVE] should return 404 if the Payment record is missing', async () => {
            // Delete the payment record to simulate missing record
            await Payment.deleteMany({ orderId });

            const response = await request(app)
                .post('/api/v1/payments/confirm')
                .set('Authorization', `Bearer ${donorToken}`)
                .send({ orderId, needId: openNeed._id.toString() });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Payment record not found');
        });

        it('[NEGATIVE] should return 401 if no auth token is provided', async () => {
            const response = await request(app)
                .post('/api/v1/payments/confirm')
                .send({ orderId, needId: openNeed._id.toString() });

            expect(response.status).toBe(401);
        });
    });

    // ==========================================
    // 4. GET /my-history — Get My Payment History
    // ==========================================
    describe('GET /api/v1/payments/my-history — Get My Payment History', () => {
        it('[POSITIVE] should return all payments for the logged-in donor', async () => {
            // Seed two payment records for this donor
            await Payment.create([
                {
                    donorId,
                    needId: openNeed._id,
                    orderId: `ORDER_1_${Date.now()}`,
                    itemName: 'Laptops',
                    quantity: 5,
                    amount: 150000,
                    currency: 'LKR',
                    status: 'Completed',
                    donorSnapshot: { firstName: 'Mark' },
                    schoolSnapshot: { firstName: 'Riverside High' },
                },
                {
                    donorId,
                    needId: openNeed._id,
                    orderId: `ORDER_2_${Date.now()}`,
                    itemName: 'Books',
                    quantity: 20,
                    amount: 10000,
                    currency: 'LKR',
                    status: 'Pending',
                    donorSnapshot: { firstName: 'Mark' },
                    schoolSnapshot: { firstName: 'Riverside High' },
                },
            ]);

            const response = await request(app)
                .get('/api/v1/payments/my-history')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(2);

            const statuses = response.body.map((p) => p.status);
            expect(statuses).toContain('Completed');
            expect(statuses).toContain('Pending');
        });

        it('[POSITIVE] should return an empty array if donor has no payment history', async () => {
            const response = await request(app)
                .get('/api/v1/payments/my-history')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });

        it('[POSITIVE] should NOT return payment records belonging to another donor', async () => {
            // Create a second donor with their own payment
            const otherDonor = await User.create({
                firstName: 'Other',
                lastName: 'Person',
                email: 'other@donors.com',
                phoneNumber: '0779998888',
                password: 'Password123!',
                role: 'donor',
                isActive: true,
            });
            await Payment.create({
                donorId: otherDonor._id,
                needId: openNeed._id,
                orderId: `ORDER_OTHER_${Date.now()}`,
                itemName: 'Should Not Appear',
                quantity: 1,
                amount: 5000,
                currency: 'LKR',
                status: 'Completed',
                donorSnapshot: { firstName: 'Other' },
                schoolSnapshot: { firstName: 'Riverside High' },
            });

            const response = await request(app)
                .get('/api/v1/payments/my-history')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(0); // Mark has no payments

            const itemNames = response.body.map((p) => p.itemName);
            expect(itemNames).not.toContain('Should Not Appear');
        });

        it('[NEGATIVE] should return 401 if no auth token is provided', async () => {
            const response = await request(app)
                .get('/api/v1/payments/my-history');

            expect(response.status).toBe(401);
        });
    });

    // ==========================================
    // 5. PUT /reset/:needId — Reset Payment Status (Testing Utility)
    // ==========================================
    describe('PUT /api/v1/payments/reset/:needId — Reset Payment Status', () => {
        let orderId;

        beforeEach(async () => {
            orderId = `ORDER_RESET_${Date.now()}`;

            await Payment.create({
                donorId,
                needId: openNeed._id,
                orderId,
                itemName: 'Laptops',
                quantity: 5,
                amount: 150000,
                currency: 'LKR',
                status: 'Pending',
                donorSnapshot: { firstName: 'Mark' },
                schoolSnapshot: { firstName: 'Riverside High' },
            });

            openNeed.paymentOrderId = orderId;
            openNeed.paymentStatus = 'Pending';
            await openNeed.save();
        });

        it('[POSITIVE] should reset paymentOrderId and paymentStatus on the need', async () => {
            const response = await request(app)
                .put(`/api/v1/payments/reset/${openNeed._id}`)
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Reset successful');

            const updatedNeed = await ResourceRequest.findById(openNeed._id);
            expect(updatedNeed.paymentOrderId).toBeNull();
            expect(updatedNeed.paymentStatus).toBeNull();
        });

        it('[POSITIVE] should delete the pending Payment record after reset', async () => {
            await request(app)
                .put(`/api/v1/payments/reset/${openNeed._id}`)
                .set('Authorization', `Bearer ${donorToken}`);

            const payment = await Payment.findOne({ needId: openNeed._id, status: 'Pending' });
            expect(payment).toBeNull();
        });

        it('[NEGATIVE] should return 404 if the need does not exist', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .put(`/api/v1/payments/reset/${fakeId}`)
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Need not found');
        });

        it('[NEGATIVE] should return 401 if no auth token is provided', async () => {
            const response = await request(app)
                .put(`/api/v1/payments/reset/${openNeed._id}`);

            expect(response.status).toBe(401);
        });
    });
});