import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

   console.log('Chatbot component rendered, isOpen:', isOpen); 

  return (
    <>
      
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-emerald-500 to-gray-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 z-50"
        >
          <MessageCircle className="w-7 h-7" />
        </button>
      )}

      
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50">
          
          <div className="bg-gradient-to-r from-gray-900 to-emerald-600 rounded-t-2xl p-4 text-white flex justify-between items-center">
            <div>
              <h3 className="font-bold">Ryde Support</h3>
              <p className="text-sm text-emerald-200">We're here to help</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          
          <div className="h-64 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-tl-none p-3 max-w-xs">
                  <p className="text-sm text-gray-700">Hello! How can I help you with your Ryde today?</p>
                </div>
              </div>
            </div>
          </div>

          
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
              <button className="bg-emerald-500 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-emerald-600 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;