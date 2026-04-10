import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// 🔧 Mock Express response object
const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe("KnowledgeBaseController", () => {
  let createKnowledgeBaseEntry;
  let getKnowledgeBaseAttachmentDownloadUrlPublic;

  // 📦 Mock models
  let KnowledgeBaseMock;
  let LessonMock;

  // ☁️ Mock Cloudinary upload function
  let uploadFileToCloudinaryMock;

  beforeEach(async () => {
    // 🔄 Reset modules before each test
    jest.resetModules();

    // 📦 Mock KnowledgeBase model
    KnowledgeBaseMock = {
      findById: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      deleteOne: jest.fn(),
    };

    // 📦 Mock Lesson model (dependency)
    LessonMock = {
      findById: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    // ☁️ Mock Cloudinary upload
    uploadFileToCloudinaryMock = jest.fn();

    // 🔌 Inject mocks
    await jest.unstable_mockModule("../../models/KnowledgeBase.js", () => ({
      default: KnowledgeBaseMock,
    }));
    await jest.unstable_mockModule("../../models/Lesson.js", () => ({
      default: LessonMock,
    }));

    await jest.unstable_mockModule("../../services/CloudinaryService.js", () => ({
      uploadFileToCloudinary: uploadFileToCloudinaryMock,
      deleteCloudinaryAssetFromUrl: jest.fn(),
      createSignedDownloadUrlFromCloudinaryUrl: jest.fn(),
      getCloudinaryFileNameFromUrl: jest.fn(),
    }));

    // 📥 Import controller AFTER mocks
    ({
      createKnowledgeBaseEntry,
      getKnowledgeBaseAttachmentDownloadUrlPublic,
    } = await import("../../controllers/KnowledgeBaseController.js"));
  });

  // ✅ POSITIVE TEST
  // ✔ Tests successful knowledge base entry creation
  it("returns 201 when knowledge entry is created", async () => {
    KnowledgeBaseMock.create.mockResolvedValue({
      _id: "kb-1",
      title: "Math Assignment",
    });

    const req = {
      body: {
        title: "Math Assignment",
        content: "How to solve",
        category: "General",
      },
      user: { _id: "teacher-1" },
      files: {},
    };
    const res = createRes();

    await createKnowledgeBaseEntry(req, res);

    // ✔ Ensure DB create is called
    expect(KnowledgeBaseMock.create).toHaveBeenCalled();

    // ✔ Expect success response
    expect(res.status).toHaveBeenCalledWith(201);
  });

  // ❌ NEGATIVE TEST
  // ✔ Tests failure when attachment upload fails
  it("returns 400 when attachment payload is invalid", async () => {
    // Mock Cloudinary failure
    uploadFileToCloudinaryMock.mockRejectedValue(
      new Error("Attachment payload missing")
    );

    const req = {
      body: {
        title: "Math Assignment",
        content: "How to solve",
      },
      user: { _id: "teacher-1" },
      files: {
        attachment: [{ originalname: "broken.pdf" }],
      },
    };
    const res = createRes();

    await createKnowledgeBaseEntry(req, res);

    // ✔ Expect BAD REQUEST
    expect(res.status).toHaveBeenCalledWith(400);

    // ✔ Error message should mention upload failure
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Failed to upload attachment"),
      })
    );
  });

  // ❌ NEGATIVE TEST
  // ✔ Tests fetching download URL when entry does NOT exist
  it("returns 404 when knowledge entry is not found", async () => {
    KnowledgeBaseMock.findById.mockResolvedValue(null);

    const req = {
      params: { id: "kb-404" },
      query: {},
    };
    const res = createRes();

    await getKnowledgeBaseAttachmentDownloadUrlPublic(req, res);

    // ✔ Expect NOT FOUND
    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({
      message: "Knowledge base entry not found",
    });
  });

  // ❌ NEGATIVE TEST (SERVER ERROR)
  // ✔ Tests DB failure handling
  it("returns 500 on server error", async () => {
    KnowledgeBaseMock.create.mockRejectedValue(
      new Error("db crashed")
    );

    const req = {
      body: {
        title: "Math Assignment",
        content: "How to solve",
      },
      user: { _id: "teacher-1" },
      files: {},
    };
    const res = createRes();

    await createKnowledgeBaseEntry(req, res);

    // ✔ Expect INTERNAL SERVER ERROR
    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Server error",
      })
    );
  });
});