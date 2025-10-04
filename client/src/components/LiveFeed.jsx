import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attendanceAPI } from '../services/api';

const LiveFeed = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [stream, setStream] = useState(null);

  useEffect(() => {
    const initializeLiveFeed = async () => {
      try {
        const response = await attendanceAPI.getLiveFeed(courseId);
        setStream(response.streamUrl);
      } catch (error) {
        console.error('Error getting live feed:', error);
        alert('Failed to start live feed. Please try again.');
        navigate(`/courses/${courseId}`);
      }
    };

    initializeLiveFeed();
  }, [courseId, navigate]);

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Live Attendance Feed</h1>
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Back to Course
          </button>
        </div>

        <div className="bg-black rounded-lg overflow-hidden aspect-video">
          {stream ? (
            <img
              src={stream}
              alt="Live Feed"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              Loading live feed...
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Detected Students</h2>
          <div className="space-y-2">
            {/* This will be populated with detected students */}
            <div className="text-gray-500">
              Waiting for students to be detected...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveFeed;