const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { detectFaces, compareFaces } = require('../services/faceRecognition');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads/temp');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Mark attendance using face recognition
router.post('/mark/face-recognition', upload.single('image'), async (req, res) => {
  try {
    const { courseId } = req.body;
    const imagePath = req.file.path;

    // Detect faces in the uploaded image
    const detectedFaces = await detectFaces(imagePath);
    
    if (!detectedFaces || detectedFaces.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No faces detected in the image'
      });
    }

    // Get all students for this course
    const course = await Course.findById(courseId).populate('students');
    const recognizedStudents = [];

    // Compare each detected face with student photos
    for (const face of detectedFaces) {
      for (const student of course.students) {
        const studentPhotoPath = path.join(__dirname, `../uploads/students/${student.studentId}.jpg`);
        if (fs.existsSync(studentPhotoPath)) {
          const isMatch = await compareFaces(face, studentPhotoPath);
          if (isMatch) {
            recognizedStudents.push(student._id);
            break;
          }
        }
      }
    }

    // Mark attendance for recognized students
    const attendance = await Attendance.create({
      course: courseId,
      students: recognizedStudents,
      date: new Date(),
      method: 'face-recognition'
    });

    // Clean up temporary file
    fs.unlinkSync(imagePath);

    res.json({
      success: true,
      message: `Marked attendance for ${recognizedStudents.length} students`,
      data: attendance
    });

  } catch (error) {
    console.error('Error in face recognition attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing attendance',
      error: error.message
    });
  }
});

// Get course attendance
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { course: courseId };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('students', 'studentId name')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: attendance
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message
    });
  }
});

// Get student attendance
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId, startDate, endDate } = req.query;

    const query = { 'students': studentId };
    if (courseId) query.course = courseId;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('course', 'name')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: attendance
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message
    });
  }
});

module.exports = router;