
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  number: {
    type: String,
    required: true,
    unique: true,
    match: /^[0-9]{10}$/   
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
  },

  otp: {
    type: String,
    default: null
  },

  otpExpiredAt: {
    type: Date,
    default: null
  },

  isAdmin: {
    type: Boolean,
    default: false
  },

  password: {
    type: String,
    minlength: 8
  },

  isVerified: {
    type: Boolean,
    default: false
  }

}, { timestamps: true }); 

export const User = mongoose.model("User", userSchema);
