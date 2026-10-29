/* İSG Takip Merkezi — yayın paketi üretimi
   Kullanım: npm run yayin
   Sadece yayına giden dosyaları yayin/ klasörüne kopyalar.
   GitHub Pages'e (veya herhangi bir statik sunucuya) bu klasör yüklenir. */
'use strict';

const fs = require('fs');
const path = require('path');

const kok = path.resolve(__dirname, '..');
const hedef = path.join(kok, 'yayin');

const dosyalar = [
  'index.html',
  '404.html',
  'manifest.webmanifest',
  '.nojekyll',
  'README.md'
];
const dizinler = ['assets'];

let adet = 0;
let bayt = 0;

function kopyala(kaynak, varis) {
  const durum = fs.statSync(kaynak);
  if (durum.isDirectory()) {
    fs.mkdirSync(varis, { recursive: true });
    for (const ad of fs.readdirSync(kaynak)) { kopyala(path.join(kaynak, ad), path.join(varis, ad)); }
    return;
  }
  fs.mkdirSync(path.dirname(varis), { recursive: true });
  fs.copyFileSync(kaynak, varis);
  adet += 1;
  bayt += durum.size;
}

fs.rmSync(hedef, { recursive: true, force: true });
fs.mkdirSync(hedef, { recursive: true });

for (const d of dosyalar) {
  if (fs.existsSync(path.join(kok, d))) { kopyala(path.join(kok, d), path.join(hedef, d)); }
}
for (const d of dizinler) {
  if (fs.existsSync(path.join(kok, d))) { kopyala(path.join(kok, d), path.join(hedef, d)); }
}

const kb = (bayt / 1024).toFixed(1);
console.log('Yayın paketi hazır: yayin/  (' + adet + ' dosya, ' + kb + ' KB)');
console.log('Yüklenecekler: ' + fs.readdirSync(hedef).sort().join(', '));
