import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertResponseSchema } from "@shared/schema";
import { z } from "zod";
import { Send } from "lucide-react";

const responseFormSchema = insertResponseSchema.omit({ expertId: true });

type ResponseFormData = z.infer<typeof responseFormSchema>;

interface ResponseFormProps {
  requestId: number;
  onSuccess?: () => void;
}

export default function ResponseForm({ requestId, onSuccess }: ResponseFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Response posted successfully!",
        description: "Your response has been posted and the user will be notified.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/responses/request", requestId] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests", requestId] });
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

  const onSubmit = (data: ResponseFormData) => {
    createResponseMutation.mutate(data);
  };

  return (
    <div className="border-t border-gray-100 pt-6">
      <h4 className="font-semibold text-gray-900 mb-4">Offer Your Support</h4>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Response*</FormLabel>
                <FormControl>
                  <Textarea
                    rows={4}
                    placeholder="Share your advice, experience, guidance, or offer any help you can provide..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={createResponseMutation.isPending}
              className="flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>
                {createResponseMutation.isPending ? "Posting..." : "Post Response"}
              </span>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
