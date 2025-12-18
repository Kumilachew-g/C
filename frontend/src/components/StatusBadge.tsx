import { ReactNode } from 'react';

type Props = {
  status: string;
  children?: ReactNode;
};

const StatusBadge = ({ status, children }: Props) => {
  const label = children ?? status;
  let classes =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border';

  switch (status) {
    case 'scheduled':
    case 'approved':
    case 'active':
      classes += ' border-emerald-500 bg-emerald-500/10 text-emerald-200';
      break;
    case 'completed':
      classes += ' border-sky-500 bg-sky-500/10 text-sky-200';
      break;
    case 'cancelled':
    case 'disabled':
      classes += ' border-rose-500 bg-rose-500/10 text-rose-200';
      break;
    case 'draft':
    default:
      classes += ' border-slate-600 bg-slate-700/40 text-slate-200';
      break;
  }

  return <span className={classes}>{label}</span>;
};

export default StatusBadge;


