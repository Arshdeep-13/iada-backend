const jwt = require("jsonwebtoken");
module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decodetoken = jwt.verify(token, process.env.SECRET_KEY);
    let userId;
    if (decodetoken.industryId) {
      userId = decodetoken.industryId; //for industry verification
      req.body.industryId = userId;
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
