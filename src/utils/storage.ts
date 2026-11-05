/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShortLink, ClickEvent } from '../types/index.ts';

const STORAGE_KEY_LINKS = 'linkshrink_links_v1';
const STORAGE_KEY_CLICKS = 'linkshrink_clicks_v1';

const INITIAL_LINKS: ShortLink[] = [
  {
    id: 'link_1',
    shortCode: 'keynote26',
    originalUrl: 'https://stream.example.com/live/keynote-2026',
    title: 'Product Launch Keynote 2026',
    createdAt: '2026-10-18T14:32:00.000Z',
    clicks: 1428,
    tags: ['Launch', 'Marketing'],
    isActive: true,
    lastClickedAt: '2026-11-03T08:15:00.000Z',
    utm: {
      source: 'twitter',
      medium: 'social',
      campaign: 'global_keynote',
    },
  },
  {
    id: 'link_2',
    shortCode: 'design-tokens',
    originalUrl: 'https://figma.com/@system/design-tokens-v4',
    title: 'Design System & Component Specs',
    createdAt: '2026-10-22T09:15:00.000Z',
    clicks: 894,
    tags: ['Design', 'Internal'],
    isActive: true,
    lastClickedAt: '2026-11-02T16:40:00.000Z',
  },
  {
    id: 'link_3',
    shortCode: 'q4-finance',
    originalUrl: 'https://docs.google.com/presentation/d/finance-forecast-q4',
    title: 'Q4 Investor Financial Deck',
    createdAt: '2026-10-25T11:00:00.000Z',
    clicks: 312,
    tags: ['Finance', 'Investor'],
    isActive: true,
    password: 'investor2026',
    lastClickedAt: '2026-11-02T21:10:00.000Z',
  },
  {
    id: 'link_4',
    shortCode: 'api-docs',
    originalUrl: 'https://developer.example.com/api/v3/reference',
    title: 'Developer REST API Documentation',
    createdAt: '2026-10-10T08:00:00.000Z',
    clicks: 2156,
    tags: ['Engineering', 'Public'],
    isActive: true,
    lastClickedAt: '2026-11-03T09:05:00.000Z',
  },
  {
    id: 'link_5',
    shortCode: 'webinar-live',
    originalUrl: 'https://zoom.us/j/9876543210',
    title: 'Interactive Community Tech Talk',
    createdAt: '2026-10-29T15:20:00.000Z',
    clicks: 145,
    tags: ['Events', 'Community'],
    isActive: true,
    expiresAt: '2026-12-31T23:59:59.000Z',
    clickLimit: 500,
    lastClickedAt: '2026-11-01T12:00:00.000Z',
  },
];

function generateSeedClicks(): ClickEvent[] {
  const referrers = ['Direct', 'Twitter / X', 'LinkedIn', 'Google Search', 'GitHub', 'Reddit', 'Hacker News'];
  const devices: ('Desktop' | 'Mobile' | 'Tablet')[] = ['Desktop', 'Desktop', 'Mobile', 'Mobile', 'Desktop', 'Tablet'];
  const browsers: ('Chrome' | 'Safari' | 'Firefox' | 'Edge')[] = ['Chrome', 'Chrome', 'Safari', 'Firefox', 'Edge'];
  const countries = [
    { country: 'United States', countryCode: 'US' },
    { country: 'United Kingdom', countryCode: 'GB' },
    { country: 'Germany', countryCode: 'DE' },
    { country: 'Japan', countryCode: 'JP' },
    { country: 'India', countryCode: 'IN' },
    { country: 'Canada', countryCode: 'CA' },
    { country: 'France', countryCode: 'FR' },
    { country: 'Australia', countryCode: 'AU' },
  ];

  const clicks: ClickEvent[] = [];
  const now = new Date('2026-11-03T09:30:00.000Z').getTime();

  // Generate ~120 recent click records over the past 14 days for detailed telemetry
  for (let i = 0; i < 150; i++) {
    const daysAgo = Math.random() * 14;
    const clickTime = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const link = INITIAL_LINKS[Math.floor(Math.random() * INITIAL_LINKS.length)];
    const country = countries[Math.floor(Math.random() * countries.length)];

    clicks.push({
      id: `clk_${i}_${Math.random().toString(36).substring(2, 7)}`,
      linkId: link.id,
      timestamp: clickTime,
      referrer: referrers[Math.floor(Math.random() * referrers.length)],
      device: devices[Math.floor(Math.random() * devices.length)],
      browser: browsers[Math.floor(Math.random() * browsers.length)],
      country: country.country,
      countryCode: country.countryCode,
    });
  }

  // Sort by timestamp descending
  return clicks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function loadLinks(): ShortLink[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LINKS);
    if (!raw) {
      saveLinks(INITIAL_LINKS);
      return INITIAL_LINKS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_LINKS;
  }
}

export function saveLinks(links: ShortLink[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(links));
  } catch (err) {
    console.error('Failed to save links to localStorage', err);
  }
}

export function loadClicks(): ClickEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLICKS);
    if (!raw) {
      const seed = generateSeedClicks();
      saveClicks(seed);
      return seed;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveClicks(clicks: ClickEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CLICKS, JSON.stringify(clicks));
  } catch (err) {
    console.error('Failed to save clicks to localStorage', err);
  }
}

export function recordLinkClick(
  linkId: string,
  overrides?: Partial<Omit<ClickEvent, 'id' | 'linkId' | 'timestamp'>>
): { link: ShortLink | null; click: ClickEvent } {
  const links = loadLinks();
  const linkIndex = links.findIndex((l) => l.id === linkId);

  const referrers = ['Direct', 'Browser / Test', 'Social Media', 'External Link'];
  const devices: ('Desktop' | 'Mobile')[] = ['Desktop', 'Mobile'];
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobile = /mobile|iphone|android|ipad/i.test(userAgent);

  const click: ClickEvent = {
    id: `clk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    linkId,
    timestamp: new Date().toISOString(),
    referrer: overrides?.referrer || referrers[Math.floor(Math.random() * referrers.length)],
    device: overrides?.device || (isMobile ? 'Mobile' : 'Desktop'),
    browser: overrides?.browser || 'Chrome',
    country: overrides?.country || 'United States',
    countryCode: overrides?.countryCode || 'US',
  };

  let updatedLink: ShortLink | null = null;
  if (linkIndex !== -1) {
    const current = links[linkIndex];
    const newCount = current.clicks + 1;
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
  // Keep last 1000 clicks to prevent storage overflow
  saveClicks(clicks.slice(0, 1000));

  return { link: updatedLink, click };
}

export function exportLinksToCsv(links: ShortLink[]): string {
  const headers = ['ID', 'Short Code', 'Title', 'Original URL', 'Clicks', 'Active', 'Created At', 'Tags', 'Has Password', 'Expires At'];
  const rows = links.map((l) => [
    `"${l.id}"`,
    `"${l.shortCode}"`,
    `"${(l.title || '').replace(/"/g, '""')}"`,
    `"${(l.originalUrl || '').replace(/"/g, '""')}"`,
    l.clicks,
    l.isActive ? 'true' : 'false',
    `"${l.createdAt}"`,
    `"${l.tags.join('; ')}"`,
    l.password ? 'true' : 'false',
    `"${l.expiresAt || ''}"`,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function resetToDefaults(): { links: ShortLink[]; clicks: ClickEvent[] } {
  const clicks = generateSeedClicks();
  saveLinks(INITIAL_LINKS);
  saveClicks(clicks);
  return { links: INITIAL_LINKS, clicks };
}
