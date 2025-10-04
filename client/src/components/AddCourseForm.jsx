import React, { useState } from 'react';
import { coursesAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AddCourseForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    courseCode: '',
    courseName: '',
    department: '',
    semester: 1,
    instructor: '',
    schedule: [{
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:00'
    }]
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScheduleChange = (index, field, value) => {
    setFormData(prev => {
      const newSchedule = [...prev.schedule];
      newSchedule[index] = {
        ...newSchedule[index],
        [field]: value
      };
      return {
        ...prev,
        schedule: newSchedule
      };
    });
  };

  const addScheduleSlot = () => {
    setFormData(prev => ({
      ...prev,
      schedule: [...prev.schedule, {
        day: 'Monday',
        startTime: '09:00',
        endTime: '10:00'
      }]
    }));
  };

  const removeScheduleSlot = (index) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await coursesAPI.create(formData);
      navigate('/courses');
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Failed to create course. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Add New Course</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Course Code</label>
          <input
            type="text"
            name="courseCode"
            value={formData.courseCode}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Course Name</label>
          <input
            type="text"
            name="courseName"
            value={formData.courseName}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Department</label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Semester</label>
          <input
            type="number"
            name="semester"
            value={formData.semester}
            onChange={handleChange}
            min="1"
            max="8"
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Instructor</label>
          <input
            type="text"
            name="instructor"
            value={formData.instructor}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Schedule</label>
          {formData.schedule.map((slot, index) => (
            <div key={index} className="flex gap-4 items-center mb-4">
              <select
                value={slot.day}
                onChange={(e) => handleScheduleChange(index, 'day', e.target.value)}
                className="p-2 border rounded"
              >
                {days.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
              
              <input
                type="time"
                value={slot.startTime}
                onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                className="p-2 border rounded"
              />
              
              <input
                type="time"
                value={slot.endTime}
                onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                className="p-2 border rounded"
              />
              
              {formData.schedule.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeScheduleSlot(index)}
                  className="p-2 text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            onClick={addScheduleSlot}
            className="text-blue-600 hover:text-blue-800"
          >
            + Add Schedule Slot
          </button>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/courses')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Course
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCourseForm;