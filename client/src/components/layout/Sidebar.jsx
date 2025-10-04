import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, FileText, Settings } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/students', icon: Users, label: 'Students' },
    { to: '/courses', icon: BookOpen, label: 'Courses' },
    { to: '/reports', icon: FileText, label: 'Reports' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen fixed left-0 top-0 z-50">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold">A</span>
          </div>
          <div>
            <h1 className="text-lg font-bold">Attendance</h1>
            <p className="text-xs text-gray-400">Management System</p>
          </div>
        </div>
      </div>

      <nav className="mt-6">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-6 py-3 transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white border-r-4 border-primary-400'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;