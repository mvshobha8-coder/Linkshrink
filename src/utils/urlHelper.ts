/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function normalizeUrl(input: string): string {
  let trimmed = input.trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.href;
  } catch {
    return trimmed;
  }
}

export function isValidUrl(input: string): boolean {
  try {
    const candidate = normalizeUrl(input);
    const parsed = new URL(candidate);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
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
  // Discard easily confused characters (0, O, I, l)
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return result;
}

export function cleanCustomAlias(alias: string): string {
  return alias
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
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
    const url = new URL(normalizeUrl(rawUrl));
    if (params.source?.trim()) url.searchParams.set('utm_source', params.source.trim());
    if (params.medium?.trim()) url.searchParams.set('utm_medium', params.medium.trim());
    if (params.campaign?.trim()) url.searchParams.set('utm_campaign', params.campaign.trim());
    if (params.term?.trim()) url.searchParams.set('utm_term', params.term.trim());
    if (params.content?.trim()) url.searchParams.set('utm_content', params.content.trim());
    return url.href;
  } catch {
    return rawUrl;
  }
}

export function parseUtmParams(rawUrl: string): UtmParams {
  try {
    const url = new URL(rawUrl);
    return {
      source: url.searchParams.get('utm_source') || '',
      medium: url.searchParams.get('utm_medium') || '',
      campaign: url.searchParams.get('utm_campaign') || '',
      term: url.searchParams.get('utm_term') || '',
      content: url.searchParams.get('utm_content') || '',
    };
  } catch {
    return {};
  }
}
