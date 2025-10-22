#!/usr/bin/env python3
"""
Create a visual comparison of the student images to verify they are different people
"""

import os
import cv2
import numpy as np

def create_visual_comparison():
    """Create a side-by-side comparison of the students"""
    students = ['132', '172', '564']
    uploads_dir = 'uploads/students'
    
    print("📷 Creating visual comparison of students...")
    
    # Load and resize images for comparison
    images = []
    for student_id in students:
        image_path = os.path.join(uploads_dir, f'{student_id}.jpg')
        if os.path.exists(image_path):
            img = cv2.imread(image_path)
            if img is not None:
                # Resize to standard size for comparison
                img_resized = cv2.resize(img, (300, 400))
                
                # Add student ID label
                cv2.putText(img_resized, f'Student {student_id}', 
                           (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                
                images.append(img_resized)
                print(f"✅ Loaded image for student {student_id}")
            else:
                print(f"❌ Could not read image for student {student_id}")
        else:
            print(f"❌ Image not found for student {student_id}")
    
    if len(images) == 3:
        # Create horizontal concatenation
        comparison = np.hstack(images)
        
        # Save comparison image
        cv2.imwrite('student_comparison.jpg', comparison)
        print("✅ Visual comparison saved as 'student_comparison.jpg'")
        
        # Also save individual face crops for detailed analysis
        print("\n🔍 Extracting face regions...")
        
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        for i, student_id in enumerate(students):
            img = images[i].copy()
            # Remove the text label for face detection
            img_clean = cv2.resize(cv2.imread(os.path.join(uploads_dir, f'{student_id}.jpg')), (300, 400))
            
            gray = cv2.cvtColor(img_clean, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            
            if len(faces) > 0:
                x, y, w, h = faces[0]
                face_crop = img_clean[y:y+h, x:x+w]
                
                # Resize face crop to standard size
                face_resized = cv2.resize(face_crop, (200, 200))
                
                cv2.imwrite(f'face_crop_{student_id}.jpg', face_resized)
                print(f"✅ Face crop saved for student {student_id}")
                
                # Calculate some basic face statistics
                gray_face = cv2.cvtColor(face_resized, cv2.COLOR_BGR2GRAY)
                face_mean = np.mean(gray_face)
                face_std = np.std(gray_face)
                
                print(f"   Student {student_id} face stats: mean={face_mean:.2f}, std={face_std:.2f}")
        
        return True
    else:
        print("❌ Could not load all student images")
        return False

def analyze_face_differences():
    """Analyze specific differences between faces"""
    print("\n🔬 Detailed Face Analysis:")
    print("-" * 40)
    
    students = ['132', '172', '564']
    
    for student_id in students:
        face_path = f'face_crop_{student_id}.jpg'
        if os.path.exists(face_path):
            img = cv2.imread(face_path)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Basic statistics
            mean_val = np.mean(gray)
            std_val = np.std(gray)
            
            # Edge detection (features)
            edges = cv2.Canny(gray, 50, 150)
            edge_density = np.sum(edges > 0) / edges.size
            
            # Histogram analysis
            hist = cv2.calcHist([gray], [0], None, [256], [0, 256])
            hist_peak = np.argmax(hist)
            
            print(f"Student {student_id}:")
            print(f"  • Mean intensity: {mean_val:.2f}")
            print(f"  • Std intensity: {std_val:.2f}")
            print(f"  • Edge density: {edge_density:.4f}")
            print(f"  • Histogram peak: {hist_peak}")

if __name__ == "__main__":
    print("🖼️ Visual Analysis Tool for Student Images")
    print("=" * 50)
    
    # Create visual comparison
    if create_visual_comparison():
        analyze_face_differences()
        
        print(f"\n📋 Summary:")
        print("1. Check 'student_comparison.jpg' to visually verify these are different people")
        print("2. Check individual face crops: face_crop_132.jpg, face_crop_172.jpg, face_crop_564.jpg")
        print("3. If they look like different people, the OpenCV method is clearly inadequate")
        print("4. Recommend installing proper face_recognition library")
    else:
        print("❌ Could not create visual comparison")