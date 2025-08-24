import mongoose from "mongoose";

const plantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true        
    },

    price: {
      type: Number,
      required: true,
      min: 1,
    },

    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
        index: true      
      },
    ],

    available: {
      type: Boolean,
      default: true,
      index: true       
    },

    image: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);


plantSchema.index({ name: "text" });

export const Plant = mongoose.model("Plant", plantSchema);
