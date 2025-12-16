import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { Role } from "../types";
import { getHomePath } from "../utils/permissions";

type Props = {
  roles?: Role[];
};

const ProtectedRoute = ({ roles }: Props) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && roles.length && !roles.includes(user.role)) {
    // Redirect to a safe landing the user can access
    return <Navigate to={getHomePath(user.role)} replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
