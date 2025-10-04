import React from 'react';
import { useParams } from 'react-router-dom';

const LiveAttendanceFeed = () => {
  const { courseId } = useParams();
  const videoUrl = 'http://localhost:5001/api/attendance/live';

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Live Attendance Feed</h1>
      <div className="max-w-4xl mx-auto bg-black rounded-lg overflow-hidden">
        <img 
          src={videoUrl} 
          alt="Live Feed" 
          className="w-full h-full"
          style={{ minHeight: '480px' }}
        />
      </div>
    </div>
  );
};

export default LiveAttendanceFeed;