import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Clock, User, Calendar, ArrowRight, Star } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import CourseDetailsModal from '../components/CourseDetailsModal';
import { coursesAPI } from '../services/api';

const CoursesPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await coursesAPI.getAll();
      setCourses(response.data.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (course) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCourse(null);
  };

  const handleCourseDeleted = (courseId) => {
    setCourses(prev => prev.filter(course => course._id !== courseId));
    setIsModalOpen(false);
    setSelectedCourse(null);
  };

  const handleCourseUpdated = (updatedCourse) => {
    setCourses(prev => prev.map(course => 
      course._id === updatedCourse._id ? updatedCourse : course
    ));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const getDepartmentStyle = (dept) => {
    const styles = {
      'CSE': { 
        bgColor: '#3B82F6',
        lightBg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-600',
        gradient: 'from-blue-400 via-blue-500 to-blue-600'
       
      
      },
      'ECE': { 
        bgColor: '#A855F7',
        lightBg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-600',
        gradient: 'from-purple-400 via-purple-500 to-purple-600'
      },
      'ME': { 
        bgColor: '#F97316',
        lightBg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-600',
        gradient: 'from-orange-400 via-orange-500 to-orange-600'
      },
      'CE': { 
        bgColor: '#10B981',
        lightBg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-600',
        gradient: 'from-green-400 via-green-500 to-green-600'
      },
      'default': { 
        bgColor: '#6B7280',
        lightBg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-600',
        gradient: 'from-gray-400 via-gray-500 to-gray-600'
      }
    };
    return styles[dept] || styles.default;
  };

  const renderCourseCard = (course, index) => {
    const style = getDepartmentStyle(course.department);
    
    return (
      <motion.div
        key={course._id}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: index * 0.1 }}
        whileHover={{ 
          y: -10,
          scale: 1.02,
          transition: { duration: 0.3 }
        }}
        className="group"
      >
        <div className="relative bg-white rounded-2xl overflow-hidden border-2 border-gray-100 hover:border-gray-200 transition-all duration-300 h-full shadow-sm hover:shadow-xl">
          {/* Animated Background Gradient */}
          <motion.div 
            className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
            initial={{ scale: 0, rotate: 0 }}
            whileHover={{ scale: 1.5, rotate: 45 }}
            transition={{ duration: 0.8 }}
          />
          
          {/* Top Badge Section */}
          <div className="relative p-5 pb-3">
            <div className="flex items-center justify-between mb-4">
              <motion.div 
                className="text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2"
                style={{ backgroundColor: style.bgColor }}
                whileHover={{ scale: 1.1, rotate: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <Star size={12} fill="currentColor" />
                {course.department}
              </motion.div>
              
              <motion.div
                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-white transition-colors"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <BookOpen size={20} className={`${style.text}`} />
              </motion.div>
            </div>

            {/* Course Name */}
            <div className="space-y-1">
              <motion.h3 
                className="text-xl font-bold text-gray-900 line-clamp-2 leading-tight"
                whileHover={{ x: 3 }}
              >
                {course.courseName}
              </motion.h3>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {course.courseCode}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className={`h-px bg-gradient-to-r ${style.gradient} opacity-20 mx-5`} />

          {/* Content Section */}
          <div className="p-5 pt-4 space-y-4">
            {/* Faculty & Year Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${style.lightBg} flex items-center justify-center`}>
                  <User size={16} className={style.text} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium">Faculty</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{course.faculty}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${style.lightBg} flex items-center justify-center`}>
                  <Calendar size={16} className={style.text} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium">Class</p>
                  <p className="text-sm font-bold text-gray-900">Year {course.year} • Section {course.section}</p>
                </div>
              </div>
            </div>

            {/* Schedule */}
            {course.schedule && course.schedule.length > 0 && (
              <div className={`${style.lightBg} ${style.border} border rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={14} className={style.text} />
                  <p className={`text-xs font-bold ${style.text} uppercase tracking-wide`}>
                    Schedule ({course.schedule.length})
                  </p>
                </div>
                <div className="space-y-2 max-h-28 overflow-y-auto pr-1 schedule-scroll">
                  {course.schedule.map((slot, idx) => (
                    <motion.div 
                      key={idx}
                      className="bg-white rounded-lg px-3 py-2 flex items-center justify-between text-xs border border-gray-100"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ x: 3, backgroundColor: 'rgb(249 250 251)' }}
                    >
                      <span className="font-bold text-gray-900">{slot.day}</span>
                      <span className="text-gray-600 font-medium">
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className={`p-5 pt-3 border-t border-gray-100`}>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                onClick={() => handleViewDetails(course)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-bold transition-colors flex items-center justify-center gap-2 group/btn"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                View Details
              </motion.button>
              
              <motion.button
                className="px-4 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg group/btn"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/attendance/live/${course._id}`)}
              >
                Start
                <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </div>

          {/* Hover Shine Effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Modern Header */}
      <motion.div 
        className="relative overflow-hidden bg-white rounded-3xl shadow-sm border border-gray-200 p-8"
        variants={itemVariants}
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30 -mr-32 -mt-32" style={{ background: 'linear-gradient(to bottom right, #DBEAFE, #BFDBFE)' }} />
        
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <motion.h1 
              className="text-4xl font-black text-gray-900 mb-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Courses
            </motion.h1>
            <p className="text-gray-600 font-medium flex items-center gap-2">
              <span>Manage course offerings and schedules</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#3B82F6' }} />
              <span className="font-bold" style={{ color: '#3B82F6' }}>{courses.length} Active</span>
            </p>
          </div>
          
          <motion.button
            className="text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            style={{ background: 'linear-gradient(to right, #3B82F6, #2563EB)' }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/courses/add')}
          >
            <Plus size={20} />
            Add New Course
          </motion.button>
        </div>
      </motion.div>

      {/* Content */}
      {loading ? (
        <motion.div 
          className="flex justify-center py-24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Spinner size="lg" />
        </motion.div>
      ) : courses.length === 0 ? (
        <motion.div variants={itemVariants}>
          <div className="bg-white rounded-3xl border-2 border-dashed border-gray-300 p-16 text-center">
            <motion.div
              animate={{ 
                y: [0, -15, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="inline-block mb-6"
            >
              <BookOpen size={80} className="text-gray-300" strokeWidth={1.5} />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No courses yet</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-8">
              Start building your academic schedule by adding your first course.
            </p>
            <motion.button
              className="text-white px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2"
              style={{ backgroundColor: '#3B82F6' }}
              whileHover={{ scale: 1.05, backgroundColor: '#2563EB' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/courses/add')}
            >
              <Plus size={20} />
              Add Your First Course
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
        >
          {courses.map((course, index) => renderCourseCard(course, index))}
        </motion.div>
      )}

      <style jsx>{`
        .schedule-scroll::-webkit-scrollbar {
          width: 3px;
        }
        .schedule-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .schedule-scroll::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .schedule-scroll::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>

      {/* Course Details Modal */}
      <CourseDetailsModal
        course={selectedCourse}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCourseDeleted={handleCourseDeleted}
        onCourseUpdated={handleCourseUpdated}
      />
    </motion.div>
  );
};

export default CoursesPage;