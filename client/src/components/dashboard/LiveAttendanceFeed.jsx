import React from 'react';
import Card from '../common/Card';

const LiveAttendanceFeed = ({ attendanceData }) => {
  return (
    <Card>
      <h2 className="text-lg font-semibold mb-4">Live Attendance Feed</h2>
      <div className="space-y-4">
        {attendanceData.map((entry) => (
          <div key={entry.id} className="flex items-center space-x-4 p-2 hover:bg-gray-50 rounded-md">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              {entry.studentInitials}
            </div>
            <div>
              <p className="font-medium">{entry.studentName}</p>
              <p className="text-sm text-gray-500">{entry.timestamp}</p>
            </div>
            <div className="ml-auto">
              <span className="px-2 py-1 text-sm rounded-full bg-green-100 text-green-800">
                Marked Present
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default LiveAttendanceFeed;