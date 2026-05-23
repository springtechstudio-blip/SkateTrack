const fs = require('fs');
const path = require('path');

const clientDir = path.join(__dirname, '..', 'dist', 'client', 'client');
const targetDir = path.join(__dirname, '..', 'dist', 'client');

const assetsSrc = path.join(clientDir, 'assets');
const assetsDest = path.join(targetDir, 'assets');

// 1. Ensure target dirs
fs.mkdirSync(targetDir, { recursive: true });
fs.mkdirSync(assetsDest, { recursive: true });

// 2. Copy all client assets to flat /assets
if (fs.existsSync(assetsSrc)) {
  const files = fs.readdirSync(assetsSrc);
  for (const file of files) {
    fs.copyFileSync(
      path.join(assetsSrc, file),
      path.join(assetsDest, file)
    );
  }
  console.log(`Copied ${files.length} assets to dist/client/assets`);
}

// 3. Copy manifest if present
const manifestSrc = path.join(clientDir, 'manifest.json');
if (fs.existsSync(manifestSrc)) {
  fs.copyFileSync(manifestSrc, path.join(targetDir, 'manifest.json'));
}

// 4. Find CSS and main JS
const assetFiles = fs.readdirSync(assetsDest);

const cssFile = assetFiles.find(f => f.startsWith('styles-') && f.endsWith('.css'));
let jsFile = assetFiles
  .filter(f => f.startsWith('index-') && f.endsWith('.js'))
  .sort((a, b) => {
    const sizeA = fs.statSync(path.join(assetsDest, a)).size;
    const sizeB = fs.statSync(path.join(assetsDest, b)).size;
    return sizeB - sizeA; // largest first
  })[0];

if (!jsFile) {
  // fallback: any large .js
  jsFile = assetFiles
    .filter(f => f.endsWith('.js'))
    .sort((a, b) => fs.statSync(path.join(assetsDest, b)).size - fs.statSync(path.join(assetsDest, a)).size)[0];
}

console.log('Using CSS:', cssFile);
console.log('Using main JS entry:', jsFile);

if (!jsFile) {
  console.error('ERROR: Could not find main JS bundle!');
  process.exit(1);
}

// 5. Write a proper static index.html (SPA shell)
const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SkateTrack — Abitudini, Note e Skating</title>
    <meta name="description" content="Il tuo diario personale di pattinaggio artistico, abitudini e note." />
    <meta name="author" content="SkateTrack" />
    <meta property="og:title" content="SkateTrack" />
    <meta property="og:description" content="Pattinaggio artistico, abitudini e note in un'unica app." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" />
    <link rel="stylesheet" href="/assets/${cssFile}" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/${jsFile}"></script>
  </body>
</html>
`;

fs.writeFileSync(path.join(targetDir, 'index.html'), html);
console.log('Created dist/client/index.html');

// 6. Also write a simple 200.html for SPA deep links (some hosts need it, Vercel uses the rewrite)
fs.writeFileSync(path.join(targetDir, '200.html'), html);
console.log('Created dist/client/200.html for SPA fallback');

console.log('✅ Static Vercel-ready build prepared in dist/client');
