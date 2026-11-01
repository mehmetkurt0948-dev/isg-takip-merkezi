#!/usr/bin/env node
/* İSG Takip Merkezi — yıllık çalışma planı aktarım ve doğrulama aracı
   Kurumlardan gelen yıllık çalışma planı dosyasını (.xlsx) uygulamanın kendi
   ayrıştırıcısıyla (assets/js/plan-toplu.js) okur; faaliyetleri, ana başlıkları,
   ayları, mükerrer ve hatalı satırları raporlar.

   Kullanım:
     node tools/plan-aktar.js "2026 YILLIK ÇALIŞMA PLANI.xlsx" --isyeri=iy5 --yil=2026
     node tools/plan-aktar.js plan.xlsx --isyeri=iy5 --json=plan-cikti.json
     node tools/plan-aktar.js plan.xlsx --isyeri=iy5 --yil=2026 --fixture --rapor=rapor.txt

   --isyeri : kayıtların yazılacağı işyeri kimliği (varsayılan iy5 = ASKİ-1)
   --yil    : plan yılı; boşsa dosya başlığından okunur
   --fixture: örnek (demo) veritabanı yüklenir, gerçek kayıt yazımı denenir ve
              iş yeri bazındaki kayıt sayılarındaki değişim raporlanır
   --json   : kaydedilecek faaliyetleri uygulamanın kayıt biçiminde dosyaya yazar
   --rapor  : raporu dosyaya da yazar (konsol Türkçe karakteri için önerilir)  */
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

const hedefDosya = argumanlar.filter((a) => a.indexOf('--') !== 0)[0];
if (!hedefDosya) {
  console.log('Kullanım: node tools/plan-aktar.js <plan.xlsx> [--isyeri=iy5] [--yil=2026] [--json=out.json] [--fixture] [--rapor=rapor.txt]');
  process.exit(1);
}
const isyeriId = String(bayrak('isyeri') || 'iy5');
const yilIstek = Number(bayrak('yil')) || 0;
const fixture = bayrak('fixture') === true;
const jsonCikti = bayrak('json');
const raporCikti = bayrak('rapor');

function bitir() {
  if (!raporCikti) { return; }
  const yol = path.resolve(process.cwd(), String(raporCikti));
  fs.writeFileSync(yol, raporSatirlari.join('\n') + '\n', 'utf8');
  console.log('Rapor dosyası: ' + yol);
}

/* Uygulama modülleri tarayıcıdaki sırayla yüklenir; ayrıştırma kuralları arayüzle
   birebir aynı kalır. */
const dom = new JSDOM('<!doctype html><html><body></body></html>',
  { url: 'http://127.0.0.1/', pretendToBeVisual: true, runScripts: 'outside-only' });
const ctx = dom.getInternalVMContext();
ctx.DecompressionStream = globalThis.DecompressionStream;
ctx.Blob = globalThis.Blob;
['varsayilan-veri.js', 'depo.js', 'bicim.js', 'excel.js', 'plan-toplu.js'].forEach((ad) => {
  vm.runInContext(fs.readFileSync(path.join(kok, 'assets/js', ad), 'utf8'), ctx, { filename: ad });
});
if (fixture) {
  vm.runInContext(fs.readFileSync(path.join(kok, 'tools/demo-veri.js'), 'utf8'), ctx, { filename: 'demo-veri.js' });
}
const ISG = dom.window.ISG;

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
      } else if ((karakter === ';' || karakter === ',') && !tirnak) {
        hucreler.push(mevcut); mevcut = '';
      } else { mevcut += karakter; }
    }
    hucreler.push(mevcut);
    return hucreler;
  });
}

/* Çok sayfalı iş kitabında faaliyet listesini içeren sayfayı seçer. */
function sayfaSec(sayfalar, secenekler) {
  let enIyi = null;
  (sayfalar || []).forEach((sayfa) => {
    const analiz = ISG.planToplu.analizEt(sayfa.satirlar || [], secenekler);
    const puan = analiz.ozet.hazir + analiz.ozet.mukerrer - (analiz.hata ? 5000 : 0);
    if (!enIyi || puan > enIyi.puan) {
      enIyi = { sayfaAdi: sayfa.ad || 'Sayfa', puan: puan, analiz: analiz, satirlar: sayfa.satirlar || [] };
    }
  });
  return enIyi;
}

function haritaMetni(harita) {
  if (!harita) { return 'çıkarılamadı'; }
  const parcalar = ['sira=' + (harita.sira >= 0 ? harita.sira : '-'),
    'anaBaslik=' + (harita.anaBaslik >= 0 ? harita.anaBaslik : '-'),
    'faaliyet=' + (harita.faaliyet >= 0 ? harita.faaliyet : '-'),
    'sorumlu=' + (harita.sorumlu >= 0 ? harita.sorumlu : '-'),
    'aciklama=' + (harita.aciklama >= 0 ? harita.aciklama : '-')];
  parcalar.push('aylar=' + (harita.aylar.length ?
    harita.aylar[0] + '-' + harita.aylar[harita.aylar.length - 1] : '-'));
  return parcalar.join(', ');
}

function ayDagilimi(analiz) {
  const sayim = [];
  for (let a = 1; a <= 12; a += 1) { sayim[a] = 0; }
  ISG.planToplu.uygulanacaklar(analiz).forEach((kayit) => {
    (kayit.aylar || []).forEach((ay) => { sayim[ay] += 1; });
  });
  return sayim;
}

function ozetle(analiz, secim, yil) {
  const isyeriAdi = fixture ? ((ISG.isyeriBul(ISG.depo.al(), isyeriId) || {}).ad || isyeriId) : isyeriId;
  yaz('');
  yaz('YILLIK ÇALIŞMA PLANI AKTARIM RAPORU');
  yaz('Dosya              : ' + path.resolve(process.cwd(), hedefDosya));
  yaz('Okunan sayfa       : ' + secim.sayfaAdi);
  yaz('Tablo başlığı      : satır ' + analiz.baslikSatir);
  yaz('İş yeri            : ' + isyeriAdi + ' (' + isyeriId + ')');
  yaz('Plan yılı          : ' + (yil || 'belirtilmedi'));
  yaz('Sütun eşlemesi     : ' + haritaMetni(analiz.harita));
  yaz('');
  yaz('SAYIMLAR');
  yaz('  Dosya satırı         : ' + analiz.ozet.dosyaSatir);
  yaz('  Kaydedilecek faaliyet: ' + analiz.ozet.hazir);
  yaz('  Mükerrer (atlanacak) : ' + analiz.ozet.mukerrer);
  yaz('  Hatalı satır         : ' + analiz.ozet.hatali);
  yaz('  Örnek satır          : ' + analiz.ozet.ornek);
  yaz('  Boş satır            : ' + analiz.ozet.bos);
  yaz('  Ana başlık satırı    : ' + analiz.ozet.bolum);
  yaz('  Tablo/ay başlığı     : ' + analiz.ozet.baslik);
  yaz('  İmza/doküman satırı  : ' + analiz.ozet.imza);
  yaz('  Toplam ay işareti    : ' + analiz.ozet.ayIsaret);
  if (analiz.hata) { yaz('  GENEL HATA         : ' + analiz.hata); }

  if (analiz.bolumler.length) {
    yaz('');
    yaz('ANA BAŞLIKLAR (' + analiz.bolumler.length + ')');
    analiz.bolumler.forEach((bolum) => { yaz('  - ' + bolum); });
  }

  const dagilim = ayDagilimi(analiz);
  yaz('');
  yaz('AY DAĞILIMI (o ayda faaliyeti olan kayıt sayısı)');
  ISG.bicim.AYLAR.forEach((ad, i) => { yaz('  ' + ad + ': ' + dagilim[i + 1]); });

  const filtrele = (durum) => analiz.satirlar.filter((satir) => satir.durum === durum);
  const sik = (liste, limit) => {
    const sinir = limit || 25;
    if (!liste.length) { yaz('  (yok)'); return; }
    liste.slice(0, sinir).forEach((satir) => {
      yaz('  Satır ' + satir.satirNo + ' | ' + String(satir.faaliyet || '').slice(0, 62) +
        ((satir.nedenler || []).length ? ' -> ' + satir.nedenler.join(' / ') : ''));
    });
    if (liste.length > sinir) { yaz('  ... ve ' + (liste.length - sinir) + ' satır daha'); }
  };

  yaz('');
  yaz('MÜKERRER SATIRLAR (' + filtrele('mukerrer').length + ')');
  sik(filtrele('mukerrer'));
  yaz('');
  yaz('HATALI SATIRLAR (' + filtrele('hata').length + ')');
  sik(filtrele('hata'));
  yaz('');
  yaz('AY İŞARETİ OLMAYAN FAALİYETLER (' +
    analiz.satirlar.filter((s) => s.durum === 'hazir' && !(s.kayit.aylar || []).length).length + ')');
  yaz('UYARILAR');
  (analiz.uyarilar.length ? analiz.uyarilar : ['(yok)']).forEach((uyari) => yaz('  - ' + uyari));

  yaz('');
  yaz('FAALİYET ÖN İZLEME (ilk 15)');
  filtrele('hazir').slice(0, 15).forEach((satir) => {
    const kayit = satir.kayit;
    yaz('  ' + (kayit.siraExcel || '-') + ' | ' + (kayit.anaBaslik || '-') + ' | ' +
      String(kayit.faaliyet).slice(0, 52) + ' | aylar: ' + (kayit.aylar.length ? kayit.aylar.join(',') : 'aysız'));
  });
}

function isYeriSayilari(veri) {
  const sayim = {};
  (veri.isyerleri || []).forEach((isyeri) => { sayim[isyeri.id] = 0; });
  (veri.planlar || []).forEach((plan) => { sayim[plan.isyeriId] = (sayim[plan.isyeriId] || 0) + 1; });
  return sayim;
}

function yazaDenemesi(analiz, secim, secenekler, yil) {
  const oncekiSayim = isYeriSayilari(ISG.depo.al());
  const once = ISG.depo.al().planlar.length;
  const sonuc = ISG.planToplu.uygula(analiz, secenekler);
  const sonrakiVeri = ISG.depo.al();
  const sonrakiSayim = isYeriSayilari(sonrakiVeri);
  yaz('');
  yaz('YAZMA DENEMESİ (örnek veritabanı üzerinde)');
  yaz('  Eklenen            : ' + sonuc.eklenen);
  yaz('  Toplam plan kaydı  : ' + once + ' -> ' + sonrakiVeri.planlar.length);
  yaz('  İş yeri bazında    :');
  (sonrakiVeri.isyerleri || []).forEach((isyeri) => {
    const fark = (sonrakiSayim[isyeri.id] || 0) - (oncekiSayim[isyeri.id] || 0);
    yaz('    ' + isyeri.ad + ': ' + (oncekiSayim[isyeri.id] || 0) + ' -> ' + (sonrakiSayim[isyeri.id] || 0) +
      (fark ? '  (+' + fark + ') ' + (isyeri.id === isyeriId ? 'HEDEF' : 'DIŞINDA - İHLAL!') : ''));
  });
  const planlar = sonrakiVeri.planlar.filter((p) => p.isyeriId === isyeriId && Number(p.yil) === Number(yil));
  const isaretToplam = planlar.reduce((toplam, p) => toplam + ((p.aylar || []).length), 0);
  yaz('  Hedef işyeri / yıl : ' + planlar.length + ' kayıt, ' + isaretToplam + ' ay işareti');
  const ornekKayit = planlar.filter((p) => (p.aylar || []).length > 1)[0];
  if (ornekKayit) {
    yaz('  Örnek kayıt        : ' + ornekKayit.faaliyet + ' | ' + ornekKayit.sorumlu +
      ' | aylar ' + ornekKayit.aylar.join(',') + ' | ana başlık: ' + ornekKayit.anaBaslik);
  }
  const ikinci = ISG.planToplu.uygula(
    ISG.planToplu.analizEt(secim.satirlar, {
      isyeriId: isyeriId,
      yil: yil,
      mevcut: ISG.depo.al().planlar.filter((p) => p.isyeriId === isyeriId)
    }),
    { isyeriId: isyeriId, yil: yil });
  yaz('  İkinci yükleme     : ' + ikinci.eklenen + ' kayıt eklendi (0 beklenir), toplam ' +
    ISG.depo.al().planlar.length + ' plan kaydı');
}

(async function main() {
  const tamYol = path.resolve(process.cwd(), hedefDosya);
  if (!fs.existsSync(tamYol)) {
    yaz('DOSYA BULUNAMADI: ' + tamYol);
    bitir();
    process.exit(1);
    return;
  }

  let sayfalar;
  if (/\.csv$/i.test(tamYol)) {
    sayfalar = [{ ad: 'CSV', satirlar: csvSatirlari(fs.readFileSync(tamYol, 'utf8')) }];
  } else {
    sayfalar = await ISG.excel.xlsxOku(baytlariOku(tamYol));
  }

  let mevcut = [];
  if (fixture) {
    ISG.depo.iceAktar(JSON.stringify(ISG.ORNEK_VERI()));
    mevcut = ISG.depo.al().planlar.filter((plan) => plan.isyeriId === isyeriId);
  }

  const secenekler = { isyeriId: isyeriId, yil: yilIstek, mevcut: mevcut };
  const secim = sayfaSec(sayfalar, secenekler);
  if (!secim) {
    yaz('Hiçbir sayfada okunabilir çalışma planı tablosu bulunamadı.');
    bitir();
    process.exit(1);
    return;
  }
  const analiz = secim.analiz;
  const yil = analiz.yil || yilIstek;
  ozetle(analiz, secim, yil);

  if (jsonCikti) {
    const kayitlar = ISG.planToplu.uygulanacaklar(analiz).map((kayit) => {
      const kopya = {};
      Object.keys(kayit).forEach((anahtar) => { kopya[anahtar] = kayit[anahtar]; });
      kopya.isyeriId = isyeriId;
      kopya.yil = yil;
      return kopya;
    });
    const yol = path.resolve(process.cwd(), String(jsonCikti));
    fs.writeFileSync(yol, JSON.stringify({ isyeriId: isyeriId, yil: yil, kayitlar: kayitlar }, null, 2), 'utf8');
    yaz('');
    yaz('JSON ÇIKTI (' + kayitlar.length + ' kayıt): ' + yol);
  }

  if (fixture) { yazaDenemesi(analiz, secim, secenekler, yil); }
  bitir();
})().catch((hata) => {
  const metin = String((hata && hata.stack) || hata);
  console.log('HATA: ' + metin);
  if (raporCikti) {
    fs.writeFileSync(path.resolve(process.cwd(), String(raporCikti)),
      raporSatirlari.join('\n') + '\nHATA: ' + metin + '\n', 'utf8');
  }
  process.exit(1);
});

