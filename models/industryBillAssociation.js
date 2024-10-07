const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const industryBillAssociationSchema = new Schema({
  plot_number: {
    type: String,
    required: true,
    unique: true,
  },
  consumerNo: {
    type: Number,
    required: true,
  },
  meterNo: {
    type: String,
    required: true,
    default: "N/A",
  },
});

module.exports = mongoose.model("IndustryBillAssociation", industryBillAssociationSchema)