import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Heart
} from "lucide-react";
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
    enabled: !!user,
  });

  const { data: statsData } = useQuery({
    queryKey: ["/api/stats/dashboard"],
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

  const availableExperts = experts.filter(expert => (expert.availableSlots || 0) > 0);
  const recentRequests = userRequests.slice(0, 3);

  const [activeTab, setActiveTab] = useState("post-request");

  const handleViewRequest = (request: RequestWithUser) => {
    setLocation(`/request/${request.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <section className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 text-center mb-1">
            Navodaya Connection
          </h1>
          <p className="text-sm text-gray-600 text-center">
            Connect with fellow alumni for guidance and support
          </p>
        </section>

        {/* Main Tabs Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                        <Users className="text-primary" />
                        <span>Available Experts</span>
                      </h3>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Online</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {availableExperts.slice(0, 3).map((expert) => (
                        <ExpertCard key={expert.id} expert={expert} />
                      ))}
                    </div>
                    {experts.length > 3 && (
                      <Button variant="ghost" className="w-full mt-4">
                        View All Experts
                      </Button>
                    )}
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
              <div className="lg:col-span-2">
                {allRequests.length > 0 ? (
                  <div className="space-y-4">
                    {allRequests.map((request) => (
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No open requests</h3>
                      <p className="text-gray-600">There are no open requests at the moment.</p>
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
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="shadow-sm border border-gray-100">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {user?.isExpert ? 'Expert Dashboard' : 'Community Dashboard'}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {userRequests.length}
                        </div>
                        <div className="text-sm text-blue-600">
                          {user?.isExpert ? 'Responses Given' : 'Requests Posted'}
                        </div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {user?.isExpert ? '4.8' : stats.communityRating.toFixed(1)}
                        </div>
                        <div className="text-sm text-green-600">
                          {user?.isExpert ? 'Average Rating' : 'Community Rating'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-6">
                <Card className="shadow-sm border border-gray-100">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Stats</h3>
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
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
