import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { coursesAPI } from '../services/api';

const AddCoursePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    courseName: '',
    courseCode: '',
    department: '',
    faculty: '',
    year: '',
    section: '',
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
    if (formData.schedule.length > 1) {
      setFormData(prev => ({
        ...prev,
        schedule: prev.schedule.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting form data:', formData);
      const response = await coursesAPI.create(formData);
      console.log('Server response:', response);
      navigate('/courses');
    } catch (error) {
      console.error('Error creating course:', error.response?.data || error);
      alert('Failed to create course. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Course</h1>
          <p className="text-gray-500 mt-1">Create a new course and set its schedule</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Name
              </label>
              <input
                type="text"
                name="courseName"
                value={formData.courseName}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Code
              </label>
              <input
                type="text"
                name="courseCode"
                value={formData.courseCode}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Faculty
              </label>
              <input
                type="text"
                name="faculty"
                value={formData.faculty}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="number"
                name="year"
                min="1"
                max="4"
                value={formData.year}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section
              </label>
              <input
                type="text"
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">
                Schedule
              </label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addScheduleSlot}
              >
                Add Time Slot
              </Button>
            </div>

            {formData.schedule.map((slot, index) => (
              <div key={index} className="flex items-center gap-4">
                <select
                  value={slot.day}
                  onChange={(e) => handleScheduleChange(index, 'day', e.target.value)}
                  className="p-2 border rounded-md"
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>

                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                  className="p-2 border rounded-md"
                />

                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                  className="p-2 border rounded-md"
                />

                {formData.schedule.length > 1 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeScheduleSlot(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/courses')}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Course
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddCoursePage;