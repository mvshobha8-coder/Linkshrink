/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ActiveTab } from '../types/index.ts';
import { VexunoLogo } from './VexunoLogo.tsx';
import { Sun, Moon, Plus } from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onNewLinkClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  isDark,
  onToggleTheme,
  onNewLinkClick,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-6 h-14 sm:h-16">
          {/* Brand */}
          <button
            onClick={() => onTabChange('shortener')}
            className="group whitespace-nowrap shrink-0 focus:outline-none"
            aria-label="VEXUNO Home"
          >
            <VexunoLogo size="md" />
          </button>

          {/* Clean Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onTabChange('shortener')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'shortener'
                  ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Shorten
            </button>
            <button
              onClick={() => onTabChange('links')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'links'
                  ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Links
            </button>
            <button
              onClick={() => onTabChange('analytics')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'analytics'
                  ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Analytics
            </button>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Quick Action */}
            <button
              onClick={onNewLinkClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary tab bar */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-slate-100 dark:border-slate-800/60 no-scrollbar gap-1 text-xs">
          {(['shortener', 'links', 'analytics'] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`px-3 py-1 rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === tab
                  ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {tab === 'shortener' && 'Shorten'}
              {tab === 'links' && 'Links'}
              {tab === 'analytics' && 'Analytics'}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
