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

describe('Donation API Integration Tests', () => {
    let donorToken, donorId, adminId, schoolId;

    beforeEach(async () => {
        // 1. Create a verified School
        const school = await School.create({
            name: 'Maplewood School',
            isVerified: true,
        });
        schoolId = school._id;

        // 2. Create a School Admin (used as schoolId in ResourceRequest)
        const admin = await User.create({
            firstName: 'School',
            lastName: 'Admin',
            email: 'admin@maplewood.com',
            phoneNumber: '0770001111',
            password: 'AdminPass1!',
            role: 'school_admin',
            school: schoolId,
            isVerified: true,
            isActive: true,
        });
        adminId = admin._id;

        // Link admin to school
        school.admins.push(adminId);
        await school.save();

        // 3. Create a Donor
        const donor = await User.create({
            firstName: 'Sarah',
            lastName: 'Donor',
            email: 'sarah@donors.com',
            phoneNumber: '0771234567',
            password: 'DonorPass1!',
            role: 'donor',
            isActive: true,
        });
        donorId = donor._id;

        // 4. Log in as donor
        const loginRes = await request(app)
            .post('/api/v1/auth/login')
            .send({ identifier: 'sarah@donors.com', password: 'DonorPass1!' });

        donorToken = loginRes.body.accessToken;
    });

    // ==========================================
    // 1. GET /profile — Donor Profile
    // ==========================================
    describe('GET /api/v1/donor/profile — Donor Profile', () => {
        it('[POSITIVE] should return the logged-in donor\'s profile', async () => {
            const response = await request(app)
                .get('/api/v1/donor/profile')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.email).toBe('sarah@donors.com');
            expect(response.body.firstName).toBe('Sarah');
            expect(response.body.role).toBe('donor');
        });

        it('[NEGATIVE] should return 401 if no auth token provided', async () => {
            const response = await request(app)
                .get('/api/v1/donor/profile');

            expect(response.status).toBe(401);
        });

        it('[NEGATIVE] should return 403 if a non-donor role tries to access', async () => {
            // Log in as school admin
            const adminLogin = await request(app)
                .post('/api/v1/auth/login')
                .send({ identifier: 'admin@maplewood.com', password: 'AdminPass1!' });

            const adminToken = adminLogin.body.accessToken;

            const response = await request(app)
                .get('/api/v1/donor/profile')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(403);
        });
    });

    // ==========================================
    // 2. GET / — Get All Needs (Browse Needs Tab)
    // ==========================================
    describe('GET /api/v1/donor — Get All Needs', () => {
        beforeEach(async () => {
            // Seed a variety of needs
            await ResourceRequest.create([
                {
                    schoolId: adminId,
                    schoolObjectId: schoolId,
                    itemName: 'Textbooks',
                    quantity: 30,
                    amount: 15000,
                    urgency: 'High',
                    status: 'Open',
                },
                {
                    schoolId: adminId,
                    schoolObjectId: schoolId,
                    itemName: 'Pencils',
                    quantity: 100,
                    amount: 2000,
                    urgency: 'Low',
                    status: 'Open',
                },
                {
                    schoolId: adminId,
                    schoolObjectId: schoolId,
                    itemName: 'Chairs',
                    quantity: 10,
                    amount: 20000,
                    urgency: 'Medium',
                    status: 'Pledged',
                },
            ]);
        });

        it('[POSITIVE] should return all needs without filters', async () => {
            const response = await request(app)
                .get('/api/v1/donor')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(3);
        });

        it('[POSITIVE] should filter needs by urgency', async () => {
            const response = await request(app)
                .get('/api/v1/donor?urgency=High')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].itemName).toBe('Textbooks');
            expect(response.body[0].urgency).toBe('High');
        });

        it('[POSITIVE] should filter needs by status', async () => {
            const response = await request(app)
                .get('/api/v1/donor?status=Pledged')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].itemName).toBe('Chairs');
        });

        it('[POSITIVE] should filter needs by search keyword (case-insensitive)', async () => {
            const response = await request(app)
                .get('/api/v1/donor?search=text')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].itemName).toBe('Textbooks');
        });

        it('[POSITIVE] should return empty array if no needs match the filter', async () => {
            const response = await request(app)
                .get('/api/v1/donor?urgency=Critical')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });

        it('[POSITIVE] should return needs sorted by createdAt descending (newest first)', async () => {
            const response = await request(app)
                .get('/api/v1/donor')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            // Verify descending order
            const dates = response.body.map((n) => new Date(n.createdAt).getTime());
            for (let i = 0; i < dates.length - 1; i++) {
                expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
            }
        });

        it('[NEGATIVE] should return 401 if no auth token provided', async () => {
            const response = await request(app)
                .get('/api/v1/donor');

            expect(response.status).toBe(401);
        });
    });

    // ==========================================
    // 3. PUT /:id/pledge — Pledge a Donation
    // ==========================================
    describe('PUT /api/v1/donor/:id/pledge — Pledge Donation', () => {
        let openNeedId;

        beforeEach(async () => {
            const need = await ResourceRequest.create({
                schoolId: adminId,
                schoolObjectId: schoolId,
                itemName: 'Science Lab Equipment',
                quantity: 4,
                amount: 80000,
                urgency: 'High',
                status: 'Open',
            });
            openNeedId = need._id;
        });

        it('[POSITIVE] should pledge a donation and update need status to Pledged', async () => {
            const response = await request(app)
                .put(`/api/v1/donor/${openNeedId}/pledge`)
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Pledge successful');
            expect(response.body.need.status).toBe('Pledged');
            expect(response.body.need.donorId).toBeDefined();

            // Verify in DB
            const updatedNeed = await ResourceRequest.findById(openNeedId);
            expect(updatedNeed.status).toBe('Pledged');
            expect(updatedNeed.donorId.toString()).toBe(donorId.toString());
            expect(updatedNeed.pledgedDate).not.toBeNull();
        });

        it('[NEGATIVE] should return 400 if the need is already Pledged', async () => {
            await ResourceRequest.findByIdAndUpdate(openNeedId, { status: 'Pledged' });

            const response = await request(app)
                .put(`/api/v1/donor/${openNeedId}/pledge`)
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/already Pledged/i);
        });

        it('[NEGATIVE] should return 400 if the need is already Fulfilled', async () => {
            await ResourceRequest.findByIdAndUpdate(openNeedId, { status: 'Fulfilled' });

            const response = await request(app)
                .put(`/api/v1/donor/${openNeedId}/pledge`)
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/already Fulfilled/i);
        });

        it('[NEGATIVE] should return 404 if the need does not exist', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .put(`/api/v1/donor/${fakeId}/pledge`)
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Need not found');
        });

        it('[NEGATIVE] should return 401 if no auth token provided', async () => {
            const response = await request(app)
                .put(`/api/v1/donor/${openNeedId}/pledge`);

            expect(response.status).toBe(401);
        });
    });

    // ==========================================
    // 4. GET /my — Get My Donations
    // ==========================================
    describe('GET /api/v1/donor/my — Get My Donations', () => {
        beforeEach(async () => {
            // Seed donations belonging to this donor
            await ResourceRequest.create([
                {
                    schoolId: adminId,
                    schoolObjectId: schoolId,
                    itemName: 'Notebooks',
                    quantity: 50,
                    amount: 5000,
                    status: 'Pledged',
                    donorId,
                    pledgedDate: new Date(),
                },
                {
                    schoolId: adminId,
                    schoolObjectId: schoolId,
                    itemName: 'Pens',
                    quantity: 200,
                    amount: 3000,
                    status: 'Fulfilled',
                    donorId,
                    pledgedDate: new Date(),
                    fulfilledDate: new Date(),
                },
            ]);
        });

        it('[POSITIVE] should return all donations made by the logged-in donor', async () => {
            const response = await request(app)
                .get('/api/v1/donor/my')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(2);

            const itemNames = response.body.map((d) => d.itemName);
            expect(itemNames).toContain('Notebooks');
            expect(itemNames).toContain('Pens');
        });

        it('[POSITIVE] should return empty array if donor has no donations', async () => {
            await ResourceRequest.deleteMany({ donorId });

            const response = await request(app)
                .get('/api/v1/donor/my')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });

        it('[POSITIVE] should NOT return donations belonging to another donor', async () => {
            // Create another donor with their own donation
            const otherDonor = await User.create({
                firstName: 'Other',
                lastName: 'Donor',
                email: 'other@donors.com',
                phoneNumber: '0779990000',
                password: 'Password123!',
                role: 'donor',
                isActive: true,
            });
            await ResourceRequest.create({
                schoolId: adminId,
                schoolObjectId: schoolId,
                itemName: 'Should Not Appear',
                quantity: 1,
                amount: 1000,
                status: 'Pledged',
                donorId: otherDonor._id,
                pledgedDate: new Date(),
            });

            const response = await request(app)
                .get('/api/v1/donor/my')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            const itemNames = response.body.map((d) => d.itemName);
            expect(itemNames).not.toContain('Should Not Appear');
        });

        it('[NEGATIVE] should return 401 if no auth token provided', async () => {
            const response = await request(app)
                .get('/api/v1/donor/my');

            expect(response.status).toBe(401);
        });
    });

    // ==========================================
    // 5. PUT /:id/complete — Mark as Fulfilled
    // ==========================================
    describe('PUT /api/v1/donor/:id/complete — Mark as Fulfilled', () => {
        let pledgedNeedId;

        beforeEach(async () => {
            const need = await ResourceRequest.create({
                schoolId: adminId,
                schoolObjectId: schoolId,
                itemName: 'Whiteboards',
                quantity: 3,
                amount: 45000,
                status: 'Pledged',
                donorId,
                pledgedDate: new Date(),
            });
            pledgedNeedId = need._id;
        });

        it('[POSITIVE] should mark a pledged donation as Fulfilled', async () => {
            const response = await request(app)
                .put(`/api/v1/donor/${pledgedNeedId}/complete`)
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Marked as fulfilled');
            expect(response.body.need.status).toBe('Fulfilled');

            // Verify in DB
            const updatedNeed = await ResourceRequest.findById(pledgedNeedId);
            expect(updatedNeed.status).toBe('Fulfilled');
            expect(updatedNeed.fulfilledDate).not.toBeNull();
        });

        it('[NEGATIVE] should return 403 if a different donor tries to complete it', async () => {
            // Create and log in as a different donor
            await User.create({
                firstName: 'Other',
                lastName: 'Donor',
                email: 'other@donors.com',
                phoneNumber: '0779991234',
                password: 'Password123!',
                role: 'donor',
                isActive: true,
            });
            const otherLogin = await request(app)
                .post('/api/v1/auth/login')
                .send({ identifier: 'other@donors.com', password: 'Password123!' });

            const otherToken = otherLogin.body.accessToken;

            const response = await request(app)
                .put(`/api/v1/donor/${pledgedNeedId}/complete`)
                .set('Authorization', `Bearer ${otherToken}`);

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Not your donation');
        });

        it('[NEGATIVE] should return 400 if the need is not in Pledged status', async () => {
            // Change to Open so it is not Pledged
            await ResourceRequest.findByIdAndUpdate(pledgedNeedId, { status: 'Open' });

            const response = await request(app)
                .put(`/api/v1/donor/${pledgedNeedId}/complete`)
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/Can only complete a pledged donation/i);
        });

        it('[NEGATIVE] should return 404 if the need does not exist', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .put(`/api/v1/donor/${fakeId}/complete`)
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Need not found');
        });

        it('[NEGATIVE] should return 401 if no auth token provided', async () => {
            const response = await request(app)
                .put(`/api/v1/donor/${pledgedNeedId}/complete`);

            expect(response.status).toBe(401);
        });
    });

    // ==========================================
    // 6. GET /overview — Overview Stats
    // ==========================================
    describe('GET /api/v1/donor/overview — Overview Stats', () => {
        beforeEach(async () => {
            // Seed a second verified school admin for urgentNeeds lookup
            const school2 = await School.create({ name: 'Oakwood School', isVerified: true });
            const admin2 = await User.create({
                firstName: 'Oak',
                lastName: 'Admin',
                email: 'oak@admin.com',
                phoneNumber: '0772223344',
                password: 'Password123!',
                role: 'school_admin',
                school: school2._id,
                isVerified: true,
                isActive: true,
            });

            // Seed donations for the donor
            await ResourceRequest.create([
                {
                    schoolId: adminId,
                    schoolObjectId: schoolId,
                    itemName: 'Rulers',
                    quantity: 20,
                    amount: 2000,
                    status: 'Pledged',
                    donorId,
                    pledgedDate: new Date(),
                },
                {
                    schoolId: adminId,
                    schoolObjectId: schoolId,
                    itemName: 'Markers',
                    quantity: 50,
                    amount: 5000,
                    status: 'Fulfilled',
                    donorId,
                    pledgedDate: new Date(),
                    fulfilledDate: new Date(),
                },
            ]);

            // Seed a High urgency open need from a verified school admin
            await ResourceRequest.create({
                schoolId: admin2._id,
                schoolObjectId: school2._id,
                itemName: 'Urgent Projectors',
                quantity: 2,
                amount: 100000,
                urgency: 'High',
                status: 'Open',
            });
        });

        it('[POSITIVE] should return correct overview stats for the donor', async () => {
            const response = await request(app)
                .get('/api/v1/donor/overview')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.total).toBe(2);
            expect(response.body.pending).toBe(1);    // Pledged count
            expect(response.body.fulfilled).toBe(1);
            expect(response.body.totalItems).toBe(70); // 20 + 50
            expect(response.body.schoolsSupported).toBe(1);
        });

        it('[POSITIVE] should include recentDonations (max 5)', async () => {
            const response = await request(app)
                .get('/api/v1/donor/overview')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.recentDonations).toBeDefined();
            expect(Array.isArray(response.body.recentDonations)).toBe(true);
            expect(response.body.recentDonations.length).toBeLessThanOrEqual(5);
        });

        it('[POSITIVE] should include urgentNeeds (max 3) with High urgency and Open status', async () => {
            const response = await request(app)
                .get('/api/v1/donor/overview')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.urgentNeeds).toBeDefined();
            expect(Array.isArray(response.body.urgentNeeds)).toBe(true);
            expect(response.body.urgentNeeds.length).toBeLessThanOrEqual(3);
            response.body.urgentNeeds.forEach((need) => {
                expect(need.urgency).toBe('High');
                expect(need.status).toBe('Open');
            });
        });

        it('[POSITIVE] should return zeroed stats if donor has no donations yet', async () => {
            // Delete seeded donations for this donor
            await ResourceRequest.deleteMany({ donorId });

            const response = await request(app)
                .get('/api/v1/donor/overview')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.total).toBe(0);
            expect(response.body.pending).toBe(0);
            expect(response.body.fulfilled).toBe(0);
            expect(response.body.totalItems).toBe(0);
            expect(response.body.schoolsSupported).toBe(0);
            expect(response.body.recentDonations).toEqual([]);
        });

        it('[NEGATIVE] should return 401 if no auth token provided', async () => {
            const response = await request(app)
                .get('/api/v1/donor/overview');

            expect(response.status).toBe(401);
        });
    });

    // ==========================================
    // 7. GET /impact — Impact Report
    // ==========================================
    describe('GET /api/v1/donor/impact — Impact Report', () => {
        beforeEach(async () => {
            const now = new Date();

            await ResourceRequest.create([
                {
                    schoolId: adminId,
                    schoolObjectId: schoolId,
                    itemName: 'Calculators',
                    quantity: 10,
                    amount: 30000,
                    status: 'Fulfilled',
                    donorId,
                    pledgedDate: now,
                    fulfilledDate: now, // This month
                },
                {
                    schoolId: adminId,
                    schoolObjectId: schoolId,
                    itemName: 'Calculators',
                    quantity: 5,
                    amount: 15000,
                    status: 'Fulfilled',
                    donorId,
                    pledgedDate: now,
                    fulfilledDate: now, // This month — same item to test mostDonated
                },
                {
                    schoolId: adminId,
                    schoolObjectId: schoolId,
                    itemName: 'Geometry Sets',
                    quantity: 20,
                    amount: 8000,
                    status: 'Fulfilled',
                    donorId,
                    pledgedDate: new Date('2024-01-15'),
                    fulfilledDate: new Date('2024-01-20'), // Past month
                },
            ]);
        });

        it('[POSITIVE] should return correct impact report totals', async () => {
            const response = await request(app)
                .get('/api/v1/donor/impact')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.totalItemsDonated).toBe(35);     // 10 + 5 + 20
            expect(response.body.totalSchoolsSupported).toBe(1);
        });

        it('[POSITIVE] should correctly identify the most donated item', async () => {
            const response = await request(app)
                .get('/api/v1/donor/impact')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            // Calculators: 10+5=15, Geometry Sets: 20 — Geometry Sets wins by quantity
            expect(response.body.mostDonatedItem).toBe('Geometry Sets');
        });

        it('[POSITIVE] should return correct this-month stats', async () => {
            const response = await request(app)
                .get('/api/v1/donor/impact')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.thisMonthItems).toBe(15);       // 10 + 5
            expect(response.body.thisMonthSchools).toBe(1);
        });

        it('[POSITIVE] should include a transparency log with item, quantity and date', async () => {
            const response = await request(app)
                .get('/api/v1/donor/impact')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.log)).toBe(true);
            expect(response.body.log.length).toBe(3);

            const firstEntry = response.body.log[0];
            expect(firstEntry).toHaveProperty('item');
            expect(firstEntry).toHaveProperty('quantity');
            expect(firstEntry).toHaveProperty('date');

            // API currently omits undefined fields from JSON responses.
            if (Object.prototype.hasOwnProperty.call(firstEntry, 'school')) {
                expect(typeof firstEntry.school === 'string' || firstEntry.school === null).toBe(true);
            }
        });

        it('[POSITIVE] should return N/A for mostDonatedItem if donor has no fulfilled donations', async () => {
            await ResourceRequest.deleteMany({ donorId });

            const response = await request(app)
                .get('/api/v1/donor/impact')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.totalItemsDonated).toBe(0);
            expect(response.body.mostDonatedItem).toBe('N/A');
            expect(response.body.log).toEqual([]);
        });

        it('[NEGATIVE] should return 401 if no auth token provided', async () => {
            const response = await request(app)
                .get('/api/v1/donor/impact');

            expect(response.status).toBe(401);
        });
    });
});