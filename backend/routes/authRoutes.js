
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({
        message: "Please fill in all required fields.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().replace(/^@/, "").toLowerCase();

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { username: normalizedUsername },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email or username is already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Account created successfully!",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage,
        location: user.location || "",
website: user.website || "",
        interests: user.interests,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email or username is already registered.",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      message: "Unable to create account. Please try again.",
    });
  }
});

// Login an existing user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter email and password.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage,
        interests: user.interests,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Unable to login. Please try again.",
    });
  }
});


// Get the currently authenticated user's profile
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage,
        interests: user.interests,
        location: user.location || "",
        website: user.website || "",
        followers: user.followers || [],
        following: user.following || [],
      },
    });
  } catch (error) {
    console.error("Get current user error:", error.message);

    return res.status(500).json({
      message: "Unable to fetch user profile.",
    });
  }
});
 // Update the currently authenticated user's profile
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const {
  name,
  username,
  bio,
  profileImage,
  location,
  website,
  interests,
} = req.body;
    const updates = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          message: "Name cannot be empty.",
        });
      }
      updates.name = name.trim();
    }

    if (username !== undefined) {
      const normalizedUsername = username
        .trim()
        .replace(/^@/, "")
        .toLowerCase();

      if (!normalizedUsername) {
        return res.status(400).json({
          message: "Username cannot be empty.",
        });
      }

      const existingUser = await User.findOne({
        username: normalizedUsername,
        _id: { $ne: req.userId },
      });

      if (existingUser) {
        return res.status(409).json({
          message: "Username is already taken.",
        });
      }

      updates.username = normalizedUsername;
    }

    if (bio !== undefined) {
      updates.bio = bio.trim();
    }

    if (profileImage !== undefined) {
      updates.profileImage = profileImage.trim();
    }

    if (interests !== undefined) {
      if (!Array.isArray(interests)) {
        return res.status(400).json({
          message: "Interests must be a list.",
        });
      }

      updates.interests = interests;
    }
if (location !== undefined) {
  updates.location = location.trim();
}

if (website !== undefined) {
  updates.website = website.trim();
}
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully!",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage,
        interests: user.interests,
        location: user.location || "",
website: user.website || "",
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Username is already taken.",
      });
    }

    console.error("Profile update error:", error.message);

    return res.status(500).json({
      message: "Unable to update profile. Please try again.",
    });
  }
});


module.exports = router;
