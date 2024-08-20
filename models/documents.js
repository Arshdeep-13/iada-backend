const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  industry: {
    type:mongoose.Schema.Types.ObjectId,
    ref:"Industries",
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

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
