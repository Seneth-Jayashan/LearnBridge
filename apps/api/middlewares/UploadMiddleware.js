import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const lessonUploadDir = path.join(__dirname, "..", "uploads", "lessons");

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
