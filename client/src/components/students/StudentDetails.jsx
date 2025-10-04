import React from 'react';
import Card from '../common/Card';

const StudentDetails = ({ student }) => {
  if (!student) return null;

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold">
            {student.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{student.name}</h2>
            <p className="text-gray-500">Roll Number: {student.rollNumber}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Class</p>
            <p className="font-medium">{student.class}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Attendance Rate</p>
            <p className="font-medium">{student.attendanceRate}%</p>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Attendance</h3>
          <div className="space-y-2">
            {student.recentAttendance?.map((entry) => (
              <div key={entry.date} className="flex justify-between text-sm">
                <span>{entry.date}</span>
                <span className={entry.status === 'present' ? 'text-green-600' : 'text-red-600'}>
                  {entry.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StudentDetails;