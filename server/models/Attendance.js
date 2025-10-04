const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    ref: 'Student'
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    default: 'present'
  },
  timeIn: {
    type: Date,
    default: Date.now
  },
  method: {
    type: String,
    enum: ['face_recognition', 'manual'],
    default: 'face_recognition'
  },
  confidence: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

attendanceSchema.index({ studentId: 1, courseId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);