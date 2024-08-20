const express = require("express");
const app = express();
const dbConnect = require("./config/db");
const Zone = require("./models/zoneData");
const Admin = require("./models/admins");
const bodyParser = require("body-parser");
const industryRoutes = require("./routes/industryRoute");
const zoneRoutes = require("./routes/zoneRoute");
const otpRoutes = require("./routes/otpRoute");
const zAdminRoutes = require("./routes/ZadminRoute");
const authRoutes = require("./routes/authRoute");
const fincanceRoutes = require("./routes/financeRoute");
const paymentRoute = require("./routes/paymentRoute");
const alertUpdateRoute = require("./routes/alertUpdateRoute");
const passwordResetRoute = require("./routes/passwordReset");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const ChatModel = require("./models/chatModel");
const chatModel = require("./models/chatModel");
const waterBillScheduler = require("./billScheduler/waterBillScheduler");
app.use("/userDocument", express.static("IndustryRegUpload"));
app.use("/industrydocument", express.static("DocumentUpload"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

dbConnect();

waterBillScheduler();

app.post("/addzone", async (req, res) => {
  try {
    const { zone_id, zone_area, no_Industries_under, zonal_admin_id } =
      req.body;
    const newZone = new Zone({
      zone_id,
      zone_area,
      no_Industries_under,
      zonal_admin_id,
    });
    await newZone.save();
    res.status(200).json({ message: "Zone added successfully" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "something went wrong" });
  }
});
app.post("/addadmin", async (req, res) => {
  try {
    const {
      admin_type,
      admin_id,
      admin_name,
      admin_email,
      password,
      admin_dob,
      phone_number,
      zone_id,
    } = req.body;
    const zoneId = zone_id || null;

    const newAdmin = new Admin({
      admin_type,
      admin_id,
      admin_name,
      admin_email,
      password,
      admin_dob,
      phone_number,
      zone_id: zoneId,
    });
    await newAdmin.save();
    res.status(200).json({ message: "Admin added successfully" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Something went wrong" });
  }
});
app.use("/api/auth", authRoutes);
app.use("/api/industry", industryRoutes);
app.use("/api/zone", zoneRoutes);
app.use("/api/sendOtp", otpRoutes);
app.use("/api/zAdmin", zAdminRoutes);
app.use("/api/waterbill", fincanceRoutes);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/news", alertUpdateRoute);
app.use("/api/forgotpassword", passwordResetRoute);

server.listen(8000, () => {
  console.log("Server active");
});
