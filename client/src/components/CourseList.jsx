import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coursesAPI } from '../services/api';

const CourseList = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await coursesAPI.list();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const startLiveAttendance = async (courseId) => {
    try {
      await coursesAPI.startLiveAttendance(courseId);
      navigate(`/courses/${courseId}/live-feed`);
    } catch (error) {
      console.error('Error starting live attendance:', error);
      alert('Failed to start live attendance. Please try again.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Courses</h1>
        <button
          onClick={() => navigate('/courses/add')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Course
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-gray-500 mb-4">No courses found. Add your first course to get started.</div>
          <button
            onClick={() => navigate('/courses/add')}
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
          >
            Add Your First Course
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map(course => (
            <div key={course._id} className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">{course.courseName}</h3>
              <p className="text-gray-600 mb-1">Code: {course.courseCode}</p>
              <p className="text-gray-600 mb-1">Department: {course.department}</p>
              <p className="text-gray-600 mb-4">Instructor: {course.instructor}</p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/courses/${course._id}`)}
                  className="px-3 py-1.5 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                >
                  View Details
                </button>
                <button
                  onClick={() => startLiveAttendance(course._id)}
                  className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Start Live Feed
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseList;