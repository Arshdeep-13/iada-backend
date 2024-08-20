const mongoose = require("mongoose");
require("dotenv").config();

const dbConnect = async () => {
  try {
    await mongoose.connect(process.env.DB_STRING);
    // await mongoose.connect("mongodb+srv://devain25:123456788@data-cluster.7q1yssi.mongodb.net/?retryWrites=true&w=majority&appName=DATA-Cluster");
    console.log("Connected to db");
  } catch (e) {
    console.log("error connecting to database: ", e);
  }
};

module.exports = dbConnect;
