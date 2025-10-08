import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import MobileNavigation from "./MobileNavigation";
import VoiceAssistant from "@/components/VoiceAssistant";
import { useAuth } from "@/hooks/use-auth";
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

  const handleEmergencyClick = () => {
    setEmergencyDialogOpen(true);
  };

  const confirmEmergency = () => {
    setGettingLocation(true);
    setEmergencyDialogOpen(false);

    // Try getting location for logging (could be sent to analytics/service if needed)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Immediately initiate emergency call to 112
          window.location.href = "tel:112";
          setGettingLocation(false);
          toast({
            title: "Emergency SOS",
            description: "Calling emergency services at 112...",
            duration: 8000,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          window.location.href = "tel:112";
          setGettingLocation(false);
          toast({
            title: "Location Error",
            description: "Unable to retrieve your location. Still calling 112.",
            variant: "destructive",
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      window.location.href = "tel:112";
      setGettingLocation(false);
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support geolocation. Still calling 112.",
        variant: "destructive",
      });
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
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" onClick={toggleSidebar} />
          <div className="relative flex flex-col w-64 h-full bg-white">
            <Sidebar user={user} isMobile={true} onClose={toggleSidebar} />
          </div>
        </div>
      )}

      {/* Mobile header & content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="lg:hidden">
          <MobileHeader onMenuClick={toggleSidebar} user={user} />
        </div>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-6 pb-16 lg:pb-6">
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
              This will immediately call emergency services at <span className="font-semibold">112</span>.<br />
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Retrieve your current location (for logs)</li>
                <li>Make an emergency call to 112</li>
              </ul>
              <p className="mt-3 font-semibold">Only use this for real emergencies.</p>
              <p className="mt-1 text-sm">For non-emergencies, book a regular appointment or request a home visit.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={gettingLocation} data-testid="button-emergency-cancel">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmEmergency}
              className="bg-red-600 hover:bg-red-700"
              disabled={gettingLocation}
              data-testid="button-emergency-confirm"
            >
              {gettingLocation ? "Getting Location & Calling..." : "Confirm Emergency"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
