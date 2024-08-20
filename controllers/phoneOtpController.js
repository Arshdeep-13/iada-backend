const twilo = require("twilio");
require("dotenv").config();

const phoneOtp = (otp, phone) => {
  try {
    const client = new twilo(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    client.messages.create({
      body: `Your Login Otp is ${otp}`,
      from: "+14236005657",
      to: phone,
    });
    return true;
  } catch (error) {
    console.error("Error sending OTP:", error);
    if (error.code === 21608) {
      console.warn(
        "The number is unverified. Trial accounts cannot send messages to unverified numbers."
      );
      return false;
    }
    return false;
  }
};

module.exports = { phoneOtp };
