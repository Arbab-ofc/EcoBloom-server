
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Category } from "../models/Category.js";

dotenv.config();

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!uri) {
  console.error("❌ MONGODB_URI (or MONGO_URI) missing in .env");
  process.exit(1);
}

const categories = [
  { keywords: ["Indoor"] },
  { keywords: ["Outdoor"] },
  { keywords: ["Air Purifying"] },
  { keywords: ["Home Decor"] },
  { keywords: ["Succulent"] },
  { keywords: ["Flowering"] },
  { keywords: ["Medicinal"] },
  { keywords: ["Decor"] },
  { keywords: ["Edible"] },
  { keywords: ["Shade"] },
];

async function seedCategories() {
  try {
    await mongoose.connect(uri, { dbName: "ecobloom" });
    await Category.deleteMany();
    await Category.insertMany(categories);
    console.log("🌱 Categories seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding categories:", err);
    process.exit(1);
  }
}

seedCategories();
