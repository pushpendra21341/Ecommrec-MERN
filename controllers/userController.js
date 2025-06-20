require("dotenv").config({ path: "backend/config/config.env" });
const validator = require("validator");
const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;
const fs = require("fs/promises");
const OtpToken = require("../models/otpModel");
const verifyCaptcha = require("../utils/verifyCaptcha");
const verifyMobileOtp = require("../utils/verifyMobileOtp");
const sendOTPVerify = require("../utils/sendOTPVerify");
const UserLog = require("../models/userLogModel");
const logUserActivity = require("../utils/logUserActivity");
const twilioClient = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const otpRequestTracker = new Map();


// Register a user
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  let {
    name,
    email,
    password,
    confirmPassword,
    captchaToken, 
    emailOtp,
    mobileOtp,
    mobile,
  } = req.body;


  if (!name || !email || !password || !confirmPassword || !mobile) {
    return next(new ErrorHandler("All fields are required", 400));
  }

  if (password !== confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

  email = email.trim().toLowerCase();
  mobile = mobile.trim();

  // CAPTCHA verification
  const captchaValid = await verifyCaptcha(captchaToken);
  if (!captchaValid) {
    return next(new ErrorHandler("CAPTCHA verification failed", 400));
  }

  // Check if email or mobile exists
  const emailExists = await User.findOne({ email });
  if (emailExists) {
    return next(new ErrorHandler("Email already registered", 400));
  }

  const formattedMobile = mobile.startsWith("+91") ? mobile : `+91${mobile}`;
  const mobileExists = await User.findOne({ mobile: { $in: [mobile, formattedMobile] } });
  if (mobileExists) {
    return next(new ErrorHandler("Mobile number already registered", 400));
  }

  // Verify Email OTP
  const otpRecord = await OtpToken.findOne({ email });
  if (!otpRecord || !(await otpRecord.compareOtp(emailOtp))) {
    return next(new ErrorHandler("Invalid or expired email OTP", 400));
  }

  const otpAge = Date.now() - new Date(otpRecord.createdAt).getTime();
  if (otpAge > 5 * 60 * 1000) {
    await OtpToken.deleteOne({ email });
    return next(new ErrorHandler("Email OTP expired", 400));
  }

  // Verify Mobile OTP via Twilio
  const verification = await twilioClient.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID)
    .verificationChecks.create({
      to: formattedMobile,
      code: mobileOtp,
    });

  if (verification.status !== "approved") {
    return next(new ErrorHandler("Invalid or expired mobile OTP", 400));
  }

  // Avatar logic
  let avatarData = {
    public_id: "default_avatar_public_id",
    url: "https://res.cloudinary.com/dgf4b5p03/image/upload/v1749968584/Deafult_ny0ojf.jpg",
  };

  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });

    // Cleanup file after upload
    const fs = require("fs/promises");
    await fs.unlink(req.file.path);

    avatarData = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  }

  // Create the user
  const user = await User.create({
    name,
    email,
    mobile: formattedMobile,
    password,
    avatar: avatarData,
    isMobileVerified: true,
  });

  // Clean up OTP
  await OtpToken.deleteOne({ email });
await logUserActivity(user._id, "USER_REGISTER", "User registered successfully", req);

  sendToken(user, 201, res);
});



// Login user
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, mobile, password, otp } = req.body;

  // ✅ Require password + OTP + either email or mobile
  if ((!email && !mobile) || !password || !otp) {
    return next(
      new ErrorHandler("Email or Mobile, Password, and OTP are required", 400)
    );
  }

  let user;
  const isEmailLogin = !!email;

  if (isEmailLogin) {
    // ✅ Validate email format
    if (!validator.isEmail(email)) {
      return next(new ErrorHandler("Invalid email format", 400));
    }
    user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  } else {
    // ✅ Validate mobile format
    let formattedMobile;
    if (/^\+91\d{10}$/.test(mobile)) {
      formattedMobile = mobile;
    } else if (/^\d{10}$/.test(mobile)) {
      formattedMobile = `+91${mobile}`;
    } else {
      return next(new ErrorHandler("Invalid mobile number format", 400));
    }
    user = await User.findOne({ mobile: formattedMobile }).select("+password");

  }

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // ✅ Check password
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Incorrect password", 401));
  }

  // ✅ OTP Verification
  if (isEmailLogin) {
    const otpRecord = await OtpToken.findOne({ email: user.email });
    if (!otpRecord || !(await otpRecord.compareOtp(otp))) {
      return next(new ErrorHandler("Invalid or expired email OTP", 400));
    }
    user.isEmailVerified = true;
    await user.save();
    await OtpToken.deleteOne({ email: user.email });
  } else {
    const check = await twilioClient.verify
      .v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: user.mobile.startsWith("+") ? user.mobile : `+91${user.mobile}`,
        code: otp,
      });
    if (check.status !== "approved") {
      return next(new ErrorHandler("Invalid or expired mobile OTP", 400));
    }
    user.isMobileVerified = true;

    await user.save();
  }
await logUserActivity(user._id, "USER_LOGIN", "User logged in successfully", req);

  // ✅ Success: Send token
  sendToken(user, 200, res);
});


// Logout
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
if (req.user && req.user._id) {
  await logUserActivity(user._id, "USER_LOGOUT", "User logged out successfully",req);
}

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// Forgot Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new ErrorHandler("User not found with this email", 404));

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/password/reset/${resetToken}`;

  const message = `Your password reset link is:\n\n${resetPasswordUrl}\n\nIf not requested, ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Ecommerce Password Recovery",
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email}`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    await logUserActivity(user._id, "FORGOT_PASSWORD", "Password reset link sent",req);

    return next(new ErrorHandler(error.message, 500));
  }
});

// Reset Password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) return next(new ErrorHandler("Reset Token is invalid or expired", 400));
  if (req.body.password !== req.body.confirmPassword)
    return next(new ErrorHandler("Passwords do not match", 400));

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  await logUserActivity(user._id, "CHANGE_PASSWORD", "User reset password via link",req);

  sendToken(user, 200, res);
});

// Get User Details
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, user });
});

// Update Password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");
  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched)
    return next(new ErrorHandler("Old password is incorrect", 400));

  if (req.body.newPassword !== req.body.confirmPassword)
    return next(new ErrorHandler("Passwords do not match", 400));

  user.password = req.body.newPassword;
  await user.save();
await logUserActivity(user._id, "CHANGE_PASSWORD", "User changed password",req);

  sendToken(user, 200, res);
});

// ✅ Update Profile (with changeHistory)
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) return next(new ErrorHandler("User not found", 404));

  const fieldsToUpdate = ["name", "email"];
  const changeLogs = [];

  for (let field of fieldsToUpdate) {
    const newValue = req.body[field];
    if (newValue && user[field] !== newValue) {
      changeLogs.push({
        field,
        oldValue: String(user[field] || ""),
        newValue: String(newValue),
        changedBy: req.user._id,
      });
      user[field] = newValue;
    }
  }

  if (req.file) {
    if (user.avatar && user.avatar.public_id) {
      await cloudinary.uploader.destroy(user.avatar.public_id);
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });

    await fs.unlink(req.file.path);

    changeLogs.push({
      field: "avatar",
      oldValue: JSON.stringify(user.avatar),
      newValue: JSON.stringify({
        public_id: result.public_id,
        url: result.secure_url,
      }),
      changedBy: req.user._id,
    });

    user.avatar = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  }

  if (changeLogs.length > 0) {
    user.changeHistory.push(...changeLogs);
    user.lastUpdated = new Date();
  }

  await user.save();
  await logUserActivity(user._id, "UPDATE_PROFILE", "User profile updated",req);


  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user,
  });
});

// 🔁 Admin: Get All Users
exports.getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({ success: true, users });
});

// 🔁 Admin: Get Single User
exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .populate("changeHistory.changedBy", "name role");  // <-- populate name & role

  if (!user) {
    return next(new ErrorHandler(`User not found with ID: ${req.params.id}`, 404));
  }

  res.status(200).json({ success: true, user });
});

// ✅ Admin: Update Role + Name + Email (with logging)
exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user)
    return next(new ErrorHandler(`User does not exist with ID: ${req.params.id}`, 404));

  const changeLogs = [];
  const fieldsToUpdate = ["name", "email", "role"];

  for (let field of fieldsToUpdate) {
    const newValue = req.body[field];
    if (newValue && user[field] !== newValue) {
      changeLogs.push({
        field,
        oldValue: String(user[field] || ""),
        newValue: String(newValue),
        changedBy: req.user._id,
      });
      user[field] = newValue;
    }
  }

  if (changeLogs.length > 0) {
    user.changeHistory.push(...changeLogs);
    user.lastUpdated = new Date();
  }

  await user.save();
await logUserActivity(user._id, "UPDATE_PROFILE", "Admin updated user role/profile",req);

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    user,
  });
});

// Admin: Delete User
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user)
    return next(new ErrorHandler(`User does not exist with ID: ${req.params.id}`, 404));

  if (user.avatar && user.avatar.public_id) {
    await cloudinary.uploader.destroy(user.avatar.public_id);
  }

  await User.findByIdAndDelete(req.params.id);
  await logUserActivity(user._id, "DELETE_USER", "Admin deleted the user",req);

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

// Send OTP via Twilio Verify
exports.sendOtp = catchAsyncErrors(async (req, res, next) => {
  const { email, mobile } = req.body;

  if (!email && !mobile) {
    return next(new ErrorHandler("Email or mobile is required", 400));
  }

  const emailSanitized = email?.trim().toLowerCase();
  const formattedMobile = mobile?.startsWith("+") ? mobile : mobile ? `+91${mobile}` : null;
  const key = `${emailSanitized || "noemail"}_${formattedMobile || "nomobile"}`;

  // Basic rate limiting (per email+mobile or just one)
  const lastSent = otpRequestTracker.get(key);
  if (lastSent && Date.now() - lastSent < 60000) {
    return next(new ErrorHandler("Please wait 60 seconds before retrying", 429));
  }

  const otpResults = { emailSent: false, smsSent: false };
  const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // === SEND EMAIL OTP ===
    if (emailSanitized) {
      await OtpToken.findOneAndDelete({ email: emailSanitized });
      await new OtpToken({ email: emailSanitized, otp: emailOtp }).save();

      await sendEmail({
        email: emailSanitized,
        subject: "Your Email Verification OTP",
        message: `Your OTP is ${emailOtp}. It is valid for 5 minutes.`,
      });

      otpResults.emailSent = true;

      if (process.env.NODE_ENV !== "production") {
        console.log("Email OTP:", emailOtp);
      }
    }

    // === SEND MOBILE OTP ===
    if (formattedMobile) {
      await sendOTPVerify({ to: formattedMobile, channel: "sms" });
      otpResults.smsSent = true;
    }

    if (!otpResults.emailSent && !otpResults.smsSent) {
      return next(new ErrorHandler("Failed to send OTP", 500));
    }

    otpRequestTracker.set(key, Date.now());

    res.status(200).json({
      success: true,
      message: `OTP sent to ${otpResults.emailSent ? "email" : ""}${otpResults.emailSent && otpResults.smsSent ? " and " : ""}${otpResults.smsSent ? "mobile" : ""}`,
    });
  } catch (err) {
    console.error("OTP sending failed:", err);
    return next(new ErrorHandler("Failed to send OTP", 500));
  }
});


exports.verifyOtp = catchAsyncErrors(async (req, res, next) => {
  const { mobile, code } = req.body;

  if (!mobile || !code) {
    return next(new ErrorHandler("Mobile and OTP code are required", 400));
  }

  try {
    const isValid = await verifyMobileOtp({ to: mobile, code });

    if (!isValid) {
      return next(new ErrorHandler("Invalid or expired OTP", 400));
    }

    res.status(200).json({
      success: true,
      message: "Mobile OTP verified successfully",
    });
  } catch (error) {
    return next(new ErrorHandler("Mobile OTP verification failed", 500));
  }
});


//check user exists
exports.checkUserExists = async (req, res) => {
  try {
    const { email, mobile } = req.body;
    let existingUser;

    if (email) {
      existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already registered' });
      }
    }

    if (mobile) {
      existingUser = await User.findOne({ mobile });
      if (existingUser) {
        return res.status(400).json({ message: 'Mobile is already registered' });
      }
    }

    return res.status(200).json({ message: 'OK' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};
