import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MapPin, User, Filter, Search, AlertCircle, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { EXPERTISE_CATEGORIES, INDIAN_STATES } from "@/lib/constants";
import type { RequestWithUser } from "@shared/schema";

export default function ExpertRequests() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedExpertise, setSelectedExpertise] = useState<string>("");
  const [activeTab, setActiveTab] = useState("for-you");

  // Fetch all open requests
  const { data: requestsData, isLoading } = useQuery({
    queryKey: ["/api/requests"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/requests");
      return response.json() as Promise<{ requests: RequestWithUser[] }>;
    },
  });

  const requests = requestsData?.requests || [];

  // Filter requests based on current tab and filters
  const filteredRequests = requests.filter((request) => {
    // Search term filter
    if (searchTerm && !request.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // State filter
    if (selectedState && request.helpLocationState !== selectedState) {
      return false;
    }

    // Expertise filter
    if (selectedExpertise && request.expertiseRequired !== selectedExpertise) {
      return false;
    }

    // Tab-specific filters
    switch (activeTab) {
      case "for-you":
        // Show requests that match user's expertise areas or don't require specific expertise
        if (user?.expertiseAreas?.length) {
          return !request.expertiseRequired || 
                 user.expertiseAreas.includes(request.expertiseRequired);
        }
        return !request.expertiseRequired;
      
      case "all":
        return true;
      
      case "urgent":
        return request.urgency === "critical" || request.urgency === "high";
      
      case "nearby":
        // Show requests from same state/district
        return request.helpLocationState === user?.state ||
               request.helpLocationDistrict === user?.district;
      
      default:
        return true;
    }
  });

  // Get request counts for tabs
  const getRequestCount = (tabType: string) => {
    switch (tabType) {
      case "for-you":
        return requests.filter(r => 
          !r.expertiseRequired || 
          (user?.expertiseAreas?.includes(r.expertiseRequired) ?? false)
        ).length;
      case "all":
        return requests.length;
      case "urgent":
        return requests.filter(r => r.urgency === "critical" || r.urgency === "high").length;
      case "nearby":
        return requests.filter(r => 
          r.helpLocationState === user?.state || 
          r.helpLocationDistrict === user?.district
        ).length;
      default:
        return 0;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const requestDate = typeof date === 'string' ? new Date(date) : date;
    const diffInHours = Math.floor((now.getTime() - requestDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return "Yesterday";
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Expert Dashboard</h1>
        <p className="text-gray-600">Help people in need with your expertise</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
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
            
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Any State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any State</SelectItem>
                {INDIAN_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedExpertise} onValueChange={setSelectedExpertise}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Any Expertise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Expertise</SelectItem>
                {EXPERTISE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchTerm || selectedState || selectedExpertise) && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedState("");
                  setSelectedExpertise("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="for-you" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            For You ({getRequestCount("for-you")})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            All ({getRequestCount("all")})
          </TabsTrigger>
          <TabsTrigger value="urgent" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Urgent ({getRequestCount("urgent")})
          </TabsTrigger>
          <TabsTrigger value="nearby" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Nearby ({getRequestCount("nearby")})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No requests found</h3>
                <p className="text-gray-600">
                  {activeTab === "for-you" 
                    ? "No requests match your expertise areas. Try checking other tabs or update your profile with more expertise areas."
                    : "Try adjusting your filters or check back later for new requests."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{request.title}</CardTitle>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {request.description}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`ml-4 ${getUrgencyColor(request.urgency)}`}
                      >
                        {request.urgency}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-4 items-center text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{request.user.name}</span>
                        <span>•</span>
                        <span>{request.user.profession}</span>
                        <span>•</span>
                        <span>Batch {request.user.batchYear}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeAgo(request.createdAt!)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {request.expertiseRequired && (
                        <Badge variant="secondary">
                          {request.expertiseRequired}
                        </Badge>
                      )}
                      
                      {(request.helpLocationState || request.helpLocationDistrict) && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {request.helpLocationDistrict && request.helpLocationState 
                            ? `${request.helpLocationDistrict}, ${request.helpLocationState}`
                            : request.helpLocationState || request.helpLocationDistrict
                          }
                        </Badge>
                      )}

                      {request.helpLocationNotApplicable && (
                        <Badge variant="outline">
                          Online Help
                        </Badge>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>Posted {formatTimeAgo(request.createdAt!)}</span>
                      </div>
                      
                      <Button size="sm">
                        Respond to Request
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 