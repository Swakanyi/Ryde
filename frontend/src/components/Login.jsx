import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../services/auth';
import { Car, ArrowRight, Eye, EyeOff, LogIn, Sparkles } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      await AuthService.login(formData);
      navigate('/dashboard');
    } catch (error) {
      setError(error.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { email: 'customer@ryde.com', password: 'demo123', role: 'Customer' },
    { email: 'driver@ryde.com', password: 'demo123', role: 'Driver' },
    { email: 'boda@ryde.com', password: 'demo123', role: 'Boda Rider' },
    { email: 'emergency@ryde.com', password: 'demo123', role: 'Emergency' },
  ];

  const fillDemoAccount = (account) => {
    setFormData({
      email: account.email,
      password: account.password
    });
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
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-emerald-400/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-1/3 left-1/4 w-24 h-24 bg-yellow-400/20 rounded-full blur-xl animate-float animation-delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/3 w-28 h-28 bg-white/10 rounded-full blur-xl animate-float animation-delay-4000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-20 h-20 bg-emerald-300/20 rounded-full blur-xl animate-float animation-delay-3000"></div>
      </div>

      <div className="flex w-full max-w-6xl rounded-3xl overflow-hidden relative z-10">
        
        <div className="w-full lg:w-3/5 p-8 lg:p-12 relative">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-xl border-r border-white/20 lg:border-r-0"></div>
          <div className="relative z-10 max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg transform rotate-12">
                <Car className="w-6 h-6 text-white -rotate-12" />
              </div>
                <Link to='/homepage'>
                <h1 className="text-2xl font-bold text-white hover:text-emerald-600">Ryde</h1>
                </Link>
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-white/80">Sign in to continue your journey</p>
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
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all duration-300 text-white placeholder-white/60 backdrop-blur-sm pr-12"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-emerald-300 hover:text-emerald-200 font-semibold transition-colors duration-200"
                >
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 px-6 rounded-xl hover:from-emerald-600 hover:to-emerald-700 focus:ring-4 focus:ring-emerald-400/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold transform hover:scale-105 shadow-lg border border-emerald-400/30"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-3"></div>
                    Signing In...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Sign In 
                  </div>
                )}
              </button>
            </form>

            {/* Socials */}
            <div className="mt-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/30"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-transparent text-white/70">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button className="w-full inline-flex justify-center py-3 px-4 border-2 border-white/20 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-300 backdrop-blur-sm hover:scale-105">
                  <span className="sr-only">Sign in with Google</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                  </svg>
                </button>

                <button className="w-full inline-flex justify-center py-3 px-4 border-2 border-white/20 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-300 backdrop-blur-sm hover:scale-105">
                  <span className="sr-only">Sign in with Facebook</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"/>
                  </svg>
                </button>

                <button className="w-full inline-flex justify-center py-3 px-4 border-2 border-white/20 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-300 backdrop-blur-sm hover:scale-105">
                  <span className="sr-only">Sign in with Apple</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                </button>
              </div>
            </div>

           
            <div className="mt-8 text-center">
              <p className="text-white/80">
                Don't have an account?{' '}
                <Link to="/register" className="text-emerald-300 hover:text-emerald-200 font-semibold">
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
        </div>

        
        <div className="hidden lg:flex lg:w-2/5 p-12 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-xl border-l border-white/20"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-6 h-6 text-emerald-300" />
              <span className="text-emerald-300 font-semibold">Welcome Back!</span>
            </div>
            
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Ready to
              <br />
              <span className="bg-gradient-to-r from-emerald-300 to-yellow-300 bg-clip-text text-transparent">
                Ride Again?
              </span>
            </h2>
            
            <div className="space-y-4 mb-8">
              {[
                "Instant ride booking",
                "Real-time driver tracking", 
                "Secure payment options",
                "24/7 customer support"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 text-white/90">
                  <div className="w-2 h-2 bg-emerald-300 rounded-full"></div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <p className="text-lg font-semibold mb-2">New to Ryde?</p>
              <p className="text-white/80 mb-4">Join thousands of happy riders today</p>
              <Link 
                to="/register"
                className="inline-flex items-center gap-2 bg-white/20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 w-full justify-center border border-white/30"
              >
                Create Account 
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;