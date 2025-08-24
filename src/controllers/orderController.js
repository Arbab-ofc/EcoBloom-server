import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Plant } from "../models/Plant.js";

function requireAuth(req, res) {
  if (!req.user?.id) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }
  return req.user;
}

function normalizeItems(raw = []) {
  return (Array.isArray(raw) ? raw : []).map((it) => ({
    plant: it.plant || it.plantId,
    quantity: Number(it.quantity || 0),
  }));
}


export async function createOrder(req, res) {
  try {
    const me = requireAuth(req, res);
    if (!me) return;

    const items = normalizeItems(req.body.items);
    const address = req.body.address || {};
    const paymentMethod = req.body.paymentMethod || "COD";

    if (!items.length)
      return res.status(400).json({ success: false, message: "Items are required" });

    
    for (const k of ["street", "city", "state", "pincode"]) {
      if (!address[k]) {
        return res.status(400).json({ success: false, message: `Address ${k} is required` });
      }
    }

    
    const plantIds = items.map((i) => i.plant).filter((id) => mongoose.isValidObjectId(id));
    const plants = await Plant.find({ _id: { $in: plantIds } }).lean();

    if (plants.length !== items.length) {
      return res.status(400).json({ success: false, message: "One or more plants not found" });
    }

    const itemsWithPrice = items.map((it) => {
      const plant = plants.find((p) => String(p._id) === String(it.plant));
      const qty = Math.max(1, Math.floor(it.quantity || 1));
      return {
        plant: plant._id,
        quantity: qty,
        price: Number(plant.price),
      };
    });

    const totalAmount = itemsWithPrice.reduce((sum, it) => sum + it.price * it.quantity, 0);

    const order = await Order.create({
      user: me.id,
      items: itemsWithPrice,
      totalAmount,
      status: "pending",
      address: {
        street: address.street,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country || "India",
      },
      paymentMethod,
      paymentStatus: "pending",
    });

    res.status(201).json({ success: true, message: "Order created", order });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
}


export async function getMyOrders(req, res) {
  try {
    const me = requireAuth(req, res);
    if (!me) return;

    const { status = "", page = 1, limit = 20 } = req.query;
    const q = { user: me.id };
    if (status) q.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(q)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("items.plant", "name price image")
        .lean(),
      Order.countDocuments(q),
    ]);

    res.json({ success: true, orders, page: Number(page), total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
}


export async function getOrderById(req, res) {
  try {
    const me = requireAuth(req, res);
    if (!me) return;

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ success: false, message: "Invalid order id" });

    const order = await Order.findById(id)
      .populate("items.plant", "name price image")
      .populate("user", "name email")
      .lean();

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const isOwner = String(order.user?._id) === String(me.id);
    if (!isOwner && !me.isAdmin) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    res.json({ success: true, order });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
}


export async function getAllOrders(req, res) {
  try {
    
    const { status = "", userId = "", page = 1, limit = 20 } = req.query;

    const q = {};
    if (status) q.status = status;
    if (userId && mongoose.isValidObjectId(userId)) q.user = userId;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(q)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("items.plant", "name price image")
        .populate("user", "name email")
        .lean(),
      Order.countDocuments(q),
    ]);

    res.json({ success: true, orders, page: Number(page), total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to fetch all orders" });
  }
}


export async function updateOrderStatus(req, res) {
  try {
    
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ success: false, message: "Invalid order id" });

    const allowed = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const updates = { status };
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    if (status === "delivered") updates.deliveredAt = new Date();

    const order = await Order.findByIdAndUpdate(id, updates, { new: true })
      .populate("items.plant", "name price image")
      .populate("user", "name email");

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    res.json({ success: true, message: "Order status updated", order });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
}


export async function deleteOrder(req, res) {
  try {
    
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ success: false, message: "Invalid order id" });

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    await order.deleteOne();
    res.json({ success: true, message: "Order deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to delete order" });
  }
}


export async function cancelOrder(req, res) {
  try {
    const me = requireAuth(req, res);
    if (!me) return;

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ success: false, message: "Invalid order id" });

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const isOwner = String(order.user) === String(me.id);
    if (!isOwner && !me.isAdmin) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ success: false, message: "Only pending orders can be cancelled" });
    }

    order.status = "cancelled";
    await order.save();

    res.json({ success: true, message: "Order cancelled", order });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to cancel order" });
  }
}


export async function getOrderStats(req, res) {
  try {
    
    const now = new Date();
    const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    const [overview, monthly] = await Promise.all([
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$totalAmount" },
            pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
            confirmed: { $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] } },
            shipped: { $sum: { $cond: [{ $eq: ["$status", "shipped"] }, 1, 0] } },
            delivered: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
          },
        },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: lastYear } } },
        {
          $group: {
            _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
            orders: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { "_id.y": 1, "_id.m": 1 } },
      ]),
    ]);

    res.json({
      success: true,
      overview: overview[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        pending: 0,
        confirmed: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      },
      monthly,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to fetch order stats" });
  }
}




const ALLOWED_PAYMENT = ["pending", "paid", "failed"]; 
const ALLOWED_TRACK   = ["pending", "confirmed", "shipped", "delivered", "cancelled"]; 


export async function adminListOrders(req, res) {
  try {
    const page  = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || "10", 10)));
    const skip  = (page - 1) * limit;

    const qRaw           = (req.query.q || "").trim();
    const paymentRaw     = (req.query.paymentStatus || "").trim().toLowerCase(); 
    const trackingRaw    = (req.query.status || "").trim().toLowerCase();        
    const paymentMethod  = (req.query.paymentMethod || "").trim();

    
    const baseMatch = {};
    if (paymentRaw && ALLOWED_PAYMENT.includes(paymentRaw)) baseMatch.paymentStatus = paymentRaw;
    if (trackingRaw && ALLOWED_TRACK.includes(trackingRaw)) baseMatch.status = trackingRaw;
    if (paymentMethod) baseMatch.paymentMethod = paymentMethod;

    const hasQ   = !!qRaw;
    const rx     = hasQ ? new RegExp(qRaw, "i") : null;
    const idExact =
      hasQ && mongoose.isValidObjectId(qRaw) ? new mongoose.Types.ObjectId(qRaw) : null;

    const pipeline = [
      { $match: baseMatch },

      
      {
        $lookup: {
          from: "users",          
          localField: "user",
          foreignField: "_id",
          as: "userDoc",
        },
      },
      { $unwind: { path: "$userDoc", preserveNullAndEmptyArrays: true } },

      
      {
        $set: {
          userNumberStr: { $toString: "$userDoc.number" },
        },
      },

      
      ...(hasQ
        ? [{
            $match: {
              $or: [
                ...(idExact ? [{ _id: idExact }] : []),
                { "userDoc.email": rx },
                { "userDoc.name": rx },
                { userNumberStr: rx },
              ],
            },
          }]
        : []),

     
      {
        $addFields: {
          totalAmount: {
            $ifNull: [
              "$totalAmount",
              {
                $sum: {
                  $map: {
                    input: { $ifNull: ["$items", []] },
                    as: "it",
                    in: {
                      $multiply: [
                        { $toDouble: { $ifNull: ["$$it.price", 0] } },
                        { $toDouble: { $ifNull: ["$$it.quantity", 0] } },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      },

      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          meta: [{ $count: "total" }],
        },
      },
    ];

    const Order = mongoose.model("Order");
    const agg = await Order.aggregate(pipeline);

    const data = agg[0]?.data || [];
    const totalCount = agg[0]?.meta?.[0]?.total || 0;

    
    const orders = data.map((o) => ({
      ...o,
      user: o.userDoc
        ? { _id: o.userDoc._id, name: o.userDoc.name, email: o.userDoc.email }
        : undefined,
    }));

    res.json({ success: true, orders, total: totalCount, page, limit });
  } catch (e) {
    console.error("adminListOrders error:", e);
    res.status(500).json({ success: false, message: "Failed to load orders" });
  }
}



export async function adminUpdateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body; 

    const order = await Order.findByIdAndUpdate(
      id,
      { paymentStatus },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    res.json({ success: true, order });
  } catch (e) {
    console.error("adminUpdateOrderStatus error:", e);
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
}


export async function adminDeleteOrder(req, res) {
  try {
    const { id } = req.params;
    const del = await Order.findByIdAndDelete(id);
    if (!del) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, message: "Order deleted" });
  } catch (e) {
    console.error("adminDeleteOrder error:", e);
    res.status(500).json({ success: false, message: "Failed to delete order" });
  }
}

const TRACKING_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export async function adminUpdateTrackingStatus(req, res) {
  try {
    const { id } = req.params;
    const { OrderStatus } = req.body;

    if (!TRACKING_STATUSES.includes(OrderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed: " + TRACKING_STATUSES.join(", "),
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.status = OrderStatus;

    if (OrderStatus === "delivered") {
      order.deliveredAt = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: `Order status updated to ${OrderStatus}`,
      order,
    });
  } catch (e) {
    console.error("adminUpdateTrackingStatus error:", e);
    res.status(500).json({ success: false, message: "Failed to update tracking status" });
  }
}

export async function getPaymentStatus(req, res) {
  try {
    const { id } = req.params;

    const order = await Order.findById(id).select("paymentStatus");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({
      success: true,
      orderId: id,
      paymentStatus: order.paymentStatus,
    });
  } catch (e) {
    console.error("getPaymentStatus error:", e);
    res.status(500).json({ success: false, message: "Failed to fetch payment status" });
  }
}