import React from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, Eye, Mail, User, GraduationCap } from 'lucide-react';
import Button from '../common/Button';
import { photosAPI } from '../../services/api';

const StudentTable = ({ students, onEdit, onDelete, onView }) => {
  const getDepartmentColor = (dept) => {
    const colors = {
      'CSE': { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
      'ECE': { bg: '#F3E8FF', text: '#6B21A8', border: '#D8B4FE' },
      'ME': { bg: '#FED7AA', text: '#C2410C', border: '#FDBA74' },
      'CE': { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
      'default': { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' }
    };
    return colors[dept] || colors.default;
  };

  const tableVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="overflow-x-auto">
      <motion.table 
        className="min-w-full"
        variants={tableVariants}
        initial="hidden"
        animate="visible"
      >
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-white">
              Student
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-white">
              Contact
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-white">
              Academic Info
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-white">
              Status
            </th>
            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-white">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {students.map((student, index) => {
            const deptColor = getDepartmentColor(student.department);
            
            return (
              <motion.tr 
                key={student._id}
                variants={rowVariants}
                className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200 group"
                whileHover={{ scale: 1.005 }}
              >
                {/* Student Info */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="relative"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <img
                        className="h-12 w-12 rounded-xl object-cover border-2 border-gray-200 shadow-sm group-hover:border-blue-400 transition-colors"
                        src={photosAPI.get(student.studentId)}
                        alt={student.name}
                        onError={(e) => {
                          e.target.src = 'https://www.gravatar.com/avatar/?d=mp';
                        }}
                      />
                      <motion.div
                        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                        style={{ 
                          backgroundColor: student.isActive ? '#10B981' : '#EF4444' 
                        }}
                        animate={student.isActive ? {
                          scale: [1, 1.2, 1],
                        } : {}}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </motion.div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {student.name}
                      </p>
                      <p className="text-xs text-gray-500 font-mono font-semibold mt-0.5">
                        ID: {student.studentId}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Contact Info */}
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      <a 
                        href={`mailto:${student.email}`}
                        className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        {student.email}
                      </a>
                    </div>
                    {student.phone && (
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="text-xs text-gray-500">{student.phone}</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Academic Info */}
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <motion.div 
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2"
                      style={{ 
                        backgroundColor: deptColor.bg,
                        borderColor: deptColor.border
                      }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <GraduationCap size={14} style={{ color: deptColor.text }} />
                      <span 
                        className="text-xs font-bold"
                        style={{ color: deptColor.text }}
                      >
                        {student.department}
                      </span>
                    </motion.div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="font-semibold">Year {student.year}</span>
                      <span className="text-gray-400">•</span>
                      <span className="font-semibold">Section {student.section}</span>
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <motion.span
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg"
                    style={{
                      backgroundColor: student.isActive ? '#DEF7EC' : '#FEE2E2',
                      color: student.isActive ? '#047857' : '#DC2626'
                    }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <motion.div
                      className="w-2 h-2 rounded-full"
                      style={{ 
                        backgroundColor: student.isActive ? '#10B981' : '#EF4444' 
                      }}
                      animate={student.isActive ? {
                        scale: [1, 1.3, 1],
                        opacity: [1, 0.7, 1]
                      } : {}}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    {student.isActive ? 'Active' : 'Inactive'}
                  </motion.span>
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <motion.button
                      onClick={() => onView(student)}
                      className="p-2 rounded-lg hover:bg-blue-50 transition-colors group/btn"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      title="View Details"
                    >
                      <Eye size={18} className="text-blue-600 group-hover/btn:text-blue-700" />
                    </motion.button>
                    <motion.button
                      onClick={() => onEdit(student)}
                      className="p-2 rounded-lg hover:bg-green-50 transition-colors group/btn"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      title="Edit Student"
                    >
                      <Edit size={18} className="text-green-600 group-hover/btn:text-green-700" />
                    </motion.button>
                    <motion.button
                      onClick={() => onDelete(student)}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors group/btn"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      title="Delete Student"
                    >
                      <Trash2 size={18} className="text-red-600 group-hover/btn:text-red-700" />
                    </motion.button>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </motion.table>
    </div>
  );
};

export default StudentTable;