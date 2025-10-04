import React, { useState, useRef } from 'react';
import InputField from '../common/InputField';
import Button from '../common/Button';
import { Camera } from 'lucide-react';

const AddStudentForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState(
    initialData || {
      studentId: '',
      name: '',
      email: '',
      department: '',
      year: '',
      section: '',
      phone: '',
    }
  );

  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setPhoto(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result);
        };
        reader.readAsDataURL(file);
        if (errors.photo) {
          setErrors((prev) => ({ ...prev, photo: '' }));
        }
      } else {
        setErrors((prev) => ({ ...prev, photo: 'Please upload an image file' }));
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.studentId) newErrors.studentId = 'Student ID is required';
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.year) newErrors.year = 'Year is required';
    if (!formData.section) newErrors.section = 'Section is required';
    if (!photo && !initialData) newErrors.photo = 'Student photo is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const formDataToSubmit = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSubmit.append(key, formData[key]);
      });
      if (photo) {
        formDataToSubmit.append('photo', photo);
      }
      onSubmit(formDataToSubmit);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Student ID"
          name="studentId"
          value={formData.studentId}
          onChange={handleChange}
          error={errors.studentId}
          required
          disabled={initialData !== null}
        />
        <InputField
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
        />
      </div>

      <InputField
        label="Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        required
      />

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department <span className="text-red-500">*</span>
          </label>
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select Department</option>
            <option value="CSE">Computer Science</option>
            <option value="ECE">Electronics</option>
            <option value="ME">Mechanical</option>
            <option value="CE">Civil</option>
            <option value="EEE">Electrical</option>
          </select>
          {errors.department && (
            <p className="mt-1 text-sm text-red-600">{errors.department}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year <span className="text-red-500">*</span>
          </label>
          <select
            name="year"
            value={formData.year}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select Year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
          {errors.year && <p className="mt-1 text-sm text-red-600">{errors.year}</p>}
        </div>

        <InputField
          label="Section"
          name="section"
          value={formData.section}
          onChange={handleChange}
          error={errors.section}
          required
          placeholder="e.g., A, B, C"
        />
      </div>

      <InputField
        label="Phone Number"
        type="tel"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
      />

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Student Photo <span className="text-red-500">*</span>
          </label>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div 
                className={`w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden ${
                  photoPreview ? 'border-transparent' : 'border-gray-300'
                }`}
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <Camera className="mx-auto h-8 w-8 text-gray-400" />
                    <span className="mt-1 block text-xs text-gray-500">
                      No photo
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-grow space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                ref={fileInputRef}
                className="hidden"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Photo
              </Button>
              <p className="text-xs text-gray-500">
                Upload a clear frontal face photo. This will be used for attendance marking.
              </p>
              {errors.photo && (
                <p className="text-sm text-red-600">{errors.photo}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {initialData ? 'Update Student' : 'Add Student'}
        </Button>
      </div>
    </form>
  );
};

export default AddStudentForm;