import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Engagements from './pages/Engagements';
import Availability from './pages/Availability';
import EngagementRequest from './pages/EngagementRequest';
import CommissionerCalendar from './pages/CommissionerCalendar';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import Users from './pages/Users';
import ProtectedRoute from './components/ProtectedRoute';
import { ROUTE_ROLES } from './utils/permissions';

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<ProtectedRoute roles={ROUTE_ROLES.dashboard} />}>
            <Route index element={<Dashboard />} />
          </Route>
          <Route path="/engagements" element={<ProtectedRoute roles={ROUTE_ROLES.engagements} />}>
            <Route index element={<Engagements />} />
          </Route>
          <Route path="/engagements/new" element={<ProtectedRoute roles={ROUTE_ROLES.engagementRequest} />}>
            <Route index element={<EngagementRequest />} />
          </Route>
          <Route path="/availability" element={<ProtectedRoute roles={ROUTE_ROLES.availability} />}>
            <Route index element={<Availability />} />
          </Route>
          <Route path="/reports" element={<ProtectedRoute roles={ROUTE_ROLES.reports} />}>
            <Route index element={<Reports />} />
          </Route>
          <Route path="/calendar" element={<ProtectedRoute roles={ROUTE_ROLES.calendar} />}>
            <Route index element={<CommissionerCalendar />} />
          </Route>
          <Route path="/notifications" element={<ProtectedRoute roles={ROUTE_ROLES.notifications} />}>
            <Route index element={<Notifications />} />
          </Route>
          <Route path="/users" element={<ProtectedRoute roles={ROUTE_ROLES.users} />}>
            <Route index element={<Users />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;

