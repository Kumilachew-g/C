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
import Departments from './pages/Departments';
import ProtectedRoute from './components/ProtectedRoute';
import { ROUTE_ROLES } from './utils/permissions';

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute roles={ROUTE_ROLES.dashboard}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/engagements" 
            element={
              <ProtectedRoute roles={ROUTE_ROLES.engagements}>
                <Engagements />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/engagements/new" 
            element={
              <ProtectedRoute roles={ROUTE_ROLES.engagementRequest}>
                <EngagementRequest />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/availability" 
            element={
              <ProtectedRoute roles={ROUTE_ROLES.availability}>
                <Availability />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute roles={ROUTE_ROLES.reports}>
                <Reports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/calendar" 
            element={
              <ProtectedRoute roles={ROUTE_ROLES.calendar}>
                <CommissionerCalendar />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute roles={ROUTE_ROLES.notifications}>
                <Notifications />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute roles={ROUTE_ROLES.users}>
                <Users />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/departments" 
            element={
              <ProtectedRoute roles={['admin']}>
                <Departments />
              </ProtectedRoute>
            } 
          />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;

