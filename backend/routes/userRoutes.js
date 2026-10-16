
const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Follow or unfollow a user
router.post("/:userId/follow", authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.userId;
    const targetUserId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    if (currentUserId.toString() === targetUserId) {
      return res.status(400).json({ message: "You cannot follow yourself." });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId),
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const alreadyFollowing = currentUser.following.some(
      (id) => id.toString() === targetUserId
    );

    if (alreadyFollowing) {
      currentUser.following.pull(targetUser._id);
      targetUser.followers.pull(currentUser._id);
    } else {
      currentUser.following.addToSet(targetUser._id);
      targetUser.followers.addToSet(currentUser._id);
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    return res.status(200).json({
      message: alreadyFollowing
        ? "User unfollowed successfully."
        : "User followed successfully.",
      following: !alreadyFollowing,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length,
    });
  } catch (error) {
    console.error("Follow/unfollow error:", error.message);
    return res.status(500).json({
      message: "Unable to update follow status. Please try again.",
    });
  }
});

router.get("/:userId/profile", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const [targetUser, currentUser] = await Promise.all([
      User.findById(userId).select(
        "name username bio profileImage location website interests createdAt followers following"
      ),
      User.findById(req.userId).select("following"),
    ]);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const isFollowing = Boolean(
      currentUser?.following?.some(
        (id) => id.toString() === targetUser._id.toString()
      )
    );

    return res.status(200).json({
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        username: targetUser.username,
        bio: targetUser.bio,
        profileImage: targetUser.profileImage,
        location: targetUser.location,
        website: targetUser.website,
        interests: targetUser.interests,
        createdAt: targetUser.createdAt,
      },
      followersCount: targetUser.followers.length,
      followingCount: targetUser.following.length,
      isFollowing,
      isOwnProfile: req.userId.toString() === targetUser._id.toString(),
    });
  } catch (error) {
    console.error("Fetch user profile error:", error.message);
    return res.status(500).json({
      message: "Unable to load user profile.",
    });
  }
});


// Get followers and following counts for a user
router.get("/:userId/follow-stats", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const targetUser = await User.findById(req.params.userId)
      .select("followers following");

    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      followersCount: targetUser.followers.length,
      followingCount: targetUser.following.length,
    });
  } catch (error) {
    console.error("Follow stats error:", error.message);
    return res.status(500).json({
      message: "Unable to fetch follow stats.",
    });
  }
});

/* Search registered users for starting a conversation */
router.get("/search", authMiddleware, async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();

    if (query.length < 2) {
      return res.status(200).json({ users: [] });
    }

    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(safeQuery, "i");

    const users = await User.find({
      _id: { $ne: req.userId },
      $or: [
        { name: searchRegex },
        { username: searchRegex },
      ],
    })
      .select("_id name username profileImage")
      .limit(20);

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Search users error:", error.message);
    return res.status(500).json({
      message: "Unable to search users.",
    });
  }
});


module.exports = router;
