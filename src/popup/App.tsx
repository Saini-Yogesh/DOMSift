import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { PreviewTree } from './components/PreviewTree';
import { ExportPanel } from './components/ExportPanel';
import { SettingsModal } from './components/SettingsModal';
import { ErrorBanner } from './components/ErrorBanner';
import {
  ScrapeResult,
  ScrapeOptions,
  ExtractionProgress,
  ExtensionMessage
} from '../types';

const DEFAULT_OPTIONS: ScrapeOptions = {
  maxDepth: 3,
  maxInteractions: 30,
  maxWaitMs: 250,
  restoreState: true,
  includeMetadata: true,
  includeWarnings: true
};

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<{ id?: number; title: string; url: string }>({
    title: 'Loading tab...',
    url: ''
  });

  const [options, setOptions] = useState<ScrapeOptions>(DEFAULT_OPTIONS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [progress, setProgress] = useState<ExtractionProgress>({
    status: 'idle',
    step: 'Ready to extract',
    progressPercent: 0,
    headingsFound: 0,
    linksFound: 0,
    interactionsProcessed: 0,
    warningsCount: 0
  });

  // Query active Chrome tab & load stored options
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          setCurrentTab({
            id: tabs[0].id,
            title: tabs[0].title || 'Untitled Page',
            url: tabs[0].url || ''
          });
        }
      });
    }

    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['domsift_options'], (res) => {
        if (res.domsift_options) {
          setOptions(res.domsift_options);
        }
      });
    }
  }, []);

  // Listen for progress updates sent from content script
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime) return;

    const messageListener = (msg: ExtensionMessage) => {
      if (msg.type === 'EXTRACTION_PROGRESS' && msg.progress) {
        setProgress(msg.progress);
        if (msg.progress.currentResult) {
          setResult(msg.progress.currentResult);
        }
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const saveOptions = (newOptions: ScrapeOptions) => {
    setOptions(newOptions);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ domsift_options: newOptions });
    }
  };

  const startExtraction = async () => {
    setErrorMessage(null);

    if (!currentTab.url || currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('chrome-extension://')) {
      setErrorMessage('Cannot access a chrome:// URL or restricted page.');
      return;
    }

    if (!currentTab.id) {
      setErrorMessage('No active tab found.');
      return;
    }

    setProgress({
      status: 'extracting',
      step: 'Initializing content script...',
      progressPercent: 5,
      headingsFound: 0,
      linksFound: 0,
      interactionsProcessed: 0,
      warningsCount: 0
    });

    const sendMsg = () => {
      chrome.tabs.sendMessage(
        currentTab.id!,
        { type: 'START_EXTRACTION', options },
        (response) => {
          if (chrome.runtime.lastError) {
            // Script might not be injected yet, try injecting programmatically
            chrome.scripting.executeScript(
              {
                target: { tabId: currentTab.id! },
                files: ['content/index.js']
              },
              () => {
                if (chrome.runtime.lastError) {
                  setErrorMessage(chrome.runtime.lastError.message || 'Failed to inject content script.');
                  setProgress((prev) => ({ ...prev, status: 'failed' }));
                } else {
                  // Retry sending message after injection
                  setTimeout(() => {
                    chrome.tabs.sendMessage(currentTab.id!, { type: 'START_EXTRACTION', options }, (res) => {
                      if (res && res.result) {
                        setResult(res.result);
                      }
                    });
                  }, 150);
                }
              }
            );
          } else if (response && response.result) {
            setResult(response.result);
          }
        }
      );
    };

    sendMsg();
  };

  const cancelExtraction = () => {
    if (currentTab.id && typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.sendMessage(currentTab.id, { type: 'CANCEL_EXTRACTION' });
    }
    setProgress((prev) => ({
      ...prev,
      status: 'cancelled',
      step: 'Extraction cancelled'
    }));
  };

  const handleDownloadFile = (content: string, filename: string, mimeType: string) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'DOWNLOAD_FILE',
        downloadData: { content, filename, mimeType }
      });
    } else {
      // Fallback for standalone browser testing
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-900 overflow-hidden text-slate-100">
      <Header
        currentTabUrl={currentTab.url}
        currentTabTitle={currentTab.title}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <Controls
        progress={progress}
        onStartExtraction={startExtraction}
        onCancelExtraction={cancelExtraction}
        disabled={!currentTab.url || currentTab.url.startsWith('chrome://')}
      />

      <ErrorBanner error={errorMessage} />

      <PreviewTree
        result={result}
        isLoading={progress.status === 'extracting' || progress.status === 'expanding'}
      />

      <ExportPanel
        result={result}
        onDownloadFile={handleDownloadFile}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        options={options}
        onSaveOptions={saveOptions}
      />
    </div>
  );
};
