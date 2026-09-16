import React from 'react';
import { Play, RotateCw, XCircle, Heading, Link, Zap, AlertTriangle } from 'lucide-react';
import { ExtractionProgress } from '../../types';

interface ControlsProps {
  progress: ExtractionProgress;
  onStartExtraction: () => void;
  onCancelExtraction: () => void;
  disabled?: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  progress,
  onStartExtraction,
  onCancelExtraction,
  disabled = false
}) => {
  const isRunning = progress.status === 'extracting' || progress.status === 'expanding';
  const isCompleted = progress.status === 'completed';

  return (
    <div className="p-4 bg-slate-900/90 border-b border-slate-800 space-y-3">
      <div className="flex items-center space-x-2">
        {!isRunning ? (
          <button
            onClick={onStartExtraction}
            disabled={disabled}
            className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 shadow-lg transition-all ${
              disabled
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-600/25 active:scale-[0.99]'
            }`}
          >
            {isCompleted ? (
              <>
                <RotateCw className="w-4 h-4" />
                <span>Re-Extract Active Page</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Extract Semantic DOM Structure</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={onCancelExtraction}
            className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
          >
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>Cancel Extraction</span>
          </button>
        )}
      </div>

      {/* Progress Bar & Status message */}
      {isRunning && (
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] text-slate-300">
            <span className="truncate pr-2 font-medium">{progress.step}</span>
            <span className="font-mono text-cyan-400 font-semibold">{progress.progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 ease-out"
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Live Extraction Stats Grid */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-400 mb-0.5">
            <Heading className="w-3 h-3 text-blue-400" />
            <span>Headings</span>
          </div>
          <div className="text-sm font-bold text-slate-100 font-mono">
            {progress.headingsFound}
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-400 mb-0.5">
            <Link className="w-3 h-3 text-cyan-400" />
            <span>Links</span>
          </div>
          <div className="text-sm font-bold text-slate-100 font-mono">
            {progress.linksFound}
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-400 mb-0.5">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Expanded</span>
          </div>
          <div className="text-sm font-bold text-slate-100 font-mono">
            {progress.interactionsProcessed}
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-400 mb-0.5">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Warnings</span>
          </div>
          <div className="text-sm font-bold text-slate-100 font-mono">
            {progress.warningsCount}
          </div>
        </div>
      </div>
    </div>
  );
};
