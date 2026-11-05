/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BackendConfig, ShortenerProvider } from '../types/index.ts';

export interface ShortenResponse {
  success: boolean;
  shortUrl: string;
  provider: ShortenerProvider;
  shortCode: string;
  error?: string;
  isFallback?: boolean;
}

/**
 * Creates a real globally accessible short URL via the TinyURL public API
 */
export async function shortenWithTinyUrl(
  originalUrl: string,
  preferredCode: string,
  baseDomain: string
): Promise<ShortenResponse> {
  try {
    const endpoint = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(originalUrl)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(endpoint, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const text = await response.text();
      const trimmed = text.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        // Extract the code from the returned tinyurl
        const parts = trimmed.split('/');
        const extractedCode = parts[parts.length - 1] || preferredCode;
        return {
          success: true,
          shortUrl: trimmed,
          provider: 'tinyurl',
          shortCode: extractedCode,
        };
      }
    }
  } catch {
    // Network or CORS block - seamlessly fall back to VEXUNO Direct Engine
  }

  // Fallback to VEXUNO Direct SPA Link (works natively on GitHub Pages)
  const directUrl = `${baseDomain}#r/${preferredCode}`;
  return {
    success: true,
    shortUrl: directUrl,
    provider: 'vexuno_direct',
    shortCode: preferredCode,
    isFallback: true,
  };
}

/**
 * Creates a short URL using a user-configured custom enterprise backend API
 */
export async function shortenWithCustomBackend(
  originalUrl: string,
  code: string,
  config: BackendConfig,
  baseDomain: string
): Promise<ShortenResponse> {
  if (!config.enabled || !config.apiUrl) {
    return {
      success: false,
      shortUrl: '',
      provider: 'custom_api',
      shortCode: code,
      error: 'Custom backend is not enabled or API URL is missing.',
    };
  }

  try {
    const cleanBase = config.apiUrl.replace(/\/+$/, '');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    const res = await fetch(`${cleanBase}/links`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url: originalUrl,
        code,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `API returned status ${res.status}`);
    }

    const data = await res.json();
    return {
      success: true,
      shortUrl: data.shortUrl || `${cleanBase}/r/${code}`,
      provider: 'custom_api',
      shortCode: data.code || code,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to connect to backend';
    // Fall back to direct engine
    const directUrl = `${baseDomain}#r/${code}`;
    return {
      success: true,
      shortUrl: directUrl,
      provider: 'vexuno_direct',
      shortCode: code,
      isFallback: true,
      error: `Custom API error: ${msg}. Resolved using local VEXUNO routing.`,
    };
  }
}
