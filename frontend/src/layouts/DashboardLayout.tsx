import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTE_ROLES } from '../utils/permissions';

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

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium ${
        pathname === to ? 'bg-indigo-600 text-white' : 'text-slate-200 hover:bg-slate-800'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-indigo-300">CEMS</p>
            <p className="text-lg font-semibold">Commissioner Engagement Management</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <p className="font-semibold">{user?.fullName}</p>
              <p className="text-slate-400 text-xs">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-md border border-slate-700 hover:bg-slate-800 text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-6 py-2 flex gap-2">
          {navItems.map((item) => navLink(item.to, item.label))}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;

