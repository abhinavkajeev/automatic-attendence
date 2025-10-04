const axios = require('axios');
const FormData = require('form-data');
const { Readable } = require('stream');

const CV_ENGINE_URL = process.env.CV_ENGINE_URL || 'http://localhost:5001';

// Convert buffer to readable stream
const bufferToStream = (buffer) => {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
};

const cvEngineService = {
  async enrollStudent(photo, studentId) {
    try {
      const formData = new FormData();
      
      // Convert buffer to stream
      const photoStream = bufferToStream(photo.buffer);
      formData.append('photo', photoStream, {
        filename: photo.originalname,
        contentType: photo.mimetype
      });
      formData.append('student_id', studentId);

      const response = await axios.post(`${CV_ENGINE_URL}/enroll`, formData, {
        headers: {
          ...formData.getHeaders()
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`CV Engine Error: ${error.response?.data?.message || error.message}`);
    }
  },

  async verifyFace(photo) {
    try {
      const formData = new FormData();
      
      // Convert buffer to stream
      const photoStream = bufferToStream(photo.buffer);
      formData.append('photo', photoStream, {
        filename: photo.originalname,
        contentType: photo.mimetype
      });

      const response = await axios.post(`${CV_ENGINE_URL}/verify`, formData, {
        headers: {
          ...formData.getHeaders()
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`CV Engine Error: ${error.response?.data?.message || error.message}`);
    }
  }
};

module.exports = cvEngineService;