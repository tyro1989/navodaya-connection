import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { z } from "zod";
import { useAuth } from "@/lib/auth";

// Common country codes
const COUNTRY_CODES = [
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+1", name: "US/Canada", flag: "🇺🇸" },
  { code: "+44", name: "UK", flag: "🇬🇧" },
  { code: "+971", name: "UAE", flag: "🇦🇪" },
  { code: "+65", name: "Singapore", flag: "🇸🇬" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
];

// Login schema for existing users
const phoneLoginSchema = z.object({
  countryCode: z.string().min(1, "Country code is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(1, "Password is required")
});

// OTP schemas
const otpRequestSchema = z.object({
  countryCode: z.string().min(1, "Country code is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

const otpVerifySchema = z.object({
  countryCode: z.string().min(1, "Country code is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  otp: z.string().length(6, "OTP must be 6 digits")
});

type PhoneLogin = z.infer<typeof phoneLoginSchema>;
type OTPRequest = z.infer<typeof otpRequestSchema>;
type OTPVerify = z.infer<typeof otpVerifySchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { login, sendOtp } = useAuth();
  const [otpSent, setOtpSent] = useState(false);
  const [phoneForOtp, setPhoneForOtp] = useState('');

  // Form configurations
  const loginForm = useForm<PhoneLogin>({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: {
      countryCode: "+91",
      phone: "9821489589",
      password: "password123"
    }
  });

  const otpRequestForm = useForm<OTPRequest>({
    resolver: zodResolver(otpRequestSchema),
    defaultValues: {
      countryCode: "+91",
      phone: "9876543210"
    }
  });

  const otpVerifyForm = useForm<OTPVerify>({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: {
      countryCode: "+91",
      phone: "",
      otp: ""
    }
  });

  // Mutations
  const loginMutation = useMutation({
    mutationFn: async (data: PhoneLogin) => {
      const loginData = {
        phone: data.countryCode + data.phone,
        password: data.password
      };
      return await apiRequest("POST", "/api/auth/login", loginData);
    },
    onSuccess: () => {
      navigate("/");
    },
    onError: (error: Error) => {
      console.error("Login failed:", error.message);
    },
  });

  const sendOtpMutation = useMutation({
    mutationFn: async (data: OTPRequest) => {
      const fullPhone = data.countryCode + data.phone;
      return await sendOtp(fullPhone, 'whatsapp');
    },
    onSuccess: (response) => {
      const countryCode = otpRequestForm.getValues('countryCode');
      const phone = otpRequestForm.getValues('phone');
      const fullPhone = countryCode + phone;
      setOtpSent(true);
      setPhoneForOtp(fullPhone);
      // Set the phone value in the OTP verification form
      otpVerifyForm.setValue('countryCode', countryCode);
      otpVerifyForm.setValue('phone', phone);
    },
    onError: (error: Error) => {
      console.error("Send OTP failed:", error.message);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (data: OTPVerify) => {
      const fullPhone = data.countryCode + data.phone;
      const response = await login(fullPhone, data.otp);
      return response;
    },
    onSuccess: (response) => {
      if (response && response.user) {
        navigate("/");
      }
    },
    onError: (error: Error) => {
      console.error("OTP verification failed:", error.message);
    },
  });

  const onLoginSubmit = (data: PhoneLogin) => {
    loginMutation.mutate(data);
  };

  const onSendOtp = (data: OTPRequest) => {
    sendOtpMutation.mutate(data);
  };

  const onVerifyOtp = (data: OTPVerify) => {
    verifyOtpMutation.mutate(data);
  };

  // Auto-login on page load for testing - DISABLED
  // useEffect(() => {
  //   const autoLogin = async () => {
  //     try {
  //       const response = await apiRequest("POST", "/api/auth/login", {
  //         phone: "9821489589",
  //         password: "password123"
  //       });
  //       navigate("/");
  //     } catch (error) {
  //       console.log("Auto-login failed, showing login form");
  //     }
  //   };
  //   autoLogin();
  // }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-purple-600/10"></div>
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">N</span>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-gray-600 text-base mt-2">
            Connect with your Navodaya family
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <Tabs defaultValue="whatsapp" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100/80 backdrop-blur-sm p-1 rounded-xl">
              <TabsTrigger 
                value="whatsapp" 
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-medium transition-all duration-200"
              >
                <span className="flex items-center gap-2">
                  📱 WhatsApp
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="password"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-medium transition-all duration-200"
              >
                <span className="flex items-center gap-2">
                  🔐 Password
                </span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="whatsapp" className="space-y-6 mt-6">
              {!otpSent ? (
                <form onSubmit={otpRequestForm.handleSubmit(onSendOtp)} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="otp-phone" className="text-sm font-semibold text-gray-700">Phone Number</Label>
                    <div className="flex gap-3">
                      <Select
                        value={otpRequestForm.watch("countryCode")}
                        onValueChange={(value) => otpRequestForm.setValue("countryCode", value)}
                      >
                        <SelectTrigger className="w-32 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-gray-200">
                          {COUNTRY_CODES.map((country) => (
                            <SelectItem key={country.code} value={country.code} className="hover:bg-blue-50">
                              {country.flag} {country.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id="otp-phone"
                        type="tel"
                        {...otpRequestForm.register("phone")}
                        placeholder="9876543210"
                        className="flex-1 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 text-base"
                      />
                    </div>
                    {(otpRequestForm.formState.errors.countryCode || otpRequestForm.formState.errors.phone) && (
                      <p className="text-sm text-red-500">
                        {otpRequestForm.formState.errors.countryCode?.message || otpRequestForm.formState.errors.phone?.message}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                    disabled={sendOtpMutation.isPending}
                  >
                    {sendOtpMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        📱 Send WhatsApp OTP
                      </span>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={otpVerifyForm.handleSubmit(onVerifyOtp)} className="space-y-6">
                  <div className="text-center space-y-3 p-4 bg-green-50 rounded-xl border border-green-100">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-green-600 text-xl">📱</span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium">
                      OTP sent to {phoneForOtp}
                    </p>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                      via WhatsApp
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="otp" className="text-sm font-semibold text-gray-700">Enter 6-digit OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      maxLength={6}
                      {...otpVerifyForm.register("otp")}
                      placeholder="••••••"
                      className="text-center text-2xl tracking-widest h-14 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 font-mono"
                    />
                    {otpVerifyForm.formState.errors.otp && (
                      <p className="text-sm text-red-500">
                        {otpVerifyForm.formState.errors.otp.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOtpSent(false)}
                      className="flex-1 h-12 border-gray-300 hover:bg-gray-50 rounded-xl transition-all duration-200"
                    >
                      ← Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                      disabled={verifyOtpMutation.isPending}
                    >
                      {verifyOtpMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Verifying...
                        </span>
                      ) : (
                        "✓ Verify OTP"
                      )}
                    </Button>
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-sm h-10 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    onClick={() => {
                      const countryCode = otpRequestForm.getValues('countryCode');
                      const phone = otpRequestForm.getValues('phone');
                      sendOtpMutation.mutate({ countryCode, phone });
                    }}
                    disabled={sendOtpMutation.isPending}
                  >
                    {sendOtpMutation.isPending ? "Sending..." : "🔄 Resend OTP"}
                  </Button>
                </form>
              )}
            </TabsContent>
            
            <TabsContent value="password" className="space-y-6 mt-6">
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="login-phone" className="text-sm font-semibold text-gray-700">Phone Number</Label>
                  <div className="flex gap-3">
                    <Select
                      value={loginForm.watch("countryCode")}
                      onValueChange={(value) => loginForm.setValue("countryCode", value)}
                    >
                      <SelectTrigger className="w-32 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-gray-200">
                        {COUNTRY_CODES.map((country) => (
                          <SelectItem key={country.code} value={country.code} className="hover:bg-blue-50">
                            {country.flag} {country.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="login-phone"
                      type="tel"
                      {...loginForm.register("phone")}
                      placeholder="9876543210"
                      className="flex-1 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 text-base"
                    />
                  </div>
                  {(loginForm.formState.errors.countryCode || loginForm.formState.errors.phone) && (
                    <p className="text-sm text-red-500">
                      {loginForm.formState.errors.countryCode?.message || loginForm.formState.errors.phone?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    {...loginForm.register("password")}
                    placeholder="Enter your password"
                    className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 text-base"
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-500">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      🔐 Sign In
                    </span>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}