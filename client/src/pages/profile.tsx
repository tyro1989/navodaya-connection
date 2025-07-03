import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  HELP_AREAS_CATEGORIES, 
  EXPERTISE_CATEGORIES, 
  INDIAN_STATES, 
  INDIAN_DISTRICTS 
} from "@/lib/constants";
import { Label } from "@/components/ui/label";

const profileFormSchema = insertUserSchema.partial().extend({
  expertiseAreas: z.array(z.string()).optional(),
  helpAreas: z.array(z.string()).optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

// Use imported constants for consistency across the app
const currentYear = new Date().getFullYear();
const batchYears = Array.from({ length: 30 }, (_, i) => currentYear - i);

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      gender: user?.gender || "",
      batchYear: user?.batchYear || 2020,
      profession: user?.profession || "",
      professionOther: user?.professionOther || "",
      // JNV Location
      state: user?.state || "",
      district: user?.district || "",
      // Current Residential Address
      currentState: user?.currentState || "",
      currentDistrict: user?.currentDistrict || "",
      pinCode: user?.pinCode || "",
      gpsLocation: user?.gpsLocation || "",
      gpsEnabled: user?.gpsEnabled || false,
      helpAreas: user?.helpAreas || [],
      helpAreasOther: user?.helpAreasOther || "",
      expertiseAreas: user?.expertiseAreas || [],
      isExpert: user?.isExpert || false,
      dailyRequestLimit: user?.dailyRequestLimit || 3,
      phoneVisible: user?.phoneVisible || false,
      upiId: user?.upiId || "",
      bio: user?.bio || "",
      profileImage: user?.profileImage || "",
    },
  });

  // Reset form when user data changes
  useEffect(() => {
    if (user) {
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
        helpAreas: user.helpAreas || [],
        helpAreasOther: user.helpAreasOther || "",
        expertiseAreas: user.expertiseAreas || [],
        isExpert: user.isExpert || false,
        dailyRequestLimit: user.dailyRequestLimit || 3,
        phoneVisible: user.phoneVisible || false,
        upiId: user.upiId || "",
        bio: user.bio || "",
        profileImage: user.profileImage || "",
      });
    }
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
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.url;
        }
      }
      
      const response = await apiRequest("PUT", "/api/users/profile", { ...data, profileImage: imageUrl });
      return response.json();
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
    }
  };

  const removeProfileImage = () => {
    setProfileImageFile(null);
    setProfileImagePreview(null);
    form.setValue("profileImage", "");
  };

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handleHelpAreasChange = (area: string, checked: boolean) => {
    const currentAreas = form.getValues("helpAreas") || [];
    if (checked) {
      form.setValue("helpAreas", [...currentAreas, area]);
    } else {
      form.setValue("helpAreas", currentAreas.filter(a => a !== area));
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-600 mt-2">Manage your personal information and preferences</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => window.location.href = "/"}
                className="flex items-center space-x-2"
              >
                <User className="h-4 w-4" />
                <span>Back to Home</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage 
                    src={profileImagePreview || user.profileImage || ""} 
                    alt={user.name} 
                  />
                  <AvatarFallback className="text-xl">
                    {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {(profileImagePreview || user.profileImage) && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={removeProfileImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900">{user.name}</h2>
                <p className="text-gray-600 mb-2">{user.profession} • Batch {user.batchYear}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{user.state}, {user.district}</span>
                  </div>
                  {user.email && (
                    <div className="flex items-center space-x-1">
                      <Mail className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 mt-3">
                  {user.isExpert && (
                    <Badge className="bg-secondary text-secondary-foreground">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Expert
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {user.phone ? "Verified" : "Unverified"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Personal Info
            </TabsTrigger>
            <TabsTrigger value="expert">
              <Star className="h-4 w-4 mr-2" />
              Help Settings
            </TabsTrigger>
            <TabsTrigger value="account">
              <Settings className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Profile Picture</h3>
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          <Avatar className="h-20 w-20">
                            <AvatarImage 
                              src={profileImagePreview || user.profileImage || ""} 
                              alt={user.name} 
                            />
                            <AvatarFallback className="text-lg">
                              {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          {(profileImagePreview || user.profileImage) && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                              onClick={removeProfileImage}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <Label htmlFor="profile-image-upload-settings">
                              <Button type="button" variant="outline" className="cursor-pointer">
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Photo
                              </Button>
                            </Label>
                            <Input
                              id="profile-image-upload-settings"
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            JPG, PNG, GIF or WebP. Max size 5MB.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Basic Information</h3>
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

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">JNV Location</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State*</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select your state" />
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
                              <FormLabel>District*</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""} disabled={!form.watch("state")}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={form.watch("state") ? "Select your district" : "Select state first"} />
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

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Current Residential Address</h3>
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

                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Help Settings Tab */}
          <TabsContent value="expert" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Help Settings</CardTitle>
                <p className="text-gray-600 text-sm">
                  Configure how you can help and support fellow alumni in the community.
                </p>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="isExpert"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I want to help others and provide support
                            </FormLabel>
                            <FormDescription>
                              Enable this to receive help requests from fellow alumni and share your knowledge and experience.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch("isExpert") && (
                      <>
                        <FormField
                          control={form.control}
                          name="helpAreas"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Which areas could you provide help and support?</FormLabel>
                              <FormDescription className="mb-4">
                                Select one or more areas where you can provide guidance, advice, or support. You can help in multiple areas.
                              </FormDescription>
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

                        {form.watch("helpAreas")?.includes("Other") && (
                          <FormField
                            control={form.control}
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
                          control={form.control}
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
                              <FormDescription>
                                Set how many help requests you want to handle per day.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

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
                                  This allows users to contact you directly via WhatsApp for follow-up support.
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
                                <Input placeholder="yourname@paytm" {...field} />
                              </FormControl>
                              <FormDescription>
                                Users can send token payments to show gratitude for your help (optional).
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? "Saving..." : "Save Help Settings"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h4 className="font-medium">Phone Number</h4>
                      <p className="text-sm text-gray-600">{user.phone}</p>
                    </div>
                    <Badge variant="outline">Verified</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h4 className="font-medium">Account Status</h4>
                      <p className="text-sm text-gray-600">
                        {user.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="font-medium">Member Since</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(user.createdAt!).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Sign Out</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Sign out of your account on this device.
                      </p>
                      <Button variant="outline" onClick={() => logout()}>
                        Sign Out
                      </Button>
                    </div>
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
