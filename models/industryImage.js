const mongoose = require("mongoose");

const industryImageSchema = new mongoose.Schema(
  {
    industry_id: { type: String, required: true },
    zone_id: { type: String, required: true },
    description: { type: String, required: true },
    images: [
      {
        data: Buffer,
        contentType: String,
        isAccepted: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const IndustryImage = mongoose.model("IndustryImage", industryImageSchema);

module.exports = IndustryImage;
