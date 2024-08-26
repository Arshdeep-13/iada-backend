const twilo = require("twilio");

const phoneOtp = (otp, phone) => {
  try {
    const client = new twilo(
      "AC064c264b8fa216a1e2dd63f9058ca77d",
      "db35777f6ed754850a2e0f4e3f409677"
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
