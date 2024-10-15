const router = require("express").Router();
const Admin = require("../models/admins");
const Zone = require("../models/zoneData");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const adminchatModel = require("../models/adminChatModel");
const multer = require("multer");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const xlsx = require("xlsx");
const waterBills = require("../models/waterBills");
let parser = require("simple-excel-to-json");
let xlsxtojson = require("xlsx-to-json");
const { phoneOtp } = require("../controllers/phoneOtpController");
let generateOtp = 0;
const industries = require("../models/industry");
const waterBillFinance = require("../models/waterBill");
const finalWaterBill = require("../models/finalWaterBill");
const Document = require("../models/documents");
const IndustryImage = require("../models/industryImage");
const adminDoc = require("../models/admindocModel");
const schedule = require("node-schedule");
const chat = require("../models/chatModel");
const chatModel = require("../models/chatModel");
const counterFile = path.join(__dirname, "../utils/counter.txt");
const axios = require("axios");
const authMiddleware = require("../middleware/authMiddleware");
const zonalAdminMiddleware = require("../middleware/zonalAdminMiddleware");
const SITE_SECRET = process.env.SITE_SECRET;

// FUNCTIONS

const storageAdmin = multer.memoryStorage();
const uploadAdmin = multer({
  storage: storageAdmin,
  fileFilter: (req, file, cb) => {
    // Define allowed file types
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true); // Accept the file
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed."
        ),
        false
      ); // Reject the file
    }
  },
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "WaterBillUploads/";

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    } else {
      cb(null, "WaterBillUploads/");
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (
      file.mimetype !==
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      cb(new Error("Only Excel files are allowed"), false);
    } else {
      cb(null, true);
    }
  },
});
function addOneMonth(date, m) {
  const newDate = new Date(date); //current date obj
  let day = newDate.getDate();
  let month = newDate.getMonth();
  let year = newDate.getFullYear();

  month += m; // m = water bill due after (months)

  year += Math.floor(month / 12);
  month = month % 12;

  newDate.setMonth(month);
  newDate.setFullYear(year); // new date = due date

  if (newDate.getDate() < day) {
    //as new date should'nt be <current date
    newDate.setDate(0);
  }
  return newDate;
}
const DateHandler = (NumberDate) => {
  let days = NumberDate - 1;

  // Create a new date object starting from 01-01-1900
  let startDate = new Date(1900, 0, 1);

  // Add the given number of days to the start date
  startDate.setDate(startDate.getDate() + days);

  return startDate;
};

//This f() is responsible for entering the water bills from Xl and calculation of the final bills of each entry
const enterBill = async (industry, industryBill, zoneId) => {
  try {
    // Fetch water finance data
    const waterFinanceData = await waterBillFinance.find({});
    if (!waterFinanceData.length) {
      throw new Error("Water finance data not found");
    }

    // Get the appropriate WaterBill model based on zone ID
    const WaterBillModel = waterBills.getModelByZoneId(zoneId);
    if (!WaterBillModel) {
      throw new Error("Invalid zone ID, WaterBill model not found");
    }

    // Check for duplicate bills based on premises and date
    const duplicateBill = await WaterBillModel.findOne({
      premises: industryBill.premises,
      meterNo: industryBill.meterNo,
      isDue: true,
      date: industryBill.date,
    });

    if (duplicateBill) {
      const trimmedDate = industryBill.date.toDateString();
      throw new Error(
        `Duplicate bill Found for: ${industryBill.premises} with date: ${trimmedDate} meter number: ${industryBill.meterNo}`
      );
    }
    // The 'industryBill' is the entry during the file upload
    // therefore it is not the 'bill' that is presented after calculation.
    // The bill which is presented after calculation is 'presentedBill' defined below.
    // Set financial data on the industry bill
    industryBill.rsPerKl = waterFinanceData[0].permaConnectionRatePerKL;
    industryBill.latePaymentSurcharge = waterFinanceData[0].latePaymentFine;

    const currentDate = new Date();
    let billRaisingDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      waterFinanceData[0].billRaisingDate
    ); //date on which the bill will be raised

    const newDueDate = addOneMonth(
      billRaisingDate,
      waterFinanceData[0].lateBillAfter
    );
    industryBill.dueDate = newDueDate; //This is the date after which the payment is considered late

    let newBill = 0;
    let consumptionUnits = 0;

    // Calculate bill based on meter number or industry area
    if (
      industryBill.meterNo === 0 ||
      industryBill.meterNo === "" ||
      industryBill.meterNo === null ||
      industryBill.meterNo === undefined
    ) {
      newBill = waterFinanceData[0].minimumPayment * 3; //if no meter no then minAmt * 3 is the bill total
    } else {
      consumptionUnits = Math.abs(
        parseFloat(industryBill.startRangeMeterReading) -
          parseFloat(industryBill.endRangeMeterReading)
      );
      newBill = consumptionUnits * waterFinanceData[0].permaConnectionRatePerKL;
      if (newBill < waterFinanceData[0].minimumPayment) {
        newBill = waterFinanceData[0].minimumPayment; //if newbill val is less than (even 0) the min amt then set it to min amt
      }
    }
    industryBill.currentTotal = newBill;
    industryBill.amountPayOnDueDate = newBill;

    if (industryBill.sewerageCharges) {
      industryBill.sewerageCharges = waterFinanceData[0].sewerageFee;
      industryBill.amountPayOnDueDate += parseFloat(
        industryBill.sewerageCharges
      ); //add sewerage charges to current bill during upload
    }
    //industryBill.amountPayOnDueDate is the main bill amt now

    // Calculate arrears and final bill amount
    const dueBills = await WaterBillModel.find({
      //because this final bill calc f() is embedded in the zone bill upload f(), it'll fetch nothing at the uploading of the 1'st bill
      premises: industryBill.premises,
      isDue: true,
    });

    let calculatedArrears = 0;
    let calculatedFinalBill = industryBill.amountPayOnDueDate;
    let billWithLateFine = 0;
    const currDate = new Date(industryBill.date);

    let surchargeOfFinal =
      parseFloat(industryBill.latePaymentSurcharge / 100) *
      industryBill.amountPayOnDueDate;
    // from old bills
    dueBills.forEach((bill) => {
      billWithLateFine = //late fine on prev bills
        parseFloat(bill.latePaymentSurcharge / 100) *
          parseFloat(bill.amountPayOnDueDate) +
        parseFloat(bill.amountPayOnDueDate);

      bill.amountPayAfterDueDate = billWithLateFine;
      // if (bill.sewerageCharges > 0) {  //needed?
      //   calculatedFinalBill += parseFloat(bill.sewerageCharges);
      // }
      if (
        currDate > bill.dueDate &&
        parseFloat(bill.amountPayOnDueDate) ===
          parseFloat(bill.currentTotal) + parseFloat(bill.sewerageCharges)
      ) {
        //the %surcharge will be added only once when late.
        calculatedFinalBill += billWithLateFine; // fine applied if late
      } else {
        calculatedFinalBill += parseFloat(bill.amountPayOnDueDate);
      }
    });
    // Convert to number format
    const afterDueAmt = Number(surchargeOfFinal + calculatedFinalBill); //if after late
    const beforeDueAmt = Number(
      calculatedFinalBill //else
    );
    if (calculatedFinalBill === 0) {
      calculatedArrears = 0;
    } else {
      calculatedArrears = Math.abs(calculatedFinalBill - newBill); // Calculate arrears as the sum amount of previous bills
    }
    // Save the new bill
    const addedBill = new WaterBillModel(industryBill);
    await addedBill.save();

    // Save the final bill in the final bill collection
    const updateData = {
      no: industryBill.no,
      date: billRaisingDate,
      consumerNo: industryBill.consumerNo,
      meterNo: industryBill.meterNo,
      consumerName: industryBill.consumerName,
      premises: industryBill.premises,
      readingsFrom: industryBill.readingsFrom,
      readingsTo: industryBill.readingsTo,
      startRangeMeterReading: industryBill.startRangeMeterReading,
      endRangeMeterReading: industryBill.endRangeMeterReading,
      rsPerKl: industryBill.rsPerKl,
      arrears: calculatedArrears,
      dueDate: industryBill.dueDate,
      amountPayOnDueDate: beforeDueAmt,
      latePaymentSurcharge: surchargeOfFinal,
      amountPayAfterDueDate: afterDueAmt,
      currentTotal: newBill,
      sewerageCharges: industryBill.sewerageCharges,
    };

    const updatedBill = await finalWaterBill.findOneAndUpdate(
      { premises: industryBill.premises },
      updateData,
      { upsert: true, new: true }
    );

    if (!updatedBill) {
      throw new Error("Premises not found");
    }
  } catch (error) {
    throw error;
  }
};

const readCounter = async () => {
  const data = await fsp.readFile(counterFile, "utf8"); // Correct usage of fs.promises.readFile
  return parseInt(data, 10);
};

const writeCounter = async (counter) => {
  await fsp.writeFile(counterFile, counter.toString(), "utf8");
};

// ROUTES

router.post("/login", async (req, res) => {
  try {
    const { admin_email, password, rememberMe, captchaValue } = req.body;
    const { data } = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${SITE_SECRET}&response=${captchaValue}`
    );
    if (data.success) {
      const requestedAdmin = await Admin.findOne({ admin_email: admin_email });
      if (requestedAdmin) {
        if (!requestedAdmin.is_approved) {
          return res
            .status(403)
            .json({ message: "Admin not approved by Master Admin" });
        }
        generateOtp = Math.floor(100000 + Math.random() * 900000);
        const isPasswordValid = await bcrypt.compare(
          password,
          requestedAdmin.password
        );
        if (!isPasswordValid) {
          return res.status(401).json({ message: "Invalid password" });
        } else {
          // const otpSent = await phoneOtp(generateOtp, `+91${requestedAdmin.phone_number}`);

          // if (!otpSent) {
          //   console.warn("Proceeding with the next steps even though OTP sending failed.");
          // }
          const token = jwt.sign(
            { adminId: requestedAdmin._id },
            process.env.SECRET_KEY,
            { expiresIn: rememberMe ? "30d" : "60m" }
          );

          // getting the admin zone name

          const zoneName = await Zone.findOne({
            zone_id: requestedAdmin.zone_id,
          });
          if (!zoneName) {
            const newToken = await Admin.findByIdAndUpdate(requestedAdmin.id, {
              currentToken: token,
            });
            await newToken.save();
            return res.status(200).json({
              status: 200,
              admin: requestedAdmin,
              zoneName: "master",
              token: token,
              otp: generateOtp,
            });
          } else {
            requestedAdmin.zone_name = zoneName.zone_name;
            console.log("Admin" + requestedAdmin);
            const newToken = await Admin.findByIdAndUpdate(requestedAdmin.id, {
              currentToken: token,
            });
            await newToken.save();
            return res.status(200).json({
              status: 200,
              admin: requestedAdmin,
              zoneName: zoneName.zone_name,
              token: token,
              otp: generateOtp,
            });
          }
        }
      } else {
        return res
          .status(400)
          .json({ message: "No admin found with provided credentials" });
      }
    } else {
      return res.status(400).json({ message: "Captcha verification failed" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
router.post("/register", async (req, res) => {
  try {
    const {
      admin_id,
      admin_type,
      admin_name,
      admin_email, //We've removed the zAdmin register but we may neet to add
      password, //it later again as a project req. Let's keep this rn
      phone_number,
      zone_id,
    } = req.body;

    if (
      !admin_type ||
      !admin_name ||
      !admin_email ||
      !password ||
      !phone_number ||
      !admin_id
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let admin = await Admin.findOne({ admin_email: admin_email });
    if (admin) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdminData = {
      admin_id,
      admin_type,
      admin_name,
      admin_email,
      password: hashedPassword,
      is_approved: false,
      phone_number,
    };

    if (zone_id) {
      const zone = await Zone.findOne({ zone_id: zone_id });
      if (!zone) {
        return res
          .status(400)
          .json({ message: "No zone exists with provided zone_id" });
      }
      newAdminData.zone_id = zone_id;
    }

    const newAdmin = new Admin(newAdminData);

    await newAdmin.save();

    return res.status(200).json({ message: "Request sent for approval" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/adminid", authMiddleware, async (req, res) => {
  try {
    const data = await Admin.findOne({ admin_type: "master_admin" });
    // console.log(data)
    return res.status(201).send({
      message: "Data sent succesfully",
      success: true,
      id: data._id,
    });
  } catch (error) {
    return res.status(401).send({
      message: error.message,
      success: false,
    });
  }
});
router.post("/getone", zonalAdminMiddleware, async (req, res) => {
  try {
    const { _id } = req.body;
    const ZAdmin = await Admin.findOne({ _id });
    if (!ZAdmin) {
      return res.status(404).json({ message: "no admin exists" });
    } else {
      return res.status(200).json(ZAdmin);
    }
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      message: e.message,
      success: false,
    });
  }
});
router.get("/zonename", async (req, res) => {
  try {
    // console.log(req.query.zonalId)
    const data = await Admin.findById(req.query.zonalId);
    // console.log(data)
    const zoneName = await Zone.findOne({ zonal_admin_id: data.admin_id });
    return res.status(201).send({
      message: "Data send",
      success: true,
      zone: zoneName.zone_name,
    });
  } catch (error) {
    return res.status(401).send({
      message: "Something went wrong",
      success: false,
    });
  }
});
router.post("/save-chat-admin", authMiddleware, async (req, res) => {
  try {
    const data = req.body;
    const userId = await adminchatModel.findOne({
      zonaladminID: data.zonaladminID,
    });

    if (!userId) {
      const newData = new adminchatModel(req.body);
      await newData.save();
    } else {
      userId.message.push(data.message);
      await userId.save();
    }
    return res.status(201).send({
      message: "Message sent successfully",
      success: true,
    });
  } catch (error) {
    return res.status(401).send({
      message: error.message,
      success: false,
    });
  }
});
router.post("/save-chat-user", zonalAdminMiddleware, async (req, res) => {
  try {
    const data = req.body;
    const response = await chatModel.findOne({ userId: data.userId });

    if (!response) {
      const newData = new chatModel(req.body);
      await newData.save();
    } else {
      response.message.push(data.message);
      await response.save();
    }
    return res.status(201).send({
      message: "Message sent successfully",
      success: true,
    });
  } catch (error) {
    return res.status(401).send({
      message: "Something went wrong",
      success: false,
    });
  }
});
router.post(
  "/save-updated-chat-madmin",
  zonalAdminMiddleware,
  async (req, res) => {
    try {
      req.body = req.body.body.e;
      const { adminID } = req.body;
      await adminchatModel.findOneAndUpdate({ adminID: adminID }, req.body);

      return res.status(201).send({
        message: "chat saved successfully",
        success: true,
      });
    } catch (err) {
      return res.status(401).send({
        message: err.message,
        success: false,
      });
    }
  }
);

// creating the node-schedule for the auto updating the date for caseDays
schedule.scheduleJob("0 0 * * *", async () => {
  try {
    const chats = await chat.find({ isResolve: false });
    for (const chat of chats) {
      chat.caseDays += 1;
      if (chat.caseDays > 15) {
        chat.isResolve = true;
      }
      try {
        await chat.save();
      } catch (saveError) {
        console.error(`Error saving chat ${chat._id}:`, saveError);
      }
    }
  } catch (findError) {
    console.error("Error finding chats:", findError);
  }
});

router.get("/resolveChatmAdmin", zonalAdminMiddleware, async (req, res) => {
  try {
    const data = await chat.find({ isResolve: true, caseDays: { $gt: 14 } });
    return res.status(201).send({
      message: "Data send Succesffully",
      success: true,
      data: data,
    });
  } catch (error) {
    return res.status(401).send({
      message: error.message,
      success: false,
    });
  }
});

router.get("/getAllIndustryChat", zonalAdminMiddleware, async (req, res) => {
  try {
    const data = await adminchatModel.find({});
    return res.status(201).send({
      message: "data send",
      success: true,
      data: data,
    });
  } catch (error) {
    return res.status(401).send({
      message: "Something went wrong",
      success: false,
    });
  }
});
router.get("/getalladmin", zonalAdminMiddleware, async (req, res) => {
  try {
    const admins = await Admin.find({ admin_type: "zonal_admin" });
    return res.status(200).json(admins);
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});
router.get("/getIndustryChat-admin", zonalAdminMiddleware, async (req, res) => {
  try {
    // console.log(req.query.id)
    const data = await adminchatModel.findOne({ zonaladminID: req.query.id });
    // console.log(data)
    return res.status(201).send({
      message: "data send",
      success: true,
      data: data,
    });
  } catch (error) {
    return res.status(401).send({
      message: "Something went wrong",
      success: false,
    });
  }
});

router.post("/resolve-chat", zonalAdminMiddleware, async (req, res) => {
  try {
    const data = req.body;
    // console.log(data);
    const updatedDoc = await adminchatModel.findOne({
      zonaladminID: data.zonaladminId,
    });
    // console.log(updatedDoc);
    let update;
    if (updatedDoc && updatedDoc.isResolve) {
      update = {
        isResolve: false,
        whoResolve: data.whoResolve,
        isSatisfied: true,
      };
    } else {
      update = {
        isResolve: true,
        whoResolve: data.whoResolve,
        isSatisfied: true,
      };
    }
    const userId = await adminchatModel.findOneAndUpdate(
      { zonaladminID: data.zonaladminId },
      update,
      { new: true }
    );
    return res.status(201).send({
      message: "Chat Status updated",
      success: true,
      chat: userId,
    });
  } catch (error) {
    return res.status(401).send({
      message: "Something went wrong",
      success: false,
    });
  }
});
router.post("/resolve-chat-all", zonalAdminMiddleware, async (req, res) => {
  try {
    const data = req.body;
    const updatedDoc = await adminchatModel.findOne({
      zonaladminID: data.zonaladminId,
    });
    let update;
    if (updatedDoc && updatedDoc.isResolve) {
      update = {
        isResolve: false,
        whoResolve: data.whoResolve,
        isSatisfied: true,
      };
    } else {
      update = {
        isResolve: true,
        whoResolve: data.whoResolve,
        isSatisfied: true,
      };
    }
    const userId = await adminchatModel.findOneAndUpdate(
      { zonaladminID: data.zonaladminId },
      update,
      { new: true }
    );

    const updatedDoc1 = await chatModel.findOne({ userId: data.userId });
    let update1;
    if (updatedDoc1 && updatedDoc1.isResolve) {
      update1 = {
        isResolve: false,
        whoResolve: data.whoResolve,
        isSatisfied: true,
      };
    } else {
      update1 = {
        isResolve: true,
        whoResolve: data.whoResolve,
        isSatisfied: true,
      };
    }
    const userId1 = await chatModel.findOneAndUpdate(
      { userId: data.userId },
      update1,
      { new: true }
    );
    return res.status(201).send({
      message: "Chat Status updated",
      success: true,
      chat: userId,
    });
  } catch (error) {
    return res.status(401).send({
      message: "Something went wrong",
      success: false,
    });
  }
});
router.post("/user-statisfied", zonalAdminMiddleware, async (req, res) => {
  try {
    const data = req.body;
    const userId = await adminchatModel.findOneAndUpdate(
      { zonaladminID: data.userId },
      { isSatisfied: data.isSatisfied },
      { new: true }
    );
    return res.status(201).send({
      message: "Chat Status updated",
      success: true,
      chat: userId,
    });
  } catch (error) {
    return res.status(401).send({
      message: "Something went wrong",
      success: false,
    });
  }
});

router.get("/getAdminData", async (req, res) => {
  try {
    const data = await Admin.findOne({
      admin_id: req.query.id,
    });
    if (data) {
      return res.status(200).json(data);
    }
  } catch (error) {
    return res.status(401).send({
      message: "Something went wrong",
      success: false,
    });
  }
});
router.put("/updateAdminData", zonalAdminMiddleware, async (req, res) => {
  try {
    const data = await Admin.findOneAndUpdate(
      { admin_id: req.body.id },
      {
        admin_email: req.body.admin_email,
        admin_name: req.body.admin_name,
        phone_number: req.body.phone_number,
      }
    );
    return res.status(201).send({
      message: "Data updated",
      success: true,
      data: data,
    });
  } catch (error) {
    return res.status(401).send({
      message: error.message,
      success: false,
    });
  }
});

router.post(
  "/getIndustryWaterBill",
  zonalAdminMiddleware,
  upload.single("avatar"),
  async (req, res) => {
    let file;
    try {
      const zoneId = req.body.zoneId;
      file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const workbook = xlsx.readFile(file.path);
      const sheetName = workbook.SheetNames;
      const xlData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName[0]]);

      for (let obj of xlData) {
        try {
          // Type conversion with validation
          let counter = await readCounter();
          counter++;
          obj.no = counter;
          obj.date = obj.date ? DateHandler(obj.date) : new Date();
          obj.consumerNo = isNaN(parseInt(obj.consumerNo))
            ? null
            : parseInt(obj.consumerNo);
          obj.meterNo = obj.meterNo;
          obj.consumerName = obj.consumerName
            ? obj.consumerName
            : "No Name given";
          obj.sewerageCharges =
            obj.sewerageCharges == "yes" ||
            obj.sewerageCharges == "Yes" ||
            obj.sewerageCharges == "YES";
          obj.premises = obj.premises ? obj.premises : "No premises given";
          obj.startRangeMeterReading = isNaN(
            parseInt(obj.startRangeMeterReading)
          )
            ? 0
            : parseInt(obj.startRangeMeterReading);
          obj.endRangeMeterReading = isNaN(parseInt(obj.endRangeMeterReading))
            ? 0
            : parseInt(obj.endRangeMeterReading);
          obj.readingsFrom = DateHandler(obj.readingsFrom);
          obj.readingsTo = DateHandler(obj.readingsTo);

          const particularIndustryData = await industries.findOne({
            plot_number: obj.premises,
          });
          await enterBill(particularIndustryData, obj, zoneId);
          await writeCounter(counter);
        } catch (conversionError) {
          return res.status(400).json({
            message: `Error processing entry: ${conversionError.message}`,
          });
        }
      }
      return res.status(200).json({ message: "File uploaded successfully" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    } finally {
      // Delete the file after processing
      if (file) {
        fs.unlinkSync(file.path);
      }
    }
  }
);
router.post("/updateWaterBill", zonalAdminMiddleware, async (req, res) => {
  try {
    req.body.isDue = false; // if payment is successful
    return res.status(201).send({
      message: "Data updated",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/getdocument", authMiddleware, async (req, res) => {
  const { zone_id } = req.query;
  try {
    const industries1 = await industries.find({ zone_id });
    const industryIds = industries1.map((industry) => industry._id);
    const documents = await Document.find({
      industry: { $in: industryIds },
    }).populate("industry");
    return res.status(201).send({
      message: "Data fetch Successfully",
      success: true,
      data: documents,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/deleteDocuments", async (req, res) => {
  const { ids } = req.body;

  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Invalid IDs provided" });
    }

    const result = await Document.deleteMany({ _id: { $in: ids } });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ error: "No documents found with provided IDs" });
    }

    res.status(200).json({
      message: `${result.deletedCount} document(s) deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting documents:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post(
  "/zadmin-uploaddoc",
  uploadAdmin.single("file"),
  async (req, res) => {
    try {
      const data = await Zone.findOne({ zone_id: req.body.zoneId });
      const zoneName = data.zone_name;
      const newData = new adminDoc({
        zonaladmin: req.body.zoneId,
        zonename: zoneName,
        documentUrl: req.file.buffer,
        documentType: req.file.mimetype,
        docname: req.file.originalname,
        size: req.file.size,
      });
      await newData.save();
      return res
        .status(201)
        .send({ message: "Document uploaded successfully", success: true });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

router.get("/getDocByZone", zonalAdminMiddleware, async (req, res) => {
  const { zoneId } = req.query;
  try {
    const documents = await adminDoc.find({ zonaladmin: zoneId });
    return res.status(201).send({
      message: "Data fetch Successfully",
      success: true,
      data: documents,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/mAdmin/getdocument", authMiddleware, async (req, res) => {
  try {
    const data = await adminDoc.find({});
    return res.status(201).send({
      message: "Fetched",
      success: true,
      data: data,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post(
  "/mAdmin/deleteDocuments",
  zonalAdminMiddleware,
  async (req, res) => {
    const { ids } = req.body;
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Invalid IDs provided" });
      }

      const result = await adminDoc.deleteMany({ _id: { $in: ids } });

      if (result.deletedCount === 0) {
        return res
          .status(404)
          .json({ error: "No documents found with provided IDs" });
      }

      res.status(200).json({
        message: `${result.deletedCount} document(s) deleted successfully`,
      });
    } catch (error) {
      console.error("Error deleting documents:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.post("/resolve-chat", zonalAdminMiddleware, async (req, res) => {
  try {
    const data = req.body;
    const updatedDoc = await chatModel.findOne({ userId: data.userId });
    let update;
    if (updatedDoc && updatedDoc.isResolve) {
      update = {
        isResolve: false,
        whoResolve: data.whoResolve,
        isSatisfied: true,
      };
    } else {
      update = {
        isResolve: true,
        whoResolve: data.whoResolve,
        isSatisfied: true,
      };
    }
    const userId = await chatModel.findOneAndUpdate(
      { userId: data.userId },
      update,
      { new: true }
    );
    return res.status(201).send({
      message: "Chat Status updated",
      success: true,
      chat: userId,
    });
  } catch (error) {
    return res.status(401).send({
      message: "Something went wrong",
      success: false,
    });
  }
});

router.get("/get-industry-images", async (req, res) => {
  try {
    const zone_id = req.query.zoneId;

    if (!zone_id) {
      return res.status(400).json({ error: "zone_id is required" });
    }

    const images = await IndustryImage.find({ zone_id });
    return res.status(201).send({
      message: "Data fetch",
      success: true,
      data: images,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch images" });
  }
});

router.post("/deletetheimage", zonalAdminMiddleware, async (req, res) => {
  try {
    const { industry_id, imgId } = req.body;

    const industryImage = await IndustryImage.findOne({ industry_id });

    if (!industryImage) {
      return res.status(401).send({
        message: "Something went wrong",
        success: false,
      });
    }

    const imageIndex = industryImage.images.findIndex(
      (img) => img._id == imgId
    );

    if (imageIndex === -1) {
      return res.status(404).send({
        message: "Image not found",
        success: false,
      });
    }
    industryImage.images.splice(imageIndex, 1);
    if (industryImage.images.length !== 0) {
      await industryImage.save();
      return res.status(201).send({
        message: "Deleted Successfully",
        success: true,
      });
    } else {
      await IndustryImage.deleteOne({ industry_id });
      return res.status(200).send({
        message: "deleted successfully",
        success: true,
      });
    }
  } catch (e) {
    return res.status(501).send({
      message: "An Error Occured...",
      success: false,
    });
  }
});

router.post("/update-image-status", zonalAdminMiddleware, async (req, res) => {
  try {
    const { industry_id, imgId } = req.body;

    const industryImage = await IndustryImage.findOne({ industry_id });

    if (!industryImage) {
      return res.status(401).send({
        message: "Something went wrong",
        success: false,
      });
    }
    const image = industryImage.images.find((img) => {
      // console.log(img._id, imgId);
      return img._id == imgId;
    });
    if (!image) {
      return res.status(404).send({
        message: "No Image Found",
        success: false,
      });
    }
    image.isAccepted = true;
    await industryImage.save();
    return res.status(201).send({
      message: "Updated Successfully",
      success: true,
    });
  } catch (error) {
    return res.status(501).send({
      message: "An Error Occured...",
      success: false,
    });
  }
});

module.exports = router;
