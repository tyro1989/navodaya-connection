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
import { SuccessAnimation } from "@/components/ui/success-animation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertRequestSchema } from "@shared/schema";
import { z } from "zod";
import { Edit, NotebookPen, CloudUpload, MapPin, Navigation, FileText, X } from "lucide-react";
import { EXPERTISE_CATEGORIES, INDIAN_STATES, INDIAN_DISTRICTS } from "@/lib/constants";

type RequestFormData = z.infer<typeof insertRequestSchema>;

export default function RequestForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [charCount, setCharCount] = useState(0);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<RequestFormData>({
    resolver: zodResolver(insertRequestSchema),
    defaultValues: {
      title: "",
      description: "",
      expertiseRequired: null,
      urgency: "medium",
      helpType: "general", // Still needed for backend
      helpLocationState: null,
      helpLocationDistrict: null,
      helpLocationArea: null,
      helpLocationGps: null,
      helpLocationNotApplicable: false,
      attachments: [],
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: RequestFormData) => {
      console.log("Submitting request data:", data);
      const response = await apiRequest("POST", "/api/requests", data);
      return response;
    },
    onSuccess: () => {
      // Show success animation first
      setShowSuccess(true);
      
      // Clear form with visual feedback
      form.reset();
      setCharCount(0);
      setAttachments([]);
      
      // Refresh the requests data
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          typeof query.queryKey[0] === 'string' && query.queryKey[0].includes('/api/requests')
      });
      
      // Show toast after animation and scroll to top
      setTimeout(() => {
        toast({
          title: "🎉 Request Posted Successfully!",
          description: "Your request is now live! Experts in the community will be notified and can respond to help you. You'll receive notifications when someone responds.",
          duration: 6000,
          className: "border-green-200 bg-green-50 text-green-800",
        });
        
        // Scroll to top to show the new request
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 800);
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

  const onSubmit = async (data: RequestFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Form validation errors:", form.formState.errors);
    console.log("Form is valid:", form.formState.isValid);
    
    // Upload files to server first
    const uploadedAttachments: string[] = [];
    
    for (const file of attachments) {
      try {
        const formData = new FormData();
        formData.append('attachment', file);
        
        const response = await fetch('/api/upload/request-attachment', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (response.ok) {
          const result = await response.json();
          uploadedAttachments.push(result.url);
        } else {
          console.error('Failed to upload attachment:', file.name);
          // Continue with other files even if one fails
        }
      } catch (error) {
        console.error('Error uploading attachment:', error);
      }
    }
    
    const dataWithAttachments = {
      ...data,
      attachments: uploadedAttachments,
    };
    
    createRequestMutation.mutate(dataWithAttachments);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const validFiles = files.filter(file => {
      if (file.size > maxFileSize) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 5MB and cannot be uploaded.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });
    
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Note: Debugging moved to button click handler to avoid constant re-renders

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
    <>
      <SuccessAnimation 
        show={showSuccess} 
        message="Request Posted Successfully!" 
        onComplete={() => setShowSuccess(false)}
        duration={2500}
      />
      
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-1">
          <CardContent className="p-8 bg-white/90 backdrop-blur-sm rounded-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Edit className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Post Your Request
                </h2>
              </div>
              <p className="text-gray-600 max-w-lg mx-auto leading-relaxed">
                Share your challenge with the Navodaya community and get expert help
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            {/* Location Applicability */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-600" />
                <Label className="text-sm font-medium text-gray-700">Is location applicable for this request?</Label>
              </div>
              
              <FormField
                control={form.control}
                name="helpLocationNotApplicable"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                          const notApplicable = value === "not-applicable";
                          field.onChange(notApplicable);
                          if (notApplicable) {
                            // Clear location fields when "not applicable" is selected
                            form.setValue("helpLocationState", null);
                            form.setValue("helpLocationDistrict", null);
                            form.setValue("helpLocationArea", null);
                            form.setValue("helpLocationGps", null);
                          }
                        }}
                        value={field.value ? "not-applicable" : "applicable"}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="applicable" id="location-applicable" />
                          <Label htmlFor="location-applicable" className="text-sm cursor-pointer">
                            Yes, location is relevant (physical assistance required)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="not-applicable" id="location-not-applicable" />
                          <Label htmlFor="location-not-applicable" className="text-sm cursor-pointer">
                            No, location not applicable (online help, advice, etc.)
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
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
                    name="helpLocationArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Area/Landmark</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Koramangala, Near Metro Station"
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



            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Attachments (Optional)
              </Label>
              <div className="space-y-3">
                <label className="relative block border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-primary-300 transition-colors cursor-pointer">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                  />
                  <CloudUpload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload files or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">Max 5MB per file • PDF, DOC, images</p>
                </label>
                
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                        <div className="flex items-center space-x-2 flex-1">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                          className="h-6 w-6 p-0 hover:bg-red-100"
                        >
                          <X className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-8">
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 h-12"
                    disabled={createRequestMutation.isPending}
                  >
                    {createRequestMutation.isPending ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
                        <span>Posting Request...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <NotebookPen className="h-4 w-4" />
                        <span>Post Request</span>
                      </div>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      setCharCount(0);
                      setAttachments([]);
                      toast({
                        title: "Form cleared",
                        description: "All fields have been reset.",
                      });
                    }}
                    disabled={createRequestMutation.isPending}
                    className="bg-white/80 border-gray-200 hover:bg-gray-50 py-3 rounded-xl h-12 min-w-[100px]"
                  >
                    Clear
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </div>
      </Card>
    </>
  );
}
