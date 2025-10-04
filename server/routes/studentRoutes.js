const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// @route   POST /api/students
// @desc    Add a new student
router.post('/students', async (req, res) => {
  // In a real app, you would get image, generate embedding, then save
  const { studentId, name, faceEmbeddings } = req.body;
  try {
    let student = new Student({ studentId, name, faceEmbeddings });
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/attendance
// @desc    Mark attendance for recognized students
router.post('/attendance', (req, res) => {
    const { recognizedStudentIds } = req.body;
    console.log(`Attendance marked for: ${recognizedStudentIds.join(', ')} at ${new Date().toLocaleTimeString()}`);
    // Here you would add logic to save attendance records to the DB
    res.status(200).json({ message: 'Attendance marked successfully' });
});

// @route GET /api/students/embeddings
// @desc Get all students with their embeddings
router.get('/students/embeddings', async (req, res) => {
    try {
        const students = await Student.find().select('studentId faceEmbeddings');
        res.json(students);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});


module.exports = router;