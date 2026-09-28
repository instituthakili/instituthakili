import { contenus, url, tr } from '../lib/content.js';
import { route } from '../lib/i18n.js';

const echapper = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function GET({ site }) {
  const c = await contenus();
  const base = site ? site.toString().replace(/\/$/, '') : '';
  const items = [
    ...c.publications.map((p) => ({ titre: p.data.titre, resume: p.data.resume, date: p.date, lien: base + url(route('publication', 'fr', p.slug)) })),
    ...c.actualites.map((a) => ({ titre: a.data.titre, resume: a.data.chapo, date: a.date, lien: base + url(route('actualite', 'fr', a.slug)) })),
  ]
    .filter((x) => x.date)
    .sort((a, b) => b.date - a.date)
    .slice(0, 30);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>Institut HAKILI</title>
<link>${base}${url('/')}</link>
<description>${echapper(tr(c.reglages, 'baseline', 'fr'))}</description>
<language>fr</language>
${items.map((i) => `<item><title>${echapper(i.titre)}</title><link>${i.lien}</link><guid>${i.lien}</guid><pubDate>${i.date.toUTCString()}</pubDate><description>${echapper(i.resume)}</description></item>`).join('\n')}
</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
