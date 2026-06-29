import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket-auth-middleware.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      ENV.CLIENT_URL,
    ].filter(Boolean),
    credentials: true,
  },
});
// middleware for all socket connections
io.use(socketAuthMiddleware);

export function getReceiverUserId(userId) {
  const socketId = userSocketMap[userId];
  console.log(`getReceiverUserId(${userId}):`, socketId);
  console.log("Current userSocketMap:", userSocketMap);
  return socketId;
}

// this is for storing online users
const userSocketMap = {}; //{userId:socketId}

io.on("connection", (socket) => {
  console.log(
    "A user connected",
    socket.user.fullName,
    "with socket ID:",
    socket.id,
  );

  const userId = socket.userId;
  userSocketMap[userId] = socket.id;
  console.log(`User ${userId} mapped to socket ${socket.id}`);
  console.log("Updated userSocketMap:", userSocketMap);

  //io.emit() is used to send events to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  //with socket.on we listen for events from clients
  socket.on("disconnect", () => {
    console.log("A user is disconnected:", socket.user.fullName);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
