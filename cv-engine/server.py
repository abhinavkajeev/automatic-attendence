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
    """Get face encoding using OpenCV"""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    if len(faces) == 0:
        return None
    
    # Get the largest face
    largest_face = max(faces, key=lambda r: r[2] * r[3])
    x, y, w, h = largest_face
    
    # Extract face ROI and resize
    face_roi = image[y:y+h, x:x+w]
    face_encoding = cv2.resize(face_roi, (128, 128)).flatten()
    
    return face_encoding, (x, y, w, h)

def compare_faces(known_encoding, face_encoding, tolerance=0.6):
    """Compare face encodings using Euclidean distance"""
    if known_encoding is None or face_encoding is None:
        return False
    dist = np.linalg.norm(known_encoding - face_encoding)
    return dist < tolerance

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
        
        # Check for duplicate faces
        for i, encoding in enumerate(student_data['embeddings']):
            if compare_faces(encoding, face_encoding):
                os.remove(photo_path)
                return jsonify({
                    'success': False,
                    'message': f'Face already registered with student ID: {student_data["student_ids"][i]}'
                }), 400
        
        # Save face encoding and student ID
        student_data['embeddings'].append(face_encoding)
        student_data['student_ids'].append(student_id)
        save_student_data(student_data)
        
        # Save processed face image
        face_img = img[y:y+h, x:x+w]
        face_path = os.path.join(PROCESSED_FACES, f'{student_id}.jpg')
        cv2.imwrite(face_path, face_img)
        
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
            
            # Process the frame for face detection
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            
            # Draw rectangles around faces and identify students
            for (x, y, w, h) in faces:
                face_roi = frame[y:y+h, x:x+w]
                face_encoding = cv2.resize(face_roi, (128, 128)).flatten()
                
                # Check for recognized students
                for i, encoding in enumerate(student_data['embeddings']):
                    if compare_faces(encoding, face_encoding):
                        # Draw rectangle and student ID
                        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                        cv2.putText(frame, student_data['student_ids'][i], 
                                  (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 
                                  0.9, (0, 255, 0), 2)
                        break
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
        
        # Get face encoding
        result = get_face_encoding(img_cv)
        if result is None:
            return jsonify({
                'success': False,
                'message': 'No face detected in photo'
            }), 400
        
        face_encoding, _ = result
        
        # Compare with known faces
        recognized = []
        for i, encoding in enumerate(student_data['embeddings']):
            if compare_faces(encoding, face_encoding):
                recognized.append({
                    'student_id': student_data['student_ids'][i],
                    'confidence': 0.95  # Fixed confidence for simplicity
                })
        
        if recognized:
            result = {
                'success': True,
                'recognized': recognized
            }
        else:
            result = {
                'success': False,
                'message': 'No faces recognized in photo'
            }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)