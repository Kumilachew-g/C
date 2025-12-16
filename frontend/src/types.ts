export type Role = 'admin' | 'commissioner' | 'secretariat' | 'departmentUser' | 'auditor';

export type User = {
  id: string;
  email: string;
  fullName: string;
  department?: string;
  role: Role;
};

export type Engagement = {
  id: string;
  referenceNo?: string;
  title?: string;
  purpose?: string;
  description?: string;
  status: 'draft' | 'scheduled' | 'completed' | 'cancelled';
  scheduledAt?: string;
  date?: string;
  time?: string;
  commissionerId?: string;
  createdBy: string;
  createdAt: string;
};

export type Notification = {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

