import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
  cancelOrder,
  getOrderStats,
  adminListOrders,
  adminUpdateOrderStatus,
  adminDeleteOrder,
  adminUpdateTrackingStatus,
  getPaymentStatus
} from "../controllers/orderController.js";
import { protect, adminOnly } from "../middlewares/auth.js";

const router = Router();


router.get("/", protect, adminOnly, getAllOrders);                 
router.get("/admin/stats/overview", protect, adminOnly, getOrderStats);
router.patch("/:id/status", protect, adminOnly, updateOrderStatus);
router.delete("/:id", protect, adminOnly, deleteOrder);
router.get("/admin/orders", protect, adminOnly, adminListOrders);
router.patch("/admin/orders/:id", protect, adminOnly, adminUpdateOrderStatus);
router.delete("/admin/orders/:id", protect, adminOnly, adminDeleteOrder);
router.patch("/admin/orders/:id/status", protect, adminOnly, adminUpdateTrackingStatus);


router.post("/", protect, createOrder);
router.get("/me", protect, getMyOrders);
router.patch("/:id/cancel", protect, cancelOrder);
router.get("/orders/:id/payment-status", protect, getPaymentStatus);


router.get("/:id", protect, getOrderById);  

export default router;
