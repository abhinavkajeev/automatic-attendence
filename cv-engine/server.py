from flask import Flask, request, jsonify, Response, send_file
import os
import cv2
import numpy as np
from PIL import Image
import io
import pickle
from datetime import datetime
from flask_cors import CORS
import face_recognition

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
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FACES, exist_ok=True)

def load_student_data():
    if os.path.exists(EMBEDDINGS_FILE):
        with open(EMBEDDINGS_FILE, 'rb') as f:
            data = pickle.load(f)
            # Handle both old and new key formats for backward compatibility
            if 'encodings' in data:
                return {
                    'embeddings': data['encodings'],
                    'student_ids': data['student_ids']
                }
            return data
    return {
        'encodings': [],
        'student_ids': []
    }

def save_student_data(data):
    with open(EMBEDDINGS_FILE, 'wb') as f:
        pickle.dump(data, f)

# Load student data
student_data = load_student_data()

def validate_encoding_shape(encoding):
    """Validate that the encoding has the correct shape for face_recognition (128 dimensions)"""
    if encoding is None:
        return False
    
    # Convert to numpy array if it isn't already
    if not isinstance(encoding, np.ndarray):
        encoding = np.array(encoding)
    
    # Check if it's the correct shape (128 dimensions for face_recognition)
    return encoding.shape == (128,)

def validate_and_clean_student_data():
    """Remove any student data with invalid encoding shapes"""
    global student_data
    
    valid_embeddings = []
    valid_student_ids = []
    
    for i, (student_id, encoding) in enumerate(zip(student_data['student_ids'], student_data['embeddings'])):
        if validate_encoding_shape(encoding):
            valid_embeddings.append(encoding)
            valid_student_ids.append(student_id)
        else:
            print(f"⚠️  Removing invalid encoding for student {student_id} (shape: {np.array(encoding).shape})")
    
    # Update the global student data
    student_data['embeddings'] = valid_embeddings
    student_data['student_ids'] = valid_student_ids
    
    if len(valid_embeddings) != len(student_data['embeddings']):
        print(f"Cleaned student data: {len(valid_embeddings)} valid encodings kept")
        save_student_data(student_data)

# Clean up any invalid encodings on startup
validate_and_clean_student_data()

def get_face_encoding(image):
    """Get face encoding using face_recognition library - returns largest face only"""
    # Convert BGR to RGB for face_recognition library
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Find face locations
    face_locations = face_recognition.face_locations(rgb_image)
    
    if not face_locations:
        print(f"No faces detected in image of size: {image.shape}")
        return None
    
    print(f"Detected {len(face_locations)} faces")
    
    # Get the largest face
    largest_face = max(face_locations, key=lambda loc: (loc[2] - loc[0]) * (loc[1] - loc[3]))
    top, right, bottom, left = largest_face
    
    print(f"Largest face: top={top}, right={right}, bottom={bottom}, left={left}")
    
    # Get face encoding using face_recognition
    face_encodings = face_recognition.face_encodings(rgb_image, [largest_face])
    
    if not face_encodings:
        print("Failed to generate face encoding")
        return None
    
    face_encoding = face_encodings[0]
    
    # Convert face_recognition location format to OpenCV format for consistency
    x, y, w, h = left, top, right - left, bottom - top
    
    return face_encoding, (x, y, w, h)

def get_all_face_encodings(image):
    """Get encodings for all faces in the image using face_recognition library"""
    # Convert BGR to RGB for face_recognition library
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Find face locations
    face_locations = face_recognition.face_locations(rgb_image)
    
    if not face_locations:
        print(f"No faces detected in image of size: {image.shape}")
        return []
    
    print(f"Raw detection: {len(face_locations)} faces found")
    
    # Filter out faces that are too small or too large
    valid_faces = []
    for i, (top, right, bottom, left) in enumerate(face_locations):
        # Calculate face dimensions
        w = right - left
        h = bottom - top
        face_area = w * h
        image_area = image.shape[0] * image.shape[1]
        face_ratio = face_area / image_area
        
        if face_ratio < 0.01 or face_ratio > 0.5:  # Face should be 1-50% of image
            print(f"Face {i+1} rejected: size ratio {face_ratio:.3f} (too small/large)")
            continue
        
        # Check for overlapping faces (remove duplicates)
        is_duplicate = False
        for valid_face in valid_faces:
            v_top, v_right, v_bottom, v_left = valid_face['location']
            # Calculate overlap
            overlap_left = max(left, v_left)
            overlap_top = max(top, v_top)
            overlap_right = min(right, v_right)
            overlap_bottom = min(bottom, v_bottom)
            
            if overlap_left < overlap_right and overlap_top < overlap_bottom:
                overlap_area = (overlap_right - overlap_left) * (overlap_bottom - overlap_top)
                face_area1 = w * h
                face_area2 = (v_right - v_left) * (v_bottom - v_top)
                
                if overlap_area > 0.3 * min(face_area1, face_area2):  # 30% overlap threshold
                    print(f"Face {i+1} rejected: overlaps with existing face")
                    is_duplicate = True
                    break
        
        if not is_duplicate:
            valid_faces.append({
                'location': (top, right, bottom, left),
                'coordinates': (left, top, w, h),  # Convert to OpenCV format
                'area': face_area,
                'ratio': face_ratio
            })
            print(f"Face {i+1} accepted: x={left}, y={top}, w={w}, h={h}, ratio={face_ratio:.3f}")
    
    print(f"After filtering: {len(valid_faces)} valid faces")
    
    # Generate encodings for valid faces
    face_encodings = []
    if valid_faces:
        # Get all face encodings at once for efficiency
        face_locations_list = [face['location'] for face in valid_faces]
        encodings = face_recognition.face_encodings(rgb_image, face_locations_list)
        
        for i, (face_data, encoding) in enumerate(zip(valid_faces, encodings)):
            x, y, w, h = face_data['coordinates']
            print(f"Processing valid face {i+1}: x={x}, y={y}, w={w}, h={h}")
            
            face_encodings.append({
                'encoding': encoding,
                'coordinates': (x, y, w, h)
            })
    
    return result

def compare_faces(known_encoding, face_encoding, tolerance=0.6):
    """Improved face comparison using face_recognition library"""
    if known_encoding is None or face_encoding is None:
        return False
    
    # Check if encodings are valid
    if len(known_encoding) != len(face_encoding):
        print(f"Encoding length mismatch: {len(known_encoding)} vs {len(face_encoding)}")
        return False
    
    # Use face_recognition's compare_faces function
    matches = face_recognition.compare_faces([known_encoding], face_encoding, tolerance=tolerance)
    
    # Calculate distance for logging
    dist = face_recognition.face_distance([known_encoding], face_encoding)[0]
    print(f"Face distance: {dist:.3f}, tolerance: {tolerance}, match: {matches[0]}")
    
    # Check for identical encodings (distance very close to 0)
    if dist < 0.01:
        print("⚠️  WARNING: Face encodings are nearly identical!")
        return False  # Reject nearly identical faces
    
    return matches[0]

def get_face_confidence(known_encoding, face_encoding):
    """Calculate confidence score based on face distance using face_recognition"""
    if known_encoding is None or face_encoding is None:
        return 0.0
    
    if len(known_encoding) != len(face_encoding):
        return 0.0
    
    # Calculate face distance using face_recognition
    dist = face_recognition.face_distance([known_encoding], face_encoding)[0]
    
    # Convert distance to confidence (lower distance = higher confidence)
    # face_recognition distances typically range from 0.0 to 1.0+
    # Good matches are usually < 0.6
    if dist > 1.0:
        return 0.0
    elif dist < 0.4:
        return 1.0 - (dist / 0.4) * 0.2  # Map 0.0-0.4 to 1.0-0.8
    else:
        return max(0.0, 1.0 - dist)  # Map 0.4-1.0 to 0.6-0.0

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
        
        # Check for duplicate faces (with face_recognition tolerance)
        duplicate_found = False
        duplicate_student_id = None
        for i, encoding in enumerate(student_data['embeddings']):
            if compare_faces(encoding, face_encoding, tolerance=0.6):  # Standard face_recognition tolerance
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
                
                for i, encoding in enumerate(student_data['embeddings']):
                    distance = face_recognition.face_distance([encoding], face_encoding)[0]
                    confidence = get_face_confidence(encoding, face_encoding)
                    
                    # Find the match with the smallest distance (best match)
                    if distance < best_distance and distance < 0.6:  # Only consider reasonable matches
                        best_distance = distance
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
        
        # Check for duplicate faces
        for i, encoding in enumerate(student_data['encodings']):
            if compare_faces_proper(encoding, face_encoding, tolerance=0.6):
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
            best_distance = float('inf')
            
            for i, encoding in enumerate(student_data['embeddings']):
                distance = face_recognition.face_distance([encoding], face_encoding)[0]
                confidence = get_face_confidence(encoding, face_encoding)
                
                print(f"  Student {student_data['student_ids'][i]}: distance={distance:.3f}, confidence={confidence:.3f}")
                
                # Find the match with the smallest distance (best match)
                if distance < best_distance and distance < 0.6:  # Only consider reasonable matches
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
                    print(f"    → New best match: {student_data['student_ids'][i]} (distance: {distance:.4f})")
            
            # Add this face's best match if it's good enough (50% confidence threshold)
            if best_match and best_match['confidence'] >= 0.5:
                all_recognized.append(best_match)
                print(f"✅ Face {face_idx + 1} recognized as: {best_match['student_id']} with confidence {best_match['confidence']:.3f}")
            else:
                print(f"❌ Face {face_idx + 1}: No good match found (best distance: {best_distance:.4f})")
        
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)