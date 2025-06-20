const mongoose = require("mongoose");

const adminLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "CREATE_PRODUCT",
        "UPDATE_PRODUCT",
        "DELETE_PRODUCT",
        "OUT_OF_STOCK",
        "RESTOCKED",
      ],
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin user
      required: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

module.exports = mongoose.model("AdminLog", adminLogSchema);