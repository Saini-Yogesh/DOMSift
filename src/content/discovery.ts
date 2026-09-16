import { InteractionRecord, ScrapeOptions, HeadingNode, LinkNode, SectionNode } from '../types';
import { extractSemanticContent, extractCleanText, isIgnoredElement } from './extractor';
import { deduplicateHeadings, deduplicateLinks, mergeSectionTrees } from '../utils/deduplication';

interface RestorableElement {
  element: Element;
  originalAriaExpanded: string | null;
  originalOpen: boolean | null;
  originalStyleDisplay: string;
}

const DANGEROUS_LABEL_REGEX = /\b(submit|pay|payment|buy|checkout|purchase|delete|remove|destroy|erase|login|logout|sign\s*in|sign\s*out|download|clear|cart|checkout)\b/i;

/**
 * Checks if an interactive element is safe to click automatically.
 */
export function isSafeInteraction(el: Element): boolean {
  if (isIgnoredElement(el)) return false;

  const tagName = el.tagName.toLowerCase();

  // Never click form submit or reset controls
  if (tagName === 'input') {
    const type = (el as HTMLInputElement).type.toLowerCase();
    if (['submit', 'reset', 'file', 'password'].includes(type)) return false;
  }

  if (el.getAttribute('type') === 'submit') return false;

  // Never click standard navigation links with external or page-changing hrefs
  if (tagName === 'a') {
    const href = el.getAttribute('href');
    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      return false;
    }
  }

  // Check element text label, aria-label, title against dangerous operations
  const labelText = (
    el.getAttribute('aria-label') ||
    el.getAttribute('title') ||
    extractCleanText(el)
  ).trim();

  if (DANGEROUS_LABEL_REGEX.test(labelText)) {
    return false;
  }

  // Check form parentage
  if (el.closest('form') && (tagName === 'button' || el.getAttribute('type') === 'submit')) {
    if (!el.hasAttribute('aria-expanded') && !el.hasAttribute('data-toggle') && !el.hasAttribute('data-bs-toggle')) {
      return false;
    }
  }

  return true;
}

/**
 * Discovers candidate interactive elements in the DOM across native HTML5, ARIA,
 * Radix UI / Shadcn UI, Bootstrap, MUI, and custom card accordions.
 */
export function discoverCandidates(root: Document | Element): Element[] {
  const candidates: Element[] = [];

  // 1. Native <details> without open attribute
  const closedDetails = Array.from(root.querySelectorAll('details:not([open]) summary'));
  candidates.push(...closedDetails);

  // 2. Elements with aria-expanded="false"
  const ariaExpandedFalse = Array.from(root.querySelectorAll('[aria-expanded="false"]'));
  candidates.push(...ariaExpandedFalse);

  // 3. Radix UI / Shadcn UI accordions with data-state="closed"
  const radixClosed = Array.from(root.querySelectorAll('[data-state="closed"]'));
  candidates.push(...radixClosed);

  // 4. Tab headers that are currently unselected
  const unselectedTabs = Array.from(root.querySelectorAll('[role="tab"][aria-selected="false"]'));
  candidates.push(...unselectedTabs);

  // 5. Common framework/accordion toggle patterns
  const collapsibleSelectors = [
    '.accordion-header',
    '.accordion-button',
    '.accordion-toggle',
    '[data-toggle="collapse"]',
    '[data-bs-toggle="collapse"]',
    '.collapsible-header',
    '.menu-toggle',
    '.dropdown-toggle',
    '.MuiAccordionSummary-root',
    '.chakra-accordion__button'
  ];

  collapsibleSelectors.forEach((sel) => {
    const matched = Array.from(root.querySelectorAll(sel));
    candidates.push(...matched);
  });

  // 6. Custom cards / learning modules with clickable chevrons or dropdown icons
  const SVG_CHEVRON_SELECTOR = 'svg[class*="chevron"], svg[class*="arrow"], svg[class*="caret"], svg[class*="rotate"], path[d*="m6 9"], path[d*="M19 9"], path[d*="m19 9"]';
  const chevrons = Array.from(root.querySelectorAll(SVG_CHEVRON_SELECTOR));
  chevrons.forEach((svg) => {
    const clickableParent = svg.closest('button, [role="button"], summary, [tabindex], .accordion-header, .accordion-button') || svg.parentElement;
    if (clickableParent && !candidates.includes(clickableParent)) {
      candidates.push(clickableParent);
    }
  });

  // Filter candidates for uniqueness, safety, and non-expanded status
  const uniqueCandidates = Array.from(new Set(candidates)).filter((el) => {
    if (!isSafeInteraction(el)) return false;
    if (el.getAttribute('aria-expanded') === 'true' || el.getAttribute('data-state') === 'open') {
      return false;
    }
    return true;
  });

  return uniqueCandidates;
}

/**
 * Builds a CSS selector or descriptor for an element for logging/interaction records.
 */
function buildElementSelector(el: Element): string {
  if (el.id) return `#${el.id}`;

  const tagName = el.tagName.toLowerCase();
  const className = el.className && typeof el.className === 'string'
    ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
    : '';

  return `${tagName}${className}`;
}

/**
 * Triggers a complete click event chain (pointerdown, mousedown, mouseup, click)
 * to ensure modern UI frameworks (React, Radix UI, Vue) register the interaction.
 */
function triggerElementClick(el: HTMLElement) {
  try {
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    el.click();
  } catch {
    el.click();
  }
}

/**
 * Waits for DOM mutations or a short timeout after triggering an element interaction.
 */
function waitForDomMutation(targetContainer: Element, maxWaitMs: number): Promise<void> {
  return new Promise((resolve) => {
    let resolved = false;

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        observer.disconnect();
        clearTimeout(timer);
        resolve();
      }
    };

    const observer = new MutationObserver(() => {
      cleanup();
    });

    observer.observe(targetContainer, {
      childList: true,
      subtree: true,
      attributes: true
    });

    const timer = setTimeout(cleanup, maxWaitMs);
  });
}

export interface InteractiveExtractionResult {
  newHeadings: HeadingNode[];
  newLinks: LinkNode[];
  newSections: SectionNode[];
  interactions: InteractionRecord[];
  warnings: string[];
}

/**
 * Automatically discovers, expands, captures new content from safe interactive elements,
 * and restores original DOM state if requested.
 */
export async function expandAndExtractInteractiveElements(
  root: Document | Element,
  baseUrl: string,
  options: ScrapeOptions,
  onProgress?: (processed: number, total: number) => void
): Promise<InteractiveExtractionResult> {
  const candidates = discoverCandidates(root).slice(0, options.maxInteractions || 30);
  const interactions: InteractionRecord[] = [];
  const newHeadings: HeadingNode[] = [];
  const newLinks: LinkNode[] = [];
  let newSections: SectionNode[] = [];
  const warnings: string[] = [];

  const restorableList: RestorableElement[] = [];

  for (let i = 0; i < candidates.length; i += 1) {
    const el = candidates[i];
    const selector = buildElementSelector(el);
    const label = extractCleanText(el) || el.getAttribute('aria-label') || selector;
    const elementType = el.tagName.toLowerCase();
    const interactionId = `inter-${i + 1}`;

    // Store original state
    const parentDetails = el.closest('details');
    const restorable: RestorableElement = {
      element: el,
      originalAriaExpanded: el.getAttribute('aria-expanded'),
      originalOpen: parentDetails ? parentDetails.open : null,
      originalStyleDisplay: (el as HTMLElement).style ? (el as HTMLElement).style.display : ''
    };
    restorableList.push(restorable);

    let expandedSuccess = false;
    let newlyCapturedCount = 0;

    try {
      // 1. Trigger interaction
      if (parentDetails && el.tagName.toLowerCase() === 'summary') {
        parentDetails.open = true;
        expandedSuccess = true;
      } else if (el instanceof HTMLElement) {
        triggerElementClick(el);
        expandedSuccess = true;
      }

      if (expandedSuccess) {
        // Wait for dynamic animation or rendering in document body
        const bodyToObserve = root instanceof Document ? root.body : (root.ownerDocument?.body || root);
        await waitForDomMutation(bodyToObserve, options.maxWaitMs || 250);

        // Extract semantic content revealed across document
        const extracted = extractSemanticContent(root, baseUrl, 'expanded');
        newHeadings.push(...extracted.headings);
        newLinks.push(...extracted.links);
        newSections = mergeSectionTrees(newSections, extracted.sections);

        newlyCapturedCount = extracted.headings.length + extracted.links.length;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      warnings.push(`Interaction failed on [${selector}]: ${msg}`);
    }

    interactions.push({
      id: interactionId,
      selector,
      label: label.slice(0, 50),
      elementType,
      action: expandedSuccess ? 'expanded' : 'failed',
      timestamp: new Date().toISOString(),
      contentExtractedCount: newlyCapturedCount,
      restoredSuccessfully: false
    });

    if (onProgress) {
      onProgress(i + 1, candidates.length);
    }
  }

  // Restoration Phase: Close any dropdowns that were expanded during processing
  if (options.restoreState) {
    for (let idx = restorableList.length - 1; idx >= 0; idx--) {
      const item = restorableList[idx];
      try {
        if (item.originalOpen !== null) {
          const parentDetails = item.element.closest('details');
          if (parentDetails) parentDetails.open = item.originalOpen;
        } else if (item.element instanceof HTMLElement) {
          const nowExpanded =
            item.element.getAttribute('aria-expanded') === 'true' ||
            item.element.getAttribute('data-state') === 'open' ||
            item.element.classList.contains('active') ||
            item.element.classList.contains('open');

          if (item.originalAriaExpanded === 'false' && nowExpanded) {
            triggerElementClick(item.element);
          }
        }

        if (item.originalAriaExpanded !== null) {
          item.element.setAttribute('aria-expanded', item.originalAriaExpanded);
        }

        if (interactions[idx]) {
          interactions[idx].restoredSuccessfully = true;
          interactions[idx].action = 'restored';
        }
      } catch {
        warnings.push(`Could not restore state for interacted element [${buildElementSelector(item.element)}]`);
      }
    }
  }

  return {
    newHeadings: deduplicateHeadings(newHeadings),
    newLinks: deduplicateLinks(newLinks),
    newSections,
    interactions,
    warnings
  };
}
