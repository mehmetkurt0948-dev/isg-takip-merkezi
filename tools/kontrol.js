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
  sanal.on('error', (...argumanlar) => console.log('  [konsol:hata] ' + argumanlar.join(' ')));


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
    'tespitler', 'riskEkipleri', 'acilPlanlar', 'mevzuat', 'talepler'];
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
  kontrol('Boş açılışta yedek yazılmadı', window.localStorage.getItem('isgtakip.oncekiVeri') === null);
  /* Demo kayıtlar, yedekleme/geri yükleme düğmeleri ve örnek veri göçü arayüzden
     kaldırıldı: site boş açılır, kayıtlar testlerde yalnızca tools/demo-veri.js
     fixture'ından (aşağıdaki demoYukle) gelir. */
  kontrol('Örnek veri ve demo temizlik arayüzü kaldırıldı',
    ISG.depo.ornekYukle === undefined && ISG.depo.demoTemizle === undefined,
    typeof ISG.depo.ornekYukle + '/' + typeof ISG.depo.demoTemizle);
  kontrol('Örnek veri ve yedekleme düğmeleri arayüzde yok',
    doc.getElementById('ornekVeriDugme') === null && doc.getElementById('yedekle') === null &&
    doc.getElementById('geriYukle') === null && doc.getElementById('durumKart') === null,
    String(doc.getElementById('ornekVeriDugme')));

  /* Boş veriyle tüm ekranlar dolaşılır: boş durumlar hata metni üretmemeli. */
  const bosSayfalar = ['panel', 'isyerleri', 'personel', 'dosyalar', 'plan', 'saha', 'rapor',
    'istatistik', 'risk', 'acil', 'ekip', 'onaylar', 'mevzuat', 'saglik'];
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

  /* Kayıt listelerinin dolu olduğu bölümler demo fixture'ı ile çalışır:
     tools/demo-veri.js uygulamada yüklenmez, yalnızca testte sayfa bağlamına
     alınıp ISG.depo.iceAktar() ile deponun kendi kurallarından geçirilir. */
  const demoJson = (function () {
    window.eval(fs.readFileSync(path.join(kok, 'tools', 'demo-veri.js'), 'utf8'));
    return JSON.stringify(window.ISG.ORNEK_VERI());
  })();
  const demoYukle = async function () {
    const yuklenen = ISG.depo.iceAktar(demoJson);
    ISG.ui.kapsam = '';
    ISG.uygulama.girisSonrasi();
    await bekle(180);
    return yuklenen;
  };

  const demoda = await demoYukle();
  kontrol('Demo fixture 6 işyeri getiriyor', demoda.isyerleri.length === 6, String(demoda.isyerleri.length));
  kontrol('Demo fixture 37 personel getiriyor', demoda.personel.length === 37, String(demoda.personel.length));
  kontrol('Demo fixture üç hesap getiriyor', demoda.kullanicilar.length === 3,
    demoda.kullanicilar.map((k) => k.eposta).join(', '));
  kontrol('Demo fixture mezar taşı bırakmıyor',
    Object.keys(ISG.depo.al().senkron.silinen).length === 0,
    String(Object.keys(ISG.depo.al().senkron.silinen).length));
  kontrol('Demo fixture kalıcı yazıma geçiyor',
    JSON.parse(window.localStorage.getItem(ISG.depo.anahtar)).isyerleri.length === 6);
  kontrol('Demo fixture kurum adını getiriyor',
    demoda.ayarlar.kurum === 'Aydın Büyükşehir Belediyesi Personel A.Ş', String(demoda.ayarlar.kurum));
  kontrol('Demo fixture hesapları geçerli rollere sahip',
    demoda.kullanicilar.every((k) => ['yonetici', 'yetkili', 'goruntuleyici'].indexOf(k.rol) > -1),
    demoda.kullanicilar.map((k) => k.rol).join(', '));
  kontrol('Demo veri sonrası görev listesi dolar', doc.querySelectorAll('.gorev-satir').length > 0,
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

  /* Kıdem Tarihi standart şablondan gelir; düzenleme formunda da tutulmalı ki
     personeli sonra düzenleyen kullanıcı içe aktarılan tarihi sessizce yitirmesin. */
  const kidemKisi = ISG.depo.al().personel.filter((p) => p.adSoyad === 'Test Kullanıcı')[0];
  kidemKisi.kidemTarihi = '2015-03-10';
  ISG.depo.kaydet();
  ISG.ui.kapsam = '';
  ISG.uygulama.ciz();
  await bekle(90);
  doc.querySelector('[data-islem="personel-duzenle"][data-id="' + kidemKisi.id + '"]').click();
  await bekle(90);
  kontrol('Düzenleme formunda Kıdem Tarihi alanı var ve dolu geliyor',
    !!personelForm.elements.kidemTarihi && personelForm.elements.kidemTarihi.type === 'date' &&
    personelForm.elements.kidemTarihi.value === '2015-03-10',
    personelForm.elements.kidemTarihi ? personelForm.elements.kidemTarihi.value : 'alan yok');
  kontrol('Personel satırı Kıdem Tarihi sütununu gösteriyor',
    /10\.03\.2015/.test(metin('#gorunum')), metin('#gorunum').slice(0, 60));
  personelForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await bekle(120);
  const kidemSonra = ISG.depo.al().personel.filter((p) => p.id === kidemKisi.id)[0] || {};
  kontrol('Formdan kayıt Kıdem Tarihi’ni koruyor', kidemSonra.kidemTarihi === '2015-03-10',
    String(kidemSonra.kidemTarihi));
  kidemKisi.kidemTarihi = '';
  ISG.depo.kaydet();

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

  console.log('\n8b) Hazır dosya kontrol listeleri (Word/Excel şablonları)');
  const listeSablon = ISG.listeSablonBul('ASKI-1');
  const listeMadde = ISG.listeMaddeSayisi(listeSablon);
  kontrol('ASKİ-1 hazır listesi yüklü', !!listeSablon, listeSablon ? listeSablon.kod : 'yok');
  kontrol('Hazır liste 13 bölüm / 142 madde taşıyor',
    !!listeSablon && listeSablon.bolumler.length === 13 && listeMadde === 142, String(listeMadde));
  kontrol('Her maddenin metni ve geçerli durumu var',
    !!listeSablon && listeSablon.bolumler.every((bolum) => bolum.maddeler.length > 0 &&
      bolum.maddeler.every((madde) => madde.madde && ISG.DOSYA_DURUMLARI[ISG.listeDurumKod(madde.isaret)])));
  kontrol('VAR / YOK / GÜNCELLENECEK / K-D işaretleri duruma dönüştü',
    ISG.listeDurumKod('VAR') === 'var' && ISG.listeDurumKod('YOK') === 'eksik' &&
    ISG.listeDurumKod('GUNCELLENECEK') === 'eksik' && ISG.listeDurumKod('KD') === 'yok' &&
    ISG.listeDurumKod('UYGULANAMAZ') === 'yok' && ISG.listeDurumKod('') === 'incelenmedi');
  kontrol('Bölüm başlıkları listeye yazılıyor',
    !!listeSablon && /BÖLÜM 1/.test(listeSablon.bolumler[0].ad), listeSablon ? listeSablon.bolumler[0].ad : '');
  kontrol('İşyeri adı şablonu tanıyor',
    ISG.listeEsleyenSablonlar({ ad: 'ASKİ-1' }).some((s) => s.kod === 'ASKI-1'));
  kontrol('Farklı yazımda da eşleşiyor (Aski 1)',
    ISG.listeEsleyenSablonlar({ ad: 'Aski 1 Şantiyesi' }).some((s) => s.kod === 'ASKI-1'));
  kontrol('İlgisiz işyeri şablon önermiyor',
    ISG.listeEsleyenSablonlar({ ad: 'Örnek OSGB Danışmanlık' }).length === 0,
    ISG.listeEsleyenSablonlar({ ad: 'Örnek OSGB Danışmanlık' }).map((s) => s.kod).join(','));

  /* Excel "İSG Dosya Kontrol Checklisti" sayfalarından üretilen işyeri listeleri. */
  const excelListe = ISG.listeSablonBul('ASKI-2');
  const excelMadde = ISG.listeMaddeSayisi(excelListe);
  kontrol('Excel listeleri kataloğa yüklendi (ASKİ-1 + 17 işyeri)',
    (ISG.KONTROL_LISTESI_SABLONLARI || []).length === 18,
    String((ISG.KONTROL_LISTESI_SABLONLARI || []).length));
  kontrol('ASKİ-2 Excel listesi 16 bölüm / 107 madde',
    !!excelListe && excelListe.bolumler.length === 16 && excelMadde === 107, String(excelMadde));
  kontrol('Excel bölüm adları aynen taşındı',
    !!excelListe && excelListe.bolumler[0].ad === 'İşyeri ve İSG Organizasyonu',
    excelListe ? excelListe.bolumler[0].ad : 'yok');
  kontrol('Excel "Açıklama / Eksiklik" hücresi maddeye not olarak yazıldı',
    !!excelListe && excelListe.bolumler.some((bolum) => bolum.maddeler.some((madde) => madde.not)), 'not yok');
  kontrol('Excel kontrol tarihi ve özeti şablona yazıldı',
    !!excelListe && /^\d{4}-\d{2}-\d{2}$/.test(excelListe.kontrolTarihi || '') &&
    /Kontrol özeti/.test(excelListe.genelDegerlendirme || ''),
    excelListe ? excelListe.kontrolTarihi : 'yok');
  kontrol('Excel işyeri adı şablonu tanıyor (Halk Ekmek)',
    ISG.listeEsleyenSablonlar({ ad: 'Halk Ekmek A.Ş.' }).some((s) => s.kod === 'HALK-EKMEK'));
  kontrol('Kadrolu ve daire listeleri ayrı şablon',
    !!ISG.listeSablonBul('PARK-BAHCELER') && !!ISG.listeSablonBul('PARK-BAHCELER-KADROLU'));

  /* Uçtan uca: düğme → diyalog → 142 madde → ikinci denemede çoğalmıyor.
     Test kendi işyerini açar ve sonunda anlık yedeğe döner. */
  const listeOncesi = ISG.depo.al().dosyalar.length;
  const anlikYedek = JSON.parse(JSON.stringify(ISG.depo.al()));
  const testIsyeri = ISG.depo.isyeriKaydet({
    ad: 'TEST LİSTE İŞYERİ', tehlikeSinifi: 'tehlikeli', calisanSayisi: 10
  });

  const listeDugme = doc.querySelector('[data-islem="dosya-liste"]');
  kontrol('Dosya kontrollerinde hazır liste düğmesi var', !!listeDugme);
  listeDugme.click();
  await bekle(120);
  kontrol('Hazır liste diyaloğu açılıyor', doc.getElementById('listeDiyalog').open === true);
  kontrol('Diyalogda işyeri ve tüm hazır listeler seçiliyor',
    doc.querySelectorAll('#listeIsyeri option').length > 1 &&
    doc.querySelectorAll('#listeSablon option').length === (ISG.KONTROL_LISTESI_SABLONLARI || []).length,
    doc.querySelectorAll('#listeIsyeri option').length + '/' + doc.querySelectorAll('#listeSablon option').length);

  const listeForm = doc.getElementById('listeForm');
  listeForm.elements.isyeriId.value = testIsyeri.id;
  listeForm.elements.kod.value = 'ASKI-1';
  listeForm.elements.isyeriId.dispatchEvent(new window.Event('change', { bubbles: true }));
  await bekle(60);
  kontrol('Önizleme 142 maddeyi ve eklenecek sayıyı gösteriyor',
    /142/.test(metin('#listeOnizleme')), metin('#listeOnizleme').slice(0, 90));

  listeForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await bekle(200);
  const eklenenler = ISG.depo.al().dosyalar.filter((d) => d.isyeriId === testIsyeri.id);
  kontrol('Liste eklenince 142 kontrol maddesi açıldı',
    ISG.depo.al().dosyalar.length === listeOncesi + 142 && eklenenler.length === 142,
    String(ISG.depo.al().dosyalar.length - listeOncesi));
  kontrol('Eklenen maddelerde bölüm, dayanak ve şablon kodu var',
    eklenenler.every((d) => d.bolum && d.kontrolTarihi === '2026-08-24' && d.sablon === 'ASKI-1' &&
      (/Yasal dayanak:/.test(d.aciklama) || d.aciklama === '')),
    eklenenler.length ? eklenenler[0].bolum : 'kayıt yok');
  kontrol('Eksik işaretleri "eksik" durumuna dönüştü',
    eklenenler.filter((d) => d.durum === 'eksik').length === 110 &&
    eklenenler.filter((d) => d.durum === 'var').length === 30,
    'eksik=' + eklenenler.filter((d) => d.durum === 'eksik').length);
  kontrol('Madde numaraları işyeri içinde sürüyor',
    eklenenler.every((d) => Number(d.no) > 0) &&
    new Set(eklenenler.map((d) => d.no)).size === eklenenler.length);

  const ikinciUygulama = ISG.depo.listeUygula(testIsyeri.id, 'ASKI-1');
  kontrol('İkinci uygulama kayıt çoğaltmıyor',
    ikinciUygulama.eklenen === 0 && ikinciUygulama.atlanan === 142,
    JSON.stringify(ikinciUygulama));
  let bilinmeyenReddedildi = false;
  try { ISG.depo.listeUygula(testIsyeri.id, 'OLMAYAN-LİSTE'); } catch (hata) { bilinmeyenReddedildi = true; }
  kontrol('Olmayan liste kodu reddedildi', bilinmeyenReddedildi);

  /* Eklenen listenin hemen görünmesi ve tek hamlede silinebilmesi. */
  kontrol('Eklenen liste kaynak filtresiyle hemen listelendi',
    ISG.ui.dosyaSablon === 'ASKI-1' && ISG.ui.kapsam === testIsyeri.id &&
    doc.querySelectorAll('.tablo-kucuk tbody tr').length === 25 &&
    /BÖLÜM/.test(doc.querySelector('.tablo-kucuk tbody').textContent),
    'satır=' + doc.querySelectorAll('.tablo-kucuk tbody tr').length);
  kontrol('Kaynak filtresi kutusu görünüyor',
    !!doc.querySelector('select[data-ui="dosyaSablon"]') &&
    /ASKI-1/.test(doc.querySelector('select[data-ui="dosyaSablon"]').textContent));

  const uygulamaOzeti = ISG.listeUygulananOzeti(
    ISG.depo.al().dosyalar.filter((d) => d.isyeriId === testIsyeri.id));
  kontrol('Uygulanan liste özeti şablonu, 142 maddeyi ve 13 bölümü sayıyor',
    uygulamaOzeti.length === 1 && uygulamaOzeti[0].kod === 'ASKI-1' &&
    uygulamaOzeti[0].adet === 142 && uygulamaOzeti[0].bolumler.length === 13,
    JSON.stringify(uygulamaOzeti[0] && { adet: uygulamaOzeti[0].adet, bolum: uygulamaOzeti[0].bolumler.length }));

  const geriAlDugmesi = doc.querySelector('[data-islem="dosya-liste-geri-al"]');
  kontrol('Tek hamlede silme düğmesi 142 maddeyle görünüyor',
    !!geriAlDugmesi && /142/.test(geriAlDugmesi.textContent), geriAlDugmesi ? geriAlDugmesi.textContent : 'yok');
  geriAlDugmesi.click();
  await bekle(120);
  kontrol('Silme diyaloğu açıldı', doc.getElementById('listeGeriAlDiyalog').open === true);
  kontrol('Diyalog işyeri ve şablonu seçti, 13 bölüm önerdi',
    doc.getElementById('listeGeriAlIsyeri').value === testIsyeri.id &&
    doc.getElementById('listeGeriAlSablon').value === 'ASKI-1' &&
    doc.querySelectorAll('#listeGeriAlBolum option').length === 14,
    String(doc.querySelectorAll('#listeGeriAlBolum option').length));
  kontrol('Önizleme 142 maddeyi ve bölüm dağılımını yazıyor',
    /142/.test(metin('#listeGeriAlOzet')), metin('#listeGeriAlOzet').slice(0, 70));

  doc.querySelector('#listeGeriAlForm [data-kapat]').click();
  await bekle(80);
  kontrol('Vazgeç basınca hiçbir kayıt silinmedi', doc.getElementById('listeGeriAlDiyalog').open === false &&
    ISG.depo.al().dosyalar.filter((d) => d.isyeriId === testIsyeri.id).length === 142);

  const tekBolum = uygulamaOzeti[0].bolumler[0];
  const bolumSilme = ISG.depo.listeGeriAl(testIsyeri.id, 'ASKI-1', tekBolum.ad);
  kontrol('Yalnızca seçilen bölüm silindi',
    bolumSilme.silinen === tekBolum.adet &&
    ISG.depo.al().dosyalar.filter((d) => d.isyeriId === testIsyeri.id).length === 142 - tekBolum.adet,
    JSON.stringify(bolumSilme));
  let eksikArgmanReddedildi = false;
  try { ISG.depo.listeGeriAl('', 'ASKI-1'); } catch (hata) { eksikArgmanReddedildi = true; }
  kontrol('İşyeri olmayan silme isteği reddedildi', eksikArgmanReddedildi);
  kontrol('Olmayan işyeri için silme 0 kayıt döndürüyor',
    ISG.depo.listeGeriAl('olmayan-isyeri', 'ASKI-1').silinen === 0);

  doc.querySelector('[data-islem="dosya-liste-geri-al"]').click();
  await bekle(120);
  kontrol('Diyalog kalan 12 bölümü gösteriyor',
    doc.querySelectorAll('#listeGeriAlBolum option').length === 13,
    String(doc.querySelectorAll('#listeGeriAlBolum option').length));
  doc.getElementById('listeGeriAlForm')
    .dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await bekle(200);
  kontrol('Tüm liste tek hamlede silindi',
    !ISG.depo.al().dosyalar.some((d) => d.isyeriId === testIsyeri.id));
  kontrol('Liste dışında kalan kayıtlar korundu',
    ISG.depo.al().dosyalar.length === listeOncesi, String(ISG.depo.al().dosyalar.length));
  kontrol('Silinen listenin kaynak filtresi sıfırlandı', ISG.ui.dosyaSablon === '');

  /* Excel'den üretilen liste de aynı akışla eklenir ve tek hamlede silinir.
     ASKİ-2 kaynağında iki madde iki bölümde tekrarlı yazılı; uygulama aynı maddeyi
     ikinci kez açmadığı için 107 maddeden 105 kayıt ürer. */
  const excelUygulama = ISG.depo.listeUygula(testIsyeri.id, 'ASKI-2');
  const excelKayitlar = ISG.depo.al().dosyalar.filter((d) => d.isyeriId === testIsyeri.id);
  kontrol('Excel listesi işyerine uygulandı (107 madde → 105 yeni kayıt)',
    excelMadde === 107 && excelUygulama.eklenen === 105 && excelUygulama.atlanan === 2 &&
    excelKayitlar.length === 105, JSON.stringify(excelUygulama));
  kontrol('Excel maddeleri listenin kontrol tarihini aldı',
    excelKayitlar.length > 0 && excelKayitlar.every((d) => d.kontrolTarihi === '2026-09-23'),
    excelKayitlar.length ? String(excelKayitlar[0].kontrolTarihi) : 'kayıt yok');
  kontrol('Excel açıklama/eksiklik notu kaydın açıklamasına yazıldı',
    excelKayitlar.some((d) => /sicilde hangi daire/.test(d.aciklama || '')), 'not yok');
  kontrol('Güncellenecek işaretleri eksik durumuna dönüştü',
    excelKayitlar.filter((d) => d.durum === 'eksik').length === 73 &&
    excelKayitlar.filter((d) => d.durum === 'var').length === 15,
    'eksik=' + excelKayitlar.filter((d) => d.durum === 'eksik').length);
  kontrol('Uygulanamaz işaretleri kapsam dışı kaldı',
    excelKayitlar.filter((d) => d.durum === 'yok').length === 17 &&
    excelKayitlar.filter((d) => d.durum === 'yok').every((d) => /Kapsam dışı/.test(d.aciklama || '')),
    'kapsam=' + excelKayitlar.filter((d) => d.durum === 'yok').length);
  const excelSilme = ISG.depo.listeGeriAl(testIsyeri.id, 'ASKI-2');
  kontrol('Excel listesi de tek hamlede silindi',
    excelSilme.silinen === 105 && !ISG.depo.al().dosyalar.some((d) => d.isyeriId === testIsyeri.id),
    JSON.stringify(excelSilme));

  /* Sonraki testler dosya tablosunu kullanır: kapsam ve filtreler geri alınır. */
  ISG.ui.kapsam = '';
  ISG.ui.dosyaBolum = '';
  ISG.ui.dosyaSayfa = 1;
  ISG.ui.dosyaSekme = 'tumu';


  ISG.depo.geriYukle(anlikYedek);
  await bekle(80);
  kontrol('Test kayıtları geri alındı (liste temizliği)',
    ISG.depo.al().dosyalar.length === listeOncesi &&
    !ISG.depo.al().isyerleri.some((iy) => iy.id === testIsyeri.id),
    String(ISG.depo.al().dosyalar.length));
  ISG.uygulama.ciz();
  await bekle(80);


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
  kontrol('Plan diyaloğunda çoklu ekip düzenleyicisi var',
    !!doc.getElementById('acilPlanEkip') && doc.querySelectorAll('#acilPlanEkip .rol-satir').length === 10,
    String(doc.querySelectorAll('#acilPlanEkip .rol-satir').length));
  kontrol('Plan diyaloğu tek kişilik ekip alanı içermiyor',
    !acilForm.elements.ekip_koordinator && !acilForm.elements.ekip_hekim,
    'ekip_koordinator=' + String(!!acilForm.elements.ekip_koordinator));
  /* Plan diyaloğundan aynı göreve iki kişi: risk değerlendirmesindeki çoklu
     personel davranışının acil durum planında da çalıştığının regresyon testi. */
  const planEkle = async (rol, ad) => {
    doc.querySelector('#acilPlanEkip [data-islem="ekip-uye"][data-kaynak="acil"][data-isyeri="iy1"][data-rol="' + rol + '"]').click();
    await bekle(80);
    const form = doc.getElementById('ekipUyeForm');
    form.elements.ad.value = ad;
    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await bekle(120);
  };
  kontrol('Plan diyaloğu ekip ekleme düğmesi var',
    !!doc.querySelector('#acilPlanEkip [data-islem="ekip-uye"][data-kaynak="acil"][data-isyeri="iy1"][data-rol="İşyeri hekimi"]'));
  await planEkle('İşyeri hekimi', 'Dr. Ayla Yıldız');
  await planEkle('İşyeri hekimi', 'Dr. Barış Taşdemir');
  const acilKayit = ISG.ilgiliKayit(ISG.depo.al(), 'acilPlanlar', 'iy1');
  kontrol('Acil planda aynı göreve iki hekim kaydedildi',
    acilKayit.ekip.filter((u) => u.rol === 'İşyeri hekimi').length === 2,
    JSON.stringify(acilKayit.ekip.map((u) => u.rol + ':' + u.ad)));
  kontrol('Plan diyaloğu ekibi anında tazelendi',
    /2 kişi/.test(metin('#acilPlanEkip')),
    metin('#acilPlanEkip').slice(0, 120));
  acilForm.elements.sonYenileme.value = '2026-02-01';
  acilForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await bekle(120);
  /* Eksik ekip mevcudu kayıt ENGELİ değildir, ama kullanıcı neyi eksik bıraktığını
     bilerek onay verir: diyaloğun "Yine de kaydet" adımı olmadan plan yazılmaz. */
  kontrol('Eksik ekip mevcudu kayıt öncesinde onaya sorulur',
    doc.getElementById('onayDiyalog').open === true &&
    /Zorunlu ekip mevcudu eksik/.test(doc.getElementById('onayMetin').textContent),
    doc.getElementById('onayMetin').textContent.slice(0, 90));
  kontrol('Onay verilmeden plan tarihi yazılmadı',
    ISG.ilgiliKayit(ISG.depo.al(), 'acilPlanlar', 'iy1').sonYenileme !== '2026-02-01');
  doc.getElementById('onayEvet').click();
  await bekle(200);
  kontrol('Acil plan yenileme kaydedildi',
    ISG.ilgiliKayit(ISG.depo.al(), 'acilPlanlar', 'iy1').sonYenileme === '2026-02-01');
  kontrol('Acil ekip üyeleri plan kaydında korundu',
    ISG.ilgiliKayit(ISG.depo.al(), 'acilPlanlar', 'iy1').ekip.filter((u) => u.rol === 'İşyeri hekimi').length === 2);

  /* Eski kayıt biçimleri: nesne (rol→ad) ve rol kimliği ile yazılmış görev adı. */
  const eskiEkipKaydi = { isyeriId: 'iy1', ekip: { hekim: 'Dr. Eski Kayıt' } };
  kontrol('Eski nesne biçimli acil ekip okunuyor',
    ISG.depo.acilEkipUyeleri(eskiEkipKaydi, 'İşyeri hekimi').length === 1);
  kontrol('Eski acil ekip dizisine çevrildi', Array.isArray(eskiEkipKaydi.ekip));
  kontrol('Rol kimliğiyle yazılmış üye görünüyor',
    ISG.depo.acilEkipUyeleri({ ekip: [{ rol: 'hekim', ad: 'Dr. Kimlik' }] }, 'İşyeri hekimi').length === 1);
  kontrol('Farklı görev grubu ayrı kalıyor',
    ISG.depo.acilEkipUyeleri({ ekip: [{ rol: 'hekim', ad: 'Dr. Kimlik' }] }, 'İlk yardım ekibi').length === 0);

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
  kontrol('Acil durum destek rolleri listeleniyor', doc.querySelectorAll('.risk-kart .rol-satir').length === 60,
    String(doc.querySelectorAll('.risk-kart .rol-satir').length));
  kontrol('Acil planda ekip üyesi düğmeleri var',
    doc.querySelectorAll('#gorunum [data-islem="ekip-uye"][data-kaynak="acil"]').length === 66,
    String(doc.querySelectorAll('#gorunum [data-islem="ekip-uye"][data-kaynak="acil"]').length));
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
  kontrol('Örnek Excel şablonu düğmesi metinde görünüyor', /Örnek Excel şablonunu indir/.test(metin('#gorunum')));
  kontrol('Toplu personel yükleme düğmesi var', !!doc.querySelector('[data-islem="personel-toplu-aktar"]') &&
    /Toplu personel yükle/.test(metin('#gorunum')));
  kontrol('Dosya girişi XLSX kabul ediyor', /\.xlsx/.test(doc.getElementById('personelDosya').getAttribute('accept') || ''));

  console.log('\n12e) Toplu personel yükleme: şablon, ön izleme, mükerrer, izolasyon');
  const Toplu = ISG.personelToplu;
  const SABLON_BASLIK = ['Sicil No', 'Ad Soyad', 'T.C. Kimlik No', 'Mesleği', 'Departman',
    'Grup Kodu Açıklama', 'Şube', 'İşe Başlama Tarihi', 'Kıdem Tarihi', 'Cep Telefonu', 'Cinsiyet'];
  kontrol('Toplu personel modülü yüklendi', !!Toplu && typeof Toplu.analizEt === 'function' && typeof Toplu.uygula === 'function');
  kontrol('Standart şablon 11 sütun ve istenen sırada',
    JSON.stringify(Toplu.BASLIKLAR) === JSON.stringify(SABLON_BASLIK), Toplu.BASLIKLAR.join(' | '));
  const sablonSayfalar = Toplu.sablonSayfalar();
  kontrol('Şablon Personel ve Kılavuz sayfaları taşıyor',
    sablonSayfalar.length === 2 && sablonSayfalar[0].ad === 'Personel' && sablonSayfalar[1].ad === 'Kılavuz',
    sablonSayfalar.map((s) => s.ad).join(', '));
  const sablonBayt = ISG.excel.xlsxYaz(sablonSayfalar);
  kontrol('Şablon XLSX olarak üretiliyor', sablonBayt[0] === 0x50 && sablonBayt[1] === 0x4B);
  const sablonGeri = await ISG.excel.oku(sablonBayt);
  kontrol('Şablon geri okunuyor, başlıklar ilk satırda',
    JSON.stringify((sablonGeri[0].satirlar[0] || []).map((h) => String(h).trim())) === JSON.stringify(SABLON_BASLIK),
    JSON.stringify(sablonGeri[0].satirlar[0]));
  kontrol('Şablonda örnek personel satırı ve kılavuz satırları var',
    String(sablonGeri[0].satirlar[1][1]).trim() === 'Örnek Personel' && sablonGeri[1].satirlar.length >= 11,
    String(sablonGeri[1].satirlar.length));
  kontrol('Kılavuz tarih ve mükerrer kuralını anlatıyor',
    /YYYY-AA-GG/.test(JSON.stringify(sablonGeri[1].satirlar)) && /Mükerrer/.test(JSON.stringify(sablonGeri[1].satirlar)));
  kontrol('Başlık bulunamayan dosya anlaşılır hata veriyor',
    /Başlık satırı bulunamadı/.test(Toplu.analizEt([['A', 'B'], ['1', '2']], { mevcut: [] }).hata));

  /* "Örnek Excel şablonunu indir" düğmesi gerçek XLSX dosyasını indirmeli.
     İndirme katmanı (bicim.dosyaIndirBayt) yakalanır: ad, MIME türü ve baytlar denenir. */
  const indirmeler = [];
  const gercekIndirme = ISG.bicim.dosyaIndirBayt;
  ISG.bicim.dosyaIndirBayt = function (dosyaAdi, baytlar, tip) {
    indirmeler.push({ ad: dosyaAdi, baytlar: baytlar, tip: tip });
  };
  try {
    doc.querySelector('[data-islem="personel-sablon"]').click();
    await bekle(120);
  } finally {
    ISG.bicim.dosyaIndirBayt = gercekIndirme;
  }
  const sablonIndirme = indirmeler[0] || null;
  kontrol('Örnek Excel şablonu düğmesi indirme başlatıyor', indirmeler.length === 1, String(indirmeler.length));
  kontrol('Şablon Personel-Sablonu.xlsx adıyla indiriliyor',
    /^Personel-Sablonu\.xlsx$/i.test(sablonIndirme ? sablonIndirme.ad : ''), sablonIndirme ? sablonIndirme.ad : '-');
  kontrol('Şablon XLSX MIME türüyle veriliyor',
    /spreadsheetml\.sheet/.test(sablonIndirme ? sablonIndirme.tip : ''), sablonIndirme ? sablonIndirme.tip : '-');
  kontrol('İndirilen şablon XLSX (ZIP) baytları taşıyor',
    !!sablonIndirme && sablonIndirme.baytlar[0] === 0x50 && sablonIndirme.baytlar[1] === 0x4B &&
    sablonIndirme.baytlar.length > 2000, sablonIndirme ? String(sablonIndirme.baytlar.length) : '-');
  const indirilenGeri = sablonIndirme ? await ISG.excel.oku(sablonIndirme.baytlar) : null;
  kontrol('İndirilen şablon Excel ile açılıp okunabiliyor',
    !!indirilenGeri && indirilenGeri.length === 2 && String(indirilenGeri[0].satirlar[1][1]).trim() === 'Örnek Personel',
    indirilenGeri ? indirilenGeri.map((s) => s.ad).join(', ') : 'okunamadı');
  const indirilenAnaliz = indirilenGeri ?
    Toplu.analizEt(indirilenGeri[0].satirlar, { mevcut: [], digerIsyerleri: [] }) : { ozet: {}, hata: '' };
  kontrol('Boş şablon yüklendiğinde örnek satır tanınıp anlaşılır uyarı veriliyor',
    indirilenAnaliz.ozet.ornek === 1 && /kaydedilecek veri satırı yok/.test(indirilenAnaliz.hata),
    JSON.stringify(indirilenAnaliz.ozet) + ' / ' + indirilenAnaliz.hata);
  /* Şablon başlıkları ile ayrıştırıcı eşanlamlıları aynı kalmalı: biri değişir ve
     diğeri unutulursa kullanıcı "sütun dosyada yok" uyarısıyla karşılaşır. */
  kontrol('Şablonun on bir başlığı da alanlara eşleniyor',
    Object.keys(indirilenAnaliz.haritalar).length === 11 && indirilenAnaliz.eksikSutunlar.length === 0,
    JSON.stringify(indirilenAnaliz.haritalar) + ' / ' + indirilenAnaliz.eksikSutunlar.join(', '));
  kontrol('Şablon indirme bildirimi kullanıcıya verildi',
    /şablon/i.test(metin('#bildirimler')), metin('#bildirimler').slice(0, 90));

  /* ASKİ-1 (iy5) hedefli karışık dosya: geçerli, mükerrer, hatalı, boş ve örnek satırlar. */
  const topluHesap = ISG.depo.al();
  const iy5Mevcut = topluHesap.personel.filter((p) => p.isyeriId === 'iy5');
  const digerMevcut = topluHesap.personel.filter((p) => p.isyeriId !== 'iy5');
  const iy5Once = iy5Mevcut.length;
  const toplamOnce = topluHesap.personel.length;
  const mevcutSicil = iy5Mevcut[0].sicil;
  const mevcutAd = iy5Mevcut[0].adSoyad;
  const karisik = [
    SABLON_BASLIK.slice(),
    ['9001', 'Topluk Test Bir', '11111111110', 'Teknisyen', 'Bakım', '9112.11', 'ASKİ 1',
      '15.01.2024', '01.02.2024', '05551112233', 'E'],
    ['9002', 'Topluk Test İki', '', '', '', '', '', '45306', '', '', 'K'],
    ['9003', 'Topluk Test Üç', '222222', '', '', '', '', '31.12.2023', '', '', 'Erkek'],
    [],
    [mevcutSicil, 'Yeniden Gelen Kişi', '33333333330', '', '', '', '', '', '', '', ''],
    ['', mevcutAd, '', '', '', '', '', '', '', '', ''],
    ['9001', 'Aynı TC Tekrar', '11111111110', '', '', '', '', '', '', '', ''],
    ['12345', 'Örnek Personel', '12345678901', 'Pres operatörü', 'Üretim', '9112.11', 'Merkez',
      '2024-01-15', '2024-01-15', '0555 123 45 67', 'Erkek']
  ];
  const analiz = Toplu.analizEt(karisik, { mevcut: iy5Mevcut, digerIsyerleri: digerMevcut });
  kontrol('Satır durumları ayrıştırıldı',
    analiz.ozet.hazir === 2 && analiz.ozet.mukerrer === 3 && analiz.ozet.hatali === 1 &&
    analiz.ozet.bos === 1 && analiz.ozet.ornek === 1 && analiz.ozet.dosyaSatir === 8,
    JSON.stringify(analiz.ozet));
  kontrol('Şablonun örnek satırı otomatik atlanıyor',
    analiz.satirlar.some((s) => s.durum === 'ornek' && s.ham.adSoyad === 'Örnek Personel'));
  const hataliSatir = analiz.satirlar.filter((s) => s.durum === 'hata')[0];
  kontrol('Hatalı satır satır numarası ve gerekçeyle raporlanıyor',
    hataliSatir.satirNo === 4 && /11 hane/.test(hataliSatir.nedenler.join(' ')),
    JSON.stringify(hataliSatir && hataliSatir.nedenler));
  const mukerrerler = analiz.satirlar.filter((s) => s.durum === 'mukerrer');
  kontrol('Mükerrer sicil kaydı yakalandı',
    mukerrerler.some((s) => /Sicil No ile kayıtlı/.test(s.nedenler.join(' '))),
    mukerrerler.map((s) => s.nedenler.join(' ')).join(' || '));
  kontrol('Dosya içi aynı T.C. Kimlik No mükerrer sayıldı',
    mukerrerler.some((s) => /birden fazla satırda/.test(s.nedenler.join(' '))));
  kontrol('Sicil ve TC boşken ad soyad mükerrer denetimi çalışıyor',
    mukerrerler.some((s) => /Ad Soyad kayıtlı/.test(s.nedenler.join(' '))));
  const hazirlar = analiz.satirlar.filter((s) => s.durum === 'hazir');
  kontrol('GG.AA.YYYY ve Kıdem Tarihi ISOya çevrildi',
    hazirlar[0].kayit.iseBaslama === '2024-01-15' && hazirlar[0].kayit.kidemTarihi === '2024-02-01',
    hazirlar[0].kayit.iseBaslama + ' / ' + hazirlar[0].kayit.kidemTarihi);
  kontrol('Excel seri numarası tarih olarak okundu', hazirlar[1].kayit.iseBaslama === '2024-01-15',
    hazirlar[1].kayit.iseBaslama);
  kontrol('Cinsiyet kısaltmaları ve telefon normalize edildi',
    hazirlar[0].kayit.cinsiyet === 'Erkek' && hazirlar[0].kayit.telefon === '05551112233' &&
    hazirlar[1].kayit.cinsiyet === 'Kadın');
  kontrol('Kaydedilmeyecek satırlar için kayıt üretilmedi',
    analiz.satirlar.filter((s) => s.durum !== 'hazir').every((s) => s.kayit === null));
  kontrol('Eksik sütun uyarısı veriliyor', analiz.uyarilar.join(' ').length > 0 || analiz.eksikSutunlar.length === 0,
    analiz.eksikSutunlar.join(', '));
  const farkliIsyeri = Toplu.analizEt([
    SABLON_BASLIK.slice(),
    ['9101', 'Başka Kurumdan', '11111111110', '', '', '', '', '', '', '', '']
  ], {
    mevcut: [],
    digerIsyerleri: [{ id: 'px', isyeriId: 'iy6', adSoyad: 'Başka Kurum Kişisi', sicil: '5', tc: '11111111110' }]
  });
  kontrol('Aynı TC başka iş yerindeyse uyarı üretiliyor (kayıt engellenmiyor)',
    farkliIsyeri.ozet.hazir === 1 && /başka bir iş yerinde/.test((farkliIsyeri.satirlar[0].uyarilar || []).join(' ')),
    JSON.stringify(farkliIsyeri.satirlar[0].uyarilar));
  const isyeriSutunlu = Toplu.analizEt([
    ['Sicil No', 'Ad Soyad', 'İşyeri', 'Durum'],
    ['9201', 'İşyeri Sütunlu', 'Aypaş', 'Pasif']
  ], { mevcut: [], digerIsyerleri: [] });
  kontrol('Dosyadaki İşyeri sütunu yok sayılıp uyarı veriliyor',
    /İşyeri" sütunu yok sayılıyor/.test(isyeriSutunlu.uyarilar.join(' ')) && isyeriSutunlu.ozet.hazir === 1 &&
    isyeriSutunlu.satirlar[0].onizlemeKayit.durum === 'pasif', isyeriSutunlu.uyarilar.join(' '));

  /* Arayüz akışı: dosya içeriği → ön izleme diyaloğu → kullanıcı onayı → kayıt. */
  ISG.uygulama.personelTopluOnizle(karisik, 'toplu-personel-test.xlsx', 'iy5');
  await bekle(140);
  const topluDiyalog = doc.getElementById('personelTopluDiyalog');
  kontrol('Ön izleme diyaloğu açıldı', topluDiyalog.open === true);
  kontrol('İşyeri seçici altı iş yerini getiriyor', doc.querySelectorAll('#personelTopluIsyeri option').length === 6,
    String(doc.querySelectorAll('#personelTopluIsyeri option').length));
  kontrol('Seçili işyeri ASKİ-1', doc.getElementById('personelTopluIsyeri').value === 'iy5',
    doc.getElementById('personelTopluIsyeri').value);
  kontrol('Özet kutuları beş sayım basıyor', doc.querySelectorAll('#personelTopluOzet .toplu-sayi').length === 5,
    String(doc.querySelectorAll('#personelTopluOzet .toplu-sayi').length));
  kontrol('Ön izlemede satır bazlı gerekçeler görünüyor',
    /11 hane/.test(metin('#personelTopluOnizleme')) && /Mükerrer/.test(metin('#personelTopluOnizleme')));
  kontrol('Dosya adı ve hedef işyeri yazılıyor',
    /toplu-personel-test\.xlsx/.test(metin('#personelTopluDosya')) && /ASKİ-1/.test(metin('#personelTopluDosya')),
    metin('#personelTopluDosya'));
  kontrol('Onay düğmesi etkin ve metni kayıt içeriyor',
    doc.getElementById('personelTopluKaydet').disabled === false &&
    /Kaydedilecekleri ekle/.test(doc.getElementById('personelTopluKaydet').textContent));
  kontrol('Onay öncesi kayıt yapılmadı', ISG.depo.al().personel.length === toplamOnce,
    String(ISG.depo.al().personel.length));

  /* İşyeri değiştirilince mükerrer denetimi o işyerinin listesine göre tazelenir. */
  doc.getElementById('personelTopluIsyeri').value = 'iy6';
  doc.getElementById('personelTopluIsyeri').dispatchEvent(new window.Event('change', { bubbles: true }));
  await bekle(90);
  kontrol('İşyeri değişince sayımlar yeniden hesaplandı',
    ISG.uygulama.personelTopluDurum().analiz.ozet.mukerrer === 1 &&
    ISG.uygulama.personelTopluDurum().analiz.ozet.hazir === 4,
    JSON.stringify(ISG.uygulama.personelTopluDurum().analiz.ozet));
  doc.getElementById('personelTopluIsyeri').value = 'iy5';
  doc.getElementById('personelTopluIsyeri').dispatchEvent(new window.Event('change', { bubbles: true }));
  await bekle(90);

  doc.getElementById('personelTopluForm').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await bekle(220);
  const iy5Sonra = ISG.depo.al().personel.filter((p) => p.isyeriId === 'iy5');
  kontrol('Yalnızca geçerli satırlar kaydedildi', iy5Sonra.length === iy5Once + 2, iy5Once + ' -> ' + iy5Sonra.length);
  kontrol('Mükerrer ve hatalı satırlar kaydedilmedi',
    !ISG.depo.al().personel.some((p) => p.adSoyad === 'Yeniden Gelen Kişi') &&
    !ISG.depo.al().personel.some((p) => p.sicil === '9003') &&
    !ISG.depo.al().personel.some((p) => p.adSoyad === 'Örnek Personel'));
  kontrol('Mevcut ASKİ-1 personeli silinmedi veya değişmedi',
    iy5Mevcut.every((kisi) => ISG.depo.al().personel.some((p) =>
      p.id === kisi.id && p.adSoyad === kisi.adSoyad && p.isyeriId === 'iy5')));
  kontrol('Diğer iş yerlerinin kayıtlarına dokunulmadı',
    ISG.depo.al().personel.length - iy5Sonra.length === toplamOnce - iy5Once,
    String(ISG.depo.al().personel.length - iy5Sonra.length));
  kontrol('Yüklenen personelin alanları doğru', (function () {
    const kisi = iy5Sonra.filter((p) => p.sicil === '9001')[0];
    return !!kisi && kisi.tc === '11111111110' && kisi.iseBaslama === '2024-01-15' &&
      kisi.kidemTarihi === '2024-02-01' && kisi.cinsiyet === 'Erkek' && kisi.durum === 'aktif';
  })(), JSON.stringify(iy5Sonra.filter((p) => p.sicil === '9001')[0]));
  kontrol('Kayıt kalıcı yazıma geçti',
    JSON.parse(window.localStorage.getItem(ISG.depo.anahtar)).personel.some((p) => p.sicil === '9001'));
  kontrol('Onay sonrası diyalog kapandı', topluDiyalog.open === false);
  kontrol('Kapsam yüklenen iş yerine çevrildi', ISG.ui.kapsam === 'iy5', String(ISG.ui.kapsam));
  kontrol('Yüklenen personel listede görünüyor', /Topluk Test Bir/.test(metin('#gorunum')));
  kontrol('Denetim izinde toplu yükleme kaydı var',
    ISG.yetki.denetimListe().some((k) => k.islem === 'personelTopluEkle'));

  /* Aynı dosya yeniden yüklenirse yeni kayıt çıkmaz, hepsi mükerrer sayılır. */
  const tekrarYukleme = Toplu.analizEt(karisik, {
    mevcut: ISG.depo.al().personel.filter((p) => p.isyeriId === 'iy5'),
    digerIsyerleri: ISG.depo.al().personel.filter((p) => p.isyeriId !== 'iy5')
  });
  kontrol('Tekrar yükülemede yeni kayıt çıkmıyor', tekrarYukleme.ozet.hazir === 0 && tekrarYukleme.ozet.mukerrer === 5,
    JSON.stringify(tekrarYukleme.ozet));

  /* Büyük liste tek kalıcı yazımla eklenir. */
  const buyukSatirlar = [SABLON_BASLIK.slice()];
  for (let b = 0; b < 120; b += 1) {
    buyukSatirlar.push([String(7000 + b), 'Toplu Ölçek ' + b, String(40000000000 + b), 'Operatör', 'Üretim',
      '', 'ASKİ 1', '2024-03-01', '', '', 'E']);
  }
  const buyuk = Toplu.analizEt(buyukSatirlar, { mevcut: [], digerIsyerleri: [] });
  const buyukSonuc = Toplu.uygula(buyuk, { isyeriId: 'iy5' });
  kontrol('Yüzlerce satır tek işlemde ekleniyor', buyukSonuc.eklenen === 120 &&
    ISG.depo.al().personel.filter((p) => /^Toplu Ölçek /.test(p.adSoyad)).length === 120, String(buyukSonuc.eklenen));

  /* Toplu yazımda kimlik çakışması olmamalı: çakışan kimlikler bulut
     eşitlemesinde kayıtların birbirini yutar, silme iki kaydı birden siler. */
  const topluIdler = ISG.depo.al().personel.filter((p) => /^Toplu Ölçek /.test(p.adSoyad)).map((p) => p.id);
  kontrol('Toplu eklenen kayıtların kimlikleri benzersiz',
    new Set(topluIdler).size === topluIdler.length && new Set(topluIdler).size > 0,
    topluIdler.length + ' kayıt · ' + new Set(topluIdler).size + ' benzersiz kimlik');
  const uretilenIdler = [];
  for (let u = 0; u < 20000; u += 1) { uretilenIdler.push(ISG.yeniId('p')); }
  kontrol('Kimlik üreteci kısa sürede aynı kimliği üretmiyor',
    new Set(uretilenIdler).size === uretilenIdler.length,
    uretilenIdler.length + ' üretim · ' + new Set(uretilenIdler).size + ' benzersiz');
  const yiginKayitlar = [];
  for (let y = 0; y < 1140; y += 1) {
    yiginKayitlar.push({ isyeriId: 'iy5', sicil: 'BY' + y, adSoyad: 'Kimlik Yığın ' + y,
      tc: String(90000000000 + y) });
  }
  const yigin = ISG.depo.personelTopluEkle('iy5', yiginKayitlar);
  const yiginIdler = yigin.idler || [];
  kontrol('Binde bir ölçekte (1140 personel) tekil kimlik üretiliyor',
    yigin.eklenen === 1140 && new Set(yiginIdler).size === 1140,
    yigin.eklenen + ' kayıt · ' + new Set(yiginIdler).size + ' benzersiz kimlik');
  ISG.depo.al().personel = ISG.depo.al().personel.filter((p) => !/^Kimlik Yığın /.test(p.adSoyad));
  ISG.depo.kaydet();

  /* Dosya seçme kutusuyla gerçek XLSX yüklemesi: kullanıcı şablonu doldurur, dosyayı
     seçer; sistem Kılavuz sayfasını atlayıp Personel sayfasını okur ve ön izlemeyi açar. */
  const girisSayfalar = [{
    ad: 'Personel',
    basliklar: SABLON_BASLIK.slice(),
    satirlar: [
      ['9301', 'Dosya Girişi Bir', '55555555550', 'Elektrik teknisyeni', 'Bakım', 'G-101', 'Merkez',
        '10.02.2024', '2020-01-01', '0555 444 33 22', 'E'],
      ['9302', 'Dosya Girişi İki', '55555555551', 'Büro görevlisi', 'İnsan Kaynakları', '', '',
        '2024-02-11', '', '', 'Kadın'],
      ['9303', 'Dosya Girişi Üç', '12345', 'Teknisyen', '', '', '', 'mart 2024', '', '', 'X']
    ]
  }, {
    ad: 'Kılavuz',
    basliklar: SABLON_BASLIK.slice(0, 3),
    satirlar: [['Zorunlu', 'Zorunlu', 'Zorunlu'], ['Boş bırakılmaz', 'Boş bırakılmaz', '11 hane']]
  }];
  const girisSatirlari = [SABLON_BASLIK.slice()].concat(girisSayfalar[0].satirlar);
  const girisDosyasi = new window.File([ISG.excel.xlsxYaz(girisSayfalar)], 'Personel-Yukleme.xlsx',
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const girisKutusu = doc.getElementById('personelDosya');
  Object.defineProperty(girisKutusu, 'files', { configurable: true, value: [girisDosyasi] });
  girisKutusu.dispatchEvent(new window.Event('change', { bubbles: true }));
  await bekle(400);
  const girisDurum = ISG.uygulama.personelTopluDurum();
  kontrol('Dosya seçilince ön izleme kendiliğinden açıldı',
    topluDiyalog.open === true && !!girisDurum, topluDiyalog.open + ' / ' + !!girisDurum);
  kontrol('Seçilen Excel dosyasının adı ön izlemede yazıyor',
    /Personel-Yukleme\.xlsx/.test(metin('#personelTopluDosya')), metin('#personelTopluDosya'));
  kontrol('Kılavuz sayfası yok sayılıp Personel sayfası okundu',
    !!girisDurum && girisDurum.analiz.ozet.dosyaSatir === 3 && girisDurum.analiz.ozet.hazir === 2 &&
    girisDurum.analiz.ozet.hatali === 1, girisDurum ? JSON.stringify(girisDurum.analiz.ozet) : '-');
  kontrol('Hatalı satırın gerekçesi ön izlemede gösteriliyor',
    /11 hane/.test(metin('#personelTopluOnizleme')) && /tanınmadı/.test(metin('#personelTopluOnizleme')),
    metin('#personelTopluOnizleme').slice(0, 120));
  kontrol('Okunan dosya girişi temiz bırakıldı', girisKutusu.value === '', String(girisKutusu.value));
  delete girisKutusu.files;

  const girisOnce = ISG.depo.al().personel.length;
  doc.getElementById('personelTopluKaydet').click();
  await bekle(170);
  const girisKayitlari = ISG.depo.al().personel.filter((p) => /^Dosya Girişi /.test(p.adSoyad));
  kontrol('Ön izleme onayı yalnız geçerli satırları kaydediyor',
    ISG.depo.al().personel.length === girisOnce + 2 && girisKayitlari.length === 2, String(girisKayitlari.length));
  const girisBir = girisKayitlari.filter((p) => p.adSoyad === 'Dosya Girişi Bir')[0] || {};
  const girisIki = girisKayitlari.filter((p) => p.adSoyad === 'Dosya Girişi İki')[0] || {};
  kontrol('Excel sütunları doğru alanlara yazıldı',
    girisBir.isyeriId === 'iy5' && girisBir.durum === 'aktif' && girisBir.meslek === 'Elektrik teknisyeni' &&
    girisBir.departman === 'Bakım' && String(girisBir.telefon).replace(/\D/g, '') === '05554443322' &&
    girisBir.iseBaslama === '2024-02-10' && girisBir.cinsiyet === 'Erkek' &&
    girisIki.cinsiyet === 'Kadın' && girisIki.iseBaslama === '2024-02-11' && girisIki.tc === '55555555551',
    JSON.stringify([girisBir, girisIki].map((p) => [p.meslek, p.telefon, p.iseBaslama, p.cinsiyet, p.tc])));
  kontrol('Hatalı satır dosyadan kaydedilmedi',
    !ISG.depo.al().personel.some((p) => p.adSoyad === 'Dosya Girişi Üç'));

  /* Aynı dosya tekrar seçilirse kaydedilecek satır kalmaz: onay düğmesi kapanır,
     kullanıcı "kayıt yapılmayacağını" ön izlemeden anlar. */
  ISG.uygulama.personelTopluOnizle(girisSatirlari, 'Personel-Yukleme.xlsx', 'iy5');
  await bekle(120);
  const kaydetDugmesi = doc.getElementById('personelTopluKaydet');
  const girisTekrar = ISG.uygulama.personelTopluDurum();
  const mukerrerMetin = metin('#personelTopluOnizleme') + ' ' + metin('#personelTopluOzet') + ' ' +
    metin('#personelTopluUyari');
  kontrol('Aynı dosya yeniden seçilince tek kayıt bile eklenmiyor',
    !!girisTekrar && girisTekrar.analiz.ozet.hazir === 0 && girisTekrar.analiz.ozet.mukerrer === 2,
    girisTekrar ? JSON.stringify(girisTekrar.analiz.ozet) : '-');
  kontrol('Kaydedilecek satır kalmayınca onay düğmesi kapanıyor', kaydetDugmesi.disabled === true,
    kaydetDugmesi.textContent.trim());
  kontrol('Ön izleme kaydın yapılmayacağını gerekçesiyle gösteriyor',
    /Mükerrer/.test(mukerrerMetin) && /atlanacak/.test(mukerrerMetin) && /Satır 2/.test(mukerrerMetin) &&
    !/dosyada yok/.test(mukerrerMetin), mukerrerMetin.slice(0, 140));
  const mukerrerOnce = ISG.depo.al().personel.length;
  kaydetDugmesi.click();
  await bekle(140);
  kontrol('Onaysız/uygun satırsız deneme kayıt yapmıyor',
    ISG.depo.al().personel.length === mukerrerOnce && topluDiyalog.open === true,
    mukerrerOnce + ' -> ' + ISG.depo.al().personel.length);
  doc.querySelector('#personelTopluDiyalog [data-kapat]').click();
  await bekle(90);
  kontrol('Vazgeçilen ön izleme kapandı ve durumu temizlendi',
    topluDiyalog.open === false && ISG.uygulama.personelTopluDurum() === null);

  /* Test kayıtları geri alınır; sonraki bölümler demo verisiyle devam eder. */
  ISG.depo.al().personel.filter((p) => /^Topluk Test |^Toplu Ölçek |^Dosya Girişi /.test(p.adSoyad))
    .forEach((p) => ISG.depo.personelSil(p.id));
  ISG.ui.kapsam = '';
  ISG.ui.personelToplu = null;
  ISG.uygulama.ciz();
  await bekle(140);
  kontrol('Test kayıtları temizlendi, personel sayısı geri döndü',
    ISG.depo.al().personel.length === toplamOnce, String(ISG.depo.al().personel.length));

  console.log('\n12f) Yıllık çalışma planı: şablon, toplu yükleme, seçim, toplu silme');
  await sayfaAc('#plan');
  const Plan = ISG.planToplu;
  const PLAN_BASLIK = ['Sıra No', 'Ana Başlık', 'Çalışma Konusu', 'Sorumlu', 'Açıklama',
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const PLAN_YILI = 2031;
  const planOnce = ISG.depo.al().planlar.length;
  const iy5PlanOnce = ISG.depo.al().planlar.filter((p) => p.isyeriId === 'iy5').length;

  kontrol('Plan toplu aktarım modülü yüklendi', !!Plan && typeof Plan.analizEt === 'function' &&
    typeof Plan.uygula === 'function' && typeof Plan.sablonSayfalar === 'function');
  kontrol('Plan şablonu 17 sütun ve istenen sırada',
    JSON.stringify(Plan.BASLIKLAR) === JSON.stringify(PLAN_BASLIK), Plan.BASLIKLAR.join(' | '));
  kontrol('Plan ekranında şablon/yükle/aktar/sil düğmeleri var',
    !!doc.querySelector('[data-islem="plan-sablon"]') && !!doc.querySelector('[data-islem="plan-toplu-yukle"]') &&
    !!doc.querySelector('[data-islem="plan-excel"]') && !!doc.querySelector('[data-islem="plan-toplu-sil"]'));
  kontrol('Plan dosya girişi XLSX ve CSV kabul ediyor',
    /\.xlsx/.test(doc.getElementById('planDosyaGirdi').getAttribute('accept') || '') &&
    /text\/csv/.test(doc.getElementById('planDosyaGirdi').getAttribute('accept') || ''),
    String(doc.getElementById('planDosyaGirdi').getAttribute('accept')));
  kontrol('Plan tablosunda seçim kutuları ve yıl seçici var', !!doc.getElementById('planYili') &&
    doc.querySelectorAll('[data-plan-sec]').length > 0 && !!doc.querySelector('[data-plan-sec-tumu]'),
    String(doc.querySelectorAll('[data-plan-sec]').length));

  const planSablonSayfalar = Plan.sablonSayfalar();
  kontrol('Şablon plan ve kılavuz sayfalarından oluşuyor',
    planSablonSayfalar.length === 2 && planSablonSayfalar[1].ad === 'Kılavuz',
    planSablonSayfalar.map((s) => s.ad).join(', '));
  const planSablonGeri = await ISG.excel.oku(ISG.excel.xlsxYaz(planSablonSayfalar));
  kontrol('Plan şablonu geri okunuyor, başlıklar ilk satırda',
    JSON.stringify((planSablonGeri[0].satirlar[0] || []).map((h) => String(h).trim())) === JSON.stringify(PLAN_BASLIK),
    JSON.stringify(planSablonGeri[0].satirlar[0]));
  kontrol('Plan kılavuzu mükerrer ve iş yeri izolasyon kuralını anlatıyor',
    /Mükerrer/.test(JSON.stringify(planSablonGeri[1].satirlar)) &&
    /İş yeri izolasyonu/.test(JSON.stringify(planSablonGeri[1].satirlar)));

  const planIndirmeler = [];
  const gercekPlanIndirme = ISG.bicim.dosyaIndirBayt;
  ISG.bicim.dosyaIndirBayt = function (dosyaAdi, baytlar, tip) {
    planIndirmeler.push({ ad: dosyaAdi, baytlar: baytlar, tip: tip });
  };
  try {
    doc.querySelector('[data-islem="plan-sablon"]').click();
    await bekle(120);
  } finally {
    ISG.bicim.dosyaIndirBayt = gercekPlanIndirme;
  }
  kontrol('Şablon düğmesi XLSX dosyası indiriyor', planIndirmeler.length === 1 &&
    planIndirmeler[0].ad === 'Yillik-Calisma-Plani-Sablonu.xlsx' &&
    planIndirmeler[0].baytlar[0] === 0x50 && planIndirmeler[0].baytlar[1] === 0x4B,
    JSON.stringify(planIndirmeler.map((d) => d.ad)));

  /* Eski biçimli kurum dosyası: sayfa bilgi bloğu, tekrar eden tablo başlığı, ay
     numara satırı, bölüm satırları ve imza alanı faaliyet olarak kaydedilmez. */
  const planSatirlari = [
    ['ACME ENERJİ A.Ş. - ' + PLAN_YILI + ' YILI YILLIK ÇALIŞMA PLANI'],
    ['Doküman No', 'İSG.FORM.012', 'Revizyon', '03', 'Sayfa', '1/3'],
    PLAN_BASLIK.slice(),
    ['1', '', 'Eğitimler', '', ''],
    ['1.1', 'Eğitimler', 'Temel iş sağlığı ve güvenliği eğitimi', 'İGU', 'Yeni işe başlayanlara',
      '', '', 'X', '', '', '', '', '', '', '', '', ''],
    ['1.2', 'Eğitimler', 'Yangın ve tahliye tatbikatı', 'İGU, Birim Sorumluları', 'Yılda bir kez',
      '', '', '', '', '', '', 'X', '', '', '', '', ''],
    ['1.2', 'Eğitimler', 'Yangın ve tahliye tatbikatı', 'İGU, Birim Sorumluları', 'Dosyadaki tekrar',
      '', '', '', '', '', '', 'X', '', '', '', '', ''],
    ['Örnek: Biçim gösterimi', '', 'Örnek: Şablondan kalan satır', 'İGU', 'kaydedilmez',
      '', 'X', '', '', '', '', '', '', '', '', '', ''],
    ['2', '', 'Acil Durumlar', '', ''],
    ['2.1', 'Acil Durumlar', 'Acil durum ekipmanı kontrolü', 'Bakım Sorumlusu', 'Üç ayda bir',
      'X', '', '', 'X', '', '', '', '', '', '', '', ''],
    ['', '', '', 'Faaliyeti boş satır'],
    PLAN_BASLIK.slice(),
    ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    ['3.1', 'Eğitimler', 'İlk yardım eğitimi yenileme', 'İH', 'Zorunlu',
      '', '', '', '', '', '', '', '', '', 'X', '', ''],
    ['', 'HAZIRLAYANLAR', 'ONAYLAYAN', '', '']
  ];
  const planAyrismis = Plan.analizEt(planSatirlari, { isyeriId: 'iy5', yil: 0, mevcut: [] });
  kontrol('Plan yılı dosya başlığından bulundu, tablo başlığı satır 3',
    planAyrismis.yil === PLAN_YILI && planAyrismis.baslikSatir === 3,
    planAyrismis.yil + ' / ' + planAyrismis.baslikSatir);
  kontrol('Ana başlık, tablo başlığı, imza ve örnek satırlar ayıklandı',
    planAyrismis.ozet.bolum === 2 && planAyrismis.ozet.baslik === 2 &&
    planAyrismis.ozet.imza === 1 && planAyrismis.ozet.ornek === 1, JSON.stringify(planAyrismis.ozet));
  kontrol('Ayrıştırma notu kullanıcıya gösteriliyor',
    /ana başlık/.test(planAyrismis.uyarilar.join(' ')), planAyrismis.uyarilar.join(' '));
  kontrol('Faaliyetler ana başlık ve ay işaretleriyle doğru okundu', (function () {
    const hazir = Plan.uygulanacaklar(planAyrismis);
    const yangin = hazir.filter((k) => k.faaliyet === 'Yangın ve tahliye tatbikatı')[0] || {};
    const ekipman = hazir.filter((k) => k.faaliyet === 'Acil durum ekipmanı kontrolü')[0] || {};
    return hazir.length === 4 && JSON.stringify(yangin.aylar) === '[7]' && yangin.anaBaslik === 'Eğitimler' &&
      JSON.stringify(ekipman.aylar) === '[1,4]' && ekipman.anaBaslik === 'Acil Durumlar';
  })(), JSON.stringify(Plan.uygulanacaklar(planAyrismis).map((k) => [k.faaliyet, k.aylar, k.anaBaslik])));
  kontrol('Dosya içi mükerrer satır gerekçesiyle eleniyor', planAyrismis.ozet.mukerrer === 1 &&
    /6\. satırda aynı faaliyet/.test(JSON.stringify(planAyrismis.satirlar)), JSON.stringify(planAyrismis.ozet));
  kontrol('Çalışma Konusu boş satır hatalı sayılıyor',
    planAyrismis.ozet.hatali === 1 && /Çalışma Konusu sütunu boş/.test(JSON.stringify(planAyrismis.satirlar)));
  kontrol('Kaydedilecek liste yalnızca hazır satırları içeriyor',
    Plan.uygulanacaklar(planAyrismis).length === planAyrismis.ozet.hazir &&
    planAyrismis.satirlar.filter((s) => s.durum !== 'hazir').every((s) =>
      !Plan.uygulanacaklar(planAyrismis).some((k) => k.faaliyet === s.faaliyet && k.kaynakSatir === s.satirNo)),
    JSON.stringify({ hazir: planAyrismis.ozet.hazir, liste: Plan.uygulanacaklar(planAyrismis).length }));
  kontrol('Başlığı bulunmayan dosya anlaşılır hata veriyor',
    /tablo başlığı bulunamadı/.test(Plan.analizEt([['A', 'B'], ['1', '2']], { mevcut: [] }).hata),
    Plan.analizEt([['A', 'B'], ['1', '2']], { mevcut: [] }).hata);

  /* Arayüz akışı: aynı faaliyet iş yerinde zaten kayıtlı → mükerrer sayılır. */
  const planTestEski = ISG.depo.planKaydet({
    isyeriId: 'iy5', yil: PLAN_YILI, faaliyet: 'Temel iş sağlığı ve güvenliği eğitimi',
    sorumlu: 'İGU', durum: 'yapilacak', takipTarihi: PLAN_YILI + '-03-15', sira: 1
  }).id;

  ISG.uygulama.planTopluOnizle(planSatirlari, PLAN_YILI + '-yillik-plan.xlsx', 'iy5');
  await bekle(140);
  const planDiyalog = doc.getElementById('planTopluDiyalog');
  const planDurum = () => ISG.uygulama.planTopluDurum();
  kontrol('Plan ön izleme diyaloğu açıldı', planDiyalog.open === true && !!planDurum());
  kontrol('Plan iş yeri seçici altı iş yerini getiriyor',
    doc.querySelectorAll('#planTopluIsyeri option').length === 6 &&
    doc.getElementById('planTopluIsyeri').value === 'iy5',
    String(doc.querySelectorAll('#planTopluIsyeri option').length));
  kontrol('Plan yılı alanı dosyadan gelen yılı gösteriyor',
    doc.getElementById('planTopluYil').value === String(PLAN_YILI),
    doc.getElementById('planTopluYil').value);
  kontrol('Plan özeti beş sayım kutusu basıyor',
    doc.querySelectorAll('#planTopluOzet .toplu-sayi').length === 5,
    String(doc.querySelectorAll('#planTopluOzet .toplu-sayi').length));
  kontrol('Kayıtlı faaliyet mükerrer sayıldı, kalanlar listelendi',
    planDurum().analiz.ozet.mukerrer === 2 && planDurum().analiz.ozet.hazir === 3,
    JSON.stringify(planDurum().analiz.ozet));
  kontrol('Dosya adı, iş yeri ve yıl ön izlemede yazıyor',
    new RegExp(PLAN_YILI + '-yillik-plan\\.xlsx').test(metin('#planTopluDosya')) &&
    /ASKİ-1/.test(metin('#planTopluDosya')) && /2031/.test(metin('#planTopluDosya')),
    metin('#planTopluDosya'));
  kontrol('Satır bazlı gerekçeler ve ay işaretleri görünüyor',
    /Mükerrer/.test(metin('#planTopluOnizleme')) && /Oca, Nis/.test(metin('#planTopluOnizleme')) &&
    /Çalışma Konusu sütunu boş/.test(metin('#planTopluOnizleme')), metin('#planTopluOnizleme').slice(0, 200));
  kontrol('Onay düğmesi etkin ve kayıt metni taşıyor',
    doc.getElementById('planTopluKaydet').disabled === false &&
    /Kaydedilecekleri ekle/.test(doc.getElementById('planTopluKaydet').textContent));
  const planYuklemedenOnce = ISG.depo.al().planlar.length;
  kontrol('Onay öncesi hiçbir plan kaydı yazılmadı', planYuklemedenOnce === planOnce + 1,
    String(planYuklemedenOnce));

  /* İş yeri değişince mükerrer denetimi o iş yerine göre yeniden koşar. */
  doc.getElementById('planTopluIsyeri').value = 'iy6';
  doc.getElementById('planTopluIsyeri').dispatchEvent(new window.Event('change', { bubbles: true }));
  await bekle(90);
  kontrol('Başka iş yerinde mükerrer sayılmıyor (iş yeri izolasyonu)',
    planDurum().analiz.ozet.hazir === 4 && planDurum().analiz.ozet.mukerrer === 1,
    JSON.stringify(planDurum().analiz.ozet));
  doc.getElementById('planTopluIsyeri').value = 'iy5';
  doc.getElementById('planTopluIsyeri').dispatchEvent(new window.Event('change', { bubbles: true }));
  await bekle(90);

  /* Yıl değişince aynı dosya başka yılın kayıtlarıyla karşılaştırılır. */
  doc.getElementById('planTopluYil').value = String(PLAN_YILI + 1);
  doc.getElementById('planTopluYil').dispatchEvent(new window.Event('change', { bubbles: true }));
  await bekle(90);
  kontrol('Başka yıl seçilince mükerrer denetimi tazeleniyor',
    planDurum().analiz.ozet.hazir === 4 && planDurum().yil === PLAN_YILI + 1,
    JSON.stringify(planDurum().analiz.ozet) + ' / ' + planDurum().yil);
  doc.getElementById('planTopluYil').value = String(PLAN_YILI);
  doc.getElementById('planTopluYil').dispatchEvent(new window.Event('change', { bubbles: true }));
  await bekle(90);
  kontrol('Yıl geri alıninca sayımlar eski değerine döndü',
    planDurum().analiz.ozet.hazir === 3 && planDurum().analiz.ozet.mukerrer === 2,
    JSON.stringify(planDurum().analiz.ozet));

  /* Onay: yalnızca burada ve yalnızca hedef işyerine yazılır. */
  doc.getElementById('planTopluForm').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await bekle(240);
  const planYeni = ISG.depo.al().planlar.filter((p) => p.isyeriId === 'iy5' && ISG.planYil(p) === PLAN_YILI);
  kontrol('Yalnızca geçerli satırlar kaydedildi',
    ISG.depo.al().planlar.length === planYuklemedenOnce + 3 && planYeni.length === 4,
    ISG.depo.al().planlar.length + ' / ' + planYeni.length);
  kontrol('Mükerrer, örnek ve hatalı satırlar kaydedilmedi',
    planYeni.filter((p) => p.faaliyet === 'Temel iş sağlığı ve güvenliği eğitimi').length === 1 &&
    !planYeni.some((p) => p.aciklama === 'Dosyadaki tekrar') &&
    !planYeni.some((p) => /^Örnek: /.test(p.faaliyet)));
  kontrol('Plan kaydı alanları doğru dolduruldu', (function () {
    const ekipman = planYeni.filter((p) => p.faaliyet === 'Acil durum ekipmanı kontrolü')[0] || {};
    const tatbikat = planYeni.filter((p) => p.faaliyet === 'Yangın ve tahliye tatbikatı')[0] || {};
    return JSON.stringify(ekipman.aylar) === '[1,4]' && ekipman.anaBaslik === 'Acil Durumlar' &&
      ekipman.sorumlu === 'Bakım Sorumlusu' && ekipman.durum === 'yapilacak' && ekipman.kaynak === 'Excel' &&
      ekipman.yil === PLAN_YILI && tatbikat.siraExcel === '1.2' && ISG.planAylari(tatbikat).join() === '7';
  })(), JSON.stringify(planYeni.map((p) => [p.faaliyet, p.aylar, p.anaBaslik])));
  kontrol('Diğer iş yerlerinin planlarına dokunulmadı',
    ISG.depo.al().planlar.filter((p) => p.isyeriId !== 'iy5').length === planOnce - iy5PlanOnce,
    String(ISG.depo.al().planlar.filter((p) => p.isyeriId !== 'iy5').length));
  kontrol('ASKİ-1 mevcut planları korundu, yenileri eklendi',
    ISG.depo.al().planlar.filter((p) => p.isyeriId === 'iy5').length === iy5PlanOnce + 4,
    String(ISG.depo.al().planlar.filter((p) => p.isyeriId === 'iy5').length));
  kontrol('Kayıt kalıcı yazıma geçti',
    JSON.parse(window.localStorage.getItem(ISG.depo.anahtar)).planlar.some((p) => p.yil === PLAN_YILI &&
      p.faaliyet === 'İlk yardım eğitimi yenileme'));
  kontrol('Onay sonrası diyalog kapandı ve durum temizlendi',
    planDiyalog.open === false && ISG.uygulama.planTopluDurum() === null);
  kontrol('Kapsam ve yıl yüklenen plana çevrildi',
    ISG.ui.kapsam === 'iy5' && String(ISG.ui.planYili) === String(PLAN_YILI),
    ISG.ui.kapsam + ' / ' + ISG.ui.planYili);
  kontrol('Yüklenen faaliyetler tabloda listeleniyor',
    /Acil durum ekipmanı kontrolü/.test(metin('#gorunum')) && /Eğitimler/.test(metin('#gorunum')));
  kontrol('Denetim izinde plan toplu yükleme kaydı var',
    ISG.yetki.denetimListe().some((k) => k.islem === 'planTopluEkle'));

  /* Aynı dosya yeniden yüklenirse tek kayıt bile eklenmez; onay düğmesi kapanır. */
  ISG.uygulama.planTopluOnizle(planSatirlari, PLAN_YILI + '-yillik-plan.xlsx', 'iy5');
  await bekle(120);
  const planTekrar = planDurum();
  kontrol('Tekrar yüklemede kaydedilecek satır kalmıyor',
    !!planTekrar && planTekrar.analiz.ozet.hazir === 0 && planTekrar.analiz.ozet.mukerrer === 5,
    planTekrar ? JSON.stringify(planTekrar.analiz.ozet) : '-');
  kontrol('Onay düğmesi kaydedilecek satır kalmayınca kapanıyor',
    doc.getElementById('planTopluKaydet').disabled === true);
  const planTekrarOnce = ISG.depo.al().planlar.length;
  doc.getElementById('planTopluKaydet').click();
  await bekle(120);
  kontrol('Satır kalmayan ön izleme kayıt yapmıyor',
    ISG.depo.al().planlar.length === planTekrarOnce && planDiyalog.open === true,
    String(ISG.depo.al().planlar.length));

  /* Gerçek dosya seçme kutusu: Kılavuz sayfası atlanır, plan sayfası okunur. */
  const planAy = (n) => { const r = new Array(12).fill(''); r[n - 1] = 'X'; return r; };
  const planGirisSayfalar = [{
    ad: 'Yıllık Çalışma Planı',
    basliklar: PLAN_BASLIK.slice(),
    satirlar: [
      ['1.1', 'Eğitimler', 'Yüksekte çalışma eğitimi', 'İGU', '2032 yılı bakım planı'].concat(planAy(5)),
      ['2.1', 'Acil Durumlar', 'İş ekipmanı periyodik muayenesi', 'Bakım Sorumlusu', '2032 yılı planı'].concat(planAy(9)),
      ['3.1', 'Eğitimler', 'İtfaiye ile ortak tatbikat', 'İGU, Birim Sorumluları', '2032 yılı planı'].concat(planAy(11))
    ]
  }, {
    ad: 'Kılavuz',
    basliklar: ['Sütun / konu', 'Zorunluluk', 'Biçim ve kural'],
    satirlar: [['Çalışma Konusu', 'Zorunlu', 'Boş olan satır kaydedilmez'],
      ['Mükerrer', 'Kural', 'Aynı iş yerinde aynı konu ve sorumlu tekrar kaydedilmez']]
  }];
  const planGirisDosyasi = new window.File([ISG.excel.xlsxYaz(planGirisSayfalar)],
    '2032-Yillik-Calisma-Plani.xlsx',
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const planKutusu = doc.getElementById('planDosyaGirdi');
  Object.defineProperty(planKutusu, 'files', { configurable: true, value: [planGirisDosyasi] });
  planKutusu.dispatchEvent(new window.Event('change', { bubbles: true }));
  await bekle(420);
  const planGirisDurum = planDurum();
  kontrol('Dosya seçilince plan ön izlemesi kendiliğinden açıldı',
    planDiyalog.open === true && !!planGirisDurum, planDiyalog.open + ' / ' + !!planGirisDurum);
  kontrol('Seçilen Excel dosyasının adı ön izlemede yazıyor',
    /2032-Yillik-Calisma-Plani\.xlsx/.test(metin('#planTopluDosya')), metin('#planTopluDosya'));
  kontrol('Kılavuz sayfası yok sayılıp plan sayfası okundu',
    !!planGirisDurum && planGirisDurum.analiz.ozet.dosyaSatir === 3 && planGirisDurum.analiz.ozet.hazir === 3,
    planGirisDurum ? JSON.stringify(planGirisDurum.analiz.ozet) : '-');
  kontrol('Plan yılı dosyadan okunup yıl alanına yazıldı',
    !!planGirisDurum && planGirisDurum.yil === 2032 &&
    doc.getElementById('planTopluYil').value === '2032',
    (planGirisDurum && planGirisDurum.yil) + ' / ' + doc.getElementById('planTopluYil').value);
  kontrol('Okunan dosya girişi temiz bırakıldı', planKutusu.value === '', String(planKutusu.value));
  delete planKutusu.files;
  const planGirisOnce = ISG.depo.al().planlar.length;
  doc.getElementById('planTopluKaydet').click();
  await bekle(220);
  kontrol('Dosya seçme akışı da yalnızca onaydan sonra yazıyor',
    ISG.depo.al().planlar.length === planGirisOnce + 3 &&
    ISG.depo.al().planlar.filter((p) => p.yil === 2032).length === 3,
    String(ISG.depo.al().planlar.filter((p) => p.yil === 2032).length));

  /* Vazgeçilen ön izleme bellekte tutulmaz. */
  ISG.uygulama.planTopluOnizle(planSatirlari, 'vazgecilen.xlsx', 'iy5');
  await bekle(120);
  doc.querySelector('#planTopluDiyalog [data-kapat]').click();
  await bekle(90);
  kontrol('Vazgeçilen plan ön izlemesi kapandı ve durumu silindi',
    planDiyalog.open === false && ISG.uygulama.planTopluDurum() === null);

  /* Excel'e aktar: indirilen dosya aynı modülle geri okunabilir (round-trip). */
  ISG.ui.planYili = String(PLAN_YILI);
  ISG.uygulama.ciz();
  await bekle(140);
  const planAktarim = [];
  const gercekPlanAktarim = ISG.bicim.dosyaIndirBayt;
  ISG.bicim.dosyaIndirBayt = function (dosyaAdi, baytlar, tip) {
    planAktarim.push({ ad: dosyaAdi, baytlar: baytlar, tip: tip });
  };
  try {
    doc.querySelector('[data-islem="plan-excel"]').click();
    await bekle(140);
  } finally {
    ISG.bicim.dosyaIndirBayt = gercekPlanAktarim;
  }
  kontrol('"Excel\'e aktar" XLSX dosyası indiriyor', planAktarim.length === 1 &&
    /^yillik-calisma-plani-\d{8}\.xlsx$/.test(planAktarim[0].ad) &&
    planAktarim[0].baytlar[0] === 0x50 && planAktarim[0].baytlar[1] === 0x4B,
    JSON.stringify(planAktarim.map((d) => d.ad)));
  const planGeriSayfalar = await ISG.excel.oku(planAktarim[0].baytlar);
  const planGeri = Plan.analizEt(planGeriSayfalar[0].satirlar, { isyeriId: 'iy5', yil: PLAN_YILI, mevcut: [] });
  kontrol('İndirilen plan dosyası geri yüklenince aynı faaliyetleri veriyor',
    planGeri.ozet.hazir === 4 && planGeri.ozet.mukerrer === 0 &&
    /Acil durum ekipmanı kontrolü/.test(JSON.stringify(Plan.uygulanacaklar(planGeri))),
    JSON.stringify(planGeri.ozet));

  /* Tablo seçimi: tek satır, "Tümünü seç" ve seçinin silme düğmesi. */
  const planKutulari = () => Array.from(doc.querySelectorAll('[data-plan-sec]'));
  kontrol('Plan tablosu seçim kutularıyla çizildi', planKutulari().length === 4, String(planKutulari().length));
  planKutulari()[0].checked = true;
  planKutulari()[0].dispatchEvent(new window.Event('change', { bubbles: true }));
  await bekle(130);
  kontrol('Seçim sayısı yazılıyor, "Seçilenleri sil" açılıyor',
    /1 kayıt seçili/.test(metin('.plan-secim-cubugu')) &&
    doc.querySelector('[data-islem="plan-sec-sil"]').disabled === false, metin('.plan-secim-cubugu'));
  doc.querySelector('[data-plan-sec-tumu]').checked = true;
  doc.querySelector('[data-plan-sec-tumu]').dispatchEvent(new window.Event('change', { bubbles: true }));
  await bekle(130);
  kontrol('"Tümünü seç" görünen dört faaliyetin tamamını seçti',
    ISG.ui.planSecim && Object.keys(ISG.ui.planSecim).length === 4 &&
    /4 kayıt seçili/.test(metin('.plan-secim-cubugu')), JSON.stringify(ISG.ui.planSecim));
  doc.querySelector('[data-plan-sec-tumu]').checked = false;
  doc.querySelector('[data-plan-sec-tumu]').dispatchEvent(new window.Event('change', { bubbles: true }));
  await bekle(130);
  kontrol('Seçim kalkınca düğme yeniden kapanıyor',
    ISG.ui.planSecim && Object.keys(ISG.ui.planSecim).length === 0 &&
    doc.querySelector('[data-islem="plan-sec-sil"]').disabled === true, JSON.stringify(ISG.ui.planSecim));

  /* Toplu silme diyaloğu: yalnızca seçili iş yeri + yıl, açık onayla. */
  doc.querySelector('[data-islem="plan-toplu-sil"]').click();
  await bekle(150);
  const planSilDiyalog = doc.getElementById('planTopluSilDiyalog');
  const planSilDurum = () => ISG.uygulama.planTopluSilDurum();
  kontrol('Toplu silme diyaloğu açıldı, iş yeri ve yıl geldi',
    planSilDiyalog.open === true && doc.getElementById('planSilIsyeri').value === 'iy5' &&
    doc.getElementById('planSilYil').value === String(PLAN_YILI) && !!planSilDurum(),
    doc.getElementById('planSilIsyeri').value + ' / ' + doc.getElementById('planSilYil').value);
  const planKalanBeklenen = iy5PlanOnce + 3; // 2032 yüklemesi kalır, 2031 silinir
  kontrol('Silme onayı iş yerini, yılı, sayıyı ve geri alınamaz uyarısını gösteriyor',
    new RegExp(PLAN_YILI + ' yılına ait 4 çalışma planı kaydını').test(metin('#planSilOzet')) &&
    /silmek üzeresiniz/.test(metin('#planSilOzet')) &&
    /geri alınamaz/.test(metin('#planSilOzet')) &&
    metin('#planSilOzet').indexOf('kalan: ' + planKalanBeklenen + ' kayıt') > -1, metin('#planSilOzet'));
  kontrol('Tablo seçimi yoksa "seçtiklerim" seçeneği kapalı',
    doc.getElementById('planSilKapsamSecilen').disabled === true &&
    doc.getElementById('planSilKapsamYil').checked === true);
  kontrol('Onay işaretlenmeden silme düğmesi kapalı', doc.getElementById('planSilOnayla').disabled === true);
  const planSilOnce = ISG.depo.al().planlar.length;
  doc.getElementById('planSilOnay').checked = true;
  doc.getElementById('planSilOnay').dispatchEvent(new window.Event('change', { bubbles: true }));
  await bekle(90);
  kontrol('Onay işareti silme düğmesini açıyor', doc.getElementById('planSilOnayla').disabled === false);
  doc.getElementById('planTopluSilForm').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await bekle(220);
  const planSilSonra = ISG.depo.al().planlar;
  kontrol('Yalnızca seçili iş yerinin seçili yılı silindi',
    planSilSonra.length === planSilOnce - 4 &&
    planSilSonra.filter((p) => p.isyeriId === 'iy5' && ISG.planYil(p) === PLAN_YILI).length === 0 &&
    planSilSonra.filter((p) => p.isyeriId === 'iy5').length === planKalanBeklenen,
    [planSilOnce, planSilSonra.length, planKalanBeklenen,
      planSilSonra.filter((p) => p.isyeriId === 'iy5').length,
      planSilSonra.filter((p) => p.isyeriId === 'iy5' && ISG.planYil(p) === PLAN_YILI).length].join(' -> '));
  kontrol('Başka yıllar ve iş yerleri korundu',
    ISG.depo.al().planlar.filter((p) => p.yil === 2032).length === 3 &&
    ISG.depo.al().planlar.filter((p) => p.isyeriId !== 'iy5').length === planOnce - iy5PlanOnce,
    String(ISG.depo.al().planlar.filter((p) => p.yil === 2032).length));
  kontrol('Silme sonrası diyalog kapandı, seçim ve durum temizlendi',
    planSilDiyalog.open === false && planSilDurum() === null &&
    Object.keys(ISG.ui.planSecim || {}).length === 0);
  kontrol('Denetim izinde plan toplu silme kaydı var',
    ISG.yetki.denetimListe().some((k) => k.islem === 'planTopluSil'));

  /* "Seçilenleri sil": onay sonrası yalnızca işaretli kayıtlar silinir. */
  ISG.ui.planYili = '2032';
  ISG.uygulama.ciz();
  await bekle(150);
  const planKutulari2032 = Array.from(doc.querySelectorAll('[data-plan-sec]')).slice(0, 2)
    .map((kutu) => kutu.getAttribute('data-plan-sec'));
  kontrol('2032 yılına geçen plan listesi tabloda görünüyor',
    doc.querySelectorAll('[data-plan-sec]').length === 3, String(doc.querySelectorAll('[data-plan-sec]').length));
  /* Her seçim sonrası tablo yeniden çizildiği için kutular yeniden sorgulanır. */
  planKutulari2032.forEach((planId) => {
    const kutu = doc.querySelector('[data-plan-sec="' + planId + '"]');
    if (!kutu) { return; }
    kutu.checked = true;
    kutu.dispatchEvent(new window.Event('change', { bubbles: true }));
  });
  await bekle(150);
  doc.querySelector('[data-islem="plan-sec-sil"]').click();
  await bekle(120);
  kontrol('Seçilenleri silmeden önce onay isteniyor',
    doc.getElementById('onayDiyalog').open === true && /2 kayıt/.test(metin('#onayMetin')), metin('#onayMetin'));
  const planSecimSilOnce = ISG.depo.al().planlar.length;
  doc.getElementById('onayEvet').click();
  await bekle(220);
  kontrol('Onaylanan seçim silindi, diğer yıl kayıtları kaldı',
    ISG.depo.al().planlar.length === planSecimSilOnce - 2 &&
    ISG.depo.al().planlar.filter((p) => p.yil === 2032).length === 1 &&
    Object.keys(ISG.ui.planSecim || {}).length === 0,
    String(ISG.depo.al().planlar.filter((p) => p.yil === 2032).length));

  /* Depo katmanı korumaları: işyeri ve kapsam zorunlu, izolasyon garanti. */
  let silmeIsyeriHata = '';
  try { ISG.depo.planTopluSil({ yil: PLAN_YILI }); } catch (e) { silmeIsyeriHata = e.message; }
  kontrol('İşyeri belirtilmeden toplu silme reddediliyor', /işyeri seçilmedi/.test(silmeIsyeriHata), silmeIsyeriHata);
  let silmeKapsamHata = '';
  try { ISG.depo.planTopluSil({ isyeriId: 'iy1' }); } catch (e) { silmeKapsamHata = e.message; }
  kontrol('Kapsamı belirsiz toplu silme reddediliyor', /belirlenmedi/.test(silmeKapsamHata), silmeKapsamHata);
  const iy1PlanOnce = ISG.depo.al().planlar.filter((p) => p.isyeriId === 'iy1').length;
  const bosSilme = ISG.depo.planTopluSil({ isyeriId: 'iy1', yil: 2099 });
  kontrol('Kaydı olmayan yıl için silme 0 döner ve veriye dokunmaz',
    bosSilme.silinen === 0 && bosSilme.kalan === iy1PlanOnce &&
    ISG.depo.al().planlar.filter((p) => p.isyeriId === 'iy1').length === iy1PlanOnce,
    JSON.stringify(bosSilme));

  /* Kurumlardan gelen plan dosyalarının biçimi (ASKİ-1 2026 dosyası bu kalıba
     birebir uyuyor): sayfa tekrarında Sorumlu sütunu kayıyor, ay işaretleri küçük
     "x", olay tabanlı satırların ayları boş, bazı satırlarda sıra no yok, her
     sayfada tablo başlığı + ay numarası satırı tekrar ediyor, imza alanı var. */
  const planKurumSatirlari = [
    ['AYDIN BÜYÜKŞEHİR BELEDİYESİ PERSONEL A.Ş. İŞ SAĞLIĞI VE GÜVENLİĞİ YILLIK ÇALIŞMA ' +
      'PROGRAMI ( ' + PLAN_YILI + ' YILI )', '', '', '', '', '', '', '', '', '', 'Doküman No', 'İSG.YÇP'],
    ['Bu doküman işyeri için hazırlanmış olup sunulacak İSG çalışmalarının planlandığı ' +
      'zamanlar belirtilmiştir.'],
    ['SIRA NO', 'ÇALIŞMA KONUSU', '', '', '', '', 'SORUMLU', '', 'AÇIKLAMA', '', '', 'AYLAR'],
    ['', '', '', '', '', '', '', '', '', '', '', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    ['1', 'İş Sağlığı ve Güvenliği (İSG) Kurulu'],
    ['1.1', 'İSG Kurul Ekipleri ve Atamaları', '', '', '', '', 'İşveren/Vekili', '',
      'Kurul ekip üyelerinde herhangi bir değişiklik olması halinde'],
    ['1.2', 'İSG Kurul Toplantılarının Yapılması', '', '', '', '', 'İşveren/Vekili', '',
      'Olağanüstü durumlar harici ayda bir', '', '',
      'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'],
    ['', 'İşe başlama eğitimi', '', '', '', '', 'İGU, İH', '', 'Yeni işe başlayan personele', '', '',
      'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['HAZIRLAYANLAR', '', '', '', '', '', '', '', '', '', '', 'ONAYLAYAN'],
    ['A Sınıfı İş Güvenliği Uzmanı Barış TAŞDEMİR SERTİFİKA NO: İGU-108780'],
    ['SIRA NO', 'ÇALIŞMA KONUSU', '', '', '', '', '', 'SORUMLU', 'AÇIKLAMA', '', '', 'AYLAR'],
    ['', '', '', '', '', '', '', '', '', '', '', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    ['6.12', 'Makine Cihaz Ekipman Kayıt Listeleri', '', '', '', '', '', 'İşveren/Vekili',
      'Yılda bir kez', '', '', 'X', 'X'],
    ['6.13', 'Kimyasal Güvenlik Bilgi Formları', '', '', '', '', '', 'Birim Sorumluları',
      'Yeni kimyasal alındığında']
  ];
  const kurumA = Plan.analizEt(planKurumSatirlari, { isyeriId: 'iy5', yil: 0, mevcut: [] });
  kontrol('Kurum dosyası biçimi: yıl bulundu, bölüm/ay başlığı/imza satırları ayıklandı',
    kurumA.yil === PLAN_YILI && kurumA.ozet.bolum === 1 && kurumA.ozet.baslik === 3 &&
    kurumA.ozet.imza === 2 && kurumA.ozet.hazir === 5 && kurumA.ozet.hatali === 0 &&
    kurumA.ozet.ayIsaret === 26, JSON.stringify(kurumA.ozet));
  const kurumKayitlari = Plan.uygulanacaklar(kurumA);
  const kurumTamYil = kurumKayitlari.filter((k) => /^İSG Kurul Toplantıları/.test(k.faaliyet))[0] || {};
  const kurumKucukX = kurumKayitlari.filter((k) => k.faaliyet === 'İşe başlama eğitimi')[0] || {};
  const kurumOlay = kurumKayitlari.filter((k) => /^İSG Kurul Ekipleri/.test(k.faaliyet))[0] || {};
  const kurumKaymis = kurumKayitlari.filter((k) => k.siraExcel === '6.12')[0] || {};
  kontrol('On iki aylık faaliyetin bütün ayları korundu',
    JSON.stringify(kurumTamYil.aylar) === '[1,2,3,4,5,6,7,8,9,10,11,12]',
    JSON.stringify(kurumTamYil.aylar));
  kontrol('Küçük "x" işareti de planlanmış sayılıyor, sıra nosuz faaliyet kaydediliyor',
    kurumKucukX.aylar && kurumKucukX.aylar.length === 12 && kurumKucukX.siraExcel === '',
    JSON.stringify(kurumKucukX.aylar));
  kontrol('Ay işaretlenmeyen faaliyet uyarıyla ve ay bilgisi olmadan kaydediliyor',
    !!kurumOlay.faaliyet && (kurumOlay.aylar || []).length === 0 &&
    /Hiçbir ay işaretlenmedi/.test(JSON.stringify(kurumA.satirlar)),
    JSON.stringify(kurumOlay.aylar));
  kontrol('Sayfa tekrarında kayan Sorumlu sütunu doğru okunuyor',
    kurumKaymis.sorumlu === 'İşveren/Vekili' && JSON.stringify(kurumKaymis.aylar) === '[1,2]' &&
    kurumKaymis.anaBaslik === 'İş Sağlığı ve Güvenliği (İSG) Kurulu',
    JSON.stringify([kurumKaymis.sorumlu, kurumKaymis.aylar, kurumKaymis.anaBaslik]));

  /* İş yeri izolasyonu: toplu yazım ve yıl bazlı silme yalnızca hedef iş yerini
     ve hedef yılı etkiler; diğer koleksiyonlar ile eşitleme damgaları korunur. */
  const planDisi = (veri) => JSON.stringify((veri.planlar || []).filter((p) => p.isyeriId !== 'iy5')
    .slice().sort((a, b) => String(a.id).localeCompare(String(b.id))));
  const koleksiyonlar = (veri) => JSON.stringify(Object.keys(veri)
    .filter((k) => k !== 'planlar' && k !== 'denetim' && k !== 'senkron').sort()
    .map((k) => [k, veri[k]]));
  const depoOnce = ISG.depo.al();
  const planDisiOnce = planDisi(depoOnce);
  const koleksiyonlarOnce = koleksiyonlar(depoOnce);
  const damgaOnce = JSON.parse(JSON.stringify((depoOnce.senkron || {}).kayit || {}));
  const planYazim = Plan.uygula(kurumA, {
    isyeriId: 'iy5', yil: PLAN_YILI,
    mevcut: ISG.depo.al().planlar.filter((p) => p.isyeriId === 'iy5')
  });
  const hedefKayitlar = ISG.depo.al().planlar.filter((p) => p.isyeriId === 'iy5' && p.yil === PLAN_YILI);
  kontrol('Toplu yazım yalnızca hedef iş yerine ve hedef yıla gidiyor',
    planYazim.eklenen === 5 && hedefKayitlar.length === 5 &&
    hedefKayitlar.every((p) => p.isyeriId === 'iy5' && Number(p.yil) === PLAN_YILI),
    planYazim.eklenen + ' kayıt · ' + hedefKayitlar.length + ' hedef kayıt');
  kontrol('Yazımda diğer iş yerlerinin planları bayt bayt aynı',
    planDisiOnce === planDisi(ISG.depo.al()));
  kontrol('Yazımda diğer koleksiyonlar bayt bayt aynı',
    koleksiyonlarOnce === koleksiyonlar(ISG.depo.al()));
  const damgaSon = (ISG.depo.al().senkron || {}).kayit || {};
  const yeniDamga = Object.keys(damgaSon).filter((kod) => typeof damgaOnce[kod] === 'undefined');
  const planDamga = yeniDamga.filter((kod) => kod.indexOf('planlar|') === 0);
  const denetimDamga = yeniDamga.filter((kod) => kod.indexOf('denetim|') === 0);
  kontrol('Eşitleme damgaları yalnızca yeni plan kayıtları ve denetim izi için eklendi',
    planDamga.length === 5 && planDamga.length + denetimDamga.length === yeniDamga.length &&
    Object.keys(damgaOnce).every((kod) => String(damgaSon[kod]) === String(damgaOnce[kod])),
    yeniDamga.join(','));
  kontrol('Aynı dosya tekrar yüklendiğinde mükerrer denetimi kayıt eklemiyor',
    (function () {
      const tekrar = Plan.analizEt(planKurumSatirlari, {
        isyeriId: 'iy5', yil: PLAN_YILI,
        mevcut: ISG.depo.al().planlar.filter((p) => p.isyeriId === 'iy5')
      });
      const ikinci = Plan.uygula(tekrar, { isyeriId: 'iy5', yil: PLAN_YILI });
      return ikinci.eklenen === 0 && ikinci.mukerrer === 5 &&
        ISG.depo.al().planlar.filter((p) => p.isyeriId === 'iy5' && p.yil === PLAN_YILI).length === 5;
    })());
  const baskaIsYeriOnce = planDisi(ISG.depo.al());
  const yilSilme = ISG.depo.planTopluSil({ isyeriId: 'iy5', yil: PLAN_YILI });
  kontrol('Yıl bazlı toplu silme yalnızca hedef iş yeri ve yılı siliyor',
    yilSilme.silinen === 5 &&
    ISG.depo.al().planlar.filter((p) => p.isyeriId === 'iy5' && p.yil === PLAN_YILI).length === 0 &&
    baskaIsYeriOnce === planDisi(ISG.depo.al()),
    'silinen ' + yilSilme.silinen + ' · kalan ' + yilSilme.kalan);

  /* Test kayıtları geri alınır; sonraki bölümler demo verisiyle devam eder. */
  ISG.depo.al().planlar.filter((p) => p.yil === 2032 || p.yil === PLAN_YILI)
    .forEach((p) => ISG.depo.planSil(p.id));
  ISG.ui.kapsam = '';
  ISG.ui.planYili = 'tumu';
  ISG.ui.planSecim = {};
  ISG.uygulama.ciz();
  await bekle(150);
  kontrol('Plan test kayıtları temizlendi, sayılar geri döndü',
    ISG.depo.al().planlar.length === planOnce, String(ISG.depo.al().planlar.length));









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

  console.log('\n14) Kullanıcılar ve yetkiler');
  await sayfaAc('#ekip');
  kontrol('Ekip sayfası kullanıcı yönetimine dönüştü',
    metin('.sayfa-baslik h1') === 'Kullanıcılar ve yetkiler', metin('.sayfa-baslik h1'));
  kontrol('Kayıtlı kullanıcılar listeleniyor',
    doc.querySelectorAll('.kullanici-satir').length === ISG.depo.al().kullanicilar.length &&
    doc.querySelectorAll('.kullanici-satir').length > 0,
    doc.querySelectorAll('.kullanici-satir').length + ' / ' + ISG.depo.al().kullanicilar.length);
  kontrol('Yönetici kendi hesabını listede görür', /mehmetkurt0948@gmail\.com/.test(metin('#gorunum')));

  kontrol('Davet altyapısı arayüzde yok',
    doc.getElementById('davetEposta') === null && doc.querySelector('[data-islem="davet-gonder"]') === null &&
    doc.querySelector('.davet-isyeri') === null);

  const kullaniciDugmeleri = doc.querySelectorAll('[data-islem="kullanici-yeni"]');
  kontrol('Yeni kullanıcı düğmesi tek', kullaniciDugmeleri.length === 1, String(kullaniciDugmeleri.length));
  kullaniciDugmeleri[0].click();
  await bekle(120);
  kontrol('Kullanıcı diyaloğu açıldı', doc.getElementById('kullaniciDiyalog').open === true);
  const kullaniciForm = doc.getElementById('kullaniciForm');
  const yetkiKutulari = Array.from(doc.querySelectorAll('#kullaniciIsyerleri .kullanici-isyeri'));
  kontrol('İşyeri yetki kutuları dolduruldu', yetkiKutulari.length > 1, String(yetkiKutulari.length));
  /* Yetki listesi hizası: kutular liste kutusunun (.secim-listesi) içinde,
     etiketler tek tip satır; eski `satir-secenek` sınıfı kalmadı. */
  const yetkiListe = doc.getElementById('kullaniciIsyerleri');
  kontrol('Yetki listesi secim-listesi kabında', !!yetkiListe && yetkiListe.classList.contains('secim-listesi'),
    yetkiListe ? yetkiListe.className : 'yok');
  kontrol('Yetki satırlarında eski hizasız sınıf yok', doc.querySelectorAll('#kullaniciIsyerleri .satir-secenek').length === 0,
    String(doc.querySelectorAll('#kullaniciIsyerleri .satir-secenek').length));
  kontrol('Her yetki kutusu kendi etiketi içinde',
    yetkiKutulari.every((kutu) => kutu.closest('label') === kutu.parentElement &&
      !!kutu.parentElement.querySelector('strong')));
  kontrol('Yetki etiketleri ad + açıklama taşıyor',
    yetkiKutulari.every((kutu) => !!kutu.parentElement.querySelector('span > strong')));
  /* Kurum ve uzman sınıfı onay yetkisinin girdisidir; form bunları yazmalı. */
  const kurumSecimi = kullaniciForm.elements.kurumId;
  kontrol('Kurum seçeneği forma bağlandı', !!kurumSecimi && kurumSecimi.options.length > 1,
    kurumSecimi ? String(kurumSecimi.options.length) : 'yok');
  kontrol('Uzman sınıfı alanı formda', !!kullaniciForm.elements.uzmanSinifi);
  kullaniciForm.elements.adSoyad.value = 'Regresyon Kullanıcısı';
  kullaniciForm.elements.eposta.value = 'regresyon.kullanicisi@ornek.com';
  kullaniciForm.elements.rol.value = 'yetkili';
  kullaniciForm.elements.sifre.value = '1234';
  if (kullaniciForm.elements.uzmanSinifi) { kullaniciForm.elements.uzmanSinifi.value = 'B'; }
  const seciliKurumId = (ISG.depo.al().kurumlar[0] || {}).id || '';
  if (kurumSecimi && seciliKurumId) { kurumSecimi.value = seciliKurumId; }
  const hedefKutu = yetkiKutulari.filter((kutu) => kutu.value !== '__tumu')[0];
  kontrol('Kapsam için işyeri kutusu bulundu', !!hedefKutu, String(hedefKutu && hedefKutu.value));
  hedefKutu.checked = true;
  kullaniciForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await bekle(180);
  const eklenenKullanici = ISG.depo.kullaniciEpostaBul('regresyon.kullanicisi@ornek.com');
  kontrol('Kullanıcı eklendi', !!eklenenKullanici && eklenenKullanici.rol === 'yetkili',
    JSON.stringify(eklenenKullanici && eklenenKullanici.eposta));
  kontrol('Tek işyeri kapsamı yazıldı', !!eklenenKullanici && eklenenKullanici.isyerleri.length === 1,
    JSON.stringify(eklenenKullanici && eklenenKullanici.isyerleri));
  kontrol('Uzman sınıfı kayda yazıldı', !!eklenenKullanici && eklenenKullanici.uzmanSinifi === 'B',
    eklenenKullanici && eklenenKullanici.uzmanSinifi);
  kontrol('Kurum bağı kayda yazıldı', !!eklenenKullanici && eklenenKullanici.kurumId === seciliKurumId,
    eklenenKullanici && eklenenKullanici.kurumId);
  kontrol('Yeni kullanıcı listelendi', /regresyon\.kullanicisi@ornek\.com/.test(metin('#gorunum')));
  kontrol('Kullanıcı diyaloğu kayıt sonrası kapandı', doc.getElementById('kullaniciDiyalog').open === false);

  const kullaniciSilDugmesi = doc.querySelector('[data-islem="kullanici-sil"][data-id="' +
    (eklenenKullanici ? eklenenKullanici.id : 'yok') + '"]');
  kontrol('Kişiye özel silme düğmesi var', !!kullaniciSilDugmesi);
  if (kullaniciSilDugmesi) {
    kullaniciSilDugmesi.click();
    await bekle(120);
    kontrol('Kullanıcı silme onay istiyor', doc.getElementById('onayDiyalog').open === true);
    doc.getElementById('onayEvet').click();
    await bekle(200);
    kontrol('Kullanıcı silindi', !ISG.depo.kullaniciEpostaBul('regresyon.kullanicisi@ornek.com'));
  }
  await sayfaAc('#panel');

  console.log('\n15) Mevzuat ve kapsam');
  await sayfaAc('#mevzuat');
  kontrol('20 mevzuat başlığı', doc.querySelectorAll('.mevzuat-satir').length === 20, String(doc.querySelectorAll('.mevzuat-satir').length));
  kontrol('Her başlıkta kapsam satırı var', doc.querySelectorAll('.mevzuat-satir small.mevzuat-kapsam').length === 20,
    String(doc.querySelectorAll('.mevzuat-satir small.mevzuat-kapsam').length));
  kontrol('Kapsam metni kimlerin kapsamda olduğunu yazıyor',
    /Kapsam:/.test(metin('#gorunum')) && /kapsam dışıdır/.test(metin('#gorunum')));
  kontrol('Katalog başlıkları kapsam/dayanak alanlarını taşıyor',
    ISG.MEVZUAT_KATALOGU().length === 20 &&
    ISG.MEVZUAT_KATALOGU().every((m) => !!m.id && !!m.baslik && !!m.dayanak && !!m.kapsam && !!m.ozet));
  kontrol('Dış bağlantı güvenli', (doc.querySelector('.link-dis') || {}).rel === 'noopener noreferrer');
  ISG.ui.mevzuatArama = 'gürültü';
  ISG.uygulama.ciz();
  await bekle(80);
  kontrol('Mevzuat araması filtreliyor', doc.querySelectorAll('.mevzuat-satir').length === 1, String(doc.querySelectorAll('.mevzuat-satir').length));
  ISG.ui.mevzuatArama = 'kapsam dışıdır';
  ISG.uygulama.ciz();
  await bekle(80);
  kontrol('Arama kapsam metninde de çalışıyor', doc.querySelectorAll('.mevzuat-satir').length === 1,
    String(doc.querySelectorAll('.mevzuat-satir').length));
  ISG.ui.mevzuatArama = '';
  ISG.ui.mevzuatKategori = 'Standart';
  ISG.uygulama.ciz();
  await bekle(80);
  kontrol('Kategori filtresi çalışıyor', doc.querySelectorAll('.mevzuat-satir').length === 1,
    String(doc.querySelectorAll('.mevzuat-satir').length));
  ISG.ui.mevzuatArama = '';
  ISG.ui.mevzuatKategori = '';

  /* Yerleşik katalog: cihazda kayıtlı başlık yokken liste boş kalmamalı.
     Katalog okunur ama veriye yazılmaz (kayıt sayılmaz). */
  const kayitliMevzuat = ISG.depo.al().mevzuat;
  kayitliMevzuat.length = 0;
  ISG.uygulama.ciz();
  await bekle(100);
  kontrol('Kayıt yokken yerleşik katalog gösterilir', doc.querySelectorAll('.mevzuat-satir').length === 20,
    String(doc.querySelectorAll('.mevzuat-satir').length));
  kontrol('Yerleşik katalog bilgisi görünür', /Yerleşik mevzuat kataloğu/.test(metin('#gorunum')), metin('#gorunum').slice(0, 80));
  kontrol('Yerleşik katalog mevzuat sayacını da dolduruyor', /20 başlıkta kapsam/.test(metin('#gorunum')),
    (metin('#gorunum').match(/\d+ başlıkta kapsam/) || [''])[0]);
  const bosKatalogYazildi = ISG.depo.al().mevzuat.length;
  kontrol('Katalog veriye yazılmıyor', bosKatalogYazildi === 0, String(bosKatalogYazildi));
  await demoYukle();
  await sayfaAc('#mevzuat');
  kontrol('Demo yüklendikten sonra kayıtlı 20 başlık görünür', doc.querySelectorAll('.mevzuat-satir').length === 20,
    String(doc.querySelectorAll('.mevzuat-satir').length));
  kontrol('Kayıtlı başlıkta yerleşik katalog uyarısı yok', !/Yerleşik mevzuat kataloğu/.test(metin('#gorunum')));

  console.log('\n16) Menü, rozetler ve yapı');
  await sayfaAc('#panel');
  kontrol('Menüde 15 sayfa var', doc.querySelectorAll('.menu-oge[data-sayfa]').length === 15, String(doc.querySelectorAll('.menu-oge[data-sayfa]').length));
  kontrol('Sağlık takibi menüde', doc.querySelectorAll('.menu-oge[data-sayfa="saglik"]').length === 1);
  kontrol('İstatistik menüde', doc.querySelectorAll('.menu-oge[data-sayfa="istatistik"]').length === 1);
  kontrol('Onay kuyruğu menüde', doc.querySelectorAll('.menu-oge[data-sayfa="onaylar"]').length === 1);
  kontrol('Kurum panosu menüde', doc.querySelectorAll('.menu-oge[data-sayfa="kurum"]').length === 1);
  kontrol('Kurum panosu yöneticide görünür', doc.getElementById('menuKurum').hidden === false);
  kontrol('Dosya rozeti görünür', doc.getElementById('rozetDosya').hidden === false);
  kontrol('Saha rozeti sayı gösterir', /^\d+$/.test(doc.getElementById('rozetSaha').textContent));
  const idler = Array.from(doc.querySelectorAll('[id]')).map((e) => e.id);
  const tekrar = idler.filter((id, i) => idler.indexOf(id) !== i);
  kontrol('Tekrarlanan id yok', tekrar.length === 0, tekrar.slice(0, 5).join(', '));
  const kullanimlar = Array.from(doc.querySelectorAll('use[href]')).map((u) => u.getAttribute('href'));
  const eksikIkon = kullanimlar.filter((h) => !doc.querySelector(h));
  kontrol('SVG ikon referansları geçerli', eksikIkon.length === 0, eksikIkon.slice(0, 3).join(', '));
  kontrol('Diyalog sayısı 20', doc.querySelectorAll('dialog').length === 20, String(doc.querySelectorAll('dialog').length));
  kontrol('Sağlık içe aktarma diyaloğu var', !!doc.getElementById('saglikTopluDiyalog'));
  kontrol('Hazır kontrol listesi diyaloğu var', !!doc.getElementById('listeDiyalog'));
  kontrol('Hazır listeyi silme diyaloğu var', !!doc.getElementById('listeGeriAlDiyalog'));
  kontrol('Toplu personel yükleme diyaloğu var', !!doc.getElementById('personelTopluDiyalog'));
  kontrol('Plan toplu yükleme ve toplu silme diyalogları var',
    !!doc.getElementById('planTopluDiyalog') && !!doc.getElementById('planTopluSilDiyalog'));

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

  /* Kayıtlar arayüz düğmesiyle değil, yedekten (iceAktar) geri gelir. */
  kontrol('Örnek veri düğmesi sıfırlama sonrası da yok',
    doc.getElementById('ornekVeriDugme') === null && doc.querySelector('[data-islem="ornek-veri"]') === null);
  const geriDemo = await demoYukle();
  kontrol('Yedekten yükleme kayıtları geri getirdi',
    ISG.depo.al().isyerleri.length === 6 && ISG.depo.al().personel.length === 37,
    ISG.depo.al().isyerleri.length + ' işyeri / ' + geriDemo.personel.length + ' personel');
  await sayfaAc('#isyerleri');
  kontrol('Geri yükleme sonrası kurum adı geldi', /Aydın Büyükşehir/.test(metin('.kurum-serit')),
    metin('.kurum-serit'));
  /* Ekran dolaşımı boş veriyle yapılacak: öncesinde yine boşlanıyor. */
  ISG.depo.sifirla();
  ISG.uygulama.ciz();
  await bekle(120);
  kontrol('İkinci sıfırlama da boş veri veriyor', ISG.depo.al().isyerleri.length === 0);

  console.log('\n18) Tüm ekranlarda metin ve ikon temizliği (boş veriyle)');
  const tumSayfalar = ['panel', 'isyerleri', 'personel', 'dosyalar', 'plan', 'saha', 'rapor', 'istatistik', 'risk', 'acil', 'ekip', 'onaylar', 'mevzuat', 'saglik'];
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

  /* Bölüm 18 boş veriyle koşuldu; sonraki bölümler demo veriyi kullanır. */
  await demoYukle();
  kontrol('Sonraki bölümler için demo veri geri yüklendi',
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

  console.log('\n22) Dosya kontrolü güncellemesi işyeri bağını ve listeyi korur');
  if (ISG.bulut.hazirMi()) { ISG.bulut.kapat(); }
  await sayfaAc('#dosyalar');
  const duzenleDugmesi = doc.querySelector('[data-islem="dosya-duzenle"]');
  kontrol('Düzenlenecek kontrol maddesi bulundu', !!duzenleDugmesi);
  const dosyaKimlik = duzenleDugmesi.getAttribute('data-id');
  const dosyaOnce = JSON.parse(JSON.stringify(
    ISG.depo.al().dosyalar.filter((d) => d.id === dosyaKimlik)[0] || {}));
  duzenleDugmesi.click();
  await bekle(90);
  const dosyaFormEl = doc.getElementById('dosyaForm');
  kontrol('Düzenleme formu kaydın işyerini seçili getirir',
    dosyaFormEl.elements.isyeriId.value === dosyaOnce.isyeriId,
    dosyaFormEl.elements.isyeriId.value + ' / ' + dosyaOnce.isyeriId);
  dosyaFormEl.elements.durum.value = 'var';
  dosyaFormEl.elements.aciklama.value = 'Kısmi güncelleme testi';
  dosyaFormEl.elements.kontrolTarihi.value = '2026-03-01';
  dosyaFormEl.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await bekle(140);
  const dosyaSonra = ISG.depo.al().dosyalar.filter((d) => d.id === dosyaKimlik)[0] || {};
  kontrol('Güncelleme sonrası kayıt aynı işyerinde kalır',
    dosyaSonra.isyeriId === dosyaOnce.isyeriId, dosyaSonra.isyeriId + ' / ' + dosyaOnce.isyeriId);
  kontrol('Hazır liste kaynağı (sablon) korunur',
    (dosyaSonra.sablon || '') === (dosyaOnce.sablon || ''), String(dosyaSonra.sablon));
  kontrol('Sıra numarası (no) değişmez', Number(dosyaSonra.no) === Number(dosyaOnce.no),
    dosyaSonra.no + ' / ' + dosyaOnce.no);
  kontrol('İstenen alanlar güncellendi',
    dosyaSonra.durum === 'var' && dosyaSonra.aciklama === 'Kısmi güncelleme testi');
  kontrol('Kütükte tek kayıt kaldı (mükerrer yok)',
    ISG.depo.al().dosyalar.filter((d) => d.id === dosyaKimlik).length === 1);
  const bosIsyeri = ISG.depo.dosyaKaydet({
    id: dosyaKimlik, isyeriId: '', aciklama: 'Boş işyeri gönderimi'
  });
  kontrol('Boş işyeri gönderimi bağı koparmaz',
    (bosIsyeri || {}).isyeriId === dosyaOnce.isyeriId, String((bosIsyeri || {}).isyeriId));
  const kaliciDosya = (JSON.parse(window.localStorage.getItem('isgtakip.v4') || '{}').dosyalar || [])
    .filter((d) => d.id === dosyaKimlik)[0] || {};
  kontrol('Güncelleme diske de doğru yazıldı', kaliciDosya.isyeriId === dosyaOnce.isyeriId);

  console.log('\n23) Çoklu personel: acil durum ve risk ekipleri');
  const acilOncesi = JSON.parse(JSON.stringify(ISG.ilgiliKayit(ISG.depo.al(), 'acilPlanlar', 'iy3') || {}));
  ISG.depo.acilEkipEkle('iy3', 'İlk yardım ekibi', 'Birinci Kişi', '', { belgeNo: 'B-1', gecerlilik: '2027-01-01' });
  ISG.depo.acilEkipEkle('iy3', 'İlk yardım ekibi', 'İkinci Kişi', '');
  const acil3 = ISG.ilgiliKayit(ISG.depo.al(), 'acilPlanlar', 'iy3');
  const ilkYardim = ISG.depo.acilEkipUyeleri(acil3, 'İlk yardım ekibi');
  kontrol('Aynı göreve iki personel ayrı kayıt olarak eklenir', ilkYardim.length === 2,
    String(ilkYardim.length));
  kontrol('Personel belge bilgisiyle birlikte saklanır',
    ilkYardim.some((u) => u.ad === 'Birinci Kişi' && u.belgeNo === 'B-1' && u.gecerlilik === '2027-01-01'));
  kontrol('Her personelin benzersiz kimliği var',
    ilkYardim.every((u) => !!u.id) && ilkYardim[0].id !== ilkYardim[1].id);
  ISG.depo.acilEkipEkle('iy3', 'İlk yardım ekibi', 'İkinci Kişi', '');
  kontrol('Aynı personel aynı göreve ikinci kez eklenmez',
    ISG.depo.acilEkipUyeleri(ISG.ilgiliKayit(ISG.depo.al(), 'acilPlanlar', 'iy3'), 'İlk yardım ekibi').length === 2);
  const tekUye = ilkYardim[0];
  ISG.depo.acilEkipSil('iy3', 'İlk yardım ekibi', { id: tekUye.id, ad: tekUye.ad });
  const kalanIlkYardim = ISG.depo.acilEkipUyeleri(ISG.ilgiliKayit(ISG.depo.al(), 'acilPlanlar', 'iy3'), 'İlk yardım ekibi');
  kontrol('Tek personel kaldırılırken diğeri korunur',
    kalanIlkYardim.length === 1 && kalanIlkYardim[0].ad !== tekUye.ad,
    kalanIlkYardim.map((u) => u.ad).join(', '));
  kontrol('Eski acil ekip kayıtları korunur',
    (ISG.ilgiliKayit(ISG.depo.al(), 'acilPlanlar', 'iy3').ekip || [])
      .filter((u) => (acilOncesi.ekip || []).some((e) => e.rol === u.rol && e.ad === u.ad)).length ===
      (acilOncesi.ekip || []).length,
    'önce ' + (acilOncesi.ekip || []).length + ' üye');

  ISG.depo.riskEkipUyeEkle('iy3', 'uzman', 'Uzman Bir', '');
  ISG.depo.riskEkipUyeEkle('iy3', 'uzman', 'Uzman İki', '', { belgeSinifi: 'A' });
  const risk3 = ISG.ilgiliKayit(ISG.depo.al(), 'riskEkipleri', 'iy3');
  kontrol('Risk ekibinde rol başına çoklu üye tutulur',
    ISG.depo.riskEkipUyeleri(risk3, 'uzman').length === 2,
    String(ISG.depo.riskEkipUyeleri(risk3, 'uzman').length));
  kontrol('Eski tek kişilik alan da dolu kalır (geriye dönük uyum)', risk3.uyeler.uzman === 'Uzman İki',
    String(risk3.uyeler.uzman));
  kontrol('Risk ekibi özeti rolü dolu sayar',
    ISG.riskEkipOzeti(risk3).eksik === ISG.RISK_ROLLERI.length - 1,
    String(ISG.riskEkipOzeti(risk3).eksik));

  /* Arayüzde çoklu personel satırlarını görebilmek için ikinci kişi eklenir. */
  ISG.depo.acilEkipEkle('iy3', 'İlk yardım ekibi', 'Üçüncü Kişi', '');

  await sayfaAc('#acil');
  kontrol('Çoklu personel ayrı satırlarda listelenir', doc.querySelectorAll('.rol-uye').length >= 2,
    String(doc.querySelectorAll('.rol-uye').length));
  kontrol('Kişi başına düzenle/kaldır düğmeleri var',
    doc.querySelectorAll('[data-islem="ekip-uye-duzenle"]').length >= 2 &&
    doc.querySelectorAll('[data-islem="ekip-uye-sil"][data-uye]').length >= 2);
  const acilKalici = (JSON.parse(window.localStorage.getItem('isgtakip.v4') || '{}').acilPlanlar || [])
    .filter((k) => k.isyeriId === 'iy3')[0] || {};
  kontrol('Çoklu personel diske yazıldı (yenilemede korunur)',
    (acilKalici.ekip || []).filter((u) => u.rol === 'İlk yardım ekibi').length === 2,
    String((acilKalici.ekip || []).filter((u) => u.rol === 'İlk yardım ekibi').length));

  /* Düzen bozulması regresyonu: çoklu grupta rol satırı isim listesini tekrar
     etmemeli (etiket sıkışıp dikey kırıntıya dönüşüyordu), kişi sayısı yazmalı. */
  const cokluAcilSatir = Array.from(doc.querySelectorAll('.risk-kart .rol-satir'))
    .filter((satir) => {
      const ozet = satir.querySelector('b');
      return ozet && /^\d+ kişi$/.test(ozet.textContent.trim());
    })[0];
  kontrol('Çoklu grupta rol satırı kişi sayısı gösterir',
    !!cokluAcilSatir && !/Üçüncü Kişi/.test(cokluAcilSatir.textContent),
    cokluAcilSatir ? cokluAcilSatir.textContent.trim() : 'yok');
  kontrol('Rol satırında isim listesi tekrar etmez',
    Array.from(doc.querySelectorAll('.risk-kart .rol-satir')).every((satir) => {
      const ozet = satir.querySelector('b');
      return !ozet || ozet.textContent.indexOf(', ') === -1;
    }));
  const rolEtiketiTam = Array.from(doc.querySelectorAll('.risk-kart .rol-satir .rol-ad'))
    .filter((etiket) => etiket.textContent.trim() === 'İş güvenliği uzmanı')[0];
  kontrol('Rol etiketi tek parça ve tam yazılır', !!rolEtiketiTam,
    rolEtiketiTam ? rolEtiketiTam.textContent.trim() : 'yok');

  await sayfaAc('#risk');
  kontrol('Kişi alt satırında belge sınıfı etiketli görünür', /Belge sınıfı: A/.test(metin('#gorunum')),
    metin('#gorunum').match(/Belge sınıfı: A/) ? 'Belge sınıfı: A' : 'yok');

  console.log('\n24) Onay mekanizması: sürüm, kendini onaylama, çift uygulama');
  const hedefKisi = ISG.depo.al().personel.filter((p) => p.isyeriId === 'iy1')[0];
  kontrol('Test için iy1 personeli bulundu', !!hedefKisi);
  await cikisYap();
  await girisAcVeYap('buse.senol@ornek.com', '1234');
  const guncellemeSonucu = ISG.depo.personelKaydet(Object.assign({}, hedefKisi, { meslek: 'Yetkili meslek' }));
  kontrol('Yetkili güncellemesi talebe dönüşür', !!(guncellemeSonucu && guncellemeSonucu.bekliyor));
  const guncellemeTalebi = (guncellemeSonucu || {}).talep || {};
  kontrol('Talep modül ve kayıt kimliği taşır',
    guncellemeTalebi.modul === 'personel' && guncellemeTalebi.kayitId === hedefKisi.id &&
    guncellemeTalebi.islemTuru === 'guncelle',
    [guncellemeTalebi.modul, guncellemeTalebi.kayitId, guncellemeTalebi.islemTuru].join(' / '));
  kontrol('Talep eski ve yeni değerleri saklar',
    !!(guncellemeTalebi.eskiKayit && guncellemeTalebi.yeniKayit) &&
    guncellemeTalebi.yeniKayit.meslek === 'Yetkili meslek');
  kontrol('Kayıt doğrudan değişmedi',
    (ISG.depo.al().personel.filter((p) => p.id === hedefKisi.id)[0] || {}).meslek === hedefKisi.meslek);

  const silinecekDosya = ISG.depo.al().dosyalar.filter((d) => d.isyeriId === 'iy1')[0];
  const silmeSonucu = ISG.depo.dosyaSil(silinecekDosya.id);
  kontrol('Yetkili silmesi de talebe dönüşür', !!(silmeSonucu && silmeSonucu.bekliyor));
  const silmeTalebi = (silmeSonucu || {}).talep || {};
  kontrol('Silme talebi işlem türünü taşır', silmeTalebi.islemTuru === 'sil');
  kontrol('Silme onaylanmadan kayıt durur',
    ISG.depo.al().dosyalar.some((d) => d.id === silinecekDosya.id));

  await cikisYap();
  await girisAcVeYap('mehmetkurt0948@gmail.com', '1234');
  await sayfaAc('#onaylar');
  kontrol('Onay ekranı eski/yeni değerleri gösterir',
    doc.querySelectorAll('.onay-degisim').length > 0, String(doc.querySelectorAll('.onay-degisim').length));
  kontrol('Ret gerekçesi alanı var', doc.querySelectorAll('[data-talep-not]').length > 0);
  kontrol('Talep modül bilgisi satırda görünür', /Modül: Personel/.test(metin('#gorunum')));

  /* Talepten sonra kaydı başka bir kullanıcı değiştirdiyse onay ENGELLENMEZ:
     yönetici neyi onayladığını ekranda görür, istek her hâlükârda uygulanır.
     Üzerine yazılan değişiklik ise kaybolmaz: uyarı hem karar notuna hem denetim
     kaydına işlenir, böylece "kimin değeri ezildi" sonradan okunabilir. */
  ISG.depo.personelKaydet(Object.assign({}, ISG.depo.al().personel.filter((p) => p.id === hedefKisi.id)[0],
    { sicil: 'ADMIN-DEGISTI' }));
  const cakismaUyarisi = (function () {
    try { return String((ISG.yetki.talepOnayla(guncellemeTalebi.id, 'Test') || {}).uyari || ''); }
    catch (hata) { return 'ONAY ENGELLENDI: ' + hata.message; }
  })();
  kontrol('Sürüm çakışması uyarı üretir, onayı engellemez',
    /değişmiş/.test(cakismaUyarisi) && /yine de uygulandı/.test(cakismaUyarisi),
    cakismaUyarisi.slice(0, 90));
  kontrol('Çakışan talep uyarıyla kapatılır',
    (ISG.depo.talepBul(guncellemeTalebi.id) || {}).durum === 'onaylandi',
    String((ISG.depo.talepBul(guncellemeTalebi.id) || {}).durum));
  kontrol('Çakışma karar notuna işlendi',
    /UYARI:/.test(String((ISG.depo.talepBul(guncellemeTalebi.id) || {}).kararNotu || '')),
    String((ISG.depo.talepBul(guncellemeTalebi.id) || {}).kararNotu || 'not yok').slice(0, 90));
  kontrol('Çakışma denetim kaydına yazıldı',
    (ISG.depo.al().denetim || []).some((kayit) => kayit.kayitId === hedefKisi.id &&
      /UYARI:/.test(String(kayit.ozet || ''))));
  kontrol('Talepteki değer yazılır, yöneticinin alanı uyarıyla ezilir',
    (ISG.depo.al().personel.filter((p) => p.id === hedefKisi.id)[0] || {}).meslek === 'Yetkili meslek' &&
    (ISG.depo.al().personel.filter((p) => p.id === hedefKisi.id)[0] || {}).sicil !== 'ADMIN-DEGISTI',
    (ISG.depo.al().personel.filter((p) => p.id === hedefKisi.id)[0] || {}).sicil);

  /* Kendi talebini onaylama denemesi reddedilir. */
  const yoneticiOturum = ISG.yetki.oturum();
  const kendiTalep = ISG.depo.talepKaydet({
    kullaniciId: yoneticiOturum.kullaniciId, kullaniciAd: yoneticiOturum.adSoyad,
    isyeriId: 'iy1', modul: 'personel', kayitId: '', islemTuru: 'ekle',
    etiket: 'Kendi talebi', ozet: 'Kendi talebi', durum: 'bekliyor',
    eylem: { ad: 'personelKaydet', args: [{ adSoyad: 'Kendi Onayı', isyeriId: 'iy1' }] }
  });
  kontrol('Kendi talebini onaylayamaz', (function () {
    try { ISG.yetki.talepOnayla(kendiTalep.id, 'Test'); return false; }
    catch (hata) { return /Kendi oluşturduğunuz/.test(hata.message); }
  })());
  ISG.yetki.talepReddet(kendiTalep.id, 'Kendi talebi reddedildi');

  /* Silme talebi onaylanınca kayıt kalkar; ikinci onay reddedilir. */
  ISG.yetki.talepOnayla(silmeTalebi.id, 'Silme onaylandı');
  kontrol('Onaylanan silme kaydı kaldırdı',
    !ISG.depo.al().dosyalar.some((d) => d.id === silinecekDosya.id));
  kontrol('Aynı talep ikinci kez uygulanamaz', (function () {
    try { ISG.yetki.talepOnayla(silmeTalebi.id, 'Tekrar'); return false; }
    catch (hata) { return /zaten karara bağlanmış/.test(hata.message); }
  })());
  kontrol('Karar veren ve tarih kayda işlendi',
    !!(ISG.depo.talepBul(silmeTalebi.id) || {}).kararVerenId &&
    !!(ISG.depo.talepBul(silmeTalebi.id) || {}).kararTarihi);

  console.log('\n25) Çalışma planı: yıl/ay seçimi ve kısmi güncelleme');
  await sayfaAc('#plan');
  const planYilSec = doc.getElementById('planYili');
  const planAySec = doc.getElementById('planAy');
  kontrol('Plan yılı seçici var', !!planYilSec);
  kontrol('Plan ayı seçici var (12 ay + tümü)', !!planAySec && planAySec.options.length === 13,
    planAySec ? String(planAySec.options.length) : 'yok');
  doc.querySelector('[data-islem="plan-yeni"]').click();
  await bekle(90);
  const planFormEl = doc.getElementById('planForm');
  kontrol('Plan diyaloğu 12 aylık seçim sunar',
    planFormEl.querySelectorAll('input[name="aylar"]').length === 12,
    String(planFormEl.querySelectorAll('input[name="aylar"]').length));
  kontrol('Plan yılı alanı dolu gelir', !!planFormEl.elements.yil.value, planFormEl.elements.yil.value);
  planFormEl.elements.faaliyet.value = 'Aylık plan testi';
  planFormEl.elements.yil.value = '2027';
  planFormEl.querySelector('input[name="aylar"][value="3"]').checked = true;
  planFormEl.querySelector('input[name="aylar"][value="5"]').checked = true;
  planFormEl.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await bekle(140);
  const yeniPlan = ISG.depo.al().planlar.filter((p) => p.faaliyet === 'Aylık plan testi')[0] || {};
  kontrol('Seçilen aylar kayda yazıldı', JSON.stringify(yeniPlan.aylar) === '[3,5]',
    JSON.stringify(yeniPlan.aylar));
  kontrol('Plan yılı kayda yazıldı', Number(yeniPlan.yil) === 2027, String(yeniPlan.yil));

  /* Ay filtresi: yalnızca seçilen ayı içeren kayıtlar listelenir. */
  doc.getElementById('planAy').value = '3';
  doc.getElementById('planAy').dispatchEvent(new window.Event('change', { bubbles: true }));
  await bekle(140);
  kontrol('Ay filtresi listeyi daraltır',
    /Aylık plan testi/.test(metin('#planTablo')), metin('#planTablo').slice(0, 120));
  doc.getElementById('planAy').value = '4';
  doc.getElementById('planAy').dispatchEvent(new window.Event('change', { bubbles: true }));
  await bekle(140);
  kontrol('Boş ayda kayıt görünmez', !/Aylık plan testi/.test(metin('#planTablo')),
    metin('#planTablo').slice(0, 120));

  /* Düzenleme yılı ve ayları silmemeli (kısmi güncelleme). */
  ISG.depo.planKaydet({ id: yeniPlan.id, durum: 'tamamlandi' });
  const duzenlenen = ISG.depo.al().planlar.filter((p) => p.id === yeniPlan.id)[0] || {};
  kontrol('Plan düzenlemesi yıl ve ayları korur',
    Number(duzenlenen.yil) === 2027 && JSON.stringify(duzenlenen.aylar) === '[3,5]' &&
    duzenlenen.durum === 'tamamlandi',
    [duzenlenen.yil, JSON.stringify(duzenlenen.aylar), duzenlenen.durum].join(' / '));

  /* KVKK: kimlik numarası yardımcısı */
  kontrol('Kimlik numarası maskelenir',
    ISG.tcMaskele('12345678901') === '123******01', ISG.tcMaskele('12345678901'));
  kontrol('Yönetici tam kimlik numarasını görür',
    ISG.tcGoster('12345678901') === '12345678901');

  /* ---------- 26) Çalışma planı: on durumlu sözlük ---------- */
  console.log('\n26) Çalışma planı: on durumlu sözlük, göç ve satır içi durum menüsü');
  {
    const D = ISG.PLAN_DURUMLARI;
    const anahtarlar = Object.keys(D);
    kontrol('On durum tanimlidir', anahtarlar.length === 10, anahtarlar.join(','));
    kontrol('Dokuz durum secilebilir, Gecikti secilemez',
      ISG.PLAN_DURUM_SECIMLERI.length === 9 && D.gecikti.secilebilir === false &&
      ISG.PLAN_DURUM_SECIMLERI.every((id) => D[id].secilebilir === true));
    kontrol('Filtre listesi on durumu siralar (Gecikti basta)',
      ISG.PLAN_DURUM_FILTRELERI.length === 10 && ISG.PLAN_DURUM_FILTRELERI[0] === 'gecikti',
      ISG.PLAN_DURUM_FILTRELERI.join(','));
    kontrol('Goc: takvimde/planlandi/Gecikti/taninmasiz → yapilacak',
      ISG.planDurumNormal('takvimde') === 'yapilacak' && ISG.planDurumNormal('planlandi') === 'yapilacak' &&
      ISG.planDurumNormal('Gecikti') === 'yapilacak' && ISG.planDurumNormal('askida') === 'yapilacak' &&
      ISG.planDurumNormal('') === 'yapilacak');
    kontrol('Goc: bekliyor → belgeBekliyor', ISG.planDurumNormal('bekliyor') === 'belgeBekliyor');
    kontrol('Kapanmis durumlar: tamamlandi, iptal, kapsamDisi',
      ISG.planDurumKapanmis('tamamlandi') && ISG.planDurumKapanmis('iptal') &&
      ISG.planDurumKapanmis('kapsamDisi') && !ISG.planDurumKapanmis('devam') &&
      !ISG.planDurumKapanmis('ertelendi') && !ISG.planDurumKapanmis('tamamlanmadi'));

    const dun = new Date();
    dun.setDate(dun.getDate() - 4);
    const padIki = (n) => String(n).padStart(2, '0');
    const gecmisIso = dun.getFullYear() + '-' + padIki(dun.getMonth() + 1) + '-' + padIki(dun.getDate());
    const kapanmamis = ['yapilacak', 'devam', 'belgeBekliyor', 'ertelendi', 'tamamlanmadi'];
    kontrol('Kapanmamis bes durum gecmis tarihte Gecikti olur',
      kapanmamis.every((d) => ISG.planDurumu({ durum: d, takipTarihi: gecmisIso }).id === 'gecikti'),
      kapanmamis.map((d) => ISG.planDurumu({ durum: d, takipTarihi: gecmisIso }).id).join(','));
    kontrol('Kapanmis durumlar gecikmez',
      ISG.planDurumu({ durum: 'iptal', takipTarihi: gecmisIso }).id === 'iptal' &&
      ISG.planDurumu({ durum: 'kapsamDisi', takipTarihi: gecmisIso }).id === 'kapsamDisi' &&
      ISG.planDurumu({ durum: 'tamamlandi', takipTarihi: gecmisIso }).id === 'tamamlandi');
    kontrol('Satir renkleri: iptal/kapsamDisi soluk, geciken kirmizi',
      ISG.planDurumu({ durum: 'iptal', takipTarihi: gecmisIso }).satirSinifi === 'satir-notr' &&
      ISG.planDurumu({ durum: 'kapsamDisi', takipTarihi: gecmisIso }).satirSinifi === 'satir-notr' &&
      ISG.planDurumu({ durum: 'devam', takipTarihi: gecmisIso }).satirSinifi === 'satir-tehlike');

    const formSecenek = doc.querySelectorAll('#planForm select[name="durum"] option');
    kontrol('Plan formu dokuz durumu ayni sirada gosterir',
      formSecenek.length === 9 &&
      Array.prototype.map.call(formSecenek, (o) => o.value).join(',') === ISG.PLAN_DURUM_SECIMLERI.join(','),
      Array.prototype.map.call(formSecenek, (o) => o.value).join(','));

    doc.getElementById('planAy').value = 'tumu';
    doc.getElementById('planAy').dispatchEvent(new window.Event('change', { bubbles: true }));
    await bekle(140);
    const durumKutusu = doc.querySelector('select[data-ui="planDurum"]');
    kontrol('Durum filtre kutusu: Tumu + 10 durum + Bugun',
      durumKutusu && durumKutusu.options.length === 12, durumKutusu ? durumKutusu.options.length : 'kutu yok');
    const kpiKartlari = doc.querySelectorAll('[data-islem="plan-durum-filtre"]');
    kontrol('Alti durum karti cizildi ve gecerli anahtar tasir',
      kpiKartlari.length === 6 && Array.prototype.every.call(kpiKartlari, (kart) => {
        const filtre = kart.getAttribute('data-filtre');
        return filtre === 'bugun' || !!D[filtre];
      }), String(kpiKartlari.length));

    const satirMenuleri = doc.querySelectorAll('#planTablo .durum-menu');
    kontrol('Plan satirlarinda durum menusu var', satirMenuleri.length > 0, String(satirMenuleri.length));
    const menuDugmeleri = satirMenuleri.length
      ? satirMenuleri[0].querySelectorAll('[data-islem="plan-durum-ata"]') : [];
    kontrol('Menu, kayitli durum disindaki sekiz durumu sunar',
      menuDugmeleri.length === 8, String(menuDugmeleri.length));

    const hedefPlan = ISG.depo.al().planlar.filter((p) => ISG.planDurumNormal(p.durum) !== 'devam')[0];
    kontrol('Durum degistirilecek plan bulundu', !!hedefPlan);
    if (hedefPlan) {
      const atamaDugmesi = doc.querySelector(
        '[data-islem="plan-durum-ata"][data-id="' + hedefPlan.id + '"][data-durum="devam"]');
      kontrol('Menude "Devam Ediyor" dugmesi var', !!atamaDugmesi);
      if (atamaDugmesi) {
        atamaDugmesi.click();
        await bekle(180);
      }
      const atanan = ISG.depo.al().planlar.filter((p) => p.id === hedefPlan.id)[0];
      kontrol('Menuden atanan durum kayda yazildi', atanan.durum === 'devam', atanan.durum);
      kontrol('Atama tamamlanma tarihi uretmez', !atanan.tamamlanmaTarihi, String(atanan.tamamlanmaTarihi));
      kontrol('Atama kalici yazima gecti',
        String(window.localStorage.getItem(ISG.depo.anahtar)).indexOf('"durum":"devam"') > -1);
      ISG.depo.planDurumDegistir(hedefPlan.id, 'gecikti');
      kontrol('Turetilmis "gecikti" kaydedilemez → yapilacak',
        ISG.depo.al().planlar.filter((p) => p.id === hedefPlan.id)[0].durum === 'yapilacak');
    }
  }

  console.log('\n19) Kurum kapsamı ve salt okunur denetim panosu');
  /* OSGB Müdürü kendi kurumundaki işyerlerini izler; yazma ve onay yetkisi
     yoktur. Test kendi kurumunu, hesabını ve işyeri bağını kurar, sonunda
     hepsini geri alır. */
  const anaIsyeri = ISG.depo.al().isyerleri.filter((i) => i.id === 'iy1')[0];
  const ilkKurumId = anaIsyeri.kurumId || '';
  const denemeKurum = ISG.depo.kurumKaydet({ ad: 'Deneme OSGB' });
  kontrol('Kurum kaydı oluşturuldu', !!denemeKurum && !!denemeKurum.id);
  const denemeMudur = ISG.depo.kullaniciKaydet({
    id: '', adSoyad: 'Deneme Müdür', eposta: 'mudur@deneme.osgb', sifre: '1234',
    rol: 'osgb muduru', kurumId: denemeKurum.id, isyerleri: [], aktif: true
  });
  kontrol('OSGB müdürü hesabı rolü tanındı', ISG.yetki.rolCoz(denemeMudur.rol) === 'osgbMuduru');

  ISG.yetki.oturumKapat();
  await girisYap('mudur@deneme.osgb', '1234');
  kontrol('OSGB müdürü oturumu açıldı', !!ISG.yetki.oturum() && ISG.yetki.oturum().rol === 'osgbMuduru');
  kontrol('Kurumsuz işyeri kapsam dışında', ISG.yetki.kapsam().length === 0, String(ISG.yetki.kapsam().length));
  kontrol('Salt okunur rolde yazma reddedilir', ISG.yetki.yazmaModu('iy1') === 'red', ISG.yetki.yazmaModu('iy1'));
  kontrol('Kapsam dışı işyerinde ekleme izni yok', ISG.yetki.izin('ekle', 'iy1') === false);
  kontrol('OSGB müdürü talebi onaylayamaz', ISG.yetki.onayYetkisi({ isyeriId: 'iy1', kullaniciId: 'u2' }) === false);
  const bosPanosu = ISG.sayfalar.kurum();
  kontrol('Kurum panosu salt okunur rozet taşır', /Salt okunur/.test(bosPanosu));
  kontrol('Kurum panosu yazma düğmesi içermez',
    !/data-islem="(isyeri-duzenle|isyeri-sil|kullanici-yeni|personel-duzenle)"/.test(bosPanosu));
  kontrol('Kurum görünümünde şifre alanı yok',
    (ISG.yetki.gorunum().kullanicilar || []).every((k) => !('sifre' in k)));

  /* İşyeri bu kuruma bağlanınca kapsam açılır ama yazma hakkı doğmaz. */
  ISG.yetki.oturumKapat();
  await girisYap('mehmetkurt0948@gmail.com', '1234');
  ISG.depo.isyeriKaydet(Object.assign({}, anaIsyeri, { kurumId: denemeKurum.id }));
  ISG.yetki.oturumKapat();
  await girisYap('mudur@deneme.osgb', '1234');
  kontrol('Kurum kapsamı kendi işyerini içerir', ISG.yetki.kapsam().indexOf('iy1') > -1);
  kontrol('Kurum kapsamı başka işyerini içermez', ISG.yetki.kapsam().indexOf('iy2') < 0);
  kontrol('Salt okunur rolde yazma modu red', ISG.yetki.yazmaModu('iy1') === 'red', ISG.yetki.yazmaModu('iy1'));
  kontrol('Kurum görünümü yalnız kendi işyerini taşır', (ISG.yetki.gorunum().isyerleri || []).length === 1,
    String((ISG.yetki.gorunum().isyerleri || []).length));
  await sayfaAc('#kurum');
  kontrol('Kurum panosu açılır', /Onay yetkisi durumu/.test(metin('#gorunum')));
  kontrol('Kurum panosu menüde görünür', doc.getElementById('menuKurum').hidden === false);
  kontrol('Onay kuyruğu kurum müdüründe gizli', doc.getElementById('menuOnaylar').hidden === true);

  /* Temizlik: işyeri bağı, hesap ve kurum kaydı geri alınır. */
  ISG.yetki.oturumKapat();
  await girisYap('mehmetkurt0948@gmail.com', '1234');
  ISG.depo.isyeriKaydet(Object.assign({}, anaIsyeri, { kurumId: ilkKurumId }));
  ISG.depo.kullaniciSil(denemeMudur.id);
  ISG.depo.kurumSil(denemeKurum.id);
  kontrol('Temizlik sonrası kurum sayısı eski hâlinde',
    ISG.depo.al().kurumlar.every((k) => k.id !== denemeKurum.id));
  kontrol('Temizlik sonrası işyeri bağı korundu',
    (ISG.depo.al().isyerleri.filter((i) => i.id === 'iy1')[0] || {}).kurumId === ilkKurumId);

  /* İşyeri formu kurum bağını taşır; kart listesinde kurum adı görünür. */
  await sayfaAc('#isyerleri');
  doc.querySelector('[data-islem="isyeri-duzenle"]').click();
  await bekle(120);
  const iyFormu = doc.getElementById('isyeriForm');
  kontrol('İşyeri formunda kurum alanı var', !!iyFormu.elements.kurumId);
  kontrol('Kurum seçenekleri dolu', !!iyFormu.elements.kurumId && iyFormu.elements.kurumId.options.length > 1,
    iyFormu.elements.kurumId ? String(iyFormu.elements.kurumId.options.length) : 'yok');
  doc.querySelector('#isyeriDiyalog [data-kapat]').click();
  await bekle(100);
  kontrol('İşyeri kartı kurum adını gösterir', /Bağlı kurum/.test(metin('#gorunum')));

  console.log('\n20) İşyeri onay modeli (deneysel anahtar)');
  /* Model yalnız `ayarlar.onayModeli` anahtarıyla açılır; anahtar kapanınca
     eski rol davranışı aynen döner. */
  ISG.depo.ayarKaydet({ onayModeli: 'isyeri' });
  kontrol('İşyeri onay modeli açıldı', ISG.yetki.onayModeli() === 'isyeri', ISG.yetki.onayModeli());
  kontrol('Tehlikeli işyeri eşiği A/B', ISG.yetki.onayEsigi('tehlikeli').join('/') === 'A/B');
  kontrol('Çok tehlikeli eşiği yalnız A', ISG.yetki.onayEsigi('cokTehlikeli').join('/') === 'A');
  kontrol('Tek uzmanlı işyeri tekUzman modunda', ISG.yetki.onayDurumu('iy1').mod === 'tekUzman',
    ISG.yetki.onayDurumu('iy1').mod);
  kontrol('Uzmansız işyeri uzman-yok modunda', ISG.yetki.onayDurumu('iy3').mod === 'uzman-yok',
    ISG.yetki.onayDurumu('iy3').mod);

  await girisYap('buse.senol@ornek.com', '1234');
  kontrol('Tek uzmanlı işyerinde yetkili doğrudan yazar', ISG.yetki.yazmaModu('iy1') === 'dogrudan',
    ISG.yetki.yazmaModu('iy1'));
  kontrol('Kapsam dışı işyeri kapsam-disi döner', ISG.yetki.yazmaModu('iy3') === 'kapsam-disi',
    ISG.yetki.yazmaModu('iy3'));
  const talepOnce = ISG.depo.al().talepler.length;
  ISG.depo.personelKaydet({ id: '', isyeriId: 'iy1', adSoyad: 'Model Testi', sicil: '91', durum: 'aktif' });
  kontrol('Doğrudan yazma kaydı oluşturdu',
    ISG.depo.al().personel.some((p) => p.adSoyad === 'Model Testi'));
  kontrol('Doğrudan yazmada talep oluşmadı', ISG.depo.al().talepler.length === talepOnce);
  ISG.yetki.oturumKapat();

  /* İşyeri çok tehlikeliye alınınca eşik yalnız A olur: B ve C sınıfı uzmanlar
     onaylayan sayılmaz, talep "yetkili eksik" durumunda bekler. */
  await girisYap('mehmetkurt0948@gmail.com', '1234');
  const modelTestiKisi = ISG.depo.al().personel.filter((p) => p.adSoyad === 'Model Testi')[0];
  if (modelTestiKisi) { ISG.depo.personelSil(modelTestiKisi.id); }
  const iy1Kayit = ISG.depo.al().isyerleri.filter((i) => i.id === 'iy1')[0];
  const ilkTehlike = iy1Kayit.tehlikeSinifi;
  const cUzman = ISG.depo.kullaniciKaydet({
    id: '', adSoyad: 'C Sınıfı Uzman', eposta: 'cuzman@deneme.test', sifre: '1234',
    rol: 'yetkili', uzmanSinifi: 'C', kurumId: ilkKurumId, isyerleri: ['iy1'], aktif: true
  });
  ISG.depo.isyeriKaydet(Object.assign({}, iy1Kayit, { tehlikeSinifi: 'cokTehlikeli' }));
  const cokUzman = ISG.yetki.onayDurumu('iy1');
  kontrol('İki uzmanlı işyerinde sınıf eşiği aranır', cokUzman.mod === 'eksik', cokUzman.mod);
  kontrol('Eşiği karşılamayan uzman onaylayan sayılmaz', cokUzman.onaylayanIdler.length === 0,
    String(cokUzman.onaylayanIdler.length));
  await girisYap('buse.senol@ornek.com', '1234');
  kontrol('Uygun onay yetkilisi yokken yazma eksik moduna düşer', ISG.yetki.yazmaModu('iy1') === 'eksik',
    ISG.yetki.yazmaModu('iy1'));
  const eksikTalep = ISG.depo.personelKaydet({
    id: '', isyeriId: 'iy1', adSoyad: 'Eksik Yetki Testi', sicil: '92', durum: 'aktif'
  });
  kontrol('Eksik yetkide kayıt doğrudan yazılmaz',
    !ISG.depo.al().personel.some((p) => p.adSoyad === 'Eksik Yetki Testi'));
  kontrol('Eksik yetkide talep kuyruğa girer', eksikTalep && eksikTalep.yetkiDurumu === 'eksik',
    eksikTalep && eksikTalep.yetkiDurumu);
  ISG.yetki.oturumKapat();

  await girisYap('mehmetkurt0948@gmail.com', '1234');
  ISG.depo.ayarKaydet({ onayModeli: 'rol' });
  kontrol('Rol modeli geri yüklendi', ISG.yetki.onayModeli() === 'rol', ISG.yetki.onayModeli());
  ISG.depo.kullaniciSil(cUzman.id);
  ISG.depo.isyeriKaydet(Object.assign({}, ISG.depo.al().isyerleri.filter((i) => i.id === 'iy1')[0],
    { tehlikeSinifi: ilkTehlike }));
  const eksikKayit = ISG.depo.al().personel.filter((p) => p.adSoyad === 'Eksik Yetki Testi')[0];
  if (!eksikKayit) {
    const bekleyen = ISG.depo.al().talepler.filter((t) => t.yetkiDurumu === 'eksik');
    bekleyen.forEach((t) => { ISG.yetki.talepReddet(t.id, 'Test temizliği'); });
  }
  kontrol('Model testi verisi temizlendi',
    ISG.depo.al().kullanicilar.every((k) => k.id !== cUzman.id));
  kontrol('İşyeri tehlike sınıfı geri yüklendi',
    (ISG.depo.al().isyerleri.filter((i) => i.id === 'iy1')[0] || {}).tehlikeSinifi === ilkTehlike,
    (ISG.depo.al().isyerleri.filter((i) => i.id === 'iy1')[0] || {}).tehlikeSinifi);
  console.log('\n27) Acil durum ekip ihtiyacı: oran, çalışan kaynağı, tarih ve gösterim');

  /* 27a) Oran hesabı: gerekli = ceil(çalışan / oran). Yapay "en az 3 kişi"
     tabanı kaldırıldı; tüm sayı × sınıf kombinasyonları şartname formülüyle
     karşılaştırılır. */
  const acilOranlar = ISG.ACIL_EQIP_ORANLARI;
  const acilEkipIdleri = ['sondurme', 'kurtarma', 'koruma', 'ilkYardim'];
  const acilSiniflar = ['az', 'tehlikeli', 'cokTehlikeli'];
  const acilSayilar = [1, 10, 15, 20, 30, 31, 40, 50, 100, 1140];
  const oranSapmalari = [];
  acilSiniflar.forEach((sinif) => {
    acilSayilar.forEach((n) => {
      const hesap = ISG.acilEkipGereksinimi(sinif, n);
      const beklenen = acilEkipIdleri.map((id) => Math.ceil(n / acilOranlar[sinif][id])).join('/');
      const gercek = hesap.satirlar.map((satir) => satir.gerekli).join('/');
      if (!hesap.gecerli || gercek !== beklenen) {
        oranSapmalari.push(sinif + ' ' + n + ': ' + gercek + ' ≠ ' + beklenen);
      }
    });
  });
  kontrol('Üç tehlike sınıfında 10 çalışan sayısı için oran hesabı doğru',
    oranSapmalari.length === 0, oranSapmalari.slice(0, 3).join(' | '));

  const hesap1140 = ISG.acilEkipGereksinimi('cokTehlikeli', 1140);
  kontrol('1140 çok tehlikeli çalışan → 38/38/38/114',
    hesap1140.satirlar.map((s) => s.gerekli).join('/') === '38/38/38/114' && hesap1140.gerekli === 228,
    hesap1140.satirlar.map((s) => s.gerekli).join('/') + ' / toplam ' + hesap1140.gerekli);
  kontrol('1 çalışan az tehlikeli → 1/1/1/1 (3 kişilik taban kaldırıldı)',
    ISG.acilEkipGereksinimi('az', 1).satirlar.map((s) => s.gerekli).join('/') === '1/1/1/1',
    ISG.acilEkipGereksinimi('az', 1).satirlar.map((s) => s.gerekli).join('/'));
  kontrol('20 çalışan az tehlikeli → 1/1/1/1',
    ISG.acilEkipGereksinimi('az', 20).satirlar.map((s) => s.gerekli).join('/') === '1/1/1/1');
  kontrol('31 çalışan az tehlikeli → 1/1/1/2 (yukarı yuvarlama)',
    ISG.acilEkipGereksinimi('az', 31).satirlar.map((s) => s.gerekli).join('/') === '1/1/1/2',
    ISG.acilEkipGereksinimi('az', 31).satirlar.map((s) => s.gerekli).join('/'));
  kontrol('50 çalışan tehlikeli → 2/2/2/4',
    ISG.acilEkipGereksinimi('tehlikeli', 50).satirlar.map((s) => s.gerekli).join('/') === '2/2/2/4');
  kontrol('15 çalışan çok tehlikeli → 1/1/1/2',
    ISG.acilEkipGereksinimi('cokTehlikeli', 15).satirlar.map((s) => s.gerekli).join('/') === '1/1/1/2');

  const sifirGecersiz = ISG.acilEkipGereksinimi('az', 0);
  kontrol('0 çalışan (veri eksik) hesabı geçersiz sayar, sayı uydurmaz',
    !sifirGecersiz.gecerli && sifirGecersiz.gerekli === 0, sifirGecersiz.neden);
  const sifirDogrulanmis = ISG.acilEkipGereksinimi('az', 0, { sifirGecerli: true });
  kontrol('Doğrulanmış 0 çalışan geçerli ve gerekli 0',
    sifirDogrulanmis.gecerli && sifirDogrulanmis.gerekli === 0 && sifirDogrulanmis.sifir === true);
  const sinifsizGereksinim = ISG.acilEkipGereksinimi('', 50);
  kontrol('Tehlike sınıfı yoksa hesap geçersiz ve gerekli 0',
    !sinifsizGereksinim.gecerli && sinifsizGereksinim.gerekli === 0 &&
    /Tehlike sınıfı/.test(sinifsizGereksinim.neden), sinifsizGereksinim.neden);

  /* 27b) Çalışan kaynağı (D1): aktif personel öncelikli, kart yedek. */
  const sentetikKisi = (id, isyeriId, durum) => ({ id: id, isyeriId: isyeriId, adSoyad: 'Kişi ' + id, durum: durum });
  const sadeceKart = ISG.acilCalisanSayisi({ id: 'T1', calisanSayisi: 25 }, { personel: [] });
  kontrol('Personel kaydı yoksa işyeri kartı kullanılır',
    sadeceKart.calisanSayisi === 25 && sadeceKart.tip === 'kart' && sadeceKart.kaynak === 'İşyeri kartı',
    sadeceKart.tip + '/' + sadeceKart.calisanSayisi);
  const veriYokSayim = ISG.acilCalisanSayisi({ id: 'T2', calisanSayisi: '' }, { personel: [] });
  kontrol('Ne personel ne kart varsa veri eksik işaretlenir',
    veriYokSayim.tip === 'veriYok' && veriYokSayim.eksik === true && veriYokSayim.calisanSayisi === 0);
  const personelOncelikli = ISG.acilCalisanSayisi({ id: 'T3', calisanSayisi: 0 },
    { personel: [sentetikKisi('a', 'T3', 'aktif'), sentetikKisi('b', 'T3', 'aktif')] });
  kontrol('Personel varken karttaki boş sayı hesabı bozmaz',
    personelOncelikli.calisanSayisi === 2 && personelOncelikli.tip === 'personel' &&
    /çalışan sayısı girilmemiş/i.test(personelOncelikli.bilgi), personelOncelikli.bilgi);

  const karisikPersonel = [];
  for (let i = 0; i < 80; i += 1) { karisikPersonel.push(sentetikKisi('a' + i, 'T4', 'aktif')); }
  for (let i = 0; i < 40; i += 1) { karisikPersonel.push(sentetikKisi('p' + i, 'T4', 'pasif')); }
  const pasifliSayim = ISG.acilCalisanSayisi({ id: 'T4', calisanSayisi: 120 }, { personel: karisikPersonel });
  kontrol('Pasif personel sayılmaz (kart 120 / 80 aktif + 40 pasif → 80)',
    pasifliSayim.calisanSayisi === 80 && pasifliSayim.pasifPersonel === 40,
    pasifliSayim.calisanSayisi + ' aktif / ' + pasifliSayim.pasifPersonel + ' pasif');
  kontrol('Kart ile aktif personel farkı kullanıcıya uyarı olarak döner',
    /80 aktif kişi/.test(pasifliSayim.uyari) && /120/.test(pasifliSayim.uyari) &&
    /40 pasif/.test(pasifliSayim.uyari), pasifliSayim.uyari);
  const eskiDurumKaydi = ISG.acilCalisanSayisi({ id: 'T5', calisanSayisi: 5 },
    { personel: [{ id: 'x', isyeriId: 'T5' }] });
  kontrol('Durum alanı olmayan eski personel kaydı aktif sayılır',
    eskiDurumKaydi.calisanSayisi === 1 && eskiDurumKaydi.tip === 'personel');
  const hepsiPasif = ISG.acilCalisanSayisi({ id: 'T6', calisanSayisi: 10 },
    { personel: [sentetikKisi('q', 'T6', 'pasif')] });
  kontrol('Tümü pasifse gerçek sıfır (veri eksik değil)',
    hepsiPasif.calisanSayisi === 0 && hepsiPasif.tip === 'personelSifir' &&
    hepsiPasif.eksik === false && /pasif/i.test(hepsiPasif.uyari || hepsiPasif.bilgi),
    hepsiPasif.uyari || hepsiPasif.bilgi);
  const baskaIsyeriSayim = ISG.acilCalisanSayisi({ id: 'T7', calisanSayisi: 3 }, { personel: karisikPersonel });
  kontrol('Başka işyerinin personeli sayıma karışmaz',
    baskaIsyeriSayim.calisanSayisi === 3 && baskaIsyeriSayim.personelVar === false &&
    baskaIsyeriSayim.kayitliPersonel === 0);

  /* 27c) Ekip üyeleri: süresi dolmuş belge, mükerrer kişi, görev çakışması. */
  const ekipTestVerisi = { personel: [], egitimler: [], isyerleri: [] };
  for (let i = 0; i < 40; i += 1) { ekipTestVerisi.personel.push(sentetikKisi('e' + i, 'T8', 'aktif')); }
  const ekipPlan = {
    isyeriId: 'T8', hazirlanma: '', sonYenileme: '', tatbikat: '',
    ekip: [
      { rol: 'İlk yardım ekibi', ad: 'Süresi Dolmuş', gecerlilik: '2020-01-01' },
      { rol: 'İlk yardım ekibi', ad: 'Geçerli Kişi', gecerlilik: '2099-12-31' },
      { rol: 'İlk yardım ekibi', ad: 'Geçerli Kişi', gecerlilik: '2099-12-31' }
    ]
  };
  const ekipIsyeri = { id: 'T8', ad: 'Ekip Testi', tehlikeSinifi: 'tehlikeli', calisanSayisi: 40 };
  const ekipDurum = ISG.acilEkipDurumu(ekipIsyeri, ekipPlan, ekipTestVerisi);
  const ilkYardimSatiri = ekipDurum.satirlar.filter((s) => s.id === 'ilkYardim')[0];
  kontrol('Süresi dolmuş ilk yardım belgesi mevcuda sayılmaz',
    ilkYardimSatiri.onayli === 1 && ilkYardimSatiri.suresiDolan.length === 1,
    'onaylı ' + ilkYardimSatiri.onayli + ' / süresi dolan ' + ilkYardimSatiri.suresiDolan.length);
  kontrol('Aynı kişi iki kez yazılsa bir kez sayılır',
    ilkYardimSatiri.kisiSayisi === 2 && ilkYardimSatiri.mukerrer === 1,
    'kişi ' + ilkYardimSatiri.kisiSayisi + ' / mükerrer ' + ilkYardimSatiri.mukerrer);
  kontrol('Tehlikeli 40 çalışanda ilk yardım ihtiyacı 3 kişi',
    ilkYardimSatiri.gerekli === 3 && ilkYardimSatiri.eksik === 2,
    'gerekli ' + ilkYardimSatiri.gerekli + ' / eksik ' + ilkYardimSatiri.eksik);

  ekipPlan.ekip.push({ rol: 'Söndürme ekibi', ad: 'Geçerli Kişi' });
  const cakismaliDurum = ISG.acilEkipDurumu(ekipIsyeri, ekipPlan, ekipTestVerisi);
  kontrol('Aynı kişi iki zorunlu ekipte görünürse çakışma uyarısı çıkar',
    cakismaliDurum.cakismalar.length === 1 &&
    cakismaliDurum.cakismalar[0].ekipler.length === 2 &&
    cakismaliDurum.uyarilar.some((m) => /birden fazla zorunlu ekipte/.test(m)),
    JSON.stringify(cakismaliDurum.cakismalar));



  /* 27d) Plan tarihi: tehlike sınıfına göre 2/4/6 yıl, takvim doğrulaması. */
  const tarihHazir = (sinif, enGec) => ISG.acilPlanTarihKontrol(
    { hazirlanma: '2024-01-10', sonYenileme: '', tatbikat: '2024-02-01' }, sinif).enGec === enGec;
  kontrol('Az tehlikeli plan 6 yılda yenilenir', tarihHazir('az', '2030-01-10'));
  kontrol('Tehlikeli plan 4 yılda yenilenir', tarihHazir('tehlikeli', '2028-01-10'));
  kontrol('Çok tehlikeli plan 2 yılda yenilenir', tarihHazir('cokTehlikeli', '2026-01-10'));

  const takvimHatasi = ISG.acilPlanTarihKontrol({ hazirlanma: '2026-02-31' }, 'az');
  kontrol('Takvimde olmayan tarih (2026-02-31) reddedilir',
    !takvimHatasi.gecerli && /geçerli bir tarih değil/.test(takvimHatasi.hatalar.join(' ')));
  const ileriTarih = ISG.acilPlanTarihKontrol({ hazirlanma: '2999-01-01' }, 'az');
  kontrol('İleri tarih reddedilir', !ileriTarih.gecerli && /ileri bir tarih/.test(ileriTarih.hatalar.join(' ')));
  const siraHatasi = ISG.acilPlanTarihKontrol(
    { hazirlanma: '2025-01-01', sonYenileme: '2024-01-01', tatbikat: '2025-01-02' }, 'az');
  kontrol('Son yenileme hazırlanmadan eski olamaz',
    !siraHatasi.gecerli && /eski olamaz/.test(siraHatasi.hatalar.join(' ')));
  const sinifsizTarih = ISG.acilPlanTarihKontrol({ hazirlanma: '2025-01-01' }, '');
  kontrol('Tehlike sınıfı yoksa tarih denetimi belirsizliği hata olarak bildirir',
    !sinifsizTarih.gecerli && sinifsizTarih.enGec === '' &&
    /Tehlike sınıfı tanımlı olmadığı/.test(sinifsizTarih.hatalar.join(' ')),
    sinifsizTarih.hatalar.join(' | '));
  const tatbikatli = ISG.acilPlanTarihKontrol(
    { hazirlanma: '2024-01-10', sonYenileme: '', tatbikat: '2024-03-01' }, 'tehlikeli');
  kontrol('Tatbikat tarihi yenileme hesabını değiştirmez', tatbikatli.enGec === '2028-01-10');
  const tatbikatsiz = ISG.acilPlanTarihKontrol({ hazirlanma: '2024-01-10' }, 'tehlikeli');
  kontrol('Tatbikat girilmezse bilgilendirme uyarısı düşer, kayıt engellenmez',
    tatbikatsiz.gecerli && /tatbikat/i.test(tatbikatsiz.uyarilar.join(' ')));
  const vadeliGecmis = ISG.acilPlanTarihKontrol(
    { hazirlanma: '2015-01-10', sonYenileme: '', tatbikat: '2015-02-01' }, 'tehlikeli');
  kontrol('Vadesi geçmiş plan kaydı engellenmez, vade olarak gösterilir',
    vadeliGecmis.gecerli && vadeliGecmis.enGec === '2019-01-10', vadeliGecmis.enGec);

  const ozetVarsayilansiz = ISG.acilPlanOzeti(
    { id: 'T9', tehlikeSinifi: '', calisanSayisi: 5 }, { sonYenileme: '2024-01-01' });
  kontrol('Tehlike sınıfı yoksa varsayılan sınıf uydurulmaz',
    ozetVarsayilansiz.sinif === null && ozetVarsayilansiz.enGec === '' &&
    ozetVarsayilansiz.yenilemeYil === 0);
  const ozetAz = ISG.acilPlanOzeti({ id: 'T10', tehlikeSinifi: 'az', calisanSayisi: 5 },
    { sonYenileme: '2024-01-01' });
  kontrol('Sınıf etiket metniyle de okunur (Az tehlikeli → 6 yıl)',
    ozetAz.enGec === '2030-01-01' && ozetAz.yenilemeYil === 6, ozetAz.enGec);

  /* 27e) İşyeri izolasyonu, otomatik hesap ve kalıcılık (gerçek depo). */
  const acilTest1 = ISG.depo.isyeriKaydet({
    ad: 'ACİL TEST 1140', tehlikeSinifi: 'cokTehlikeli', calisanSayisi: 1140, kurumId: ''
  });
  const acilTest2 = ISG.depo.isyeriKaydet({
    ad: 'ACİL TEST 20', tehlikeSinifi: 'az', calisanSayisi: 20, kurumId: ''
  });
  const durumTest1 = ISG.acilEkipDurumu(acilTest1, null, ISG.depo.al());
  kontrol('Yeni işyerinde ekip ihtiyacı kayıt olmadan hesaplanır',
    durumTest1.gorevEksik === true && durumTest1.ozet.eksikEkip === 4,
    'eksik ekip ' + durumTest1.ozet.eksikEkip);
  kontrol('1140 çok tehlikeli işyerinde gerekli 38/38/38/114',
    durumTest1.satirlar.map((s) => s.gerekli).join('/') === '38/38/38/114',
    durumTest1.satirlar.map((s) => s.gerekli).join('/'));
  const durumTest2 = ISG.acilEkipDurumu(acilTest2, null, ISG.depo.al());
  kontrol('20 az tehlikeli işyerinde gerekli 1/1/1/1',
    durumTest2.satirlar.map((s) => s.gerekli).join('/') === '1/1/1/1',
    durumTest2.satirlar.map((s) => s.gerekli).join('/'));

  ISG.depo.acilEkipEkle(acilTest1.id, 'İlk yardım ekibi', 'A Kişisi', '', { gecerlilik: '2099-12-31' });
  const izole1 = ISG.acilEkipDurumu(acilTest1, ISG.ilgiliKayit(ISG.depo.al(), 'acilPlanlar', acilTest1.id), ISG.depo.al());
  const izole2 = ISG.acilEkipDurumu(acilTest2, ISG.ilgiliKayit(ISG.depo.al(), 'acilPlanlar', acilTest2.id), ISG.depo.al());
  const ilk1 = izole1.satirlar.filter((s) => s.id === 'ilkYardim')[0];
  const ilk2 = izole2.satirlar.filter((s) => s.id === 'ilkYardim')[0];
  kontrol('Ekip üyesi yalnızca kendi işyerinde sayılır',
    ilk1.onayli === 1 && ilk2.kisiSayisi === 0,
    'test1 ' + ilk1.onayli + ' / test2 ' + ilk2.kisiSayisi);

  const test2Kisi = ISG.depo.personelKaydet({
    id: '', isyeriId: acilTest2.id, adSoyad: 'İzolasyon Kişisi', sicil: 'A-1', durum: 'aktif'
  });
  const sayimTest2 = ISG.acilCalisanSayisi(acilTest2, ISG.depo.al());
  const sayimTest1 = ISG.acilCalisanSayisi(acilTest1, ISG.depo.al());
  kontrol('Personel kaydı yalnızca kendi işyerinin sayımına girer',
    sayimTest2.calisanSayisi === 1 && sayimTest1.kayitliPersonel === 0,
    'test2 ' + sayimTest2.calisanSayisi + ' / test1 ' + sayimTest1.kayitliPersonel);
  kontrol('Personel varken kart sayısı yerine aktif personel esas alınır',
    sayimTest2.tip === 'personel' && sayimTest2.calisanSayisi === 1 && /20/.test(sayimTest2.uyari),
    sayimTest2.tip + ' ' + sayimTest2.calisanSayisi);
  ISG.depo.personelSil(test2Kisi.id);

  ISG.depo.acilPlanKaydet(acilTest2.id, { hazirlanma: '2024-05-01', sonYenileme: '', tatbikat: '' });
  const kaliciPlan = (JSON.parse(window.localStorage.getItem('isgtakip.v4') || '{}').acilPlanlar || [])
    .filter((k) => k.isyeriId === acilTest2.id)[0] || {};
  kontrol('Plan tarihi diske yazılır',
    kaliciPlan.hazirlanma === '2024-05-01', String(kaliciPlan.hazirlanma));
  kontrol('Diske yazılan tarihten yenileme 6 yıl ötelenir',
    ISG.acilPlanOzeti(acilTest2, kaliciPlan).enGec === '2030-05-01',
    ISG.acilPlanOzeti(acilTest2, kaliciPlan).enGec);

  /* 27f) Gösterim (D3): ana ekranda ve diyalogda beş sütunlu tablo + arama. */
  await sayfaAc('#acil');
  const acilTablolar = doc.querySelectorAll('#gorunum .ekip-tablo');
  kontrol('#acil ekranında her işyeri kartında ekip tablosu var',
    acilTablolar.length > 0 &&
    acilTablolar.length === doc.querySelectorAll('#gorunum .risk-kart[data-acil-kart]').length,
    acilTablolar.length + ' tablo / ' +
      doc.querySelectorAll('#gorunum .risk-kart[data-acil-kart]').length + ' kart');
  const ilkAcilTablo = acilTablolar[0];
  kontrol('Tablo başlıkları Ekip / Mevcut / Gerekli / Eksik / Durum',
    Array.from(ilkAcilTablo.querySelectorAll('thead th')).map((th) => th.textContent.trim()).join('|') ===
      'Ekip|Mevcut|Gerekli|Eksik|Durum',
    Array.from(ilkAcilTablo.querySelectorAll('thead th')).map((th) => th.textContent.trim()).join('|'));
  kontrol('Her tabloda dört zorunlu ekip satırı var',
    ilkAcilTablo.querySelectorAll('tbody tr').length === 4,
    String(ilkAcilTablo.querySelectorAll('tbody tr').length));
  kontrol('Tablo yatay kaydırma kabında (dar ekran)', !!ilkAcilTablo.closest('.tablo-kap'));

  const acilAramaGirdi = doc.querySelector('[data-ui="acilArama"]');
  kontrol('#acil ekranında işyeri arama alanı var', !!acilAramaGirdi);
  if (acilAramaGirdi) {
    /* Arama gerçek kullanıcı yolundan sınanır: data-ui bağlantısı değeri
       yazar, 260 ms debounce sonrası sayfa yeniden çizilir. */
    acilAramaGirdi.value = 'ACİL TEST 1140';
    acilAramaGirdi.dispatchEvent(new window.Event('input', { bubbles: true }));
    await bekle(420);
    kontrol('Arama kart listesini süzer',
      doc.querySelectorAll('#gorunum .risk-kart[data-acil-kart]').length === 1,
      String(doc.querySelectorAll('#gorunum .risk-kart[data-acil-kart]').length) + ' kart');
    kontrol('Aranan işyeri kartı ekranda kalır', /ACİL TEST 1140/.test(metin('#gorunum')));
    kontrol('Arama kutusu değeri korunur',
      (doc.querySelector('[data-ui="acilArama"]') || {}).value === 'ACİL TEST 1140');
    const aramaTemizle = doc.querySelector('[data-ui="acilArama"]');
    aramaTemizle.value = '';
    aramaTemizle.dispatchEvent(new window.Event('input', { bubbles: true }));
    await bekle(420);
    kontrol('Arama temizlenince tüm kartlar geri gelir',
      doc.querySelectorAll('#gorunum .risk-kart[data-acil-kart]').length > 1,
      String(doc.querySelectorAll('#gorunum .risk-kart[data-acil-kart]').length) + ' kart');
  }

  const acilPlanDugme = doc.querySelector('[data-islem="acil-plan"][data-id="' + acilTest1.id + '"]');
  kontrol('1140 kişilik işyerinin plan düğmesi bulundu', !!acilPlanDugme);
  if (acilPlanDugme) {
    acilPlanDugme.click();
    await bekle(160);
    kontrol('Plan diyaloğu açıldı', doc.getElementById('acilPlanDiyalog').open === true);
    const diyalogTablo = doc.querySelector('#acilPlanIhtiyac .ekip-tablo');
    kontrol('Diyalogda beş sütunlu ekip tablosu var',
      !!diyalogTablo && diyalogTablo.querySelectorAll('tbody tr').length === 4,
      diyalogTablo ? diyalogTablo.querySelectorAll('tbody tr').length + ' satır' : 'tablo yok');
    kontrol('Diyalog tablosu 1140 için 38 gerekli gösterir',
      !!diyalogTablo && /38/.test(diyalogTablo.querySelectorAll('tbody tr')[0].textContent),
      diyalogTablo ? diyalogTablo.querySelectorAll('tbody tr')[0].textContent.slice(0, 60) : 'yok');
    const diyalogBilgi = doc.getElementById('acilPlanBilgi');
    kontrol('Diyalog işyeri, tehlike sınıfı ve esas çalışan sayısını gösterir',
      /ACİL TEST 1140/.test(diyalogBilgi.textContent) &&
      /Çok tehlikeli/.test(diyalogBilgi.textContent) &&
      /1140/.test(diyalogBilgi.textContent),
      diyalogBilgi.textContent.trim().slice(0, 120));
    doc.getElementById('acilPlanDiyalog').removeAttribute('open');
  }

  /* Test verisi temizliği: geçici işyerleri ve bağlı acil plan kayıtları silinir. */
  ISG.depo.isyeriSil(acilTest1.id);
  ISG.depo.isyeriSil(acilTest2.id);
  kontrol('Acil test işyerleri temizlendi',
    ISG.depo.al().isyerleri.every((i) => i.id !== acilTest1.id && i.id !== acilTest2.id) &&
    ISG.depo.al().acilPlanlar.every((k) => k.isyeriId !== acilTest1.id && k.isyeriId !== acilTest2.id));

  console.log('\nSonuç: ' + gecen + ' geçti, ' + hata + ' başarısız');
  dom.window.close();
  sunucu.close();
  process.exit(hata === 0 ? 0 : 1);
})().catch((e) => {
  console.error('Test çöktü:', e);
  process.exit(1);
});




