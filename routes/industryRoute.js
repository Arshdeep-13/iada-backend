const mailSender = require("../tester");
const axios = require("axios");
const approvalMail = require("../approvedIndustryMailer");
const router = require("express").Router();
const Industry = require("../models/industry");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const waterBill = require("../models/waterBills");
const Document = require("../models/documents");
const zoneModel = require("../models/zoneData");
const chatModel = require("../models/chatModel");
const adminModel = require("../models/admins");
const IndustryImage = require("../models/industryImage");
const twilo = require("twilio");
const { phoneOtp } = require("../controllers/phoneOtpController");
const WaterBillFinance = require("../models/waterBill");
const industryRegDoc = require("../models/RegDocumentModal");
const multer = require("multer");
const fs = require("fs");
const { userInfo } = require("os");
const { addAlert } = require("../services/alertService");
const { newIndustryAlert } = require("../utils/constants");
const authMiddleware = require("../middleware/authMiddleware");
const sharp = require("sharp");

let generateOtp = 0;
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
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
}); //to upload registered industry documents

const storageRegister = multer.memoryStorage();
const uploadRegister = multer({
  storage: storageRegister,
  fileFilter: (req, file, cb) => {
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
}); //to upload industry registration document

const uploadDocument = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const { industryId } = jwt.verify(token, process.env.SECRET_KEY);
    const data = new Document({
      industry: industryId,
      documentUrl: req.file.buffer,
      documentType: req.file.mimetype,
      docname: req.file.originalname,
      size: req.file.size,
    });
    await data.save();
    res
      .status(201)
      .send({ message: "Document uploaded successfully", success: true });
  } catch (error) {
    res
      .status(500)
      .send({ message: "An error occurred", error: error.message });
  }
};

router.post("/upload", upload.single("file"), uploadDocument); //industry upload document during registration
router.post("/get-approved-images", async (req, res) => {
  //industry image gallary fetching
  try {
    const { zone_id } = req.body;
    const images = await IndustryImage.find({ zone_id });

    const approvedImages = [];
    let n = images.length;
    for (let i = n - 1; i >= 0; i--) {
      const obj = images[i].images;
      for (let j = 0; j < obj.length; j++) {
        if (obj[j].isAccepted) {
          if (approvedImages.length >= 5) {
            break;
          }
          approvedImages.push(obj[j]);
        }
      }
    }

    res.status(200).json(approvedImages);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch images" });
  }
});
router.post(
  "/upload-images",
  authMiddleware,
  upload.array("images", 5),
  async (req, res) => {
    try {
      const { description, industry_id, zone_id } = req.body;

      if (!industry_id || !zone_id) {
        return res
          .status(400)
          .json({ error: "industry_id and zone_id are required" });
      }

      const existingImages = await IndustryImage.find({ industry_id, zone_id });
      if (existingImages.length > 0) {
        await IndustryImage.deleteOne({ industry_id, zone_id });
      }

      const allImages = await IndustryImage.find({ zone_id });

      let sum = 0;
      allImages.forEach((image) => {
        sum += image.images.length;
      });

      if (sum > 20) {
        return res.status(400).json({
          error: "Service not available yet, please try after some time",
        });
      }

      const compressedImages = await Promise.all(
        req.files.map(async (file) => {
          const compressedImage = await sharp(file.buffer)
            .resize({ width: 300, height: 300, fit: "contain" })
            .jpeg({ quality: 70 })
            .png({ compressionLevel: 7 })
            .toBuffer();
          return {
            data: compressedImage,
            contentType: file.mimetype,
          };
        })
      );

      const industryImage = new IndustryImage({
        industry_id,
        zone_id,
        description,
        images: compressedImages,
      });

      await industryImage.save();
      res.status(201).json({ message: "Images uploaded successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to upload images" });
    }
  }
);

router.get("/", authMiddleware, async (req, res) => {
  //req needed?
  try {
    const industries = await Industry.find();

    res.status(200).json(industries);
  } catch (error) {
    console.error("Error fetching industries:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/", async (req, res) => {
  try {
    const { zone_id } = req.body;
    const rc = await Industry.find({
      zone_id: zone_id,
      is_registered: true,
    }).countDocuments();
    const uc = await Industry.find({
      zone_id: zone_id,
      is_registered: false,
    }).countDocuments();
    res.status(200).json({ registeredCount: rc, unRegisteredCount: uc });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/getone", authMiddleware, async (req, res) => {
  try {
    const { _id } = req.body;

    const industry = await Industry.findOne({ _id: _id });
    if (!industry) {
      return res
        .status(404)
        .json({ message: "Couldn't find industry with given ID" });
    } else {
      return res.status(200).json(industry);
    }
  } catch (e) {
    console.log("Error fetching the industry: ", e);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/zoned", authMiddleware, async (req, res) => {
  try {
    const { zone_id } = req.body;
    const c = await Industry.find({ zone_id: zone_id }).select("-password");
    res.status(200).json(c);
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/fetch-pdf-zoneId", authMiddleware, async (req, res) => {
  try {
    const { zone_id } = req.body;
    const c = await industryRegDoc.find({ zone_id: zone_id });
    res.status(200).json(c);
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/create", uploadRegister.single("file"), async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone_number,
      industry_name,
      zone_id,
      industry_area,
      plot_number,
      no_of_employees,
      no_of_employees_HIM,
      lessee,
      item_manufactured,
      gstin_number,
      is_registered,
    } = req.body;

    const existingIndustry = await Industry.findOne({ email });
    if (existingIndustry) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newIndustry = new Industry({
      name,
      email,
      password: hashedPassword,
      phone_number,
      industry_name,
      zone_id,
      industry_area,
      plot_number,
      no_of_employees,
      no_of_employees_HIM,
      lessee,
      item_manufactured,
      gstin_number,
      is_registered,
    });
    const industryReg = new industryRegDoc({
      email,
      zone_id,
      userAuthFileName: req.file ? req.file.originalname : null,
      userAuthFile: req.file ? req.file.buffer : null,
      contentType: req.file ? req.file.mimetype : null,
    });

    await newIndustry.save();
    await industryReg.save();
    mailSender(email, name, industry_name);

    res.status(201).json({ message: "Sent for registration successfully" });
  } catch (error) {
    console.error("Error creating industry:", error);
    res.status(500).json({ message: "Server Error" });
  }
});
const SITE_SECRET = process.env.SITE_SECRET;
router.post("/login", async (req, res) => {
  try {
    const { email, password, rememberMe, captchaValue } = req.body;
    const { data } = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${SITE_SECRET}&response=${captchaValue}`
    );
    if (data.success) {
      const industry = await Industry.findOne({ email: email });

      if (!industry) {
        return res
          .status(404)
          .json({ message: "Industry not found", status: 404 });
      }

      const validPassword = await bcrypt.compare(password, industry.password);
      if (!validPassword) {
        return res
          .status(401)
          .json({ message: "Invalid Password", status: 401 });
      }

      if (!industry.is_registered) {
        return res.status(401).json({
          message: "Industry not approved by the zonal admin",
          status: 401,
        });
      }

      // generateOtp = Math.floor(100000 + Math.random() * 900000);

      try {
        // await phoneOtp(generateOtp, `+91${industry.phone_number}`);
        const token = jwt.sign(
          { industryId: industry._id },
          process.env.SECRET_KEY,
          { expiresIn: rememberMe ? "30d" : "60m" }
        );
        res.status(200).send({
          status: 200,
          industry: industry,
          token: token,
          userType: "Industry_User",
          otp: generateOtp,
        });
      } catch (error) {
        console.log("Error Logging in to send message: ", error);
        res.status(500).json({ message: "Internal server Error" });
      }
    } else {
      return res.status(500).json({ message: "Captcha verification failed" });
    }
  } catch (error) {
    console.log("Error Logging in: ", error);
    res.status(500).json({ message: "Internal server Error" });
  }
});

router.get("/getIndustryData", authMiddleware, async (req, res) => {
  try {
    const { industry_email } = req.query;
    const industry = await Industry.findOne({ email: industry_email });

    if (industry) {
      return res.status(200).json(industry);
    } else {
      return res.status(404).json({ message: "Industry not found" });
    }
  } catch (error) {
    console.error("Error fetching industry data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
router.get("/getIndustryById", authMiddleware, async (req, res) => {
  try {
    const { id } = req.query;
    const industry = await Industry.findOne({ _id: id });

    if (industry) {
      return res.status(200).json(industry);
    } else {
      return res.status(404).json({ message: "Industry not found" });
    }
  } catch (error) {
    console.error("Error fetching industry data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/updateIndustryData", authMiddleware, async (req, res) => {
  try {
    const {
      industry_email,
      industry_name,
      phone_number,
      industry_area,
      plot_number,
      lessee,
      item_manufactured,
    } = req.body;
    const updatedIndustry = await Industry.findOneAndUpdate(
      { email: industry_email },
      {
        $set: {
          industry_name,
          phone_number,
          industry_area,
          plot_number,
          lessee,
          item_manufactured,
        },
      },
      { new: true }
    );
    return res.status(200).json(updatedIndustry);
  } catch (error) {
    console.error("Error updating industry data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/registration", authMiddleware, async (req, res) => {
  try {
    const { industry_id } = req.body;

    const updatedIndustry = await Industry.findOneAndUpdate(
      { _id: industry_id },
      { $set: { is_registered: true } },
      { new: true }
    );

    await addAlert(industry_id, {
      title: newIndustryAlert?.title,
      content: newIndustryAlert.content,
      date: new Date().toISOString(),
      zone_id: updatedIndustry.zone_id,
      alert_type: "industry",
    });

    if (updatedIndustry) {
      approvalMail(
        updatedIndustry.email,
        updatedIndustry.name,
        updatedIndustry.industry_name
      );
      return res.status(200).json({
        success: true,
        message: "Industry registration successful",
        industry: updatedIndustry,
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Industry not found" });
    }
  } catch (error) {
    console.error("Error registering industry:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});
router.delete("/delete", authMiddleware, async (req, res) => {
  try {
    const { industry_id } = req.query; // Extract industry_id from query parameters

    const deletedIndustry = await Industry.findOneAndDelete({
      _id: industry_id,
    });
    // for deleting from the db modal
    const deleteFromDoc = await industryRegDoc.findOneAndDelete({
      email: deletedIndustry.email,
    });

    if (deletedIndustry && deleteFromDoc) {
      return res
        .status(200)
        .json({ success: true, message: "Industry deleted successfully" });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Industry not found" });
    }
  } catch (error) {
    console.error("Error deleting industry:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});
router.post("/get-water-bill", async (req, res) => {
  try {
    const data = new waterBill(req.body);
    await data.save();
    return res.status(201).send({
      message: "Payment successfully",
      success: true,
    });
  } catch (error) {
    return res.status(401).send({
      message: "Invalid credentials",
      success: false,
    });
  }
});
router.get("/get-water-bill-finance", async (req, res) => {
  try {
    const data = await WaterBillFinance.find({});
    return res.status(201).send({
      success: true,
      data: data,
    });
  } catch (error) {
    return res.status(401).send({
      message: "Error from server",
      success: false,
    });
  }
});

router.get("/get-admin-id", authMiddleware, async (req, res) => {
  // console.log(req.que)
  try {
    const data = await zoneModel.find({ zone_name: req.query.zone });
    if (data.length == 0) {
      return res.status(401).send({
        message: "Data snot found",
        success: false,
      });
    }
    const data1 = await adminModel.findOne({
      admin_id: data[0].zonal_admin_id,
    });
    return res.status(201).send({
      message: "Zonal Admin database id",
      success: true,
      id: data1._id,
      data: data1,
    });
  } catch (error) {
    return res.status(401).send({
      message: "Something went wrong",
      success: false,
    });
  }
});
router.post("/save-chat-user", authMiddleware, async (req, res) => {
  try {
    const data = req.body;
    // console.log(data);
    const userId = await chatModel.findOne({ userId: data.userId });

    if (!userId) {
      const newData = new chatModel(req.body);
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
      message: "Something went wrong",
      success: false,
    });
  }
});

router.post("/resolve-chat", authMiddleware, async (req, res) => {
  try {
    const data = req.body;
    // console.log(data);
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

router.post("/unread-chat", async (req, res) => {
  try {
    const { zoneadminId, userId } = req.body;
    const result = await chatModel.updateMany(
      // fiinding chat
      {
        zoneadminId: zoneadminId,
        userId: userId,
        "message.isRead": false,
      },
      // what to do -> update the isRead field
      {
        $set: { "message.$[elem].isRead": true },
      },
      // working mechanism -> changing the field value
      {
        arrayFilters: [{ "elem.isRead": false }],
        multi: true,
      }
    );
    return res.status(201).send({
      message: "Updated successfully",
      success: true,
    });
  } catch (error) {
    return res.status(401).send({
      message: "Something went wrong",
      success: false,
    });
  }
});
router.post("/user-statisfied", async (req, res) => {
  try {
    const data = req.body;
    const userId = await chatModel.findOneAndUpdate(
      { userId: data.userId },
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
router.get("/getAllUserChat", authMiddleware, async (req, res) => {
  const id = req.query.id;

  const data = await chatModel.findOne({ userId: id });
  return res.status(201).send({
    success: true,
    data: data,
  });
});
router.get("/getAllZoneChat", async (req, res) => {
  const id = req.query.id;
  // console.log(id);

  const data = await chatModel.find({ zoneadminId: id });
  return res.status(201).send({
    success: true,
    data: data,
  });
});
router.get("/getMasterAdminDetails", async (req, res) => {
  const arr = await adminModel.find({});
  let data = [];
  for (let obj of arr) {
    if (obj.admin_type == "master_admin") {
      data.push(obj);
    }
  }
  return res.status(201).json(data);
});
router.get("/getZoneName", async (req, res) => {
  const { zone_id } = req.query;
  const zone = await zoneModel.findOne({ zone_id: zone_id });
  return res.status(201).json(zone);
});

router.get("/getUserDetails", async (req, res) => {
  try {
    const data = await Industry.findById(req.query.userId);
    return res.status(201).send({
      message: "Send",
      success: true,
      data: data,
    });
  } catch (error) {
    return res.status(501).send({
      message: "wrong",
      success: false,
    });
  }
});

router.get("/all-chat", async (req, res) => {
  try {
    const data = await chatModel.find({});
    return res.status(201).send({
      message: "Data send successfully",
      success: true,
      data: data,
    });
  } catch (error) {
    return res.status(501).send({
      message: "wrong",
      success: false,
    });
  }
});

router.get("/getdocByIndustry", authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const { industryId } = jwt.verify(token, process.env.SECRET_KEY);
    const data = await Document.find({ industry: industryId }).populate(
      "industry"
    );
    const rawData = data.map((doc) => {
      const docObj = doc.toObject();
      delete docObj.industry;
      return docObj;
    });
    return res.status(201).send({
      message: "Send",
      success: true,
      data: rawData,
    });
  } catch (error) {
    return res.status(501).send({
      message: "wrong",
      success: false,
    });
  }
});

module.exports = router;
