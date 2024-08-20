const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const finalWaterBill = new Schema({
  no: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
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
  consumerName: {
    type: String,
    required: true,
  },
  premises: {
    type: String,
    required: true,
  },
  startRangeMeterReading: {
    type: String,
    required: true,
  },
  endRangeMeterReading: {
    type: String,
    required: true,
  },
  readingsFrom: {
    type: Date,
    required: true,
  },
  readingsTo: {
    type: Date,
    required: true,
  },
  rsPerKl: {
    type: Number,
    required: true,
  },
  sewerageCharges: {
    type: String,
    default: "0",
  },
  arrears: {
    type: String,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  amountPayOnDueDate: {
    type: String,
    required: true,
  },
  latePaymentSurcharge: {
    type: String,
    required: true,
  },
  amountPayAfterDueDate: {
    type: String,
    required: true,
  },
  currentTotal: {
    type: String,
    required: true,
  },
  isDue: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("finalWaterBill", finalWaterBill);
