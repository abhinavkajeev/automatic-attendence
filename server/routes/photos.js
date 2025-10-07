const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Student = require('../models/Student');

// Create directories if they don't exist
const setupDirectories = () => {
  const dirs = [
    path.join(__dirname, '../../cv-engine/uploads/students')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Setup directories on module load
setupDirectories();

// Upload student photo
router.post('/upload/:studentId', async (req, res) => {
  try {
    console.log('Photo upload request received for student:', req.params.studentId);
    console.log('Files received:', req.files);
    
    if (!req.files || !req.files.photo) {
      console.log('No photo file found in request');
      return res.status(400).json({
        success: false,
        message: 'No photo uploaded'
      });
    }

    const photo = req.files.photo;
    const studentId = req.params.studentId;
    const uploadDir = path.join(__dirname, '../../cv-engine/uploads/students');

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Get file extension and generate filename - always use .jpg
    const filename = `${studentId}.jpg`;
    const filepath = path.join(uploadDir, filename);

    // Move the file to cv-engine uploads
    await photo.mv(filepath);
    
    console.log(`Photo saved to: ${filepath}`);

    // Note: CV Engine enrollment will be handled separately
    // The photo is saved to cv-engine directory for CV engine to process

    // Update student record
    const student = await Student.findOneAndUpdate(
      { studentId: studentId },
      { 
        hasEnrolledFace: true,
        lastFaceUpdate: new Date(),
        photoUrl: `/cv-engine/uploads/students/${filename}`
      },
      { new: true }
    );

    if (!student) {
      // Remove uploaded file if student not found
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      message: 'Photo uploaded successfully',
      data: {
        filename,
        photoUrl: `/cv-engine/uploads/students/${filename}`
      }
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    
    // Clean up any partially uploaded files
    if (typeof filepath !== 'undefined' && fs.existsSync(filepath)) {
      try {
        fs.unlinkSync(filepath);
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded file:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Error uploading photo',
      error: error.message
    });
  }
});

// Get student photo
router.get('/:studentId/photo', (req, res) => {
  const { studentId } = req.params;
  const photoPath = path.join(__dirname, `../../cv-engine/uploads/students/${studentId}.jpg`);
  
  if (fs.existsSync(photoPath)) {
    res.sendFile(photoPath);
  } else {
    res.status(404).json({
      success: false,
      message: 'Photo not found'
    });
  }
});

module.exports = router;