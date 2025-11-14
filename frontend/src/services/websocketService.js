class WebSocketService {
  constructor() {
    this.socket = null;
    this.messageHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
  }

  connect(route, id, token) {
    if (this.socket) {
      this.disconnect();
    }

    const wsUrl = `ws://localhost:8000/ws/${route}/${id}/?token=${token}`;
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log(`WebSocket connected to ${route}`);
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event);
      this.attemptReconnect(route, id, token);
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  attemptReconnect(route, id, token) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(route, id, token);
      }, this.reconnectInterval * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  sendMessage(type, data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, data }));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  onMessage(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  removeMessageHandler(type) {
    this.messageHandlers.delete(type);
  }

  handleMessage(message) {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message.data);
    }
  }

  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

export default new WebSocketService();