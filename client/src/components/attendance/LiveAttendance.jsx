import React, { useState, useRef, useEffect } from 'react';
import { Camera, XCircle } from 'lucide-react';
import * as faceapi from 'face-api.js';
import Button from '../common/Button';
import { photosAPI } from '../../services/api';

const LiveAttendance = ({ courseId, students, onAttendanceMarked }) => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [studentFaceDescriptors, setStudentFaceDescriptors] = useState({});
  const [recognizedStudents, setRecognizedStudents] = useState([]);

  // Load face-api models and initialize
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Load required models for face detection and recognition
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);

        // Load student face descriptors
        await loadStudentFaceDescriptors();
        setIsInitializing(false);
      } catch (error) {
        console.error('Error loading face recognition models:', error);
      }
    };

    loadModels();
  }, []);

  // Load student photos and compute face descriptors
  const loadStudentFaceDescriptors = async () => {
    const descriptors = {};
    
    for (const student of students) {
      try {
        // Load student photo
        const img = await faceapi.fetchImage(photosAPI.get(student.studentId));
        // Detect face and compute descriptor
        const detection = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          descriptors[student.studentId] = detection.descriptor;
        }
      } catch (error) {
        console.error(`Error loading face descriptor for student ${student.studentId}:`, error);
      }
    }

    setStudentFaceDescriptors(descriptors);
  };

  // Start video capture
  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setIsCapturing(true);
      startFaceRecognition();
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  // Stop video capture
  const stopCapture = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    videoRef.current.srcObject = null;
    setIsCapturing(false);
    setRecognizedStudents([]);
  };

  // Continuous face recognition
  const startFaceRecognition = () => {
    const faceMatcher = new faceapi.FaceMatcher(
      Object.entries(studentFaceDescriptors).map(([studentId, descriptor]) => (
        new faceapi.LabeledFaceDescriptors(studentId, [descriptor])
      ))
    );

    const recognitionInterval = setInterval(async () => {
      if (!videoRef.current?.srcObject) {
        clearInterval(recognitionInterval);
        return;
      }

      // Detect faces in video stream
      const detections = await faceapi
        .detectAllFaces(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptors();

      // Match detected faces with student descriptors
      const newlyRecognized = new Set();
      detections.forEach(detection => {
        const match = faceMatcher.findBestMatch(detection.descriptor);
        if (match.distance < 0.6) { // Threshold for face match confidence
          newlyRecognized.add(match.label);
        }
      });

      setRecognizedStudents(Array.from(newlyRecognized));

      // Draw detection results
      const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true);
      const resizedDetections = faceapi.resizeResults(detections, dims);
      
      canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
    }, 100); // Check every 100ms

    return () => clearInterval(recognitionInterval);
  };

  const markAttendance = () => {
    if (recognizedStudents.length > 0) {
      onAttendanceMarked(recognizedStudents);
      stopCapture();
    }
  };

  if (isInitializing) {
    return (
      <div className="text-center py-8">
        <p>Initializing face recognition system...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative inline-block">
        <video
          ref={videoRef}
          autoPlay
          muted
          className={`rounded-lg ${isCapturing ? 'block' : 'hidden'}`}
          onPlay={() => {
            canvasRef.current.width = videoRef.current.clientWidth;
            canvasRef.current.height = videoRef.current.clientHeight;
          }}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 z-10"
        />
      </div>

      <div className="space-y-4">
        {!isCapturing ? (
          <Button onClick={startCapture}>
            <Camera className="w-5 h-5 mr-2" />
            Start Camera
          </Button>
        ) : (
          <div className="space-x-4">
            <Button variant="secondary" onClick={stopCapture}>
              <XCircle className="w-5 h-5 mr-2" />
              Stop Camera
            </Button>
            <Button
              onClick={markAttendance}
              disabled={recognizedStudents.length === 0}
            >
              Mark Attendance ({recognizedStudents.length} students)
            </Button>
          </div>
        )}
      </div>

      {isCapturing && recognizedStudents.length > 0 && (
        <div>
          <h3 className="font-medium mb-2">Recognized Students:</h3>
          <ul className="space-y-1">
            {recognizedStudents.map(studentId => {
              const student = students.find(s => s.studentId === studentId);
              return (
                <li key={studentId} className="text-sm">
                  {student ? `${student.name} (${studentId})` : studentId}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LiveAttendance;