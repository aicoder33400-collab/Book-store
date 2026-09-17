#!/usr/bin/env node
/**
 * Post-build : injecte les meta tags PWA + Service Worker dans dist/index.html
 * Usage : node scripts/inject-pwa.js
 */

const fs = require('fs');
const path = require('path');

const distIndex = path.join(__dirname, '..', 'dist', 'index.html');

if (!fs.existsSync(distIndex)) {
  console.error('❌ dist/index.html introuvable. Lance d\'abord `npx expo export --platform web`');
  process.exit(1);
}

let html = fs.readFileSync(distIndex, 'utf8');

// 1) Remplacer le titre
html = html.replace(
  /<title>.*?<\/title>/,
  '<title>RMP Maktaba — Bibliothèque</title>'
);

// 2) Fix zoom mobile : empêcher le zoom utilisateur
html = html.replace(
  /<meta name="viewport"[^>]*>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, shrink-to-fit=no" />'
);

// 3) Ajouter les meta tags PWA juste avant </head>
const pwaTags = `
    <!-- PWA Meta Tags -->
    <style>
      html, body, #root {
        background-color: #0F3D28 !important;
        overscroll-behavior: none;
        margin: 0;
        padding: 0;
      }
    </style>
    <meta name="description" content="Bibliothèque de la mosquée RMP Maktaba" />
    <meta name="theme-color" content="#1B5E3F" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="RMP Maktaba" />
    <meta name="mobile-web-app-capable" content="yes" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
    <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />
`;

html = html.replace('</head>', `${pwaTags}</head>`);

// 4) Ajouter le Service Worker avant </body>
const swScript = `
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then((reg) => console.log('✅ Service Worker enregistré:', reg.scope))
            .catch((err) => console.warn('⚠️ SW échec:', err));
        });
      }
    </script>
`;

html = html.replace('</body>', `${swScript}</body>`);

fs.writeFileSync(distIndex, html, 'utf8');
console.log('✅ Meta tags PWA + SW injectés dans dist/index.html');