/**
 * Sanitizes a page title or domain name into a safe filename slug.
 */
export function sanitizeFilenameSlug(titleOrHost: string): string {
  if (!titleOrHost) return 'domsift-extract';
  
  return titleOrHost
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'domsift-extract';
}

/**
 * Formats a Date object as YYYY-MM-DD.
 */
export function formatDateISO(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Generates an export filename for JSON or XML files.
 * Example: example-docs-2026-09-16.json
 */
export function generateExportFilename(
  titleOrHost: string,
  extension: 'json' | 'xml',
  timestamp: Date = new Date()
): string {
  const slug = sanitizeFilenameSlug(titleOrHost);
  const dateStr = formatDateISO(timestamp);
  return `${slug}-${dateStr}.${extension}`;
}
