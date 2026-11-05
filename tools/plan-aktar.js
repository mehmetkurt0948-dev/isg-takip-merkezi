#!/usr/bin/env node
/* İSG Takip Merkezi — yıllık çalışma planı aktarım ve doğrulama aracı
   Kurumlardan gelen yıllık çalışma planı dosyasını (.xlsx/.csv) uygulamanın kendi
   ayrıştırıcısıyla (assets/js/plan-toplu.js) okur; faaliyetleri, ana başlıkları,
   ayları, mükerrer ve hatalı satırları raporlar ve istenirse hedef iş yerine yazar.
   Varsayılan davranış KURUDUR: hiçbir yere yazmaz.

   Kullanım:
     node tools/plan-aktar.js "2026 YILLIK ÇALIŞMA PLANI.xlsx" --isyeri="Aski - 1" --bulut
     node tools/plan-aktar.js plan.xlsx --isyeri=iy5 --bulut --yaz --rapor=rapor.txt
     node tools/plan-aktar.js plan.xlsx --isyeri=iy5 --fixture
     node tools/plan-aktar.js plan.xlsx --isyeri="Aski - 1" --hazirla=yukleme.xlsx

   --isyeri : hedef iş yeri kimliği veya adı (tek eşleşme şart; başka iş yerine yazılmaz)
   --yil    : plan yılı; boşsa dosya başlığından okunur
   --bulut  : hedef veri olarak Supabase'deki canlı satır okunur (salt okunur)
   --yaz    : yalnızca --bulut ile birlikte: değişikliği buluta yazar. Yazmadan önce
              satırın tam yedeği alınır, yazmadan hemen önce satır yeniden okunup
              eşzamanlı değişiklik denetlenir.
   --yerel  : bulut yerine yerel JSON veri dosyası üzerinden çalışır
   --cikti  : güncellenmiş veri yığınını dosyaya yazar (yerel geri yükleme)
   --hazirla: yalnızca kaydedilecek faaliyetleri standart şablonla XLSX yazar
              (arayüzden "Excel'den toplu yükle" ile aynen yüklenebilir dosya)
   --json   : kaydedilecek faaliyetleri uygulamanın kayıt biçiminde JSON yazar
   --fixture: demo veritabanı yüklenir, yazma denemesi burada yapılır
   --sinir  : raporda listelenecek satır sayısı (varsayılan 40)
   --yedek  : bulut yedeğinin yazılacağı klasör (varsayılan: yedek-plan)
   --denetim-yok : buluta denetim izi kaydı eklenmez
   --rapor  : raporu dosyaya da yazar (konsol Türkçe karakteri için önerilir) */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

const kok = path.resolve(__dirname, '..');
const argumanlar = process.argv.slice(2);
const raporSatirlari = [];

function bayrak(ad) {
  const bulunan = argumanlar.filter((a) => a.indexOf('--' + ad + '=') === 0)[0];
  if (bulunan) { return bulunan.split('=').slice(1).join('='); }
  return argumanlar.indexOf('--' + ad) > -1 ? true : '';
}

function yaz(metin) {
  const satirMetni = String(metin);
  raporSatirlari.push(satirMetni);
  console.log(satirMetni);
}

function bitir(kod) {
  const cikti = bayrak('rapor');
  if (cikti) {
    const yol = path.resolve(process.cwd(), String(cikti));
    fs.writeFileSync(yol, raporSatirlari.join('\n') + '\n', 'utf8');
    console.log('Rapor dosyası: ' + yol);
  }
  process.exit(kod || 0);
}

const hedefDosya = argumanlar.filter((a) => a.indexOf('--') !== 0)[0];
if (!hedefDosya) {
  console.log('Kullanım: node tools/plan-aktar.js <plan.xlsx|.csv> --isyeri=<id|ad> ' +
    '[--yil=2026] [--bulut] [--yaz] [--yerel=veri.json] [--cikti=veri.json] ' +
    '[--hazirla=yukleme.xlsx] [--json=kayitlar.json] [--fixture] [--sinir=40] [--rapor=rapor.txt]');
  process.exit(1);
}

const isyeriIstek = String(bayrak('isyeri') || '').trim();
const yilIstek = Number(bayrak('yil')) || 0;
const bulutIstek = bayrak('bulut') === true;
const yazIstek = bayrak('yaz') === true;
const yerelDosya = bayrak('yerel');
const ciktiDosya = bayrak('cikti');
const hazirlaDosya = bayrak('hazirla');
const jsonCikti = bayrak('json');
const fixture = bayrak('fixture') === true;
const sinir = Number(bayrak('sinir')) || 40;
const yedekKlasor = String(bayrak('yedek') || 'yedek-plan');
const denetimYok = bayrak('denetim-yok') === true;

if (!isyeriIstek) {
  yaz('--isyeri verilmeli: hedef iş yeri kimliği veya adı. İş yeri seçilmeden plan kaydı yazılmaz.');
  bitir(1);
}
if (yazIstek && !bulutIstek) {
  yaz('--yaz yalnızca --bulut ile birlikte kullanılır (yerel/örnek veride kalıcı yazma denenemez).');
  bitir(1);
}

/* Uygulama modülleri tarayıcıdaki sırayla yüklenir: ayrıştırma, mükerrer ve
   kayıt kuralları arayüzle birebir aynı kalır. */
const dom = new JSDOM('<!doctype html><html><body></body></html>',
  { url: 'http://127.0.0.1/', pretendToBeVisual: true, runScripts: 'outside-only' });
const ctx = dom.getInternalVMContext();
ctx.DecompressionStream = globalThis.DecompressionStream;
ctx.Blob = globalThis.Blob;
ctx.fetch = globalThis.fetch;
['varsayilan-veri.js', 'depo.js', 'bicim.js', 'excel.js', 'plan-toplu.js'].forEach((ad) => {
  vm.runInContext(fs.readFileSync(path.join(kok, 'assets/js', ad), 'utf8'), ctx, { filename: ad });
});
const ISG = dom.window.ISG;

/* ---------- Bulut (Supabase) ---------- */

function kimlikOku() {
  const kaynak = fs.readFileSync(path.join(kok, 'assets/js/bulut-kimlik.js'), 'utf8');
  const al = (ad) => {
    const eslesme = kaynak.match(new RegExp(ad + ":\\s*'([^']*)'"));
    return eslesme ? eslesme[1].trim() : '';
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
    apikey: KIMLIK.anahtar,
    Authorization: 'Bearer ' + KIMLIK.anahtar,
    Accept: 'application/json'
  }, secenek.headers || {});
  const istekSecenek = { method: secenek.method || 'GET', headers: basliklar, cache: 'no-store' };
  if (secenek.body) {
    basliklar['Content-Type'] = 'application/json';
    istekSecenek.body = secenek.body;
  }
  if (istekSecenek.body) {
    istekSecenek.body = JSON.stringify(istekSecenek.body);
  }
  return globalThis.fetch(KIMLIK.url + '/rest/v1/' + TABLO + yol, istekSecenek)
    .then((yanit) => yanit.text().then((metin) => {
      let govde = null;
      try { govde = metin ? JSON.parse(metin) : null; } catch (hata) { govde = null; }
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
  const damga = new Date().toISOString().replace(/[:.]/g, '-');
  const yol = path.join(klasor, 'isg-veri-' + damga + '.json');
  fs.writeFileSync(yol, JSON.stringify(satir, null, 2), 'utf8');
  const veri = satir.veri || {};
  yaz('  Yedek              : ' + yol);
  yaz('  Yedek boyutu       : ' + fs.statSync(yol).size + ' bayt · ' +
    ((veri.planlar) || []).length + ' plan kaydı · ' + ((veri.personel) || []).length + ' personel');
  return yol;
}


/* ---------- Yardımcılar ---------- */

function baytlariOku(yol) {
  const tampon = fs.readFileSync(yol);
  const baytlar = new Uint8Array(tampon.length);
  for (let i = 0; i < tampon.length; i += 1) { baytlar[i] = tampon[i]; }
  return baytlar;
}

function csvSatirlari(metin) {
  return String(metin).split(/\r?\n/).map((satir) => {
    const hucreler = [];
    let mevcut = '';
    let tirnak = false;
    for (let i = 0; i < satir.length; i += 1) {
      const karakter = satir[i];
      if (karakter === '"') {
        if (tirnak && satir[i + 1] === '"') { mevcut += '"'; i += 1; } else { tirnak = !tirnak; }
      } else if (karakter === ',' && !tirnak) { hucreler.push(mevcut); mevcut = ''; } else { mevcut += karakter; }
    }
    hucreler.push(mevcut);
    return hucreler;
  });
}

/* Çok sayfalı iş kitabında plan sayfasını seç: tablo başlığı bulunan sayfa
   aranır; başlık bulunamazsa ilk sayfa denenir (hata raporu ayrıştırıcıdan gelir). */
function sayfaSec(sayfalar, secenekler) {
  const liste = sayfalar || [];
  const havuz = [];
  liste.forEach((sayfa) => {
    const satirlar = (sayfa && sayfa.satirlar) || [];
    let baslik = -1;
    for (let i = 0; i < satirlar.length && i < 60; i += 1) {
      if (ISG.planToplu.haritaBul(satirlar[i], satirlar[i + 1])) { baslik = i; break; }
    }
    if (baslik > -1) { havuz.push({ ad: sayfa.ad, satirlar: satirlar }); }
  });
  const adayHavuzu = havuz.length ? havuz :
    liste.map((sayfa) => ({ ad: sayfa.ad, satirlar: (sayfa && sayfa.satirlar) || [] }));
  let enIyi = null;
  adayHavuzu.forEach((kaynak) => {
    const analiz = ISG.planToplu.analizEt(kaynak.satirlar, secenekler);
    const puan = analiz.hata ? -1000 :
      (analiz.ozet.hazir * 10 + analiz.ozet.ayIsaret) - (analiz.ozet.hatali + analiz.ozet.mukerrer);
    if (enIyi === null || puan > enIyi.puan) {
      enIyi = { puan: puan, analiz: analiz, satirlar: kaynak.satirlar, ad: kaynak.ad };
    }
  });
  return enIyi;
}

/* Hedef iş yeri: kimlik veya ad ile çözülür; tek eşleşme şarttır. */
function isyeriCoz(veri, istek) {
  const liste = veri.isyerleri || [];
  const norm = ISG.planToplu.norm;
  const istenen = norm(istek);
  const kimlik = liste.filter((isyeri) => isyeri.id === istek);
  if (kimlik.length === 1) { return { isyeri: kimlik[0], aday: false }; }
  const tamAd = liste.filter((isyeri) => norm(isyeri.ad) === istenen);
  if (tamAd.length === 1) { return { isyeri: tamAd[0], aday: false }; }
  const kismi = liste.filter((isyeri) => norm(isyeri.ad).indexOf(istenen) > -1);
  if (kismi.length === 1) { return { isyeri: kismi[0], aday: true }; }
  const adaylar = (kismi.length ? kismi : tamAd).map((isyeri) => isyeri.id + ' = ' + isyeri.ad);
  return { isyeri: null, adaylar: adaylar };
}

function planSayimlari(veri, hedefId, yil) {
  const harita = {};
  (veri.isyerleri || []).forEach((isyeri) => { harita[isyeri.id] = 0; });
  let hedefYil = 0;
  (veri.planlar || []).forEach((plan) => {
    if (plan && typeof harita[plan.isyeriId] !== 'undefined') { harita[plan.isyeriId] += 1; }
    if (plan && plan.isyeriId === hedefId && (!yil || ISG.planYil(plan) === yil)) { hedefYil += 1; }
  });
  return { isiYeri: harita, hedefYil: hedefYil };
}

function sayilariYaz(veri, etiket, hedefId, yil) {
  const sayim = planSayimlari(veri, hedefId, yil);
  const satirlar = (veri.isyerleri || []).map((isyeri) =>
    isyeri.ad + ': ' + (sayim.isiYeri[isyeri.id] || 0) + (isyeri.id === hedefId ? ' (HEDEF)' : ''));
  yaz('  ' + etiket + ' ' + satirlar.join(' · '));
  if (yil) { yaz('  ' + etiket + 'hedef / ' + yil + ' yılı  : ' + sayim.hedefYil + ' plan kaydı'); }
}

/* İzolasyon imzası: her koleksiyonun kayıt sayısı + JSON uzunluğu, hedef iş yeri
   dışındaki plan satırlarının tamamı, ayarlar ve eşitleme damgaları. */
function imza(veri, hedefIsyeriId) {
  const ozet = {};
  Object.keys(veri).sort().forEach((anahtar) => {
    const deger = veri[anahtar];
    if (!Array.isArray(deger)) { return; }
    if (anahtar === 'planlar') {
      const hedefDisi = deger.filter((kayit) => kayit && kayit.isyeriId !== hedefIsyeriId)
        .slice().sort((a, b) => String(a.id).localeCompare(String(b.id)));
      ozet.planDisi = hedefDisi.length + '/' + JSON.stringify(hedefDisi).length;
      ozet.planHedef = deger.filter((kayit) => kayit && kayit.isyeriId === hedefIsyeriId).length;
      return;
    }
    ozet[anahtar] = deger.length + '/' + JSON.stringify(deger).length;
  });
  ozet.ayarlar = JSON.stringify(veri.ayarlar || {});
  const senkron = veri.senkron || {};
  ozet.senkronKayit = String(Object.keys(senkron.kayit || {}).length) +
    '/' + JSON.stringify(senkron.kayit || {}).length;
  ozet.senkronSilinen = String(Object.keys(senkron.silinen || {}).length) +
    '/' + JSON.stringify(senkron.silinen || {}).length;
  return ozet;
}

function imzaFarki(once, sonra, atlananlar) {
  const atla = atlananlar || [];
  const farklar = [];
  Object.keys(Object.assign({}, once, sonra)).forEach((anahtar) => {
    if (anahtar === 'planHedef' || anahtar === 'senkronKayit' ||
        anahtar === 'planDisi' || atla.indexOf(anahtar) > -1) { return; }
    if (String(once[anahtar]) !== String(sonra[anahtar])) {
      farklar.push(anahtar + ': ' + once[anahtar] + ' -> ' + sonra[anahtar]);
    }
  });
  if (String(once.planDisi) !== String(sonra.planDisi)) {
    farklar.push('DİĞER İŞ YERLERİNİN PLANLARI DEĞİŞTİ: ' +
      once.planDisi + ' -> ' + sonra.planDisi);
  }
  return farklar;
}

/* ---------- Rapor ---------- */

function durumListesi(analiz, durumAdi) {
  return (analiz.satirlar || []).filter((satir) => satir.durum === durumAdi);
}

function sorunlariListele(analiz, durumAdi, etiket) {
  const liste = durumListesi(analiz, durumAdi);
  yaz('');
  yaz(etiket + ' (' + liste.length + ')');
  if (!liste.length) { yaz('  (yok)'); return; }
  liste.slice(0, sinir).forEach((satir) => {
    const neden = (satir.nedenler || []).concat(satir.uyarilar || []).join(' | ');
    yaz('  satır ' + satir.satirNo + ' · ' + (satir.faaliyet || '(boş)') +
      (neden ? '  →  ' + neden : ''));
  });
  if (liste.length > sinir) {
    yaz('  … ' + (liste.length - sinir) + ' satır daha (tam liste için --sinir büyütün)');
  }
}

function dagilim(analiz, secim, yil, hedef) {
  const ozet = analiz.ozet;
  yaz('YILLIK ÇALIŞMA PLANI AKTARIM RAPORU');
  yaz('Dosya              : ' + secim.dosya);
  yaz('Okunan sayfa       : ' + secim.sayfaAd);
  yaz('Tablo başlığı      : satır ' + analiz.baslikSatir);
  yaz('Kurum              : ' + (secim.kurum || '(ayarlanmamış)'));
  yaz('Hedef iş yeri      : ' + hedef.ad + ' (' + hedef.id + ')' +
    (secim.adayWith ? '  [ad eşleşmesi kısmi]' : ''));
  yaz('Plan yılı          : ' + (yil || 'bilinmiyor'));
  yaz('Sütun eşlemesi     : ' + (function () {
    const h = analiz.harita || {};
    return 'sira=' + h.sira + ', anaBaslik=' + h.anaBaslik + ', faaliyet=' + h.faaliyet +
      ', sorumlu=' + h.sorumlu + ', aciklama=' + h.aciklama +
      ', aylar=' + (h.aylar || []).join('-') + (h.ayAdi ? ' (ay adlı)' : ' (ay numaralı)');
  })());
  yaz('');
  yaz('SAYIMLAR');
  yaz('  Dosya satırı       : ' + ozet.dosyaSatir);
  yaz('  Kaydedilecek       : ' + ozet.hazir + ' faaliyet');
  yaz('  Ay işareti         : ' + ozet.ayIsaret + ' (toplam planlanmış ay)');
  yaz('  Ay işareti yok     : ' + durumListesi(analiz, 'hazir').filter((s) => !(s.kayit.aylar || []).length).length +
    ' faaliyet (olay tabanlı; ay bilgisi olmadan kaydedilir)');
  yaz('  Mükerrer           : ' + ozet.mukerrer + ' (atlanır)');
  yaz('  Hatalı             : ' + ozet.hatali);
  yaz('  Örnek satır        : ' + ozet.ornek);
  yaz('  Ana başlık satırı  : ' + ozet.bolum);
  yaz('  Tablo/ay başlığı   : ' + ozet.baslik);
  yaz('  İmza/doküman       : ' + ozet.imza);
  yaz('');
  yaz('ANA BAŞLIKLAR (' + (analiz.bolumler || []).length + ')');
  (analiz.bolumler || []).forEach((ad) => yaz('  - ' + ad));
  yaz('');
  yaz('AY DAĞILIMI (işaret sayısı)');
  const dagilimAy = {};
  durumListesi(analiz, 'hazir').forEach((satir) => {
    (satir.kayit.aylar || []).forEach((ay) => { dagilimAy[ay] = (dagilimAy[ay] || 0) + 1; });
  });
  ISG.planToplu.AYLAR.forEach((ad, i) => {
    yaz('  ' + ad + ': ' + (dagilimAy[i + 1] || 0));
  });
  (analiz.uyarilar || []).forEach((uyari) => yaz('  UYARI · ' + uyari));
}

function kayitOzeti(analiz, adet) {
  const kayitlar = ISG.planToplu.uygulanacaklar(analiz).slice(0, adet);
  yaz('');
  yaz('FAALİYET ÖRNEKLERİ (ilk ' + kayitlar.length + ')');
  kayitlar.forEach((kayit) => {
    yaz('  ' + (kayit.siraExcel || '-') + ' | ' + (kayit.anaBaslik || '-') + ' | ' +
      kayit.faaliyet + ' | ' + (kayit.sorumlu || '-') +
      ' | aylar: ' + (kayit.aylar.length ? kayit.aylar.join(',') : 'yok') +
      ' | açıklama: ' + String(kayit.aciklama || '').slice(0, 60).replace(/\s+/g, ' '));
  });
}

/* ---------- Çıktı dosyaları ---------- */

function jsonYaz(dosyaAdi, kayitlar, hedef, yil) {
  const yol = path.resolve(process.cwd(), String(dosyaAdi));
  fs.writeFileSync(yol, JSON.stringify({
    isyeriId: hedef.id, isyeriAdi: hedef.ad, yil: yil,
    olusturma: new Date().toISOString(), kayitlar: kayitlar
  }, null, 2), 'utf8');
  yaz('JSON KAYIT LİSTESİ : ' + yol + ' (' + kayitlar.length + ' kayıt)');
  return yol;
}

/* Standart şablon çıktısı: kullanıcı bu dosyayı arayüzden "Excel'den toplu yükle"
   ile aynen geri yükleyebilir (gidiş-dönüş doğrulaması). */
function hazirlaYaz(dosyaAdi, kayitlar) {
  const sayfalar = ISG.planToplu.disaAktarSayfalar(kayitlar, {});
  const xlsx = ISG.excel.xlsxYaz(sayfalar);
  const tampon = xlsx instanceof Uint8Array ? Buffer.from(xlsx) : Buffer.from(String(xlsx));
  const yol = path.resolve(process.cwd(), String(dosyaAdi));
  fs.writeFileSync(yol, tampon);
  yaz('ŞABLON DOSYASI     : ' + yol + ' (' + kayitlar.length + ' faaliyet · ' + tampon.length + ' bayt)');
  return yol;
}

function hazirKayitlar(analiz, hedef, yil) {
  return ISG.planToplu.uygulanacaklar(analiz).map((kayit) => {
    const kopya = {};
    Object.keys(kayit).forEach((anahtar) => { kopya[anahtar] = kayit[anahtar]; });
    kopya.isyeriId = hedef.id;
    kopya.yil = yil || kopya.yil || 0;
    return kopya;
  });
}

/* ---------- Yazma ---------- */

function denetimKaydi(hedef, adet, yil, dosyaAdi) {
  const simdi = new Date().toISOString();
  return {
    id: ISG.yeniId('dnmv'),
    tur: 'yazma',
    islem: 'planTopluEkle',
    ozet: 'Yıllık çalışma planı aktarımı · ' + yil + ' yılı · ' + adet +
      ' faaliyet · ' + dosyaAdi + ' (aktarım aracı)',
    tarih: simdi,
    guncelleme: simdi,
    isyeriId: hedef.id,
    kullaniciAd: 'Aktarım aracı (CLI)',
    kullaniciId: ''
  };
}

/* Eşitleme damgaları: mevcut kayıtların damgası AYNEN kalmalı, mezar taşları
   silinmemeli; yalnızca yeni plan kayıtları için damga eklenmiş olmalı. */
function senkronDenetimi(onceVeri, sonraVeri) {
  const once = (onceVeri.senkron || {}).kayit || {};
  const sonra = (sonraVeri.senkron || {}).kayit || {};
  const onceSilinen = (onceVeri.senkron || {}).silinen || {};
  const sonraSilinen = (sonraVeri.senkron || {}).silinen || {};
  const degisen = Object.keys(once).filter((kod) => String(sonra[kod]) !== String(once[kod]));
  const yeni = Object.keys(sonra).filter((kod) => typeof once[kod] === 'undefined');
  const kaybolanMezar = Object.keys(onceSilinen).filter((kod) => !sonraSilinen[kod]);
  return {
    degisen: degisen.length,
    yeni: yeni.length,
    yeniPlan: yeni.filter((kod) => kod.indexOf('planlar|') === 0).length,
    disindakiler: yeni.filter((kod) => kod.indexOf('planlar|') !== 0).length,
    kaybolanMezar: kaybolanMezar.length
  };
}

/* Uygulamanın kendi kayıt yolunu kullanır: ISG.depo.planTopluEkle tek iş yerine
   tek yazım yapar ve yalnızca YENİ kayıtları damgalar. */
function kayitlariYaz(analiz, hedef, yil, secenekler) {
  const onceki = JSON.parse(JSON.stringify(ISG.depo.al()));
  const beklenen = durumListesi(analiz, 'hazir').length;
  const sonuc = ISG.planToplu.uygula(analiz, secenekler);
  const sonraki = ISG.depo.al();
  const yeniKayitlar = (sonuc.idler || []).map((id) => JSON.parse(JSON.stringify(
    (sonraki.planlar || []).filter((plan) => plan.id === id)[0] || { id: id })));
  const hedefDisi = yeniKayitlar.filter((plan) => plan.isyeriId !== hedef.id).length;
  const yanlisYil = yeniKayitlar.filter((plan) => yil && ISG.planYil(plan) !== yil).length;

  yaz('');
  yaz('YAZMA DENEMESİ' + (yazIstek ? ' (BULUTA YAZILACAK)' : ' (SANDIK / KURU DENEME)'));
  yaz('  Eklenen            : ' + (sonuc.eklenen || 0) + ' / beklenen ' + beklenen +
    (beklenen - (sonuc.eklenen || 0) ? '  · FARK VAR!' : ''));
  yaz('  Mükerrer           : ' + sonuc.mukerrer + ' · Hatalı: ' + sonuc.hatali);
  if (hedefDisi) { yaz('  İHLAL: ' + hedefDisi + ' kayıt hedef dışı iş yerine yazılmış!'); }
  if (yanlisYil) { yaz('  İHLAL: ' + yanlisYil + ' kayıt başka yıla yazılmış!'); }
  const izolasyon = imzaFarki(imza(onceki, hedef.id), imza(sonraki, hedef.id));
  if (izolasyon.length) {
    yaz('  İZOLASYON İHLALİ : ' + izolasyon.join(' | '));
  } else {
    yaz('  İzolasyon        : OK — diğer iş yerlerinin planları ve tüm diğer koleksiyonlar bayt bayt aynı');
  }
  const planlar = (sonraki.planlar || []).filter((plan) => plan.isyeriId === hedef.id &&
    (!yil || ISG.planYil(plan) === yil));
  yaz('  Hedef / yıl        : ' + planlar.length + ' kayıt · ' +
    planlar.reduce((toplam, plan) => toplam + ISG.planAylari(plan).length, 0) + ' ay işareti');
  sayilariYaz(sonraki, 'İş yeri sayıları   : ', hedef.id, yil);
  return { sonuc: sonuc, yeniKayitlar: yeniKayitlar, oncekiVeri: onceki, veri: sonraki };
}

/* Buluta yazma: yazmadan hemen önce satır yeniden okunur. Okuma ile yazma arasında
   başkası yazmışsa tam yığın gönderilmez; yalnızca yeni plan kayıtlarının deltası
   taze yığına eklenir (hiçbir kayıt silinmez). */
function bulutaYaz(baseline, hedef, yeniKayitlar, guncelVeri, denetimKayit) {
  const baselineImza = JSON.stringify(baseline.veri);
  return bulutSatirOku().then((taze) => {
    if (!taze) { throw new Error('Bulut satırı bulunamadı; yazma iptal.'); }
    let gonderilecekVeri = guncelVeri;
    if (JSON.stringify(taze.veri) !== baselineImza) {
      yaz('');
      yaz('  EŞZAMANLI DEĞİŞİKLİK: okuma ile yazma arasında bulut satırı değişmiş.');
      yaz('  Tam yığın yerine yalnızca yeni plan kayıtlarının deltası taze yığına uygulanıyor.');
      const tazeVeri = JSON.parse(JSON.stringify(taze.veri));
      const varIdler = {};
      tazeVeri.planlar = tazeVeri.planlar || [];
      tazeVeri.planlar.forEach((plan) => { varIdler[plan.id] = true; });
      tazeVeri.senkron = tazeVeri.senkron || { kayit: {}, silinen: {}, ayarlar: '' };
      tazeVeri.senkron.kayit = tazeVeri.senkron.kayit || {};
      tazeVeri.denetim = tazeVeri.denetim || [];
      let eklenen = 0;
      yeniKayitlar.forEach((plan) => {
        if (!plan || !plan.id || varIdler[plan.id]) { return; }
        tazeVeri.planlar.push(plan);
        tazeVeri.senkron.kayit['planlar|' + plan.id] = plan.guncelleme;
        eklenen += 1;
      });
      if (denetimKayit && tazeVeri.denetim.length < 150) { tazeVeri.denetim.push(denetimKayit); }
      yaz('  Delta ile eklenen : ' + eklenen + ' / ' + yeniKayitlar.length);
      gonderilecekVeri = tazeVeri;
    }
    return bulutIste('?oda=eq.' + encodeURIComponent(KIMLIK.oda), {
      method: 'PATCH',
      body: { veri: gonderilecekVeri, guncelleme: new Date().toISOString() },
      headers: { Prefer: 'return=representation' }
    }).then(() => bulutSatirOku());
  });
}

/* ---------- Veri kaynağı ---------- */

function veriKaynagiYukle() {
  if (fixture) {
    vm.runInContext(fs.readFileSync(path.join(kok, 'tools/demo-veri.js'), 'utf8'), ctx,
      { filename: 'demo-veri.js' });
  }
  if (bulutIstek) {
    return bulutSatirOku().then((satir) => {
      if (!satir) { throw new Error('Bulutta bu oda için satır bulunamadı.'); }
      yaz('');
      yaz('BULUT             : ' + KIMLIK.url + ' · tablo ' + TABLO);
      yaz('  Oda              : ' + KIMLIK.oda.slice(0, 3) + '••• (' + KIMLIK.oda.length + ' karakter)');
      yaz('  Satır damgası     : ' + satir.guncelleme);
      yedekle(satir);
      return { baseline: satir, veri: JSON.parse(JSON.stringify(satir.veri)) };
    });
  }
  if (yerelDosya) {
    const ham = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), String(yerelDosya)), 'utf8'));
    const govde = Array.isArray(ham) ? (ham[0] || {}).veri : (ham.veri || ham);
    return Promise.resolve({ baseline: { guncelleme: '', veri: govde },
      veri: JSON.parse(JSON.stringify(govde)) });
  }
  const bos = fixture && typeof ISG.ORNEK_VERI === 'function' ? ISG.ORNEK_VERI() :
    (typeof ISG.BOS_VERI === 'function' ? ISG.BOS_VERI() : { isyerleri: [], planlar: [] });
  return Promise.resolve({ baseline: { guncelleme: '', veri: bos },
    veri: JSON.parse(JSON.stringify(bos)) });
}

/* ---------- Ana akış ---------- */

(async function main() {
  const tamYol = path.resolve(process.cwd(), hedefDosya);
  if (!fs.existsSync(tamYol)) { yaz('DOSYA BULUNAMADI: ' + tamYol); bitir(1); }

  let sayfalar;
  if (/\.csv$/i.test(tamYol)) {
    sayfalar = [{ ad: 'CSV', satirlar: csvSatirlari(fs.readFileSync(tamYol, 'utf8')) }];
  } else {
    sayfalar = await ISG.excel.xlsxOku(baytlariOku(tamYol));
  }

  const kaynak = await veriKaynagiYukle();
  /* depo.yukle damga ÜRETMEZ: bulut birleşiminin kayıt damgaları korunur. */
  ISG.depo.yukle(kaynak.veri);
  const normOnce = JSON.parse(JSON.stringify(ISG.depo.al()));

  const cozum = isyeriCoz(ISG.depo.al(), isyeriIstek);
  if (!cozum.isyeri) {
    yaz('');
    yaz('HEDEF İŞ YERİ ÇÖZÜLEMEDİ: "' + isyeriIstek + '"');
    yaz('  Kayıtlı iş yerleri: ' + (ISG.depo.al().isyerleri || [])
      .map((isyeri) => isyeri.ad + ' (' + isyeri.id + ')').join(' · '));
    (cozum.adaylar || []).forEach((aday) => yaz('  olası aday: ' + aday));
    bitir(1);
  }
  const hedef = cozum.isyeri;
  const hesap = ISG.depo.al();

  /* Yıl dosya başlığından okunur; mükerrer denetimi hedef iş yerinin kayıtlı
     planları üzerinden koşar (başka iş yerlerinin kayıtları denetime girmez). */
  const ilkGez = sayfaSec(sayfalar, { isyeriId: hedef.id, yil: yilIstek, mevcut: [] });
  if (!ilkGez || !ilkGez.analiz || ilkGez.analiz.hata) {
    yaz('');
    yaz('DOSYA OKUNAMADI: ' + ((ilkGez && ilkGez.analiz && ilkGez.analiz.hata) ||
      'hiçbir sayfada plan tablosu bulunamadı'));
    bitir(1);
  }
  const yil = ilkGez.analiz.yil || yilIstek;
  const mevcut = (hesap.planlar || []).filter((plan) => plan.isyeriId === hedef.id);
  const secim = sayfaSec(sayfalar, { isyeriId: hedef.id, yil: yil, mevcut: mevcut });
  const analiz = secim.analiz;
  const dosyaAdi = path.basename(tamYol);

  yaz('');
  dagilim(analiz, {
    dosya: tamYol, sayfaAd: secim.ad,
    kurum: (hesap.ayarlar || {}).kurum, adayWith: !!cozum.aday
  }, yil, hedef);
  kayitOzeti(analiz, 14);
  sorunlariListele(analiz, 'mukerrer', 'MÜKERRER SATIRLAR (kaydedilmez)');
  sorunlariListele(analiz, 'hata', 'HATALI SATIRLAR (kaydedilmez)');
  yaz('');
  yaz('  Mevcut plan       : hedef iş yerinde ' + mevcut.length + ' kayıt (' +
    mevcut.filter((plan) => ISG.planYil(plan) === yil).length + ' tanesi ' + yil + ' yılında)');
  sayilariYaz(hesap, 'ÖNCE (mevcut)    : ', hedef.id, yil);
  yaz('');

  const kayitlar = hazirKayitlar(analiz, hedef, yil);
  if (jsonCikti) { jsonYaz(jsonCikti, kayitlar, hedef, yil); }
  if (hazirlaDosya) { hazirlaYaz(hazirlaDosya, kayitlar); }

  if (!kayitlar.length) {
    yaz('KAYDEDİLECEK FAALİYET YOK — hiçbir yere yazılmadı.');
    bitir(0);
  }
  if (!fixture && !bulutIstek && !yerelDosya) {
    yaz('');
    yaz('YAZMA DENEMESİ YAPILMADI: veri kaynağı seçin (--fixture, --yerel=, --bulut).');
    bitir(0);
  }

  const deneme = kayitlariYaz(analiz, hedef, yil, { isyeriId: hedef.id, yil: yil, mevcut: mevcut });
  const guncelVeri = JSON.parse(JSON.stringify(deneme.veri));
  const denetim = (denetimYok || !deneme.sonuc.eklenen) ? null :
    denetimKaydi(hedef, deneme.sonuc.eklenen, yil, dosyaAdi);

  if (ciktiDosya) {
    const yol = path.resolve(process.cwd(), String(ciktiDosya));
    fs.writeFileSync(yol, JSON.stringify(guncelVeri, null, 2), 'utf8');
    yaz('  Güncel veri yığını : ' + yol);
  }

  if (!yazIstek) {
    yaz('');
    yaz('SONUÇ: KURU DENEME. Hiçbir yere yazılmadı. Buluta yazmak için --yaz ekleyin.');
    bitir(0);
  }
  if (!bulutIstek) {
    yaz('');
    yaz('SONUÇ: sandık üzerinde yazıldı (bellek içi). Kalıcı çıktı için --cikti= kullanın.');
    bitir(0);
  }






  const denetimliVeri = JSON.parse(JSON.stringify(guncelVeri));
  if (denetim) {
    denetimliVeri.denetim = (denetimliVeri.denetim || []).concat([denetim]);
  }
  yaz('');
  yaz('BULUTA YAZILIYOR…');
  const geri = await bulutaYaz(kaynak.baseline, hedef, deneme.yeniKayitlar, denetimliVeri, denetim);
  const sonVeri = geri.veri;

  yaz('');
  yaz('BULUT DOĞRULAMA');
  yaz('  Satır damgası      : ' + kaynak.baseline.guncelleme + '  →  ' + geri.guncelleme);
  const onceImza = imza(normOnce, hedef.id);
  const sonraImza = imza(sonVeri, hedef.id);
  const fark = imzaFarki(onceImza, sonraImza, ['denetim']);
  const damgaSon = senkronDenetimi(normOnce, sonVeri);
  yaz('  Hedef plan         : ' + onceImza.planHedef + '  →  ' + sonraImza.planHedef);
  yaz('  Eşitleme damgası   : ' + damgaSon.yeni + ' yeni (' + damgaSon.yeniPlan + ' plan) · değişen mevcut: ' +
    damgaSon.degisen + ' · kaybolan mezar: ' + damgaSon.kaybolanMezar +
    ' · plan dışı yeni damga: ' + damgaSon.disindakiler);
  yaz('  Diğer iş yerleri   : ' + (fark.some((f) => /DIGER/.test(f) || /DİĞER/.test(f)) ?
    'DEĞİŞMİŞ (İHLAL!)' : 'değişmedi (izolasyon korundu)'));
  const digerFark = fark.filter((f) => !(/DİĞER İŞ YERLERİ/.test(f)));
  yaz('  Diğer koleksiyonlar: ' + (digerFark.length ? 'FARK: ' + digerFark.join(' | ') :
    'birebir aynı (denetim izi hariç)'));
  sayilariYaz(sonVeri, 'Sonra (bulut)      : ', hedef.id, yil);

  /* Aynı dosya ikinci kez yüklendiğinde hiçbir kayıt eklenmemelidir. */
  const tekrar = ISG.planToplu.analizEt(secim.satirlar, {
    isyeriId: hedef.id, yil: yil,
    mevcut: (sonVeri.planlar || []).filter((plan) => plan.isyeriId === hedef.id)
  });
  const tekrarSonuc = ISG.planToplu.uygula(tekrar, { isyeriId: hedef.id, yil: yil });
  yaz('');
  yaz('  Tekrar yükleme     : ' + tekrarSonuc.eklenen + ' kayıt eklendi (0 beklenir) · mükerrer ' +
    tekrarSonuc.mukerrer);

  yaz('');
  yaz('ÖZET · ' + hedef.ad + ' · ' + yil + ' · ' + dosyaAdi);
  yaz('  Dosyadaki faaliyet : ' + (analiz.ozet.hazir + analiz.ozet.mukerrer + analiz.ozet.hatali));
  yaz('  Başarılı kayıt     : ' + deneme.sonuc.eklenen);
  yaz('  Mükerrer kayıt     : ' + deneme.sonuc.mukerrer);
  yaz('  Hatalı kayıt       : ' + deneme.sonuc.hatali);
  yaz('  Ay işareti         : ' + analiz.ozet.ayIsaret);
  yaz('  İş yeri plan toplamı: ' + sonraImza.planHedef);
  bitir(0);
})().catch((hata) => {
  const metin = String((hata && hata.stack) || hata);
  yaz('HATA: ' + metin);
  bitir(1);
});

