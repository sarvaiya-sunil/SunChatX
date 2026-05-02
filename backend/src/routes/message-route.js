import express from "express";
import { send } from "process";
import {
  getAllContacts,
  getChatPartners,
  getMessagesByUserId,
  sendMessage,
} from "../controllers/message-controler.js";
import { protectRoute } from "../middleware/auth-middleware.js";
import { arcjetProtection } from "../middleware/arcjet-middleware.js";

const router = express.Router();

router.use(arcjetProtection, protectRoute);

router.get("/contacts", getAllContacts);
router.get("/chats", getChatPartners);
router.get("/:id", getMessagesByUserId);
router.post("/send/:id", sendMessage);

router.get("/send", (req, res) => {
  res.send("Send Message Endpoint");
});

export default router;
