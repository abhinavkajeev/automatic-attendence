#!/usr/bin/env python3

import cv2
import numpy as np
import pickle
import os

def get_face_encoding(image):
    """Get face encoding using OpenCV - returns largest face only"""
    # Preprocess image for better face detection
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply histogram equalization for better contrast
    gray = cv2.equalizeHist(gray)
    
    # Try multiple detection parameters for better face detection
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(
        gray, 
        scaleFactor=1.1, 
        minNeighbors=3, 
        minSize=(30, 30),
        flags=cv2.CASCADE_SCALE_IMAGE
    )
    
    if len(faces) == 0:
        # Try with more lenient parameters
        faces = face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.05, 
            minNeighbors=2, 
            minSize=(20, 20),
            flags=cv2.CASCADE_SCALE_IMAGE
        )
    
    if len(faces) == 0:
        print(f"No faces detected in image of size: {image.shape}")
        return None
    
    print(f"Detected {len(faces)} faces")
    
    # Get the largest face
    largest_face = max(faces, key=lambda r: r[2] * r[3])
    x, y, w, h = largest_face
    
    print(f"Largest face: x={x}, y={y}, w={w}, h={h}")
    
    # Extract face ROI and resize
    face_roi = image[y:y+h, x:x+w]
    face_encoding = cv2.resize(face_roi, (128, 128)).flatten()
    
    return face_encoding, (x, y, w, h)

def compare_faces(known_encoding, face_encoding, tolerance=25000):
    """Compare faces with tolerance"""
    if known_encoding is None or face_encoding is None:
        return False
    
    if len(known_encoding) != len(face_encoding):
        print(f"Encoding length mismatch: {len(known_encoding)} vs {len(face_encoding)}")
        return False
    
    # Calculate Euclidean distance
    dist = np.linalg.norm(known_encoding - face_encoding)
    print(f"Face distance: {dist:.2f}, tolerance: {tolerance}")
    
    return dist < tolerance

def get_face_confidence(known_encoding, face_encoding):
    """Calculate confidence score based on face distance"""
    if known_encoding is None or face_encoding is None:
        return 0.0
    
    if len(known_encoding) != len(face_encoding):
        return 0.0
    
    # Calculate Euclidean distance
    dist = np.linalg.norm(known_encoding - face_encoding)
    
    # Convert distance to confidence (lower distance = higher confidence)
    max_distance = 50000  # Maximum expected distance
    min_distance = 5000   # Minimum expected distance for good match
    
    if dist > max_distance:
        return 0.0
    elif dist < min_distance:
        return 1.0
    else:
        # Linear interpolation between min and max
        confidence = 1.0 - ((dist - min_distance) / (max_distance - min_distance))
        return max(0.0, min(1.0, confidence))  # Clamp between 0 and 1

# Load student data
if os.path.exists('student_embeddings.pkl'):
    with open('student_embeddings.pkl', 'rb') as f:
        student_data = pickle.load(f)
        print(f"Enrolled students: {student_data['student_ids']}")
        print(f"Number of embeddings: {len(student_data['embeddings'])}")
else:
    print("No student embeddings found")
    exit(1)

# Test with student 132's photo
test_image_path = "uploads/students/132.jpg"
if os.path.exists(test_image_path):
    print(f"\nTesting with {test_image_path}")
    img = cv2.imread(test_image_path)
    if img is None:
        print("Could not load image")
        exit(1)
    
    print(f"Image shape: {img.shape}")
    
    # Get face encoding from test image
    result = get_face_encoding(img)
    if result is None:
        print("No face detected in test image")
        exit(1)
    
    test_encoding, (x, y, w, h) = result
    print(f"Test face encoding length: {len(test_encoding)}")
    
    # Compare with all enrolled students
    print("\nComparing with enrolled students:")
    for i, (student_id, encoding) in enumerate(zip(student_data['student_ids'], student_data['embeddings'])):
        print(f"\nStudent {student_id}:")
        print(f"  Encoding length: {len(encoding)}")
        
        # Test different tolerances
        for tolerance in [10000, 15000, 20000, 25000, 30000, 40000]:
            matches = compare_faces(encoding, test_encoding, tolerance)
            confidence = get_face_confidence(encoding, test_encoding)
            print(f"  Tolerance {tolerance}: match={matches}, confidence={confidence:.3f}")
        
        # Calculate actual distance
        dist = np.linalg.norm(encoding - test_encoding)
        print(f"  Actual distance: {dist:.2f}")
        
else:
    print(f"Test image {test_image_path} not found")
