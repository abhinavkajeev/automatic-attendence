import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, User, Search, X } from 'lucide-react';

const Header = () => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const headerVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const searchVariants = {
    unfocused: {
      scale: 1,
      transition: { duration: 0.2 }
    },
    focused: {
      scale: 1.02,
      transition: { duration: 0.2 }
    }
  };

  const notificationVariants = {
    hidden: {
      opacity: 0,
      y: -10,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: {
        duration: 0.15
      }
    }
  };

  const notifications = [
    { id: 1, text: 'New student registered', time: '5 min ago', unread: true },
    { id: 2, text: 'Attendance report ready', time: '1 hour ago', unread: true },
    { id: 3, text: 'Course schedule updated', time: '2 hours ago', unread: false },
  ];

  return (
    <motion.header
      className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95"
      variants={headerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Search Section */}
        <motion.div 
          className="flex items-center flex-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.div 
            className="relative max-w-md w-full"
            variants={searchVariants}
            animate={isSearchFocused ? "focused" : "unfocused"}
          >
            <motion.div
              animate={{
                rotate: isSearchFocused ? 360 : 0,
                scale: isSearchFocused ? 1.1 : 1
              }}
              transition={{ duration: 0.3 }}
            >
              <Search 
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                  isSearchFocused ? 'text-primary-500' : 'text-gray-400'
                }`}
                size={20} 
              />
            </motion.div>
            <input
              type="text"
              placeholder="Search students, courses..."
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl transition-all duration-300 ${
                isSearchFocused
                  ? 'border-primary-500 ring-2 ring-primary-100 shadow-md'
                  : 'border-gray-300 hover:border-gray-400'
              } focus:outline-none`}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            {isSearchFocused && (
              <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/5 to-primary-600/5 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </motion.div>
        </motion.div>

        {/* Right Section */}
        <motion.div 
          className="flex items-center space-x-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {/* Notifications */}
          <div className="relative">
            <motion.button
              className="relative p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={20} />
              <motion.span
                className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.8, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.span
                className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"
                animate={{
                  scale: [1, 1.8, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <>
                  <motion.div
                    className="fixed inset-0 z-30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowNotifications(false)}
                  />
                  <motion.div
                    className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-40"
                    variants={notificationVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-primary-100/50">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="p-1 hover:bg-white/50 rounded-lg transition-colors"
                      >
                        <X size={16} className="text-gray-500" />
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                            notification.unread ? 'bg-primary-50/30' : ''
                          }`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex items-start space-x-3">
                            {notification.unread && (
                              <div className="w-2 h-2 bg-primary-500 rounded-full mt-2" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">{notification.text}</p>
                              <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="p-3 text-center border-t border-gray-200">
                      <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                        View all notifications
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile */}
          <motion.div 
            className="flex items-center space-x-3 pl-4 border-l border-gray-200"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-right">
              <motion.p 
                className="text-sm font-medium text-gray-900"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Admin User
              </motion.p>
              <motion.p 
                className="text-xs text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Administrator
              </motion.p>
            </div>
            <motion.button
              className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-xl flex items-center justify-center hover:shadow-lg transition-all relative overflow-hidden group"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20"
                transition={{ duration: 0.3 }}
              />
              <User size={20} className="relative z-10" />
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </motion.header>
  );
};

export default Header;