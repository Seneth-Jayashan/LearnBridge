import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// 🔧 Mock Express response object
const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe("UploadMiddleware.uploadAssignmentFiles", () => {
  let uploadAssignmentFiles;

  // 🔧 Delegate simulates multer behavior
  let delegate;

  // 🧪 Mock MulterError class
  class MockMulterError extends Error {}

  // 📦 Mock multer package
  const multerMock = jest.fn(() => ({
    fields: jest.fn(() => (_req, _res, cb) => delegate(_req, _res, cb)),
  }));

  // Mock storage + error type
  multerMock.memoryStorage = jest.fn(() => "memory-storage");
  multerMock.MulterError = MockMulterError;

  beforeEach(async () => {
    jest.resetModules();

    // Default behavior → success
    delegate = (_req, _res, cb) => cb();

    // Inject mocked multer
    await jest.unstable_mockModule("multer", () => ({
      default: multerMock,
    }));

    // Import middleware AFTER mocking
    ({ uploadAssignmentFiles } = await import(
      "../../middlewares/UploadMiddleware.js"
    ));
  });

  // ✅ POSITIVE TEST
  // ✔ Valid file upload → calls next()
  it("passes valid upload and calls next", () => {
    const req = {
      files: {
        submission: [{ originalname: "math.pdf" }],
      },
    };
    const res = createRes();
    const next = jest.fn();

    uploadAssignmentFiles(req, res, next);

    // ✔ Middleware should continue
    expect(next).toHaveBeenCalled();

    // ✔ No error response
    expect(res.status).not.toHaveBeenCalled();
  });

  // ❌ NEGATIVE TEST
  // ✔ Missing file → validation error
  it("returns error when file is missing", () => {
    // Simulate multer error
    delegate = (_req, _res, cb) => cb(new Error("File is required"));

    const req = { files: {} };
    const res = createRes();
    const next = jest.fn();

    uploadAssignmentFiles(req, res, next);

    // ✔ Should NOT proceed
    expect(next).not.toHaveBeenCalled();

    // ✔ Expect BAD REQUEST
    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      message: "File is required",
    });
  });

  // ❌ NEGATIVE TEST
  // ✔ Invalid file type → validation error
  it("returns error for invalid file type", () => {
    delegate = (_req, _res, cb) =>
      cb(new Error("Invalid assignment file type"));

    const req = {
      files: {
        submission: [{ originalname: "malware.exe" }],
      },
    };
    const res = createRes();
    const next = jest.fn();

    uploadAssignmentFiles(req, res, next);

    // ✔ Should NOT proceed
    expect(next).not.toHaveBeenCalled();

    // ✔ Expect BAD REQUEST
    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid assignment file type",
    });
  });
});