import Layout from "@/components/layout/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Clock, Home, Stethoscope } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const homeVisitSchema = z.object({
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  pincode: z.string().min(5, "Pincode is required"),
  preferredDate: z.string().min(1, "Preferred date is required"),
  preferredTime: z.string().min(1, "Preferred time is required"),
  medicalConcern: z.string().min(10, "Please describe your medical concern (minimum 10 characters)"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
});

type HomeVisitFormValues = z.infer<typeof homeVisitSchema>;

export default function HomeVisits() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  // Get user's home visit requests
  const { data: homeVisits, isLoading: isLoadingVisits } = useQuery({
    queryKey: ["/api/home-visits"],
  });

  // Request mutation
  const requestVisitMutation = useMutation({
    mutationFn: async (visitData: HomeVisitFormValues) => {
      const res = await apiRequest("POST", "/api/home-visits", visitData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/home-visits"] });
      toast({
        title: "Home visit requested",
        description: "Your request has been submitted. We'll assign a doctor from the nearest hospital and confirm shortly.",
        duration: 8000,
      });
      form.reset();
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to request home visit",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  });

  const form = useForm<HomeVisitFormValues>({
    resolver: zodResolver(homeVisitSchema),
    defaultValues: {
      address: "",
      city: "",
      pincode: "",
      preferredDate: "",
      preferredTime: "",
      medicalConcern: "",
      phoneNumber: "",
    }
  });

  const getCurrentLocation = () => {
    setUseCurrentLocation(true);
    
    if ("geolocation" in navigator) {
      toast({
        title: "Getting your location...",
        description: "Please allow location access when prompted.",
      });
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            
            if (data.address) {
              form.setValue("address", data.display_name || "");
              form.setValue("city", data.address.city || data.address.town || data.address.village || "");
              form.setValue("pincode", data.address.postcode || "");
            }
            
            toast({
              title: "Location retrieved",
              description: "Address fields have been auto-filled. Please verify and complete the form.",
            });
          } catch (error) {
            toast({
              title: "Failed to get address",
              description: "Location found but couldn't retrieve address details. Please enter manually.",
              variant: "destructive",
            });
          }
          
          setUseCurrentLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location Error",
            description: "Unable to retrieve your location. Please enter your address manually.",
            variant: "destructive",
          });
          setUseCurrentLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support geolocation. Please enter your address manually.",
        variant: "destructive",
      });
      setUseCurrentLocation(false);
    }
  };

  const onSubmit = (data: HomeVisitFormValues) => {
    setIsSubmitting(true);
    requestVisitMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Layout title="Home Doctor Visits">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Request a Home Visit
            </CardTitle>
            <CardDescription>
              A qualified doctor will visit your home at your convenience. We'll assign a doctor from the nearest hospital based on your location.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Visit Location</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    disabled={useCurrentLocation}
                    data-testid="button-use-location"
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    {useCurrentLocation ? "Getting Location..." : "Use Current Location"}
                  </Button>
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="House no., Street, Landmark" data-testid="input-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pincode</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-pincode" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input {...field} type="tel" placeholder="+91 98765 43210" data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="preferredDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preferredTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Time</FormLabel>
                        <FormControl>
                          <Input {...field} type="time" data-testid="input-time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="medicalConcern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical Concern</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Please describe your symptoms and why you need a home visit"
                          rows={4}
                          data-testid="textarea-concern"
                        />
                      </FormControl>
                      <FormDescription>
                        Help us assign the right specialist by describing your condition
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                  data-testid="button-submit-visit"
                >
                  <Stethoscope className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Submitting Request..." : "Request Home Visit"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Request History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Your Requests
            </CardTitle>
            <CardDescription>
              Track the status of your home visit requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingVisits ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (homeVisits as any[])?.length > 0 ? (
              <div className="space-y-4">
                {(homeVisits as any[]).map((visit: any) => (
                  <div key={visit.id} className="border rounded-lg p-4" data-testid={`visit-card-${visit.id}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{visit.city}</p>
                        <p className="text-sm text-gray-500 mt-1">{visit.preferredDate} at {visit.preferredTime}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(visit.status)}`}>
                        {visit.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{visit.medicalConcern}</p>
                    {visit.assignedDoctorId && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-medium">Assigned Doctor: Dr. {visit.assignedDoctorId}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Home className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500">No home visit requests yet.</p>
                <p className="text-sm text-gray-400 mt-1">Fill out the form to request your first home visit.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
