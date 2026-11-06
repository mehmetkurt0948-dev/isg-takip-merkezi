#!/usr/bin/env node
/* İSG Takip Merkezi — işyeri hekimi sağlık takip Excel'ini uygulamanın kendi
   saglikTakip yığınına aktaran CLI.

   Kullanım:
     node tools/saglik-aktar.js "saglik.xlsx" --rapor=rapor.txt
       -> yalnızca ANALİZ raporu (yazma yok).
     node tools/saglik-aktar.js saglik.xlsx --bulut
       -> buluttaki gerçek veri üzerinden analiz + örnek kayıt.
     node tools/saglik-aktar.js saglik.xlsx --bulut --yaz
       -> sağlık kayıtlarını buluta yazar (yedek + delta koruması).

   Eşleştirme: T.C. Kimlik No → Sicil No → Ad Soyad. Eşleşmeyen kişi rapor
   edilir; sağlık kaydı kişisiz oluşturulmaz. Kişinin kendi işyeri kullanılır
   (--isyeri verilirse yalnız o işyeri filtrelenir).

   Yıl blokları (2025 Muayene Tarihi / Sonuç / Sevk Edilen...) kişi başına yıl
   başına bir kayıt üretir: tarih doluysa kayıt açılır; Sonuç → sonMuayene,
   Sevk → calismaYasagi, meslek → calismaSesi. Diğer sayfalar (YÜKSEK RİSKLİ,
   MALULİYET vb.) eşleşen kişinin kayıtlarına bayrak/not olarak işlenir.

   Mükerrer koruması: aynı personelId + tarih yeniden eklenmez. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

const kok = path.resolve(__dirname, '..');
const argumanlar = process.argv.slice(2);
const raporSatirlari = [];

function bayrak(ad) {
  const b = argumanlar.filter((a) => a.indexOf('--' + ad + '=') === 0)[0];
  if (b) { return b.split('=').slice(1).join('='); }
  return argumanlar.indexOf('--' + ad) > -1 ? true : '';
}
function yaz(metin) {
  const satir = String(metin);
  raporSatirlari.push(satir);
  console.log(satir);
}
function bitir(kod) {
  const cikti = bayrak('rapor');
  if (cikti) {
    fs.writeFileSync(path.resolve(process.cwd(), String(cikti)), raporSatirlari.join('\n') + '\n', 'utf8');
    console.log('Rapor dosyası: ' + path.resolve(process.cwd(), String(cikti)));
  }
  process.exit(kod || 0);
}

const hedefDosya = argumanlar.filter((a) => a.indexOf('--') !== 0)[0];
if (!hedefDosya) {
  console.log('Kullanım: node tools/saglik-aktar.js <sağlık.xlsx> [--isyeri=<id|ad>] ' +
    '[--bulut] [--yaz] [--sifirla] [--yerel=veri.json] [--sinir=40] [--yedek=yedek-saglik] [--rapor=rapor.txt]');
  process.exit(1);
}
const isyeriIstek = String(bayrak('isyeri') || '').trim();
const bulutIstek = bayrak('bulut') === true;
const yazIstek = bayrak('yaz') === true;
/* --sifirla: önceki Excel aktarımıyla açılmış kayıtları siler, sonra yeniden yazar.
   Elle girilmiş sağlık kayıtlarına dokunmaz. */
const sifirlaIstek = bayrak('sifirla') === true;
const yerelDosya = bayrak('yerel');
const sinir = Number(bayrak('sinir')) || 40;
const yedekKlasor = String(bayrak('yedek') || 'yedek-saglik');
if (yazIstek && !bulutIstek && !yerelDosya) {
  yaz('--yaz en az bir veri kaynağı ister (--bulut veya --yerel=).');
  bitir(1);
}
/* Uygulama modülleri tarayıcı sırasıyla: şifreleme ve kayıt kuralları aynı kalır. */
const dom = new JSDOM('<!doctype html><html><body></body></html>',
  { url: 'http://127.0.0.1/', pretendToBeVisual: true, runScripts: 'outside-only' });
const ctx = dom.getInternalVMContext();
ctx.DecompressionStream = globalThis.DecompressionStream;
ctx.Blob = globalThis.Blob;
ctx.fetch = globalThis.fetch;
['varsayilan-veri.js', 'depo.js', 'bicim.js', 'excel.js', 'yetki.js', 'saglik-takip.js'].forEach((ad) => {
  vm.runInContext(fs.readFileSync(path.join(kok, 'assets/js', ad), 'utf8'), ctx, { filename: ad });
});
const ISG = dom.window.ISG;

/* ---------- Bulut (Supabase) — personel-aktar kalıbı ---------- */
function kimlikOku() {
  const kaynak = fs.readFileSync(path.join(kok, 'assets/js/bulut-kimlik.js'), 'utf8');
  const al = (ad) => {
    const e = kaynak.match(new RegExp(ad + ":\\s*'([^']*)'"));
    return e ? e[1].trim() : '';
  };
  const ayar = {
    url: al('url').replace(/\/+$/, '').replace(/\/rest\/v1$/i, ''),
    anahtar: al('anahtar'),
    oda: al('oda').toLocaleLowerCase('tr-TR').replace(/[^a-z0-9._-]+/g, '-')
  };
  if (!ayar.url || !ayar.anahtar || !ayar.oda) {
    throw new Error('bulut-kimlik.js eksik: url, anahtar ve oda dolu olmalı.');
  }
  return ayar;
}
const KIMLIK = bulutIstek ? kimlikOku() : null;
const TABLO = 'isg_veri';

function bulutIste(yol, secenekler) {
  const secenek = secenekler || {};
  const basliklar = Object.assign({
    apikey: KIMLIK.anahtar, Authorization: 'Bearer ' + KIMLIK.anahtar, Accept: 'application/json'
  }, secenek.headers || {});
  const istek = { method: secenek.method || 'GET', headers: basliklar, cache: 'no-store' };
  if (secenek.body) {
    basliklar['Content-Type'] = 'application/json';
    istek.body = JSON.stringify(secenek.body);
  }
  return globalThis.fetch(KIMLIK.url + '/rest/v1/' + TABLO + yol, istek)
    .then((yanit) => yanit.text().then((metin) => {
      let govde = null;
      try { govde = metin ? JSON.parse(metin) : null; } catch (h) { govde = null; }
      if (!yanit.ok) {
        throw new Error('Bulut isteği reddedildi (' + yanit.status + '): ' +
          ((govde && (govde.message || govde.hint)) || String(metin).slice(0, 200)));
      }
      return govde;
    }));
}
function bulutSatirOku() {
  return bulutIste('?oda=eq.' + encodeURIComponent(KIMLIK.oda) + '&select=veri,guncelleme')
    .then((liste) => (Array.isArray(liste) ? liste[0] : null) || null);
}
function yedekle(satir) {
  const klasor = path.resolve(process.cwd(), yedekKlasor);
  fs.mkdirSync(klasor, { recursive: true });
  const yol = path.join(klasor, 'saglik-on-yedek-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json');
  fs.writeFileSync(yol, JSON.stringify(satir, null, 2), 'utf8');
  yaz('  Yedek              : ' + yol);
  return yol;
}
/* ---------- Yardımcılar ---------- */
function norm(deger) {
  return String(deger == null ? '' : deger).replace(/\s+/g, ' ').trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/[ıİ]/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/â/g, 'a');
}
function excelTarih(deger) {
  if (deger == null || deger === '') { return ''; }
  const sayi = Number(deger);
  if (deger !== '' && isFinite(sayi) && sayi > 20000 && sayi < 60000) {
    const ms = Math.round((sayi - 25569) * 86400 * 1000);
    const d = new Date(ms);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' +
      String(d.getUTCDate()).padStart(2, '0');
  }
  const s = String(deger).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { return s; }
  const e = s.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{2}|\d{4})$/);
  if (e) {
    let y = Number(e[3]);
    if (y < 100) { y += 2000; }
    return y + '-' + String(Number(e[2])).padStart(2, '0') + '-' + String(Number(e[1])).padStart(2, '0');
  }
  return '';
}
const SAHA_KELIMELER = ['beden', 'sofor', 'operator', 'beko', 'loder', 'loader', 'ekskavator',
  'kazi', 'elektrik', 'tesisat', 'sihhi', 'kaynak', 'temizlik', 'insaat', 'bakim', 'ariza',
  'kanal', 'kuyumcu', 'makine', 'hizmetli', 'gardiyan', 'bekci', 'teknisyen', ' Boyaci', 'boya'];
const BURO_KELIMELER = ['buro', 'memur', 'sekreter', 'mudur', 'muhasebe', 'insan kaynaklari', 'hukuk'];
function calismaSesiTahmin(meslek) {
  const m = norm(meslek);
  if (!m) { return ''; }
  if (BURO_KELIMELER.some((k) => m.indexOf(k) > -1)) { return 'buro'; }
  if (SAHA_KELIMELER.some((k) => m.indexOf(k) > -1)) { return 'saha'; }
  return 'karisik';
}

/* Sonuç metninde açık bir yasak / uygunsuzluk ifadesi varsa çalışma yasağı alanına yazılır. */
function yasakBul(sonuc) {
  const s = norm(sonuc);
  if (!s) { return ''; }
  const kaliplar = [/calisamaz/, /calismaz\s*$/, /uygun degil/, /uygun degildir/, /sakinca\s*var/, /sakincali/, /gorevlendirilemez/, /emekli/];
  for (let i = 0; i < kaliplar.length; i += 1) {
    if (kaliplar[i].test(s)) { return String(sonuc).trim(); }
  }
  return '';
}

/* Excel aktarımıyla üretilmiş kayıt işareti (girisYapan şifreli olabilir). */
function aktarimKaydi(k) {
  if (!k) { return false; }
  if (ISG.saglikTakip.coz(k.girisYapan || '') === 'aktarim-excel') { return true; }
  /* Eski sürümler yalnızca not alanına kaynak yazmış olabilirdi. */
  const not = ISG.saglikTakip.coz(k.notlar || '');
  return /Kaynak: .*\.xlsx/i.test(not);
}

/* ---------- Excel sayfaları ---------- */
function baytlariOku(yol) {
  const t = fs.readFileSync(yol);
  const b = new Uint8Array(t.length);
  for (let i = 0; i < t.length; i += 1) { b[i] = t[i]; }
  return b;
}
function baslikBul(satirlar) {
  const ust = Math.min(satirlar.length, 8);
  for (let i = 0; i < ust; i += 1) {
    const satir = (satirlar[i] || []).map(norm);
    const sicil = satir.findIndex((h) => /sicil/.test(h));
    const ad = satir.findIndex((h) => /adi?\s*soy/.test(h));
    if (sicil > -1 && ad > -1) { return { indeks: i, sicil: sicil, ad: ad }; }
  }
  return null;
}
function yilBloklari(satirlar, baslikIdx) {
  const basliklar = (satirlar[baslikIdx] || []).map(norm);
  const bloklar = {};
  basliklar.forEach((h, i) => {
    const y = (h.match(/20\d{2}/) || [])[0];
    if (!y) { return; }
    bloklar[y] = bloklar[y] || {};
    if (/muayene/.test(h)) { bloklar[y].tarih = i; }
    else if (/sonu/.test(h)) { bloklar[y].sonuc = i; }
    else if (/sevk/.test(h)) { bloklar[y].sevk = i; }
  });
  const bul = (re) => basliklar.findIndex((h) => re.test(h));
  return {
    bloklar: bloklar,
    tc: bul(/^t\.?c\.? ?kimlik/),
    meslek: bul(/^mesle/),
    departman: bul(/^departman/),
    grup: bul(/^grup/),
    sube: bul(/^sube/)
  };
}

/* ---------- Kişi eşleştirme (TC → sicil → ad; personel-aktar kuralları) ---------- */
function kisiIndeksleri(personel) {
  const tc = {}, sicil = {}, ad = {};
  personel.forEach((k) => {
    const t = norm(k.tcKimlik || k.tc).replace(/\D/g, '');
    const s = norm(k.sicil).replace(/\s/g, '');
    const a = norm(k.adSoyad);
    if (t && !tc[t]) { tc[t] = k; }
    if (s && !sicil[s]) { sicil[s] = k; }
    if (a && !ad[a]) { ad[a] = k; }
  });
  return { tc: tc, sicil: sicil, ad: ad };
}
function kisiBul(ind, row, kolon) {
  const t = kolon.tc > -1 ? String(row[kolon.tc] == null ? '' : row[kolon.tc]).replace(/\D/g, '') : '';
  if (t.length === 11 && ind.tc[t]) { return { kisi: ind.tc[t], anahtar: 'TC' }; }
  const s = norm(kolon.sicilIdx != null ? row[kolon.sicilIdx] : row[0]).replace(/\s/g, '');
  if (s && ind.sicil[s]) { return { kisi: ind.sicil[s], anahtar: 'sicil' }; }
  const a = norm(kolon.adIdx != null ? row[kolon.adIdx] : row[1]);
  if (a && ind.ad[a]) { return { kisi: ind.ad[a], anahtar: 'ad' }; }
  return null;
}
/* ---------- Ana akış ---------- */
function veriKaynagiYukle() {
  if (bulutIstek) {
    return bulutSatirOku().then((satir) => {
      if (!satir) { throw new Error('Bulutta bu oda için satır bulunamadı.'); }
      yaz('BULUT             : ' + KIMLIK.url + ' · tablo ' + TABLO);
      yaz('  Oda              : ' + KIMLIK.oda.slice(0, 3) + '••• (' + KIMLIK.oda.length + ' karakter)');
      yaz('  Satır damgası     : ' + satir.guncelleme);
      return { baseline: satir, veri: JSON.parse(JSON.stringify(satir.veri)) };
    });
  }
  if (yerelDosya) {
    const ham = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), String(yerelDosya)), 'utf8'));
    const govde = Array.isArray(ham) ? (ham[0] || {}).veri : (ham.veri || ham);
    return Promise.resolve({ baseline: { guncelleme: '', veri: govde }, veri: JSON.parse(JSON.stringify(govde)) });
  }
  return Promise.resolve({ baseline: { guncelleme: '', veri: null }, veri: null });
}

(async function main() {
  const tamYol = path.resolve(process.cwd(), hedefDosya);
  if (!fs.existsSync(tamYol)) { yaz('DOSYA BULUNAMADI: ' + tamYol); bitir(1); }
  const sayfalar = await ISG.excel.xlsxOku(baytlariOku(tamYol));
  const ana = sayfalar.filter((s) => /tam\s*list/.test(norm(s.ad || '')))[0] ||
    sayfalar.slice().sort((a, b) => (b.satirlar || []).length - (a.satirlar || []).length)[0];
  if (!ana) { yaz('Okunabilir sayfa yok.'); bitir(1); }
  const anaSatirlar = ana.satirlar || [];
  const baslik = baslikBul(anaSatirlar);
  if (!baslik) { yaz('Başlık satırı bulunamadı (Sicil No + Adı Soyadı aranır).'); bitir(1); }
  const kolon = yilBloklari(anaSatirlar, baslik.indeks);
  kolon.sicilIdx = baslik.sicil;
  kolon.adIdx = baslik.ad;
  const yillar = Object.keys(kolon.bloklar).filter((y) => kolon.bloklar[y].tarih != null).sort();
  yaz('DOSYA             : ' + path.basename(tamYol));
  yaz('  Ana sayfa        : "' + ana.ad + '" (' + anaSatirlar.length + ' satır) · yıl blokları: ' + yillar.join(', '));

  /* Bayrak sayfaları: TC (yoksa ad) anahtarı → sayfa adı listesi. */
  const bayraklar = {};
  const bayrakSayfa = (re) => {
    const s = sayfalar.filter((x) => x !== ana && re.test(norm(x.ad || '')))[0];
    if (!s) { return; }
    const b = baslikBul(s.satirlar || []);
    if (!b) { return; }
    const tI = (s.satirlar[b.indeks] || []).map(norm).findIndex((h) => /t\.?c\.? ?kimlik/.test(h));
    let adet = 0;
    (s.satirlar || []).slice(b.indeks + 1).forEach((row) => {
      const adN = norm(row[b.ad]);
      if (!adN) { return; }
      const t = tI > -1 ? String(row[tI] == null ? '' : row[tI]).replace(/\D/g, '') : '';
      const anahtarlar = [];
      if (t) { anahtarlar.push('tc:' + t); }
      anahtarlar.push('ad:' + adN);
      anahtarlar.forEach((a) => { (bayraklar[a] = bayraklar[a] || []); });
      anahtarlar.forEach((a) => {
        if (bayraklar[a].indexOf(String(s.ad).trim()) < 0) { bayraklar[a].push(String(s.ad).trim()); }
      });
      adet += 1;
    });
    yaz('  Bayrak sayfası   : "' + s.ad + '" → ' + adet + ' kişi');
  };
  [/malul/i, /uygun\s*degil/i, /tarama/i, /riskl/i].forEach(bayrakSayfa);
  const bayrakAl = (tc, adN) => (bayraklar['tc:' + tc] || bayraklar['ad:' + adN] || []);

  const kaynak = await veriKaynagiYukle();
  if (!kaynak.veri) {
    yaz('');
    yaz('VERİ KAYNAĞI YOK: kişi eşleşmesi için kayıtlı personel gerekir (--bulut veya --yerel=veri.json).');
    bitir(1);
  }
  const veri = kaynak.veri;
  let hedefIsyeri = null;
  if (isyeriIstek) {
    const sade = (s) => norm(s).replace(/[^a-z0-9]/g, '');
    hedefIsyeri = (veri.isyerleri || []).filter((i) =>
      i.id === isyeriIstek || norm(i.ad) === norm(isyeriIstek) || sade(i.ad) === sade(isyeriIstek))[0];
    if (!hedefIsyeri) {
      yaz('İŞYERİ BULUNAMADI: "' + isyeriIstek + '" · kayıtlılar: ' +
        (veri.isyerleri || []).map((i) => i.ad + ' (' + i.id + ')').join(' · '));
      bitir(1);
    }
    yaz('  Hedef işyeri     : ' + hedefIsyeri.ad + ' (' + hedefIsyeri.id + ')');
  }
  const personel = (veri.personel || []).filter((k) => !hedefIsyeri || k.isyeriId === hedefIsyeri.id);
  const ind = kisiIndeksleri(personel);
  yaz('  Kayıtlı personel : ' + personel.length + (hedefIsyeri ? ' (hedef işyeri)' : ' (tüm işyerleri)'));

  const mevcutAnahtar = {};
  /* --sifirla: yalnızca daha önce Excel aktarımıyla açılmış kayıtları kaldırır. */
  let oncekiAktarim = [];
  if (sifirlaIstek) {
    oncekiAktarim = (veri.saglikTakip || []).filter(aktarimKaydi);
    veri.saglikTakip = (veri.saglikTakip || []).filter((k) => !aktarimKaydi(k));
    yaz('  Sıfırlama        : ' + oncekiAktarim.length + ' eski aktarım kaydı silinecek (elle girilenler korunur)');
  }
  ((veri.saglikTakip || []).filter((k) => k && k.personelId && k.tarih))
    .forEach((k) => { mevcutAnahtar[k.personelId + '|' + k.tarih] = true; });
  yaz('  Mevcut sağlık kaydı: ' + (veri.saglikTakip || []).length + ' (mükerrer filtresi aktif)');

  const yeniKayitlar = [];
  const eklenenAnahtar = {};
  let eslesen = 0, eslesmeyen = 0, tarihizKisi = 0, atlananMukerrer = 0;
  const eslesmeyenOrnek = [];
  const yilSayac = {};

  (anaSatirlar || []).slice(baslik.indeks + 1).forEach((row) => {
    const adSoyad = String(row[baslik.ad] == null ? '' : row[baslik.ad]).trim();
    if (!adSoyad) { return; }
    const bulgu = kisiBul(ind, row, kolon);
    if (!bulgu) {
      eslesmeyen += 1;
      if (eslesmeyenOrnek.length < sinir) { eslesmeyenOrnek.push(adSoyad + ' (sicil ' + row[baslik.sicil] + ')'); }
      return;
    }
    eslesen += 1;
    const kisi = bulgu.kisi;
    const tcAnahtar = kolon.tc > -1 ? String(row[kolon.tc] == null ? '' : row[kolon.tc]).replace(/\D/g, '') : '';
    const bayrakListe = bayrakAl(tcAnahtar, norm(adSoyad));
    const malul = bayrakListe.some((b) => /malul/i.test(norm(b)));
    let tarihGoruldu = false;
    yillar.forEach((yil) => {
      const blok = kolon.bloklar[yil];
      const tarih = excelTarih(row[blok.tarih]);
      if (!tarih) { return; }
      tarihGoruldu = true;
      const anahtar = kisi.id + '|' + tarih;
      if (mevcutAnahtar[anahtar] || eklenenAnahtar[anahtar]) { atlananMukerrer += 1; return; }
      eklenenAnahtar[anahtar] = true;
      const oku = (i) => (i != null ? String(row[i] == null ? '' : row[i]).trim() : '');
      const meslek = oku(kolon.meslek);
      const parcalar = [];
      if (meslek) { parcalar.push('Meslek: ' + meslek); }
      if (kolon.departman > -1 && row[kolon.departman]) { parcalar.push('Departman: ' + String(row[kolon.departman]).trim()); }
      if (kolon.grup > -1 && row[kolon.grup]) { parcalar.push('Grup: ' + String(row[kolon.grup]).trim()); }
      if (bayrakListe.length) { parcalar.push('Excel bayrağı: ' + bayrakListe.join(', ')); }
      parcalar.push('Kaynak: ' + path.basename(tamYol) + ' · ' + yil + ' blok');
      const duz = {
        id: ISG.yeniId('sk'), personelId: kisi.id, isyeriId: kisi.isyeriId, tarih: tarih,
        doktor: '', kanGrubu: '', alerji: '', kronikHastalik: '', ilac: '',
        engelDurumu: malul ? 'Maluliyet sayfasında işaretli (Excel aktarımı)' : '',
        sonMuayene: oku(blok.sonuc),
        sevkEdilen: oku(blok.sevk),
        calismaYasagi: yasakBul(oku(blok.sonuc)),
        izinsizlik: '',
        calismaSesi: calismaSesiTahmin(meslek),
        notlar: parcalar.join(' · ').slice(0, 400), girisYapan: 'aktarim-excel'
      };
      const kayit = {};
      Object.keys(duz).forEach((alan) => {
        const deger = duz[alan];
        kayit[alan] = (ISG.saglikGizliAlanlar.indexOf(alan) > -1 && deger) ? ISG.saglikTakip.sifrele(deger) : deger;
      });
      yeniKayitlar.push(kayit);
      yilSayac[yil] = (yilSayac[yil] || 0) + 1;
    });
    if (!tarihGoruldu) { tarihizKisi += 1; }
  });

  yaz('');
  yaz('EŞLEŞME SONUCU    : ' + eslesen + ' kişi eşleşti · ' + eslesmeyen + ' kişi eşleşmedi' +
    ' · ' + tarihizKisi + ' eşleşen kişide muayene tarihi yok (kayıt açılmadı)');
  if (Object.keys(yilSayac).length) {
    yaz('YIL BAZLI KAYIT   : ' + Object.keys(yilSayac).sort().map((y) => y + ': ' + yilSayac[y]).join(' · '));
  }
  yaz('ÜRETİLECEK KAYIT  : ' + yeniKayitlar.length + ' yeni · ' + atlananMukerrer + ' mükerrer atlandı');
  if (eslesmeyenOrnek.length) {
    yaz('EŞLEŞMEYEN ÖRNEK  : ' + eslesmeyenOrnek.slice(0, sinir).join(' | '));
    if (eslesmeyen > eslesmeyenOrnek.length) { yaz('  (tam eşleşmeyen sayısı: ' + eslesmeyen + ')'); }
  }
  if (!yeniKayitlar.length && !(sifirlaIstek && oncekiAktarim.length)) {
    yaz(''); yaz('YENİ KAYIT YOK — yazma yapılmadı.'); bitir(0);
  }

  if (!yeniKayitlar.length) {
    yaz('');
    yaz('SIFIRLAMA MODU    : yeni kayıt yok, yalnızca ' + oncekiAktarim.length + ' eski aktarım kaydı silinecek.');
  } else {
  const ornek = yeniKayitlar[0];
  const ornekDuz = {};
  Object.keys(ornek).forEach((alan) => {
    ornekDuz[alan] = (ISG.saglikGizliAlanlar.indexOf(alan) > -1) ? ISG.saglikTakip.coz(ornek[alan]) : ornek[alan];
  });
  const ornekKisi = (veri.personel || []).filter((p) => p.id === ornekDuz.personelId)[0] || {};
  yaz('');
  yaz('ÖRNEK KAYIT       : ' + (ornekKisi.adSoyad || '?') + ' · ' + ornekDuz.tarih +
    ' · sonuç: "' + String(ornekDuz.sonMuayene || '').slice(0, 40) + '"' +
    ' · sevk: "' + String(ornekDuz.sevkEdilen || '').slice(0, 40) + '"' +
    ' · ses: ' + (ornekDuz.calismaSesi || '-'));

  }

  if (!yazIstek) {
    yaz('');
    yaz('YAZMA YAPILMADI (onay modu). Tablo/rapor uygunsa aynı komuta --yaz ekleyin.');
    bitir(0);
  }

  /* ---- Yazma: baseline + delta + yedek (personel-aktar kalıbı) ---- */
  const baselineImza = JSON.stringify(kaynak.baseline.veri);
  const denetim = {
    id: ISG.yeniId('dnmv'), tur: 'yazma', islem: 'saglikTopluEkle',
    ozet: 'Sağlık takip Excel aktarımı · ' + yeniKayitlar.length + ' kayıt · ' + path.basename(tamYol),
    tarih: new Date().toISOString(), guncelleme: new Date().toISOString(),
    isyeriId: hedefIsyeri ? hedefIsyeri.id : '', kullaniciAd: 'Aktarım aracı (CLI)', kullaniciId: ''
  };
  if (sifirlaIstek) { denetim.ozet += ' · sifirlanan ' + oncekiAktarim.length + ' eski aktarim kaydi'; }
  if (bulutIstek) {
    yedekle(kaynak.baseline);
    return bulutSatirOku().then((taze) => {
      if (!taze) { throw new Error('Bulut satırı bulunamadı; yazma iptal.'); }
      let gonderilecek;
      if (JSON.stringify(taze.veri) !== baselineImza) {
        yaz('');
        yaz('  EŞZAMANLI DEĞİŞİKLİK: taze yığına yalnızca yeni kayıt deltası uygulanıyor.');
        const t = JSON.parse(JSON.stringify(taze.veri));
        t.saglikTakip = t.saglikTakip || [];
        if (sifirlaIstek) {
          const silinen = t.saglikTakip.filter(aktarimKaydi).length;
          t.saglikTakip = t.saglikTakip.filter((k) => !aktarimKaydi(k));
          yaz('  Delta ile silinen : ' + silinen + ' eski aktarim kaydi');
        }
        const varAnahtar = {};
        t.saglikTakip.forEach((k) => {
          if (k && k.personelId && k.tarih) { varAnahtar[k.personelId + '|' + k.tarih] = true; }
        });
        let ek = 0;
        yeniKayitlar.forEach((k) => {
          const a = k.personelId + '|' + k.tarih;
          if (varAnahtar[a]) { return; }
          varAnahtar[a] = true; t.saglikTakip.push(k); ek += 1;
        });
        if ((t.denetim || []).length < 150) { t.denetim.push(denetim); }
        yaz('  Delta ile eklenen : ' + ek + ' / ' + yeniKayitlar.length);
        gonderilecek = t;
      } else {
        veri.saglikTakip = (veri.saglikTakip || []).concat(yeniKayitlar);
        if ((veri.denetim || []).length < 150) { veri.denetim.push(denetim); }
        gonderilecek = veri;
      }
      return bulutIste('?oda=eq.' + encodeURIComponent(KIMLIK.oda), {
        method: 'PATCH',
        body: { veri: gonderilecek, guncelleme: new Date().toISOString() },
        headers: { Prefer: 'return=representation' }
      });
    }).then(() => bulutSatirOku()).then((son) => {
      const adet = son && son.veri ? ((son.veri.saglikTakip || []).length) : -1;
      yaz('');
      yaz('BULUTA YAZILDI    : toplam saglikTakip kaydı = ' + adet);
      bitir(0);
    });
  }
  /* Yerel JSON dosyasına yazma (--yerel=...). */
  veri.saglikTakip = (veri.saglikTakip || []).concat(yeniKayitlar);
  veri.denetim = veri.denetim || [];
  if (veri.denetim.length < 150) { veri.denetim.push(denetim); }
  const ciktiYol = path.resolve(process.cwd(), String(yerelDosya));
  fs.mkdirSync(path.resolve(process.cwd(), yedekKlasor), { recursive: true });
  fs.writeFileSync(path.join(process.cwd(), yedekKlasor, 'yerel-on-yedek-' + Date.now() + '.json'),
    JSON.stringify(kaynak.baseline.veri, null, 2), 'utf8');
  fs.writeFileSync(ciktiYol, JSON.stringify(veri, null, 2), 'utf8');
  yaz('');
  yaz('YEREL DOSYAYA YAZILDI: ' + ciktiYol + ' · saglikTakip=' + veri.saglikTakip.length);
  bitir(0);
})().catch((hata) => {
  yaz('HATA: ' + (hata && hata.message ? hata.message : hata));
  bitir(1);
});



