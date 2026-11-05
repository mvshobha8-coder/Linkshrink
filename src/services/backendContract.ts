/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const BACKEND_SPECIFICATION = {
  version: '1.0.0',
  description: 'VEXUNO Enterprise REST API Specification for Production Deployments',
  endpoints: [
    {
      method: 'POST',
      path: '/api/v1/links',
      description: 'Create a new shortened link with optional passcode, expiration, and UTM metadata',
      requestBody: {
        url: 'https://example.com/target-destination',
        customAlias: 'launch-2026 (optional)',
        passcode: 'secret123 (optional)',
        expiresAt: '2026-12-31T23:59:59Z (optional)',
        clickLimit: 1000,
      },
      responseBody: {
        id: 'lnk_abc123',
        code: 'launch-2026',
        shortUrl: 'https://vexuno.io/r/launch-2026',
        originalUrl: 'https://example.com/target-destination',
        createdAt: '2026-11-05T00:00:00Z',
      },
    },
    {
      method: 'GET',
      path: '/api/v1/links',
      description: 'List user links with pagination and search',
    },
    {
      method: 'GET',
      path: '/api/v1/analytics/:code',
      description: 'Retrieve real-time telemetry: click volume, referrers, geographic and device distribution',
    },
    {
      method: 'DELETE',
      path: '/api/v1/links/:id',
      description: 'Deactivate or delete an existing short link',
    },
  ],
};

export const SAMPLE_CLOUDFLARE_WORKER = `/**
 * VEXUNO - Cloudflare Worker URL Shortener
 * Deploy to Cloudflare Workers with KV namespace "VEXUNO_LINKS"
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Redirection endpoint: /r/:code
    if (path.startsWith('/r/')) {
      const code = path.slice(3);
      const raw = await env.VEXUNO_LINKS.get(code, { type: 'json' });
      if (!raw) return new Response('Link not found or expired', { status: 404 });

      // Record real click
      raw.clicks = (raw.clicks || 0) + 1;
      await env.VEXUNO_LINKS.put(code, JSON.stringify(raw));

      return Response.redirect(raw.originalUrl, 302);
    }

    // API create endpoint: POST /api/links
    if (path === '/api/links' && request.method === 'POST') {
      const { url: targetUrl, code: customCode } = await request.json();
      const code = customCode || Math.random().toString(36).slice(2, 8);
      const linkRecord = {
        code,
        originalUrl: targetUrl,
        createdAt: new Date().toISOString(),
        clicks: 0,
      };
      await env.VEXUNO_LINKS.put(code, JSON.stringify(linkRecord));
      return new Response(JSON.stringify({ shortUrl: \`\${url.origin}/r/\${code}\`, code }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('VEXUNO API is active', { status: 200 });
  }
};`;
