# Portfolio — Mary-Élizabeth Lagacé

Site web personnel (portfolio) en HTML/CSS/JS pur, sans framework ni étape de build.

## Structure du projet

```
.
├── index.html          # Toute la page
├── css/style.css        # Styles
├── js/main.js            # Petites interactions (menu, animations)
├── assets/
│   ├── favicon.svg
│   └── img/mary-portrait.jpg
└── README.md
```

## Voir le site en local

Aucune installation requise : ouvre simplement `index.html` dans ton navigateur
(double-clic, ou clic droit → Ouvrir avec → ton navigateur).

## Modifier le contenu

- Texte et sections : directement dans `index.html`.
- Couleurs, polices, espacements : dans `css/style.css` (variables au tout début du fichier, sous `:root`).
- Photo : remplace `assets/img/mary-portrait.jpg` par une autre image du même nom, ou change le chemin dans `index.html`.

## Mettre en ligne (Git + GitHub + Vercel)

1. **Git local** — dans le dossier du projet :
   ```
   git init
   git add .
   git commit -m "Premier commit : portfolio"
   ```
2. **GitHub** — créer un dépôt vide sur github.com, puis :
   ```
   git remote add origin <URL-du-depot>
   git branch -M main
   git push -u origin main
   ```
3. **Vercel** — sur vercel.com, "Add New Project", importer le dépôt GitHub.
   Aucune configuration de build n'est nécessaire (site statique) : laisser
   "Framework Preset" sur *Other* et déployer.

Chaque `git push` déclenchera ensuite un nouveau déploiement automatique.
