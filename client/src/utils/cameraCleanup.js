/**
 * Global camera cleanup utility
 * This ensures all camera resources are properly released
 */

// Global refs to track all active camera streams
const activeStreams = new Set();
const activeVideoElements = new Set();

export const registerStream = (stream) => {
  if (stream) {
    activeStreams.add(stream);
  }
};

export const registerVideoElement = (videoElement) => {
  if (videoElement) {
    activeVideoElements.add(videoElement);
  }
};

export const unregisterStream = (stream) => {
  if (stream) {
    activeStreams.delete(stream);
  }
};

export const unregisterVideoElement = (videoElement) => {
  if (videoElement) {
    activeVideoElements.delete(videoElement);
  }
};

/**
 * Force cleanup of all camera resources
 * This should be called when navigating away from camera-enabled pages
 */
export const forceCleanupAllCameraResources = () => {
  console.log('Force cleaning up all camera resources...');
  
  // Stop all active streams
  activeStreams.forEach(stream => {
    if (stream && stream.getTracks) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Force stopped track:', track.kind);
      });
    }
  });
  activeStreams.clear();
  
  // Clear all video elements
  activeVideoElements.forEach(videoElement => {
    if (videoElement) {
      videoElement.srcObject = null;
      videoElement.pause();
    }
  });
  activeVideoElements.clear();
  
  // Force garbage collection if available
  if (window.gc) {
    window.gc();
  }
  
  console.log('All camera resources cleaned up');
};

/**
 * Check if any camera resources are still active
 */
export const hasActiveCameraResources = () => {
  return activeStreams.size > 0 || activeVideoElements.size > 0;
};

// Add global cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', forceCleanupAllCameraResources);
  window.addEventListener('pagehide', forceCleanupAllCameraResources);
}
