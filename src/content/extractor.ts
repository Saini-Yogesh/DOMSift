import { HeadingNode, LinkNode, SectionNode, SectionType, HeadingSource, LinkSource } from '../types';
import { resolveUrl } from '../utils/url';
import { deduplicateHeadings, deduplicateLinks, deduplicateText } from '../utils/deduplication';

let idCounter = 0;
function generateNodeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Checks if a DOM element should be excluded from text/heading extraction (scripts, styles, hidden containers).
 */
export function isIgnoredElement(el: Element): boolean {
  const tagName = el.tagName.toLowerCase();
  if (['script', 'style', 'noscript', 'template', 'svg', 'iframe', 'canvas', 'object'].includes(tagName)) {
    return true;
  }

  if (el.getAttribute('aria-hidden') === 'true') {
    return true;
  }

  // Check computed style if available (in browser runtime)
  if (typeof window !== 'undefined' && window.getComputedStyle) {
    try {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') {
        return true;
      }
    } catch {
      if (el instanceof HTMLElement && (el.style.display === 'none' || el.style.visibility === 'hidden')) {
        return true;
      }
    }
  } else if (el instanceof HTMLElement) {
    if (el.style.display === 'none' || el.style.visibility === 'hidden') {
      return true;
    }
  }

  return false;
}

/**
 * Extracts visible direct text from an element while ignoring scripts/styles.
 */
export function extractCleanText(el: Element): string {
  if (isIgnoredElement(el)) return '';

  const clone = el.cloneNode(true) as Element;
  const noiseElements = clone.querySelectorAll('script, style, noscript, svg, template');
  noiseElements.forEach((noise) => noise.remove());

  return (clone.textContent || '')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface ExtractedContent {
  headings: HeadingNode[];
  links: LinkNode[];
  sections: SectionNode[];
  allParagraphs: string[];
}

/**
 * Core semantic DOM extraction function.
 */
export function extractSemanticContent(
  root: Document | Element,
  baseUrl: string,
  source: HeadingSource & LinkSource = 'initial'
): ExtractedContent {
  const headings: HeadingNode[] = [];
  const links: LinkNode[] = [];
  const allParagraphs: string[] = [];

  // 1. Build hierarchical sections tree matching DOM structure
  const sections = buildSectionHierarchy(root, baseUrl, source);

  // 2. Flatten headings, links, and paragraphs for high-level summaries
  flattenSectionContent(sections[0], headings, links, allParagraphs);

  const deduplicatedHeadings = deduplicateHeadings(headings);
  const deduplicatedLinks = deduplicateLinks(links);
  const deduplicatedTexts = deduplicateText(allParagraphs);

  return {
    headings: deduplicatedHeadings,
    links: deduplicatedLinks,
    sections,
    allParagraphs: deduplicatedTexts
  };
}

/**
 * Traverses DOM tree in document order to build nested SectionNode hierarchy with parent-child heading relationships,
 * nesting subheadings, text paragraphs, and links directly under their parent headings.
 */
function buildSectionHierarchy(
  root: Document | Element,
  baseUrl: string,
  source: HeadingSource & LinkSource
): SectionNode[] {
  const rootNode: SectionNode = {
    id: generateNodeId('sec-root'),
    type: 'page',
    heading: root instanceof Document ? (root.title || 'Page Content') : 'Extracted Region',
    level: 0,
    children: [],
    text: [],
    links: []
  };

  const stack: SectionNode[] = [rootNode];
  let orderCounter = 0;

  // Query all relevant content elements in document order
  const selector = 'h1, h2, h3, h4, h5, h6, [role="heading"], p, li, figcaption, blockquote, dt, dd, a[href], nav, header, footer, section, article, aside';
  const elements = Array.from(root.querySelectorAll(selector));

  const processedLinks = new Set<Element>();
  const processedTexts = new Set<Element>();

  elements.forEach((el) => {
    if (isIgnoredElement(el)) return;

    const tagName = el.tagName.toLowerCase();
    const role = el.getAttribute('role');

    // 1. Heading element (h1-h6 or role="heading")
    if (tagName.match(/^h[1-6]$/) || role === 'heading') {
      const text = extractCleanText(el);
      if (!text) return;

      let level = 2;
      if (tagName.match(/^h[1-6]$/)) {
        level = parseInt(tagName.substring(1), 10);
      } else {
        const ariaLevel = el.getAttribute('aria-level');
        if (ariaLevel) level = parseInt(ariaLevel, 10);
      }

      orderCounter += 1;

      // Determine parent landmark container type if available
      const container = el.closest('nav, footer, header, aside, main, article, section');
      let sectionType: SectionType = 'section';
      if (container) {
        const tag = container.tagName.toLowerCase();
        if (tag === 'nav') sectionType = 'navigation';
        else if (tag === 'footer') sectionType = 'footer';
        else if (tag === 'header') sectionType = 'header';
        else if (tag === 'aside') sectionType = 'aside';
      }

      const newSection: SectionNode = {
        id: generateNodeId('sec'),
        type: sectionType,
        heading: text,
        level,
        children: [],
        text: [],
        links: []
      };

      // Pop stack until parent section has a lower level than current heading
      while (stack.length > 1 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      const parentSection = stack[stack.length - 1];
      parentSection.children.push(newSection);
      stack.push(newSection);
      return;
    }

    // 2. Link element (a[href])
    if (tagName === 'a' && el.hasAttribute('href')) {
      if (processedLinks.has(el)) return;
      processedLinks.add(el);

      const href = el.getAttribute('href') || '';
      const text = extractCleanText(el) || el.getAttribute('aria-label') || el.getAttribute('title') || href;
      if (!text || href.startsWith('javascript:')) return;

      const currentSection = stack[stack.length - 1];
      const linkNode: LinkNode = {
        id: generateNodeId('link'),
        text,
        href: resolveUrl(href, baseUrl),
        originalHref: href,
        source,
        context: currentSection.heading !== rootNode.heading ? currentSection.heading : undefined
      };

      currentSection.links.push(linkNode);
      return;
    }

    // 3. Text containers (p, li, blockquote, dt, dd, etc.)
    if (['p', 'li', 'figcaption', 'blockquote', 'dt', 'dd'].includes(tagName)) {
      if (processedTexts.has(el)) return;
      processedTexts.add(el);

      // Do not add container text if it has child heading or paragraph elements that will be processed individually
      if (el.querySelector('h1, h2, h3, h4, h5, h6, p')) return;

      const text = extractCleanText(el);
      if (text && text.length > 3) {
        const currentSection = stack[stack.length - 1];
        currentSection.text.push(text);
      }
      return;
    }
  });

  // Clean and deduplicate text/links inside each section node
  cleanSectionNode(rootNode);

  return [rootNode];
}

/**
 * Recursively cleans and deduplicates text & links within section nodes.
 */
function cleanSectionNode(node: SectionNode) {
  node.text = deduplicateText(node.text);
  node.links = deduplicateLinks(node.links);
  node.children.forEach(cleanSectionNode);
}

/**
 * Flattens nested SectionNode tree into flat lists of headings, links, and text.
 */
function flattenSectionContent(
  node: SectionNode,
  headings: HeadingNode[],
  links: LinkNode[],
  allParagraphs: string[],
  orderRef: { count: number } = { count: 0 }
) {
  if (node.heading && node.level > 0) {
    orderRef.count += 1;
    headings.push({
      id: node.id,
      level: node.level,
      text: node.heading,
      source: 'initial',
      order: orderRef.count
    });
  }

  if (node.text) {
    allParagraphs.push(...node.text);
  }

  if (node.links) {
    links.push(...node.links);
  }

  if (node.children) {
    node.children.forEach((child) => flattenSectionContent(child, headings, links, allParagraphs, orderRef));
  }
}
