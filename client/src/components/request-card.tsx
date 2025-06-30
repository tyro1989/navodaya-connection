import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MessageCircle, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { RequestWithUser } from "@shared/schema";

interface RequestCardProps {
  request: RequestWithUser;
  onViewClick?: (request: RequestWithUser) => void;
  showUserInfo?: boolean;
}

export default function RequestCard({ request, onViewClick, showUserInfo = true }: RequestCardProps) {
  const isUrgent = request.urgency === "urgent";
  const isResolved = request.status === "resolved";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-secondary text-secondary-foreground";
      case "in_progress":
        return "bg-primary text-primary-foreground";
      case "open":
        return isUrgent ? "bg-accent text-accent-foreground" : "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Card className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => onViewClick?.(request)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-gray-900 flex-1 pr-2">{request.title}</h4>
          <Badge className={`text-xs ${getStatusColor(request.status)} flex items-center space-x-1`}>
            {isUrgent && <AlertTriangle className="h-3 w-3" />}
            <span className="capitalize">
              {isUrgent ? "Urgent" : request.urgency}
            </span>
          </Badge>
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {request.description}
        </p>
        
        {showUserInfo && (
          <div className="flex items-center text-sm text-gray-500 mb-3 space-x-4">
            <span>By {request.user.name}</span>
            <span>•</span>
            <span>{request.user.profession}</span>
            <span>•</span>
            <span>Batch {request.user.batchYear}</span>
          </div>
        )}
        
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <Badge variant="outline" className="mr-3">
            {request.expertiseRequired}
          </Badge>
          <Clock className="h-3 w-3 mr-1" />
          <span>
            {formatDistanceToNow(new Date(request.createdAt!), { addSuffix: true })}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isResolved && (
              <div className="flex items-center space-x-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-yellow-400 text-sm">★</span>
                  ))}
                </div>
                <span className="text-secondary-600 font-medium text-sm">Reviewed</span>
              </div>
            )}
            
            {!isResolved && (
              <div className="flex items-center space-x-1 text-secondary-600">
                <MessageCircle className="h-4 w-4" />
                <span className="font-medium text-sm">
                  {request.responseCount || 0} responses
                </span>
              </div>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-primary font-medium"
            onClick={(e) => {
              e.stopPropagation();
              onViewClick?.(request);
            }}
          >
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
