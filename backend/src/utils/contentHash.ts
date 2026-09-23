import crypto from 'crypto';

/**
 * Validates whether a given URL is a syntactically valid HTTP or HTTPS web address.
 */
export function isValidUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && !!parsed.hostname;
  } catch {
    return false;
  }
}

/**
 * Normalizes text by removing non-alphanumeric noise and excess whitespace.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes a deterministic SHA-256 hash from normalized article title and URL.
 * This guarantees reliable duplicate detection across RSS feeds and news aggregators.
 */
export function computeContentHash(title: string, url: string): string {
  const normTitle = normalizeText(title);
  
  // Normalize URL by removing tracking query parameters (utm_*, ref, etc.)
  let normUrl = url.trim().toLowerCase();
  try {
    const parsed = new URL(normUrl);
    const searchParams = new URLSearchParams(parsed.search);
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'fbclid'];
    trackingParams.forEach((param) => searchParams.delete(param));
    parsed.search = searchParams.toString();
    normUrl = parsed.toString().replace(/\/$/, ''); // strip trailing slash
  } catch {
    // Keep trimmed lowercase url
  }

  const payload = `${normTitle}:::${normUrl}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}
