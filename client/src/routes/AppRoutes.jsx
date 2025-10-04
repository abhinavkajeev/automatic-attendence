import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import DashboardPage from '../pages/DashboardPage';
import StudentsPage from '../pages/StudentsPage';
import CoursesPage from '../pages/CoursesPage';
import ReportsPage from '../pages/ReportsPage';
import LiveAttendancePage from '../pages/LiveAttendancePage';
import AddCoursePage from '../pages/AddCoursePage';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/add" element={<AddCoursePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="attendance/live/:courseId" element={<LiveAttendancePage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;