import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertRequestSchema } from "@shared/schema";
import { z } from "zod";
import { Edit, NotebookPen, CloudUpload } from "lucide-react";

const requestFormSchema = insertRequestSchema.extend({
  helpType: z.enum(["general", "specific"]),
});

type RequestFormData = z.infer<typeof requestFormSchema>;

export default function RequestForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [charCount, setCharCount] = useState(0);

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      title: "",
      description: "",
      expertiseRequired: "",
      urgency: "medium",
      helpType: "general",
      attachments: [],
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: RequestFormData) => {
      const response = await apiRequest("POST", "/api/requests", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Request posted successfully!",
        description: "Your request has been posted and experts will be notified.",
      });
      form.reset();
      setCharCount(0);
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to post request",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RequestFormData) => {
    createRequestMutation.mutate(data);
  };

  const expertiseOptions = [
    "Medical/Healthcare",
    "Engineering",
    "Education/Teaching",
    "Legal",
    "Business/Finance",
    "IT/Technology",
    "Other",
  ];

  return (
    <Card className="shadow-sm border border-gray-100">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Edit className="text-primary" />
          <span>Post Your Request</span>
        </h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request Title*</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief description of your need"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description*</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Provide details about your situation (max 500 characters)"
                      className="resize-none"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setCharCount(e.target.value.length);
                      }}
                      maxLength={500}
                    />
                  </FormControl>
                  <div className="text-right text-sm text-gray-500">
                    {charCount}/500
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expertiseRequired"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expertise Required*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select expertise area" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {expertiseOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urgency Level*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="urgent">Urgent - Need immediate help</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="helpType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Help Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-wrap gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="general" id="general" />
                        <Label htmlFor="general" className="text-sm cursor-pointer">
                          General advice from anyone
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="specific" id="specific" />
                        <Label htmlFor="specific" className="text-sm cursor-pointer">
                          Specific expert (I'll choose)
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Attachments (Optional)
              </Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-primary-300 transition-colors cursor-pointer">
                <CloudUpload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Click to upload files or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">Max 5MB per file</p>
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={createRequestMutation.isPending}
              >
                <NotebookPen className="h-4 w-4 mr-2" />
                {createRequestMutation.isPending ? "Posting..." : "Post Request"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
              >
                Clear
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
