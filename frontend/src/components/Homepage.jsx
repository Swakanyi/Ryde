import React, { useState } from 'react';
import { Car, Zap, Shield, MapPin, Star, ChevronRight, Menu, X, Clock, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import driver from '../assets/drive with.jpg';
import image2 from '../assets/hero.png';
import rideIcon from '../assets/icons/ride.png';
import bodaIcon from '../assets/icons/boda.png';
import emerIcon from '../assets/icons/emer.png';
import deliveryIcon from '../assets/icons/delivery.png';

const Homepage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: rideIcon,
      title: "Ride",
      description: "Hail a car anytime, anywhere. Get where you need to go safely and comfortably."
    },
    {
      icon: bodaIcon,
      title: "Boda", 
      description: "Affordable motorcycle rides for quick trips through traffic. Fast, cheap, and convenient."
    },
    {
      icon: emerIcon,
      title: "Emergency Services",
      description: "Instant help when you need it most. Emergency response and support on demand."
    },
    {
      icon: deliveryIcon,
      title: "Delivery",
      description: "Send packages same-day across town. Fast, reliable delivery for your items."
    },
    
  ];

  const stats = [
    { number: "50K+", label: "Happy Riders" },
    { number: "2K+", label: "Verified Drivers" },
    { number: "100K+", label: "Rides Completed" },
    { number: "4.9★", label: "Average Rating" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50 to-yellow-50 overflow-hidden">
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-gradient-to-br from-lime-400 to-green-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      
      <nav className="relative z-50 bg-white/80 backdrop-blur-md shadow-sm sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg transform rotate-12">
                <Car className="w-6 h-6 text-white -rotate-12" />
              </div>
              <span className="text-3xl font-black bg-gradient-to-r from-gray-900 via-emerald-600 to-yellow-600 bg-clip-text text-transparent">
                Ryde
              </span>
            </div>

            {/* Desktop */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-emerald-600 font-medium transition">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-emerald-600 font-medium transition">How It Works</a>
              <a href="#pricing" className="text-gray-700 hover:text-emerald-600 font-medium transition">Pricing</a>
              <Link to='/register'>
              <button className="px-6 py-2.5 bg-gradient-to-r from-gray-900 to-emerald-600 text-white rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all">
                Get Started
              </button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-700"
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="block text-gray-700 hover:text-emerald-600 font-medium">Features</a>
              <a href="#how-it-works" className="block text-gray-700 hover:text-emerald-600 font-medium">How It Works</a>
              <a href="#pricing" className="block text-gray-700 hover:text-emerald-600 font-medium">Pricing</a>
                 <Link to='/register'>
                 <button className="w-full px-6 py-3 bg-gradient-to-r from-gray-900 to-emerald-600 text-white rounded-full font-semibold">
                Get Started
                 </button>
                 </Link>
              
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
<section className="relative min-h-screen flex items-center justify-center overflow-hidden">
  
  <div 
    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
    style={{
      backgroundImage: `url(${image2})` 
    }}
  >
    
    <div className="absolute inset-0 bg-black/40"></div>
    
   
    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/40"></div>
  </div>

  <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
    <div className="text-center space-y-8">
      <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight text-white">
        Your Journey,
        <br />
        <span className="bg-gradient-to-r from-white via-emerald-200 to-yellow-200 bg-clip-text text-transparent">
          Your Way
        </span>
      </h1>

      <p className="text-xl md:text-2xl text-white/80 leading-relaxed max-w-2xl mx-auto">
        Experience the future of transportation. Fast, safe, and affordable rides at your fingertips. Download Ryde and get moving!
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to='/register'>
          <button className="group px-8 py-4 bg-gradient-to-r from-white to-emerald-200 text-gray-900 rounded-full font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
            Get Started Now
          </button>
        </Link>
        <button className="px-8 py-4 bg-transparent border-2 border-white/30 text-white rounded-full font-bold text-lg hover:border-white hover:bg-white/10 transition-all duration-300">
          Learn More
        </button>
      </div>

     
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-12 max-w-2xl mx-auto">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="text-3xl font-black text-white">
              {stat.number}
            </div>
            <div className="text-white/70 text-sm font-medium">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  </div>

  
  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
    <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
      <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-bounce"></div>
    </div>
  </div>
</section>

 {/* Features Section */}
<section id="features" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
  <div className="text-center mb-16">
    <h2 className="text-4xl md:text-5xl font-black mb-4">
      Why Choose <span className="bg-gradient-to-r from-gray-900 to-emerald-600 bg-clip-text text-transparent">Ryde?</span>
    </h2>
    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
      We're not just another ride-hailing app. We're your trusted travel companion.
    </p>
  </div>

  
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
    {features.map((feature, index) => (
      <div 
        key={index} 
        className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
      >
        <div className="flex items-start justify-between">
          
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-2 text-gray-900">{feature.title}</h3>
            <p className="text-gray-600 text-md">{feature.description}</p>
          </div>
          
         
          <div className="w-20 h-14  rounded-xl flex items-center justify-center ml-4 flex-shrink-0">
            <img 
              src={feature.icon} 
              alt={feature.title}
              className="w-25 h-23"
            />
          </div>
        </div>
      </div>
    ))}
  </div>
</section>

{/* Ride with us section */}
<section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
    
   
    <div className="text-center lg:text-left space-y-8">
      <div className="space-y-6">
        <h1 className="text-4xl md:text-7xl font-black leading-tight">
          Ryde With
          <br />
          <span className="bg-gradient-to-r from-gray-900 via-emerald-600 to-yellow-500 bg-clip-text text-transparent">
            Confidence
          </span>
        </h1>

        <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
          Thank you for choosing Ryde. Your journey matters to us, and your safety is our priority.
        </p>
      </div>

      
      <div className="space-y-6">
        <div className="flex items-start space-x-4 p-3 rounded-2xl hover:bg-gray-50 transition-all duration-300 group">
          
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Safety First</h3>
            <p className="text-gray-700 text-lg">Ride safely with high driver community standards and comprehensive review systems.</p>
          </div>
        </div>

        <div className="flex items-start space-x-4 p-2 rounded-2xl hover:bg-gray-50 transition-all duration-300 group">
          
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Reliable Rides</h3>
            <p className="text-gray-700 text-lg">Book on-demand and schedule trips up to one week in advance.</p>
          </div>
        </div>

        <div className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-gray-50 transition-all duration-300 group">
          
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Flexible & Affordable</h3>
            <p className="text-gray-700 text-lg">Enjoy various ride options that make it easy for you to get around.</p>
          </div>
        </div>
      </div>

      
      <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
        <Link to='/register'>
          <button className="px-8 py-4 bg-gradient-to-r from-gray-900 to-emerald-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
            Start Riding Today
          </button>
        </Link>
        
      </div>
    </div>

    {/* Phone Mockup */}
    <div className="relative">
      <div className="relative mx-auto w-full max-w-md">
        {/* Floating */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl opacity-80 blur-2xl animate-pulse"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl opacity-80 blur-2xl animate-pulse animation-delay-2000"></div>
        
        {/* Phone Frame */}
        <div className="relative bg-gradient-to-br from-gray-900 to-emerald-600 rounded-[3rem] p-3 shadow-2xl transform hover:scale-105 transition-transform">
          <div className="bg-white rounded-[2.5rem] overflow-hidden">
           
            <div className="bg-gradient-to-br from-emerald-50 to-yellow-50 p-6 space-y-6">
            
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Good Morning 👋</p>
                  <h3 className="text-xl font-bold text-gray-800">Where to?</h3>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                  JD
                </div>
              </div>

              {/* Search Box */}
              <div className="space-y-3">
                <div className="bg-white rounded-2xl p-4 shadow-md flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <input 
                    type="text" 
                    placeholder="Pickup location"
                    className="flex-1 outline-none text-gray-700 text-sm"
                    disabled
                  />
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-md flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <input 
                    type="text" 
                    placeholder="Where to?"
                    className="flex-1 outline-none text-gray-700 text-sm"
                    disabled
                  />
                </div>
              </div>

              
              <div className="space-y-3">
                <div className="bg-white rounded-2xl p-4 shadow-md border-2 border-purple-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">🚗</div>
                      <div>
                        <p className="font-bold text-gray-800">Economy</p>
                        <p className="text-xs text-gray-500">2 mins away</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">Ksh 750</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-md opacity-75">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">🏍️</div>
                      <div>
                        <p className="font-bold text-gray-800">Boda</p>
                        <p className="text-xs text-gray-500">1 min away</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-600">Ksh 200</p>
                    </div>
                  </div>
                </div>
              </div>

             
              <button className="w-full py-4 bg-gradient-to-r from-gray-900 to-emerald-600 text-white rounded-2xl font-bold shadow-lg">
                Book Ryde
              </button>
            </div>
          </div>
        </div>

        {/* Floating Cards */}
        <div className="absolute -left-12 top-1/4 bg-white rounded-2xl shadow-xl p-4 animate-float">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Safety</p>
              <p className="font-bold text-gray-800">100% Secure</p>
            </div>
          </div>
        </div>

        <div className="absolute -right-12 top-2/3 bg-white rounded-2xl shadow-xl p-4 animate-float animation-delay-2000">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Rating</p>
              <p className="font-bold text-gray-800">4.9/5.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
      

 {/* Drive with us section */}
  <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
    
    
    <div className="order-1 lg:order-1">
      <div className="relative">
        <img 
          className="w-full h-auto rounded-3xl shadow-2xl"
          alt="Ryde Driver" 
          src={driver}
        />
    
        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl opacity-20 blur-2xl -z-10"></div>
        <div className="absolute -top-6 -left-6 w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl opacity-20 blur-2xl -z-10"></div>
      </div>
    </div>

    
    <div className="order-2 lg:order-2 space-y-4">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900">
          Drive With 
          <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent"> Ryde</span>
        </h1>
        <p className="text-xl text-gray-600">
          Earning opportunities that fit perfectly with your lifestyle and schedule.
        </p>
      </div>

      
      <div className="space-y-6">
        <div className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-gray-50 transition-all duration-300 group">
          
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Competitive Commissions</h3>
            <p className="text-gray-700 text-lg">Keep more of what you earn with our industry-leading commission rates.</p>
          </div>
        </div>

        <div className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-gray-50 transition-all duration-300 group">
          
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">100% Support</h3>
            <p className="text-gray-700 text-lg">We are committed to providing you support every step of the way.</p>
          </div>
        </div>

        <div className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-gray-50 transition-all duration-300 group">
          
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Maximum Flexibility</h3>
            <p className="text-gray-700 text-lg">Select your trips according to where and when you want to drive.</p>
          </div>
        </div>

        <div className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-gray-50 transition-all duration-300 group">
          
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Instant Cashout</h3>
            <p className="text-gray-700 text-lg">Get paid anytime, anywhere with instant transfers to your account.</p>
          </div>
        </div>
      </div>

      
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <Link to='/register'>
        <button className="px-8 py-4 bg-gradient-to-r from-gray-900 to-emerald-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
          Sign Up as a Driver
        </button>
        </Link>
        
      </div>
    </div>
  </div>
</section>    
      
      
      
      
      
      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Get Started in <span className="bg-gradient-to-r from-yellow-600 to-emerald-600 bg-clip-text text-transparent">3 Easy Steps</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-900 to-emerald-600 rounded-full flex items-center justify-center text-white text-4xl font-black shadow-xl">
                1
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full animate-ping"></div>
            </div>
            <h3 className="text-2xl font-bold mb-3">Set Your Location</h3>
            <p className="text-gray-700 text-lg">Enter your pickup and destination points on the map</p>
          </div>

          <div className="text-center">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-600 to-yellow-500 rounded-full flex items-center justify-center text-white text-4xl font-black shadow-xl">
                2
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full animate-ping animation-delay-2000"></div>
            </div>
            <h3 className="text-2xl font-bold mb-3">Choose Your Ride</h3>
            <p className="text-gray-700 text-lg">Select from Standard, Boda, or Premium options</p>
          </div>

          <div className="text-center">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center text-white text-4xl font-black shadow-xl">
                3
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-400 rounded-full animate-ping animation-delay-4000"></div>
            </div>
            <h3 className="text-2xl font-bold mb-3">Enjoy Your Ride</h3>
            <p className="text-gray-700 text-lg">Sit back, relax, and enjoy a smooth journey</p>
          </div>
        </div>
      </section>

      
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-br from-gray-900 via-emerald-600 to-yellow-500 rounded-3xl p-12 md:p-20 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black mb-6">
              Ready to Ryde?
            </h2>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of happy riders and experience the best way to get around town.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-10 py-5 bg-white text-gray-900 rounded-full font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all">
                Download App
              </button>
              <Link to='/register'>
              <button className="px-10 py-5 bg-transparent border-2 border-white text-white rounded-full font-bold text-lg hover:bg-white hover:text-gray-900 transition-all">
                Become a Driver
              </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg transform rotate-12">
                  <Car className="w-6 h-6 text-white -rotate-12" />
                </div>
                <span className="text-2xl font-black">Ryde</span>
              </div>
              <p className="text-gray-400">Your journey, your way. Anytime, anywhere.</p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Press</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Safety</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Ryde. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Homepage;