import { ExtensionMessage, ScrapeOptions, ScrapeResult, ExtractionProgress } from '../types';
import { extractSemanticContent } from './extractor';
import { expandAndExtractInteractiveElements } from './discovery';
import { deduplicateHeadings, deduplicateLinks, mergeSectionTrees } from '../utils/deduplication';
import { extractHostname } from '../utils/url';

let activeExtractionCancelled = false;

/**
 * Sends a progress update message to the Chrome extension runtime (popup/background).
 */
function sendProgressUpdate(progress: ExtractionProgress): void {
  const msg: ExtensionMessage = {
    type: 'EXTRACTION_PROGRESS',
    progress
  };
  try {
    chrome.runtime.sendMessage(msg).catch(() => {
      // Ignored if popup is closed or port disconnected
    });
  } catch {
    // Context invalidated or runtime closed
  }
}

/**
 * Main extraction controller running inside the active webpage context.
 */
async function runExtraction(options: ScrapeOptions = {
  maxDepth: 3,
  maxInteractions: 30,
  maxWaitMs: 250,
  restoreState: true,
  includeMetadata: true,
  includeWarnings: true
}): Promise<ScrapeResult> {
  activeExtractionCancelled = false;
  const startTime = Date.now();
  const baseUrl = window.location.href;
  const warnings: string[] = [];

  // Phase 1: Initial Page DOM Extraction
  sendProgressUpdate({
    status: 'extracting',
    step: 'Scanning page DOM hierarchy...',
    progressPercent: 15,
    headingsFound: 0,
    linksFound: 0,
    interactionsProcessed: 0,
    warningsCount: 0
  });

  const initialContent = extractSemanticContent(document, baseUrl, 'initial');

  if (activeExtractionCancelled) {
    throw new Error('Extraction was cancelled by user');
  }

  sendProgressUpdate({
    status: 'expanding',
    step: 'Discovering collapsible sections & interactive elements...',
    progressPercent: 40,
    headingsFound: initialContent.headings.length,
    linksFound: initialContent.links.length,
    interactionsProcessed: 0,
    warningsCount: 0
  });

  // Phase 2: Automatic Interactive Element Expansion
  const interactiveResult = await expandAndExtractInteractiveElements(
    document,
    baseUrl,
    options,
    (processed, total) => {
      if (activeExtractionCancelled) return;
      const pct = 40 + Math.floor((processed / Math.max(total, 1)) * 50);
      sendProgressUpdate({
        status: 'expanding',
        step: `Expanding interactive element (${processed}/${total})...`,
        progressPercent: Math.min(pct, 90),
        headingsFound: initialContent.headings.length + interactiveResult.newHeadings.length,
        linksFound: initialContent.links.length + interactiveResult.newLinks.length,
        interactionsProcessed: processed,
        warningsCount: warnings.length + interactiveResult.warnings.length
      });
    }
  );

  if (activeExtractionCancelled) {
    throw new Error('Extraction was cancelled by user');
  }

  // Combine warnings
  warnings.push(...interactiveResult.warnings);

  // Phase 3: Consolidation & Deduplication
  const mergedSections = mergeSectionTrees(
    initialContent.sections,
    interactiveResult.newSections
  );

  const allHeadings = deduplicateHeadings([
    ...initialContent.headings,
    ...interactiveResult.newHeadings
  ]);

  const allLinks = deduplicateLinks([
    ...initialContent.links,
    ...interactiveResult.newLinks
  ]);

  const durationMs = Date.now() - startTime;

  const result: ScrapeResult = {
    metadata: {
      title: document.title || 'Untitled Page',
      url: window.location.href,
      hostname: extractHostname(window.location.href),
      capturedAt: new Date().toISOString(),
      extractionDurationMs: durationMs,
      extractedHeadingCount: allHeadings.length,
      extractedLinkCount: allLinks.length,
      extractedSectionCount: mergedSections.length,
      interactionCount: interactiveResult.interactions.length
    },
    headings: allHeadings,
    sections: mergedSections,
    links: allLinks,
    interactions: interactiveResult.interactions,
    warnings
  };

  if (warnings.length > 0) {
    console.group('[DOMSift Warnings]');
    warnings.forEach((w) => console.warn(w));
    console.groupEnd();
  }

  sendProgressUpdate({
    status: 'completed',
    step: 'Extraction completed successfully!',
    progressPercent: 100,
    headingsFound: allHeadings.length,
    linksFound: allLinks.length,
    interactionsProcessed: interactiveResult.interactions.length,
    warningsCount: warnings.length,
    currentResult: result
  });

  return result;
}

// Register message listener for chrome extension runtime
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === 'START_EXTRACTION') {
    runExtraction(message.options)
      .then((result) => {
        sendResponse({ type: 'EXTRACTION_COMPLETE', result });
      })
      .catch((err) => {
        const errorMsg = err instanceof Error ? err.message : String(err);
        sendProgressUpdate({
          status: 'failed',
          step: 'Extraction failed',
          progressPercent: 0,
          headingsFound: 0,
          linksFound: 0,
          interactionsProcessed: 0,
          warningsCount: 1,
          error: errorMsg
        });
        sendResponse({ type: 'EXTRACTION_ERROR', error: errorMsg });
      });

    return true; // Keep message channel open for async response
  }

  if (message.type === 'CANCEL_EXTRACTION') {
    activeExtractionCancelled = true;
    sendResponse({ type: 'EXTRACTION_PROGRESS', progress: {
      status: 'cancelled',
      step: 'Extraction cancelled',
      progressPercent: 0,
      headingsFound: 0,
      linksFound: 0,
      interactionsProcessed: 0,
      warningsCount: 0
    }});
    return false;
  }

  if (message.type === 'GET_STATUS') {
    sendResponse({ status: 'ready' });
    return false;
  }
});
