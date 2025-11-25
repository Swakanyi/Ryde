import React from 'react';
import { Mic, MicOff, Square, Bot, X, Navigation, Package, Bike } from 'lucide-react';
import useVoiceAssistant from '../hooks/useVoiceAssistant';

const VoiceAssistant = ({ onCommandProcessed, onClose, isOpen }) => {
  const {
    isListening,
    transcript,
    isProcessing,
    error,
    startListening,
    stopListening,
  } = useVoiceAssistant();

  const handleCommandProcessed = (command) => {
    if (onCommandProcessed) {
      onCommandProcessed(command);
    }
  };

  const getServiceIcon = (type) => {
    switch (type) {
      case 'ride': return <Navigation className="w-5 h-5" />;
      case 'courier': return <Package className="w-5 h-5" />;
      case 'boda': return <Bike className="w-5 h-5" />;
      default: return <Bot className="w-5 h-5" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-white/20 w-full max-w-md">
        
        <div className="flex justify-between items-center p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold">Voice Assistant</h3>
              <p className="text-white/60 text-sm">Speak your request naturally</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        
        <div className="p-6">
         
          <div className="flex justify-center mb-6">
            <div className={`relative ${isListening ? 'animate-pulse' : ''}`}>
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-emerald-500 hover:bg-emerald-600'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isListening ? (
                  <Square className="w-8 h-8 text-white" />
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )}
              </button>
              
              
              {isListening && (
                <div className="absolute inset-0 border-4 border-red-400 rounded-full animate-ping" />
              )}
            </div>
          </div>

     
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-white/60 text-sm mb-2">
                {isListening ? 'Listening... Speak now' : 
                 isProcessing ? 'Processing your request...' :
                 'Click the microphone and start speaking'}
              </p>
              
              {isListening && (
                <div className="flex justify-center gap-1">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="w-1 h-6 bg-red-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              )}
            </div>

           
            {transcript && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-white/80 text-sm mb-1">You said:</p>
                <p className="text-white font-medium">{transcript}</p>
              </div>
            )}

           
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

           
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <p className="text-blue-300 text-sm font-medium mb-2">Try saying:</p>
              <ul className="text-blue-300/80 text-sm space-y-1">
                <li>• "I need a ride to Nairobi CBD"</li>
                <li>• "Get me a boda to the airport"</li>
                <li>• "Send a package to Westlands"</li>
                <li>• "Book a premium car to Karen"</li>
              </ul>
            </div>
          </div>
        </div>

      
        <div className="p-4 border-t border-white/20 bg-white/5 rounded-b-2xl">
          <div className="flex justify-center gap-4 text-white/60">
            <div className="flex items-center gap-2 text-sm">
              <Navigation className="w-4 h-4" />
              <span>Rides</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Package className="w-4 h-4" />
              <span>Courier</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Bike className="w-4 h-4" />
              <span>Boda</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;