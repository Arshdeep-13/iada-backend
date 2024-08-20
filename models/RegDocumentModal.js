const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const industryRegDocument = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  zone_id: {
    type: String,
  },
  userAuthFileName: {
    type: String,
  },
  contentType: {
    type: String,
  },

  userAuthFile: Buffer,
});

module.exports = mongoose.model("IndustryRegDoc", industryRegDocument);
