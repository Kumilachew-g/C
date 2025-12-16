import { ButtonHTMLAttributes, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Role } from '../types';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  roles: Role[];
  children: ReactNode;
};

const RoleBasedButton = ({ roles, children, className = '', ...rest }: Props) => {
  const { user } = useAuth();
  const allowed = user && roles.includes(user.role);

  if (!allowed) return null;

  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center rounded-md border border-slate-700 bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
};

export default RoleBasedButton;


