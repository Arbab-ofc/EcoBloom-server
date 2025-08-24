import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    keywords: {
      type: [String],
      required: true,
      unique: true,
      index: true       
    },
  },
  { timestamps: true }
);


categorySchema.index({ keywords: "text" });

export const Category = mongoose.model("Category", categorySchema);
