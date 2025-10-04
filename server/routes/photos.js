const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads/students');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Save with studentId as filename
    const studentId = req.body.studentId;
    const ext = path.extname(file.originalname);
    cb(null, `${studentId}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Upload student photo
router.post('/upload/:studentId', async (req, res) => {
  try {
    if (!req.files || !req.files.photo) {
      return res.status(400).json({
        success: false,
        message: 'No photo uploaded'
      });
    }

    const photo = req.files.photo;
    const studentId = req.params.studentId;
    const uploadDir = path.join(__dirname, '../uploads/students');

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Get file extension and generate filename
    const ext = path.extname(photo.name);
    const filename = `${studentId}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Move the file
    await photo.mv(filepath);

    // Update student record
    const student = await Student.findOneAndUpdate(
      { studentId: studentId },
      { 
        hasEnrolledFace: true,
        lastFaceUpdate: new Date(),
        photoUrl: `/uploads/students/${filename}`
      },
      { new: true }
    );

    if (!student) {
      // Remove uploaded file if student not found
      fs.unlinkSync(filepath);
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
        photoUrl: `/uploads/students/${filename}`
      }
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
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
  const photoPath = path.join(__dirname, `../uploads/students/${studentId}.jpg`);
  
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