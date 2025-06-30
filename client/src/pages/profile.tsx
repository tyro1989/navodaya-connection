import { useState } from "react";
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
  CheckCircle
} from "lucide-react";

const profileFormSchema = insertUserSchema.partial().extend({
  expertiseAreas: z.array(z.string()).optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function Profile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      batchYear: user?.batchYear || 2020,
      profession: user?.profession || "",
      location: user?.location || "",
      pinCode: user?.pinCode || "",
      expertiseAreas: user?.expertiseAreas || [],
      isExpert: user?.isExpert || false,
      dailyRequestLimit: user?.dailyRequestLimit || 3,
      phoneVisible: user?.phoneVisible || false,
      upiId: user?.upiId || "",
      bio: user?.bio || "",
      profileImage: user?.profileImage || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest("PUT", "/api/users/profile", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated successfully!",
        description: "Your changes have been saved.",
      });
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

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
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

  const handleExpertiseToggle = (expertise: string, checked: boolean) => {
    const currentAreas = form.getValues("expertiseAreas") || [];
    if (checked) {
      form.setValue("expertiseAreas", [...currentAreas, expertise]);
    } else {
      form.setValue("expertiseAreas", currentAreas.filter(area => area !== expertise));
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">
            Manage your account settings and expert preferences.
          </p>
        </div>

        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.profileImage || ""} alt={user.name} />
                  <AvatarFallback className="text-xl">
                    {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                >
                  <Camera className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900">{user.name}</h2>
                <p className="text-gray-600 mb-2">{user.profession} • Batch {user.batchYear}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{user.location}</span>
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
              Expert Settings
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
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="batchYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Batch Year*</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))}>
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="profession"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profession*</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
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
                        control={form.control}
                        name="pinCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PIN Code</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={4}
                              placeholder="Tell others about yourself and your experience"
                              {...field}
                            />
                          </FormControl>
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

          {/* Expert Settings Tab */}
          <TabsContent value="expert" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Expert Settings</CardTitle>
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
                              I want to be an expert and help others
                            </FormLabel>
                            <FormDescription>
                              Enable this to receive help requests from fellow alumni and share your expertise.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch("isExpert") && (
                      <>
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

                        <div>
                          <FormLabel className="text-base">Expertise Areas</FormLabel>
                          <FormDescription className="mb-4">
                            Select the areas where you can provide guidance and support.
                          </FormDescription>
                          <div className="grid grid-cols-2 gap-4">
                            {expertiseOptions.map((expertise) => (
                              <div key={expertise} className="flex items-center space-x-2">
                                <Checkbox
                                  id={expertise}
                                  checked={(form.getValues("expertiseAreas") || []).includes(expertise)}
                                  onCheckedChange={(checked) => handleExpertiseToggle(expertise, checked as boolean)}
                                />
                                <label
                                  htmlFor={expertise}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {expertise}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name="phoneVisible"
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
                                  Make my phone number visible for direct contact
                                </FormLabel>
                                <FormDescription>
                                  This allows users to contact you directly via WhatsApp. Once enabled, this cannot be undone.
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
                                Users can send token payments to show gratitude for your help.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? "Saving..." : "Save Expert Settings"}
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
