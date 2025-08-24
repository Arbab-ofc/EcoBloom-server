
import { Router } from "express";
import { createCategory, getCategories, deleteCategory } from "../controllers/categoryController.js";
import { protect, adminOnly } from "../middlewares/auth.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";

const router = Router();
router.get("/", getCategories);
router.post("/", protect, adminOnly, createCategory);
router.delete("/:id", protect, adminOnly, validateObjectId("id"), deleteCategory);
export default router;
