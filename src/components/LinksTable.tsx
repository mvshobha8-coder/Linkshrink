/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ShortLink, FilterStatus, SortOption } from '../types/index.ts';
import { extractDomain } from '../utils/urlHelper.ts';
import { exportLinksToCsv } from '../utils/storage.ts';
import {
  Search,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  MousePointerClick,
  Lock,
  Trash2,
  Download,
  Power,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';

interface LinksTableProps {
  links: ShortLink[];
  onUpdateLink: (updated: ShortLink) => void;
  onDeleteLink: (linkId: string) => void;
  onOpenQr: (link: ShortLink) => void;
  onOpenRedirect: (link: ShortLink) => void;
  onOpenAnalytics: (link: ShortLink) => void;
  onResetData: () => void;
  baseUrl: string;
}

export const LinksTable: React.FC<LinksTableProps> = ({
  links,
  onUpdateLink,
  onDeleteLink,
  onOpenQr,
  onOpenRedirect,
  onOpenAnalytics,
  onResetData,
  baseUrl,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    links.forEach((l) => l.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [links]);

  // Filtered & sorted links
  const filteredLinks = useMemo(() => {
    return links
      .filter((link) => {
        // Search query
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          link.title.toLowerCase().includes(q) ||
          link.shortCode.toLowerCase().includes(q) ||
          link.originalUrl.toLowerCase().includes(q) ||
          link.tags.some((t) => t.toLowerCase().includes(q));

        if (!matchesQuery) return false;

        // Status filter
        const isExpired =
          (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) ||
          (link.clickLimit && link.clicks >= link.clickLimit);

        if (statusFilter === 'active' && (!link.isActive || isExpired)) return false;
        if (statusFilter === 'expired' && !isExpired) return false;
        if (statusFilter === 'protected' && !link.password) return false;

        // Tag filter
        if (selectedTag !== 'all' && !link.tags.includes(selectedTag)) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'most_clicks') {
          return b.clicks - a.clicks;
        }
        if (sortBy === 'least_clicks') {
          return a.clicks - b.clicks;
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [links, searchQuery, statusFilter, selectedTag, sortBy]);

  const handleCopy = (link: ShortLink) => {
    const fullUrl = `${baseUrl}/r/${link.shortCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleActive = (link: ShortLink) => {
    onUpdateLink({
      ...link,
      isActive: !link.isActive,
    });
  };

  const handleExportCsv = () => {
    const csvContent = exportLinksToCsv(filteredLinks);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `linkshrink_export_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const maxClicks = Math.max(...links.map((l) => l.clicks), 1);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, URL, slug, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white text-slate-900 dark:text-white"
            />
          </div>

          {/* Interactive Filter Controls (Segmented functional buttons) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto no-scrollbar">
            {(
              [
                { id: 'all', label: 'All Links' },
                { id: 'active', label: 'Active' },
                { id: 'protected', label: 'Protected' },
                { id: 'expired', label: 'Expired' },
              ] as { id: FilterStatus; label: string }[]
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  statusFilter === f.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort & Action controls */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most_clicks">Most Clicks</option>
              <option value="least_clicks">Least Clicks</option>
              <option value="title">Alphabetical</option>
            </select>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
              title="Export links to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Secondary Tag Filter Row (if tags exist) */}
        {allTags.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
            <span className="text-slate-400 dark:text-slate-500 font-medium shrink-0">Tags:</span>
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-2 py-0.5 rounded text-xs transition-colors shrink-0 ${
                selectedTag === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? 'all' : tag)}
                className={`px-2 py-0.5 rounded text-xs transition-colors shrink-0 ${
                  selectedTag === tag
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-medium'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
        {filteredLinks.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center">
            <SlidersHorizontal className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              No matching short links
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || selectedTag !== 'all'
                ? 'Try adjusting your search criteria or filter options.'
                : 'Create your first short link using the shortener tool.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              {(searchQuery || statusFilter !== 'all' || selectedTag !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setSelectedTag('all');
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={onResetData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Sample Links</span>
              </button>
            </div>
          </div>
        ) : (
          /* High density data table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                  <th className="py-3 px-4 sm:px-6">Link & Destination</th>
                  <th className="py-3 px-4 text-right">Clicks</th>
                  <th className="py-3 px-4 hidden md:table-cell">Metadata & Tags</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLinks.map((link) => {
                  const targetDomain = extractDomain(link.originalUrl);
                  const isCopied = copiedId === link.id;
                  const isExpired =
                    (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) ||
                    (link.clickLimit && link.clicks >= link.clickLimit);
                  const clickPercentage = Math.min(100, Math.round((link.clicks / maxClicks) * 100));

                  return (
                    <tr
                      key={link.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Column 1: Title, Short Link, Destination */}
                      <td className="py-3.5 px-4 sm:px-6 align-top max-w-xs sm:max-w-md">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {link.title || link.shortCode}
                              </span>
                              {link.password && (
                                <span title="Passcode Protected">
                                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                </span>
                              )}
                              {!link.isActive && (
                                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                  (Paused)
                                </span>
                              )}
                              {isExpired && (
                                <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                                  (Expired)
                                </span>
                              )}
                            </div>

                            {/* Short Code with Copy button */}
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                onClick={() => handleCopy(link)}
                                className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white group/btn"
                                title="Click to copy short URL"
                              >
                                <span>{extractDomain(baseUrl) || 'linkshrink.kesug.com'}/r/{link.shortCode}</span>
                                {isCopied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3 text-slate-400 group-hover/btn:text-slate-700 transition-colors" />
                                )}
                              </button>
                            </div>

                            {/* Original destination URL */}
                            <div className="mt-1 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 truncate">
                              <span className="truncate max-w-[280px] sm:max-w-sm">
                                {link.originalUrl}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Clicks & Velocity (tabular numerals) */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                            {link.clicks.toLocaleString()}
                          </span>
                          {/* Relative click velocity bar */}
                          <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="h-full bg-slate-900 dark:bg-slate-200 rounded-full"
                              style={{ width: `${clickPercentage}%` }}
                            />
                          </div>
                          {link.clickLimit && (
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 tabular-nums">
                              limit: {link.clickLimit}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 3: Zero-Pill Metadata & Tags */}
                      <td className="py-3.5 px-4 align-top hidden md:table-cell">
                        <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
                          {/* Domain & Date with unboxed dot separators */}
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span>{targetDomain}</span>
                            <span aria-hidden="true">·</span>
                            <span>{new Date(link.createdAt).toLocaleDateString()}</span>
                          </div>

                          {/* Tags unboxed */}
                          {link.tags.length > 0 && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                              {link.tags.map((t, idx) => (
                                <React.Fragment key={t}>
                                  <span>#{t}</span>
                                  {idx < link.tags.length - 1 && <span>·</span>}
                                </React.Fragment>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Column 4: Actions */}
                      <td className="py-3.5 px-4 sm:px-6 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* QR Code */}
                          <button
                            onClick={() => onOpenQr(link)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Generate QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {/* Analytics */}
                          <button
                            onClick={() => onOpenAnalytics(link)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Link Analytics"
                          >
                            <MousePointerClick className="w-4 h-4" />
                          </button>

                          {/* Test Redirection */}
                          <button
                            onClick={() => onOpenRedirect(link)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Test Link Redirection"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>

                          {/* Pause/Resume Toggle */}
                          <button
                            onClick={() => handleToggleActive(link)}
                            className={`p-1.5 rounded-md transition-colors ${
                              link.isActive
                                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                : 'text-amber-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            }`}
                            title={link.isActive ? 'Pause Link' : 'Resume Link'}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {/* Delete Link */}
                          <button
                            onClick={() => {
                              if (confirm(`Delete short link "/r/${link.shortCode}"?`)) {
                                onDeleteLink(link.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete Short Link"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
