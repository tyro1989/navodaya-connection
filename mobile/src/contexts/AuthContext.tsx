import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiRequest, API_ENDPOINTS } from '../config/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<User>;
  loginWithOTP: (phone: string, otp: string) => Promise<User>;
  register: (userData: Partial<User>) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<User>;
  sendOTP: (phone: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Try to get user from secure storage first
      const storedUser = await SecureStore.getItemAsync('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      // Verify with server
      const response = await apiRequest(API_ENDPOINTS.PROFILE);
      if (response.user) {
        setUser(response.user);
        await SecureStore.setItemAsync('user', JSON.stringify(response.user));
      }
    } catch (error) {
      console.log('No active session found');
      setUser(null);
      await SecureStore.deleteItemAsync('user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone: string, password: string): Promise<User> => {
    try {
      const response = await apiRequest(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      });

      if (response.user) {
        setUser(response.user);
        await SecureStore.setItemAsync('user', JSON.stringify(response.user));
        return response.user;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const loginWithOTP = async (phone: string, otp: string): Promise<User> => {
    try {
      const response = await apiRequest(API_ENDPOINTS.OTP_VERIFY, {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
      });

      if (response.user) {
        setUser(response.user);
        await SecureStore.setItemAsync('user', JSON.stringify(response.user));
        return response.user;
      } else {
        throw new Error(response.message || 'OTP verification failed');
      }
    } catch (error) {
      console.error('OTP login error:', error);
      throw error;
    }
  };

  const register = async (userData: Partial<User>): Promise<User> => {
    try {
      const response = await apiRequest(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (response.user) {
        setUser(response.user);
        await SecureStore.setItemAsync('user', JSON.stringify(response.user));
        return response.user;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiRequest(API_ENDPOINTS.LOGOUT, {
        method: 'POST',
      });
    } catch (error) {
      console.log('Logout API call failed, continuing with local cleanup');
    } finally {
      setUser(null);
      await SecureStore.deleteItemAsync('user');
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<User> => {
    try {
      const response = await apiRequest(API_ENDPOINTS.UPDATE_PROFILE, {
        method: 'PUT',
        body: JSON.stringify(userData),
      });

      if (response.user) {
        setUser(response.user);
        await SecureStore.setItemAsync('user', JSON.stringify(response.user));
        return response.user;
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const sendOTP = async (phone: string): Promise<void> => {
    try {
      const response = await apiRequest(API_ENDPOINTS.OTP_SEND, {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    loginWithOTP,
    register,
    logout,
    updateUser,
    sendOTP,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};