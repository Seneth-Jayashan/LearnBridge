import fs from "fs/promises";
import path from "path";
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

const sanitizeBaseName = (name) =>
  (name || "file")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "file";

const parseCloudinaryAssetUrl = (assetUrl) => {
  if (!assetUrl || !/^https?:\/\//i.test(assetUrl)) return null;

  let parsedUrl;
  try {
    parsedUrl = new URL(assetUrl);
  } catch {
    return null;
  }

  if (!/res\.cloudinary\.com$/i.test(parsedUrl.hostname)) {
    return null;
  }

  const segments = parsedUrl.pathname.split("/").filter(Boolean);
  if (segments.length < 4) {
    return null;
  }

  const resourceType = segments[1] || "raw";
  const deliveryType = segments[2] || "upload";
  const versionIndex = segments.findIndex(
    (segment, index) => index >= 3 && /^v\d+$/i.test(segment),
  );
  const publicIdStart = versionIndex >= 0 ? versionIndex + 1 : 3;
  if (publicIdStart >= segments.length) {
    return null;
  }

  const publicId = decodeURIComponent(segments.slice(publicIdStart).join("/"));
  const fileName = publicId.split("/").pop() || "";
  const extensionIndex = fileName.lastIndexOf(".");
  const format =
    extensionIndex > 0 && extensionIndex < fileName.length - 1
      ? fileName.slice(extensionIndex + 1).toLowerCase()
      : "";

  return {
    resourceType,
    deliveryType,
    publicId,
    fileName,
    format,
  };
};

const sanitizeAttachmentFileName = (name) => {
  if (!name) return "";
  const cleaned = String(name)
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, " ")
    .slice(0, 180);
  return cleaned || "";
};

export const getCloudinaryFileNameFromUrl = (assetUrl) => {
  const parsedAsset = parseCloudinaryAssetUrl(assetUrl);
  if (!parsedAsset?.fileName) return "";
  return sanitizeAttachmentFileName(parsedAsset.fileName);
};

export const deleteCloudinaryAssetFromUrl = async (assetUrl) => {
  const parsedAsset = parseCloudinaryAssetUrl(assetUrl);
  if (!parsedAsset) {
    return false;
  }

  ensureCloudinaryConfigured();

  const parsedUrl = new URL(assetUrl);
  const pathAfterUpload = (() => {
    const match = parsedUrl.pathname.match(/\/upload\/(.+)$/i);
    return match?.[1] || "";
  })();

  const pathWithoutVersion = pathAfterUpload.replace(/^.*?\/v\d+\//i, "");
  const folderMarkerIndex = pathAfterUpload.toLowerCase().indexOf("learnbridge/");
  const pathFromFolder = folderMarkerIndex >= 0 ? pathAfterUpload.slice(folderMarkerIndex) : "";

  const stripExtensionFromLastSegment = (value) => {
    if (!value) return "";
    const segments = value.split("/");
    const last = segments.pop() || "";
    const normalizedLast = last.replace(/\.[^./]+$/, "");
    return [...segments, normalizedLast].filter(Boolean).join("/");
  };

  const publicIdCandidates = Array.from(
    new Set(
      [
        parsedAsset.publicId,
        stripExtensionFromLastSegment(parsedAsset.publicId),
        pathWithoutVersion,
        stripExtensionFromLastSegment(pathWithoutVersion),
        pathFromFolder,
        stripExtensionFromLastSegment(pathFromFolder),
      ].filter(Boolean),
    ),
  );

  const resourceTypeCandidates = Array.from(
    new Set([parsedAsset.resourceType || "raw", "video", "raw", "image"]),
  );
  const deliveryTypeCandidates = Array.from(
    new Set([parsedAsset.deliveryType || "upload", "upload"]),
  );

  let sawNotFound = false;

  for (const resourceType of resourceTypeCandidates) {
    for (const deliveryType of deliveryTypeCandidates) {
      for (const publicId of publicIdCandidates) {
        try {
          const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
            type: deliveryType,
            invalidate: true,
          });

          if (result?.result === "ok") {
            return true;
          }

          if (result?.result === "not found") {
            sawNotFound = true;
          }
        } catch {
          // Try next candidate.
        }
      }

      try {
        const bulkResult = await cloudinary.api.delete_resources(publicIdCandidates, {
          resource_type: resourceType,
          type: deliveryType,
          invalidate: true,
        });

        const deletedMap = bulkResult?.deleted || {};
        const deleteStatuses = Object.values(deletedMap);

        if (deleteStatuses.some((status) => status === "deleted")) {
          return true;
        }

        if (deleteStatuses.some((status) => status === "not_found")) {
          sawNotFound = true;
        }
      } catch {
        // Continue trying other candidate combinations.
      }
    }
  }

  return sawNotFound;
};

export const uploadFileToCloudinary = async (file, { folder, resourceType = "auto" } = {}) => {
  if (!file) {
    throw new Error("No file received for Cloudinary upload");
  }

  ensureCloudinaryConfigured();

  // Auto-detect common document mimetypes and force raw upload so Cloudinary
  // doesn't treat them as images or attempt conversions.
  let resolvedResourceType = resourceType;
  const mimetype = file.mimetype || "";
  const docMimeMarkers = ["pdf", "msword", "officedocument", "vnd.openxmlformats"];
  if (resourceType === "auto" && mimetype) {
    const lower = mimetype.toLowerCase();
    if (docMimeMarkers.some((m) => lower.includes(m))) {
      resolvedResourceType = "raw";
    }
  }
  // If mimetype is missing or unreliable, fall back to filename extension detection
  if (resourceType === "auto" && resolvedResourceType === "auto") {
    const filename = (file.originalname || file.path || "").toString();
    const ext = (filename.split("?")[0].split('.').pop() || '').toLowerCase();
    const docExts = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx"];
    if (docExts.includes(ext)) {
      resolvedResourceType = "raw";
    }
  }

  const uploadOptions = {
    folder,
    resource_type: resolvedResourceType,
    use_filename: true,
    unique_filename: true,
  };

  const originalName = (file.originalname || "").toString().trim();
  if (originalName) {
    const parsed = path.parse(originalName);
    const safeBaseName = sanitizeBaseName(parsed.name);
    const ext = (parsed.ext || "").replace(/^\./, "").toLowerCase();
    const uniqueSuffix = Date.now();

    if (resolvedResourceType === "raw" && ext) {
      uploadOptions.public_id = `${safeBaseName}_${uniqueSuffix}.${ext}`;
    } else {
      uploadOptions.public_id = `${safeBaseName}_${uniqueSuffix}`;
    }

    uploadOptions.use_filename = false;
    uploadOptions.unique_filename = false;
  }

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

export const createSignedDownloadUrlFromCloudinaryUrl = (
  assetUrl,
  { expiresInSeconds = 300, fileName = "" } = {},
) => {
  if (!assetUrl) return "";

  const parsedAsset = parseCloudinaryAssetUrl(assetUrl);
  if (!parsedAsset) {
    return assetUrl;
  }

  const attachmentFileName =
    sanitizeAttachmentFileName(fileName) || sanitizeAttachmentFileName(parsedAsset.fileName);

  ensureCloudinaryConfigured();

  const expiresAt = Math.floor(Date.now() / 1000) + Math.max(60, Number(expiresInSeconds) || 300);

  if (parsedAsset.resourceType === "raw" && parsedAsset.format) {
    return cloudinary.utils.private_download_url(parsedAsset.publicId, parsedAsset.format, {
      resource_type: "raw",
      type: parsedAsset.deliveryType || "upload",
      expires_at: expiresAt,
      attachment: attachmentFileName || true,
      secure: true,
    });
  }

  const attachmentFlag = attachmentFileName
    ? `attachment:${attachmentFileName}`
    : "attachment";

  return cloudinary.url(parsedAsset.publicId, {
    resource_type: parsedAsset.resourceType || "raw",
    type: parsedAsset.deliveryType || "upload",
    secure: true,
    sign_url: true,
    expires_at: expiresAt,
    flags: attachmentFlag,
  });
};