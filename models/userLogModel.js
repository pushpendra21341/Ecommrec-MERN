const mongoose = require("mongoose");

const userLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        // Authentication & Account
        "USER_REGISTER",
        "USER_LOGIN",
        "USER_LOGOUT",
        "UPDATE_PROFILE",
        "CHANGE_PASSWORD",
        "FORGOT_PASSWORD",
        "RESET_PASSWORD",
        "DELETE_USER",

        // Product Interactions
        "SUBMIT_REVIEW",
        "DELETE_REVIEW",

        // Orders
        "PLACE_ORDER",
        "CANCEL_ORDER",
      ],
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    ipAddress: {
      type: String,
      default: "",
      trim: true,
    },
    userAgent: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UserLog", userLogSchema);
