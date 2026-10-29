/* İSG Takip Merkezi — jsdom duman testi
   Kullanım: npm test  (veya node tools/kontrol.js) */
'use strict';

const path = require('path');
const fs = require('fs');
const http = require('http');
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
  kontrol('Demo hesapları listelenir', doc.querySelectorAll('[data-demo-eposta]').length >= 3, String(doc.querySelectorAll('[data-demo-eposta]').length));

  const girisYap = async (eposta, sifre) => {
    const form = doc.getElementById('girisForm');
    doc.getElementById('girisEposta').value = eposta;
    doc.getElementById('girisSifre').value = sifre;
    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await bekle(220);
  };

  await girisYap('mehmet.kurt@ornek.com', 'yanlis');
  kontrol('Hatalı şifre uyarısı', doc.getElementById('girisUyari').hidden === false && /Şifre hatalı/.test(metin('#girisUyari')), metin('#girisUyari'));
  kontrol('Hatalı girişte oturum açılmaz', !ISG.yetki.oturum());

  await girisYap('admin@isg.local', '1234');
  kontrol('Kayıtsız e-postada kayıtlı hesaplar hatırlatılır',
    /kayıtlı kullanıcı bulunamadı/i.test(metin('#girisUyari')) && /mehmet\.kurt@ornek\.com/.test(metin('#girisUyari')),
    metin('#girisUyari'));
  kontrol('Kayıtsız e-postada oturum açılmaz', !ISG.yetki.oturum());

  await girisYap('mehmet.kurt@ornek.com', '1234');
  kontrol('Yönetici oturumu açıldı', !!ISG.yetki.oturum() && ISG.yetki.oturum().rol === 'yonetici');
  kontrol('Giriş katmanı kapandı', doc.getElementById('girisKatman').hidden === true);
  kontrol('Gövde oturum sınıfı temizlendi', !doc.body.classList.contains('oturum-yok'));
  kontrol('Onay menüsü yöneticide görünür', doc.getElementById('menuOnaylar').hidden === false);
  kontrol('Kullanıcı alanı oturum sahibini gösterir', /Mehmet Kurt/.test(metin('#kullaniciAd')), metin('#kullaniciAd'));

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

  console.log('\n13) Yönetim raporu');
  await sayfaAc('#rapor');
  kontrol('Rapor dört KPI', doc.querySelectorAll('.kpi').length === 4);
  kontrol('Rapor tablosu altı satır', doc.querySelectorAll('.tablo-kucuk tbody tr').length === 6, String(doc.querySelectorAll('.tablo-kucuk tbody tr').length));
  kontrol('Tarih aralığı alanları var', !!doc.getElementById('raporBas') && !!doc.getElementById('raporBit'));

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
  kontrol('Menüde 12 sayfa var', doc.querySelectorAll('.menu-oge[data-sayfa]').length === 12, String(doc.querySelectorAll('.menu-oge[data-sayfa]').length));
  kontrol('Onay kuyruğu menüde', doc.querySelectorAll('.menu-oge[data-sayfa="onaylar"]').length === 1);
  kontrol('Dosya rozeti görünür', doc.getElementById('rozetDosya').hidden === false);
  kontrol('Saha rozeti sayı gösterir', /^\d+$/.test(doc.getElementById('rozetSaha').textContent));
  const idler = Array.from(doc.querySelectorAll('[id]')).map((e) => e.id);
  const tekrar = idler.filter((id, i) => idler.indexOf(id) !== i);
  kontrol('Tekrarlanan id yok', tekrar.length === 0, tekrar.slice(0, 5).join(', '));
  const kullanimlar = Array.from(doc.querySelectorAll('use[href]')).map((u) => u.getAttribute('href'));
  const eksikIkon = kullanimlar.filter((h) => !doc.querySelector(h));
  kontrol('SVG ikon referansları geçerli', eksikIkon.length === 0, eksikIkon.slice(0, 3).join(', '));
  kontrol('Diyalog sayısı 11', doc.querySelectorAll('dialog').length === 11, String(doc.querySelectorAll('dialog').length));
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

  doc.querySelector('[data-islem="demo-sifirla"]').click();
  await bekle(80);
  doc.getElementById('onayEvet').click();
  await bekle(150);
  kontrol('Demo sıfırlandı (37 personel)', ISG.depo.al().personel.length === 37, String(ISG.depo.al().personel.length));
  kontrol('Sıfırlama sonrası panel açık', metin('.sayfa-baslik h1') === 'Genel bakış');

  console.log('\n18) Tüm ekranlarda metin ve ikon temizliği');
  const tumSayfalar = ['panel', 'isyerleri', 'personel', 'dosyalar', 'plan', 'saha', 'rapor', 'risk', 'acil', 'ekip', 'onaylar', 'mevzuat'];
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

  console.log('\n19) Yayın paketi (GitHub Pages)');
  const pubKok = kok;
  const varMi = (goreli) => fs.existsSync(path.join(pubKok, goreli));
  kontrol('.nojekyll var', varMi('.nojekyll'));
  kontrol('404.html var', varMi('404.html'));
  kontrol('robots.txt var', varMi('robots.txt'));
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
  await girisAcVeYap('mehmet.kurt@ornek.com', '1234');
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

  console.log('\nSonuç: ' + gecen + ' geçti, ' + hata + ' başarısız');
  dom.window.close();
  sunucu.close();
  process.exit(hata === 0 ? 0 : 1);
})().catch((e) => {
  console.error('Test çöktü:', e);
  process.exit(1);
});




