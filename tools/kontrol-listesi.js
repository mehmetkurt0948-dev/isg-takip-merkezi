/* İSG Takip Merkezi — Word/Excel kontrol listesi dönüştürücüsü
   Her işyeri için farklı bir dosya kontrol listesi Word veya Excel olarak paylaşılır.
   Bu araç o listeyi uygulamada kullanılabilir hazır şablona çevirir.

   Kullanım:
     node tools/kontrol-listesi.js donustur "C:\...\ASKI-1 DOSYA KONTROL LISTESI.docx" ASKI-1
       → tools/kontrol-listeleri/ASKI-1.json üretir ve assets/js/kontrol-listeleri.js yenilenir
     node tools/kontrol-listesi.js donustur "C:\...\halk ekmek.xlsx" HALK-EKMEK --isyeri="Halk Ekmek"
       → Excel "İSG Dosya Kontrol Checklisti" sayfası aynı şablona çevrilir
     node tools/kontrol-listesi.js toplu "C:\...\kontrol listeleri" [--kaynaklar=tools/kontrol-listesi-kaynaklari.json]
       → klasördeki tüm .xlsx dosyaları dönüştürülür (kod/ad eşleşmesi kaynak dosyasından)
     node tools/kontrol-listesi.js olustur
       → tools/kontrol-listeleri/*.json dosyalarından assets/js/kontrol-listeleri.js üretir

   Beklenen Word düzeni (ABB-OSGB-KL-001 şablonu):
     • Bölüm başlığı paragrafı: "BÖLÜM 1  YÖNETSEL VE ORGANİZASYONEL BELGELER"
     • Madde tablosu başlığı:  NO | BELGE / KAYIT | YASAL DAYANAK • PERİYOT | VAR | YOK | K/D | KONTROL TARİHİ
     • İşaret hücrelerinde dolu kutu (☒) kullanılır; boş kutu (☐) işaret sayılmaz.
   Beklenen Excel düzeni (İSG Dosya Kontrol Checklisti):
     • Üst bilgi satırları: "İşyeri / Birim", "Kontrol Tarihi", "Kontrolü Yapan", "İSG Uzmanı"
     • Madde başlığı: No | Ana Başlık | Kontrol Edilecek Belge / Kayıt | Durum | Açıklama / Eksiklik | Kontrol
     • Durum: "Var / Uygun" → VAR, "Eksik" → YOK, "Güncellenecek" → GUNCELLENECEK,
       "Uygulanamaz" → KD. Açıklama hücresi maddenin notu olarak taşınır.
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

/* ---------- Excel (XLSX) ayrıştırma ----------
   .xlsx bir ZIP arşividir; Windows'un kendi .NET sınıflarıyla açılır (bağımlılık yok). */

/* "46288" gibi Excel seri tarihini ISO'ya çevirir; değilse isoTarih denenir. */
function excelTarih(deger) {
  const metin = temizMetin(deger);
  if (/^\d{5}(\.\d+)?$/.test(metin)) {
    const gun = Number(metin);
    if (gun > 20000 && gun < 80000) {
      return new Date(Date.UTC(1899, 11, 30) + Math.floor(gun) * 86400000).toISOString().slice(0, 10);
    }
  }
  return isoTarih(metin);
}

function geciciDizinAdi(onek) {
  return path.join(os.tmpdir(), onek + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7));
}

/* .xlsx arşivini geçici klasöre açar; klasör yolunu döndürür. */
function xlsxAc(xlsxYolu, kok) {
  const tekTirnak = (deger) => String(deger).replace(/'/g, "''");
  const betik = [
    "Remove-Item -LiteralPath '" + tekTirnak(kok) + "' -Recurse -Force -ErrorAction SilentlyContinue",
    'Add-Type -AssemblyName System.IO.Compression.FileSystem',
    "[System.IO.Compression.ZipFile]::ExtractToDirectory('" + tekTirnak(xlsxYolu) + "', '" + tekTirnak(kok) + "')"
  ].join('\n');
  execFileSync('powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', betik],
    { stdio: 'ignore' });
  if (!fs.existsSync(path.join(kok, 'xl', 'workbook.xml'))) {
    throw new Error('Excel dosyası okunamadı (xl/workbook.xml yok): ' + xlsxYolu);
  }
  return kok;
}

/* xl/sharedStrings.xml içindeki ortak metinler. */
function paylasilanMetinler(kok) {
  const yol = path.join(kok, 'xl', 'sharedStrings.xml');
  if (!fs.existsSync(yol)) { return []; }
  return (fs.readFileSync(yol, 'utf8').match(/<si(?:\s[^>]*)?>[\s\S]*?<\/si>/g) || []).map((si) =>
    (si.match(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g) || [])
      .map((t) => { const es = />([\s\S]*)</.exec(t); return es ? coz(es[1]) : ''; })
      .join(' ')).map(temizMetin);
}

/* Çalışma sayfası adları ve XML dosya yolları. */
function calismaSayfalari(kok) {
  const xml = fs.readFileSync(path.join(kok, 'xl', 'workbook.xml'), 'utf8');
  const relsYol = path.join(kok, 'xl', '_rels', 'workbook.xml.rels');
  const baglar = {};
  if (fs.existsSync(relsYol)) {
    (fs.readFileSync(relsYol, 'utf8').match(/<Relationship[^>]*>/g) || []).forEach((rel) => {
      const id = /Id="([^"]+)"/.exec(rel);
      const hedef = /Target="([^"]+)"/.exec(rel);
      if (id && hedef) { baglar[id[1]] = hedef[1].replace(/^\/+/, '').replace(/^xl\//, ''); }
    });
  }
  return (xml.match(/<sheet\s[^>]*>/g) || []).map((satir) => {
    const ad = /name="([^"]*)"/.exec(satir);
    const rid = /r:id="([^"]+)"/.exec(satir);
    return { ad: ad ? temizMetin(coz(ad[1])) : '', dosya: rid ? (baglar[rid[1]] || '') : '' };
  }).filter((sayfa) => sayfa.dosya && fs.existsSync(path.join(kok, 'xl', sayfa.dosya)));
}

/* "BC12" → 53 (sıfırdan başlayan sütun indeksi). */
function sutunIndeks(ref) {
  const harf = /^([A-Z]+)/.exec(String(ref || ''));
  let sayi = 0;
  if (harf) { for (const karakter of harf[1]) { sayi = sayi * 26 + (karakter.charCodeAt(0) - 64); } }
  return sayi - 1;
}

function hucreDegeri(cXml, paylasilan) {
  const tip = /t="([^"]+)"/.exec(cXml);
  const tur = tip ? tip[1] : '';
  if (tur === 'inlineStr') {
    return temizMetin((cXml.match(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g) || [])
      .map((t) => { const es = />([\s\S]*)</.exec(t); return es ? coz(es[1]) : ''; }).join(' '));
  }
  const deger = /<v>([\s\S]*?)<\/v>/.exec(cXml);
  if (!deger) { return ''; }
  const ham = coz(deger[1]);
  return tur === 's' ? (paylasilan[Number(ham)] || '') : temizMetin(ham);
}

/* Sayfa XML'ini sıkıştırılmış satır matrisine çevirir (boş satırlar dahil boş dizi). */
function sayfaIzgarasi(kok, sayfaDosyasi, paylasilan) {
  const xml = fs.readFileSync(path.join(kok, 'xl', sayfaDosyasi), 'utf8');
  const satirlar = [];
  (xml.match(/<row(?:\s[^>]*)?>[\s\S]*?<\/row>/g) || []).forEach((satirXml) => {
    const no = /r="(\d+)"/.exec(satirXml);
    const indeks = no ? Number(no[1]) - 1 : satirlar.length;
    const hucreler = [];
    (satirXml.match(/<c(?:\s[^>]*)?\/>|<c(?:\s[^>]*)?>[\s\S]*?<\/c>/g) || []).forEach((c) => {
      const ref = /r="([^"]+)"/.exec(c);
      const sutun = ref ? sutunIndeks(ref[1]) : hucreler.length;
      if (sutun > -1) { hucreler[sutun] = hucreDegeri(c, paylasilan); }
    });
    satirlar[indeks] = hucreler;
  });
  return Array.from({ length: satirlar.length }, (_, i) =>
    (satirlar[i] || []).map((hucre) => (hucre === undefined ? '' : hucre)));
}

/* .xlsx dosyasını açar, sayfaları matris olarak döndürür, geçici klasörü siler. */
function xlsxSayfalari(xlsxYolu) {
  const kok = geciciDizinAdi('isg-xlsx');
  try {
    xlsxAc(xlsxYolu, kok);
    const paylasilan = paylasilanMetinler(kok);
    return calismaSayfalari(kok).map((sayfa) => ({
      ad: sayfa.ad,
      izgara: sayfaIzgarasi(kok, sayfa.dosya, paylasilan)
    }));
  } finally {
    fs.rmSync(kok, { recursive: true, force: true });
  }
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

  return sablonuTamamla(sablon,
    'NO | BELGE / KAYIT | ... | VAR | YOK başlıklı tablo ve "BÖLÜM n" başlığı beklenir.');
}

/* Bölüm/madde sayımlarını, varsayılan adı ve işyeri eşleşme anahtarlarını tamamlar. */
function sablonuTamamla(sablon, beklenenDuzen) {
  sablon.bolumler = (sablon.bolumler || []).filter((bolum) => (bolum.maddeler || []).length > 0);
  const maddeSayisi = sablon.bolumler.reduce((toplam, bolum) => toplam + bolum.maddeler.length, 0);
  if (!maddeSayisi) {
    throw new Error('Hiç kontrol maddesi bulunamadı. ' + beklenenDuzen);
  }
  if (!sablon.isyeriAdi) { sablon.isyeriAdi = sablon.kod; }
  if (!sablon.ad) { sablon.ad = sablon.isyeriAdi + ' — Dosya Kontrol Listesi'; }
  if (!sablon.eslesme.length) {
    sablon.eslesme = [sablon.isyeriAdi, sablon.isyeriAdi.replace(/-/g, ' ')].filter((deger, index, liste) =>
      deger && liste.indexOf(deger) === index);
  }
  return { sablon: sablon, maddeSayisi: maddeSayisi };
}
/* ---------- Excel "İSG Dosya Kontrol Checklisti" dönüşümü ---------- */

/* Kaynak dosyadaki bariz yazım hataları; bölüm adları uygulamada göründüğü için düzeltilir. */
const BOLUM_YAZIM = { 'yillikpanlar': 'Yıllık planlar' };

function bolumAdi(metin) {
  const sade = normal(metin);
  return temizMetin(BOLUM_YAZIM[sade] || metin);
}

/* Excel "Durum" hücresi → uygulama işareti. "Uygulanamaz" kelimesi "uygun" ile başladığı
   için kapsam dışı önce aranır; "Güncellenecek" takip gerektirdiğinden eksik sayılır. */
function durumIsareti(metin) {
  const sade = normal(metin);
  if (!sade) { return ''; }
  if (sade.indexOf('uygulanamaz') > -1 || sade.indexOf('kapsamidisi') > -1 || sade === 'kd') { return 'KD'; }
  if (sade.indexOf('guncellen') > -1) { return 'GUNCELLENECEK'; }
  if (sade.indexOf('eksik') > -1 || sade === 'yok') { return 'YOK'; }
  if (sade.indexOf('var') === 0 || sade.indexOf('uygun') === 0) { return 'VAR'; }
  return temizMetin(metin).toUpperCase().slice(0, 24);
}

/* Excel başlık satırından sütun indeksleri: No | Ana Başlık | Belge/Kayıt | Durum | Açıklama. */
function xlsxSutunlariBul(satir) {
  const sutunlar = { no: -1, bolum: -1, madde: -1, dayanak: -1, durum: -1, var: -1, yok: -1, kd: -1, tarih: -1, not: -1 };
  (satir || []).forEach((hucre, indeks) => {
    const anahtar = normal(hucre);
    if (!anahtar) { return; }
    if (anahtar === 'no' || anahtar === 'sira') { if (sutunlar.no < 0) { sutunlar.no = indeks; } return; }
    if (anahtar.indexOf('kontroltarihi') > -1 || anahtar === 'tarih') {
      if (sutunlar.tarih < 0) { sutunlar.tarih = indeks; }
      return;
    }
    if (anahtar.indexOf('anabaslik') > -1 || anahtar.indexOf('bolum') > -1) {
      if (sutunlar.bolum < 0) { sutunlar.bolum = indeks; }
      return;
    }
    if (anahtar.indexOf('aciklama') > -1 || anahtar.indexOf('eksiklik') > -1 || anahtar.indexOf('notlar') > -1) {
      if (sutunlar.not < 0) { sutunlar.not = indeks; }
      return;
    }
    if (anahtar.indexOf('durum') > -1) { if (sutunlar.durum < 0) { sutunlar.durum = indeks; } return; }
    if (anahtar.indexOf('dayanak') > -1 || anahtar.indexOf('periyot') > -1) {
      if (sutunlar.dayanak < 0) { sutunlar.dayanak = indeks; }
      return;
    }
    if (anahtar === 'kd' || anahtar.indexOf('kapsamidisi') > -1) { if (sutunlar.kd < 0) { sutunlar.kd = indeks; } return; }
    if (anahtar === 'var') { if (sutunlar['var'] < 0) { sutunlar['var'] = indeks; } return; }
    if (anahtar === 'yok') { if (sutunlar.yok < 0) { sutunlar.yok = indeks; } return; }
    if (anahtar.indexOf('belge') > -1 || anahtar.indexOf('kayit') > -1 || anahtar.indexOf('madde') > -1 ||
        anahtar.indexOf('kontrol') > -1) {
      if (sutunlar.madde < 0) { sutunlar.madde = indeks; }
    }
  });
  return sutunlar;
}

function xlsxTabloBasligiMi(satir) {
  const sutunlar = xlsxSutunlariBul(satir);
  return sutunlar.madde > -1 && (sutunlar.durum > -1 || sutunlar['var'] > -1 || sutunlar.yok > -1);
}

/* Başlık üstündeki "Etiket | Değer" satırlarını toplar (İşyeri / Birim, Kontrol Tarihi ...). */
function xlsxUstBilgiler(izgara, baslikIndex) {
  const harita = {};
  izgara.slice(0, baslikIndex).forEach((satir) => {
    const dolu = (satir || []).map(temizMetin).filter(Boolean);
    if (dolu.length < 2) { return; }
    const anahtar = normal(dolu[0]);
    if (anahtar && harita[anahtar] === undefined) { harita[anahtar] = dolu[1]; }
  });
  return harita;
}

/* Madde satırlarını taşıyan çalışma sayfası: adı "checklist" içeren, yoksa ilk tablo. */
function xlsxChecklistSayfasi(sayfalar) {
  const dolu = (sayfalar || []).filter((sayfa) => (sayfa.izgara || []).some(xlsxTabloBasligiMi));
  if (!dolu.length) {
    throw new Error('Excel içinde kontrol tablosu olan sayfa bulunamadı (No | Ana Başlık | ... | Durum).');
  }
  return dolu.filter((sayfa) => /check|list/i.test(sayfa.ad))[0] || dolu[0];
}

/* Excel sayfasını hazır şablona çevirir. secenekler: {ad, isyeri, eslesme, kaynakAd} */
function xlsxListeAyikla(sayfalar, kod, secenekler) {
  const sec = secenekler || {};
  const sayfa = xlsxChecklistSayfasi(sayfalar);
  const baslikIndex = sayfa.izgara.findIndex(xlsxTabloBasligiMi);
  const sutunlar = xlsxSutunlariBul(sayfa.izgara[baslikIndex]);
  const ust = xlsxUstBilgiler(sayfa.izgara, baslikIndex);

  const sablon = {
    kod: kod,
    ad: temizMetin(sec.ad || ''),
    kaynak: '',
    duzenleyen: '',
    sicilNo: temizMetin(ust.sgksicil || ust.sicilno || ''),
    isyeriAdi: temizMetin(sec.isyeri || ''),
    asilIsveren: temizMetin(ust.asilisveren || ''),
    kontrolTarihi: excelTarih(ust.kontroltarihi),
    sonrakiKontrol: excelTarih(ust.birsonrakontrol || ust.sonrakikontrol || ''),
    eslesme: typeof sec.eslesme === 'string' ? sec.eslesme.split(',').map(temizMetin).filter(Boolean) : [],
    genelDegerlendirme: '',
    bolumler: []
  };

  const bolumHarita = {};
  const sayaclar = { VAR: 0, YOK: 0, GUNCELLENECEK: 0, KD: 0, BOS: 0 };
  let aktif = null;

  function bolumBul(ad) {
    const anahtar = normal(ad);
    if (!bolumHarita[anahtar]) {
      bolumHarita[anahtar] = { ad: bolumAdi(ad), maddeler: [] };
      sablon.bolumler.push(bolumHarita[anahtar]);
    }
    return bolumHarita[anahtar];
  }

  sayfa.izgara.slice(baslikIndex + 1).forEach((satir) => {
    const madde = temizMetin(satir[sutunlar.madde]);
    if (!madde) { return; }
    const bolumMetni = sutunlar.bolum > -1 ? temizMetin(satir[sutunlar.bolum]) : '';
    aktif = bolumBul(bolumMetni || (aktif ? aktif.ad : 'Kontrol Listesi'));

    let isaret = '';
    if (sutunlar.durum > -1) {
      isaret = durumIsareti(satir[sutunlar.durum]);
    } else if (sutunlar['var'] > -1 && secildiMi(satir[sutunlar['var']])) {
      isaret = 'VAR';
    } else if (sutunlar.yok > -1 && secildiMi(satir[sutunlar.yok])) {
      isaret = 'YOK';
    } else if (sutunlar.kd > -1 && secildiMi(satir[sutunlar.kd])) {
      isaret = 'KD';
    }

    const noHucre = sutunlar.no > -1 ? temizMetin(satir[sutunlar.no]) : '';
    aktif.maddeler.push({
      no: Number(noHucre.replace(/[^0-9]/g, '')) || (aktif.maddeler.length + 1),
      madde: madde,
      dayanak: sutunlar.dayanak > -1 ? temizMetin(satir[sutunlar.dayanak]) : '',
      isaret: isaret,
      tarih: sutunlar.tarih > -1 ? excelTarih(satir[sutunlar.tarih]) : '',
      not: sutunlar.not > -1 ? temizMetin(satir[sutunlar.not]).slice(0, 200) : ''
    });
    sayaclar[sayaclar[isaret] !== undefined ? isaret : 'BOS'] += 1;
  });

  const birim = temizMetin(ust.isyeribirim || ust.birimadi || '');
  sablon.kaynak = 'İSG Dosya Kontrol Checklisti (Excel' +
    (sec.kaynakAd ? ': ' + sec.kaynakAd : '') + ')' +
    (birim ? ' · Sayfadaki birim: ' + birim : '');

  sablon.duzenleyen = [
    ust.kontroluyapan ? 'Kontrolü yapan: ' + temizMetin(ust.kontroluyapan) : '',
    ust.isguzmani ? 'İSG uzmanı: ' + temizMetin(ust.isguzmani) : ''
  ].filter(Boolean).join(' · ');

  const toplam = sablon.bolumler.reduce((sayi, bolum) => sayi + bolum.maddeler.length, 0);
  sablon.genelDegerlendirme = 'Kontrol özeti (' + toplam + ' madde): ' + sayaclar.VAR + ' var/uygun, ' +
    sayaclar.YOK + ' eksik, ' + sayaclar.GUNCELLENECEK + ' güncellenecek, ' + sayaclar.KD + ' uygulanamaz' +
    (sayaclar.BOS ? ', ' + sayaclar.BOS + ' işaretsiz' : '') + '.';

  return sablonuTamamla(sablon,
    'No | Ana Başlık | Kontrol Edilecek Belge / Kayıt | Durum başlıklı tablo beklenir.');
}

const KUCUK_BAGLAC = { ve: 1, ile: 1, de: 1, da: 1 };

/* Dosya adından okunabilir işyeri adı: "halk ekmek.xlsx" → "Halk Ekmek". */
function insanAdi(dosyaAdi) {
  const ham = String(dosyaAdi || '').replace(/\.[a-z0-9]+$/i, '').replace(/\s+/g, ' ').trim().replace(/[.\s]+$/, '');
  return ham.split(' ').map((kelime, indeks) => {
    const sade = kelime.toLocaleLowerCase('tr-TR');
    if (indeks > 0 && KUCUK_BAGLAC[sade.replace(/[^a-zçğıöşü]/gi, '')]) { return sade; }
    return sade.charAt(0).toLocaleUpperCase('tr-TR') + sade.slice(1);
  }).join(' ');
}

/* Türkçe harfleri sadeleştirip büyük harfli kod üretir: "halk ekmek" → "HALK-EKMEK". */
function kodOlustur(ad) {
  return String(ad || '').replace(/[\S]/g, (harf) => HARF[harf] || harf)
    .toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/* ---------- Üretim: assets/js/kontrol-listeleri.js ---------- */

function js(deger) { return JSON.stringify(deger === undefined || deger === null ? '' : deger); }

function jsMadde(madde) {
  const parcalar = [
    'no: ' + (Number(madde.no) || 0),
    'madde: ' + js(madde.madde),
    'isaret: ' + js(madde.isaret)
  ];
  if (temizMetin(madde.dayanak)) { parcalar.push('dayanak: ' + js(madde.dayanak)); }
  if (temizMetin(madde.tarih)) { parcalar.push('tarih: ' + js(madde.tarih)); }
  if (temizMetin(madde.not)) { parcalar.push('not: ' + js(madde.not)); }
  return '{ ' + parcalar.join(', ') + ' }';
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
  '  /* Word/Excel işaretini uygulama durumuna çevirir: VAR→var, YOK/GÜNCELLENECEK→eksik,',
  '     K-D ve UYGULANAMAZ→yok (kapsam dışı). Boş işaret incelenmedi kalır. */',
  '  ISG.listeDurumKod = function (isaret) {',
  '    var deger = String(isaret || \'\').toUpperCase();',
  '    if (deger === \'VAR\') { return \'var\'; }',
  '    if (deger === \'YOK\' || deger === \'GUNCELLENECEK\') { return \'eksik\'; }',
  '    if (deger === \'KD\' || deger === \'K/D\' || deger === \'UYGULANAMAZ\') { return \'yok\'; }',
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
  '  /* İşyerine uygulanmış hazır listelerin özeti: hangi şablondan kaç madde',
  '     üretilmiş, bölümlere nasıl dağılmış. "Listeyi geri al" ekranı bu özeti',
  '     kullanır; yanlış işyerine/bölüme eklenen liste tek tek sayılmaz. */',
  '  ISG.listeUygulananOzeti = function (dosyalar) {',
  '    var gruplar = Object.create(null);',
  '    var siralar = [];',
  '    (dosyalar || []).forEach(function (dosya) {',
  '      var kod = dosya && dosya.sablon;',
  '      if (!kod) { return; }',
  '      var ozet = gruplar[kod];',
  '      if (!ozet) {',
  '        ozet = gruplar[kod] = {',
  '          kod: kod,',
  '          ad: (ISG.listeSablonBul(kod) || {}).ad || kod,',
  '          adet: 0,',
  '          bolumler: Object.create(null),',
  '          bolumSirasi: []',
  '        };',
  '        siralar.push(ozet);',
  '      }',
  '      ozet.adet += 1;',
  '      var bolum = dosya.bolum || "Bölüm belirtilmemiş";',
  '      if (!ozet.bolumler[bolum]) {',
  '        ozet.bolumler[bolum] = { ad: bolum, adet: 0 };',
  '        ozet.bolumSirasi.push(bolum);',
  '      }',
  '      ozet.bolumler[bolum].adet += 1;',
  '    });',
  '    siralar.forEach(function (ozet) {',
  '      ozet.bolumler = ozet.bolumSirasi.map(function (ad) { return ozet.bolumler[ad]; });',
  '      delete ozet.bolumSirasi;',
  '    });',
  '    return siralar;',
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
    '   Kaynak: tools/kontrol-listeleri/*.json (Word/Excel dönüştürme çıktısı)',
    '   Yeni işyeri: node tools/kontrol-listesi.js donustur "<liste.docx|liste.xlsx>" <KOD>',
    '   Toplu Excel: node tools/kontrol-listesi.js toplu "<klasör>" [--kaynaklar=<eslesme.json>]',
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

/* Tek kaynak dosyayı (Word veya Excel) şablona çevirip tools/kontrol-listeleri/<KOD>.json yazar. */
function kaynakDonustur(kaynak, kod, secenekler) {
  const sec = secenekler || {};
  if (!fs.existsSync(kaynak)) { throw new Error('Liste dosyası bulunamadı: ' + kaynak); }
  const uzanti = path.extname(kaynak).toLowerCase();

  let sonuc;
  if (uzanti === '.xlsx' || uzanti === '.xlsm') {
    sonuc = xlsxListeAyikla(xlsxSayfalari(kaynak), kod, {
      ad: sec.ad, isyeri: sec.isyeri, kaynakAd: path.basename(kaynak),
      eslesme: Array.isArray(sec.eslesme) ? sec.eslesme.join(',') : sec.eslesme
    });
  } else if (uzanti === '.docx') {
    sonuc = listeAyikla(govdeBloklari(kaynak), kod);
    if (typeof sec.ad === 'string' && sec.ad) { sonuc.sablon.ad = sec.ad; }
    if (typeof sec.isyeri === 'string' && sec.isyeri) { sonuc.sablon.isyeriAdi = sec.isyeri; }
    if (sec.eslesme) {
      sonuc.sablon.eslesme = (Array.isArray(sec.eslesme) ? sec.eslesme : String(sec.eslesme).split(','))
        .map(temizMetin).filter(Boolean);
    }
  } else {
    throw new Error('Yalnızca .docx ve .xlsx dosyaları dönüştürülebilir: ' + kaynak);
  }

  fs.mkdirSync(KAYNAK_DIZIN, { recursive: true });
  const hedef = path.join(KAYNAK_DIZIN, kod + '.json');
  fs.writeFileSync(hedef, JSON.stringify(sonuc.sablon, null, 2) + '\n', 'utf8');
  console.log('Şablon kaydedildi: ' + path.relative(KOK, hedef) + ' · ' +
    sonuc.sablon.bolumler.length + ' bölüm / ' + sonuc.maddeSayisi + ' madde');
  return sonuc;
}

/* Kaynak adı eşleştirme anahtarı: uzantı düşer, Türkçe harfler sadeleşir. */
function kaynakAnahtari(ad) {
  return normal(String(ad || '').replace(/\.[a-z0-9]+$/i, ''));
}

/* Kaynak dosya adı → {kod, ad, isyeri, eslesme} eşleşmesi (toplu dönüşüm için). */
function kaynakEslesmeleri(yol) {
  if (!yol) { return {}; }
  const tamYol = path.isAbsolute(yol) ? yol : path.join(KOK, yol);
  if (!fs.existsSync(tamYol)) { throw new Error('Eşleşme dosyası bulunamadı: ' + tamYol); }
  const ham = JSON.parse(fs.readFileSync(tamYol, 'utf8'));
  const harita = {};
  Object.keys(ham).forEach((ad) => { harita[kaynakAnahtari(ad)] = ham[ad]; });
  return harita;
}

/* Klasördeki tüm Excel listelerini dönüştürür; ad/kod bilgisi eşleşme dosyasından gelir. */
function topluDonustur(dizin, secenekler) {
  if (!dizin) {
    throw new Error('Kullanım: node tools/kontrol-listesi.js toplu <klasör> [--kaynaklar=<eslesme.json>]');
  }
  if (!fs.existsSync(dizin) || !fs.statSync(dizin).isDirectory()) {
    throw new Error('Klasör bulunamadı: ' + dizin);
  }
  const eslesmeler = kaynakEslesmeleri(secenekler.kaynaklar);
  const dosyalar = fs.readdirSync(dizin)
    .filter((ad) => /\.xlsx$/i.test(ad) && ad.indexOf('~$') !== 0)
    .sort();
  if (!dosyalar.length) { throw new Error('Klasörde Excel (.xlsx) liste bulunamadı: ' + dizin); }

  const eksikler = [];
  dosyalar.forEach((ad) => {
    const bilgi = eslesmeler[kaynakAnahtari(ad)] || {};
    if (!bilgi.kod) { eksikler.push(ad); }
    const isyeri = bilgi.isyeri || insanAdi(ad);
    const kod = String(bilgi.kod || kodOlustur(isyeri)).toUpperCase();
    kaynakDonustur(path.join(dizin, ad), kod, {
      ad: bilgi.ad, isyeri: isyeri, eslesme: bilgi.eslesme
    });
  });
  console.log(dosyalar.length + ' Excel listesi dönüştürüldü.');
  if (eksikler.length) {
    console.log('UYARI: eşleşme dosyasında kaydı olmayan dosyalar otomatik adla dönüştürüldü: ' +
      eksikler.join(', '));
  }
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
      throw new Error('Kullanım: node tools/kontrol-listesi.js donustur <docx|xlsx yolu> <KOD> ' +
        '[--ad=...] [--isyeri=...] [--eslesme=ASKI-1,ASKI 1]');
    }
    kaynakDonustur(kaynak, kod, secenekler);
    olustur();
    return;
  }

  if (komut === 'toplu') {
    topluDonustur(konumlar[0], secenekler);
    olustur();
    return;
  }

  throw new Error('Bilinmeyen komut. Kullanılabilir: donustur <docx|xlsx> <KOD>, toplu <klasör> ' +
    '[--kaynaklar=<eslesme.json>], olustur');
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
  xlsxListeAyikla: xlsxListeAyikla,
  xlsxSayfalari: xlsxSayfalari,
  olustur: olustur,
  normal: normal,
  isoTarih: isoTarih,
  excelTarih: excelTarih,
  durumIsareti: durumIsareti,
  insanAdi: insanAdi,
  kodOlustur: kodOlustur,
  sutunlariBul: sutunlariBul,
  xlsxSutunlariBul: xlsxSutunlariBul,
  xlsxTabloBasligiMi: xlsxTabloBasligiMi,
  govdeBloklari: govdeBloklari,
  satirlariAyir: satirlariAyir,
  parcaMetni: parcaMetni
};




