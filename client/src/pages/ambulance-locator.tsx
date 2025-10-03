import Layout from "@/components/layout/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Navigation, Truck, Phone, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AmbulanceWithDistance {
  id: number;
  vehicleNumber: string;
  status: string;
  currentLatitude: string | null;
  currentLongitude: string | null;
  distance?: number;
  driverName?: string;
  driverPhone?: string;
}

const bookingFormSchema = z.object({
  pickupAddress: z.string().min(5, "Please enter a valid pickup address"),
  dropoffAddress: z.string().optional(),
  patientName: z.string().min(2, "Patient name is required"),
  patientPhone: z.string().min(10, "Valid phone number is required"),
  medicalCondition: z.string().optional(),
});

export default function AmbulanceLocator() {
  const { toast } = useToast();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [ambulancesWithDistance, setAmbulancesWithDistance] = useState<AmbulanceWithDistance[]>([]);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedAmbulance, setSelectedAmbulance] = useState<AmbulanceWithDistance | null>(null);
  
  const form = useForm<z.infer<typeof bookingFormSchema>>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      pickupAddress: "",
      dropoffAddress: "",
      patientName: "",
      patientPhone: "",
      medicalCondition: "",
    },
  });

  // Get available ambulances
  const { data: ambulances, isLoading: isLoadingAmbulances } = useQuery({
    queryKey: ["/api/ambulances/available"],
  });

  // Calculate distance between two points (in km)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get user's current location
  const getUserLocation = () => {
    setGettingLocation(true);
    
    if ("geolocation" in navigator) {
      toast({
        title: "Getting your location...",
        description: "Please allow location access when prompted.",
      });
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
          toast({
            title: "Location found!",
            description: "Showing ambulances near you.",
          });
          
          setGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location Error",
            description: "Unable to retrieve your location. Please enable location services.",
            variant: "destructive",
          });
          setGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      setGettingLocation(false);
    }
  };

  // Calculate distances when ambulances or user location changes
  useEffect(() => {
    if (ambulances && userLocation) {
      const withDistances = (ambulances as any[]).map((ambulance) => {
        if (ambulance.currentLatitude && ambulance.currentLongitude) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            parseFloat(ambulance.currentLatitude),
            parseFloat(ambulance.currentLongitude)
          );
          return { ...ambulance, distance };
        }
        return ambulance;
      });
      
      // Sort by distance
      withDistances.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
      setAmbulancesWithDistance(withDistances);
    } else if (ambulances) {
      setAmbulancesWithDistance(ambulances as AmbulanceWithDistance[]);
    }
  }, [ambulances, userLocation]);

  // Get user location on mount
  useEffect(() => {
    getUserLocation();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "dispatched":
        return "bg-blue-100 text-blue-800";
      case "on_duty":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Booking mutation
  const bookingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof bookingFormSchema> & { ambulanceId: number; pickupLatitude?: string; pickupLongitude?: string }) => {
      return await apiRequest("POST", "/api/ambulance-bookings", data);
    },
    onSuccess: () => {
      toast({
        title: "Booking Confirmed!",
        description: "Your ambulance booking has been successfully created.",
      });
      setBookingDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/ambulance-bookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create ambulance booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBookAmbulance = (ambulance: AmbulanceWithDistance) => {
    setSelectedAmbulance(ambulance);
    if (userLocation) {
      form.setValue("pickupAddress", `Lat: ${userLocation.lat.toFixed(4)}, Lng: ${userLocation.lng.toFixed(4)}`);
    }
    setBookingDialogOpen(true);
  };

  const onSubmitBooking = (data: z.infer<typeof bookingFormSchema>) => {
    if (!selectedAmbulance) return;
    
    bookingMutation.mutate({
      ...data,
      ambulanceId: selectedAmbulance.id,
      pickupLatitude: userLocation?.lat.toString(),
      pickupLongitude: userLocation?.lng.toString(),
    });
  };

  return (
    <Layout title="Ambulance Locator">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50">
              {/* Map Grid Pattern */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #94a3b8 1px, transparent 1px),
                    linear-gradient(to bottom, #94a3b8 1px, transparent 1px)
                  `,
                  backgroundSize: '40px 40px'
                }}
              />
              
              {/* User Location Marker */}
              {userLocation && (
                <div 
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
                  style={{ 
                    left: '50%', 
                    top: '50%',
                  }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75" style={{ width: '24px', height: '24px' }}></div>
                    <div className="relative bg-blue-600 rounded-full p-2 shadow-lg">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                      You are here
                    </div>
                  </div>
                </div>
              )}

              {/* Ambulance Markers */}
              {userLocation && ambulancesWithDistance.slice(0, 5).map((ambulance, index) => {
                if (!ambulance.currentLatitude || !ambulance.currentLongitude) return null;
                
                // Calculate position relative to user (simplified positioning)
                const angle = (index * 72) * (Math.PI / 180); // Distribute evenly
                const radius = 100 + (ambulance.distance || 0) * 20; // Distance affects radius
                const x = 50 + radius * Math.cos(angle);
                const y = 50 + radius * Math.sin(angle);
                
                return (
                  <div
                    key={ambulance.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                    }}
                  >
                    <div className="relative group">
                      <div className="bg-red-600 rounded-full p-2 shadow-lg cursor-pointer hover:scale-110 transition-transform">
                        <Truck className="h-5 w-5 text-white" />
                      </div>
                      <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white px-3 py-2 rounded text-xs font-medium whitespace-nowrap z-30 shadow-lg">
                        {ambulance.vehicleNumber}
                        <br />
                        {ambulance.distance && `${ambulance.distance.toFixed(1)} km away`}
                      </div>
                      {ambulance.distance && (
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap">
                          {ambulance.distance.toFixed(1)} km
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-20">
                <h3 className="text-sm font-semibold mb-2">Legend</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-600 rounded-full p-1">
                      <MapPin className="h-3 w-3 text-white" />
                    </div>
                    <span>Your Location</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-red-600 rounded-full p-1">
                      <Truck className="h-3 w-3 text-white" />
                    </div>
                    <span>Available Ambulance</span>
                  </div>
                </div>
              </div>

              {/* Refresh Location Button */}
              <div className="absolute top-4 right-4 z-20">
                <Button
                  onClick={getUserLocation}
                  disabled={gettingLocation}
                  size="sm"
                  className="shadow-lg"
                  data-testid="button-refresh-location"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  {gettingLocation ? "Locating..." : "Refresh Location"}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Ambulance List */}
        <div className="lg:col-span-1">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Nearby Ambulances
              </CardTitle>
              <CardDescription>
                {userLocation 
                  ? `Showing ${ambulancesWithDistance.length} ambulances sorted by distance`
                  : "Enable location to see ambulances near you"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {isLoadingAmbulances ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : ambulancesWithDistance.length > 0 ? (
                <div className="space-y-3">
                  {ambulancesWithDistance.map((ambulance, index) => (
                    <Card 
                      key={ambulance.id} 
                      className={`${index === 0 && userLocation ? 'border-green-500 border-2' : ''}`}
                      data-testid={`ambulance-card-${ambulance.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{ambulance.vehicleNumber}</h3>
                            {ambulance.distance && (
                              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                <MapPin className="h-3 w-3" />
                                <span>{ambulance.distance.toFixed(2)} km away</span>
                              </div>
                            )}
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ambulance.status)}`}>
                            {ambulance.status}
                          </span>
                        </div>
                        
                        {index === 0 && userLocation && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2 text-xs text-green-600 font-medium mb-2">
                              <span className="inline-block h-2 w-2 bg-green-600 rounded-full"></span>
                              Nearest to you
                            </div>
                          </div>
                        )}
                        
                        {ambulance.distance && (
                          <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>Estimated arrival: {Math.ceil(ambulance.distance * 2)} minutes</span>
                          </div>
                        )}
                        
                        <div className="mt-4 pt-3 border-t">
                          <Button 
                            className="w-full" 
                            size="sm"
                            onClick={() => handleBookAmbulance(ambulance)}
                            data-testid={`button-book-ambulance-${ambulance.id}`}
                          >
                            Book This Ambulance
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">No ambulances available</p>
                  <p className="text-sm text-gray-400 mt-1">Please check back later</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Book Ambulance: {selectedAmbulance?.vehicleNumber}</DialogTitle>
            <DialogDescription>
              Fill in the details below to book this ambulance. We'll dispatch it to your location right away.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitBooking)} className="space-y-4">
              <FormField
                control={form.control}
                name="pickupAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pickup Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter pickup address" {...field} data-testid="input-pickup-address" />
                    </FormControl>
                    <FormDescription>
                      Your current location has been auto-filled
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dropoffAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Drop-off Address (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter hospital or destination" {...field} data-testid="input-dropoff-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="patientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter patient name" {...field} data-testid="input-patient-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="patientPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient Phone *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact number" {...field} data-testid="input-patient-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="medicalCondition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical Condition (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the medical condition or emergency" 
                        {...field} 
                        data-testid="textarea-medical-condition"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setBookingDialogOpen(false)}
                  className="flex-1"
                  data-testid="button-cancel-booking"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={bookingMutation.isPending}
                  data-testid="button-confirm-booking"
                >
                  {bookingMutation.isPending ? "Booking..." : "Confirm Booking"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
