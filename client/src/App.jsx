import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { forceCleanupAllCameraResources } from './utils/cameraCleanup';
import './index.css';

function App() {
  useEffect(() => {
    // Global cleanup on app unmount
    return () => {
      forceCleanupAllCameraResources();
    };
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;