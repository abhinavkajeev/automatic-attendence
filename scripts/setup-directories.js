const fs = require('fs');
const path = require('path');

const createDirectories = () => {
  const dirs = [
    path.join(__dirname, '../server/uploads/students'),
    path.join(__dirname, '../server/uploads/temp'),
    path.join(__dirname, '../client/public/models'),
    path.join(__dirname, '../cv-engine/processed_faces'),
    path.join(__dirname, '../cv-engine/uploads')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    } else {
      console.log(`Directory already exists: ${dir}`);
    }
  });
};

createDirectories();