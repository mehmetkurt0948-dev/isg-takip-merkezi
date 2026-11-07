/* ISG Takip Merkezi - Kullanici yonetimi entegrasyon testi.
   Uretimin kendi arayuzu (index.html + assets/js/*.js) jsdom icinde calistirilir;
   hicbir kod test icin degistirilmez. Akis: yonetici girisi -> ekip sayfasi ->
   diyalog -> form gonderme -> depo/denetim dogrulama.
   Calistirma: node test/kullanicitest.js */
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
/* Uretim sayfasi hangi sirada yukluyorsa test de ayni sirayla yukler. */
const ISG_SCRIPTLER = [];
indexMetni.replace(/<script[^>]+src="(assets\/js\/[^"?]+)/g, function (_eslesme, yol) {
  ISG_SCRIPTLER.push(yol);
  return _eslesme;
});

/* 0) Davet mantigi kaldirilmali. */
const varsayilanMetni = dosyaOku('assets/js/varsayilan-veri.js');
const depoMetni = dosyaOku('assets/js/depo.js');
const uygulamaMetni = dosyaOku('assets/js/uygulama.js');
if (/davet/i.test(varsayilanMetni + depoMetni + uygulamaMetni)) {
  console.error('FAIL: davet mantigi hala bulunuyor (varsayilan-veri/depo/uygulama)');
  process.exit(1);
}

/* 1) Uygulama yukleniyor */
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
if (ISG_SCRIPTLER.length < 10) {
  console.error('FAIL: index.html script listesi bulunamadi');
  process.exit(1);
}
ISG_SCRIPTLER.forEach((yol) => pencere.eval(dosyaOku(yol)));

const ISG = pencere.ISG;
const belge = pencere.document;
const form = belge.getElementById('kullaniciForm');
/* Kaynak: onceden tanimli yonetici hesabi (varsayilan-veri.js).
   Kurulum hesabi kapsamsiz gelir (2.26.0); test fiksturu bu hesaba "tum
   isyerleri" yetkisini ACIKCA verir. Yetki rolden turetilmez. */
const yonetici = ISG.YONETICI_HESAP()[0];
yonetici.tumIsyerleri = true;

/* Test tohumi: yayindaki bos veri + iki isyeri (onceden tanimli yonetici dahil) */
const baslangic = ISG.BOS_VERI();
baslangic.anaHat = 'test';
baslangic.ayarlar.kurum = 'Test Kurumu';
baslangic.isyerleri = [
  { id: 'isyeri-A', ad: 'A Tesisi', kod: 'A', aktivite: 'Üretim', tehlikeSinifi: 'Tehlikeli', calisan: 10, adres: 'Test adresi', telefon: '', 'e-posta': '', aktiv: true },
  { id: 'isyeri-B', ad: 'B Tesisi', kod: 'B', aktivite: 'Depo', tehlikeSinifi: 'Az Tehlikeli', calisan: 5, adres: '', telefon: '', 'e-posta': '', aktiv: true }
];
baslangic.kullanicilar = [yonetici];
baslangic.denetim = [];

ISG.depo.geriYukle(baslangic);
pencere.location.hash = '#ekip';
const aktifOturum = ISG.yetki.oturumAc(yonetici);
ISG.uygulama.girisSonrasi();
if (!aktifOturum) {
  console.error('FAIL: Yonetici oturumu acilamadi, test devam edemiyor');
  process.exit(1);
}

/* yardimcilar */
const alan = (ad) => form.elements[ad];
const deger = (ad) => String((alan(ad) || {}).value || '');
function kullaniciBul(eposta) {
  return (ISG.depo.al().kullanicilar || []).find((k) => k.eposta === eposta);
}
function dugme(islem, id) {
  const secici = '[data-islem="' + islem + '"]' + (id ? '[data-id="' + id + '"]' : '');
  return belge.querySelector(secici);
}
function tikla(islem, id) {
  const hedef = dugme(islem, id);
  const bulundu = ok(!!hedef, islem + ' dugmesi arayuzde');
  if (!bulundu) { return false; }
  hedef.click();
  return true;
}
function kaydet() {
  form.dispatchEvent(new pencere.Event('submit', { bubbles: true, cancelable: true }));
}
function isyeriKutulari() {
  return Array.prototype.slice.call(belge.querySelectorAll('#kullaniciIsyerleri .kullanici-isyeri'));
}
function isaretle(degerKutusu, isaretli) {
  const kutu = belge.querySelector('#kullaniciIsyerleri .kullanici-isyeri[value="' + degerKutusu + '"]');
  if (kutu) {
    kutu.checked = !!isaretli;
    /* Gercek tiklama: "Tum isyerleri" kutusu digerin pasifligini bu olayla senkronlar. */
    kutu.dispatchEvent(new pencere.Event('change', { bubbles: true }));
  }
  return !!kutu;
}
function seciliKapsam() {
  return isyeriKutulari().filter((k) => k.checked && k.value !== '__tumu').map((k) => k.value);
}
function uyariMetni() {
  const u = belge.getElementById('kullaniciUyari');
  return (!u || u.hidden) ? '' : String(u.textContent).trim();
}
function denetimKaydi(islem) {
  return (ISG.yetki.denetimListe() || []).find((k) => k.islem === islem);
}

/* 2) Yonetici yeni kullanicinin kimlik + gorev + yetki + sifresini girer */
ok(!!yonetici && ISG.yetki.rolTanimi(yonetici.rol).yonetir, 'Yonetici hesabi varsayilan veride hazir');
ok((ISG.depo.al().kullanicilar || []).length === 1 && !!kullaniciBul(yonetici.eposta),
  'Kullanici kaynagi yalnizca onceden tanimli yoneticiyi iceriyor');

ok(tikla('kullanici-yeni'), 'Yeni kullanici dugmesiyle diyalog aciliyor');
ok(deger('eposta') === '' && deger('gorev') === '' && deger('adSoyad') === '',
  'Diyalog bos formla acilir');
ok(isyeriKutulari().length === baslangic.isyerleri.length + 1 && seciliKapsam().length === 0,
  'Hicbir isyeri kutusu secili degil ("Tum isyerleri" kutusu dahil)');
ok(!!alan('sifre') && !!belge.getElementById('kullaniciIsyerleri'),
  'Isyeri yetki kutulari ve sifre alani diyalogda gorunuyor');

alan('adSoyad').value = 'Test Kullanıcısı';
alan('eposta').value = 'Test.Kullanicisi@Site.Local';
alan('gorev').value = 'İş güvenliği uzmanı';
alan('rol').value = 'yetkili';
alan('sifre').value = 'Test1234';
isaretle('isyeri-A', true);
isaretle('isyeri-B', true);
kaydet();

const eposta = 'test.kullanicisi@site.local';
const kayit = kullaniciBul(eposta);
ok(!!kayit, 'Kimlik bilgileri kaydedildi (buyuk/kucuk harf normalize edildi)');
ok(!!kayit && kayit.gorev === 'İş güvenliği uzmanı' && kayit.rol === 'yetkili',
  'Gorev ve rol kaydi dogru');
ok(!!kayit && !!kayit.olusturma && !kayit.sonGiris, 'Kayit tarihi set, sonGiris yok');
ok(!!kayit && kayit.tumIsyerleri === false &&
  JSON.stringify((kayit.isyerleri || []).slice().sort()) === JSON.stringify(['isyeri-A', 'isyeri-B']),
  'Isyeri yetkileri (A ve B) kaydedildi');

/* 3) Sifre modu: yalnizca sifre degisir, kimlik/gorev/yetki sabit kalir */
ok(tikla('kullanici-sifre', kayit && kayit.id), 'Sifre ver dugmesiyle sifre modu aciliyor');
const baslik = belge.getElementById('kullaniciBaslik').textContent;
ok(/ifre/.test(baslik), 'Diyalog basligi sifre moduna dondu: ' + baslik);
ok(alan('adSoyad').disabled && alan('gorev').disabled,
  'Sifre modunda kimlik/gorev alanlari pasif');
ok(isyeriKutulari().every((k) => k.disabled), 'Sifre modunda tum isyeri kutulari pasif');
ok(deger('eposta') === eposta, 'Sifre modunda mevcut e-posta gosteriliyor');
alan('sifre').value = 'YeniSifre9';
kaydet();
const sonra = kullaniciBul(eposta);
ok(!!sonra && sonra.sifre === 'YeniSifre9', 'Sifre modu sifreyi guncelledi');
ok(!!sonra && sonra.eposta === eposta && sonra.gorev === 'İş güvenliği uzmanı' &&
  sonra.rol === 'yetkili' && sonra.tumIsyerleri === false &&
  JSON.stringify((sonra.isyerleri || []).slice().sort()) === JSON.stringify(['isyeri-A', 'isyeri-B']),
  'Sifre modunda ad, gorev, rol ve isyeri yetkileri korundu');

/* 4) Tam duzenleme modu: gorev + isyeri yetkisi guncellenir */
ok(tikla('kullanici-duzenle', kayit && kayit.id), 'Duzenle dugmesiyle tam duzenleme modu aciliyor');
ok(!alan('eposta').disabled && !alan('gorev').disabled,
  'Duzenleme modunda alanlar aktif');
ok(deger('gorev') === 'İş güvenliği uzmanı' && seciliKapsam().length === 2,
  'Mevcut degerler kutulara yuklendi');
alan('gorev').value = 'Saha sorumlusu';
isaretle('isyeri-A', false);
isaretle('isyeri-B', true);
isaretle('__tumu', true);
kaydet();
const duzenlenen = kullaniciBul(eposta);
ok(!!duzenlenen && duzenlenen.gorev === 'Saha sorumlusu', 'Gorev guncellendi');
ok(!!duzenlenen && duzenlenen.tumIsyerleri === true, '"Tum isyerleri" secimi kaydedildi');

/* 5) Ekip sayfasi listesi ve yonetici disi gorunum */
ISG.uygulama.ciz();
const yoneticiHtml = belge.getElementById('gorunum').innerHTML;
ok(/Test Kullan/.test(yoneticiHtml) && /kullanici-yeni/.test(yoneticiHtml),
  'Ekip sayfasi kullanicilari ve "Yeni kullanici" dugmesini ciziyor');
ok(!/data-islem="[^"]*davet/i.test(yoneticiHtml) && !/name="[^"]*davet/i.test(yoneticiHtml) &&
  /kendi kendine kay[iı]t yoktur/i.test(yoneticiHtml),
  'Ekip sayfasi davet kodu / kendi kendine kayit mekanizmasi icermiyor');

const izleyici = ISG.depo.kullaniciKaydet({
  adSoyad: 'Izleyici Kisi', eposta: 'izleyici@site.local', gorev: 'Rapor okuyucu',
  rol: 'goruntuleyici', aktif: true, isyerleri: ['isyeri-A'], tumIsyerleri: false
});
ISG.yetki.oturumAc(izleyici);
const izleyiciHtml = ISG.sayfalar.ekip(ISG.depo.al());
ok(!/kullanici-yeni/.test(izleyiciHtml) && /ba.vurun/i.test(izleyiciHtml),
  'Yonetici olmayan "Yeni kullanici" dugmesini goremez');
ok(/Test Kullan/.test(izleyiciHtml), 'Yonetici olmayan ekip listesini goruntuleyebilir');
ISG.yetki.oturumAc(yonetici);

/* 6) Benzersiz e-posta kontrolu (buyuk/kucuk harf farkiyla da engellenir) */
ok(tikla('kullanici-yeni'), 'Cakisma testi icin diyalog tekrar aciliyor');
alan('adSoyad').value = 'Diger Kisi';
alan('eposta').value = 'TEST.KULLANICISI@SITE.LOCAL';
alan('gorev').value = 'Uzman';
alan('sifre').value = 'Diger1234';
isaretle('__tumu', true);
kaydet();
ok(!!uyariMetni(), 'Ayni e-posta ile ikinci kayit reddedildi: ' + uyariMetni());
ok((ISG.depo.al().kullanicilar || []).filter((k) => k.eposta === eposta).length === 1,
  'Kayit sayisi artmadi');
const kalan = kullaniciBul(eposta);
ok(!!kalan && kalan.gorev === 'Saha sorumlusu',
  'Mevcut kullanicinin gorevi korunuyor');
tikla('kullanici-duzenle', kalan && kalan.id);
alan('gorev').value = 'Kismi yetkili';
alan('rol').value = 'goruntuleyici';
isaretle('__tumu', false);
/* Uygulama davranisi: "Tum isyerleri" kaldirilinca tek tek isaretler secili kalir,
   yalnizca pasiflik kaldirilir. Kapsami daraltmak icin her kutunun ayarlanmasi gerekir. */
ok(seciliKapsam().length === 2,
  '"Tum isyerleri" kaldirilinca tek tek isaretler korunuyor (pasiflik kaldiriliyor)');
isaretle('isyeri-B', false);
isaretle('isyeri-A', true);
ok(JSON.stringify(seciliKapsam()) === JSON.stringify(['isyeri-A']),
  'Kapsam arayuzden tek isyerine daraltildi');
kaydet();
const kismi = kullaniciBul(eposta);
ok(!!kismi && kismi.rol === 'goruntuleyici' && kismi.gorev === 'Kismi yetkili' &&
  kismi.tumIsyerleri === false &&
  JSON.stringify((kismi.isyerleri || []).slice().sort()) === JSON.stringify(['isyeri-A']),
  'Kismi yetki duzenlemesi kaydedildi: ' +
  JSON.stringify(kismi && { rol: kismi.rol, gorev: kismi.gorev, tumIsyerleri: kismi.tumIsyerleri, isyerleri: kismi.isyerleri }) +
  ' | uyari: ' + uyariMetni());

/* 7) Rol bazli erisim: yonetici olmayan kullanici olusturamaz/silemez */
ISG.yetki.oturumAc(izleyici);
let rbacKayit = '', rbacSilme = '';
try { ISG.depo.kullaniciKaydet({ adSoyad: 'Yetkisiz', eposta: 'yetkisiz@site.local', rol: 'yonetici', sifre: 'x1234', aktif: true, isyerleri: [], tumIsyerleri: true }); }
catch (e) { rbacKayit = String(e.message); }
let olusanMi = !!kullaniciBul('yetkisiz@site.local');
try { ISG.depo.kullaniciSil(kismi && kismi.id); } catch (e) { rbacSilme = String(e.message); }
ok(/y[oö]netici/i.test(rbacKayit) && !olusanMi, 'Olusturma reddedildi (RBAC): ' + rbacKayit);
ok(/y[oö]netici/i.test(rbacSilme) && !!kullaniciBul(eposta), 'Silme reddedildi (RBAC): ' + rbacSilme);

/* 8) Silme + denetim kaydi */
ISG.yetki.oturumAc(yonetici);
const denetimOnce = (ISG.yetki.denetimListe() || []).length;
ISG.uygulama.ciz();
ok(tikla('kullanici-sil', kismi && kismi.id), 'Sil dugmesi arayuzde');
const onay = belge.getElementById('onayEvet');
if (onay) { onay.click(); }
ok(!kullaniciBul(eposta), 'Kullanici arayuzden silindi');
ok((ISG.depo.al().kullanicilar || []).length === 2,
  'Silme sonrasi yonetici + izleyici kaldi');

const denetimler = ISG.yetki.denetimListe() || [];
const denetimEkleme = denetimler.filter((k) => k.islem === 'kullaniciKaydet' &&
  /Test Kullan/.test(String(k.ozet || '')));
const denetimSilme = denetimler.find((k) => k.islem === 'kullaniciSil' &&
  k.hedefKullanici === (kismi && kismi.id));
ok(denetimler.length > denetimOnce, 'Islemler denetim kaydi uretiyor');
ok(denetimEkleme.length >= 2 && denetimEkleme.every((k) => k.kullaniciAd === yonetici.adSoyad),
  'Ekleme ve duzenleme yonetici adi + etkilenen kullaniciyla loglandi');
ok(!!denetimSilme, 'Silme islemi etkilenen kullaniciyla loglandi: ' +
  JSON.stringify(denetimSilme && denetimSilme.ozet));

console.log('\n' + (process.exitCode ? 'TESTLER BASARISIZ' : 'TUM TESTLER GECTI'));
pencere.close(); /* jsdom zamanlayicilari process'i ayakta tutmasin */
process.exit(process.exitCode || 0);
