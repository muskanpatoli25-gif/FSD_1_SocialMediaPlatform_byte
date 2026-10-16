
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    readAt: {
      type: Date,
      default: null,
    },

    // Users who have hidden this message from their own chat history
    hiddenFor: [
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

messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, sender: 1, createdAt: -1 });

// Helps retrieve messages visible to a specific user
messageSchema.index({ hiddenFor: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
