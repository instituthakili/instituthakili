// Lecture des contenus saisis dans l'espace d'administration (dossier « contenu »).
// Le code tolère les champs vides : un oubli dans un formulaire ne bloque jamais la mise à jour du site.
import { marked } from 'marked';

import reglagesBruts from '../../contenu/reglages.json';
import accueilBrut from '../../contenu/pages/accueil.json';
import institutBrut from '../../contenu/pages/institut.json';
import axesBrut from '../../contenu/pages/axes.json';
import contactBrut from '../../contenu/pages/contact.json';

marked.setOptions({ gfm: true, breaks: false });

const modules = {
  publications: import.meta.glob('/contenu/publications/*.md', { eager: true }),
  actualites: import.meta.glob('/contenu/actualites/*.md', { eager: true }),
  agenda: import.meta.glob('/contenu/agenda/*.md', { eager: true }),
  videos: import.meta.glob('/contenu/videos/*.md', { eager: true }),
  equipe: import.meta.glob('/contenu/equipe/*.md', { eager: true }),
  indices: import.meta.glob('/contenu/indices/*.md', { eager: true }),
};

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');

// Adresse interne tenant compte du dossier de publication (hébergement dans un sous-dossier).
export function url(chemin = '/') {
  if (!chemin) return BASE;
  if (/^(https?:|mailto:|tel:|#|data:)/i.test(chemin)) return chemin;
  return BASE + String(chemin).replace(/^\/+/, '');
}

// Fichier déposé depuis l'administration (image, PDF, vidéo) ou adresse complète.
export function media(valeur) {
  if (!valeur || typeof valeur !== 'string') return '';
  const v = valeur.trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  let chemin = v.replace(/^\.?\/*/, '');
  chemin = chemin.replace(/^public\//, '');
  return url('/' + chemin);
}

function slugDepuisFichier(chemin) {
  return chemin.split('/').pop().replace(/\.md$/, '');
}

export function versDate(valeur) {
  if (!valeur) return null;
  if (valeur instanceof Date) return isNaN(valeur) ? null : valeur;
  const s = String(valeur).trim();
  if (!s) return null;
  // Formats acceptés : 2026-09-28, 2026-09-28T09:30, 2026-09
  const m = s.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) {
    const d = new Date(s);
    return isNaN(d) ? null : d;
  }
  const [, a, mo, j = '01', h = '00', mi = '00'] = m;
  return new Date(Date.UTC(+a, +mo - 1, +j, +h, +mi));
}

function liste(valeur) {
  if (!valeur) return [];
  if (Array.isArray(valeur)) return valeur.filter((x) => x !== null && x !== undefined && String(x).trim() !== '');
  return String(valeur)
    .split(/[;,]\s*/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function publie(fm) {
  return !(fm.publie === false || fm.publie === 'false' || fm.brouillon === true);
}

// Finitions typographiques : apostrophe courbe, espaces insécables devant ? ! ; : et à l'intérieur des guillemets.
export function typo(texte) {
  if (texte === null || texte === undefined) return '';
  if (typeof texte !== 'string') return texte;
  return texte
    .replace(/([A-Za-zÀ-ÖØ-öø-ÿŒœ])'(?=[A-Za-zÀ-ÖØ-öø-ÿŒœ])/g, '$1\u2019')
    .replace(/ ([?!;])/g, '\u202F$1')
    .replace(/ :(?=\s|$)/g, '\u00A0:')
    .replace(/« /g, '«\u00A0')
    .replace(/ »/g, '\u00A0»')
    .replace(/\bn° (?=\d)/g, 'n°\u00A0')
    .replace(/(\d{4})-(\d{4})/g, '$1\u2060-\u2060$2');
}

// Même traitement pour du HTML : seules les portions de texte hors balises sont modifiées.
function typoHtml(html) {
  if (!html) return '';
  return String(html).replace(/(^|>)([^<]+)/g, (m, avant, texte) => avant + typo(texte));
}

async function charger(nom) {
  const entrees = await Promise.all(
    Object.entries(modules[nom]).map(async ([chemin, mod]) => {
      const fm = { ...(mod.frontmatter || {}) };
      let html = '';
      try {
        html = typeof mod.compiledContent === 'function' ? await mod.compiledContent() : '';
      } catch (e) {
        html = '';
      }
      return { slug: slugDepuisFichier(chemin), data: fm, html: typoHtml(html || '') };
    })
  );
  return entrees.filter((x) => publie(x.data));
}

// Champ traduit : pour l'anglais, on prend le champ « _en » s'il est rempli, sinon le français.
export function tr(objet, champ, lang) {
  if (!objet) return '';
  if (lang === 'en') {
    const v = objet[`${champ}_en`];
    if (v !== undefined && v !== null && String(v).trim() !== '') return typo(v);
  }
  return typo(objet[champ] ?? '');
}

// Indique si un champ n'existe qu'en français (pour signaler la langue du contenu aux lecteurs d'écran).
export function seulementFr(objet, champ, lang) {
  if (lang !== 'en' || !objet) return false;
  const v = objet[`${champ}_en`];
  return !(v !== undefined && v !== null && String(v).trim() !== '');
}

export function md(texte) {
  if (!texte) return '';
  return typoHtml(marked.parse(String(texte)));
}

const parDateDesc = (a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0);

let cache = null;

export async function contenus() {
  if (cache) return cache;

  const publications = (await charger('publications'))
    .map((p) => ({
      ...p,
      date: versDate(p.data.date),
      auteurs: liste(p.data.auteurs),
      themes: liste(p.data.themes),
      type: p.data.type || 'etude',
    }))
    .sort(parDateDesc);

  const actualites = (await charger('actualites'))
    .map((a) => ({ ...a, date: versDate(a.data.date) }))
    .sort(parDateDesc);

  const maintenant = new Date();
  const agenda = (await charger('agenda'))
    .map((e) => ({ ...e, debut: versDate(e.data.debut), fin: versDate(e.data.fin) }))
    .filter((e) => e.debut)
    .sort((a, b) => a.debut - b.debut);
  const aVenir = agenda.filter((e) => (e.fin || e.debut) >= new Date(maintenant.getTime() - 24 * 3600 * 1000));
  const passes = agenda.filter((e) => !aVenir.includes(e)).reverse();

  const videos = (await charger('videos'))
    .map((v) => ({ ...v, date: versDate(v.data.date), themes: liste(v.data.themes) }))
    .sort(parDateDesc);

  const equipe = (await charger('equipe')).sort(
    (a, b) => (Number(a.data.ordre) || 99) - (Number(b.data.ordre) || 99) || String(a.data.nom).localeCompare(String(b.data.nom))
  );

  const indices = (await charger('indices')).sort((a, b) => (Number(a.data.ordre) || 99) - (Number(b.data.ordre) || 99));

  cache = {
    publications,
    actualites,
    agenda,
    aVenir,
    passes,
    videos,
    equipe,
    indices,
    reglages: reglagesBruts || {},
    pages: {
      accueil: accueilBrut || {},
      institut: institutBrut || {},
      axes: axesBrut || {},
      contact: contactBrut || {},
    },
  };
  return cache;
}

// Identifiant d'une vidéo YouTube ou Vimeo à partir d'une adresse collée telle quelle.
export function videoSource(v) {
  const lien = String(v?.data?.lien_video || '').trim();
  const fichier = media(v?.data?.fichier_video);
  if (lien) {
    const yt = lien.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    if (yt) return { type: 'youtube', id: yt[1], lien: `https://www.youtube.com/watch?v=${yt[1]}` };
    const vm = lien.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vm) return { type: 'vimeo', id: vm[1], lien: `https://vimeo.com/${vm[1]}` };
    return { type: 'lien', lien };
  }
  if (fichier) return { type: 'fichier', fichier };
  return null;
}
