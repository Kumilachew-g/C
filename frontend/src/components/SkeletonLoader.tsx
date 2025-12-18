interface SkeletonLoaderProps {
  lines?: number;
  className?: string;
}

export const SkeletonCard = ({ className = '' }: { className?: string }) => (
  <div className={`bg-slate-900/60 border border-slate-800 rounded-xl p-5 animate-pulse ${className}`}>
    <div className="h-6 bg-slate-700 rounded w-3/4 mb-3"></div>
    <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
    <div className="h-4 bg-slate-700 rounded w-5/6"></div>
  </div>
);

export const SkeletonText = ({ lines = 1, className = '' }: SkeletonLoaderProps) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`h-4 bg-slate-700 rounded animate-pulse ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
      />
    ))}
  </div>
);

// Default export for convenience
const SkeletonLoader = {
  Card: SkeletonCard,
  Text: SkeletonText,
};

export default SkeletonLoader;

