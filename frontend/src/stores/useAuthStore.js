import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Navigate } from "react-router";
import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
const BASE_URL = BACKEND_URL.replace(/\/api\/?$/, "");

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: false,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  socket: null,
  onlineUsers: [],

  checkAuth: async () => {
    set({ isCheckingAuth: true });

    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error checking auth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      get().connectSocket();
      toast.success("Account created successfully!");
    } catch (error) {
      set({ authUser: null });
      toast.error(error.response?.data?.message || "Failed to create account");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      console.log("login request sent");

      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      console.log("Login successful, connecting socket...");
      get().connectSocket();
      toast.success("Logged in successfully!");
    } catch (error) {
      set({ authUser: null });
      console.log("Login error:", error);
      toast.error(error.response?.data?.message || "Failed to log in");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      get().disconnectSocket();
      toast.success("Logged out successfully!");
    } catch (error) {
      toast.error("Failed to log out");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser, socket: existingSocket } = get();
    if (!authUser) return;

    if (existingSocket) {
      existingSocket.off("getOnlineUsers");
      existingSocket.disconnect();
    }

    const socket = io(BASE_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    set({ socket, onlineUsers: [] });

    socket.on("connect", () => {
      console.log("Socket connected, socket.id:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.log("Socket connection error:", error.message);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.off("getOnlineUsers");
      socket.disconnect();
    }
    set({ socket: null, onlineUsers: [] });
  },
}));
