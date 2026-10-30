/* İSG Takip Merkezi — canlı yayın doğrulaması
   Kullanım:
     npm run yayin:dogrula              # tek deneme
     npm run yayin:dogrula -- --bekle 300   # 5 dakika boyunca 15 sn'de bir dene

   Yaptığı iş: yayındaki index.html'i ve her JS/CSS dosyasını indirir, içerik
   özetini yerel dosyalarla karşılaştırır. "Push ettim ama kullanıcı eski kodu
   görüyor" durumunu (bayat GitHub Pages, eski önbellek, eksik deploy) yakalar.
   Uyuşmazlık varsa çıkış kodu 1'dir; bu yüzden CI'da da kullanılır. */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const kok = path.resolve(__dirname, '..');
const paket = JSON.parse(fs.readFileSync(path.join(kok, 'package.json'), 'utf8'));

const bekleArg = process.argv.indexOf('--bekle');
const bekleSaniye = bekleArg === -1 ? 0 : Number(process.argv[bekleArg + 1] || 0);
const aralikSaniye = 15;

function yayinAdresi() {
  if (paket.homepage) { return paket.homepage.replace(/\/?$/, '/'); }
  let uzak = '';
  try {
    uzak = require('child_process')
      .execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: kok, encoding: 'utf8' })
      .trim();
  } catch (hata) {
    return null;
  }
  const eslesme = /github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?$/.exec(uzak);
  if (!eslesme) { return null; }
  return 'https://' + eslesme[1].toLowerCase() + '.github.io/' + eslesme[2] + '/';
}

function yerelOzet(dosyaYolu) {
  const metin = fs.readFileSync(dosyaYolu, 'utf8').replace(/\r\n/g, '\n');
  return crypto.createHash('sha1').update(Buffer.from(metin, 'utf8')).digest('hex').slice(0, 8);
}

function varliklar(sayfa) {
  const icerik = fs.readFileSync(path.join(kok, sayfa), 'utf8');
  const liste = [];
  const desen = /\b(?:href|src)="([^"]+\.(?:js|css))(?:\?([^"]*))?"/gi;
  let eslesme;
  while ((eslesme = desen.exec(icerik)) !== null) {
    const yol = eslesme[1];
    if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(yol) || yol.startsWith('/')) { continue; }
    const tam = path.resolve(kok, yol);
    if (!fs.existsSync(tam)) { continue; }
    const damga = /(?:^|&)v=([^&]*)/.exec(eslesme[2] || '');
    liste.push({ yol, damga: damga ? damga[1] : null, ozet: yerelOzet(tam) });
  }
  return liste;
}

async function indir(adres) {
  const yanit = await fetch(adres, {
    cache: 'no-store',
    headers: { 'cache-control': 'no-cache', pragma: 'no-cache' },
    signal: AbortSignal.timeout(25000)
  });
  if (!yanit.ok) { throw new Error('HTTP ' + yanit.status + ' — ' + adres); }
  return Buffer.from(await yanit.arrayBuffer());
}

async function tekDeneme(adres) {
  const satirlar = [];
  let tamam = true;

  const canliHtml = (await indir(adres + 'index.html?dogrulama=' + Date.now())).toString('utf8');
  const yerelListe = varliklar('index.html');
  const canliDamgalar = new Map();
  const desen = /\b(?:href|src)="([^"]+\.(?:js|css))(?:\?([^"]*))?"/gi;
  let eslesme;
  while ((eslesme = desen.exec(canliHtml)) !== null) {
    const damga = /(?:^|&)v=([^&]*)/.exec(eslesme[2] || '');
    canliDamgalar.set(eslesme[1], damga ? damga[1] : null);
  }

  for (const varlik of yerelListe) {
    const canliDamga = canliDamgalar.has(varlik.yol) ? canliDamgalar.get(varlik.yol) : '(yok)';
    let durum;
    if (canliDamga !== varlik.damga) {
      durum = 'HTML damgası farklı';
      tamam = false;
    } else {
      try {
        const canliIcerik = await indir(adres + varlik.yol + '?v=' + canliDamga + '&dogrulama=' + Date.now());
        const canliOzet = crypto.createHash('sha1')
          .update(Buffer.from(canliIcerik.toString('utf8').replace(/\r\n/g, '\n'), 'utf8'))
          .digest('hex').slice(0, 8);
        if (canliOzet === varlik.ozet) {
          durum = 'içerik aynı';
        } else {
          durum = 'İÇERİK FARKLI (canlı ' + canliOzet + ')';
          tamam = false;
        }
      } catch (hata) {
        durum = 'indirilemedi (' + hata.message + ')';
        tamam = false;
      }
    }
    satirlar.push({ yol: varlik.yol, yerel: varlik.damga, canli: canliDamga, durum });
  }

  return { tamam, satirlar };
}

async function main() {
  const adres = yayinAdresi();
  if (!adres) {
    console.error('Yayın adresi belirlenemedi. package.json içine "homepage" ekleyin.');
    process.exit(2);
  }

  console.log('Canlı adres: ' + adres);
  const bitis = Date.now() + Math.max(0, bekleSaniye) * 1000;
  let deneme = 0;

  for (;;) {
    deneme += 1;
    let sonuc;
    try {
      sonuc = await tekDeneme(adres);
    } catch (hata) {
      sonuc = { tamam: false, hata: hata.message, satirlar: [] };
    }

    if (sonuc.tamam) {
      console.log('Deneme ' + deneme + ': canlı sürüm yerelle aynı (' + sonuc.satirlar.length + ' varlık doğrulandı).');
      for (const s of sonuc.satirlar) {
        console.log('  ' + s.yol.padEnd(34) + ' v=' + String(s.yerel).padEnd(10) + ' ' + s.durum);
      }
      process.exit(0);
    }

    const kalan = Math.round((bitis - Date.now()) / 1000);
    if (kalan <= 0) {
      console.error('Deneme ' + deneme + ': canlı sürüm hâlâ yerelle aynı değil.');
      if (sonuc.hata) { console.error('  ' + sonuc.hata); }
      for (const s of sonuc.satirlar) {
        console.error('  ' + s.yol.padEnd(34) + ' yerel v=' + String(s.yerel).padEnd(10) +
          'canlı v=' + String(s.canli).padEnd(10) + s.durum);
      }
      console.error('Olası nedenler: GitHub Pages derlemesi sürüyor, yanlış dal/dizin,');
      console.error('ya da push hiç gitmedi (git log origin/main..HEAD).');
      process.exit(1);
    }

    console.log('Deneme ' + deneme + ': henüz eski sürüm servis ediliyor, ' +
      Math.min(aralikSaniye, kalan) + ' sn sonra tekrar denenecek (' + kalan + ' sn kaldı).');
    await new Promise((r) => setTimeout(r, Math.min(aralikSaniye, kalan) * 1000));
  }
}

main().catch((hata) => {
  console.error('Doğrulama hatası: ' + hata.message);
  process.exit(2);
});
