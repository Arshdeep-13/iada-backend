const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const waterBillSchema = new Schema({
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

  isDue: {
    type: Boolean,
    default: true,
  },
  currentTotal: {
    type: String,
    required: true,
  },
  amountPayAfterDueDate: {
    type: String,
  },
});

const WaterBillZone123 = mongoose.model("WaterBillZone123", waterBillSchema);
const WaterBillZone456 = mongoose.model("WaterBillZone456", waterBillSchema);
const WaterBillZone789 = mongoose.model("WaterBillZone789", waterBillSchema);
const WaterBillZone111 = mongoose.model("WaterBillZone111", waterBillSchema);
const WaterBillZone222 = mongoose.model("WaterBillZone222", waterBillSchema);
const WaterBillZone333 = mongoose.model("WaterBillZone333", waterBillSchema);

const getModelByZoneId = (zoneId) => {
  switch (zoneId) {
    case "123":
      return WaterBillZone123;
    case "456":
      return WaterBillZone456;
    case "789":
      return WaterBillZone789;
    case "111":
      return WaterBillZone111;
    case "222":
      return WaterBillZone222;
    case "333":
      return WaterBillZone333;
    default:
      throw new Error("Invalid zoneId");
  }
};

module.exports = {
  WaterBillZone123,
  WaterBillZone456,
  WaterBillZone789,
  WaterBillZone111,
  WaterBillZone222,
  WaterBillZone333,
  getModelByZoneId,
};
