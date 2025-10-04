import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
});

// This is a placeholder for adding a student.
// In a real app, you'd upload an image, the backend would generate the embedding.
// For now, we'll send a dummy embedding.
export const addStudent = (studentData) => {
    // Generate a random 128-dimension array for the dummy embedding
    const dummyEmbedding = Array.from({length: 128}, () => Math.random() * 2 - 1);
    const payload = { ...studentData, faceEmbeddings: dummyEmbedding };
    return api.post('/students', payload);
};

// Add other API functions here
// export const getAttendance = () => api.get('/attendance');