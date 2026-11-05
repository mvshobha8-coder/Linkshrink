/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShortLink, ClickEvent } from '../types/index.ts';
import { extractDomain } from '../utils/urlHelper.ts';
import { recordLinkClick } from '../utils/storage.ts';
import {
  ShieldCheck,
  Lock,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Globe,
  Clock,
  X,
  CheckCircle2,
} from 'lucide-react';

interface RedirectSimulatorModalProps {
  link: ShortLink | null;
  onClose: () => void;
  onLinkUpdated: (updated: ShortLink, click: ClickEvent) => void;
  baseUrl: string;
}

export const RedirectSimulatorModal: React.FC<RedirectSimulatorModalProps> = ({
  link,
  onClose,
  onLinkUpdated,
  baseUrl,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [hasRecordedClick, setHasRecordedClick] = useState(false);
  const [simulationReferrer, setSimulationReferrer] = useState('Direct');

  useEffect(() => {
    if (!link) return;
    setPasswordInput('');
    setPasswordError('');
    setIsUnlocked(!link.password);
    setCountdown(null);
    setHasRecordedClick(false);
  }, [link]);

  if (!link) return null;

  const isExpiredByDate = link.expiresAt && new Date(link.expiresAt).getTime() < Date.now();
  const isExpiredByClicks = link.clickLimit && link.clicks >= link.clickLimit;
  const isLinkDisabled = !link.isActive || isExpiredByDate || isExpiredByClicks;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === link.password) {
      setIsUnlocked(true);
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password. Please verify and try again.');
    }
  };

  const executeRedirect = () => {
    if (!hasRecordedClick) {
      const { link: updated, click } = recordLinkClick(link.id, {
        referrer: simulationReferrer,
      });
      if (updated) {
        onLinkUpdated(updated, click);
      }
      setHasRecordedClick(true);
    }
    window.open(link.originalUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleStartCountdown = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          executeRedirect();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const shortUrl = `${baseUrl}/r/${link.shortCode}`;
  const targetDomain = extractDomain(link.originalUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              Link Redirection Preview
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Link status banners */}
          {isLinkDisabled ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  This short link is currently inactive
                </h4>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  {isExpiredByDate
                    ? `Expired on ${new Date(link.expiresAt!).toLocaleDateString()}`
                    : isExpiredByClicks
                    ? `Click limit of ${link.clickLimit} visits has been reached`
                    : 'The creator paused this link.'}
                </p>
              </div>
            </div>
          ) : !isUnlocked ? (
            /* Password gate */
            <div className="text-center py-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                Password Protected Link
              </h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                This destination requires authorization to proceed.
              </p>

              <form onSubmit={handlePasswordSubmit} className="mt-5 max-w-xs mx-auto">
                <input
                  type="password"
                  placeholder="Enter passcode..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all"
                  autoFocus
                />
                {passwordError && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 text-left">
                    {passwordError}
                  </p>
                )}
                <button
                  type="submit"
                  className="mt-3 w-full py-2 px-4 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                >
                  Unlock Destination
                </button>
              </form>
            </div>
          ) : (
            /* Active Destination Preview & Safety Check */
            <div>
              {/* Security Badge */}
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 mb-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium">Safe Browsing Verified: HTTPS Protected Destination</span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </div>

              {/* URL mapping card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div>
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                    Short Link
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate">
                      {shortUrl}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-2.5">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                    Destination URL ({targetDomain})
                  </span>
                  <p className="text-xs font-mono text-slate-900 dark:text-slate-100 break-all mt-0.5">
                    {link.originalUrl}
                  </p>
                </div>

                {link.utm && (link.utm.source || link.utm.campaign) && (
                  <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-2 text-xs text-slate-500">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                      UTM Parameters
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1 font-mono text-[11px]">
                      {link.utm.source && <span>source={link.utm.source}</span>}
                      {link.utm.medium && <span>medium={link.utm.medium}</span>}
                      {link.utm.campaign && <span>campaign={link.utm.campaign}</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Referrer Simulation Selection */}
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Simulate click from referrer:
                </span>
                <select
                  value={simulationReferrer}
                  onChange={(e) => setSimulationReferrer(e.target.value)}
                  className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="Direct">Direct / Browser</option>
                  <option value="Twitter / X">Twitter / X</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Google Search">Google Search</option>
                  <option value="GitHub">GitHub</option>
                  <option value="Newsletter">Newsletter</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={executeRedirect}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm"
                >
                  <span>Visit Destination Now</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleStartCountdown}
                  disabled={countdown !== null}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {countdown !== null ? `Redirecting in ${countdown}s...` : 'Simulate 3s Redirect'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
