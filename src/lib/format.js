import fs from 'node:fs';
import path from 'node:path';
import { UI, libelle } from './i18n.js';

const NBSP = ' ';

function capitale(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// « Septembre 2026 »
export function moisAnnee(date, lang = 'fr') {
  if (!date) return '';
  const m = UI[lang].mois[date.getUTCMonth()];
  return `${capitale(m)} ${date.getUTCFullYear()}`;
}

// « 28 septembre 2026 » ou « 28 September 2026 »
export function dateLongue(date, lang = 'fr') {
  if (!date) return '';
  const j = date.getUTCDate();
  const m = UI[lang].mois[date.getUTCMonth()];
  const a = date.getUTCFullYear();
  if (lang === 'fr') return `${j === 1 ? '1er' : j}${NBSP}${m}${NBSP}${a}`;
  return `${j}${NBSP}${m}${NBSP}${a}`;
}

// « 9 h 30 » (usage français) ou « 9:30 am »
export function heure(date, lang = 'fr') {
  if (!date) return '';
  const h = date.getUTCHours();
  const mi = date.getUTCMinutes();
  if (h === 0 && mi === 0) return '';
  if (lang === 'fr') return `${h}${NBSP}h${mi ? NBSP + String(mi).padStart(2, '0') : ''}`;
  const suffixe = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(mi).padStart(2, '0')}${NBSP}${suffixe}`;
}

// Date affichée selon la précision choisie dans l'administration : jour, mois ou année.
export function dateAffichee(item, lang = 'fr', defaut = 'mois') {
  const d = item?.date;
  if (!d) return '';
  const precision = item?.data?.affichage_date || defaut;
  if (precision === 'annee') return String(d.getUTCFullYear());
  if (precision === 'jour') return dateLongue(d, lang);
  return moisAnnee(d, lang);
}

export function isoDate(date) {
  return date ? date.toISOString().slice(0, 10) : '';
}

// Taille d'un fichier déposé dans le dossier public, affichée à côté du bouton de téléchargement.
export function tailleFichier(valeur, lang = 'fr') {
  if (!valeur || /^https?:/i.test(valeur)) return '';
  try {
    let rel = String(valeur).replace(/^\.?\/*/, '').replace(/^public\//, '');
    try {
      rel = decodeURIComponent(rel);
    } catch (e) {
      // Nom de fichier déjà lisible tel quel.
    }
    const complet = path.join(process.cwd(), 'public', rel);
    const o = fs.statSync(complet).size;
    if (o < 1024 * 1024) {
      const ko = Math.max(1, Math.round(o / 1024));
      return lang === 'fr' ? `${ko}${NBSP}Ko` : `${ko}${NBSP}KB`;
    }
    const mo = (o / (1024 * 1024)).toFixed(1);
    return lang === 'fr' ? `${mo.replace('.', ',')}${NBSP}Mo` : `${mo}${NBSP}MB`;
  } catch (e) {
    return '';
  }
}

// Référence bibliographique proposée au lecteur.
export function citation(p, lang = 'fr', titre = '') {
  const auteurs = (p.auteurs || []).map((a) => String(a).replace(/^(Dr|Pr|Pre)\.?\s+/i, '')).join(', ');
  const t = titre || p.data.titre || '';
  const source = p.data.source ? `, ${p.data.source}` : '';
  const precision = p.data?.affichage_date || 'mois';
  const brut = p.date ? (precision === 'annee' ? String(p.date.getUTCFullYear()) : precision === 'jour' ? dateLongue(p.date, lang) : moisAnnee(p.date, lang)) : '';
  const quand = brut ? `, ${lang === 'fr' ? brut.charAt(0).toLowerCase() + brut.slice(1) : brut}` : '';
  const nature = p.data.source ? '' : `, ${libelle('typesPublication', p.type, lang)}, Institut HAKILI`;
  const ouvre = lang === 'fr' ? `«${NBSP}` : '“';
  const ferme = lang === 'fr' ? `${NBSP}»` : '”';
  return `${auteurs ? auteurs + ', ' : ''}${ouvre}${t}${ferme}${source}${nature}${quand}.`;
}

export function extrait(texte, max = 220) {
  if (!texte) return '';
  const s = String(texte).replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const coupe = s.slice(0, max);
  return coupe.slice(0, coupe.lastIndexOf(' ')) + '…';
}
