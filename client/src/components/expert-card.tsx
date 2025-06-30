import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MessageCircle, Phone } from "lucide-react";
import type { ExpertWithStats } from "@shared/schema";

interface ExpertCardProps {
  expert: ExpertWithStats;
  onContactClick?: (expert: ExpertWithStats) => void;
  onMessageClick?: (expert: ExpertWithStats) => void;
}

export default function ExpertCard({ expert, onContactClick, onMessageClick }: ExpertCardProps) {
  const isAvailable = (expert.availableSlots || 0) > 0;
  const rating = expert.stats?.averageRating ? parseFloat(expert.stats.averageRating) : 0;

  const handleWhatsAppContact = () => {
    if (expert.phoneVisible && expert.phone) {
      const message = encodeURIComponent(
        `Hi ${expert.name}, I found you through Navodaya Connection and would like to seek your guidance.`
      );
      const whatsappUrl = `https://wa.me/${expert.phone.replace(/[^\d]/g, "")}?text=${message}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  return (
    <Card className="hover:shadow-sm transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={expert.profileImage || ""} alt={expert.name} />
            <AvatarFallback>
              {expert.name.split(" ").map(n => n[0]).join("").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate">{expert.name}</h4>
            <p className="text-sm text-gray-600 truncate">
              {expert.profession} • Batch {expert.batchYear}
            </p>
            
            <div className="flex items-center space-x-2 mt-1">
              {rating > 0 && (
                <div className="flex items-center">
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  <span className="text-xs text-gray-600 ml-1">
                    {rating.toFixed(1)} ({expert.stats?.totalReviews || 0})
                  </span>
                </div>
              )}
              
              <Badge 
                variant={isAvailable ? "default" : "secondary"}
                className={`text-xs ${
                  isAvailable 
                    ? "bg-secondary text-secondary-foreground" 
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {isAvailable ? "Available" : "Busy"}
              </Badge>
            </div>
            
            {expert.expertiseAreas && expert.expertiseAreas.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {expert.expertiseAreas.slice(0, 2).map((area) => (
                  <Badge key={area} variant="outline" className="text-xs">
                    {area}
                  </Badge>
                ))}
                {expert.expertiseAreas.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{expert.expertiseAreas.length - 2} more
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          <div className="text-right flex flex-col items-end space-y-1">
            <div className={`w-2 h-2 rounded-full ${isAvailable ? "bg-secondary" : "bg-gray-400"}`} />
            <span className="text-xs text-gray-500">
              {expert.availableSlots || 0}/{expert.dailyRequestLimit || 0} slots
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2 mt-4">
          <Button 
            className="flex-1 text-sm"
            onClick={() => onMessageClick?.(expert)}
            disabled={!isAvailable}
          >
            <MessageCircle className="h-3 w-3 mr-1" />
            Ask for Help
          </Button>
          
          {expert.phoneVisible && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleWhatsAppContact}
              className="text-secondary-600 border-secondary-200 hover:bg-secondary-50"
            >
              <Phone className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
