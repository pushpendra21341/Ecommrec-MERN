const logUserActivity = async (userId, type, message = "", req = null) => {
  try {
    const logData = {
      userId,
      type,
      message,
    };

    // If request is passed, include IP and User-Agent
    if (req) {
      logData.ipAddress = req.ip || req.headers["x-forwarded-for"] || "";
      logData.userAgent = req.headers["user-agent"] || "";
    }

    await UserLog.create(logData);
  } catch (err) {
    console.error("UserLog Error:", err.message);
  }
};
module.exports = logUserActivity;