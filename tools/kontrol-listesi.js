/* İSG Takip Merkezi — Word (.docx) kontrol listesi dönüştürücüsü
   Her işyeri için farklı bir dosya kontrol listesi Word olarak paylaşılır.
   Bu araç o listeyi uygulamada kullanılabilir hazır şablona çevirir.

   Kullanım:
     node tools/kontrol-listesi.js donustur "C:\...\ASKI-1 DOSYA KONTROL LISTESI.docx" ASKI-1
       → tools/kontrol-listeleri/ASKI-1.json üretir ve assets/js/kontrol-listeleri.js yenilenir
     node tools/kontrol-listesi.js olustur
       → tools/kontrol-listeleri/*.json dosyalarından assets/js/kontrol-listeleri.js üretir

   Beklenen Word düzeni (ABB-OSGB-KL-001 şablonu):
     • Bölüm başlığı paragrafı: "BÖLÜM 1  YÖNETSEL VE ORGANİZASYONEL BELGELER"
     • Madde tablosu başlığı:  NO | BELGE / KAYIT | YASAL DAYANAK • PERİYOT | VAR | YOK | K/D | KONTROL TARİHİ
     • İşaret hücrelerinde dolu kutu (☒) kullanılır; boş kutu (☐) işaret sayılmaz.
   Sütun sırası başlık satırından okunduğu için kolon sırası değişirse de çalışır. */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const KOK = path.resolve(__dirname, '..');
const KAYNAK_DIZIN = path.join(KOK, 'tools', 'kontrol-listeleri');
const VARIS = path.join(KOK, 'assets', 'js', 'kontrol-listeleri.js');

/* ---------- Türkçe duyarlı normalleştirme ---------- */

const HARF = {
  'ı': 'i', 'İ': 'i', 'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g',
  'ü': 'u', 'Ü': 'u', 'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c',
  'â': 'a', 'î': 'i', 'û': 'u'
};

/* Karşılaştırma anahtarı: Türkçe harfler sadeleşir, noktalama ve boşluk silinir. */
function normal(deger) {
  return String(deger === undefined || deger === null ? '' : deger)
    .replace(/[\S]/g, (harf) => HARF[harf] || harf)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function temizMetin(deger) {
  return String(deger === undefined || deger === null ? '' : deger).replace(/\s+/g, ' ').trim();
}

/* "24.08.2026" veya "2026-08-24" → "2026-08-24"; bulunamazsa boş dizi. */
function isoTarih(deger) {
  const metin = String(deger || '');
  const ters = /(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/.exec(metin);
  if (ters) { return ters[3] + '-' + ('0' + ters[2]).slice(-2) + '-' + ('0' + ters[1]).slice(-2); }
  const duz = /(\d{4})-(\d{2})-(\d{2})/.exec(metin);
  return duz ? duz[0] : '';
}

function secildiMi(deger) {
  return /[☒✔✓■×]/.test(String(deger || ''));
}

/* ---------- Word (OOXML) ayrıştırma ---------- */

function coz(metin) {
  return String(metin)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, rakam) => String.fromCodePoint(Number(rakam)))
    .replace(/&amp;/g, '&');
}

/* Bir XML parçasındaki tüm <w:t> metinlerini birleştirir; satır/sekme boşluk olur. */
function parcaMetni(xml) {
  let metin = '';
  const kalip = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:(?:br|tab)(?:\s[^>]*)?\/>/g;
  let eslesme;
  while ((eslesme = kalip.exec(xml)) !== null) {
    metin += eslesme[1] === undefined ? ' ' : coz(eslesme[1]);
  }
  return metin;
}
function hucreMetni(tcXml) {
  const parcalar = tcXml.split(/<\/w:p>/).map(parcaMetni).map(temizMetin).filter(Boolean);
  if (parcalar.length) { return parcalar.join(' / '); }
  return temizMetin(parcaMetni(tcXml));
}

function satirlariAyir(tblXml) {
  return (tblXml.match(/<w:tr(?:\s[^>]*)?>[\s\S]*?<\/w:tr>/g) || []).map((tr) =>
    (tr.match(/<w:tc(?:\s[^>]*)?>[\s\S]*?<\/w:tc>/g) || []).map(hucreMetni));
}

/* Word dosyasının gövde XML'ini blok blok döndürür (paragraf ve tablo sırasıyla). */
function govdeBloklari(docxYolu) {
  const kisaYol = path.join(os.tmpdir(), 'isg-docx-' + Date.now().toString(36) + '.xml');
  const tekTirnak = (deger) => String(deger).replace(/'/g, "''");
  const betik = [
    'Add-Type -AssemblyName System.IO.Compression.FileSystem',
    '$zip = [System.IO.Compression.ZipFile]::OpenRead(\'' + tekTirnak(docxYolu) + '\')',
    'try {',
    '  $giris = $zip.Entries | Where-Object { $_.FullName -eq \'word/document.xml\' }',
    '  if (-not $giris) { throw \'word/document.xml bulunamadi\' }',
    '  $oku = New-Object System.IO.StreamReader($giris.Open(), [System.Text.Encoding]::UTF8)',
    '  $metin = $oku.ReadToEnd()',
    '  $oku.Close()',
    '} finally { $zip.Dispose() }',
    '[System.IO.File]::WriteAllText(\'' + tekTirnak(kisaYol) + '\', $metin, (New-Object System.Text.UTF8Encoding($false)))'
  ].join('\n');

  execFileSync('powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', betik],
    { stdio: 'ignore' });

  const xml = fs.readFileSync(kisaYol, 'utf8');
  fs.rmSync(kisaYol, { force: true });

  const govde = /<w:body[^>]*>([\s\S]*)<\/w:body>/.exec(xml);
  const icerik = govde ? govde[1] : xml;
  return icerik.match(/<w:tbl(?:\s[^>]*)?>[\s\S]*?<\/w:tbl>|<w:p(?:\s[^>]*)?(?:\/>|>[\s\S]*?<\/w:p>)/g) || [];
}

/* ---------- Kontrol listesi şablonuna dönüştürme ---------- */

const BOLUM_KALIP = /^b[oö]l[üu]m\b/i;
const KOD_KALIP = /dok[üu]man\s+kodu\s*[:\-]\s*([A-Za-z0-9\-.]+)/i;

/* Karşılaştırmalar Türkçe sadeleştirilmiş metin üzerinde yapılır: Word başlığında
   "DEĞERLENDİRME" yerine "EĞERLENDİRME" yazılabiliyor ve İ→i katlaması gerekiyor. */
function genelBaslikMi(metin) {
  const sade = normal(metin);
  return sade.indexOf('genel') === 0 && sade.indexOf('egerlendirme') > -1;
}

function imzaSatiriMi(metin) {
  return normal(metin).indexOf('kontroluyapan') > -1;
}

/* Başlık satırından sütun indeksleri üretir; sıra değişse de doğru okunur. */
function sutunlariBul(satir) {
  const sutunlar = { no: -1, madde: -1, dayanak: -1, var: -1, yok: -1, kd: -1, tarih: -1 };
  satir.forEach((hucre, indeks) => {
    const anahtar = normal(hucre);
    if (!anahtar) { return; }
    if (anahtar === 'no' || anahtar === 'sira') { if (sutunlar.no < 0) { sutunlar.no = indeks; } return; }
    if (anahtar.indexOf('kontroltarihi') > -1) { if (sutunlar.tarih < 0) { sutunlar.tarih = indeks; } return; }
    if (anahtar.indexOf('belge') > -1 || anahtar.indexOf('kayit') > -1) { if (sutunlar.madde < 0) { sutunlar.madde = indeks; } return; }
    if (anahtar.indexOf('dayanak') > -1 || anahtar.indexOf('periyot') > -1) { if (sutunlar.dayanak < 0) { sutunlar.dayanak = indeks; } return; }
    if (anahtar === 'kd' || anahtar.indexOf('kapsamidisi') > -1) { if (sutunlar.kd < 0) { sutunlar.kd = indeks; } return; }
    if (anahtar === 'var') { if (sutunlar['var'] < 0) { sutunlar['var'] = indeks; } return; }
    if (anahtar === 'yok') { if (sutunlar.yok < 0) { sutunlar.yok = indeks; } }
  });
  return sutunlar;
}

function kontrolTablosuMu(satirlar) {
  return satirlar.some((satir) => {
    const sutunlar = sutunlariBul(satir);
    return sutunlar.madde > -1 && (sutunlar['var'] > -1 || sutunlar.yok > -1);
  });
}

function etiketDeger(satirlar, anahtar) {
  for (const satir of satirlar) {
    for (let i = 0; i < satir.length - 1; i += 1) {
      if (normal(satir[i]).indexOf(anahtar) === 0) { return temizMetin(satir[i + 1]); }
    }
  }
  return '';
}
/* Word bloklarını şablona çevirir: bölüm başlıkları, madde tabloları, üst bilgi. */
function listeAyikla(bloklar, kod) {
  const sablon = {
    kod: kod,
    ad: '',
    kaynak: '',
    duzenleyen: '',
    sicilNo: '',
    isyeriAdi: '',
    asilIsveren: '',
    kontrolTarihi: '',
    sonrakiKontrol: '',
    eslesme: [],
    genelDegerlendirme: '',
    bolumler: []
  };
  let aktif = null;
  let genelBekleniyor = false;

  bloklar.forEach((blok) => {
    if (!/^<w:tbl/.test(blok)) {
      const metin = temizMetin(parcaMetni(blok));
      if (!metin) { return; }
      if (!sablon.kaynak && KOD_KALIP.test(metin)) {
        sablon.kaynak = temizMetin(metin.replace(/^[\s\S]*?(dok[üu]man\s+kodu)/i, '$1'));
        return;
      }
      if (BOLUM_KALIP.test(metin)) {
        aktif = { ad: temizMetin(metin).toUpperCase(), maddeler: [] };
        sablon.bolumler.push(aktif);
        genelBekleniyor = false;
        return;
      }
      if (genelBaslikMi(metin)) { aktif = null; genelBekleniyor = true; return; }
      if (imzaSatiriMi(metin)) { sablon.duzenleyen = metin; }
      return;
    }

    const satirlar = satirlariAyir(blok);
    const baslikIndex = satirlar.findIndex((satir) => {
      const sutunlar = sutunlariBul(satir);
      return sutunlar.madde > -1 && (sutunlar['var'] > -1 || sutunlar.yok > -1);
    });

    if (baslikIndex === -1) {
      const tabloMetni = temizMetin(satirlar.map((satir) => satir.join(' ')).join(' '));
      if (!sablon.duzenleyen && imzaSatiriMi(tabloMetni)) {
        sablon.duzenleyen = tabloMetni;
        return;
      }
      if (genelBekleniyor) {
        if (tabloMetni && !sablon.genelDegerlendirme) { sablon.genelDegerlendirme = tabloMetni; }
        genelBekleniyor = false;
        return;
      }
      if (!aktif && !sablon.isyeriAdi) {
        sablon.isyeriAdi = etiketDeger(satirlar, 'isyeri') || etiketDeger(satirlar, 'birimadi');
        sablon.asilIsveren = etiketDeger(satirlar, 'asilisveren');
        sablon.sicilNo = etiketDeger(satirlar, 'sgksicil');
        sablon.kontrolTarihi = isoTarih(etiketDeger(satirlar, 'kontroltarihi'));
        sablon.sonrakiKontrol = isoTarih(etiketDeger(satirlar, 'birsonraki'));
      }
      return;
    }

    if (!aktif) { return; }
    const sutunlar = sutunlariBul(satirlar[baslikIndex]);

    satirlar.slice(baslikIndex + 1).forEach((satir) => {
      const madde = temizMetin(satir[sutunlar.madde]);
      if (!madde) { return; }
      let isaret = '';
      if (sutunlar['var'] > -1 && secildiMi(satir[sutunlar['var']])) { isaret = 'VAR'; }
      else if (sutunlar.yok > -1 && secildiMi(satir[sutunlar.yok])) { isaret = 'YOK'; }
      else if (sutunlar.kd > -1 && secildiMi(satir[sutunlar.kd])) { isaret = 'KD'; }
      const noHucre = sutunlar.no > -1 ? temizMetin(satir[sutunlar.no]) : '';
      aktif.maddeler.push({
        no: Number(noHucre.replace(/[^0-9]/g, '')) || (aktif.maddeler.length + 1),
        madde: madde,
        dayanak: sutunlar.dayanak > -1 ? temizMetin(satir[sutunlar.dayanak]) : '',
        isaret: isaret,
        tarih: sutunlar.tarih > -1 ? isoTarih(satir[sutunlar.tarih]) : ''
      });
    });
  });

  sablon.bolumler = sablon.bolumler.filter((bolum) => bolum.maddeler.length > 0);
  const maddeSayisi = sablon.bolumler.reduce((toplam, bolum) => toplam + bolum.maddeler.length, 0);
  if (!maddeSayisi) {
    throw new Error('Hiç kontrol maddesi bulunamadı. Tablo başlığı (NO | BELGE / KAYIT | ... | VAR | YOK) ve "BÖLÜM n" başlığı beklenir.');
  }
  if (!sablon.isyeriAdi) { sablon.isyeriAdi = kod; }
  if (!sablon.ad) { sablon.ad = sablon.isyeriAdi + ' — Dosya Kontrol Listesi'; }
  if (!sablon.eslesme.length) {
    sablon.eslesme = [sablon.isyeriAdi, sablon.isyeriAdi.replace(/-/g, ' ')].filter((deger, index, liste) =>
      deger && liste.indexOf(deger) === index);
  }
  return { sablon: sablon, maddeSayisi: maddeSayisi };
}
/* ---------- Üretim: assets/js/kontrol-listeleri.js ---------- */

function js(deger) { return JSON.stringify(deger === undefined || deger === null ? '' : deger); }

function jsMadde(madde) {
  return '{ no: ' + (Number(madde.no) || 0) +
    ', madde: ' + js(madde.madde) +
    ', dayanak: ' + js(madde.dayanak) +
    ', isaret: ' + js(madde.isaret) +
    ', tarih: ' + js(madde.tarih) + ' }';
}

function jsSablon(sablon) {
  const satirlar = [];
  const bolumler = sablon.bolumler || [];
  satirlar.push('  {');
  satirlar.push('    kod: ' + js(sablon.kod) + ', ad: ' + js(sablon.ad) + ', kaynak: ' + js(sablon.kaynak) + ',');
  satirlar.push('    duzenleyen: ' + js(sablon.duzenleyen) + ', sicilNo: ' + js(sablon.sicilNo) + ',');
  satirlar.push('    isyeriAdi: ' + js(sablon.isyeriAdi) + ', asilIsveren: ' + js(sablon.asilIsveren) + ',');
  satirlar.push('    kontrolTarihi: ' + js(sablon.kontrolTarihi) + ', sonrakiKontrol: ' + js(sablon.sonrakiKontrol) + ',');
  satirlar.push('    eslesme: [' + (sablon.eslesme || []).map(js).join(', ') + '],');
  satirlar.push('    genelDegerlendirme: ' + js(sablon.genelDegerlendirme) + ',');
  satirlar.push('    bolumler: [');
  bolumler.forEach((bolum, bi) => {
    satirlar.push('      { ad: ' + js(bolum.ad) + ', maddeler: [');
    bolum.maddeler.forEach((madde, mi) => {
      satirlar.push('        ' + jsMadde(madde) + (mi === bolum.maddeler.length - 1 ? '' : ','));
    });
    satirlar.push('      ]}' + (bi === bolumler.length - 1 ? '' : ','));
  });
  satirlar.push('    ]');
  satirlar.push('  }');
  return satirlar.join('\n');
}

/* Tarayıcıda kullanılan salt okunur yardımcılar — üretimde aynen yazılır. */
const YARDIMCILAR = [
  '',
  '  /* ---------- Şablon yardımcıları (salt okunur) ---------- */',
  '',
  '  var HARF = {',
  "    'ı': 'i', 'İ': 'i', 'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g',",
  "    'ü': 'u', 'Ü': 'u', 'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c',",
  "    'â': 'a', 'î': 'i', 'û': 'u'",
  '  };',
  '',
  '  /* Madde eşleştirmesinde kullanılan anahtar: Türkçe sadeleşir, noktalama düşer. */',
  '  ISG.listeAnahtar = function (metin) {',
  '    return String(metin === undefined || metin === null ? \'\' : metin)',
  '      .replace(/[\\S]/g, function (harf) { return HARF[harf] || harf; })',
  '      .toLowerCase()',
  '      .replace(/[^a-z0-9]/g, \'\');',
  '  };',
  '',
  '  ISG.listeSablonBul = function (kod) {',
  '    var anahtar = ISG.listeAnahtar(kod);',
  '    return SABLONLAR.filter(function (sablon) { return ISG.listeAnahtar(sablon.kod) === anahtar; })[0] || null;',
  '  };',
  '',
  '  /* İşyeri adı / kısa adı / sicil numarası ile şablon önerisi. */',
  '  ISG.listeEsleyenSablonlar = function (isyeri) {',
  '    if (!isyeri) { return []; }',
  '    var hedef = [isyeri.ad, isyeri.kisaAd, isyeri.sicilNo].map(ISG.listeAnahtar).filter(Boolean);',
  '    if (!hedef.length) { return []; }',
  '    return SABLONLAR.filter(function (sablon) {',
  '      return (sablon.eslesme || []).some(function (anahtar) {',
  '        var deger = ISG.listeAnahtar(anahtar);',
  '        if (!deger) { return false; }',
  '        return hedef.some(function (h) { return h.indexOf(deger) > -1 || (deger.length > 3 && deger.indexOf(h) > -1); });',
  '      });',
  '    });',
  '  };',
  '',
  '  /* Word işaretini uygulama durumuna çevirir: VAR→var, YOK→eksik, K/D→yok. */',
  '  ISG.listeDurumKod = function (isaret) {',
  '    var deger = String(isaret || \'\').toUpperCase();',
  '    if (deger === \'VAR\') { return \'var\'; }',
  '    if (deger === \'YOK\') { return \'eksik\'; }',
  '    if (deger === \'KD\' || deger === \'K/D\') { return \'yok\'; }',
  '    return \'incelenmedi\';',
  '  };',
  '',
  '  ISG.listeMaddeSayisi = function (sablon) {',
  '    if (!sablon) { return 0; }',
  '    return (sablon.bolumler || []).reduce(function (toplam, bolum) {',
  '      return toplam + (bolum.maddeler || []).length;',
  '    }, 0);',
  '  };',
  '',
  '  /* Şablon maddelerinin işyerinde kaçının zaten açık olduğunu sayar. */',
  '  ISG.listeKarsilastir = function (sablon, dosyalar) {',
  '    var mevcut = {};',
  '    (dosyalar || []).forEach(function (dosya) {',
  '      mevcut[ISG.listeAnahtar(dosya.madde)] = true;',
  '    });',
  '    var toplam = 0, eslesen = 0, eksik = 0;',
  '    (((sablon && sablon.bolumler) || [])).forEach(function (bolum) {',
  '      (bolum.maddeler || []).forEach(function (madde) {',
  '        toplam += 1;',
  '        if (mevcut[ISG.listeAnahtar(madde.madde)]) { eslesen += 1; }',
  '        if (ISG.listeDurumKod(madde.isaret) === \'eksik\') { eksik += 1; }',
  '      });',
  '    });',
  '    return { toplam: toplam, mevcut: eslesen, yeni: toplam - eslesen, eksik: eksik };',
  '  };',
  '',
  '  ISG.KONTROL_LISTESI_SABLONLARI = SABLONLAR;'
].join('\n');
function kayitlariOku() {
  if (!fs.existsSync(KAYNAK_DIZIN)) { return []; }
  return fs.readdirSync(KAYNAK_DIZIN)
    .filter((ad) => ad.toLowerCase().endsWith('.json'))
    .sort()
    .map((ad) => JSON.parse(fs.readFileSync(path.join(KAYNAK_DIZIN, ad), 'utf8')));
}

function olustur() {
  const kayitlar = kayitlariOku();
  const baslik = [
    '/* İSG Takip Merkezi — işyeri bazlı hazır dosya kontrol listeleri',
    '   ÜRETİLMİŞ DOSYA — elle düzenlemeyin.',
    '   Kaynak: tools/kontrol-listeleri/*.json (Word dönüştürme çıktısı)',
    '   Yeni işyeri: node tools/kontrol-listesi.js donustur "<liste.docx>" <KOD>',
    '   Yeniden üretim: node tools/kontrol-listesi.js olustur */',
    '(function (global) {',
    "  'use strict';",
    '',
    '  var ISG = global.ISG = global.ISG || {};',
    '',
    '  var SABLONLAR = ['
  ].join('\n');

  const icerik = baslik + '\n' + kayitlar.map(jsSablon).join(',\n') + '\n  ];\n' + YARDIMCILAR + '})(window);\n';

  fs.mkdirSync(path.dirname(VARIS), { recursive: true });
  fs.writeFileSync(VARIS, icerik, 'utf8');

  console.log('assets/js/kontrol-listeleri.js hazır: ' + kayitlar.length + ' liste, ' +
    (Buffer.byteLength(icerik, 'utf8') / 1024).toFixed(1) + ' KB');
  kayitlar.forEach((sablon) => {
    console.log('  - ' + sablon.kod + ' · ' + sablon.ad + ' · ' + (sablon.bolumler || []).length +
      ' bölüm / ' + ISG_MADDE_SAYISI(sablon) + ' madde');
  });
  return kayitlar;
}

function ISG_MADDE_SAYISI(sablon) {
  return (sablon.bolumler || []).reduce((toplam, bolum) => toplam + (bolum.maddeler || []).length, 0);
}

/* ---------- Komut satırı ---------- */

function secenekleriAyir(arglar) {
  const secenekler = {};
  (arglar || []).forEach((arg) => {
    const eslesme = /^--([^=]+)(?:=(.*))?$/.exec(arg);
    if (eslesme) { secenekler[eslesme[1]] = eslesme[2] === undefined ? true : eslesme[2]; }
  });
  return secenekler;
}

function main(argv) {
  const komut = argv[0];
  const secenekler = secenekleriAyir(argv.slice(1));
  const konumlar = argv.slice(1).filter((arg) => !/^--/.test(arg));

  if (komut === 'olustur') { olustur(); return; }

  if (komut === 'donustur') {
    const kaynak = konumlar[0];
    const kod = String(konumlar[1] || '').toUpperCase();
    if (!kaynak || !kod) {
      throw new Error('Kullanım: node tools/kontrol-listesi.js donustur <docx-yolu> <KOD> [--ad=...] [--eslesme=ASKI-1,ASKI 1]');
    }
    if (!fs.existsSync(kaynak)) { throw new Error('Word dosyası bulunamadı: ' + kaynak); }
    const sonuc = listeAyikla(govdeBloklari(kaynak), kod);
    if (typeof secenekler.ad === 'string') { sonuc.sablon.ad = secenekler.ad; }
    if (typeof secenekler.eslesme === 'string') {
      sonuc.sablon.eslesme = secenekler.eslesme.split(',').map(temizMetin).filter(Boolean);
    }
    fs.mkdirSync(KAYNAK_DIZIN, { recursive: true });
    const hedef = path.join(KAYNAK_DIZIN, kod + '.json');
    fs.writeFileSync(hedef, JSON.stringify(sonuc.sablon, null, 2) + '\n', 'utf8');
    console.log('Şablon kaydedildi: ' + path.relative(KOK, hedef) + ' · ' +
      sonuc.sablon.bolumler.length + ' bölüm / ' + sonuc.maddeSayisi + ' madde');
    olustur();
    return;
  }

  throw new Error('Bilinmeyen komut. Kullanılabilir: donustur <docx> <KOD>, olustur');
}

if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (hata) {
    console.error('HATA: ' + hata.message);
    process.exitCode = 1;
  }
}

module.exports = {
  listeAyikla: listeAyikla,
  olustur: olustur,
  normal: normal,
  isoTarih: isoTarih,
  sutunlariBul: sutunlariBul,
  govdeBloklari: govdeBloklari,
  satirlariAyir: satirlariAyir,
  parcaMetni: parcaMetni
};




