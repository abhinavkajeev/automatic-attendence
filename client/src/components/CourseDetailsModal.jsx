import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Trash2, 
  Edit, 
  Calendar, 
  Clock, 
  User, 
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import Modal from './common/Modal';
import Button from './common/Button';
import { coursesAPI } from '../services/api';

const CourseDetailsModal = ({ course, isOpen, onClose, onCourseDeleted, onCourseUpdated }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (!course) return;
    
    setIsDeleting(true);
    try {
      await coursesAPI.delete(course._id);
      onCourseDeleted(course._id);
      onClose();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log('Edit course:', course._id);
    onClose();
  };

  if (!course) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen size={24} />
                <h2 className="text-xl font-bold">Course Details</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Course Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Course Name</label>
                  <p className="text-lg font-semibold text-gray-900">{course.courseName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Course Code</label>
                  <p className="text-lg font-semibold text-gray-900">{course.courseCode}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Department</label>
                  <p className="text-lg font-semibold text-gray-900">{course.department}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Instructor</label>
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <p className="text-lg font-semibold text-gray-900">{course.instructor}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Class</label>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <p className="text-lg font-semibold text-gray-900">
                      Year {course.year} • Section {course.section}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule */}
            {course.schedule && course.schedule.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500 mb-3 block">Schedule</label>
                <div className="space-y-2">
                  {course.schedule.map((schedule, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Clock size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-900">{schedule.day}</span>
                      <span className="text-gray-600">{schedule.startTime} - {schedule.endTime}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{course.totalStudents || 0}</p>
                <p className="text-sm text-gray-600">Students</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{course.attendanceRate || 0}%</p>
                <p className="text-sm text-gray-600">Attendance</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{course.totalClasses || 0}</p>
                <p className="text-sm text-gray-600">Classes</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{course.completedClasses || 0}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleEdit}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Edit size={16} />
                  Edit Course
                </Button>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="danger"
                  className="flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete Course
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Delete Course</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{course.courseName}</strong>? 
                This action cannot be undone and will remove all associated attendance records.
              </p>
              
              <div className="flex items-center justify-end gap-3">
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="outline"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="danger"
                  disabled={isDeleting}
                  className="flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};

export default CourseDetailsModal;
