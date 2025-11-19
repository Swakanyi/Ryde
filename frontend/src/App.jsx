import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import AuthService from './services/auth';
import './index.css';
import RequestRide from './components/RequestRide';
import MyRides from './components/MyRides';
import CustomerDash from './components/CustomerDash';
import Homepage from './components/Homepage';
import Chatbot from './components/Chatbot';
import DriverDash from './components/driver/DriverDash';
import AdminDashboard from './components/admin/AdminDashboard';


const ProtectedRoute = ({ children, allowedUserTypes = [] }) => {
  const user = AuthService.getCurrentUser();
  const isAuthenticated = AuthService.isAuthenticated();
  
  const userType = user?.user_type;
  const isStaff = user?.is_staff || sessionStorage.getItem('is_staff') === 'true';
  const isSuperuser = user?.is_superuser || sessionStorage.getItem('is_superuser') === 'true';

  console.log(`🔄 [ProtectedRoute] User: ${userType}, Staff: ${isStaff}, Superuser: ${isSuperuser}, Auth: ${isAuthenticated}, Allowed: ${allowedUserTypes}`);

  
  if (!isAuthenticated) {
    console.log('❌ [ProtectedRoute] Not authenticated - redirecting to login');
    return <Navigate to="/login" replace />;
  }


  const isAdmin = isStaff || isSuperuser;
  
 
  if (allowedUserTypes.includes('staff') && isAdmin) {
    console.log('✅ [ProtectedRoute] Admin access granted');
    return children;
  }

 
  if (isAdmin && !allowedUserTypes.includes('staff')) {
    console.log('🔄 [ProtectedRoute] Admin user detected - redirecting to admin dashboard');
    return <Navigate to="/admin/dashboard" replace />;
  }


  if (allowedUserTypes.length > 0 && !allowedUserTypes.includes(userType)) {
    console.log(`❌ [ProtectedRoute] User type ${userType} not allowed`);
    
 
    if (isAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userType === 'customer') {
      return <Navigate to="/dashboard" replace />;
    } else if (['driver', 'boda_rider'].includes(userType)) {
      return <Navigate to="/driver/dashboard" replace />;
    } else {
      return <Navigate to="/homepage" replace />;
    }
  }

  console.log('✅ [ProtectedRoute] Access granted');
  return children;
};

function App() {
  return (
    
      <div className="App">
        <Routes>
          
          <Route path="/" element={<Navigate to="/homepage" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/homepage" element={<Homepage />} />
          <Route path="/chatbot" element={<Chatbot />} />

          <Route
            path="/request-ride"
            element={
              <ProtectedRoute allowedUserTypes={['customer']}>
                <RequestRide />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-rides"
            element={
              <ProtectedRoute allowedUserTypes={['customer']}>
                <MyRides />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedUserTypes={['customer']}>
                <CustomerDash />
              </ProtectedRoute>
            }
          />

          
          <Route
            path="/driver/dashboard"
            element={
              <ProtectedRoute allowedUserTypes={['driver', 'boda_rider']}>
                <DriverDash />
              </ProtectedRoute>
            }
          />
          <Route
  path="/admin/dashboard"
  element={
    <ProtectedRoute allowedUserTypes={['staff', 'superuser']}>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>

          
          <Route path="*" element={<Navigate to="/homepage" replace />} />
        </Routes>
      </div>
    
  );
}

export default App;