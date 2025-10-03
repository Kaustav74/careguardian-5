import { ReactNode, useState } from "react";
import HospitalSidebar from "./HospitalSidebar";
import MobileHeader from "./MobileHeader";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

interface HospitalLayoutProps {
  children: ReactNode;
  title: string;
}

export default function HospitalLayout({ children, title }: HospitalLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user } = useAuth();

  // Fetch hospital details
  const { data: hospital } = useQuery<any>({
    queryKey: ["/api/hospitals/me"],
  });

  const toggleSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <HospitalSidebar user={user} hospitalName={hospital?.name} />
      </div>

      {/* Mobile Sidebar */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={toggleSidebar}></div>
          <div className="relative flex flex-col flex-1 w-full max-w-xs bg-white">
            <HospitalSidebar user={user} hospitalName={hospital?.name} isMobile onClose={toggleSidebar} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Mobile Header */}
        <MobileHeader onMenuClick={toggleSidebar} user={user} />

        {/* Page content */}
        <main className="relative flex-1 overflow-y-auto focus:outline-none">
          <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
