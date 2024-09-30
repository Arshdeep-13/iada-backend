const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  //otp for forgot pass f()
  email: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(v); // Simple email validation
      },
      message: (props) => `${props.value} is not a valid email!`,
    },
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 10, // The document will be automatically deleted after 10 minutes of its creation
  },
});


module.exports = mongoose.model("OTP", otpSchema);
