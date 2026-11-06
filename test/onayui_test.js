/* ISG Takip Merkezi - Onay kuyrugu arayuz testi.
   Uretimin kendi sayfasi (index.html + assets/js/*.js) jsdom icinde calistirilir;
   kod test icin degistirilmez. Akis: yetkili kullanici korumali degisikligi
   gonderir -> kayidin buluta gidip geldigi (anahtarlar yeniden siralanir,
   esitleme damgasi tazelenir) taklit edilir -> yonetici #onaylar sayfasindaki
   "Onayla" dugmesine basar. Hata bildirimi cikmamali, talep kuyruktan dusmeli
   ve degisiklik kayda yazilmali. Ayni akis tek kaydi olmayan isyeri duzeyi
   toplu eylem icin de denenir; gercekten degisen kayit ise korunmali.
   Calistirma: node test/onayui_test.js */
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
indexMetni.replace(/<script[^>]+src="(assets\/js\/[^"?]+)/g, function (_eslesme, yol) {
  ISG_SCRIPTLER.push(yol);
  return _eslesme;
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

/* 2) Tohum veri: bir isyeri, iki hesap, bir plan, bir personel. */
const yonetici = ISG.YONETICI_HESAP()[0];
const yetkili = {
  id: 'u-yetkili', adSoyad: 'Yetkili Kişi', eposta: 'yetkili@test.local', sifre: '1402',
  rol: 'yetkili', gorev: 'İSG Uzmanı', isyerleri: ['isyeri-A'], aktif: true, sonGiris: ''
};
function tohum() {
  const veri = ISG.BOS_VERI();
  veri.anaHat = 'onay-ui-testi';
  veri.ayarlar.kurum = 'Test Kurumu';
  veri.isyerleri = [{
    id: 'isyeri-A', ad: 'Askı - 1', kisaAd: 'Askı - 1', kod: 'A',
    aktivite: 'Üretim', tehlikeSinifi: 'Tehlikeli', calisan: 10,
    adres: '', telefon: '', 'e-posta': '', aktiv: true
  }];
  veri.kullanicilar = ISG.YONETICI_HESAP().concat([yetkili]);
  veri.planlar = [{
    id: 'pl-ui-1', isyeriId: 'isyeri-A', tanim: 'Kulaklık dağıtımı',
    odak: 'İSG', kategori: 'Kişisel koruyucu', anaBaslik: 'İSG Faaliyetleri',
    yil: 2026, ay: 11, aylar: [11], baslangicTarihi: '2026-11-01',
    takipTarihi: '2026-11-20', durum: 'yapilacak', tamamlanmaTarihi: null,
    sorumlu: '', sira: 1, aciklama: ''
  }];
  veri.personel = [{
    id: 'p-ui-1', isyeriId: 'isyeri-A', adSoyad: 'Ali Veli', tcKimlik: '',
    pozisyon: 'Operatör', gorev: '', isyeri: 'Üretim', girisTarihi: '2024-01-01',
    aktif: true
  }];
  veri.dosyalar = [];
  veri.tespitler = [];
  veri.talepler = [];
  veri.denetim = [];
  return veri;
}

/* 3) Arayuz yardimcilari. */
function girisYap(kullanici, sayfa) {
  if (ISG.yetki.oturum()) { ISG.yetki.oturumKapat(); }
  pencere.location.hash = '#' + sayfa;
  ISG.yetki.oturumAc(kullanici);
  ISG.uygulama.girisSonrasi();
}
function onayDugmesi(talepId) {
  return belge.querySelector('[data-islem="talep-onayla"][data-id="' + talepId + '"]');
}
function onaySatiri(talepId) {
  const dugme = onayDugmesi(talepId);
  return (dugme && dugme.closest) ? dugme.closest('.onay-satir') : null;
}
function bildirimler() {
  return Array.prototype.slice.call(belge.querySelectorAll('#bildirimler .bildirim'))
    .map((kutu) => (kutu.textContent || '').replace(/\s+/g, ' ').trim());
}
/* Onayla dugmesine tikla ve onay sorusunu evetle; ekrana cikan bildirimleri dondur. */
function onayTikla(talepId) {
  const kap = belge.getElementById('bildirimler');
  if (kap) { kap.innerHTML = ''; }
  const dugme = onayDugmesi(talepId);
  if (!ok(!!dugme, 'onaylama düğmesi kuyrukta görünüyor')) { return ''; }
  ok(!dugme.disabled, 'onaylama düğmesi kilitli değil');
  dugme.click();
  const evet = belge.getElementById('onayEvet');
  if (ok(!!evet, 'onay sorusu açıldı')) { evet.click(); }
  return bildirimler().join(' | ');
}
function hataVar(metin) {
  return metin.indexOf('değişti') >= 0 || metin.indexOf('bulunmuyor') >= 0 ||
    metin.indexOf('onaylanamadı') >= 0;
}
/* Bulut turu: sunucu jsonb anahtarlari yeniden siralar, her yazimda esitleme
   damgasi tazelenir. Icellik aynidir; eskiden bu tek basina onaylari kilitliyordu. */
function sunucuYenidenYaz(koleksiyon, index) {
  const veri = D.al();
  const eski = veri[koleksiyon][index];
  const sirali = {};
  Object.keys(eski).reverse().forEach((alan) => { sirali[alan] = eski[alan]; });
  sirali.guncelleme = new Date(Date.now() + 60000).toISOString();
  veri[koleksiyon][index] = sirali;
  D.kaydet();
}
/* Korumali eylemi yetkili oturumunda calistirir ve olusan talebi dondurur. */
function talepOlustur(eylem, args) {
  D.geriYukle(tohum());
  girisYap(yetkili, 'panel');
  const sonuc = D[eylem].apply(D, args);
  return (sonuc && sonuc.talep) || (D.al().talepler || [])[0] || null;
}


/* ---------- 1) Durum degistirme talebi: anlam ayniysa onaylanmali ---------- */
let talep = talepOlustur('planDurumDegistir', ['pl-ui-1', 'tamamlandi']);
if (ok(!!talep && talep.durum === 'bekliyor', 'durum degisikligi talebi olusturuldu')) {
  ok(talep.kayitId === 'pl-ui-1', 'talep dogru kaydi hedefliyor: ' + talep.kayitId);
  sunucuYenidenYaz('planlar', 0);

  girisYap(yonetici, 'onaylar');
  const satir = onaySatiri(talep.id);
  if (ok(!!satir, 'talep yonetici onay kuyrugunda render edildi')) {
    ok(!satir.querySelector('.onay-degisim'),
      'kayit nesnesi olmayan talepte yaniltici eski/yeni tablosu yok');
    const metin = (satir.textContent || '').replace(/\s+/g, ' ');
    ok(metin.toLocaleLowerCase('tr-TR').indexOf('tamamlan') >= 0,
      'ozet satiri yeni durumu soyluyor: ' + metin.slice(0, 110));
  }

  const bildirim = onayTikla(talep.id);
  ok(!hataVar(bildirim), 'onaylama hatasi yok' + (bildirim ? ' | ' + bildirim : ''));
  ok(bildirim.toLocaleLowerCase('tr-TR').indexOf('onayland') >= 0,
    'basari bildirimi gosterildi' + (bildirim ? ': ' + bildirim.slice(0, 110) : ''));
  ok((D.talepBul(talep.id) || {}).durum === 'onaylandi', 'talep onaylandi durumuna gecti');
  ok(D.al().planlar[0].durum === 'tamamlandi', 'degisiklik plana uygulandi');
  ok(!onayDugmesi(talep.id), 'onaylanan talep kuyruktan dustu');
}

/* ---------- 2) Isyeri duzeyi toplu eylem: tek kayit id si yok ---------- */
/* args[0] kayit degil isyeri kimligidir. Surum denetimi kayit listelerinde
   aradiginda bulamaz ve "Kayit artik bulunmuyor" diyerek Onayla dugmunu
   kilitlerdi; denetim artik isyeri varligina bakiyor. */
talep = talepOlustur('personelTopluEkle',
  ['isyeri-A', [{ adSoyad: 'Yeni İşçi', aktif: true }]]);
if (ok(!!talep, 'toplu personel talebi olusturuldu')) {
  const sayi = D.al().personel.length;
  ok(!talep.kayitId, 'toplu eylem talebi tek kayit hedeflemiyor');
  sunucuYenidenYaz('isyerleri', 0);

  girisYap(yonetici, 'onaylar');
  const bildirim = onayTikla(talep.id);
  ok(!hataVar(bildirim), 'toplu eylemde "kayit bulunmuyor" hatasi yok' +
    (bildirim ? ' | ' + bildirim : ''));
  ok(D.al().personel.length === sayi + 1, 'personel kaydi eklendi');
  ok((D.talepBul(talep.id) || {}).durum === 'onaylandi', 'toplu eylem talebi onaylandi');
}

/* ---------- 3) Kayit gercekten degistiyse koruma calismali ---------- */
talep = talepOlustur('planDurumDegistir', ['pl-ui-1', 'tamamlandi']);
if (ok(!!talep, 'ikinci durum degisikligi talebi olusturuldu')) {
  const baska = D.al().planlar[0];
  baska.tanim = 'Başka bir kullanıcı yazdı';
  D.kaydet();

  girisYap(yonetici, 'onaylar');
  const bildirim = onayTikla(talep.id);
  ok(bildirim.indexOf('değişti') >= 0,
    'gercek degisiklikta kullanici uyariniliyor' + (bildirim ? ': ' + bildirim.slice(0, 130) : ''));
  ok((D.talepBul(talep.id) || {}).durum === 'bekliyor', 'talep kuyrukta kaldi, onaylanmadi');
  ok(D.al().planlar[0].durum !== 'tamamlandi', 'eski degerin uzerine yazilmadi');
  ok(!!onayDugmesi(talep.id), 'onaylama dugmesi hala erisilebilir (kuyruk cozulebilir)');
}

console.log('\nBekleme: ' + toplam + ' | basarisiz: ' + basarisiz);
if (basarisiz) { process.exitCode = 1; }

/* Eşitleme yoklamasi (bulut.js setInterval) Node düğümünü açık tuttuğu için
   pencere kapatılır; aksi hâlde test sonuçları basılıp süreç sonlanmaz. */
if (ISG.bulut && typeof ISG.bulut.durdur === 'function') { ISG.bulut.durdur(); }
pencere.close();
