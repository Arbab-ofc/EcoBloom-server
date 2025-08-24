import mongoose from "mongoose";
export function validateObjectId(param = "id") {
  return (req, res, next) => {
    const id = req.params[param];
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success:false, message:"Invalid id" });
    }
    next();
  };
}