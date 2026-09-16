import { ScrapeResult } from '../types';

/**
 * Serializes a ScrapeResult object into pretty-printed JSON.
 */
export function serializeToJson(result: ScrapeResult): string {
  return JSON.stringify(result, null, 2);
}
