import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MessageCircle, AlertTriangle, Paperclip } from "lucide-react";
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
        return "bg-gradient-to-r from-green-500 to-emerald-600 text-white";
      case "in_progress":
        return "bg-gradient-to-r from-blue-500 to-indigo-600 text-white";
      case "closed":
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
      case "open":
        return isUrgent ? "bg-gradient-to-r from-red-500 to-pink-600 text-white" : "bg-gradient-to-r from-orange-500 to-amber-600 text-white";
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-white";
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm rounded-xl hover:shadow-xl transition-all duration-300 cursor-pointer hover:bg-white/95" onClick={() => onViewClick?.(request)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-semibold text-gray-900 flex-1 pr-3 text-lg leading-tight">{request.title}</h4>
          <Badge className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(request.status)} flex items-center space-x-1 shadow-sm`}>
            {isUrgent && <AlertTriangle className="h-3 w-3" />}
            <span className="capitalize">
              {isUrgent ? "Urgent" : request.urgency}
            </span>
          </Badge>
        </div>
        
        <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
          {request.description}
        </p>
        
        {/* Image Previews */}
        {request.attachments && request.attachments.length > 0 && (
          <div className="mb-3">
            <div className="flex gap-2 overflow-x-auto">
              {request.attachments.slice(0, 3).map((attachment, index) => {
                const isImage = attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                if (!isImage) return null;
                
                return (
                  <div key={index} className="flex-shrink-0">
                    <img
                      src={attachment}
                      alt={`Preview ${index + 1}`}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-all duration-200 shadow-sm hover:shadow-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(attachment, '_blank');
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                );
              })}
              {request.attachments.length > 3 && (
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-200 flex items-center justify-center shadow-sm">
                  <span className="text-xs font-medium text-gray-600">+{request.attachments.length - 3}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {showUserInfo && (
          <div className="flex items-center text-sm text-gray-600 mb-4 p-3 bg-gradient-to-r from-gray-50/50 to-blue-50/30 rounded-lg border border-gray-100/50">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold mr-3">
              {request.user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{request.user.name}</span>
              <span className="text-gray-400">•</span>
              <span>{request.user.profession}</span>
              <span className="text-gray-400">•</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Batch {request.user.batchYear}</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center flex-wrap gap-3 text-sm text-gray-600 mb-4">
          <Badge className="bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 border-indigo-200 px-3 py-1 rounded-full font-medium">
            {!request.expertiseRequired || request.expertiseRequired === "none" ? "General help" : request.expertiseRequired}
          </Badge>
          {request.attachments && request.attachments.length > 0 && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-full">
              <Paperclip className="h-3 w-3 text-gray-500" />
              <span className="text-xs font-medium">{request.attachments.length}</span>
            </div>
          )}
          <div className="flex items-center space-x-1 text-gray-500">
            <Clock className="h-3 w-3" />
            <span className="text-xs">
              {formatDistanceToNow(new Date(request.createdAt!), { addSuffix: true })}
            </span>
          </div>
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
