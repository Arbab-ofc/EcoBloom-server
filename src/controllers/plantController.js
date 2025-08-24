import mongoose from "mongoose";
import { Plant } from "../models/Plant.js";
import { Category } from "../models/Category.js";
import cloudinary from "../config/cloudinary.js";


async function resolveCategoryIds({ categoryIds, categories }) {
  
  if (Array.isArray(categoryIds) && categoryIds.length) {
    const validIds = categoryIds
      .filter(id => mongoose.isValidObjectId(id))
      .map(id => new mongoose.Types.ObjectId(id));
    if (validIds.length) return validIds;
  }

  
  if (Array.isArray(categories) && categories.length) {
    const norm = categories.map(s => String(s).trim()).filter(Boolean);
    if (!norm.length) return [];
    
    const cats = await Category.find({
      keywords: { $in: norm },
    }).select("_id");
    return cats.map(c => c._id);
  }

  return [];
}


export async function getAllPlants(req, res) {
  try {
    const {
      search = "",
      category = "",
      categoryId = "",
      available = "",
      page = 1,
      limit = 20,
    } = req.query;

    const q = {};

   
    if (search) {
      const regex = new RegExp(String(search), "i");
      q.name = regex;
    }

    
    if (available !== "") {
      if (String(available).toLowerCase() === "true") q.available = true;
      if (String(available).toLowerCase() === "false") q.available = false;
    }

    
    if (categoryId && mongoose.isValidObjectId(categoryId)) {
      q.categories = new mongoose.Types.ObjectId(categoryId);
    } else if (category) {
      
      const catDoc = await Category.findOne({
        keywords: { $in: [String(category)] },
      }).select("_id");
      if (catDoc) {
        q.categories = catDoc._id;
      } else {
        return res.json({ success: true, plants: [], page: Number(page), total: 0 });
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [plants, total] = await Promise.all([
      Plant.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate("categories", "keywords")
        .lean(),
      Plant.countDocuments(q),
    ]);

    res.json({ success: true, plants, page: Number(page), total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to fetch plants" });
  }
}

export async function getPlantById(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ success: false, message: "Invalid plant id" });

    const plant = await Plant.findById(id).populate("categories", "keywords").lean();
    if (!plant) return res.status(404).json({ success: false, message: "Plant not found" });

    res.json({ success: true, plant });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to fetch plant" });
  }
}
const isObjectId = (s) => typeof s === "string" && /^[a-fA-F0-9]{24}$/.test(s);
const asArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
export async function createPlant(req, res) {
  try {
    const { name, price } = req.body;
    if (!name || price == null) {
      return res.status(400).json({ success: false, message: "Name & price required" });
    }

    
    let cats = asArray(req.body["categories[]"] ?? req.body.categories ?? []);
    if (cats.length === 1 && typeof cats[0] === "string" && cats[0].trim().startsWith("[")) {
      try { cats = JSON.parse(cats[0]); } catch {}
    }
    cats = cats.flatMap((c) =>
      typeof c === "string" ? c.split(",").map((s) => s.trim()).filter(Boolean) : []
    );

    
    const directIds = cats.filter(isObjectId).map((id) => new mongoose.Types.ObjectId(id));
    const keywords  = cats.filter((s) => !isObjectId(s));

    
    const matched = keywords.length
      ? await Category.find(
          { keywords: { $in: keywords.map((k) => new RegExp(`^${k}$`, "i")) } },
          "_id"
        )
      : [];
    const categoryIds = [...directIds, ...matched.map((c) => c._id)];

    if (categoryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid categories provided (send Category IDs or valid keywords).",
      });
    }

    const image = req.file?.path || req.body.image || "";

    const plant = await Plant.create({
      name: name.trim(),
      price: Number(price),
      categories: categoryIds,          
      available: req.body.available !== "false",
      image,
    });

    const populated = await Plant.findById(plant._id).populate("categories", "keywords");
    res.status(201).json({
      success: true,
      message: "Plant created",
      plant: {
        ...populated.toObject(),
        categoryNames: populated.categories.flatMap((c) => c.keywords || []),
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to add plant" });
  }
}




export async function deletePlant(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ success: false, message: "Invalid plant id" });

    const plant = await Plant.findById(id);
    if (!plant) return res.status(404).json({ success: false, message: "Plant not found" });

    if (plant.imagePublicId) {
      try { await cloudinary.uploader.destroy(plant.imagePublicId); } catch {}
    }
    await plant.deleteOne();

    res.json({ success: true, message: "Plant deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to delete plant" });
  }
}


export async function getPlantsByCategory(req, res) {
  try {
    const { categoryId } = req.params;
    if (!mongoose.isValidObjectId(categoryId))
      return res.status(400).json({ success: false, message: "Invalid category id" });

    const plants = await Plant.find({ categories: categoryId })
      .sort({ createdAt: -1 })
      .populate("categories", "keywords")
      .lean();

    res.json({ success: true, plants });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to fetch plants by category" });
  }
}


export async function updateAvailability(req, res) {
  try {
    const { id } = req.params;
    const { available } = req.body;

    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ success: false, message: "Invalid plant id" });

    if (available === undefined)
      return res.status(400).json({ success: false, message: "available is required" });

    const plant = await Plant.findByIdAndUpdate(
      id,
      { available: Boolean(available) },
      { new: true }
    ).populate("categories", "keywords");

    if (!plant) return res.status(404).json({ success: false, message: "Plant not found" });

    res.json({ success: true, message: "Availability updated", plant });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to update availability" });
  }
}
export async function listPlants(req, res) {
  try {
    const page  = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, Math.min(60, parseInt(req.query.limit || "12", 10)));
    const skip  = (page - 1) * limit;

    const { available } = req.query;
    const categoryKeyword = (req.query.category || "").trim();

    const filter = {};
    if (available === "true") filter.available = true;
    if (available === "false") filter.available = false;

    
    if (categoryKeyword) {
      const cats = await Category.find(
        { keywords: { $regex: categoryKeyword, $options: "i" } },
        "_id"
      );
      if (cats.length) {
        filter.categories = { $in: cats.map((c) => c._id) };
      } else {
        return res.json({ success: true, plants: [], total: 0, page, limit });
      }
    }

    const [rows, total] = await Promise.all([
      Plant.find(filter)
        .populate("categories", "keywords")        
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Plant.countDocuments(filter),
    ]);

    const plants = rows.map((p) => {
      const obj = p.toObject({ getters: true });
      obj.categoryNames = (obj.categories || [])
        .flatMap((c) => Array.isArray(c.keywords) ? c.keywords : [])
        .slice(0, 3); 
      return obj;
    });

    res.json({ success: true, plants, total, page, limit });
  } catch (e) {
    console.error("listPlants error:", e);
    res.status(500).json({ success: false, message: "Failed to load plants" });
  }
}


function getIncomingCategories(body) {
  let out = [];

  if (typeof body.categories === "string") {
    try {
      const parsed = JSON.parse(body.categories);
      if (Array.isArray(parsed)) out = out.concat(parsed);
      else if (parsed) out.push(parsed);
    } catch {
      if (body.categories.trim()) out.push(body.categories.trim());
    }
  }

  const arr = body["categories[]"];
  if (Array.isArray(arr)) out = out.concat(arr);
  else if (typeof arr === "string" && arr.trim()) out.push(arr.trim());

  return Array.from(
    new Set(
      out
        .map((x) => (x == null ? "" : String(x).trim()))
        .filter(Boolean)
    )
  );
}


const rxExactCI = (s) => new RegExp(`^${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");


const makeExactCIRx = (s) =>
  new RegExp(`^${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");


function parseCategoriesFromBody(body) {
  let out = [];

  
  if (Array.isArray(body.categories)) out.push(...body.categories);

  
  if (typeof body.categories === "string" && body.categories.trim()) {
    try {
      const parsed = JSON.parse(body.categories);
      if (Array.isArray(parsed)) out.push(...parsed);
      else out.push(String(parsed));
    } catch {
      out.push(body.categories.trim());
    }
  }

  
  const arr = body["categories[]"];
  if (Array.isArray(arr)) out.push(...arr);
  else if (typeof arr === "string" && arr.trim()) out.push(arr.trim());

  
  Object.keys(body)
    .filter((k) => /^categories\[\d+\]$/.test(k))
    .forEach((k) => {
      const v = body[k];
      if (Array.isArray(v)) out.push(...v);
      else if (v != null && String(v).trim()) out.push(String(v).trim());
    });

  
  return Array.from(
    new Set(
      out
        .map((x) => (x == null ? "" : String(x).trim()))
        .filter(Boolean)
    )
  );
}


async function resolveMixedCategoriesToIds(values) {
  const ids = [];
  const keywords = [];

  for (const v of values) {
    if (mongoose.isValidObjectId(v)) {
      ids.push(new mongoose.Types.ObjectId(v));
    } else {
      keywords.push(v);
    }
  }

  if (keywords.length) {
    const found = await Category.find({
      keywords: { $in: keywords.map(makeExactCIRx) },
    })
      .select("_id keywords")
      .lean();

    for (const c of found) ids.push(c._id);
  }

  
  return Array.from(new Set(ids.map(String))).map(
    (s) => new mongoose.Types.ObjectId(s)
  );
}


export async function updatePlant(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid plant id" });
    }

    const plant = await Plant.findById(id);
    if (!plant) {
      return res
        .status(404)
        .json({ success: false, message: "Plant not found" });
    }

    const { name, price, available } = req.body;
    const update = {};

    if (typeof name === "string" && name.trim()) update.name = name.trim();
    if (price !== undefined) update.price = Number(price);
    if (available !== undefined)
      update.available = String(available).toLowerCase() === "true";

    
    const incomingCats = parseCategoriesFromBody(req.body);
    if (incomingCats.length) {
      const resolved = await resolveMixedCategoriesToIds(incomingCats);
      update.categories = resolved; 
    }

    
    if (req.file?.secure_url || req.file?.path) {
      update.image = req.file.secure_url || req.file.path;
    }
    
    if (!update.image && Array.isArray(req.files) && req.files.length) {
      const f = req.files.find((x) => x.fieldname === "image") || req.files[0];
      if (f?.secure_url || f?.path) update.image = f.secure_url || f.path;
    }

    const updated = await Plant.findByIdAndUpdate(id, update, { new: true })
      .populate({ path: "categories", select: "keywords" })
      .lean();

    return res.json({
      success: true,
      message: "Plant updated successfully",
      plant: updated,
    });
  } catch (e) {
    console.error("updatePlant error:", e);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update plant" });
  }
}