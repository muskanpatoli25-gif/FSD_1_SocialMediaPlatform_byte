
const express = require("express");
const mongoose = require("mongoose");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

function validId(id) {
  return mongoose.isValidObjectId(id);
}

// Send a message
router.post("/:receiverId", authMiddleware, async (req, res) => {
  try {
    const senderId = req.userId;
    const { receiverId } = req.params;
    const content = String(req.body.content || "").trim();

    if (!validId(senderId) || !validId(receiverId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    if (String(senderId) === String(receiverId)) {
      return res.status(400).json({
        message: "You cannot message yourself.",
      });
    }

    if (!content) {
      return res.status(400).json({
        message: "Message cannot be empty.",
      });
    }

    if (content.length > 5000) {
      return res.status(400).json({
        message: "Message cannot exceed 5000 characters.",
      });
    }

    const receiver = await User.findById(receiverId).select("_id");

    if (!receiver) {
      return res.status(404).json({
        message: "Recipient not found.",
      });
    }

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content,
      hiddenFor: [],
    });

    await Notification.create({
      recipient: receiverId,
      sender: senderId,
      type: "message",
      message: "sent you a message.",
    });

    await message.populate("sender", "name username profileImage");
    await message.populate("receiver", "name username profileImage");

    return res.status(201).json({
      message: "Message sent successfully.",
      data: message,
    });
  } catch (error) {
    console.error("Send message error:", error.message);
    return res.status(500).json({
      message: "Unable to send message.",
    });
  }
});

// Hide selected conversations from the current user's inbox only
router.delete("/conversations/bulk", authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.userId;
    const userIds = req.body.userIds;

    if (!validId(currentUserId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        message: "Select at least one conversation.",
      });
    }

    if (
      userIds.some(
        (id) => !validId(id) || String(id) === String(currentUserId)
      )
    ) {
      return res.status(400).json({
        message: "Invalid conversation selection.",
      });
    }

    const uniqueIds = [...new Set(userIds.map(String))];

    const result = await Message.updateMany(
      {
        $or: [
          {
            sender: currentUserId,
            receiver: { $in: uniqueIds },
          },
          {
            receiver: currentUserId,
            sender: { $in: uniqueIds },
          },
        ],
      },
      {
        $addToSet: { hiddenFor: currentUserId },
      }
    );

    return res.json({
      message: "Selected conversations removed from your inbox.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Bulk conversation hide error:", error.message);
    return res.status(500).json({
      message: "Unable to remove conversations.",
    });
  }
});

// Hide selected messages from the current user's history only
router.delete("/messages/bulk", authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { messageIds } = req.body;

    if (!validId(currentUserId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        message: "Select at least one message.",
      });
    }

    if (messageIds.some((id) => !validId(id))) {
      return res.status(400).json({
        message: "Invalid message selection.",
      });
    }

    const uniqueMessageIds = [...new Set(messageIds.map(String))];

    const result = await Message.updateMany(
      {
        _id: { $in: uniqueMessageIds },
        $or: [
          { sender: currentUserId },
          { receiver: currentUserId },
        ],
      },
      {
        $addToSet: { hiddenFor: currentUserId },
      }
    );

    return res.json({
      message: "Selected messages removed from your history.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Bulk message hide error:", error.message);
    return res.status(500).json({
      message: "Unable to remove selected messages.",
    });
  }
});

// Hide one message from the current user's history only
router.delete("/message/:messageId", authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.userId;

    if (!validId(messageId) || !validId(currentUserId)) {
      return res.status(400).json({
        message: "Invalid message or user ID.",
      });
    }

    const message = await Message.findOneAndUpdate(
      {
        _id: messageId,
        $or: [
          { sender: currentUserId },
          { receiver: currentUserId },
        ],
      },
      {
        $addToSet: { hiddenFor: currentUserId },
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        message: "Message not found.",
      });
    }

    return res.json({
      message: "Message removed from your history.",
    });
  } catch (error) {
    console.error("Message hide error:", error.message);
    return res.status(500).json({
      message: "Unable to remove message.",
    });
  }
});

// Clear one conversation from the current user's history only
router.delete("/:userId/clear", authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.userId;
    const otherUserId = req.params.userId;

    if (
      !validId(currentUserId) ||
      !validId(otherUserId) ||
      String(currentUserId) === String(otherUserId)
    ) {
      return res.status(400).json({
        message: "Invalid conversation user.",
      });
    }

    const result = await Message.updateMany(
      {
        $or: [
          { sender: currentUserId, receiver: otherUserId },
          { sender: otherUserId, receiver: currentUserId },
        ],
      },
      {
        $addToSet: { hiddenFor: currentUserId },
      }
    );

    return res.json({
      message: "Chat cleared from your history.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Clear chat error:", error.message);
    return res.status(500).json({
      message: "Unable to clear chat.",
    });
  }
});

// Load conversation, excluding messages hidden by the current user
router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.userId;
    const otherUserId = req.params.userId;

    if (
      !validId(currentUserId) ||
      !validId(otherUserId) ||
      String(currentUserId) === String(otherUserId)
    ) {
      return res.status(400).json({
        message: "Invalid conversation user.",
      });
    }

    const otherUser = await User.findById(otherUserId)
      .select("name username profileImage");

    if (!otherUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
      hiddenFor: { $ne: currentUserId },
    })
      .sort({ createdAt: 1 })
      .populate("sender", "name username profileImage")
      .populate("receiver", "name username profileImage");

    return res.json({ user: otherUser, messages });
  } catch (error) {
    console.error("Get conversation error:", error.message);
    return res.status(500).json({
      message: "Unable to load conversation.",
    });
  }
});

// Load inbox conversations, excluding messages hidden by the current user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.userId;

    if (!validId(currentUserId)) {
      return res.status(400).json({
        message: "Invalid user ID.",
      });
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId },
        { receiver: currentUserId },
      ],
      hiddenFor: { $ne: currentUserId },
    })
      .sort({ createdAt: -1 })
      .populate("sender", "name username profileImage")
      .populate("receiver", "name username profileImage");

    const conversations = new Map();

    for (const message of messages) {
      const senderId = String(message.sender?._id || message.sender);
      const receiverId = String(message.receiver?._id || message.receiver);

      const otherUserId =
        senderId === String(currentUserId) ? receiverId : senderId;

      if (!conversations.has(otherUserId)) {
        const otherUser =
          senderId === String(currentUserId)
            ? message.receiver
            : message.sender;

        conversations.set(otherUserId, {
          user: otherUser,
          lastMessage: message,
        });
      }
    }

    return res.json({
      conversations: Array.from(conversations.values()),
    });
  } catch (error) {
    console.error("Get conversations error:", error.message);
    return res.status(500).json({
      message: "Unable to load conversations.",
    });
  }
});

module.exports = router;
