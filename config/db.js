const mongoose = require("mongoose");
require("dotenv").config();

const dbConnect = async () => {
  try {
    await mongoose.connect(process.env.DB_STRING);
    console.log("Connected to db");
  } catch (e) {
    console.log("error connecting to database: ", e);
  }
};

module.exports = dbConnect;
