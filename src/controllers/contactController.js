
import mongoose from "mongoose";
import { Contact } from "../models/Contact.js";

const STATUS = ["new", "resolved", "ignored"];


export async function createContact(req, res) {
  try {
    const { name, email, phone, message } = req.body || {};

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Name, email and message are required" });
    }

    
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email" });
    }

    const doc = await Contact.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || undefined,
      message: message.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Thanks! We received your message.",
      contact: {
        id: doc._id,
        name: doc.name,
        email: doc.email,
        phone: doc.phone,
        status: doc.status,
        createdAt: doc.createdAt,
      },
    });
  } catch (e) {
    console.error("createContact error:", e);
    return res.status(500).json({ success: false, message: "Failed to submit message" });
  }
}


export async function adminListContacts(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || "10", 10)));
    const skip = (page - 1) * limit;

    const q = (req.query.q || "").trim();
    const status = (req.query.status || "").trim().toLowerCase();

    const match = {};
    if (status && STATUS.includes(status)) match.status = status;

    if (q) {
      const rx = new RegExp(q, "i");
      Object.assign(match, {
        $or: [{ name: rx }, { email: rx }, { phone: rx }, { message: rx }],
      });
    }

    const [data, total] = await Promise.all([
      Contact.find(match).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Contact.countDocuments(match),
    ]);

    return res.json({ success: true, contacts: data, total, page, limit });
  } catch (e) {
    console.error("adminListContacts error:", e);
    return res.status(500).json({ success: false, message: "Failed to load contacts" });
  }
}


export async function adminGetContact(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const doc = await Contact.findById(id).lean();
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });

    return res.json({ success: true, contact: doc });
  } catch (e) {
    console.error("adminGetContact error:", e);
    return res.status(500).json({ success: false, message: "Failed to fetch contact" });
  }
}


export async function adminUpdateContactStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }
    if (!STATUS.includes(String(status).toLowerCase())) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value" });
    }

    const doc = await Contact.findByIdAndUpdate(
      id,
      { status: String(status).toLowerCase() },
      { new: true }
    ).lean();

    if (!doc) return res.status(404).json({ success: false, message: "Not found" });

    return res.json({ success: true, message: "Status updated", contact: doc });
  } catch (e) {
    console.error("adminUpdateContactStatus error:", e);
    return res.status(500).json({ success: false, message: "Failed to update status" });
  }
}


export async function adminDeleteContact(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const result = await Contact.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ success: false, message: "Not found" });

    return res.json({ success: true, message: "Deleted" });
  } catch (e) {
    console.error("adminDeleteContact error:", e);
    return res.status(500).json({ success: false, message: "Failed to delete contact" });
  }
}
