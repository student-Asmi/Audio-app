'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  sendOTP: (phone: string) => Promise<{ demo_otp?: string }>;
  login: (phone: string, otp: string, gender?: string, dob?: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUser = await AsyncStorage.getItem('currentUser');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuth();
  }, []);

  const sendOTP = async (phone: string) => {
  // ✅ Log the phone number first
  console.log("Sending OTP to:", phone);

  const response = await fetch("YOUR_API_ENDPOINT", {
    method: "POST",
    body: JSON.stringify({ phone }),
    headers: { "Content-Type": "application/json" }
  });

  if (!response.ok) {
    throw new Error("Failed to send OTP");
  }

  return await response.json();
};


  const login = async (phone: string, otp: string, gender?: string, dob?: string) => {
    try {
      const response = await authAPI.verifyOTP(phone, otp, gender, dob);
      const { token: newToken, user: newUser } = response.data;

      await AsyncStorage.setItem('authToken', newToken);
      await AsyncStorage.setItem('currentUser', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      return newUser;
    } catch (err: any) {
      throw new Error(err?.response?.data?.error || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['authToken', 'currentUser']);
      setToken(null);
      setUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, sendOTP, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
