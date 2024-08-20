const mongoose = require("mongoose");

const plotPremiumBillSchema = new mongoose.Schema({
  industry_id: {
    type: String,
    required: true,
    unique:true,
  },
  plot_no: {
    type: String,
    required: true,
  },
  sub_total: {
    type: Number,
    required: true,
  },
  tax_id: {
    type: String,
    required: true,
  },
  total_bill_amount: {
    type: Number,
    required: true,
  },
  bill_due_date: {
    type: Date,
    required: true,
  },
  bill_payment_date: {
    type: Date,
  },
  bill_status: {
    type: String,
    enum: ["Pending", "Paid"],
    default: "Pending",
  },
  bill_issued_date: {
    type: Date,
  },
  plot_size: {
    type: Number,
    required: true,
  },
});

const PlotPremiumBill = mongoose.model(
  "PlotPremiumBill",
  plotPremiumBillSchema
);

module.exports = PlotPremiumBill;
