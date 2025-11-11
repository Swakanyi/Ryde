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

const ProtectedRoute = ({ children }) => {
  return AuthService.isAuthenticated() ? children : <Navigate to="/login" />;
};


const UserRoute = ({ children }) => {
  const user = AuthService.getCurrentUser();
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  
  if (user.user_type === 'customer') {
    return <CustomerDash />;
  }

  
  return children;
};

function App() {
  return (
    
      <div className="App">
  
        <Routes>
          <Route path="/" element={<Navigate to="/homepage" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/request-ride" element={<ProtectedRoute> <RequestRide /> </ProtectedRoute>} />
          <Route path="/my-rides" element={ <ProtectedRoute> <MyRides /> </ProtectedRoute>} />
          <Route path="/dashboard" element={ <ProtectedRoute> <UserRoute> <CustomerDash /> </UserRoute> </ProtectedRoute>} />
          <Route path="/homepage" element={<Homepage />} />
          <Route path="/chatbot" element={<Chatbot />} />
          
        </Routes>
       
      </div>
    
  );
}

export default App;