const tf = require('@tensorflow/tfjs-node');
const faceapi = require('face-api.js');
const canvas = require('canvas');
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Load face-api models
let modelsLoaded = false;
async function loadModels() {
  if (!modelsLoaded) {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk('models');
    await faceapi.nets.faceLandmark68Net.loadFromDisk('models');
    await faceapi.nets.faceRecognitionNet.loadFromDisk('models');
    modelsLoaded = true;
  }
}

// Initialize models when service starts
loadModels().catch(console.error);

// Helper function to load image
async function loadImage(path) {
  const img = await canvas.loadImage(path);
  return img;
}

// Detect faces in an image
async function detectFaces(imagePath) {
  try {
    await loadModels();
    const img = await loadImage(imagePath);
    const detections = await faceapi.detectAllFaces(img)
      .withFaceLandmarks()
      .withFaceDescriptors();
    
    return detections.map(d => d.descriptor);
  } catch (error) {
    console.error('Error detecting faces:', error);
    throw error;
  }
}

// Compare two faces
async function compareFaces(faceDescriptor1, imagePath2, threshold = 0.6) {
  try {
    await loadModels();
    const img2 = await loadImage(imagePath2);
    const detection2 = await faceapi.detectSingleFace(img2)
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    if (!detection2) {
      return false;
    }

    const distance = faceapi.euclideanDistance(faceDescriptor1, detection2.descriptor);
    return distance < threshold;
  } catch (error) {
    console.error('Error comparing faces:', error);
    throw error;
  }
}

module.exports = {
  detectFaces,
  compareFaces
};