import { describe, it, expect } from 'vitest';
import { serializeToJson } from '../src/utils/jsonSerializer';
import { serializeToXml, escapeXml } from '../src/utils/xmlSerializer';
import { generateExportFilename, sanitizeFilenameSlug } from '../src/utils/filename';
import { ScrapeResult } from '../src/types';

describe('Serialization and Export Engine', () => {
  const sampleResult: ScrapeResult = {
    metadata: {
      title: 'Documentation & Guide <2026>',
      url: 'https://example.com/docs?a=1&b=2',
      hostname: 'example.com',
      capturedAt: '2026-09-16T10:00:00.000Z',
      extractionDurationMs: 120,
      extractedHeadingCount: 1,
      extractedLinkCount: 1,
      extractedSectionCount: 1,
      interactionCount: 0
    },
    headings: [
      {
        id: 'h-1',
        level: 1,
        text: 'Getting Started & Installation',
        source: 'initial',
        order: 1
      }
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'page',
        heading: 'Getting Started & Installation',
        level: 1,
        children: [],
        text: ['Introductory text with <brackets> & "quotes".'],
        links: [
          {
            id: 'l-1',
            text: 'Official Repo & Docs',
            href: 'https://example.com/repo?foo=bar&baz=qux',
            originalHref: '/repo?foo=bar&baz=qux',
            source: 'initial'
          }
        ]
      }
    ],
    links: [
      {
        id: 'l-1',
        text: 'Official Repo & Docs',
        href: 'https://example.com/repo?foo=bar&baz=qux',
        originalHref: '/repo?foo=bar&baz=qux',
        source: 'initial'
      }
    ],
    interactions: [],
    warnings: []
  };

  it('escapes XML special characters strictly', () => {
    expect(escapeXml('AT&T <Store> "Special" \'Offers\'')).toBe('AT&amp;T &lt;Store&gt; &quot;Special&quot; &apos;Offers&apos;');
  });

  it('generates valid formatted JSON', () => {
    const jsonStr = serializeToJson(sampleResult);
    expect(jsonStr).toContain('"title": "Documentation & Guide <2026>"');
    expect(jsonStr).toContain('"Getting Started & Installation"');

    // Parse back to verify validity
    const parsed = JSON.parse(jsonStr);
    expect(parsed.metadata.hostname).toBe('example.com');
  });

  it('generates valid XML with proper escaping and tags', () => {
    const xmlStr = serializeToXml(sampleResult);
    expect(xmlStr).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xmlStr).toContain('<domsift>');
    expect(xmlStr).toContain('<title>Documentation &amp; Guide &lt;2026&gt;</title>');
    expect(xmlStr).toContain('Getting Started &amp; Installation');
    expect(xmlStr).toContain('href="https://example.com/repo?foo=bar&amp;baz=qux"');
    expect(xmlStr).toContain('</domsift>');
  });

  it('generates sanitized filesystem-compatible export filenames', () => {
    expect(sanitizeFilenameSlug('Example Documentation | Docs & API')).toBe('example-documentation-docs-api');
    expect(generateExportFilename('Example Documentation', 'json', new Date('2026-09-16'))).toBe('example-documentation-2026-09-16.json');
    expect(generateExportFilename('https://my-site.org/docs', 'xml', new Date('2026-09-16'))).toBe('my-site-org-docs-2026-09-16.xml');
  });
});
