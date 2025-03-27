import { useLocation } from "wouter";

export default function MobileNavigation() {
  const [location, navigate] = useLocation();

  const isActive = (path: string) => location === path;
  
  const handleEmergency = () => {
    // In a real app, this would trigger emergency services
    alert('Emergency services would be contacted');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200">
      <nav className="flex justify-between items-center px-2 py-3">
        <a
          href="/"
          onClick={(e) => { e.preventDefault(); navigate("/"); }}
          className={`flex flex-col items-center ${isActive("/") ? "text-primary-600" : "text-gray-500"}`}
        >
          <i className="ri-dashboard-line text-xl"></i>
          <span className="text-xs mt-1">Home</span>
        </a>
        <a
          href="/appointments"
          onClick={(e) => { e.preventDefault(); navigate("/appointments"); }}
          className={`flex flex-col items-center ${isActive("/appointments") ? "text-primary-600" : "text-gray-500"}`}
        >
          <i className="ri-calendar-line text-xl"></i>
          <span className="text-xs mt-1">Appointments</span>
        </a>
        <button
          onClick={handleEmergency}
          className="flex flex-col items-center"
        >
          <div className="bg-orange-500 p-3 rounded-full -mt-5 shadow-lg">
            <i className="ri-alarm-warning-line text-xl text-white"></i>
          </div>
          <span className="text-xs mt-1">SOS</span>
        </button>
        <a
          href="/medication-tracker"
          onClick={(e) => { e.preventDefault(); navigate("/medication-tracker"); }}
          className={`flex flex-col items-center ${isActive("/medication-tracker") ? "text-primary-600" : "text-gray-500"}`}
        >
          <i className="ri-capsule-line text-xl"></i>
          <span className="text-xs mt-1">Meds</span>
        </a>
        <a
          href="/doctors"
          onClick={(e) => { e.preventDefault(); navigate("/doctors"); }}
          className={`flex flex-col items-center ${isActive("/doctors") ? "text-primary-600" : "text-gray-500"}`}
        >
          <i className="ri-user-heart-line text-xl"></i>
          <span className="text-xs mt-1">Doctors</span>
        </a>
      </nav>
    </div>
  );
}
