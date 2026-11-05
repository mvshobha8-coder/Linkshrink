/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ShortLink, SortOption } from '../types/index.ts';
import {
  Search,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Trash2,
  Power,
  Edit2,
  SlidersHorizontal,
} from 'lucide-react';

interface LinksTableProps {
  links: ShortLink[];
  onUpdateLink: (updated: ShortLink) => void;
  onDeleteLink: (linkId: string) => void;
  onOpenQr: (link: ShortLink) => void;
  onOpenRedirect: (link: ShortLink) => void;
  onOpenAnalytics: (link: ShortLink) => void;
  baseDomain: string;
}

export const LinksTable: React.FC<LinksTableProps> = ({
  links,
  onUpdateLink,
  onDeleteLink,
  onOpenQr,
  onOpenRedirect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');

  const filteredLinks = useMemo(() => {
    return links
      .filter((link) => {
        const q = searchQuery.toLowerCase().trim();
        return (
          !q ||
          link.title.toLowerCase().includes(q) ||
          link.shortCode.toLowerCase().includes(q) ||
          link.originalUrl.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === 'most_clicks') return b.clicks - a.clicks;
        if (sortBy === 'least_clicks') return a.clicks - b.clicks;
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return 0;
      });
  }, [links, searchQuery, sortBy]);

  const handleCopy = (link: ShortLink) => {
    navigator.clipboard.writeText(link.shortUrl);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleActive = (link: ShortLink) => {
    onUpdateLink({
      ...link,
      isActive: !link.isActive,
    });
  };

  const startEditTitle = (link: ShortLink) => {
    setEditingId(link.id);
    setEditTitleInput(link.title);
  };

  const saveEditTitle = (link: ShortLink) => {
    if (editTitleInput.trim()) {
      onUpdateLink({ ...link, title: editTitleInput.trim() });
    }
    setEditingId(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Top Search & Sort */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none text-slate-900 dark:text-white"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none shrink-0"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="most_clicks">Most Clicks</option>
          <option value="title">Alphabetical</option>
        </select>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
        {filteredLinks.length === 0 ? (
          <div className="p-12 text-center">
            <SlidersHorizontal className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {searchQuery ? 'No links found matching your search.' : 'No short links created yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                  <th className="py-3 px-4 sm:px-6">Link</th>
                  <th className="py-3 px-4 text-right">Clicks</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Date</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLinks.map((link) => {
                  const isCopied = copiedId === link.id;

                  return (
                    <tr
                      key={link.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Short Link & Target */}
                      <td className="py-3.5 px-4 sm:px-6 align-top max-w-xs sm:max-w-md">
                        <div className="flex flex-col">
                          {editingId === link.id ? (
                            <div className="flex items-center gap-2 mb-1">
                              <input
                                type="text"
                                value={editTitleInput}
                                onChange={(e) => setEditTitleInput(e.target.value)}
                                className="px-2 py-0.5 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                autoFocus
                              />
                              <button
                                onClick={() => saveEditTitle(link)}
                                className="px-2 py-0.5 text-xs bg-slate-900 text-white rounded font-medium"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                {link.title || link.shortCode}
                              </span>
                              <button
                                onClick={() => startEditTitle(link)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Edit Title"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => handleCopy(link)}
                            className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white truncate text-left mt-0.5"
                            title="Click to copy"
                          >
                            <span className="truncate">{link.shortUrl}</span>
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400 shrink-0" />
                            )}
                          </button>

                          <span className="text-[11px] text-slate-400 truncate max-w-sm mt-0.5">
                            {link.originalUrl}
                          </span>
                        </div>
                      </td>

                      {/* Clicks */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white tabular-nums">
                          {link.clicks.toLocaleString()}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 align-top hidden sm:table-cell text-xs text-slate-400 whitespace-nowrap">
                        {new Date(link.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenQr(link)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenRedirect(link)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Visit"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleActive(link)}
                            className={`p-1.5 rounded-md transition-colors ${
                              link.isActive
                                ? 'text-slate-400 hover:text-amber-600'
                                : 'text-amber-500 hover:text-emerald-600'
                            }`}
                            title={link.isActive ? 'Pause' : 'Resume'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm('Delete this link?')) {
                                onDeleteLink(link.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
