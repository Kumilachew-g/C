import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTE_ROLES } from '../utils/permissions';
import NotificationBell from '../components/NotificationBell';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', roles: ROUTE_ROLES.dashboard },
    { to: '/engagements', label: 'Engagements', roles: ROUTE_ROLES.engagements },
    { to: '/engagements/new', label: 'Request', roles: ROUTE_ROLES.engagementRequest },
    { to: '/availability', label: 'Availability', roles: ROUTE_ROLES.availability },
    { to: '/calendar', label: 'Calendar', roles: ROUTE_ROLES.calendar },
    { to: '/reports', label: 'Reports', roles: ROUTE_ROLES.reports },
    { to: '/users', label: 'Users', roles: ROUTE_ROLES.users },
    { to: '/notifications', label: 'Notifications', roles: ROUTE_ROLES.notifications },
    { to: '/departments', label: 'Departments', roles: ['admin'] },
  ].filter((item) => item.roles.includes(user?.role || ''));


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-indigo-400 font-semibold">CEMS</p>
                <p className="text-base sm:text-lg font-bold text-white">Commissioner Engagement Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <NotificationBell />
              <div className="text-right hidden sm:block">
                <p className="font-semibold text-white">{user?.fullName}</p>
                <p className="text-slate-400 text-xs capitalize">{user?.role?.replace(/([A-Z])/g, ' $1').trim()}</p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 hover:border-slate-600 text-sm font-medium transition-all duration-200 flex items-center gap-2 group"
                title="Sign out"
              >
                <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 border-t border-slate-800/50 bg-slate-900/50">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  pathname === item.to
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;

