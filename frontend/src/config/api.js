// API Configuration
const getApiBaseUrl = () => {
  // Development environment
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  
  // VPS environment - use direct backend URL
  if (window.location.hostname === '98.88.17.102') {
    return 'http://98.88.17.102:3001';
  }
  
  // Production environment - use same domain as frontend
  return window.location.origin;
};

export const API_BASE_URL = getApiBaseUrl();
export default API_BASE_URL;