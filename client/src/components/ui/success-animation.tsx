import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  onComplete?: () => void;
  duration?: number;
}

export function SuccessAnimation({ 
  show, 
  message = "Success!", 
  onComplete,
  duration = 2000 
}: SuccessAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-20 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-6 shadow-xl border border-green-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <CheckCircle2 className="h-8 w-8 text-green-600 animate-in zoom-in-95 duration-300" />
            <div className="absolute inset-0 h-8 w-8 rounded-full border-2 border-green-600 animate-ping opacity-25"></div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{message}</h3>
            <p className="text-sm text-gray-600 mt-1">Your action was completed successfully</p>
          </div>
        </div>
      </div>
    </div>
  );
}