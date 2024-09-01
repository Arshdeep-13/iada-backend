const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const mailSender = (email,data) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
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
            name: "IADA-WebPortal",
            address: "swca.support@iadabaddi.com",
        }, // sender address
        to: [email], // list of receivers
        subject: "New Alert Received", // Subject line
        //text: "Hello world?", // plain text body
        html: `Your zonal admin Mr. ${data?.adminDetails?.admin_name} has sent a new Alert for your ${data?.industryDetails?.industry_name}`
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