/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShortLink } from '../types/index.ts';
import { normalizeUrl, isValidUrl, generateShortCode, extractDomain } from '../utils/urlHelper.ts';
import { Copy, Check, Download, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';

interface BatchShortenerProps {
  onBatchCreated: (newLinks: ShortLink[]) => void;
  baseUrl: string;
}

export const BatchShortener: React.FC<BatchShortenerProps> = ({ onBatchCreated, baseUrl }) => {
  const [inputText, setInputText] = useState(
    'https://github.com/trending\nhttps://news.ycombinator.com\nhttps://developer.mozilla.org/en-US/'
  );
  const [batchTag, setBatchTag] = useState('Batch');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedList, setGeneratedList] = useState<ShortLink[]>([]);
  const [copiedAll, setCopiedAll] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleProcess = () => {
    setErrorMsg('');
    const lines = inputText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setErrorMsg('Please enter at least one URL.');
      return;
    }

    if (lines.length > 50) {
      setErrorMsg('Maximum 50 URLs per batch.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const results: ShortLink[] = [];
      const timestamp = new Date().toISOString();

      lines.forEach((line) => {
        const cleaned = normalizeUrl(line);
        if (isValidUrl(cleaned)) {
          const code = generateShortCode(6);
          const domain = extractDomain(cleaned);
          results.push({
            id: `batch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            shortCode: code,
            originalUrl: cleaned,
            title: domain,
            createdAt: timestamp,
            clicks: 0,
            tags: batchTag.trim() ? [batchTag.trim()] : ['Batch'],
            isActive: true,
          });
        }
      });

      if (results.length === 0) {
        setErrorMsg('No valid URLs found in input.');
        setIsProcessing(false);
        return;
      }

      onBatchCreated(results);
      setGeneratedList(results);
      setIsProcessing(false);
    }, 400);
  };

  const handleCopyAll = () => {
    const text = generatedList.map((l) => `${baseUrl}/r/${l.shortCode}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadCsv = () => {
    const headers = ['Original URL', 'Short URL', 'Short Code', 'Domain'];
    const rows = generatedList.map((l) => [
      `"${l.originalUrl}"`,
      `"${baseUrl}/r/${l.shortCode}"`,
      `"${l.shortCode}"`,
      `"${extractDomain(l.originalUrl)}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_sniplinks_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Batch URL Shortener
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Shorten dozens of links simultaneously. Enter one URL per line.
          </p>
        </div>

        {/* Input Textarea & Batch Tag */}
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              URL List (One link per line)
            </label>
            <textarea
              rows={6}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="https://example.com/one&#10;https://example.com/two&#10;https://example.com/three"
              className="w-full p-3 font-mono text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Batch Tag:
              </span>
              <input
                type="text"
                value={batchTag}
                onChange={(e) => setBatchTag(e.target.value)}
                placeholder="e.g. Newsletter"
                className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <button
              onClick={handleProcess}
              disabled={isProcessing}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50"
            >
              <Layers className="w-4 h-4" />
              <span>{isProcessing ? 'Processing batch...' : 'Process & Shorten Batch'}</span>
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {errorMsg}
            </p>
          )}
        </div>

        {/* Results Container */}
        {generatedList.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Successfully generated {generatedList.length} short links
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAll ? 'All Copied' : 'Copy All Short URLs'}</span>
                </button>

                <button
                  onClick={handleDownloadCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            {/* Generated results mini table */}
            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              {generatedList.map((link) => (
                <div key={link.id} className="p-2.5 flex items-center justify-between text-xs gap-3">
                  <div className="truncate flex-1">
                    <span className="font-mono text-slate-900 dark:text-white font-semibold">
                      {baseUrl}/r/{link.shortCode}
                    </span>
                    <span className="text-slate-400 block truncate text-[11px] mt-0.5">
                      → {link.originalUrl}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${baseUrl}/r/${link.shortCode}`);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                    title="Copy this link"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
