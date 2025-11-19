import websocketService from './websocketService';

class ChatService {
  
  async sendCustomerMessage(rideId, message, driverId) {
    const messageData = {
      type: 'chat_message', 
      ride_id: rideId,
      message: message,
      sender: 'customer',
      receiver: 'driver', 
      receiver_id: driverId,
      timestamp: new Date().toISOString(),
      sender_name: sessionStorage.getItem('user_name') || 'Customer'
    };

    return websocketService.sendMessage('chat_message', messageData);
  }

 
  async sendDriverMessage(rideId, message, customerId) {
    const messageData = {
      type: 'chat_message', 
      message: message,
      sender: 'driver',
      receiver: 'customer',
      receiver_id: customerId,
      timestamp: new Date().toISOString(),
      sender_name: sessionStorage.getItem('user_name') || 'Driver'
    };

    return websocketService.sendMessage('chat_message', messageData);
  }

  
  formatMessage(messageData, currentUserType) {
    return {
      id: Date.now() + Math.random(), 
      message: messageData.message,
      sender: messageData.sender_type || messageData.sender, 
      timestamp: messageData.timestamp,
      sender_name: messageData.sender_name,
      isCurrentUser: (messageData.sender_type || messageData.sender) === currentUserType,
      ride_id: messageData.ride_id
    };
  }
}

export default new ChatService();