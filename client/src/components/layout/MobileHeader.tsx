import { User } from "@shared/schema";

interface MobileHeaderProps {
  onMenuClick: () => void;
  user?: User | null;
}

export default function MobileHeader({ onMenuClick, user }: MobileHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
      <div className="flex items-center">
        <button 
          type="button" 
          className="text-gray-500 focus:outline-none"
          onClick={onMenuClick}
        >
          <i className="ri-menu-line text-2xl"></i>
        </button>
        <span className="ml-2 text-xl font-bold text-primary-600">CareGuardian</span>
      </div>
      <div>
        {user ? (
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
            {user.fullName?.charAt(0) || user.username.charAt(0)}
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200"></div>
        )}
      </div>
    </header>
  );
}
