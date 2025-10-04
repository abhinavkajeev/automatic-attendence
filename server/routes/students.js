const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// Get all students with optional filters
router.get('/', async (req, res) => {
  try {
    const { department, year, search } = req.query;
    let query = {};

    if (department) query.department = department;
    if (year) query.year = year;
    if (search) {
      query.$or = [
        { fullName: new RegExp(search, 'i') },
        { studentId: new RegExp(search, 'i') }
      ];
    }

    const students = await Student.find(query);
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new student
router.post('/', async (req, res) => {
  try {
    // Check if student ID already exists
    const existingStudentId = await Student.findOne({ studentId: req.body.studentId });
    if (existingStudentId) {
      return res.status(400).json({
        success: false,
        error: 'A student with this Student ID already exists'
      });
    }

    // Check if email already exists
    const existingEmail = await Student.findOne({ email: req.body.email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: 'A student with this email already exists'
      });
    }

    const student = new Student(req.body);
    await student.save();
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get student by ID
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update student
router.put('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
