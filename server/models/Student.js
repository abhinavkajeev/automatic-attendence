const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  // We will store the facial embeddings as an array of numbers
  faceEmbeddings: {
    type: [Number],
    required: true,
  },
});

module.exports = mongoose.model('Student', StudentSchema);