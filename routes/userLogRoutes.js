const express = require("express");
const {
  getAllUserLogs,
  getUserLogsById,
  exportUserLogsCSV,
} = require("../controllers/userLogController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

// ✅ Get all logs with filters (Admin only)
router.get(
  "/admin",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  getAllUserLogs
);

// ✅ Get logs of specific user by ID (Admin only)
router.get(
  "/admin/user/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  getUserLogsById
);
router.get(
  "/admin/export/csv",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  exportUserLogsCSV
);
module.exports = router;
