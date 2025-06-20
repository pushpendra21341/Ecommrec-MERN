const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const changeLogSchema = new mongoose.Schema({
  field: { type: String, required: true },
  oldValue: String,
  newValue: String,
  changedAt: { type: Date, default: Date.now },
  changedBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please Enter your name"],
      maxLength: [30, "Name must be at most 30 characters"],
      minLength: [2, "Name must be at least 2 characters"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
      validate: [validator.isEmail, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
      minLength: [8, "Password should be at least 8 characters"],
      select: false,
    },
    avatar: {
      public_id: {
        type: String,
        default: "default_avatar_public_id",
      },
      url: {
        type: String,
        default:
          "https://res.cloudinary.com/demo/image/upload/v1234567890/default_avatar.png",
      },
    },
    mobile: {
      type: String,
      required: [true, "Please enter your mobile number"],
      unique: true,
      validate: {
        validator: function (v) {
          return /^\+91\d{10}$/.test(v); // Must be in +91XXXXXXXXXX format
        },
        message: "Please enter a valid 10-digit mobile number with +91 prefix",
      },
    },
    isMobileVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: "user",
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
    joinedOn: {
      type: Date,
      default: Date.now,
    },
    lastUpdated: {
      type: Date,
      default: null,
    },
    changeHistory: [changeLogSchema],
  },
  { timestamps: true }
);

// Encrypt password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// JWT Token
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate reset password token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model("User", userSchema);