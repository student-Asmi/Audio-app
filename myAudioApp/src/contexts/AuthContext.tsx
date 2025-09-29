import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '../types';
import { authAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (phone: string, otp: string, gender?: string, dateOfBirth?: string) => Promise<void>;
  sendOTP: (phone: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('currentUser');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async (phone: string): Promise<void> => {
    try {
      const response = await authAPI.sendOTP(phone);
      console.log('OTP sent:', response.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to send OTP');
    }
  };

  const login = async (phone: string, otp: string, gender?: string, dateOfBirth?: string): Promise<void> => {
    try {
      const response = await authAPI.verifyOTP(phone, otp, gender, dateOfBirth);
      const { token: newToken, user: newUser } = response.data;

      await AsyncStorage.setItem('authToken', newToken);
      await AsyncStorage.setItem('currentUser', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['authToken', 'currentUser']);
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, sendOTP, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};