class WebSocketService {
  constructor() {
    this.socket = null;
    this.messageHandlers = new Map();
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

    const wsUrl = `ws://localhost:8000/ws/${userType}/${id}/?token=${encodeURIComponent(token)}`;

    console.log(`🟡 [WebSocket] Connecting to: ${wsUrl}`);
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log(`✅ [WebSocket] Connected as ${userType}`);
      this.isConnecting = false;
      this.reconnectAttempts = 0;

      this.startHeartbeat();

      if (this.queue.length > 0) {
        console.log(`📤 [WebSocket] Sending ${this.queue.length} queued messages`);
        this.queue.forEach(msg => this.socket.send(JSON.stringify(msg)));
        this.queue = [];
      }

      const handler = this.messageHandlers.get('connection_established');
      if (handler) handler();
      
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

  onMessage(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  clearAllHandlers() {
    this.messageHandlers.clear();
  }

  handleMessage(message) {
    const handler = this.messageHandlers.get(message.type);
    if (handler) handler(message.data);
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
