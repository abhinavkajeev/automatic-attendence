from flask import Flask, request, jsonify, Response, send_file
import os
import cv2
import numpy as np
from PIL import Image
import io
import pickle
from datetime import datetime
from flask_cors import CORS

# Try to import face_recognition, but continue without it if not available
try:
    import face_recognition
    FACE_RECOGNITION_AVAILABLE = True
    print("Face recognition library loaded successfully")
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    print("Warning: face_recognition library not available. Some features will be limited.")

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Configure storage
UPLOAD_FOLDER = 'uploads'
EMBEDDINGS_FILE = 'student_embeddings.pkl'
PROCESSED_FACES = 'processed_faces'
STUDENTS_UPLOAD_DIR = os.path.join(UPLOAD_FOLDER, 'students')

# Create necessary directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FACES, exist_ok=True)
os.makedirs(STUDENTS_UPLOAD_DIR, exist_ok=True)

def load_student_data():
    if os.path.exists(EMBEDDINGS_FILE):
        with open(EMBEDDINGS_FILE, 'rb') as f:
            return pickle.load(f)
    return {
        'encodings': [],
        'student_ids': []
    }

def save_student_data(data):
    with open(EMBEDDINGS_FILE, 'wb') as f:
        pickle.dump(data, f)

# Load student data
student_data = load_student_data()

def get_face_encoding_opencv(image):
    """Simple face detection using OpenCV as fallback"""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Load OpenCV's face detector
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    
    if len(faces) == 0:
        print(f"No faces detected in image of size: {image.shape}")
        return None
    
    print(f"Detected {len(faces)} faces using OpenCV")
    
    # Take the first (largest) face
    x, y, w, h = faces[0]
    face_roi = image[y:y+h, x:x+w]
    
    # Create a simple "encoding" by resizing and flattening the face
    # This is much less accurate than face_recognition but allows basic functionality
    face_resized = cv2.resize(face_roi, (128, 128))
    encoding = face_resized.flatten().astype(np.float32)
    
    return encoding, (y, x+w, y+h, x)  # Convert to (top, right, bottom, left) format

def get_face_encoding_proper(image):
    """Get face encoding using face_recognition library if available, OpenCV as fallback"""
    if FACE_RECOGNITION_AVAILABLE:
        # Convert BGR to RGB (OpenCV uses BGR, face_recognition uses RGB)
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Find face locations
        face_locations = face_recognition.face_locations(rgb_image, model='hog')
        
        if len(face_locations) == 0:
            print(f"No faces detected in image of size: {image.shape}")
            return None
        
        print(f"Detected {len(face_locations)} faces")
        
        # Get face encodings
        face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
        
        if len(face_encodings) == 0:
            return None
        
        # Return the first face (or you could return the largest)
        return face_encodings[0], face_locations[0]
    else:
        # Fallback to OpenCV face detection (basic)
        return get_face_encoding_opencv(image)

def get_all_face_encodings_proper(image):
    """Get encodings for all faces using face_recognition library if available"""
    if FACE_RECOGNITION_AVAILABLE:
        # Convert BGR to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Find face locations
        face_locations = face_recognition.face_locations(rgb_image, model='hog')
        
        if len(face_locations) == 0:
            print(f"No faces detected in image of size: {image.shape}")
            return []
        
        print(f"Detected {len(face_locations)} faces")
        
        # Get face encodings
        face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
        
        result = []
        for encoding, location in zip(face_encodings, face_locations):
            # face_recognition returns (top, right, bottom, left)
            top, right, bottom, left = location
            # Convert to (x, y, w, h) format for consistency
            x, y, w, h = left, top, right - left, bottom - top
            
            result.append({
                'encoding': encoding,
                'coordinates': (x, y, w, h)
            })
        
        return result
    else:
        # Fallback to OpenCV
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        result = []
        for (x, y, w, h) in faces:
            face_roi = image[y:y+h, x:x+w]
            face_resized = cv2.resize(face_roi, (128, 128))
            encoding = face_resized.flatten().astype(np.float32)
            
            result.append({
                'encoding': encoding,
                'coordinates': (x, y, w, h)
            })
        
        return result

def compare_faces_proper(known_encoding, face_encoding, tolerance=0.6):
    """Compare faces using face_recognition library if available
    
    Args:
        known_encoding: Known face encoding
        face_encoding: Face encoding to compare
        tolerance: Distance threshold (default 0.6, lower = stricter)
    
    Returns:
        bool: True if faces match
    """
    if FACE_RECOGNITION_AVAILABLE:
        # Calculate face distance
        distance = face_recognition.face_distance([known_encoding], face_encoding)[0]
        print(f"Face distance: {distance:.4f}, tolerance: {tolerance}")
        
        return distance <= tolerance
    else:
        # Simple comparison using numpy correlation for OpenCV fallback
        known_encoding = np.array(known_encoding, dtype=np.float32)
        face_encoding = np.array(face_encoding, dtype=np.float32)
        
        # Normalize the encodings
        known_norm = known_encoding / (np.linalg.norm(known_encoding) + 1e-7)
        face_norm = face_encoding / (np.linalg.norm(face_encoding) + 1e-7)
        
        # Calculate similarity using dot product
        similarity = np.dot(known_norm, face_norm)
        # For OpenCV fallback, use different thresholds based on tolerance parameter
        # Lower tolerance means we need higher similarity to match
        if tolerance <= 0.4:  # For duplicate detection (ULTRA strict matching)
            opencv_threshold = 0.99  # Require 99% similarity for duplicates (nearly identical)
        else:  # For recognition (normal matching)  
            opencv_threshold = 0.75  # Higher threshold for better recognition accuracy
        print(f"OpenCV similarity: {similarity:.4f}, threshold: {opencv_threshold} (tolerance: {tolerance})")
        
        return similarity > opencv_threshold

def get_face_confidence_proper(known_encoding, face_encoding):
    """Calculate confidence score (0-1) based on face distance"""
    if FACE_RECOGNITION_AVAILABLE:
        # Calculate face distance
        distance = face_recognition.face_distance([known_encoding], face_encoding)[0]
        
        # Convert distance to confidence
        if distance > 1.0:
            return 0.0
        elif distance < 0.4:
            return 1.0
        else:
            confidence = 1.0 - ((distance - 0.4) / 0.6)
            return max(0.0, min(1.0, confidence))
    else:
        # OpenCV fallback confidence calculation
        known_encoding = np.array(known_encoding, dtype=np.float32)
        face_encoding = np.array(face_encoding, dtype=np.float32)
        
        known_norm = known_encoding / (np.linalg.norm(known_encoding) + 1e-7)
        face_norm = face_encoding / (np.linalg.norm(face_encoding) + 1e-7)
        
        similarity = np.dot(known_norm, face_norm)
        # Convert similarity to confidence (0-1 range)
        return max(0.0, min(1.0, similarity))

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
        
        # Get face encoding using improved face_recognition library
        result = get_face_encoding_proper(img)
        if result is None:
            os.remove(photo_path)
            return jsonify({
                'success': False,
                'message': 'No face detected in photo'
            }), 400
        
        face_encoding, face_location = result
        # face_recognition returns (top, right, bottom, left)
        top, right, bottom, left = face_location
        x, y, w, h = left, top, right - left, bottom - top
        
        # Check for duplicate faces with a higher threshold (more strict)
        duplicate_found = False
        duplicate_student_id = None
        for i, encoding in enumerate(student_data['encodings']):
            if compare_faces_proper(encoding, face_encoding, tolerance=0.4):  # Lower tolerance = higher similarity required
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
            student_data['encodings'].pop(old_index)
            student_data['student_ids'].pop(old_index)
            print(f"Removed existing enrollment for student {student_id}")
        
        # Save face encoding and student ID
        student_data['encodings'].append(face_encoding)
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
            face_encodings = get_all_face_encodings_proper(frame)
            
            # Process each detected face
            for face_data in face_encodings:
                face_encoding = face_data['encoding']
                coordinates = face_data['coordinates']
                x, y, w, h = coordinates
                
                # Find the best match with confidence scoring
                best_match = None
                best_confidence = 0.0
                best_distance = float('inf')
                
                for i, encoding in enumerate(student_data['encodings']):
                    # Use the proper helper function that handles fallback
                    confidence = get_face_confidence_proper(encoding, face_encoding)
                    is_match = compare_faces_proper(encoding, face_encoding, tolerance=0.6)
                    
                    # For live video, use confidence-based matching
                    if is_match and confidence > best_confidence:
                        best_confidence = confidence
                        best_match = {
                            'student_id': student_data['student_ids'][i],
                            'confidence': confidence
                        }
                
                # Only show recognition if confidence is high enough (50% threshold)
                if best_match and best_confidence >= 0.5:
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
        
        # Get all face encodings using improved face_recognition library
        face_encodings = get_all_face_encodings_proper(img_cv)
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
        
        # Check for duplicate faces with a higher threshold (more strict)
        for i, encoding in enumerate(student_data['encodings']):
            if compare_faces_proper(encoding, face_encoding, tolerance=0.4):  # Lower tolerance = higher similarity required
                return jsonify({
                    'success': False,
                    'message': f'Face already registered with student ID: {student_data["student_ids"][i]}'
                }), 400
        
        # Save face encoding and student ID
        student_data['encodings'].append(face_encoding)
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
        
        # Get face encoding using improved face_recognition library
        result = get_face_encoding_proper(img_cv)
        if result is None:
            return jsonify({
                'success': False,
                'message': 'No face detected in photo',
                'image_size': img_cv.shape
            }), 400
        
        face_encoding, face_location = result
        # face_recognition returns (top, right, bottom, left)
        top, right, bottom, left = face_location
        x, y, w, h = left, top, right - left, bottom - top
        
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
        print(f"Number of enrolled students: {len(student_data['encodings'])}")
        
        # Get all face encodings using improved face_recognition library
        face_encodings = get_all_face_encodings_proper(img_cv)
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
            best_confidence = 0.0  # Track best confidence instead of distance
            
            for i, encoding in enumerate(student_data['encodings']):
                # Use the proper helper functions that handle fallback
                confidence = get_face_confidence_proper(encoding, face_encoding)
                is_match = compare_faces_proper(encoding, face_encoding, tolerance=0.6)
                
                print(f"  Student {student_data['student_ids'][i]}: confidence={confidence:.3f}, match={is_match}")
                
                # Find the best match with highest confidence
                if is_match and confidence > best_confidence:
                    best_confidence = confidence
                    best_match = {
                        'student_id': student_data['student_ids'][i],
                        'confidence': confidence,
                        'face_coordinates': {
                            'x': int(coordinates[0]),
                            'y': int(coordinates[1]),
                            'w': int(coordinates[2]),
                            'h': int(coordinates[3])
                        }
                    }
                    print(f"    → New best match: {student_data['student_ids'][i]} (confidence: {confidence:.4f})")
            
            # Add this face's best match if it's good enough (50% confidence threshold)
            if best_match and best_match['confidence'] >= 0.5:
                all_recognized.append(best_match)
                print(f"✅ Face {face_idx + 1} recognized as: {best_match['student_id']} with confidence {best_match['confidence']:.3f}")
            else:
                print(f"❌ Face {face_idx + 1}: No good match found (best confidence: {best_confidence:.4f})")
        
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

@app.route('/delete-student', methods=['POST'])
def delete_student():
    """Delete a student's face data and associated files"""
    try:
        data = request.get_json()
        student_id = data.get('student_id')
        
        if not student_id:
            return jsonify({
                'success': False,
                'message': 'Student ID is required'
            }), 400
        
        print(f"Deleting student {student_id} from face recognition system...")
        
        # Find and remove student from embeddings
        student_found = False
        if student_id in student_data['student_ids']:
            # Get the index of the student
            student_index = student_data['student_ids'].index(student_id)
            
            # Remove from both lists
            student_data['encodings'].pop(student_index)
            student_data['student_ids'].pop(student_index)
            
            # Save updated data
            save_student_data(student_data)
            student_found = True
            
            print(f"Removed student {student_id} from embeddings")
        
        # Delete associated image files
        files_deleted = []
        
        # Delete from uploads/students directory
        upload_path = os.path.join(UPLOAD_FOLDER, 'students', f'{student_id}.jpg')
        if os.path.exists(upload_path):
            os.remove(upload_path)
            files_deleted.append(upload_path)
            print(f"Deleted upload file: {upload_path}")
        
        # Delete from processed_faces directory
        processed_path = os.path.join(PROCESSED_FACES, f'{student_id}.jpg')
        if os.path.exists(processed_path):
            os.remove(processed_path)
            files_deleted.append(processed_path)
            print(f"Deleted processed file: {processed_path}")
        
        # Also check for any files with the student ID in the name (in case of different extensions)
        for directory in [UPLOAD_FOLDER, PROCESSED_FACES]:
            for filename in os.listdir(directory):
                if filename.startswith(f'{student_id}_') or filename.startswith(f'{student_id}.'):
                    file_path = os.path.join(directory, filename)
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        files_deleted.append(file_path)
                        print(f"Deleted additional file: {file_path}")
        
        return jsonify({
            'success': True,
            'message': f'Student {student_id} deleted successfully',
            'student_found_in_embeddings': student_found,
            'files_deleted': files_deleted,
            'files_deleted_count': len(files_deleted)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/debug-embeddings', methods=['GET'])
def debug_embeddings():
    """Debug endpoint to check current embeddings and student IDs"""
    try:
        return jsonify({
            'success': True,
            'student_ids': student_data['student_ids'],
            'encodings_count': len(student_data['encodings']),
            'message': f'Found {len(student_data["student_ids"])} students in face recognition system'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/update-student-id', methods=['POST'])
def update_student_id():
    """Update a student ID in the face recognition system"""
    try:
        data = request.get_json()
        old_id = data.get('old_id')
        new_id = data.get('new_id')
        
        if not old_id or not new_id:
            return jsonify({
                'success': False,
                'message': 'Both old_id and new_id are required'
            }), 400
        
        if old_id not in student_data['student_ids']:
            return jsonify({
                'success': False,
                'message': f'Student {old_id} not found in face recognition system'
            }), 404
        
        # Update the student ID
        index = student_data['student_ids'].index(old_id)
        student_data['student_ids'][index] = new_id
        
        # Save updated data
        save_student_data(student_data)
        
        print(f"Updated student ID from {old_id} to {new_id}")
        
        return jsonify({
            'success': True,
            'message': f'Updated student ID from {old_id} to {new_id}',
            'old_id': old_id,
            'new_id': new_id
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

def process_student_images_from_uploads():
    """Process all student images from uploads/students folder and enroll them"""
    students_upload_dir = os.path.join(UPLOAD_FOLDER, 'students')
    
    if not os.path.exists(students_upload_dir):
        print("No uploads/students directory found")
        return
    
    print(f"Processing student images from {students_upload_dir}...")
    
    # Get all image files from uploads/students directory
    image_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
    upload_files = []
    
    for filename in os.listdir(students_upload_dir):
        file_ext = os.path.splitext(filename)[1].lower()
        if file_ext in image_extensions:
            upload_files.append(filename)
    
    # Get all processed files from processed_faces directory
    processed_files = []
    if os.path.exists(PROCESSED_FACES):
        for filename in os.listdir(PROCESSED_FACES):
            file_ext = os.path.splitext(filename)[1].lower()
            if file_ext in image_extensions:
                processed_files.append(filename)
    
    print(f"Found {len(upload_files)} upload files: {upload_files}")
    print(f"Found {len(processed_files)} processed files: {processed_files}")
    
    # Compare and find files that need processing
    files_to_process = []
    for upload_file in upload_files:
        # Extract student ID (filename without extension)
        student_id = os.path.splitext(upload_file)[0]
        
        # Check if corresponding processed file exists
        processed_file_exists = any(
            os.path.splitext(processed_file)[0] == student_id 
            for processed_file in processed_files
        )
        
        if not processed_file_exists:
            files_to_process.append(upload_file)
            print(f"  → {upload_file} needs processing (no matching processed file)")
        else:
            print(f"  → {upload_file} already processed (skipping)")
    
    print(f"\nFiles needing processing: {files_to_process}")
    
    processed_count = 0
    skipped_count = len(upload_files) - len(files_to_process)  # Files already processed
    error_count = 0
    
    for filename in files_to_process:
        try:
            # Extract student ID from filename (remove extension)
            student_id = os.path.splitext(filename)[0]
            image_path = os.path.join(students_upload_dir, filename)
            
            print(f"\nProcessing {filename} for student ID: {student_id}")
            
            # Check if student is already enrolled in face recognition system
            if student_id in student_data['student_ids']:
                print(f"  → Student {student_id} already enrolled in face recognition system, skipping...")
                skipped_count += 1
                continue
            
            # Read and process the image
            img = cv2.imread(image_path)
            if img is None:
                print(f"  → Error: Could not read image {filename}")
                error_count += 1
                continue
            
            # Get face encoding
            result = get_face_encoding_proper(img)
            if result is None:
                print(f"  → Error: No face detected in {filename}")
                error_count += 1
                continue
            
            face_encoding, face_location = result
            
            # Convert face_location to coordinates
            if FACE_RECOGNITION_AVAILABLE:
                # face_recognition returns (top, right, bottom, left)
                top, right, bottom, left = face_location
                x, y, w, h = left, top, right - left, bottom - top
            else:
                # OpenCV format (top, right, bottom, left)
                top, right, bottom, left = face_location
                x, y, w, h = left, top, right - left, bottom - top
            
            # Check for duplicate faces with a higher threshold (more strict)
            duplicate_found = False
            duplicate_student_id = None
            for i, encoding in enumerate(student_data['encodings']):
                # Use a higher threshold for duplicate detection (0.95 = 95% similarity required)
                if compare_faces_proper(encoding, face_encoding, tolerance=0.4):  # Lower tolerance = higher similarity required
                    duplicate_found = True
                    duplicate_student_id = student_data["student_ids"][i]
                    print(f"  → Warning: Face matches existing student {duplicate_student_id}")
                    break
            
            if duplicate_found:
                print(f"  → Skipping {student_id} due to duplicate face (matches {duplicate_student_id})")
                skipped_count += 1
                continue
            
            # Enroll the student
            student_data['encodings'].append(face_encoding)
            student_data['student_ids'].append(student_id)
            
            # Save processed face image
            face_img = img[y:y+h, x:x+w]
            face_img_resized = cv2.resize(face_img, (200, 200))
            face_path = os.path.join(PROCESSED_FACES, f'{student_id}.jpg')
            cv2.imwrite(face_path, face_img_resized)
            
            print(f"  ✅ Successfully enrolled student {student_id}")
            processed_count += 1
            
        except Exception as e:
            print(f"  → Error processing {filename}: {str(e)}")
            error_count += 1
    
    # Save updated student data
    if processed_count > 0:
        save_student_data(student_data)
        print(f"\n📊 Processing Summary:")
        print(f"   • Successfully processed: {processed_count}")
        print(f"   • Skipped (already enrolled): {skipped_count}")
        print(f"   • Errors: {error_count}")
        print(f"   • Total students now enrolled: {len(student_data['student_ids'])}")
    else:
        print(f"\n📊 No new students were enrolled.")
        print(f"   • Skipped: {skipped_count}")
        print(f"   • Errors: {error_count}")

@app.route('/process-uploads', methods=['POST'])
def process_uploads_endpoint():
    """API endpoint to process all student images from uploads/students folder"""
    try:
        # Store current state
        initial_count = len(student_data['student_ids'])
        
        # Process the images
        process_student_images_from_uploads()
        
        # Calculate results
        final_count = len(student_data['student_ids'])
        newly_enrolled = final_count - initial_count
        
        return jsonify({
            'success': True,
            'message': 'Student images processed successfully',
            'initial_enrolled_count': initial_count,
            'final_enrolled_count': final_count,
            'newly_enrolled': newly_enrolled,
            'current_students': student_data['student_ids']
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error processing uploads: {str(e)}'
        }), 500

@app.route('/re-process-all', methods=['POST'])
def reprocess_all_uploads():
    """Re-process all images, including already enrolled ones (with force option)"""
    try:
        force_reprocess = request.json.get('force', False) if request.json else False
        
        if force_reprocess:
            # Clear existing data
            student_data['encodings'] = []
            student_data['student_ids'] = []
            print("🔄 Force reprocessing: Cleared existing enrollment data")
        
        # Store current state
        initial_count = len(student_data['student_ids'])
        
        # Process the images
        process_student_images_from_uploads()
        
        # Calculate results
        final_count = len(student_data['student_ids'])
        newly_enrolled = final_count - initial_count
        
        return jsonify({
            'success': True,
            'message': 'All student images reprocessed successfully',
            'force_reprocess': force_reprocess,
            'initial_enrolled_count': initial_count,
            'final_enrolled_count': final_count,
            'newly_enrolled': newly_enrolled,
            'current_students': student_data['student_ids']
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error reprocessing uploads: {str(e)}'
        }), 500

if __name__ == '__main__':
    print("🚀 Starting CV Engine Server...")
    
    # Process existing student images on startup
    print("\n📸 Auto-processing student images from uploads/students...")
    process_student_images_from_uploads()
    
    print(f"\n🌟 CV Engine Server ready with {len(student_data['student_ids'])} enrolled students")
    print("Available endpoints:")
    print("  • GET  /health - Health check")
    print("  • POST /enroll - Enroll new student")
    print("  • POST /verify - Verify/recognize faces")
    print("  • POST /delete-student - Delete student enrollment")
    print("  • POST /process-uploads - Process images from uploads/students")
    print("  • POST /re-process-all - Re-process all images (use {\"force\": true} to clear existing)")
    print("  • GET  /debug-embeddings - Debug enrollment data")
    
    app.run(host='0.0.0.0', port=5001)