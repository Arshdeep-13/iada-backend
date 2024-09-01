const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const mailSender = (email,name,industry) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.iadabaddi.com",
        port: 587,
        secure: false, // Use true for port 465, false for all other ports
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASS,
        },
    });

    const mailOptions = {
        from: {
            name: "Confirmation from IADA",
            address: "swca.support@iadabaddi.com",
        }, // sender address
        to: [email], // list of receivers
        subject: "Registration request sent for approval", // Subject line
        //text: "Hello world?", // plain text body
        html: `Registration request for user ${name} under the industry ${industry}has been sent for approval`, // html body
    };


    const sendMail = async (transporter, mailOptions) => {
        try {
            await transporter.sendMail(mailOptions); // Pass mailOptions here
            console.log('Email sent successfully!');
        } catch (error) {
            console.error(error);
        }
    }

    sendMail(transporter, mailOptions);
}

module.exports=mailSender;