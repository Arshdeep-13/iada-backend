const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  query: {
    type: String,
    required: false,
  },
  subquery: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
  },
  subject: {
    type: String,
    required: false,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});
const chatSchema = new mongoose.Schema(
  {
    zonename: {
      type: String,
      required: true,
    },
    zoneadminId: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    message: [messageSchema],
    isResolve: {
      type: Boolean,
      default: false,
    },
    whoResolve: {
      type: String,
    },
    isSatisfied: {
      type: Boolean,
      default: false,
    },
    caseDays: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const chatModel = mongoose.model("chat", chatSchema);
module.exports = chatModel;
