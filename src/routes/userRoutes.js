import { Router } from "express";
import {
  register,
  login,
  me,
  logout,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  changePassword,
  updateMe,
} from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";

const router = Router();


router.post("/register", register);           
router.post("/login", login);                 
router.get("/me", protect, me);              
router.post("/logout", protect, logout);      


router.post("/verify-otp", verifyOtp);        
router.post("/resend-otp", resendOtp);        


router.post("/forgot-password", forgotPassword);         
router.post("/reset-password", resetPassword);           
router.patch("/change-password", protect, changePassword);
router.put("/me", protect, updateMe);

export default router;
