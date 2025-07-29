import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import Navigation from "@/components/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { 
  User, 
  Settings, 
  Star, 
  MessageCircle, 
  Phone,
  Mail,
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  Camera,
  CheckCircle,
  LogOut,
  Upload,
  X
} from "lucide-react";
import { 
  PROFESSION_CATEGORIES, 
  INDIAN_STATES, 
  INDIAN_DISTRICTS 
} from "@/lib/constants";
import { Label } from "@/components/ui/label";

const profileFormSchema = insertUserSchema.partial();

type ProfileFormData = z.infer<typeof profileFormSchema>;

// Use imported constants for consistency across the app
const currentYear = new Date().getFullYear();
const batchYears = Array.from({ length: 30 }, (_, i) => currentYear - i);

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Early return if no user to prevent hook violations
  if (!user) {
    return <div>Loading...</div>;
  }

  const [activeTab, setActiveTab] = useState("profile");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name || "",
      email: user.email || "",
      gender: user.gender || "",
      batchYear: user.batchYear || 2020,
      profession: user.profession || "",
      professionOther: user.professionOther || "",
      // JNV Location
      state: user.state || "",
      district: user.district || "",
      // Current Residential Address
      currentState: user.currentState || "",
      currentDistrict: user.currentDistrict || "",
      pinCode: user.pinCode || "",
      gpsLocation: user.gpsLocation || "",
      gpsEnabled: user.gpsEnabled || false,
      phoneVisible: user.phoneVisible || false,
      upiId: user.upiId || "",
      bio: user.bio || "",
      profileImage: user.profileImage || "",
    },
  });

  // Reset form when user data changes
  useEffect(() => {
    form.reset({
      name: user.name || "",
      email: user.email || "",
      gender: user.gender || "",
      batchYear: user.batchYear || 2020,
      profession: user.profession || "",
      professionOther: user.professionOther || "",
      // JNV Location
      state: user.state || "",
      district: user.district || "",
      // Current Residential Address
      currentState: user.currentState || user.state || "", // Default to JNV state if no current state
      currentDistrict: user.currentDistrict || user.district || "", // Default to JNV district if no current district
      pinCode: user.pinCode || "",
      gpsLocation: user.gpsLocation || "",
      gpsEnabled: user.gpsEnabled || false,
      phoneVisible: user.phoneVisible || false,
      upiId: user.upiId || "",
      bio: user.bio || "",
      profileImage: user.profileImage || "",
    });
  }, [user, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      let imageUrl = data.profileImage;
      
      // Upload profile image if selected
      if (profileImageFile) {
        const formData = new FormData();
        formData.append('image', profileImageFile);
        
        const uploadResponse = await fetch('/api/upload/profile-image', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.url;
        } else {
          const errorText = await uploadResponse.text();
          console.error('Upload failed:', errorText);
          throw new Error(`Failed to upload image: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }
      }
      
      const response = await apiRequest("PUT", "/api/users/profile", { ...data, profileImage: imageUrl });
      return response;
    },
    onSuccess: (data) => {
      updateUser(data.user);
      toast({
        title: "Profile updated successfully!",
        description: "Your profile has been updated.",
      });
      setProfileImageFile(null);
      setProfileImagePreview(null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update profile",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, file.type, file.size);
      
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a JPEG, PNG, GIF, or WebP image.",
          variant: "destructive",
        });
        return;
      }
      
      setProfileImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      toast({
        title: "Image selected",
        description: "Click 'Save Changes' to upload your new profile picture.",
        duration: 3000,
      });
    }
  };

  const removeProfileImage = () => {
    setProfileImageFile(null);
    setProfileImagePreview(null);
    form.setValue("profileImage", null);
    
    toast({
      title: "Profile picture removed",
      description: "Click 'Save Changes' to update your profile.",
      duration: 2000,
    });
  };

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <Navigation />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">Profile Settings</h1>
              <p className="text-gray-600 text-lg max-w-2xl">Manage your personal information and preferences • Keep your profile updated</p>
            </div>
            <div className="flex items-center justify-center sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm border-gray-200/50 hover:bg-gray-50 transition-all duration-200 px-6 py-3 rounded-xl shadow-sm"
              >
                <User className="h-4 w-4" />
                <span>Back to Home</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Profile Header */}
        <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-purple-600/10 p-1">
            <CardContent className="p-8 bg-white/90 backdrop-blur-sm rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="relative mx-auto sm:mx-0">
                  <Avatar className="h-28 w-28 ring-4 ring-white shadow-xl">
                    <AvatarImage 
                      src={profileImagePreview || user.profileImage || ""} 
                      alt={user.name} 
                    />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {(profileImagePreview || user.profileImage) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute -top-1 -right-1 h-8 w-8 rounded-full p-0 bg-white/90 border-2 border-red-200 hover:border-red-300 hover:bg-red-50 shadow-lg backdrop-blur-sm transition-all duration-200 group"
                      onClick={removeProfileImage}
                      title="Remove profile picture"
                    >
                      <X className="h-4 w-4 text-red-500 group-hover:text-red-600 transition-colors" />
                    </Button>
                  )}
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">{user.name}</h2>
                  <p className="text-gray-600 mb-4 text-lg">{user.profession} • Batch {user.batchYear}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-gray-600 mb-4">
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-blue-600" />
                      </div>
                      <span>{user.state}, {user.district}</span>
                    </div>
                    {user.email && (
                      <div className="flex items-center justify-center sm:justify-start space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                          <Mail className="h-4 w-4 text-green-600" />
                        </div>
                        <span>{user.email}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-center sm:justify-start space-x-3">
                    {user.isExpert && (
                      <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-1 rounded-full shadow-sm">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Expert
                      </Badge>
                    )}
                    <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200 px-3 py-1 rounded-full">
                      {user.phone ? "✓ Verified" : "⚠ Unverified"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Profile Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-center mb-8">
            <TabsList className="inline-flex h-12 items-center justify-center w-full max-w-md bg-white/60 backdrop-blur-sm border border-gray-200/50 shadow-lg rounded-2xl p-1 gap-1">
              <TabsTrigger 
                value="profile"
                className="flex items-center justify-center space-x-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:bg-gray-50 font-medium py-3 px-4 flex-1 min-h-[40px] flex-shrink-0 whitespace-nowrap"
              >
                <User className="h-4 w-4" />
                <span>Personal Info</span>
              </TabsTrigger>
              <TabsTrigger 
                value="account"
                className="flex items-center justify-center space-x-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:bg-gray-50 font-medium py-3 px-4 flex-1 min-h-[40px] flex-shrink-0 whitespace-nowrap"
              >
                <Settings className="h-4 w-4" />
                <span>Account</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Personal Information Tab */}
          <TabsContent value="profile" className="mt-0">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-b border-gray-100/50">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent flex items-center gap-2">
                          <Camera className="h-5 w-5 text-blue-600" />
                          Profile Picture
                        </h3>
                        <p className="text-gray-600">Upload a professional photo to help others recognize you</p>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 bg-gradient-to-r from-gray-50/50 to-blue-50/30 rounded-xl border border-gray-100/50">
                        <div className="relative mx-auto sm:mx-0">
                          <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg">
                            <AvatarImage 
                              src={profileImagePreview || user.profileImage || ""} 
                              alt={user.name} 
                            />
                            <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                              {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          {(profileImagePreview || user.profileImage) && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="absolute -top-1 -right-1 h-8 w-8 rounded-full p-0 bg-white/90 border-2 border-red-200 hover:border-red-300 hover:bg-red-50 shadow-lg backdrop-blur-sm transition-all duration-200 group"
                              onClick={removeProfileImage}
                              title="Remove profile picture"
                            >
                              <X className="h-4 w-4 text-red-500 group-hover:text-red-600 transition-colors" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex-1 text-center sm:text-left">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <Button 
                              type="button" 
                              onClick={() => fileInputRef.current?.click()}
                              className="cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload New Photo
                            </Button>
                            <Input
                              ref={fileInputRef}
                              id="profile-image-upload-settings"
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </div>
                          <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                            JPG, PNG, GIF or WebP • Maximum size 5MB • Recommended: 400×400px
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent flex items-center gap-2">
                          <User className="h-5 w-5 text-blue-600" />
                          Basic Information
                        </h3>
                        <p className="text-gray-600">Essential details about yourself</p>
                      </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name*</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="batchYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>12th Passing Year*</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
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
                    </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent flex items-center gap-2">
                          <GraduationCap className="h-5 w-5 text-blue-600" />
                          JNV Location
                        </h3>
                        <p className="text-gray-600">Which Jawahar Navodaya Vidyalaya did you attend?</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>JNV State</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
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
                          control={form.control}
                          name="district"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>JNV District</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""} disabled={!form.watch("state")}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={form.watch("state") ? "Select your JNV district" : "Select state first"} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {form.watch("state") && INDIAN_DISTRICTS[form.watch("state") as keyof typeof INDIAN_DISTRICTS]?.map((district: string) => (
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
                      control={form.control}
                      name="profession"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profession*</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
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

                    {form.watch("profession") === "Other" && (
                      <FormField
                        control={form.control}
                        name="professionOther"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Please specify your profession</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your profession details" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-blue-600" />
                          Current Residential Address
                        </h3>
                        <p className="text-gray-600">Where do you currently live?</p>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-gray-600">
                          Enter your current residential address (where you live now)
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const jnvState = form.getValues("state");
                            const jnvDistrict = form.getValues("district");
                            if (jnvState) {
                              form.setValue("currentState", jnvState);
                              if (jnvDistrict) {
                                form.setValue("currentDistrict", jnvDistrict);
                              }
                              toast({
                                title: "Location copied",
                                description: "JNV location has been copied to residential address",
                              });
                            }
                          }}
                        >
                          Copy from JNV Location
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="currentState"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current State</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select current state" />
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
                              <FormDescription>
                                State where you currently live
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="currentDistrict"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current District</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""} disabled={!form.watch("currentState")}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={form.watch("currentState") ? "Select current district" : "Select state first"} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {form.watch("currentState") && INDIAN_DISTRICTS[form.watch("currentState") as keyof typeof INDIAN_DISTRICTS]?.map((district: string) => (
                                    <SelectItem key={district} value={district}>
                                      {district}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                District where you currently live
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="pinCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PIN Code</FormLabel>
                              <FormControl>
                                <Input placeholder="560001" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormDescription>
                                PIN code of your current address
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us about yourself..."
                              className="resize-none"
                              rows={3}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            A brief description about yourself (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-center pt-6">
                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 min-w-[200px]"
                      >
                        {updateProfileMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Saving Changes...
                          </div>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>


          {/* Account Tab */}
          <TabsContent value="account" className="mt-0">
            <div className="space-y-8">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50/80 to-violet-50/80 border-b border-gray-100/50">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                      <Settings className="h-4 w-4 text-white" />
                    </div>
                    Privacy & Payment Settings
                  </CardTitle>
                  <p className="text-gray-600 text-base leading-relaxed">
                    Manage your contact preferences and payment information.
                  </p>
                </CardHeader>
                <CardContent className="p-8">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="phoneVisible"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
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
                              <FormDescription>
                                This allows users to contact you directly via WhatsApp when you help them.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="upiId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UPI ID (for gratitude payments)</FormLabel>
                            <FormControl>
                              <Input placeholder="yourname@paytm" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormDescription>
                              Users can send token payments to show gratitude for your help (optional).
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-center pt-6">
                        <Button 
                          type="submit" 
                          disabled={updateProfileMutation.isPending}
                          className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 min-w-[200px]"
                        >
                          {updateProfileMutation.isPending ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Saving Settings...
                            </div>
                          ) : (
                            "Save Settings"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-50/80 to-blue-50/80 border-b border-gray-100/50">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-xl border border-green-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <Phone className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Phone Number</h4>
                        <p className="text-gray-600">{user.phone}</p>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-1 rounded-full shadow-sm">✓ Verified</Badge>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl border border-blue-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Account Status</h4>
                        <p className="text-gray-600">
                          {user.isActive ? "Your account is active and ready to use" : "Account is currently inactive"}
                        </p>
                      </div>
                    </div>
                    <Badge className={`px-3 py-1 rounded-full shadow-sm ${
                      user.isActive 
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white" 
                        : "bg-gradient-to-r from-gray-400 to-gray-500 text-white"
                    }`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="p-5 bg-gradient-to-r from-purple-50/50 to-violet-50/50 rounded-xl border border-purple-100/50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                        <Heart className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Member Since</h4>
                        <p className="text-gray-600">
                          {(() => {
                            try {
                              const date = user.createdAt ? new Date(user.createdAt) : null;
                              if (!date || isNaN(date.getTime())) {
                                return "Recently joined";
                              }
                              return date.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              });
                            } catch (error) {
                              return "Recently joined";
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-purple-600 font-medium ml-13">Thank you for being part of the Navodaya Connect community!</p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-gradient-to-r from-red-50/50 to-pink-50/50 rounded-xl border border-red-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <LogOut className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Account Actions</h4>
                        <p className="text-gray-600">Sign out of your account on this device</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => logout()}
                      className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
