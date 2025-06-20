const UserLog = require("../models/userLogModel");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { Parser } = require("json2csv");

// Export logs as CSV (admin only)
exports.exportUserLogsCSV = catchAsyncErrors(async (req, res, next) => {
  const filters = {};

  if (req.query.type) filters.type = req.query.type;
  if (req.query.userId) filters.userId = req.query.userId;
  if (req.query.ipAddress) filters.ipAddress = req.query.ipAddress;
  if (req.query.userAgent) filters.userAgent = req.query.userAgent;
  if (req.query.startDate || req.query.endDate) {
    filters.createdAt = {};
    if (req.query.startDate) filters.createdAt.$gte = new Date(req.query.startDate);
    if (req.query.endDate) filters.createdAt.$lte = new Date(req.query.endDate);
  }

  const logs = await UserLog.find(filters)
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

  const fields = ["_id", "type", "userId.name", "userId.email", "message", "ipAddress", "userAgent", "createdAt"];
  const parser = new Parser({ fields });
  const csv = parser.parse(logs);

  res.header("Content-Type", "text/csv");
  res.attachment("user_logs.csv");
  res.send(csv);
});

// Get all user logs (admin only, with filters and pagination)
exports.getAllUserLogs = catchAsyncErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filters = {};

  // Filter by userId
  if (req.query.userId) {
    filters.userId = req.query.userId;
  }

  // Filter by type
  if (req.query.type) {
    filters.type = req.query.type;
  }

  // Filter by date range
  if (req.query.startDate || req.query.endDate) {
    filters.createdAt = {};
    if (req.query.startDate) {
      filters.createdAt.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      filters.createdAt.$lte = new Date(req.query.endDate);
    }
  }

  const logs = await UserLog.find(filters)
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await UserLog.countDocuments(filters);

  res.status(200).json({
    success: true,
    logs,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

// Get logs of a specific user (admin only)
exports.getUserLogsById = catchAsyncErrors(async (req, res, next) => {
  const userId = req.params.id;

  const logs = await UserLog.find({ userId })
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

  if (!logs || logs.length === 0) {
    return next(new ErrorHandler("No logs found for this user", 404));
  }

  res.status(200).json({
    success: true,
    logs,
  });
});
