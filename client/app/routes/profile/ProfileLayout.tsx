// components/profile/ProfileLayout.tsx
import { Outlet, Link, useLocation, useParams } from 'react-router';
import { User, Settings, ChevronLeft } from 'lucide-react';

export default function ProfileLayout() {
  const location = useLocation();
  const { username } = useParams();
  const isSettings = location.pathname.includes('/settings');

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="p-2 hover:bg-slate-100 rounded-full">
            <ChevronLeft size={22} className="text-slate-700" />
          </Link>
          <h1 className="font-bold text-lg text-slate-900">
            {isSettings ? 'Account Settings' : username ? `@${username}` : 'Profile'}
          </h1>
          <Link 
            to={isSettings ? `/profile/${username}` : '/profile/settings'}
            className="p-2 hover:bg-slate-100 rounded-full"
          >
            {isSettings ? <User size={22} className="text-slate-700" /> : <Settings size={22} className="text-slate-700" />}
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-pb">
        <div className="max-w-lg mx-auto grid grid-cols-2">
          <Link
            to={`/profile/${username || 'me'}`}
            className={`flex flex-col items-center py-3 ${!isSettings ? 'text-purple-600 bg-purple-50' : 'text-slate-500'}`}
          >
            <User size={20} />
            <span className="text-xs font-medium mt-1">Profile</span>
          </Link>
          <Link
            to="/profile/settings"
            className={`flex flex-col items-center py-3 ${isSettings ? 'text-purple-600 bg-purple-50' : 'text-slate-500'}`}
          >
            <Settings size={20} />
            <span className="text-xs font-medium mt-1">Settings</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}