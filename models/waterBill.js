const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const waterBillSchemaFinance = new Schema({
  gst: { type: Number, required: true, default: 0 },
  permaConnectionRatePerKL: { type: Number, required: true, default: 0 },
  tempConnectionRatePerKL: { type: Number, required: true, default: 0 },
  newConnectionFee: { type: Number, required: true, default: 0 },
  lateBillAfter: { type: Number, required: true, default: 0 },
  latePaymentFine: { type: Number, required: true, default: 0 },
  billRaisingDate: { type: Number, required: true, default: 1 },
  duration: { type: Number, required: true, default: 0 },
  sewerageFee: { type: Number, required: true, default: 0 },
  minimumPayment: { type: Number, required: true, default: 0 },
});

const WaterBillFinance = mongoose.model(
  "WaterBillFinance",
  waterBillSchemaFinance
);

module.exports = WaterBillFinance;
