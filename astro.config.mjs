// Configuration de construction du site de l'Institut HAKILI.
// SITE_URL et BASE_PATH sont fournis automatiquement par la chaîne de publication GitHub.
import { defineConfig } from 'astro/config';

// Le site est toujours servi en HTTPS, même si GitHub annonce encore une adresse en http.
const site = (process.env.SITE_URL || 'https://institut-hakili.org').replace(/^http:\/\//, 'https://');
let base = process.env.BASE_PATH || '/';
if (!base.startsWith('/')) base = '/' + base;
const apercu = process.env.HAKILI_APERCU === '1';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  build: {
    format: apercu ? 'file' : 'directory',
    assets: '_astro',
  },
  markdown: {
    smartypants: false,
  },
  devToolbar: { enabled: false },
});
