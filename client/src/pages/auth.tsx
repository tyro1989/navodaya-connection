import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { emailSignupSchema, emailLoginSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import type { EmailSignup, EmailLogin } from "@shared/schema";
import { z } from "zod";

// Registration completion schema
const registrationCompletionSchema = z.object({
  batchYear: z.number().min(1990).max(new Date().getFullYear()),
  profession: z.string().min(1, "Profession is required"),
  state: z.string().min(1, "State is required"),
  district: z.string().min(1, "District is required"),
});

type RegistrationCompletion = z.infer<typeof registrationCompletionSchema>;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check URL parameters for registration completion
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('complete_registration') === 'true') {
      setShowCompletionForm(true);
    }
  }, []);

  // Login form
  const loginForm = useForm<EmailLogin>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Signup form
  const signupForm = useForm<EmailSignup>({
    resolver: zodResolver(emailSignupSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      batchYear: new Date().getFullYear(),
      profession: "",
      state: "",
      district: "",
    },
  });

  // Registration completion form
  const completionForm = useForm<RegistrationCompletion>({
    resolver: zodResolver(registrationCompletionSchema),
    defaultValues: {
      batchYear: new Date().getFullYear(),
      profession: "",
      state: "",
      district: "",
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: EmailLogin) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: async (data: EmailSignup) => {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Account created successfully",
        description: data.message,
      });
      // Show verification token in development
      if (data.verificationToken) {
        toast({
          title: "Development Mode",
          description: `Verification token: ${data.verificationToken}`,
          duration: 10000,
        });
      }
      setIsLogin(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Registration completion mutation
  const completionMutation = useMutation({
    mutationFn: async (data: RegistrationCompletion) => {
      const response = await fetch("/api/auth/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Registration completed",
        description: "Welcome to Navodaya Connection!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration completion failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: EmailLogin) => {
    loginMutation.mutate(data);
  };

  const onSignupSubmit = (data: EmailSignup) => {
    signupMutation.mutate(data);
  };

  const onCompletionSubmit = (data: RegistrationCompletion) => {
    completionMutation.mutate(data);
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const states = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
  ];

  if (showCompletionForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Complete Your Registration
            </CardTitle>
            <CardDescription>
              Please provide your Navodaya alumni information to complete your account setup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={completionForm.handleSubmit(onCompletionSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchYear">Batch Year</Label>
                  <Input
                    id="batchYear"
                    type="number"
                    {...completionForm.register("batchYear", { valueAsNumber: true })}
                    placeholder="2020"
                  />
                  {completionForm.formState.errors.batchYear && (
                    <p className="text-sm text-red-500">
                      {completionForm.formState.errors.batchYear.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profession">Profession</Label>
                  <Input
                    id="profession"
                    {...completionForm.register("profession")}
                    placeholder="Your profession"
                  />
                  {completionForm.formState.errors.profession && (
                    <p className="text-sm text-red-500">
                      {completionForm.formState.errors.profession.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">JNV State</Label>
                  <select
                    id="state"
                    {...completionForm.register("state")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select state</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  {completionForm.formState.errors.state && (
                    <p className="text-sm text-red-500">
                      {completionForm.formState.errors.state.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">JNV District</Label>
                  <Input
                    id="district"
                    {...completionForm.register("district")}
                    placeholder="District name"
                  />
                  {completionForm.formState.errors.district && (
                    <p className="text-sm text-red-500">
                      {completionForm.formState.errors.district.message}
                    </p>
                  )}
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={completionMutation.isPending}
              >
                {completionMutation.isPending ? "Completing..." : "Complete Registration"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isLogin ? "Sign In" : "Create Account"}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? "Sign in to your Navodaya Connection account" 
              : "Join the Navodaya Connection community"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Login Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white dark:bg-gray-900 px-2 text-sm text-gray-500">
                or
              </span>
            </div>
          </div>

          {/* Email Forms */}
          {isLogin ? (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...loginForm.register("email")}
                  placeholder="Enter your email"
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...loginForm.register("password")}
                  placeholder="Enter your password"
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
                  <Label htmlFor="name">Full Name</Label>
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
                  <Label htmlFor="batchYear">Batch Year</Label>
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...signupForm.register("email")}
                  placeholder="Enter your email"
                />
                {signupForm.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {signupForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...signupForm.register("password")}
                  placeholder="Create a password"
                />
                {signupForm.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {signupForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="profession">Current Profession</Label>
                <Input
                  id="profession"
                  {...signupForm.register("profession")}
                  placeholder="Your current profession"
                />
                {signupForm.formState.errors.profession && (
                  <p className="text-sm text-red-500">
                    {signupForm.formState.errors.profession.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">JNV State</Label>
                  <select
                    id="state"
                    {...signupForm.register("state")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select state</option>
                    {states.map((state) => (
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
                  <Label htmlFor="district">JNV District</Label>
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
                {signupMutation.isPending ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}