import cv2
import face_recognition
import numpy as np
import requests
import time

# URL of your backend API
BACKEND_URL = "http://localhost:5001/api"

# --- 1. Load Known Faces From Backend ---
known_face_embeddings = []
known_face_ids = []

def load_known_faces():
    global known_face_embeddings, known_face_ids
    print("Loading known faces from the database...")
    try:
        response = requests.get(f"{BACKEND_URL}/students/embeddings")
        if response.status_code == 200:
            students = response.json()
            known_face_embeddings = [np.array(s['faceEmbeddings']) for s in students]
            known_face_ids = [s['studentId'] for s in students]
            print(f"Loaded {len(known_face_ids)} faces.")
        else:
            print("Failed to load faces from backend.")
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to backend: {e}")

# --- 2. Main Video Processing Loop ---
def start_attendance_marking():
    video_capture = cv2.VideoCapture(0) # 0 is the default webcam
    
    # Reload faces at the start
    load_known_faces() 

    # Cooldown to prevent spamming the backend
    last_api_call_time = 0
    api_cooldown = 10 # seconds

    while True:
        ret, frame = video_capture.read()
        if not ret:
            break

        # Find all faces and their embeddings in the current frame
        face_locations = face_recognition.face_locations(frame)
        face_embeddings = face_recognition.face_encodings(frame, face_locations)

        recognized_ids_in_frame = set()

        for face_embedding in face_embeddings:
            # See if the face is a match for the known face(s)
            matches = face_recognition.compare_faces(known_face_embeddings, face_embedding, tolerance=0.6)
            
            face_distances = face_recognition.face_distance(known_face_embeddings, face_embedding)
            best_match_index = np.argmin(face_distances)

            if matches[best_match_index]:
                student_id = known_face_ids[best_match_index]
                recognized_ids_in_frame.add(student_id)

        # --- 3. Send Recognized Faces to Backend ---
        current_time = time.time()
        if recognized_ids_in_frame and (current_time - last_api_call_time > api_cooldown):
            print(f"Recognized students: {list(recognized_ids_in_frame)}")
            try:
                payload = {'recognizedStudentIds': list(recognized_ids_in_frame)}
                response = requests.post(f"{BACKEND_URL}/attendance", json=payload)
                if response.status_code == 200:
                    print("Successfully marked attendance.")
                    last_api_call_time = current_time
                else:
                    print("Failed to mark attendance.")
            except requests.exceptions.RequestException as e:
                print(f"Could not send attendance data: {e}")

        # Display the results (optional)
        for (top, right, bottom, left) in face_locations:
            cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)

        cv2.imshow('Video', frame)

        # Hit 'q' on the keyboard to quit!
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    video_capture.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    start_attendance_marking()