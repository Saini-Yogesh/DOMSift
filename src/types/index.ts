export type HeadingSource = 'initial' | 'expanded';
export type LinkSource = 'initial' | 'expanded';
export type SectionType = 'page' | 'section' | 'navigation' | 'content' | 'footer' | 'aside' | 'header';

export interface HeadingNode {
  id: string;
  level: number;
  text: string;
  source: HeadingSource;
  order: number;
  context?: string;
}

export interface LinkNode {
  id: string;
  text: string;
  href: string;
  originalHref: string;
  source: LinkSource;
  context?: string;
}

export interface SectionNode {
  id: string;
  type: SectionType;
  heading?: string;
  level: number;
  children: SectionNode[];
  text: string[];
  links: LinkNode[];
}

export interface InteractionRecord {
  id: string;
  selector: string;
  label: string;
  elementType: string;
  action: 'expanded' | 'restored' | 'failed';
  timestamp: string;
  contentExtractedCount: number;
  restoredSuccessfully: boolean;
}

export interface ScrapeMetadata {
  title: string;
  url: string;
  hostname: string;
  capturedAt: string;
  extractionDurationMs: number;
  extractedHeadingCount: number;
  extractedLinkCount: number;
  extractedSectionCount: number;
  interactionCount: number;
}

export interface ScrapeResult {
  metadata: ScrapeMetadata;
  headings: HeadingNode[];
  sections: SectionNode[];
  links: LinkNode[];
  interactions: InteractionRecord[];
  warnings: string[];
}

export interface ScrapeOptions {
  maxDepth: number;
  maxInteractions: number;
  maxWaitMs: number;
  restoreState: boolean;
  includeMetadata: boolean;
  includeWarnings: boolean;
}

export type ExtractionStatus = 'idle' | 'extracting' | 'expanding' | 'completed' | 'failed' | 'cancelled';

export interface ExtractionProgress {
  status: ExtractionStatus;
  step: string;
  progressPercent: number;
  headingsFound: number;
  linksFound: number;
  interactionsProcessed: number;
  warningsCount: number;
  currentResult?: ScrapeResult;
  error?: string;
}

export type MessageType =
  | 'START_EXTRACTION'
  | 'CANCEL_EXTRACTION'
  | 'EXTRACTION_PROGRESS'
  | 'EXTRACTION_COMPLETE'
  | 'EXTRACTION_ERROR'
  | 'GET_STATUS'
  | 'DOWNLOAD_FILE';

export interface ExtensionMessage {
  type: MessageType;
  options?: ScrapeOptions;
  progress?: ExtractionProgress;
  result?: ScrapeResult;
  error?: string;
  downloadData?: {
    content: string;
    filename: string;
    mimeType: string;
  };
}
