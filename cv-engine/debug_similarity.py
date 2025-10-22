#!/usr/bin/env python3
"""
Debug script to analyze face similarity issues between students
"""

import os
import cv2
import numpy as np
import pickle
from PIL import Image

def load_student_data():
    """Load the current student embeddings"""
    embeddings_file = 'student_embeddings.pkl'
    if os.path.exists(embeddings_file):
        with open(embeddings_file, 'rb') as f:
            return pickle.load(f)
    return {'encodings': [], 'student_ids': []}

def analyze_image_properties(image_path, student_id):
    """Analyze basic properties of an image"""
    print(f"\n📷 Analyzing image: {student_id}")
    
    if not os.path.exists(image_path):
        print(f"❌ Image not found: {image_path}")
        return None
    
    # Load image
    img = cv2.imread(image_path)
    if img is None:
        print(f"❌ Could not read image: {image_path}")
        return None
    
    h, w, c = img.shape
    print(f"   • Image size: {w}x{h}x{c}")
    print(f"   • File size: {os.path.getsize(image_path)} bytes")
    
    # Convert to grayscale for analysis
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Basic image statistics
    mean_intensity = np.mean(gray)
    std_intensity = np.std(gray)
    print(f"   • Mean intensity: {mean_intensity:.2f}")
    print(f"   • Std intensity: {std_intensity:.2f}")
    
    # Face detection
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    
    print(f"   • Faces detected: {len(faces)}")
    
    if len(faces) > 0:
        x, y, w, h = faces[0]  # First face
        print(f"   • Face coordinates: ({x}, {y}, {w}, {h})")
        print(f"   • Face size: {w}x{h}")
        
        # Extract face region
        face_region = img[y:y+h, x:x+w]
        face_gray = gray[y:y+h, x:x+w]
        
        # Face-specific stats
        face_mean = np.mean(face_gray)
        face_std = np.std(face_gray)
        print(f"   • Face mean intensity: {face_mean:.2f}")
        print(f"   • Face std intensity: {face_std:.2f}")
        
        return {
            'image_size': (w, h),
            'face_coords': (x, y, w, h),
            'face_mean': face_mean,
            'face_std': face_std,
            'face_region': face_region
        }
    
    return None

def get_opencv_face_encoding(image_path):
    """Get OpenCV face encoding (same method as server)"""
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    
    if len(faces) == 0:
        return None
    
    x, y, w, h = faces[0]
    face_roi = img[y:y+h, x:x+w]
    
    # Same processing as server
    face_resized = cv2.resize(face_roi, (128, 128))
    encoding = face_resized.flatten().astype(np.float32)
    
    return encoding

def compare_opencv_encodings(enc1, enc2):
    """Compare OpenCV encodings (same method as server)"""
    # Normalize the encodings
    enc1_norm = enc1 / (np.linalg.norm(enc1) + 1e-7)
    enc2_norm = enc2 / (np.linalg.norm(enc2) + 1e-7)
    
    # Calculate similarity using dot product
    similarity = np.dot(enc1_norm, enc2_norm)
    return similarity

def debug_face_encodings():
    """Debug the face encodings and similarities"""
    print("🔍 Debugging Face Encodings and Similarities")
    print("=" * 60)
    
    # Students to analyze
    students = ['132', '172', '564']
    uploads_dir = 'uploads/students'
    processed_dir = 'processed_faces'
    
    # Analyze each student's images
    student_data = {}
    for student_id in students:
        print(f"\n🎯 Student {student_id}:")
        
        # Check original upload
        upload_path = os.path.join(uploads_dir, f'{student_id}.jpg')
        processed_path = os.path.join(processed_dir, f'{student_id}.jpg')
        
        upload_props = analyze_image_properties(upload_path, f"{student_id} (upload)")
        processed_props = analyze_image_properties(processed_path, f"{student_id} (processed)")
        
        # Get OpenCV encoding
        encoding = get_opencv_face_encoding(upload_path)
        if encoding is not None:
            print(f"   • Encoding shape: {encoding.shape}")
            print(f"   • Encoding mean: {np.mean(encoding):.4f}")
            print(f"   • Encoding std: {np.std(encoding):.4f}")
            print(f"   • Encoding min/max: {np.min(encoding):.2f} / {np.max(encoding):.2f}")
        
        student_data[student_id] = {
            'upload_props': upload_props,
            'processed_props': processed_props,
            'encoding': encoding
        }
    
    # Compare similarities
    print(f"\n🔄 Similarity Comparisons:")
    print("-" * 40)
    
    for i, student1 in enumerate(students):
        for j, student2 in enumerate(students):
            if i < j:  # Avoid duplicate comparisons
                enc1 = student_data[student1]['encoding']
                enc2 = student_data[student2]['encoding']
                
                if enc1 is not None and enc2 is not None:
                    similarity = compare_opencv_encodings(enc1, enc2)
                    print(f"Student {student1} vs {student2}: {similarity:.4f} ({similarity*100:.2f}%)")
                    
                    # Analyze encoding differences
                    diff = np.abs(enc1 - enc2)
                    print(f"   • Encoding difference mean: {np.mean(diff):.4f}")
                    print(f"   • Encoding difference std: {np.std(diff):.4f}")
                else:
                    print(f"Student {student1} vs {student2}: Could not compare (missing encoding)")

def check_system_embeddings():
    """Check what's stored in the system embeddings"""
    print(f"\n📊 Current System Embeddings:")
    print("-" * 40)
    
    student_data = load_student_data()
    print(f"Total students enrolled: {len(student_data['student_ids'])}")
    print(f"Student IDs: {student_data['student_ids']}")
    
    if len(student_data['encodings']) > 0:
        print(f"Encoding shape: {student_data['encodings'][0].shape}")
        
        # Compare stored encodings
        for i, id1 in enumerate(student_data['student_ids']):
            for j, id2 in enumerate(student_data['student_ids']):
                if i < j:
                    enc1 = student_data['encodings'][i]
                    enc2 = student_data['encodings'][j]
                    
                    similarity = compare_opencv_encodings(enc1, enc2)
                    print(f"Stored: {id1} vs {id2}: {similarity:.4f} ({similarity*100:.2f}%)")

if __name__ == "__main__":
    print("🔍 Face Recognition Debugging Tool")
    print("=" * 50)
    
    # Check system embeddings first
    check_system_embeddings()
    
    # Debug face encodings
    debug_face_encodings()
    
    print(f"\n💡 Recommendations:")
    print("1. Install proper face_recognition library: pip install face-recognition")
    print("2. If similarities are too high, the OpenCV method may be inadequate")
    print("3. Consider using different face detection/encoding methods")
    print("4. Check if images are actually different people")