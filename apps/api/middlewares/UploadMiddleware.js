import multer from "multer";

// store file in RAM (not disk) → needed for pdf2json
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,

  // limit file size (20MB)
  limits: {
    fileSize: 20 * 1024 * 1024,
  },

  // allow only PDFs
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});


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

// --- Knowledge Base Attachment Uploader ---
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

export default upload;

