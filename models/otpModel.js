const mongoose = require('mongoose');
const mailSender = require('../utils/mailSender');

const otpSchema = new mongoose.Schema({               //otp for forgot pass f()
  email: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(v); // Simple email validation
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 3, // The document will be automatically deleted after 3 minutes of its creation
  },
});

// Define a function to send emails
async function sendVerificationEmail(email, otp) {
  try {
    const mailResponse = await mailSender(
      email,
      "Verification Email",
      `<h1>Your OTP for account verification is:</h1>
       <h3> OTP code: ${otp}</h3>`
    );
    console.log("Email sent successfully: ", mailResponse);
  } catch (error) {
    console.log("Error occurred while sending email: ", error);
    throw error;
  }
}

otpSchema.pre("save", async function (next) {
  // Only send an email when a new document is created
  if (this.isNew) {
    try{
    await sendVerificationEmail(this.email, this.otp);
  } catch (error) {
    console.log("Error occurred while sending email: ", error);
    throw error;
  }
  }
  next();
});

module.exports = mongoose.model("OTP", otpSchema);
