import axios from 'axios';
import { Config } from '../config/environment';
import { AuthResponse, User, Call } from '../types';

const api = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      // You can add navigation to login screen here
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  sendOTP: (phone: string) => 
    api.post('/auth/send-otp', { phone }),

  verifyOTP: (phone: string, otp: string, gender?: string, dateOfBirth?: string) => 
    api.post<AuthResponse>('/auth/verify-otp', { phone, otp, gender, dateOfBirth }),
};

export const userAPI = {
  getUsers: (params?: { gender?: string; search?: string }) => 
    api.get<{ users: User[] }>('/users', { params }),

  getProfile: () => 
    api.get<{ user: User }>('/users/profile'),

  updateOnlineStatus: (online: boolean) => 
    api.post('/users/online-status', { online }),
};

export const callAPI = {
  startCall: (receiver_id: string, call_type: 'audio' | 'video') => 
    api.post<{ message: string; call: Call }>('/calls/start', { receiver_id, call_type }),

  endCall: (call_id: string, duration?: number) => 
    api.post('/calls/end', { call_id, duration }),

  getCallHistory: (page?: number, limit?: number) => 
    api.get<{ calls: Call[] }>('/calls/history', { params: { page, limit } }),
};

export default api;