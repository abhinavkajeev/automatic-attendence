const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Course = require('../models/Course');

// Optional face recognition import (only if available)
let faceRecognition;
try {
  faceRecognition = require('../services/faceRecognition');
} catch (error) {
  console.log('Face recognition service not available:', error.message);
}

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
    if (!faceRecognition) {
      return res.status(501).json({
        success: false,
        message: 'Face recognition service not available'
      });
    }

    const { courseId } = req.body;
    const imagePath = req.file.path;

    // Detect faces in the uploaded image
    const detectedFaces = await faceRecognition.detectFaces(imagePath);
    
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
          const isMatch = await faceRecognition.compareFaces(face, studentPhotoPath);
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

// Get attendance statistics
router.get('/stats', async (req, res) => {
  try {
    const { courseId, startDate, endDate } = req.query;
    
    let matchQuery = {};
    if (courseId) matchQuery.course = mongoose.Types.ObjectId(courseId);
    
    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    const stats = await Attendance.aggregate([
      { $match: matchQuery },
      { $unwind: '$students' },
      {
        $group: {
          _id: '$students',
          totalClasses: { $sum: 1 },
          presentCount: { $sum: 1 } // Assuming all records in attendance are present
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $project: {
          studentId: '$student.studentId',
          studentName: '$student.name',
          totalClasses: 1,
          presentCount: 1,
          attendancePercentage: {
            $multiply: [
              { $divide: ['$presentCount', '$totalClasses'] },
              100
            ]
          }
        }
      }
    ]);

    res.json({ 
      success: true, 
      data: stats,
      message: 'Attendance statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching attendance statistics',
      error: error.message 
    });
  }
});

// Get live attendance feed (placeholder for now)
router.get('/live', async (req, res) => {
  try {
    // This endpoint can be used for live attendance monitoring
    // For now, return recent attendance records
    const recentAttendance = await Attendance.find()
      .populate('course', 'name')
      .populate('students', 'studentId name')
      .sort({ date: -1 })
      .limit(10);

    res.json({ 
      success: true, 
      data: recentAttendance,
      message: 'Live attendance feed retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching live attendance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching live attendance',
      error: error.message 
    });
  }
});

module.exports = router;