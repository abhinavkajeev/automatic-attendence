import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../components/common/Card';
import LiveAttendance from '../components/attendance/LiveAttendance';
import { coursesAPI, studentsAPI, attendanceAPI } from '../services/api';

const MarkAttendancePage = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourseData = async () => {
      try {
        setLoading(true);
        const [courseResponse, studentsResponse] = await Promise.all([
          coursesAPI.getById(courseId),
          studentsAPI.getAll({ courseId })
        ]);

        setCourse(courseResponse.data.data);
        setStudents(studentsResponse.data.data);
      } catch (error) {
        console.error('Error loading course data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [courseId]);

  const handleAttendanceMarked = async (recognizedStudentIds) => {
    try {
      await attendanceAPI.mark({
        courseId,
        studentIds: recognizedStudentIds,
        method: 'face-recognition'
      });

      alert('Attendance marked successfully!');
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Error marking attendance. Please try again.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!course) {
    return <div>Course not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
        <p className="text-gray-500 mt-1">
          {course.name} - {course.code}
        </p>
      </div>

      <Card>
        <LiveAttendance
          courseId={courseId}
          students={students}
          onAttendanceMarked={handleAttendanceMarked}
        />
      </Card>
    </div>
  );
};

export default MarkAttendancePage;