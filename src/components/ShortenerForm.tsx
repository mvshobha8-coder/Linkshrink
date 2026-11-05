/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShortLink, BackendConfig } from '../types/index.ts';
import {
  sanitizeAndValidateUrl,
  generateShortCode,
  cleanCustomAlias,
  validateCustomAlias,
  extractDomain,
} from '../utils/urlHelper.ts';
import { shortenWithTinyUrl, shortenWithCustomBackend } from '../services/shortenerService.ts';
import {
  Link2,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Lock,
  Calendar,
  Share2,
  ArrowRight,
} from 'lucide-react';

interface ShortenerFormProps {
  onLinkCreated: (link: ShortLink) => void;
  existingLinks: ShortLink[];
  baseDomain: string;
  backendConfig: BackendConfig;
  onOpenQr: (link: ShortLink) => void;
  onOpenRedirect: (link: ShortLink) => void;
  onOpenAnalytics: (link: ShortLink) => void;
  initialUrl?: string;
}

export const ShortenerForm: React.FC<ShortenerFormProps> = ({
  onLinkCreated,
  existingLinks,
  baseDomain,
  backendConfig,
  onOpenQr,
  onOpenRedirect,
  initialUrl = '',
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [customAlias, setCustomAlias] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  // Submission & Result state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdLink, setCreatedLink] = useState<ShortLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setErrorMsg('');
      }
    } catch {
      // Permission denied
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const validation = sanitizeAndValidateUrl(url);
    if (!validation.isValid) {
      setErrorMsg(validation.error || 'Please enter a valid website URL.');
      return;
    }

    const cleanUrl = validation.normalizedUrl;

    let finalCode = '';
    const existingCodes = existingLinks.map((l) => l.shortCode);
    if (customAlias.trim()) {
      const aliasCheck = validateCustomAlias(customAlias, existingCodes);
      if (!aliasCheck.isValid) {
        setErrorMsg(aliasCheck.error || 'Invalid custom alias.');
        return;
      }
      finalCode = cleanCustomAlias(customAlias);
    } else {
      finalCode = generateShortCode(6);
    }

    setIsSubmitting(true);

    try {
      let finalShortUrl = '';
      let provider: ShortLink['provider'] = 'vexuno_direct';

      if (backendConfig.enabled && backendConfig.apiUrl) {
        const res = await shortenWithCustomBackend(cleanUrl, finalCode, backendConfig, baseDomain);
        finalShortUrl = res.shortUrl;
        provider = res.provider;
        finalCode = res.shortCode;
      } else {
        // Automatic global URL creation with direct fallback
        const res = await shortenWithTinyUrl(cleanUrl, finalCode, baseDomain);
        finalShortUrl = res.shortUrl;
        provider = res.provider;
        finalCode = res.shortCode;
      }

      const newLink: ShortLink = {
        id: `lnk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        shortCode: finalCode,
        originalUrl: cleanUrl,
        shortUrl: finalShortUrl,
        provider,
        title: extractDomain(cleanUrl),
        createdAt: new Date().toISOString(),
        clicks: 0,
        tags: [],
        isActive: true,
        password: password.trim() ? password.trim() : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      };

      onLinkCreated(newLink);
      setCreatedLink(newLink);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create short link.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!createdLink) return;
    navigator.clipboard.writeText(createdLink.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!createdLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: createdLink.title || 'VEXUNO Short Link',
          url: createdLink.shortUrl,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleReset = () => {
    setUrl('');
    setCustomAlias('');
    setPassword('');
    setExpiresAt('');
    setShowOptions(false);
    setCreatedLink(null);
    setErrorMsg('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-6 sm:py-12">
      {/* Centered Heading */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Shorten Your Links
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Paste any long URL to create a clean, shareable short link instantly.
        </p>
      </div>

      {createdLink ? (
        /* Result Box */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center gap-3 truncate">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Link2 className="w-4 h-4" />
              </div>
              <span className="font-mono text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                {createdLink.shortUrl}
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shrink-0 shadow-xs active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span className="truncate max-w-sm">
              Destination: <strong className="text-slate-700 dark:text-slate-300 font-normal">{createdLink.originalUrl}</strong>
            </span>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenQr(createdLink)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Code</span>
              </button>

              <button
                onClick={() => onOpenRedirect(createdLink)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Visit Link</span>
              </button>

              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{shared ? 'Shared' : 'Share'}</span>
              </button>
            </div>

            <button
              onClick={handleReset}
              className="text-xs font-semibold text-slate-900 dark:text-white hover:underline"
            >
              Shorten another link →
            </button>
          </div>
        </div>
      ) : (
        /* The Clean URL Input Form */
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                placeholder="Paste your long link here..."
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className="w-full px-4 py-3 text-sm bg-transparent border-0 focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                autoFocus
              />
              {!url && (
                <button
                  type="button"
                  onClick={handlePaste}
                  className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mr-2"
                >
                  Paste
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !url.trim()}
              className="px-6 py-3 text-sm font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center justify-center gap-2 active:scale-95"
            >
              <span>{isSubmitting ? 'Shortening...' : 'Shorten'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium px-2">
              {errorMsg}
            </p>
          )}

          {/* Clean Expandable Options */}
          <div className="pt-1 px-1">
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <span>Custom alias & protection</span>
              {showOptions ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showOptions && (
              <div className="mt-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Custom Alias
                  </label>
                  <input
                    type="text"
                    placeholder="my-link"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(cleanCustomAlias(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Passcode (Optional)</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Secret passcode"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Expiry Date (Optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  );
};
