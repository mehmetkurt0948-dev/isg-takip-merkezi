#!/usr/bin/env node
/* İSG Takip Merkezi — toplu personel aktarım ve doğrulama aracı (geliştirme)
   Kurumlardan gelen personel listesini (.xlsx/.csv) uygulamanın kendi
   ayrıştırıcısıyla (assets/js/personel-toplu.js) okur; standart şablona eşler,
   satır satır doğrular, mükerrerleri ayıklar ve raporu yazar. Varsayılan
   davranış KURUDUR: hiçbir yere yazmaz.

   Kullanım:
     node tools/personel-aktar.js "Aski - 1.xlsx" --isyeri="Aski - 1"
     node tools/personel-aktar.js liste.xlsx --isyeri=iy5 --fixture
     node tools/personel-aktar.js liste.xlsx --isyeri="Aski - 1" --bulut
     node tools/personel-aktar.js liste.xlsx --isyeri="Aski - 1" --bulut --yaz
     node tools/personel-aktar.js liste.xlsx --isyeri=iy5 --hazirla=yukleme.xlsx

   --isyeri : hedef iş yeri kimliği veya adı (tek eşleşme şart; başka iş
              yerlerine yazılmaz, diğer iş yerleri yalnızca uyarı üretir)
   --bulut  : hedef veri olarak Supabase'deki canlı satır okunur (salt okunur)
   --yaz    : yalnızca --bulut ile birlikte: değişikliği buluta yazar. Yazmadan
              önce satırın tam yedeği alınır, yazmadan hemen önce satır yeniden
              okunup eşzamanlı değişiklik denetlenir.
   --yerel  : bulut yerine yerel JSON veri dosyası üzerinden çalışır
   --cikti  : güncellenmiş veri yığınını dosyaya yazar (yerel geri yükleme)
   --hazirla: yalnızca kaydedilecek satırları standart şablonla XLSX yazar
              (arayüzden "Toplu personel yükle" ile aynen yüklenebilir dosya)
   --json   : kaydedilecek kayıtları uygulamanın kayıt biçiminde JSON yazar
   --fixture: demo veritabanı yüklenir, yazma denemesi burada yapılır
   --sinir  : raporda listelenecek hatalı/mükerrer satır sayısı (varsayılan 40)
   --yedek  : bulut yedeğinin yazılacağı klasör (varsayılan: yedek-personel)
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
  const satir = String(metin);
  raporSatirlari.push(satir);
  console.log(satir);
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
  console.log('Kullanım: node tools/personel-aktar.js <liste.xlsx|.csv> --isyeri=<id|ad> ' +
    '[--bulut] [--yaz] [--yerel=veri.json] [--cikti=veri.json] [--hazirla=upload.xlsx] ' +
    '[--json=kayitlar.json] [--fixture] [--sinir=40] [--rapor=rapor.txt]');
  process.exit(1);
}

const isyeriIstek = String(bayrak('isyeri') || '').trim();
const bulutIstek = bayrak('bulut') === true;
const yazIstek = bayrak('yaz') === true;
const yerelDosya = bayrak('yerel');
const ciktiDosya = bayrak('cikti');
const hazirlaDosya = bayrak('hazirla');
const jsonCikti = bayrak('json');
const fixture = bayrak('fixture') === true;
const sinir = Number(bayrak('sinir')) || 40;
const yedekKlasor = String(bayrak('yedek') || 'yedek-personel');
const denetimYok = bayrak('denetim-yok') === true;

if (!isyeriIstek) {
  yaz('--isyeri verilmeli: hedef iş yeri kimliği veya adı. İş yeri seçilmeden kayıt yapılmaz.');
  bitir(1);
}
if (yazIstek && !bulutIstek) {
  yaz('--yaz yalnızca --bulut ile birlikte kullanılır (yerel/örnek veride yazma denenemez).');
  bitir(1);
}

/* Uygulama modülleri tarayıcıdaki sırayla yüklenir: doğrulama, mükerrer ve
   kayıt kuralları arayüzle birebir aynı kalır. */
const dom = new JSDOM('<!doctype html><html><body></body></html>',
  { url: 'http://127.0.0.1/', pretendToBeVisual: true, runScripts: 'outside-only' });
const ctx = dom.getInternalVMContext();
ctx.DecompressionStream = globalThis.DecompressionStream;
ctx.Blob = globalThis.Blob;
ctx.fetch = globalThis.fetch;
['varsayilan-veri.js', 'depo.js', 'bicim.js', 'excel.js', 'personel-toplu.js'].forEach((ad) => {
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
  const istekSecenek = {
    method: secenek.method || 'GET',
    headers: basliklar,
    cache: 'no-store'
  };
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
  yaz('  Yedek              : ' + yol);
  yaz('  Yedek boyutu       : ' + fs.statSync(yol).size + ' bayt · ' +
    (((satir.veri || {}).personel) || []).length + ' personel');
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
      const karakter = satir.charAt(i);
      if (karakter === '"') {
        if (tirnak && satir.charAt(i + 1) === '"') { mevcut += '"'; i += 1; } else { tirnak = !tirnak; }
      } else if ((karakter === ',' || karakter === ';') && !tirnak) {
        hucreler.push(mevcut); mevcut = '';
      } else { mevcut += karakter; }
    }
    hucreler.push(mevcut);
    return hucreler;
  });
}

/* Veri yığınındaki her koleksiyonun imzası: iş yeri izolasyonu bu imzalarla
   denetlenir (hedefin personeli dışında hiçbir kayıt değişmemeli). */
function imza(veri, hedefIsyeriId) {
  const ozet = {};
  Object.keys(veri).sort().forEach((anahtar) => {
    const deger = veri[anahtar];
    if (!Array.isArray(deger)) { return; }
    if (anahtar === 'personel') {
      const hedefDisi = deger.filter((kisi) => kisi && kisi.isyeriId !== hedefIsyeriId)
        .slice().sort((a, b) => String(a.id).localeCompare(String(b.id)));
      ozet.personelDisi = hedefDisi.length + '/' + JSON.stringify(hedefDisi).length;
      ozet.personelHedef = deger.filter((kisi) => kisi && kisi.isyeriId === hedefIsyeriId).length;
      return;
    }
    ozet[anahtar] = deger.length + '/' + JSON.stringify(deger).length;
  });
  ozet.ayarlar = JSON.stringify(veri.ayarlar || {});
  const senkron = veri.senkron || {};
  ozet.senkronKayit = String((senkron.kayit || {}) && Object.keys(senkron.kayit || {}).length) +
    '/' + JSON.stringify(senkron.kayit || {}).length;
  ozet.senkronSilinen = String((senkron.silinen || {}) && Object.keys(senkron.silinen || {}).length) +
    '/' + JSON.stringify(senkron.silinen || {}).length;
  return ozet;
}

function imzaFarki(once, sonra, atlananlar) {
  const atla = atlananlar || [];
  const farklar = [];
  Object.keys(Object.assign({}, once, sonra)).forEach((anahtar) => {
    if (anahtar === 'personelHedef' || anahtar === 'senkronKayit' ||
        anahtar === 'personelDisi' || atla.indexOf(anahtar) > -1) { return; }
    if (String(once[anahtar]) !== String(sonra[anahtar])) {
      farklar.push(anahtar + ': ' + once[anahtar] + ' -> ' + sonra[anahtar]);
    }
  });
  if (String(once.personelDisi) !== String(sonra.personelDisi)) {
    farklar.push('DİĞER İŞ YERLERİNİN PERSONELİ DEĞİŞTİ: ' +
      once.personelDisi + ' -> ' + sonra.personelDisi);
  }
  return farklar;
}

function isyeriCoz(veri, istek) {
  const liste = veri.isyerleri || [];
  const norm = (metin) => ISG.personelToplu.norm(metin);
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

function isyeriSayimlari(veri) {
  const harita = {};
  (veri.isyerleri || []).forEach((isyeri) => { harita[isyeri.id] = 0; });
  (veri.personel || []).forEach((kisi) => {
    if (kisi && typeof harita[kisi.isyeriId] !== 'undefined') { harita[kisi.isyeriId] += 1; }
  });
  return harita;
}

function sayilariYaz(veri, etiket, hedefId) {
  const sayim = isyeriSayimlari(veri);
  const satirlar = (veri.isyerleri || []).map((isyeri) =>
    isyeri.ad + ': ' + (sayim[isyeri.id] || 0) +
    (isyeri.id === hedefId ? ' (HEDEF)' : ''));
  yaz('  ' + etiket + ' ' + satirlar.join(' · '));
}

/* ---------- Rapor ---------- */

function sorunlariListele(analiz, durumAdi, etiket) {
  const liste = (analiz.satirlar || []).filter((satir) => satir.durum === durumAdi);
  if (!liste.length) { return; }
  yaz('');
  yaz('  ' + etiket + ' (' + liste.length + ' satır)');
  liste.slice(0, sinir).forEach((satir) => {
    const kisi = satir.onizlemeKayit || satir.kayit || {};
    const kimlik = [kisi.sicil ? 'sicil ' + kisi.sicil : '', kisi.adSoyad || 'adı boş',
      kisi.tc ? 'TC ' + kisi.tc : 'TC yok'].filter(Boolean).join(' · ');
    const neden = (satir.nedenler || []).concat(satir.uyarilar || []).join(' | ');
    yaz('    satır ' + satir.satirNo + ' · ' + kimlik + (neden ? '  →  ' + neden : ''));
  });
  if (liste.length > sinir) {
    yaz('    … ' + (liste.length - sinir) + ' satır daha (tam liste için --sinir büyütün)');
  }
}

function veriKalitesi(analiz) {
  const hazirlar = hazirKayitlar(analiz);
  const say = (kosul) => hazirlar.filter(kosul).length;
  const dagilim = (alan) => {
    const harita = {};
    hazirlar.forEach((kisi) => {
      const anahtar = String(kisi[alan] || '').trim() || '(boş)';
      harita[anahtar] = (harita[anahtar] || 0) + 1;
    });
    return Object.keys(harita).sort((a, b) => harita[b] - harita[a]);
  };
  const adTc = {};
  hazirlar.forEach((kisi) => {
    const anahtar = ISG.personelToplu.norm(kisi.adSoyad);
    adTc[anahtar] = adTc[anahtar] || {};
    if (kisi.tc) { adTc[anahtar][kisi.tc] = true; }
  });
  const ayniAdFarkliTc = Object.keys(adTc).filter((ad) => Object.keys(adTc[ad]).length > 1);

  yaz('');
  yaz('VERİ KALİTESİ (kaydedilecek ' + hazirlar.length + ' kayıt üzerinden)');
  yaz('  T.C. Kimlik No boş   : ' + say((k) => !k.tc));
  yaz('  Sicil No boş         : ' + say((k) => !k.sicil));
  yaz('  İşe Başlama boş      : ' + say((k) => !k.iseBaslama));
  yaz('  Kıdem Tarihi boş     : ' + say((k) => !k.kidemTarihi));
  yaz('  Cep Telefonu boş     : ' + say((k) => !k.telefon));
  yaz('  Telefon 11 hane değil: ' + say((k) => k.telefon && k.telefon.length !== 11));
  yaz('  Cinsiyet boş         : ' + say((k) => !k.cinsiyet));
  yaz('  Pasif kaydedilecek   : ' + say((k) => k.durum === 'pasif'));
  yaz('  Aynı Ad Soyad, farklı TC: ' + ayniAdFarkliTc.length +
    (ayniAdFarkliTc.length ? ' → ' + ayniAdFarkliTc.slice(0, 5).join(', ') : ''));
  const sayac = (alan, deger) => hazirlar.filter((kisi) =>
    (String(kisi[alan] || '').trim() || '(boş)') === deger).length;
  ['departman', 'sube'].forEach((alan) => {
    const liste = dagilim(alan);
    yaz('  ' + (alan === 'departman' ? 'Departman sayısı   : ' : 'Şube sayısı          : ') + liste.length +
      ' · en çok: ' + liste.slice(0, 3).map((ad) => ad + ' (' + sayac(alan, ad) + ')').join(', '));
  });
}

function hazirKayitlar(analiz) {
  return (analiz.satirlar || []).filter((satir) => satir.durum === 'hazir')
    .map((satir) => satir.kayit);
}

function raporla(analiz, secimBilgi, hedef) {
  yaz('KAYNAK DOSYA      : ' + secimBilgi.dosya);
  yaz('Sayfa             : ' + secimBilgi.sayfaAd + ' · toplam satır ' + secimBilgi.satirSayisi);
  yaz('Başlık satırı     : ' + (analiz.baslikSatiri + 1) + '. satır');
  yaz('Eşleşen sütunlar  : ' + Object.keys(analiz.haritalar).join(', '));
  if (analiz.eksikSutunlar && analiz.eksikSutunlar.length) {
    yaz('Olmayan sütunlar  : ' + analiz.eksikSutunlar.join(', ') + ' (boş kaydedilir)');
  }
  yaz('Hedef iş yeri     : ' + hedef.ad + ' (' + hedef.id + ')' +
    (secimBilgi.adayWith ? ' · ad eşleşmesiyle seçildi' : ''));
  if (analiz.hata) {
    yaz('');
    yaz('HATA: ' + analiz.hata);
    return false;
  }
  const ozet = analiz.ozet;
  yaz('');
  yaz('AYRISTIRMA ÖZETİ');
  yaz('  Dosya satırı       : ' + ozet.dosyaSatir);
  yaz('  Boş satır          : ' + ozet.bos);
  yaz('  Şablon örnek satırı: ' + ozet.ornek + ' (kaydedilmez)');
  yaz('  Veri satırı        : ' + ozet.veriSatir);
  yaz('  Kaydedilebilir     : ' + ozet.hazir);
  yaz('  Mükerrer           : ' + ozet.mukerrer);
  yaz('  Hatalı             : ' + ozet.hatali);
  (analiz.uyarilar || []).forEach((uyari) => yaz('  UYARI            : ' + uyari));
  const capraz = (analiz.satirlar || []).filter((satir) => (satir.uyarilar || [])
    .some((uyari) => /başka bir iş yerinde/.test(uyari)));
  if (capraz.length) {
    yaz('  Çapraz kimlik      : ' + capraz.length + ' satır başka bir iş yerinde de kayıtlı' +
      ' (hedef listede ayrı kaydedilir, diğer liste değişmez)');
  }
  sorunlariListele(analiz, 'hata', 'HATALI SATIRLAR (kaydedilmez)');
  sorunlariListele(analiz, 'mukerrer', 'MÜKERRER SATIRLAR (kaydedilmez)');
  const uyaranlar = (analiz.satirlar || []).filter((satir) => satir.durum === 'hazir' &&
    (satir.uyarilar || []).length);
  if (uyaranlar.length) {
    yaz('');
    yaz('  KAYDEDİLİR AMA UYARILI: ' + uyaranlar.length + ' satır');
    uyaranlar.slice(0, Math.min(sinir, 10)).forEach((satir) => {
      const kisi = satir.kayit || {};
      yaz('    satır ' + satir.satirNo + ' · ' + (kisi.adSoyad || 'adı boş') + ' → ' +
        satir.uyarilar.join(' | '));
    });
  }
  veriKalitesi(analiz);
  return true;
}

/* ---------- Çıktılar ---------- */

function hazirlaYaz(dosyaAdi, kayitlar, hedef) {
  const alanSirasi = ['sicil', 'adSoyad', 'tc', 'meslek', 'departman', 'grupKodu', 'sube',
    'iseBaslama', 'kidemTarihi', 'telefon', 'cinsiyet'];
  const sayfalar = [{
    ad: 'Personel',
    basliklar: ISG.personelToplu.BASLIKLAR.slice(),
    satirlar: kayitlar.map((kisi) => alanSirasi.map((alan) => kisi[alan] || '')),
    genislikler: ISG.personelToplu.SUTUNLAR.map((sutun) => sutun.genislik)
  }, {
    ad: 'Kılavuz',
    basliklar: ['Alan', 'Değer', 'Not'],
    satirlar: [
      ['Hedef iş yeri', hedef.ad, 'Bu dosya "' + hedef.ad + '" iş yerine yüklenmek üzere hazırlanmıştır; ' +
        'arayüzde seçilen iş yeri geçerlidir.'],
      ['Kayıt sayısı', String(kayitlar.length), 'Yalnızca doğrulanmış satırlar. Hatalı ve mükerrer satırlar çıkarılmıştır.'],
      ['Yükleme', 'Personel listesi', 'Toplu personel yükle → dosyayı seç → ön izleme → Kaydedilecekleri ekle.']
    ],
    genislikler: [22, 26, 92]
  }];
  const bayt = ISG.excel.xlsxYaz(sayfalar);
  const yol = path.resolve(process.cwd(), String(dosyaAdi));
  fs.writeFileSync(yol, Buffer.from(bayt));
  yaz('');
  yaz('YÜKLEMEYE HAZIR DOSYA: ' + yol + ' (' + kayitlar.length + ' satır, ' +
    fs.statSync(yol).size + ' bayt)');
  return yol;
}

function jsonYaz(dosyaAdi, kayitlar, hedef) {
  const yol = path.resolve(process.cwd(), String(dosyaAdi));
  fs.writeFileSync(yol, JSON.stringify({ isyeriId: hedef.id, isyeriAdi: hedef.ad,
    olusturma: new Date().toISOString(), kayitlar: kayitlar }, null, 2), 'utf8');
  yaz('JSON KAYIT LİSTESİ : ' + yol + ' (' + kayitlar.length + ' kayıt)');
  return yol;
}

/* ---------- Yazma ---------- */

function denetimKaydi(veri, hedef, adet, dosyaAdi) {
  const simdi = new Date().toISOString();
  return {
    id: ISG.yeniId('dnmv'),
    tur: 'yazma',
    islem: 'personelTopluEkle',
    ozet: 'Toplu personel yükleme · ' + adet + ' personel · ' + dosyaAdi + ' (aktarım aracı)',
    tarih: simdi,
    guncelleme: simdi,
    isyeriId: hedef.id,
    kullaniciAd: 'Aktarım aracı (CLI)',
    kullaniciId: ''
  };
}

/* Eşitleme damgaları: mevcut kayıtların damgası AYNEN kalmalı, mezar taşları
   silinmemeli; yalnızca yeni eklenen kayıtlar için damga eklenmiş olmalı. */
function senkronDenetimi(onceVeri, sonraVeri) {
  const once = (onceVeri.senkron || {}).kayit || {};
  const sonra = (sonraVeri.senkron || {}).kayit || {};
  const onceSilinen = (onceVeri.senkron || {}).silinen || {};
  const sonraSilinen = (sonraVeri.senkron || {}).silinen || {};
  const degisen = Object.keys(once).filter((kod) => String(sonra[kod]) !== String(once[kod]));
  const yeni = Object.keys(sonra).filter((kod) => typeof once[kod] === 'undefined');
  const kaybolanMezar = Object.keys(onceSilinen).filter((kod) => !sonraSilinen[kod]);
  const yeniKisi = yeni.filter((kod) => kod.indexOf('personel|') === 0).length;
  const disindakiler = yeni.filter((kod) => kod.indexOf('personel|') !== 0);
  return {
    degisen: degisen.length,
    yeni: yeni.length,
    yeniKisi: yeniKisi,
    disindakiler: disindakiler.length,
    kaybolanMezar: kaybolanMezar.length
  };
}

/* Uygulamanın kendi kayıt yolunu kullanır: ISG.depo.personelTopluEkle →
   kaydet() yalnızca YENİ kayıtları damgalar, mevcut kayıtlara dokunmaz. */
function kayitlariYaz(analiz, hedef, dosyaAdi, denetimEkle) {
  /* depo.al() canlı nesneyi döndürür: karşılaştırma için ön anlık görüntü lazım. */
  const onceki = JSON.parse(JSON.stringify(ISG.depo.al()));
  const beklenen = (analiz.satirlar || []).filter((s) => s.durum === 'hazir').length;
  const sonuc = ISG.personelToplu.uygula(analiz, { isyeriId: hedef.id });
  const sonraki = ISG.depo.al();

  const beklenenIdler = sonuc.idler || [];
  const yeniKayitlar = beklenenIdler.map((id) => JSON.parse(JSON.stringify(
    (sonraki.personel || []).filter((kisi) => kisi.id === id)[0] || { id: id })));
  const hedefDisiDegisti = yeniKayitlar.some((kisi) => kisi.isyeriId !== hedef.id);
  const eksikKayit = beklenen - (sonuc.eklenen || 0);

  yaz('');
  yaz('YAZMA SONUCU' + (yazIstek ? ' (BULUTA YAZILDI)' : ' (SANDIK / KURU DENEME)'));
  yaz('  Eklenen            : ' + (sonuc.eklenen || 0) + ' / beklenen ' + beklenen +
    (eksikKayit ? '  · EKSİK ' + eksikKayit + ' KAYIT!' : ''));
  yaz('  Mükerrer           : ' + sonuc.mukerrer + ' · Hatalı: ' + sonuc.hatali +
    ' · Örnek: ' + sonuc.ornek);
  yaz('  Hedef iş yeri      : ' + hedef.ad + ' → ' +
    (sonraki.personel || []).filter((k) => k.isyeriId === hedef.id).length + ' personel');
  if (hedefDisiDegisti) { yaz('  İHLAL: yeni kayıtlardan biri hedef dışı iş yerine yazılmış!'); }

  const izolasyon = imzaFarki(imza(onceki, hedef.id), imza(sonraki, hedef.id));
  if (izolasyon.length) {
    yaz('  İZOLASYON İHLALİ : ' + izolasyon.join(' | '));
  } else {
    yaz('  İzolasyon        : OK — diğer iş yerlerinin personeli ve tüm diğer koleksiyonlar ' +
      'bayt bayt aynı');
  }
  const damga = senkronDenetimi(onceki, sonraki);
  const damgaSorunu = damga.degisen || damga.kaybolanMezar || damga.disindakiler ||
    damga.yeni !== damga.yeniKisi;
  yaz('  Eşitleme damgası   : ' + damga.yeni + ' yeni damga (' + damga.yeniKisi + ' personel)' +
    ' · değişen mevcut damga: ' + damga.degisen +
    ' · silinen mezar taşı: ' + damga.kaybolanMezar +
    (damgaSorunu ? '  · SORUN!' : ' · mevcut kayıtların damgası korundu'));
  if (denetimEkle && (sonuc.eklenen || 0) > 0 && (sonraki.denetim || []).length < 150) {
    sonraki.denetim.push(denetimKaydi(sonraki, hedef, sonuc.eklenen, dosyaAdi));
    ISG.depo.kaydet();
    yaz('  Denetim izi      : eklendi (Toplu personel yükleme · ' + sonuc.eklenen + ' personel)');
  }
  sayilariYaz(ISG.depo.al(), 'İş yeri sayıları : ', hedef.id);
  return { sonuc: sonuc, yeniKayitlar: yeniKayitlar, veri: ISG.depo.al() };
}

function bulutaYaz(baseline, hedef, yeniKayitlar, guncelVeri, denetimKayit) {
  const baselineImza = JSON.stringify(baseline.veri);
  return bulutSatirOku().then((taze) => {
    if (!taze) { throw new Error('Bulut satırı bulunamadı; yazma iptal.'); }
    let gonderilecekVeri = guncelVeri;
    if (JSON.stringify(taze.veri) !== baselineImza) {
      yaz('');
      yaz('  EŞZAMANLI DEĞİŞİKLİK: okuma ile yazma arasında bulut satırı değişmiş.');
      yaz('  Tam yığın yerine yalnızca yeni kayıt deltası taze yığına uygulanıyor.');
      const tazeVeri = JSON.parse(JSON.stringify(taze.veri));
      const varIdler = {};
      (tazeVeri.personel || []).forEach((kisi) => { varIdler[kisi.id] = true; });
      tazeVeri.senkron = tazeVeri.senkron || { kayit: {}, silinen: {}, ayarlar: '' };
      tazeVeri.senkron.kayit = tazeVeri.senkron.kayit || {};
      let eklenen = 0;
      yeniKayitlar.forEach((kisi) => {
        if (!kisi || !kisi.id || varIdler[kisi.id]) { return; }
        tazeVeri.personel.push(kisi);
        tazeVeri.senkron.kayit['personel|' + kisi.id] = kisi.guncelleme;
        eklenen += 1;
      });
      if (denetimKayit && (tazeVeri.denetim || []).length < 150) {
        tazeVeri.denetim.push(denetimKayit);
      }
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

/* ---------- Ana akış ---------- */

function veriKaynagiYukle() {
  if (fixture) {
    vm.runInContext(fs.readFileSync(path.join(kok, 'tools/demo-veri.js'), 'utf8'), ctx,
      { filename: 'demo-veri.js' });
  }
  if (bulutIstek) {
    return bulutSatirOku().then((satir) => {
      if (!satir) { throw new Error('Bulutta bu oda için satır bulunamadı.'); }
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
    (typeof ISG.BOS_VERI === 'function' ? ISG.BOS_VERI() : { isyerleri: [], personel: [] });
  return Promise.resolve({ baseline: { guncelleme: '', veri: bos },
    veri: JSON.parse(JSON.stringify(bos)) });
}

(async function main() {
  const tamYol = path.resolve(process.cwd(), hedefDosya);
  if (!fs.existsSync(tamYol)) { yaz('DOSYA BULUNAMADI: ' + tamYol); bitir(1); }

  let sayfalar;
  if (/\.csv$/i.test(tamYol)) {
    sayfalar = [{ ad: 'CSV', satirlar: csvSatirlari(fs.readFileSync(tamYol, 'utf8')) }];
  } else {
    sayfalar = await ISG.excel.xlsxOku(baytlariOku(tamYol));
  }
  const seciliSayfa = sayfalar.filter((sayfa) => /personel/i.test(sayfa.ad || ''))[0] || sayfalar[0];
  if (!seciliSayfa) { yaz('Dosyada okunabilir sayfa yok.'); bitir(1); }

  const kaynak = await veriKaynagiYukle();
  /* depo.yukle damga ÜRETMEZ: bulut birleşiminin kayıt damgaları korunur. */
  ISG.depo.yukle(kaynak.veri);
  /* Doğrulama, şemaya tamamlanmış ÖN hâlle yapılır (jsonb anahtar sırası farkı
   üretmeden): yazma öncesi anlık görüntü. */
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
  const mevcut = (hesap.personel || []).filter((kisi) => kisi.isyeriId === hedef.id);
  const digerIsyerleri = (hesap.personel || []).filter((kisi) => kisi.isyeriId !== hedef.id);

  yaz('');
  sayilariYaz(hesap, 'ÖNCE (mevcut)    : ', hedef.id);
  yaz('');

  const analiz = ISG.personelToplu.analizEt(seciliSayfa.satirlar,
    { isyeriId: hedef.id, mevcut: mevcut, digerIsyerleri: digerIsyerleri });
  const tamam = raporla(analiz, {
    dosya: path.basename(tamYol),
    sayfaAd: seciliSayfa.ad,
    satirSayisi: (seciliSayfa.satirlar || []).length,
    adayWith: !!cozum.aday
  }, hedef);
  if (!tamam) { bitir(1); }

  const kayitlar = hazirKayitlar(analiz);
  if (hazirlaDosya) { hazirlaYaz(hazirlaDosya, kayitlar, hedef); }
  if (jsonCikti) { jsonYaz(jsonCikti, kayitlar, hedef); }

  if (!kayitlar.length) {
    yaz('');
    yaz('KAYDEDİLECEK SATIR YOK — yazma yapılmadı.');
    bitir(0);
  }

  if (!fixture && !bulutIstek && !yerelDosya) {
    yaz('');
    yaz('YAZMA DENEMESİ YAPILMADI: veri kaynağı seçin (--fixture, --yerel= veya --bulut).');
    bitir(0);
  }

  /* Yazma: uygulama kendi kayıt yolunu kullanır; yalnızca yeni kayıtlar eklenir. */
  const deneme = kayitlariYaz(analiz, hedef, path.basename(tamYol), false);
  const guncelVeri = deneme.veri;
  const denetim = (denetimYok || !deneme.sonuc.eklenen) ? null :
    denetimKaydi(guncelVeri, hedef, deneme.sonuc.eklenen, path.basename(tamYol));

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

  const denetimliVeri = guncelVeri;
  if (denetim) {
    denetimliVeri.denetim = (denetimliVeri.denetim || []).concat([denetim]);
  }
  yaz('');
  yaz('BULUTA YAZILIYOR…');
  const geri = await bulutaYaz(kaynak.baseline, hedef, deneme.yeniKayitlar, denetimliVeri, null);
  const sonVeri = geri.veri;

  yaz('');
  yaz('BULUT DOĞRULAMA');
  yaz('  Satır damgası      : ' + kaynak.baseline.guncelleme + '  →  ' + geri.guncelleme);
  const onceImza = imza(normOnce, hedef.id);
  const sonraImza = imza(sonVeri, hedef.id);
  const fark = imzaFarki(onceImza, sonraImza, ['denetim']);
  const damgaSon = senkronDenetimi(normOnce, sonVeri);
  yaz('  Hedef personel     : ' + onceImza.personelHedef + '  →  ' + sonraImza.personelHedef);
  yaz('  Eşitleme damgası   : ' + damgaSon.yeni + ' yeni · değişen mevcut: ' + damgaSon.degisen +
    ' · kaybolan mezar taşı: ' + damgaSon.kaybolanMezar);
  yaz('  Diğer iş yerleri   : ' + (fark.some((f) => /DİĞER İŞ YERLERİ/.test(f)) ?
    'DEĞİŞMİŞ (İHLAL!)' : 'değişmedi (izolasyon korundu)'));
  const digerFark = fark.filter((f) => !/DİĞER İŞ YERLERİ/.test(f));
  yaz('  Diğer koleksiyonlar: ' + (digerFark.length ? 'FARK: ' + digerFark.join(' | ') :
    'birebir aynı (denetim izi hariç)'));
  sayilariYaz(sonVeri, 'Sonra (bulut)      : ', hedef.id);

  yaz('');
  yaz('ÖZET · ' + hedef.ad);
  yaz('  Dosyadaki personel : ' + analiz.ozet.veriSatir);
  yaz('  Başarılı kayıt     : ' + deneme.sonuc.eklenen);
  yaz('  Mükerrer kayıt     : ' + deneme.sonuc.mukerrer);
  yaz('  Hatalı kayıt       : ' + deneme.sonuc.hatali);
  yaz('  İş yeri toplamı    : ' + sonraImza.personelHedef);
  bitir(0);
})().catch((hata) => {
  const metin = String((hata && hata.stack) || hata);
  yaz('HATA: ' + metin);
  bitir(1);
});

