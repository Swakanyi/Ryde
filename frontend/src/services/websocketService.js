import config from '../config';

class WebSocketService {
  constructor() {
    this.socket = null;
   
    this.messageHandlers = {};
    this.handlerRegistrations = {};
    this.queue = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.userType = null;
    this.userId = null;
    this.token = null;
    this.isConnecting = false;
    this.manualDisconnect = false;
  }


  registerHandler(type, handler, componentId = 'unknown') {
    console.log(`🔧 [WebSocket] Registering handler for ${type} from ${componentId}`);
    
   
    if (!this.messageHandlers[type]) {
      this.messageHandlers[type] = [];
      this.handlerRegistrations[type] = [];
    }
    
    
    this.messageHandlers[type].push(handler);
    this.handlerRegistrations[type].push(componentId);
    
    console.log(`🔧 [WebSocket] Now have ${this.messageHandlers[type].length} handlers for ${type}`);
  }

handleMessage(message) {
  console.log(`📨 [WebSocket] Received full message:`, message);
  
  
  const messageType = message.type;
  const messageData = message.data || message; 
  
  console.log(`📨 [WebSocket] Processing: ${messageType}`, messageData);
  
  const handlers = this.messageHandlers[messageType];
  if (handlers && handlers.length > 0) {
    console.log(`🔧 [WebSocket] Executing ${handlers.length} handler(s) for ${messageType}`);
    handlers.forEach(handler => {
      try {
        handler(messageData);
      } catch (error) {
        console.error(`❌ [WebSocket] Handler error for ${messageType}:`, error);
      }
    });
  } else {
    console.log(`⚠️ [WebSocket] No handler for ${messageType}`);
    console.log(`🔍 [WebSocket] Available handlers:`, Object.keys(this.messageHandlers));
  }
}

  
  clearComponentHandlers(componentId) {
    console.log(`🔧 [WebSocket] Clearing handlers for ${componentId}`);
    
    Object.keys(this.messageHandlers).forEach(type => {
      const handlers = this.messageHandlers[type];
      const registrations = this.handlerRegistrations[type];
      
      if (handlers && registrations) {
        
        const indicesToRemove = [];
        registrations.forEach((registeredComponentId, index) => {
          if (registeredComponentId === componentId) {
            indicesToRemove.push(index);
          }
        });
        
        
        indicesToRemove.sort((a, b) => b - a).forEach(index => {
          handlers.splice(index, 1);
          registrations.splice(index, 1);
          console.log(`🔧 [WebSocket] Removed handler for ${type} at index ${index}`);
        });
        
       
        if (handlers.length === 0) {
          delete this.messageHandlers[type];
          delete this.handlerRegistrations[type];
        }
      }
    });
  }

  
  clearAllHandlers() {
    this.messageHandlers = {};
    this.handlerRegistrations = {};
    console.log('🔧 [WebSocket] Cleared all handlers');
  }

  
  debugHandlers() {
    console.log('🔍 [WebSocket Debug] Current handlers:');
    Object.keys(this.messageHandlers).forEach(type => {
      console.log(`  ${type}: ${this.messageHandlers[type].length} handler(s)`);
      this.handlerRegistrations[type].forEach((compId, index) => {
        console.log(`    [${index}] -> ${compId}`);
      });
    });
  }

  connect(userType, id, token) {
    return new Promise((resolve, reject) => { 
      if (this.isConnecting) {
        resolve(); 
        return;
      }
      if (this.socket) this.disconnect();

      this.userType = userType;
      this.userId = id;
      this.token = token;
      this.manualDisconnect = false;
      this.isConnecting = true;

     const wsUrl = `${config.WS_URL}/ws/${userType}/${id}/?token=${encodeURIComponent(token)}`;

      console.log(`🟡 [WebSocket] Connecting to: ${wsUrl}`);
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log(`✅ [WebSocket] Connected as ${userType}`);
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        
        this.debugHandlers();

        this.startHeartbeat();

        if (this.queue.length > 0) {
          console.log(`📤 [WebSocket] Sending ${this.queue.length} queued messages`);
          this.queue.forEach(msg => this.socket.send(JSON.stringify(msg)));
          this.queue = [];
        }

        
        const connectionHandlers = this.messageHandlers['connection_established'];
        if (connectionHandlers) {
          console.log(`🔧 [WebSocket] Calling ${connectionHandlers.length} connection handlers`);
          connectionHandlers.forEach(handler => {
            try {
              handler();
            } catch (error) {
              console.error('❌ [WebSocket] Connection handler error:', error);
            }
          });
        }
        
        resolve(); 
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'pong') {
            console.log('💓 [WebSocket] Heartbeat confirmed');
            return;
          }
          
          this.handleMessage(data);
        } catch (e) {
          console.error('❌ [WebSocket] Message parsing error:', e);
        }
      };

      this.socket.onclose = () => {
        console.log(`🔴 [WebSocket] Disconnected`);
        this.isConnecting = false;
        if (!this.manualDisconnect) this.attemptReconnect(userType, id, token);
      };

      this.socket.onerror = (error) => {
        console.error('❌ [WebSocket] Error:', error);
        this.isConnecting = false;
        reject(error); 
      };
    });
  }

  sendMessage(type, data) {
    const message = { type, data };
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      return true;
    } else {
      this.queue.push(message);
      return false;
    }
  }

  sendRideMessage(rideId, type, data) {
    return this.sendMessage(type, {
      ...data,
      ride_id: rideId,
      sender_type: this.userType,
      sender_id: this.userId,
      timestamp: new Date().toISOString()
    });
  }

  onMessage(type, handler, componentId = 'unknown') {
    this.registerHandler(type, handler, componentId);
  }

  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  getConnectionState() {
    if (this.isConnecting) return 'connecting';
    if (!this.socket) return 'disconnected';
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000); 
  }

  disconnect() {
    this.manualDisconnect = true;
    this.queue = [];

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.clearAllHandlers(); 
    if (this.socket) this.socket.close(1000, 'Manual disconnect');
    this.socket = null;
  }

  attemptReconnect(userType, id, token) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || this.manualDisconnect) return;

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 30000);
    console.log(`🟡 [WebSocket] Reconnecting in ${delay}ms...`);
    setTimeout(() => {
      if (!this.manualDisconnect) this.connect(userType, id, token);
    }, delay);
  }
}

export default new WebSocketService();