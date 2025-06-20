const AdminLog = require("../models/adminLogModel");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

exports.getAdminLogs = catchAsyncErrors(async (req, res) => {
  const logs = await AdminLog.find()
    .sort({ createdAt: -1 })
    .populate("triggeredBy", "name email");

  // Attach a readable action message based on log type
  const enrichedLogs = logs.map((log) => {
    let actionDescription = "";

    switch (log.type) {
      case "OUT_OF_STOCK":
        actionDescription = `Marked '${log.productName}' as out of stock.`;
        break;
      case "RESTOCKED":
        actionDescription = `Restocked '${log.productName}'.`;
        break;
      case "DELETED":
        actionDescription = `Deleted product '${log.productName}'.`;
        break;
      case "UPDATED":
        actionDescription = `Updated product '${log.productName}'.`;
        break;
      default:
        actionDescription = `Performed action on '${log.productName}'.`;
    }

    return {
      ...log.toObject(),
      actionDescription,
    };
  });

  res.status(200).json({
    success: true,
    logs: enrichedLogs,
  });
});
