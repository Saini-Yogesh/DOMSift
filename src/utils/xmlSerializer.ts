import { ScrapeResult, SectionNode } from '../types';

/**
 * Escapes XML special characters in strings and attributes.
 */
export function escapeXml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Serializes a SectionNode and its children recursively into XML nodes.
 */
function serializeSectionXml(section: SectionNode, indentLevel: number): string {
  const pad = '  '.repeat(indentLevel);
  const typeAttr = ` type="${escapeXml(section.type)}"`;
  const levelAttr = ` level="${section.level}"`;
  const headingAttr = section.heading ? ` heading="${escapeXml(section.heading)}"` : '';

  let xml = `${pad}<section${typeAttr}${levelAttr}${headingAttr}>\n`;

  if (section.text && section.text.length > 0) {
    xml += `${pad}  <paragraphs>\n`;
    for (const text of section.text) {
      xml += `${pad}    <p>${escapeXml(text)}</p>\n`;
    }
    xml += `${pad}  </paragraphs>\n`;
  }

  if (section.links && section.links.length > 0) {
    xml += `${pad}  <links>\n`;
    for (const link of section.links) {
      xml += `${pad}    <link href="${escapeXml(link.href)}" source="${escapeXml(link.source)}">${escapeXml(link.text)}</link>\n`;
    }
    xml += `${pad}  </links>\n`;
  }

  if (section.children && section.children.length > 0) {
    xml += `${pad}  <subsections>\n`;
    for (const child of section.children) {
      xml += serializeSectionXml(child, indentLevel + 2);
    }
    xml += `${pad}  </subsections>\n`;
  }

  xml += `${pad}</section>\n`;
  return xml;
}

/**
 * Converts a ScrapeResult object into a clean, valid XML document string.
 */
export function serializeToXml(result: ScrapeResult): string {
  const { metadata, headings, sections, links, interactions, warnings } = result;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<domsift>\n`;

  // Metadata
  xml += `  <metadata>\n`;
  xml += `    <title>${escapeXml(metadata.title)}</title>\n`;
  xml += `    <url>${escapeXml(metadata.url)}</url>\n`;
  xml += `    <hostname>${escapeXml(metadata.hostname)}</hostname>\n`;
  xml += `    <capturedAt>${escapeXml(metadata.capturedAt)}</capturedAt>\n`;
  xml += `    <extractionDurationMs>${metadata.extractionDurationMs}</extractionDurationMs>\n`;
  xml += `  </metadata>\n`;

  // Headings
  if (!headings || headings.length === 0) {
    xml += `  <headings />\n`;
  } else {
    xml += `  <headings>\n`;
    for (const h of headings) {
      const ctx = h.context ? ` context="${escapeXml(h.context)}"` : '';
      xml += `    <heading level="${h.level}" source="${escapeXml(h.source)}" id="${escapeXml(h.id)}"${ctx}>\n`;
      xml += `      ${escapeXml(h.text)}\n`;
      xml += `    </heading>\n`;
    }
    xml += `  </headings>\n`;
  }

  // Links
  if (!links || links.length === 0) {
    xml += `  <links />\n`;
  } else {
    xml += `  <links>\n`;
    for (const link of links) {
      const orig = link.originalHref ? ` originalHref="${escapeXml(link.originalHref)}"` : '';
      const ctx = link.context ? ` context="${escapeXml(link.context)}"` : '';
      xml += `    <link id="${escapeXml(link.id)}" href="${escapeXml(link.href)}" source="${escapeXml(link.source)}"${orig}${ctx}>\n`;
      xml += `      ${escapeXml(link.text)}\n`;
      xml += `    </link>\n`;
    }
    xml += `  </links>\n`;
  }

  // Sections
  if (!sections || sections.length === 0) {
    xml += `  <sections />\n`;
  } else {
    xml += `  <sections>\n`;
    for (const section of sections) {
      xml += serializeSectionXml(section, 2);
    }
    xml += `  </sections>\n`;
  }

  // Interactions
  if (!interactions || interactions.length === 0) {
    xml += `  <interactions />\n`;
  } else {
    xml += `  <interactions>\n`;
    for (const inter of interactions) {
      xml += `    <interaction id="${escapeXml(inter.id)}" elementType="${escapeXml(inter.elementType)}" action="${escapeXml(inter.action)}" restored="${inter.restoredSuccessfully}">\n`;
      xml += `      <label>${escapeXml(inter.label)}</label>\n`;
      xml += `      <selector>${escapeXml(inter.selector)}</selector>\n`;
      xml += `      <contentExtractedCount>${inter.contentExtractedCount}</contentExtractedCount>\n`;
      xml += `      <timestamp>${escapeXml(inter.timestamp)}</timestamp>\n`;
      xml += `    </interaction>\n`;
    }
    xml += `  </interactions>\n`;
  }

  // Warnings
  if (!warnings || warnings.length === 0) {
    xml += `  <warnings />\n`;
  } else {
    xml += `  <warnings>\n`;
    for (const warning of warnings) {
      xml += `    <warning>${escapeXml(warning)}</warning>\n`;
    }
    xml += `  </warnings>\n`;
  }

  xml += `</domsift>`;
  return xml;
}
