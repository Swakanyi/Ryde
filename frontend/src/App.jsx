import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import AuthService from './services/auth';
import './index.css';
import RequestRide from './components/RequestRide';
import MyRides from './components/MyRides'
import CustomerDash from './components/CustomerDash';
import Homepage from './components/Homepage';
import Chatbot from './components/Chatbot';
import DriverDash from './components/driver/DriverDash';

const ProtectedRoute = ({ children }) => {
  return AuthService.isAuthenticated() ? children : <Navigate to="/login" />;
};

const CustomerRoute = ({ children }) => {
  const user = AuthService.getCurrentUser();
  if (!user) return <Navigate to="/login" />;
  if (user.user_type === 'customer') return children;
  return <Navigate to="/driver/dashboard" />;
};

const DriverRoute = ({ children }) => {
  const user = AuthService.getCurrentUser();
  if (!user) return <Navigate to="/login" />;
  if (user.user_type === 'driver' || user.user_type === 'boda_rider') return children;
  return <Navigate to="/dashboard" />;
};

function App() {
  return (
    
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/homepage" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/request-ride" element={<ProtectedRoute><CustomerRoute><RequestRide /></CustomerRoute></ProtectedRoute>} />
          <Route path="/my-rides" element={<ProtectedRoute><CustomerRoute><MyRides /></CustomerRoute></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><CustomerRoute><CustomerDash /></CustomerRoute></ProtectedRoute>} />
          <Route path="/driver/dashboard" element={<ProtectedRoute><DriverRoute><DriverDash /></DriverRoute></ProtectedRoute>} />
          <Route path="/homepage" element={<Homepage />} />
          <Route path="/chatbot" element={<Chatbot />} />
        </Routes>
      </div>
    
  );
}

export default App;