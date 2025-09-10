// Production configuration
const getApiBaseUrl = () => {
  // In production, use the same domain as the frontend
  return window.location.origin;
};

export const API_BASE_URL = getApiBaseUrl();
