import React from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const InstallPrompt: React.FC = () => {
  const { canInstall, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = React.useState(false);

  if (!canInstall || dismissed) return null;

  return (
    <div className="bg-sky-50 border border-sky-200 text-sky-900 rounded-2xl p-4 flex items-center justify-between gap-4 mb-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-sky-600 text-white rounded-xl flex items-center justify-center shrink-0">
          <Download className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold">Install News Assistant App</h4>
          <p className="text-xs text-sky-700">Add to your home screen for quick offline access and daily updates.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={promptInstall}
          className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
        >
          Install App
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 text-sky-500 hover:text-sky-800 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
