import websocketService from './websocketService';

class ChatService {
  async sendCustomerMessage(rideId, message, driverId) {
    const messageData = {
      ride_id: rideId,
      message: message,
      sender_id: sessionStorage.getItem('user_id'),
      sender_name: sessionStorage.getItem('user_name') || 'Customer',
      sender_type: 'customer',
      receiver_id: driverId,
      receiver_type: 'driver',
      timestamp: new Date().toISOString()
    };

    console.log('💬 [ChatService] Sending customer message:', messageData);
    
    
    return websocketService.sendRideMessage(rideId, 'customer_message', messageData);
  }

  async sendDriverMessage(rideId, message, customerId) {
    const messageData = {
      ride_id: rideId,
      message: message,
      sender_id: sessionStorage.getItem('user_id'),
      sender_name: sessionStorage.getItem('user_name') || 'Driver',
      sender_type: 'driver',
      receiver_id: customerId,
      receiver_type: 'customer',
      timestamp: new Date().toISOString()
    };

    console.log('💬 [ChatService] Sending driver message:', messageData);
    
   
    return websocketService.sendRideMessage(rideId, 'driver_message', messageData);
  }

  formatMessage(messageData, currentUserType) {
    return {
      id: Date.now() + Math.random(),
      message: messageData.message,
      sender: messageData.sender_type,
      timestamp: messageData.timestamp,
      sender_name: messageData.sender_name,
      isCurrentUser: messageData.sender_type === currentUserType,
      ride_id: messageData.ride_id
    };
  }
}

export default new ChatService();