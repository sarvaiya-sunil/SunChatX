import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import Message from "../models/Message.js";
import { io } from "../lib/socket.js";

export const getAllContacts = async (req, res) => {
  try {
    const userId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: userId } }).select(
      "-password",
    );
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getAllContacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });
    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessagesByUserId:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required" });
    }
    if (senderId.equals(receiverId)) {
      return res
        .status(400)
        .json({ message: "You cannot send message to yourself" });
    }
    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    // send message in real-time to both sender and receiver
    const messageObject = newMessage.toObject
      ? newMessage.toObject()
      : newMessage;

    const normalizedMessage = {
      ...messageObject,
      senderId: newMessage.senderId.toString(),
      receiverId: newMessage.receiverId.toString(),
      _id: newMessage._id.toString(),
      createdAt: newMessage.createdAt,
      updatedAt: newMessage.updatedAt,
    };

    const senderRoom = senderId.toString();
    const receiverRoom = receiverId.toString();

    console.log(`Sending message from ${senderId} to ${receiverId}`);
    console.log(`Sender room: ${senderRoom}`);
    console.log(`Receiver room: ${receiverRoom}`);

    io.to(receiverRoom).emit("newMessage", normalizedMessage);
    console.log(`Message emitted to receiver room ${receiverRoom}`);

    io.to(senderRoom).emit("newMessage", normalizedMessage);
    console.log(`Message emitted to sender room ${senderRoom}`);

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
    });
    const chatPartnersIds = [
      ...new Set(
        messages.map((msg) =>
          msg.senderId.toString() === loggedInUserId.toString()
            ? msg.receiverId.toString()
            : msg.senderId.toString(),
        ),
      ),
    ];

    const chatPartners = await User.find({
      _id: { $in: chatPartnersIds },
    }).select("-password");

    res.status(200).json(chatPartners);
  } catch (error) {
    console.log("Error in getChatPartners:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
