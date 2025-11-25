import React, { useState, useEffect } from 'react';
import { X, MessageCircle, User, Send } from 'lucide-react';
import AdminService from '../../services/adminService';

const ChatHistoryModal = ({ ride, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        setLoading(true);
        const data = await AdminService.getRideChat(ride.id);
        setMessages(data.messages || []);
      } catch (err) {
        setError('Failed to load chat history');
      } finally {
        setLoading(false);
      }
    };

    fetchChatHistory();
  }, [ride.id]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white text-xl font-bold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Chat History - Ride #{ride.id}
          </h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-white/60">Loading chat history...</div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-400">{error}</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-white/30 mx-auto mb-3" />
            <div className="text-white/60">No messages found for this ride</div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_type === 'customer' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md rounded-2xl p-4 ${
                    message.sender_type === 'customer'
                      ? 'bg-blue-500/20 text-white rounded-bl-none'
                      : 'bg-emerald-500/20 text-white rounded-br-none'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-3 h-3" />
                    <span className="text-xs font-medium capitalize">
                      {message.sender_type === 'customer' ? ride.customer_name : ride.driver_name}
                    </span>
                    <span className="text-xs text-white/60">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistoryModal;