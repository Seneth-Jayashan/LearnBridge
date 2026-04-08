import { describe, it, expect, jest, beforeEach } from "@jest/globals";

describe("CloudinaryService.uploadFileToCloudinary", () => {
  let uploadFileToCloudinary;
  let cloudinaryMock;

  beforeEach(async () => {
    jest.resetModules();

    // 🔐 Mock environment variables (required for Cloudinary config)
    process.env.CLOUDINARY_CLOUD_NAME = "demo";
    process.env.CLOUDINARY_API_KEY = "key";
    process.env.CLOUDINARY_API_SECRET = "secret";

    // ☁️ Mock Cloudinary SDK
    cloudinaryMock = {
      config: jest.fn(),
      uploader: {
        upload_stream: jest.fn(),
      },
      utils: {
        private_download_url: jest.fn(),
      },
      url: jest.fn(),
      api: {
        delete_resources: jest.fn(),
      },
    };

    // 🔌 Inject mock into module
    await jest.unstable_mockModule("cloudinary", () => ({
      v2: cloudinaryMock,
    }));

    // 📥 Import service AFTER mocking
    ({ uploadFileToCloudinary } = await import(
      "../../services/CloudinaryService.js"
    ));
  });

  // ✅ POSITIVE TEST
  // ✔ Upload succeeds and returns secure URL
  it("returns uploaded URL when cloudinary upload succeeds", async () => {
    // Mock successful upload_stream behavior
    cloudinaryMock.uploader.upload_stream.mockImplementation(
      (_options, callback) => ({
        end: () =>
          callback(null, {
            secure_url:
              "https://res.cloudinary.com/demo/raw/upload/v1/math.pdf",
          }),
      })
    );

    const result = await uploadFileToCloudinary(
      {
        originalname: "math.pdf",
        mimetype: "application/pdf",
        buffer: Buffer.from("mock-file"),
      },
      { folder: "learnbridge/tests", resourceType: "raw" }
    );

    // ✔ Ensure config is called
    expect(cloudinaryMock.config).toHaveBeenCalled();

    // ✔ Ensure upload_stream is triggered
    expect(cloudinaryMock.uploader.upload_stream).toHaveBeenCalled();

    // ✔ Validate returned result
    expect(result).toEqual(
      expect.objectContaining({
        secure_url:
          "https://res.cloudinary.com/demo/raw/upload/v1/math.pdf",
      })
    );
  });

  // ❌ NEGATIVE TEST
  // ✔ Upload fails → throws error
  it("throws error when cloudinary upload fails", async () => {
    // Mock failure
    cloudinaryMock.uploader.upload_stream.mockImplementation(
      (_options, callback) => ({
        end: () => callback(new Error("Cloudinary upload failed")),
      })
    );

    await expect(
      uploadFileToCloudinary(
        {
          originalname: "math.pdf",
          mimetype: "application/pdf",
          buffer: Buffer.from("mock-file"),
        },
        { folder: "learnbridge/tests", resourceType: "raw" }
      )
    ).rejects.toThrow("Cloudinary upload failed");
  });
});