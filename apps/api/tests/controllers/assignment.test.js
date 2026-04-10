import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// 🔧 Helper function to mock Express response object
// Allows chaining: res.status().json()
const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe("AssignmentController", () => {
  let createAssignment;
  let submitAssignment;

  // 🔧 Mocked dependencies (no real DB calls)
  let ModuleMock;
  let AssignmentMock;
  let AssignmentSubmissionMock;

  // 🔧 Helper to mock Mongoose populate chain:
  // Assignment.findById().populate()
  const mockAssignmentFindByIdPopulate = (assignmentDoc) => {
    AssignmentMock.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(assignmentDoc),
    });
  };

  beforeEach(async () => {
    // 🔄 Reset modules before each test to avoid test pollution
    jest.resetModules();

    // 📦 Mock Module model
    ModuleMock = {
      findById: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    // 📦 Mock Assignment model
    AssignmentMock = {
      findById: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    // 📦 Mock AssignmentSubmission model
    AssignmentSubmissionMock = {
      findById: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteMany: jest.fn(),
    };

    // 🔌 Inject mocks into modules using ESM mocking
    await jest.unstable_mockModule("../../models/Module.js", () => ({ default: ModuleMock }));
    await jest.unstable_mockModule("../../models/Assignment.js", () => ({ default: AssignmentMock }));
    await jest.unstable_mockModule("../../models/AssignmentSubmission.js", () => ({
      default: AssignmentSubmissionMock,
    }));

    // ☁️ Mock Cloudinary service (external dependency)
    await jest.unstable_mockModule("../../services/CloudinaryService.js", () => ({
      createSignedDownloadUrlFromCloudinaryUrl: jest.fn(),
      deleteCloudinaryAssetFromUrl: jest.fn(),
      getCloudinaryFileNameFromUrl: jest.fn(),
      uploadFileToCloudinary: jest.fn(),
    }));

    // 📥 Import controller AFTER mocks are set
    ({ createAssignment, submitAssignment } = await import("../../controllers/AssignmentController.js"));
  });

  // ✅ POSITIVE TEST
  // ✔ Tests successful assignment creation
  it("returns 201 when assignment is created", async () => {
    // Mock: module exists
    ModuleMock.findById.mockResolvedValue({ _id: "module-1" });

    // Mock: assignment created successfully
    AssignmentMock.create.mockResolvedValue({
      _id: "assignment-1",
      title: "Math Assignment",
    });

    const req = {
      body: {
        title: "  Math Assignment  ", // includes whitespace → should be trimmed
        description: "Chapter 1",
        module: "module-1",
        materialUrl: "https://example.com/math.pdf",
      },
      user: { _id: "teacher-1" }, // authenticated user
      files: {},
    };
    const res = createRes();

    await createAssignment(req, res);

    // ✔ Verify module lookup
    expect(ModuleMock.findById).toHaveBeenCalledWith("module-1");

    // ✔ Verify assignment creation
    expect(AssignmentMock.create).toHaveBeenCalled();

    // ✔ Verify success response
    expect(res.status).toHaveBeenCalledWith(201);
  });

  // ❌ NEGATIVE TEST
  // ✔ Tests submission failure when no file is uploaded
  it("returns 400 when submission file is missing", async () => {
    // Mock: assignment exists
    mockAssignmentFindByIdPopulate({
      _id: "assignment-1",
      module: { grade: "grade-1" },
    });

    const req = {
      params: { id: "assignment-1" },
      body: { notes: "Done" },
      files: {}, // ❌ No file uploaded
      user: { _id: "student-1", role: "super_admin" },
    };
    const res = createRes();

    await submitAssignment(req, res);

    // ✔ Expect validation error
    expect(res.status).toHaveBeenCalledWith(400);

    // ✔ Correct error message
    expect(res.json).toHaveBeenCalledWith({
      message: "Please upload your assignment work file",
    });
  });

  // ❌ NEGATIVE TEST
  // ✔ Tests when module does NOT exist
  it("returns 404 when module is not found", async () => {
    // Mock: module not found
    ModuleMock.findById.mockResolvedValue(null);

    const req = {
      body: {
        title: "Math Assignment",
        module: "module-1",
      },
      user: { _id: "teacher-1" },
      files: {},
    };
    const res = createRes();

    await createAssignment(req, res);

    // ✔ Expect NOT FOUND response
    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({
      message: "Module not found",
    });
  });

  // ❌ NEGATIVE TEST (SERVER ERROR)
  // ✔ Tests error handling when DB crashes
  it("returns 500 when database throws", async () => {
    // Mock: database failure
    ModuleMock.findById.mockRejectedValue(new Error("database down"));

    const req = {
      body: {
        title: "Math Assignment",
        module: "module-1",
      },
      user: { _id: "teacher-1" },
      files: {},
    };
    const res = createRes();

    await createAssignment(req, res);

    // ✔ Expect INTERNAL SERVER ERROR
    expect(res.status).toHaveBeenCalledWith(500);

    // ✔ Ensure error message returned
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Server error",
      })
    );
  });
});