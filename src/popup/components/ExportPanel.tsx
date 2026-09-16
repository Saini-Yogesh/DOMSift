import React, { useState } from 'react';
import { Copy, Check, FileJson, FileCode, Layers } from 'lucide-react';
import { ScrapeResult } from '../../types';
import { serializeToJson } from '../../utils/jsonSerializer';
import { serializeToXml } from '../../utils/xmlSerializer';
import { generateExportFilename } from '../../utils/filename';

interface ExportPanelProps {
  result: ScrapeResult | null;
  onDownloadFile: (content: string, filename: string, mimeType: string) => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ result, onDownloadFile }) => {
  const [copiedFormat, setCopiedFormat] = useState<'json' | 'xml' | null>(null);

  if (!result) return null;

  const jsonFilename = generateExportFilename(result.metadata.title || result.metadata.hostname, 'json');
  const xmlFilename = generateExportFilename(result.metadata.title || result.metadata.hostname, 'xml');

  const handleCopy = (format: 'json' | 'xml') => {
    const text = format === 'json' ? serializeToJson(result) : serializeToXml(result);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);
    });
  };

  const handleDownloadJson = () => {
    const jsonStr = serializeToJson(result);
    onDownloadFile(jsonStr, jsonFilename, 'application/json');
  };

  const handleDownloadXml = () => {
    const xmlStr = serializeToXml(result);
    onDownloadFile(xmlStr, xmlFilename, 'application/xml');
  };

  const handleDownloadBoth = () => {
    handleDownloadJson();
    setTimeout(() => {
      handleDownloadXml();
    }, 300);
  };

  return (
    <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2.5">
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span className="font-mono truncate max-w-[240px]" title={jsonFilename}>
          Export: <span className="text-slate-200">{jsonFilename}</span>
        </span>
        <button
          onClick={handleDownloadBoth}
          className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1"
        >
          <Layers className="w-3 h-3" />
          <span>Download Both</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* JSON Actions */}
        <div className="flex space-x-1">
          <button
            onClick={handleDownloadJson}
            className="flex-1 py-1.5 px-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
          >
            <FileJson className="w-3.5 h-3.5 text-blue-400" />
            <span>Download JSON</span>
          </button>
          <button
            onClick={() => handleCopy('json')}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
            title="Copy JSON to clipboard"
          >
            {copiedFormat === 'json' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        </div>

        {/* XML Actions */}
        <div className="flex space-x-1">
          <button
            onClick={handleDownloadXml}
            className="flex-1 py-1.5 px-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            <span>Download XML</span>
          </button>
          <button
            onClick={() => handleCopy('xml')}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
            title="Copy XML to clipboard"
          >
            {copiedFormat === 'xml' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
