/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ShortenerProvider = 'vexuno_direct' | 'tinyurl' | 'custom_api';

export interface ShortLink {
  id: string;
  shortCode: string;
  originalUrl: string;
  shortUrl: string; // The complete, reachable short URL
  provider: ShortenerProvider;
  title: string;
  createdAt: string;
  clicks: number; // Real clicks only - zero fake counts
  tags: string[];
  isActive: boolean;
  password?: string;
  expiresAt?: string;
  clickLimit?: number;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  lastClickedAt?: string;
}

export interface ClickEvent {
  id: string;
  linkId: string;
  timestamp: string; // Real timestamp
  referrer: string; // Real document.referrer or 'Direct'
  device: 'Desktop' | 'Mobile' | 'Tablet';
  browser: 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Other';
  userAgent?: string;
  screenResolution?: string;
  language?: string;
}

export interface BackendConfig {
  apiUrl: string;
  apiKey: string;
  enabled: boolean;
  autoSync: boolean;
}

export type ActiveTab = 'shortener' | 'links' | 'analytics';
export type SortOption = 'newest' | 'oldest' | 'most_clicks' | 'least_clicks' | 'title';
