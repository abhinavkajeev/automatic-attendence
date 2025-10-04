import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import './assets/global.css';

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;