import cv2
import face_recognition
import numpy as np
import pickle
import requests
import os
from datetime import datetime
import time

class AttendanceSystem:
    def __init__(self, embeddings_file='student_embeddings.pkl', backend_url='http://localhost:5000'):
        self.embeddings_file = embeddings_file
        self.backend_url = backend_url
        self.known_face_encodings = []
        self.known_student_ids = []
        self.load_embeddings()
        
        # Attendance tracking
        self.marked_today = set()
        self.recognition_threshold = 0.6
        
    def load_embeddings(self):
        """Load student face embeddings from file"""
        if os.path.exists(self.embeddings_file):
            try:
                with open(self.embeddings_file, 'rb') as f:
                    data = pickle.load(f)
                    self.known_face_encodings = data['encodings']
                    self.known_student_ids = data['student_ids']
                print(f"Loaded {len(self.known_student_ids)} student embeddings")
            except Exception as e:
                print(f"Error loading embeddings: {e}")
        else:
            print("No embeddings file found. Please train the system first.")
    
    def save_embeddings(self):
        """Save student face embeddings to file"""
        data = {
            'encodings': self.known_face_encodings,
            'student_ids': self.known_student_ids
        }
        with open(self.embeddings_file, 'wb') as f:
            pickle.dump(data, f)
        print(f"Saved {len(self.known_student_ids)} student embeddings")
    
    def train_from_images(self, image_folder):
        """Train the system with student images
        Expected folder structure: image_folder/student_id/photo.jpg
        """
        self.known_face_encodings = []
        self.known_student_ids = []
        
        for student_id in os.listdir(image_folder):
            student_path = os.path.join(image_folder, student_id)
            if not os.path.isdir(student_path):
                continue
            
            for image_file in os.listdir(student_path):
                if image_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                    image_path = os.path.join(student_path, image_file)
                    
                    try:
                        image = face_recognition.load_image_file(image_path)
                        encodings = face_recognition.face_encodings(image)
                        
                        if len(encodings) > 0:
                            self.known_face_encodings.append(encodings[0])
                            self.known_student_ids.append(student_id)
                            print(f"Added {student_id} to database")
                        else:
                            print(f"No face found in {image_path}")
                    except Exception as e:
                        print(f"Error processing {image_path}: {e}")
        
        self.save_embeddings()
        print(f"Training complete! Total students: {len(set(self.known_student_ids))}")
    
    def mark_attendance(self, student_ids, course_id):
        """Send attendance to backend API"""
        try:
            url = f"{self.backend_url}/api/attendance/mark"
            data = {
                'studentIds': student_ids,
                'courseId': course_id,
                'confidence': 0.95
            }
            response = requests.post(url, json=data)
            if response.status_code == 200:
                print(f"Attendance marked for {len(student_ids)} students")
                return True
            else:
                print(f"Error marking attendance: {response.text}")
                return False
        except Exception as e:
            print(f"Error connecting to backend: {e}")
            return False
    
    def recognize_faces(self, frame):
        """Recognize faces in a frame"""
        # Resize frame for faster processing
        small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
        rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
        
        # Find faces and encodings
        face_locations = face_recognition.face_locations(rgb_small_frame)
        face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)
        
        recognized_students = []
        
        for face_encoding, face_location in zip(face_encodings, face_locations):
            # Compare with known faces
            matches = face_recognition.compare_faces(
                self.known_face_encodings, 
                face_encoding,
                tolerance=self.recognition_threshold
            )
            face_distances = face_recognition.face_distance(
                self.known_face_encodings, 
                face_encoding
            )
            
            best_match_index = np.argmin(face_distances)
            
            if matches[best_match_index]:
                student_id = self.known_student_ids[best_match_index]
                confidence = 1 - face_distances[best_match_index]
                
                # Scale back coordinates
                top, right, bottom, left = face_location
                top *= 4
                right *= 4
                bottom *= 4
                left *= 4
                
                recognized_students.append({
                    'student_id': student_id,
                    'confidence': confidence,
                    'location': (top, right, bottom, left)
                })
        
        return recognized_students
    
    def run_live_recognition(self, course_id, camera_index=0):
        """Run live face recognition for attendance"""
        print("Starting live recognition... Press 'q' to quit")
        
        video_capture = cv2.VideoCapture(camera_index)
        
        if not video_capture.isOpened():
            print("Error: Could not open camera")
            return
        
        frame_count = 0
        process_every_n_frames = 5  # Process every 5th frame for performance
        
        while True:
            ret, frame = video_capture.read()
            if not ret:
                print("Error: Could not read frame")
                break
            
            frame_count += 1
            
            # Process frame
            if frame_count % process_every_n_frames == 0:
                recognized = self.recognize_faces(frame)
                
                # Mark attendance for recognized students
                for student in recognized:
                    student_id = student['student_id']
                    
                    if student_id not in self.marked_today:
                        self.mark_attendance([student_id], course_id)
                        self.marked_today.add(student_id)
                    
                    # Draw rectangle and label
                    top, right, bottom, left = student['location']
                    cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
                    
                    label = f"{student_id} ({student['confidence']:.2f})"
                    cv2.rectangle(frame, (left, bottom - 35), (right, bottom), (0, 255, 0), cv2.FILLED)
                    cv2.putText(frame, label, (left + 6, bottom - 6), 
                               cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1)
            
            # Display info
            cv2.putText(frame, f"Marked: {len(self.marked_today)}", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.putText(frame, "Press 'q' to quit", (10, 60),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            
            # Display frame
            cv2.imshow('Attendance System', frame)
            
            # Check for quit
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        video_capture.release()
        cv2.destroyAllWindows()
        
        print(f"\nSession ended. Total students marked: {len(self.marked_today)}")


def main():
    """Main function with menu"""
    system = AttendanceSystem()
    
    while True:
        print("\n=== Automated Attendance System ===")
        print("1. Train system with images")
        print("2. Start live recognition")
        print("3. Exit")
        
        choice = input("\nEnter your choice: ")
        
        if choice == '1':
            folder = input("Enter path to training images folder: ")
            if os.path.exists(folder):
                system.train_from_images(folder)
            else:
                print("Folder not found!")
        
        elif choice == '2':
            course_id = input("Enter Course ID: ")
            camera = input("Enter camera index (default 0): ")
            camera_idx = int(camera) if camera else 0
            system.run_live_recognition(course_id, camera_idx)
            system.marked_today.clear()  # Reset for next session
        
        elif choice == '3':
            print("Goodbye!")
            break
        
        else:
            print("Invalid choice!")


if __name__ == "__main__":
    main()