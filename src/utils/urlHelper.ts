/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Reserved slugs to prevent collisions with application routes
const RESERVED_SLUGS = new Set([
  'api',
  'admin',
  'login',
  'logout',
  'auth',
  'r',
  'settings',
  'terms',
  'privacy',
  'analytics',
  'dashboard',
  'robots',
  'sitemap',
  'favicon',
  'assets',
  'dist',
]);

// SSRF & dangerous IP patterns to block
const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^0\.0\.0\.0$/,
  /^169\.254\.169\.254$/, // AWS / Cloud metadata
  /^\[::1\]$/,
  /^10\.\d+\.\d+\.\d+$/,   // Private subnet
  /^192\.168\.\d+\.\d+$/, // Private subnet
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/, // Private subnet
];

export interface UrlValidationResult {
  isValid: boolean;
  normalizedUrl: string;
  error?: string;
}

/**
 * Sanitizes and validates a URL with strict security heuristics
 */
export function sanitizeAndValidateUrl(rawInput: string): UrlValidationResult {
  if (!rawInput || typeof rawInput !== 'string') {
    return { isValid: false, normalizedUrl: '', error: 'URL is required.' };
  }

  // Strip non-printable and CRLF injection characters
  let cleanInput = rawInput.trim().replace(/[\r\n\t]/g, '');

  if (!cleanInput) {
    return { isValid: false, normalizedUrl: '', error: 'URL cannot be empty.' };
  }

  // Strictly block dangerous pseudo-schemes
  const lower = cleanInput.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('blob:') ||
    lower.startsWith('about:')
  ) {
    return {
      isValid: false,
      normalizedUrl: '',
      error: 'Security violation: Disallowed pseudo-protocol scheme.',
    };
  }

  // Prepend https:// if protocol is omitted
  if (!/^https?:\/\//i.test(cleanInput)) {
    cleanInput = 'https://' + cleanInput;
  }

  try {
    const parsed = new URL(cleanInput);

    // Only allow http and https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        isValid: false,
        normalizedUrl: '',
        error: 'Only HTTP and HTTPS URLs are permitted.',
      };
    }

    // Hostname validation
    const hostname = parsed.hostname.toLowerCase();
    if (!hostname || hostname.length < 3 || !hostname.includes('.')) {
      return {
        isValid: false,
        normalizedUrl: '',
        error: 'Please enter a valid domain name with an extension (e.g. example.com).',
      };
    }

    // Block private/internal SSRF IP targets
    for (const pattern of BLOCKED_HOST_PATTERNS) {
      if (pattern.test(hostname)) {
        return {
          isValid: false,
          normalizedUrl: '',
          error: 'Restricted host: Private, internal, or loopback addresses cannot be shortened.',
        };
      }
    }

    return { isValid: true, normalizedUrl: parsed.href };
  } catch {
    return {
      isValid: false,
      normalizedUrl: '',
      error: 'Malformed URL: Failed RFC 3986 structure verification.',
    };
  }
}

export function isValidUrl(input: string): boolean {
  return sanitizeAndValidateUrl(input).isValid;
}

export function normalizeUrl(input: string): string {
  const res = sanitizeAndValidateUrl(input);
  return res.isValid ? res.normalizedUrl : input.trim();
}

export function extractDomain(urlStr: string): string {
  try {
    const parsed = new URL(normalizeUrl(urlStr));
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return urlStr;
  }
}

export function generateShortCode(length = 6): string {
  // Use non-ambiguous alphanumeric characters (avoids 0, O, I, l)
  const charset = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const array = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < length; i++) array[i] = Math.floor(Math.random() * 256);
  }

  let code = '';
  for (let i = 0; i < length; i++) {
    code += charset[array[i] % charset.length];
  }
  return code;
}

export function cleanCustomAlias(alias: string): string {
  return alias
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 36);
}

export function validateCustomAlias(alias: string, existingCodes: string[]): { isValid: boolean; error?: string } {
  const cleaned = cleanCustomAlias(alias);
  if (!cleaned) {
    return { isValid: false, error: 'Custom alias cannot be blank.' };
  }
  if (cleaned.length < 3) {
    return { isValid: false, error: 'Custom alias must be at least 3 characters long.' };
  }
  if (cleaned.length > 36) {
    return { isValid: false, error: 'Custom alias cannot exceed 36 characters.' };
  }
  if (RESERVED_SLUGS.has(cleaned)) {
    return { isValid: false, error: `"${cleaned}" is a reserved system path.` };
  }
  if (existingCodes.some((c) => c.toLowerCase() === cleaned.toLowerCase())) {
    return { isValid: false, error: `Alias "${cleaned}" is already in use.` };
  }
  return { isValid: true };
}

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export function appendUtmParams(rawUrl: string, params: UtmParams): string {
  try {
    const valid = sanitizeAndValidateUrl(rawUrl);
    if (!valid.isValid) return rawUrl;

    const url = new URL(valid.normalizedUrl);
    if (params.source?.trim()) url.searchParams.set('utm_source', encodeURIComponent(params.source.trim()));
    if (params.medium?.trim()) url.searchParams.set('utm_medium', encodeURIComponent(params.medium.trim()));
    if (params.campaign?.trim()) url.searchParams.set('utm_campaign', encodeURIComponent(params.campaign.trim()));
    if (params.term?.trim()) url.searchParams.set('utm_term', encodeURIComponent(params.term.trim()));
    if (params.content?.trim()) url.searchParams.set('utm_content', encodeURIComponent(params.content.trim()));
    return url.href;
  } catch {
    return rawUrl;
  }
}
