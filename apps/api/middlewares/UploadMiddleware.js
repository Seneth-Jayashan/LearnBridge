import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const courseUploadDir = path.join(__dirname, "..", "uploads", "courses");
const lessonUploadDir = path.join(__dirname, "..", "uploads", "lessons");

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		fs.mkdirSync(courseUploadDir, { recursive: true });
		cb(null, courseUploadDir);
	},
	filename: (_req, file, cb) => {
		const sanitized = file.originalname
			.toLowerCase()
			.replace(/[^a-z0-9._-]/g, "-")
			.replace(/-+/g, "-");
		const timestamp = Date.now();
		cb(null, `${timestamp}-${sanitized}`);
	},
});

const fileFilter = (_req, file, cb) => {
	if (
		(file.fieldname === "thumbnail" || file.fieldname === "thumbnailUrl") &&
		file.mimetype.startsWith("image/")
	) {
		return cb(null, true);
	}

	if (
		(file.fieldname === "introVideo" || file.fieldname === "introVideoUrl") &&
		file.mimetype.startsWith("video/")
	) {
		return cb(null, true);
	}

	cb(new Error("Invalid file type for upload"));
};

const uploader = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 100 * 1024 * 1024,
	},
});

const lessonStorage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		fs.mkdirSync(lessonUploadDir, { recursive: true });
		cb(null, lessonUploadDir);
	},
	filename: (_req, file, cb) => {
		const sanitized = file.originalname
			.toLowerCase()
			.replace(/[^a-z0-9._-]/g, "-")
			.replace(/-+/g, "-");
		const timestamp = Date.now();
		cb(null, `${timestamp}-${sanitized}`);
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
	storage: lessonStorage,
	fileFilter: lessonFileFilter,
	limits: {
		fileSize: 200 * 1024 * 1024,
	},
});

const uploadCourseMediaFields = uploader.fields([
	{ name: "thumbnail", maxCount: 1 },
	{ name: "thumbnailUrl", maxCount: 1 },
	{ name: "introVideo", maxCount: 1 },
	{ name: "introVideoUrl", maxCount: 1 },
]);

const uploadLessonMediaFields = lessonUploader.fields([
	{ name: "material", maxCount: 1 },
	{ name: "materialUrl", maxCount: 1 },
	{ name: "video", maxCount: 1 },
	{ name: "videoUrl", maxCount: 1 },
]);

export const uploadCourseMedia = (req, res, next) => {
	uploadCourseMediaFields(req, res, (err) => {
		if (!err) {
			return next();
		}

		if (err instanceof multer.MulterError) {
			return res.status(400).json({ message: err.message });
		}

		return res.status(400).json({ message: err.message || "File upload failed" });
	});
};

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
