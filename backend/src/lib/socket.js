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

// this is for storing online users and multi-device socket lists per user
const userSocketMap = {}; // {userId: Set<socketId> }

const addSocketForUser = (userId, socketId) => {
  if (!userSocketMap[userId]) {
    userSocketMap[userId] = new Set();
  }
  userSocketMap[userId].add(socketId);
};

const removeSocketForUser = (userId, socketId) => {
  if (!userSocketMap[userId]) return;
  userSocketMap[userId].delete(socketId);
  if (userSocketMap[userId].size === 0) {
    delete userSocketMap[userId];
  }
};

export function getReceiverUserId(userId) {
  const socketIds = userSocketMap[userId];
  const socketIdArray = socketIds ? Array.from(socketIds) : [];
  console.log(`getReceiverUserId(${userId}):`, socketIdArray);
  console.log("Current userSocketMap:", userSocketMap);
  return socketIdArray[0] || null;
}

io.on("connection", (socket) => {
  console.log(
    "A user connected",
    socket.user.fullName,
    "with socket ID:",
    socket.id,
  );

  const userId = socket.userId;
  addSocketForUser(userId, socket.id);
  socket.join(userId);

  console.log(`User ${userId} joined room ${userId}`);
  console.log("Updated userSocketMap:", userSocketMap);

  //io.emit() is used to send events to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  //with socket.on we listen for events from clients
  socket.on("disconnect", () => {
    console.log("A user is disconnected:", socket.user.fullName);
    removeSocketForUser(userId, socket.id);
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
