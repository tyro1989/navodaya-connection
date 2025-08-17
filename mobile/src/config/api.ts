// API Configuration for mobile app
// This will connect to your existing backend API

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000' // Development - connects to your local server
  : 'https://your-production-domain.com'; // Production - replace with your deployed URL

export { API_BASE_URL };

// API helper functions that match your web app's API calls
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Important for session cookies
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Specific API endpoints that match your backend
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  PROFILE: '/api/auth/profile',
  OTP_SEND: '/api/auth/send-otp',
  OTP_VERIFY: '/api/auth/verify-otp',

  // Users
  USERS_EXPERTS: '/api/users/experts',
  USER_PROFILE: (id: string) => `/api/users/${id}`,
  UPDATE_PROFILE: '/api/users/profile',

  // Requests
  REQUESTS: '/api/requests',
  REQUEST_DETAIL: (id: string) => `/api/requests/${id}`,
  CREATE_REQUEST: '/api/requests',
  UPDATE_REQUEST: (id: string) => `/api/requests/${id}`,

  // Responses
  RESPONSES: '/api/responses',
  CREATE_RESPONSE: '/api/responses',
  RESPONSE_RATING: (id: string) => `/api/responses/${id}/rating`,

  // Notifications
  NOTIFICATIONS: '/api/notifications',
  NOTIFICATIONS_COUNT: '/api/notifications/count',
  MARK_NOTIFICATION_READ: (id: string) => `/api/notifications/${id}/read`,
  MARK_ALL_NOTIFICATIONS_READ: '/api/notifications/mark-all-read',

  // Reviews
  REVIEWS: '/api/reviews',
  CREATE_REVIEW: '/api/reviews',

  // Messages
  MESSAGES: '/api/messages',
  CREATE_MESSAGE: '/api/messages',

  // Stats
  STATS_DASHBOARD: '/api/stats/dashboard',
  STATS_PERSONAL: '/api/stats/personal',
  STATS_TOP_HELPERS: '/api/stats/top-helpers',

  // Upload
  UPLOAD_PROFILE_IMAGE: '/api/upload/profile-image',
  UPLOAD_REQUEST_ATTACHMENT: '/api/upload/request-attachment',
};