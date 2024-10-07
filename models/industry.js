const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const validateEmail = function (email) {
  const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailReg.test(email);
};
const industrySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    validate: [validateEmail, "Invalid email address"],
  },
  password: {
    type: String,
    required: true,
  },
  phone_number: {
    type: String,
    required: true,
  },
  industry_name: {
    type: String,
    required: true,
  },
  zone_id: {
    type: String,
  },
  industry_area: {
    type: String,
    required: true,
  },
  plot_number: {
    type: String,
    required: true,
    unique: true,
  },
  no_of_employees: {
    type: String,
    required: true,
  },
  no_of_employees_HIM: {
    //no of himachali employees
    type: String,
    required: true,
  },
  lessee: {
    type: String,
    required: true,
  },
  item_manufactured: {
    type: String,
    required: true,
  },
  gstin_number: {
    type: String,
    required: true,
  },
  is_registered: {
    type: Boolean,
    required: true,
    default: false,
  },
  contentType: {
    type: String,
  },

  userAuthFile: Buffer,
  currentToken:{
    type:String
  }
});

module.exports = mongoose.model("Industries", industrySchema);
