/* ISG Takip Merkezi — Sağlık Takibi: tam personel listesi, katlanır form,
   düzeltilmiş Excel sekme etiketleri ve sağlık kayıtları Excel içe/dışa aktarma
   testi. Üretimin kendi arayüzü jsdom içinde çalıştırılır; kod test için
   değiştirilmez. Çalıştırma: node test/sagliktoplutest.js */
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
const SCRIPTLER = [];
indexMetni.replace(/<script[^>]+src="(assets\/js\/[^"?]+)/g, (eslesme, yol) => {
  SCRIPTLER.push(yol);
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
if (SCRIPTLER.length < 10) {
  console.error('FAIL: index.html script listesi bulunamadi');
  process.exit(1);
}
SCRIPTLER.forEach((yol) => pencere.eval(dosyaOku(yol)));

const ISG = pencere.ISG;
const belge = pencere.document;

/* Tohum: bir işyeri, üç personel, yönetici oturumu. Sağlık kasası boştur. */
/* Kurulum hesabi kapsamsiz gelir (2.26.0); fikstur acik yetki verir. */
const yonetici = ISG.YONETICI_HESAP()[0];
yonetici.tumIsyerleri = true;
const baslangic = ISG.BOS_VERI();
baslangic.anaHat = 'saglik-toplu-test';
baslangic.ayarlar.kurum = 'Test Kurumu';
baslangic.isyerleri = [{ id: 'iy1', ad: 'Test Tesisi', kod: 'T', tehlikeSinifi: 'Tehlikeli', aktiv: true }];
baslangic.personel = [
  { id: 'p1', sicil: '1', adSoyad: 'Ayşe Demir', isyeriId: 'iy1', gorev: 'Operatör', aktiv: true },
  { id: 'p2', sicil: '2', adSoyad: 'Fatma Şeker', isyeriId: 'iy1', gorev: 'Kalite kontrol', aktiv: true },
  { id: 'p3', sicil: '3', adSoyad: 'Murat Çelik', isyeriId: 'iy1', gorev: 'Depo görevlisi', aktiv: true }
];
baslangic.kullanicilar = [yonetici];
baslangic.denetim = [];
ISG.depo.geriYukle(baslangic);

function giris() {
  if (ISG.yetki.oturum()) { ISG.yetki.oturumKapat(); }
  pencere.location.hash = '#saglik';
  ISG.yetki.oturumAc(yonetici);
  ISG.uygulama.girisSonrasi();
}
const sayfa = () => belge.querySelector('.saglik-sayfa');
const kadroSatirlari = () => Array.prototype.slice.call(
  belge.querySelectorAll('#saglik-kisi-tablo > tbody > tr'));
const kayitSatirlari = () => Array.prototype.slice.call(
  belge.querySelectorAll('#saglik-kayit-tablo > tbody > tr'));
const saglikFormu = () => belge.getElementById('saglik-form');
function kayitGonder(veri) {
  const form = saglikFormu();
  if (!ok(!!form, 'sağlık formu arayüzde')) { return false; }
  Object.keys(veri).forEach((ad) => {
    if (form.elements[ad]) { form.elements[ad].value = veri[ad]; }
  });
  form.dispatchEvent(new pencere.Event('submit', { bubbles: true, cancelable: true }));
  return true;
}
function kayitBul(personelId) {
  return ISG.saglikTakip.listele('', '').filter((k) => k.personelId === personelId)[0] || null;
}
function bosSatir(sicil, adSoyad, tarih) {
  const satir = new Array(ISG.saglikToplu.BASLIKLAR.length).fill('');
  satir[0] = sicil; satir[1] = adSoyad; satir[2] = tarih;
  satir[3] = 'Dr. Test'; satir[4] = 'ÇALIŞMASI UYGUNDUR';
  return satir;
}

(async function main() {
  giris();
  ok(!!sayfa(), 'sağlık sayfası render ediliyor');

  /* 1) Tam personel listesi: kaydı olmayanlar da görünür. */
  ok(!!belge.getElementById('saglik-kisi-kart'), 'personel listesi kartı basılıyor');
  ok(kadroSatirlari().length === 3, 'üç personel listeleniyor (muayene kaydı olmasa da)');
  ok(belge.getElementById('saglik-kisi-tablo').textContent.indexOf('MUAYENE YOK') > -1,
    'kaydı olmayan personel "MUAYENE YOK" rozetiyle izleniyor');
  ok(belge.querySelectorAll('#saglik-kisi-tablo [data-islem="saglik-kisi-ekle"]').length === 3,
    'her personel için "Muayene ekle" düğmesi var');
  ok(belge.querySelectorAll('#saglik-kisi-tablo [data-islem="saglik-kisi-gecmis"]').length === 0,
    'kaydı olmayanda geçmiş düğmesi yok');

  /* 2) Giriş formu katlanır panelde ve üç alan grubunda. */
  const girisPaneli = belge.getElementById('saglik-giris');
  ok(!!girisPaneli && girisPaneli.tagName === 'DETAILS', 'giriş formu katlanır panelde');
  ok(!!girisPaneli && girisPaneli.open === false, 'panel varsayılan olarak kapalı');
  const gruplar = belge.querySelectorAll('#saglik-form fieldset.saglik-grup');
  ok(gruplar.length === 3, 'form üç alan grubuna ayrılmış (' + gruplar.length + ')');
  const form = saglikFormu();
  ok(!!form && form.elements.personelId.tagName === 'SELECT', 'personel serbest metin değil, seçim listesi');
  ok(!!form && form.elements.isyeriId.tagName === 'SELECT', 'işyeri seçim listesi');
  ok(!!form && form.elements.personelId.options.length === 4, 'personel seçenekleri: 3 kişi + boş');
  ok(!!belge.querySelector('#saglik-form [data-islem="saglik-vazgec"]'), 'vazgeç düğmesi formda');
  ok(belge.querySelectorAll('#saglik-kayit-kart [data-islem="saglik-yeni"]').length === 1,
    'kayıt kartında "Yeni kayıt" düğmesi');

  /* 3) Muayene ekle: panel açılır, kişi ve işyeri önceden seçili gelir. */
  belge.querySelector('#saglik-kisi-tablo [data-islem="saglik-kisi-ekle"][data-id="p2"]').click();
  ok(belge.getElementById('saglik-giris').open === true, 'muayene ekle paneli açıyor');
  ok(saglikFormu().elements.personelId.value === 'p2', 'seçilen personel formda hazır');
  ok(saglikFormu().elements.isyeriId.value === 'iy1', 'personelin işyeri otomatik seçildi');

  /* 4) Kayıt eklenince personel listesi güncellenir. */
  kayitGonder({ personelId: 'p1', isyeriId: 'iy1', tarih: '2026-01-10', sonMuayene: 'Görme muayenesi uygun' });
  const k1 = kayitBul('p1');
  ok(!!k1 && k1.tarih === '2026-01-10', 'formdan sağlık kaydı eklendi');
  ok(belge.getElementById('saglik-giris').open === false, 'kayıttan sonra panel kapanıyor');
  const kadroP1 = belge.getElementById('saglik-kisi-tablo').textContent;
  ok(kadroP1.indexOf('UYGUN') > -1 && kadroP1.indexOf('10.01.2026') > -1,
    'personel listesinde son muayene ve durum görünüyor');
  ok(kayitSatirlari().length === 1, 'muayene kayıtları tablosunda tek kayıt');

  /* 5) Excel çalışma kitabı: sekme etiketleri nesne değil AD olarak basılır. */
  const sekmeAdlari = ['TAM LİSTE', 'YÜKSEK RİSKLİ MESLEKLER', 'ÇALIŞMASI UYGUN DEĞİLDİR',
    'SAĞLIK TARAMALARI EKSİK OLANLAR', 'MALULİYETİ OLANLAR'];
  const sekmeler = sekmeAdlari.map(function (ad, i) {
    const satirlar = [['Sicil', 'Ad Soyad', 'Tarih']];
    const adet = i === 0 ? 60 : 1;
    for (let j = 0; j < adet; j += 1) { satirlar.push([String(j + 1), 'Kişi ' + (j + 1), '2026-01-01']); }
    return { ad: ad, satirlar: satirlar };
  });
  /* Kayıt işyerine bağlanır: kitap yalnızca seçili işyerinde okunur. */
  ISG.depo.saglikCalismaKitabiKaydet('iy1', {
    dosyaAdi: 'test.xlsx', yuklemeTarihi: new Date().toISOString(),
    sifreli: ISG.saglikTakip.sifrele(JSON.stringify(sekmeler))
  });
  giris();
  ISG.ui.kapsam = 'iy1';
  ISG.uygulama.ciz();
  const sekmeMetni = belge.querySelector('.saglik-sayfa .sekme-satir').textContent;
  ok(sekmeMetni.indexOf('[object Object]') < 0, 'sekme etiketlerinde "[object Object]" yok');
  ok(sekmeMetni.indexOf('TAM LİSTE') > -1 && sekmeMetni.indexOf('MALULİYETİ OLANLAR') > -1,
    'beş sekme adı okunuyor');
  const ilkSekme = belge.querySelector('.saglik-sayfa [data-islem="saglik-liste-sekme"][data-sekme="0"]');
  ok(!!ilkSekme && ilkSekme.textContent.indexOf('60') > -1, 'sekme sayacı başlık satırını saymıyor (60)');
  ok(belge.querySelectorAll('#saglik-kitap-tablo > tbody > tr').length === 50,
    'çalışma kitabı 50 satırla sayfalanıyor');
  belge.querySelector('[data-sayfa-anahtar="saglikKitapSayfa"] [data-sayfa-git="2"]').click();
  ok(belge.querySelectorAll('#saglik-kitap-tablo > tbody > tr').length === 10,
    'ikinci sayfada kalan 10 satır');

  /* 6) Şablon ve dışa aktarma sayfaları. */
  const sablon = ISG.saglikToplu.sablonSayfalar();
  ok(sablon.length === 2 && sablon[0].ad === 'Sağlık Kayıtları', 'şablon iki sayfalı');
  ok(sablon[0].basliklar[2] === 'Muayene Tarihi' && sablon[0].satirlar.length === 1,
    'şablonda zorunlu sütun ve örnek satır var');
  const disa = ISG.saglikToplu.disaAktarSayfalar(ISG.saglikTakip.listele('', ''), baslangic.personel);
  ok(disa[0].basliklar[disa[0].basliklar.length - 1] === 'İşyeri',
    'dışa aktarmada işyeri bilgi sütunu');
  ok(ISG.saglikToplu.tarihCoz('10.02.2026') === '2026-02-10', 'GG.AA.YYYY tarihi çözülüyor');

  /* 7) İçe aktarma analizi: kişi eşleştirme, tarih, mükerrer ve hata. */
  const baslik = ISG.saglikToplu.BASLIKLAR.slice();
  const ham = [baslik,
    bosSatir('2', 'Fatma Şeker', '10.02.2026'),
    bosSatir('', 'Murat Çelik', '2026-03-01'),
    bosSatir('3', '', '2026-03-01'),
    bosSatir('9999', 'Yok Kişi', '2026-04-01'),
    bosSatir('1', 'Ayşe Demir', '')];
  let analiz = ISG.saglikToplu.analizEt(ham, { mevcut: ISG.saglikTakip.listele('', '') });
  ok(!analiz.hata, 'analiz başlık satırını buluyor');
  ok(analiz.ozet.dosyaSatir === 5, 'beş veri satırı okunuyor');
  ok(analiz.ozet.hazir === 2 && analiz.ozet.mukerrer === 1 && analiz.ozet.hatali === 2,
    'hazır/mükerrer/hatalı sayıları doğru');
  const hataNeden = analiz.satirlar.filter((s) => s.durum === 'hata').map((s) => s.mesaj).join(' | ');
  ok(/Personel bulunamadı/.test(hataNeden) && /Muayene tarihi/.test(hataNeden),
    'hata nedenleri satır bazında yazılıyor');
  const yazim = ISG.saglikToplu.uygula(analiz);
  ok(yazim.eklenen === 2 && yazim.hatali === 0, 'onaylı iki satır kaydedildi');
  ok(!!kayitBul('p2') && !!kayitBul('p3'), 'iki personelin kaydı oluştu');
  analiz = ISG.saglikToplu.analizEt(ham, { mevcut: ISG.saglikTakip.listele('', '') });
  ok(analiz.ozet.hazir === 0 && analiz.ozet.mukerrer === 3,
    'tekrar yüklemede mükerrerler atlanıyor');

  /* 8) Arayüz akışı: ön izleme diyaloğu ve onaydan sonra yazma. */
  giris();
  const oncekiSayi = ISG.saglikTakip.listele('', '').length;
  ISG.uygulama.saglikTopluOnizle([baslik.slice(), bosSatir('1', 'Ayşe Demir', '2026-05-05')], 'test-ice.xlsx');
  ok(belge.getElementById('saglikTopluDiyalog').open === true, 'içe aktarma ön izleme diyaloğu açılıyor');
  const ozetMetni = belge.getElementById('saglikTopluOzet').textContent;
  ok(ozetMetni.indexOf('Kaydedilecek') > -1, 'diyalogda kaydedilecek sayısı var');
  ok(belge.getElementById('saglikTopluOnizleme').textContent.indexOf('Ayşe Demir') > -1,
    'ön izlemede kişi adı görünüyor');
  belge.getElementById('saglikTopluForm')
    .dispatchEvent(new pencere.Event('submit', { bubbles: true, cancelable: true }));
  ok(ISG.saglikTakip.listele('', '').length === oncekiSayi + 1, 'onaydan sonra kayıt yazıldı');
  ok(belge.getElementById('saglikTopluDiyalog').open === false, 'işlemden sonra diyalog kapandı');
  ok(ISG.uygulama.saglikTopluDurum() === null, 'ön izleme durumu temizlendi');

  /* 9) Sayfada ham değer sızıntısı yok; şablon gerçek XLSX olarak yazılıp
     yeniden okunabiliyor (CDN'siz, tarayıcı içi üretici). */
  const sayfaMetni = sayfa().textContent;
  ok(!/undefined|NaN|\[object Object\]/.test(sayfaMetni), 'sayfada undefined/NaN/[object Object] yok');
  const sablonBayt = ISG.excel.xlsxYaz(ISG.saglikToplu.sablonSayfalar());
  const sablonOkunan = await ISG.excel.oku(sablonBayt);
  ok(sablonOkunan.length === 2, 'şablon iki sayfalı XLSX olarak yazıldı');
  ok(!!sablonOkunan[0] && sablonOkunan[0].satirlar[0][2] === 'Muayene Tarihi',
    'yazılan şablon yeniden okunuyor (sütun başlığı doğru)');
  const disaBayt = ISG.excel.xlsxYaz(ISG.saglikToplu.disaAktarSayfalar(
    ISG.saglikTakip.listele('', ''), baslangic.personel));
  const disaOkunan = await ISG.excel.oku(disaBayt);
  ok(!!disaOkunan[0] && disaOkunan[0].satirlar.length >= 2,
    'dışa aktarma dosyası yeniden okunabiliyor');

  const basarisiz = !!process.exitCode;
  console.log(basarisiz ? 'BAZI SAĞLIK TOPLU TESTLERİ BAŞARISIZ' : 'TÜM SAĞLIK TOPLU TESTLERİ GEÇTİ');
  pencere.close();
  process.exit(basarisiz ? 1 : 0);
})();
