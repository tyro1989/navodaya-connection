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
import { useAuth } from "@/lib/auth";
import { 
  Clock, 
  Users, 
  Star,
  Search,
  FileText,
  HelpCircle,
  BarChart3,
  Heart,
  Filter
} from "lucide-react";
import { EXPERTISE_CATEGORIES, INDIAN_STATES } from "@/lib/constants";
import type { ExpertWithStats, RequestWithUser } from "@shared/schema";
import type { DashboardStats } from "@/lib/types";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (user === null) {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  const { data: expertsData } = useQuery({
    queryKey: ["/api/users/experts"],
    enabled: !!user,
  });

  const { data: requestsData } = useQuery({
    queryKey: ["/api/requests"],
    enabled: !!user,
  });

  const { data: userRequestsData } = useQuery({
    queryKey: ["/api/requests", { userId: user?.id }],
    queryFn: async () => {
      const response = await fetch(`/api/requests?userId=${user?.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user requests');
      }
      return response.json();
    },
    enabled: !!user,
  });

  const { data: statsData } = useQuery({
    queryKey: ["/api/stats/dashboard"],
    enabled: !!user,
  });

  const { data: personalStatsData } = useQuery({
    queryKey: ["/api/stats/personal"],
    enabled: !!user,
  });

  if (!user) {
    return <div>Loading...</div>;
  }

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

  const availableExperts = experts.filter(expert => (expert.availableSlots || 0) > 0);
  const recentRequests = userRequests.slice(0, 3);

  const [activeTab, setActiveTab] = useState("post-request");
  
  // Open Requests filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState<string>("all");
  const [selectedUrgency, setSelectedUrgency] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  // Filter open requests based on search criteria
  const filteredRequests = allRequests.filter((request) => {
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

    // Location filter
    if (selectedLocation && selectedLocation !== "all" && request.helpLocationState !== selectedLocation) {
      return false;
    }

    return true;
  });

  const handleViewRequest = (request: RequestWithUser) => {
    setLocation(`/request/${request.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header Section */}
        <section className="mb-4">
          <h1 className="text-lg font-semibold text-gray-900 text-center mb-1">
            Navodaya Connection
          </h1>
          <p className="text-xs text-gray-600 text-center">
            Connect with fellow alumni for guidance and support
          </p>
        </section>

        {/* Main Tabs Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="post-request" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Post Request</span>
            </TabsTrigger>
            <TabsTrigger value="my-requests" className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>My Requests</span>
            </TabsTrigger>
            <TabsTrigger value="open-requests" className="flex items-center space-x-2">
              <HelpCircle className="h-4 w-4" />
              <span>Open Requests</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
          </TabsList>

          {/* Post Request Tab */}
          <TabsContent value="post-request" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <RequestForm />
              </div>
              <div className="space-y-6">
                <Card className="shadow-sm border border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                        <Heart className="text-red-500" />
                        <span>Top Community Helpers</span>
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {experts.slice(0, 3).map((expert, index) => {
                        const badges = [
                          { label: "Most Resolutions", color: "bg-green-100 text-green-700" },
                          { label: "Most Engaged", color: "bg-blue-100 text-blue-700" },
                          { label: "Most Reputed", color: "bg-purple-100 text-purple-700" }
                        ];
                        return (
                          <div 
                            key={expert.id} 
                            className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => setLocation(`/profile/${expert.id}`)}
                          >
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {expert.name.charAt(0)}
                              </div>
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-yellow-900">
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">
                                  {expert.name}
                                </h4>
                                <Badge className={`text-xs px-2 py-1 ${badges[index]?.color}`}>
                                  {badges[index]?.label}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 truncate">{expert.profession}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                <span className="text-xs text-gray-600">
                                  {expert.stats?.averageRating || "4.8"} ({expert.stats?.totalResponses || 0} responses)
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* My Requests Tab */}
          <TabsContent value="my-requests" className="space-y-6">
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
                  <Card className="shadow-sm border border-gray-100">
                    <CardContent className="p-12 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No requests yet</h3>
                      <p className="text-gray-600 mb-4">You haven't posted any requests yet. Get started by posting a request!</p>
                      <Button onClick={() => setActiveTab("post-request")}>
                        Post Request
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
              <div className="space-y-6">
                <Card className="shadow-sm border border-gray-100">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Requests</span>
                        <span className="font-semibold text-primary">{userRequests.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Open Requests</span>
                        <span className="font-semibold text-secondary">
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
          <TabsContent value="open-requests" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {/* Filters */}
                <Card className="shadow-sm border border-gray-100">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 items-center">
                      <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
                        <Search className="h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search requests..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="border-0 shadow-none focus-visible:ring-0"
                        />
                      </div>
                      
                      <Select value={selectedExpertise} onValueChange={setSelectedExpertise}>
                        <SelectTrigger className="w-[180px]">
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
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Any Urgency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Urgency</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                        <SelectTrigger className="w-[150px]">
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

                      {(searchTerm || selectedExpertise !== "all" || selectedUrgency !== "all" || selectedLocation !== "all") && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSearchTerm("");
                            setSelectedExpertise("all");
                            setSelectedUrgency("all");
                            setSelectedLocation("all");
                          }}
                        >
                          <Filter className="h-4 w-4 mr-2" />
                          Clear
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
                  <Card className="shadow-sm border border-gray-100">
                    <CardContent className="p-12 text-center">
                      <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {(searchTerm || selectedExpertise !== "all" || selectedUrgency !== "all" || selectedLocation !== "all") 
                          ? "No requests match your filters" 
                          : "No open requests"}
                      </h3>
                      <p className="text-gray-600">
                        {(searchTerm || selectedExpertise !== "all" || selectedUrgency !== "all" || selectedLocation !== "all")
                          ? "Try adjusting your filters to see more requests."
                          : "There are no open requests at the moment."}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
              <div className="space-y-6">
                <Card className="shadow-sm border border-gray-100">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Stats</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Requests</span>
                        <span className="font-semibold text-primary">{allRequests.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Available Experts</span>
                        <span className="font-semibold text-secondary">{stats.activeExperts}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Personal Stats */}
              <Card className="shadow-sm border border-gray-100">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span>My Stats</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">
                        {personalStats.requestsPosted}
                      </div>
                      <div className="text-xs text-blue-600">Requests Posted</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">
                        {personalStats.requestsResponded}
                      </div>
                      <div className="text-xs text-green-600">Requests Responded</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-xl font-bold text-purple-600">
                        {personalStats.requestsResolved}
                      </div>
                      <div className="text-xs text-purple-600">Requests Resolved</div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="text-xl font-bold text-orange-600">
                        {personalStats.reviewsGiven}
                      </div>
                      <div className="text-xs text-orange-600">Reviews Given</div>
                    </div>
                    <div className="p-3 bg-pink-50 rounded-lg">
                      <div className="text-xl font-bold text-pink-600">
                        {personalStats.reviewsReceived}
                      </div>
                      <div className="text-xs text-pink-600">Reviews Received</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Community Stats */}
              <Card className="shadow-sm border border-gray-100">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Users className="h-5 w-5 text-secondary" />
                    <span>Community Stats</span>
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Requests</span>
                      <span className="font-semibold text-primary">{stats.totalRequests}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Active Experts</span>
                      <span className="font-semibold text-secondary">{stats.activeExperts}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Average Response Time</span>
                      <span className="font-semibold text-gray-700">{stats.averageResponseTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Community Rating</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="font-semibold text-gray-700">{stats.communityRating.toFixed(1)}</span>
                      </div>
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
