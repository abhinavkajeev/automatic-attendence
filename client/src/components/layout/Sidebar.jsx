import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, BookOpen, FileText, Settings } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/students', icon: Users, label: 'Students' },
    { to: '/courses', icon: BookOpen, label: 'Courses' },
    { to: '/reports', icon: FileText, label: 'Reports' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const sidebarVariants = {
    hidden: { x: -280, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const logoVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15
      }
    }
  };

  return (
    <motion.aside
      className="w-64 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-white min-h-screen fixed left-0 top-0 z-50 shadow-2xl"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <motion.div 
        className="p-6 border-b border-gray-800"
        variants={itemVariants}
      >
        <div className="flex items-center space-x-3">
          <motion.div
            className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden"
            variants={logoVariants}
            whileHover={{ 
              scale: 1.05,
              rotate: 5,
              transition: { duration: 0.2 }
            }}
          >
            <motion.div
              className="absolute inset-0 bg-white opacity-20"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.2, 0.3, 0.2]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <span className="text-2xl font-bold relative z-10">A</span>
          </motion.div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Attendance
            </h1>
            <p className="text-xs text-gray-400 font-medium">Management System</p>
          </div>
        </div>
      </motion.div>

      {/* Navigation */}
      <nav className="mt-8 px-3 space-y-2">
        {navItems.map((item, index) => (
          <motion.div
            key={item.to}
            variants={itemVariants}
            custom={index}
          >
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-600/50'
                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator line */}
                  {isActive && (
                    <motion.div
                      className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                      layoutId="activeIndicator"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30
                      }}
                    />
                  )}
                  
                  {/* Hover background effect */}
                  <motion.div
                    className={`absolute inset-0 rounded-xl ${
                      isActive 
                        ? 'bg-white opacity-0' 
                        : 'bg-gradient-to-r from-primary-600/0 to-primary-600/0 group-hover:from-primary-600/10 group-hover:to-primary-600/5'
                    }`}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Icon with animation */}
                  <motion.div
                    className="relative z-10"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <item.icon 
                      size={22} 
                      className={`transition-colors ${
                        isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary-400'
                      }`}
                    />
                  </motion.div>

                  {/* Label */}
                  <span className="font-medium text-sm relative z-10">
                    {item.label}
                  </span>

                  {/* Pulse effect for active item */}
                  {isActive && (
                    <motion.div
                      className="absolute right-4 w-2 h-2 bg-white rounded-full"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* Bottom decoration */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600"
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          backgroundSize: '200% 100%'
        }}
      />
    </motion.aside>
  );
};

export default Sidebar;