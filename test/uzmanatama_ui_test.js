/* ISG Takip Merkezi — uzman gorevlendirmesi ve onay yetkilisi arayuz testi (A').
   Uretimin kendi sayfasi (index.html + assets/js/*.js) jsdom icinde calistirilir;
   test icin uretim kodu degistirilmez.

   Kapsanan davranislar:
   1) Isyeri diyalogu yalniz isyerinin KURUMUNDAKI aktif uzman (yetkili)
      hesaplarini listeler; kurum disi hesap listeye girmez.
   2) Isaretlenen uzmanlar `uzmanGorevlendirmeleri`, secilen hesap
      `onayYetkilisiId` olarak kayda yazilir.
   3) Diyalog yeniden acildiginda secimler korunur.
   4) Isareti kaldirilan uzman atamasi SILINMEZ, `aktif: false` olur.
   5) Kurum alani degisince liste tazelenir (kurum disi hesap gorunmez).
   6) Depo katmani kurum disi atamayi ve kurum disi onay yetkilisini yazmaz;
      alan hic gonderilmezse mevcut atama silinmez.
   7) Kartta onay durumu satiri, sayfada onay uyarisi karti; kaydetme sonrasi
      onay uyarisi bildirimi cikar.
   8) Gorevlendirme uzmanin VERI ERISIMINI degistirmez (rol/kapsam ayni kalir).
   Calistirma: node test/uzmanatama_ui_test.js */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const KOK = path.join(__dirname, '..');
process.on('uncaughtException', (hata) => {
  console.error('BEKLENMEDIK HATA: ' + ((hata && hata.stack) || hata));
  process.exit(1);
});
const dosyaOku = (goreli) => fs.readFileSync(path.join(KOK, goreli), 'utf8');
let toplam = 0, basarisiz = 0;
function ok(kosul, ad) {
  toplam += 1;
  console.log((kosul ? 'PASS' : 'FAIL') + ': ' + ad);
  if (!kosul) { basarisiz += 1; process.exitCode = 1; }
  return !!kosul;
}

/* 1) Uretim sayfasi hangi sirada yukluyorsa test de ayni sirayla yukler. */
const indexMetni = dosyaOku('index.html');
const ISG_SCRIPTLER = [];
indexMetni.replace(/<script[^>]+src="(assets\/js\/[^"?]+)/g, function (eslesme, yol) {
  ISG_SCRIPTLER.push(yol);
  return eslesme;
});
if (ISG_SCRIPTLER.length < 10) {
  console.error('FAIL: index.html icinde asset script listesi bulunamadi');
  process.exit(1);
}
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
pencere.alert = () => {};
pencere.confirm = () => true;
ISG_SCRIPTLER.forEach((yol) => pencere.eval(dosyaOku(yol)));

const ISG = pencere.ISG;
const belge = pencere.document;
const D = ISG.depo;
const Y = ISG.yetki;

/* 2) Tohum veri: iki kurum, iki isyeri, uc uzman (biri diger kurumdan). */
const yonetici = ISG.YONETICI_HESAP()[0];
yonetici.tumIsyerleri = true;
yonetici.eposta = 'yonetici@test.local';
yonetici.sifre = '1402';

function hesap(id, adSoyad, uzmanSinifi, kurumId, isyerleri) {
  return {
    id: id, adSoyad: adSoyad, eposta: id + '@test.local', sifre: '1402',
    rol: 'yetkili', gorev: 'İSG Uzmanı', uzmanSinifi: uzmanSinifi,
    kurumId: kurumId, isyerleri: isyerleri, aktif: true, sonGiris: ''
  };
}
const uzmanA1 = hesap('u-uzman-a1', 'Uzman A1', 'A', 'k-a', ['isyeri-A']);
const uzmanA2 = hesap('u-uzman-a2', 'Uzman A2', 'B', 'k-a', ['isyeri-A']);
const uzmanB1 = hesap('u-uzman-b1', 'Uzman B1', 'B', 'k-b', ['isyeri-B']);

function tohum() {
  const veri = ISG.BOS_VERI();
  veri.ayarlar.kurum = 'Kurum A';
  veri.kurumlar = [{ id: 'k-a', ad: 'Kurum A' }, { id: 'k-b', ad: 'Kurum B' }];
  veri.isyerleri = [
    {
      id: 'isyeri-A', ad: 'Askı - 1', kurumId: 'k-a', tehlikeSinifi: 'tehlikeli',
      calisanSayisi: 10, ana: true, adres: '', yetkili: '', sektor: ''
    },
    {
      id: 'isyeri-B', ad: 'Askı - 2', kurumId: 'k-b', tehlikeSinifi: 'cokTehlikeli',
      calisanSayisi: 4, ana: false, adres: '', yetkili: '', sektor: ''
    }
  ];
  veri.kullanicilar = [yonetici, uzmanA1, uzmanA2, uzmanB1];
  veri.planlar = [];
  veri.personel = [];
  veri.denetim = [];
  return veri;
}

/* 3) Arayuz yardimcilari. */
function girisYap(kullanici, sayfa) {
  if (Y.oturum()) { Y.oturumKapat(); }
  pencere.location.hash = '#' + sayfa;
  Y.oturumAc(kullanici);
  ISG.uygulama.girisSonrasi();
}
function isyeriKaydi(id) {
  return (D.al().isyerleri || []).filter((isyeri) => isyeri.id === id)[0] || null;
}
function diyalogAcik() {
  const diyalog = belge.getElementById('isyeriDiyalog');
  return !!diyalog && (diyalog.open || diyalog.getAttribute('open') === 'open');
}
/* Isyerleri sayfasini acar ve isyerinin duzenleme diyalogunu acar. */
/* Uyari kartinda da "Duzenle" dugmesi vardir; test once isyeri kartindakini arar. */
function duzenleDugmesi(id) {
  return belge.querySelector('article.isyeri-kart [data-islem="isyeri-duzenle"][data-id="' + id + '"]') ||
    belge.querySelector('[data-islem="isyeri-duzenle"][data-id="' + id + '"]');
}
function duzenleAc(id) {
  girisYap(yonetici, 'isyerleri');
  const dugme = duzenleDugmesi(id);
  if (!ok(!!dugme, 'isyeri duzenleme dugmesi listede: ' + id)) { return false; }
  dugme.click();
  return ok(diyalogAcik(), 'isyeri diyalogu acildi: ' + id);
}
function uzmanKutulari() {
  return Array.prototype.slice.call(
    belge.querySelectorAll('#isyeriUzmanListesi .isyeri-uzman')
  ).map((kutu) => ({ id: kutu.value, secili: kutu.checked }));
}
function kutuSec(id, durum) {
  const kutu = belge.querySelector('#isyeriUzmanListesi .isyeri-uzman[value="' + id + '"]');
  if (!kutu) { return false; }
  kutu.checked = durum;
  return true;
}
function yetkiliSecenegi() { return belge.getElementById('isyeriOnayYetkilisi'); }
function yetkiliSec(id) {
  const secim = yetkiliSecenegi();
  if (!secim) { return false; }
  secim.value = id;
  return secim.value === id;
}
function formuGonder() {
  const kap = belge.getElementById('bildirimler');
  if (kap) { kap.innerHTML = ''; }
  belge.getElementById('isyeriForm').dispatchEvent(
    new pencere.Event('submit', { bubbles: true, cancelable: true })
  );
  return Array.prototype.slice.call(belge.querySelectorAll('#bildirimler .bildirim'))
    .map((kutu) => (kutu.textContent || '').replace(/\s+/g, ' ').trim()).join(' | ');
}
function kurumSec(kurumId) {
  const secim = belge.getElementById('isyeriKurum');
  if (!secim) { return false; }
  secim.value = kurumId;
  secim.dispatchEvent(new pencere.Event('change', { bubbles: true }));
  return secim.value === kurumId;
}

/* ---------- 1) Liste kurumla sinirli ------------------------------------- */
D.geriYukle(tohum());
if (ok(duzenleAc('isyeri-A'), 'isyeri A duzenleme akisi basladi')) {
  const kutular = uzmanKutulari();
  const idler = kutular.map((k) => k.id).sort();
  ok(kutular.length === 2, 'kurum A listesinde iki uzman var: ' + kutular.length);
  ok(idler.indexOf('u-uzman-a1') >= 0 && idler.indexOf('u-uzman-a2') >= 0,
    'kurum A uzmanlari listelendi: ' + idler.join(', '));
  ok(idler.indexOf('u-uzman-b1') < 0, 'kurum B uzmani kurum A listesinde gorunmuyor');
  ok(kutular.every((k) => !k.secili), 'kayitli atama yokken kutular bos');
  const secenekler = Array.prototype.slice.call(yetkiliSecenegi().options).map((o) => o.value);
  ok(secenekler[0] === '', 'ilk secenek otomatik onay (gorevlendirilmis uzmanlar)');
  ok(secenekler.length === 3, 'onay yetkilisi listesi 2 uzman + otomatik: ' + secenekler.length);
}

/* ---------- 2) Gorevlendirme + onay yetkilisi kaydi ---------------------- */
if (ok(kutuSec('u-uzman-a1', true) && kutuSec('u-uzman-a2', true),
  'iki uzman isaretlendi')) {
  ok(yetkiliSec('u-uzman-a1'), 'onay yetkilisi olarak Uzman A1 secildi');
  const bildirim = formuGonder();
  ok(!diyalogAcik(), 'kaydetme sonrasi diyalog kapandi');
  const kayit = isyeriKaydi('isyeri-A');
  const atamalar = (kayit && kayit.uzmanGorevlendirmeleri) || [];
  ok(atamalar.length === 2, 'iki gorevlendirme kayda yazildi: ' + atamalar.length);
  ok(atamalar.every((atama) => atama.aktif !== false), 'atamalar aktif isaretli');
  ok(String(kayit.onayYetkilisiId) === 'u-uzman-a1',
    'onay yetkilisi kayda yazildi: ' + kayit.onayYetkilisiId);
  ok(bildirim.toLocaleLowerCase('tr-TR').indexOf('kaydedildi') >= 0,
    'kaydetme bildirimi gosterildi: ' + bildirim.slice(0, 120));
  ok(bildirim.toLocaleLowerCase('tr-TR').indexOf('onay uyarısı') < 0,
    'uyari yokken onay uyarisi bildirilmedi');
  ok(!(Y.onayDurumu('isyeri-A').uyarilar || []).length,
    'iki uygun uzman varken onay uyarisi yok');
}

/* ---------- 3) Yeniden acilista secim korunur ---------------------------- */
if (ok(duzenleAc('isyeri-A'), 'isyeri A yeniden acildi')) {
  const kutular = uzmanKutulari();
  ok(kutular.filter((k) => k.secili).length === 2, 'iki atama yeniden isaretli');
  ok(String(yetkiliSecenegi().value) === 'u-uzman-a1',
    'onay yetkilisi secimi korundu: ' + yetkiliSecenegi().value);
}

/* ---------- 4) Isaret kaldirma atamayi silmez --------------------------- */
if (ok(kutuSec('u-uzman-a2', false), 'Uzman A2 isareti kaldirildi')) {
  formuGonder();
  const kayit = isyeriKaydi('isyeri-A');
  const atamalar = kayit.uzmanGorevlendirmeleri || [];
  const a2 = atamalar.filter((atama) => atama.kullaniciId === 'u-uzman-a2')[0];
  const a1 = atamalar.filter((atama) => atama.kullaniciId === 'u-uzman-a1')[0];
  ok(atamalar.length === 2, 'atama sayisi korundu (silinmedi): ' + atamalar.length);
  ok(!!a2 && a2.aktif === false, 'isareti kaldirilan atama pasife alindi');
  ok(!!a1 && a1.aktif !== false, 'isaretli atama aktif kaldi');
  const durum = Y.onayDurumu('isyeri-A');
  ok(durum.uzmanSayisi === 1, 'onay hesabi tek aktif uzmana dustu: ' + durum.uzmanSayisi);
  ok(durum.pasifAtama === 1, 'pasif atama sayildi: ' + durum.pasifAtama);
  ok(!(durum.uyarilar || []).some((uyari) => uyari.kod === 'atama-gecersiz'),
    'bilincli pasife alma uyari uretmedi');
  ok(durum.mod === 'tekUzman', 'tek uzman onay modu: ' + durum.mod);
}

/* ---------- 5) Kurum degisimi listeyi tazeler --------------------------- */
if (ok(duzenleAc('isyeri-B'), 'isyeri B duzenleme akisi basladi')) {
  const onceki = uzmanKutulari().map((k) => k.id);
  ok(onceki.length === 1 && onceki[0] === 'u-uzman-b1',
    'kurum B listesinde yalniz kurum B uzmani: ' + onceki.join(', '));
  /* Kurum alani degisirse liste o kurumun uzmanlarina gecer; isaretli kalmis
     kurum disi hesap olsa bile depo katmani yazmaz (bkz. bolum 6). */
  if (ok(kurumSec('k-a'), 'kurum alani kurum A olarak degistirildi')) {
    const sonraki = uzmanKutulari().map((k) => k.id).sort();
    ok(sonraki.length === 2 && sonraki.indexOf('u-uzman-b1') < 0,
      'liste yeni kurumun uzmanlarina tazelendi: ' + sonraki.join(', '));
    const secenekler = Array.prototype.slice.call(yetkiliSecenegi().options)
      .map((o) => o.value).filter((deger) => !!deger);
    ok(secenekler.indexOf('u-uzman-b1') < 0,
      'onay yetkilisi listesinde de kurum disi hesap yok: ' + secenekler.join(', '));
  }
}

/* ---------- 6) Kurum siniri: yetki kapisi + depo katmani ----------------- */
{
  /* 6a) Yetki kapisi: kurum disi gorevlendirme REDDEDILIR ve kayit degismez. */
  const onceki = JSON.stringify(isyeriKaydi('isyeri-A').uzmanGorevlendirmeleri || []);
  let ret = null;
  try {
    D.isyeriKaydet(Object.assign({}, isyeriKaydi('isyeri-A'), {
      uzmanGorevlendirmeleri: [
        { kullaniciId: 'u-uzman-a1', aktif: true },
        { kullaniciId: 'u-uzman-b1', aktif: true }
      ],
      onayYetkilisiId: 'u-uzman-b1'
    }));
  } catch (hata) { ret = hata; }
  ok(!!ret && /farklı bir kurumda/.test(ret.message || ''),
    'yetki kapisi kurum disi gorevlendirmeyi reddetti: ' + (ret && ret.message));
  ok(JSON.stringify(isyeriKaydi('isyeri-A').uzmanGorevlendirmeleri || []) === onceki,
    'reddedilen istek kayda dokunmadi');

  /* 6b) Depo katmani: iceri aktarma / bulut birlesimi gibi yetki kapisindan
     gecmeyen yazmalarda kurum disi atama dusurulur, silinmis hesap korunur. */
  const kapisiz = Y.korunmasiz('isyeriKaydet');
  const sonuc = kapisiz(Object.assign({}, isyeriKaydi('isyeri-A'), {
    uzmanGorevlendirmeleri: [
      { kullaniciId: 'u-uzman-a1', aktif: true },
      { kullaniciId: 'u-uzman-b1', aktif: true }
    ],
    onayYetkilisiId: 'u-uzman-b1'
  }));
  const atamalar = (sonuc && sonuc.uzmanGorevlendirmeleri) || [];
  ok(atamalar.length === 1 && atamalar[0].kullaniciId === 'u-uzman-a1',
    'depo kurum disi gorevlendirmeyi yazmadi: ' + atamalar.map((a) => a.kullaniciId).join(', '));
  ok(!sonuc.onayYetkilisiId, 'depo kurum disi onay yetkilisini temizledi: ' + sonuc.onayYetkilisiId);

  /* Taninmayan (silinmis) hesap atilmaz: kayit bozulmaz, uyari uretilir. */
  const silinmis = kapisiz(Object.assign({}, isyeriKaydi('isyeri-A'), {
    uzmanGorevlendirmeleri: [
      { kullaniciId: 'u-uzman-a1', aktif: true },
      { kullaniciId: 'u-yok', aktif: true }
    ],
    onayYetkilisiId: ''
  }));
  const kimlikler = (silinmis.uzmanGorevlendirmeleri || []).map((a) => a.kullaniciId);
  ok(kimlikler.indexOf('u-yok') >= 0, 'silinmis hesap atamasi korundu (gecersiz atama)');
  ok((Y.onayDurumu('isyeri-A').uyarilar || [])
    .some((uyari) => uyari.kod === 'atama-gecersiz'),
    'gecersiz atama onay uyarisina donustu');
  /* Gecersiz atama tasiyan isyeri normal yoldan da kaydedilebilir (kilitlenme yok). */
  let kilit = null;
  try {
    D.isyeriKaydet(Object.assign({}, isyeriKaydi('isyeri-A'), {
      uzmanGorevlendirmeleri: isyeriKaydi('isyeri-A').uzmanGorevlendirmeleri
    }));
  } catch (hata) { kilit = hata; }
  ok(!kilit, 'gecersiz atama isyerinin kaydedilmesini kilitlemiyor: ' + (kilit && kilit.message));

  /* Alani hic gondermeyen cagri mevcut atamayi silmez (ice aktarma / fikstur). */
  const oncekiSayi = (isyeriKaydi('isyeri-A').uzmanGorevlendirmeleri || []).length;
  const korunmus = D.isyeriKaydet({
    id: 'isyeri-A', ad: 'Askı - 1', kurumId: 'k-a', tehlikeSinifi: 'tehlikeli',
    calisanSayisi: 12, ana: true
  });
  const sonrakiSayi = (korunmus.uzmanGorevlendirmeleri || []).length;
  ok(sonrakiSayi === oncekiSayi,
    'alan gonderilmeyen kayitta atamalar korundu: ' + sonrakiSayi + '/' + oncekiSayi);
  ok(String(korunmus.onayYetkilisiId || '') === String(isyeriKaydi('isyeri-A').onayYetkilisiId || ''),
    'alan gonderilmeyen kayitta onay yetkilisi korundu: ' + korunmus.onayYetkilisiId);
  const yetkiliKorunmus = D.isyeriKaydet(Object.assign({}, isyeriKaydi('isyeri-A'), {
    uzmanGorevlendirmeleri: [{ kullaniciId: 'u-uzman-a1', aktif: true }],
    onayYetkilisiId: 'u-uzman-a1'
  }));
  ok(String(yetkiliKorunmus.onayYetkilisiId) === 'u-uzman-a1',
    'ayni kurumdaki onay yetkilisi korundu: ' + yetkiliKorunmus.onayYetkilisiId);
}

/* ---------- 7) Kart + onay uyarisi karti + bildirim --------------------- */
/* Kurum B isyeri cok tehlikeli (esik A), tek gorevlendirilmis uzman B sinifi:
   uyari uretilmeli, kart bunu gostermeli, kaydetme bildirimi uyaridan soz etmeli. */
if (ok(duzenleAc('isyeri-B'), 'isyeri B yeniden acildi')) {
  ok(kutuSec('u-uzman-b1', true), 'Uzman B1 isaretlendi');
  yetkiliSec('');
  const bildirim = formuGonder();
  ok(bildirim.toLocaleLowerCase('tr-TR').indexOf('onay uyarısı') >= 0,
    'kaydetme sonrasi onay uyarisi bildirildi: ' + bildirim.slice(0, 160));
  const durum = Y.onayDurumu('isyeri-B');
  ok(durum.mod === 'tekUzmanSinifEksik', 'sinif esigi eksik modu: ' + durum.mod);
  ok(durum.onaylayanIdler.length === 0, 'onay verebilecek hesap yok');
  ok((durum.uyarilar || []).some((uyari) => uyari.kod === 'sinif-eksik'),
    'sinif eksigi uyarisi uretildi');

  const kart = belge.querySelector('article.isyeri-kart [data-islem="isyeri-duzenle"][data-id="isyeri-B"]');
  const kartMetni = kart ? ((kart.closest('article') || kart.parentNode).textContent || '').replace(/\s+/g, ' ') : '';
  ok(kartMetni.indexOf('sınıf eşiği eksik') >= 0,
    'isyeri kartinda onay durumu satiri uyariyi gosteriyor: ' + kartMetni.slice(0, 160));

  const uyariKarti = belge.querySelector('.onay-uyari-karti');
  const uyariKartiMetni = uyariKarti ? (uyariKarti.textContent || '').replace(/\s+/g, ' ') : '';
  ok(!!uyariKarti, 'onay uyarisi karti sayfada var');
  ok(uyariKartiMetni.indexOf('Askı - 2') >= 0,
    'uyari karti uyarili isyerini listeliyor: ' + uyariKartiMetni.slice(0, 160));
}

/* ---------- 8) Gorevlendirme veri erisimini degistirmez ----------------- */
{
  const a2 = (D.al().kullanicilar || []).filter((k) => k.id === 'u-uzman-a2')[0];
  const b1 = (D.al().kullanicilar || []).filter((k) => k.id === 'u-uzman-b1')[0];
  ok(JSON.stringify(a2.isyerleri) === JSON.stringify(['isyeri-A']),
    'uzmanin isyeri kapsami degismedi: ' + JSON.stringify(a2.isyerleri));
  ok(a2.tumIsyerleri !== true, 'uzman sistem geneli yetki kazanmadi');
  ok(b1.tumIsyerleri !== true && (b1.isyerleri || []).indexOf('isyeri-A') < 0,
    'kurum B uzmani kurum A isyerine erisim kazanmadi');
  ok(Y.kullaniciErisim(b1).indexOf('isyeri-A') < 0,
    'gorevlendirme kapsam disi veriye erisim vermedi: ' + Y.kullaniciErisim(b1).join(', '));
  /* Gorevlendirilen uzman gorevini (ekleme/onay) kazanmaz: rol degismedi. */
  ok(Y.rolCoz(a2.rol) === 'yetkili', 'uzmanin rolu degismedi: ' + a2.rol);
}

/* ---------- 9) Bulut birlestirmesi gorevlendirmeleri tasir --------------- */
{
  const kopya = JSON.parse(JSON.stringify(D.al()));
  const birlesik = D.birlestir(kopya, JSON.parse(JSON.stringify(kopya)));
  const kayit = (birlesik.veri.isyerleri || []).filter((i) => i.id === 'isyeri-A')[0] || {};
  ok((kayit.uzmanGorevlendirmeleri || []).length ===
    (isyeriKaydi('isyeri-A').uzmanGorevlendirmeleri || []).length,
    'birlestirme gorevlendirmeleri korudu: ' +
      (kayit.uzmanGorevlendirmeleri || []).map((a) => a.kullaniciId).join(', '));
  ok(String(kayit.onayYetkilisiId || '') === String(isyeriKaydi('isyeri-A').onayYetkilisiId || ''),
    'birlestirme onay yetkilisini korudu: ' + kayit.onayYetkilisiId);
}

console.log('\nuzmanatama_ui_test: ' + (toplam - basarisiz) + '/' + toplam + ' gecti');
process.exit(basarisiz ? 1 : 0);
