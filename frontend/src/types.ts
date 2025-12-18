export type Role = 'admin' | 'commissioner' | 'secretariat' | 'departmentUser' | 'auditor';

export type User = {
  id: string;
  email: string;
  fullName: string;
  department?: string;
  departmentId?: string;
  role: Role;
};

export type Engagement = {
  id: string;
  referenceNo?: string;
  title?: string;
  purpose?: string;
  description?: string;
  status: 'draft' | 'scheduled' | 'approved' | 'completed' | 'cancelled';
  scheduledAt?: string;
  date?: string;
  time?: string;
  commissionerId?: string;
  createdBy: string;
  createdAt: string;
  requestingUnitId?: string;
  requestingUnit?: {
    id: string;
    name: string;
  };
};

export type Notification = {
  id: string;
  userId: string;
  message: string;
  type?: string;
  metadata?: {
    engagementId?: string;
    referenceNo?: string;
    oldStatus?: string;
    newStatus?: string;
    [key: string]: any;
  };
  isRead: boolean;
  createdAt: string;
};

