import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { attendanceAPI } from '../services/api';

const LiveAttendance = () => {
  const { courseId } = useParams();
  const [stream, setStream] = useState(null);
  const [markedStudents, setMarkedStudents] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMirrored, setIsMirrored] = useState(true);
  const videoRef = useRef(null);
  const eventSourceRef = useRef(null);
  const processingTimeoutRef = useRef(null);

  useEffect(() => {
    // Start webcam
    initWebcam();
    // Start attendance stream
    initAttendanceStream();

    return () => {
      // Cleanup
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (processingTimeoutRef.current) {
        clearInterval(processingTimeoutRef.current);
      }
    };
  }, [courseId]);

  const initWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640,
          height: 480,
          facingMode: 'user'
        } 
      });
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Start periodic frame processing
      processingTimeoutRef.current = setInterval(processFrame, 5000); // Process every 5 seconds
    } catch (error) {
      console.error('Error accessing webcam:', error);
      alert('Could not access webcam. Please check permissions.');
    }
  };

  const initAttendanceStream = () => {
    eventSourceRef.current = attendanceAPI.streamLiveAttendance(courseId);
    
    eventSourceRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMarkedStudents(data);
    };

    eventSourceRef.current.onerror = () => {
      eventSourceRef.current.close();
      setTimeout(initAttendanceStream, 5000); // Retry connection after 5 seconds
    };
  };

  const processFrame = async () => {
    if (!videoRef.current || isProcessing) return;

    setIsProcessing(true);
    try {
      // Create a canvas to capture the frame with higher resolution
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      // Apply image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw the video frame
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      console.log(`Processing frame: ${canvas.width}x${canvas.height}`);

      // Convert canvas to blob with higher quality
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9); // Higher quality JPEG
      });

      console.log(`Frame blob size: ${blob.size} bytes`);

      // Create form data
      const formData = new FormData();
      formData.append('photo', blob, 'frame.jpg');

      // Send to CV Engine for face recognition
      const response = await fetch('http://localhost:5001/verify', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      console.log('CV Engine face recognition response:', result);

      // If faces are recognized, mark attendance
      if (result.success && result.recognized && result.recognized.length > 0) {
        const recognizedStudentIds = result.recognized.map(r => r.student_id);
        
        // Send recognized student IDs to server to mark attendance
        const attendanceResponse = await attendanceAPI.markByFaceRecognition(courseId, recognizedStudentIds);
        console.log('Attendance marked:', attendanceResponse);
      }

    } catch (error) {
      console.error('Error processing frame:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Live Attendance - Course {courseId}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Webcam Feed */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Camera Feed</h2>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isMirrored}
                onChange={(e) => setIsMirrored(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Mirror</span>
            </label>
          </div>
          <div className="relative aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover rounded"
              style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
            />
            {isProcessing && (
              <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-sm">
                Processing...
              </div>
            )}
          </div>
        </div>

        {/* Attendance List */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">
            Marked Students ({markedStudents.length})
          </h2>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-left">ID</th>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {markedStudents.map((record) => (
                  <tr key={record._id} className="border-b border-gray-200">
                    <td className="p-2">{record.student.studentId}</td>
                    <td className="p-2">{record.student.name}</td>
                    <td className="p-2">
                      {new Date(record.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAttendance;