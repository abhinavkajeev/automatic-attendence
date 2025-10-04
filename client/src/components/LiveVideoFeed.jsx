import React from 'react';
import { API_BASE_URL } from '../services/api';

const LiveVideoFeed = () => {
  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      <img
        src={`${API_BASE_URL}/api/attendance/live`}
        alt="Live Video Feed"
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default LiveVideoFeed;