import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import MobileNavigation from "./MobileNavigation";
import VoiceAssistant from "@/components/VoiceAssistant";
import { useAuth } from "@/hooks/use-auth";

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user } = useAuth();

  const toggleSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
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
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Emergency
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
    </div>
  );
}
