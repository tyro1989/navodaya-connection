import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/navigation";
import RequestCard from "@/components/request-card";
import { useAuth } from "@/lib/auth";
import { 
  Users, 
  MessageCircle, 
  Star, 
  TrendingUp,
  Clock,
  Filter,
  Eye
} from "lucide-react";
import type { RequestWithUser, ExpertStats } from "@shared/schema";

export default function ExpertDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("requests");

  if (!user?.isExpert) {
    setLocation("/");
    return null;
  }

  const { data: requestsData } = useQuery({
    queryKey: ["/api/requests"],
  });

  const { data: statsData } = useQuery({
    queryKey: ["/api/stats/expert", user.id],
  });

  const requests: RequestWithUser[] = requestsData?.requests || [];
  const stats: ExpertStats | undefined = statsData?.stats;

  // Filter requests by expertise and status
  const relevantRequests = requests.filter(request => {
    if (request.status === "resolved") return false;
    if (!user.expertiseAreas) return true;
    
    return user.expertiseAreas.some(area => 
      request.expertiseRequired.toLowerCase().includes(area.toLowerCase()) ||
      area.toLowerCase().includes(request.expertiseRequired.toLowerCase())
    );
  });

  const urgentRequests = relevantRequests.filter(r => r.urgency === "urgent");
  const regularRequests = relevantRequests.filter(r => r.urgency === "medium");

  const handleViewRequest = (request: RequestWithUser) => {
    setLocation(`/request/${request.id}`);
  };

  const availableSlots = (user.dailyRequestLimit || 3) - (stats?.todayResponses || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Expert Dashboard</h1>
          <p className="text-gray-600">
            Manage your expert profile and respond to help requests from the community.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Responses</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.totalResponses || 0}
                  </p>
                </div>
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.averageRating || "0.0"}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.totalReviews || 0}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available Slots</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {Math.max(0, availableSlots)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Availability Status */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${availableSlots > 0 ? "bg-secondary" : "bg-gray-400"}`}></div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {availableSlots > 0 ? "Available for requests" : "Daily limit reached"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {stats?.todayResponses || 0} of {user.dailyRequestLimit || 3} requests handled today
                  </p>
                </div>
              </div>
              <Badge variant={availableSlots > 0 ? "default" : "secondary"}>
                {availableSlots > 0 ? "Active" : "Busy"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Requests Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="requests">
              Open Requests ({relevantRequests.length})
            </TabsTrigger>
            <TabsTrigger value="urgent">
              Urgent ({urgentRequests.length})
            </TabsTrigger>
            <TabsTrigger value="regular">
              Regular ({regularRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-4 mt-6">
            {relevantRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No relevant requests</h3>
                  <p className="text-gray-600">
                    There are currently no open requests in your area of expertise.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {relevantRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onViewClick={handleViewRequest}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="urgent" className="space-y-4 mt-6">
            {urgentRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No urgent requests</h3>
                  <p className="text-gray-600">
                    There are currently no urgent requests requiring immediate attention.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {urgentRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onViewClick={handleViewRequest}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="regular" className="space-y-4 mt-6">
            {regularRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No regular requests</h3>
                  <p className="text-gray-600">
                    There are currently no regular priority requests in your expertise area.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {regularRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onViewClick={handleViewRequest}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
