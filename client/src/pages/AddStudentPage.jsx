import React, { useState } from 'react';
import { addStudent } from '../services/api';

function AddStudentPage() {
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await addStudent({ studentId, name });
      setMessage(`Student ${response.data.name} added successfully!`);
      setStudentId('');
      setName('');
    } catch (error) {
      setMessage('Failed to add student.');
      console.error(error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Add New Student</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>Student ID:</label>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="border p-2 rounded w-full"
            required
          />
        </div>
        <div>
          <label>Full Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 rounded w-full"
            required
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Add Student
        </button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}

export default AddStudentPage;