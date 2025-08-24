
import { Router } from "express";
import { protect, adminOnly } from "../middlewares/auth.js";
import {
  createContact,
  adminListContacts,
  adminGetContact,
  adminUpdateContactStatus,
  adminDeleteContact,
} from "../controllers/contactController.js";

const router = Router();


router.post("/", createContact);


router.get("/admin", protect, adminOnly, adminListContacts);


router.get("/admin/:id", protect, adminOnly, adminGetContact);


router.patch("/admin/:id/status", protect, adminOnly, adminUpdateContactStatus);


router.delete("/admin/:id", protect, adminOnly, adminDeleteContact);

export default router;
