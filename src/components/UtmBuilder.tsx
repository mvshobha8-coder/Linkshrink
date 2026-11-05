/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { appendUtmParams, isValidUrl, normalizeUrl } from '../utils/urlHelper.ts';
import { Copy, Check, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';

interface UtmBuilderProps {
  onSendToShortener: (urlWithUtm: string, utmData: {
    source: string;
    medium: string;
    campaign: string;
    term: string;
    content: string;
  }) => void;
}

export const UtmBuilder: React.FC<UtmBuilderProps> = ({ onSendToShortener }) => {
  const [websiteUrl, setWebsiteUrl] = useState('https://example.com/product');
  const [source, setSource] = useState('newsletter');
  const [medium, setMedium] = useState('email');
  const [campaign, setCampaign] = useState('winter_sale_2026');
  const [term, setTerm] = useState('');
  const [content, setContent] = useState('cta_button');
  const [copied, setCopied] = useState(false);

  const PRESETS = [
    { label: 'Google Search CPC', source: 'google', medium: 'cpc', campaign: 'brand_search' },
    { label: 'Email Newsletter', source: 'newsletter', medium: 'email', campaign: 'weekly_digest' },
    { label: 'Twitter / X Post', source: 'twitter', medium: 'social', campaign: 'product_launch' },
    { label: 'LinkedIn Post', source: 'linkedin', medium: 'social', campaign: 'thought_leadership' },
    { label: 'Product Hunt', source: 'producthunt', medium: 'referral', campaign: 'launch_day' },
  ];

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setSource(preset.source);
    setMedium(preset.medium);
    setCampaign(preset.campaign);
  };

  const finalUrl = appendUtmParams(websiteUrl, {
    source,
    medium,
    campaign,
    term,
    content,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(finalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShorten = () => {
    onSendToShortener(finalUrl, {
      source,
      medium,
      campaign,
      term,
      content,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Campaign UTM Builder
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Add tracking tags to your links for Google Analytics and convert them into clean short links.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 block mb-2">
            Quick Channel Presets:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Fields */}
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Website URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="https://example.com/landing"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Campaign Source <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. google, newsletter, twitter"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">utm_source</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Campaign Medium <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. cpc, email, social"
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">utm_medium</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Campaign Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. summer_launch"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">utm_campaign</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Campaign Term (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. running+shoes"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">utm_term (keywords)</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Campaign Content (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. top_banner, text_link"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">utm_content (A/B testing)</span>
            </div>
          </div>
        </div>

        {/* Generated Tagged URL Preview Box */}
        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Generated Tagged URL
          </span>
          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
            {finalUrl}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <button
              onClick={handleCopy}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Tagged URL'}</span>
            </button>

            <button
              onClick={handleShorten}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm"
            >
              <span>Shorten Tagged Link</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
