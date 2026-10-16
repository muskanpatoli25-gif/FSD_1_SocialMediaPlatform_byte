const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Post = require("../models/Post");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const uploadDir = path.join(__dirname, "../uploads");
const Notification = require("../models/Notification");
const User = require("../models/User");

// Create uploads folder if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname).toLowerCase();

    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, WEBP, GIF, MP4 and WEBM files are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 4,
  },
});


 // Create a new post with optional media uploads
router.post(
  "/",
  authMiddleware,
  upload.array("media", 4),
  async (req, res) => {
    try {
      const { content, category, mediaUrl } = req.body;

      const postContent =
        typeof content === "string" ? content.trim() : "";

      const validCategories = [
        "technology",
        "design",
        "business",
        "education",
        "entertainment",
        "lifestyle",
      ];

      const uploadedMedia = (req.files || []).map((file) => ({
        url: `/uploads/${file.filename}`,
        type: file.mimetype.startsWith("video/") ? "video" : "image",
      }));

      if (!postContent && !mediaUrl && uploadedMedia.length === 0) {
        return res.status(400).json({
          message: "Please add text or media to your post.",
        });
      }

      if (!category || !validCategories.includes(category)) {
        return res.status(400).json({
          message: "Please select a valid category.",
        });
      }

      if (postContent.length > 5000) {
        return res.status(400).json({
          message: "Post content cannot exceed 5000 characters.",
        });
      }

      if (
        mediaUrl !== undefined &&
        (typeof mediaUrl !== "string" || mediaUrl.length > 2048)
      ) {
        return res.status(400).json({
          message: "Media URL must be a valid text value.",
        });
      
      }

      const post = await Post.create({
        author: req.userId,
        content: postContent,
        category,
        mediaUrl: mediaUrl || "",
        media: uploadedMedia,
      });
      // Notify followers when a new post is published
const author = await User.findById(req.userId).select("followers");

if (author && author.followers?.length > 0) {
  const notifications = author.followers
    .filter(
      (followerId) =>
        followerId.toString() !== req.userId.toString()
    )
    .map((followerId) => ({
      recipient: followerId,
      sender: req.userId,
      type: "new_post",
      message: "published a new post.",
      post: post._id,
    }));

  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }
}

      const populatedPost = await post.populate(
        "author",
        "name username profileImage"
      );

      return res.status(201).json({
        message: "Post published successfully!",
        post: populatedPost,
      });
    } catch (error) {
      console.error("Create post error:", error.message);

      return res.status(500).json({
        message: "Unable to publish post. Please try again.",
      });
    }
  }
);


/* Get all posts (newest first) */
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name username profileImage")
      .populate("likes", "_id")
      .sort({ createdAt: -1 });

    return res.status(200).json({ posts });
  } catch (error) {
    console.error("Fetch posts error:", error.message);

    return res.status(500).json({
      message: "Unable to load posts. Please try again.",
    });
  }
});


 // Delete own post
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }

    // Only the post owner can delete it
    if (post.author.toString() !== req.userId.toString()) {
      return res.status(403).json({
        message: "You can only delete your own posts.",
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: "Post deleted successfully!",
      postId: req.params.id,
    });
  } catch (error) {
    console.error("Delete post error:", error.message);

    return res.status(500).json({
      message: "Unable to delete post. Please try again.",
    });
  }
});


// Like or unlike a post
router.post("/:id/like", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }

    const userId = req.userId.toString();

    const alreadyLiked = post.likes.some(
      (id) => id.toString() === userId
    );

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId
      );
    } else {
      post.likes.push(req.userId);
    }

   await post.save();

// Notify post owner only when a new like is added
if (!alreadyLiked && post.author.toString() !== userId) {
  await Notification.create({
    recipient: post.author,
    sender: req.userId,
    type: "like",
    message: "liked your post.",
    post: post._id,
  });
}

return res.status(200).json({
  message: alreadyLiked ? "Post unliked." : "Post liked.",
  likes: post.likes.length,
  liked: !alreadyLiked,
});

  } catch (error) {
    console.error("Like post error:", error.message);
    return res.status(500).json({
      message: "Unable to like this post.",
    });
  }
});
// Add a comment to a post
router.post("/:id/comments", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        message: "Comment cannot be empty.",
      });
    }

    if (text.trim().length > 1000) {
      return res.status(400).json({
        message: "Comment cannot exceed 1000 characters.",
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }

    post.comments.push({
      user: req.userId,
      text: text.trim(),
    });

    await post.save();
    // Notify post owner about a new comment
if (post.author.toString() !== req.userId.toString()) {
  await Notification.create({
    recipient: post.author,
    sender: req.userId,
    type: "comment",
    message: "commented on your post.",
    post: post._id,
  });
}

    await post.populate(
      "comments.user",
      "name username profileImage"
    );

    const comment = post.comments[post.comments.length - 1];

    return res.status(201).json({
      message: "Comment added successfully!",
      comment,
    });
  } catch (error) {
    console.error("Add comment error:", error.message);

    return res.status(500).json({
      message: "Unable to add comment. Please try again.",
    });
  }
});


// Get comments for a post
router.get("/:id/comments", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("comments.user", "name username profileImage");

    if (!post) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }

    return res.status(200).json({
      comments: post.comments,
    });
  } catch (error) {
    console.error("Fetch comments error:", error.message);

    return res.status(500).json({
      message: "Unable to load comments.",
    });
  }
});

module.exports = router;