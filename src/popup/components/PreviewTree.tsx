import React, { useState } from 'react';
import { Search, ChevronRight, ChevronDown, Link as LinkIcon, Sparkles, Folder, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { ScrapeResult, SectionNode } from '../../types';

interface PreviewTreeProps {
  result: ScrapeResult | null;
  isLoading: boolean;
}

type TabType = 'tree' | 'headings' | 'links' | 'interactions' | 'warnings';

export const PreviewTree: React.FC<PreviewTreeProps> = ({ result, isLoading }) => {
  const [activeTab, setActiveTab] = useState<TabType>('tree');
  const [filterText, setFilterText] = useState('');
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-medium animate-pulse">
          Analyzing DOM semantics & interactive components...
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400">
          <Sparkles className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Ready to Extract</h3>
          <p className="text-xs text-slate-400 max-w-[260px] mt-1">
            Click <span className="text-blue-400 font-medium">Extract Semantic DOM Structure</span> to capture headings, links, and auto-discover interactive accordions.
          </p>
        </div>
      </div>
    );
  }

  const toggleNode = (id: string) => {
    setCollapsedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const matchesFilter = (text: string) => {
    if (!filterText) return true;
    return text.toLowerCase().includes(filterText.toLowerCase());
  };

  const filteredHeadings = result.headings.filter((h) => matchesFilter(h.text));
  const filteredLinks = result.links.filter((l) => matchesFilter(l.text) || matchesFilter(l.href));

  // Recursive Section Node Renderer
  const renderSectionNode = (section: SectionNode, depth: number = 0) => {
    const isCollapsed = collapsedNodes[section.id];
    const hasChildren = (section.children && section.children.length > 0) || (section.text && section.text.length > 0) || (section.links && section.links.length > 0);

    return (
      <div key={section.id} className="text-xs select-text">
        <div
          onClick={() => hasChildren && toggleNode(section.id)}
          className={`flex items-center space-x-1.5 py-1.5 px-2 rounded-md hover:bg-slate-800/60 cursor-pointer transition-colors ${
            depth === 0 ? 'bg-slate-800/40 font-semibold text-slate-200' : 'text-slate-300'
          }`}
          style={{ paddingLeft: `${Math.max(depth * 12 + 8, 8)}px` }}
        >
          {hasChildren ? (
            isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            )
          ) : (
            <div className="w-3.5 h-3.5" />
          )}

          <Folder className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
          <span className="truncate flex-1">
            {section.heading || section.type.toUpperCase()}
          </span>

          <span className="text-[10px] text-slate-500 font-mono">
            lvl {section.level}
          </span>
        </div>

        {!isCollapsed && hasChildren && (
          <div className="space-y-1 my-0.5">
            {/* Direct Paragraphs */}
            {section.text && section.text.map((txt, idx) => (
              matchesFilter(txt) && (
                <div
                  key={idx}
                  className="flex items-start space-x-1.5 py-1 px-2 text-slate-400 hover:text-slate-300"
                  style={{ paddingLeft: `${(depth + 1) * 12 + 20}px` }}
                >
                  <FileText className="w-3 h-3 text-slate-500 mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed line-clamp-2">{txt}</span>
                </div>
              )
            ))}

            {/* Direct Links */}
            {section.links && section.links.map((link) => (
              matchesFilter(link.text) && (
                <div
                  key={link.id}
                  className="flex items-center space-x-1.5 py-1 px-2 text-cyan-400/90 hover:underline"
                  style={{ paddingLeft: `${(depth + 1) * 12 + 20}px` }}
                >
                  <LinkIcon className="w-3 h-3 text-cyan-500 flex-shrink-0" />
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className="truncate">
                    {link.text}
                  </a>
                  {link.source === 'expanded' && (
                    <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1 py-0.5 rounded border border-amber-500/20">
                      Expanded
                    </span>
                  )}
                </div>
              )
            ))}

            {/* Children Sections */}
            {section.children && section.children.map((child) => renderSectionNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-900">
      {/* Navigation Tabs & Search */}
      <div className="px-3 pt-2 pb-1.5 bg-slate-950/60 border-b border-slate-800 space-y-2">
        <div className="flex space-x-1 border-b border-slate-800/80 pb-1">
          <button
            onClick={() => setActiveTab('tree')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              activeTab === 'tree' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tree Hierarchy
          </button>
          <button
            onClick={() => setActiveTab('headings')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              activeTab === 'headings' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Headings ({result.headings.length})
          </button>
          <button
            onClick={() => setActiveTab('links')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              activeTab === 'links' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Links ({result.links.length})
          </button>
          <button
            onClick={() => setActiveTab('interactions')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
              activeTab === 'interactions' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Expanded ({result.interactions.length})
          </button>

          {result.warnings && result.warnings.length > 0 && (
            <button
              onClick={() => setActiveTab('warnings')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                activeTab === 'warnings' ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Warnings ({result.warnings.length})
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            placeholder="Search headings, text, or links..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/60 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Tab Content Display */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 select-text">
        {activeTab === 'tree' && (
          <div className="space-y-1">
            {result.sections && result.sections.map((sec) => renderSectionNode(sec, 0))}
          </div>
        )}

        {activeTab === 'headings' && (
          <div className="space-y-1.5">
            {filteredHeadings.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No matching headings found.</p>
            ) : (
              filteredHeadings.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs hover:border-slate-700/80"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                      H{h.level}
                    </span>
                    <span className="text-slate-200 truncate">{h.text}</span>
                  </div>
                  {h.source === 'expanded' && (
                    <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 flex-shrink-0">
                      Expanded
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'links' && (
          <div className="space-y-1.5">
            {filteredLinks.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No matching links found.</p>
            ) : (
              filteredLinks.map((l) => (
                <div
                  key={l.id}
                  className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs space-y-0.5 hover:border-slate-700/80"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 truncate">{l.text}</span>
                    {l.source === 'expanded' && (
                      <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">
                        Expanded
                      </span>
                    )}
                  </div>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cyan-400/90 truncate block hover:underline"
                  >
                    {l.href}
                  </a>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'interactions' && (
          <div className="space-y-1.5">
            {result.interactions.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No expandable elements detected on this page.</p>
            ) : (
              result.interactions.map((inter) => (
                <div
                  key={inter.id}
                  className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      {inter.action === 'restored' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span className="font-medium text-slate-200 truncate">{inter.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{inter.elementType}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span className="font-mono text-slate-500">{inter.selector}</span>
                    <span className="text-cyan-400 font-medium">+{inter.contentExtractedCount} items</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'warnings' && (
          <div className="space-y-1.5">
            {(!result.warnings || result.warnings.length === 0) ? (
              <p className="text-xs text-slate-500 text-center py-4">No warnings reported.</p>
            ) : (
              result.warnings.map((warning, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start space-x-2 leading-relaxed"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{warning}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
