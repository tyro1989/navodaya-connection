import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SuccessAnimation } from "@/components/ui/success-animation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertResponseSchema } from "@shared/schema";
import { z } from "zod";
import { Send, X } from "lucide-react";

const responseFormSchema = insertResponseSchema.omit({ expertId: true });

type ResponseFormData = z.infer<typeof responseFormSchema>;

interface ResponseFormProps {
  requestId: number;
  onSuccess?: () => void;
  isRequestOwner?: boolean;
  isRequestOpen?: boolean;
}

export default function ResponseForm({ requestId, onSuccess, isRequestOwner = false, isRequestOpen = true }: ResponseFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<ResponseFormData>({
    resolver: zodResolver(responseFormSchema),
    defaultValues: {
      requestId,
      content: "",
      attachments: [],
    },
  });

  const createResponseMutation = useMutation({
    mutationFn: async (data: ResponseFormData) => {
      const response = await apiRequest("POST", "/api/responses", data);
      return response;
    },
    onSuccess: (data) => {
      // Show success animation first
      setShowSuccess(true);
      
      // Clear form with smooth reset
      form.reset();
      
      // Immediately invalidate and refetch the data to show the new response
      queryClient.invalidateQueries({ queryKey: [`/api/responses/request/${requestId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/requests/${requestId}`] });
      // Also invalidate the general requests list to update response counts
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      // Invalidate notification queries to update notification counts
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      
      // Show toast after animation
      setTimeout(() => {
        toast({
          title: isRequestOwner ? "✅ Comment Posted!" : "🎉 Response Posted Successfully!",
          description: isRequestOwner 
            ? "Your comment has been added to the request. Thank you for the additional information!" 
            : "Your response is now live! The person who posted this request will be notified and can see your helpful advice.",
          duration: 5000,
          className: "border-green-200 bg-green-50 text-green-800",
        });
      }, 500);
      
      // Call success callback
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to post response",
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
        title: "🔒 Request Closed Successfully!",
        description: "Your request has been marked as closed. You can still view and respond to existing responses, but the request is no longer accepting new help offers.",
        duration: 6000,
        className: "border-blue-200 bg-blue-50 text-blue-800",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/requests/${requestId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      onSuccess?.();
    },
  });

  const onSubmit = (data: ResponseFormData) => {
    createResponseMutation.mutate(data);
  };

  return (
    <>
      <SuccessAnimation 
        show={showSuccess} 
        message={isRequestOwner ? "Comment Posted!" : "Response Posted!"} 
        onComplete={() => setShowSuccess(false)}
      />
      
      <div className="border-t border-gray-100 pt-6">
        <h4 className="font-semibold text-gray-900 mb-4">
          {isRequestOwner ? "Add a Comment" : "Offer Your Support"}
        </h4>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isRequestOwner ? "Your Comment*" : "Your Response*"}</FormLabel>
                <FormControl>
                  <Textarea
                    rows={4}
                    placeholder={
                      isRequestOwner 
                        ? "Add additional information, updates, or thank the community for their responses..."
                        : "Share your advice, experience, guidance, or offer any help you can provide..."
                    }
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between items-center">
            {isRequestOwner && isRequestOpen && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => closeRequestMutation.mutate()}
                disabled={closeRequestMutation.isPending}
                className="text-gray-600 hover:text-gray-800 border-gray-300"
              >
                {closeRequestMutation.isPending ? (
                  <>
                    <div className="animate-spin h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full mr-1"></div>
                    <span>Closing...</span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-1" />
                    <span>Close Request</span>
                  </>
                )}
              </Button>
            )}
            {!isRequestOwner || isRequestOpen ? (
              <Button
                type="submit"
                disabled={createResponseMutation.isPending}
                className="flex items-center space-x-2 ml-auto relative"
              >
                {createResponseMutation.isPending ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>
                      {isRequestOwner ? "Posting Comment..." : "Posting Response..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>
                      {isRequestOwner ? "Post Comment" : "Post Response"}
                    </span>
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </form>
      </Form>
    </div>
    </>
  );
}
