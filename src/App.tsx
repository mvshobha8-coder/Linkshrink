/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShortLink, ClickEvent, ActiveTab, BackendConfig } from './types/index.ts';
import {
  loadLinks,
  saveLinks,
  loadClicks,
  loadBackendConfig,
} from './utils/storage.ts';
import { Navbar } from './components/Navbar.tsx';
import { ShortenerForm } from './components/ShortenerForm.tsx';
import { LinksTable } from './components/LinksTable.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { QrCodeModal } from './components/QrCodeModal.tsx';
import { RedirectSimulatorModal } from './components/RedirectSimulatorModal.tsx';

export default function App() {
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [clicks, setClicks] = useState<ClickEvent[]>([]);
  const [backendConfig, setBackendConfig] = useState<BackendConfig>(loadBackendConfig());
  const [activeTab, setActiveTab] = useState<ActiveTab>('shortener');
  const [isDark, setIsDark] = useState<boolean>(false);

  // Modals state
  const [qrModalLink, setQrModalLink] = useState<ShortLink | null>(null);
  const [redirectModalLink, setRedirectModalLink] = useState<ShortLink | null>(null);
  const [analyticsLinkId, setAnalyticsLinkId] = useState<string | null>(null);

  // Prefilled Shortener data
  const [prefilledUrl, setPrefilledUrl] = useState('');

  // Base domain computation (relative & absolute for GitHub Pages)
  const [baseDomain, setBaseDomain] = useState('');

  // Initial Data & Theme Setup
  useEffect(() => {
    const loadedLinks = loadLinks();
    const loadedClicks = loadClicks();
    const loadedConfig = loadBackendConfig();
    setLinks(loadedLinks);
    setClicks(loadedClicks);
    setBackendConfig(loadedConfig);

    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const pathname = window.location.pathname.replace(/\/404\.html$/, '/');
      const fullBase = `${origin}${pathname.endsWith('/') ? pathname : pathname + '/'}`;
      setBaseDomain(fullBase);

      const savedTheme = localStorage.getItem('vexuno_theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialDark = savedTheme ? savedTheme === 'dark' : prefersDark;
      setIsDark(initialDark);
      if (initialDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Check if URL has hash route e.g. #r/code or path /r/code
      const hash = window.location.hash;
      const path = window.location.pathname;
      const match = hash.match(/#\/?r\/([a-zA-Z0-9-_]+)/) || path.match(/\/r\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        const found = loadedLinks.find(
          (l) => l.shortCode.toLowerCase() === match[1].toLowerCase()
        );
        if (found) {
          setRedirectModalLink(found);
        }
      }
    }
  }, []);

  const handleToggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('vexuno_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('vexuno_theme', 'light');
    }
  };

  const handleLinkCreated = (newLink: ShortLink) => {
    const nextLinks = [newLink, ...links];
    setLinks(nextLinks);
    saveLinks(nextLinks);
  };

  const handleUpdateLink = (updated: ShortLink) => {
    const nextLinks = links.map((l) => (l.id === updated.id ? updated : l));
    setLinks(nextLinks);
    saveLinks(nextLinks);
  };

  const handleDeleteLink = (linkId: string) => {
    const nextLinks = links.filter((l) => l.id !== linkId);
    setLinks(nextLinks);
    saveLinks(nextLinks);
  };

  const handleLinkUpdatedFromRedirect = (updated: ShortLink, click: ClickEvent) => {
    handleUpdateLink(updated);
    setClicks((prev) => [click, ...prev]);
  };

  const handleOpenAnalyticsForLink = (link: ShortLink) => {
    setAnalyticsLinkId(link.id);
    setActiveTab('analytics');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-slate-950">
      {/* Clean Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        onNewLinkClick={() => {
          setPrefilledUrl('');
          setActiveTab('shortener');
        }}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'shortener' && (
          <ShortenerForm
            onLinkCreated={handleLinkCreated}
            existingLinks={links}
            baseDomain={baseDomain}
            backendConfig={backendConfig}
            onOpenQr={(link) => setQrModalLink(link)}
            onOpenRedirect={(link) => setRedirectModalLink(link)}
            onOpenAnalytics={handleOpenAnalyticsForLink}
            initialUrl={prefilledUrl}
          />
        )}

        {activeTab === 'links' && (
          <LinksTable
            links={links}
            onUpdateLink={handleUpdateLink}
            onDeleteLink={handleDeleteLink}
            onOpenQr={(link) => setQrModalLink(link)}
            onOpenRedirect={(link) => setRedirectModalLink(link)}
            onOpenAnalytics={handleOpenAnalyticsForLink}
            baseDomain={baseDomain}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            links={links}
            clicks={clicks}
            selectedLinkId={analyticsLinkId}
            onSelectLink={(id) => setAnalyticsLinkId(id)}
            onOpenQr={(link) => setQrModalLink(link)}
            onOpenRedirect={(link) => setRedirectModalLink(link)}
          />
        )}
      </main>

      {/* QR Code Modal */}
      {qrModalLink && (
        <QrCodeModal
          link={qrModalLink}
          onClose={() => setQrModalLink(null)}
          baseUrl={baseDomain}
        />
      )}

      {/* Redirect Simulator Modal */}
      {redirectModalLink && (
        <RedirectSimulatorModal
          link={redirectModalLink}
          onClose={() => setRedirectModalLink(null)}
          onLinkUpdated={handleLinkUpdatedFromRedirect}
          baseUrl={baseDomain}
        />
      )}

      {/* Clean Minimal Footer */}
      <footer className="border-t border-slate-200/60 dark:border-slate-800/60 py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
          <span>VEXUNO</span>
        </div>
      </footer>
    </div>
  );
}
