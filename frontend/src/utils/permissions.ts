import type { Role } from '../types';

export const ROUTE_ROLES = {
  dashboard: ['admin', 'commissioner', 'secretariat', 'departmentUser', 'auditor'] as Role[],
  engagements: ['admin', 'commissioner', 'secretariat', 'departmentUser'] as Role[],
  availability: ['admin', 'commissioner', 'secretariat'] as Role[],
  reports: ['admin', 'auditor'] as Role[],
  engagementRequest: ['admin', 'secretariat', 'departmentUser'] as Role[],
  calendar: ['commissioner'] as Role[],
  notifications: ['admin', 'commissioner', 'secretariat', 'departmentUser', 'auditor'] as Role[],
  users: ['admin'] as Role[],
};

export const getHomePath = (role?: Role | null) => {
  switch (role) {
    case 'admin':
      return '/dashboard';
    case 'commissioner':
    case 'secretariat':
    case 'departmentUser':
      return '/engagements';
    case 'auditor':
      return '/reports';
    default:
      return '/dashboard';
  }
};

