const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const secretKey = process.env.SECRET_KEY;

if (!secretKey) {
  throw new Error("SECRET_KEY environment variable is not set");
}

// Endpoint to verify token
router.post("/verifyToken", (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ valid: false, message: "Token is required" });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ valid: false, message: "Invalid token" });
    }
    return res.status(200).json({ valid: true, decoded });
  });
});

module.exports = router;
