import Layout from "@/components/layout/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MapPin, Phone, Mail, Plus, Navigation, Building2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Hospital {
  id: number;
  name: string;
  address: string;
  city?: string;
  state?: string;
  phoneNumber: string;
  email?: string;
  rating?: number;
  logo?: string;
  latitude?: string;
  longitude?: string;
  distance?: number;
  departments?: string[];
  services?: string[];
  emergencyServices?: boolean;
  beds?: number;
  established?: string;
  website?: string;
}

const hospitalFormSchema = z.object({
  name: z.string().min(3, "Hospital name must be at least 3 characters"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  departments: z.string().optional(),
  services: z.string().optional(),
  emergencyServices: z.boolean().default(true),
  beds: z.string().optional(),
  established: z.string().optional(),
  website: z.string().url("Valid URL is required").optional().or(z.literal("")),
});

type HospitalFormData = z.infer<typeof hospitalFormSchema>;

export default function Hospitals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [userCity, setUserCity] = useState<string>("");
  const [filterMode, setFilterMode] = useState<"all" | "city" | "nearby">("all");

  const form = useForm<HospitalFormData>({
    resolver: zodResolver(hospitalFormSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      phoneNumber: "",
      email: "",
      latitude: "",
      longitude: "",
      departments: "",
      services: "",
      emergencyServices: true,
      beds: "",
      established: "",
      website: "",
    },
  });

  // Fetch all hospitals
  const { data: allHospitals, isLoading } = useQuery({ 
    queryKey: ["/api/hospitals"]
  });

  // Search hospitals mutation
  const searchMutation = useMutation({
    mutationFn: async (params: { city?: string; latitude?: number; longitude?: number; maxDistance?: number }) => {
      return await apiRequest("POST", "/api/hospitals/search", params);
    },
    onSuccess: (data: any) => {
      if (data.hospitals) {
        setHospitals(data.hospitals);
      }
    },
  });

  // Create hospital mutation
  const createHospitalMutation = useMutation({
    mutationFn: async (data: HospitalFormData) => {
      const hospitalData = {
        ...data,
        departments: data.departments ? data.departments.split(",").map(d => d.trim()) : [],
        services: data.services ? data.services.split(",").map(s => s.trim()) : [],
        beds: data.beds ? parseInt(data.beds) : undefined,
        email: data.email || undefined,
        website: data.website || undefined,
      };
      return await apiRequest("POST", "/api/hospitals", hospitalData);
    },
    onSuccess: () => {
      toast({
        title: "Hospital Added",
        description: "Hospital has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hospitals"] });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Hospital",
        description: error.message || "Could not add hospital.",
        variant: "destructive",
      });
    },
  });

  // Get user location and search
  const handleLocationSearch = () => {
    setIsGettingLocation(true);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Search by location
          searchMutation.mutate({ latitude, longitude, maxDistance: 50 });
          setFilterMode("nearby");
          
          // Update user location in background
          try {
            await apiRequest("PATCH", "/api/user/location", {
              latitude: latitude.toString(),
              longitude: longitude.toString(),
              city: userCity || "Unknown",
              state: "Unknown"
            });
          } catch (error) {
            console.error("Failed to update user location:", error);
          }
          
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location Error",
            description: "Unable to retrieve your location. Please enable location services.",
            variant: "destructive",
          });
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      setIsGettingLocation(false);
    }
  };

  // Get location for form
  const handleGetFormLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          form.setValue("latitude", latitude.toString());
          form.setValue("longitude", longitude.toString());
          toast({
            title: "Location Captured",
            description: "Hospital location has been set to your current position.",
          });
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Unable to get location. Please enter manually.",
            variant: "destructive",
          });
        },
        { enableHighAccuracy: true }
      );
    }
  };

  // Initialize hospitals and check user city
  useEffect(() => {
    if (allHospitals) {
      setHospitals(allHospitals);
    }
  }, [allHospitals]);

  // Check if user has city set
  useEffect(() => {
    if (user?.city) {
      setUserCity(user.city);
    }
  }, [user]);

  // Filter by user city
  const handleCityFilter = () => {
    if (userCity) {
      searchMutation.mutate({ city: userCity });
      setFilterMode("city");
    } else {
      toast({
        title: "No City Set",
        description: "Please use location search to set your city first.",
        variant: "destructive",
      });
    }
  };

  const handleShowAll = () => {
    if (allHospitals) {
      setHospitals(allHospitals);
      setFilterMode("all");
    }
  };

  const onSubmit = (data: HospitalFormData) => {
    createHospitalMutation.mutate(data);
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    const stars = [];
    const fullStars = Math.floor(rating);
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }
    
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }
    
    return <div className="flex items-center gap-1">{stars}</div>;
  };

  const filteredHospitals = hospitals.filter(hospital => 
    hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hospital.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hospital.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Hospitals">
      <div className="space-y-6">
        {/* Header with filters and add button */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Find Hospitals</CardTitle>
                <CardDescription>
                  {userCity && `Showing hospitals ${filterMode === "city" ? `in ${userCity}` : filterMode === "nearby" ? "near you" : "all"}`}
                </CardDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-hospital">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Hospital
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Register New Hospital</DialogTitle>
                    <DialogDescription>
                      Add a new hospital to the directory with complete details.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hospital Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter hospital name" {...field} data-testid="input-hospital-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Address *</FormLabel>
                            <FormControl>
                              <Input placeholder="Street address" {...field} data-testid="input-address" />
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
                              <FormLabel>City *</FormLabel>
                              <FormControl>
                                <Input placeholder="City" {...field} data-testid="input-city" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State *</FormLabel>
                              <FormControl>
                                <Input placeholder="State" {...field} data-testid="input-state" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number *</FormLabel>
                              <FormControl>
                                <Input placeholder="Phone number" {...field} data-testid="input-phone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="Email" {...field} data-testid="input-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <FormLabel>Location Coordinates</FormLabel>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="latitude"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Latitude" {...field} data-testid="input-latitude" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="longitude"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Longitude" {...field} data-testid="input-longitude" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={handleGetFormLocation}
                          data-testid="button-get-location"
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          Use Current Location
                        </Button>
                      </div>

                      <FormField
                        control={form.control}
                        name="departments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Departments (comma-separated)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Cardiology, Neurology, Pediatrics" {...field} data-testid="input-departments" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="services"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Services (comma-separated)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Emergency, Surgery, Imaging" {...field} data-testid="input-services" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="beds"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Beds</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Number of beds" {...field} data-testid="input-beds" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="established"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Established</FormLabel>
                              <FormControl>
                                <Input placeholder="Year" {...field} data-testid="input-established" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website</FormLabel>
                              <FormControl>
                                <Input placeholder="https://" {...field} data-testid="input-website" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsAddDialogOpen(false)}
                          data-testid="button-cancel"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createHospitalMutation.isPending}
                          data-testid="button-submit-hospital"
                        >
                          {createHospitalMutation.isPending ? "Adding..." : "Add Hospital"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              className="max-w-md"
              placeholder="Search hospitals by name, address, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-hospitals"
            />
            
            <div className="flex gap-2">
              <Button 
                variant={filterMode === "all" ? "default" : "outline"}
                onClick={handleShowAll}
                data-testid="button-show-all"
              >
                Show All
              </Button>
              <Button 
                variant={filterMode === "city" ? "default" : "outline"}
                onClick={handleCityFilter}
                disabled={!userCity}
                data-testid="button-filter-city"
              >
                <Building2 className="h-4 w-4 mr-2" />
                My City {userCity && `(${userCity})`}
              </Button>
              <Button 
                variant={filterMode === "nearby" ? "default" : "outline"}
                onClick={handleLocationSearch}
                disabled={isGettingLocation || searchMutation.isPending}
                data-testid="button-filter-nearby"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {isGettingLocation ? "Getting Location..." : "Nearby"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Hospital Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading || searchMutation.isPending ? (
            Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full" />
            ))
          ) : filteredHospitals.length > 0 ? (
            filteredHospitals.map((hospital) => (
              <Card key={hospital.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-hospital-${hospital.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-1">{hospital.name}</CardTitle>
                      {hospital.rating && (
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(hospital.rating)}
                          <span className="text-sm text-gray-500">{hospital.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 line-clamp-2">
                        {hospital.address}
                        {hospital.city && hospital.state && `, ${hospital.city}, ${hospital.state}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600">{hospital.phoneNumber}</span>
                    </div>
                    {hospital.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600 truncate">{hospital.email}</span>
                      </div>
                    )}
                    {hospital.distance !== undefined && (
                      <Badge variant="secondary" className="mt-2">
                        {hospital.distance.toFixed(1)} km away
                      </Badge>
                    )}
                  </div>

                  {hospital.emergencyServices && (
                    <Badge variant="destructive" className="text-xs">
                      Emergency Services Available
                    </Badge>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const address = encodeURIComponent(`${hospital.address}, ${hospital.city || ""}`);
                        window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
                      }}
                      data-testid={`button-directions-${hospital.id}`}
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Directions
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => navigate(`/appointments?hospitalId=${hospital.id}`)}
                      data-testid={`button-book-${hospital.id}`}
                    >
                      Book Visit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No hospitals found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchTerm ? `No results for "${searchTerm}"` : "Try searching by location or add a new hospital"}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
