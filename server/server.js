const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fileUpload = require('express-fileupload');
const courses = require('./routes/courseRoutes');
const students = require('./routes/studentRoutes');
const photos = require('./routes/photos');
const attendance = require('./routes/attendanceRoutes');

const app = express();
const PORT = process.env.PORT || 3070;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/attendance_system', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  createParentPath: true
}));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/courses', courses);
app.use('/api/students', students);
app.use('/api/photos', photos);
app.use('/api/attendance', attendance);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Something broke!' });
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Available routes:`);
  console.log(`- GET/POST/PUT/DELETE http://localhost:${PORT}/api/students`);
  console.log(`- GET/POST/PUT/DELETE http://localhost:${PORT}/api/courses`);
  console.log(`- GET/POST http://localhost:${PORT}/api/attendance`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});