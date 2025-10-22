const axios = require('axios');

async function testStudentDelete() {
  const API_URL = 'http://localhost:3070/api/students';
  
  try {
    console.log('1. Testing API connection...');
    const healthResponse = await axios.get(API_URL);
    console.log('API connection successful');
    
    console.log('2. Creating test student...');
    const createResponse = await axios.post(API_URL, {
      studentId: 'TEST123',
      name: 'Test Student',
      email: 'test@example.com',
      department: 'CS',
      year: 2023,
      section: 'A'
    });
    console.log('Student created:', createResponse.data);
    
    console.log('\n3. Attempting to delete student...');
    const deleteResponse = await axios.delete(`${API_URL}/TEST123`);
    console.log('Student deleted successfully:', deleteResponse.data);
    
  } catch (error) {
    console.error('\n❌ Error occurred:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    
    if (error.response) {
      console.error('HTTP Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request was made but no response received');
      console.error('Request:', error.request);
    }
    
    console.error('\nStack trace:', error.stack);
  }
}

testStudentDelete();