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
  const [oauthFlow, setOauthFlow] = useState<'verify_phone' | 'complete_profile' | null>(null);
  const [oauthProvider, setOauthProvider] = useState<'google' | 'facebook' | null>(null);

  // Check URL parameters for OAuth flow
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const oauth = urlParams.get('oauth');
    
    if (action === 'verify_phone' && oauth) {
      setOauthFlow('verify_phone');
      setOauthProvider(oauth as 'google' | 'facebook');
    } else if (action === 'complete_profile' && oauth) {
      setOauthFlow('complete_profile'); 
      setOauthProvider(oauth as 'google' | 'facebook');
    }
  }, []);

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

  // OAuth phone verification
  const addPhoneMutation = useMutation({
    mutationFn: async (phone: string) => {
      return await apiRequest("POST", "/api/auth/add-phone", { phone });
    },
    onSuccess: () => {
      setOtpSent(true);
    },
    onError: (error: Error) => {
      console.error("Add phone failed:", error.message);
    },
  });

  const verifyPhoneMutation = useMutation({
    mutationFn: async (data: { phone: string; otp: string }) => {
      return await apiRequest("POST", "/api/auth/verify-phone", data);
    },
    onSuccess: () => {
      // Check if profile is complete
      navigate("/");
    },
    onError: (error: Error) => {
      console.error("Phone verification failed:", error.message);
    },
  });

  // If OAuth flow is active, show appropriate form
  if (oauthFlow === 'verify_phone') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-purple-600/10"></div>
        <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <span className="text-white font-bold text-2xl">N</span>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Verify Phone Number
            </CardTitle>
            <CardDescription className="text-gray-600 text-base mt-2">
              {oauthProvider === 'google' ? '🔗 Signed in with Google' : '🔗 Signed in with Facebook'}
              <br />
              Add your phone number to complete setup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            {!otpSent ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const countryCode = formData.get('countryCode') as string;
                const phone = formData.get('phone') as string;
                const fullPhone = countryCode + phone;
                addPhoneMutation.mutate(fullPhone);
              }} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="oauth-phone" className="text-sm font-semibold text-gray-700">Phone Number</Label>
                  <div className="flex gap-3">
                    <select name="countryCode" className="w-32 h-12 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500/20">
                      {COUNTRY_CODES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.code}
                        </option>
                      ))}
                    </select>
                    <Input
                      id="oauth-phone"
                      name="phone"
                      type="tel"
                      placeholder="9876543210"
                      className="flex-1 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 text-base"
                      required
                    />
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                  disabled={addPhoneMutation.isPending}
                >
                  {addPhoneMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending OTP...
                    </span>
                  ) : (
                    'Send Verification Code'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const phone = formData.get('phone') as string;
                const otp = formData.get('otp') as string;
                verifyPhoneMutation.mutate({ phone, otp });
              }} className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Enter Verification Code</Label>
                  <input type="hidden" name="phone" value={phoneForOtp} />
                  <Input
                    name="otp"
                    type="text"
                    placeholder="123456"
                    className="h-12 text-center text-2xl tracking-widest border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    maxLength={6}
                    required
                  />
                  <p className="text-sm text-gray-500 text-center">
                    Code sent to {phoneForOtp}
                  </p>
                </div>
                
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                  disabled={verifyPhoneMutation.isPending}
                >
                  {verifyPhoneMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Verifying...
                    </span>
                  ) : (
                    'Verify Phone Number'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

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
          {/* Social Login Options */}
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">Quick Sign In</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => window.location.href = '/api/auth/google'}
                variant="outline"
                className="h-11 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
              
              <Button
                onClick={() => window.location.href = '/api/auth/facebook'}
                variant="outline"
                className="h-11 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">Or continue with</span>
            </div>
          </div>

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