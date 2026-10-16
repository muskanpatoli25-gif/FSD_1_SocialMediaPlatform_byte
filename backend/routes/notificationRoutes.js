const express = require("express");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get logged-in user's notifications
router.get("/", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.userId,
    })
      .populate("sender", "name username profileImage")
      .populate("post", "content category")
      .sort({ createdAt: -1 })
      .limit(100);

    const unreadCount = await Notification.countDocuments({
      recipient: req.userId,
      read: false,
    });

    return res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    console.error("Fetch notifications error:", error.message);
    return res.status(500).json({
      message: "Unable to load notifications.",
    });
  }
});

// Mark all as read
router.patch("/read-all", authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.userId, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark all as read error:", error.message);
    return res.status(500).json({
      message: "Unable to update notifications.",
    });
  }
});

// Delete selected notifications
router.delete("/bulk", authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        message: "Select at least one notification.",
      });
    }

    if (!ids.every((id) => mongoose.isValidObjectId(id))) {
      return res.status(400).json({
        message: "One or more notification IDs are invalid.",
      });
    }

    const result = await Notification.deleteMany({
      _id: { $in: ids },
      recipient: req.userId,
    });

    return res.status(200).json({
      message: "Selected notifications deleted.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Delete selected notifications error:", error.message);
    return res.status(500).json({
      message: "Unable to delete selected notifications.",
    });
  }
});

// Delete all notifications for the logged-in user
router.delete("/all", authMiddleware, async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.userId,
    });

    return res.status(200).json({
      message: "All notifications deleted.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Delete all notifications error:", error.message);
    return res.status(500).json({
      message: "Unable to delete notifications.",
    });
  }
});

// Mark one notification as read
router.patch("/:id/read", authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipient: req.userId,
      },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      message: "Notification marked as read.",
      notification,
    });
  } catch (error) {
    console.error("Mark notification read error:", error.message);
    return res.status(500).json({
      message: "Unable to update notification.",
    });
  }
});

// Delete one notification
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid notification ID.",
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.userId,
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      message: "Notification deleted.",
    });
  } catch (error) {
    console.error("Delete notification error:", error.message);
    return res.status(500).json({
      message: "Unable to delete notification.",
    });
  }
});

module.exports = router;