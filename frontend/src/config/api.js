// API Configuration
const getApiBaseUrl = () => {
  // Development environment
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  
  // Production environment - use same domain as frontend
  // Nginx will proxy /api requests to backend
  return window.location.origin;
};

export const API_BASE_URL = getApiBaseUrl();

console.log('API Base URL:', API_BASE_URL);
