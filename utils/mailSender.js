// utils/mailSender.js
const nodemailer = require('nodemailer');

const mailSender = async (email, title, body) => {
  try {
    // Create a Transporter to send emails
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      auth: {
        user: "sv176734@gmail.com",
        pass: "dzhq hmpp ofwc mlbr"
      }
    });
    // Send emails to users
    let info = await transporter.sendMail({
      from: 'IADA - Team',
      to: email,
      subject: title,
      html: body,
    });
    console.log("Email info: ", info);
    return info;
  } catch (error) {
    console.log(error.message);
  }
};
module.exports = mailSender;