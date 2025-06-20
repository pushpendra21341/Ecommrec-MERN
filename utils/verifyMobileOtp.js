// utils/verifyMobileOtp.js
require("dotenv").config({ path: "backend/config/config.env" });
const twilio = require("twilio");

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const verifyMobileOtp = async ({ to, code }) => {
  try {
    const formattedTo = to.startsWith("+") ? to : `+91${to}`;

    const verificationCheck = await client.verify
      .v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: formattedTo, code });

    console.log("OTP verification status:", verificationCheck.status);
    return verificationCheck.status === "approved";
  } catch (error) {
    console.error("Error verifying mobile OTP:", error);
    throw error;
  }
};

module.exports = verifyMobileOtp;
