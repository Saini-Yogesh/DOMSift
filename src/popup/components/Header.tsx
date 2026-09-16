import React from 'react';
import { Layers, Settings, Globe } from 'lucide-react';

interface HeaderProps {
  currentTabUrl: string;
  currentTabTitle: string;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTabUrl,
  currentTabTitle,
  onOpenSettings
}) => {
  const getDomainName = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch {
      return 'Webpage';
    }
  };

  return (
    <header className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-md shadow-blue-500/20 flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <h1 className="text-sm font-bold text-slate-100 tracking-tight">DOMSift</h1>
            <span className="text-[10px] font-medium bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
              v1.0
            </span>
          </div>
          <div className="flex items-center space-x-1 text-[11px] text-slate-400 truncate max-w-[220px]">
            <Globe className="w-3 h-3 text-slate-500 flex-shrink-0" />
            <span className="truncate" title={currentTabTitle || currentTabUrl}>
              {getDomainName(currentTabUrl)}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onOpenSettings}
        className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
        title="Extraction Settings"
      >
        <Settings className="w-4 h-4" />
      </button>
    </header>
  );
};
