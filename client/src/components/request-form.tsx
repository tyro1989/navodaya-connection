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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertRequestSchema } from "@shared/schema";
import { z } from "zod";
import { Edit, NotebookPen, CloudUpload, MapPin, Navigation } from "lucide-react";
import { EXPERTISE_CATEGORIES, INDIAN_STATES, INDIAN_DISTRICTS } from "@/lib/constants";

type RequestFormData = z.infer<typeof insertRequestSchema>;

export default function RequestForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [charCount, setCharCount] = useState(0);
  const [gettingLocation, setGettingLocation] = useState(false);

  const form = useForm<RequestFormData>({
    resolver: zodResolver(insertRequestSchema),
    defaultValues: {
      title: "",
      description: "",
      expertiseRequired: null,
      urgency: "medium",
      helpType: "general",
      helpLocationState: null,
      helpLocationDistrict: null,
      helpLocationPinCode: null,
      helpLocationGps: null,
      helpLocationNotApplicable: false,
      attachments: [],
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: RequestFormData) => {
      console.log("Submitting request data:", data);
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
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          typeof query.queryKey[0] === 'string' && query.queryKey[0].includes('/api/requests')
      });
    },
    onError: (error: any) => {
      console.error("Request submission error:", error);
      toast({
        title: "Failed to post request",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RequestFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Form validation errors:", form.formState.errors);
    console.log("Form is valid:", form.formState.isValid);
    createRequestMutation.mutate(data);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        form.setValue("helpLocationGps", `${latitude},${longitude}`);
        setGettingLocation(false);
        toast({
          title: "Location captured",
          description: "Your current location has been added to the request.",
        });
      },
      (error) => {
        setGettingLocation(false);
        toast({
          title: "Location access denied",
          description: "Please enable location access or enter location manually.",
          variant: "destructive",
        });
      }
    );
  };

  const urgencyColors = {
    critical: "bg-red-100 text-red-800",
    high: "bg-orange-100 text-orange-800",
    medium: "bg-yellow-100 text-yellow-800",
  };

  const urgencyDescriptions = {
    critical: "Need immediate assistance (within hours)",
    high: "Need help within 24 hours",
    medium: "Can wait a few days",
  };

  const isLocationNotApplicable = form.watch("helpLocationNotApplicable");

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
                    <FormLabel>Expertise Required (Optional)</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "none" ? null : value)} 
                      value={field.value ?? "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select expertise area (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No specific expertise needed</SelectItem>
                        {EXPERTISE_CATEGORIES.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Leave blank if you need general advice from anyone
                    </FormDescription>
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
                        {Object.entries(urgencyDescriptions).map(([value, description]) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${urgencyColors[value as keyof typeof urgencyColors]}`}>
                                {value}
                              </span>
                              <span className="text-sm">{description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location where help is needed */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-600" />
                <Label className="text-sm font-medium text-gray-700">Where do you need help? (Optional)</Label>
              </div>
              
              <FormField
                control={form.control}
                name="helpLocationNotApplicable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value || false}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked) {
                            // Clear location fields when "not applicable" is checked
                            form.setValue("helpLocationState", "");
                            form.setValue("helpLocationDistrict", "");
                            form.setValue("helpLocationPinCode", "");
                            form.setValue("helpLocationGps", "");
                          }
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Location not applicable (e.g., online help, advice, etc.)
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {!isLocationNotApplicable && (
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="helpLocationState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value || null)} 
                          value={field.value ?? ""}
                        >
                           <FormControl>
                             <SelectTrigger>
                               <SelectValue placeholder="Select state" />
                             </SelectTrigger>
                           </FormControl>
                          <SelectContent>
                            {INDIAN_STATES.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
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
                    name="helpLocationDistrict"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>District</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value || null)} 
                          value={field.value ?? ""} 
                          disabled={!form.watch("helpLocationState")}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={form.watch("helpLocationState") ? "Select district" : "Select state first"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {form.watch("helpLocationState") && INDIAN_DISTRICTS[form.watch("helpLocationState") as keyof typeof INDIAN_DISTRICTS]?.map((district: string) => (
                              <SelectItem key={district} value={district}>
                                {district}
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
                    name="helpLocationPinCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PIN Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 560001"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={getCurrentLocation}
                      disabled={gettingLocation}
                      className="w-full flex items-center space-x-2"
                    >
                      <Navigation className="h-4 w-4" />
                      <span>
                        {gettingLocation ? "Getting location..." : "Use current location"}
                      </span>
                    </Button>
                  </div>
                </div>
              )}
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
                onClick={(e) => {
                  console.log("Submit button clicked!");
                  console.log("Form errors:", form.formState.errors);
                  console.log("Form values:", form.getValues());
                  // Don't prevent default - let form handle submission
                }}
              >
                <NotebookPen className="h-4 w-4 mr-2" />
                {createRequestMutation.isPending ? "Posting..." : "Post Request"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setCharCount(0);
                }}
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
