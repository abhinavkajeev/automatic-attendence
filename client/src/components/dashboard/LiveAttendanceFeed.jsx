import React, { useEffect, useState } from 'react';
import { attendanceAPI } from '../../services/api';
import { getRelativeTime } from '../../utils/formatDate';
import { CheckCircle } from 'lucide-react';
import Spinner from '../common/Spinner';

const LiveAttendanceFeed = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveAttendance();
    const interval = setInterval(fetchLiveAttendance, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchLiveAttendance = async () => {
    try {
      const response = await attendanceAPI.getLive();
      setAttendance(response.data.data);
    } catch (error) {
      console.error('Error fetching live attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Attendance Feed</h3>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Live Attendance Feed</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-500">Live</span>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
        {attendance.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No attendance records yet today</p>
        ) : (
          attendance.map((record, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
                {record.studentId?.name?.charAt(0) || 'S'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {record.studentId?.name || 'Unknown'}
                </p>
                <p className="text-xs text-gray-500">
                  {record.courseId?.courseName || 'Course'} • {record.studentId?.studentId}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle size={16} />
                  <span className="text-xs font-medium">Present</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {getRelativeTime(record.timeIn)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveAttendanceFeed;