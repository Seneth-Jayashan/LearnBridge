import { jest } from "@jest/globals";

const mockSave = jest.fn();
const mockFindById = jest.fn();
const mockCreate = jest.fn();
const mockFindOneAndUpdate = jest.fn();
const mockFindOne = jest.fn();

const mockNeed = {
  _id: "69a048ad1a2596b8d971ca33",
  schoolId: "69a18f5ea3e1bb783cdda8e2",
  itemName: "Projector Screen",
  quantity: 1,
  amount: 15000,
  status: "Open",
  paymentOrderId: null,
  paymentStatus: null,
  donorId: null,
  pledgedDate: null,
  fulfilledDate: null,
  schoolId: {
    firstName: "School",
    lastName: "Admin",
    email: "school@gmail.com",
    toString: () => "69a18f5ea3e1bb783cdda8e2",
  },
  save: mockSave,
};

jest.unstable_mockModule("../models/ResourceRequest.js", () => ({
  default: {
    findById: mockFindById,
    create: mockCreate,
  },
}));

jest.unstable_mockModule("../models/Payment.js", () => ({
  default: {
    create: mockCreate,
    findOne: mockFindOne,
    findOneAndUpdate: mockFindOneAndUpdate,
  },
}));

const mockReq = (overrides = {}) => ({
  user: {
    _id: "699b530c484e2de121948852",
    firstName: "Tharusha",
    lastName: "Rukshan",
    email: "tharusha@gmail.com",
    phoneNumber: "0771234567",
    role: "donor",
    address: { street: "No 1 Main St", city: "Colombo" },
  },
  body: {},
  params: {},
  ...overrides,
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Payment Controller", () => {

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PAYHERE_MERCHANT_ID = "1233185";
    process.env.PAYHERE_MERCHANT_SECRET = "3959107928205198560016279156111713600809";
    process.env.PAYHERE_CURRENCY = "LKR";
    process.env.FRONTEND_URL = "http://localhost:5173";
    process.env.BACKEND_URL = "http://localhost:5000";
    process.env.PAYHERE_RETURN_URL = "http://localhost:5173/donor/payment-success";
    process.env.PAYHERE_CANCEL_URL = "http://localhost:5173/donor/payment-cancel";
    process.env.PAYHERE_NOTIFY_URL = "http://localhost:5000/api/v1/payments/notify";
  });

  // ── initiatePayment ───────────────────────────────────────────

  describe("initiatePayment", () => {
    test("✅ POSITIVE: generates payment data with hash", async () => {
      const { initiatePayment } = await import("../controllers/paymentController.js");
      const need = {
        ...mockNeed,
        status: "Open",
        save: mockSave.mockResolvedValue(true),
      };
      mockFindById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(need),
      });
      mockCreate.mockResolvedValue({});

      const req = mockReq({
        params: { needId: "69a048ad1a2596b8d971ca33" },
      });
      const res = mockRes();

      await initiatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          sandbox: true,
          merchant_id: "1233185",
          amount: "15000.00",
          currency: "LKR",
          hash: expect.any(String),
          order_id: expect.stringContaining("ORDER_"),
          items: "Projector Screen",
        })
      );
    });

    test("✅ POSITIVE: includes donor info in payment data", async () => {
      const { initiatePayment } = await import("../controllers/paymentController.js");
      const need = { ...mockNeed, save: mockSave.mockResolvedValue(true) };
      mockFindById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(need),
      });
      mockCreate.mockResolvedValue({});

      const req = mockReq({ params: { needId: "69a048ad1a2596b8d971ca33" } });
      const res = mockRes();

      await initiatePayment(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: "Tharusha",
          last_name: "Rukshan",
          email: "tharusha@gmail.com",
        })
      );
    });

    test("❌ NEGATIVE: returns 404 when need not found", async () => {
      const { initiatePayment } = await import("../controllers/paymentController.js");
      mockFindById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const req = mockReq({ params: { needId: "nonexistent" } });
      const res = mockRes();

      await initiatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Need not found" });
    });

    test("❌ NEGATIVE: returns 400 when need already pledged", async () => {
      const { initiatePayment } = await import("../controllers/paymentController.js");
      mockFindById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockNeed,
          status: "Pledged",
          paymentStatus: "Completed",
        }),
      });

      const req = mockReq({ params: { needId: "69a048ad1a2596b8d971ca33" } });
      const res = mockRes();

      await initiatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("❌ NEGATIVE: returns 400 when amount is 0", async () => {
      const { initiatePayment } = await import("../controllers/paymentController.js");
      mockFindById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({ ...mockNeed, amount: 0 }),
      });

      const req = mockReq({ params: { needId: "69a048ad1a2596b8d971ca33" } });
      const res = mockRes();

      await initiatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "This need has no amount set." });
    });

    test("❌ NEGATIVE: returns 500 when merchant config missing", async () => {
      const { initiatePayment } = await import("../controllers/paymentController.js");
      delete process.env.PAYHERE_MERCHANT_ID;

      const req = mockReq({ params: { needId: "69a048ad1a2596b8d971ca33" } });
      const res = mockRes();

      await initiatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Payment configuration missing." });
    });
  });

  // ── confirmPayment ────────────────────────────────────────────

  describe("confirmPayment", () => {
    test("✅ POSITIVE: confirms payment and sets Fulfilled", async () => {
      const { confirmPayment } = await import("../controllers/paymentController.js");
      const need = {
        ...mockNeed,
        status: "Open",
        paymentOrderId: "ORDER_69a048ad_123456",
        save: mockSave.mockResolvedValue(true),
      };
      mockFindById.mockResolvedValue(need);
      mockFindOneAndUpdate.mockResolvedValue({});

      const req = mockReq({
        body: {
          orderId: "ORDER_69a048ad_123456",
          needId: "69a048ad1a2596b8d971ca33",
        },
      });
      const res = mockRes();

      await confirmPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(need.status).toBe("Fulfilled");
      expect(need.fulfilledDate).toBeTruthy();
    });

    test("✅ POSITIVE: returns success when already fulfilled by webhook", async () => {
      const { confirmPayment } = await import("../controllers/paymentController.js");
      mockFindById.mockResolvedValue({
        ...mockNeed,
        status: "Fulfilled",
        paymentOrderId: "ORDER_69a048ad_123456",
      });

      const req = mockReq({
        body: {
          orderId: "ORDER_69a048ad_123456",
          needId: "69a048ad1a2596b8d971ca33",
        },
      });
      const res = mockRes();

      await confirmPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining("fulfilled") })
      );
    });

    test("❌ NEGATIVE: returns 404 when need not found", async () => {
      const { confirmPayment } = await import("../controllers/paymentController.js");
      mockFindById.mockResolvedValue(null);

      const req = mockReq({
        body: { orderId: "ORDER_123", needId: "nonexistent" },
      });
      const res = mockRes();

      await confirmPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("❌ NEGATIVE: returns 400 when order ID mismatches", async () => {
      const { confirmPayment } = await import("../controllers/paymentController.js");
      mockFindById.mockResolvedValue({
        ...mockNeed,
        paymentOrderId: "ORDER_CORRECT_ID",
      });

      const req = mockReq({
        body: {
          orderId: "ORDER_WRONG_ID",
          needId: "69a048ad1a2596b8d971ca33",
        },
      });
      const res = mockRes();

      await confirmPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Order ID mismatch" });
    });

    test("❌ NEGATIVE: returns 500 on server error", async () => {
      const { confirmPayment } = await import("../controllers/paymentController.js");
      mockFindById.mockRejectedValue(new Error("DB error"));

      const req = mockReq({
        body: { orderId: "ORDER_123", needId: "69a048ad1a2596b8d971ca33" },
      });
      const res = mockRes();

      await confirmPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});