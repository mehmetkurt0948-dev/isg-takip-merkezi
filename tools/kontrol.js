/* İSG Takip Merkezi — jsdom duman testi
   Kullanım: npm test  (veya node tools/kontrol.js) */
'use strict';

const path = require('path');
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const { JSDOM, VirtualConsole } = require('jsdom');

const kok = path.resolve(__dirname, '..');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};
let hata = 0;
let gecen = 0;

function sunucuBaslat() {
  return new Promise((coz) => {
    const sunucu = http.createServer((istek, yanit) => {
      const yol = decodeURIComponent(String(istek.url).split('?')[0]);
      const dosya = path.join(kok, yol === '/' ? 'index.html' : yol);
      if (!dosya.startsWith(kok)) { yanit.writeHead(403); yanit.end(); return; }
      fs.readFile(dosya, (hataOkuma, icerik) => {
        if (hataOkuma) { yanit.writeHead(404); yanit.end('bulunamadi'); return; }
        yanit.writeHead(200, { 'Content-Type': MIME[path.extname(dosya)] || 'application/octet-stream' });
        yanit.end(icerik);
      });
    });
    sunucu.listen(0, '127.0.0.1', () => coz({ sunucu: sunucu, port: sunucu.address().port }));
  });
}

function kontrol(ad, kosul, ek) {
  if (kosul) {
    gecen += 1;
    console.log('  OK   ' + ad);
  } else {
    hata += 1;
    console.log('  FAIL ' + ad + (ek ? ' -> ' + ek : ''));
  }
}

function bekle(ms) {
  return new Promise((coz) => setTimeout(coz, ms));
}

(async function () {
  const { sunucu, port } = await sunucuBaslat();
  const sanal = new VirtualConsole();
  sanal.on('jsdomError', (e) => {
    const mesaj = String(e && e.message ? e.message : e);
    if (/Not implemented/.test(mesaj) && /scrollTo/.test(mesaj)) { return; }
    console.log('  [jsdom] ' + mesaj);
  });

  const dom = await JSDOM.fromURL('http://127.0.0.1:' + port + '/index.html', {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: sanal
  });

  const { window } = dom;
  await new Promise((coz) => {
    if (window.document.readyState === 'complete') { coz(); }
    else { window.addEventListener('load', coz); }
  });
  await bekle(200);

  const doc = window.document;
  const ISG = window.ISG;
  const metin = (secici) => {
    const el = doc.querySelector(secici);
    return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
  };
  const sayfaAc = async (hash) => {
    window.location.hash = hash;
    await bekle(160);
  };

  console.log('\n0) Giriş ekranı ve oturum');
  kontrol('Giriş katmanı görünür', doc.getElementById('girisKatman') && doc.getElementById('girisKatman').hidden === false);
  kontrol('Gövde oturum yok sınıfında', doc.body.classList.contains('oturum-yok'));
  kontrol('Uygulama kabuğu gizli', doc.getElementById('kabuk') && doc.getElementById('kabuk').getAttribute('aria-hidden') === 'true');
  kontrol('Hazır hesap düğmesi yok', doc.querySelectorAll('[data-demo-eposta]').length === 0,
    String(doc.querySelectorAll('[data-demo-eposta]').length));
  kontrol('Şifremi unuttum sekmesi var', !!doc.querySelector('[data-giris-sekme="sifirla"]'));
  doc.querySelector('[data-giris-sekme="sifirla"]').click();
  await bekle(60);
  kontrol('Şifremi unuttum formu açılır', doc.getElementById('sifirlaForm').hidden === false && doc.getElementById('girisForm').hidden === true);
  kontrol('Sıfırlama ilk adımı görünür', doc.getElementById('sifirlaAdim1').hidden === false && doc.getElementById('sifirlaAdim2').hidden === true);
  doc.getElementById('sifirlaEposta').value = 'mehmetkurt0948@gmail.com';
  doc.getElementById('sifirlaForm').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await bekle(160);
  kontrol('Kod adımı açıldı', doc.getElementById('sifirlaAdim2').hidden === false && doc.getElementById('sifirlaAdim1').hidden === true);
  kontrol('Servis yokken kod ekranda gösterilir', doc.getElementById('sifirlaKodKutu').hidden === false && /^\d{6}$/.test(metin('#sifirlaKod')), metin('#sifirlaKod'));
  ISG.giris.sifirlamaSil();
  doc.querySelector('[data-giris-sekme="giris"]').click();
  await bekle(40);

  const girisYap = async (eposta, sifre) => {
    const form = doc.getElementById('girisForm');
    doc.getElementById('girisEposta').value = eposta;
    doc.getElementById('girisSifre').value = sifre;
    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await bekle(220);
  };

  await girisYap('mehmetkurt0948@gmail.com', 'yanlis');
  kontrol('Hatalı şifre uyarısı', doc.getElementById('girisUyari').hidden === false && /Şifre hatalı/.test(metin('#girisUyari')), metin('#girisUyari'));
  kontrol('Hatalı girişte oturum açılmaz', !ISG.yetki.oturum());

  await girisYap('admin@isg.local', '1234');
  kontrol('Kayıtsız e-postada kayıtlı hesaplar hatırlatılır',
    /kayıtlı kullanıcı bulunamadı/i.test(metin('#girisUyari')) && /mehmetkurt0948@gmail\.com/.test(metin('#girisUyari')),
    metin('#girisUyari'));
  kontrol('Kayıtsız e-postada oturum açılmaz', !ISG.yetki.oturum());

  await girisYap('mehmetkurt0948@gmail.com', '1234');
  kontrol('Yönetici oturumu açıldı', !!ISG.yetki.oturum() && ISG.yetki.oturum().rol === 'yonetici');
  kontrol('Giriş katmanı kapandı', doc.getElementById('girisKatman').hidden === true);
  kontrol('Gövde oturum sınıfı temizlendi', !doc.body.classList.contains('oturum-yok'));
  kontrol('Onay menüsü yöneticide görünür', doc.getElementById('menuOnaylar').hidden === false);
  kontrol('Kullanıcı alanı oturum sahibini gösterir', /Mehmet Kurt/.test(metin('#kullaniciAd')), metin('#kullaniciAd'));

  console.log('\n0b) Boş açılış, örnek veri temizliği ve örnek veri yükleme');
  const bos = ISG.depo.al();
  const KAYIT_LISTELERI = ['egitimler', 'riskler', 'olaylar', 'dosyalar', 'belgeler', 'planlar',
    'tespitler', 'riskEkipleri', 'acilPlanlar', 'davetler', 'mevzuat', 'talepler'];
  const doluDolanlar = KAYIT_LISTELERI.filter((k) => (bos[k] || []).length > 0);
  kontrol('Site boş açılıyor: işyeri yok', bos.isyerleri.length === 0, String(bos.isyerleri.length));
  kontrol('Site boş açılıyor: personel yok', bos.personel.length === 0, String(bos.personel.length));
  kontrol('Site boş açılıyor: tüm kayıt listeleri boş', doluDolanlar.length === 0, doluDolanlar.join(', '));
  kontrol('Boş açılışta denetim izinde yalnızca oturum kayıtları var',
    bos.denetim.length > 0 && bos.denetim.every((k) => k.tur === 'giris' || k.tur === 'cikis'),
    bos.denetim.map((k) => k.tur).join(', '));
  kontrol('Boş açılışta örnek (@ornek.com) hesap yok',
    !bos.kullanicilar.some((k) => /@ornek\.com$/i.test(String(k.eposta || ''))),
    bos.kullanicilar.map((k) => k.eposta).join(', '));
  kontrol('Boş açılışta yönetici hesabı duruyor (giriş açık)',
    !!ISG.depo.kullaniciEpostaBul('mehmetkurt0948@gmail.com'));
  kontrol('Boş açılışta kurum adı boş', !bos.ayarlar.kurum, String(bos.ayarlar.kurum));
  kontrol('Cihaz temizlik damgası yazıldı (göç bir kez koşar)',
    Number(window.localStorage.getItem('isgtakip.temizlik')) === 1,
    String(window.localStorage.getItem('isgtakip.temizlik')));
  kontrol('Boş açılışta yedek yazılmadı', window.localStorage.getItem('isgtakip.oncekiVeri') === null);
  kontrol('Örnek veri düğmesi yöneticiye görünür', doc.getElementById('ornekVeriDugme').hidden === false);
  kontrol('Eski veri düğmesi yedek yokken gizli', doc.getElementById('oncekiVeriDugme').hidden === true);

  /* Boş veriyle tüm ekranlar dolaşılır: boş durumlar hata metni üretmemeli. */
  const bosSayfalar = ['panel', 'isyerleri', 'personel', 'dosyalar', 'plan', 'saha', 'rapor',
    'istatistik', 'risk', 'acil', 'ekip', 'onaylar', 'mevzuat'];
  for (const sayfa of bosSayfalar) {
    await sayfaAc('#' + sayfa);
    const icerik = metin('#gorunum');
    kontrol('#' + sayfa + ' boş veriyle temiz render',
      !/undefined|NaN|\[object Object\]/.test(icerik),
      (icerik.match(/.{0,40}(undefined|NaN|\[object Object\]).{0,40}/) || [''])[0]);
    kontrol('#' + sayfa + ' boş veriyle başlık veriyor', metin('.sayfa-baslik h1').length > 2,
      metin('.sayfa-baslik h1'));
  }
  await sayfaAc('#isyerleri');
  kontrol('Boş durumda işyeri eklemeye çağrılır', /İşyeri bulunamadı/.test(metin('#gorunum')),
    metin('#gorunum').slice(0, 120));
  /* Boş sitede işyeri ekleme: diyalog -> kayıt -> kalıcılık -> kart.
     "İşyeri eklenemiyor" şikâyetinin regresyon testi (bozuk kayıt yardımcısı). */
  await sayfaAc('#isyerleri');
  doc.querySelector('[data-islem="isyeri-yeni"]').click();
  await bekle(120);
  kontrol('Boş sitede işyeri diyaloğu açılıyor', doc.getElementById('isyeriDiyalog').open === true);
  const bosIsyeriForm = doc.getElementById('isyeriForm');
  bosIsyeriForm.elements.ad.value = 'Regresyon İşyeri';
  bosIsyeriForm.elements.tehlikeSinifi.value = 'tehlikeli';
  bosIsyeriForm.elements.calisanSayisi.value = '25';
  bosIsyeriForm.elements.ana.checked = true;
  bosIsyeriForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await bekle(160);
  const eklenenIsyeri = ISG.depo.al().isyerleri.filter((i) => i.ad === 'Regresyon İşyeri')[0];
  kontrol('İşyeri kaydı eklendi', !!eklenenIsyeri,
    ISG.depo.al().isyerleri.map((i) => i.ad).join(', '));
  kontrol('İşyeri kalıcı yazıldı',
    JSON.parse(window.localStorage.getItem(ISG.depo.anahtar)).isyerleri.some((i) => i.ad === 'Regresyon İşyeri'));
  kontrol('İşyeri kartı listelendi', doc.querySelectorAll('.isyeri-kart').length === 1,
    String(doc.querySelectorAll('.isyeri-kart').length));
  kontrol('İlk işyeri ana kurum oldu', !!(eklenenIsyeri && eklenenIsyeri.ana === true));
  kontrol('Kayıt sonrası diyalog kapandı', doc.getElementById('isyeriDiyalog').open === false);
  doc.querySelector('[data-islem="isyeri-duzenle"]').click();
  await bekle(120);
  bosIsyeriForm.elements.ad.value = 'Regresyon İşyeri (Düzenli)';
  bosIsyeriForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await bekle(160);
  kontrol('İşyeri düzenlemesi kaydedildi',
    ISG.depo.al().isyerleri.length === 1 && ISG.depo.al().isyerleri[0].ad === 'Regresyon İşyeri (Düzenli)',
    ISG.depo.al().isyerleri.map((i) => i.ad).join(', '));
  doc.querySelector('[data-islem="isyeri-sil"]').click();
  await bekle(120);
  doc.getElementById('onayEvet').click();
  await bekle(180);
  kontrol('İşyeri silindi, boş duruma dönüldü', ISG.depo.al().isyerleri.length === 0,
    String(ISG.depo.al().isyerleri.length));
  await sayfaAc('#panel');

  await sayfaAc('#panel');

  /* Eski sürümlerde cihazda biriken örnek verinin temizliği (göç birim testi). */
  const demoda = ISG.ORNEK_VERI();
  const temizlik = ISG.depo.demoTemizle(demoda);
  kontrol('Örnek veri temizliği yüzlerce kaydı siliyor', temizlik.silinen > 600, String(temizlik.silinen));
  kontrol('Temizlik sonrası kayıt listesi kalmıyor',
    ['isyerleri', 'personel', 'egitimler', 'dosyalar', 'planlar', 'tespitler', 'mevzuat']
      .every((k) => demoda[k].length === 0),
    KAYIT_LISTELERI.concat(['isyerleri', 'personel']).filter((k) => (demoda[k] || []).length > 0).join(', '));
  kontrol('Temizlik yönetici hesabını koruyor',
    demoda.kullanicilar.length === 1 && demoda.kullanicilar[0].eposta === 'mehmetkurt0948@gmail.com',
    demoda.kullanicilar.map((k) => k.eposta).join(', '));
  kontrol('Temizlik mezar taşı bırakır (buluttan geri dönmez)',
    Object.keys(demoda.senkron.silinen).length > 600, String(Object.keys(demoda.senkron.silinen).length));
  kontrol('Temizlik silinen veriyi yedekte tutar',
    temizlik.yedek.length > 1000 && JSON.parse(temizlik.yedek).isyerleri.length === 6);
  kontrol('Temizlik kurum ayarlarına dokunmaz', demoda.ayarlar.kurum === 'Aydın Büyükşehir Belediyesi Personel A.Ş',
    String(demoda.ayarlar.kurum));

  /* Örnek veri artık yalnızca düğmeyle gelir: depo.ornekYukle() arka plan testi. */
  const yuklenen = ISG.depo.ornekYukle();
  ISG.ui.kapsam = '';
  ISG.uygulama.girisSonrasi();
  await bekle(160);
  kontrol('Örnek veri yükleme 6 işyeri getiriyor', yuklenen.isyerleri.length === 6, String(yuklenen.isyerleri.length));
  kontrol('Örnek veri yükleme 37 personel getiriyor', yuklenen.personel.length === 37, String(yuklenen.personel.length));
  kontrol('Örnek veri örnek hesapları da getiriyor', yuklenen.kullanicilar.length === 3,
    String(yuklenen.kullanicilar.length));
  kontrol('Örnek veri kendi mezar taşlarını siler',
    Object.keys(ISG.depo.al().senkron.silinen).length === 0,
    String(Object.keys(ISG.depo.al().senkron.silinen).length));
  kontrol('Örnek veri kalıcı yazıma geçer',
    JSON.parse(window.localStorage.getItem(ISG.depo.anahtar)).isyerleri.length === 6);
  kontrol('Örnek veri sonrası görev listesi dolar', doc.querySelectorAll('.gorev-satir').length > 0,
    String(doc.querySelectorAll('.gorev-satir').length));

  console.log('\n1) Yükleme ve genel bakış');
  kontrol('ISG çekirdeği yüklendi', !!ISG && !!ISG.depo && !!ISG.sayfalar && !!ISG.uygulama);

  kontrol('Varsayılan sayfa Genel bakış', metin('.sayfa-baslik h1') === 'Genel bakış', metin('.sayfa-baslik h1'));
  kontrol('Dört KPI kartı var', doc.querySelectorAll('.kpi').length === 4, String(doc.querySelectorAll('.kpi').length));
  kontrol('Görev satırları basıldı', doc.querySelectorAll('.gorev-satir').length > 0, String(doc.querySelectorAll('.gorev-satir').length));
  kontrol('Kurum adı görünür', /Aydın Büyükşehir/.test(metin('.sayfa-baslik .kurum')));
  kontrol('Kapsam seçici dolu', doc.querySelectorAll('#kapsam option').length === 7, String(doc.querySelectorAll('#kapsam option').length));

  console.log('\n2) Tohum veri bütünlüğü');
  const veri = ISG.depo.al();
  const gecerliIlkYardimSayisi = (hesap, isyeriId) => {
    const kisiler = hesap.personel.filter((p) => p.isyeriId === isyeriId).map((p) => p.id);
    return hesap.egitimler.filter((e) => e.tur === 'ilkYardim' && kisiler.indexOf(e.personelId) >= 0 && ISG.gunFarki(e.gecerlilik) >= 0).length;
  };
  const gecerliIlkYardim = (isyeriId) => gecerliIlkYardimSayisi(veri, isyeriId);
  kontrol('Altı işyeri var', veri.isyerleri.length === 6, String(veri.isyerleri.length));
  kontrol('Kontrol maddesi üretildi', veri.dosyalar.length > 600, String(veri.dosyalar.length));
  kontrol('Her işyerinin katalogu var', veri.isyerleri.every((i) => veri.dosyalar.some((d) => d.isyeriId === i.id)));
  kontrol('37 personel kaydı (13 + 24 rastgele)', veri.personel.length === 37, String(veri.personel.length));
  kontrol('Her işyerinde personel var', veri.isyerleri.every((i) => veri.personel.some((p) => p.isyeriId === i.id)));
  kontrol('Rastgele personel kimlikleri tekil', new Set(veri.personel.map((p) => p.id)).size === veri.personel.length);
  kontrol('Rastgele personelin temel eğitimi var',
    veri.personel.filter((p) => /^pr/.test(p.id))
      .every((p) => veri.egitimler.some((e) => e.personelId === p.id && e.tur === 'temel')));
  kontrol('Her işyerinde güncel ilk yardımcı var', veri.isyerleri.every((i) => gecerliIlkYardim(i.id) >= 1),
    veri.isyerleri.map((i) => i.id + ':' + gecerliIlkYardim(i.id)).join(', '));
  kontrol('Eğitim geçerliliği işyeri sınıfına uygun', veri.egitimler.every((e) => {
    const isyeri = veri.isyerleri.filter((i) => i.id === e.isyeriId)[0];
    return isyeri && e.gecerlilik === ISG.egitimGecerlilik(e.tur, isyeri.tehlikeSinifi, e.tarih);
  }));
  kontrol('Plan faaliyetleri üretildi', veri.planlar.length === veri.isyerleri.length * 7, String(veri.planlar.length));
  kontrol('Mevzuat 20 başlık', veri.mevzuat.length === 20, String(veri.mevzuat.length));
  kontrol('Risk ekipleri her işyerinde', veri.isyerleri.every((i) => veri.riskEkipleri.some((k) => k.isyeriId === i.id)));
  kontrol('Acil plan kayıtları her işyerinde', veri.isyerleri.every((i) => veri.acilPlanlar.some((k) => k.isyeriId === i.id)));
  const gorevler = ISG.gorevler(veri, '');
  kontrol('Görev motoru iş üretiyor', gorevler.length > 40, String(gorevler.length));
  const gorevOzet = ISG.gorevOzet(gorevler);
  kontrol('Geciken iş sayısı pozitif', gorevOzet.geciken > 0, String(gorevOzet.geciken));
  kontrol('Öncelikli = geciken + bugün + yaklaşan', gorevOzet.oncelikli === gorevOzet.geciken + gorevOzet.bugun + gorevOzet.yaklasan);

  console.log('\n3) Alan kuralları');
  kontrol('Çok tehlikeli temel 1 yıl', ISG.egitimGecerlilik('temel', 'cokTehlikeli', '2026-03-01') === '2027-03-01');
  kontrol('Tehlikeli temel 2 yıl', ISG.egitimGecerlilik('temel', 'tehlikeli', '2026-03-01') === '2028-03-01');
  kontrol('Az tehlikeli temel 3 yıl', ISG.egitimGecerlilik('temel', 'az', '2026-03-01') === '2029-03-01');
  kontrol('İlk yardım 3 yıl', ISG.egitimGecerlilik('ilkYardim', 'tehlikeli', '2026-03-01') === '2029-03-01');
  kontrol('Risk skoru çarpım', ISG.riskSkor({ olasilik: 4, siddet: 5 }) === 20);
  kontrol('Kritik seviye 15+', ISG.riskSeviye(15).id === 'kritik');
  kontrol('Risk yenileme sınırı az=6', ISG.RISK_SINIFLARI.az.riskYenilemeYil === 6);
  kontrol('Acil yenileme sınırı tehlikeli=4', ISG.RISK_SINIFLARI.tehlikeli.acilYenilemeYil === 4);
  kontrol('Geçmiş tarih negatif gün', ISG.gunFarki('2020-01-01') < 0);
  kontrol('Eğitim durumu süresi doldu', ISG.egitimDurumu({ gecerlilik: '2020-01-01' }).id === 'suresiDoldu');

  console.log('\n4) İşyerleri ve kapsam');
  await sayfaAc('#isyerleri');
  kontrol('İşyeri kartları 6 adet', doc.querySelectorAll('.isyeri-kart').length === 6, String(doc.querySelectorAll('.isyeri-kart').length));
  kontrol('Kurum şeridi var', /Kurum:/.test(metin('.kurum-serit')));
  kontrol('Kartlarda kontrol maddesi sayısı', /madde/.test(metin('.isyeri-kart')));

  ISG.ui.kapsam = 'iy2';
  ISG.uygulama.ciz();
  await bekle(80);
  kontrol('Kapsam daraltıldı (1 kart)', doc.querySelectorAll('.isyeri-kart').length === 1, String(doc.querySelectorAll('.isyeri-kart').length));
  kontrol('Kapsam seçici seçili', doc.getElementById('kapsam').value === 'iy2');

  console.log('\n5) Personel listesi');
  ISG.ui.kapsam = '';
  await sayfaAc('#personel');
  kontrol('Personel tabloları 6 blok', doc.querySelectorAll('.personel-blok').length === 6, String(doc.querySelectorAll('.personel-blok').length));
  const aypasBlok = doc.querySelector('.personel-blok');
  kontrol('Aypaş 16 satır (13 + 3 rastgele)', aypasBlok.querySelectorAll('tbody tr').length === 16, String(aypasBlok.querySelectorAll('tbody tr').length));
  kontrol('Listede 37 personel satırı', doc.querySelectorAll('.personel-blok tbody tr').length === 37,
    String(doc.querySelectorAll('.personel-blok tbody tr').length));
  kontrol('Her işyeri bloğu dolu', Array.from(doc.querySelectorAll('.personel-blok tbody'))
    .every((govde) => govde.querySelectorAll('tr').length > 0));
  kontrol('Çalışan sayısı farkı uyarısı', /farkı/.test(aypasBlok.textContent));
  kontrol('Sicil ve meslek kolonları dolu', /Barış Taşdemir/.test(aypasBlok.textContent));

  ISG.ui.personelArama = 'kaynakçı';
  ISG.uygulama.ciz();
  await bekle(80);
  kontrol('Personel araması filtreliyor', /Elif Kaya/.test(doc.querySelector('.personel-blok').textContent) &&
    doc.querySelectorAll('.personel-blok')[0].querySelectorAll('tbody tr').length === 1);
  ISG.ui.personelArama = '';
  ISG.uygulama.ciz();
  await bekle(100);

  const kisi = ISG.depo.al().personel[0];
  doc.querySelector('[data-islem="personel-detay"][data-id="' + kisi.id + '"]').click();
  await bekle(80);
  kontrol('Personel detayı açıldı', doc.querySelectorAll('.detay-satir').length === 1);
  kontrol('Detayda eğitim geçerliliği var', /Temel İSG eğitimi/.test(metin('.detay-satir')));

  console.log('\n6) Personel ekleme (form + localStorage)');
  doc.querySelector('[data-islem="personel-yeni"]').click();
  await bekle(80);
  kontrol('Personel diyalogu açıldı', doc.getElementById('personelDiyalog').open === true);
  const personelForm = doc.getElementById('personelForm');
  personelForm.elements.adSoyad.value = 'Test Kullanıcı';
  personelForm.elements.sicil.value = '99';
  personelForm.elements.meslek.value = 'Test operatörü';
  personelForm.elements.isyeriId.value = 'iy1';
  personelForm.elements.iseBaslama.value = '2026-01-01';
  personelForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await bekle(120);
  const kayitli = JSON.parse(window.localStorage.getItem(ISG.depo.anahtar));
  kontrol('Personel localStorage’a yazıldı', kayitli.personel.some((p) => p.adSoyad === 'Test Kullanıcı'));
  kontrol('Personel sayısı 38', kayitli.personel.length === 38, String(kayitli.personel.length));
  kontrol('Diyalog kapandı', doc.getElementById('personelDiyalog').open === false);
  kontrol('Liste yenilendi', /Test Kullanıcı/.test(metin('#gorunum')));

  console.log('\n7) Eğitim kaydı ve geçerlilik');
  const testKisi = ISG.depo.al().personel.filter((p) => p.adSoyad === 'Test Kullanıcı')[0];
  ISG.ui.acikPersonel = testKisi.id;
  ISG.uygulama.ciz();
  await bekle(100);
  doc.querySelector('[data-islem="egitim-yeni"][data-personel="' + testKisi.id + '"]').click();
  await bekle(80);
  const egitimForm = doc.getElementById('egitimForm');
  egitimForm.elements.tur.value = 'temel';
  egitimForm.elements.tarih.value = '2026-01-15';
  egitimForm.elements.sureSaat.value = '12';
  egitimForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await bekle(120);
  const testEgitim = ISG.depo.al().egitimler.filter((e) => e.personelId === testKisi.id)[0];
  kontrol('Tehlikeli için bitiş 2028-01-15', testEgitim && testEgitim.gecerlilik === '2028-01-15', testEgitim && testEgitim.gecerlilik);

  console.log('\n8) Dosya kontrolleri');
  await sayfaAc('#dosyalar');
  kontrol('KPI dört kutu', doc.querySelectorAll('.kpi').length === 4, String(doc.querySelectorAll('.kpi').length));
  kontrol('Varsayılan sayfa boyutu 25', doc.querySelectorAll('.tablo-kucuk tbody tr').length === 25, String(doc.querySelectorAll('.tablo-kucuk tbody tr').length));
  kontrol('Durum sekmeleri var', doc.querySelectorAll('[data-islem="dosya-sekme"]').length === 5);
  kontrol('Sayfalama var', doc.querySelectorAll('[data-sayfa-git]').length > 2);
  const ikinciSayfa = doc.querySelector('[data-sayfa-git="2"]');
  ikinciSayfa.click();
  await bekle(100);
  kontrol('İkinci sayfa açıldı', ISG.ui.dosyaSayfa === 2, String(ISG.ui.dosyaSayfa));
  ISG.ui.dosyaSayfa = 1;
  ISG.uygulama.ciz();
  await bekle(80);
  doc.querySelector('[data-islem="dosya-sekme"][data-sekme="eksik"]').click();
  await bekle(100);
  kontrol('Eksik sekmesi filtreliyor', Array.from(doc.querySelectorAll('.tablo-kucuk tbody tr .rozet')).some((r) => r.textContent === 'Eksik'));
  ISG.ui.dosyaSekme = 'tumu';
  ISG.uygulama.ciz();
  await bekle(80);
  kontrol('Tümü sekmesi geri döndü', ISG.ui.dosyaSekme === 'tumu');

  console.log('\n9) DÖF oluşturma');
  const tespitOncesi = ISG.depo.al().tespitler.length;
  doc.querySelector('[data-islem="dosya-dof"]').click();
  await bekle(80);
  kontrol('DÖF onayı istendi', doc.getElementById('onayDiyalog').open === true);
  doc.getElementById('onayEvet').click();
  await bekle(150);
  kontrol('DÖF kaydı eklendi', ISG.depo.al().tespitler.length === tespitOncesi + 1, String(ISG.depo.al().tespitler.length));
  kontrol('Saha sayfasına geçildi', metin('.sayfa-baslik h1') === 'Saha ve DÖF', metin('.sayfa-baslik h1'));

  console.log('\n10) Çalışma planı');
  await sayfaAc('#plan');
  kontrol('Altı plan kartı', doc.querySelectorAll('.plan-kart').length === 6, String(doc.querySelectorAll('.plan-kart').length));
  kontrol('İlk yardımcı kartları 6', doc.querySelectorAll('.plan-kucuk-kart').length === 6, String(doc.querySelectorAll('.plan-kucuk-kart').length));
  kontrol('Plan tablosu dolu', doc.querySelectorAll('.tablo-kucuk tbody tr').length === 42, String(doc.querySelectorAll('.tablo-kucuk tbody tr').length));

  const yardimKartlari = Array.from(doc.querySelectorAll('.plan-kucuk-kart'));
  const kartSayilari = yardimKartlari.map((kart) => {
    const degerler = Array.from(kart.querySelectorAll('.satir b')).map((b) => parseInt(b.textContent, 10));
    return { ihtiyac: degerler[1], mevcut: degerler[2] };
  });
  const beklenenIhtiyac = veri.isyerleri.map((isyeri) => {
    const carpan = isyeri.tehlikeSinifi === 'cokTehlikeli' ? 10 : (isyeri.tehlikeSinifi === 'az' ? 20 : 15);
    return Math.max(1, Math.ceil((Number(isyeri.calisanSayisi) || 0) / carpan));
  });
  kontrol('İlk yardımcı ihtiyacı çalışan sayısıyla uyumlu',
    kartSayilari.every((kart, i) => kart.ihtiyac === beklenenIhtiyac[i]),
    kartSayilari.map((k) => k.ihtiyac).join(',') + ' / ' + beklenenIhtiyac.join(','));
  kontrol('Her işyerinde kayıtlı ilk yardımcı var', kartSayilari.every((kart) => kart.mevcut >= 1),
    kartSayilari.map((k) => k.mevcut).join(','));
  kontrol('Karttaki ilk yardımcı sayısı veriyle uyumlu', kartSayilari.every((kart, i) =>
    kart.mevcut === gecerliIlkYardimSayisi(ISG.depo.al(), veri.isyerleri[i].id)),
    kartSayilari.map((k) => k.mevcut).join(','));
  kontrol('İlk yardımcı kartında Yeterli/Eksik rozeti var', yardimKartlari.every((kart) => /Yeterli|Eksik/.test(kart.textContent)));
  kontrol('Her plan kartında faaliyet listesi var', Array.from(doc.querySelectorAll('.plan-kart'))
    .every((kart) => kart.querySelectorAll('.plan-satir').length > 0));
  const tamamlaDugme = doc.querySelector('[data-islem="plan-tamamla"]');
  const tamamlaId = tamamlaDugme.getAttribute('data-id');
  tamamlaDugme.click();
  await bekle(120);
  const planKayit = ISG.depo.al().planlar.filter((p) => p.id === tamamlaId)[0];
  kontrol('Plan tamamlandı işaretlendi', planKayit.durum === 'tamamlandi');

  console.log('\n11) Saha ve DÖF');
  await sayfaAc('#saha');
  kontrol('Tespit satırları var', doc.querySelectorAll('.tespit-satir').length >= 6, String(doc.querySelectorAll('.tespit-satir').length));
  kontrol('Olay tablosu var', /Ramak kala ve olay bildirimleri/.test(metin('#gorunum')));
  doc.querySelector('[data-islem="saha-filtre"][data-filtre="geciken"]').click();
  await bekle(120);
  kontrol('Geciken filtresi uygulandı', ISG.ui.sahaDurum === 'geciken');
  ISG.ui.sahaDurum = '';
  ISG.uygulama.ciz();
  await bekle(80);

  kontrol('İş kazası tablosu var', /İş kazası ve meslek hastalığı kayıtları/.test(metin('#gorunum')));
  const kazaSatirOnce = doc.querySelectorAll('.kaza-satir').length;
  kontrol('Kaza satırları listelendi', kazaSatirOnce >= 5, String(kazaSatirOnce));
  const kazaOnce = ISG.depo.al().olaylar.filter((o) => o.tur === 'isKazasi').length;
  doc.querySelector('[data-islem="kaza-yeni"][data-tur="isKazasi"]').click();
  await bekle(100);
  kontrol('İş kazası diyalogu açıldı', doc.getElementById('kazaDiyalog').open === true);
  kontrol('Vücut bölgesi seçenekleri dolu',
    doc.getElementById('kazaBolge').options.length === ISG.YARALANMA_BOLGELERI.length + 1,
    String(doc.getElementById('kazaBolge').options.length));
  kontrol('Yaralanma türü seçenekleri dolu',
    doc.getElementById('kazaYaralanma').options.length === ISG.YARALANMA_TURLERI.length + 1,
    String(doc.getElementById('kazaYaralanma').options.length));
  kontrol('Kök neden sınıfı seçenekleri dolu',
    doc.getElementById('kazaNeden').options.length === ISG.KAZA_NEDENLERI.length + 1,
    String(doc.getElementById('kazaNeden').options.length));
  kontrol('Şiddet sınıfı seçenekleri dolu',
    doc.getElementById('kazaSiddet').options.length === ISG.KAZA_SIDDETLERI.length + 1,
    String(doc.getElementById('kazaSiddet').options.length));
  kontrol('Vardiya seçenekleri dolu',
    doc.getElementById('kazaVardiya').options.length === ISG.VARDIYALAR.length + 1,
    String(doc.getElementById('kazaVardiya').options.length));
  kontrol('Hastane sevk seçenekleri dolu',
    doc.getElementById('kazaSevk').options.length === ISG.EVET_HAYIR.length + 1,
    String(doc.getElementById('kazaSevk').options.length));
  const kazaForm = doc.getElementById('kazaForm');
  const kazaIsyeri = doc.getElementById('kazaIsyeri');
  kazaIsyeri.value = 'iy1';
  kazaIsyeri.dispatchEvent(new window.Event('change', { bubbles: true }));
  await bekle(60);
  const kazaKisi = ISG.depo.al().personel.filter((p) => p.isyeriId === 'iy1')[0];
  kontrol('Personel listesi işyerine göre dolduruldu',
    doc.getElementById('kazaPersonel').options.length > 1,
    String(doc.getElementById('kazaPersonel').options.length));
  doc.getElementById('kazaPersonel').value = kazaKisi.id;
  doc.getElementById('kazaPersonel').dispatchEvent(new window.Event('change', { bubbles: true }));
  await bekle(40);
  const kisiOzet = doc.getElementById('kazaPersonelOzet');
  kontrol('Seçilen personelin bilgisi özetlendi',
    kisiOzet.hidden === false && new RegExp('Sicil ' + kazaKisi.sicil).test(kisiOzet.textContent),
    kisiOzet.textContent);
  kazaForm.elements.tarih.value = '2026-03-04';
  kazaForm.elements.personelId.value = kazaKisi.id;
  kazaForm.elements.yer.value = 'Pres hattı 2';
  kazaForm.elements.vucutBolgesi.value = 'el';
  kazaForm.elements.yaralanmaTuru.value = 'kesik';
  kazaForm.elements.neden.value = 'makine';
  kazaForm.elements.kayipGun.value = '3';
  kazaForm.elements.saglikKurulusu.value = 'Aydın Devlet Hastanesi';
  kazaForm.elements.aciklama.value = 'Kalıp değişimi sırasında el üzerine kalıp kaydı.';
  kazaForm.elements.kokNeden.value = 'Kalıp kilitleme pimi takılmamış.';
  kazaForm.elements.siddet.value = 'agir';
  kazaForm.elements.vardiya.value = '2';
  kazaForm.elements.hastaneSevk.value = 'evet';
  kazaForm.elements.istirahatBaslangic.value = '2026-03-02';
  kazaForm.elements.istirahatBitis.value = '2026-03-06';
  kazaForm.elements.istirahatBitis.dispatchEvent(new window.Event('change', { bubbles: true }));
  await bekle(40);
  kontrol('İstirahat aralığı kayıp günü otomatik hesapladı',
    kazaForm.elements.kayipGun.value === '5', String(kazaForm.elements.kayipGun.value));
  kazaForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await bekle(150);
  const kazaKayit = ISG.depo.al().olaylar.filter((o) => o.tur === 'isKazasi');
  kontrol('İş kazası kaydedildi', kazaKayit.length === kazaOnce + 1, String(kazaKayit.length));
  const yeniKaza = kazaKayit.filter((o) => o.tarih === '2026-03-04' && o.isyeriId === 'iy1')[0];
  kontrol('Kaza yaralanma bilgileri saklandı',
    !!yeniKaza && yeniKaza.vucutBolgesi === 'el' && yeniKaza.yaralanmaTuru === 'kesik' && yeniKaza.kayipGun === 5,
    JSON.stringify(yeniKaza && { bolge: yeniKaza.vucutBolgesi, tur: yeniKaza.yaralanmaTuru, gun: yeniKaza.kayipGun }));
  kontrol('Kaza kök neden sınıfı saklandı', !!yeniKaza && yeniKaza.neden === 'makine',
    String(yeniKaza && yeniKaza.neden));
  kontrol('Kaza şiddet / vardiya / sevk bilgileri saklandı',
    !!yeniKaza && yeniKaza.siddet === 'agir' && yeniKaza.vardiya === '2' && yeniKaza.hastaneSevk === 'evet',
    JSON.stringify(yeniKaza && { siddet: yeniKaza.siddet, vardiya: yeniKaza.vardiya, sevk: yeniKaza.hastaneSevk }));
  kontrol('İstirahat tarihleri saklandı',
    !!yeniKaza && yeniKaza.istirahatBaslangic === '2026-03-02' && yeniKaza.istirahatBitis === '2026-03-06',
    JSON.stringify(yeniKaza && { bas: yeniKaza.istirahatBaslangic, bit: yeniKaza.istirahatBitis }));
  kontrol('Ölüm kazası 6.000 iş günü sayılır', ISG.kazaKayipGun({ siddet: 'olum', kayipGun: 0 }) === 6000,
    String(ISG.kazaKayipGun({ siddet: 'olum', kayipGun: 0 })));
  kontrol('Tarih farkı gün cinsinden', ISG.tarihFarki('2026-03-02', '2026-03-06') === 4,
    String(ISG.tarihFarki('2026-03-02', '2026-03-06')));
  kontrol('Ayın başında işe giren personel o aydan sayılır',
    ISG.ayAktifPersonel([{ iseBaslama: '2026-03-01' }, { iseBaslama: '2026-04-01' }], '2026-03') === 1,
    String(ISG.ayAktifPersonel([{ iseBaslama: '2026-03-01' }, { iseBaslama: '2026-04-01' }], '2026-03')));
  kontrol('Kayıp gün aralığı hesaplandı', ISG.kayipGunAraligi(12).id === 'uzun' && ISG.kayipGunAraligi(0).id === 'yok');
  kontrol('Kıdem yılı hesaplandı', ISG.kidemYil('2020-01-01', '2026-03-04') === 6,
    String(ISG.kidemYil('2020-01-01', '2026-03-04')));
  kontrol('Kaza diyalogu kapandı', doc.getElementById('kazaDiyalog').open !== true);
  kontrol('Kaza satırı listeye eklendi', doc.querySelectorAll('.kaza-satir').length === kazaSatirOnce + 1,
    String(doc.querySelectorAll('.kaza-satir').length));
  doc.querySelector('[data-islem="kaza-duzenle"]').click();
  await bekle(100);
  kontrol('Kaza düzenleme formu dolu', doc.getElementById('kazaForm').elements.yer.value !== '');
  doc.querySelector('#kazaDiyalog [data-kapat]').click();
  await bekle(80);
  await sayfaAc('#istatistik');
  kontrol('İstatistikte iş kazası kartı var', /İşyeri bazında iş kazası/.test(metin('#gorunum')));
  kontrol('İstatistikte yaralanma bölgesi dağılımı var', /Yaralanma bölgesi/.test(metin('#gorunum')));
  kontrol('İstatistikte şiddet sınıfı kartı var', /Yaralanma şiddeti \(SGK\)/.test(metin('#gorunum')));
  kontrol('İstatistikte vardiya dağılımı var', /Vardiya dağılımı/.test(metin('#gorunum')));
  kontrol('İstatistikte haftanın günü kartı var', /Haftanın günü/.test(metin('#gorunum')));
  kontrol('İstatistikte KSO / KAO KPI var',
    /KSO \(sıklık oranı\)/.test(metin('#gorunum')) && /KAO \(ağırlık oranı\)/.test(metin('#gorunum')));
  kontrol('Aylık kaza oranları tablosu 12 satır', doc.querySelectorAll('.ist-tablo tbody tr').length === 12,
    String(doc.querySelectorAll('.ist-tablo tbody tr').length));
  kontrol('Aylık tablo KSO / KAO kolonlarını taşır',
    /İş saati/.test(metin('.ist-tablo thead')) && /KSO/.test(metin('.ist-tablo thead')) && /KAO/.test(metin('.ist-tablo thead')));
  const istKpiMetin = Array.from(doc.querySelectorAll('#gorunum .kpi')).map((k) => k.textContent).join(' | ');
  kontrol('KPI değerlerinde NaN yok', !/NaN/.test(istKpiMetin), istKpiMetin.slice(0, 160));
  kontrol('Oran KPI sayısal biçimde yazıldı', /\d+[.,]\d/.test(istKpiMetin), istKpiMetin.slice(0, 160));
  kontrol('İstatistikte kaza kayıt listesi var', /İş kazası ve meslek hastalığı kayıtları/.test(metin('#gorunum')) &&
    doc.querySelectorAll('#gorunum .kaza-satir').length >= 5,
    String(doc.querySelectorAll('#gorunum .kaza-satir').length));
  kontrol('İstatistikte yeni kaza kaydı listede', /Pres hattı 2/.test(metin('#gorunum')));
  kontrol('İstatistikte kaza bildir düğmesi var',
    doc.querySelectorAll('#gorunum [data-islem="kaza-yeni"]').length >= 1,
    String(doc.querySelectorAll('#gorunum [data-islem="kaza-yeni"]').length));
  doc.querySelector('#gorunum [data-islem="kaza-yeni"][data-tur="isKazasi"]').click();
  await bekle(100);
  kontrol('İstatistikten kaza diyalogu açıldı', doc.getElementById('kazaDiyalog').open === true);
  doc.querySelector('#kazaDiyalog [data-kapat]').click();
  await bekle(80);
  doc.querySelector('#gorunum [data-islem="kaza-duzenle"]').click();
  await bekle(100);
  kontrol('İstatistikten kaza düzenleme açıldı', doc.getElementById('kazaDiyalog').open === true &&
    doc.getElementById('kazaForm').elements.yer.value !== '');
  doc.querySelector('#kazaDiyalog [data-kapat]').click();
  await bekle(80);

  kontrol('İstatistikte veri girişi kartı var', /İş kazası \/ meslek hastalığı veri girişi/.test(metin('#gorunum')));
  const hastalikOnce = ISG.depo.al().olaylar.filter((o) => o.tur === 'meslekHastaligi').length;
  doc.querySelector('#gorunum [data-islem="kaza-yeni"][data-tur="meslekHastaligi"]').click();
  await bekle(100);
  const hastalikForm = doc.getElementById('kazaForm');
  kontrol('Meslek hastalığı diyaloğu tür seçili açıldı',
    doc.getElementById('kazaDiyalog').open === true && hastalikForm.elements.tur.value === 'meslekHastaligi',
    hastalikForm.elements.tur.value);
  kontrol('Meslek hastalığı alanları göründü',
    doc.getElementById('kazaHastalikGrupAlan').hidden === false &&
    doc.getElementById('kazaEtkenAlan').hidden === false &&
    doc.getElementById('kazaHastalikGrup').options.length === ISG.MESLEK_HASTALIK_GRUPLARI.length + 1,
    String(doc.getElementById('kazaHastalikGrup').options.length));
  kontrol('Tanı türü seçenekleri meslek hastalığına döndü',
    doc.getElementById('kazaYaralanma').options.length === ISG.HASTALIK_TURLERI.length + 1,
    String(doc.getElementById('kazaYaralanma').options.length));
  hastalikForm.elements.tarih.value = '2026-03-06';
  hastalikForm.elements.isyeriId.value = 'iy1';
  hastalikForm.elements.aciklama.value = 'Toz maruziyeti sonrası solunum fonksiyon testinde düşüş.';
  hastalikForm.elements.hastalikGrubu.value = 'd';
  hastalikForm.elements.etken.value = 'Kristal silika tozu';
  hastalikForm.elements.yaralanmaTuru.value = 'solunum';
  hastalikForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await bekle(120);
  const hastalikKayit = ISG.depo.al().olaylar.filter((o) => o.tur === 'meslekHastaligi');
  kontrol('Meslek hastalığı kaydedildi', hastalikKayit.length === hastalikOnce + 1, String(hastalikKayit.length));
  const yeniHastalik = hastalikKayit.filter((o) => o.tarih === '2026-03-06')[0];
  kontrol('Meslek hastalığı tanı bilgileri saklandı',
    !!yeniHastalik && yeniHastalik.hastalikGrubu === 'd' && yeniHastalik.etken === 'Kristal silika tozu' &&
    yeniHastalik.yaralanmaTuru === 'solunum',
    JSON.stringify(yeniHastalik && { grup: yeniHastalik.hastalikGrubu, etken: yeniHastalik.etken }));
  const hastalikSatir = doc.querySelector('#gorunum .kaza-satir[data-tur="meslekHastaligi"]');
  kontrol('Meslek hastalığı satırı rozetli listelendi',
    !!hastalikSatir && /Meslek hastalığı/.test(hastalikSatir.textContent),
    hastalikSatir ? hastalikSatir.textContent.slice(0, 100) : '');
  await sayfaAc('#saha');

  console.log('\n12) Risk ve acil durum');
  await sayfaAc('#risk');
  kontrol('Altı risk kartı', doc.querySelectorAll('.risk-kart').length === 6, String(doc.querySelectorAll('.risk-kart').length));
  kontrol('Roller listeleniyor', doc.querySelectorAll('.risk-kart .rol-satir').length >= 36, String(doc.querySelectorAll('.risk-kart .rol-satir').length));
  kontrol('5x5 risk tablosu var', /Olasılık × şiddet/.test(metin('#gorunum')));
  doc.querySelector('[data-islem="risk-ekip"]').click();
  await bekle(80);
  kontrol('Risk ekibi diyalogu açıldı', doc.getElementById('riskEkipDiyalog').open === true);
  const riskForm = doc.getElementById('riskEkipForm');
  riskForm.elements.sonDegerlendirme.value = '2026-01-10';
  riskForm.elements.temsilci.value = 'Elif Kaya';
  riskForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await bekle(120);
  const riskKayit = ISG.ilgiliKayit(ISG.depo.al(), 'riskEkipleri', 'iy1');
  kontrol('Risk yenileme otomatik hesaplandı', riskKayit.enGecYenileme === '2030-01-10', riskKayit.enGecYenileme);
  kontrol('Risk ekibi üyesi kaydedildi', riskKayit.uyeler.temsilci === 'Elif Kaya');

  await sayfaAc('#acil');
  kontrol('Acil durum kartları 6', doc.querySelectorAll('.risk-kart').length === 6, String(doc.querySelectorAll('.risk-kart').length));
  kontrol('Plan tarihi uyarısı var', /Plan tarihi girilmedi/.test(metin('#gorunum')));
  doc.querySelector('[data-islem="acil-plan"]').click();
  await bekle(80);
  kontrol('Acil plan diyalogu açıldı', doc.getElementById('acilPlanDiyalog').open === true);
  const acilForm = doc.getElementById('acilPlanForm');
  acilForm.elements.sonYenileme.value = '2026-02-01';
  acilForm.elements.ekip_koordinator.value = 'Barış Taşdemir';
  acilForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await bekle(120);
  const acilKayit = ISG.ilgiliKayit(ISG.depo.al(), 'acilPlanlar', 'iy1');
  kontrol('Acil plan yenileme kaydedildi', acilKayit.sonYenileme === '2026-02-01');
  kontrol('Acil ekip üyesi eklendi', acilKayit.ekip.some((u) => u.ad === 'Barış Taşdemir'));

  console.log('\n12a) Risk ve acil durum ekleri');
  const ekIcerik = 'data:text/plain;base64,' + Buffer.from('İSG belgesi').toString('base64');
  ISG.depo.ekKaydet({ kaynak: 'risk', kaynakId: 'iy1', isyeriId: 'iy1', ad: 'risk-degerlendirme.txt', boyut: 11, tur: 'text/plain', tarih: '2026-01-10', icerik: ekIcerik });
  ISG.depo.ekKaydet({ kaynak: 'acil', kaynakId: 'iy1', isyeriId: 'iy1', ad: 'acil-plan.txt', boyut: 9, tur: 'text/plain', tarih: '2026-02-01', icerik: ekIcerik });
  kontrol('Risk eki kaydedildi', ISG.depo.ekSayisi('risk', 'iy1') === 1, String(ISG.depo.ekSayisi('risk', 'iy1')));
  kontrol('Acil plan eki kaydedildi', ISG.depo.ekSayisi('acil', 'iy1') === 1);
  kontrol('Dosya maddesi belgeleri ayrı tutulur', ISG.depo.belgeler('iy1').length === 0);
  await sayfaAc('#risk');
  kontrol('Risk kartında ek listelenir', /risk-degerlendirme\.txt/.test(metin('#gorunum')));
  kontrol('Ek görüntüleme düğmesi var', doc.querySelectorAll('[data-islem="ek-goruntule"]').length === 1,
    String(doc.querySelectorAll('[data-islem="ek-goruntule"]').length));
  doc.querySelector('[data-islem="risk-ekip"]').click();
  await bekle(80);
  kontrol('Risk diyalogunda ek listesi dolu', /risk-degerlendirme\.txt/.test(metin('#riskEkipBelgeListe')));
  kontrol('Risk diyalogunda yükleme girdisi var', !!doc.getElementById('riskEkipBelgeGirdi'));
  const riskGirdi = doc.getElementById('riskEkipBelgeGirdi');
  const riskDosya = new window.File(['risk eki'], 'ui-risk.txt', { type: 'text/plain' });
  Object.defineProperty(riskGirdi, 'files', { value: [riskDosya], configurable: true });
  riskGirdi.dispatchEvent(new window.Event('change'));
  await bekle(200);
  kontrol('Risk diyalogundan belge yüklendi', ISG.depo.ekSayisi('risk', 'iy1') === 2, String(ISG.depo.ekSayisi('risk', 'iy1')));
  kontrol('Yüklenen belge listede', /ui-risk\.txt/.test(metin('#riskEkipBelgeListe')));
  doc.querySelector('#riskEkipBelgeListe [data-islem="belge-sil"]').click();
  await bekle(80);
  doc.getElementById('onayEvet').click();
  await bekle(160);
  kontrol('Risk eki kaldırıldı', ISG.depo.ekSayisi('risk', 'iy1') === 1, String(ISG.depo.ekSayisi('risk', 'iy1')));
  doc.getElementById('riskEkipDiyalog').removeAttribute('open');
  await sayfaAc('#acil');
  kontrol('Acil kartında ek listelenir', /acil-plan\.txt/.test(metin('#gorunum')));
  doc.querySelector('[data-islem="acil-plan"]').click();
  await bekle(80);
  kontrol('Acil diyalogunda ek listesi dolu', /acil-plan\.txt/.test(metin('#acilPlanBelgeListe')));
  doc.getElementById('acilPlanDiyalog').removeAttribute('open');

  console.log('\n12b) Ekip üyesi ekleme');
  await sayfaAc('#risk');
  kontrol('Risk kartlarında ekip üyesi düğmeleri var',
    doc.querySelectorAll('[data-islem="ekip-uye"][data-kaynak="risk"]').length === 42,
    String(doc.querySelectorAll('[data-islem="ekip-uye"][data-kaynak="risk"]').length));
  doc.querySelector('[data-islem="ekip-uye"][data-kaynak="risk"][data-isyeri="iy2"][data-rol="destek"]').click();
  await bekle(80);
  kontrol('Ekip üyesi diyalogu açıldı', doc.getElementById('ekipUyeDiyalog').open === true);
  const ekipForm = doc.getElementById('ekipUyeForm');
  kontrol('Rol otomatik seçildi', ekipForm.elements.rol.value === 'destek', ekipForm.elements.rol.value);
  const riskPersonel = Array.from(ekipForm.elements.personelId.options).filter((o) => o.value);
  kontrol('İşyeri personeli listeleniyor', riskPersonel.length === 4, String(riskPersonel.length));
  ekipForm.elements.personelId.value = riskPersonel[0].value;
  ekipForm.elements.personelId.dispatchEvent(new window.Event('change', { bubbles: true }));
  await bekle(30);
  const secilenAd = ekipForm.elements.ad.value;
  kontrol('Personel seçimi adı doldurdu', secilenAd === riskPersonel[0].textContent.split(' · ')[0], secilenAd);
  ekipForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await bekle(120);
  kontrol('Risk ekip üyesi kaydedildi',
    ISG.ilgiliKayit(ISG.depo.al(), 'riskEkipleri', 'iy2').uyeler.destek === secilenAd);

  await sayfaAc('#acil');
  kontrol('Acil durum destek rolleri listeleniyor', doc.querySelectorAll('.risk-kart .rol-satir').length === 30,
    String(doc.querySelectorAll('.risk-kart .rol-satir').length));
  kontrol('Acil planda ekip üyesi düğmeleri var',
    doc.querySelectorAll('[data-islem="ekip-uye"][data-kaynak="acil"]').length === 36,
    String(doc.querySelectorAll('[data-islem="ekip-uye"][data-kaynak="acil"]').length));
  doc.querySelector('[data-islem="ekip-uye"][data-kaynak="acil"][data-isyeri="iy2"][data-rol="Destek elemanı"]').click();
  await bekle(80);
  const acilEkleForm = doc.getElementById('ekipUyeForm');
  acilEkleForm.elements.ad.value = 'Destek Kişi';
  acilEkleForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await bekle(120);
  kontrol('Destek elemanı acil plana eklendi',
    ISG.ilgiliKayit(ISG.depo.al(), 'acilPlanlar', 'iy2').ekip.some((u) => u.rol === 'Destek elemanı' && u.ad === 'Destek Kişi'));
  doc.querySelector('[data-islem="ekip-uye-sil"][data-kaynak="acil"][data-isyeri="iy2"][data-rol="Destek elemanı"]').click();
  await bekle(80);
  kontrol('Ekip üyesi kaldırma onayı istendi', doc.getElementById('onayDiyalog').open === true);
  doc.getElementById('onayEvet').click();
  await bekle(150);
  kontrol('Ekip üyesi kaldırıldı',
    !ISG.ilgiliKayit(ISG.depo.al(), 'acilPlanlar', 'iy2').ekip.some((u) => u.rol === 'Destek elemanı'));

  console.log('\n12c) Excel (.xlsx) altyapısı');
  kontrol('Excel modülü yüklendi', !!ISG.excel && typeof ISG.excel.xlsxYaz === 'function' && typeof ISG.excel.oku === 'function');
  kontrol('Tarih GG.AA.YYYY dönüşümü', ISG.excel.tariheCevir('15.01.2024') === '2024-01-15', ISG.excel.tariheCevir('15.01.2024'));
  kontrol('Excel seri tarihi dönüşümü', ISG.excel.tariheCevir(45306) === '2024-01-15', String(ISG.excel.tariheCevir(45306)));
  const xlsx = ISG.excel.xlsxYaz([{ ad: 'Personel', basliklar: ['Sicil No', 'Adı Soyadı'], satirlar: [['7', 'Deneme Kişi']] }]);
  kontrol('XLSX ZIP imzası (PK)', xlsx[0] === 0x50 && xlsx[1] === 0x4B);
  const xlsxOnizleme = Array.from(xlsx.slice(0, 3000)).map((c) => String.fromCharCode(c)).join('');
  kontrol('XLSX iş kitabı ve çalışma sayfası içeriyor',
    /xl\/workbook\.xml/.test(xlsxOnizleme) && /xl\/worksheets\/sheet1\.xml/.test(xlsxOnizleme));
  let xlsxGeri = null;
  try { xlsxGeri = await ISG.excel.oku(xlsx); } catch (e) { xlsxGeri = null; }
  kontrol('XLSX geri okunuyor', !!xlsxGeri && xlsxGeri[0].satirlar[1][1] === 'Deneme Kişi',
    xlsxGeri ? JSON.stringify(xlsxGeri[0].satirlar) : 'okunamadı');

  const excelOncesi = ISG.depo.al().personel.length;
  const eklenenExcel = ISG.uygulama.personelSatirlariAktar([
    ['Sicil No', 'Adı Soyadı', 'İşe Başlama', 'İşyeri', 'Durum'],
    ['501', 'Excel Kişi', '15.01.2024', 'Aypaş', 'Aktif'],
    ['502', 'Excel İkinci', '45306', '', 'Pasif']
  ]);
  const excelKisiler = ISG.depo.al().personel.filter((p) => p.sicil === '501' || p.sicil === '502');
  kontrol('Excel satırları içe aktarıldı', eklenenExcel === 2 && ISG.depo.al().personel.length === excelOncesi + 2,
    String(eklenenExcel));
  kontrol('Excel tarihleri normalize edildi', excelKisiler.length === 2 && excelKisiler.every((p) => p.iseBaslama === '2024-01-15'),
    excelKisiler.map((p) => p.iseBaslama).join(','));
  kontrol('Excel durum alanı eşlendi', excelKisiler.some((p) => p.durum === 'pasif'));
  excelKisiler.forEach((p) => ISG.depo.personelSil(p.id));

  const eklenenBaslik = ISG.uygulama.personelSatirlariAktar([
    ['PERSONEL LİSTESİ'],
    ['Sicil No', 'Adı Soyadı', 'İşyeri'],
    ['601', 'Başlık Testi', 'Aypaş']
  ]);
  const baslikKisi = ISG.depo.al().personel.filter((p) => p.adSoyad === 'Başlık Testi')[0];
  kontrol('Başlık satırı otomatik bulundu', eklenenBaslik === 1 && !!baslikKisi, String(eklenenBaslik));
  if (baslikKisi) { ISG.depo.personelSil(baslikKisi.id); }

  await sayfaAc('#personel');
  kontrol('XLSX şablon düğmesi var', !!doc.querySelector('[data-islem="personel-sablon"]'));
  kontrol('Dosya girişi XLSX kabul ediyor', /\.xlsx/.test(doc.getElementById('personelDosya').getAttribute('accept') || ''));
  kontrol('Personel sayfası Excel/CSV içe aktarma sunuyor', /Excel\/CSV içe aktar/.test(metin('#gorunum')));

  console.log('\n12d) Şifre sıfırlama kodu');
  const sifirlama = await ISG.giris.kodGonder('mehmetkurt0948@gmail.com');
  kontrol('6 haneli kod üretildi', /^\d{6}$/.test(sifirlama.kayit.kod), sifirlama.kayit.kod);
  kontrol('Kod 10 dakika geçerli', sifirlama.kayit.sonGecerlilik - sifirlama.kayit.olusturma === 600000);
  kontrol('E-posta servisi tanımsızken kod gönderilmedi olarak işaretlenir', sifirlama.sonuc.gonderildi === false);
  let hataliKodReddedildi = false;
  try { ISG.giris.kodDogrula('mehmetkurt0948@gmail.com', '000000'); } catch (e) { hataliKodReddedildi = /Kod hatalı/.test(e.message); }
  kontrol('Hatalı kod reddedildi', hataliKodReddedildi);
  ISG.giris.sifreSifirla('mehmetkurt0948@gmail.com', sifirlama.kayit.kod, 'yeniSifre9', 'yeniSifre9');
  kontrol('Şifre güncellendi', ISG.depo.kullaniciEpostaBul('mehmetkurt0948@gmail.com').sifre === 'yeniSifre9');
  kontrol('Kod kaydı temizlendi', ISG.giris.sifirlamaOku() === null);
  ISG.yetki.korunmasiz('sifreGuncelle')('mehmetkurt0948@gmail.com', '1234');
  kontrol('Şifre sınama için geri alındı', ISG.depo.kullaniciEpostaBul('mehmetkurt0948@gmail.com').sifre === '1234');

  console.log('\n13) Yönetim raporu');
  await sayfaAc('#rapor');
  kontrol('Rapor dört KPI', doc.querySelectorAll('.kpi').length === 4);
  kontrol('Rapor tablosu altı satır', doc.querySelectorAll('.tablo-kucuk tbody tr').length === 6, String(doc.querySelectorAll('.tablo-kucuk tbody tr').length));
  kontrol('Tarih aralığı alanları var', !!doc.getElementById('raporBas') && !!doc.getElementById('raporBit'));

  console.log('\n13b) İstatistikler');
  await sayfaAc('#istatistik');
  kontrol('İstatistik sayfası açıldı', metin('.sayfa-baslik h1') === 'İstatistikler', metin('.sayfa-baslik h1'));
  kontrol('On iki istatistik KPI kartı var', doc.querySelectorAll('#gorunum .kpi').length === 12,
    String(doc.querySelectorAll('#gorunum .kpi').length));
  kontrol('Dağılım çubukları çizildi', doc.querySelectorAll('.ist-cubuk').length >= 20,
    String(doc.querySelectorAll('.ist-cubuk').length));
  kontrol('İşyeri dağılımı listelenir', doc.querySelectorAll('.ist-cubuk').length > 0 && /Eğitim geçerliliği/.test(metin('#gorunum')));
  kontrol('Dolu çubuk genişliği hesaplandı', Array.from(doc.querySelectorAll('.ist-cubuk-dolgu'))
    .some((cubuk) => /width:\s*\d+%/.test(cubuk.getAttribute('style') || '')), String(doc.querySelectorAll('.ist-cubuk-dolgu').length));
  kontrol('Aylık kaza sıklığı sütun grafiği var', doc.querySelectorAll('.ist-sutun').length === 12,
    String(doc.querySelectorAll('.ist-sutun').length));
  kontrol('Sütun yüksekliği hesaplandı', Array.from(doc.querySelectorAll('.ist-sutun-dolgu'))
    .some((sutun) => /height:\s*\d+%/.test(sutun.getAttribute('style') || '')));
  kontrol('Kök neden dağılımı gösterilir', /Kök neden dağılımı/.test(metin('#gorunum')));
  kontrol('Neden × vücut bölgesi matrisi çizildi',
    doc.querySelectorAll('.ist-matris tbody tr').length >= 4,
    String(doc.querySelectorAll('.ist-matris tbody tr').length));
  kontrol('Matriste dolu hücre var', doc.querySelectorAll('.ist-matris td.dolu').length > 0,
    String(doc.querySelectorAll('.ist-matris td.dolu').length));
  kontrol('Departman ve kıdem kırılımı var',
    /Departman bazında kaza/.test(metin('#gorunum')) && /Kıdem dağılımı/.test(metin('#gorunum')));
  kontrol('Kazalı personel sıralaması var', doc.querySelectorAll('.ist-liste-satir').length > 0,
    String(doc.querySelectorAll('.ist-liste-satir').length));

  /* Kaza/meslek hastalığı girişi istatistik sayfasından erişilebilir olmalı. */
  const girisKarti = doc.querySelector('#gorunum .kart-ic .satir-arac [data-islem="kaza-yeni"]');
  kontrol('İstatistikte kaza giriş kartı görünür',
    /İş kazası \/ meslek hastalığı veri girişi/.test(metin('#gorunum')) && !!girisKarti);
  kontrol('Kaza giriş kartında iki bildirim düğmesi var',
    doc.querySelectorAll('#gorunum .satir-arac [data-islem="kaza-yeni"]').length === 2,
    String(doc.querySelectorAll('#gorunum .satir-arac [data-islem="kaza-yeni"]').length));
  kontrol('Sayfa başlığında iki bildirim düğmesi var',
    doc.querySelectorAll('.sayfa-ust-arac [data-islem="kaza-yeni"]').length === 2,
    String(doc.querySelectorAll('.sayfa-ust-arac [data-islem="kaza-yeni"]').length));
  kontrol('Kaza listesi kartında da iki bildirim düğmesi var',
    doc.querySelectorAll('#gorunum .kart-arac [data-islem="kaza-yeni"]').length === 2,
    String(doc.querySelectorAll('#gorunum .kart-arac [data-islem="kaza-yeni"]').length));

  doc.querySelector('#gorunum .satir-arac [data-islem="kaza-yeni"][data-tur="isKazasi"]').click();
  await bekle(120);
  kontrol('Kaza bildir düğmesi giriş ekranını açar',
    doc.getElementById('kazaDiyalog').hidden === false && metin('#kazaBaslik') === 'İş kazası bildir',
    metin('#kazaBaslik'));
  kontrol('İş kazasında hastalık alanları gizli',
    doc.getElementById('kazaHastalikGrupAlan').hidden === true && doc.getElementById('kazaEtkenAlan').hidden === true);

  doc.querySelector('#gorunum .satir-arac [data-islem="kaza-yeni"][data-tur="meslekHastaligi"]').click();
  await bekle(120);
  kontrol('Meslek hastalığı bildir düğmesi giriş ekranını açar',
    doc.getElementById('kazaDiyalog').hidden === false && metin('#kazaBaslik') === 'Meslek hastalığı bildir',
    metin('#kazaBaslik'));
  kontrol('Meslek hastalığında tanı alanları görünür',
    doc.getElementById('kazaHastalikGrupAlan').hidden === false && doc.getElementById('kazaEtkenAlan').hidden === false);
  doc.querySelector('#kazaDiyalog [data-kapat]').click();
  await bekle(80);

  console.log('\n14) Ekip ve davetler');
  await sayfaAc('#ekip');
  const davetOncesi = ISG.depo.al().davetler.length;
  doc.getElementById('davetEposta').value = 'yeni.uye@ornek.com';
  doc.querySelector('.davet-isyeri[value="iy1"]').checked = true;
  doc.querySelector('[data-islem="davet-gonder"]').click();
  await bekle(120);
  kontrol('Davet oluşturuldu', ISG.depo.al().davetler.length === davetOncesi + 1, String(ISG.depo.al().davetler.length));
  kontrol('Davet listelendi', /yeni\.uye@ornek\.com/.test(metin('#gorunum')));

  console.log('\n15) Mevzuat ve kapsam');
  await sayfaAc('#mevzuat');
  kontrol('20 mevzuat başlığı', doc.querySelectorAll('.mevzuat-satir').length === 20, String(doc.querySelectorAll('.mevzuat-satir').length));
  kontrol('Dış bağlantı güvenli', (doc.querySelector('.link-dis') || {}).rel === 'noopener noreferrer');
  ISG.ui.mevzuatArama = 'gürültü';
  ISG.uygulama.ciz();
  await bekle(80);
  kontrol('Mevzuat araması filtreliyor', doc.querySelectorAll('.mevzuat-satir').length === 1, String(doc.querySelectorAll('.mevzuat-satir').length));
  ISG.ui.mevzuatArama = '';
  ISG.ui.mevzuatKategori = '';

  console.log('\n16) Menü, rozetler ve yapı');
  await sayfaAc('#panel');
  kontrol('Menüde 13 sayfa var', doc.querySelectorAll('.menu-oge[data-sayfa]').length === 13, String(doc.querySelectorAll('.menu-oge[data-sayfa]').length));
  kontrol('İstatistik menüde', doc.querySelectorAll('.menu-oge[data-sayfa="istatistik"]').length === 1);
  kontrol('Onay kuyruğu menüde', doc.querySelectorAll('.menu-oge[data-sayfa="onaylar"]').length === 1);
  kontrol('Dosya rozeti görünür', doc.getElementById('rozetDosya').hidden === false);
  kontrol('Saha rozeti sayı gösterir', /^\d+$/.test(doc.getElementById('rozetSaha').textContent));
  const idler = Array.from(doc.querySelectorAll('[id]')).map((e) => e.id);
  const tekrar = idler.filter((id, i) => idler.indexOf(id) !== i);
  kontrol('Tekrarlanan id yok', tekrar.length === 0, tekrar.slice(0, 5).join(', '));
  const kullanimlar = Array.from(doc.querySelectorAll('use[href]')).map((u) => u.getAttribute('href'));
  const eksikIkon = kullanimlar.filter((h) => !doc.querySelector(h));
  kontrol('SVG ikon referansları geçerli', eksikIkon.length === 0, eksikIkon.slice(0, 3).join(', '));
  kontrol('Diyalog sayısı 13', doc.querySelectorAll('dialog').length === 13, String(doc.querySelectorAll('dialog').length));
  kontrol('Bulut diyaloğu var', !!doc.getElementById('bulutDiyalog'));
  kontrol('Bulut başlık düğmesi var', doc.querySelectorAll('[data-islem="bulut-ayar"]').length === 1,
    String(doc.querySelectorAll('[data-islem="bulut-ayar"]').length));
  kontrol('Bulut alanları hazır',
    ['bulutUrl', 'bulutAnahtar', 'bulutOda', 'bulutAralik', 'bulutOtomatik', 'bulutYukari',
      'bulutDurumSatir', 'bulutUyari', 'bulutKes', 'bulutSimdi', 'bulutSql']
      .every((id) => !!doc.getElementById(id)));
  kontrol('Bulut SQL betiği dolduruldu',
    /create table if not exists public\.isg_veri/.test((doc.getElementById('bulutSql') || {}).textContent || ''));
  /* Yayınlanan kimlik (bulut-kimlik.js) dolu olduğu için site artık varsayılan
     olarak buluta bağlıdır; düğmeler görünür gelir. Elle bağlantıyı kesen cihazda
     gizlendiği 21b bölümünde doğrulanır. */
  kontrol('Yayınlanan kimlikte bulut varsayılan açık, düğmeler görünür',
    ISG.bulut.kimlikVarMi() === true &&
    doc.getElementById('bulutKes').hidden === false &&
    doc.getElementById('bulutSimdi').hidden === false);
  const varliklar = Array.from(doc.querySelectorAll('script[src], link[href]'))
    .map((e) => e.getAttribute('src') || e.getAttribute('href'));
  kontrol('Varlık yolları göreli', varliklar.every((y) => !/^\//.test(y)), varliklar.join(', '));

  console.log('\n17) Yedekleme, geri yükleme, sıfırlama');
  const yedek = ISG.depo.disariAktar();
  let yedekGecerli = false;
  try { JSON.parse(yedek); yedekGecerli = true; } catch (e) { yedekGecerli = false; }
  kontrol('JSON yedeği geçerli', yedekGecerli);
  kontrol('Yedek 6 işyeri taşır', JSON.parse(yedek).isyerleri.length === 6);
  const geri = ISG.depo.iceAktar(yedek);
  kontrol('Yedek geri yüklenebiliyor', geri.isyerleri.length === 6);
  let bozukReddedildi = false;
  try { ISG.depo.iceAktar('{"personel": 5}'); } catch (e) { bozukReddedildi = true; }
  kontrol('Bozuk yedek reddedildi', bozukReddedildi);

  ISG.depo.sifirla();
  ISG.ui.kapsam = '';
  ISG.uygulama.ciz();
  await bekle(150);
  kontrol('Veri sıfırlama boş veriye döndürüyor',
    ISG.depo.al().isyerleri.length === 0 && ISG.depo.al().personel.length === 0,
    ISG.depo.al().isyerleri.length + ' işyeri / ' + ISG.depo.al().personel.length + ' personel');
  kontrol('Veri sıfırlama örnek veriyi geri getirmiyor',
    ISG.depo.al().mevzuat.length === 0 && ISG.depo.al().dosyalar.length === 0);
  kontrol('Veri sıfırlama hesapları koruyor',
    ISG.depo.al().kullanicilar.some((k) => k.eposta === 'mehmetkurt0948@gmail.com'),
    ISG.depo.al().kullanicilar.map((k) => k.eposta).join(', '));
  kontrol('Sıfırlama silinen her kayıt için mezar taşı bırakıyor',
    Object.keys(ISG.depo.al().senkron.silinen).length > 600,
    String(Object.keys(ISG.depo.al().senkron.silinen).length));
  kontrol('Sıfırlama sonrası panel açık', metin('.sayfa-baslik h1') === 'Genel bakış');

  /* Örnek veri düğmesi uçtan uca: onay istenir, evet denince kayıtlar gelir. */
  kontrol('Sıfırlama sonrası örnek veri düğmesi görünür',
    doc.getElementById('ornekVeriDugme').hidden === false);
  doc.querySelector('[data-islem="ornek-veri"]').click();
  await bekle(80);
  kontrol('Örnek veri yükleme onay istiyor', doc.getElementById('onayDiyalog').open === true &&
    /Örnek veri/.test(metin('#onayBaslik')), metin('#onayBaslik'));
  doc.getElementById('onayEvet').click();
  await bekle(200);
  kontrol('Örnek veri düğmesi kayıtları getirdi',
    ISG.depo.al().isyerleri.length === 6 && ISG.depo.al().personel.length === 37,
    ISG.depo.al().isyerleri.length + ' işyeri');
  await sayfaAc('#isyerleri');
  kontrol('Örnek veri sonrası kurum adı geldi', /Aydın Büyükşehir/.test(metin('.kurum-serit')),
    metin('.kurum-serit'));
  /* Ekran dolaşımı boş veriyle yapılacak: öncesinde yine boşlanıyor. */
  ISG.depo.sifirla();
  ISG.uygulama.ciz();
  await bekle(120);
  kontrol('İkinci sıfırlama da boş veri veriyor', ISG.depo.al().isyerleri.length === 0);

  console.log('\n18) Tüm ekranlarda metin ve ikon temizliği (boş veriyle)');
  const tumSayfalar = ['panel', 'isyerleri', 'personel', 'dosyalar', 'plan', 'saha', 'rapor', 'istatistik', 'risk', 'acil', 'ekip', 'onaylar', 'mevzuat'];
  for (const sayfa of tumSayfalar) {
    await sayfaAc('#' + sayfa);
    const icerik = metin('#gorunum');
    kontrol('#' + sayfa + ' temiz render', !/undefined|NaN|\[object Object\]/.test(icerik),
      (icerik.match(/.{0,40}(undefined|NaN|\[object Object\]).{0,40}/) || [''])[0]);
    kontrol('#' + sayfa + ' başlığı dolu', metin('.sayfa-baslik h1').length > 2);
    const sayfaIkonlari = Array.from(doc.querySelectorAll('#gorunum use[href]')).map((u) => u.getAttribute('href'));
    const kirikIkon = sayfaIkonlari.filter((h) => !doc.querySelector(h));
    kontrol('#' + sayfa + ' ikonları eksiksiz', kirikIkon.length === 0, kirikIkon.join(', '));
  }

  /* Bölüm 18 boş veriyle koşuldu; sonraki bölümler örnek veriyi kullanır. */
  ISG.depo.ornekYukle();
  ISG.ui.kapsam = '';
  ISG.uygulama.girisSonrasi();
  await bekle(150);
  kontrol('Sonraki bölümler için örnek veri geri yüklendi',
    ISG.depo.al().isyerleri.length === 6, String(ISG.depo.al().isyerleri.length));

  console.log('\n19) Yayın paketi (GitHub Pages)');
  const pubKok = kok;
  const varMi = (goreli) => fs.existsSync(path.join(pubKok, goreli));
  kontrol('.nojekyll var', varMi('.nojekyll'));
  kontrol('404.html var', varMi('404.html'));
  kontrol('robots.txt yayında değil', !varMi('robots.txt'));
  kontrol('favicon.svg var', varMi('assets/img/favicon.svg'));
  kontrol('apple-touch-icon.png var', varMi('assets/img/apple-touch-icon.png'));

  let manifest = null;
  try { manifest = JSON.parse(fs.readFileSync(path.join(pubKok, 'manifest.webmanifest'), 'utf8')); } catch (e) { manifest = null; }
  kontrol('manifest geçerli JSON', !!manifest);
  if (manifest) {
    kontrol('manifest adı dolu', typeof manifest.name === 'string' && manifest.name.length > 2);
    kontrol('manifest theme_color var', /^#[0-9a-f]{6}$/i.test(String(manifest.theme_color)));
    kontrol('manifest start_url göreli', typeof manifest.start_url === 'string' && !/^\//.test(manifest.start_url), manifest.start_url);
    const ikonlar = (manifest.icons || []).map((i) => i.src);
    kontrol('manifest simgeleri mevcut', ikonlar.length > 0 && ikonlar.every(varMi), ikonlar.filter((s) => !varMi(s)).join(', '));
    kontrol('manifest maskable simge bildirir', (manifest.icons || []).some((i) => String(i.purpose).indexOf('maskable') !== -1));
    kontrol('manifest 192 ve 512 piksel sunar', ['192x192', '512x512'].every((b) => (manifest.icons || []).some((i) => i.sizes === b)));
  }

  const bas = doc.head.innerHTML;
  kontrol('index.html simge bağlantısı verir', /rel="icon"[^>]*favicon\.svg/.test(bas));
  kontrol('index.html apple-touch-icon verir', /rel="apple-touch-icon"/.test(bas));
  kontrol('index.html manifest bağlar', /rel="manifest"[^>]*manifest\.webmanifest/.test(bas));

  const pngBaslik = (dosya) => {
    const b = fs.readFileSync(path.join(pubKok, dosya));
    const gecerli = b.slice(1, 4).toString() === 'PNG';
    return gecerli ? b.readUInt32BE(16) + 'x' + b.readUInt32BE(20) : '';
  };
  kontrol('ikon-192.png 192 piksel', pngBaslik('assets/img/ikon-192.png') === '192x192', pngBaslik('assets/img/ikon-192.png'));
  kontrol('ikon-512.png 512 piksel', pngBaslik('assets/img/ikon-512.png') === '512x512', pngBaslik('assets/img/ikon-512.png'));
  kontrol('apple-touch-icon.png 180 piksel', pngBaslik('assets/img/apple-touch-icon.png') === '180x180', pngBaslik('assets/img/apple-touch-icon.png'));

  const yayinDosyalari = [];
  (function tara(dizin) {
    for (const ad of fs.readdirSync(path.join(pubKok, dizin))) {
      const goreli = dizin ? dizin + '/' + ad : ad;
      const tam = path.join(pubKok, goreli);
      if (fs.statSync(tam).isDirectory()) {
        if (['node_modules', 'tools', '.git'].indexOf(ad) === -1) { tara(goreli); }
      } else if (/\.(html|css|js)$/.test(ad)) {
        yayinDosyalari.push(goreli);
      }
    }
  })('');
  const mutlakYol = yayinDosyalari.filter((d) => {
    const icerik = fs.readFileSync(path.join(pubKok, d), 'utf8');
    return /(?:src|href)="\/(?!\/)/.test(icerik);
  });
  kontrol('Yayın dosyalarında kök mutlak yol yok', mutlakYol.length === 0, mutlakYol.join(', '));
  kontrol('Yayında dış CDN bağımlılığı yok', yayinDosyalari.every((d) => {
    const icerik = fs.readFileSync(path.join(pubKok, d), 'utf8');
    return !/(?:src|href)="https?:\/\/(?!mevzuat\.gov\.tr)/.test(icerik);
  }));

  // --- Sürüm damgası, git kancaları ve yayın doğrulama altyapısı (2.9.0) ---
  const sayfaHtml = fs.readFileSync(path.join(pubKok, 'index.html'), 'utf8');
  const varlikReferanslari = Array.from(sayfaHtml.matchAll(/(?:src|href)="([^"]+\.(?:js|css))(?:\?([^"]*))?"/g))
    .filter((m) => !/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(m[1]) && !m[1].startsWith('/'));
  const dmgasiz = varlikReferanslari.filter((m) => !/(?:^|&)v=/.test(m[2] || ''));
  kontrol('index.html tüm JS/CSS referanslarında ?v= damgası var', dmgasiz.length === 0,
    dmgasiz.map((m) => m[1]).join(', '));

  const ozet = (goreli) => crypto.createHash('sha1')
    .update(Buffer.from(fs.readFileSync(path.join(pubKok, goreli), 'utf8').replace(/\r\n/g, '\n'), 'utf8'))
    .digest('hex').slice(0, 8);
  const eskiDamgalar = varlikReferanslari.filter((m) => {
    const damga = /(?:^|&)v=([^&]*)/.exec(m[2] || '');
    return !damga || damga[1] !== ozet(m[1]);
  });
  kontrol('?v= damgaları dosya içeriğiyle uyumlu', eskiDamgalar.length === 0,
    eskiDamgalar.map((m) => m[1]).join(', '));

  const kancalar = ['pre-commit', 'pre-push', 'post-commit'];
  kontrol('Git kancaları kurulu dosyalar var', kancalar.every((k) => varMi('.githooks/' + k)),
    kancalar.filter((k) => !varMi('.githooks/' + k)).join(', '));
  kontrol('Git kancaları LF satır sonu kullanır', kancalar.every((k) =>
    !fs.readFileSync(path.join(pubKok, '.githooks', k)).includes(13)));
  kontrol('pre-commit damgayı eşitler', /node tools\/varlik-surum\.js/.test(
    fs.readFileSync(path.join(pubKok, '.githooks/pre-commit'), 'utf8')));
  kontrol('pre-push testleri zorunlu kılar', /npm test/.test(
    fs.readFileSync(path.join(pubKok, '.githooks/pre-push'), 'utf8')));
  kontrol('post-commit otomatik push yapar', /git push/.test(
    fs.readFileSync(path.join(pubKok, '.githooks/post-commit'), 'utf8')));

  const paketJson = JSON.parse(fs.readFileSync(path.join(kok, 'package.json'), 'utf8'));
  const beklenenBetikler = ['surum', 'surum:denetle', 'hooks', 'yayin:dogrula', 'prepare'];
  kontrol('package.json otomasyon betiklerini tanımlar',
    beklenenBetikler.every((b) => paketJson.scripts && paketJson.scripts[b]),
    beklenenBetikler.filter((b) => !(paketJson.scripts && paketJson.scripts[b])).join(', '));
  kontrol('prepare betiği kancaları kurar', /hooks-kur\.js/.test(String((paketJson.scripts || {}).prepare || '')));
  kontrol('package.json yayın adresi tanımlı', /^https:\/\//.test(String(paketJson.homepage || '')));

  const isAkisi = fs.readFileSync(path.join(kok, '.github/workflows/kontrol.yml'), 'utf8');
  kontrol('CI iş akışı damga ve test denetimi yapar',
    /varlik-surum\.js --denetle/.test(isAkisi) && /npm test/.test(isAkisi));
  kontrol('CI iş akışı canlı yayını doğrular', /yayin-dogrula\.js --bekle/.test(isAkisi));
  kontrol('CI Node sürümü jsdom 30 ile uyumlu (>=22)', /node-version: '(?:2[2-9]|[3-9]\d)'/.test(isAkisi) &&
    /"node": ">=22/.test(fs.readFileSync(path.join(kok, 'package.json'), 'utf8')));

  kontrol('.gitattributes kanca satır sonlarını sabitler', /\.githooks\/\*\s+text\s+eol=lf/.test(
    fs.readFileSync(path.join(pubKok, '.gitattributes'), 'utf8')));

  console.log('\n20) Roller, kapsam ve onay kuyruğu');
  const cikisYap = async () => {
    doc.getElementById('oturumKapat').click();
    await bekle(90);
    const onay = doc.getElementById('onayEvet');
    if (onay) { onay.click(); }
    await bekle(180);
  };
  const girisAcVeYap = async (eposta, sifre) => {
    ISG.giris.baslat(function () { ISG.uygulama.girisSonrasi(); });
    await bekle(70);
    await girisYap(eposta, sifre);
  };

  doc.getElementById('oturumKapat').click();
  await bekle(90);
  kontrol('Oturum kapatma onayı istendi', doc.getElementById('onayDiyalog').open === true);
  doc.getElementById('onayEvet').click();
  await bekle(180);
  kontrol('Oturum kapatıldı', !ISG.yetki.oturum());

  await girisAcVeYap('buse.senol@ornek.com', '1234');
  kontrol('Yetkili oturumu açıldı', !!ISG.yetki.oturum() && ISG.yetki.oturum().rol === 'yetkili');
  kontrol('Yetkili iki işyeri kapsamında', ISG.yetki.gorunum().isyerleri.length === 2, String(ISG.yetki.gorunum().isyerleri.length));
  kontrol('Yetkili yalnız kendi personelini görür',
    ISG.yetki.gorunum().personel.every((p) => ['iy1', 'iy2'].indexOf(p.isyeriId) > -1));
  kontrol('Yetkili işyerleri sayfasını görmez', doc.querySelector('.menu-oge[data-sayfa="isyerleri"]').hidden === true);
  kontrol('Yetkili ekip sayfasını görmez', doc.querySelector('.menu-oge[data-sayfa="ekip"]').hidden === true);
  kontrol('Yetkili onay kuyruğunu görür', doc.getElementById('menuOnaylar').hidden === false);

  const tabanBekleyen = ISG.yetki.bekleyenSayisi();
  const yetkiliSonuc = ISG.depo.personelKaydet({
    adSoyad: 'Onay Bekleyen', sicil: '77', meslek: 'Test operatörü', isyeriId: 'iy1', iseBaslama: '2026-02-01'
  });
  kontrol('Yetkili yazımı talebe dönüştü', !!(yetkiliSonuc && yetkiliSonuc.bekliyor === true), JSON.stringify(yetkiliSonuc && yetkiliSonuc.bekliyor));
  kontrol('Kayıt doğrudan yazılmadı', !ISG.depo.al().personel.some((p) => p.adSoyad === 'Onay Bekleyen'));
  kontrol('Bekleyen talep sayısı arttı', ISG.yetki.bekleyenSayisi() === tabanBekleyen + 1,
    tabanBekleyen + ' -> ' + ISG.yetki.bekleyenSayisi());

  await cikisYap();
  await girisAcVeYap('selin.aydin@ornek.com', '1234');
  kontrol('Görüntüleyici oturumu açıldı', !!ISG.yetki.oturum() && ISG.yetki.oturum().rol === 'goruntuleyici');
  kontrol('Salt okunur gövde sınıfı', doc.body.classList.contains('salt-okunur'));
  kontrol('Görüntüleyici tek işyeri görür', ISG.yetki.gorunum().isyerleri.length === 1, String(ISG.yetki.gorunum().isyerleri.length));
  kontrol('Görüntüleyici onay kuyruğunu görmez', doc.getElementById('menuOnaylar').hidden === true);
  kontrol('Görüntüleyici yazma yapamaz', (function () {
    try {
      ISG.depo.personelKaydet({ adSoyad: 'Yasak Kayıt', isyeriId: 'iy1' });
      return false;
    } catch (hata) { return /Görüntüleyici/.test(hata.message); }
  })());

  await cikisYap();
  await girisAcVeYap('mehmetkurt0948@gmail.com', '1234');
  kontrol('Yönetici yazma yetkisi', ISG.yetki.izin('ekle', 'iy6') === true);
  kontrol('Yönetici tüm işyerlerini görür', ISG.yetki.gorunum().isyerleri.length === 6, String(ISG.yetki.gorunum().isyerleri.length));
  kontrol('Bekleyen talep rozeti görünür', doc.getElementById('rozetOnay').hidden === false, doc.getElementById('rozetOnay').textContent);
  kontrol('Rozet bekleyen sayısını gösterir', doc.getElementById('rozetOnay').textContent === String(tabanBekleyen + 1),
    doc.getElementById('rozetOnay').textContent);

  await sayfaAc('#onaylar');
  kontrol('Onay kuyruğu sayfası açıldı', metin('.sayfa-baslik h1') === 'Onay kuyruğu', metin('.sayfa-baslik h1'));
  kontrol('Onay satırları listelendi', doc.querySelectorAll('.onay-satir').length === ISG.yetki.talepler(true).length,
    doc.querySelectorAll('.onay-satir').length + ' / ' + ISG.yetki.talepler(true).length);
  kontrol('Onay düğmeleri yöneticide görünür',
    doc.querySelectorAll('[data-islem="talep-onayla"]').length === ISG.yetki.talepler().length,
    doc.querySelectorAll('[data-islem="talep-onayla"]').length + ' / ' + ISG.yetki.talepler().length);

  const bizimTalep = ISG.yetki.talepler().filter(function (talep) {
    return talep.eylem && talep.eylem.ad === 'personelKaydet' &&
      talep.eylem.args && talep.eylem.args[0] && talep.eylem.args[0].adSoyad === 'Onay Bekleyen';
  })[0];
  kontrol('Talep kaydı bulundu', !!bizimTalep);
  ISG.yetki.talepOnayla(bizimTalep.id, 'Test onayı');
  ISG.uygulama.ciz();
  await bekle(140);
  kontrol('Onay kaydı uyguladı', ISG.depo.al().personel.some((p) => p.adSoyad === 'Onay Bekleyen'));
  kontrol('Talep onaylandı olarak kapandı', (ISG.depo.talepBul(bizimTalep.id) || {}).durum === 'onaylandi');
  kontrol('Bekleyen talep azaldı', ISG.yetki.bekleyenSayisi() === tabanBekleyen, String(ISG.yetki.bekleyenSayisi()));
  kontrol('Denetim izi kaydedildi', ISG.yetki.denetimListe().length > 0, String(ISG.yetki.denetimListe().length));

  console.log('\n21) Bulut eşitleme akışı');
  if (ISG.bulut.hazirMi()) { ISG.bulut.kapat(); }
  window.localStorage.removeItem('isgtakip.bulut');
  window.localStorage.removeItem('isgtakip.bulut.durum');

  /* Supabase yerine sahte uç nokta: istekler kaydedilir, yanıt taklit edilir.
     `fetchKur` ile herhangi bir testin mock'u bozması sonrası geri yüklenebilir. */
  const istekler = { adet: 0, yontem: '', adres: '', govde: null };
  let uzakSatir = null;
  const fetchKur = () => {
    window.fetch = (adres, secenek) => {
      const yontem = (secenek && secenek.method) || 'GET';
      istekler.adet += 1;
      istekler.yontem = yontem;
      istekler.adres = String(adres);
      if (yontem === 'POST') {
        istekler.govde = JSON.parse(secenek.body);
        return Promise.resolve({ ok: true, status: 201, text: () => Promise.resolve('') });
      }
      const govde = JSON.stringify(uzakSatir ? [uzakSatir] : []);
      return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(govde) });
    };
  };
  fetchKur();

  doc.querySelector('[data-islem="bulut-ayar"]').click();
  await bekle(140);
  const bulutDiyalog = doc.getElementById('bulutDiyalog');
  const bulutForm = doc.getElementById('bulutForm');
  kontrol('Bulut diyaloğu açıldı', bulutDiyalog.open === true);
  kontrol('SQL betiği diyaloğa yazıldı', /create table if not exists public\.isg_veri/.test(metin('#bulutSql')));
  kontrol('Bağlantı yokken kes/eşitle gizli, yukarı seçeneği açık',
    doc.getElementById('bulutKes').hidden === true && doc.getElementById('bulutSimdi').hidden === true &&
    doc.getElementById('bulutYukari').closest('label').hidden === false);

  doc.getElementById('bulutUrl').value = 'https://ornek.supabase.co';
  doc.getElementById('bulutAnahtar').value = 'kisa';
  doc.getElementById('bulutOda').value = 'isg-merkez';
  bulutForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await bekle(80);
  kontrol('Kısa anon anahtarı reddedilir',
    doc.getElementById('bulutUyari').hidden === false && /anon anahtar/i.test(metin('#bulutUyari')), metin('#bulutUyari'));
  kontrol('Doğrulama hatasında istek gitmez', istekler.adet === 0, String(istekler.adet));

  doc.getElementById('bulutAnahtar').value = 'anon-test-anahtari-0123456789';
  doc.getElementById('bulutYukari').checked = true;
  bulutForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await bekle(500);
  const bulutAyar = JSON.parse(window.localStorage.getItem('isgtakip.bulut') || 'null');
  kontrol('Bulut ayarı kaydedildi', !!bulutAyar && bulutAyar.oda === 'isg-merkez' &&
    bulutAyar.url === 'https://ornek.supabase.co' && bulutAyar.aralik === 20, JSON.stringify(bulutAyar));
  kontrol('İlk eşitlemede veri buluta yazıldı', istekler.yontem === 'POST' &&
    istekler.govde[0].oda === 'isg-merkez' && Array.isArray(istekler.govde[0].veri.personel) &&
    /\/rest\/v1\/isg_veri$/.test(istekler.adres), istekler.yontem + ' ' + istekler.adres);
  kontrol('Durum satırı bulut kaydını gösterir', /Bulut kayıt açık/.test(metin('#bulutDurumSatir')), metin('#bulutDurumSatir'));
  kontrol('Bağlantı sonrası diyalog kapandı', bulutDiyalog.open === false);
  kontrol('Kayıt durumu alt çubukta bulut bilgisini gösterir', /Bulut kayıt açık/.test(metin('#kayitDurumu')),
    metin('#kayitDurumu'));

  doc.querySelector('[data-islem="bulut-ayar"]').click();
  await bekle(140);
  kontrol('Bağlantı açıkken kes/eşitle görünür, yukarı seçeneği gizli',
    doc.getElementById('bulutKes').hidden === false && doc.getElementById('bulutSimdi').hidden === false &&
    doc.getElementById('bulutYukari').closest('label').hidden === true);
  kontrol('Gönder düğmesi "Ayarları kaydet" oldu', metin('#bulutForm button[type="submit"]') === 'Ayarları kaydet',
    metin('#bulutForm button[type="submit"]'));

  const cihazVeri = ISG.depo.al();
  const uzakKisi = Object.assign({}, cihazVeri.personel[0], { id: 'bulut-test-1', adSoyad: 'Bulut Test Kişi' });
  uzakSatir = {
    veri: Object.assign({}, cihazVeri, { personel: cihazVeri.personel.concat([uzakKisi]) }),
    guncelleme: '2099-01-01T00:00:00.000Z'
  };
  doc.getElementById('bulutSimdi').click();
  await bekle(600);
  kontrol('Uzak kayıt bu cihaza indirildi', ISG.depo.al().personel.some((p) => p.id === 'bulut-test-1'));
  kontrol('Son uzak zaman damgası yazıldı',
    JSON.parse(window.localStorage.getItem('isgtakip.bulut.durum') || '{}').sonUzakZaman === '2099-01-01T00:00:00.000Z',
    window.localStorage.getItem('isgtakip.bulut.durum'));

  /* Kayıt bazında birleştirme: bulut tüm belgeyi ezseydi bu senaryolarda
     kayıtlar kaybolurdu. Birleştirme kuralları depo katmanındadır. */
  const veriKopyasi = () => JSON.parse(JSON.stringify(ISG.depo.al()));
  const kisiEkle = (veri, kimlik, ad, zaman) => {
    const ornek = veri.personel[0];
    veri.personel = veri.personel.concat([Object.assign({}, ornek, {
      id: kimlik, adSoyad: ad, guncelleme: zaman
    })]);
    return veri;
  };

  const birlesimYerel = kisiEkle(veriKopyasi(), 'birlesim-yerel', 'Yerel Kişi', '2030-01-02T00:00:00.000Z');
  const birlesimUzak = kisiEkle(veriKopyasi(), 'birlesim-uzak', 'Uzak Kişi', '2030-01-03T00:00:00.000Z');
  const birlesim = ISG.depo.birlestir(birlesimYerel, birlesimUzak);
  kontrol('Birleştirme iki cihazın yeni kayıtlarını korur',
    birlesim.veri.personel.some((p) => p.id === 'birlesim-yerel') &&
    birlesim.veri.personel.some((p) => p.id === 'birlesim-uzak'));
  kontrol('Birleştirme buluta yazılacak yeniliği bildirir', birlesim.yerelFazla === true);

  const ayniBirlesim = ISG.depo.birlestir(veriKopyasi(), veriKopyasi());
  kontrol('Aynı verinin birleşimi değişiklik üretmez (gönderim döngüsü yok)',
    ayniBirlesim.yerelFazla === false && ayniBirlesim.uzakFazla === false);

  const tersAnahtar = veriKopyasi();
  tersAnahtar.personel = tersAnahtar.personel.map((p) => Object.keys(p).reverse()
    .reduce((toplam, anahtar) => { toplam[anahtar] = p[anahtar]; return toplam; }, {}));
  const anahtarBirlesim = ISG.depo.birlestir(veriKopyasi(), tersAnahtar);
  kontrol('Anahtar sırası değişen bulut verisi değişiklik sayılmaz',
    anahtarBirlesim.yerelFazla === false && anahtarBirlesim.uzakFazla === false);

  const mezarYerel = veriKopyasi();
  const mezarUzak = kisiEkle(veriKopyasi(), 'birlesim-mezar', 'Silinen Kişi', '2030-01-01T00:00:00.000Z');
  mezarYerel.senkron.silinen['personel|birlesim-mezar'] = '2030-01-05T00:00:00.000Z';
  const mezarBirlesim = ISG.depo.birlestir(mezarYerel, mezarUzak);
  kontrol('Mezar taşı kaydı buluttan da düşürür',
    !mezarBirlesim.veri.personel.some((p) => p.id === 'birlesim-mezar'));
  kontrol('Silme buluta yazılacak yenilik sayılır', mezarBirlesim.yerelFazla === true);

  const cakisanYerel = veriKopyasi();
  const cakisanUzak = veriKopyasi();
  const cakisanKimlik = cakisanYerel.personel[0].id;
  cakisanYerel.personel[0] = Object.assign({}, cakisanYerel.personel[0],
    { meslek: 'Yerel meslek', guncelleme: '2030-02-01T00:00:00.000Z' });
  cakisanUzak.personel[0] = Object.assign({}, cakisanUzak.personel[0],
    { meslek: 'Uzak meslek', guncelleme: '2030-02-02T00:00:00.000Z' });
  const cakisan = ISG.depo.birlestir(cakisanYerel, cakisanUzak);
  const cakisanSonuc = cakisan.veri.personel.filter((p) => p.id === cakisanKimlik)[0] || {};
  kontrol('Aynı kayıtta son yazan kazanır', cakisanSonuc.meslek === 'Uzak meslek', String(cakisanSonuc.meslek));
  kontrol('Eski taraf yeniden buluta yazılmaz', cakisan.yerelFazla === false);

  window.fetch = () => Promise.reject(new TypeError('ağ yok'));
  doc.getElementById('bulutSimdi').click();
  await bekle(500);
  kontrol('Ağ yokken hata durumu gösterilir', /Bulut bağlantısı yok/.test(metin('#bulutDurumSatir')), metin('#bulutDurumSatir'));
  kontrol('Ağ yokken uyarı kutusu açılır', doc.getElementById('bulutUyari').hidden === false, metin('#bulutUyari'));

  doc.getElementById('bulutKes').click();
  await bekle(140);
  const onayDiyalog = doc.getElementById('onayDiyalog');
  kontrol('Bağlantıyı kesmeden önce onay istenir', onayDiyalog.open === true &&
    /Bulut bağlantısı kesilsin mi/.test(metin('#onayBaslik')), metin('#onayBaslik'));
  doc.getElementById('onayEvet').click();
  await bekle(240);
  kontrol('Bağlantı ayarları silindi', window.localStorage.getItem('isgtakip.bulut') === null &&
    window.localStorage.getItem('isgtakip.bulut.durum') === null && !ISG.bulut.hazirMi());
  kontrol('Bağlantı kesilince yerel kayıt korunur', ISG.depo.al().personel.length > 0 &&
    /Yerel kayıt açık/.test(metin('#bulutDurumSatir')), metin('#bulutDurumSatir'));

  console.log('\n21b) Siteye gömülü bulut kimliği (bulut-kimlik.js)');
  const scriptSirasi = Array.from(doc.querySelectorAll('script[src]'))
    .map((s) => s.getAttribute('src'));
  const kimlikSirasi = scriptSirasi.findIndex((s) => s.indexOf('bulut-kimlik.js') !== -1);
  const bulutSirasi = scriptSirasi.findIndex((s) => s.indexOf('bulut.js') !== -1);
  kontrol('bulut-kimlik.js sayfada bulut.js öncesinde yüklenir',
    kimlikSirasi !== -1 && bulutSirasi !== -1 && kimlikSirasi < bulutSirasi,
    scriptSirasi.join(' | '));
  kontrol('Kimlik notu öğesi yerinde ve diyalog açılmadan gizli',
    !!doc.getElementById('bulutKimlikNotu') && doc.getElementById('bulutKimlikNotu').hidden === true);
  /* Kimlik artık boş şablon değil: yayınlanan site gerçek Supabase kimliğiyle
     gelir. Alan biçimleri ve gizli anahtar sızıntısı burada denetlenir. */
  const yayinKimlik = window.ISG_KIMLIK;
  kontrol('Yayınlanan kimlik dolu (URL + anahtar + oda)',
    !!yayinKimlik && /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(yayinKimlik.url) &&
    String(yayinKimlik.anahtar).length > 40 &&
    /^[a-z0-9][a-z0-9._-]{3,39}$/.test(String(yayinKimlik.oda)),
    yayinKimlik ? yayinKimlik.url + ' / oda=' + yayinKimlik.oda : 'kimlik tanımsız');
  kontrol('Kimlik gizli yönetim anahtarı taşımaz',
    !!yayinKimlik && JSON.stringify(yayinKimlik).indexOf('service_role') === -1 &&
    JSON.stringify(yayinKimlik).indexOf('sb_secret_') === -1);
  kontrol('Dolu kimlik açılışta hazır sayılır',
    ISG.bulut.kimlikVarMi() === true);

  /* Kimlik dosyası site yöneticisi tarafından doldurulmuş gibi simüle edilir:
     yerel ayar olmayan bir cihaz açılışta otomatik bağlanmalı. */
  window.localStorage.removeItem('isgtakip.bulut.kapali');
  window.ISG_KIMLIK = {
    url: 'https://kimlik.supabase.co',
    anahtar: 'anon-kimlik-test-anahtari-0123456789',
    oda: 'site-varsayilan',
    otomatik: true,
    aralik: 20
  };
  istekler.adet = 0; istekler.yontem = ''; istekler.govde = null; uzakSatir = null;
  /* "Ağ yok" testi fetch'i bozmuştu: kayıt yapan mock geri yüklenir. */
  fetchKur();
  ISG.bulut.kimlikUygula();
  kontrol('Doldurulmuş kimlik bağlantıyı hazırlar',
    ISG.bulut.kimlikVarMi() && ISG.bulut.hazirMi());
  kontrol('Kimlik yerel ayar olarak yazılmaz (site güncellenince yenisi geçer)',
    window.localStorage.getItem('isgtakip.bulut') === null);
  ISG.bulut.baslat();
  await bekle(500);
  kontrol('Kimlikle açılışta otomatik eşitleme yapılır',
    istekler.yontem === 'POST' && istekler.govde[0].oda === 'site-varsayilan' &&
    /kimlik\.supabase\.co\/rest\/v1\/isg_veri$/.test(istekler.adres),
    istekler.yontem + ' ' + istekler.adres);
  kontrol('Durum satırı site varsayılanı olduğunu gösterir',
    /site varsayılanı/.test(metin('#bulutDurumSatir')), metin('#bulutDurumSatir'));

  doc.querySelector('[data-islem="bulut-ayar"]').click();
  await bekle(140);
  kontrol('Bulut diyaloğunda kimlik notu görünür',
    doc.getElementById('bulutKimlikNotu').hidden === false);
  kontrol('Form alanları site kimliğiyle dolu gelir',
    doc.getElementById('bulutUrl').value === 'https://kimlik.supabase.co' &&
    doc.getElementById('bulutOda').value === 'site-varsayilan',
    doc.getElementById('bulutUrl').value + ' / ' + doc.getElementById('bulutOda').value);
  kontrol('Kimlikle bağlantıda kes/eşitle görünür',
    doc.getElementById('bulutKes').hidden === false && doc.getElementById('bulutSimdi').hidden === false);
  /* jsdom'da diyalog.close olmayabilir: uygulamanın kendi kapanış yolu izlenir. */
  if (typeof bulutDiyalog.close === 'function') { bulutDiyalog.close(); }
  else { bulutDiyalog.removeAttribute('open'); }

  ISG.bulut.kapat();
  kontrol('Elle kesilen cihazda kimlik de devre dışı kalır',
    !ISG.bulut.hazirMi() && ISG.bulut.kimlikKapaliMi());
  ISG.bulut.kimlikUygula();
  kontrol('Kapalı işareti varken kimlik otomatik bağlamaz', !ISG.bulut.hazirMi());

  window.localStorage.removeItem('isgtakip.bulut.kapali');
  window.ISG_KIMLIK = null;
  kontrol('Kimlik yoksa kimlikUygula boşuna bağlamaz',
    !ISG.bulut.kimlikVarMi() && !ISG.bulut.hazirMi());

  console.log('\nSonuç: ' + gecen + ' geçti, ' + hata + ' başarısız');
  dom.window.close();
  sunucu.close();
  process.exit(hata === 0 ? 0 : 1);
})().catch((e) => {
  console.error('Test çöktü:', e);
  process.exit(1);
});




