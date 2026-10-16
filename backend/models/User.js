
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    bio: {
      type: String,
      default: "",
    },

    profileImage: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    website: {
      type: String,
      default: "",
      trim: true,
    },

    interests: {
      type: [String],
      default: [],
    },
    
followers: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
],

following: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
],

  },
  
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);

