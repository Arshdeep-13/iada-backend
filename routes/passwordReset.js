// routes/otpRoutes.js
const router = require("express").Router();
const OTP = require("../models/otpModel");
const Industry = require("../models/industry");
const Admin = require("../models/admins");
const bcrypt = require("bcryptjs");
const mailSender = require("../utils/mailSender");

// Function to generate a random OTP
function generateOTP() {
  return Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
}

// Route to save a new OTP
router.post("/", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(500).json({ message: "Please provide an email" });
  }

  try {
    const industry = await Industry.findOne({ email });
    const admin = await Admin.findOne({ admin_email: email });

    if (!admin && !industry) {
      return res
        .status(404)
        .json({ message: "No account associated with the given email" });
    }
  } catch (e) {
    res.status(500).json({ message: e });
  }

  try {
    const otp = generateOTP();
    let existingOTP = await OTP.findOne({ email });
    console.log(otp);
    if (existingOTP) {
      existingOTP = await OTP.findOneAndUpdate(
        { email },
        { email, otp },
        { new: true }
      );
    } else {
      const newOTP = new OTP({
        email,
        otp,
      });
      existingOTP = await newOTP.save();
    }

    await mailSender(
      email,
      "Password Reset OTP",
      `Your OTP for password reset is: ${otp}`
    );

    res.status(200).json({ message: "OTP generated and sent successfully" });
  } catch (error) {
    console.error("Error generating or saving OTP:", error);
    res.status(500).json({ message: "Failed to generate or save OTP" });
  }
});

router.post("/verifyotp", async (req, res) => {
  const { email, userOtp, newPassword } = req.body;
  const passwordRegex =
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  try {
    const otpdoc = await OTP.findOne({ email });
    if (!otpdoc) {
      return res.status(403).json({ message: "No OTP found" });
    }
    if (otpdoc.otp === userOtp) {
      if (!email || !newPassword) {
        return res.status(400).json({ message: "All fields are required." });
      }
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
          message:
            "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.",
        });
      }

      try {
        let admin = await Admin.findOne({ admin_email: email });

        if (admin) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(newPassword, salt);
          admin.password = hashedPassword;
          await admin.save();
          await sendConfirmationEmail(email);
          return res.status(200).json({
            message:
              "OTP verified and Password updated successfully for Admin.",
          });
        }

        let industry = await Industry.findOne({ email });
        if (industry) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(newPassword, salt);
          industry.password = hashedPassword;
          await industry.save();
          await sendConfirmationEmail(email);
          return res.status(200).json({
            message:
              "OTP verified and Password updated successfully for Industry.",
          });
        }

        return res
          .status(404)
          .json({ message: "No user found with this Email." });
      } catch (error) {
        console.error("Error resetting password:", error);
        return res.status(500).json({ message: "Internal Server Error." });
      }
    } else {
      return res.status(400).json({ message: "Incorrect OTP." });
    }
  } catch (e) {
    return res.status(500).json({ message: e });
  }
});

async function sendConfirmationEmail(email) {
  try {
    mailResponse = await mailSender(
      email,
      "Confirmation Email",
      `<h1>Your password has been reset for account with email id : ${email}</h1>
       <p>Try contacting the admin if not done by you.</p>`
    );
  } catch (error) {
    console.log("Error occurred while sending email: ", error);
    throw error;
  }
}
module.exports = router;
