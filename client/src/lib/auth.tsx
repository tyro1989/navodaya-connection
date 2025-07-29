import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "./queryClient";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (phone: string, otp: string) => Promise<{ user?: User; isNewUser: boolean }>;
  register: (userData: any) => Promise<{ user: User }>;
  logout: () => Promise<void>;
  sendOtp: (phone: string, method?: 'sms' | 'whatsapp') => Promise<{ otp?: string }>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);

  const { data: userData, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (userData && typeof userData === 'object' && 'user' in userData && userData.user) {
      setUser(userData.user as User);
    } else if (userData === null) {
      setUser(null);
    }
  }, [userData]);

  const sendOtpMutation = useMutation({
    mutationFn: async ({ phone, method }: { phone: string; method?: 'sms' | 'whatsapp' }) => {
      const response = await apiRequest("POST", "/api/auth/send-otp", { phone, method: method || 'whatsapp' });
      return response;
    },
  });

  const loginMutation = useMutation({
    mutationFn: async ({ phone, otp }: { phone: string; otp: string }) => {
      const response = await apiRequest("POST", "/api/auth/verify-otp", { phone, otp });
      return response;
    },
    onSuccess: (data) => {
      if (data.user) {
        setUser(data.user);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      return response;
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return response;
    },
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
      // Redirect to auth page after logout
      window.location.href = "/auth";
    },
  });

  const sendOtp = async (phone: string, method?: 'sms' | 'whatsapp') => {
    return sendOtpMutation.mutateAsync({ phone, method });
  };

  const login = async (phone: string, otp: string) => {
    return loginMutation.mutateAsync({ phone, otp });
  };

  const register = async (userData: any) => {
    return registerMutation.mutateAsync(userData);
  };

  const logout = async () => {
    return logoutMutation.mutateAsync();
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        sendOtp,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
