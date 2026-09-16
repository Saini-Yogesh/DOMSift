import { HeadingNode, LinkNode, SectionNode } from '../types';

/**
 * Normalizes text content for collision detection.
 */
export function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Generates a stable unique hash key for a heading node.
 */
export function getHeadingKey(heading: HeadingNode): string {
  return `h${heading.level}:${normalizeText(heading.text)}`;
}

/**
 * Generates a stable unique hash key for a link node.
 */
export function getLinkKey(link: LinkNode): string {
  return `${normalizeText(link.text)}|${link.href.trim()}`;
}

/**
 * Deduplicates headings array based on level and normalized text,
 * preferring initial source over expanded source if duplicates exist.
 */
export function deduplicateHeadings(headings: HeadingNode[]): HeadingNode[] {
  const seenKeys = new Set<string>();
  const result: HeadingNode[] = [];

  for (const heading of headings) {
    if (!heading.text.trim()) continue;
    const key = getHeadingKey(heading);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      result.push(heading);
    }
  }

  return result.sort((a, b) => a.order - b.order);
}

/**
 * Deduplicates links array based on normalized text and absolute href.
 */
export function deduplicateLinks(links: LinkNode[]): LinkNode[] {
  const seenKeys = new Set<string>();
  const result: LinkNode[] = [];

  for (const link of links) {
    if (!link.href && !link.text.trim()) continue;
    const key = getLinkKey(link);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      result.push(link);
    }
  }

  return result;
}

/**
 * Deduplicates text paragraph array.
 */
export function deduplicateText(texts: string[]): string[] {
  const seenKeys = new Set<string>();
  const result: string[] = [];

  for (const raw of texts) {
    const norm = normalizeText(raw);
    if (norm.length > 2 && !seenKeys.has(norm)) {
      seenKeys.add(norm);
      result.push(raw.trim());
    }
  }

  return result;
}

/**
 * Merges section trees from multiple interactive extractions, combining links, text,
 * and child sections under matching heading nodes.
 */
export function mergeSectionTrees(existing: SectionNode[], incoming: SectionNode[]): SectionNode[] {
  const result: SectionNode[] = existing.map((sec) => ({
    ...sec,
    children: [...sec.children],
    text: [...sec.text],
    links: [...sec.links]
  }));

  for (const inc of incoming) {
    const match = result.find(
      (ex) => ex.heading && inc.heading && normalizeText(ex.heading) === normalizeText(inc.heading)
    );

    if (match) {
      match.text = deduplicateText([...match.text, ...inc.text]);
      match.links = deduplicateLinks([...match.links, ...inc.links]);
      if (inc.children && inc.children.length > 0) {
        match.children = mergeSectionTrees(match.children, inc.children);
      }
    } else {
      result.push({
        ...inc,
        children: [...inc.children],
        text: [...inc.text],
        links: [...inc.links]
      });
    }
  }

  return result;
}
