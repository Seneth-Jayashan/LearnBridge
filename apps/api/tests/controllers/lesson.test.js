import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// 🔧 Mock Express response object
const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe("LessonController", () => {
  let createLesson;

  // 📦 Mock models
  let ModuleMock;
  let LessonMock;

  beforeEach(async () => {
    // 🔄 Reset modules before each test
    jest.resetModules();

    // 📦 Mock Module model
    ModuleMock = {
      findById: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    // 📦 Mock Lesson model
    LessonMock = {
      findById: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      deleteMany: jest.fn(),
      deleteOne: jest.fn(),
    };

    // 🔌 Inject model mocks
    await jest.unstable_mockModule("../../models/Module.js", () => ({
      default: ModuleMock,
    }));
    await jest.unstable_mockModule("../../models/Lesson.js", () => ({
      default: LessonMock,
    }));

    // 🎥 Mock Zoom service (for live lessons if used)
    await jest.unstable_mockModule("../../services/ZoomService.js", () => ({
      createZoomMeeting: jest.fn(),
    }));

    // ☁️ Mock Cloudinary service (file uploads)
    await jest.unstable_mockModule("../../services/CloudinaryService.js", () => ({
      createSignedDownloadUrlFromCloudinaryUrl: jest.fn(),
      deleteCloudinaryAssetFromUrl: jest.fn(),
      getCloudinaryFileNameFromUrl: jest.fn(),
      uploadFileToCloudinary: jest.fn(),
    }));

    // 📥 Import controller AFTER mocks
    ({ createLesson } = await import("../../controllers/LessonController.js"));
  });

  // ✅ POSITIVE TEST
  // ✔ Tests successful lesson creation
  it("returns 201 when lesson is created", async () => {
    // Mock: module exists
    ModuleMock.findById.mockResolvedValue({ _id: "module-1" });

    // Mock: lesson created
    LessonMock.create.mockResolvedValue({
      _id: "lesson-1",
      title: "Math Assignment",
    });

    const req = {
      body: {
        title: "Math Assignment",
        description: "Intro",
        module: "module-1",
        materialUrl: "https://example.com/lesson.pdf", // valid resource
      },
      user: { _id: "teacher-1" },
      files: {},
    };
    const res = createRes();

    await createLesson(req, res);

    // ✔ Expect success response
    expect(res.status).toHaveBeenCalledWith(201);
  });

  // ❌ NEGATIVE TEST
  // ✔ Tests validation when no lesson resource is provided
  it("returns 400 when required lesson resources are missing", async () => {
    ModuleMock.findById.mockResolvedValue({ _id: "module-1" });

    const req = {
      body: {
        title: "Math Assignment",
        module: "module-1",
        // ❌ No materialUrl and no files
      },
      user: { _id: "teacher-1" },
      files: {},
    };
    const res = createRes();

    await createLesson(req, res);

    // ✔ Expect validation error
    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          "Please upload at least one lesson resource (document or video)",
      })
    );
  });

  // ❌ NEGATIVE TEST
  // ✔ Tests when module does NOT exist
  it("returns 404 when module does not exist", async () => {
    // Mock: module not found
    ModuleMock.findById.mockResolvedValue(null);

    const req = {
      body: {
        title: "Math Assignment",
        module: "missing-module",
        materialUrl: "https://example.com/lesson.pdf",
      },
      user: { _id: "teacher-1" },
      files: {},
    };
    const res = createRes();

    await createLesson(req, res);

    // ✔ Expect NOT FOUND
    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({
      message: "Module not found",
    });
  });

  // ❌ NEGATIVE TEST (SERVER ERROR)
  // ✔ Tests DB failure handling
  it("returns 500 on database error", async () => {
    // Mock: DB throws error
    ModuleMock.findById.mockRejectedValue(new Error("db error"));

    const req = {
      body: {
        title: "Math Assignment",
        module: "module-1",
        materialUrl: "https://example.com/lesson.pdf",
      },
      user: { _id: "teacher-1" },
      files: {},
    };
    const res = createRes();

    await createLesson(req, res);

    // ✔ Expect INTERNAL SERVER ERROR
    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Server error",
      })
    );
  });
});