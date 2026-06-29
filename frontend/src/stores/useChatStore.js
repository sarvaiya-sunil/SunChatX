import toast from "react-hot-toast";
import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
const notificationSound = new Audio("/sounds/notification.mp3");

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/message/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch contacts");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/message/chats");
      set({ chats: res.data });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch chats");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/message/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();

    if (!selectedUser || !authUser) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    const optimisticMessages = [...messages, optimisticMessage];
    set({ messages: optimisticMessages });

    try {
      const res = await axiosInstance.post(
        `message/send/${selectedUser._id}`,
        messageData,
      );
      const finalMessages = optimisticMessages.filter(
        (msg) => msg._id !== tempId,
      );
      finalMessages.push(res.data);
      set({ messages: finalMessages });
    } catch (error) {
      set({ messages: messages });
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, isSoundEnabled } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) {
      console.log("Socket not available for subscription");
      return;
    }

    const setupMessageListener = () => {
      socket.off("newMessage");
      socket.on("newMessage", (newMessage) => {
        console.log("Received newMessage event:", newMessage);
        const messageSenderId = newMessage.senderId?._id || newMessage.senderId;
        const { authUser } = useAuthStore.getState();
        const authUserId = authUser._id;
        const selectedUserId = selectedUser._id?._id || selectedUser._id;

        console.log(
          `Comparing - messageSender: ${messageSenderId}, selectedUser: ${selectedUserId}, authUser: ${authUserId}`,
        );

        // Check if message is from selected user OR if we're receiving our own message
        const isMessageForThisChat =
          messageSenderId === selectedUserId ||
          messageSenderId.toString() === selectedUserId.toString() ||
          messageSenderId === authUserId ||
          messageSenderId.toString() === authUserId.toString();

        if (!isMessageForThisChat) {
          console.log("Message not relevant to current chat, ignoring");
          return;
        }

        console.log("Adding message to UI");
        const currentMessages = get().messages;

        // Avoid duplicates: check if message already exists by comparing _id
        const messageExists = currentMessages.some(
          (msg) => msg._id === newMessage._id,
        );

        if (!messageExists) {
          set({ messages: [...currentMessages, newMessage] });
        } else {
          console.log("Message already exists, skipping duplicate");
        }

        if (isSoundEnabled) {
          notificationSound.currentTime = 0;
          notificationSound
            .play()
            .catch((e) => console.log("Audio play failed"));
        }
      });
    };

    if (!socket.connected) {
      console.log("Socket not connected, waiting for connection...");
      socket.once("connect", () => {
        console.log("Socket connected, setting up listener");
        setupMessageListener();
      });
    } else {
      setupMessageListener();
    }
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket?.off("newMessage");
  },
}));
