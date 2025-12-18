import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../hooks/useAuth';
import { ROUTE_ROLES } from '../utils/permissions';
import type { Engagement } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { SkeletonCard } from '../components/SkeletonLoader';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
  });
  const [recentEngagements, setRecentEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Engagement[]>('/engagements');
      const engagementStats = {
        total: data.length,
        draft: data.filter(e => e.status === 'draft').length,
        scheduled: data.filter(e => e.status === 'scheduled').length,
        completed: data.filter(e => e.status === 'completed').length,
        cancelled: data.filter(e => e.status === 'cancelled').length,
      };
      setStats(engagementStats);
      setRecentEngagements(data.slice(0, 5));
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      // Error handling is done silently - user can retry with refresh button
    } finally {
      setLoading(false);
    }
  };

  const canCreateEngagement = user?.role && ROUTE_ROLES.engagementRequest.includes(user.role);
  const canViewReports = user?.role && ROUTE_ROLES.reports.includes(user.role);
  const canViewUsers = user?.role && ROUTE_ROLES.users.includes(user.role);

  const statCards = [
    {
      label: 'Total Engagements',
      value: stats.total,
      color: 'indigo',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: 'Scheduled',
      value: stats.scheduled,
      color: 'blue',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Completed',
      value: stats.completed,
      color: 'emerald',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Draft',
      value: stats.draft,
      color: 'slate',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-500/20 text-slate-300 border-slate-500';
      case 'scheduled': return 'bg-blue-500/20 text-blue-300 border-blue-500';
      case 'completed': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500';
    }
  };

  const quickActions = [
    ...(canCreateEngagement ? [{
      label: 'Create Engagement',
      href: '/engagements/new',
      icon: 'plus',
      color: 'indigo',
    }] : []),
    {
      label: 'View Engagements',
      href: '/engagements',
      icon: 'list',
      color: 'blue',
    },
    ...(user?.role === 'commissioner' ? [{
      label: 'My Calendar',
      href: '/calendar',
      icon: 'calendar',
      color: 'purple',
    }] : []),
    ...(canViewReports ? [{
      label: 'Reports',
      href: '/reports',
      icon: 'chart',
      color: 'emerald',
    }] : []),
    ...(canViewUsers ? [{
      label: 'Manage Users',
      href: '/users',
      icon: 'users',
      color: 'amber',
    }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-sm text-slate-400 mt-1">
            Welcome back, {user?.fullName}. Here's an overview of your engagement operations.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm font-medium transition-colors"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Statistics Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-indigo-500/5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-${card.color}-500/10 text-${card.color}-400`}>
                  {card.icon}
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-white mb-1">{card.value}</p>
                <p className="text-sm text-slate-400">{card.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickActions.map((action) => {
            const icons: Record<string, JSX.Element> = {
              plus: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              ),
              list: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ),
              calendar: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ),
              chart: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
              users: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ),
            };

            return (
              <Link
                key={action.label}
                to={action.href}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border border-slate-800 bg-slate-800/50 hover:bg-slate-800 hover:border-${action.color}-500 transition-all group`}
              >
                <div className={`text-${action.color}-400 group-hover:text-${action.color}-300 mb-2`}>
                  {icons[action.icon]}
                </div>
                <span className="text-xs font-medium text-slate-300 group-hover:text-white text-center">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Engagements */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Engagements</h3>
          <Link
            to="/engagements"
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-800/30 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recentEngagements.length > 0 ? (
          <div className="space-y-3">
            {recentEngagements.map((eng) => (
              <div
                key={eng.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-medium text-white">{eng.referenceNo || 'No Reference'}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(eng.status)}`}>
                      {eng.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-1">{eng.purpose}</p>
                  {eng.requestingUnit && (
                    <p className="text-xs text-indigo-400 mt-1 font-medium">
                      From: {eng.requestingUnit.name}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    {eng.date ? new Date(eng.date).toLocaleDateString() : 'No date'}
                    {eng.time && ` at ${eng.time.slice(0, 5)}`}
                  </p>
                </div>
                <Link
                  to={`/engagements`}
                  className="ml-4 text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">No recent engagements.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
