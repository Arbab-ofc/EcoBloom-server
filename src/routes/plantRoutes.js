import { Router } from "express";
import {
  getAllPlants,
  getPlantById,
  createPlant,
  updatePlant,
  deletePlant,
  getPlantsByCategory,
  updateAvailability,
  listPlants,
} from "../controllers/plantController.js";
import { uploadCloud } from "../config/multerCloud.js";
import { protect, adminOnly } from "../middlewares/auth.js";

const router = Router();


router.get("/", getAllPlants);                    
router.get("/:id", getPlantById);
router.get("/category/:categoryId", getPlantsByCategory);
router.get("/", listPlants);


router.post("/", protect, adminOnly, uploadCloud.single("image"), createPlant);
router.put("/:id", protect, adminOnly, uploadCloud.single("image"), updatePlant);
router.patch("/:id/availability", protect, adminOnly, updateAvailability);
router.delete("/:id", protect, adminOnly, deletePlant);

export default router;
