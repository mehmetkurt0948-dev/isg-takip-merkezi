/* ISG Takip Merkezi - Onay kuyrugu arayuz testi.
   Uretimin kendi sayfasi (index.html + assets/js/*.js) jsdom icinde calistirilir;
   kod test icin degistirilmez. Akis: yetkili kullanici korumali degisikligi
   gonderir -> kayidin buluta gidip geldigi (anahtarlar yeniden siralanir,
   esitleme damgasi tazelenir) taklit edilir -> yonetici #onaylar sayfasindaki
   "Onayla" dugmesine basar. Hata bildirimi cikmamali, talep kuyruktan dusmeli
   ve degisiklik kayda yazilmali. Ayni akis tek kaydi olmayan isyeri duzeyi
   toplu eylem icin de denenir. Kayit gercekten degistiyse onay KILITLENMEZ:
   istek uygulanir ve yonetici ayrica uyarilir (uyari karar notunda ve denetim
   kaydinda izlenir).
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

/* ---------- 3) Kayit gercekten degistiyse: onay yine de uygulanir + UYARI ----------
   Surum denetimi onayi kilitlemez (yonetici neyi onayladigini ekranda gorur);
   uyari uretir ve uyari hem karar notuna hem denetim kaydina islenir.
   planDurumDegistir yalnizca durum/tamamlanmaTarihi yazdigi icin diger
   kullanicinin yazdigi "tanim" alani korunur. */
talep = talepOlustur('planDurumDegistir', ['pl-ui-1', 'tamamlandi']);
if (ok(!!talep, 'ikinci durum degisikligi talebi olusturuldu')) {
  const baska = D.al().planlar[0];
  baska.tanim = 'Başka bir kullanıcı yazdı';
  D.kaydet();

  girisYap(yonetici, 'onaylar');
  const bildirim = onayTikla(talep.id);
  ok(bildirim.indexOf('değişmiş') >= 0 && bildirim.indexOf('yine de uygulandı') >= 0,
    'gercek degisiklikte yonetici uyarildi' + (bildirim ? ': ' + bildirim.slice(0, 130) : ''));
  ok(bildirim.toLocaleLowerCase('tr-TR').indexOf('onayland') >= 0,
    'basari bildirimiyle birlikte gosterildi' + (bildirim ? ': ' + bildirim.slice(0, 90) : ''));
  ok((D.talepBul(talep.id) || {}).durum === 'onaylandi', 'cakismaya ragmen talep kapandi');
  ok(/UYARI:/.test(String((D.talepBul(talep.id) || {}).kararNotu || '')),
    'uyari karar notuna islendi');
  ok((D.al().denetim || []).some((kayit) => /UYARI:/.test(String(kayit.ozet || ''))),
    'uyari denetim kaydina islendi');
  ok(D.al().planlar[0].durum === 'tamamlandi', 'talepteki durum kayda yazildi');
  ok(D.al().planlar[0].tanim === 'Başka bir kullanıcı yazdı',
    'diger kullanicinin alani (tanim) korundu');
  ok(!onayDugmesi(talep.id), 'onaylanan talep kuyruktan dustu');
}

/* ---------- 4) Tum kaydin uzerine yazan eylem: kaybolan alan yalnizca uyarida ----------
   personelKaydet kaydin tamamina yazar; talebin payload'inda olmayan alan geri
   yazilir. Bu kabul edilmis bir takastir ve denetim kaydindan geri okunabilir. */
let personelTalep = null;
D.geriYukle(tohum());
girisYap(yetkili, 'panel');
{
  const hedef = Object.assign({}, D.al().personel[0]);
  const sonuc = D.personelKaydet(Object.assign(hedef, { pozisyon: 'Usta başı' }));
  personelTalep = (sonuc && sonuc.talep) || null;
}
if (ok(!!personelTalep, 'personel guncelleme talebi olusturuldu')) {
  const kayit = D.al().personel.filter((p) => p.id === personelTalep.kayitId)[0];
  kayit.gorev = 'Vardiya sorumlusu';
  D.kaydet();

  girisYap(yonetici, 'onaylar');
  const bildirim = onayTikla(personelTalep.id);
  ok(bildirim.indexOf('değişmiş') >= 0,
    'tam uzerine yazan eylemde de uyari var' + (bildirim ? ': ' + bildirim.slice(0, 110) : ''));
  ok((D.talepBul(personelTalep.id) || {}).durum === 'onaylandi', 'talep onaylandi olarak kapandi');
  const bitim = D.al().personel.filter((p) => p.id === personelTalep.kayitId)[0];
  ok(bitim.pozisyon === 'Usta başı', 'talepteki alan yazildi');
  ok(!bitim.gorev, 'talepte olmayan alan geri yazildi (bilinen takas)');
  ok((D.al().denetim || []).some((kayit) => kayit.kayitId === personelTalep.kayitId &&
    /UYARI:/.test(String(kayit.ozet || ''))), 'ezilen alan denetim kaydinda izlendi');
}

/* ---------- 5) Yarimda kalan karar kilidi kuyrugu kilitlemesin ----------
   Onay yarimda kalirsa (sekme kapandi / cihaz dondu) talep "uygulaniyor"da
   kalir. Taze kilit kuyrukta gorunmez (cift onay olmasin); 5 dakikadan eski
   kilit ise kendiliğinden çözülür ve talep yeniden onaylanabilir. */
let kilitTalep = null;
D.geriYukle(tohum());
girisYap(yetkili, 'panel');
{
  const sonuc = D.planDurumDegistir('pl-ui-1', 'tamamlandi');
  kilitTalep = (sonuc && sonuc.talep) || null;
}
if (ok(!!kilitTalep, 'kilit senaryosu talebi oluşturuldu')) {
  D.talepDurum(kilitTalep.id, 'uygulaniyor');
  girisYap(yonetici, 'onaylar');
  ok(!onayDugmesi(kilitTalep.id), 'taze karar kilidi kuyrukta görünmez');

  const yaris = D.talepBul(kilitTalep.id);
  yaris.durumTarihi = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  D.kaydet();
  girisYap(yonetici, 'onaylar');
  ok(!!onayDugmesi(kilitTalep.id), 'bayat karar kilidi yeniden bekleyen sayıldı');
  const kilitleme = onayTikla(kilitTalep.id);
  ok((D.talepBul(kilitTalep.id) || {}).durum === 'onaylandi',
    'bayat kilitli talep onaylanabildi' + (kilitleme ? ': ' + kilitleme.slice(0, 90) : ''));
  ok(D.al().planlar[0].durum === 'tamamlandi', 'bayat kilit sonrasi degisiklik kayda yazildi');
}

console.log('\nBekleme: ' + toplam + ' | basarisiz: ' + basarisiz);
if (basarisiz) { process.exitCode = 1; }

/* Eşitleme yoklamasi (bulut.js setInterval) Node düğümünü açık tuttuğu için
   pencere kapatılır; aksi hâlde test sonuçları basılıp süreç sonlanmaz. */
if (ISG.bulut && typeof ISG.bulut.durdur === 'function') { ISG.bulut.durdur(); }
pencere.close();
