import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navigation from "@/components/navigation";
import RequestCard from "@/components/request-card";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { 
  MessageCircle, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  User,
  Reply,
  Edit,
  Save,
  X
} from "lucide-react";
import type { RequestWithUser, ResponseWithExpert } from "@shared/schema";

export default function MyRequests() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [expandedRequests, setExpandedRequests] = useState<Set<number>>(new Set());
  const [editingRequest, setEditingRequest] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "" });

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ["/api/requests", { userId: user?.id }],
    queryFn: async () => {
      const response = await fetch(`/api/requests?userId=${user?.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch responses for each request
  const { data: responsesData } = useQuery({
    queryKey: ["/api/responses/user", user?.id, requestsData?.requests?.map((r: RequestWithUser) => r.id)],
    queryFn: async () => {
      const requests = requestsData?.requests || [];
      const allResponses: { [key: number]: ResponseWithExpert[] } = {};
      
      for (const request of requests) {
        const response = await fetch(`/api/responses/request/${request.id}`);
        if (response.ok) {
          const data = await response.json();
          allResponses[request.id] = data.responses || [];
        }
      }
      
      return allResponses;
    },
    enabled: !!user && !!requestsData?.requests?.length,
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, title, description }: { id: number; title: string; description: string }) => {
      const response = await apiRequest("PUT", `/api/requests/${id}`, { title, description });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Request updated successfully!",
        description: "Your request has been updated.",
      });
      setEditingRequest(null);
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update request",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    setLocation("/auth");
    return null;
  }

  const requests: RequestWithUser[] = (requestsData as { requests: RequestWithUser[] })?.requests || [];
  const responsesByRequest = responsesData || {};

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

  const toggleRequestExpansion = (requestId: number) => {
    const newExpanded = new Set(expandedRequests);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedRequests(newExpanded);
  };

  const startEditing = (request: RequestWithUser) => {
    setEditingRequest(request.id);
    setEditForm({ title: request.title, description: request.description });
  };

  const cancelEditing = () => {
    setEditingRequest(null);
    setEditForm({ title: "", description: "" });
  };

  const saveEdit = () => {
    if (editingRequest && editForm.title.trim() && editForm.description.trim()) {
      updateRequestMutation.mutate({
        id: editingRequest,
        title: editForm.title,
        description: editForm.description,
      });
    }
  };

  const MyRequestCard = ({ request }: { request: RequestWithUser }) => {
    const responses = responsesByRequest[request.id] || [];
    const isExpanded = expandedRequests.has(request.id);
    const isEditing = editingRequest === request.id;
    const isUrgent = request.urgency === "urgent" || request.urgency === "critical";
    const isResolved = request.status === "resolved";

    return (
      <Card className="hover:shadow-sm transition-shadow">
        <CardContent className="p-6">
          {/* Request Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 pr-4">
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="Request title"
                    className="font-medium"
                  />
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Request description"
                    rows={3}
                  />
                  <div className="flex items-center space-x-2">
                    <Button size="sm" onClick={saveEdit} disabled={updateRequestMutation.isPending}>
                      <Save className="h-4 w-4 mr-1" />
                      {updateRequestMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEditing}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h4 className="font-medium text-gray-900 mb-2">{request.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{request.description}</p>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={`text-xs ${
                isResolved 
                  ? "bg-secondary text-secondary-foreground"
                  : isUrgent 
                    ? "bg-accent text-accent-foreground" 
                    : "bg-orange-100 text-orange-700"
              } flex items-center space-x-1`}>
                {isUrgent && <AlertTriangle className="h-3 w-3" />}
                <span className="capitalize">
                  {isResolved ? "Resolved" : isUrgent ? "Urgent" : request.urgency}
                </span>
              </Badge>
            </div>
          </div>

          {!isEditing && (
            <>
              {/* Request Metadata */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-4">
                  <Badge variant="outline" className="mr-3">
                    {!request.expertiseRequired || request.expertiseRequired === "none" ? "General help" : request.expertiseRequired}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(request.createdAt!), { addSuffix: true })}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-4 w-4" />
                    <span className="font-medium">{responses.length} response{responses.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditing(request)}
                    className="flex items-center space-x-1"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:text-primary font-medium"
                    onClick={() => handleViewRequest(request)}
                  >
                    View Details
                  </Button>
                </div>
              </div>

              {/* Responses Section - Now directly under the request */}
              {responses.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-900 flex items-center space-x-2">
                      <Reply className="h-4 w-4 text-primary" />
                      <span>Community Responses ({responses.length})</span>
                    </h5>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRequestExpansion(request.id)}
                      className="flex items-center space-x-1"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <span>{isExpanded ? "Hide" : "Show"} All</span>
                    </Button>
                  </div>

                  {/* Show first response or all if expanded */}
                  <div className="space-y-4">
                    {(isExpanded ? responses : responses.slice(0, 1)).map((response, index) => (
                      <div key={response.id}>
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={response.expert.profileImage || ""} alt={response.expert.name} />
                            <AvatarFallback className="text-xs">
                              {response.expert.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h6 className="font-medium text-sm text-gray-900">{response.expert.name}</h6>
                              <span className="text-xs text-gray-500">
                                {response.expert.profession} • Batch {response.expert.batchYear}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-700 mb-2">{response.content}</p>
                            
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                              <span>
                                {formatDistanceToNow(new Date(response.createdAt!), { addSuffix: true })}
                              </span>
                              <span>•</span>
                              <span className="flex items-center space-x-1">
                                <MessageCircle className="h-3 w-3" />
                                <span>{response.helpfulCount || 0} helpful</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {index < (isExpanded ? responses : responses.slice(0, 1)).length - 1 && (
                          <Separator className="my-3" />
                        )}
                      </div>
                    ))}

                    {!isExpanded && responses.length > 1 && (
                      <div className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRequestExpansion(request.id)}
                          className="text-primary"
                        >
                          Show {responses.length - 1} more response{responses.length - 1 !== 1 ? "s" : ""}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {responses.length === 0 && (
                <div className="border-t border-gray-100 pt-4 text-center text-gray-500">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No responses yet. Share your request to get help from the community.</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
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
              Manage and track all your help requests and community responses.
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
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Reply className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Responses</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {Object.values(responsesByRequest).reduce((acc, responses) => acc + responses.length, 0)}
                  </p>
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
                  <MyRequestCard key={request.id} request={request} />
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
                  <MyRequestCard key={request.id} request={request} />
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
                  <MyRequestCard key={request.id} request={request} />
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
                  <MyRequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
} 