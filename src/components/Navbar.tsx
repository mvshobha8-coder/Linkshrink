/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ActiveTab } from '../types/index.ts';
import { Link2, Sun, Moon, Plus } from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onNewLinkClick: () => void;
  totalLinksCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  isDark,
  onToggleTheme,
  onNewLinkClick,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <button
            onClick={() => onTabChange('shortener')}
            className="flex items-center gap-2.5 text-left group whitespace-nowrap shrink-0 focus:outline-none"
            aria-label="LinkShrink Home"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Link2 className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                LinkShrink
              </span>
            </div>
          </button>

          {/* Zone 2: 4-5 single-line clean text navigation links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onTabChange('shortener')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'shortener'
                  ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Shortener
            </button>
            <button
              onClick={() => onTabChange('links')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'links'
                  ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              My Links
            </button>
            <button
              onClick={() => onTabChange('analytics')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'analytics'
                  ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => onTabChange('utm')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'utm'
                  ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              UTM Builder
            </button>
            <button
              onClick={() => onTabChange('batch')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'batch'
                  ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Batch Mode
            </button>
          </nav>

          {/* Zone 3: 1 primary action & theme switch */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onToggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onNewLinkClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm whitespace-nowrap shrink-0 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Link</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary tab bar */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-slate-100 dark:border-slate-800/60 no-scrollbar gap-1">
          {(['shortener', 'links', 'analytics', 'utm', 'batch'] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === tab
                  ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {tab === 'shortener' && 'Shortener'}
              {tab === 'links' && 'My Links'}
              {tab === 'analytics' && 'Analytics'}
              {tab === 'utm' && 'UTM Builder'}
              {tab === 'batch' && 'Batch Mode'}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
