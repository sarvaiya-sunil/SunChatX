import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth-route.js";
import messageRoutes from "./routes/message-route.js";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = ENV.PORT || 3000;

app.use(express.json({ limit: "10mb" }));
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(cookieParser());

app.set("trust proxy", 1); // This is for arcjetProtection -> Rate limit

app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);

connectDB();

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
