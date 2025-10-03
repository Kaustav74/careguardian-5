import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import MobileNavigation from "./MobileNavigation";
import VoiceAssistant from "@/components/VoiceAssistant";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const toggleSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const emergencyMutation = useMutation({
    mutationFn: async (locationData: { latitude: string; longitude: string }) => {
      const res = await apiRequest("POST", "/api/emergency", {
        emergencyType: "medical",
        description: "Emergency SOS activated",
        ...locationData
      });
      return res.json();
    },
    onSuccess: (data) => {
      const { incident, ambulance } = data;
      setEmergencyDialogOpen(false);
      
      if (ambulance) {
        toast({
          title: "Emergency Response Activated",
          description: `Ambulance ${ambulance.vehicleNumber} has been dispatched to your location. Help is on the way!`,
          duration: 10000,
        });
      } else {
        toast({
          title: "Emergency Request Received",
          description: "Your emergency has been logged. We're finding the nearest available ambulance.",
          duration: 10000,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Emergency Request Failed",
        description: error.message || "Failed to process emergency request. Please call emergency services directly.",
        variant: "destructive",
        duration: 10000,
      });
    }
  });

  const handleEmergencyClick = () => {
    setEmergencyDialogOpen(true);
  };

  const confirmEmergency = () => {
    setGettingLocation(true);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          emergencyMutation.mutate({
            latitude: latitude.toString(),
            longitude: longitude.toString()
          });
          setGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location Error",
            description: "Unable to retrieve your location. Please enable location services and try again.",
            variant: "destructive",
          });
          setGettingLocation(false);
          setEmergencyDialogOpen(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support geolocation. Please call emergency services directly.",
        variant: "destructive",
      });
      setGettingLocation(false);
      setEmergencyDialogOpen(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar user={user} />
      </div>

      {/* Mobile sidebar */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75" 
            aria-hidden="true"
            onClick={toggleSidebar}
          />
          
          {/* Sidebar */}
          <div className="relative flex flex-col w-64 h-full bg-white">
            <Sidebar user={user} isMobile={true} onClose={toggleSidebar} />
          </div>
        </div>
      )}

      {/* Mobile header & content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden">
          <MobileHeader onMenuClick={toggleSidebar} user={user} />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-6 pb-16 lg:pb-6">
          {/* Page header */}
          <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            <div className="mt-3 sm:mt-0 sm:ml-4 flex items-center space-x-2">
              <VoiceAssistant />
              <button 
                type="button" 
                onClick={handleEmergencyClick}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 animate-pulse"
                data-testid="button-emergency-sos"
              >
                <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Emergency SOS
              </button>
            </div>
          </div>

          {/* Dashboard content */}
          <div className="mt-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <div className="lg:hidden">
        <MobileNavigation />
      </div>

      {/* Emergency Confirmation Dialog */}
      <AlertDialog open={emergencyDialogOpen} onOpenChange={setEmergencyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">🚨 Emergency SOS</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Retrieve your current location</li>
                <li>Dispatch the nearest available ambulance</li>
                <li>Create an emergency incident record</li>
              </ul>
              <p className="mt-3 font-semibold">Only use this for real medical emergencies.</p>
              <p className="mt-1 text-sm">For non-emergencies, please book a regular appointment or request a home visit.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={gettingLocation || emergencyMutation.isPending} data-testid="button-emergency-cancel">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmEmergency}
              className="bg-red-600 hover:bg-red-700"
              disabled={gettingLocation || emergencyMutation.isPending}
              data-testid="button-emergency-confirm"
            >
              {gettingLocation ? "Getting Location..." : emergencyMutation.isPending ? "Dispatching..." : "Confirm Emergency"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
