const Student = require('../models/Student');
const cvEngineService = require('../services/cvEngineService');

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const { department, year, section, search } = req.query;
    let query = {};

    if (department) query.department = department;
    if (year) query.year = parseInt(year);
    if (section) query.section = section;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get student by ID
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new student
exports.createStudent = async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID or Email already exists' 
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { studentId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({ studentId: req.params.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Enroll student with face photo
exports.enrollStudent = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No photo uploaded'
      });
    }

    if (!req.body.studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    // First check if student exists
    const student = await Student.findOne({ studentId: req.body.studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Process photo with CV engine
    const enrollmentResult = await cvEngineService.enrollStudent(req.file, req.body.studentId);

    if (!enrollmentResult.success) {
      return res.status(400).json({
        success: false,
        message: enrollmentResult.message
      });
    }

    // Update student record with photo status
    student.hasEnrolledFace = true;
    await student.save();

    res.json({
      success: true,
      message: 'Student enrolled successfully',
      data: {
        student,
        enrollment: enrollmentResult
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Update student's face photo
exports.updateStudentPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No photo uploaded'
      });
    }

    const student = await Student.findOne({ studentId: req.params.id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Process new photo with CV engine
    const enrollmentResult = await cvEngineService.enrollStudent(req.file, req.params.id);

    if (!enrollmentResult.success) {
      return res.status(400).json({
        success: false,
        message: enrollmentResult.message
      });
    }

    // Update student record
    student.hasEnrolledFace = true;
    await student.save();

    res.json({
      success: true,
      message: 'Student photo updated successfully',
      data: {
        student,
        enrollment: enrollmentResult
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Verify a face against enrolled students
exports.verifyFace = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No photo uploaded'
      });
    }

    const verificationResult = await cvEngineService.verifyFace(req.file);
    res.json(verificationResult);

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};