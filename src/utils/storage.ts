/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShortLink, ClickEvent, BackendConfig } from '../types/index.ts';

const STORAGE_KEY_LINKS = 'vexuno_links_v2';
const STORAGE_KEY_CLICKS = 'vexuno_clicks_v2';
const STORAGE_KEY_CONFIG = 'vexuno_config_v2';

export const DEFAULT_BACKEND_CONFIG: BackendConfig = {
  apiUrl: '',
  apiKey: '',
  enabled: false,
  autoSync: false,
};

// Clean initial links with ZERO fake clicks
const INITIAL_LINKS: ShortLink[] = [];

export function loadLinks(): ShortLink[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LINKS);
    if (!raw) {
      return INITIAL_LINKS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Strip any old tags
      return parsed.map((l: ShortLink) => ({ ...l, tags: [] }));
    }
    return INITIAL_LINKS;
  } catch {
    return INITIAL_LINKS;
  }
}

export function saveLinks(links: ShortLink[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(links));
  } catch (err) {
    console.error('Failed to save links to storage', err);
  }
}

export function loadClicks(): ClickEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLICKS);
    if (!raw) {
      return []; // Real clicks only - zero fake records
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveClicks(clicks: ClickEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CLICKS, JSON.stringify(clicks));
  } catch (err) {
    console.error('Failed to save clicks to storage', err);
  }
}

export function loadBackendConfig(): BackendConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) return DEFAULT_BACKEND_CONFIG;
    return { ...DEFAULT_BACKEND_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BACKEND_CONFIG;
  }
}

export function saveBackendConfig(config: BackendConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save backend configuration', err);
  }
}

/**
 * Detects real device type from navigator.userAgent
 */
function detectRealDevice(): 'Desktop' | 'Mobile' | 'Tablet' {
  if (typeof navigator === 'undefined') return 'Desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'Tablet';
  }
  if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    return 'Mobile';
  }
  return 'Desktop';
}

/**
 * Detects real browser from navigator.userAgent
 */
function detectRealBrowser(): 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Other' {
  if (typeof navigator === 'undefined') return 'Other';
  const ua = navigator.userAgent;
  if (/edg\//i.test(ua)) return 'Edge';
  if (/chrome|crios/i.test(ua) && !/opr|opera|edg/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) return 'Safari';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  return 'Other';
}

/**
 * Records an authentic, real click event
 */
export function recordRealLinkClick(
  linkId: string,
  overrides?: { referrer?: string }
): { link: ShortLink | null; click: ClickEvent } {
  const links = loadLinks();
  const linkIndex = links.findIndex((l) => l.id === linkId);

  const realReferrer =
    overrides?.referrer ||
    (typeof document !== 'undefined' && document.referrer ? document.referrer : 'Direct');

  const click: ClickEvent = {
    id: `clk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    linkId,
    timestamp: new Date().toISOString(),
    referrer: realReferrer,
    device: detectRealDevice(),
    browser: detectRealBrowser(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    screenResolution:
      typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : undefined,
    language: typeof navigator !== 'undefined' ? navigator.language : undefined,
  };

  let updatedLink: ShortLink | null = null;
  if (linkIndex !== -1) {
    const current = links[linkIndex];
    const newCount = (current.clicks || 0) + 1;
    let isActive = current.isActive;
    if (current.clickLimit && newCount >= current.clickLimit) {
      isActive = false;
    }
    updatedLink = {
      ...current,
      clicks: newCount,
      isActive,
      lastClickedAt: click.timestamp,
    };
    links[linkIndex] = updatedLink;
    saveLinks(links);
  }

  const clicks = loadClicks();
  clicks.unshift(click);
  saveClicks(clicks.slice(0, 2000));

  return { link: updatedLink, click };
}

export function exportLinksToCsv(links: ShortLink[]): string {
  const headers = ['ID', 'Short Code', 'Short URL', 'Original URL', 'Provider', 'Clicks', 'Active', 'Created At', 'Tags', 'Password Protected', 'Expires At'];
  const rows = links.map((l) => [
    `"${l.id}"`,
    `"${l.shortCode}"`,
    `"${l.shortUrl}"`,
    `"${(l.originalUrl || '').replace(/"/g, '""')}"`,
    `"${l.provider}"`,
    l.clicks,
    l.isActive ? 'true' : 'false',
    `"${l.createdAt}"`,
    `"${l.tags.join('; ')}"`,
    l.password ? 'true' : 'false',
    `"${l.expiresAt || ''}"`,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportAllDataAsJson(): string {
  const data = {
    app: 'VEXUNO',
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    links: loadLinks(),
    clicks: loadClicks(),
  };
  return JSON.stringify(data, null, 2);
}
