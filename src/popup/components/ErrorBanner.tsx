import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

interface ErrorBannerProps {
  error: string | null;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ error }) => {
  if (!error) return null;

  const isRestrictedPage =
    error.includes('chrome://') ||
    error.includes('chrome-extension://') ||
    error.includes('Chrome Web Store') ||
    error.includes('Cannot access a chrome:// URL');

  return (
    <div className="m-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs space-y-1.5 text-rose-300">
      <div className="flex items-center space-x-2 font-semibold">
        {isRestrictedPage ? (
          <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
        )}
        <span>{isRestrictedPage ? 'Restricted Browser Page' : 'Extraction Error'}</span>
      </div>

      <p className="text-[11px] leading-relaxed text-rose-200/90">
        {isRestrictedPage
          ? 'Chrome extensions cannot access internal chrome:// pages, settings, or Chrome Web Store pages for security reasons. Please open standard webpage to use DOMSift.'
          : error}
      </p>
    </div>
  );
};
