
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["new_post", "like", "comment", "message"],
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
