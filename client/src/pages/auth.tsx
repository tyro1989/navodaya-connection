import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { GraduationCap, Phone, UserPlus, ChevronDown } from "lucide-react";
import { 
  PROFESSION_CATEGORIES, 
  HELP_AREAS_CATEGORIES, 
  EXPERTISE_CATEGORIES,
  INDIAN_STATES,
  INDIAN_DISTRICTS 
} from "@/lib/constants";

// Development mode check
const isDevelopment = import.meta.env.MODE === 'development';



const phoneSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

// Development login schema - JNV fields mandatory, rest optional
const devLoginSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  batchYear: z.number().min(1990).max(new Date().getFullYear(), "Please select a valid batch year"),
  state: z.string().min(1, "JNV state is required"),
  district: z.string().min(1, "JNV district is required"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  profession: z.string().optional(),
  professionOther: z.string().optional(),
  pinCode: z.string().optional(),
  isExpert: z.boolean().optional(),
  expertiseAreas: z.array(z.string()).optional(),
  helpAreas: z.array(z.string()).optional(),
  dailyRequestLimit: z.number().min(1).max(20).optional(),
  upiId: z.string().optional(),
  bio: z.string().optional(),
});

const registrationSchema = insertUserSchema.extend({
  expertiseAreas: z.array(z.string()).optional(),
  helpAreas: z.array(z.string()).optional(),
});

type PhoneFormData = z.infer<typeof phoneSchema>;
type OtpFormData = z.infer<typeof otpSchema>;
type DevLoginFormData = z.infer<typeof devLoginSchema>;
type RegistrationFormData = z.infer<typeof registrationSchema>;

export default function Auth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { sendOtp, login, register } = useAuth();
  
  const [step, setStep] = useState<"phone" | "otp" | "register" | "dev-login">(isDevelopment ? "dev-login" : "phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const devLoginForm = useForm<DevLoginFormData>({
    resolver: zodResolver(devLoginSchema),
    defaultValues: { 
      name: "", 
      batchYear: 2020,
      state: "",
      district: "",
      email: "",
      profession: "Studying",
      pinCode: "560001",
      isExpert: false,
      expertiseAreas: [],
      helpAreas: [],
      dailyRequestLimit: 3,
      upiId: "",
      bio: "",
    },
  });

  const registrationForm = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      phone: "",
      name: "",
      email: "",
      batchYear: 2020,
      profession: "",
      professionOther: "",
      state: "",
      district: "",
      pinCode: "",
      gpsLocation: "",
      gpsEnabled: false,
      helpAreas: [],
      helpAreasOther: "",
      expertiseAreas: [],
      isExpert: false,
      dailyRequestLimit: 3,
      phoneVisible: false,
      upiId: "",
      bio: "",
      profileImage: "",
      isActive: true,
    },
  });

  const handleDevLogin = async (data: DevLoginFormData) => {
    try {
      // Create a mock phone number for development
      const mockPhone = "+919999999999";
      
      // First, try to send OTP to check if user exists
      try {
        await sendOtp(mockPhone);
        // If user exists, login with a mock OTP
        const mockOtp = "123456";
        const loginResult = await login(mockPhone, mockOtp);
        
        if (!loginResult.isNewUser) {
          // User exists, update their profile with new dev login data if needed
          toast({
            title: "Development Login Successful!",
            description: "You've been logged in with existing account for development testing.",
          });
          setLocation("/");
          return;
        }
      } catch (error) {
        // If sendOtp fails, user might not exist, continue with registration
      }
      
      // If we reach here, create a new user
      const userData = {
        phone: mockPhone,
        name: data.name,
        email: data.email || "",
        batchYear: data.batchYear || 2020,
        profession: data.profession || "Studying",
        professionOther: data.professionOther || "",
        state: data.state || "Karnataka",
        district: data.district || "Bengaluru Urban",
        pinCode: data.pinCode || "560001",
        gpsLocation: "",
        gpsEnabled: false,
        helpAreas: data.helpAreas || [],
        helpAreasOther: "",
        expertiseAreas: data.expertiseAreas || [],
        isExpert: data.isExpert || false,
        dailyRequestLimit: data.dailyRequestLimit || 3,
        phoneVisible: false,
        upiId: data.upiId || "",
        bio: data.bio || "",
        profileImage: "",
        isActive: true,
      };
      
      await register(userData);
      toast({
        title: "Development Login Successful!",
        description: "You've been logged in for development testing.",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendOtp = async (data: PhoneFormData) => {
    try {
      const result = await sendOtp(data.phone);
      setPhoneNumber(data.phone);
      if (result.otp) {
        setGeneratedOtp(result.otp);
        toast({
          title: "OTP Sent",
          description: `Your OTP is: ${result.otp} (Demo mode)`,
        });
      } else {
        toast({
          title: "OTP Sent",
          description: "Please check your SMS for the verification code.",
        });
      }
      setStep("otp");
    } catch (error: any) {
      toast({
        title: "Failed to send OTP",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleVerifyOtp = async (data: OtpFormData) => {
    try {
      const result = await login(phoneNumber, data.otp);
      if (result.isNewUser) {
        registrationForm.setValue("phone", phoneNumber);
        setStep("register");
      } else {
        toast({
          title: "Welcome back!",
          description: "You have been successfully logged in.",
        });
        setLocation("/");
      }
    } catch (error: any) {
      toast({
        title: "Invalid OTP",
        description: "Please check your OTP and try again.",
        variant: "destructive",
      });
    }
  };

  const handleRegister = async (data: RegistrationFormData) => {
    try {
      await register(data);
      toast({
        title: "Registration successful!",
        description: "Welcome to Navodaya Connection.",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Use imported constants for consistency across the app
  const currentYear = new Date().getFullYear();
  const batchYears = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <GraduationCap className="text-primary text-3xl" />
            <span className="text-2xl font-bold text-primary">Navodaya Connection</span>
          </div>
          <p className="text-gray-600">
            Connect with fellow alumni for support and guidance
          </p>
        </div>

        {/* Development Login Step */}
        {step === "dev-login" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5" />
                <span>Quick Development Login</span>
              </CardTitle>
              <p className="text-sm text-gray-600">
                Skip phone verification for development testing
              </p>
            </CardHeader>
            <CardContent>
              <Form {...devLoginForm}>
                <form onSubmit={devLoginForm.handleSubmit(handleDevLogin)} className="space-y-4">
                  <FormField
                    control={devLoginForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your full name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* JNV Batch Year - Mandatory */}
                  <FormField
                    control={devLoginForm.control}
                    name="batchYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>12th Passing Year *</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your 12th passing year" />
                          </SelectTrigger>
                          <SelectContent>
                            {batchYears.map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          Enter the year you would have passed 12th, even if you left JNV before completing 12th
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* JNV State - Mandatory */}
                  <FormField
                    control={devLoginForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>JNV State *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your JNV state" />
                          </SelectTrigger>
                          <SelectContent>
                            {INDIAN_STATES.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* JNV District - Mandatory */}
                  <FormField
                    control={devLoginForm.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>JNV District *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!devLoginForm.watch("state")}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={devLoginForm.watch("state") ? "Select your JNV district" : "Select state first"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {devLoginForm.watch("state") && INDIAN_DISTRICTS[devLoginForm.watch("state") as keyof typeof INDIAN_DISTRICTS]?.map((district: string) => (
                              <SelectItem key={district} value={district}>
                                {district}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Optional Fields Collapsible Section */}
                  <Collapsible open={showOptionalFields} onOpenChange={setShowOptionalFields}>
                    <CollapsibleTrigger asChild>
                      <Button type="button" variant="outline" className="w-full">
                        <ChevronDown className={`h-4 w-4 transition-transform ${showOptionalFields ? 'rotate-180' : ''}`} />
                        {showOptionalFields ? 'Hide' : 'Show'} Optional Details
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 mt-4">
                      {/* Email */}
                      <FormField
                        control={devLoginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="your.email@example.com"
                                type="email"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Profession */}
                      <FormField
                        control={devLoginForm.control}
                        name="profession"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profession</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select profession" />
                              </SelectTrigger>
                              <SelectContent>
                                {PROFESSION_CATEGORIES.map((profession) => (
                                  <SelectItem key={profession} value={profession}>
                                    {profession}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Pin Code */}
                      <FormField
                        control={devLoginForm.control}
                        name="pinCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pin Code</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="560001"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Expert Toggle */}
                      <FormField
                        control={devLoginForm.control}
                        name="isExpert"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>I want to help with my expertise</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                I can help others with my knowledge and experience
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />

                      {/* UPI ID - Only show when expert is checked */}
                      {devLoginForm.watch("isExpert") && (
                        <FormField
                          control={devLoginForm.control}
                          name="upiId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>UPI ID</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="yourname@paytm"
                                  {...field}
                                />
                              </FormControl>
                              <p className="text-sm text-muted-foreground">
                                Some users may send you money as a token of thanks once you help
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Bio */}
                      <FormField
                        control={devLoginForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us about yourself..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CollapsibleContent>
                  </Collapsible>

                  <Button type="submit" className="w-full">
                    Login for Development
                  </Button>
                  {!isDevelopment && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => setStep("phone")}
                    >
                      Use Phone Verification Instead
                    </Button>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Phone Number Step */}
        {step === "phone" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-5 w-5" />
                <span>Enter Phone Number</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...phoneForm}>
                <form onSubmit={phoneForm.handleSubmit(handleSendOtp)} className="space-y-4">
                  <FormField
                    control={phoneForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="+91 9876543210"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Send OTP
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* OTP Verification Step */}
        {step === "otp" && (
          <Card>
            <CardHeader>
              <CardTitle>Verify OTP</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...otpForm}>
                <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
                  <FormField
                    control={otpForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enter 6-digit OTP</FormLabel>
                        <FormControl>
                          <InputOTP
                            maxLength={6}
                            value={field.value}
                            onChange={field.onChange}
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </FormControl>
                        {generatedOtp && (
                          <p className="text-sm text-muted-foreground">
                            Demo OTP: {generatedOtp}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex space-x-2">
                    <Button type="submit" className="flex-1">
                      Verify OTP
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("phone")}
                    >
                      Back
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Registration Step */}
        {step === "register" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5" />
                <span>Complete Registration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <Form {...registrationForm}>
                <form onSubmit={registrationForm.handleSubmit(handleRegister)} className="space-y-4">
                  <FormField
                    control={registrationForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registrationForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registrationForm.control}
                    name="batchYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>12th Passing Year*</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="12th Passing Year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {batchYears.map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          Select the year you would have passed 12th, even if you left JNV before completing 12th
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* JNV Location */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">JNV Location</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={registrationForm.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>JNV State*</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your JNV state" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {INDIAN_STATES.map((state) => (
                                  <SelectItem key={state} value={state}>
                                    {state}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registrationForm.control}
                        name="district"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>JNV District*</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!registrationForm.watch("state")}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={registrationForm.watch("state") ? "Select your JNV district" : "Select state first"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {registrationForm.watch("state") && INDIAN_DISTRICTS[registrationForm.watch("state") as keyof typeof INDIAN_DISTRICTS]?.map((district: string) => (
                                  <SelectItem key={district} value={district}>
                                    {district}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={registrationForm.control}
                    name="profession"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profession*</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your profession" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PROFESSION_CATEGORIES.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {registrationForm.watch("profession") === "Other" && (
                    <FormField
                      control={registrationForm.control}
                      name="professionOther"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Please specify your profession</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your profession details" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Residential Address */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Current Residential Address</h3>
                    <FormField
                      control={registrationForm.control}
                      name="pinCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pin Code</FormLabel>
                          <FormControl>
                            <Input placeholder="560001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={registrationForm.control}
                    name="gpsEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Enable GPS Location
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            We'll store your GPS location for better matching. We won't share it until you provide permission.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />



                  <FormField
                    control={registrationForm.control}
                    name="isExpert"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I want to help with my expertise
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Check this if you'd like to provide guidance to fellow alumni
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  {registrationForm.watch("isExpert") && (
                    <>
                      <FormField
                        control={registrationForm.control}
                        name="helpAreas"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Which area could you provide help and support?</FormLabel>
                            <div className="space-y-2">
                              {HELP_AREAS_CATEGORIES.map((option) => (
                                <div key={option} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={option}
                                    checked={field.value?.includes(option) || false}
                                    onCheckedChange={(checked) => {
                                      const currentValues = field.value || [];
                                      if (checked) {
                                        field.onChange([...currentValues, option]);
                                      } else {
                                        field.onChange(currentValues.filter(value => value !== option));
                                      }
                                    }}
                                  />
                                  <label htmlFor={option} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {option}
                                  </label>
                                </div>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {registrationForm.watch("helpAreas")?.includes("Other") && (
                        <FormField
                          control={registrationForm.control}
                          name="helpAreasOther"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Please specify other areas where you can help</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter details about other areas where you can provide help" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={registrationForm.control}
                        name="dailyRequestLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Daily Request Limit</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[1, 2, 3, 4, 5].map((limit) => (
                                  <SelectItem key={limit} value={limit.toString()}>
                                    {limit} request{limit > 1 ? "s" : ""} per day
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registrationForm.control}
                        name="phoneVisible"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Make my phone number visible for direct contact
                              </FormLabel>
                              <p className="text-sm text-muted-foreground">
                                This allows users to contact you directly via WhatsApp
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registrationForm.control}
                        name="upiId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UPI ID</FormLabel>
                            <FormControl>
                              <Input placeholder="yourname@paytm" {...field} />
                            </FormControl>
                            <p className="text-sm text-muted-foreground">
                              Some users may send you money as a token of thanks once you help
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <div className="flex space-x-2 pt-4">
                    <Button type="submit" className="flex-1">
                      Complete Registration
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("otp")}
                    >
                      Back
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
