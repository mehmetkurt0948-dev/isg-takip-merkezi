/* İSG Takip Merkezi — yetki modeli envanteri (SALT OKUNUR, dry-run)
   Kullanım:
     node tools/yetki-envanter.js                    # tanıtım (demo) verisi üzerinde
     node tools/yetki-envanter.js --yedek yedek.json # gerçek bir JSON yedeği üzerinde
     node tools/yetki-envanter.js --json             # raporu JSON olarak bas

   Ne yapar: verilen veri kümesini UYGULAMANIN KENDİ modülleriyle (jsdom içinde)
   yükler, işyeri başına aktif uzman sayısını, uzman sınıfı (A/B/C) durumunu ve
   tehlike sınıfına göre onay yetkilisinin bulunup bulunmadığını sayar.

   Ne yapmaz: hiçbir dosyaya yazmaz, buluta bağlanmaz, localStorage'a dokunmaz,
   kayıt oluşturmaz/değiştirmez. Yetki modeli açılmadan önce hangi işyerlerinin
   tek uzmanlı (doğrudan yazma) olacağını ve kaç işyerinde onay yetkilisinin
   eksik kalacağını görmek içindir. */
'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const kok = path.resolve(__dirname, '..');
const argumanlar = process.argv.slice(2);

function arguman(ad) {
  const i = argumanlar.indexOf(ad);
  return i >= 0 ? argumanlar[i + 1] : null;
}

const yedekYolu = arguman('--yedek');
const jsonCikti = argumanlar.includes('--json');

/* Araç Faz 2'den (yetki motoru) ÖNCE de çalışabilmelidir: onay eşiği tablosu
   burada yerel olarak taşınır. Yetki motoru yayınlandığında aynı tabloyu
   ISG.yetki.ONAY_ESIGI olarak sunar ve araç onu tercih eder. */
const VARSAYILAN_ESIK = {
  cokTehlikeli: ['A'],
  tehlikeli: ['A', 'B'],
  az: ['A', 'B', 'C']
};

const dosyaOku = (goreli) => fs.readFileSync(path.join(kok, goreli), 'utf8');

/* Uygulamanın kendi script sırası index.html'den okunur; test araçlarıyla aynı
   yükleme yöntemi kullanılır ki envanter üretim koduyla birebir hesaplansın. */
function sayfaKur() {
  const indexMetni = dosyaOku('index.html');
  const scriptler = [];
  indexMetni.replace(/<script[^>]+src="(assets\/js\/[^"?]+)/g, (eslesme, yol) => {
    scriptler.push(yol);
    return eslesme;
  });
  const pencere = new JSDOM(indexMetni, {
    url: 'https://localhost/', runScripts: 'outside-only', pretendToBeVisual: true
  }).window;
  pencere.matchMedia = pencere.matchMedia || ((sorgu) => ({
    matches: false, media: sorgu, onchange: null,
    addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {}, dispatchEvent() { return false; }
  }));
  pencere.scrollTo = () => {};
  pencere.HTMLElement.prototype.scrollIntoView = () => {};
  scriptler.forEach((yol) => pencere.eval(dosyaOku(yol)));
  return pencere;
}

/* Yedek dosyası: depo.iceAktar() ile okunan JSON yedeği ({veri:{...}}) ya da
   doğrudan veri nesnesi olabilir. İkisi de kabul edilir; veri uygulamanın
   veriTamamla() göçünden geçirilir. */
function veriHazirla(pencere) {
  if (yedekYolu) {
    const tam = path.resolve(process.cwd(), yedekYolu);
    if (!fs.existsSync(tam)) { throw new Error('Yedek dosyası bulunamadı: ' + tam); }
    const ham = JSON.parse(fs.readFileSync(tam, 'utf8'));
    const veri = ham && ham.veri ? ham.veri : ham;
    if (!veri || typeof veri !== 'object') { throw new Error('Yedek dosyası veri nesnesi içermiyor.'); }
    return { veri, kaynak: tam };
  }
  /* Demo (tanıtım) verisi: tools/demo-veri.js yalnızca test/geliştirme içindir. */
  pencere.eval(dosyaOku('tools/demo-veri.js'));
  if (typeof pencere.ISG.ORNEK_VERI !== 'function') {
    throw new Error('tools/demo-veri.js bir veri üreticisi yayınlamıyor (ISG.ORNEK_VERI).');
  }
  return { veri: pencere.ISG.ORNEK_VERI(), kaynak: 'tools/demo-veri.js (tanıtım verisi)' };
}

/* Aktif uzman sayılan kişiler: pasif hesap sayılmaz; rolü 'yetkili' (İSG uzmanı)
   ya da rol metni "uzman" içeren hesaplar uzman kabul edilir. Görüntüleyici ve
   yönetici onay yetkilisi sayılmaz. */
function uzmanMi(kullanici) {
  if (!kullanici || kullanici.aktif === false) { return false; }
  const rol = String(kullanici.rol || '').toLocaleLowerCase('tr-TR');
  return rol === 'yetkili' || rol.indexOf('uzman') >= 0;
}

function isyeriDurumu(ISG, isyeri, uzmanlar) {
  const kod = ISG.tehlikeSinifiKodu ? ISG.tehlikeSinifiKodu(isyeri.tehlikeSinifi) : '';
  const esik = (ISG.yetki && ISG.yetki.ONAY_ESIGI && ISG.yetki.ONAY_ESIGI[kod]) || VARSAYILAN_ESIK[kod] || [];
  const siniflar = uzmanlar.map((u) => u.uzmanSinifi || '').filter(Boolean);
  const uygun = siniflar.filter((sinif) => esik.indexOf(sinif) >= 0);
  let durum = 'uzman-yok';
  if (uzmanlar.length === 1) { durum = 'tekUzman'; }
  else if (uzmanlar.length > 1) { durum = uygun.length ? 'onayli' : 'yetkiliEksik'; }
  return { kod: kod || '(tanımsız)', esik, uygun, durum };
}

(function main() {
  const pencere = sayfaKur();
  const ISG = pencere.ISG;
  const D = ISG.depo;

  const { veri, kaynak } = veriHazirla(pencere);
  D.yukle(JSON.parse(JSON.stringify(veri)));

  const tam = D.al();
  const isyerleri = tam.isyerleri || [];
  const kullanicilar = tam.kullanicilar || [];
  const uzmanlar = kullanicilar.filter(uzmanMi);

  const satirlar = isyerleri.map((isyeri) => {
    const atanan = uzmanlar.filter((u) => u.tumIsyerleri === true ||
      (u.isyerleri || []).indexOf(isyeri.id) >= 0);
    /* Mükerrer atama ayıklanır: aynı kişi tek uzman sayılır. */
    const gorulen = {};
    const liste = [];
    atanan.forEach((u) => { if (!gorulen[u.id]) { gorulen[u.id] = 1; liste.push(u); } });
    const bilgi = isyeriDurumu(ISG, isyeri, liste);
    return {
      id: isyeri.id,
      ad: isyeri.ad || isyeri.kisaAd || isyeri.id,
      tehlikeSinifi: isyeri.tehlikeSinifi || '',
      kod: bilgi.kod,
      uzmanSayisi: liste.length,
      uzmanlar: liste.map((u) => (u.adSoyad || u.eposta || u.id) +
        (u.uzmanSinifi ? ' [' + u.uzmanSinifi + ']' : ' [sınıf yok]')),
      durum: bilgi.durum,
      esik: bilgi.esik
    };
  });

  const dagilim = {};
  satirlar.forEach((s) => { dagilim[s.kod] = (dagilim[s.kod] || 0) + 1; });
  const durumSayisi = {};
  satirlar.forEach((s) => { durumSayisi[s.durum] = (durumSayisi[s.durum] || 0) + 1; });

  const talepDurum = {};
  (tam.talepler || []).forEach((t) => { talepDurum[t.durum || '?'] = (talepDurum[t.durum || '?'] || 0) + 1; });

  /* Kullanıcı erişim denetimi (2.26.0 · rol ≠ kapsam). Her hesap için AÇIK
     işyeri atamaları, "tüm işyerleri" yetkisi ve bu sürümdeki erişim sonucu
     yazılır. Şifre, TC kimlik no ve sağlık verisi okunmaz/yazılmaz; yalnız
     kimlik, rol, kurum, atama listesi ve durum raporlanır. */
  function erisimOzeti(kullanici) {
    const tanim = ISG.yetki.rolTanimi(kullanici.rol);
    const acik = kullanici.tumIsyerleri === true;
    const atamalar = (kullanici.isyerleri || []).filter(Boolean);
    let erisim;
    if (ISG.yetki.tumunuGorur({
      kullaniciId: kullanici.id, rol: kullanici.rol,
      isyerleri: atamalar, tumIsyerleri: acik
    })) {
      erisim = 'tüm işyerleri';
    } else if (tanim.kurumKapsami) {
      erisim = kullanici.kurumId ? 'kendi kurumu' : 'ERİŞİM YOK (kurum yok)';
    } else {
      erisim = atamalar.length ? atamalar.length + ' işyeri' : 'ERİŞİM YOK (atama yok)';
    }
    return {
      id: kullanici.id,
      ad: kullanici.adSoyad || '',
      rol: tanim.id,
      kurum: kullanici.kurumId || '',
      isyerleri: atamalar,
      tumIsyerleri: acik,
      aktif: kullanici.aktif !== false,
      erisim
    };
  }

  const erisimSatirlari = kullanicilar.map(erisimOzeti);

  const rapor = {
    kaynak,
    kurum: (tam.ayarlar || {}).kurum || '',
    kurumKaydi: Array.isArray(tam.kurumlar) ? tam.kurumlar.length : 0,
    isyeriSayisi: isyerleri.length,
    kullaniciSayisi: kullanicilar.length,
    aktifUzmanSayisi: uzmanlar.length,
    uzmanSinifiBosKullanici: uzmanlar.filter((u) => !u.uzmanSinifi).length,
    tehlikeDagilimi: dagilim,
    onayDurumuDagilimi: durumSayisi,
    talepDurumu: talepDurum,
    atamasizHesapSayisi: erisimSatirlari.filter((u) => u.erisim.indexOf('ERİŞİM YOK') === 0).length,
    kullanicilar: erisimSatirlari,
    isyerleri: satirlar
  };

  if (jsonCikti) {
    console.log(JSON.stringify(rapor, null, 2));
  } else {
    const cizgi = '─'.repeat(66);
    console.log('YETKİ MODELİ ENVANTERİ (salt okunur)');
    console.log(cizgi);
    console.log('Kaynak            : ' + rapor.kaynak);
    console.log('Kurum (ayarlar)   : ' + (rapor.kurum || '(boş)'));
    console.log('Kurum kaydı       : ' + rapor.kurumKaydi +
      (rapor.kurumKaydi ? '' : '  → göç gerekir (Faz 1)'));
    console.log('İşyeri / kullanıcı: ' + rapor.isyeriSayisi + ' / ' + rapor.kullaniciSayisi);
    console.log('Aktif uzman       : ' + rapor.aktifUzmanSayisi +
      ' · uzman sınıfı girilmemiş: ' + rapor.uzmanSinifiBosKullanici);
    console.log('Tehlike dağılımı  : ' + JSON.stringify(dagilim));
    console.log('Onay durumu       : ' + JSON.stringify(durumSayisi));
    console.log('Talep durumu      : ' + JSON.stringify(talepDurum));
    console.log(cizgi);
    satirlar.forEach((s) => {
      const isaret = s.durum === 'tekUzman' ? 'doğrudan yazma'
        : (s.durum === 'onayli' ? 'onaylı (' + s.esik.join('/') + ')'
          : (s.durum === 'yetkiliEksik' ? 'ONAY YETKİLİSİ EKSİK' : 'uzman atanmamış'));
      console.log('- ' + s.ad + '  [' + s.kod + ']  uzman: ' + s.uzmanSayisi + '  → ' + isaret);
      if (s.uzmanlar.length) { console.log('    ' + s.uzmanlar.join(' · ')); }
    });
    console.log(cizgi);
    console.log('Uyarı: "onayModeli=isyeri" açıldığında ' + (durumSayisi.tekUzman || 0) +
      ' işyeri tek uzmanlı sayılıp doğrudan yazma kazanacak.');
    console.log('Uyarı: ' + (durumSayisi.yetkiliEksik || 0) +
      ' işyerinde tehlike sınıfına uygun uzman sınıfı yok; talepler "yetki eksik" kalır.');
    console.log(cizgi);
    console.log('KULLANICI ERİŞİMİ (2.26.0 · rol ≠ kapsam)');
    erisimSatirlari.forEach((u) => {
      console.log('- ' + u.id + (u.ad ? ' [' + u.ad + ']' : '') + ' · ' + u.rol +
        (u.aktif ? '' : ' · PASİF') +
        (u.kurum ? ' · kurum: ' + u.kurum : '') + ' → ' + u.erisim +
        (u.tumIsyerleri ? '  (açık "tüm işyerleri" yetkisi)' : '') +
        (u.isyerleri.length ? '  [' + u.isyerleri.join(', ') + ']' : ''));
    });
    if (rapor.atamasizHesapSayisi) {
      console.log(cizgi);
      console.log('Uyarı: ' + rapor.atamasizHesapSayisi +
        ' hesabın işyeri ataması yok; bu hesaplar girişte "İşyeri atamanız bulunmuyor" uyarısı görür.');
      console.log('       Atama, Kullanıcılar ve yetkiler ekranından yapılır (otomatik atama yapılmaz).');
    }
  }

  if (ISG.bulut && typeof ISG.bulut.durdur === 'function') { ISG.bulut.durdur(); }
  pencere.close();
})();
