/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShortLink } from '../types/index.ts';
import {
  normalizeUrl,
  isValidUrl,
  generateShortCode,
  cleanCustomAlias,
  extractDomain,
} from '../utils/urlHelper.ts';
import {
  Link2,
  Copy,
  Check,
  QrCode,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lock,
  Calendar,
  MousePointerClick,
  Tag,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface ShortenerFormProps {
  onLinkCreated: (link: ShortLink) => void;
  existingLinks: ShortLink[];
  baseUrl: string;
  onOpenQr: (link: ShortLink) => void;
  onOpenRedirect: (link: ShortLink) => void;
  onOpenAnalytics: (link: ShortLink) => void;
  initialUrl?: string;
  initialUtm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
}

export const ShortenerForm: React.FC<ShortenerFormProps> = ({
  onLinkCreated,
  existingLinks,
  baseUrl,
  onOpenQr,
  onOpenRedirect,
  onOpenAnalytics,
  initialUrl = '',
  initialUtm,
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [customAlias, setCustomAlias] = useState('');
  const [title, setTitle] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced fields
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [clickLimit, setClickLimit] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Submission & Result state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdLink, setCreatedLink] = useState<ShortLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const PRESET_TAGS = ['Marketing', 'Social', 'Engineering', 'Internal', 'Docs', 'Campaign'];

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setErrorMsg('');
      }
    } catch {
      // Ignore clipboard read denial
    }
  };

  const handleTogglePresetTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const cleaned = tagInput.trim();
      if (!tags.includes(cleaned)) {
        setTags([...tags, cleaned]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!url.trim()) {
      setErrorMsg('Please enter a destination URL.');
      return;
    }

    if (!isValidUrl(url)) {
      setErrorMsg('Please enter a valid website URL (e.g. example.com).');
      return;
    }

    const cleanedUrl = normalizeUrl(url);

    // Validate custom alias if provided
    let shortCode = '';
    if (customAlias.trim()) {
      const alias = cleanCustomAlias(customAlias);
      if (alias.length < 3) {
        setErrorMsg('Custom alias must be at least 3 characters.');
        return;
      }
      const isTaken = existingLinks.some(
        (l) => l.shortCode.toLowerCase() === alias.toLowerCase()
      );
      if (isTaken) {
        setErrorMsg(`The alias "${alias}" is already taken. Please choose another.`);
        return;
      }
      shortCode = alias;
    } else {
      shortCode = generateShortCode(6);
    }

    if (enablePassword && !password.trim()) {
      setErrorMsg('Please enter a passcode for password protection, or uncheck the option.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const newLink: ShortLink = {
        id: `link_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        shortCode,
        originalUrl: cleanedUrl,
        title: title.trim() || extractDomain(cleanedUrl),
        createdAt: new Date().toISOString(),
        clicks: 0,
        tags: tags.length > 0 ? tags : ['General'],
        isActive: true,
        password: enablePassword && password.trim() ? password.trim() : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        clickLimit: clickLimit ? parseInt(clickLimit, 10) : undefined,
        utm: initialUtm,
      };

      onLinkCreated(newLink);
      setCreatedLink(newLink);
      setIsSubmitting(false);
    }, 250);
  };

  const handleCopy = () => {
    if (!createdLink) return;
    const fullUrl = `${baseUrl}/r/${createdLink.shortCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setUrl('');
    setCustomAlias('');
    setTitle('');
    setShowAdvanced(false);
    setEnablePassword(false);
    setPassword('');
    setExpiresAt('');
    setClickLimit('');
    setTags([]);
    setCreatedLink(null);
    setErrorMsg('');
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Shorten Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Shorten a long link
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create fast, secure short URLs with custom aliases, password protection, and live analytics.
          </p>
        </div>

        {createdLink ? (
          /* Result Success Card */
          <div className="space-y-6">
            <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                <span>Created Short URL</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Active & Ready
                </span>
              </div>

              {/* Short Link Display & Copy Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 truncate">
                  <Link2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-mono text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate">
                    {baseUrl}/r/{createdLink.shortCode}
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>

              {/* Destination preview info */}
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="truncate max-w-sm sm:max-w-md">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Target: </span>
                  <span className="truncate">{createdLink.originalUrl}</span>
                </div>
                <span className="shrink-0">{extractDomain(createdLink.originalUrl)}</span>
              </div>
            </div>

            {/* Next actions toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onOpenQr(createdLink)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <QrCode className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span>QR Code</span>
              </button>

              <button
                onClick={() => onOpenRedirect(createdLink)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span>Test Redirection</span>
              </button>

              <button
                onClick={() => onOpenAnalytics(createdLink)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <MousePointerClick className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span>View Analytics</span>
              </button>

              <button
                onClick={handleReset}
                className="ml-auto text-xs font-semibold text-slate-900 dark:text-white hover:underline py-2"
              >
                Shorten another link →
              </button>
            </div>
          </div>
        ) : (
          /* Form Input View */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Long URL Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Destination URL <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="https://yourlongurl.com/campaign/launch-2026?utm_source=..."
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className="w-full pl-3.5 pr-20 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                {!url && (
                  <button
                    type="button"
                    onClick={handlePaste}
                    className="absolute right-2 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700 rounded-md transition-colors"
                  >
                    Paste
                  </button>
                )}
              </div>
            </div>

            {/* Custom Alias & Optional Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Custom Alias (Optional)
                </label>
                <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-slate-900 dark:focus-within:ring-white">
                  <span className="pl-3 pr-1 text-xs text-slate-400 font-mono select-none whitespace-nowrap">
                    {extractDomain(baseUrl) || 'linkshrink.kesug.com'}/r/
                  </span>
                  <input
                    type="text"
                    placeholder="my-link"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(cleanCustomAlias(e.target.value))}
                    className="w-full py-2.5 pr-3 text-sm bg-transparent focus:outline-none text-slate-900 dark:text-white font-mono placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Title or Label (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q4 Growth Deck"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Expandable Advanced Options */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Advanced Options (Passcode, Expiration, Tags)</span>
                {showAdvanced ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showAdvanced && (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-4">
                  {/* Password Protection */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enablePassword}
                          onChange={(e) => setEnablePassword(e.target.checked)}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                        <span className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          Protect with passcode
                        </span>
                      </label>
                    </div>

                    {enablePassword && (
                      <input
                        type="password"
                        placeholder="Enter link password..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full max-w-sm px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    )}
                  </div>

                  {/* Expiration & Click Limit */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Expiration Date
                      </label>
                      <input
                        type="datetime-local"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                        <MousePointerClick className="w-3.5 h-3.5 text-slate-400" />
                        Click Limit (Max visits)
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 500"
                        value={clickLimit}
                        onChange={(e) => setClickLimit(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      Tags & Categories
                    </label>

                    {/* Preset tag pills (interactive functional buttons) */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {PRESET_TAGS.map((tag) => {
                        const isSelected = tags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleTogglePresetTag(tag)}
                            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                              isSelected
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom tag input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Type custom tag & press Enter..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddCustomTag}
                        className="w-full max-w-xs px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    {/* Active tags list */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-slate-500">
                        <span>Selected:</span>
                        {tags.map((t) => (
                          <span
                            key={t}
                            onClick={() => handleRemoveTag(t)}
                            className="cursor-pointer text-slate-700 dark:text-slate-300 hover:text-rose-500"
                            title="Click to remove"
                          >
                            #{t} &times;
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {errorMsg}
              </p>
            )}

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 text-sm font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Generating link...' : 'Shorten URL'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
