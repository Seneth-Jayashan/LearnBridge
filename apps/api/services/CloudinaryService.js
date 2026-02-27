import fs from "fs/promises";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

let isConfigured = false;

/*
  CloudinaryService
  - Purpose: provide safe, robust helpers for uploading files to Cloudinary,
    deleting assets by URL, extracting a user-friendly filename from an
    asset URL, and generating short-lived signed download URLs.
  - Notes:
    * The module defers Cloudinary configuration until the first operation
      that needs it (`ensureCloudinaryConfigured`) so the service can be
      imported without immediate environment validation.
    * Upload functions support both buffer and temporary-file payloads
      (Multer memory storage or disk uploads). Files are uploaded using
      `uploadFileToCloudinary` which chooses an appropriate `resource_type`.
    * Deletion attempts several publicId/resource-type combinations and
      falls back to bulk delete when individual deletes don't find assets.
*/

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

  }
};

// Helper: attempt to remove a temporary file path created by disk-based upload
// providers. Failing to remove a temp file is non-fatal so errors are swallowed.

const uploadFromBuffer = (fileBuffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(fileBuffer);
  });

// Upload helper that streams a Buffer to Cloudinary using the SDK's upload_stream.
// This is used when files come from Multer's memoryStorage (file.buffer).

const sanitizeBaseName = (name) =>
  (name || "file")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "file";

// Create a safe short base name for public_id generation. Keeps only safe
// characters and trims to a reasonable length.

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

// Parse a Cloudinary asset URL into components we can use for delete
// and signed-url generation. Returns `null` for non-Cloudinary or invalid URLs.

const sanitizeAttachmentFileName = (name) => {
  if (!name) return "";
  const cleaned = String(name)
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, " ")
    .slice(0, 180);
  return cleaned || "";
};

// Sanitize a filename for use as an attachment filename when generating
// download responses. Removes problematic filesystem characters and collapses
// whitespace.

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
        
      }
    }
  }

  return sawNotFound;
};

// Attempt to delete the asset referenced by a Cloudinary URL.
// The function is tolerant: it tries a set of plausible `public_id` forms,
// resource types, and delivery types, and also issues a bulk delete as a
// fallback. Returns `true` when a deletion occurred, `false` when nothing
// was found or deletion failed.

export const uploadFileToCloudinary = async (file, { folder, resourceType = "auto" } = {}) => {
  if (!file) {
    throw new Error("No file received for Cloudinary upload");
  }

  ensureCloudinaryConfigured();

  
  let resolvedResourceType = resourceType;
  const mimetype = file.mimetype || "";
  const docMimeMarkers = ["pdf", "msword", "officedocument", "vnd.openxmlformats"];
  if (resourceType === "auto" && mimetype) {
    const lower = mimetype.toLowerCase();
    if (docMimeMarkers.some((m) => lower.includes(m))) {
      resolvedResourceType = "raw";
    }
  }
  
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

// Main upload entrypoint used by controllers/services.
// - Accepts `file.path` (disk) or `file.buffer` (memory). Chooses resource
//   type heuristically when `resourceType: "auto"` is provided.
// - Generates a predictable `public_id` when `originalname` is present to
//   make debugging and manual cleanup easier.

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

// Generate a short-lived, signed download URL for Cloudinary assets.
// - For `raw` (document) resources we use `private_download_url` so attachments
//   are served with the correct content-disposition and filename.
// - For other resources (image/video), we request a signed `cloudinary.url`
//   with an `attachment` flag so browsers prompt to download with the given name.