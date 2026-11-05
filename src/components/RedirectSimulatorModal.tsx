/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShortLink, ClickEvent } from '../types/index.ts';
import { recordRealLinkClick } from '../utils/storage.ts';
import { Lock, ExternalLink, X, ArrowRight } from 'lucide-react';

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
  const [hasRecordedClick, setHasRecordedClick] = useState(false);

  useEffect(() => {
    if (!link) return;
    setPasswordInput('');
    setPasswordError('');
    setIsUnlocked(!link.password);
    setHasRecordedClick(false);
  }, [link]);

  if (!link) return null;

  const isExpired =
    (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) ||
    (link.clickLimit && link.clicks >= link.clickLimit) ||
    !link.isActive;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === link.password) {
      setIsUnlocked(true);
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password.');
    }
  };

  const executeRedirect = () => {
    if (!hasRecordedClick) {
      const { link: updated, click } = recordRealLinkClick(link.id);
      if (updated) {
        onLinkUpdated(updated, click);
      }
      setHasRecordedClick(true);
    }
    window.open(link.originalUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Link Redirection
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isExpired ? (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-center">
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
              This link is inactive or expired.
            </p>
          </div>
        ) : !isUnlocked ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-3 py-2 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-600 dark:text-slate-300">
              <Lock className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500">
              This link is password protected.
            </p>
            <input
              type="password"
              placeholder="Enter passcode..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none text-slate-900 dark:text-white"
              autoFocus
            />
            {passwordError && (
              <p className="text-xs text-rose-500">{passwordError}</p>
            )}
            <button
              type="submit"
              className="w-full py-2 px-3 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg"
            >
              Unlock Link
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[11px] text-slate-400 block mb-1">Destination</span>
              <p className="text-xs font-mono text-slate-800 dark:text-slate-200 break-all">
                {link.originalUrl}
              </p>
            </div>

            <button
              onClick={executeRedirect}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              <span>Continue to Destination</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
