/* ISG Takip Merkezi - yetki kapsami ve saglik verisi izolasyonu testi.
   Uretimin kendi arayuzu (index.html + assets/js/*.js) jsdom icinde calistirilir;
   hicbir kod test icin degistirilmez. Sentetik veriyle su senaryolar denenir:
     1) OSGB Muduru saglik ekranini acar, kendi kurumunu gorur, yazamaz.
     2) Isyeri bazli yetkilendirilmis yonetici yalniz atandigi isyerini gorur.
     3) ASKI-1 / ASKI-2 gecisinde eski isyerinin kayitlari ekranda kalmaz.
     4) Kapsam disi dogrudan erisim (isyeri kimligi / kayit kimligi) reddedilir.
     5) Saglik goruntuleme izni ile yazma izni ayridir; izinsiz okuma denetlenir.
     6) Onay modeli, uzman sinifi esikleri ve tek uzman kurali bozulmaz.
     7) Yonetim yazma kapsami (2.27.0): yonetici yalniz atandigi isyerleri ve
        kurumu kapsaminda yazar; kendine "tum isyerleri" veremez; kurum acma,
        onay modeli ve sifirlama sistem geneli yetkiye baglidir.
     8) Beyan edilen kapsam ile fiili erisim ayni kaynaktan hesaplanir.
   Calistirma: node test/yetkikapsam.js */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const KOK = path.join(__dirname, '..');
process.on('uncaughtException', (hata) => {
  console.error('BEKLENMEDIK HATA: ' + ((hata && hata.stack) || hata));
  process.exit(1);
});
const dosyaOku = (goreli) => fs.readFileSync(path.join(KOK, goreli), 'utf8');
function ok(kosul, ad, deger) {
  console.log((kosul ? 'PASS' : 'FAIL') + ': ' + ad + (deger ? ' [' + deger + ']' : ''));
  if (!kosul) { process.exitCode = 1; }
  return !!kosul;
}
function hataMetni(fn) {
  try { fn(); } catch (hata) { return (hata && hata.message) || String(hata); }
  return '';
}

/* 1) Uretim sayfasi hangi sirada yukluyorsa test de ayni sirayla yukler. */
const indexMetni = dosyaOku('index.html');
const ISG_SCRIPTLER = [];
indexMetni.replace(/<script[^>]+src="(assets\/js\/[^"?]+)/g, (eslesme, yol) => {
  ISG_SCRIPTLER.push(yol);
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
pencere.alert = () => {};
pencere.confirm = () => true;
if (ISG_SCRIPTLER.length < 10) {
  console.error('FAIL: index.html script listesi bulunamadi');
  process.exit(1);
}
ISG_SCRIPTLER.forEach((yol) => pencere.eval(dosyaOku(yol)));

const ISG = pencere.ISG;
const belge = pencere.document;

/* 2) Sentetik veri: iki kurum, uc isyeri (ASKI-1, ASKI-2, diger kurum),
   bes kullanici. Gercek kisi/kurum adi kullanilmaz.

   `yonetici` kurulum hesabidir ve kapsamsiz gelir (2.26.0); bu fikstur ona
   "tum isyerleri" yetkisini ACIKCA verir. Atamasiz yonetici senaryolari icin
   asagidaki `atamasizYonetici` kullanilir. */
const yonetici = ISG.YONETICI_HESAP()[0];
yonetici.tumIsyerleri = true;
const kisitliYonetici = {
  id: 'u-yon', adSoyad: 'Yonetici Kisitli', eposta: 'yon@test.local', sifre: '1234',
  rol: 'yonetici', isyerleri: ['isyeri-1'], tumIsyerleri: false, aktif: true
};
const osgbMudur = {
  id: 'u-osgb', adSoyad: 'OSGB Muduru', eposta: 'osgb@test.local', sifre: '1234',
  rol: 'osgbMuduru', kurumId: 'kr-aski', isyerleri: [], aktif: true
};
const sistemYoneticisi = {
  id: 'u-sis', adSoyad: 'Sistem Yoneticisi', eposta: 'sistem@test.local', sifre: '1234',
  rol: 'sistemYoneticisi', kurumId: '', isyerleri: [], tumIsyerleri: false, aktif: true
};
const uzman = {
  id: 'u-uz', adSoyad: 'Uzman Kisi', eposta: 'uzman@test.local', sifre: '1234',
  rol: 'yetkili', isyerleri: ['isyeri-1'], uzmanSinifi: 'A', aktif: true
};
/* 2.26.0 senaryolari: atamasiz yonetici ve iki isyerine atanmis yonetici.
   Ikisi de sentetiktir; gercek hesap/veri kullanilmaz. */
const atamasizYonetici = {
  id: 'u-atamasiz', adSoyad: 'Atamasiz Yonetici', eposta: 'atamasiz@test.local', sifre: '1234',
  rol: 'yonetici', isyerleri: [], tumIsyerleri: false, aktif: true
};
const ikiIsyeriYoneticisi = {
  id: 'u-iki', adSoyad: 'Iki Isyeri Yoneticisi', eposta: 'iki@test.local', sifre: '1234',
  rol: 'yonetici', isyerleri: ['isyeri-1', 'isyeri-2'], tumIsyerleri: false, aktif: true
};

const baslangic = ISG.BOS_VERI();
baslangic.ayarlar.kurum = 'Test OSGB';
baslangic.kurumlar = [
  { id: 'kr-aski', ad: 'ASKI OSGB' },
  { id: 'kr-baska', ad: 'Baska OSGB' }
];
baslangic.isyerleri = [
  { id: 'isyeri-1', ad: 'ASKI - 1', kurumId: 'kr-aski', tehlikeSinifi: 'Az Tehlikeli' },
  { id: 'isyeri-2', ad: 'ASKI - 2', kurumId: 'kr-aski', tehlikeSinifi: 'Az Tehlikeli' },
  { id: 'isyeri-9', ad: 'Diger Kurum Isyeri', kurumId: 'kr-baska', tehlikeSinifi: 'Cok Tehlikeli' }
];
baslangic.personel = [
  { id: 'p1', sicil: 'S-1', adSoyad: 'Birinci Kisi', isyeriId: 'isyeri-1', gorev: 'Operator', aktif: true },
  { id: 'p2', sicil: 'S-2', adSoyad: 'Ikinci Kisi', isyeriId: 'isyeri-2', gorev: 'Depo', aktif: true },
  { id: 'p9', sicil: 'S-9', adSoyad: 'Dokuzuncu Kisi', isyeriId: 'isyeri-9', gorev: 'Bakim', aktif: true }
];
baslangic.kullanicilar = [yonetici, kisitliYonetici, osgbMudur, sistemYoneticisi, uzman,
  atamasizYonetici, ikiIsyeriYoneticisi];
baslangic.denetim = [];
ISG.depo.geriYukle(baslangic);

/* yardimcilar */
function girisYap(kullanici) {
  if (ISG.yetki.oturum()) { ISG.yetki.oturumKapat(); }
  pencere.location.hash = '#saglik';
  ISG.yetki.oturumAc(kullanici);
  ISG.uygulama.girisSonrasi();
}
const saglikSayfasi = () => belge.querySelector('.saglik-sayfa');
const sayfaMetni = () => (saglikSayfasi() ? saglikSayfasi().textContent : '');
function kayitSatirlari() {
  return Array.prototype.slice.call(belge.querySelectorAll('#saglik-kayit-tablo > tbody > tr'))
    .filter((t) => String(t.className).indexOf('saglik-detay') < 0 && !t.querySelector('.bos-durum'));
}
function kisiSatirlari() {
  return Array.prototype.slice.call(belge.querySelectorAll('#saglik-kisi-tablo > tbody > tr'))
    .filter((t) => !t.querySelector('.bos-durum'));
}
function kayitEkle(personelId, isyeriId, tarih) {
  return ISG.saglikTakip.kaydet({
    personelId: personelId, isyeriId: isyeriId, tarih: tarih,
    doktor: 'Dr. Test', sonMuayene: 'Elverisli', calismaSesi: 'saha'
  });
}

(async function main() {
  /* Uygulama kendi acilisini (DOMContentLoaded -> baslat) tamamlasin: aksi
     halde gec gelen ilk cizim ekran durumunu sifirlar. */
  await new Promise((c) => setTimeout(c, 80));

  /* 3) Yonetici (varsayilan hesap: atama yok) kayitlari olusturur. */
  girisYap(yonetici);
  kayitEkle('p1', 'isyeri-1', '2026-01-10');
  kayitEkle('p2', 'isyeri-2', '2026-01-11');
  kayitEkle('p9', 'isyeri-9', '2026-01-12');
  /* Eski/bozuk kayit: isyeri kimligi bos. Personelin isyerinden cozulur. */
  ISG.depo.saglikTakipKaydet({ id: 'sk-orphan-1', personelId: 'p1', tarih: '2025-12-01' });
  ISG.depo.saglikTakipKaydet({ id: 'sk-orphan-9', personelId: 'p9', tarih: '2025-12-02' });
  ok(ISG.saglikTakip.listele('', '').length === 5, 'yönetici bütün sağlık kayıtlarını görür');

  /* 4) Kapsam: yonetici rolu tek basina tum isyerlerine erisim VERMEZ. */
  girisYap(kisitliYonetici);
  ok(ISG.yetki.kapsam().length === 1 && ISG.yetki.kapsam()[0] === 'isyeri-1',
    'işyeri atanmış yönetici yalnız atandığı işyerini görür', ISG.yetki.kapsam().join(','));
  ok(ISG.yetki.tumunuGorur(ISG.yetki.oturum()) === false, 'yönetici rolü otomatik tüm işyerleri demek değil');
  ok(ISG.yetki.gorunum().isyerleri.length === 1, 'görünüm verisi de tek işyerine süzülüyor');
  ok(ISG.yetki.gorunum().personel.every((k) => k.isyeriId === 'isyeri-1'), 'personel listesi kapsam dışına çıkmıyor');
  const listeKisitli = ISG.saglikTakip.listele('', '');
  ok(listeKisitli.length === 2, 'kısıtlı yönetici 2 kayıt görür (isyeri-1 + kimliksiz eşleşen)', String(listeKisitli.length));
  ok(listeKisitli.every((k) => k.isyeriId === 'isyeri-1' || k.personelId === 'p1'),
    'kısıtlı yöneticiye başka işyerinin kaydı dönmüyor');
  const kapsamDisiHata = hataMetni(() => ISG.saglikTakip.listele('isyeri-2', ''));
  ok(/kapsamınızda değil/.test(kapsamDisiHata), 'kapsam dışı işyeri kimliğiyle liste istenemiyor', kapsamDisiHata);

  /* 5) Sistem Yoneticisi genel yonetim yetkisini korur. */
  girisYap(sistemYoneticisi);
  ok(ISG.yetki.kapsam().length === 3, 'Sistem Yöneticisi bütün işyerlerini görür', String(ISG.yetki.kapsam().length));
  ok(ISG.yetki.yazmaModu('isyeri-9') === 'dogrudan', 'Sistem Yöneticisi doğrudan yazar');
  ok(ISG.saglikTakip.listele('', '').length === 5, 'Sistem Yöneticisi bütün sağlık kayıtlarını okur');

  /* 6) OSGB Muduru: ekran acilir, goruntuleme izni ayri sorulur. */
  girisYap(osgbMudur);
  const menu = belge.querySelector('.menu-oge[data-sayfa="saglik"]');
  ok(!!menu && menu.hidden !== true, 'OSGB Müdürü Sağlık Takibi menüsünü görür');
  ok(!!saglikSayfasi(), 'OSGB Müdürü Sağlık Takibi ekranını açabilir');
  ok(sayfaMetni().indexOf('Yönetici onayı gerekli') > -1, 'onaysız OSGB Müdürüne veri yerine onay ekranı gösterilir');
  ok(kayitSatirlari().length === 0, 'onaysız OSGB Müdürü hiçbir sağlık satırı göremez');
  ok(ISG.yetki.kapsam().length === 2 && ISG.yetki.kapsam().indexOf('isyeri-9') < 0,
    'OSGB Müdürü yalnız kendi kurumunun işyerlerini kapsar', ISG.yetki.kapsam().join(','));
  ok(ISG.yetki.rolTanimi('osgbMuduru').yonetir === false, 'OSGB Müdürü yönetim yetkisi taşımaz');
  ok(ISG.yetki.yazmaModu('isyeri-1') === 'red', 'OSGB Müdürü yazma modunda reddedilir');
  const okumaHatasi = hataMetni(() => ISG.saglikTakip.listele('', ''));
  ok(/yönetici onayı/i.test(okumaHatasi), 'onaysız OSGB Müdürü sağlık verisi okuyamaz', okumaHatasi);
  const denetimVar = (ISG.depo.al().denetim || []).some((k) => k.tur === 'saglik-erisim' && k.kullaniciId === 'u-osgb');
  ok(denetimVar, 'yetkisiz sağlık erişim denemesi denetim izine yazıldı');
  const osgbYazmaHatasi = hataMetni(() => kayitEkle('p1', 'isyeri-1', '2026-02-01'));
  ok(ISG.depo.saglikTakipListe('', '').length === 5,
    'OSGB Müdürünün kayıt denemesi depoya yazmadı (erişim talebine dönüştü)', osgbYazmaHatasi || 'kayıt yok');
  const osgbSilmeHatasi = hataMetni(() => ISG.saglikTakip.sil('sk-orphan-1'));
  ok(/yalnızca yönetici/i.test(osgbSilmeHatasi), 'OSGB Müdürü sağlık kaydı silemez', osgbSilmeHatasi);
  ok(ISG.depo.saglikTakipBul('sk-orphan-1') !== null, 'reddedilen silme kaydı bozmadı');
  ok(ISG.yetki.saglikIzin('disaAktar') === false, 'OSGB Müdürü sağlık verisini dışa aktaramaz');
  ok(ISG.yetki.saglikIzin('duzenle') === false && ISG.yetki.saglikIzin('sil') === false,
    'görüntüleme izni yazma izni sayılmıyor');

  /* 7) Yanlis kurum: baska kurumun isyerine kurum muduru erisemez. */
  ok(ISG.yetki.kapsamda('isyeri-9') === false, 'başka kurumun işyeri kapsam dışı');

  /* 8) OSGB Muduru icin goruntuleme izni verilir (mevcut onay mekanizmasi). */
  const talep = ISG.saglikTakip.erisimTalepEt();
  girisYap(yonetici);
  ok(!!belge.querySelector('[data-islem="saglik-erisim-onay"]'), 'yönetici bekleyen erişim talebini görür');
  ISG.saglikTakip.erisimKarar(talep.id, true);

  girisYap(osgbMudur);
  const osgbListe = ISG.saglikTakip.listele('', '');
  ok(osgbListe.length === 3, 'onaydan sonra OSGB Müdürü kendi kurumunun 3 kaydını görür', String(osgbListe.length));
  ok(osgbListe.every((k) => k.isyeriId === 'isyeri-1' || k.isyeriId === 'isyeri-2' ||
    k.personelId === 'p1' || k.personelId === 'p2'), 'başka kurumun kaydı OSGB Müdürüne dönmüyor');
  ok(osgbListe.every((k) => k.personelId !== 'p9'), 'kimliksiz kayıt yanlış işyerine yazılmıyor');
  ok(osgbListe.some((k) => k.personelId === 'p1' && k.doktor === 'Dr. Test'),
    'kayıtlar çözülerek okunuyor (görünür alanlar okunabiliyor)');
  ok(!belge.querySelector('[data-islem="saglik-yeni"]') && !belge.querySelector('[data-islem="saglik-sil"]'),
    'OSGB Müdürü ekranında yeni kayıt/sil düğmesi yok');
  ok(!belge.querySelector('[data-islem="saglik-disa-aktar"]'), 'OSGB Müdürü ekranında Excel aktarma düğmesi yok');

  /* 9) Isyeri degisimi: ASKI-1 -> ASKI-2 gecisinde eski kayitlar kalkar. */
  const kapsamKutusu = () => belge.getElementById('kapsam');
  ok(!!kapsamKutusu(), 'sağlık ekranında işyeri seçici var');
  ok(kapsamKutusu().querySelectorAll('option').length === 3,
    'seçicide yalnız yetkili işyerleri listelenir (tümü + 2 kurum işyeri)',
    String(kapsamKutusu().querySelectorAll('option').length));
  kapsamKutusu().value = 'isyeri-1';
  kapsamKutusu().dispatchEvent(new pencere.Event('change', { bubbles: true }));
  const aski1Satir = kayitSatirlari().map((t) => t.textContent).join(' | ');
  ok(kayitSatirlari().length === 2, 'ASKI-1 seçilince yalnız ASKI-1 kayıtları listelenir', String(kayitSatirlari().length));
  ok(aski1Satir.indexOf('Birinci Kisi') > -1 && aski1Satir.indexOf('Ikinci Kisi') < 0,
    'ASKI-1 listesinde ASKI-2 personeli yok');
  ok(kisiSatirlari().length === 1 && kisiSatirlari()[0].textContent.indexOf('Birinci Kisi') > -1,
    'personel listesi de seçili işyerine süzülüyor');
  const ozetTablosu = belge.querySelector('#saglik-tarama-tablo');
  ok(!!ozetTablosu && ozetTablosu.textContent.indexOf('ASKI - 2') < 0, 'işyeri tarama özeti seçili işyerini aşmıyor');

  const oncekiSurum = ISG.ui.kapsamSurum;
  ISG.ui.acikSaglik = 'sk-x';
  ISG.ui.duzenleSaglik = 'sk-x';
  ISG.ui.saglikKisi = 'p1';
  kapsamKutusu().value = 'isyeri-2';
  kapsamKutusu().dispatchEvent(new pencere.Event('change', { bubbles: true }));
  const aski2Satir = kayitSatirlari().map((t) => t.textContent).join(' | ');
  ok(kayitSatirlari().length === 1, 'ASKI-2 seçilince yalnız ASKI-2 kaydı listelenir', String(kayitSatirlari().length));
  ok(aski2Satir.indexOf('Ikinci Kisi') > -1 && aski2Satir.indexOf('Birinci Kisi') < 0,
    'ASKI-1 personeli ekrandan tamamen kaldırıldı');
  ok(kisiSatirlari().length === 1 && kisiSatirlari()[0].textContent.indexOf('Ikinci Kisi') > -1,
    'seçili personel yeni işyerinde taşınmıyor');
  ok(ISG.ui.kapsamSurum > oncekiSurum, 'işyeri değişimi istek sürümünü artırıyor (geç yanıt koruması)');
  ok(ISG.ui.acikSaglik === '' && ISG.ui.duzenleSaglik === '' && ISG.ui.saglikKisi === '',
    'eski işyerinin açık kaydı/düzenlemesi/seçili personeli temizlendi');
  ok(ISG.ui.kapsam === 'isyeri-2', 'işyeri seçimi kapsam durumunda tutuluyor', 'kapsam=' + ISG.ui.kapsam);
  await new Promise((c) => setTimeout(c, 400));
  ok(ISG.ui.kapsam === 'isyeri-2', 'işyeri seçimi gecikmeli çizimden sonra korunuyor', 'kapsam=' + ISG.ui.kapsam);

  /* 10) Arama ve sayimlar isyeri sinirini asmaz. */
  const aramaKutusu = () => belge.querySelector('[data-ui="saglikArama"]');
  aramaKutusu().value = 'Birinci Kisi';
  aramaKutusu().dispatchEvent(new pencere.Event('input', { bubbles: true }));
  await new Promise((c) => setTimeout(c, 320));
  ok(kayitSatirlari().length === 0, 'ASKI-2 seçiliyken ASKI-1 personeli aranamaz',
    'kapsam=' + ISG.ui.kapsam + ' satır=' + kayitSatirlari().map((t) => t.textContent.trim().slice(0, 40)).join('/'));
  aramaKutusu().value = '';
  aramaKutusu().dispatchEvent(new pencere.Event('input', { bubbles: true }));
  await new Promise((c) => setTimeout(c, 320));
  const sekmeSayaci = belge.querySelector('.saglik-sayfa [data-sekme="tumu"] b');
  ok(!!sekmeSayaci && Number(String(sekmeSayaci.textContent).replace(/\D/g, '')) === 1,
    'sekme sayaçları seçili işyerinin kayıtlarını sayıyor',
    'kapsam=' + ISG.ui.kapsam + ' sayaç=' + (sekmeSayaci && sekmeSayaci.textContent) +
    ' satır=' + kayitSatirlari().length);

  /* 11) Dogrudan kayit kimligiyle erisim: kapsam disi silme reddedilir. */
  girisYap(kisitliYonetici);
  const disKayit = ISG.depo.saglikTakipListe('', '').filter((k) => k.isyeriId === 'isyeri-2')[0];
  const silmeHatasi = hataMetni(() => ISG.saglikTakip.sil(disKayit.id));
  ok(/kapsamınızda değil/.test(silmeHatasi), 'kayıt kimliği bilinse de kapsam dışı kayıt silinemez', silmeHatasi);
  ok(ISG.depo.saglikTakipBul(disKayit.id) !== null, 'reddedilen silme kaydı bozmadı');
  ok(ISG.yetki.saglikIzin('ekle') === true && ISG.yetki.saglikIzin('sil') === true,
    'yönetici sağlık yazma izinlerini koruyor');
  const disYazmaHatasi = hataMetni(() => kayitEkle('p2', 'isyeri-2', '2026-03-01'));
  ok(/kapsamınızda değil/.test(disYazmaHatasi), 'kapsam dışı işyerine sağlık kaydı yazılamaz', disYazmaHatasi);

  /* 12) URL ile dogrudan erisim: kapsam disi veri gorunmez. */
  pencere.location.hash = '#saglik';
  ISG.uygulama.ciz();
  const kisitliSatirlar = kayitSatirlari().map((t) => t.textContent).join(' | ');
  ok(kisitliSatirlar.indexOf('Ikinci Kisi') < 0, 'doğrudan #saglik adresi kapsam dışı kaydı göstermiyor');
  ok(ISG.yetki.gorunum().isyerleri.length === 1, 'adres değişimi kapsamı genişletmiyor');

  /* 13) Excel ciktisi kapsamla sinirli. */
  ISG.ui.kapsam = '';
  ISG.uygulama.ciz();
  const disaAktarimListesi = ISG.saglikTakip.listele(ISG.ui.kapsam || '', '');
  ok(disaAktarimListesi.every((k) => k.isyeriId === 'isyeri-1' || k.personelId === 'p1'),
    'Excel çıktısının kaynağı yalnız yetkili işyerinin kayıtları');
  const disaAktarimKapsamDisi = hataMetni(() => ISG.saglikTakip.listele('isyeri-2', ''));
  ok(/kapsamınızda değil/.test(disaAktarimKapsamDisi), 'kapsam dışı işyeri için Excel kaynağı istenemiyor', disaAktarimKapsamDisi);

  /* 14) Onay modeli ve uzman sinifi esikleri korunuyor. */
  girisYap(yonetici);
  ok(ISG.yetki.onayEsigi('Cok Tehlikeli').join(',') === 'A', 'çok tehlikeli eşiği A');
  ok(ISG.yetki.onayEsigi('Tehlikeli').join(',') === 'A,B', 'tehlikeli eşiği A/B');
  ok(ISG.yetki.onayEsigi('Az Tehlikeli').join(',') === 'A,B,C', 'az tehlikeli eşiği A/B/C');
  ok(ISG.yetki.onayModeli() === 'rol', 'varsayılan onay modeli (rol) korunuyor');
  girisYap(uzman);
  ok(ISG.yetki.yazmaModu('isyeri-1') === 'talep', 'uzman yazımı onaya gidiyor (rol modeli)');
  ok(ISG.yetki.yazmaModu('isyeri-2') === 'kapsam-disi', 'atandığı olmayan işyeri kapsam dışı');
  girisYap(yonetici);
  ISG.depo.ayarKaydet({ onayModeli: 'isyeri' });
  girisYap(uzman);
  ok(ISG.yetki.yazmaModu('isyeri-1') === 'dogrudan', 'tek uzmanlı işyerinde doğrudan yazma kuralı korunuyor');
  girisYap(yonetici);
  ISG.depo.ayarKaydet({ onayModeli: 'rol' });

  /* 15) Yeniden giris: yetkiler kullanici kaydindan aynen okunur. */
  girisYap(kisitliYonetici);
  const yenidenKapsam = ISG.yetki.kapsam().join(',');
  girisYap(kisitliYonetici);
  ok(ISG.yetki.kapsam().join(',') === yenidenKapsam && yenidenKapsam === 'isyeri-1',
    'yeniden girişte işyeri yetkisi korunuyor', ISG.yetki.kapsam().join(','));
  ok(!ISG.ui.saglikKisi, 'yeni oturumda önceki seçimler devralınmıyor');

  /* 16) Calisma kitabi isyerine baglidir ve yalniz bagli isyerinde okunur.
     Regresyon: tek ortak kayit tutuldugunda ASKI-1 satirlari ASKI-2 gorunumunde
     okunuyordu; satirlar ayrica kasada duz metin duruyordu. */
  girisYap(yonetici);
  const kitapYaz = (isyeriId, ad, satirlar) => ISG.depo.saglikCalismaKitabiKaydet(isyeriId, {
    dosyaAdi: ad, yuklemeTarihi: new Date().toISOString(), yukleyen: 'u1',
    sifreli: ISG.saglikTakip.sifrele(JSON.stringify([{ ad: 'TAM LİSTE', satirlar: satirlar }]))
  });
  kitapYaz('isyeri-1', 'ASKI-1.xlsx', [
    ['Sicil', 'Ad Soyad', 'İşyeri', 'Sonuç'], ['S-1', 'Birinci Kisi', 'ASKI - 1', 'TESHIS-1']
  ]);
  kitapYaz('isyeri-2', 'ASKI-2.xlsx', [
    ['Sicil', 'Ad Soyad', 'İşyeri', 'Sonuç'],
    ['S-2', 'Ikinci Kisi', 'ASKI - 2', 'TESHIS-2'],
    ['S-9', 'Dokuzuncu Kisi', 'Diger Kurum Isyeri', 'TESHIS-9']
  ]);
  ok(ISG.depo.saglikCalismaKitaplari().length === 2, 'çalışma kitabı işyeri başına ayrı kayıt',
    String(ISG.depo.saglikCalismaKitaplari().length));
  const hamKasa = pencere.localStorage.getItem('isgtakip.saglik.kasa') || '';
  ok(hamKasa.indexOf('TESHIS-1') < 0 && hamKasa.indexOf('sg2:') > -1,
    'kitap satırları kasada düz metin durmuyor (şifreli gövde)');
  let yuklemeReddi = '';
  try { await ISG.saglikCalismaKitabi.oku({ name: 'x.xlsx' }, ''); }
  catch (hata) { yuklemeReddi = hata.message; }
  ok(/işyerine bağlanır/.test(yuklemeReddi), 'işyeri seçilmeden çalışma kitabı yüklenemez', yuklemeReddi);

  const kitapMetni = () => { const e = belge.querySelector('#saglik-kitap-tablo'); return e ? e.textContent : ''; };
  ISG.ui.kapsam = '';
  ISG.uygulama.ciz();
  ok(!belge.querySelector('#saglik-kitap-tablo'), 'işyeri seçilmeden kitap satırı basılmıyor');
  ok(!!belge.querySelector('#saglik-kitap-ozet'), 'işyeri seçilmeden yalnız kitap özeti gösteriliyor');
  ISG.ui.kapsam = 'isyeri-1';
  ISG.uygulama.ciz();
  ok(kitapMetni().indexOf('Birinci Kisi') > -1 && kitapMetni().indexOf('Ikinci Kisi') < 0,
    'ASKI-1 kitabı yalnız ASKI-1 satırını gösteriyor', kitapMetni().slice(0, 120));
  ISG.ui.kapsam = 'isyeri-2';
  ISG.uygulama.ciz();
  ok(kitapMetni().indexOf('Ikinci Kisi') > -1 && kitapMetni().indexOf('Birinci Kisi') < 0,
    'ASKI-2 kitabı ASKI-1 satırını göstermiyor', kitapMetni().slice(0, 120));
  ok(kitapMetni().indexOf('Dokuzuncu Kisi') < 0,
    'dosyaya karışan kapsam dışı işyeri satırı süzülüyor');

  /* 17) Kapsam disi isyerinin kitabi okunamaz; ozet de kapsami asmaz. */
  girisYap(kisitliYonetici);
  ok(ISG.saglikCalismaKitabi.kitap('isyeri-2') === null,
    'kapsam dışı işyerinin çalışma kitabı okunamıyor');
  ok(ISG.saglikCalismaKitabi.ozetListe().every((k) => k.isyeriId === 'isyeri-1'),
    'kitap özeti yetki kapsamını aşmıyor',
    ISG.saglikCalismaKitabi.ozetListe().map((k) => k.isyeriId).join(','));
  girisYap(osgbMudur);
  let mudurReddi = '';
  try { await ISG.saglikCalismaKitabi.oku({ name: 'y.xlsx' }, 'isyeri-1'); }
  catch (hata) { mudurReddi = hata.message; }
  ok(/yalnızca yönetici/.test(mudurReddi), 'OSGB Müdürü çalışma kitabı yükleyemez (salt okunur)', mudurReddi);

  /* 18) Aktarilan personel: kayit eski isyerinde kalir, yenisine sizmaz. */
  girisYap(yonetici);
  ISG.depo.al().personel.push({ id: 'p3', sicil: 'S-3', adSoyad: 'Aktarilan Kisi', isyeriId: 'isyeri-1', aktif: true });
  ISG.depo.kaydet();
  ISG.depo.saglikTakipKaydet({ id: 'sk-transfer', personelId: 'p3', isyeriId: 'isyeri-2', tarih: '2026-03-03' });
  girisYap(kisitliYonetici);
  ok(!ISG.saglikTakip.listele('', '').some((k) => k.id === 'sk-transfer'),
    'aktarılan personelin ASKI-2 kaydı ASKI-1 yetkilisine görünmüyor',
    ISG.saglikTakip.listele('', '').map((k) => k.id + ':' + (k.isyeriId || 'BOSS')).join(','));

  /* 19) ROL ≠ KAPSAM (2.26.0): atamasız yönetici hiçbir işyerine erişemez.
     Bütün hesaplar sentetiktir. */
  console.log('\n19) Atamasız yönetici ve açık yetki kuralı');

  /* 19a) Eski `u1` istisnası ve "atamasız yönetici = tüm işyerleri" kuralı yok. */
  ok(ISG.YONETICI_HESAP()[0].tumIsyerleri !== true &&
    (ISG.YONETICI_HESAP()[0].isyerleri || []).length === 0,
    'kurulum hesabı kapsamsız gelir (u1 kaydına tumIsyerleri/işyeri yazılmaz)');
  ok(ISG.yetki.tumunuGorur({ kullaniciId: 'u1', rol: 'yonetici', isyerleri: [], tumIsyerleri: false }) === false,
    'eski u1 istisnası kaldırıldı: atamasız yönetici tüm işyerlerini görmüyor');
  ok(ISG.yetki.tumunuGorur({ kullaniciId: 'u1', rol: 'yonetici', isyerleri: [] }) === false,
    'tumIsyerleri alanı yoksa varsayılan erişim false');
  ok(ISG.yetki.tumunuGorur({ kullaniciId: 'u-x', rol: 'yonetici', isyerleri: [], tumIsyerleri: true }) === true,
    'açık "tüm işyerleri" yetkisi olan yönetici tüm işyerlerini görür');
  ok(ISG.yetki.rolTanimi('yonetici').tumIsyerleri === false,
    'yönetici rol tanımı kapsam iddia etmiyor (rol ≠ kapsam)');

  /* 19b) Atamasız yönetici: boş kapsam, veri yok, uyarı ekranı. */
  girisYap(atamasizYonetici);
  ISG.ui.kapsam = '';
  ok(ISG.yetki.kapsam().length === 0, 'atamasız yöneticinin kapsamı boş', ISG.yetki.kapsam().join(','));
  ok(ISG.yetki.atamaYok() === true, 'atamasız yönetici "atama yok" durumunda');
  ok(ISG.yetki.tumunuGorur(ISG.yetki.oturum()) === false, 'atamasız yönetici tüm işyerlerini görmüyor');
  ok(ISG.yetki.gorunum().isyerleri.length === 0 && ISG.yetki.gorunum().personel.length === 0,
    'atamasız yöneticiye işyeri/personel kaydı dönmüyor',
    'işyeri=' + ISG.yetki.gorunum().isyerleri.length + ' personel=' + ISG.yetki.gorunum().personel.length);
  ok((ISG.yetki.gorunum().atamaIsyerleri || []).length === 3,
    'atama seçenek listesi yine dolu (sistem kendini kilitlemiyor)',
    String((ISG.yetki.gorunum().atamaIsyerleri || []).length));

  /* 19c) Sağlık verisi: yönetim rolü tek başına okuma hakkı değil. */
  ok(ISG.yetki.saglikGoruntule() === false, 'atamasız yönetici sağlık verisi göremez');
  ok(ISG.yetki.saglikIzin('goruntule') === false && ISG.yetki.saglikIzin('ekle') === false,
    'atamasız yöneticide sağlık görüntüleme/yazma izni yok');
  const atamasizListeHatasi = hataMetni(() => ISG.saglikTakip.listele('', ''));
  ok(/yönetici onayı/i.test(atamasizListeHatasi), 'atamasız yönetici sağlık listesini okuyamıyor', atamasizListeHatasi);
  const saglikOncesi = ISG.depo.saglikTakipListe('', '').length;
  const atamasizYazma = ISG.saglikTakip.kaydet({
    personelId: 'p1', isyeriId: 'isyeri-1', tarih: '2026-05-01', doktor: 'Dr. Test', sonMuayene: 'Elverisli', calismaSesi: 'saha'
  });
  ok(ISG.depo.saglikTakipListe('', '').length === saglikOncesi,
    'atamasız yöneticinin yazma denemesi depoya işlemedi',
    'öncesi=' + saglikOncesi + ' sonrası=' + ISG.depo.saglikTakipListe('', '').length);
  ok(!!(atamasizYazma && atamasizYazma.id), 'izin yoksa istek erişim talebine dönüşüyor');
  const atamasizDenetim = (ISG.depo.al().denetim || []).some(function (k) {
    return k.tur === 'saglik-erisim' && k.kullaniciId === 'u-atamasiz';
  });
  ok(atamasizDenetim, 'yetkisiz sağlık erişim denemesi denetim izine yazıldı');

  /* 19d) Doğrudan adres ve kayıt kimliğiyle erişim engellenir. */
  pencere.location.hash = '#saglik';
  ISG.uygulama.ciz();
  const atamasizMetin = String((belge.getElementById('gorunum') || {}).textContent || '');
  ok(/Henüz işyeri atamanız bulunmuyor/.test(atamasizMetin),
    'atamasız yöneticiye "işyeri atamanız bulunmuyor" uyarısı gösteriliyor', atamasizMetin.slice(0, 60));
  ok(/yetkili yönetici tarafından işyeri atamanız yapılmalıdır/.test(atamasizMetin),
    'uyarı metni onaylanan metinle aynı');
  ok(!belge.querySelector('.saglik-sayfa'), 'atamasız yöneticide sağlık ekranı hiç basılmıyor');
  pencere.location.hash = '#personel';
  ISG.uygulama.ciz();
  const personelMetni = String((belge.getElementById('gorunum') || {}).textContent || '');
  ok(/Henüz işyeri atamanız bulunmuyor/.test(personelMetni) && !belge.querySelector('.personel-blok'),
    'doğrudan #personel adresi de veri basmıyor');
  const atamasizKayitHatasi = hataMetni(() => ISG.saglikTakip.sil('sk-orphan-1'));
  ok(ISG.depo.saglikTakipBul('sk-orphan-1') !== null,
    'kayıt kimliği bilinse de atamasız yönetici kaydı silemiyor', atamasizKayitHatasi);
  const atamasizDogrudanYazma = hataMetni(() => ISG.depo.personelKaydet({
    id: 'p-kacak', adSoyad: 'Kacak Kisi', isyeriId: 'isyeri-2', sicil: 'S-X'
  }));
  ok(/kapsamınızda değil/.test(atamasizDogrudanYazma),
    'doğrudan depo yazımı atamasız yöneticide kapsam dışında reddediliyor', atamasizDogrudanYazma);

  /* 19e) Yönetim ekranı açık kalır: atama buradan yapılır. */
  pencere.location.hash = '#ekip';
  ISG.uygulama.ciz();
  const atamasizEkip = String((belge.getElementById('gorunum') || {}).textContent || '');
  ok(/İşyeri atamanız bulunmuyor/.test(atamasizEkip) && /Kullanıcılar ve yetkiler/.test(atamasizEkip),
    'kullanıcı yönetimi ekranı atamasız yöneticiye açık ve uyarı görünür');
  ok(belge.querySelector('[data-islem="kullanici-duzenle"]') !== null,
    'atamasız yönetici kullanıcı satırlarını düzenleyebiliyor (atama yolu açık)');
  /* Atama kutusu tam listeden gelir: atamasız yönetici kendine işyeri atayabilir. */
  belge.querySelector('[data-islem="kullanici-duzenle"]').click();
  const kullaniciKutulari = belge.querySelectorAll('#kullaniciIsyerleri .kullanici-isyeri');
  ok(kullaniciKutulari.length === 4,
    'kullanıcı formunda bütün işyerleri seçilebiliyor (3 işyeri + "tümü")', String(kullaniciKutulari.length));
  const kullaniciDiyalog = belge.getElementById('kullaniciDiyalog');
  if (kullaniciDiyalog && typeof kullaniciDiyalog.close === 'function' && kullaniciDiyalog.open) {
    kullaniciDiyalog.close();
  }
  pencere.location.hash = '#isyerleri';
  ISG.uygulama.ciz();
  ok(belge.querySelectorAll('.isyeri-kart').length === 0,
    'işyeri ekranı çökmeden açılıyor, kapsam dışı kart basılmıyor');

  /* 19f) Açıkça iki işyerine atanmış yönetici yalnız o iki işyerini görür. */
  girisYap(ikiIsyeriYoneticisi);
  ok(ISG.yetki.kapsam().length === 2 && ISG.yetki.kapsam().indexOf('isyeri-9') < 0 &&
    ISG.yetki.kapsam().indexOf('isyeri-1') > -1 && ISG.yetki.kapsam().indexOf('isyeri-2') > -1,
    'iki işyerine atanmış yönetici yalnız A ve B işyerlerini görür', ISG.yetki.kapsam().join(','));
  ok(ISG.yetki.atamaYok() === false, 'ataması olan yönetici "atama yok" durumunda değil');
  const ikiKapsamDisi = hataMetni(() => ISG.saglikTakip.listele('isyeri-9', ''));
  ok(/kapsamınızda değil/.test(ikiKapsamDisi), 'ataması olmayan işyerinin sağlık verisi istenemiyor', ikiKapsamDisi);

  /* 19g) Bulut içe aktarımı ve yeniden giriş atamaları bozmuyor. */
  const atamaOncesi = ISG.yetki.kapsam().join(',');
  ISG.depo.iceAktar(JSON.stringify(ISG.depo.al()));
  const bulutSonrasi = (ISG.depo.al().kullanicilar || []).filter(function (k) { return k.id === 'u-iki'; })[0];
  ok(!!bulutSonrasi && (bulutSonrasi.isyerleri || []).join(',') === 'isyeri-1,isyeri-2' &&
    bulutSonrasi.tumIsyerleri !== true,
    'bulut senkronizasyonu sonrası atamalar korunuyor',
    bulutSonrasi ? (bulutSonrasi.isyerleri || []).join(',') : 'kayıt yok');
  girisYap(ikiIsyeriYoneticisi);
  ok(ISG.yetki.kapsam().join(',') === atamaOncesi,
    'yeniden girişte yetki kapsamı aynı yükleniyor', ISG.yetki.kapsam().join(','));

  /* 19h) Atama sonradan eklenirse yalnız atananlar, kaldırılırsa erişim biter. */
  girisYap(yonetici);
  const atamasizKayit = (ISG.depo.al().kullanicilar || []).filter(function (k) { return k.id === 'u-atamasiz'; })[0];
  ISG.depo.kullaniciKaydet(Object.assign({}, atamasizKayit, { isyerleri: ['isyeri-2'], tumIsyerleri: false }));
  girisYap(atamasizYonetici);
  ok(ISG.yetki.kapsam().join(',') === 'isyeri-2' && ISG.yetki.atamaYok() === false,
    'sonradan atanan işyeri erişimi açıyor', ISG.yetki.kapsam().join(','));
  ok(ISG.saglikTakip.listele('', '').every(function (k) { return k.isyeriId === 'isyeri-2'; }),
    'atanan işyeri dışındaki sağlık kaydı görünmüyor');

  girisYap(yonetici);
  const kisitliKayit = (ISG.depo.al().kullanicilar || []).filter(function (k) { return k.id === 'u-yon'; })[0];
  ISG.depo.kullaniciKaydet(Object.assign({}, kisitliKayit, { isyerleri: [], tumIsyerleri: false }));
  girisYap(kisitliYonetici);
  ok(ISG.yetki.kapsam().length === 0 && ISG.yetki.atamaYok() === true,
    'ataması kaldırılan kullanıcının erişimi sona eriyor', ISG.yetki.kapsam().join(','));
  ok(ISG.yetki.saglikGoruntule() === false, 'ataması kaldırılan kullanıcı sağlık verisi göremiyor');
  girisYap(yonetici);
  ISG.depo.kullaniciKaydet(Object.assign({}, kisitliKayit, { isyerleri: ['isyeri-1'], tumIsyerleri: false }));
  girisYap(kisitliYonetici);
  ok(ISG.yetki.kapsam().join(',') === 'isyeri-1', 'atama geri verilince erişim yeniden açılıyor');

  /* 19i) OSGB Müdürü ve Sistem Yöneticisi davranışları korunuyor. */
  girisYap(osgbMudur);
  ok(ISG.yetki.kapsam().length === 2 && ISG.yetki.kapsam().indexOf('isyeri-9') < 0 && ISG.yetki.atamaYok() === false,
    'OSGB Müdürü yalnız kendi kurumunun işyerlerini görür (atama aranmaz)', ISG.yetki.kapsam().join(','));
  ok(ISG.yetki.rolTanimi('osgbMuduru').saltOkunur === true && ISG.yetki.yazmaModu('isyeri-1') === 'red' &&
    ISG.yetki.saglikIzin('ekle') === false,
    'OSGB Müdürünün salt okunur yetkisi korunuyor');

  girisYap(sistemYoneticisi);
  ok(ISG.yetki.kapsam().length === 3 && ISG.yetki.izin('kullaniciKaydet') === true &&
    ISG.yetki.izin('isyeriKaydet') === true && ISG.yetki.yazmaModu('isyeri-9') === 'dogrudan',
    'Sistem Yöneticisinin sistem yönetimi işlevleri korunuyor');
  ok(ISG.yetki.saglikGoruntule() === true && ISG.yetki.saglikKapsam().tum === true,
    'Sistem Yöneticisinin sağlık erişimi kapsam üzerinden ayrıca denetleniyor');
  ok(ISG.yetki.saglikKapsam().idler.length === ISG.yetki.kapsam().length,
    'sağlık kapsamı işyeri kapsamından bağımsız genişlemiyor');

  /* 19j) Onay mekanizması ve uzman sınıfı eşikleri değişmedi. */
  ok(ISG.yetki.onayModeli() === 'rol', 'onay modeli varsayılanı değişmedi');
  ok(ISG.yetki.onayEsigi('Cok Tehlikeli').join(',') === 'A' &&
    ISG.yetki.onayEsigi('Tehlikeli').join(',') === 'A,B' &&
    ISG.yetki.onayEsigi('Az Tehlikeli').join(',') === 'A,B,C',
    'uzman sınıfı eşikleri değişmedi');
  girisYap(uzman);
  ok(ISG.yetki.yazmaModu('isyeri-1') === 'talep' && ISG.yetki.yazmaModu('isyeri-2') === 'kapsam-disi',
    'uzman onay akışı ve işyeri sınırı korunuyor');

  /* 20) Yönetim yazma kapsamı (P2): `yonetir` rolü sınırsız yazma demek değil.
     Bütün hesaplar ve kayıtlar sentetiktir; gerçek kullanıcı verisi kullanılmaz. */
  console.log('\n20) Yönetim yazma kapsamı (P2)');
  girisYap(kisitliYonetici);
  var yKapsam = ISG.yetki.yonetimKapsami();
  ok(yKapsam.yonetir === true && yKapsam.tum === false && yKapsam.isyerleri.join(',') === 'isyeri-1',
    'sınırlı yöneticinin yönetim kapsamı atandığı işyeri', yKapsam.isyerleri.join(','));
  ok(yKapsam.kurumlar.join(',') === 'kr-aski', 'yönetim kapsamı yalnız kendi kurumunu içerir', yKapsam.kurumlar.join(','));
  ok(ISG.yetki.yonetimIsyeriVar('isyeri-2') === false && ISG.yetki.yonetimKurumVar('kr-baska') === false,
    'kapsam dışı işyeri/kurum yönetim kapsamında değil');
  ok(ISG.yetki.izin('isyeriSil', 'isyeri-1') === true && ISG.yetki.izin('isyeriSil', 'isyeri-2') === false,
    'izin() yönetim işyeri hedefini kapsamla sınıyor');

  /* 20a) İşyeri yazmaları: kapsam dışı güncelleme, silme ve yeni kayıt reddedilir. */
  var disGuncelleme = hataMetni(function () { ISG.depo.isyeriKaydet({ id: 'isyeri-2', ad: 'Ele Gecirildi' }); });
  ok(/yönetim kapsamınızda değil/.test(disGuncelleme), 'kapsam dışı işyeri güncellenemez', disGuncelleme);
  ok(ISG.depo.al().isyerleri.filter(function (i) { return i.id === 'isyeri-2'; })[0].ad === 'ASKI - 2',
    'reddedilen güncelleme kaydı bozmadı');
  var disIsyeriSilme = hataMetni(function () { ISG.depo.isyeriSil('isyeri-2'); });
  ok(/yönetim kapsamınızda değil/.test(disIsyeriSilme), 'kapsam dışı işyeri silinemez', disIsyeriSilme);
  ok(!!ISG.depo.al().isyerleri.filter(function (i) { return i.id === 'isyeri-2'; })[0],
    'reddedilen silme kaydı bozmadı');
  var yabanciKurumIsyeri = hataMetni(function () {
    ISG.depo.isyeriKaydet({ ad: 'Baska Kurum Isyeri', kurumId: 'kr-baska' });
  });
  ok(/kurum yönetim kapsamınızda değil/.test(yabanciKurumIsyeri), 'kapsam dışı kurumda işyeri açılamaz', yabanciKurumIsyeri);
  var kurumsuzIsyeri = hataMetni(function () { ISG.depo.isyeriKaydet({ ad: 'Kurumsuz Isyeri' }); });
  ok(/kuruma bağlı/.test(kurumsuzIsyeri), 'sınırlı yönetici kurumsuz işyeri açamaz', kurumsuzIsyeri);
  ok(ISG.depo.al().isyerleri.length === 3, 'reddedilen denemeler işyeri sayısını değiştirmedi',
    String(ISG.depo.al().isyerleri.length));
  var kapsamIciGuncelleme = ISG.depo.isyeriKaydet({
    id: 'isyeri-1', ad: 'ASKI - 1', kurumId: 'kr-aski', tehlikeSinifi: 'Az Tehlikeli'
  });
  ok(!!kapsamIciGuncelleme && kapsamIciGuncelleme.id === 'isyeri-1', 'kapsam içi işyeri güncellenebiliyor');

  /* 20b) Kurum, global ayar ve sıfırlama yalnız sistem geneli yetkiye açıktır. */
  ok(ISG.yetki.izin('kurumKaydet') === false, 'sınırlı yöneticide kurum oluşturma izni yok');
  var kurumHatasi = hataMetni(function () { ISG.depo.kurumKaydet({ ad: 'Sizinti OSGB' }); });
  ok(/sistem geneli/.test(kurumHatasi), 'sınırlı yönetici kurum açamaz', kurumHatasi);
  var kurumSilmeHatasi = hataMetni(function () { ISG.depo.kurumSil('kr-baska'); });
  ok(/sistem geneli/.test(kurumSilmeHatasi), 'sınırlı yönetici kurum silemez', kurumSilmeHatasi);
  ok(ISG.depo.al().kurumlar.length === 2, 'kurum listesi değişmedi', String(ISG.depo.al().kurumlar.length));
  var ayarHatasi = hataMetni(function () { ISG.depo.ayarKaydet({ kurum: 'Ele Gecirildi OSGB' }); });
  ok(/sistem geneli/.test(ayarHatasi), 'kurum adı sınırlı yöneticide değiştirilemez', ayarHatasi);
  var onayModeliHatasi = hataMetni(function () { ISG.depo.ayarKaydet({ onayModeli: 'isyeri' }); });
  ok(/sistem geneli/.test(onayModeliHatasi), 'onay modeli sınırlı yöneticide değiştirilemez', onayModeliHatasi);
  ok(ISG.yetki.onayModeli() === 'rol', 'reddedilen ayar değişikliği modele işlemedi');
  var sifirlaHatasi = hataMetni(function () { ISG.depo.sifirla(); });
  ok(/sistem geneli/.test(sifirlaHatasi), 'tüm veriyi sıfırlama sınırlı yöneticide reddedilir', sifirlaHatasi);
  ok(ISG.depo.al().isyerleri.length === 3 && (ISG.depo.al().personel || []).length >= 3,
    'reddedilen sıfırlama veriyi silmedi');

  /* 20c) Kullanıcı yazmaları: ayrıcalık yükseltme ve kapsam dışı atama reddedilir. */
  var kendineTum = hataMetni(function () {
    ISG.depo.kullaniciKaydet(Object.assign({}, ISG.depo.kullaniciBul('u-yon'), { tumIsyerleri: true }));
  });
  ok(/Tüm işyerleri/.test(kendineTum), 'sınırlı yönetici kendine "tüm işyerleri" veremez', kendineTum);
  ok(ISG.depo.kullaniciBul('u-yon').tumIsyerleri !== true, 'yetki yükseltme veriye yazılmadı');
  var kendineRol = hataMetni(function () {
    ISG.depo.kullaniciKaydet(Object.assign({}, ISG.depo.kullaniciBul('u-yon'), { rol: 'sistemYoneticisi' }));
  });
  ok(/Kendi rolünüzü|Sistem Yöneticisi rolü/.test(kendineRol), 'kendi rolünü yükseltemez', kendineRol);
  var baskasinaSistem = hataMetni(function () {
    ISG.depo.kullaniciKaydet({
      id: '', adSoyad: 'Yeni Sistem', eposta: 'yeni.sistem@test.local', sifre: '1234',
      rol: 'sistemYoneticisi', isyerleri: ['isyeri-1'], aktif: true
    });
  });
  ok(/Sistem Yöneticisi rolü/.test(baskasinaSistem), 'sınırlı yönetici sistem yöneticisi atayamaz', baskasinaSistem);
  ok(!ISG.depo.kullaniciEpostaBul('yeni.sistem@test.local'), 'reddedilen hesap oluşmadı');
  var disIsyeriAtama = hataMetni(function () {
    ISG.depo.kullaniciKaydet({
      id: '', adSoyad: 'Kacak Uzman', eposta: 'kacak.uzman@test.local', sifre: '1234',
      rol: 'yetkili', isyerleri: ['isyeri-9'], uzmanSinifi: 'A', aktif: true
    });
  });
  ok(/yönetim kapsamınızda değil/.test(disIsyeriAtama), 'kapsam dışı işyerine atama yapılamaz', disIsyeriAtama);
  var kapsamIciAtama = ISG.depo.kullaniciKaydet({
    id: '', adSoyad: 'Kapsam Ici Uzman', eposta: 'kapsam.ici@test.local', sifre: '1234',
    rol: 'yetkili', isyerleri: ['isyeri-1'], uzmanSinifi: 'B', aktif: true
  });
  ok(!!kapsamIciAtama && !!kapsamIciAtama.id, 'kapsam içi atama yazılabiliyor');
  ok(ISG.yetki.kullaniciYonetimKapsaminda(kapsamIciAtama) === true, 'yeni hesap yönetim kapsamına girdi');
  var disKullaniciSilme = hataMetni(function () { ISG.depo.kullaniciSil('u-osgb'); });
  ok(/yönetim kapsamınızda değil/.test(disKullaniciSilme), 'kapsam dışı kullanıcı silinemez', disKullaniciSilme);
  ok(!!ISG.depo.kullaniciBul('u-osgb'), 'reddedilen silme hesabı bozmadı');

  /* 20d) Sistem geneli yetkili yönetici mevcut yetkilerini korur. */
  girisYap(yonetici);
  ok(ISG.yetki.yonetimKapsami().tum === true && ISG.yetki.izin('kurumKaydet') === true &&
    ISG.yetki.izin('sifirla') === true, 'sistem geneli yetkili yönetici yönetim yetkilerini koruyor');
  ok(ISG.depo.kurumKaydet({ id: 'kr-temiz', ad: 'Temizlik Kurumu' }).id === 'kr-temiz',
    'tam yetkili yönetici kurum açabiliyor');
  ISG.depo.kurumSil('kr-temiz');
  ISG.depo.kullaniciSil(kapsamIciAtama.id);
  ok(!ISG.depo.kullaniciEpostaBul('kapsam.ici@test.local'), 'test hesabı temizlendi');

  /* 21) Atamasız yönetici: yönetim sınırı ve kilitlenmeyen bootstrap.
     Atamasız yönetici kendi kapsamını alabilir; başkasına yetki veremez. */
  console.log('\n21) Atamasız yönetici ve yönetim sınırı');
  ISG.depo.kullaniciKaydet(Object.assign({}, ISG.depo.kullaniciBul('u-atamasiz'),
    { isyerleri: [], tumIsyerleri: false }));
  girisYap(atamasizYonetici);
  ok(ISG.yetki.atamaYok() === true, 'atamasız yönetici yeniden atamasız durumda');
  var atamasizKapsam = ISG.yetki.yonetimKapsami();
  ok(atamasizKapsam.tum === false && atamasizKapsam.isyerleri.length === 0,
    'atamasız yöneticinin yönetim kapsamı boş', atamasizKapsam.isyerleri.join(','));
  var atamasizTum = hataMetni(function () {
    ISG.depo.kullaniciKaydet(Object.assign({}, ISG.depo.kullaniciBul('u-atamasiz'), { tumIsyerleri: true }));
  });
  ok(/Tüm işyerleri/.test(atamasizTum), 'atamasız yönetici kendine "tüm işyerleri" veremez', atamasizTum);
  var atamasizBaska = hataMetni(function () {
    ISG.depo.kullaniciKaydet(Object.assign({}, ISG.depo.kullaniciBul('u-uz'), { isyerleri: ['isyeri-1'] }));
  });
  ok(/yönetim kapsamınızda değil/.test(atamasizBaska), 'atamasız yönetici başka hesabı yönetemez', atamasizBaska);
  ok(ISG.depo.kullaniciBul('u-uz').isyerleri.join(',') === 'isyeri-1', 'reddedilen yönetim hesabı bozmadı');
  var atamasizKurum = hataMetni(function () { ISG.depo.kurumKaydet({ ad: 'Atamasiz OSGB' }); });
  ok(/sistem geneli/.test(atamasizKurum), 'atamasız yönetici kurum açamaz', atamasizKurum);
  var kendiAtama = ISG.depo.kullaniciKaydet(Object.assign({}, ISG.depo.kullaniciBul('u-atamasiz'),
    { isyerleri: ['isyeri-1'], tumIsyerleri: false }));
  ok(!!kendiAtama && ISG.yetki.kapsam().join(',') === 'isyeri-1',
    'atamasız yönetici kendi kapsamını alabiliyor (sistem kilitlenmiyor)', ISG.yetki.kapsam().join(','));
  ok(ISG.yetki.kullaniciYonetimKapsaminda(ISG.depo.kullaniciBul('u-uz')) === true,
    'kapsam alınınca kapsamdaki hesaplar yönetilebiliyor');

  /* 21b) Son yönetici koruması: sistem kilitlenmez. */
  girisYap(yonetici);
  var hepsi = ISG.depo.al().kullanicilar;
  var oncekiAktif = hepsi.map(function (kisi) { return kisi.aktif; });
  hepsi.forEach(function (kisi) { if (kisi.id !== 'u1') { kisi.aktif = false; } });
  ok(ISG.yetki.sonYoneticiMi(ISG.depo.kullaniciBul('u1')) === true,
    'tek yönetici kalınca son yönetici koruması devreye girer');
  var sonSilme = hataMetni(function () { ISG.depo.kullaniciSil('u1'); });
  ok(/Son yönetici/.test(sonSilme), 'son yönetici hesabı silinemez', sonSilme);
  var sonPasif = hataMetni(function () {
    ISG.depo.kullaniciKaydet(Object.assign({}, ISG.depo.kullaniciBul('u1'), { aktif: false }));
  });
  ok(/Son yönetici/.test(sonPasif), 'son yönetici hesabı pasife alınamaz', sonPasif);
  /* Rol düşürmesi de kilitleme üretir: hesap açık kalır ama yönetim kalmaz. */
  var sonRol = hataMetni(function () {
    ISG.depo.kullaniciKaydet(Object.assign({}, ISG.depo.kullaniciBul('u1'), { rol: 'goruntuleyici' }));
  });
  ok(/Son yönetici/.test(sonRol), 'son yönetici hesabının rolü düşürülemez', sonRol);
  ok(ISG.depo.kullaniciBul('u1').rol === 'yonetici', 'reddedilen rol değişikliği kaydı bozmadı');

  hepsi.forEach(function (kisi, sira) { kisi.aktif = oncekiAktif[sira]; });
  ISG.depo.kaydet();
  ok(ISG.yetki.sonYoneticiMi(ISG.depo.kullaniciBul('u1')) === false,
    'diğer hesaplar geri açılınca koruma kalkıyor');
  ok(ISG.depo.kullaniciBul('u1') !== null && ISG.depo.kullaniciBul('u-sis').aktif !== false,
    'koruma testi hesapları bozmadı');

  /* 22) Sistem yönetimi ekranları (P3/P4/P5/P8).
     Ekranlar sentetik veriyle çizilir; hiçbir ağ/kayıt işlemi yapılmaz. */
  console.log('\n22) Sistem yönetimi ekranları (P3/P4/P5/P8)');
  girisYap(yonetici);
  ISG.depo.kullaniciKaydet(Object.assign({}, ISG.depo.kullaniciBul('u-atamasiz'),
    { isyerleri: [], tumIsyerleri: false }));
  /* P3: atamasız yönetici sistem yönetimi ekranını açabilir (P2'yi kapatmak için). */
  girisYap(atamasizYonetici);
  pencere.location.hash = '#sistem';
  ISG.uygulama.ciz();
  var sistemMetni = String((belge.getElementById('gorunum') || {}).textContent || '');
  ok(/Sistem uyarıları ve hata durumları/.test(sistemMetni) && /Veri tutarlılığı/.test(sistemMetni),
    'atamasız yönetici sistem yönetimi ekranını açabiliyor (P3)', sistemMetni.slice(0, 70));
  ok(!/Henüz işyeri atamanız bulunmuyor/.test(sistemMetni),
    'sistem ekranı atama uyarısıyla kapanmıyor (P3)');

  /* P4: sınırlı yönetici kurum tablosunda yalnız kendi kurumunu görür. */
  girisYap(kisitliYonetici);
  pencere.location.hash = '#sistem';
  ISG.uygulama.ciz();
  sistemMetni = String((belge.getElementById('gorunum') || {}).textContent || '');
  ok(/ASKI OSGB/.test(sistemMetni) && !/Baska OSGB/.test(sistemMetni),
    'sistem ekranı kurum tablosu yönetim kapsamıyla sınırlı (P4)', sistemMetni.slice(0, 70));
  ok(!belge.querySelector('#gorunum [data-islem="sistem-kurum-kaydet"]'),
    'sınırlı yöneticide kurum oluşturma düğmesi yok');
  ok(ISG.yetki.yonetimVerisi().kurumlar.length === 1,
    'yönetim verisi tek kurum döndürüyor', String(ISG.yetki.yonetimVerisi().kurumlar.length));

  /* P5: kullanıcı listesi başka kurumun hesaplarını göstermez. */
  pencere.location.hash = '#ekip';
  ISG.uygulama.ciz();
  var ekipMetni = String((belge.getElementById('gorunum') || {}).textContent || '');
  var gorunenKullanicilar = ISG.yetki.yonetimVerisi().kullanicilar.map(function (k) { return k.id; }).sort();
  ok(gorunenKullanicilar.join(',') === 'u-iki,u-uz,u-yon',
    '#ekip yalnız yönetim kapsamındaki hesapları listeliyor (P5)', gorunenKullanicilar.join(','));
  ok(!/Dokuzuncu|sistem@test\.local|osgb@test\.local/.test(ekipMetni),
    '#ekip başka kurumun hesaplarını göstermiyor (P5)');
  ok(!/mehmetkurt0948/.test(ekipMetni), '#ekip kapsam dışı yönetici hesabını göstermiyor (P5)');

  /* P8: "Tüm işyerleri" yalnız fiilen tüm işyerlerine erişen hesapta yazılır. */
  var isaretliMudur = Object.assign({}, osgbMudur, { tumIsyerleri: true });
  var mudurMetni = ISG.yetki.kapsamMetni(isaretliMudur, ISG.depo.al());
  ok(!/^Tüm işyerleri/.test(mudurMetni), 'kurum kapsamlı rolde "tüm işyerleri" işareti metne yazılmıyor (P8)', mudurMetni);
  ok(/yok sayılır/.test(mudurMetni), 'yok sayılan işaret metinde açıkça belirtiliyor', mudurMetni);
  ok(ISG.yetki.kullaniciErisim(isaretliMudur).indexOf('isyeri-9') < 0,
    'işaret fiilî erişimi genişletmiyor');
  girisYap(yonetici);
  ISG.depo.kullaniciKaydet(Object.assign({}, ISG.depo.kullaniciBul('u-osgb'), { tumIsyerleri: true }));
  pencere.location.hash = '#ekip';
  ISG.uygulama.ciz();
  var osgbSatiri = Array.prototype.slice.call(belge.querySelectorAll('#gorunum .kullanici-satir'))
    .filter(function (satir) { return /OSGB Muduru/.test(satir.textContent); })[0];
  ok(!!osgbSatiri && !/Tüm işyerleri/.test(osgbSatiri.textContent),
    '#ekip OSGB Müdürü satırında "Tüm işyerleri" yazmıyor (P8)',
    osgbSatiri ? osgbSatiri.textContent.slice(0, 80) : 'satır yok');
  ISG.depo.kullaniciKaydet(Object.assign({}, ISG.depo.kullaniciBul('u-osgb'), { tumIsyerleri: false }));

  /* 22b) Yeni ekranlar: kullanıcı ayrıntısı, işyeri ayrıntısı, işlem geçmişi,
     veri tutarlılığı ve erişim ≠ görevlendirme bloğu çiziliyor. */
  pencere.location.hash = '#sistem';
  ISG.uygulama.ciz();
  var detayDugme = belge.querySelector('#gorunum [data-islem="sistem-kullanici-detay"]');
  ok(!!detayDugme, 'sistem ekranında kullanıcı ayrıntısı düğmesi var');
  if (detayDugme) {
    detayDugme.click();
    var panel = belge.getElementById('sistemKullaniciDetay');
    ok(!!panel, 'kullanıcı ayrıntısı paneli açıldı');
    if (panel) {
      var panelMetni = panel.textContent;
      ok(/Beyan edilen kapsam/.test(panelMetni) && /Fiilî erişim/.test(panelMetni) &&
        /Onay yetkilisi olduğu işyerleri/.test(panelMetni),
        'ayrıntı paneli beyan ile fiilî erişimi ayrı gösteriyor', panelMetni.slice(0, 60));
      panel.querySelector('[data-islem="sistem-kullanici-detay"]').click();
      ok(!belge.getElementById('sistemKullaniciDetay'), 'kullanıcı ayrıntısı paneli kapatılabiliyor');
    }
  }
  var isyeriDetayDugme = belge.querySelector('#gorunum [data-islem="sistem-isyeri-detay"]');
  ok(!!isyeriDetayDugme, 'sistem ekranında işyeri ayrıntısı düğmesi var');
  if (isyeriDetayDugme) {
    isyeriDetayDugme.click();
    ok(!!belge.getElementById('sistemIsyeriDetay'), 'işyeri ayrıntısı paneli açıldı');
    belge.querySelector('#sistemIsyeriDetay [data-islem="sistem-isyeri-detay"]').click();
    ok(!belge.getElementById('sistemIsyeriDetay'), 'işyeri ayrıntısı paneli kapatılabiliyor');
  }
  var sonMetin = String((belge.getElementById('gorunum') || {}).textContent || '');
  ok(/İşlem geçmişi/.test(sonMetin), 'işlem geçmişi bölümü çiziliyor');
  ok(/Veri tutarlılığı/.test(sonMetin), 'veri tutarlılığı bölümü çiziliyor');
  ok(/Erişim ve görevlendirme ayrımı/.test(sonMetin), 'erişim ve görevlendirme ayrımı bölümü çiziliyor');
  ok(/Rol yetkileri/.test(sonMetin) && /Onay yetkilisi eksik işyerleri/.test(sonMetin),
    'mevcut sistem yönetimi bölümleri korunuyor');

  /* 23) Beyan edilen kapsam ile fiilî erişim tek kaynaktan hesaplanır. */
  console.log('\n23) Beyan edilen kapsam = fiilî erişim');
  girisYap(kisitliYonetici);
  ok(ISG.yetki.kapsam().join(',') === ISG.yetki.kullaniciErisim(ISG.yetki.oturum()).join(','),
    'oturum kapsamı ile kullanıcı erişimi aynı sonucu veriyor', ISG.yetki.kapsam().join(','));
  girisYap(ikiIsyeriYoneticisi);
  ok(ISG.yetki.kapsam().join(',') ===
    ISG.yetki.kullaniciErisim(ISG.depo.kullaniciBul('u-iki')).join(','),
    'iki işyerli yöneticide iki hesap aynı', ISG.yetki.kapsam().join(','));
  girisYap(osgbMudur);
  ok(ISG.yetki.kapsam().join(',') ===
    ISG.yetki.kullaniciErisim(ISG.depo.kullaniciBul('u-osgb')).join(','),
    'kurum kapsamlı rolde iki hesap aynı', ISG.yetki.kapsam().join(','));
  girisYap(yonetici);
  ok(ISG.yetki.kapsam().length === ISG.yetki.kullaniciErisim(ISG.depo.kullaniciBul('u1')).length,
    'açık "tüm işyerleri" yetkisinde iki hesap aynı');
  /* Silinmiş işyerine kalan atama erişim üretmez (beyan ≠ fiilî erişim). */
  ISG.depo.kullaniciKaydet(Object.assign({}, ISG.depo.kullaniciBul('u-iki'),
    { isyerleri: ['isyeri-1', 'isyeri-2', 'iy-silinmis'] }));
  ok(ISG.yetki.kullaniciErisim(ISG.depo.kullaniciBul('u-iki')).join(',') === 'isyeri-1,isyeri-2',
    'silinmiş işyerine atama erişim üretmiyor',
    ISG.yetki.kullaniciErisim(ISG.depo.kullaniciBul('u-iki')).join(','));
  ok(/silinmiş işyeri/.test(ISG.yetki.kapsamMetni(ISG.depo.kullaniciBul('u-iki'), ISG.depo.al())),
    'beyan metni silinmiş işyerini işaretliyor');
  ISG.depo.kullaniciKaydet(Object.assign({}, ISG.depo.kullaniciBul('u-iki'),
    { isyerleri: ['isyeri-1', 'isyeri-2'] }));
  ok(ISG.yetki.kullaniciErisim(ISG.depo.kullaniciBul('u-iki')).join(',') === 'isyeri-1,isyeri-2',
    'temizlik sonrası atama korunuyor');

  /* 24) Şifre değiştirme sınırı (2.27.0).
     `depo.sifreGuncelle` alt seviye mutatördür; şifreyi düz metin yazdığı için
     oturum ve kapsam denetiminden geçmelidir. Oturumsuz meşru yol şifre
     sıfırlamadır (bkz. tools/kontrol.js 12d bölümü). */
  console.log('\n24) Şifre değiştirme sınırı');
  const uzmanEposta = 'uzman@test.local';
  const uzmanSifreOnce = ISG.depo.kullaniciEpostaBul(uzmanEposta).sifre;
  if (ISG.yetki.oturum()) { ISG.yetki.oturumKapat(); }
  const oturumsuzSifre = hataMetni(() => ISG.depo.sifreGuncelle(uzmanEposta, 'ele-gecirildi'));
  ok(/oturum/i.test(oturumsuzSifre) && ISG.depo.kullaniciEpostaBul(uzmanEposta).sifre === uzmanSifreOnce,
    'oturum yokken şifre değiştirme reddediliyor ve veri değişmiyor', oturumsuzSifre);

  girisYap(kisitliYonetici);
  const kapsamDisiSifre = hataMetni(() => ISG.depo.sifreGuncelle('sistem@test.local', 'ele-gecirildi'));
  ok(/sistem geneli/.test(kapsamDisiSifre) &&
    ISG.depo.kullaniciEpostaBul('sistem@test.local').sifre === '1234',
    'sınırlı yönetici başka hesabın şifresini değiştiremiyor', kapsamDisiSifre);
  const kendiSifre = ISG.depo.sifreGuncelle('yon@test.local', 'kendi-yeni-1');
  ok(!!kendiSifre && kendiSifre.sifre === 'kendi-yeni-1',
    'oturum sahibi kendi şifresini değiştirebiliyor');
  ISG.depo.sifreGuncelle('yon@test.local', '1234');
  ok(ISG.yetki.denetimListe().some(function (kayit) { return kayit.islem === 'sifreGuncelle'; }),
    'şifre değişikliği denetim izine yazılıyor');

  girisYap(sistemYoneticisi);
  const destekSifre = ISG.depo.sifreGuncelle(uzmanEposta, 'destek-yeni-2');
  ok(!!destekSifre && destekSifre.sifre === 'destek-yeni-2',
    'sistem geneli yetkili yönetici destek amacıyla şifre değiştirebiliyor');
  ISG.depo.sifreGuncelle(uzmanEposta, uzmanSifreOnce);
  ok(ISG.giris.kullaniciDogrula(uzmanEposta, uzmanSifreOnce).id === 'u-uz',
    'geri alınan şifreyle giriş doğrulaması çalışıyor');

  const basarisiz = !!process.exitCode;
  console.log(basarisiz ? 'BAZI YETKİ KAPSAMI TESTLERİ BAŞARISIZ' : 'TÜM YETKİ KAPSAMI TESTLERİ GEÇTİ');
  pencere.close();
  process.exit(basarisiz ? 1 : 0);
})().catch((hata) => {
  console.error('BEKLENMEDIK HATA: ' + ((hata && hata.stack) || hata));
  process.exit(1);
});
