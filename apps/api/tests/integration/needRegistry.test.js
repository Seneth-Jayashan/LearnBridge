import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import User from '../../models/User.js';
import School from '../../models/School.js';
import ResourceRequest from '../../models/ResourceRequest.js';
import { connectDBForTesting, disconnectDBForTesting, clearDBForTesting } from '../setup.js';

beforeAll(async () => {
    await connectDBForTesting();
    process.env.JWT_SECRET = 'test_secret_key_for_jwt_12345';
});

afterAll(async () => await disconnectDBForTesting());
afterEach(async () => await clearDBForTesting());

describe('School Admin — Needs Registry CRUD Integration Tests', () => {
    let adminToken, schoolId, adminId;

    beforeEach(async () => {
        // 1. Create a mock School
        const school = await School.create({
            name: 'Greenwood Academy',
            isVerified: true,
        });
        schoolId = school._id;

        // 2. Create the School Admin user
        const admin = await User.create({
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@greenwood.com',
            phoneNumber: '0770002222',
            password: 'AdminPassword1!',
            role: 'school_admin',
            school: schoolId,
            isActive: true,
        });
        adminId = admin._id;

        // 3. Link admin to school
        school.admins.push(adminId);
        await school.save();

        // 4. Log in to get access token
        const loginRes = await request(app)
            .post('/api/v1/auth/login')
            .send({ identifier: 'jane@greenwood.com', password: 'AdminPassword1!' });

        adminToken = loginRes.body.accessToken;
    });

    // ==========================================
    // 1. POST /needs — Create a Need
    // ==========================================
    describe('POST /api/v1/school-admin/needs — Create Need', () => {
        it('[POSITIVE] should create a new need with valid data', async () => {
            const response = await request(app)
                .post('/api/v1/school-admin/needs')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    itemName: 'Library Books',
                    quantity: 50,
                    amount: 25000,
                    description: 'Books for the new semester',
                    urgency: 'High',
                    targetGroup: 'Grade 10',
                    condition: 'New',
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Need posted successfully');
            expect(response.body.need.itemName).toBe('Library Books');
            expect(response.body.need.quantity).toBe(50);
            expect(response.body.need.amount).toBe(25000);
            expect(response.body.need.urgency).toBe('High');
            expect(response.body.need.status).toBe('Open');

            // Verify in DB — schoolId is stored as the admin's user _id
            const needInDb = await ResourceRequest.findById(response.body.need._id);
            expect(needInDb).not.toBeNull();
            expect(needInDb.schoolId.toString()).toBe(adminId.toString());
        });

        it('[POSITIVE] should default urgency to "Medium" when not provided', async () => {
            const response = await request(app)
                .post('/api/v1/school-admin/needs')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    itemName: 'Chairs',
                    quantity: 20,
                    amount: 10000,
                });

            expect(response.status).toBe(201);
            expect(response.body.need.urgency).toBe('Medium');
        });

        it('[NEGATIVE] should return 400 if itemName is missing', async () => {
            const response = await request(app)
                .post('/api/v1/school-admin/needs')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    quantity: 10,
                    amount: 5000,
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/item name and quantity are required/i);
        });

        it('[NEGATIVE] should return 400 if quantity is missing', async () => {
            const response = await request(app)
                .post('/api/v1/school-admin/needs')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    itemName: 'Desks',
                    amount: 5000,
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/item name and quantity are required/i);
        });

        it('[NEGATIVE] should return 400 if amount is zero or negative', async () => {
            const response = await request(app)
                .post('/api/v1/school-admin/needs')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    itemName: 'Desks',
                    quantity: 5,
                    amount: -100,
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/valid amount/i);
        });

        it('[NEGATIVE] should return 401 if no auth token is provided', async () => {
            const response = await request(app)
                .post('/api/v1/school-admin/needs')
                .send({ itemName: 'Chairs', quantity: 10, amount: 5000 });

            expect(response.status).toBe(401);
        });
    });

    // ==========================================
    // 2. GET /school/my-needs — Get My Posted Needs
    // ==========================================
    describe('GET /api/v1/school-admin/school/my-needs — Get My Posted Needs', () => {
        beforeEach(async () => {
            // Seed two needs for this admin
            await ResourceRequest.create([
                {
                    schoolId: adminId,
                    schoolObjectId: schoolId,
                    itemName: 'Projectors',
                    quantity: 3,
                    amount: 90000,
                    status: 'Open',
                },
                {
                    schoolId: adminId,
                    schoolObjectId: schoolId,
                    itemName: 'Whiteboards',
                    quantity: 5,
                    amount: 15000,
                    status: 'Fulfilled',
                },
            ]);
        });

        it('[POSITIVE] should return all needs posted by the logged-in admin', async () => {
            const response = await request(app)
                .get('/api/v1/school-admin/school/my-needs')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(2);

            const itemNames = response.body.map((n) => n.itemName);
            expect(itemNames).toContain('Projectors');
            expect(itemNames).toContain('Whiteboards');
        });

        it('[POSITIVE] should return an empty array if the admin has no needs posted', async () => {
            // Clear only ResourceRequests
            await ResourceRequest.deleteMany({});

            const response = await request(app)
                .get('/api/v1/school-admin/school/my-needs')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });

        it('[NEGATIVE] should return 401 if no auth token is provided', async () => {
            const response = await request(app)
                .get('/api/v1/school-admin/school/my-needs');

            expect(response.status).toBe(401);
        });

        it('[POSITIVE] should NOT return needs posted by a different admin', async () => {
            // Create a second admin and seed a need for them
            const otherAdmin = await User.create({
                firstName: 'Other',
                lastName: 'Admin',
                email: 'other@school.com',
                phoneNumber: '0779990000',
                password: 'Password123!',
                role: 'school_admin',
                school: schoolId,
                isActive: true,
            });
            await ResourceRequest.create({
                schoolId: otherAdmin._id,
                schoolObjectId: schoolId,
                itemName: 'Should Not Appear',
                quantity: 1,
                amount: 1000,
                status: 'Open',
            });

            const response = await request(app)
                .get('/api/v1/school-admin/school/my-needs')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            const itemNames = response.body.map((n) => n.itemName);
            expect(itemNames).not.toContain('Should Not Appear');
        });
    });

    // ==========================================
    // 3. PUT /school/:id — Update a Need
    // ==========================================
    describe('PUT /api/v1/school-admin/school/:id — Update Need', () => {
        let needId;

        beforeEach(async () => {
            const need = await ResourceRequest.create({
                schoolId: adminId,
                schoolObjectId: schoolId,
                itemName: 'Computers',
                quantity: 10,
                amount: 500000,
                urgency: 'Medium',
                status: 'Open',
            });
            needId = need._id;
        });

        it('[POSITIVE] should update an open need with new values', async () => {
            const response = await request(app)
                .put(`/api/v1/school-admin/school/${needId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ quantity: 15, urgency: 'High', description: 'Updated desc' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Need updated successfully');
            expect(response.body.need.quantity).toBe(15);
            expect(response.body.need.urgency).toBe('High');
            expect(response.body.need.description).toBe('Updated desc');
        });

        it('[POSITIVE] should update only the fields that are provided (partial update)', async () => {
            const response = await request(app)
                .put(`/api/v1/school-admin/school/${needId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ urgency: 'Low' }); // Only updating urgency

            expect(response.status).toBe(200);
            expect(response.body.need.urgency).toBe('Low');
            expect(response.body.need.itemName).toBe('Computers'); // Unchanged
            expect(response.body.need.quantity).toBe(10);          // Unchanged
        });

        it('[NEGATIVE] should return 400 if the need is already Pledged', async () => {
            await ResourceRequest.findByIdAndUpdate(needId, { status: 'Pledged' });

            const response = await request(app)
                .put(`/api/v1/school-admin/school/${needId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ quantity: 20 });

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/Cannot edit a need that is already pledged/i);
        });

        it('[NEGATIVE] should return 400 if the need is already Fulfilled', async () => {
            await ResourceRequest.findByIdAndUpdate(needId, { status: 'Fulfilled' });

            const response = await request(app)
                .put(`/api/v1/school-admin/school/${needId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ quantity: 20 });

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/Cannot edit a need that is already pledged/i);
        });

        it('[NEGATIVE] should return 403 if another admin tries to update the need', async () => {
            // Create a second school admin and log them in
            await User.create({
                firstName: 'Bob',
                lastName: 'Jones',
                email: 'bob@greenwood.com',
                phoneNumber: '0771112233',
                password: 'Password123!',
                role: 'school_admin',
                school: schoolId,
                isActive: true,
            });
            const otherLogin = await request(app)
                .post('/api/v1/auth/login')
                .send({ identifier: 'bob@greenwood.com', password: 'Password123!' });

            const otherToken = otherLogin.body.accessToken;

            const response = await request(app)
                .put(`/api/v1/school-admin/school/${needId}`)
                .set('Authorization', `Bearer ${otherToken}`)
                .send({ quantity: 99 });

            expect(response.status).toBe(403);
            expect(response.body.message).toMatch(/Not authorized to edit this need/i);
        });

        it('[NEGATIVE] should return 404 if the need does not exist', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .put(`/api/v1/school-admin/school/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ quantity: 5 });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Need not found');
        });
    });

    // ==========================================
    // 4. DELETE /school/:id — Delete a Need
    // ==========================================
    describe('DELETE /api/v1/school-admin/school/:id — Delete Need', () => {
        let needId;

        beforeEach(async () => {
            const need = await ResourceRequest.create({
                schoolId: adminId,
                schoolObjectId: schoolId,
                itemName: 'Science Kits',
                quantity: 8,
                amount: 32000,
                status: 'Open',
            });
            needId = need._id;
        });

        it('[POSITIVE] should delete an open need and confirm removal from DB', async () => {
            const response = await request(app)
                .delete(`/api/v1/school-admin/school/${needId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Need deleted successfully');

            const checkNeed = await ResourceRequest.findById(needId);
            expect(checkNeed).toBeNull();
        });

        it('[NEGATIVE] should return 400 if the need is already Pledged', async () => {
            await ResourceRequest.findByIdAndUpdate(needId, { status: 'Pledged' });

            const response = await request(app)
                .delete(`/api/v1/school-admin/school/${needId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/Cannot delete a need that is already pledged/i);
        });

        it('[NEGATIVE] should return 400 if the need is already Fulfilled', async () => {
            await ResourceRequest.findByIdAndUpdate(needId, { status: 'Fulfilled' });

            const response = await request(app)
                .delete(`/api/v1/school-admin/school/${needId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/Cannot delete a need that is already pledged/i);
        });

        it('[NEGATIVE] should return 403 if another admin tries to delete the need', async () => {
            await User.create({
                firstName: 'Alice',
                lastName: 'Brown',
                email: 'alice@greenwood.com',
                phoneNumber: '0773334455',
                password: 'Password123!',
                role: 'school_admin',
                school: schoolId,
                isActive: true,
            });
            const otherLogin = await request(app)
                .post('/api/v1/auth/login')
                .send({ identifier: 'alice@greenwood.com', password: 'Password123!' });

            const otherToken = otherLogin.body.accessToken;

            const response = await request(app)
                .delete(`/api/v1/school-admin/school/${needId}`)
                .set('Authorization', `Bearer ${otherToken}`);

            expect(response.status).toBe(403);
            expect(response.body.message).toMatch(/Not authorized to delete this need/i);
        });

        it('[NEGATIVE] should return 404 if the need does not exist', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .delete(`/api/v1/school-admin/school/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Need not found');
        });
    });

    // ==========================================
    // 5. GET /needs/donor/:needId — Get Donor Details
    // ==========================================
    describe('GET /api/v1/school-admin/needs/donor/:needId — Get Donor Details', () => {
        let needId, donorId;

        beforeEach(async () => {
            // Create a donor
            const donor = await User.create({
                firstName: 'John',
                lastName: 'Donor',
                email: 'john@donors.com',
                phoneNumber: '0775556677',
                password: 'Password123!',
                role: 'donor',
                isActive: true,
            });
            donorId = donor._id;

            // Create a fulfilled need with the donor linked
            const need = await ResourceRequest.create({
                schoolId: adminId,
                schoolObjectId: schoolId,
                itemName: 'Sports Equipment',
                quantity: 5,
                amount: 20000,
                status: 'Fulfilled',
                donorId: donorId,
                pledgedDate: new Date(),
                fulfilledDate: new Date(),
                paymentMethod: 'PayHere',
                paymentStatus: 'Completed',
            });
            needId = need._id;
        });

        it('[POSITIVE] should return donor details for a fulfilled need', async () => {
            const response = await request(app)
                .get(`/api/v1/school-admin/needs/donor/${needId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.donor).toBeDefined();
            expect(response.body.donor.firstName).toBe('John');
            expect(response.body.donor.email).toBe('john@donors.com');
            expect(response.body.need).toBeDefined();
            expect(response.body.need.itemName).toBe('Sports Equipment');
            expect(response.body.need.paymentMethod).toBe('PayHere');
        });

        it('[NEGATIVE] should return 404 if no donor is linked to the need', async () => {
            // Create an open need with no donor
            const openNeed = await ResourceRequest.create({
                schoolId: adminId,
                schoolObjectId: schoolId,
                itemName: 'No Donor Item',
                quantity: 2,
                amount: 5000,
                status: 'Open',
            });

            const response = await request(app)
                .get(`/api/v1/school-admin/needs/donor/${openNeed._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('No donor found for this need');
        });

        it('[NEGATIVE] should return 403 if another admin tries to view donor details', async () => {
            await User.create({
                firstName: 'Eve',
                lastName: 'Hacker',
                email: 'eve@other.com',
                phoneNumber: '0779876543',
                password: 'Password123!',
                role: 'school_admin',
                school: new mongoose.Types.ObjectId(), // different school
                isActive: true,
            });
            const otherLogin = await request(app)
                .post('/api/v1/auth/login')
                .send({ identifier: 'eve@other.com', password: 'Password123!' });

            const otherToken = otherLogin.body.accessToken;

            const response = await request(app)
                .get(`/api/v1/school-admin/needs/donor/${needId}`)
                .set('Authorization', `Bearer ${otherToken}`);

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Not authorized');
        });

        it('[NEGATIVE] should return 404 if the need does not exist', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .get(`/api/v1/school-admin/needs/donor/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Need not found');
        });
    });
});