/* İSG Takip Merkezi — simge (PNG) üretimi
   Kullanım: npm run ikon
   Kaynak: assets/img/favicon.svg  →  192 / 512 / apple-touch 180 */
'use strict';

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const kok = path.resolve(__dirname, '..');
const kaynak = fs.readFileSync(path.join(kok, 'assets/img/favicon.svg'), 'utf8');
const hedefDizin = path.join(kok, 'assets/img');

// iOS ve maskable simgelerde köşe yuvarlatma olmamalı: zemin tam taşsın.
const kareSv = kaynak.replace('rx="14"', 'rx="0"');

const isler = [
  { dosya: 'ikon-192.png', boy: 192, svg: kaynak },
  { dosya: 'ikon-512.png', boy: 512, svg: kaynak },
  { dosya: 'apple-touch-icon.png', boy: 180, svg: kareSv }
];

for (const is of isler) {
  const png = new Resvg(is.svg, { fitTo: { mode: 'width', value: is.boy }, background: 'rgba(0,0,0,0)' })
    .render()
    .asPng();
  fs.writeFileSync(path.join(hedefDizin, is.dosya), png);
  console.log('  ' + is.dosya.padEnd(22) + is.boy + 'x' + is.boy + '  ' + png.length + ' bayt');
}
console.log('Simgeler güncellendi: assets/img/');
