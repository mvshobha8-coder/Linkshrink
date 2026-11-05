/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ShortLink {
  id: string;
  shortCode: string;
  originalUrl: string;
  title: string;
  createdAt: string;
  clicks: number;
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
  timestamp: string;
  referrer: string;
  device: 'Desktop' | 'Mobile' | 'Tablet';
  browser: 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Other';
  country: string;
  countryCode: string;
}

export type ActiveTab = 'shortener' | 'links' | 'analytics' | 'utm' | 'batch';
export type SortOption = 'newest' | 'oldest' | 'most_clicks' | 'least_clicks' | 'title';
export type FilterStatus = 'all' | 'active' | 'expired' | 'protected';
