const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = "uploads/assignments";

// Create directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Format: assignment_1738330000_filename.pdf
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const cleanFileName = file.originalname.replace(/\s+/g, "_");
    cb(null, `assignment_${uniqueSuffix}_${cleanFileName}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/jpg"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF, Word, and Images are allowed."), false);
  }
};

module.exports = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB Limit
});
