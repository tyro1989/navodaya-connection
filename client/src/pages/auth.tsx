import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { z } from "zod";

// Phone-based signup schema
const phoneSignupSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  batchYear: z.number().int().min(1970).max(new Date().getFullYear() + 10),
  state: z.string().min(2, "JNV State is required"), 
  district: z.string().min(2, "JNV District is required")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Login schema for existing users
const phoneLoginSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(1, "Password is required")
});

type PhoneSignup = z.infer<typeof phoneSignupSchema>;
type PhoneLogin = z.infer<typeof phoneLoginSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const [isLogin, setIsLogin] = useState(false); // Default to signup

  // Form configurations
  const loginForm = useForm<PhoneLogin>({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: {
      phone: "",
      password: ""
    }
  });

  const signupForm = useForm<PhoneSignup>({
    resolver: zodResolver(phoneSignupSchema),
    defaultValues: {
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      batchYear: new Date().getFullYear(),
      state: "",
      district: ""
    }
  });

  // Mutations
  const loginMutation = useMutation({
    mutationFn: async (data: PhoneLogin) => {
      return await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      navigate("/");
    },
    onError: (error: Error) => {
      console.error("Login failed:", error.message);
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: PhoneSignup) => {
      return await apiRequest("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      navigate("/");
    },
    onError: (error: Error) => {
      console.error("Signup failed:", error.message);
    },
  });

  // JNV States list
  const jnvStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
  ];

  const onLoginSubmit = (data: PhoneLogin) => {
    loginMutation.mutate(data);
  };

  const onSignupSubmit = (data: PhoneSignup) => {
    signupMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isLogin ? "Sign In" : "Join Navodaya Connection"}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? "Sign in to your account" 
              : "Create your account to connect with Navodaya alumni"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLogin ? (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...loginForm.register("phone")}
                  placeholder="+91 9876543210"
                />
                {loginForm.formState.errors.phone && (
                  <p className="text-sm text-red-500">
                    {loginForm.formState.errors.phone.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...loginForm.register("password")}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    {...signupForm.register("name")}
                    placeholder="Your full name"
                  />
                  {signupForm.formState.errors.name && (
                    <p className="text-sm text-red-500">
                      {signupForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batchYear">12th Passing Year *</Label>
                  <Input
                    id="batchYear"
                    type="number"
                    {...signupForm.register("batchYear", { valueAsNumber: true })}
                    placeholder="2020"
                  />
                  {signupForm.formState.errors.batchYear && (
                    <p className="text-sm text-red-500">
                      {signupForm.formState.errors.batchYear.message}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...signupForm.register("phone")}
                  placeholder="+91 9876543210"
                />
                {signupForm.formState.errors.phone && (
                  <p className="text-sm text-red-500">
                    {signupForm.formState.errors.phone.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  {...signupForm.register("email")}
                  placeholder="your.email@example.com"
                />
                {signupForm.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {signupForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    {...signupForm.register("password")}
                    placeholder="Minimum 6 characters"
                  />
                  {signupForm.formState.errors.password && (
                    <p className="text-sm text-red-500">
                      {signupForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...signupForm.register("confirmPassword")}
                    placeholder="Re-enter password"
                  />
                  {signupForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {signupForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">JNV State *</Label>
                  <select
                    id="state"
                    {...signupForm.register("state")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select state</option>
                    {jnvStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  {signupForm.formState.errors.state && (
                    <p className="text-sm text-red-500">
                      {signupForm.formState.errors.state.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">JNV District *</Label>
                  <Input
                    id="district"
                    {...signupForm.register("district")}
                    placeholder="District name"
                  />
                  {signupForm.formState.errors.district && (
                    <p className="text-sm text-red-500">
                      {signupForm.formState.errors.district.message}
                    </p>
                  )}
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={signupMutation.isPending}
              >
                {signupMutation.isPending ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          )}
          
          <div className="text-center">
            <Button
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}