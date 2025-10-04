import React, { useState } from 'react';
import { api } from '../../services/api';
import Button from '../common/Button';
import InputField from '../common/InputField';
import Card from '../common/Card';
import { Camera } from 'lucide-react';

const AddStudentForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    class: '',
  });
  const [isCapturing, setIsCapturing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.addStudent(formData);
      onSuccess();
      setFormData({ name: '', rollNumber: '', class: '' });
    } catch (error) {
      console.error('Error adding student:', error);
    }
    setLoading(false);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
        <InputField
          label="Roll Number"
          name="rollNumber"
          value={formData.rollNumber}
          onChange={handleInputChange}
          required
        />
        <InputField
          label="Class"
          name="class"
          value={formData.class}
          onChange={handleInputChange}
          required
        />
        <div className="flex items-center space-x-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsCapturing(true)}
          >
            <Camera className="w-4 h-4 mr-2" />
            Capture Face
          </Button>
          <Button type="submit" disabled={loading}>
            Add Student
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AddStudentForm;