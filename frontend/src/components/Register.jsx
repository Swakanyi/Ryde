import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../services/auth';
import { Shield, Car, Bike, Ambulance, UserPlus, ArrowRight, CheckCircle } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: '',
    user_type: 'customer',
    phone_number: '',
    first_name: '',
    last_name: '',
    driver_license: '',
    responder_type: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await AuthService.register(formData);
      navigate('/login');
    } catch (error) {
      if (typeof error === 'object') {
        const errorMessages = Object.values(error).flat().join(', ');
        setError(errorMessages);
      } else {
        setError(error.detail || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderDriverFields = () => {
    if (formData.user_type !== 'driver') return null;
    
    return (
      <div className="animate-fade-in">
        <label className="block text-sm font-semibold text-white mb-3">
          Driver License Number
        </label>
        <input
          type="text"
          name="driver_license"
          placeholder="Enter your driver license number"
          value={formData.driver_license}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all duration-300 text-white placeholder-white/60 backdrop-blur-sm"
          required
        />
      </div>
    );
  };

  const renderEmergencyResponderFields = () => {
    if (formData.user_type !== 'emergency_responder') return null;
    
    return (
      <div className="animate-fade-in">
        <label className="block text-sm font-semibold text-white mb-3">
          Service Type
        </label>
        <select 
          name="responder_type" 
          value={formData.responder_type} 
          onChange={handleChange}
          className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all duration-300 text-white backdrop-blur-sm"
          required
        >
          <option value="" className="text-gray-800">Select Service Type</option>
          <option value="ambulance" className="text-gray-800">Ambulance</option>
          <option value="tow_truck" className="text-gray-800">Tow Truck</option>
          <option value="police" className="text-gray-800">Police</option>
          <option value="fire" className="text-gray-800">Fire Department</option>
          <option value="boda_emergency" className="text-gray-800">Boda Emergency</option>
        </select>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative">
      
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-emerald-900/80 to-gray-900/90"></div>
      </div>

      
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-emerald-400/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-yellow-400/20 rounded-full blur-xl animate-float animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-28 h-28 bg-white/10 rounded-full blur-xl animate-float animation-delay-4000"></div>
        <div className="absolute bottom-1/3 right-1/3 w-20 h-20 bg-emerald-300/20 rounded-full blur-xl animate-float animation-delay-3000"></div>
      </div>

      <div className="flex w-full max-w-6xl rounded-3xl overflow-hidden relative z-10">
        
        <div className="hidden lg:flex lg:w-2/5 p-12 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-xl border-r border-white/20"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg transform rotate-12">
                              <Car className="w-6 h-6 text-white -rotate-12" />
                            </div>
              <Link to='/homepage'>
              <h1 className="text-2xl font-bold hover:text-emerald-600" >Ryde</h1>
              </Link>
            </div>
            
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Your Journey
              <br />
              <span className="bg-gradient-to-r from-emerald-300 to-yellow-300 bg-clip-text text-transparent">
                Starts Here
              </span>
            </h2>
            
            <div className="space-y-4 mb-8">
              {[
                "Join thousands of happy riders",
                "Earn on your own schedule", 
                "24/7 dedicated support",
                "Secure & reliable platform"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 text-white/90">
                  <CheckCircle className="w-5 h-5 text-emerald-300" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <p className="text-lg font-semibold mb-2">Already with us?</p>
              <p className="text-white/80 mb-4">Sign in to continue your journey</p>
              <Link 
                to="/login"
                className="inline-flex items-center gap-2 bg-white/20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 w-full justify-center border border-white/30"
              >
                Sign In 
              </Link>
            </div>
          </div>
        </div>

        
        <div className="w-full lg:w-3/5 p-8 lg:p-12 relative">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
          <div className="relative z-10 max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Join Ryde</h2>
              <p className="text-white/80">Create your account in seconds</p>
            </div>

            {error && (
              <div className="bg-red-400/20 backdrop-blur-sm border border-red-400/30 text-white px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Account Type
                </label>
                <select 
                  name="user_type" 
                  value={formData.user_type} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all duration-300 text-white backdrop-blur-sm"
                >
                  <option value="customer" className="text-gray-800">Customer</option>
                  <option value="driver" className="text-gray-800">Driver</option>
                  <option value="boda_rider" className="text-gray-800">Boda Rider</option>
                  <option value="emergency_responder" className="text-gray-800">Emergency Responder</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    placeholder="First name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all duration-300 text-white placeholder-white/60 backdrop-blur-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    placeholder="Last name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all duration-300 text-white placeholder-white/60 backdrop-blur-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all duration-300 text-white placeholder-white/60 backdrop-blur-sm"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone_number"
                  placeholder="+256712345678"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all duration-300 text-white placeholder-white/60 backdrop-blur-sm"
                  required
                />
              </div>

              {renderDriverFields()}
              {renderEmergencyResponderFields()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all duration-300 text-white placeholder-white/60 backdrop-blur-sm"
                    placeholder="Create a password"
                    required
                    minLength="8"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="password2"
                    value={formData.password2}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all duration-300 text-white placeholder-white/60 backdrop-blur-sm"
                    placeholder="Confirm your password"
                    required
                    minLength="8"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 px-6 rounded-xl hover:from-emerald-600 hover:to-emerald-700 focus:ring-4 focus:ring-emerald-400/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold transform hover:scale-105 shadow-lg border border-emerald-400/30"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-3"></div>
                    Creating Your Account...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Get Started
                  </div>
                )}
              </button>
            </form>

            <div className="mt-8 text-center lg:hidden">
              <p className="text-white/80">
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-300 hover:text-emerald-200 font-semibold">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Register;