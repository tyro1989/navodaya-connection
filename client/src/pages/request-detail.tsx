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
import ResponseRating from "@/components/response-rating";
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
  User,
  CheckCircle,
  X
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
    queryKey: [`/api/requests/${requestId}`],
    enabled: !!requestId,
  });

  const { data: responsesData } = useQuery({
    queryKey: [`/api/responses/request/${requestId}`],
    enabled: !!requestId,
  });

  const markHelpfulMutation = useMutation({
    mutationFn: async (responseId: number) => {
      const response = await apiRequest("POST", `/api/responses/${responseId}/helpful`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "👍 Response Marked Helpful!",
        description: "Thank you for your feedback! This helps other users identify valuable responses.",
        duration: 4000,
        className: "border-blue-200 bg-blue-50 text-blue-800",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/responses/request/${requestId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to mark as helpful",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const markBestResponseMutation = useMutation({
    mutationFn: async (responseId: number) => {
      const response = await apiRequest("POST", `/api/requests/${requestId}/best-response`, {
        responseId: responseId
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "🏆 Best Response Marked!",
        description: "Thank you for selecting the best response! Your request has been resolved and the expert will be notified.",
        duration: 6000,
        className: "border-green-200 bg-green-50 text-green-800",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/requests/${requestId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/responses/request/${requestId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to mark best response",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const closeRequestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PUT", `/api/requests/${requestId}/status`, {
        status: "closed"
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Request closed successfully!",
        description: "Your request has been marked as closed. You can still view responses but no new responses will be accepted.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/requests/${requestId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
    },
  });

  const createResponseReviewMutation = useMutation({
    mutationFn: async (data: { responseId: number; rating: number; comment?: string }) => {
      const response = await apiRequest("POST", "/api/response-reviews", {
        responseId: data.responseId,
        requestId: requestId,
        rating: data.rating,
        comment: data.comment
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Response rated successfully!",
        description: "Thank you for rating this response.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/responses/request/${requestId}`] });
      // Invalidate notification queries to update notification counts
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data: { requestId: number; expertId: number; rating: number; comment?: string }) => {
      const response = await apiRequest("POST", "/api/reviews", data);
      return response;
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
  const isClosed = request.status === "closed";
  const canRespond = user && !isResolved && !isClosed; // Allow both experts and request owners to respond
  const isRequestOwner = user && request.userId === user.id;

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
    if (selectedRating === 0) return;
    
    createReviewMutation.mutate({
      requestId: requestId,
      expertId: expertId,
      rating: selectedRating
    });
  };

  const handleResponseRating = (responseId: number, rating: number, comment?: string) => {
    createResponseReviewMutation.mutate({
      responseId: responseId,
      rating: rating,
      comment: comment
    });
  };

  const handleBestResponse = (responseId: number) => {
    markBestResponseMutation.mutate(responseId);
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

            {/* Attachments */}
            {request.attachments && request.attachments.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Attachments</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {request.attachments.map((attachment, index) => {
                    const isImage = attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    const fileName = attachment.split('/').pop() || 'Attachment';
                    
                    console.log('Attachment debug:', { attachment, isImage, fileName });
                    
                    return (
                      <div key={index} className="border rounded-lg overflow-hidden">
                        {isImage ? (
                          <div className="aspect-video bg-gray-100">
                            <img
                              src={attachment}
                              alt={`Attachment ${index + 1}`}
                              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(attachment, '_blank')}
                              onError={(e) => {
                                console.error('Image failed to load:', attachment, e);
                              }}
                              onLoad={() => {
                                console.log('Image loaded successfully:', attachment);
                              }}
                            />
                          </div>
                        ) : (
                          <div className="aspect-video bg-gray-50 flex items-center justify-center">
                            <div className="text-center p-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <p className="text-sm text-gray-600 font-medium truncate">{fileName}</p>
                            </div>
                          </div>
                        )}
                        <div className="p-3 bg-white">
                          <button
                            onClick={() => window.open(attachment, '_blank')}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {isImage ? 'View Image' : 'Download File'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
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
              <div className="flex items-center space-x-3">
                {isRequestOwner && !isResolved && !isClosed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => closeRequestMutation.mutate()}
                    disabled={closeRequestMutation.isPending}
                    className="text-gray-600 hover:text-gray-800 border-gray-300"
                  >
                    <X className="h-4 w-4 mr-1" />
                    {closeRequestMutation.isPending ? "Closing..." : "Close Request"}
                  </Button>
                )}
                <Badge 
                  variant={isResolved ? "default" : isClosed ? "destructive" : "secondary"}
                  className={isResolved ? "bg-secondary text-secondary-foreground" : isClosed ? "bg-red-100 text-red-700" : ""}
                >
                  {isResolved ? "Resolved" : isClosed ? "Closed" : "Open"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Responses Section */}
        {responses.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span>Community Responses ({responses.length})</span>
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
                            disabled={markHelpfulMutation.isPending}
                            className="text-primary hover:text-primary flex items-center space-x-1 relative"
                          >
                            {markHelpfulMutation.isPending ? (
                              <>
                                <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full"></div>
                                <span>Helpful ({response.helpfulCount || 0})</span>
                              </>
                            ) : (
                              <>
                                <ThumbsUp className="h-3 w-3" />
                                <span>Helpful ({response.helpfulCount || 0})</span>
                              </>
                            )}
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

                        {/* Response Rating and Actions - Using the new component */}
                        <ResponseRating
                          responseId={response.id}
                          expertName={response.expert.name}
                          expertUpiId={response.expert.upiId || undefined}
                          isRequestOwner={isRequestOwner}
                          isResolved={Boolean(isResolved)}
                          isBestResponse={request.bestResponseId === response.id}
                          onRateResponse={handleResponseRating}
                          onMarkBestResponse={handleBestResponse}
                          onPayGratitude={() => handleGratitudePayment(response.expert)}
                          isMarkingBest={markBestResponseMutation.isPending}
                          isRatingLoading={createResponseReviewMutation.isPending}
                        />
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
                This request is waiting for community responses. 
                {canRespond && !isRequestOwner && " You can be the first to help!"}
                {canRespond && isRequestOwner && " You can add additional details or comments below."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Response Form for Experts and Request Owner */}
        {canRespond && (
          <Card>
            <CardContent className="p-6">
              <ResponseForm 
                requestId={request.id}
                isRequestOwner={isRequestOwner}
                isRequestOpen={!isResolved && !isClosed}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: [`/api/responses/request/${requestId}`] });
                }}
              />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
