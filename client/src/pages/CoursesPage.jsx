import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { coursesAPI } from '../services/api';

const CoursesPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await coursesAPI.getAll();
      setCourses(response.data.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCourseCard = (course) => (
    <Card key={course._id} className="hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {course.courseName}
            </h3>
            <p className="text-sm text-gray-500">{course.courseCode}</p>
          </div>
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            {course.department}
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <span className="font-medium">Faculty:</span> {course.faculty}
          </p>
          <p>
            <span className="font-medium">Year:</span> {course.year} | 
            <span className="font-medium"> Section:</span> {course.section}
          </p>
        </div>

        {course.schedule && course.schedule.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-2">Schedule:</p>
            <div className="space-y-1">
              {course.schedule.map((slot, idx) => (
                <div key={idx} className="text-xs text-gray-600">
                  {slot.day}: {slot.startTime} - {slot.endTime}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex space-x-2 pt-4">
          <Button 
            size="sm" 
            variant="secondary" 
            className="flex-1"
          >
            View Details
          </Button>
          <Button 
            size="sm" 
            variant="primary" 
            className="flex-1"
            onClick={() => navigate(`/attendance/live/${course._id}`)}
          >
            Live Attendance
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-500 mt-1">Manage course offerings and schedules</p>
        </div>
        <Button 
          onClick={() => navigate('/courses/add')} 
          variant="primary"
        >
          <Plus size={18} className="mr-2" />
          Add Course
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No courses found. Add your first course to get started.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(renderCourseCard)}
        </div>
      )}
    </div>
  );
};

export default CoursesPage;