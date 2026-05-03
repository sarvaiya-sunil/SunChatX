import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth-route.js";
import messageRoutes from "./routes/message-route.js";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";

dotenv.config();

const app = express();

const PORT = ENV.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

app.set("trust proxy", 1); // This is for arcjetProtection -> Rate limit

app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);

connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
