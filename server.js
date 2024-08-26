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
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

dbConnect();

waterBillScheduler();

app.get("/", (req, res) => {
  res.send("Server is running and up");
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
