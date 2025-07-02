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

  const [activeTab, setActiveTab] = useState("find-experts");

  const handleViewRequest = (request: RequestWithUser) => {
    setLocation(`/request/${request.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 border border-primary/20">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Need Help? We're Here for You
            </h1>
            <p className="text-gray-600">
              Connect with Navodaya alumni experts for medical advice, mentorship, and professional guidance.
            </p>
          </div>
        </section>

        {/* Main Tabs Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="find-experts" className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Find Experts</span>
            </TabsTrigger>
            <TabsTrigger value="my-requests" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>My Requests</span>
            </TabsTrigger>
            {user?.isExpert ? (
              <>
                <TabsTrigger value="expert-requests" className="flex items-center space-x-2">
                  <HelpCircle className="h-4 w-4" />
                  <span>Expert Requests</span>
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Dashboard</span>
                </TabsTrigger>
              </>
            ) : (
              <TabsTrigger value="help-others" className="flex items-center space-x-2">
                <Heart className="h-4 w-4" />
                <span>Help Others</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Find Experts Tab */}
          <TabsContent value="find-experts" className="space-y-6">
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
                        <div className="w-2 h-2 bg-secondary rounded-full"></div>
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
                      <p className="text-gray-600 mb-4">You haven't posted any requests yet. Get started by finding experts!</p>
                      <Button onClick={() => setActiveTab("find-experts")}>
                        Find Experts
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

          {/* Expert Requests Tab (only for experts) */}
          {user?.isExpert && (
            <TabsContent value="expert-requests" className="space-y-6">
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Expert Stats</h3>
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
          )}

          {/* Dashboard Tab (only for experts) */}
          {user?.isExpert && (
            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Card className="shadow-sm border border-gray-100">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Expert Dashboard</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {userRequests.filter(r => r.status === 'resolved').length}
                          </div>
                          <div className="text-sm text-blue-600">Requests Resolved</div>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">4.8</div>
                          <div className="text-sm text-green-600">Average Rating</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-6">
                  <Card className="shadow-sm border border-gray-100">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Impact</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Total Requests Resolved</span>
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
          )}

          {/* Help Others Tab (only for non-experts) */}
          {!user?.isExpert && (
            <TabsContent value="help-others" className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Card className="shadow-sm border border-gray-100">
                    <CardContent className="p-6">
                      <div className="text-center mb-6">
                        <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Become an Expert</h3>
                        <p className="text-gray-600">
                          Share your knowledge and help fellow Navodaya alumni. Join our expert community and make a difference.
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">What you'll do:</h4>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Answer questions in your area of expertise</li>
                            <li>• Help students and professionals grow</li>
                            <li>• Build meaningful connections</li>
                            <li>• Contribute to the alumni network</li>
                          </ul>
                        </div>
                        <Button 
                          onClick={() => setLocation("/profile")} 
                          className="w-full"
                        >
                          Update Profile to Become Expert
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-6">
                  <Card className="shadow-sm border border-gray-100">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Expert Benefits</h3>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                          <div>
                            <div className="font-medium text-sm">Recognition</div>
                            <div className="text-xs text-gray-600">Get recognized for your expertise</div>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div>
                            <div className="font-medium text-sm">Network</div>
                            <div className="text-xs text-gray-600">Connect with alumni nationwide</div>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                          <div>
                            <div className="font-medium text-sm">Impact</div>
                            <div className="text-xs text-gray-600">Make a real difference</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
