import { jest } from "@jest/globals";

// ── Mock models ────────────────────────────────────────────────
const mockFind = jest.fn();
const mockFindById = jest.fn();
const mockCreate = jest.fn();
const mockSave = jest.fn();
const mockDeleteOne = jest.fn();

const mockNeed = {
  _id: "69a048ad1a2596b8d971ca33",
  schoolId: "69a18f5ea3e1bb783cdda8e2",
  itemName: "Geometry Boxes",
  quantity: 5,
  amount: 2500,
  description: "For grade 10",
  urgency: "High",
  status: "Open",
  donorId: null,
  pledgedDate: null,
  fulfilledDate: null,
  paymentOrderId: null,
  paymentStatus: null,
  createdAt: new Date().toISOString(),
  save: mockSave,
  deleteOne: mockDeleteOne,
  toString: () => "69a048ad1a2596b8d971ca33",
};

const mockDonorNeed = {
  ...mockNeed,
  status: "Pledged",
  donorId: {
    _id: "699b530c484e2de121948852",
    firstName: "Tharusha",
    lastName: "Rukshan",
    email: "tharusha@gmail.com",
  },
  toString: () => "69a048ad1a2596b8d971ca33",
};

jest.unstable_mockModule("../models/ResourceRequest.js", () => ({
  default: {
    find: mockFind,
    findById: mockFindById,
    create: mockCreate,
  },
}));

jest.unstable_mockModule("../models/User.js", () => ({
  default: {
    find: jest.fn().mockResolvedValue([]),
  },
}));

const mockReq = (overrides = {}) => ({
  user: {
    _id: "69a18f5ea3e1bb783cdda8e2",
    firstName: "School",
    lastName: "Admin",
    email: "school@gmail.com",
    role: "school_admin",
    school: "69a18f5ea3e1bb783cdda8e0",
  },
  body: {},
  params: {},
  query: {},
  ...overrides,
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Donation Controller", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getAllNeeds ────────────────────────────────────────────────

  describe("getAllNeeds", () => {
    test("✅ POSITIVE: returns all needs successfully", async () => {
      const { getAllNeeds } = await import("../controllers/donationController.js");
      mockFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([mockNeed]),
          }),
        }),
      });

      const req = mockReq({ query: {} });
      const res = mockRes();

      await getAllNeeds(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ itemName: "Geometry Boxes" })])
      );
    });

    test("✅ POSITIVE: filters by urgency", async () => {
      const { getAllNeeds } = await import("../controllers/donationController.js");
      mockFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([mockNeed]),
          }),
        }),
      });

      const req = mockReq({ query: { urgency: "High" } });
      const res = mockRes();

      await getAllNeeds(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("❌ NEGATIVE: returns 500 on server error", async () => {
      const { getAllNeeds } = await import("../controllers/donationController.js");
      mockFind.mockImplementation(() => {
        throw new Error("DB error");
      });

      const req = mockReq({ query: {} });
      const res = mockRes();

      await getAllNeeds(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── pledgeDonation ────────────────────────────────────────────

  describe("pledgeDonation", () => {
    test("✅ POSITIVE: pledges successfully when status is Open", async () => {
      const { pledgeDonation } = await import("../controllers/donationController.js");
      const need = {
        ...mockNeed,
        status: "Open",
        save: mockSave.mockResolvedValue(true),
      };

      mockFindById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(need),
      });

      mockFindById.mockResolvedValueOnce(need);
      jest.unstable_mockModule("../models/ResourceRequest.js", () => ({
        default: {
          find: mockFind,
          findById: jest.fn()
            .mockResolvedValueOnce(need)
            .mockReturnValue({
              populate: jest.fn().mockResolvedValue(need),
            }),
          create: mockCreate,
        },
      }));

      const req = mockReq({
        params: { id: "69a048ad1a2596b8d971ca33" },
        user: { _id: "donor123" },
      });
      const res = mockRes();

      await pledgeDonation(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("❌ NEGATIVE: returns 404 when need not found", async () => {
      const { pledgeDonation } = await import("../controllers/donationController.js");
      mockFindById.mockResolvedValue(null);

      const req = mockReq({ params: { id: "nonexistent" } });
      const res = mockRes();

      await pledgeDonation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Need not found" });
    });

    test("❌ NEGATIVE: returns 400 when already pledged", async () => {
      const { pledgeDonation } = await import("../controllers/donationController.js");
      mockFindById.mockResolvedValue({ ...mockNeed, status: "Pledged" });

      const req = mockReq({ params: { id: "69a048ad1a2596b8d971ca33" } });
      const res = mockRes();

      await pledgeDonation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining("already Pledged") })
      );
    });

    test("❌ NEGATIVE: returns 400 when already fulfilled", async () => {
      const { pledgeDonation } = await import("../controllers/donationController.js");
      mockFindById.mockResolvedValue({ ...mockNeed, status: "Fulfilled" });

      const req = mockReq({ params: { id: "69a048ad1a2596b8d971ca33" } });
      const res = mockRes();

      await pledgeDonation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ── createNeed ────────────────────────────────────────────────

  describe("createNeed", () => {
    test("✅ POSITIVE: creates need successfully with all fields", async () => {
      const { createNeed } = await import("../controllers/SchoolAdminController.js");
      mockCreate.mockResolvedValue(mockNeed);

      const req = mockReq({
        body: {
          itemName: "Geometry Boxes",
          quantity: 5,
          amount: 2500,
          description: "For grade 10",
          urgency: "High",
        },
      });
      const res = mockRes();

      await createNeed(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Need posted successfully" })
      );
    });

    test("✅ POSITIVE: creates need with default urgency Medium", async () => {
      const { createNeed } = await import("../controllers/SchoolAdminController.js");
      mockCreate.mockResolvedValue({ ...mockNeed, urgency: "Medium" });

      const req = mockReq({
        body: {
          itemName: "Notebooks",
          quantity: 10,
          amount: 1500,
        },
      });
      const res = mockRes();

      await createNeed(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test("❌ NEGATIVE: returns 400 when itemName missing", async () => {
      const { createNeed } = await import("../controllers/SchoolAdminController.js");

      const req = mockReq({
        body: { quantity: 5, amount: 2500 },
      });
      const res = mockRes();

      await createNeed(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Item name and quantity are required." })
      );
    });

    test("❌ NEGATIVE: returns 400 when quantity missing", async () => {
      const { createNeed } = await import("../controllers/SchoolAdminController.js");

      const req = mockReq({
        body: { itemName: "Boxes", amount: 2500 },
      });
      const res = mockRes();

      await createNeed(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("❌ NEGATIVE: returns 400 when amount is 0", async () => {
      const { createNeed } = await import("../controllers/SchoolAdminController.js");

      const req = mockReq({
        body: { itemName: "Boxes", quantity: 5, amount: 0 },
      });
      const res = mockRes();

      await createNeed(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Please enter a valid amount." })
      );
    });

    test("❌ NEGATIVE: returns 500 on database error", async () => {
      const { createNeed } = await import("../controllers/SchoolAdminController.js");
      mockCreate.mockRejectedValue(new Error("DB error"));

      const req = mockReq({
        body: { itemName: "Boxes", quantity: 5, amount: 2500 },
      });
      const res = mockRes();

      await createNeed(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── updateNeed ────────────────────────────────────────────────

  describe("updateNeed", () => {
    test("✅ POSITIVE: updates need successfully", async () => {
      const { updateNeed } = await import("../controllers/SchoolAdminController.js");
      const need = {
        ...mockNeed,
        schoolId: { toString: () => "69a18f5ea3e1bb783cdda8e2" },
        save: mockSave.mockResolvedValue(true),
      };
      mockFindById.mockResolvedValue(need);

      const req = mockReq({
        params: { id: "69a048ad1a2596b8d971ca33" },
        body: { itemName: "Updated Boxes", quantity: 10, amount: 3000 },
      });
      const res = mockRes();

      await updateNeed(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Need updated successfully" })
      );
    });

    test("❌ NEGATIVE: returns 404 when need not found", async () => {
      const { updateNeed } = await import("../controllers/SchoolAdminController.js");
      mockFindById.mockResolvedValue(null);

      const req = mockReq({
        params: { id: "nonexistent" },
        body: { itemName: "Updated" },
      });
      const res = mockRes();

      await updateNeed(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("❌ NEGATIVE: returns 403 when not authorized", async () => {
      const { updateNeed } = await import("../controllers/SchoolAdminController.js");
      const need = {
        ...mockNeed,
        schoolId: { toString: () => "differentSchoolId" },
      };
      mockFindById.mockResolvedValue(need);

      const req = mockReq({
        params: { id: "69a048ad1a2596b8d971ca33" },
        body: { itemName: "Updated" },
      });
      const res = mockRes();

      await updateNeed(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test("❌ NEGATIVE: returns 400 when need is already pledged", async () => {
      const { updateNeed } = await import("../controllers/SchoolAdminController.js");
      const need = {
        ...mockNeed,
        status: "Pledged",
        schoolId: { toString: () => "69a18f5ea3e1bb783cdda8e2" },
      };
      mockFindById.mockResolvedValue(need);

      const req = mockReq({
        params: { id: "69a048ad1a2596b8d971ca33" },
        body: { itemName: "Updated" },
      });
      const res = mockRes();

      await updateNeed(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Cannot edit a need that is already pledged or fulfilled",
        })
      );
    });
  });

  // ── deleteNeed ────────────────────────────────────────────────

  describe("deleteNeed", () => {
    test("✅ POSITIVE: deletes need successfully", async () => {
      const { deleteNeed } = await import("../controllers/SchoolAdminController.js");
      const need = {
        ...mockNeed,
        schoolId: { toString: () => "69a18f5ea3e1bb783cdda8e2" },
        deleteOne: mockDeleteOne.mockResolvedValue(true),
      };
      mockFindById.mockResolvedValue(need);

      const req = mockReq({ params: { id: "69a048ad1a2596b8d971ca33" } });
      const res = mockRes();

      await deleteNeed(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Need deleted successfully" })
      );
    });

    test("❌ NEGATIVE: returns 404 when need not found", async () => {
      const { deleteNeed } = await import("../controllers/SchoolAdminController.js");
      mockFindById.mockResolvedValue(null);

      const req = mockReq({ params: { id: "nonexistent" } });
      const res = mockRes();

      await deleteNeed(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("❌ NEGATIVE: returns 403 when not authorized", async () => {
      const { deleteNeed } = await import("../controllers/SchoolAdminController.js");
      const need = {
        ...mockNeed,
        schoolId: { toString: () => "differentSchoolId" },
      };
      mockFindById.mockResolvedValue(need);

      const req = mockReq({ params: { id: "69a048ad1a2596b8d971ca33" } });
      const res = mockRes();

      await deleteNeed(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test("❌ NEGATIVE: returns 400 when need is already pledged", async () => {
      const { deleteNeed } = await import("../controllers/SchoolAdminController.js");
      const need = {
        ...mockNeed,
        status: "Pledged",
        schoolId: { toString: () => "69a18f5ea3e1bb783cdda8e2" },
      };
      mockFindById.mockResolvedValue(need);

      const req = mockReq({ params: { id: "69a048ad1a2596b8d971ca33" } });
      const res = mockRes();

      await deleteNeed(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("❌ NEGATIVE: returns 500 on server error", async () => {
      const { deleteNeed } = await import("../controllers/SchoolAdminController.js");
      mockFindById.mockRejectedValue(new Error("DB error"));

      const req = mockReq({ params: { id: "69a048ad1a2596b8d971ca33" } });
      const res = mockRes();

      await deleteNeed(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── getDonorDetails ───────────────────────────────────────────

  describe("getDonorDetails", () => {
    test("✅ POSITIVE: returns donor details successfully", async () => {
      const { getDonorDetails } = await import("../controllers/SchoolAdminController.js");
      const need = {
        ...mockDonorNeed,
        schoolId: { toString: () => "69a18f5ea3e1bb783cdda8e2" },
      };
      mockFindById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(need),
      });

      const req = mockReq({
        params: { needId: "69a048ad1a2596b8d971ca33" },
      });
      const res = mockRes();

      await getDonorDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          donor: expect.objectContaining({ firstName: "Tharusha" }),
        })
      );
    });

    test("❌ NEGATIVE: returns 404 when need not found", async () => {
      const { getDonorDetails } = await import("../controllers/SchoolAdminController.js");
      mockFindById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const req = mockReq({ params: { needId: "nonexistent" } });
      const res = mockRes();

      await getDonorDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("❌ NEGATIVE: returns 403 when not authorized", async () => {
      const { getDonorDetails } = await import("../controllers/SchoolAdminController.js");
      const need = {
        ...mockDonorNeed,
        schoolId: { toString: () => "differentSchoolId" },
      };
      mockFindById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(need),
      });

      const req = mockReq({ params: { needId: "69a048ad1a2596b8d971ca33" } });
      const res = mockRes();

      await getDonorDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test("❌ NEGATIVE: returns 404 when no donor assigned yet", async () => {
      const { getDonorDetails } = await import("../controllers/SchoolAdminController.js");
      const need = {
        ...mockNeed,
        donorId: null,
        schoolId: { toString: () => "69a18f5ea3e1bb783cdda8e2" },
      };
      mockFindById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(need),
      });

      const req = mockReq({ params: { needId: "69a048ad1a2596b8d971ca33" } });
      const res = mockRes();

      await getDonorDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "No donor found for this need" });
    });
  });

  // ── getMyPostedNeeds ──────────────────────────────────────────

  describe("getMyPostedNeeds", () => {
    test("✅ POSITIVE: returns school admin posted needs", async () => {
      const { getMyPostedNeeds } = await import("../controllers/SchoolAdminController.js");
      mockFind.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockNeed]),
      });

      const req = mockReq();
      const res = mockRes();

      await getMyPostedNeeds(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ itemName: "Geometry Boxes" })])
      );
    });

    test("✅ POSITIVE: returns empty array when no needs", async () => {
      const { getMyPostedNeeds } = await import("../controllers/SchoolAdminController.js");
      mockFind.mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const req = mockReq();
      const res = mockRes();

      await getMyPostedNeeds(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    test("❌ NEGATIVE: returns 500 on server error", async () => {
      const { getMyPostedNeeds } = await import("../controllers/SchoolAdminController.js");
      mockFind.mockImplementation(() => {
        throw new Error("DB error");
      });

      const req = mockReq();
      const res = mockRes();

      await getMyPostedNeeds(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});