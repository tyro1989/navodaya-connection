import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import RatingStars from "@/components/rating-stars";
import { Heart, Gift, CheckCircle, MessageCircle, Send } from "lucide-react";

interface ResponseRatingProps {
  responseId: number;
  expertName: string;
  expertUpiId?: string;
  isRequestOwner: boolean;
  isResolved: boolean;
  isBestResponse: boolean;
  onRateResponse: (responseId: number, rating: number, comment?: string) => void;
  onMarkBestResponse: (responseId: number) => void;
  onPayGratitude: () => void;
}

export default function ResponseRating({
  responseId,
  expertName,
  expertUpiId,
  isRequestOwner,
  isResolved,
  isBestResponse,
  onRateResponse,
  onMarkBestResponse,
  onPayGratitude,
}: ResponseRatingProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  const handleSubmitRating = () => {
    if (rating === 0) return;
    
    onRateResponse(responseId, rating, comment.trim() || undefined);
    setHasRated(true);
    setRating(0);
    setComment("");
    setShowCommentBox(false);
  };

  const handleSubmitComment = () => {
    if (rating === 0) return;
    
    onRateResponse(responseId, rating, comment.trim() || undefined);
    setHasRated(true);
    setRating(0);
    setComment("");
    setShowCommentBox(false);
  };

  if (!isRequestOwner) return null;

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        {/* Best Response Badge */}
        {isBestResponse && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Best Response</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              This response was marked as the most helpful by you.
            </p>
          </div>
        )}

        {/* Success Message */}
        {hasRated && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-800">
              <Heart className="h-5 w-5" />
              <span className="font-medium">Thank you for your feedback!</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Your rating has been submitted successfully.
            </p>
          </div>
        )}

        {!hasRated && (
          <div className="space-y-4">
            {/* Header with Mark Best Response */}
            <div className="flex items-center justify-between">
              <h6 className="font-semibold text-gray-900">Rate this response</h6>
              {!isResolved && !isBestResponse && (
                <Button
                  onClick={() => onMarkBestResponse(responseId)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Best Response
                </Button>
              )}
            </div>

            {/* Rating Stars */}
            <div className="flex items-center space-x-4">
              <RatingStars
                rating={rating}
                onRatingChange={setRating}
                size="lg"
              />
              <span className="text-sm text-gray-600">
                Rate {expertName}'s response
              </span>
            </div>

            {/* Submit Rating or Add Comment */}
            {rating > 0 && !showCommentBox && (
              <div className="flex space-x-3">
                <Button
                  onClick={handleSubmitRating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Submit Rating</span>
                </Button>
                <Button
                  onClick={() => setShowCommentBox(true)}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Add Comment</span>
                </Button>
              </div>
            )}

            {/* Comment Box */}
            {showCommentBox && (
              <div className="space-y-3">
                <Textarea
                  placeholder="Share your thoughts about this response..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSubmitComment}
                    disabled={rating === 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>Submit Rating & Comment</span>
                  </Button>
                  <Button
                    onClick={() => setShowCommentBox(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pay Gratitude Button - Always show if UPI ID exists */}
        {expertUpiId && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button
              onClick={onPayGratitude}
              className="w-full bg-primary hover:bg-primary/90 flex items-center justify-center space-x-2"
            >
              <Gift className="h-4 w-4" />
              <span>Pay Gratitude</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 