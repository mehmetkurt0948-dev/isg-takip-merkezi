/* İSG Takip Merkezi — varlık (JS/CSS) sürüm damgası
   Kullanım:
     npm run surum            # index.html / 404.html içindeki ?v= damgalarını günceller
     npm run surum:denetle    # hiçbir şey yazmaz; damga güncel değilse çıkış kodu 1

   Damga elle artırılmaz: her dosyanın içeriğinden SHA-1 özetinin ilk 8 karakteri
   kullanılır. Dosya değişmediyse damga aynı kalır, değiştiyse otomatik değişir.
   Böylece "?v= numarasını artırmayı unuttum" diye bir hata olamaz. */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const kok = path.resolve(__dirname, '..');
const SAYFALAR = ['index.html', '404.html'];
const OZET_UZUNLUK = 8;

const denetlemeKipi = process.argv.includes('--denetle') || process.argv.includes('--check');
const sessiz = process.argv.includes('--sessiz');

const onbellek = new Map();

function icerikOzeti(dosyaYolu) {
  if (onbellek.has(dosyaYolu)) { return onbellek.get(dosyaYolu); }
  // Satır sonları LF'e normalize edilir: Windows (CRLF) ve Linux/macOS (LF)
  // çalışma kopyaları aynı damgayı üretir; GitHub Pages de LF servis eder.
  const metin = fs.readFileSync(dosyaYolu, 'utf8').replace(/\r\n/g, '\n');
  const ozet = crypto.createHash('sha1').update(Buffer.from(metin, 'utf8')).digest('hex').slice(0, OZET_UZUNLUK);
  onbellek.set(dosyaYolu, ozet);
  return ozet;
}

function yerelVarlik(deger, sayfa) {
  const soruIsareti = deger.indexOf('?');
  const yol = (soruIsareti === -1 ? deger : deger.slice(0, soruIsareti)).trim();
  const sorgu = soruIsareti === -1 ? '' : deger.slice(soruIsareti + 1);

  if (!/\.(?:js|css)$/i.test(yol)) { return null; }
  if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(yol)) { return null; }
  if (yol.startsWith('/') || yol.startsWith('#')) { return null; }

  const tam = path.resolve(path.dirname(path.join(kok, sayfa)), yol);
  if (!fs.existsSync(tam)) { return null; }
  return { yol, sorgu, tam };
}

function beklenenDeger(varlik) {
  const parametreler = varlik.sorgu
    .split('&')
    .filter((p) => p && p.split('=')[0] !== 'v');
  parametreler.push('v=' + icerikOzeti(varlik.tam));
  return varlik.yol + '?' + parametreler.join('&');
}

function mevcutDamga(deger) {
  const soruIsareti = deger.indexOf('?');
  if (soruIsareti === -1) { return null; }
  const eslesme = /(?:^|&)v=([^&]*)/.exec(deger.slice(soruIsareti + 1));
  return eslesme ? eslesme[1] : null;
}

function isle(sayfa) {
  const tamYol = path.join(kok, sayfa);
  if (!fs.existsSync(tamYol)) { return { sayfa, degisimler: [], eksikler: [], icerik: null, yeni: null }; }

  const icerik = fs.readFileSync(tamYol, 'utf8');
  const degisimler = [];
  const eksikler = [];

  const yeni = icerik.replace(/(\b(?:href|src)=")([^"]+)(")/g, (tam, once, deger, sonra) => {
    const varlik = yerelVarlik(deger, sayfa);
    if (!varlik) { return tam; }
    const beklenen = beklenenDeger(varlik);
    if (deger === beklenen) { return tam; }
    degisimler.push({ yol: varlik.yol, eski: mevcutDamga(deger), yeni: mevcutDamga(beklenen) });
    if (!mevcutDamga(deger)) { eksikler.push(varlik.yol); }
    return once + beklenen + sonra;
  });

  return { sayfa, degisimler, eksikler, icerik, yeni };
}

function damgaMetni(damga) { return damga === null ? '(yok)' : 'v=' + damga; }

const sonuclar = SAYFALAR.map(isle);
const tumDegisimler = sonuclar.flatMap((s) => s.degisimler);

if (denetlemeKipi) {
  if (tumDegisimler.length === 0) {
    if (!sessiz) { console.log('Varlık sürümleri güncel (' + SAYFALAR.filter((s) => fs.existsSync(path.join(kok, s))).join(', ') + ').'); }
    process.exit(0);
  }
  console.error('Varlık sürümleri güncel değil — JS/CSS değişmiş ama ?v= damgası eski:');
  for (const d of tumDegisimler) {
    console.error('  ' + d.yol + ': ' + damgaMetni(d.eski) + ' → ' + damgaMetni(d.yeni));
  }
  console.error('Düzeltmek için: npm run surum   (pre-commit kancası bunu otomatik yapar)');
  process.exit(1);
}

for (const sonuc of sonuclar) {
  if (sonuc.icerik === null || sonuc.yeni === sonuc.icerik) { continue; }
  fs.writeFileSync(path.join(kok, sonuc.sayfa), sonuc.yeni, 'utf8');
}

if (!sessiz) {
  if (tumDegisimler.length === 0) {
    console.log('Varlık sürümleri güncel; değişiklik yok.');
  } else {
    console.log('Varlık sürümleri güncellendi:');
    for (const d of tumDegisimler) {
      console.log('  ' + d.yol.padEnd(34) + ' ' + damgaMetni(d.eski) + ' → ' + damgaMetni(d.yeni));
    }
    if (sonuclar.some((s) => s.eksikler.length)) {
      console.log('  (' + sonuclar.flatMap((s) => s.eksikler).length + ' varlıkta ?v= damgası yoktu, eklendi.)');
    }
  }
}
