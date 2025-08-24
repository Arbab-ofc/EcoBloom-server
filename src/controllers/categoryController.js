
import { Category } from "../models/Category.js";

export async function createCategory(req, res){
  try{
    const { keywords } = req.body; 
    if (!Array.isArray(keywords) || !keywords.length)
      return res.status(400).json({ success:false, message:"keywords array required" });
    const cat = await Category.create({ keywords });
    res.status(201).json({ success:true, category: cat });
  }catch(e){ res.status(500).json({ success:false, message:"Create failed" }); }
}

export async function getCategories(_req, res){
  try{
    const cats = await Category.find().lean();
    res.json({ success:true, categories: cats });
  }catch(e){ res.status(500).json({ success:false, message:"Fetch failed" }); }
}

export async function deleteCategory(req, res){
  try{
    const { id } = req.params;
    const cat = await Category.findByIdAndDelete(id);
    if (!cat) return res.status(404).json({ success:false, message:"Not found" });
    res.json({ success:true, message:"Category deleted" });
  }catch(e){ res.status(500).json({ success:false, message:"Delete failed" }); }
}
