/* ISG Takip Merkezi - Personel Saglik Takibi entegrasyon testi.
   Uretimin kendi arayuzu (index.html + assets/js/*.js) jsdom icinde calistirilir;
   hicbir kod test icin degistirilmez. Akis: yonetici girisi -> saglik sayfasi ->
   formdan sevk (sevkEdilen) + calisma yasagi (calismaYasagi) kaydi -> sutun/rozet/
   sekme sayaclari -> detay satiri -> duzenleme -> arama -> rol kisitlari -> silme ->
   silinen personel/isyerinde muayene kaydinin korunmasi (dondurulmus etiket + rozet).
   Calistirma: node test/sagliktest.js */
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
if (!ISG.saglikCalismaKitabi && fs.existsSync(path.join(KOK, 'assets/js/saglik-calisma-kitabi.js'))) {
  pencere.eval(dosyaOku('assets/js/saglik-calisma-kitabi.js'));
}

/* 2) Test tohumu: iki isyeri, uc personel, uc rol (yayindaki bos veri uzerine). */
const yonetici = ISG.YONETICI_HESAP()[0];
const yetkili = {
  id: 'u-uzman', adSoyad: 'Uzman Deniz Yilmaz', eposta: 'uzman@site.local', sifre: '1234',
  gorev: 'İş güvenliği uzmanı', rol: 'yetkili', isyerleri: ['isyeri-A'], aktiv: true
};
const goruntuleyici = {
  id: 'u-gozetmen', adSoyad: 'Gozetmen Ali Kaya', eposta: 'gozetmen@site.local', sifre: '1234',
  gorev: 'Destek personeli', rol: 'goruntuleyici', isyerleri: [], aktiv: true
};
const baslangic = ISG.BOS_VERI();
baslangic.anaHat = 'test';
baslangic.ayarlar.kurum = 'Test Kurumu';
baslangic.isyerleri = [
  { id: 'isyeri-A', ad: 'A Tesisi', kod: 'A', tehlikeSinifi: 'Tehlikeli', aktiv: true },
  { id: 'isyeri-B', ad: 'B Tesisi', kod: 'B', tehlikeSinifi: 'Az Tehlikeli', aktiv: true }
];
baslangic.personel = [
  { id: 'p1', sicil: 'S-001', adSoyad: 'Ayşe Demir', isyeriId: 'isyeri-A', gorev: 'Operatör', aktiv: true },
  { id: 'p2', sicil: 'S-002', adSoyad: 'Fatma Şeker', isyeriId: 'isyeri-A', gorev: 'Kalite kontrol', aktiv: true },
  { id: 'p3', sicil: 'S-003', adSoyad: 'Murat Çelik', isyeriId: 'isyeri-B', gorev: 'Depo görevlisi', aktiv: true }
];
baslangic.kullanicilar = [yonetici, yetkili, goruntuleyici];
baslangic.denetim = [];
ISG.depo.geriYukle(baslangic);

/* yardimcilar */
const sayfa = () => belge.querySelector('.saglik-sayfa');
const govde = () => (sayfa() ? sayfa().innerHTML : '');
const satirlar = () => Array.prototype.slice.call(belge.querySelectorAll('.saglik-sayfa tbody tr'))
  .filter((t) => String(t.className).indexOf('saglik-detay') < 0 && !t.querySelector('.bos-durum'));
function ayrinti(etiket, deger) {
  if (process.env.SAGLIK_DEBUG) {
    console.log('  . [' + etiket + '] ' + String(deger).replace(/\s+/g, ' ').slice(0, 400));
  }
}
function satirMetni(ad) {
  const t = satirlar().filter((x) => x.textContent.indexOf(ad) >= 0)[0];
  return t ? t.textContent : '';
}
function sekmeSayi(id) {
  const b = belge.querySelector('.saglik-sayfa [data-sekme="' + id + '"] b');
  return b ? Number(String(b.textContent).replace(/\D/g, '')) : -1;
}
function dugme(islem, id) {
  return belge.querySelector('[data-islem="' + islem + '"]' + (id ? '[data-id="' + id + '"]' : ''));
}
function tikla(islem, id) {
  const hedef = dugme(islem, id);
  const bulundu = ok(!!hedef, islem + (id ? ' [' + id + ']' : '') + ' düğmesi arayüzde');
  if (!bulundu) { return false; }
  hedef.click();
  return true;
}
function tiklaSekme(sekme) {
  const hedef = belge.querySelector('.saglik-sayfa [data-islem="saglik-sekme"][data-sekme="' + sekme + '"]');
  const bulundu = ok(!!hedef, sekme + ' sekmesi arayüzde');
  if (!bulundu) { return false; }
  hedef.click();
  return true;
}
const saglikFormu = () => belge.getElementById('saglik-form');
function kayitGonder(veri) {
  const form = saglikFormu();
  if (!ok(!!form, 'saglik kayit formu arayuzde')) { return false; }
  Object.keys(veri).forEach((ad) => {
    if (form.elements[ad]) { form.elements[ad].value = veri[ad]; }
  });
  form.dispatchEvent(new pencere.Event('submit', { bubbles: true, cancelable: true }));
  return true;
}
function kayitBul(personelId) {
  return ISG.saglikTakip.listele('', '').filter((k) => k.personelId === personelId)[0] || null;
}
const bekle = () => new Promise((cize) => setTimeout(cize, 320));
function girisYap(kullanici) {
  if (ISG.yetki.oturum()) { ISG.yetki.oturumKapat(); }
  pencere.location.hash = '#saglik';
  ISG.yetki.oturumAc(kullanici);
  ISG.uygulama.girisSonrasi();
}

/* 3) Yönetici girisi ve sayfa açilisi. */
(async function main() {
  girisYap(yonetici);
  ok(!!sayfa(), 'saglik sayfasi render ediliyor');
  ok(belge.querySelectorAll('.saglik-sayfa [data-islem="saglik-liste-sekme"]').length === 5, 'Excel çalışma kitabının beş sekmesi görünür');
  ok(govde().indexOf('sevk ve çalışma yasağı takibi') > -1, 'sayfa başlığı sevk + çalışma yasağını anlatıyor');
  const thead = belge.querySelector('.saglik-sayfa thead');
  const theadHtml = thead ? thead.innerHTML : '';
  ok(/>Sevk</.test(theadHtml) && />Durum</.test(theadHtml), 'listede Sevk ve Durum sütunlari');
  ok(belge.querySelector('.saglik-sayfa tbody').textContent.indexOf('Kayıt bulunamadı') > -1, 'kayıt yokken boş durum mesajı');
  ok(!!saglikFormu(), 'yönetime kayıt formu basılıyor');
  const personnelSecim = saglikFormu() && saglikFormu().elements.personelId;
  ok(!!personnelSecim, 'formda Personel alanı var');

  /* 4) Formdan sevkli kayıt (çalışma yasağı boş). */
  kayitGonder({
    personelId: 'p1', isyeriId: 'isyeri-A', tarih: '2026-09-10', doktor: 'Dr. Selin Arı',
    sonMuayene: 'Görme keskinliği düşük', sevkEdilen: 'Aydın ADM TIP Merkezi - Göz Hastalıkları',
    calismaYasagi: '', izinsizlik: '6', calismaSesi: 'saha'
  });
  const k1 = kayitBul('p1');
  ok(!!k1, 'sevkli kayıt kaydedildi');
  ok(!!k1 && k1.sevkEdilen.indexOf('ADM TIP') > -1, 'sevk alanı çözülüp listeleniyor');
  ok(!!k1 && !k1.calismaYasagi, 'çalışma yasağı boş kaldı');
  ok(!!k1 && !!k1.girisYapan, 'giriş yapan kullanıcı işlendi');
  const ham1 = ISG.depo.saglikTakipListe('', '').filter((k) => k.id === (k1 || {}).id)[0];
  const hamSevk = ham1 ? String(ham1.sevkEdilen) : '';
  ok(/^sg2:/.test(hamSevk), 'sevk alanı depoya şifreli yazıldı');
  ok(hamSevk.indexOf('ADM') < 0 && hamSevk.indexOf('Göz') < 0, 'depoda sevk metni düz okunmuyor');
  ok(!!ham1 && ISG.saglikTakip.coz(hamSevk) === k1.sevkEdilen, 'şifre geri çözümlenebiliyor');
  ok(JSON.stringify(ISG.depo.saglikTakipListe('', '')).indexOf('Göz Hastalıkları') < 0, 'ham depoda hastane adı gizli');
  ok(ISG.saglikTakip.coz('Göz Hastalıkları') === 'Göz Hastalıkları', 'şifresiz eski değer olduğu gibi okunuyor');
  /* Eski sürüm (UTF-8 hatalı) düz metin yazmış olabilir; ASCII bile olsa bozulmamalı. */
  ok(ISG.saglikTakip.coz('Aspirin') === 'Aspirin', 'etiketsiz düz ASCII değer bozulmadan okunuyor');
  const eskiSifrele = (metin) => {
    const anahtar = 'isgtakip-saglik-2026';
    let cikti = '';
    for (let i = 0; i < metin.length; i += 1) { cikti += String.fromCharCode(metin.charCodeAt(i) ^ anahtar.charCodeAt(i % anahtar.length)); }
    return pencere.btoa(cikti);
  };
  ok(ISG.saglikTakip.coz(eskiSifrele('0+')) === '0+', 'eski etiketsiz şifre hâlâ çözümleniyor');
  const turkceMetin = 'Ağır iş makinesi şoförü – İbrahim Öztürk';
  ok(/^sg2:/.test(ISG.saglikTakip.sifrele(turkceMetin)), 'Türkçe metin şifreleniyor (düz metine düşmüyor)');
  ok(ISG.saglikTakip.coz(ISG.saglikTakip.sifrele(turkceMetin)) === turkceMetin, 'Türkçe metin şifreleme turunda kaybolmuyor');
  ok(ISG.saglikTakip.sifrele('') === '' && ISG.saglikTakip.coz('') === '', 'boş değer şifrelemede hata vermiyor');
  const s1 = satirMetni('Ayşe Demir');
  ok(s1.indexOf('SEVKLİ') > -1, 'SEVKLİ rozeti');
  ok(s1.indexOf('ADM TIP') > -1, 'sevk hedefi listede görünüyor');
  ok(sekmeSayi('tumu') === 1 && sekmeSayi('sevkli') === 1 && sekmeSayi('yasakli') === 0 && sekmeSayi('uygun') === 0, 'sekme sayaçları sevkli kaydında');

  /* 5) Hem sevk hem çalışma yasağı olan kayıt. */
  kayitGonder({
    personelId: 'p2', isyeriId: 'isyeri-A', tarih: '2026-09-11', doktor: 'Dr. Selin Arı',
    sonMuayene: 'Ağır yük kaldıramaz', sevkEdilen: 'Aydın Devlet Hastanesi - Ortopedi',
    calismaYasagi: '6 ay ağır yük kaldırma yasağı', calismaSesi: 'buro'
  });
  const k2 = kayitBul('p2');
  ok(!!k2 && k2.calismaYasagi.indexOf('ağır yük') > -1, 'çalışma yasağı çözülüp listeleniyor');
  const s2 = satirMetni('Fatma Şeker');
  ok(s2.indexOf('YASAK') > -1, 'çalışma yasağı rozeti');
  ok(sekmeSayi('sevkli') === 1 && sekmeSayi('yasakli') === 1, 'yasaklı kayıt ayrı sayaçta');

  /* 6) Sorunsuz kayıt (öteki işyeri). */
  kayitGonder({
    personelId: 'p3', isyeriId: 'isyeri-B', tarih: '2026-09-12', doktor: 'Dr. Kerem Uz',
    sonMuayene: 'Elverişli', sevkEdilen: '', calismaYasagi: '', calismaSesi: 'karisik'
  });
  const k3 = kayitBul('p3');
  ayrinti('kayıtlar', JSON.stringify(ISG.saglikTakip.listele('', '').map((k) => ({ p: k.personelId, s: k.sevkEdilen, y: k.calismaYasagi }))));
  ayrinti('satırlar', satirlar().map((t) => t.textContent.replace(/\s+/g, ' ')).join(' || '));
  ok(!!k3, 'üçüncü personel kaydı kaydedildi');
  ok(satirMetni('Murat Çelik').indexOf('UYGUN') > -1, 'UYGUN rozeti');
  ok(sekmeSayi('tumu') === 3 && satirlar().length === 3, 'üç kayıt listeleniyor');

  /* 7) Sekmeler listeyi filtreliyor. */
  tiklaSekme('sevkli');
  ok(satirlar().length === 1 && satirlar()[0].textContent.indexOf('Ayşe Demir') > -1, 'sevkli sekmesi');
  tiklaSekme('yasakli');
  ok(satirlar().length === 1 && satirlar()[0].textContent.indexOf('Fatma Şeker') > -1, 'yasaklı sekmesi');
  tiklaSekme('uygun');
  ok(satirlar().length === 1 && satirlar()[0].textContent.indexOf('Murat Çelik') > -1, 'uygun sekmesi');
  tiklaSekme('tumu');
  ok(satirlar().length === 3, 'tümü sekmesi listeyi geri getiriyor');

  /* 8) Arama sevk metninde de çalişiyor (saglikAlanlari aramaya dahil). */
  const aramaKutusu = () => belge.querySelector('[data-ui="saglikArama"]');
  ok(!!aramaKutusu(), 'arama kutusu arayüzde');
  async function ara(metin) {
    const kutu = aramaKutusu();
    if (!kutu) { return false; }
    kutu.value = metin;
    kutu.dispatchEvent(new pencere.Event('input', { bubbles: true }));
    await bekle(); /* cizGecikmeli 260 ms bekletiyor */
    return true;
  }
  await ara('Ortopedi');
  ok(satirlar().length === 1 && satirlar()[0].textContent.indexOf('Fatma Şeker') > -1, 'sevk metninde arama');
  await ara('boyleKayitYok');
  ok(satirlar().length === 0 && belge.querySelector('.saglik-sayfa tbody').textContent.indexOf('Kayıt bulunamadı') > -1, 'eşleşmeyen aramada boş durum');
  await ara('');
  ok(satirlar().length === 3, 'arama temizlenince liste geri geliyor');

  /* 9) Detay satırı sevk ve yasak bilgisini açıyor. */
  tikla('saglik-kapat', k2.id);
  let detay = belge.querySelector('.saglik-detay-satir');
  ok(!!detay, 'detay satırı açılıyor');
  const detayMetni = detay ? detay.textContent : '';
  ok(detayMetni.indexOf('Sevk edilen') > -1 && detayMetni.indexOf('Ortopedi') > -1, 'detayda sevk bilgisi');
  ok(detayMetni.indexOf('Çalışma yasağı') > -1 && detayMetni.indexOf('ağır yük kaldırma yasağı') > -1, 'detayda çalışma yasağı');
  ok(detayMetni.indexOf('ağır yük') > -1 && detayMetni.indexOf('İzinsizlik günü') > -1, 'detayda izinsizlik satırı');
  tikla('saglik-kapat', k2.id);
  ok(!belge.querySelector('.saglik-detay-satir'), 'detay satırı kapatılıyor');

  /* 10) Çalişma yasaği kalkinca durum UYGUN oluyor. */
  tikla('saglik-duzenle', k2.id);
  const formDuzen = saglikFormu();
  ok(!!formDuzen && formDuzen.elements.sevkEdilen.value.indexOf('Ortopedi') > -1, 'düzenleme formunda sevk dolu');
  ok(!!formDuzen && formDuzen.elements.calismaYasagi.value.indexOf('ağır yük') > -1, 'düzenleme formunda yasak dolu');
  kayitGonder({ calismaYasagi: '' });
  const k2b = kayitBul('p2');
  ok(!!k2b && !k2b.calismaYasagi, 'çalışma yasağı kaldırıldı');
  ok(!!k2b && k2b.sevkEdilen.indexOf('Ortopedi') > -1, 'sevk korundu (yalnız yasak alanı değişti)');
  ok(satirMetni('Fatma Şeker').indexOf('SEVKLİ') > -1, 'durum SEVKLİ oldu');
  ok(sekmeSayi('yasakli') === 0 && sekmeSayi('sevkli') === 2, 'sekme sayaçları güncellendi');

  /* 11) Rollar: görüntüleyici salt okunur, yetkili işyeri kapsamında. */
  girisYap(goruntuleyici);
  ok(!!sayfa(), 'görüntüleyici sağlık sayfasını görür');
  ok(!saglikFormu(), 'görüntüleyiciye kayıt formu basılmıyor');
  ok(!dugme('saglik-sil'), 'görüntüleyici sil düğmesi göremez');
  ok(satirlar().length === 0 && govde().indexOf('Yönetici onayı gerekli') >= 0, 'onaysız görüntüleyici sağlık verisini göremez');
  tikla('saglik-erisim-talep');
  girisYap(yonetici);
  ok(!!dugme('saglik-erisim-onay'), 'yönetici bekleyen erişim talebini görür');
  tikla('saglik-erisim-onay');
  girisYap(goruntuleyici);
  ok(satirlar().length === 3, 'yönetici onayından sonra görüntüleyici listeyi okuyabilir');

  girisYap(yetkili);
  ok(!saglikFormu(), 'yetkiliye yönetici onayı olmadan kayıt formu gösterilmez');
  ok(!dugme('saglik-sil'), 'yetkili silme düğmesi göremez');
  ok(satirlar().length === 0 && govde().indexOf('Yönetici onayı gerekli') >= 0, 'onaysız yetkili sağlık verisini göremez');

  /* 12) Silme yalnız yöneticide (onay kutusu üretim akışındaki gibi). */
  girisYap(yonetici);
  const onceki = ISG.saglikTakip.listele('', '').length;
  tikla('saglik-sil', k2.id);
  ok(ISG.saglikTakip.listele('', '').length === onceki - 1, 'yönetici kaydı sildi');
  ok(!kayitBul('p2'), 'silinen kayıt listede değil');
  girisYap(yetkili);
  let reddedildi = false;
  try { ISG.saglikTakip.sil(ISG.depo.saglikTakipListe('', '')[0].id); } catch (hata) { reddedildi = /yalnızca yönetici/i.test(hata.message); }
  ok(reddedildi, 'yetkili kaydı silemez');

  /* 13) Rapor metni sevk ve yasağı taşıyor. */
  girisYap(yonetici);
  const rapor = ISG.saglikTakip.raporMetni(ISG.saglikTakip.listele('', ''));
  ok(/Sevk/.test(rapor) && /Çalışma Yasağı/.test(rapor), 'rapor başlığında sevk + yasak sütunları');
  ok(rapor.indexOf('ADM TIP') > -1, 'raporda sevk hedefi');

  /* 14) Silinen personel / isyeri: muayene kayıtları mevzuat gereği SİLİNMEZ.
     Kayıt sahipsiz kalmasın diye kişi adı/sicili ve işyeri adı kayda dondurulur;
     liste ham kimlik yerine adı ve "silinmiş personel" rozetini gösterir. */
  const hamP1 = () => ISG.depo.saglikTakipListe('', '').filter((k) => k.personelId === 'p1')[0] || null;
  ok(ISG.depo.saglikTakipSay('p1') === 1, 'kişi bazlı sağlık kaydı sayımı (silme onayı metni)');
  const etiket1 = hamP1();
  ok(!!etiket1 && etiket1.personelAd === 'Ayşe Demir', 'kayıtta kişi adı canlı tutuluyor');
  ok(!!etiket1 && etiket1.personelSicil === 'S-001', 'kayıtta sicil canlı tutuluyor');
  ok(!!etiket1 && etiket1.isyeriAd === 'A Tesisi', 'kayıtta işyeri adı canlı tutuluyor');

  ISG.depo.personelSil('p1');
  ok(ISG.depo.al().personel.filter((p) => p.id === 'p1').length === 0, 'personel listeden silindi');
  girisYap(yonetici);
  const kalan1 = kayitBul('p1');
  ok(!!kalan1, 'personel silinince muayene kaydı korunuyor (silinmiyor)');
  ok(!!kalan1 && kalan1.sevkEdilen.indexOf('ADM TIP') > -1, 'korunan kaydın sevk bilgisi şifreden çözülüyor');
  const donmus1 = hamP1();
  ok(!!donmus1 && donmus1.personelAd === 'Ayşe Demir', 'kişi adı kayda donduruldu');
  girisYap(yonetici);
  const satirSilik = satirMetni('Ayşe Demir');
  ok(satirSilik.indexOf('Ayşe Demir') > -1, 'silinen kişinin adı listede okunuyor');
  ok(satirSilik.indexOf('silinmiş personel') > -1, '"silinmiş personel" rozeti basılıyor');
  ok(satirSilik.indexOf('p1') < 0, 'ham personel kimliği listeye sızmıyor');
  ok(satirSilik.indexOf('SEVKLİ') > -1, 'silinmiş kişinin sevk durumu hâlâ izleniyor');

  /* 14b) İşyeri silinince de kayıtlar korunuyor, işyeri etiketi donuyor. */
  ok(ISG.depo.saglikTakipIsyeriSay('isyeri-A') === 1, 'işyeri bazlı sayım (silinmiş kişinin kaydı da sayılıyor)');
  ISG.depo.isyeriSil('isyeri-A');
  girisYap(yonetici);
  ok(!!kayitBul('p1'), 'işyeri silinince muayene kaydı korunuyor');
  const satirIsyeri = satirMetni('Ayşe Demir');
  ok(satirIsyeri.indexOf('A Tesisi') > -1, 'silinen işyerinin adı listede okunuyor');
  ok(satirIsyeri.indexOf('silinmiş işyeri') > -1, '"silinmiş işyeri" uyarısı basılıyor');

  /* 14c) Listeyi temizle (toplu personel silme) de sağlık kaydına dokunmaz. */
  ISG.depo.personelTemizle('isyeri-B');
  girisYap(yonetici);
  ok(!!kayitBul('p3'), 'personel listesi temizlenince muayene kaydı korunuyor');
  const satirTemiz = satirMetni('Murat Çelik');
  ok(satirTemiz.indexOf('Murat Çelik') > -1 && satirTemiz.indexOf('silinmiş personel') > -1, 'temizlenen kişinin kaydı etiketle listeleniyor');
  ok(satirTemiz.indexOf('B Tesisi') > -1, 'yaşayan işyeri adı normal gösteriliyor');
  ok(ISG.saglikTakip.listele('', '').length === 2, 'hiçbir muayene kaydı otomatik silinmedi');
  const raporSilik = ISG.saglikTakip.raporMetni(ISG.saglikTakip.listele('', ''));
  ok(raporSilik.indexOf('Ayşe Demir') > -1 && raporSilik.indexOf('p1') < 0, 'rapor metninde ad kullanılıyor, ham kimlik yazılmıyor');

  const basarisiz = !!process.exitCode;
  console.log(basarisiz ? 'BAZI TESTLER BAŞARISIZ' : 'TÜM SAĞLIK TAKİBİ TESTLERİ GEÇTİ');
  /* jsdom penceresi zamanlayıcıları canlı tuttuğu için süreç açık kalır; kapatilir. */
  pencere.close();
  process.exit(basarisiz ? 1 : 0);
})().catch((hata) => {
  console.error('BEKLENMEDIK HATA: ' + ((hata && hata.stack) || hata));
  process.exit(1);
});