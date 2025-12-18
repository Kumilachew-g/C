import { Engagement } from '../types';
import StatusBadge from './StatusBadge';

type Props = {
  engagement: Engagement;
  onStatusChange?: (status: Engagement['status']) => void;
  showActions?: boolean;
};

const EngagementCard = ({ engagement, onStatusChange, showActions }: Props) => {
  const title = engagement.title || engagement.referenceNo || 'Engagement';
  const description = engagement.description || engagement.purpose || 'No description provided.';

  const scheduledLabel =
    engagement.scheduledAt && new Date(engagement.scheduledAt).toLocaleString();

  const dateTimeLabel =
    !scheduledLabel && engagement.date
      ? `${engagement.date} ${engagement.time || ''}`.trim()
      : scheduledLabel || 'Not scheduled';

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-50">{title}</p>
          <p className="text-sm text-slate-400 line-clamp-2">{description}</p>
        </div>
        <StatusBadge status={engagement.status} />
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Scheduled: {dateTimeLabel}</span>
        {showActions && onStatusChange && (
          <div className="flex flex-wrap gap-1">
            {['draft', 'scheduled', 'approved', 'completed', 'cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => onStatusChange(s as Engagement['status'])}
                className="px-2 py-0.5 rounded border border-slate-700 hover:bg-slate-800"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EngagementCard;


