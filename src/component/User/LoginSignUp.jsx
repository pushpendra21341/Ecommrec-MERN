import React, { Fragment, useState, useEffect } from "react";
import "./LoginSignUp.css";
import Loader from "../layout/Loader/Loader";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import validator from "validator";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import FaceIcon from "@mui/icons-material/Face";

import ReCAPTCHA from "react-google-recaptcha";
import axios from "axios";
import { clearErrors, login, register } from "../../actions/userAction";

const LoginSignUp = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const { error, loading, isAuthenticated } = useSelector((state) => state.user);
  const [activeTab, setActiveTab] = useState("login");

  const [identifier, setIdentifier] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [sendingLoginOtp, setSendingLoginOtp] = useState(false);
  const [showLoginOtpInput, setShowLoginOtpInput] = useState(false);

  const [user, setUser] = useState({ name: "", email: "", password: "" });
  const { name, email, password } = user;

  const [confirmPassword, setConfirmPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("/Profile.png");
  const [emailOtp, setEmailOtp] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [showOtpInputs, setShowOtpInputs] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const redirect = queryParams.get("redirect") || "/account";

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      setUser({ name: "", email: "", password: "" });
      setMobile("");
      setConfirmPassword("");
      setEmailOtp("");
      setMobileOtp("");
      setCaptchaToken(null);
      setAvatar(null);
      setAvatarPreview("/Profile.png");
      navigate(redirect);
    }
  }, [isAuthenticated, navigate, redirect]);

  const loginSubmit = (e) => {
    e.preventDefault();

    const isEmail = validator.isEmail(identifier);
    const isMobile = /^\d{10}$/.test(identifier);

    if (!isEmail && !isMobile) {
      return toast.error("Enter a valid email or 10-digit mobile number");
    }

    if (!loginOtp || !loginPassword) {
      return toast.error("Enter password and OTP");
    }

    if (!captchaToken) {
      return toast.error("Please complete CAPTCHA");
    }

    dispatch(
      login(
        isEmail ? identifier : undefined,
        isMobile ? identifier : undefined,
        loginPassword,
        loginOtp,
        captchaToken
      )
    );
  };

  const sendLoginOtp = async () => {
    if (!identifier) return toast.error("Enter email or mobile");

    try {
      setSendingLoginOtp(true);
      await axios.post("/api/v1/send-otp", {
        email: validator.isEmail(identifier) ? identifier : undefined,
        mobile: /^\d{10}$/.test(identifier) ? identifier : undefined,
      });

      toast.success("OTP sent successfully");
      setShowLoginOtpInput(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setSendingLoginOtp(false);
    }
  };

  const registerSubmit = (e) => {
    e.preventDefault();

    if (!email || !mobile) {
      return toast.error("Enter both email and mobile");
    }

    if (!captchaToken) {
      return toast.error("Please complete CAPTCHA");
    }

    if (!emailOtp || !mobileOtp) {
      return toast.error("Enter both OTPs");
    }

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    const myForm = new FormData();
    myForm.set("name", name);
    myForm.set("email", email);
    myForm.set("mobile", mobile);
    myForm.set("password", password);
    myForm.set("confirmPassword", confirmPassword);
    if (avatar) myForm.append("avatar", avatar);
    myForm.set("emailOtp", emailOtp);
    myForm.set("mobileOtp", mobileOtp);
    myForm.set("captchaToken", captchaToken);

    dispatch(register(myForm));
  };

  const registerDataChange = (e) => {
    if (e.target.name === "avatar") {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => setAvatarPreview(reader.result);
        reader.readAsDataURL(file);
        setAvatar(file);
      }
    } else {
      setUser({ ...user, [e.target.name]: e.target.value });
    }
  };

  const sendOtp = async () => {
  if (!email || !mobile) return toast.error("Enter both email and mobile");
  if (!/^\d{10}$/.test(mobile)) return toast.error("Enter valid 10-digit mobile");

  try {
    const checkRes = await axios.post("/api/v1/check-user-exists", { email, mobile });

    if (checkRes.status === 200) {
      setSendingOtp(true);

      await axios.post("/api/v1/send-otp", { email, mobile });

      toast.success("OTP sent to email and mobile");

      setShowOtpInputs(true);
      setTimeout(() => setShowOtpInputs(false), 5 * 60 * 1000);
    }
  } catch (err) {
    const message = err.response?.data?.message || "Failed to send OTP";
    toast.error(message);

    // ❗ Prevent OTP inputs from being shown when email or mobile already exists
    setShowOtpInputs(false);
  } finally {
    setSendingOtp(false);
  }
};


  const switchTabs = (tab) => {
    setActiveTab(tab);
  };

  return (
    <Fragment>
      {loading ? (
        <Loader />
      ) : (
        <div className="LoginSignUpContainer">
          <div className={`LoginSignUpBox ${activeTab === "login" ? "loginActive" : "registerActive"}`}>
            <div className="login_signUp_toggle">
              <p onClick={() => switchTabs("login")}>LOGIN</p>
              <p onClick={() => switchTabs("register")}>REGISTER</p>
            </div>

            <div className="formSlider">
              <div className="formSliderContent">
                {/* LOGIN FORM */}
                <form className="loginForm" onSubmit={loginSubmit}>
                  <div className="loginEmail">
                    <MailOutlineIcon />
                    <input
                      type="text"
                      placeholder="Email or Mobile"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                    />
                  </div>

                  {showLoginOtpInput && (
                    <div className="otpField">
                      <input
                        type="text"
                        placeholder="Enter OTP"
                        required
                        value={loginOtp}
                        onChange={(e) => setLoginOtp(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="otpField">
                    <button
                      type="button"
                      className="sendOtpBtn"
                      onClick={sendLoginOtp}
                      disabled={sendingLoginOtp}
                    >
                      {sendingLoginOtp ? "Sending..." : "Send OTP"}
                    </button>
                  </div>

                  <div className="loginPassword">
                    <LockOpenIcon />
                    <input
                      type="password"
                      placeholder="Password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>

                  <div className="captcha-box">
                    <ReCAPTCHA
                      sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                      onChange={(token) => setCaptchaToken(token)}
                    />
                  </div>

                  <Link to="/password/forgot">Forget Password?</Link>
                  <input type="submit" value="Login" className="loginBtn" />
                </form>

                {/* REGISTER FORM */}
                <form className="signUpForm" encType="multipart/form-data" onSubmit={registerSubmit}>
  <div className="formInputs">
    <div className="signUpName">
      <FaceIcon />
      <input
        type="text"
        placeholder="Name"
        required
        name="name"
        value={name}
        onChange={registerDataChange}
      />
    </div>

    <div className="signUpEmail">
      <MailOutlineIcon />
      <input
        type="email"
        placeholder="Email"
        required
        name="email"
        value={email}
        onChange={registerDataChange}
      />
    </div>

    <div className="otpField">
      <input
        type="text"
        placeholder="Mobile"
        required
        name="mobile"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
      />
      <button type="button" className="sendOtpBtn" onClick={sendOtp} disabled={sendingOtp}>
        {sendingOtp ? "Sending..." : "Send OTP"}
      </button>
    </div>

    {showOtpInputs && (
      <>
        <div className="otpField">
          <input
            type="text"
            placeholder="Enter Email OTP"
            value={emailOtp}
            onChange={(e) => setEmailOtp(e.target.value)}
            required
          />
        </div>
        <div className="otpField">
          <input
            type="text"
            placeholder="Enter Mobile OTP"
            value={mobileOtp}
            onChange={(e) => setMobileOtp(e.target.value)}
            required
          />
        </div>
      </>
    )}

    <div className="signUpPassword">
      <LockOpenIcon />
      <input
        type="password"
        placeholder="Password"
        required
        name="password"
        value={password}
        onChange={registerDataChange}
      />
    </div>

    <div className="signUpConfirmPassword">
      <LockOpenIcon />
      <input
        type="password"
        placeholder="Confirm Password"
        required
        name="confirmPassword"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
    </div>

    <div id="registerImage">
      <img src={avatarPreview} alt="Avatar Preview" />
      <input
        type="file"
        name="avatar"
        accept="image/*"
        onChange={registerDataChange}
      />
    </div>

    <div className="captcha-box">
      <ReCAPTCHA
        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
        onChange={(token) => setCaptchaToken(token)}
      />
    </div>
  </div>

  <input type="submit" value="Register" className="signUpBtn" />
</form>

              </div>
            </div>
          </div>
        </div>
      )}
    </Fragment>
  );
};

export default LoginSignUp;
