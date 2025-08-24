import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    items: [
      {
        plant: { type: mongoose.Schema.Types.ObjectId, ref: "Plant", required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true }, 
      },
    ],

    totalAmount: { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },

    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: "India" },
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "UPI", "Card", "NetBanking"],
      default: "COD",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
