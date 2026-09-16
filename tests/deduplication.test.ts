import { describe, it, expect } from 'vitest';
import {
  deduplicateHeadings,
  deduplicateLinks,
  deduplicateText,
  normalizeText
} from '../src/utils/deduplication';
import { HeadingNode, LinkNode } from '../src/types';

describe('Deduplication Utilities', () => {
  it('normalizes whitespace and casing', () => {
    expect(normalizeText('  Hello   WORLD \n ')).toBe('hello world');
  });

  it('deduplicates duplicate headings preserving order', () => {
    const headings: HeadingNode[] = [
      { id: '1', level: 1, text: 'Introduction', source: 'initial', order: 1 },
      { id: '2', level: 2, text: 'Overview', source: 'initial', order: 2 },
      { id: '3', level: 1, text: 'introduction  ', source: 'expanded', order: 3 }
    ];

    const result = deduplicateHeadings(headings);
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe('Introduction');
    expect(result[1].text).toBe('Overview');
  });

  it('deduplicates links based on normalized text and absolute URL', () => {
    const links: LinkNode[] = [
      { id: '1', text: 'Docs', href: 'https://example.com/docs', originalHref: '/docs', source: 'initial' },
      { id: '2', text: 'Docs', href: 'https://example.com/docs', originalHref: '/docs', source: 'expanded' },
      { id: '3', text: 'GitHub', href: 'https://github.com', originalHref: 'https://github.com', source: 'initial' }
    ];

    const result = deduplicateLinks(links);
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe('Docs');
    expect(result[1].text).toBe('GitHub');
  });

  it('deduplicates paragraph text strings', () => {
    const texts = [
      'This is a sample paragraph content.',
      'THIS IS A SAMPLE PARAGRAPH CONTENT.',
      'Another unique sentence.'
    ];

    const result = deduplicateText(texts);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('This is a sample paragraph content.');
    expect(result[1]).toBe('Another unique sentence.');
  });
});
