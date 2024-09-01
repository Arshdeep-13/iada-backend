// utils/mailSender.js
const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
  try {
    const html = `
    <html>
      <head>
        <style>
          .container {
            padding: 20px;
            margin: 0 auto;
            width: 80%;
            border: 1px solid #ccc;
            border-radius: 5px;
          }
          .header {
            background-color: #f8f9fa;
            padding: 10px;
            text-align: center;
            border-bottom: 1px solid #ccc;
          }
          .body {
            padding: 10px;
          }
          .otp {
            font-size: 1.5em;
            color: #2e6c80;
            margin: 20px 0;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 0.9em;
            color: #777;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to IADA</h1>
          </div>
          <div class="body">
            <p>Dear User,</p>
            <p>Thank you for registering on our website! To complete your registration, please use the following One-Time Password (OTP):</p>
            <p class="otp">Your OTP: <strong>${body}</strong></p>
            <p>Please enter this OTP on the registration page to verify your email address.</p>
          </div>
          <div class="footer">
            <p>Best regards,</p>
            <p>IADA Team</p>
          </div>
        </div>  
      </body>
    </html>
  `;

    // Create a Transporter to send emails
    let transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
      },
    });
    // Send emails to users
    let info = await transporter.sendMail({
      from: '"IADA Support" <swca.support@iadabaddi.com>',
      to: email,
      subject: title,
      html: html,
    });
    // console.log("Email info: ", info);
    return info;
  } catch (error) {
    console.log(error.message);
  }
};
module.exports = mailSender;
