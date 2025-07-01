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
  MessageCircle, 
  Clock, 
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import type { RequestWithUser } from "@shared/schema";

export default function MyRequests() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("all");

  const { data: requestsData, isLoading } = useQuery({
    queryKey: [`/api/requests?userId=${user?.id}`],
    enabled: !!user,
  });

  if (!user) {
    setLocation("/auth");
    return null;
  }

  const requests: RequestWithUser[] = (requestsData as { requests: RequestWithUser[] })?.requests || [];

  // Filter requests by status
  const openRequests = requests.filter(r => r.status === "open");
  const resolvedRequests = requests.filter(r => r.status === "resolved");
  const urgentRequests = requests.filter(r => r.urgency === "urgent" || r.urgency === "critical");

  const handleViewRequest = (request: RequestWithUser) => {
    setLocation(`/request/${request.id}`);
  };

  const handleCreateRequest = () => {
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">Loading your requests...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">My Requests</h1>
            <p className="text-gray-600">
              Manage and track all your help requests.
            </p>
          </div>
          <Button onClick={handleCreateRequest}>
            Create New Request
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-semibold text-gray-900">{requests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Open</p>
                  <p className="text-2xl font-semibold text-gray-900">{openRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Resolved</p>
                  <p className="text-2xl font-semibold text-gray-900">{resolvedRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Urgent</p>
                  <p className="text-2xl font-semibold text-gray-900">{urgentRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Request Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All Requests ({requests.length})
            </TabsTrigger>
            <TabsTrigger value="open">
              Open ({openRequests.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({resolvedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="urgent">
              Urgent ({urgentRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-6">
            {requests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No requests yet</h3>
                  <p className="text-gray-600 mb-4">
                    You haven't posted any requests yet. Start by creating your first request.
                  </p>
                  <Button onClick={handleCreateRequest}>
                    Create Your First Request
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onViewClick={handleViewRequest}
                    showUserInfo={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="open" className="space-y-4 mt-6">
            {openRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No open requests</h3>
                  <p className="text-gray-600">
                    You currently have no open requests waiting for responses.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {openRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onViewClick={handleViewRequest}
                    showUserInfo={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4 mt-6">
            {resolvedRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No resolved requests</h3>
                  <p className="text-gray-600">
                    You don't have any resolved requests yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {resolvedRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onViewClick={handleViewRequest}
                    showUserInfo={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="urgent" className="space-y-4 mt-6">
            {urgentRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No urgent requests</h3>
                  <p className="text-gray-600">
                    You currently have no urgent requests requiring immediate attention.
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
                    showUserInfo={false}
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