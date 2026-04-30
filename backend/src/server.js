import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/auth-route.js";
import messageRoutes from "./routes/message-route.js";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";

dotenv.config();
const app = express();

const PORT = ENV.PORT || 3000;
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

//const __dirname = path.resolve();

// make ready fro deployment
// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "../frontend/dist")));

//   app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
//   });
// }

// npm run build -> for installing node_modules in frontend and backend
// npm run start -> for starting backend script
