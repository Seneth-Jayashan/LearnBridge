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

export default upload;