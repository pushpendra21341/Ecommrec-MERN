require("dotenv").config({ path: "backend/config/config.env" });
const twilio = require("twilio");

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendOTPVerify = async ({ to, channel }) => {
  try {
    // ✅ Ensure number is in E.164 format (default to +91 if not present)
    let formattedTo = to.startsWith("+") ? to : `+91${to}`;

    const verification = await client.verify
      .v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to: formattedTo, channel });

    console.log("Twilio OTP sent:", verification.status);
  } catch (error) {
    console.error("Twilio OTP sending error:", error);
    throw error;
  }
};

module.exports = sendOTPVerify;
