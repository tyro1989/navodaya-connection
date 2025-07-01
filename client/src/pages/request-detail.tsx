import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/navigation";
import ResponseForm from "@/components/response-form";
import RatingStars from "@/components/rating-stars";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { 
  ArrowLeft, 
  Clock, 
  MessageCircle, 
  ThumbsUp, 
  Phone, 
  Heart, 
  Gift,
  AlertTriangle,
  User
} from "lucide-react";
import type { RequestWithUser, ResponseWithExpert, Review } from "@shared/schema";

export default function RequestDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRating, setSelectedRating] = useState(0);

  const requestId = parseInt(id || "0");

  const { data: requestData, isLoading } = useQuery({
    queryKey: ["/api/requests", requestId],
    enabled: !!requestId,
  });

  const { data: responsesData } = useQuery({
    queryKey: ["/api/responses/request", requestId],
    enabled: !!requestId,
  });

  const markHelpfulMutation = useMutation({
    mutationFn: async (responseId: number) => {
      const response = await apiRequest("POST", `/api/responses/${responseId}/helpful`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Response marked as helpful!",
        description: "Thank you for your feedback.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/responses/request", requestId] });
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data: { requestId: number; expertId: number; rating: number; comment?: string }) => {
      const response = await apiRequest("POST", "/api/reviews", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review submitted!",
        description: "Your feedback has been recorded.",
      });
      setSelectedRating(0);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">Loading request details...</div>
        </div>
      </div>
    );
  }

  const request: RequestWithUser | undefined = (requestData as { request: RequestWithUser })?.request;
  const responses: ResponseWithExpert[] = (responsesData as { responses: ResponseWithExpert[] })?.responses || [];

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Request not found</h3>
              <p className="text-gray-600 mb-4">
                The request you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => setLocation("/")}>
                Go Back Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isUrgent = request.urgency === "urgent" || request.urgency === "critical";
  const isResolved = request.status === "resolved";
  const canRespond = user?.isExpert && request.userId !== user.id && !isResolved;

  const handleWhatsAppContact = (expert: ResponseWithExpert["expert"]) => {
    const message = encodeURIComponent(
      `Hi ${expert.name}, I found you through Navodaya Connection regarding my request: "${request.title}". I would appreciate your further guidance.`
    );
    // Mock phone number for demo - in real app this would come from expert profile
    const phoneNumber = "+919876543210";
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^\d]/g, "")}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleGratitudePayment = (expert: ResponseWithExpert["expert"]) => {
    // Mock UPI ID for demo - in real app this would come from expert profile
    const upiId = "expert@paytm";
    const amount = "100";
    const note = `Gratitude payment for help on: ${request.title}`;
    
    toast({
      title: "Payment Link",
      description: `UPI ID: ${upiId} - Amount: ₹${amount}`,
    });
  };

  const submitReview = (expertId: number) => {
    if (selectedRating > 0) {
      createReviewMutation.mutate({
        requestId: request.id,
        expertId,
        rating: selectedRating,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6 flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Button>

        {/* Request Details */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-gray-900 mb-3">{request.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Posted by {request.user.name}</span>
                  </div>
                  <span>•</span>
                  <span>{request.user.profession} • Batch {request.user.batchYear}</span>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDistanceToNow(new Date(request.createdAt!), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
              <Badge 
                className={`flex items-center space-x-1 ${
                  isUrgent 
                    ? "bg-accent text-accent-foreground" 
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {isUrgent && <AlertTriangle className="h-3 w-3" />}
                <span className="capitalize">
                  {isUrgent ? "Urgent" : request.urgency}
                </span>
              </Badge>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-gray-700">{request.description}</p>
            </div>
            
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Expertise Required</h4>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {!request.expertiseRequired || request.expertiseRequired === "none" ? "No specific expertise needed" : request.expertiseRequired}
              </Badge>
            </div>

            {/* Request Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {responses.length} Response{responses.length !== 1 ? "s" : ""}
                </span>
              </div>
              <Badge 
                variant={isResolved ? "default" : "secondary"}
                className={isResolved ? "bg-secondary text-secondary-foreground" : ""}
              >
                {isResolved ? "Resolved" : "Open"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Responses Section */}
        {responses.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span>Expert Responses ({responses.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {responses.map((response, index) => (
                  <div key={response.id}>
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={response.expert.profileImage || ""} alt={response.expert.name} />
                        <AvatarFallback>
                          {response.expert.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h5 className="font-medium text-gray-900">{response.expert.name}</h5>
                          <span className="text-sm text-gray-500">
                            {response.expert.profession} • Batch {response.expert.batchYear}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-4">{response.content}</p>
                        
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-gray-500">
                            {formatDistanceToNow(new Date(response.createdAt!), { addSuffix: true })}
                          </span>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markHelpfulMutation.mutate(response.id)}
                            className="text-primary hover:text-primary flex items-center space-x-1"
                          >
                            <ThumbsUp className="h-3 w-3" />
                            <span>Helpful ({response.helpfulCount || 0})</span>
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleWhatsAppContact(response.expert)}
                            className="text-secondary hover:text-secondary flex items-center space-x-1"
                          >
                            <Phone className="h-3 w-3" />
                            <span>Contact</span>
                          </Button>
                        </div>

                        {/* Rating and Gratitude Section for Request Owner */}
                        {user?.id === request.userId && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h6 className="font-semibold text-gray-900 mb-3">Rate this response</h6>
                            <div className="flex items-center space-x-4 mb-4">
                              <RatingStars
                                rating={selectedRating}
                                onRatingChange={setSelectedRating}
                                size="lg"
                              />
                              <span className="text-sm text-gray-600">Rate this expert's response</span>
                            </div>
                            
                            <div className="flex space-x-3">
                              <Button
                                onClick={() => submitReview(response.expertId)}
                                disabled={selectedRating === 0}
                                className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground flex items-center justify-center space-x-2"
                              >
                                <Heart className="h-4 w-4" />
                                <span>Send Thanks</span>
                              </Button>
                              <Button
                                onClick={() => handleGratitudePayment(response.expert)}
                                className="flex-1 bg-primary hover:bg-primary/90 flex items-center justify-center space-x-2"
                              >
                                <Gift className="h-4 w-4" />
                                <span>Pay Gratitude</span>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {index < responses.length - 1 && <Separator className="my-6" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Responses State */}
        {responses.length === 0 && (
          <Card className="mb-6">
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No responses yet</h3>
              <p className="text-gray-600">
                This request is waiting for expert responses. 
                {canRespond && " You can be the first to help!"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Response Form for Experts */}
        {canRespond && (
          <Card>
            <CardContent className="p-6">
              <ResponseForm 
                requestId={request.id}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/responses/request", requestId] });
                }}
              />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
