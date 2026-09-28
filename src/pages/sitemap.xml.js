import { contenus, url } from '../lib/content.js';
import { route, LANGS } from '../lib/i18n.js';

export async function GET({ site }) {
  const c = await contenus();
  const base = site ? site.toString().replace(/\/$/, '') : '';
  const entrees = [];
  const ajouter = (cle, slug = '') => {
    const fr = base + url(route(cle, 'fr', slug));
    const en = base + url(route(cle, 'en', slug));
    for (const lang of LANGS) {
      const loc = lang === 'fr' ? fr : en;
      entrees.push(
        `<url><loc>${loc}</loc><xhtml:link rel="alternate" hreflang="fr" href="${fr}"/><xhtml:link rel="alternate" hreflang="en" href="${en}"/></url>`
      );
    }
  };
  ['accueil', 'institut', 'axes', 'indices', 'publications', 'mediatheque', 'actualites', 'contact', 'mentions'].forEach((k) => ajouter(k));
  c.indices.forEach((x) => ajouter('indice', x.slug));
  c.publications.forEach((x) => ajouter('publication', x.slug));
  c.videos.forEach((x) => ajouter('video', x.slug));
  c.actualites.forEach((x) => ajouter('actualite', x.slug));
  c.agenda.forEach((x) => ajouter('evenement', x.slug));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entrees.join('')}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
