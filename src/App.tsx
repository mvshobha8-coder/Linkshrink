/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShortLink, ClickEvent, ActiveTab } from './types/index.ts';
import {
  loadLinks,
  saveLinks,
  loadClicks,
  saveClicks,
  resetToDefaults,
} from './utils/storage.ts';
import { Navbar } from './components/Navbar.tsx';
import { ShortenerForm } from './components/ShortenerForm.tsx';
import { LinksTable } from './components/LinksTable.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { UtmBuilder } from './components/UtmBuilder.tsx';
import { BatchShortener } from './components/BatchShortener.tsx';
import { QrCodeModal } from './components/QrCodeModal.tsx';
import { RedirectSimulatorModal } from './components/RedirectSimulatorModal.tsx';
import { Link2, ShieldCheck, Zap, Globe, Sparkles } from 'lucide-react';

export default function App() {
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [clicks, setClicks] = useState<ClickEvent[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('shortener');
  const [isDark, setIsDark] = useState<boolean>(false);

  // Modals state
  const [qrModalLink, setQrModalLink] = useState<ShortLink | null>(null);
  const [redirectModalLink, setRedirectModalLink] = useState<ShortLink | null>(null);
  const [analyticsLinkId, setAnalyticsLinkId] = useState<string | null>(null);

  // Prefilled Shortener data from UTM builder or Quick action
  const [prefilledUrl, setPrefilledUrl] = useState('');
  const [prefilledUtm, setPrefilledUtm] = useState<ShortLink['utm'] | undefined>(undefined);

  // Base Domain (defaults to linkshrink.kesug.com as requested)
  const [baseUrl, setBaseUrl] = useState('https://linkshrink.kesug.com');
  const [availableDomains, setAvailableDomains] = useState<string[]>([
    'https://linkshrink.kesug.com',
  ]);

  // Initial Data & Theme Setup
  useEffect(() => {
    const loadedLinks = loadLinks();
    const loadedClicks = loadClicks();
    setLinks(loadedLinks);
    setClicks(loadedClicks);

    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      if (origin && origin !== 'https://linkshrink.kesug.com') {
        setAvailableDomains(['https://linkshrink.kesug.com', origin]);
      }

      // Check dark mode preference or localStorage
      const savedTheme = localStorage.getItem('linkshrink_theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialDark = savedTheme ? savedTheme === 'dark' : prefersDark;
      setIsDark(initialDark);
      if (initialDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Check if URL has /r/code in pathname or hash to trigger direct redirection simulator
      const path = window.location.pathname;
      const hash = window.location.hash;
      const match = path.match(/\/r\/([a-zA-Z0-9-_]+)/) || hash.match(/#r\/([a-zA-Z0-9-_]+)/);
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
      localStorage.setItem('linkshrink_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('linkshrink_theme', 'light');
    }
  };

  const handleLinkCreated = (newLink: ShortLink) => {
    const nextLinks = [newLink, ...links];
    setLinks(nextLinks);
    saveLinks(nextLinks);
  };

  const handleBatchCreated = (newLinks: ShortLink[]) => {
    const nextLinks = [...newLinks, ...links];
    setLinks(nextLinks);
    saveLinks(nextLinks);
    setActiveTab('links');
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

  const handleResetData = () => {
    if (confirm('Restore sample demonstration links and click telemetry?')) {
      const { links: restoredLinks, clicks: restoredClicks } = resetToDefaults();
      setLinks(restoredLinks);
      setClicks(restoredClicks);
    }
  };

  const handleLinkUpdatedFromRedirect = (updated: ShortLink, click: ClickEvent) => {
    handleUpdateLink(updated);
    setClicks((prev) => [click, ...prev]);
  };

  const handleSendFromUtm = (
    urlWithUtm: string,
    utmData: {
      source: string;
      medium: string;
      campaign: string;
      term: string;
      content: string;
    }
  ) => {
    setPrefilledUrl(urlWithUtm);
    setPrefilledUtm(utmData);
    setActiveTab('shortener');
  };

  const handleOpenAnalyticsForLink = (link: ShortLink) => {
    setAnalyticsLinkId(link.id);
    setActiveTab('analytics');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* 3-Zone Top Navigation Contract */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'analytics' && analyticsLinkId) {
            // Keep selected link or reset on deliberate tab click
          }
        }}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        onNewLinkClick={() => {
          setPrefilledUrl('');
          setPrefilledUtm(undefined);
          setActiveTab('shortener');
        }}
        totalLinksCount={links.length}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {activeTab === 'shortener' && (
          <div className="space-y-10">
            <ShortenerForm
              onLinkCreated={handleLinkCreated}
              existingLinks={links}
              baseUrl={baseUrl}
              onOpenQr={(link) => setQrModalLink(link)}
              onOpenRedirect={(link) => setRedirectModalLink(link)}
              onOpenAnalytics={handleOpenAnalyticsForLink}
              initialUrl={prefilledUrl}
              initialUtm={prefilledUtm}
            />

            {/* Feature Highlights Section */}
            <div className="max-w-4xl mx-auto pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-800 dark:text-slate-200">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Instant Redirection
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      High-throughput redirect endpoints with sub-10ms routing simulation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-800 dark:text-slate-200">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Protected & Ephemeral
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Optional passcode verification, auto-expiration, and visit caps.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-800 dark:text-slate-200">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Traffic Intelligence
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Monitor referrers, geographic origins, and device telemetry in real time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'links' && (
          <LinksTable
            links={links}
            onUpdateLink={handleUpdateLink}
            onDeleteLink={handleDeleteLink}
            onOpenQr={(link) => setQrModalLink(link)}
            onOpenRedirect={(link) => setRedirectModalLink(link)}
            onOpenAnalytics={handleOpenAnalyticsForLink}
            onResetData={handleResetData}
            baseUrl={baseUrl}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            links={links}
            clicks={clicks}
            selectedLinkId={analyticsLinkId}
            onSelectLink={(id) => setAnalyticsLinkId(id)}
          />
        )}

        {activeTab === 'utm' && (
          <UtmBuilder onSendToShortener={handleSendFromUtm} />
        )}

        {activeTab === 'batch' && (
          <BatchShortener onBatchCreated={handleBatchCreated} baseUrl={baseUrl} />
        )}
      </main>

      {/* QR Code Modal */}
      {qrModalLink && (
        <QrCodeModal
          link={qrModalLink}
          onClose={() => setQrModalLink(null)}
          baseUrl={baseUrl}
        />
      )}

      {/* Redirect Simulator Modal */}
      {redirectModalLink && (
        <RedirectSimulatorModal
          link={redirectModalLink}
          onClose={() => setRedirectModalLink(null)}
          onLinkUpdated={handleLinkUpdatedFromRedirect}
          baseUrl={baseUrl}
        />
      )}

      {/* Clean quiet footer adhering to constitution (§1.B anti-slop rules) */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">LinkShrink</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-600 dark:text-slate-400">linkshrink.kesug.com</span>
            <span aria-hidden="true">·</span>
            <span>URL Management & Telemetry</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono tabular-nums">{links.length} Active Links</span>
            <span aria-hidden="true">·</span>
            <span>Local Encrypted Storage</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
