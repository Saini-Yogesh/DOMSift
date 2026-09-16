/**
 * Safely resolves a URL against a base URL.
 * Handles relative paths, protocol-relative URLs, hashes, and non-HTTP schemes.
 */
export function resolveUrl(href: string | null | undefined, baseUrl: string): string {
  if (!href) return '';

  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith('javascript:') || trimmed.startsWith('#')) {
    return trimmed;
  }

  try {
    const base = new URL(baseUrl);
    const resolved = new URL(trimmed, base);
    return resolved.href;
  } catch {
    return trimmed;
  }
}

/**
 * Extracts clean domain hostname from a full URL.
 */
export function extractHostname(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname;
  } catch {
    return 'webpage';
  }
}
