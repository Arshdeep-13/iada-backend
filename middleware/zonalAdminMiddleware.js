const jwt = require("jsonwebtoken");
module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decodetoken = jwt.verify(token, process.env.SECRET_KEY);
    let adminId;
    if (decodetoken.adminId) {
      adminId = decodetoken.adminId; //for zonalAmdin verification
      req.body.adminId = adminId;
    }

    next();
  } catch (error) {
    console.log(error);
    return res.status(409).send({
      message: "You are not authorized",
      success: false,
    });
  }
};
