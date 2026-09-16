import { describe, it, expect } from 'vitest';
import {
  isSafeInteraction,
  discoverCandidates,
  expandAndExtractInteractiveElements
} from '../src/content/discovery';
import { ScrapeOptions } from '../src/types';

describe('Interactive Discovery & Safety Engine', () => {
  it('correctly identifies safe vs unsafe interactive elements', () => {
    const parser = new DOMParser();

    // Safe details summary
    const doc1 = parser.parseFromString('<details><summary>FAQ Item 1</summary><p>Answer</p></details>', 'text/html');
    const summary = doc1.querySelector('summary')!;
    expect(isSafeInteraction(summary)).toBe(true);

    // Safe aria-expanded button
    const doc2 = parser.parseFromString('<button aria-expanded="false">Toggle Accordion</button>', 'text/html');
    const button = doc2.querySelector('button')!;
    expect(isSafeInteraction(button)).toBe(true);

    // Unsafe form submit input
    const doc3 = parser.parseFromString('<input type="submit" value="Submit Form" />', 'text/html');
    const submitInput = doc3.querySelector('input')!;
    expect(isSafeInteraction(submitInput)).toBe(false);

    // Unsafe buy / payment button
    const doc4 = parser.parseFromString('<button>Buy Now</button>', 'text/html');
    const buyButton = doc4.querySelector('button')!;
    expect(isSafeInteraction(buyButton)).toBe(false);

    // Unsafe delete button
    const doc5 = parser.parseFromString('<button aria-label="Delete item">Trash</button>', 'text/html');
    const deleteButton = doc5.querySelector('button')!;
    expect(isSafeInteraction(deleteButton)).toBe(false);
  });

  it('discovers closed <details> and aria-expanded elements', () => {
    const html = `
      <div>
        <details>
          <summary>FAQ Header 1</summary>
          <p>Hidden content 1</p>
        </details>
        <button aria-expanded="false">Accordion Header 2</button>
        <button aria-expanded="true">Already Expanded Header</button>
      </div>
    `;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const candidates = discoverCandidates(doc);
    expect(candidates).toHaveLength(2); // summary and aria-expanded="false" button
  });

  it('automatically opens details element, captures revealed content, and restores state', async () => {
    const html = `
      <div>
        <details id="faq-details">
          <summary id="faq-summary">Expandable Details FAQ</summary>
          <div>
            <h3>Revealed Heading</h3>
            <p>Revealed paragraph text inside accordion.</p>
          </div>
        </details>
      </div>
    `;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const details = doc.querySelector('details')!;
    expect(details.open).toBe(false);

    const options: ScrapeOptions = {
      maxDepth: 3,
      maxInteractions: 10,
      maxWaitMs: 50,
      restoreState: true,
      includeMetadata: true,
      includeWarnings: true
    };

    const res = await expandAndExtractInteractiveElements(doc, 'https://example.com', options);

    expect(res.newHeadings.some((h) => h.text === 'Revealed Heading')).toBe(true);
    expect(res.interactions).toHaveLength(1);
    expect(res.interactions[0].action).toBe('restored');
    expect(details.open).toBe(false); // State restored
  });
});
