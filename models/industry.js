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
    unique: true,
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
    //no of himachali emps
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
    unique: true,
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
});

// industrySchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// industrySchema.pre("save", async function (next) {
//   if (!this.isModified("password")) {
//     next();
//   }
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
// });

module.exports = mongoose.model("Industries", industrySchema);
