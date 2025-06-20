// backend/routes/userRoutes.js
const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  registerUser, loginUser, sendOtp,
  logout, forgotPassword, resetPassword,
  getUserDetails, updatePassword, updateProfile,
  getAllUsers, getSingleUser, updateUserRole, deleteUser, verifyOtp,checkUserExists
} = require("../controllers/userController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const { uploadAvatar } = require("../utils/multer"); // Already has .single("avatar")

const router = express.Router();

// ─── OTP RATE LIMIT ────────────────────────────────────────────────
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  keyGenerator: (req) =>
    (req.body.email || req.body.mobile || req.ip).toString().toLowerCase(),
  message: {
    success: false,
    message: "Too many OTP requests, please try again later.",
  },
});

// ─── PUBLIC ROUTES ─────────────────────────────────────────────────
router.post("/send-otp", otpLimiter, sendOtp);
router.post("/register", uploadAvatar, registerUser); // Already handles .single("avatar")
router.post("/login", loginUser);
router.post("/password/forgot", forgotPassword);
router.put("/password/reset/:token", resetPassword);
router.get("/logout", logout);
router.post("/verify-otp", verifyOtp);
router.post('/check-user-exists', checkUserExists);

// ─── PROTECTED USER ROUTES ─────────────────────────────────────────
router.get("/me", isAuthenticatedUser, getUserDetails);
router.put("/password/update", isAuthenticatedUser, updatePassword);
router.put("/me/update", isAuthenticatedUser, uploadAvatar, updateProfile); // Avatar update

// ─── ADMIN ROUTES ──────────────────────────────────────────────────
router.get(
  "/admin/users",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  getAllUsers
);

router
  .route("/admin/user/:id")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getSingleUser)
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateUserRole)
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteUser);

module.exports = router;
