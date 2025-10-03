import Layout from "@/components/layout/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Truck, MapPin, Phone, User, Clock, Navigation, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AmbulanceDashboard() {
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>("available");

  // Get ambulance driver's ambulance
  const { data: ambulance, isLoading: isLoadingAmbulance } = useQuery({
    queryKey: ["/api/ambulance/my-ambulance"],
  });

  // Get bookings for this ambulance
  const { data: bookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ["/api/ambulance/bookings"],
  });

  // Update ambulance status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return await apiRequest("PATCH", "/api/ambulance/status", { status });
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Your ambulance status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ambulance/my-ambulance"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update status.",
        variant: "destructive",
      });
    },
  });

  // Update location mutation
  const updateLocationMutation = useMutation({
    mutationFn: async () => {
      return new Promise((resolve, reject) => {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              try {
                const result = await apiRequest("PATCH", "/api/ambulance/location", {
                  latitude: latitude.toString(),
                  longitude: longitude.toString(),
                });
                resolve(result);
              } catch (error) {
                reject(error);
              }
            },
            (error) => {
              reject(new Error("Unable to get your location. Please enable location services."));
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        } else {
          reject(new Error("Geolocation is not supported by your browser."));
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Location Updated",
        description: "Your current location has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ambulance/my-ambulance"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update location.",
        variant: "destructive",
      });
    },
  });

  // Accept booking mutation
  const acceptBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      return await apiRequest("PATCH", `/api/ambulance/bookings/${bookingId}/accept`, {});
    },
    onSuccess: () => {
      toast({
        title: "Booking Accepted",
        description: "You have accepted the booking. Please proceed to the pickup location.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ambulance/bookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Action Failed",
        description: error.message || "Failed to accept booking.",
        variant: "destructive",
      });
    },
  });

  // Complete booking mutation
  const completeBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      return await apiRequest("PATCH", `/api/ambulance/bookings/${bookingId}/complete`, {});
    },
    onSuccess: () => {
      toast({
        title: "Booking Completed",
        description: "The booking has been marked as completed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ambulance/bookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Action Failed",
        description: error.message || "Failed to complete booking.",
        variant: "destructive",
      });
    },
  });

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

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const pendingBookings = bookings?.filter((b: any) => b.status === "pending") || [];
  const activeBookings = bookings?.filter((b: any) => b.status === "accepted") || [];
  const completedBookings = bookings?.filter((b: any) => b.status === "completed") || [];

  return (
    <Layout title="Ambulance Dashboard">
      <div className="space-y-6">
        {/* Ambulance Status Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                My Ambulance
              </CardTitle>
              <CardDescription>Manage your ambulance status and location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingAmbulance ? (
                <Skeleton className="h-32 w-full" />
              ) : ambulance ? (
                <>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Vehicle Number</p>
                      <p className="text-lg font-semibold">{ambulance.vehicleNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Current Status</p>
                      <Badge className={`${getStatusColor(ambulance.status)} mt-1`}>
                        {ambulance.status}
                      </Badge>
                    </div>
                    {ambulance.currentLatitude && ambulance.currentLongitude && (
                      <div>
                        <p className="text-sm text-gray-500">Last Known Location</p>
                        <p className="text-sm font-medium flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {parseFloat(ambulance.currentLatitude).toFixed(4)}, {parseFloat(ambulance.currentLongitude).toFixed(4)}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 pt-4 border-t">
                    <label className="text-sm font-medium">Update Status</label>
                    <Select
                      value={ambulance.status}
                      onValueChange={(value) => updateStatusMutation.mutate(value)}
                    >
                      <SelectTrigger data-testid="select-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="on_duty">On Duty</SelectItem>
                        <SelectItem value="dispatched">Dispatched</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      className="w-full mt-2"
                      variant="outline"
                      onClick={() => updateLocationMutation.mutate()}
                      disabled={updateLocationMutation.isPending}
                      data-testid="button-update-location"
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      {updateLocationMutation.isPending ? "Updating..." : "Update Location"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">No ambulance assigned</p>
                  <p className="text-sm text-gray-400 mt-1">Contact admin to get an ambulance assigned</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Overview</CardTitle>
              <CardDescription>Your booking statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{pendingBookings.length}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{activeBookings.length}</p>
                  <p className="text-xs text-gray-500">Active</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{completedBookings.length}</p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Section */}
        <Card>
          <CardHeader>
            <CardTitle>Bookings</CardTitle>
            <CardDescription>Manage your ambulance booking requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">Pending ({pendingBookings.length})</TabsTrigger>
                <TabsTrigger value="active">Active ({activeBookings.length})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({completedBookings.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4 mt-4">
                {isLoadingBookings ? (
                  <div className="space-y-3">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : pendingBookings.length > 0 ? (
                  pendingBookings.map((booking: any) => (
                    <Card key={booking.id} className="border-yellow-200" data-testid={`booking-card-${booking.id}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">Booking #{booking.id}</h3>
                            <Badge className={`${getBookingStatusColor(booking.status)} mt-1`}>
                              {booking.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {new Date(booking.createdAt).toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 mt-0.5 text-gray-500" />
                            <div>
                              <p className="font-medium">{booking.patientName}</p>
                              <p className="text-gray-500">{booking.patientPhone}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                            <div>
                              <p className="font-medium">Pickup: {booking.pickupAddress}</p>
                              {booking.dropoffAddress && (
                                <p className="text-gray-500">Drop-off: {booking.dropoffAddress}</p>
                              )}
                            </div>
                          </div>
                          
                          {booking.medicalCondition && (
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 mt-0.5 text-gray-500" />
                              <p className="text-gray-700">{booking.medicalCondition}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 pt-3 border-t">
                          <Button
                            className="w-full"
                            onClick={() => acceptBookingMutation.mutate(booking.id)}
                            disabled={acceptBookingMutation.isPending}
                            data-testid={`button-accept-${booking.id}`}
                          >
                            {acceptBookingMutation.isPending ? "Accepting..." : "Accept Booking"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">No pending bookings</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="active" className="space-y-4 mt-4">
                {activeBookings.length > 0 ? (
                  activeBookings.map((booking: any) => (
                    <Card key={booking.id} className="border-blue-200" data-testid={`booking-card-${booking.id}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">Booking #{booking.id}</h3>
                            <Badge className={`${getBookingStatusColor(booking.status)} mt-1`}>
                              {booking.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {new Date(booking.createdAt).toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 mt-0.5 text-gray-500" />
                            <div>
                              <p className="font-medium">{booking.patientName}</p>
                              <p className="text-gray-500">{booking.patientPhone}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                            <div>
                              <p className="font-medium">Pickup: {booking.pickupAddress}</p>
                              {booking.dropoffAddress && (
                                <p className="text-gray-500">Drop-off: {booking.dropoffAddress}</p>
                              )}
                            </div>
                          </div>
                          
                          {booking.medicalCondition && (
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 mt-0.5 text-gray-500" />
                              <p className="text-gray-700">{booking.medicalCondition}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 pt-3 border-t">
                          <Button
                            className="w-full"
                            onClick={() => completeBookingMutation.mutate(booking.id)}
                            disabled={completeBookingMutation.isPending}
                            data-testid={`button-complete-${booking.id}`}
                          >
                            {completeBookingMutation.isPending ? "Completing..." : "Mark as Completed"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">No active bookings</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4 mt-4">
                {completedBookings.length > 0 ? (
                  completedBookings.map((booking: any) => (
                    <Card key={booking.id} data-testid={`booking-card-${booking.id}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">Booking #{booking.id}</h3>
                            <Badge className={`${getBookingStatusColor(booking.status)} mt-1`}>
                              {booking.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {new Date(booking.createdAt).toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 mt-0.5 text-gray-500" />
                            <div>
                              <p className="font-medium">{booking.patientName}</p>
                              <p className="text-gray-500">{booking.patientPhone}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                            <div>
                              <p className="font-medium">Pickup: {booking.pickupAddress}</p>
                              {booking.dropoffAddress && (
                                <p className="text-gray-500">Drop-off: {booking.dropoffAddress}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">No completed bookings yet</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
