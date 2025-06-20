// backend/utils/multer.js
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");

// Create /uploads folder if it doesn't exist
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed image extensions
const allowedTypes = /\.(jpe?g|png|webp)$/i;

// Reusable disk storage factory
function getStorage(prefix = "image") {
  return multer.diskStorage({
    destination(req, file, cb) {
      cb(null, uploadDir);
    },
    filename(req, file, cb) {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      // fallback to .jpg if no ext
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${prefix}-${unique}${ext}`);
    },
  });
}

// Common fileFilter
function fileFilter(req, file, cb) {
  if (allowedTypes.test(path.extname(file.originalname))) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpg, jpeg, png, webp)"), false);
  }
}

module.exports = {
  // single avatar upload (field name: "avatar")
  uploadAvatar: multer({
    storage: getStorage("avatar"),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter,
  }).single("avatar"),

  // up to 5 product images (field name: "images")
  uploadProductImages: multer({
    storage: getStorage("product"),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter,
  }).array("images", 5),
};
