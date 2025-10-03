import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout/Layout";
import DailyRoutineCard from "@/components/dashboard/DailyRoutineCard";
import AppointmentsCard from "@/components/dashboard/AppointmentsCard";
import MedicalRecordsCard from "@/components/dashboard/MedicalRecordsCard";
import ChatbotCard from "@/components/dashboard/ChatbotCard";
import HospitalsSection from "@/components/dashboard/HospitalsSection";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);

  // Redirect hospital users to their dashboard
  useEffect(() => {
    if (user && user.role === "hospital") {
      navigate("/hospital-dashboard");
    }
  }, [user, navigate]);

  // Capture location on first login if user doesn't have city set
  useEffect(() => {
    if (user && !user.city && user.role === "user") {
      // Show location dialog for first-time users
      setShowLocationDialog(true);
    }
  }, [user]);

  const handleCaptureLocation = () => {
    setIsCapturingLocation(true);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Use reverse geocoding to get city and state (simplified - in production use a geocoding API)
            // For now, we'll use a placeholder approach
            const city = "Your City"; // In production, use a geocoding service
            const state = "Your State";
            
            await apiRequest("PATCH", "/api/user/location", {
              city,
              state,
              latitude: latitude.toString(),
              longitude: longitude.toString(),
            });
            
            toast({
              title: "Location Saved",
              description: "Your location has been saved. This helps us show you nearby hospitals and services.",
            });
            
            // Refresh user data
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            setShowLocationDialog(false);
          } catch (error) {
            console.error("Failed to save location:", error);
            toast({
              title: "Failed to Save Location",
              description: "Could not save your location. You can update it later in settings.",
              variant: "destructive",
            });
          }
          
          setIsCapturingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location Access Denied",
            description: "You can enable location services later in settings to see nearby hospitals.",
          });
          setIsCapturingLocation(false);
          setShowLocationDialog(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      setIsCapturingLocation(false);
      setShowLocationDialog(false);
    }
  };

  return (
    <Layout title="Dashboard">
      <AlertDialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable Location Services</AlertDialogTitle>
            <AlertDialogDescription>
              We'd like to capture your location to provide you with:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Nearby hospitals and healthcare facilities</li>
                <li>Local healthcare services</li>
                <li>Emergency assistance in your area</li>
              </ul>
              <p className="mt-3 text-sm">Your location will only be used to improve your healthcare experience.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCapturingLocation} data-testid="button-location-skip">
              Skip for Now
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCaptureLocation}
              disabled={isCapturingLocation}
              data-testid="button-location-allow"
            >
              {isCapturingLocation ? "Getting Location..." : "Allow Location"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="my-4">
        <h1 className="text-2xl font-bold">Welcome to CareGuardian</h1>
        <p className="text-muted-foreground">Your personal healthcare assistant for complete well-being</p>
      </div>

      {/* Main dashboard sections */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DailyRoutineCard />
        <AppointmentsCard />
        <MedicalRecordsCard />
      </div>

      {/* Chatbot Section */}
      <div className="mt-6 mb-8">
        <ChatbotCard />
      </div>

      {/* Hospitals Section */}
      <HospitalsSection />
    </Layout>
  );
}
