import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AttendanceChart = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="present" 
            stroke="#0ea5e9" 
            strokeWidth={2}
            name="Present"
          />
          <Line 
            type="monotone" 
            dataKey="absent" 
            stroke="#ef4444" 
            strokeWidth={2}
            name="Absent"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttendanceChart;