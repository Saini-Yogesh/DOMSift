import React from 'react';
import { X, Save, Sliders } from 'lucide-react';
import { ScrapeOptions } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: ScrapeOptions;
  onSaveOptions: (newOptions: ScrapeOptions) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  options,
  onSaveOptions
}) => {
  const [localOptions, setLocalOptions] = React.useState<ScrapeOptions>(options);

  React.useEffect(() => {
    setLocalOptions(options);
  }, [options]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveOptions(localOptions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-[380px] p-4 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100">Extraction Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs text-slate-300">
          {/* Max Interactions */}
          <div className="space-y-1">
            <div className="flex justify-between font-medium">
              <span>Max Interactive Elements</span>
              <span className="font-mono text-cyan-400 font-semibold">{localOptions.maxInteractions}</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={localOptions.maxInteractions}
              onChange={(e) => setLocalOptions({ ...localOptions, maxInteractions: parseInt(e.target.value, 10) })}
              className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Limits automatic accordion & dropdown expansions per page.</p>
          </div>

          {/* Wait time per interaction */}
          <div className="space-y-1">
            <div className="flex justify-between font-medium">
              <span>Wait Time per Interaction (ms)</span>
              <span className="font-mono text-cyan-400 font-semibold">{localOptions.maxWaitMs}ms</span>
            </div>
            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              value={localOptions.maxWaitMs}
              onChange={(e) => setLocalOptions({ ...localOptions, maxWaitMs: parseInt(e.target.value, 10) })}
              className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Wait duration for dynamic DOM rendering after clicking expandable controls.</p>
          </div>

          {/* Restore Page State */}
          <div className="flex items-center justify-between py-1 border-t border-b border-slate-800/80">
            <div>
              <span className="font-medium text-slate-200">Restore Page State</span>
              <p className="text-[10px] text-slate-500">Re-collapse expanded dropdowns after extraction completes.</p>
            </div>
            <input
              type="checkbox"
              checked={localOptions.restoreState}
              onChange={(e) => setLocalOptions({ ...localOptions, restoreState: e.target.checked })}
              className="w-4 h-4 accent-cyan-500 rounded bg-slate-800 border-slate-700 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center space-x-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
