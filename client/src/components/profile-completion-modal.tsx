import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PROFESSION_CATEGORIES, INDIAN_STATES, INDIAN_DISTRICTS } from "@/lib/constants";
import { User, GraduationCapIcon, MapPin, Mail, UserCircle, Calendar, Briefcase, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import type { User as UserType } from "@shared/schema";

interface ProfileCompletionModalProps {
  isOpen: boolean;
  user: UserType;
  onComplete: (updatedUser: UserType) => void;
}

interface ProfileFormData {
  name: string;
  email?: string;
  password: string;
  confirmPassword: string;
  batchYear: number;
  state: string; // JNV State
  district: string; // JNV District
  profession?: string;
  professionOther?: string;
  bio?: string;
}

// Generate batch years from 1988 (first JNV batch) to current year
const currentYear = new Date().getFullYear();
const JNV_BATCH_YEARS = Array.from(
  { length: currentYear - 1987 }, 
  (_, i) => 1988 + i
).reverse();

export default function ProfileCompletionModal({ 
  isOpen, 
  user, 
  onComplete 
}: ProfileCompletionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedState, setSelectedState] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid }
  } = useForm<ProfileFormData>({
    mode: "onChange",
    defaultValues: {
      name: user.name || "",
      email: user.email || "",
      password: "",
      confirmPassword: "",
      batchYear: user.batchYear || undefined,
      state: user.state || "",
      district: user.district || "",
      profession: user.profession || "",
      professionOther: user.professionOther || "",
      bio: user.bio || "",
    }
  });

  const watchedProfession = watch("profession");
  const watchedState = watch("state");

  // Update available districts when state changes
  const availableDistricts = watchedState ? INDIAN_DISTRICTS[watchedState] || [] : [];

  // Register validation rules for mandatory fields
  register("batchYear", { required: "Batch year is required" });
  register("state", { required: "JNV state is required" });  
  register("district", { required: "JNV district is required" });
  register("password", { 
    required: "Password is required",
    minLength: { value: 6, message: "Password must be at least 6 characters" }
  });
  register("confirmPassword", {
    required: "Please confirm your password",
    validate: (value) => {
      const password = watch("password");
      return value === password || "Passwords do not match";
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: ProfileFormData) => {
      console.log("Sending profile data:", profileData);
      const result = await apiRequest("PUT", "/api/auth/profile", profileData);
      console.log("Profile update response:", result);
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "🎉 Welcome to Navodaya Connect!",
        description: "Your profile has been completed successfully. You can now start connecting with fellow alumni.",
        duration: 5000,
        className: "border-green-200 bg-green-50 text-green-800",
      });
      onComplete(data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      console.error("Profile update error:", error);
      toast({
        title: "Profile Update Failed", 
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    // Clean up the data before sending
    const cleanedData = { ...data };
    
    // Remove empty optional fields
    if (!cleanedData.email?.trim()) {
      delete cleanedData.email;
    }
    if (!cleanedData.profession?.trim()) {
      delete cleanedData.profession;
      delete cleanedData.professionOther;
    }
    if (!cleanedData.bio?.trim()) {
      delete cleanedData.bio;
    }
    
    updateProfileMutation.mutate(cleanedData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            <strong>Debug:</strong> Profile completion check includes: name, batchYear, state, district, password
          </div>
        )}
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-xl">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <GraduationCapIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <span>Complete Your JNV Profile</span>
              <Badge variant="secondary" className="ml-2 text-xs">Required</Badge>
            </div>
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Welcome to Navodaya Connect! Please complete your JNV profile with the basic details 
            to connect with fellow alumni. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center space-x-2">
              <UserCircle className="h-4 w-4" />
              <span>Full Name *</span>
            </Label>
            <Input
              id="name"
              {...register("name", {
                required: "Full name is required",
                minLength: { value: 2, message: "Name must be at least 2 characters" }
              })}
              placeholder="Enter your full name"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Email Address (Optional)</span>
            </Label>
            <Input
              id="email"
              type="email"
              {...register("email", {
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Please enter a valid email address"
                }
              })}
              placeholder="your.email@example.com (optional)"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password Section */}
          <div className="bg-orange-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-orange-900 flex items-center space-x-2">
              <Lock className="h-4 w-4" />
              <span>Set Your Login Password</span>
            </h3>
            <p className="text-sm text-orange-700">
              Choose a password so you can login with either your phone number + password or OTP in the future.
            </p>
            
            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center space-x-2">
                <Lock className="h-4 w-4" />
                <span>Password *</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "Password must be at least 6 characters" }
                  })}
                  placeholder="Enter a secure password"
                  className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center space-x-2">
                <Lock className="h-4 w-4" />
                <span>Confirm Password *</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) => {
                      const password = watch("password");
                      return value === password || "Passwords do not match";
                    }
                  })}
                  placeholder="Confirm your password"
                  className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* JNV Details Section */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-blue-900 flex items-center space-x-2">
              <GraduationCapIcon className="h-4 w-4" />
              <span>Jawahar Navodaya Vidyalaya Details</span>
            </h3>
            
            {/* Batch Year */}
            <div className="space-y-2">
              <Label htmlFor="batchYear" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>JNV Batch Year *</span>
              </Label>
              <Select
                value={watch("batchYear")?.toString() || ""}
                onValueChange={(value) => {
                  setValue("batchYear", parseInt(value));
                  trigger("batchYear");
                }}
              >
                <SelectTrigger className={errors.batchYear ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select your JNV batch year" />
                </SelectTrigger>
                <SelectContent>
                  {JNV_BATCH_YEARS.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.batchYear && (
                <p className="text-sm text-red-600">Batch year is required</p>
              )}
            </div>

            {/* JNV State */}
            <div className="space-y-2">
              <Label htmlFor="state" className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>JNV State *</span>
              </Label>
              <Select
                value={watchedState}
                onValueChange={(value) => {
                  setValue("state", value);
                  setValue("district", ""); // Reset district when state changes
                  trigger("state");
                }}
              >
                <SelectTrigger className={errors.state ? "border-red-500" : ""}>
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
              {errors.state && (
                <p className="text-sm text-red-600">JNV state is required</p>
              )}
            </div>

            {/* JNV District */}
            <div className="space-y-2">
              <Label htmlFor="district" className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>JNV District *</span>
              </Label>
              <Select
                value={watch("district")}
                onValueChange={(value) => {
                  setValue("district", value);
                  trigger("district");
                }}
                disabled={!watchedState}
              >
                <SelectTrigger className={errors.district ? "border-red-500" : ""}>
                  <SelectValue placeholder={
                    watchedState 
                      ? "Select your JNV district" 
                      : "Select state first"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableDistricts.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.district && (
                <p className="text-sm text-red-600">JNV district is required</p>
              )}
            </div>
          </div>

          {/* Current Profession */}
          <div className="space-y-2">
            <Label htmlFor="profession" className="flex items-center space-x-2">
              <Briefcase className="h-4 w-4" />
              <span>Current Profession (Optional)</span>
            </Label>
            <Select
              value={watchedProfession || ""}
              onValueChange={(value) => {
                setValue("profession", value);
                trigger("profession");
              }}
            >
              <SelectTrigger className={errors.profession ? "border-red-500" : ""}>
                <SelectValue placeholder="Choose a profession or leave empty to skip" />
              </SelectTrigger>
              <SelectContent>
                {PROFESSION_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.profession && (
              <p className="text-sm text-red-600">Profession is required</p>
            )}
          </div>

          {/* Other Profession (if "Other" selected) */}
          {watchedProfession === "Other" && (
            <div className="space-y-2">
              <Label htmlFor="professionOther">
                Please specify your profession
              </Label>
              <Input
                id="professionOther"
                {...register("professionOther", {
                  required: watchedProfession === "Other" ? "Please specify your profession" : false
                })}
                placeholder="e.g., Entrepreneur, Freelancer, etc."
              />
              {errors.professionOther && (
                <p className="text-sm text-red-600">{errors.professionOther.message}</p>
              )}
            </div>
          )}

          {/* Bio (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="bio">
              Brief Introduction (Optional)
            </Label>
            <Textarea
              id="bio"
              {...register("bio")}
              placeholder="Tell fellow alumni about yourself, your interests, or how you'd like to help the community..."
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              This helps other alumni understand your background and connect with you more effectively.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button
              type="submit"
              disabled={!isValid || updateProfileMutation.isPending}
              className="min-w-[140px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Completing...
                </>
              ) : (
                "Complete Profile"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}