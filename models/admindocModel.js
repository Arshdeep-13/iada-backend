const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  zonaladmin: {
    type:String,
    required:true
  },
  zonename:{
    type:String,
    required:true
  },
  docname:{
    type:String,
    required:true
  },
  documentUrl:Buffer,
  documentType: {
    type: String,
  },
  size: {
    type: Number,
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

const Document = mongoose.model("madmindoc", documentSchema);

module.exports = Document;
