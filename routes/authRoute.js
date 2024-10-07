const express = require("express");
const jwt = require("jsonwebtoken");
const industry = require("../models/industry");
const admins = require("../models/admins");
const router = express.Router();
const secretKey = process.env.SECRET_KEY;

if (!secretKey) {
  throw new Error("SECRET_KEY environment variable is not set");
}

// Endpoint to verify token
router.post("/verifyToken", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ valid: false, message: "Token is required" });
  }
  try {
    const decoded = jwt.verify(token, secretKey);
    let user = await industry.findById(decoded.industryId);
    let admin = null;
    if (!user) {
      admin = await admins.findById(decoded.adminId);
    }

    if (user) {
      if (user.currentToken !== token) {
        return res.status(401).json({
          message: "User token is invalid or user is logged in elsewhere",
        });
      }
      return res.status(201).json({ valid: true, message: "User Found" });
    } else if (admin) {
      if (admin.currentToken !== token) {
        return res.status(401).json({
          message: "Admin token is invalid or admin is logged in elsewhere",
        });
      }
      return res.status(201).json({ valid: true, message: "Admin Found" });
    } else {
      return res.status(401).json({ message: "User/Admin not found" });
    }
  } catch (error) {
    return res.status(401).json({ message: "Token is not valid" });
  }
});

module.exports = router;
