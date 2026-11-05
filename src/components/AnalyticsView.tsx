/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ShortLink, ClickEvent } from '../types/index.ts';
import {
  MousePointerClick,
  Users,
  Globe,
  QrCode,
  ExternalLink,
} from 'lucide-react';

interface AnalyticsViewProps {
  links: ShortLink[];
  clicks: ClickEvent[];
  selectedLinkId?: string | null;
  onSelectLink: (linkId: string | null) => void;
  onOpenQr: (link: ShortLink) => void;
  onOpenRedirect: (link: ShortLink) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  links,
  clicks,
  selectedLinkId,
  onSelectLink,
  onOpenQr,
  onOpenRedirect,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('14d');
  const [hoveredPoint, setHoveredPoint] = useState<{ date: string; count: number } | null>(null);

  const relevantClicks = useMemo(() => {
    if (!selectedLinkId) return clicks;
    return clicks.filter((c) => c.linkId === selectedLinkId);
  }, [clicks, selectedLinkId]);

  const selectedLink = useMemo(() => {
    return links.find((l) => l.id === selectedLinkId) || null;
  }, [links, selectedLinkId]);

  const totalClicksCount = useMemo(() => {
    if (selectedLink) return selectedLink.clicks || 0;
    return links.reduce((acc, l) => acc + (l.clicks || 0), 0);
  }, [links, selectedLink]);

  const uniqueVisitorsCount = useMemo(() => {
    if (relevantClicks.length === 0) return 0;
    const unique = new Set(
      relevantClicks.map((c) => `${c.device}-${c.browser}-${c.screenResolution || ''}`)
    );
    return unique.size;
  }, [relevantClicks]);

  const activeLinksCount = useMemo(() => {
    return links.filter((l) => l.isActive).length;
  }, [links]);

  const popularLinks = useMemo(() => {
    return [...links].sort((a, b) => b.clicks - a.clicks).slice(0, 5);
  }, [links]);

  const timelineData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
    const result: { date: string; label: string; count: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const shortLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const count = relevantClicks.filter((c) => c.timestamp.startsWith(dateStr)).length;
      result.push({ date: dateStr, label: shortLabel, count });
    }

    return result;
  }, [relevantClicks, timeRange]);

  const maxTimelineCount = useMemo(() => {
    return Math.max(...timelineData.map((d) => d.count), 5);
  }, [timelineData]);

  const referrerStats = useMemo(() => {
    if (relevantClicks.length === 0) return [];
    const counts: Record<string, number> = {};
    relevantClicks.forEach((c) => {
      const ref = c.referrer && c.referrer !== '' ? c.referrer : 'Direct';
      counts[ref] = (counts[ref] || 0) + 1;
    });
    const total = relevantClicks.length || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / total) * 100),
      }));
  }, [relevantClicks]);


  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click performance and traffic sources.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedLinkId || ''}
            onChange={(e) => onSelectLink(e.target.value ? e.target.value : null)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none max-w-xs truncate shadow-xs"
          >
            <option value="">All Links</option>
            {links.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title ? `${l.title} (${l.shortCode})` : l.shortCode}
              </option>
            ))}
          </select>

          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs font-medium">
            {(['7d', '14d', '30d'] as ('7d' | '14d' | '30d')[]).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  timeRange === r
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Total Clicks</span>
            <MousePointerClick className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
            {totalClicksCount.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Unique Visitors</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
            {uniqueVisitorsCount.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Active Links</span>
            <Globe className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
            {selectedLink ? (selectedLink.isActive ? 'Active' : 'Paused') : `${activeLinksCount} / ${links.length}`}
          </div>
        </div>
      </div>

      {/* Clicks Over Time Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
            Clicks Over Time
          </h3>
          {hoveredPoint && (
            <div className="text-xs font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-900 dark:text-white tabular-nums">
              {hoveredPoint.date}: {hoveredPoint.count} clicks
            </div>
          )}
        </div>

        {totalClicksCount === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No clicks recorded yet. Clicks will appear here once visitors open your links.
          </div>
        ) : (
          <div className="h-40 w-full flex items-end gap-2 pt-4 px-1">
            {timelineData.map((d, index) => {
              const heightPercent = maxTimelineCount > 0 ? Math.max(6, Math.round((d.count / maxTimelineCount) * 100)) : 6;
              const isHovered = hoveredPoint?.date === d.date;

              return (
                <div
                  key={d.date}
                  className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                  onMouseEnter={() => setHoveredPoint({ date: d.date, count: d.count })}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <div
                    className={`w-full rounded-t-sm transition-all duration-150 ${
                      isHovered
                        ? 'bg-slate-900 dark:bg-white'
                        : d.count > 0
                        ? 'bg-slate-800 dark:bg-slate-300'
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />

                  {(index % (timelineData.length > 14 ? 3 : 2) === 0 || index === timelineData.length - 1) && (
                    <span className="text-[10px] text-slate-400 font-mono mt-2 truncate select-none">
                      {d.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2-Column: Top Links & Referrers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Top Links */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
            Top Links
          </h3>

          {popularLinks.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No links created yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {popularLinks.map((link) => (
                <div key={link.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                  <div className="truncate flex-1">
                    <span className="font-medium text-slate-900 dark:text-white truncate block">
                      {link.title || link.shortCode}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px] truncate block">
                      {link.shortUrl}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                      {link.clicks}
                    </span>
                    <button
                      onClick={() => onOpenQr(link)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenRedirect(link)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Visit"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Referrers */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
            Referrers
          </h3>

          {referrerStats.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No referrers logged yet.</p>
          ) : (
            <div className="space-y-2.5">
              {referrerStats.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                    <span className="font-mono text-slate-500 tabular-nums">{item.count}</span>
                  </div>
                  <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-900 dark:bg-white rounded-full"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
