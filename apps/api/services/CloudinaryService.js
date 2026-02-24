import fs from "fs/promises";
import { v2 as cloudinary } from "cloudinary";

let isConfigured = false;

const ensureCloudinaryConfigured = () => {
  if (isConfigured) {
    return;
  }

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error(
      "Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });

  isConfigured = true;
};

const removeTemporaryFile = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch {
    // Ignore cleanup errors.
  }
};

const uploadFromBuffer = (fileBuffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(fileBuffer);
  });

export const uploadFileToCloudinary = async (file, { folder, resourceType = "auto" } = {}) => {
  if (!file) {
    throw new Error("No file received for Cloudinary upload");
  }

  ensureCloudinaryConfigured();

  const uploadOptions = {
    folder,
    resource_type: resourceType,
    use_filename: true,
    unique_filename: true,
  };

  if (file.path) {
    try {
      return await cloudinary.uploader.upload(file.path, uploadOptions);
    } finally {
      await removeTemporaryFile(file.path);
    }
  }

  if (file.buffer) {
    return uploadFromBuffer(file.buffer, uploadOptions);
  }

  throw new Error("Unsupported file payload for Cloudinary upload");
};