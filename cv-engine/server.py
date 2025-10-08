from flask import Flask, request, jsonify, Response, send_file
import os
import cv2
import numpy as np
from PIL import Image
import io
import pickle
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
import os
import cv2
import numpy as np
from PIL import Image
import io
import pickle
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Initialize face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Configure storage
UPLOAD_FOLDER = 'uploads'
EMBEDDINGS_FILE = 'student_embeddings.pkl'
PROCESSED_FACES = 'processed_faces'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FACES, exist_ok=True)

def load_student_data():
    if os.path.exists(EMBEDDINGS_FILE):
        with open(EMBEDDINGS_FILE, 'rb') as f:
            return pickle.load(f)
    return {
        'embeddings': [],
        'student_ids': []
    }

def save_student_data(data):
    with open(EMBEDDINGS_FILE, 'wb') as f:
        pickle.dump(data, f)

# Load student data
student_data = load_student_data()

def get_face_encoding(image):
    """Get face encoding using OpenCV - returns largest face only"""
    # Preprocess image for better face detection
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply histogram equalization for better contrast
    gray = cv2.equalizeHist(gray)
    
    # Try multiple detection parameters for better face detection
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
        # Try with very lenient parameters
        faces = face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.03, 
            minNeighbors=1, 
            minSize=(15, 15),
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

def get_all_face_encodings(image):
    """Get encodings for all faces in the image with improved validation"""
    # Preprocess image for better face detection
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply histogram equalization for better contrast
    gray = cv2.equalizeHist(gray)
    
    # Use stricter parameters to avoid false positives
    faces = face_cascade.detectMultiScale(
        gray, 
        scaleFactor=1.1, 
        minNeighbors=5,  # Increased from 3 to 5 for better accuracy
        minSize=(50, 50),  # Increased minimum size
        flags=cv2.CASCADE_SCALE_IMAGE
    )
    
    if len(faces) == 0:
        # Try with slightly more lenient parameters
        faces = face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.05, 
            minNeighbors=4,  # Still strict
            minSize=(40, 40),
            flags=cv2.CASCADE_SCALE_IMAGE
        )
    
    if len(faces) == 0:
        print(f"No faces detected in image of size: {image.shape}")
        return []
    
    print(f"Raw detection: {len(faces)} faces found")
    
    # Filter out overlapping faces and validate face quality
    valid_faces = []
    for i, (x, y, w, h) in enumerate(faces):
        # Check if face is too small or too large (likely false positive)
        face_area = w * h
        image_area = image.shape[0] * image.shape[1]
        face_ratio = face_area / image_area
        
        if face_ratio < 0.01 or face_ratio > 0.5:  # Face should be 1-50% of image
            print(f"Face {i+1} rejected: size ratio {face_ratio:.3f} (too small/large)")
            continue
        
        # Check for overlapping faces (remove duplicates)
        is_duplicate = False
        for valid_face in valid_faces:
            vx, vy, vw, vh = valid_face['coordinates']
            # Calculate overlap
            overlap_x = max(0, min(x + w, vx + vw) - max(x, vx))
            overlap_y = max(0, min(y + h, vy + vh) - max(y, vy))
            overlap_area = overlap_x * overlap_y
            face_area1 = w * h
            face_area2 = vw * vh
            
            if overlap_area > 0.3 * min(face_area1, face_area2):  # 30% overlap threshold
                print(f"Face {i+1} rejected: overlaps with existing face")
                is_duplicate = True
                break
        
        if not is_duplicate:
            valid_faces.append({
                'coordinates': (x, y, w, h),
                'area': face_area,
                'ratio': face_ratio
            })
            print(f"Face {i+1} accepted: x={x}, y={y}, w={w}, h={h}, ratio={face_ratio:.3f}")
    
    print(f"After filtering: {len(valid_faces)} valid faces")
    
    # Generate encodings for valid faces
    face_encodings = []
    for i, face_data in enumerate(valid_faces):
        x, y, w, h = face_data['coordinates']
        print(f"Processing valid face {i+1}: x={x}, y={y}, w={w}, h={h}")
        
        # Extract face ROI and resize
        face_roi = image[y:y+h, x:x+w]
        face_encoding = cv2.resize(face_roi, (128, 128)).flatten()
        
        face_encodings.append({
            'encoding': face_encoding,
            'coordinates': (x, y, w, h)
        })
    
    return face_encodings

def compare_faces(known_encoding, face_encoding, tolerance=30000):
    """Improved face comparison with stricter tolerance and validation"""
    if known_encoding is None or face_encoding is None:
        return False
    
    # Check if encodings are valid
    if len(known_encoding) != len(face_encoding):
        print(f"Encoding length mismatch: {len(known_encoding)} vs {len(face_encoding)}")
        return False
    
    # Calculate Euclidean distance
    dist = np.linalg.norm(known_encoding - face_encoding)
    print(f"Face distance: {dist:.2f}, tolerance: {tolerance}")
    
    # Check for identical encodings (distance = 0)
    if dist < 0.001:
        print("⚠️  WARNING: Face encodings are nearly identical!")
        return False  # Reject identical faces
    
    # Much stricter tolerance - only very similar faces should match
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
    # Max distance for 0% confidence, min distance for 100% confidence
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

# Initialize systems
from werkzeug.utils import secure_filename

@app.route('/health', methods=['GET'])
def health_check():
    try:
        # Try to open the camera
        cap = cv2.VideoCapture(0)
        camera_available = cap.isOpened()
        if camera_available:
            cap.release()
            
        return jsonify({
            'status': 'healthy',
            'camera_available': camera_available,
            'opencv_version': cv2.__version__
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'opencv_version': cv2.__version__
        }), 500

@app.route('/enroll', methods=['POST'])
def enroll_student():
    if 'photo' not in request.files:
        return jsonify({
            'success': False,
            'message': 'No photo file provided'
        }), 400
    
    photo = request.files['photo']
    student_id = request.form.get('student_id')
    force_enroll = request.form.get('force_enroll', 'false').lower() == 'true'
    
    if not student_id:
        return jsonify({
            'success': False,
            'message': 'No student ID provided'
        }), 400
    
    if photo.filename == '':
        return jsonify({
            'success': False,
            'message': 'No photo selected'
        }), 400
    
    try:
        # Save uploaded file temporarily
        filename = secure_filename(f"{student_id}_{photo.filename}")
        photo_path = os.path.join(UPLOAD_FOLDER, filename)
        photo.save(photo_path)
        
        # Read image and detect face
        img = cv2.imread(photo_path)
        if img is None:
            os.remove(photo_path)
            return jsonify({
                'success': False,
                'message': 'Could not read uploaded image'
            }), 400
        
        # Get face encoding
        result = get_face_encoding(img)
        if result is None:
            os.remove(photo_path)
            return jsonify({
                'success': False,
                'message': 'No face detected in photo'
            }), 400
        
        face_encoding, (x, y, w, h) = result
        
        # Check for duplicate faces (with more lenient tolerance)
        duplicate_found = False
        duplicate_student_id = None
        for i, encoding in enumerate(student_data['embeddings']):
            if compare_faces(encoding, face_encoding, tolerance=40000):  # Improved tolerance
                duplicate_found = True
                duplicate_student_id = student_data["student_ids"][i]
                break
        
        if duplicate_found and not force_enroll:
            # Still save the processed face image for debugging
            face_img = img[y:y+h, x:x+w]
            face_img_resized = cv2.resize(face_img, (200, 200))
            face_path = os.path.join(PROCESSED_FACES, f'{student_id}_duplicate.jpg')
            cv2.imwrite(face_path, face_img_resized)
            
            os.remove(photo_path)
            return jsonify({
                'success': False,
                'message': f'Face similar to student ID: {duplicate_student_id}. Use force_enroll=true to override this check.'
            }), 400
        
        # Check if student ID already exists and remove old entry
        if student_id in student_data['student_ids']:
            # Remove existing entry for this student ID
            old_index = student_data['student_ids'].index(student_id)
            student_data['embeddings'].pop(old_index)
            student_data['student_ids'].pop(old_index)
            print(f"Removed existing enrollment for student {student_id}")
        
        # Save face encoding and student ID
        student_data['embeddings'].append(face_encoding)
        student_data['student_ids'].append(student_id)
        save_student_data(student_data)
        
        # Save processed face image (resize to standard size for consistency)
        face_img = img[y:y+h, x:x+w]
        face_img_resized = cv2.resize(face_img, (200, 200))  # Standard size
        face_path = os.path.join(PROCESSED_FACES, f'{student_id}.jpg')
        cv2.imwrite(face_path, face_img_resized)
        
        print(f"Processed face saved to: {face_path}")
        
        # Clean up uploaded file
        os.remove(photo_path)
        
        return jsonify({
            'success': True,
            'message': 'Face enrolled successfully'
        })
            
    except Exception as e:
        # Clean up on error
        if os.path.exists(photo_path):
            os.remove(photo_path)
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/api/attendance/live')
def video_feed():
    def generate_frames():
        print("Attempting to open camera...")
        camera = cv2.VideoCapture(0)
        if not camera.isOpened():
            print("Failed to open camera!")
            return b''
        
        print("Camera opened successfully!")
        while True:
            success, frame = camera.read()
            if not success:
                print("Failed to read frame from camera")
                break
            
            # Use the improved face detection for live video
            face_encodings = get_all_face_encodings(frame)
            
            # Process each detected face
            for face_data in face_encodings:
                face_encoding = face_data['encoding']
                coordinates = face_data['coordinates']
                x, y, w, h = coordinates
                
                # Find the best match with confidence scoring
                best_match = None
                best_confidence = 0.0
                best_distance = float('inf')
                
                for i, encoding in enumerate(student_data['embeddings']):
                    distance = np.linalg.norm(encoding - face_encoding)
                    confidence = get_face_confidence(encoding, face_encoding)
                    
                    # Find the match with the smallest distance (best match)
                    if distance < best_distance and distance < 30000:  # Only consider reasonable matches
                        best_distance = distance
                        best_confidence = confidence
                        best_match = {
                            'student_id': student_data['student_ids'][i],
                            'confidence': confidence
                        }
                
                # Only show recognition if confidence is high enough
                if best_match and best_confidence >= 0.4:
                    # Draw green rectangle and student ID
                    cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                    label = f"{best_match['student_id']} ({best_confidence:.2f})"
                    cv2.putText(frame, label, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 
                              0.7, (0, 255, 0), 2)
                else:
                    # Draw red rectangle for unrecognized faces
                    cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 0, 255), 2)
            
            # Convert frame to JPEG
            ret, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        
        # Make sure to release the camera
        camera.release()
        print("Camera released")
    
    return Response(generate_frames(),
                   mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/enroll-from-camera', methods=['POST'])
def enroll_from_camera():
    """Enroll a student from the current camera frame"""
    if 'photo' not in request.files:
        return jsonify({
            'success': False,
            'message': 'No photo file provided'
        }), 400
    
    photo = request.files['photo']
    student_id = request.form.get('student_id')
    
    if not student_id:
        return jsonify({
            'success': False,
            'message': 'No student ID provided'
        }), 400
    
    if photo.filename == '':
        return jsonify({
            'success': False,
            'message': 'No photo selected'
        }), 400
    
    try:
        # Read image file
        img = Image.open(photo.stream)
        img_array = np.array(img)
        img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        
        print(f"Enrolling student {student_id} from camera frame of size: {img_cv.shape}")
        
        # Get all face encodings
        face_encodings = get_all_face_encodings(img_cv)
        if not face_encodings:
            return jsonify({
                'success': False,
                'message': 'No faces detected in camera frame'
            }), 400
        
        # Use the largest face for enrollment
        largest_face = max(face_encodings, key=lambda f: f['coordinates'][2] * f['coordinates'][3])
        face_encoding = largest_face['encoding']
        coordinates = largest_face['coordinates']
        
        print(f"Using largest face at coordinates {coordinates} for enrollment")
        
        # Check for duplicate faces
        for i, encoding in enumerate(student_data['embeddings']):
            if compare_faces(encoding, face_encoding):
                return jsonify({
                    'success': False,
                    'message': f'Face already registered with student ID: {student_data["student_ids"][i]}'
                }), 400
        
        # Save face encoding and student ID
        student_data['embeddings'].append(face_encoding)
        student_data['student_ids'].append(student_id)
        save_student_data(student_data)
        
        print(f"Successfully enrolled student {student_id}")
        
        return jsonify({
            'success': True,
            'message': f'Student {student_id} enrolled successfully from camera frame',
            'faces_detected': len(face_encodings),
            'enrollment_face_coordinates': {
                'x': int(coordinates[0]),
                'y': int(coordinates[1]),
                'w': int(coordinates[2]),
                'h': int(coordinates[3])
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/test-face-detection', methods=['POST'])
def test_face_detection():
    """Test endpoint to check if faces can be detected in an image"""
    if 'photo' not in request.files:
        return jsonify({
            'success': False,
            'message': 'No photo file provided'
        }), 400
    
    photo = request.files['photo']
    
    if photo.filename == '':
        return jsonify({
            'success': False,
            'message': 'No photo selected'
        }), 400
    
    try:
        # Read image file
        img = Image.open(photo.stream)
        img_array = np.array(img)
        img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        
        print(f"Testing face detection on image of size: {img_cv.shape}")
        
        # Get face encoding
        result = get_face_encoding(img_cv)
        if result is None:
            return jsonify({
                'success': False,
                'message': 'No face detected in photo',
                'image_size': img_cv.shape
            }), 400
        
        face_encoding, (x, y, w, h) = result
        
        return jsonify({
            'success': True,
            'message': 'Face detected successfully',
            'image_size': img_cv.shape,
            'face_coordinates': {'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)},
            'face_encoding_size': len(face_encoding)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/verify', methods=['POST'])
def verify_face():
    if 'photo' not in request.files:
        return jsonify({
            'success': False,
            'message': 'No photo file provided'
        }), 400
    
    photo = request.files['photo']
    
    if photo.filename == '':
        return jsonify({
            'success': False,
            'message': 'No photo selected'
        }), 400
    
    try:
        # Read image file
        img = Image.open(photo.stream)
        img_array = np.array(img)
        img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        
        print(f"Processing image of size: {img_cv.shape}")
        print(f"Number of enrolled students: {len(student_data['embeddings'])}")
        
        # Get all face encodings
        face_encodings = get_all_face_encodings(img_cv)
        if not face_encodings:
            return jsonify({
                'success': False,
                'message': 'No faces detected in photo'
            }), 400
        
        print(f"Processing {len(face_encodings)} faces for recognition")
        
        # Process ALL faces, not just the largest one
        all_recognized = []
        
        for face_idx, face_data in enumerate(face_encodings):
            face_encoding = face_data['encoding']
            coordinates = face_data['coordinates']
            
            print(f"\nProcessing face {face_idx + 1} at coordinates {coordinates}")
            
            # Find the best match for this face
            best_match = None
            best_distance = float('inf')
            
            for i, encoding in enumerate(student_data['embeddings']):
                distance = np.linalg.norm(encoding - face_encoding)
                confidence = get_face_confidence(encoding, face_encoding)
                
                print(f"  Student {student_data['student_ids'][i]}: distance={distance:.2f}, confidence={confidence:.3f}")
                
                # Find the match with the smallest distance (best match)
                if distance < best_distance and distance < 30000:  # Only consider reasonable matches
                    best_distance = distance
                    best_match = {
                        'student_id': student_data['student_ids'][i],
                        'confidence': confidence,
                        'distance': distance,
                        'face_coordinates': {
                            'x': int(coordinates[0]),
                            'y': int(coordinates[1]),
                            'w': int(coordinates[2]),
                            'h': int(coordinates[3])
                        }
                    }
                    print(f"    → New best match: {student_data['student_ids'][i]} (distance: {distance:.2f})")
            
            # Add this face's best match if it's good enough
            if best_match and best_match['confidence'] >= 0.4:
                all_recognized.append(best_match)
                print(f"✅ Face {face_idx + 1} recognized as: {best_match['student_id']} with confidence {best_match['confidence']:.3f}")
            else:
                print(f"❌ Face {face_idx + 1}: No good match found (best distance: {best_distance:.2f})")
        
        # Remove duplicates (same student recognized multiple times)
        unique_recognized = []
        seen_student_ids = set()
        for rec in all_recognized:
            if rec['student_id'] not in seen_student_ids:
                unique_recognized.append(rec)
                seen_student_ids.add(rec['student_id'])
        
        if unique_recognized:
            result = {
                'success': True,
                'recognized': unique_recognized,
                'total_faces_detected': len(face_encodings),
                'total_students_recognized': len(unique_recognized)
            }
        else:
            result = {
                'success': False,
                'message': f'No faces recognized in photo (detected {len(face_encodings)} faces)'
            }
        
        print(f"Verification result: {result}")
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)