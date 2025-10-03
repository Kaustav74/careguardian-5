import { useLocation } from "wouter";
import { User } from "@shared/schema";

interface HospitalSidebarProps {
  user?: User | null;
  hospitalName?: string;
  isMobile?: boolean;
  onClose?: () => void;
}

export default function HospitalSidebar({ user, hospitalName, isMobile = false, onClose }: HospitalSidebarProps) {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  const navItems = [
    { name: "Dashboard", path: "/hospital-dashboard", icon: "ri-dashboard-line" },
    { name: "Doctors", path: "/hospital-doctors", icon: "ri-user-heart-line" },
    { name: "Home Visit Requests", path: "/hospital-home-visits", icon: "ri-stethoscope-line" },
    { name: "Add Department", path: "/hospital-departments", icon: "ri-building-line" },
    { name: "Settings", path: "/hospital-settings", icon: "ri-settings-line" },
  ];

  return (
    <div className={`flex flex-col w-64 border-r border-gray-200 bg-white ${isMobile ? 'h-full' : ''}`}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className="flex items-center">
          <span className="text-2xl font-bold text-primary-600">CareGuardian</span>
        </div>
        {isMobile && (
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        )}
      </div>
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
        <div className="px-4 mb-4">
          <div className="bg-gradient-to-r from-blue-100 to-green-100 p-3 rounded-lg border border-green-200">
            <div className="text-sm font-medium text-gray-800">
              🏥 Hospital Portal
            </div>
            <div className="text-xs text-gray-600">
              {hospitalName || "Manage your hospital services"}
            </div>
          </div>
        </div>
        <div className="flex-1 px-2 space-y-1">
          {navItems.map((item) => (
            <a 
              key={item.path}
              href={item.path} 
              className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive(item.path) 
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <i className={`${item.icon} mr-3 ${isActive(item.path) ? 'text-primary-500' : 'text-gray-500'} text-lg`}></i>
              {item.name}
            </a>
          ))}
        </div>
      </div>
      {user && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                {user.fullName?.charAt(0) || user.username.charAt(0)}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{user.fullName || user.username}</p>
              <p className="text-xs font-medium text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
