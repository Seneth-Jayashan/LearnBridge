import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// 🔧 Mock Express response object
const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe("ModuleController", () => {
  let createModule;
  let getModuleById;

  // 📦 Mock models
  let ModuleMock;
  let LessonMock;
  let AssignmentMock;
  let AssignmentSubmissionMock;

  // 🔧 Mock save() for new Module()
  let saveMock;

  // 🔧 Mock business validators
  let validateCreateModuleBusinessRulesMock;
  let validateUpdateModuleBusinessRulesMock;

  // 🧪 Custom validation error class (simulating real validator)
  let TestModuleValidationError;

  // 🔗 Helper to mock nested populate:
  // Module.findById().populate().populate()
  const mockFindByIdWithPopulate = (doc) => {
    const secondPopulate = jest.fn().mockResolvedValue(doc);
    const firstPopulate = jest.fn().mockReturnValue({ populate: secondPopulate });
    ModuleMock.findById.mockReturnValue({ populate: firstPopulate });
  };

  beforeEach(async () => {
    jest.resetModules();

    // Mock save()
    saveMock = jest.fn().mockResolvedValue(undefined);

    // Mock Module constructor
    ModuleMock = jest.fn().mockImplementation((payload) => ({
      ...payload,
      save: saveMock,
    }));

    // Mock static methods
    ModuleMock.findById = jest.fn();
    ModuleMock.find = jest.fn();
    ModuleMock.create = jest.fn();
    ModuleMock.findByIdAndUpdate = jest.fn();
    ModuleMock.findByIdAndDelete = jest.fn();
    ModuleMock.deleteOne = jest.fn();
    ModuleMock.aggregate = jest.fn();

    // Mock related models
    LessonMock = {
      findById: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      distinct: jest.fn(),
      deleteMany: jest.fn(),
    };

    AssignmentMock = {
      findById: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      deleteMany: jest.fn(),
    };

    AssignmentSubmissionMock = {
      findById: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      deleteMany: jest.fn(),
    };

    // Mock validators
    validateCreateModuleBusinessRulesMock = jest.fn();
    validateUpdateModuleBusinessRulesMock = jest.fn();

    // Custom validation error
    TestModuleValidationError = class extends Error {
      constructor(message) {
        super(message);
        this.name = "ModuleValidationError";
      }
    };

    // Inject mocks
    await jest.unstable_mockModule("../../models/Module.js", () => ({ default: ModuleMock }));
    await jest.unstable_mockModule("../../models/Lesson.js", () => ({ default: LessonMock }));
    await jest.unstable_mockModule("../../models/Assignment.js", () => ({ default: AssignmentMock }));
    await jest.unstable_mockModule("../../models/AssignmentSubmission.js", () => ({
      default: AssignmentSubmissionMock,
    }));

    // Mock Cloudinary
    await jest.unstable_mockModule("../../services/CloudinaryService.js", () => ({
      uploadFileToCloudinary: jest.fn(),
      deleteCloudinaryAssetFromUrl: jest.fn(),
    }));

    // Mock validators module
    await jest.unstable_mockModule("../../validators/ModuleValidator.js", () => ({
      ModuleValidationError: TestModuleValidationError,
      validateCreateModuleBusinessRules: validateCreateModuleBusinessRulesMock,
      validateUpdateModuleBusinessRules: validateUpdateModuleBusinessRulesMock,
    }));

    // Import controller
    ({ createModule, getModuleById } = await import("../../controllers/ModuleController.js"));
  });

  // ✅ POSITIVE TEST
  // ✔ Successful module creation
  it("returns 201 when module is created", async () => {
    validateCreateModuleBusinessRulesMock.mockResolvedValue({
      normalizedName: "Math Assignment",
      normalizedSubjectStream: null,
      nextLevel: "level-1",
      nextGrade: "grade-1",
    });

    const req = {
      body: {
        name: "Math Assignment",
        description: "Core module",
        level: "level-1",
        grade: "grade-1",
      },
      files: {},
    };
    const res = createRes();

    await createModule(req, res);

    // ✔ Ensure save() is called
    expect(saveMock).toHaveBeenCalled();

    // ✔ Success response
    expect(res.status).toHaveBeenCalledWith(201);
  });

  // ❌ NEGATIVE TEST (VALIDATION ERROR)
  // ✔ Business rule validation fails
  it("returns 400 when required fields fail business validation", async () => {
    validateCreateModuleBusinessRulesMock.mockRejectedValue(
      new TestModuleValidationError("Level is required.")
    );

    const req = {
      body: {
        name: "Math Assignment",
        grade: "grade-1",
      },
      files: {},
    };
    const res = createRes();

    await createModule(req, res);

    // ✔ Expect BAD REQUEST
    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      message: "Level is required.",
    });
  });

  // ❌ NEGATIVE TEST (NOT FOUND)
  // ✔ Module not found in DB
  it("returns 404 when module is not found", async () => {
    mockFindByIdWithPopulate(null);

    const req = { params: { id: "module-404" } };
    const res = createRes();

    await getModuleById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({
      message: "Module not found",
    });
  });

  // ❌ NEGATIVE TEST (SERVER ERROR)
  // ✔ Unexpected error (not validation error)
  it("returns 500 on server error", async () => {
    validateCreateModuleBusinessRulesMock.mockRejectedValue(
      new Error("db failed")
    );

    const req = {
      body: {
        name: "Math Assignment",
        level: "level-1",
        grade: "grade-1",
      },
      files: {},
    };
    const res = createRes();

    await createModule(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Server error",
      })
    );
  });
});