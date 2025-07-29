import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/navigation";
import RequestForm from "@/components/request-form";
import ExpertCard from "@/components/expert-card";
import RequestCard from "@/components/request-card";
import ProfileCompletionModal from "@/components/profile-completion-modal";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { isProfileComplete, hasCompletedOnboarding, markOnboardingCompleted, getProfileCompletionDetails } from "@/lib/profile-utils";
import { 
  Clock, 
  Users, 
  Star,
  Search,
  FileText,
  HelpCircle,
  BarChart3,
  Heart,
  Filter,
  MapPin,
  Loader2,
  Edit
} from "lucide-react";
import { EXPERTISE_CATEGORIES, INDIAN_STATES } from "@/lib/constants";
import type { ExpertWithStats, RequestWithUser, User as UserType } from "@shared/schema";
import type { DashboardStats } from "@/lib/types";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (user === null) {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  // Early return if no user to prevent hook violations
  if (!user) {
    return <div>Loading...</div>;
  }

  const { data: expertsData } = useQuery({
    queryKey: ["/api/users/experts"],
  });

  const { data: requestsData } = useQuery({
    queryKey: ["/api/requests"],
    queryFn: async () => {
      const response = await fetch('/api/requests?status=');  // Empty status to get all requests
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      return response.json();
    },
  });

  const { data: userRequestsData } = useQuery({
    queryKey: ["/api/requests", { userId: user.id }],
    queryFn: async () => {
      const response = await fetch(`/api/requests?userId=${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user requests');
      }
      return response.json();
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ["/api/stats/dashboard"],
  });

  const { data: personalStatsData } = useQuery({
    queryKey: ["/api/stats/personal"],
  });

  const { data: topHelpersData } = useQuery({
    queryKey: ["/api/stats/top-helpers"],
  });

  const experts: ExpertWithStats[] = (expertsData as { experts: ExpertWithStats[] })?.experts || [];
  const allRequests: RequestWithUser[] = (requestsData as { requests: RequestWithUser[] })?.requests || [];
  const userRequests: RequestWithUser[] = (userRequestsData as { requests: RequestWithUser[] })?.requests || [];
  const stats: DashboardStats = (statsData as { stats: DashboardStats })?.stats || {
    totalRequests: 0,
    activeExperts: 0,
    averageResponseTime: "0 mins",
    communityRating: 0,
  };

  const personalStats = (personalStatsData as { stats: any })?.stats || {
    requestsPosted: 0,
    requestsResponded: 0,
    requestsResolved: 0,
    reviewsGiven: 0,
    reviewsReceived: 0,
  };

  const topHelpers = (topHelpersData as { topHelpers: any[] })?.topHelpers || [];

  const availableExperts = experts.filter(expert => (expert.availableSlots || 0) > 0);
  const recentRequests = userRequests.slice(0, 3);

  const [activeTab, setActiveTab] = useState("post-request");
  
  // All Requests filters  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState<string>("all");
  const [selectedUrgency, setSelectedUrgency] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("open"); // Default to open
  
  // Location-based filtering state
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState<number>(50); // Default 50km

  // Profile completion state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(() => {
    return hasCompletedOnboarding(user?.id);
  });

  // Check if profile needs completion when user changes
  useEffect(() => {
    if (user) {
      const profileComplete = isProfileComplete(user);
      const onboardingStatus = hasCompletedOnboarding(user.id);
      
      // Get detailed completion info for debugging
      const completionDetails = getProfileCompletionDetails(user);
      console.log("Profile completion check:", completionDetails);
      
      // Only show modal if profile is incomplete AND user hasn't completed onboarding
      if (!profileComplete && !onboardingStatus) {
        setShowProfileModal(true);
      } else {
        setShowProfileModal(false);
        // Mark as completed if profile is complete
        if (profileComplete && !onboardingStatus) {
          setOnboardingCompleted(true);
          markOnboardingCompleted(user.id);
        }
      }
    } else {
      setShowProfileModal(false);
    }
  }, [user, onboardingCompleted]);

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        setUseCurrentLocation(true);
        setIsGettingLocation(false);
        toast({
          title: "📍 Location detected!",
          description: `Now showing requests within ${selectedRadius}km of your location. Use the dropdown to adjust the radius.`,
          duration: 4000,
          className: "border-blue-200 bg-blue-50 text-blue-800",
        });
      },
      (error) => {
        setIsGettingLocation(false);
        let message = "Unable to get your location.";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location access denied. Please enable location permissions.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Location information unavailable.";
        } else if (error.code === error.TIMEOUT) {
          message = "Location request timed out.";
        }
        toast({
          title: "Location Error",
          description: message,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  // Filter requests based on search criteria
  const filteredRequests = allRequests.filter((request) => {
    // Status filter
    if (selectedStatus && selectedStatus !== "all" && request.status !== selectedStatus) {
      return false;
    }
    
    // Search term filter
    if (searchTerm && !request.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !request.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Expertise filter
    if (selectedExpertise && selectedExpertise !== "all" && request.expertiseRequired !== selectedExpertise) {
      return false;
    }

    // Urgency filter
    if (selectedUrgency && selectedUrgency !== "all" && request.urgency !== selectedUrgency) {
      return false;
    }

    // Location filter - either by state or by proximity to current location
    if (useCurrentLocation && currentLocation) {
      // If using current location, filter by proximity (within selected radius)
      if (request.helpLocationGps) {
        try {
          const [lat, lon] = request.helpLocationGps.split(',').map(Number);
          const distance = calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            lat,
            lon
          );
          if (distance > selectedRadius) { // Use selected radius
            return false;
          }
        } catch (error) {
          // If GPS parsing fails, fall back to state filtering
          if (selectedLocation && selectedLocation !== "all" && request.helpLocationState !== selectedLocation) {
            return false;
          }
        }
      } else {
        // No GPS data, fall back to state filtering if selected
        if (selectedLocation && selectedLocation !== "all" && request.helpLocationState !== selectedLocation) {
          return false;
        }
      }
    } else {
      // Regular state-based location filter
      if (selectedLocation && selectedLocation !== "all" && request.helpLocationState !== selectedLocation) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    // Sort by distance if using current location
    if (useCurrentLocation && currentLocation) {
      const getDistance = (request: RequestWithUser) => {
        if (request.helpLocationGps) {
          try {
            const [lat, lon] = request.helpLocationGps.split(',').map(Number);
            return calculateDistance(
              currentLocation.latitude,
              currentLocation.longitude,
              lat,
              lon
            );
          } catch (error) {
            return Infinity; // Put requests without valid GPS at the end
          }
        }
        return Infinity;
      };
      
      return getDistance(a) - getDistance(b);
    }
    
    // Default sort by creation date (newest first)
    return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
  });

  const handleViewRequest = (request: RequestWithUser) => {
    setLocation(`/request/${request.id}`);
  };

  const handleProfileComplete = (updatedUser: UserType) => {
    setShowProfileModal(false);
    setOnboardingCompleted(true); // Mark onboarding as completed
    // Save completion status to localStorage
    markOnboardingCompleted(updatedUser.id);
    // The auth context will automatically update with the new user data
    toast({
      title: "🎉 Profile Complete!",
      description: "Welcome to Navodaya Connect! You can now explore all features.",
      duration: 4000,
      className: "border-green-200 bg-green-50 text-green-800",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <Navigation />
      
              {/* Profile Completion Modal for First-Time Users */}
        {user && showProfileModal && (
          <ProfileCompletionModal
            isOpen={showProfileModal}
            user={user}
            onComplete={handleProfileComplete}
          />
        )}

        {/* Debug Panel - Remove in production */}
        {process.env.NODE_ENV === 'development' && user && (
          <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-sm z-50">
            <h4 className="font-semibold text-sm mb-2">Debug: Profile Status</h4>
            <div className="text-xs space-y-1">
              <div>Name: {user.name ? '✅' : '❌'}</div>
              <div>Batch Year: {user.batchYear ? '✅' : '❌'}</div>
              <div>State: {user.state ? '✅' : '❌'}</div>
              <div>District: {user.district ? '✅' : '❌'}</div>
              <div>Password: {user.password ? '✅' : '❌'}</div>
              <div>Modal Shown: {showProfileModal ? 'Yes' : 'No'}</div>
              <div>Onboarding: {onboardingCompleted ? 'Complete' : 'Incomplete'}</div>
              <button 
                onClick={() => {
                  localStorage.removeItem(`onboarding_completed_${user.id}`);
                  setOnboardingCompleted(false);
                  window.location.reload();
                }}
                className="mt-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
              >
                Reset Onboarding
              </button>
            </div>
          </div>
        )}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <section className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Navodaya Connect
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Your gateway to connect with fellow Navodayans • Share knowledge • Seek guidance • Build lasting relationships
          </p>
        </section>

        {/* Main Tabs Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="inline-flex h-12 items-center justify-center w-full max-w-2xl bg-white/60 backdrop-blur-sm border border-gray-200/50 shadow-lg rounded-2xl p-1 gap-1">
              <TabsTrigger 
                value="post-request" 
                className="flex items-center justify-center space-x-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:bg-gray-50 font-medium py-3 px-4 flex-1 min-h-[40px]"
              >
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">Post Request</span>
                <span className="sm:hidden whitespace-nowrap">Post</span>
              </TabsTrigger>
              <TabsTrigger 
                value="my-requests" 
                className="flex items-center justify-center space-x-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:bg-gray-50 font-medium py-3 px-4 flex-1 min-h-[40px]"
              >
                <Search className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">My Requests</span>
                <span className="sm:hidden whitespace-nowrap">Mine</span>
              </TabsTrigger>
              <TabsTrigger 
                value="open-requests" 
                className="flex items-center justify-center space-x-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:bg-gray-50 font-medium py-3 px-4 flex-1 min-h-[40px]"
              >
                <HelpCircle className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">All Requests</span>
                <span className="sm:hidden whitespace-nowrap">All</span>
              </TabsTrigger>
              <TabsTrigger 
                value="dashboard" 
                className="flex items-center justify-center space-x-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:bg-gray-50 font-medium py-3 px-4 flex-1 min-h-[40px]"
              >
                <BarChart3 className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">Dashboard</span>
                <span className="sm:hidden whitespace-nowrap">Stats</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Post Request Tab */}
          <TabsContent value="post-request" className="space-y-6 mt-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <RequestForm />
              </div>
              <div className="space-y-6">
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                        <Heart className="text-red-500" />
                        <span>Top Community Helpers</span>
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        Last 30 Days
                      </Badge>
                    </div>
                    <div className="space-y-4">
                      {topHelpers.length > 0 ? topHelpers.map((helper, index) => {
                        const rankColors = [
                          "bg-yellow-500 text-yellow-900",
                          "bg-gray-400 text-gray-900", 
                          "bg-amber-600 text-amber-100"
                        ];
                        const rankIcons = ["🥇", "🥈", "🥉"];
                        
                        return (
                          <div 
                            key={helper.id} 
                            className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => setLocation(`/profile/${helper.id}`)}
                          >
                            <div className="relative">
                              {helper.profileImage ? (
                                <img 
                                  src={helper.profileImage} 
                                  alt={helper.name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                  {helper.name.charAt(0)}
                                </div>
                              )}
                              <div className={`absolute -top-1 -right-1 w-6 h-6 ${rankColors[index]} rounded-full flex items-center justify-center text-xs font-bold`}>
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">
                                  {helper.name}
                                </h4>
                                <span className="text-lg">{rankIcons[index]}</span>
                              </div>
                              <p className="text-xs text-gray-600 truncate mb-2">
                                {helper.profession} • Batch {helper.batchYear}
                              </p>
                              
                              {/* Metrics Display */}
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="text-center">
                                  <div className="font-semibold text-yellow-600">
                                    ⭐ {helper.metrics.averageRating}
                                  </div>
                                  <div className="text-gray-500">Avg Rating</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-semibold text-blue-600">
                                    💬 {helper.metrics.totalResponses}
                                  </div>
                                  <div className="text-gray-500">Responses</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-semibold text-green-600">
                                    🏆 {helper.metrics.bestAnswers}
                                  </div>
                                  <div className="text-gray-500">Best Answers</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="text-center py-6 text-gray-500">
                          <Heart className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No helpers found in the last 30 days</p>
                          <p className="text-xs">Be the first to help the community!</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* My Requests Tab */}
          <TabsContent value="my-requests" className="space-y-6 mt-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {userRequests.length > 0 ? (
                  <div className="space-y-4">
                    {userRequests.map((request) => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        onViewClick={handleViewRequest}
                        showUserInfo={false}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm rounded-2xl">
                    <CardContent className="p-12 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <FileText className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">No requests yet</h3>
                      <p className="text-gray-600 mb-6 max-w-sm mx-auto leading-relaxed">You haven't posted any requests yet. Get started by posting a request!</p>
                      <Button 
                        onClick={() => setActiveTab("post-request")}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Post Your First Request
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
              <div className="space-y-6">
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm rounded-2xl">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-white" />
                      </div>
                      Quick Stats
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl border border-blue-100/50">
                        <span className="font-medium text-gray-700">Total Requests</span>
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{userRequests.length}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-xl border border-green-100/50">
                        <span className="font-medium text-gray-700">Open Requests</span>
                        <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {userRequests.filter(r => r.status === 'open').length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Open Requests Tab */}
          <TabsContent value="open-requests" className="space-y-6 mt-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Filters */}
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm rounded-2xl">
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent flex items-center gap-2">
                        <Filter className="h-5 w-5 text-purple-600" />
                        Filter Requests
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">Find requests that match your expertise and location</p>
                    </div>
                    <div className="flex flex-wrap gap-4 items-center">
                      <div className="flex items-center space-x-2 flex-1 min-w-[200px] bg-gray-50/50 rounded-xl px-4 py-2 border border-gray-200/50">
                        <Search className="h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search requests..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="border-0 bg-transparent shadow-none focus-visible:ring-0 placeholder:text-gray-500"
                        />
                      </div>
                      
                      <Select value={selectedExpertise} onValueChange={setSelectedExpertise}>
                        <SelectTrigger className="w-[180px] bg-white/80 border-gray-200/50 rounded-xl hover:bg-white transition-colors">
                          <SelectValue placeholder="Any Expertise" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Expertise</SelectItem>
                          {EXPERTISE_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
                        <SelectTrigger className="w-[150px] bg-white/80 border-gray-200/50 rounded-xl hover:bg-white transition-colors">
                          <SelectValue placeholder="Any Urgency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Urgency</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-[150px] bg-white/80 border-gray-200/50 rounded-xl hover:bg-white transition-colors">
                          <SelectValue placeholder="Any Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                        <SelectTrigger className="w-[150px] bg-white/80 border-gray-200/50 rounded-xl hover:bg-white transition-colors">
                          <SelectValue placeholder="Any State" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any State</SelectItem>
                          {INDIAN_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button 
                        onClick={() => {
                          if (useCurrentLocation) {
                            setUseCurrentLocation(false);
                            setCurrentLocation(null);
                            setSelectedRadius(50); // Reset to default when disabling
                            toast({
                              title: "📍 Location filter disabled",
                              description: "Now showing all requests regardless of location.",
                              duration: 2000,
                            });
                          } else {
                            getCurrentLocation();
                          }
                        }}
                        disabled={isGettingLocation}
                        className={`flex items-center space-x-2 min-w-[140px] rounded-xl px-4 py-2 font-medium transition-all duration-200 ${
                          useCurrentLocation 
                            ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg" 
                            : "bg-white/80 border border-gray-200/50 hover:bg-white text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        {isGettingLocation ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Getting Location...</span>
                          </>
                        ) : useCurrentLocation ? (
                          <>
                            <MapPin className="h-4 w-4" />
                            <span>Near Me ({selectedRadius}km)</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4" />
                            <span>Use Current Location</span>
                          </>
                        )}
                      </Button>

                      {/* Radius selector - only show when using current location */}
                      {useCurrentLocation && (
                        <Select value={selectedRadius.toString()} onValueChange={(value) => setSelectedRadius(Number(value))}>
                          <SelectTrigger className="w-[120px] bg-white/80 border border-gray-200/50 hover:bg-white hover:border-gray-300 rounded-xl px-3 py-2 text-gray-700 font-medium transition-all duration-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 km</SelectItem>
                            <SelectItem value="10">10 km</SelectItem>
                            <SelectItem value="25">25 km</SelectItem>
                            <SelectItem value="50">50 km</SelectItem>
                            <SelectItem value="100">100 km</SelectItem>
                            <SelectItem value="200">200 km</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      {(searchTerm || selectedExpertise !== "all" || selectedUrgency !== "all" || selectedStatus !== "open" || selectedLocation !== "all" || useCurrentLocation) && (
                        <Button 
                          onClick={() => {
                            setSearchTerm("");
                            setSelectedExpertise("all");
                            setSelectedUrgency("all");
                            setSelectedStatus("open");
                            setSelectedLocation("all");
                            setUseCurrentLocation(false);
                            setCurrentLocation(null);
                            setSelectedRadius(50); // Reset to default
                          }}
                          className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium flex items-center space-x-2"
                        >
                          <Filter className="h-4 w-4" />
                          <span>Clear Filters</span>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Requests List */}
                {filteredRequests.length > 0 ? (
                  <div className="space-y-4">
                    {filteredRequests.map((request) => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        onViewClick={handleViewRequest}
                        showUserInfo={true}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm rounded-2xl">
                    <CardContent className="p-12 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <HelpCircle className="h-8 w-8 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
                        {(searchTerm || selectedExpertise !== "all" || selectedUrgency !== "all" || selectedStatus !== "open" || selectedLocation !== "all" || useCurrentLocation) 
                          ? "No requests match your filters" 
                          : "No requests found"}
                      </h3>
                      <p className="text-gray-600 max-w-sm mx-auto leading-relaxed">
                        {(searchTerm || selectedExpertise !== "all" || selectedUrgency !== "all" || selectedStatus !== "open" || selectedLocation !== "all" || useCurrentLocation)
                          ? "Try adjusting your filters to see more requests."
                          : "There are no requests at the moment."}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
              <div className="space-y-6">
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm rounded-2xl">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      Community Stats
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl border border-blue-100/50">
                        <span className="font-medium text-gray-700">Total Requests</span>
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{allRequests.length}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-xl border border-green-100/50">
                        <span className="font-medium text-gray-700">Available Experts</span>
                        <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.activeExperts}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 mt-8">
            <div className="grid gap-8">
              {/* Profile Information */}
              <Card className="shadow-xl border-0 bg-gradient-to-br from-white/90 to-gray-50/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-bold text-sm">{user?.name?.charAt(0) || 'U'}</span>
                        </div>
                      </div>
                      <span className="bg-gradient-to-r from-gray-600 to-gray-700 bg-clip-text text-transparent">My Profile</span>
                    </div>
                    <Button
                      onClick={() => setLocation("/profile")}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-700 border-gray-300 hover:border-gray-400 bg-white/80 hover:bg-gray-50"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </Button>
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Personal Info</div>
                      <div className="space-y-2">
                        <div>
                          <div className="text-sm text-gray-600">Name</div>
                          <div className="font-semibold text-gray-900">{user?.name || 'Not set'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Phone</div>
                          <div className="font-semibold text-gray-900">{user?.phone || 'Not set'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Email</div>
                          <div className="font-semibold text-gray-900">{user?.email || 'Not set'}</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Academic</div>
                      <div className="space-y-2">
                        <div>
                          <div className="text-sm text-gray-600">Batch Year</div>
                          <div className="font-semibold text-gray-900">{user?.batchYear || 'Not set'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Profession</div>
                          <div className="font-semibold text-gray-900">{user?.profession || 'Not set'}</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Location</div>
                      <div className="space-y-2">
                        <div>
                          <div className="text-sm text-gray-600">State</div>
                          <div className="font-semibold text-gray-900">{user?.state || 'Not set'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">District</div>
                          <div className="font-semibold text-gray-900">{user?.district || 'Not set'}</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Expert Status</div>
                      <div className="space-y-2">
                        <div>
                          <div className="text-sm text-gray-600">Expert</div>
                          <div className={`font-semibold ${user?.isExpert ? 'text-green-600' : 'text-gray-500'}`}>
                            {user?.isExpert ? 'Yes' : 'No'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Daily Limit</div>
                          <div className="font-semibold text-gray-900">{user?.dailyRequestLimit || 3} requests</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className={`grid ${stats.totalRequests >= 100 ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-8`}>
                {/* Personal Stats */}
                <Card className="shadow-xl border-0 bg-gradient-to-br from-white/90 to-blue-50/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-6 flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">My Activity Stats</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/20 rounded-xl border border-blue-200/30">
                        <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                          {personalStats.requestsPosted}
                        </div>
                        <div className="text-sm text-blue-600 font-medium mt-1">Requests Posted</div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/20 rounded-xl border border-green-200/30">
                        <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                          {personalStats.requestsResponded}
                        </div>
                        <div className="text-sm text-green-600 font-medium mt-1">Requests Responded</div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/20 rounded-xl border border-purple-200/30">
                        <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                          {personalStats.requestsResolved}
                        </div>
                        <div className="text-sm text-purple-600 font-medium mt-1">Requests Resolved</div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/20 rounded-xl border border-orange-200/30">
                        <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                          {personalStats.reviewsGiven}
                        </div>
                        <div className="text-sm text-orange-600 font-medium mt-1">Reviews Given</div>
                      </div>
                      <div className="col-span-2 p-4 bg-gradient-to-br from-pink-500/10 to-pink-600/20 rounded-xl border border-pink-200/30">
                        <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-pink-700 bg-clip-text text-transparent text-center">
                          {personalStats.reviewsReceived}
                        </div>
                        <div className="text-sm text-pink-600 font-medium mt-1 text-center">Reviews Received</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Community Stats - Only show if totalRequests >= 100 */}
                {stats.totalRequests >= 100 && (
                  <Card className="shadow-xl border-0 bg-gradient-to-br from-white/90 to-indigo-50/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                    <CardContent className="p-8">
                      <h3 className="text-xl font-bold mb-6 flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Community Stats</span>
                      </h3>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl border border-blue-100/50">
                          <span className="text-sm font-medium text-gray-700">Total Requests</span>
                          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{stats.totalRequests}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-xl border border-green-100/50">
                          <span className="text-sm font-medium text-gray-700">Active Experts</span>
                          <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.activeExperts}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50/50 to-violet-50/50 rounded-xl border border-purple-100/50">
                          <span className="text-sm font-medium text-gray-700">Average Response Time</span>
                          <span className="text-lg font-bold text-gray-700">{stats.averageResponseTime}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50/50 to-orange-50/50 rounded-xl border border-yellow-100/50">
                          <span className="text-sm font-medium text-gray-700">Community Rating</span>
                          <div className="flex items-center space-x-2">
                            <Star className="h-5 w-5 text-yellow-500 fill-current" />
                            <span className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">{stats.communityRating?.toFixed(1) || '0.0'}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
