import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { signJwt, verifyJwt } from "../utils/auth.js";
import { generateOtp, hashOtp } from "../utils/otp.js";
import { sendEmail } from "../config/mailer.js";
import { otpEmail } from "../emails/otpEmail.js";

const COOKIE_NAME = process.env.COOKIE_NAME || "token";

export async function register(req, res) {
  try {
    const { name, email, number, password } = req.body;
    if (!name || !email || !number || !password)
      return res.status(400).json({ success: false, message: "All fields are required" });

    const exists = await User.findOne({ $or: [{ email }, { number }] });
    if (exists) return res.status(409).json({ success: false, message: "User already exists" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      number,
      password: hash,
      isVerified: false,          
      otp: null,
      otpExpiredAt: null,
    });

    
    const otp = generateOtp(6);
    user.otp = hashOtp(otp);
    user.otpExpiredAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    
    const { subject, text, html } = otpEmail({ name: user.name, otp, minutes: 10 });
    await sendEmail({ to: user.email, subject, text, html });

    const token = signJwt({ id: user._id, isAdmin: user.isAdmin });
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite:"None",
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: "Registered. OTP sent to email. Please verify to login.",
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
}


export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "Invalid credentials" });

    if (!user.isVerified)
      return res.status(403).json({ success: false, message: "Please verify your account first" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const token = signJwt({ id: user._id, isAdmin: user.isAdmin });
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite:"None",
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, message: "Logged in" , user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Login failed" });
  }
}


export async function me(req, res) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    const payload = verifyJwt(token);
    if (!payload) return res.status(401).json({ success: false, message: "Unauthorized" });

    const user = await User.findById(payload.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, message: "Profile fetched perfectly" ,user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
}


export async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.otp || !user.otpExpiredAt) {
      return res.status(400).json({ success: false, message: "No OTP pending" });
    }

    if (Date.now() > new Date(user.otpExpiredAt).getTime()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    if (hashOtp(otp) !== user.otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiredAt = null;
    await user.save();


    const token = signJwt({ id: user._id, isAdmin: user.isAdmin });
    res.cookie(COOKIE_NAME, token, { httpOnly: true, sameSite:"None",
      secure: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

    return res.json({ success: true, message: "OTP verified. You are logged in." });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "OTP verification failed" });
  }
}


export async function resendOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.isVerified) return res.status(400).json({ success: false, message: "Already verified" });

    const otp = generateOtp(6);
    user.otp = hashOtp(otp);
    user.otpExpiredAt = new Date(Date.now() + 10 * 60 * 1000); 
    await user.save();

    const { subject, text, html } = otpEmail({ name: user.name, otp, minutes: 10 });
    await sendEmail({ to: user.email, subject, text, html });

    res.json({ success: true, message: "OTP resent to email" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to resend OTP" });
  }
}


export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const otp = generateOtp(6);
    user.otp = hashOtp(otp);
    user.otpExpiredAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    
    const { subject, text, html } = otpEmail({ name: user.name, otp, minutes: 10 });
    await sendEmail({
      to: user.email,
      subject: "EcoBloom Password Reset OTP",
      text,
      html,
    });

    res.json({ success: true, message: "Password reset OTP sent to email" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to start password reset" });
  }
}


export async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, new password, and confirm password are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    if (!user.otp || !user.otpExpiredAt) {
      return res.status(400).json({ success: false, message: "No OTP pending" });
    }
    if (Date.now() > new Date(user.otpExpiredAt).getTime()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }
    if (hashOtp(otp) !== user.otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    
    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = null;
    user.otpExpiredAt = null;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successful. Please log in.",
    });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ success: false, message: "Failed to reset password" });
  }
}


export async function changePassword(req, res) {
  try {
    
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Current, new, and confirm password are required",
      });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters",
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password must match",
      });
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ success: true, message: "Password updated successfully" });
  } catch (e) {
    console.error("changePassword error:", e);
    return res.status(500).json({ success: false, message: "Failed to update password" });
  }
}

export async function logout(_req, res) {
  try {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      sameSite:"None",
      secure: true,
      path: "/",                 
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }
  );
    res.json({ success: true, message: "Logged out successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Logout failed" });
  }
}

export async function updateMe(req, res) {
  try {
    const userId = req.user?.id; 
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { name, number } = req.body;

    
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    if (!number || !/^\d{10}$/.test(String(number))) {
      return res.status(400).json({ success: false, message: "Enter a valid 10-digit phone number" });
    }

    
    const exists = await User.findOne({ number: String(number), _id: { $ne: userId } }).lean();
    if (exists) {
      return res.status(409).json({ success: false, message: "Phone number already in use" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.name = String(name).trim();
    user.number = String(number);
    await user.save();

    return res.json({
      success: true,
      message: "Profile updated",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        number: user.number,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (e) {
    console.error("updateMe error:", e);
    return res.status(500).json({ success: false, message: "Failed to update profile" });
  }
}