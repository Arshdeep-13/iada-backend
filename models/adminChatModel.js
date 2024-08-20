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
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const adminchatSchema = new mongoose.Schema(
  {
    zonename: {
      type: String,
      required: true,
    },
    adminID: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    zonaladminID: {
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
const adminchatModel = mongoose.model("adminchat", adminchatSchema);

module.exports = adminchatModel;
