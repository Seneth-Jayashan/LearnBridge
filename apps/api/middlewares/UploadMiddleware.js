import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const courseUploadDir = path.join(__dirname, "..", "uploads", "courses");

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

const uploadCourseMediaFields = uploader.fields([
	{ name: "thumbnail", maxCount: 1 },
	{ name: "thumbnailUrl", maxCount: 1 },
	{ name: "introVideo", maxCount: 1 },
	{ name: "introVideoUrl", maxCount: 1 },
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
