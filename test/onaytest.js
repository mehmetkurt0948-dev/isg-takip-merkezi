/* ISG Takip Merkezi - Onay kuyrugu entegrasyon testi.
   Akis: yetkili kayit degistirir -> talep olusur -> yonetici onaylar -> kayit
   gercekten degisti mi. Uretimin kendi modulleri jsdom icinde yuklenir; kod
   test icin degistirilmez.
   Calistirma: node test/onaytest.js */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const KOK = path.join(__dirname, '..');
process.on('uncaughtException', (hata) => {
  console.error('BEKLENMEDIK HATA: ' + ((hata && hata.stack) || hata));
  process.exit(1);
});
const dosyaOku = (goreli) => fs.readFileSync(path.join(KOK, goreli), 'utf8');
function ok(kosul, ad) {
  console.log((kosul ? 'PASS' : 'FAIL') + ': ' + ad);
  if (!kosul) { process.exitCode = 1; }
  return !!kosul;
}

const indexMetni = dosyaOku('index.html');
const ISG_SCRIPTLER = [];
indexMetni.replace(/<script[^>]+src="(assets\/js\/[^"?]+)/g, function (_eslesme, yol) {
  ISG_SCRIPTLER.push(yol);
  return _eslesme;
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
ISG_SCRIPTLER.forEach((yol) => pencere.eval(dosyaOku(yol)));

const ISG = pencere.ISG;
const D = ISG.depo;

/* ---------- Tohum veri ---------- */
function tohum() {
  const veri = ISG.BOS_VERI();
  veri.anaHat = 'onay-testi';
  veri.ayarlar.kurum = 'Test Kurumu';
  veri.isyerleri = [{
    id: 'isyeri-A', ad: 'Askı - 1', kisaAd: 'Askı - 1', kod: 'A',
    aktivite: 'Üretim', tehlikeSinifi: 'Tehlikeli', calisan: 10,
    adres: '', telefon: '', 'e-posta': '', aktiv: true
  }];
  const yonetici = ISG.YONETICI_HESAP()[0];
  veri.kullanicilar = ISG.YONETICI_HESAP().concat([{
    id: 'u-yetkili', adSoyad: 'Yetkili Kişi', eposta: 'yetkili@test.local',
    sifre: '1402', rol: 'yetkili', gorev: 'İSG Uzmanı',
    isyerleri: ['isyeri-A'], aktif: true, sonGiris: ''
  }]);
  veri.planlar = [{
    id: 'pl-test-1', isyeriId: 'isyeri-A', tanim: 'Kulaklık dağıtımı',
    odak: 'İSG', kategori: 'Kişisel koruyucu', anaBaslik: 'İSG Faaliyetleri',
    yil: 2026, ay: 11, aylar: [11], baslangicTarihi: '2026-11-01',
    takipTarihi: '2026-11-20', durum: 'yapilacak', tamamlanmaTarihi: null,
    sorumlu: '', sira: 1, aciklama: ''
  }];
  veri.personel = [{
    id: 'p-test-1', isyeriId: 'isyeri-A', adSoyad: 'Ali Veli', tcKimlik: '',
    pozisyon: 'Operatör', gorev: '', isyeri: 'Üretim', girisTarihi: '2024-01-01',
    aktif: true
  }];
  veri.tespitler = [{
    id: 'tp-test-1', isyeriId: 'isyeri-A', baslik: 'Kaygan zemin',
    aciklama: '', durum: 'acik', termin: '2026-11-30',
    tespitTarihi: '2026-11-01', sorumlu: '', kapanisTarihi: ''
  }];
  veri.dosyalar = [{
    id: 'ds-test-1', isyeriId: 'isyeri-A', bolum: 'Üretim', kod: 'X',
    dosyaAdi: 'Ölçüm raporu', durum: 'incelenmedi', vade: '2026-12-31',
    aciklama: ''
  }];
  veri.talepler = [];
  veri.denetim = [];
  return veri;
}

const yonetici = ISG.YONETICI_HESAP()[0];

/* Aday eylemler: [ad, argumanlar, beklenen durum] */
const SENARYOLAR = [
  ['planDurumDegistir', ['pl-test-1', 'tamamlandi'], (v) => v.planlar[0].durum === 'tamamlandi'],
  ['personelKaydet', [{ id: 'p-test-1', isyeriId: 'isyeri-A', adSoyad: 'Ali Veli', aktif: true }], (v) => v.personel[0].aktif === true],
  ['tespitDurumDegistir', ['tp-test-1', 'dogrulama'], (v) => v.tespitler[0].durum === 'dogrulama'],
  ['planSil', ['pl-test-1'], (v) => v.planlar.length === 0],
  ['riskEkipUyeEkle', ['isyeri-A', 'isgUzman', 'Ayşe Yılmaz', '', ''], (v) => !!v.riskEkipleri[0]]
];

/* Her senaryo temiz veride, kendi yetkili oturumuyla koşulur.
   `arada` verilirse talep olustuktan SONRA (yonetici oturumunda) calisir; bulut
   gidip gelme / baska bir kullanicinin yazmasi gibi ara durumlar boyle kurulur. */
let toplam = 0, basarisiz = 0;
function senaryo(ad, args, dogrula, arada, beklenenHata, beklenenUyari) {
  toplam += 1;
  D.geriYukle(tohum());
  const yetkili = D.kullaniciBul('u-yetkili');
  ISG.yetki.oturumAc(yetkili);
  let talep = null;
  try {
    const sonuc = D[ad].apply(D, args);
    talep = sonuc && sonuc.talep ? sonuc.talep : (D.al().talepler || [])[0] || null;
  } catch (hata) {
    console.log('  > ' + ad + ' talep olustururken hata: ' + hata.message);
  }
  if (!ok(!!talep, ad + ': yetkili degisikligi talebe donustu')) { basarisiz += 1; return; }

  /* Yonetici talebi onaylar. */
  ISG.yetki.oturumAc(yonetici);
  if (arada) { arada(D.al()); }
  let hataMesaji = '';
  try {
    ISG.yetki.talepOnayla(talep.id, 'Onaylandı');
  } catch (hata) {
    hataMesaji = hata.message;
  }
  if (beklenenHata) {
    if (!ok(hataMesaji.indexOf(beklenenHata) >= 0,
      ad + ': onay su gerekceyle engellendi' + (hataMesaji ? ' | ' + hataMesaji : ' | hata yok'))) { basarisiz += 1; }
    return;
  }
  if (beklenenUyari) {
    /* Cakisma sozlesmesi: kayit talepten sonra gercekten degistiyse onay
       ENGELLENMEZ, istek uygulanir; uyari karar notuna ve denetim kaydina islenir.
       Eylem alan bazli oldugu icin digerin yazdigi alan kayda dokunmaz. */
    if (!ok(!hataMesaji, ad + ': cakismada onay engellenmedi' + (hataMesaji ? ' | HATA: ' + hataMesaji : ''))) { basarisiz += 1; }
    const sonTalep = D.talepBul(talep.id);
    if (!ok(sonTalep && sonTalep.durum === 'onaylandi', ad + ': cakisan talep uyarisiyla kapatildi')) { basarisiz += 1; }
    if (!ok(sonTalep && String(sonTalep.kararNotu || '').indexOf(beklenenUyari) >= 0,
      ad + ': uyari karar notuna islendi')) { basarisiz += 1; }
    if (!ok((D.al().denetim || []).some(function (k) { return String(k.ozet || '').indexOf('UYARI:') >= 0; }),
      ad + ': uyari denetim kaydina islendi')) { basarisiz += 1; }
    if (!ok(dogrula(D.al()), ad + ': degisiklik kayda uygulandi')) { basarisiz += 1; }
    return;
  }
  if (!ok(!hataMesaji, ad + ': yonetici onayladi' + (hataMesaji ? ' | HATA: ' + hataMesaji : ''))) {
    basarisiz += 1;
  } else {
    const sonTalep = D.talepBul(talep.id);
    if (!ok(sonTalep && sonTalep.durum === 'onaylandi', ad + ': talep onaylandi durumuna gecti')) { basarisiz += 1; }
    if (!ok(dogrula(D.al()), ad + ': degisiklik kayda uygulandi')) { basarisiz += 1; }
  }
}

SENARYOLAR.forEach(([ad, args, dogrula]) => senaryo(ad, args, dogrula));

/* ---------- Isyeri duzeyindeki toplu eylemler ----------
   Bu eylemlerde args[0] Kayit degil ISYERI kimligidir. kayitBul() isi yeri
   kimligini kayit listelerinde aradigi icin bulamaz; surum denetimi
   "Kayit artik bulunmuyor" deyip Onayla dugmunu kilitliyordu. */
const TOPLU_SENARYOLAR = [
  ['planTopluEkle', ['isyeri-A', [{ faaliyet: 'Yillik tatbikat', yil: 2026, aylar: [3], durum: 'yapilacak' }]],
    (v) => v.planlar.length === 2],
  ['personelTopluEkle', ['isyeri-A', [{ adSoyad: 'Yeni Isci', aktif: true }]],
    (v) => v.personel.length === 2],
  ['dosyaDurumToplu', ['isyeri-A', 'var'],
    (v) => v.dosyalar[0].durum === 'var'],
  ['personelTemizle', ['isyeri-A'],
    (v) => v.personel.length === 0]
];
TOPLU_SENARYOLAR.forEach(([ad, args, dogrula]) => senaryo(ad, args, dogrula));

/* ---------- Surum denetimi: anlam karsilastirmasi ---------- */
/* Kayit buluta gidip geldi: sunucu jsonb anahtarlari yeniden siralar, kaydet()
   her yazimda guncelleme damgasini tazeler. Kayit anlam olarak ayniysa onay
   ENGELLENMEMELI; aksi hâlde talep hicbir cihazda onaylanamaz olur. */
senaryo('planDurumDegistir', ['pl-test-1', 'tamamlandi'],
  (v) => v.planlar[0].durum === 'tamamlandi',
  (veri) => {
    const eski = veri.planlar[0];
    const yenilenmis = {};
    Object.keys(eski).reverse().forEach((alan) => { yenilenmis[alan] = eski[alan]; });
    yenilenmis.guncelleme = new Date(Date.now() + 60000).toISOString();
    veri.planlar[0] = yenilenmis;
    D.kaydet();
  });

/* Kayit gercekten baska bir kullanici tarafindan degistirildiyse onay ARTIK
   ENGELLENMEZ (uyari-temelli sozlesme): yonetici neyi onayladigini ekranda gorur,
   istek her hâlükârda uygulanir; üzerine yazilan degisiklik ise iz birakir — uyari
   karar notuna ve denetim kaydina islenir. Eylem alan bazli oldugu icin digerin
   yazdigi alan (tanim) kayda dokunmaz, yalnizca talep edilen alan yazilir. */
senaryo('planDurumDegistir', ['pl-test-1', 'tamamlandi'],
  (v) => v.planlar[0].durum === 'tamamlandi' && v.planlar[0].tanim === 'Baska bir kullanici yazdi',
  (veri) => {
    veri.planlar[0].tanim = 'Baska bir kullanici yazdi';
    D.kaydet();
  },
  null, 'değişmiş');

console.log('\nSenaryo: ' + toplam + ' | basarisiz: ' + basarisiz);

/* Eşitleme yoklamasi (bulut.js setInterval) Node düğümünü açık tuttuğu için
   pencere kapatılır; aksi hâlde test sonuçları basılıp süreç sonlanmaz. */
if (ISG.bulut && typeof ISG.bulut.durdur === 'function') { ISG.bulut.durdur(); }
pencere.close();

if (basarisiz) { process.exitCode = 1; }
