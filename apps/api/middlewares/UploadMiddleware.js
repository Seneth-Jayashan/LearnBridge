import multer from "multer";

// Use memory storage because files are immediately uploaded to Cloudinary
// from buffers; no local disk persistence is needed.
const storage = multer.memoryStorage();

/*
  Lesson uploads
  - Accepts either direct file fields (`material`, `video`) or fallback
	fields that carry pre-uploaded URLs (`materialUrl`, `videoUrl`).
  - Allowed document types: PDF and Word documents. Videos must have
	a `video/*` mime type.
  - Limit: 200 MB per file (chosen to allow large video uploads).
*/
const lessonFileFilter = (_req, file, cb) => {
	const isMaterialField =
		file.fieldname === "material" || file.fieldname === "materialUrl";
	const isVideoField = file.fieldname === "video" || file.fieldname === "videoUrl";

	const allowedDocumentMimeTypes = [
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	];

	if (isMaterialField && allowedDocumentMimeTypes.includes(file.mimetype)) {
		return cb(null, true);
	}

	if (isVideoField && file.mimetype.startsWith("video/")) {
		return cb(null, true);
	}

	// Reject anything else for lesson uploads
	cb(new Error("Invalid lesson file type. Only PDF/Word documents and videos are allowed"));
};

const lessonUploader = multer({
	storage,
	fileFilter: lessonFileFilter,
	limits: {
		fileSize: 200 * 1024 * 1024,
	},
});

const uploadLessonMediaFields = lessonUploader.fields([
	{ name: "material", maxCount: 1 },
	{ name: "materialUrl", maxCount: 1 },
	{ name: "video", maxCount: 1 },
	{ name: "videoUrl", maxCount: 1 },
]);

// Middleware wrapper: standardizes Multer errors into JSON responses
export const uploadLessonMedia = (req, res, next) => {
	uploadLessonMediaFields(req, res, (err) => {
		if (!err) {
			return next();
		}

		if (err instanceof multer.MulterError) {
			return res.status(400).json({ message: err.message });
		}

		return res.status(400).json({ message: err.message || "File upload failed" });
	});
};

/*
  Module thumbnail uploads
  - Thumbnails must be images and are limited to 15 MB to keep thumbnails small.
*/
const moduleFileFilter = (_req, file, cb) => {
	const isThumbnailField =
		file.fieldname === "thumbnail" || file.fieldname === "thumbnailUrl";

	if (isThumbnailField && file.mimetype.startsWith("image/")) {
		return cb(null, true);
	}

	cb(new Error("Invalid module thumbnail file type. Only images are allowed"));
};

const moduleUploader = multer({
	storage,
	fileFilter: moduleFileFilter,
	limits: {
		fileSize: 15 * 1024 * 1024,
	},
});

const uploadModuleThumbnailFields = moduleUploader.fields([
	{ name: "thumbnail", maxCount: 1 },
	{ name: "thumbnailUrl", maxCount: 1 },
]);

export const uploadModuleThumbnail = (req, res, next) => {
	uploadModuleThumbnailFields(req, res, (err) => {
		if (!err) {
			return next();
		}

		if (err instanceof multer.MulterError) {
			return res.status(400).json({ message: err.message });
		}

		return res.status(400).json({ message: err.message || "File upload failed" });
	});
};

/*
  Knowledge Base attachments
  - Allows images, video, and common document types (PDF/Word).
  - Limit: 150 MB per file and up to 5 attachments per request.
*/
const kbFileFilter = (_req, file, cb) => {
	const allowedDocumentMimeTypes = [
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	];

	if (file.mimetype.startsWith("image/")) return cb(null, true);
	if (file.mimetype.startsWith("video/")) return cb(null, true);
	if (allowedDocumentMimeTypes.includes(file.mimetype)) return cb(null, true);

	cb(new Error("Invalid file type. Allowed: images, videos, PDF/Word documents"));
};

const kbUploader = multer({
	storage,
	fileFilter: kbFileFilter,
	limits: { fileSize: 150 * 1024 * 1024 },
});

const uploadKBAttachmentFields = kbUploader.fields([{ name: "attachment", maxCount: 5 }]);

export const uploadKBAttachment = (req, res, next) => {
	uploadKBAttachmentFields(req, res, (err) => {
		if (!err) return next();

		if (err instanceof multer.MulterError) {
			return res.status(400).json({ message: err.message });
		}

		return res.status(400).json({ message: err.message || "File upload failed" });
	});
};

/*
  Assignment uploads
  - Accepts assignment materials and student submissions.
  - Allowed: images, PDF/Word, ZIP, and plain text.
  - Limit: 100 MB per file.
*/
const assignmentFileFilter = (_req, file, cb) => {
	const isAssignmentField =
		file.fieldname === "material" ||
		file.fieldname === "materialUrl" ||
		file.fieldname === "submission" ||
		file.fieldname === "submissionUrl";

	if (!isAssignmentField) {
		return cb(new Error("Invalid assignment upload field"));
	}

	const allowedMimeTypes = [
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"application/zip",
		"application/x-zip-compressed",
		"text/plain",
	];

	if (file.mimetype.startsWith("image/")) return cb(null, true);
	if (allowedMimeTypes.includes(file.mimetype)) return cb(null, true);

	cb(new Error("Invalid assignment file type. Allowed: PDF/Word, images, ZIP, or TXT"));
};

const assignmentUploader = multer({
	storage,
	fileFilter: assignmentFileFilter,
	limits: {
		fileSize: 100 * 1024 * 1024,
	},
});

const uploadAssignmentFileFields = assignmentUploader.fields([
	{ name: "material", maxCount: 1 },
	{ name: "materialUrl", maxCount: 1 },
	{ name: "submission", maxCount: 1 },
	{ name: "submissionUrl", maxCount: 1 },
]);

export const uploadAssignmentFiles = (req, res, next) => {
	uploadAssignmentFileFields(req, res, (err) => {
		if (!err) {
			return next();
		}

		if (err instanceof multer.MulterError) {
			return res.status(400).json({ message: err.message });
		}

		return res.status(400).json({ message: err.message || "File upload failed" });
	});
};
