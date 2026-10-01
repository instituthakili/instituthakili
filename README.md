# Site internet de l'Institut HAKILI

Site bilingue (français et anglais) de l'Institut HAKILI pour la Gouvernance et la Redevabilité en Afrique (IHGR).

Le site est en ligne à l'adresse [institut-hakili.org](https://institut-hakili.org).

## Modifier les contenus

Les contenus se modifient depuis l'espace d'administration, à l'adresse https://app.pagescms.org, sans toucher au code. Chaque enregistrement met le site à jour en deux à trois minutes.

## Organisation des fichiers

- `contenu/` rassemble les textes du site (publications, actualités, agenda, médiathèque, indices, direction et conseil, pages, réglages).
- `public/media/` reçoit les images, les PDF et les vidéos déposés depuis l'administration.
- `src/` contient la mise en page et le code du site.
- `.pages.yml` décrit les formulaires de l'espace d'administration.
- `.github/workflows/publier.yml` construit et met en ligne le site à chaque modification.

## Pour un développeur

Le site est construit avec Astro 5 et produit des pages statiques. Il suffit de Node.js 20 ou plus récent, puis des commandes `npm install`, `npm run dev` et `npm run build`. L'hébergement est assuré par GitHub Pages.

## Typographies

Newsreader et Figtree sont distribuées sous licence SIL Open Font License 1.1. TeX Gyre Adventor est distribuée sous licence GUST Font License. Voir `src/assets/fonts/LICENCES.txt`.
