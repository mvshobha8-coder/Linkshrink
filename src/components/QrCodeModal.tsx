/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { ShortLink } from '../types/index.ts';
import { X, Download, Copy, Check, ExternalLink } from 'lucide-react';

interface QrCodeModalProps {
  link: ShortLink | null;
  onClose: () => void;
  baseUrl: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ link, onClose, baseUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fgColor, setFgColor] = useState('#0f172a');
  const [bgColor] = useState('#ffffff');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fullShortUrl = link ? (link.shortUrl || `${baseUrl}/r/${link.shortCode}`) : '';

  useEffect(() => {
    if (!link || !canvasRef.current) return;

    QRCode.toCanvas(
      canvasRef.current,
      fullShortUrl,
      {
        width: 320,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
      },
      (err) => {
        if (err) console.error('QR code generation failed', err);
      }
    );
  }, [link, fullShortUrl, fgColor, bgColor]);

  if (!link) return null;

  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    setDownloading(true);
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `vexuno_qr_${link.shortCode}.png`;
    a.click();
    setTimeout(() => setDownloading(false), 800);
  };

  const handleDownloadSvg = async () => {
    try {
      const svgString = await QRCode.toString(fullShortUrl, {
        type: 'svg',
        color: { dark: fgColor, light: bgColor },
        margin: 2,
      });
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr_${link.shortCode}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullShortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              QR Code
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
              {link.title || link.shortCode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">
          {/* QR Canvas Container */}
          <div className="p-4 bg-white rounded-xl shadow-xs border border-slate-100 flex items-center justify-center">
            <canvas ref={canvasRef} className="rounded-lg max-w-full h-auto" />
          </div>

          {/* Color Palettes */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mr-1">
              Color:
            </span>
            {[
              { color: '#0f172a', name: 'Slate' },
              { color: '#2563eb', name: 'Blue' },
              { color: '#059669', name: 'Emerald' },
              { color: '#7c3aed', name: 'Purple' },
            ].map((c) => (
              <button
                key={c.color}
                onClick={() => setFgColor(c.color)}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  fgColor === c.color
                    ? 'border-slate-900 dark:border-white scale-110'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c.color }}
                title={c.name}
              />
            ))}
          </div>

          {/* Target link display */}
          <div className="mt-5 w-full flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate">
              {fullShortUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Copy URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="mt-2 text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <span>Resolves to</span>
            <span className="font-medium text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
              {link.originalUrl}
            </span>
            <ExternalLink className="w-3 h-3 inline-block shrink-0" />
          </div>

          {/* Action buttons */}
          <div className="mt-6 w-full grid grid-cols-2 gap-3">
            <button
              onClick={handleDownloadPng}
              disabled={downloading}
              className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Exporting...' : 'Download PNG'}</span>
            </button>
            <button
              onClick={handleDownloadSvg}
              className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download SVG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
