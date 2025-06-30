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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { GraduationCap, Phone, UserPlus } from "lucide-react";

const phoneSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

const registrationSchema = insertUserSchema.extend({
  expertiseAreas: z.array(z.string()).optional(),
});

type PhoneFormData = z.infer<typeof phoneSchema>;
type OtpFormData = z.infer<typeof otpSchema>;
type RegistrationFormData = z.infer<typeof registrationSchema>;

export default function Auth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { sendOtp, login, register } = useAuth();
  
  const [step, setStep] = useState<"phone" | "otp" | "register">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const registrationForm = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      phone: "",
      name: "",
      email: "",
      batchYear: 2020,
      profession: "",
      location: "",
      pinCode: "",
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

  const expertiseOptions = [
    "Medical/Healthcare",
    "Engineering",
    "Education/Teaching",
    "Legal",
    "Business/Finance",
    "IT/Technology",
    "Agriculture",
    "Government/Civil Services",
    "Research/Science",
    "Other",
  ];

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
                        <FormLabel>Batch Year*</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your batch year" />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registrationForm.control}
                    name="profession"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profession*</FormLabel>
                        <FormControl>
                          <Input placeholder="Your current profession" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registrationForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location*</FormLabel>
                        <FormControl>
                          <Input placeholder="City, State, Country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registrationForm.control}
                    name="pinCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PIN Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Your PIN code" {...field} />
                        </FormControl>
                        <FormMessage />
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
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I want to be an expert and help others
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
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell others about your expertise and experience"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                                checked={field.value}
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
                            <FormLabel>UPI ID (for gratitude payments)</FormLabel>
                            <FormControl>
                              <Input placeholder="yourname@paytm" {...field} />
                            </FormControl>
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
