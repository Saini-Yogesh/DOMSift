import { describe, it, expect } from 'vitest';
import { extractSemanticContent, extractCleanText } from '../src/content/extractor';
import { resolveUrl } from '../src/utils/url';

describe('DOM Extraction Engine', () => {
  it('extracts H1 through H6 headings with level, text, and order', () => {
    const html = `
      <div>
        <h1>Main Document Title</h1>
        <p>Introduction text</p>
        <h2>Section 1 Overview</h2>
        <h3>Subsection 1.1 Details</h3>
      </div>
    `;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const result = extractSemanticContent(doc, 'https://example.com/docs', 'initial');

    expect(result.headings).toHaveLength(3);
    expect(result.headings[0]).toMatchObject({
      level: 1,
      text: 'Main Document Title',
      order: 1
    });
    expect(result.headings[1]).toMatchObject({
      level: 2,
      text: 'Section 1 Overview',
      order: 2
    });
    expect(result.headings[2]).toMatchObject({
      level: 3,
      text: 'Subsection 1.1 Details',
      order: 3
    });
  });

  it('extracts links and resolves relative URLs into absolute URLs', () => {
    const html = `
      <nav>
        <a href="/getting-started">Getting Started</a>
        <a href="relative/path.html">Relative Page</a>
        <a href="https://external.com/about">External Link</a>
      </nav>
    `;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const result = extractSemanticContent(doc, 'https://example.com/docs/index.html', 'initial');

    expect(result.links).toHaveLength(3);
    expect(result.links[0].href).toBe('https://example.com/getting-started');
    expect(result.links[1].href).toBe('https://example.com/docs/relative/path.html');
    expect(result.links[2].href).toBe('https://external.com/about');
  });

  it('ignores hidden, script, and style text content', () => {
    const html = `
      <div>
        <h1>Visible Heading</h1>
        <script>console.log('ignored script text');</script>
        <style>body { color: red; }</style>
        <p>Visible paragraph content.</p>
      </div>
    `;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const cleanText = extractCleanText(doc.body);
    expect(cleanText).not.toContain('console.log');
    expect(cleanText).not.toContain('color: red');
    expect(cleanText).toContain('Visible Heading');
    expect(cleanText).toContain('Visible paragraph content.');
  });

  it('builds semantic hierarchy section tree with nested subheadings and links under parent headings', () => {
    const html = `
      <div>
        <h1>Main Page Title</h1>
        <p>Main introduction paragraph.</p>
        <a href="/intro-link">Intro Link</a>
        <h2>Section 1 Overview</h2>
        <p>Section 1 text.</p>
        <a href="/section-1-link">Section 1 Link</a>
        <h3>Subsection 1.1</h3>
        <p>Subsection text.</p>
        <a href="/subsection-link">Subsection Link</a>
      </div>
    `;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const result = extractSemanticContent(doc, 'https://example.com', 'initial');

    expect(result.sections).toHaveLength(1); // Page root
    const rootNode = result.sections[0];
    expect(rootNode.children).toHaveLength(1); // H1: Main Page Title

    const h1Section = rootNode.children[0];
    expect(h1Section.heading).toBe('Main Page Title');
    expect(h1Section.text).toContain('Main introduction paragraph.');
    expect(h1Section.links[0].href).toBe('https://example.com/intro-link');

    // H2 should be nested under H1
    expect(h1Section.children).toHaveLength(1);
    const h2Section = h1Section.children[0];
    expect(h2Section.heading).toBe('Section 1 Overview');
    expect(h2Section.text).toContain('Section 1 text.');
    expect(h2Section.links[0].href).toBe('https://example.com/section-1-link');

    // H3 should be nested under H2
    expect(h2Section.children).toHaveLength(1);
    const h3Section = h2Section.children[0];
    expect(h3Section.heading).toBe('Subsection 1.1');
    expect(h3Section.text).toContain('Subsection text.');
    expect(h3Section.links[0].href).toBe('https://example.com/subsection-link');
  });

  it('correctly resolves relative URL helper function', () => {
    expect(resolveUrl('/foo/bar', 'https://example.com/test/')).toBe('https://example.com/foo/bar');
    expect(resolveUrl('sub.html', 'https://example.com/test/')).toBe('https://example.com/test/sub.html');
    expect(resolveUrl('javascript:void(0)', 'https://example.com')).toBe('javascript:void(0)');
  });
});
