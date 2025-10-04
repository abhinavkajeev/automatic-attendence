# Automated Student Attendance System

A comprehensive system that uses facial recognition to automatically mark student attendance.

## Project Structure

```
/automated-attendance-system/
|
|--- 📂 client/              # React Frontend Application
|    |--- 📂 public/         # Public assets
|    |--- 📂 src/            # Source code
|         |--- 📂 assets/    # Images, global CSS files
|         |--- 📂 components/# Reusable UI components
|         |--- 📂 pages/     # Main views
|         |--- 📂 services/  # API call functions
|
|--- 📂 server/              # Node.js & Express.js Backend
|    |--- 📂 config/         # Database configuration
|    |--- 📂 controllers/    # Request handlers
|    |--- 📂 models/         # Database schemas
|    |--- 📂 routes/         # API routes
|
|--- 📂 cv-engine/           # Python Face Recognition Script
```

## Features

- Real-time face detection and recognition
- Automatic attendance marking
- Student management dashboard
- Attendance reports and analytics
- RESTful API for data management

## Technologies Used

### Frontend
- React.js
- Tailwind CSS
- Vite

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose

### Computer Vision
- Python
- OpenCV
- face_recognition library

## Setup Instructions

### Frontend (Client)
1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Backend (Server)
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a .env file with your MongoDB URI
4. Start the server:
   ```bash
   npm start
   ```

### CV Engine
1. Navigate to the cv-engine directory:
   ```bash
   cd cv-engine
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the face recognition script:
   ```bash
   python main.py
   ```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request