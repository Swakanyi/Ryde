const config = {
  development: {
    API_URL: 'http://localhost:8000/api/auth',
    WS_URL: 'ws://localhost:8000'
  },
  production: {
    API_URL: 'https://ryde-cdft.onrender.com/api',
    WS_URL: 'wss://ryde-cdft.onrender.com'
  }
};

const environment = process.env.NODE_ENV || 'development';

export default config[environment];