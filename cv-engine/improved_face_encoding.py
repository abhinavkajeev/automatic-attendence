#!/usr/bin/env python3
"""
Improved face encoding system using OpenCV with better feature extraction
"""

import cv2
import numpy as np
import os

def extract_facial_features(image):
    """Extract better facial features using OpenCV"""
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
    
    features = []
    
    # 1. LBP (Local Binary Pattern) features
    def get_lbp_features(gray_img, radius=3, n_points=24):
        """Extract Local Binary Pattern features"""
        height, width = gray_img.shape
        lbp_image = np.zeros((height, width), dtype=np.uint8)
        
        for i in range(radius, height - radius):
            for j in range(radius, width - radius):
                center = gray_img[i, j]
                binary_string = ""
                
                # Sample points in a circle
                for k in range(n_points):
                    angle = 2 * np.pi * k / n_points
                    x = int(i + radius * np.cos(angle))
                    y = int(j + radius * np.sin(angle))
                    
                    if 0 <= x < height and 0 <= y < width:
                        if gray_img[x, y] >= center:
                            binary_string += "1"
                        else:
                            binary_string += "0"
                
                # Limit to uint8 range
                lbp_value = int(binary_string, 2) if binary_string else 0
                lbp_image[i, j] = min(255, lbp_value)
        
        # Create histogram
        hist, _ = np.histogram(lbp_image.ravel(), bins=256, range=(0, 256))
        return hist / np.sum(hist)  # Normalize
    
    # 2. Histogram of Oriented Gradients (HOG) features
    def get_hog_features(gray_img):
        """Extract HOG features"""
        # Calculate gradients
        grad_x = cv2.Sobel(gray_img, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray_img, cv2.CV_64F, 0, 1, ksize=3)
        
        # Calculate magnitude and direction
        magnitude = np.sqrt(grad_x**2 + grad_y**2)
        direction = np.arctan2(grad_y, grad_x) * 180 / np.pi
        direction[direction < 0] += 180  # 0-180 degrees
        
        # Create histogram of orientations
        hist, _ = np.histogram(direction.ravel(), bins=18, range=(0, 180), weights=magnitude.ravel())
        return hist / (np.sum(hist) + 1e-7)  # Normalize
    
    # 3. Statistical features
    def get_statistical_features(gray_img):
        """Extract statistical features"""
        stats = []
        
        # Basic statistics
        stats.extend([
            np.mean(gray_img),
            np.std(gray_img),
            np.median(gray_img),
            np.min(gray_img),
            np.max(gray_img)
        ])
        
        # Histogram statistics
        hist, _ = np.histogram(gray_img.ravel(), bins=256, range=(0, 256))
        hist = hist / np.sum(hist)
        
        # Entropy
        entropy = -np.sum(hist * np.log2(hist + 1e-7))
        stats.append(entropy)
        
        # Skewness and kurtosis approximations
        mean_val = np.mean(gray_img)
        std_val = np.std(gray_img)
        skewness = np.mean(((gray_img - mean_val) / std_val) ** 3)
        kurtosis = np.mean(((gray_img - mean_val) / std_val) ** 4)
        
        stats.extend([skewness, kurtosis])
        
        return np.array(stats)
    
    # Extract all features
    try:
        # Resize for consistent processing
        resized = cv2.resize(gray, (128, 128))
        
        # LBP features
        lbp_features = get_lbp_features(resized)
        features.extend(lbp_features)
        
        # HOG features  
        hog_features = get_hog_features(resized)
        features.extend(hog_features)
        
        # Statistical features
        stat_features = get_statistical_features(resized)
        features.extend(stat_features)
        
        return np.array(features, dtype=np.float32)
        
    except Exception as e:
        print(f"Error extracting features: {e}")
        return None

def improved_face_encoding(image_path):
    """Get improved face encoding"""
    img = cv2.imread(image_path)
    if img is None:
        return None
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Face detection
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    
    if len(faces) == 0:
        return None
    
    # Use the largest face
    x, y, w, h = faces[0]
    face_roi = img[y:y+h, x:x+w]
    
    # Extract improved features
    features = extract_facial_features(face_roi)
    
    return features

def improved_face_similarity(features1, features2):
    """Calculate similarity using multiple methods"""
    if features1 is None or features2 is None:
        return 0.0
    
    # Ensure same length
    min_len = min(len(features1), len(features2))
    f1 = features1[:min_len]
    f2 = features2[:min_len]
    
    # Normalize features
    f1_norm = f1 / (np.linalg.norm(f1) + 1e-7)
    f2_norm = f2 / (np.linalg.norm(f2) + 1e-7)
    
    # Calculate multiple similarity metrics
    
    # 1. Cosine similarity
    cosine_sim = np.dot(f1_norm, f2_norm)
    
    # 2. Euclidean distance (converted to similarity)
    euclidean_dist = np.linalg.norm(f1_norm - f2_norm)
    euclidean_sim = 1.0 / (1.0 + euclidean_dist)
    
    # 3. Correlation coefficient
    correlation = np.corrcoef(f1, f2)[0, 1]
    if np.isnan(correlation):
        correlation = 0.0
    
    # Weighted combination
    similarity = (0.5 * cosine_sim + 0.3 * euclidean_sim + 0.2 * abs(correlation))
    
    return max(0.0, min(1.0, similarity))

def test_improved_encoding():
    """Test the improved encoding system"""
    print("🧪 Testing Improved Face Encoding System")
    print("=" * 50)
    
    students = ['132', '172', '564']
    uploads_dir = 'uploads/students'
    
    # Extract features for each student
    student_features = {}
    for student_id in students:
        image_path = os.path.join(uploads_dir, f'{student_id}.jpg')
        features = improved_face_encoding(image_path)
        
        if features is not None:
            student_features[student_id] = features
            print(f"✅ Extracted {len(features)} features for student {student_id}")
        else:
            print(f"❌ Failed to extract features for student {student_id}")
    
    # Compare similarities
    print(f"\n🔄 Improved Similarity Comparisons:")
    print("-" * 40)
    
    for i, student1 in enumerate(students):
        for j, student2 in enumerate(students):
            if i < j and student1 in student_features and student2 in student_features:
                similarity = improved_face_similarity(
                    student_features[student1], 
                    student_features[student2]
                )
                print(f"Student {student1} vs {student2}: {similarity:.4f} ({similarity*100:.2f}%)")

if __name__ == "__main__":
    test_improved_encoding()