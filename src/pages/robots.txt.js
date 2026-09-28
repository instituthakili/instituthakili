import { url } from '../lib/content.js';
export function GET({ site }) {
  const base = site ? site.toString().replace(/\/$/, '') : '';
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${base}${url('/sitemap.xml')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
