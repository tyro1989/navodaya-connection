import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/navigation";
import RequestForm from "@/components/request-form";
import ExpertCard from "@/components/expert-card";
import RequestCard from "@/components/request-card";
import { useAuth } from "@/lib/auth";
import { 
  AlertTriangle, 
  HandHeart, 
  Clock, 
  Users, 
  TrendingUp, 
  Star,
  Search,
  Filter
} from "lucide-react";
import type { ExpertWithStats, RequestWithUser } from "@shared/schema";
import type { DashboardStats } from "@/lib/types";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [expertiseFilter, setExpertiseFilter] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("urgent");

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

  const experts: ExpertWithStats[] = expertsData?.experts || [];
  const allRequests: RequestWithUser[] = requestsData?.requests || [];
  const userRequests: RequestWithUser[] = userRequestsData?.requests || [];
  const stats: DashboardStats = statsData?.stats || {
    totalRequests: 0,
    activeExperts: 0,
    averageResponseTime: "0 mins",
    communityRating: 0,
  };

  const availableExperts = experts.filter(expert => (expert.availableSlots || 0) > 0);
  const recentRequests = userRequests.slice(0, 3);

  const handleUrgentRequest = () => {
    // Scroll to request form and set urgency to urgent
    document.getElementById("request-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleRegularRequest = () => {
    // Scroll to request form
    document.getElementById("request-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleViewRequest = (request: RequestWithUser) => {
    setLocation(`/request/${request.id}`);
  };

  const expertiseOptions = [
    "Medical/Healthcare",
    "Engineering", 
    "Education/Teaching",
    "Legal",
    "Business/Finance",
    "IT/Technology",
    "Other",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Actions Section */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 border border-primary/20">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Need Help? We're Here for You
            </h1>
            <p className="text-gray-600 mb-6">
              Connect with Navodaya alumni experts for medical advice, mentorship, and professional guidance.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                onClick={handleUrgentRequest}
                className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3 font-medium flex items-center justify-center space-x-2 shadow-sm"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Urgent Help Needed</span>
              </Button>
              <Button
                onClick={handleRegularRequest}
                className="bg-primary hover:bg-primary/90 px-6 py-3 font-medium flex items-center justify-center space-x-2 shadow-sm"
              >
                <HandHeart className="h-4 w-4" />
                <span>Ask for Advice</span>
              </Button>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Request Form */}
          <div className="lg:col-span-2">
            <div id="request-form" className="mb-6">
              <RequestForm />
            </div>

            {/* Recent Requests */}
            {recentRequests.length > 0 && (
              <Card className="shadow-sm border border-gray-100">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Clock className="text-primary" />
                    <span>Your Recent Requests</span>
                  </h3>
                  
                  <div className="space-y-4">
                    {recentRequests.map((request) => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        onViewClick={handleViewRequest}
                        showUserInfo={false}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Experts & Stats */}
          <div className="space-y-6">
            {/* Available Experts */}
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
                    <ExpertCard
                      key={expert.id}
                      expert={expert}
                      onMessageClick={() => handleRegularRequest()}
                    />
                  ))}
                </div>
                
                {experts.length > 3 && (
                  <Button variant="ghost" className="w-full mt-4">
                    View All Experts
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
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
                      <span className="font-semibold text-gray-700">{stats.communityRating}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expert Sign-up CTA */}
            {!user.isExpert && (
              <div className="bg-gradient-to-r from-secondary/10 to-primary/10 rounded-xl p-6 border border-secondary/20">
                <h3 className="font-semibold text-gray-900 mb-2">Become an Expert</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Share your expertise and help fellow Navodaya alumni in their time of need.
                </p>
                <Button 
                  className="w-full bg-secondary hover:bg-secondary/90"
                  onClick={() => setLocation("/profile")}
                >
                  Join as Expert
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
