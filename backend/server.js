import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// routes
app.use("/api/auth", authRoutes);

// example protected route
import authMiddleware from "./middleware/authMiddleware.js";
app.get("/api/me", authMiddleware, (req, res) => {
  return res.json({ user: req.user });
});

// connect DB and start server
const PORT = process.env.PORT || 5000;
connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

//console.log("JWT_SECRET:", process.env.JWT_SECRET);