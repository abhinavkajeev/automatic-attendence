import React, { useEffect, useState } from 'react';
import { Users, UserCheck, TrendingUp, Calendar } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import AttendanceChart from '../components/dashboard/AttendanceChart';
import LiveAttendanceFeed from '../components/dashboard/LiveAttendanceFeed';
import { attendanceAPI } from '../services/api';
import Spinner from '../components/common/Spinner';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sample chart data - replace with actual API data
  const chartData = [
    { date: 'Mon', present: 245, absent: 15 },
    { date: 'Tue', present: 238, absent: 22 },
    { date: 'Wed', present: 252, absent: 8 },
    { date: 'Thu', present: 248, absent: 12 },
    { date: 'Fri', present: 255, absent: 5 },
  ];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await attendanceAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's your attendance overview.</p>
        </div>
        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          icon={Users}
          trend={5.2}
          color="blue"
        />
        <StatCard
          title="Present Today"
          value={stats?.todayPresent || 0}
          icon={UserCheck}
          trend={2.4}
          color="green"
        />
        <StatCard
          title="Attendance Rate"
          value={`${stats?.avgAttendance || 0}%`}
          icon={TrendingUp}
          trend={1.8}
          color="purple"
        />
        <StatCard
          title="Monthly Present"
          value={stats?.monthlyPresent || 0}
          icon={Calendar}
          trend={-0.5}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AttendanceChart data={chartData} />
        </div>
        <div>
          <LiveAttendanceFeed />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;