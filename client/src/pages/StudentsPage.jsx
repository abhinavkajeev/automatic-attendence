import React, { useState, useEffect } from 'react';
import { UserPlus, Download } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import StudentTable from '../components/students/StudentTable';
import AddStudentForm from '../components/students/AddStudentForm';
import Spinner from '../components/common/Spinner';
import { studentsAPI, photosAPI } from '../services/api';

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [filters, setFilters] = useState({
    department: '',
    year: '',
    search: '',
  });

  useEffect(() => {
    fetchStudents();
  }, [filters]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentsAPI.getAll(filters);
      setStudents(response.data.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (formData) => {
    try {
      let studentData;
      // Get the photo file from FormData
      const photoFile = formData.get('photo');
      
      // Create student object from form data
      const studentObj = {
        studentId: formData.get('studentId'),
        name: formData.get('name'),
        email: formData.get('email'),
        department: formData.get('department'),
        year: parseInt(formData.get('year')),
        section: formData.get('section'),
        phone: formData.get('phone') || undefined
      };

      // Create or update student first
      if (editingStudent) {
        const response = await studentsAPI.update(editingStudent.studentId, studentObj);
        studentData = response.data.data;
      } else {
        const response = await studentsAPI.create(studentObj);
        studentData = response.data.data;
      }

      // Upload photo if provided
      if (photoFile) {
        try {
          const photoFormData = new FormData();
          photoFormData.append('photo', photoFile);
          
          const uploadResponse = await photosAPI.upload(studentData.studentId, photoFormData);
          console.log('Photo upload response:', uploadResponse);
          
          // No need to update student separately as it's handled in the upload endpoint
        } catch (photoError) {
          console.error('Error uploading photo:', photoError);
          alert('Student was saved but there was an error uploading the photo. Please try updating the photo later.');
        }
      }

      fetchStudents();
      setIsModalOpen(false);
      setEditingStudent(null);
    } catch (error) {
      console.error('Error saving student:', error);
      if (error.response?.data?.error?.includes('duplicate key error')) {
        if (error.response.data.error.includes('studentId')) {
          alert('A student with this Student ID already exists');
        } else if (error.response.data.error.includes('email')) {
          alert('A student with this email already exists');
        } else {
          alert('Student ID or Email already exists');
        }
      } else {
        alert(error.response?.data?.error || 'Error saving student');
      }
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleDelete = async (student) => {
    if (window.confirm(`Are you sure you want to delete ${student.name}?`)) {
      try {
        await studentsAPI.delete(student.studentId);
        fetchStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Error deleting student');
      }
    }
  };

  const handleView = (student) => {
    alert(`View details for ${student.name} - Feature coming soon!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 mt-1">Manage your student database</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary">
            <Download size={18} className="mr-2" />
            Export
          </Button>
          <Button
            onClick={() => {
              setEditingStudent(null);
              setIsModalOpen(true);
            }}
          >
            <UserPlus size={18} className="mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search students..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
          >
            <option value="">All Departments</option>
            <option value="CSE">Computer Science</option>
            <option value="ECE">Electronics</option>
            <option value="ME">Mechanical</option>
            <option value="CE">Civil</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          >
            <option value="">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
        </div>

        {loading ? (
          <div className="py-12">
            <Spinner />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No students found</p>
          </div>
        ) : (
          <StudentTable
            students={students}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
          />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStudent(null);
        }}
        title={editingStudent ? 'Edit Student' : 'Add New Student'}
        size="lg"
      >
        <AddStudentForm
          onSubmit={handleAddStudent}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingStudent(null);
          }}
          initialData={editingStudent}
        />
      </Modal>
    </div>
  );
};

export default StudentsPage;