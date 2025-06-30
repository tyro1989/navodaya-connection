import { useState } from "react";
import { Star } from "lucide-react";

interface RatingStarsProps {
  rating?: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function RatingStars({ 
  rating = 0, 
  onRatingChange, 
  readonly = false,
  size = "md" 
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  };

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (!readonly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((value) => {
        const filled = (hoverRating || rating) >= value;
        return (
          <Star
            key={value}
            className={`
              ${sizeClasses[size]}
              ${filled ? "text-yellow-400 fill-current" : "text-gray-300"}
              ${!readonly ? "cursor-pointer hover:text-yellow-400 transition-colors" : ""}
            `}
            onClick={() => handleClick(value)}
            onMouseEnter={() => handleMouseEnter(value)}
            onMouseLeave={handleMouseLeave}
          />
        );
      })}
    </div>
  );
}
