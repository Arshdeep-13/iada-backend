const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const adminSchema = new Schema({
  admin_id: {
    type: String,
    required:true,
    unique:true,
  },
  admin_type: {
    type: String,
    enum: ["master_admin", "zonal_admin"],
    required: true,
  },
  admin_name: {
    type: String,
    required: true,
  },
  admin_email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  is_approved: {
    type: Boolean,
    default: false,
  },
  phone_number: {
    type: String,
    required: true,
  },
  zone_id: {
    type: String,
  },
  currentToken:{
    type:String
  }
});

module.exports = mongoose.model("Admin", adminSchema);
