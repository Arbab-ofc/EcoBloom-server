import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./src/config/db.js";
import UserRouter from "./src/routes/userRoutes.js"
import plantRoutes from "./src/routes/plantRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";
import categoryRoutes from './src/routes/categoryRoutes.js'
import contactRoutes from './src/routes/contactRoutes.js'





const app = express();


app.use(express.json());
app.use(cookieParser());


app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://eco-bloom-client.vercel.app",
    credentials: true,
  })
);


app.get("/api/health", (_req, res) => res.json({ ok: true, service: "EcoBloom API" }));
app.use("/api/users", UserRouter);
app.use("/api/plants", plantRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories" , categoryRoutes)
app.use("/api/contacts", contactRoutes)


const PORT = process.env.PORT || 3000;


connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 EcoBloom API running on :${PORT}`));
});
