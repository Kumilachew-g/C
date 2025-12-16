import { ChangeEvent, useState } from 'react';

type Props = {
  label?: string;
  accept?: string;
  maxSizeMb?: number;
  onFileSelected: (file: File | null) => void;
};

const FileUpload = ({ label = 'Upload document', accept, maxSizeMb = 10, onFileSelected }: Props) => {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    if (!file) {
      setFileName(null);
      onFileSelected(null);
      return;
    }

    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File must be smaller than ${maxSizeMb} MB`);
      setFileName(null);
      onFileSelected(null);
      return;
    }

    setFileName(file.name);
    onFileSelected(file);
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm text-slate-300 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <label className="inline-flex items-center rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 cursor-pointer hover:bg-slate-700">
          Choose file
          <input type="file" className="hidden" accept={accept} onChange={handleChange} />
        </label>
        <span className="text-xs text-slate-400 truncate max-w-xs">
          {fileName || 'No file selected'}
        </span>
      </div>
      <p className="text-[11px] text-slate-500">Max size {maxSizeMb} MB.</p>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
};

export default FileUpload;


