const express = require("express");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const { getAdminLogs } = require("../controllers/adminLogController");

const router = express.Router();

router.get("/admin/logs", isAuthenticatedUser, authorizeRoles("admin"), getAdminLogs);

module.exports = router;
