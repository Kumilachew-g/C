import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { Role } from "../types";
import { getHomePath } from "../utils/permissions";

type Props = {
  roles?: Role[];
  children?: React.ReactNode;
};

const ProtectedRoute = ({ roles, children }: Props) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (roles && roles.length && !roles.includes(user.role)) {
    // Redirect to a safe landing the user can access
    return <Navigate to={getHomePath(user.role)} replace />;
  }
  
  // If children are provided, render them (for wrapper usage)
  if (children) {
    return <>{children}</>;
  }
  
  // Otherwise, use Outlet for nested routes
  return <Outlet />;
};

export default ProtectedRoute;
