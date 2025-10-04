const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Course = require('../models/Course');

// Get attendance records with filters
exports.getAttendance = async (req, res) => {
  try {
    const { course, student, startDate, endDate } = req.query;
    let query = {};

    if (course) query.course = course;
    if (student) query.student = student;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'name rollNumber')
      .populate('course', 'courseName courseCode')
      .sort('-date');

    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark attendance
exports.markAttendance = async (req, res) => {
  try {
    const { studentId, courseId, date, status = 'present', verificationMethod = 'face-recognition' } = req.body;

    // Validate student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Create or update attendance
    const attendance = await Attendance.findOneAndUpdate(
      {
        student: studentId,
        course: courseId,
        date: date || Date.now()
      },
      {
        status,
        verificationMethod,
        $setOnInsert: { date: date || Date.now() }
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.json({ success: true, data: attendance });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Attendance already marked for this student in this course today' 
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get attendance statistics
exports.getAttendanceStats = async (req, res) => {
  try {
    const { courseId, startDate, endDate } = req.query;
    
    const matchQuery = {
      course: mongoose.Types.ObjectId(courseId)
    };

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    const stats = await Attendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$student',
          totalClasses: { $sum: 1 },
          presentCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
            }
          }
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
          student: { name: 1, rollNumber: 1 },
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

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete attendance record
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }
    res.json({ success: true, message: 'Attendance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get attendance by course
exports.getByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { date } = req.query;

    const query = {
      course: courseId,
      date: date ? new Date(date) : { 
        $gte: new Date().setHours(0,0,0,0),
        $lt: new Date().setHours(23,59,59,999)
      }
    };

    const attendance = await Attendance.find(query)
      .populate('student', 'name studentId hasEnrolledFace')
      .sort('-createdAt');

    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Stream live attendance using Server-Sent Events
exports.streamAttendance = async (req, res) => {
  const { courseId } = req.params;

  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Send initial data
  const initialData = await Attendance.find({
    course: courseId,
    date: {
      $gte: new Date().setHours(0,0,0,0),
      $lt: new Date().setHours(23,59,59,999)
    }
  }).populate('student', 'name studentId');

  res.write(`data: ${JSON.stringify(initialData)}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    res.end();
  });
};

// Mark attendance using face recognition
exports.markByFaceRecognition = async (req, res) => {
  try {
    const { courseId, studentIds } = req.body;

    if (!courseId || !studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data'
      });
    }

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Mark attendance for each student
    const results = await Promise.all(studentIds.map(async (studentId) => {
      try {
        const attendance = await Attendance.findOneAndUpdate(
          {
            student: studentId,
            course: courseId,
            date: {
              $gte: new Date().setHours(0,0,0,0),
              $lt: new Date().setHours(23,59,59,999)
            }
          },
          {
            status: 'present',
            verificationMethod: 'face-recognition',
            $setOnInsert: { date: new Date() }
          },
          {
            new: true,
            upsert: true,
            runValidators: true
          }
        ).populate('student', 'name studentId');

        return {
          success: true,
          data: attendance
        };
      } catch (error) {
        return {
          success: false,
          studentId,
          error: error.message
        };
      }
    }));

    res.json({
      success: true,
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};