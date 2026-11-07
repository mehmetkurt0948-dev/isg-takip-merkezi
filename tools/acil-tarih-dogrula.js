/* İSG Takip Merkezi — Acil durum planı tarih doğrulaması
   Kullanım:
     node tools/acil-tarih-dogrula.js                 # yerleşik demo verisi
     node tools/acil-tarih-dogrula.js --veri yedek.json
     node tools/acil-tarih-dogrula.js --sessiz        # yalnızca özet

   Ne doğrulanır (her kurum ve HER işyeri için ayrı ayrı):
     • Kayıt diyaloğundaki üç tarih (ilk hazırlanma, son yenileme, son tatbikat)
       ile veri deposundaki kayıt aynı mı?
     • Mevcut durum kartındaki tarihler diyalog ve depo ile aynı mı?
     • "En geç yenileme" tek kuraldan mı hesaplanıyor (son yenileme; yoksa ilk
       hazırlanma) ve tatbikat tarihi yenileme yerine sayılmıyor mu?
     • Bir işyerinin tarihleri başka işyerine taşınıyor mu? Kayıt sayısı işyeri
       başına bir mi (mükerrer kopya yok mu)?
     • Kaydedilen değer yeniden okunduğunda ve bulut birleşiminden sonra korunuyor
       mu? Eski/kimliksiz kopya yeni tarihi eziyor mu?
     • Takvimde olmayan tarih, ileri tarih ve ters sıra reddediliyor mu?
     • 29 Şubat + yıl hesabı bir gün kayıyor mu?

   Araç jsdom içinde çalışır: gerçek Supabase/üretim verisine YAZMAZ; verdiğiniz
   yedek dosyası yalnızca tarayıcı belleğine yüklenir. */
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

const argumanlar = process.argv.slice(2);
const veriDosyasi = (() => {
  const yer = argumanlar.indexOf('--veri');
  return yer > -1 ? argumanlar[yer + 1] : '';
})();
const sessiz = argumanlar.includes('--sessiz');

let gecen = 0;
let hata = 0;
const basarisizlar = [];

function kontrol(ad, kosul, ek) {
  if (kosul) {
    gecen += 1;
    if (!sessiz) { console.log('  OK   ' + ad); }
    return true;
  }
  hata += 1;
  basarisizlar.push(ad + (ek ? ' -> ' + ek : ''));
  console.log('  FAIL ' + ad + (ek ? ' -> ' + ek : ''));
  return false;
}

function sunucuBaslat() {
  return new Promise((coz) => {
    const sunucu = http.createServer((istek, yanit) => {
      const yol = decodeURIComponent(String(istek.url).split('?')[0].split('#')[0]);
      const dosya = path.join(kok, yol === '/' ? 'index.html' : yol);
      if (!dosya.startsWith(kok)) { yanit.writeHead(403); yanit.end(); return; }
      fs.readFile(dosya, (hataOkuma, icerik) => {
        if (hataOkuma) { yanit.writeHead(404); yanit.end('bulunamadi'); return; }
        yanit.writeHead(200, { 'Content-Type': MIME[path.extname(dosya)] || 'application/octet-stream' });
        yanit.end(icerik);
      });
    });
    sunucu.listen(0, '127.0.0.1', () => coz({ sunucu, port: sunucu.address().port }));
  });
}

const bekle = (ms) => new Promise((coz) => setTimeout(coz, ms));


(async () => {
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
  const w = dom.window;
  await new Promise((coz) => {
    if (w.document.readyState === 'complete') { coz(); }
    else { w.addEventListener('load', coz, { once: true }); }
  });
  await bekle(200);

  const doc = w.document;
  const ISG = w.ISG;
  const D = ISG.depo;
  const B = ISG.bicim;

  /* Önce oturum: içe aktarma yönetici yetkisi ister. Veri yüklendikten sonra
     oturum, yüklenen verinin kendi yöneticisiyle tazelenir. */
  const oturumAcYonetici = () => {
    const aday = (D.al().kullanicilar || []).filter((k) => {
      return k && k.aktif !== false && ISG.yetki.rolTanimi(k.rol).yonetir;
    })[0] || (D.al().kullanicilar || [])[0];
    if (!aday) { return null; }
    ISG.yetki.oturumAc(aday);
    return aday;
  };
  if (!oturumAcYonetici()) { throw new Error('Veride oturum açılabilecek kullanıcı yok.'); }

  /* 0) Veri: yedek dosyası ya da yerleşik demo fixture'ı (tarayıcı belleğinde) */
  if (veriDosyasi) {
    const tam = path.resolve(process.cwd(), veriDosyasi);
    if (!fs.existsSync(tam)) { throw new Error('Veri dosyası bulunamadı: ' + tam); }
    D.iceAktar(fs.readFileSync(tam, 'utf8'));
    console.log('\nVeri dosyası: ' + tam);
  } else {
    w.eval(fs.readFileSync(path.join(kok, 'tools', 'demo-veri.js'), 'utf8'));
    const demo = w.ISG.ORNEK_VERI();
    delete w.ISG.ORNEK_VERI;
    D.iceAktar(JSON.stringify(demo));
    console.log('\nVeri: tools/demo-veri.js (demo fixture)');
  }

  /* Yönetici oturumu: yüklenen verinin yöneticisiyle tazelenir; kapsam süzgeci
     bütün işyerlerini göstersin. */
  if (!oturumAcYonetici()) { throw new Error('Yüklenen veride yönetici hesabı yok.'); }
  const acikOturum = ISG.yetki.oturum();
  if (!acikOturum || !ISG.yetki.rolTanimi(acikOturum.rol).yonetir) {
    throw new Error('Yedekte yönetici (yonetir) yetkili hesap yok; yazma kontrolleri yapılamaz. ' +
      'Yedeğe bir yönetici hesabı ekleyip yeniden deneyin.');
  }
  if (ISG.uygulama && typeof ISG.uygulama.girisSonrasi === 'function') { ISG.uygulama.girisSonrasi(); }
  await bekle(200);

  const isyerleri = D.al().isyerleri || [];
  const kurumlar = D.al().kurumlar || [];
  const kurumAdi = (isyeri) => {
    const kurum = kurumlar.filter((k) => k.id === isyeri.kurumId)[0];
    return kurum ? (kurum.ad || 'Kurum') : 'Kurum belirtilmedi';
  };
  const metin = (oge) => (oge ? oge.textContent.replace(/\s+/g, ' ').trim() : '');
  const bicim = (deger) => (deger ? B.tarih(deger) : 'Girilmedi');
  const kartTarihleri = (isyeriId) => {
    const kart = doc.querySelector('.risk-kart[data-acil-kart][data-id="' + isyeriId + '"]');
    if (!kart) { return null; }
    const harita = {};
    kart.querySelectorAll('.mini-kutu').forEach((kutu) => {
      const etiket = metin(kutu.querySelector('span'));
      if (etiket) { harita[etiket] = metin(kutu.querySelector('b')); }
    });
    return harita;
  };
  const diyalogOku = async (isyeriId) => {
    const dugme = doc.querySelector('[data-islem="acil-plan"][data-id="' + isyeriId + '"]');
    if (!dugme) { return null; }
    dugme.click();
    await bekle(25);
    const form = doc.getElementById('acilPlanForm');
    const okunan = {
      hazirlanma: (form && form.elements.hazirlanma ? form.elements.hazirlanma.value : '') || '',
      sonYenileme: (form && form.elements.sonYenileme ? form.elements.sonYenileme.value : '') || '',
      tatbikat: (form && form.elements.tatbikat ? form.elements.tatbikat.value : '') || '',
      serit: metin(doc.getElementById('acilTarihUyari')),
      baslik: metin(doc.getElementById('acilPlanBaslik'))
    };
    const diyalog = doc.getElementById('acilPlanDiyalog');
    if (diyalog) { diyalog.removeAttribute('open'); }
    return okunan;
  };

  w.location.hash = '#acil';
  await bekle(250);
  const arama = doc.querySelector('[data-ui="acilArama"]');
  if (arama) { arama.value = ''; }

  console.log('\n1) Her işyeri: depo ↔ kayıt diyaloğu ↔ mevcut durum kartı');
  const gorulenIdler = {};
  const gorulenIsyerleri = {};
  for (let sira = 0; sira < isyerleri.length; sira += 1) {
    const isyeri = isyerleri[sira];
    const kayit = ISG.acilPlanKaydi(D.al(), isyeri.id);
    const ozet = ISG.acilPlanOzeti(isyeri, kayit);
    const kart = kartTarihleri(isyeri.id);
    const diyalog = await diyalogOku(isyeri.id);
    const etiket = '[sıra ' + (sira + 1) + '] ' + isyeri.ad + ' (' + kurumAdi(isyeri) + ')';

    kontrol(etiket + ' · kayıt bu işyerine ait', !kayit || String(kayit.isyeriId) === String(isyeri.id),
      kayit ? 'kayit.isyeriId=' + kayit.isyeriId : 'kayıt yok');
    kontrol(etiket + ' · kayıt kimliği benzersiz ve dolu', !kayit || (!!kayit.id && !gorulenIdler[kayit.id]),
      kayit ? String(kayit.id) : 'kayıt yok');
    if (kayit && kayit.id) { gorulenIdler[kayit.id] = true; }
    kontrol(etiket + ' · işyeri başına tek kayıt', !gorulenIsyerleri[isyeri.id]);
    gorulenIsyerleri[isyeri.id] = true;

    kontrol(etiket + ' · kart bulundu', !!kart, kart ? '' : '#acil kartı yok');
    kontrol(etiket + ' · kayıt diyaloğu açıldı', !!diyalog, diyalog ? '' : 'plan düğmesi yok');
    if (!kart || !diyalog) { continue; }

    const alanEtiketleri = { hazirlanma: 'İlk hazırlanma', sonYenileme: 'Son yenileme', tatbikat: 'Son tatbikat' };
    ['hazirlanma', 'sonYenileme', 'tatbikat'].forEach((alan) => {
      const depoDeger = String((kayit && kayit[alan]) || '');
      kontrol(etiket + ' · diyalog ' + alan + ' = depo', diyalog[alan] === depoDeger,
        'diyalog=' + diyalog[alan] + ' depo=' + depoDeger);
      const beklenen = depoDeger
        ? (ISG.tarihGecerliMi(depoDeger) ? bicim(depoDeger) : 'Geçersiz: ' + depoDeger)
        : 'Girilmedi';
      kontrol(etiket + ' · kart ' + alanEtiketleri[alan] + ' = depo',
        kart[alanEtiketleri[alan]] === beklenen,
        'kart=' + kart[alanEtiketleri[alan]] + ' beklenen=' + beklenen);
    });

    kontrol(etiket + ' · kart "En geç yenileme" = hesap',
      kart['En geç yenileme'] === (ozet.enGec ? bicim(ozet.enGec) : 'Girilmedi'),
      'kart=' + kart['En geç yenileme'] + ' hesap=' + (ozet.enGec || 'yok'));
    kontrol(etiket + ' · tatbikat yenileme dayanağı değil', ozet.esasAlani !== 'tatbikat',
      'esasAlani=' + ozet.esasAlani);
    if (ozet.esas && ozet.sinif) {
      kontrol(etiket + ' · yenileme aralığı tehlike sınıfından (' + ozet.sinif.acilYenilemeYil + ' yıl)',
        ozet.enGec === ISG.yilEkle(ozet.esas, ozet.sinif.acilYenilemeYil),
        'enGec=' + ozet.enGec);
    }
    if (!sessiz) {
      console.log('       depo: h=' + (ozet.hazirlanma || '-') + ' sy=' + (ozet.sonYenileme || '-') +
        ' t=' + (ozet.tatbikat || '-') + ' | en geç=' + (ozet.enGec || '-') + ' | durum=' + ozet.durum +
        ' | kart: ' + (kart['İlk hazırlanma'] || '?') + ' / ' + (kart['Son yenileme'] || '?') + ' / ' +
        (kart['Son tatbikat'] || '?'));
    }
  }
  kontrol('Kayıt sayısı işyeri sayısını aşmıyor (mükerrer kopya yok)',
    D.al().acilPlanlar.length <= isyerleri.length,
    D.al().acilPlanlar.length + ' kayıt / ' + isyerleri.length + ' işyeri');
  kontrol('Sahipsiz plan kaydı yok',
    D.al().acilPlanlar.every((k) => isyerleri.some((i) => String(i.id) === String(k.isyeriId))));


  /* 2) İzolasyon: her işyerine farklı tarih yazılır; komşu işyerleri değişmemeli */
  console.log('\n2) İşyeri izolasyonu: her işyerine ayrı tarih yazılıyor');
  const bulutEsik = JSON.parse(JSON.stringify(D.al())); /* eski bulut kopyası */
  const gunMetni = (fark) => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - fark);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  const kayitSayisiOnce = D.al().acilPlanlar.length;
  const beklenen = [];
  isyerleri.forEach((isyeri, indeks) => {
    const tarih = gunMetni(indeks + 1);
    beklenen.push(tarih);
    D.acilPlanKaydet(isyeri.id, { hazirlanma: tarih, sonYenileme: '', tatbikat: '' });
  });
  kontrol('Yazma kayıt sayısını çoğaltmadı', D.al().acilPlanlar.length === kayitSayisiOnce,
    kayitSayisiOnce + ' → ' + D.al().acilPlanlar.length);
  isyerleri.forEach((isyeri, indeks) => {
    const kayit = ISG.acilPlanKaydi(D.al(), isyeri.id) || {};
    kontrol('[sıra ' + (indeks + 1) + '] ' + isyeri.ad + ' · kendi tarihini koruyor',
      kayit.hazirlanma === beklenen[indeks] && kayit.sonYenileme === '' && kayit.tatbikat === '',
      'h=' + (kayit.hazirlanma || '-') + ' sy=' + (kayit.sonYenileme || '-') + ' t=' + (kayit.tatbikat || '-'));
  });
  kontrol('Farklı işyerlerinin tarihleri birbirine karışmadı',
    new Set(D.al().acilPlanlar.map((k) => String(k.hazirlanma))).size === isyerleri.length);

  /* Kaydedilen değer ekrana da yansımalı: kart ve diyalog yeniden okunur.
     Sayfa yeniden çizilir (hash değişimi tam çizim tetikler); aksi hâlde kart
     eski DOM'da kalır. */
  w.location.hash = '#genel';
  await bekle(120);
  w.location.hash = '#acil';
  await bekle(250);
  const ornekler = [0, isyerleri.length - 1].filter((i, s, dizi) => i >= 0 && dizi.indexOf(i) === s);
  for (const indeks of ornekler) {
    const isyeri = isyerleri[indeks];
    const form = await diyalogOku(isyeri.id);
    const kart = kartTarihleri(isyeri.id);
    kontrol('[sıra ' + (indeks + 1) + '] kaydettikten sonra diyalog güncel',
      !!form && form.hazirlanma === beklenen[indeks], form ? form.hazirlanma : 'diyalog yok');
    kontrol('[sıra ' + (indeks + 1) + '] kaydettikten sonra kart güncel',
      !!kart && kart['İlk hazırlanma'] === bicim(beklenen[indeks]),
      kart ? kart['İlk hazırlanma'] : 'kart yok');
  }

  /* 3) Bulut birleşimi: eski bulut kopyası yeni tarihi EZMEMELİ */
  console.log('\n3) Bulut birleşimi: eski kopya yeni tarihi ezmiyor');
  const yerelKopya = JSON.parse(JSON.stringify(D.al()));
  const birlesik = D.birlestir(yerelKopya, bulutEsik).veri;
  isyerleri.forEach((isyeri, indeks) => {
    const kayit = ISG.acilPlanKaydi(birlesik, isyeri.id) || {};
    kontrol('[sıra ' + (indeks + 1) + '] birleşim sonrası tarih korunuyor',
      kayit.hazirlanma === beklenen[indeks] && kayit.sonYenileme === '' && kayit.tatbikat === '',
      'h=' + (kayit.hazirlanma || '-') + ' sy=' + (kayit.sonYenileme || '-') + ' t=' + (kayit.tatbikat || '-'));
  });
  kontrol('Birleşimde işyeri başına tek kayıt', birlesik.acilPlanlar.length === isyerleri.length,
    birlesik.acilPlanlar.length + ' kayıt / ' + isyerleri.length + ' işyeri');
  const ikinci = D.birlestir(birlesik, JSON.parse(JSON.stringify(birlesik))).veri;
  kontrol('Birleşim tekrarında kayıt çoğalmıyor', ikinci.acilPlanlar.length === birlesik.acilPlanlar.length,
    ikinci.acilPlanlar.length + ' kayıt');

  /* 4) Göç öncesi kimliksiz eski kopya: yeni tarihi diriltmemeli, çoğalmamalı */
  console.log('\n4) Eski (kimliksiz) kopya ile birleşim');
  const eskiVeri = JSON.parse(JSON.stringify(birlesik));
  const hedefId = isyerleri[0].id;
  eskiVeri.acilPlanlar.push({
    isyeriId: hedefId, hazirlanma: '1990-01-01', sonYenileme: '1995-05-05', tatbikat: '1996-06-06'
  });
  const temiz = D.birlestir(eskiVeri, JSON.parse(JSON.stringify(eskiVeri))).veri;
  const hedefKayit = ISG.acilPlanKaydi(temiz, hedefId) || {};
  kontrol('Eski kopya yeni tarihi ezmiyor',
    hedefKayit.hazirlanma === beklenen[0] && hedefKayit.sonYenileme === '' && hedefKayit.tatbikat === '',
    'h=' + (hedefKayit.hazirlanma || '-') + ' sy=' + (hedefKayit.sonYenileme || '-') + ' t=' + (hedefKayit.tatbikat || '-'));
  kontrol('Aynı işyerine ikinci plan kaydı kalmıyor',
    temiz.acilPlanlar.filter((k) => String(k.isyeriId) === String(hedefId)).length === 1);
  kontrol('Birleşimden sonra her plan kaydı kimlikli', temiz.acilPlanlar.every((k) => !!k.id));
  kontrol('Birleşim tekrarı kayıt çoğaltmıyor',
    D.birlestir(temiz, JSON.parse(JSON.stringify(temiz))).veri.acilPlanlar.length === temiz.acilPlanlar.length);

  /* 5) Kalıcı yazım: localStorage'daki veri ekrandakiyle aynı olmalı */
  console.log('\n5) Kalıcı yazım (localStorage)');
  const ham = JSON.parse(w.localStorage.getItem(D.anahtar) || '{}');
  isyerleri.forEach((isyeri, indeks) => {
    const kayit = ISG.acilPlanKaydi(ham, isyeri.id) || {};
    kontrol('[sıra ' + (indeks + 1) + '] kalıcı kayıt ekrandakiyle aynı',
      kayit.hazirlanma === beklenen[indeks], 'kayıt=' + (kayit.hazirlanma || '-'));
  });
  kontrol('Kalıcı kayıtta plan kimlikleri dolu', (ham.acilPlanlar || []).every((k) => !!k.id));

  /* 6) Tarih kuralları (tek kaynak: ISG.acilPlanTarihKontrol / yilEkle) */
  console.log('\n6) Tarih kuralları');
  const ileri = gunMetni(-45);
  kontrol('Takvimde olmayan tarih reddedilir',
    ISG.acilPlanTarihKontrol({ hazirlanma: '2026-02-31' }, 'cokTehlikeli').gecerli === false);
  kontrol('İleri tarih reddedilir',
    ISG.acilPlanTarihKontrol({ hazirlanma: ileri }, 'cokTehlikeli').gecerli === false);
  kontrol('Son yenileme, hazırlanmadan eski olamaz',
    ISG.acilPlanTarihKontrol({ hazirlanma: '2025-01-01', sonYenileme: '2024-01-01' }, 'cokTehlikeli').gecerli === false);
  kontrol('Tatbikat tek başına plan tarihi sayılmaz',
    ISG.acilPlanOzeti({ tehlikeSinifi: 'cokTehlikeli' }, { tatbikat: '2025-01-01' }).enGec === '');
  kontrol('Tehlike sınıfı yokken yenileme aralığı uydurulmaz',
    ISG.acilPlanOzeti({ tehlikeSinifi: '' }, { hazirlanma: '2025-01-01' }).enGec === '');
  kontrol('Çok tehlikeli + 2 yıl = 20.08.2028', ISG.yilEkle('2026-08-20', 2) === '2028-08-20');
  kontrol('29 Şubat + 2 yıl bir gün kaymıyor', ISG.yilEkle('2024-02-29', 2) === '2026-02-28');
  kontrol('Az tehlikeli 6 yıl kuralı', ISG.acilPlanOzeti({ tehlikeSinifi: 'az' }, { hazirlanma: '2024-02-29' }).enGec === '2030-02-28');
  kontrol('Son yenileme girilince dayanak odur',
    ISG.acilPlanOzeti({ tehlikeSinifi: 'cokTehlikeli' }, { hazirlanma: '2024-08-20', sonYenileme: '2026-08-20' }).enGec === '2028-08-20');

  /* 7) İşyeri açılınca acil plan kaydı kendiliğinden doğar (idempotent) */
  console.log('\n7) Otomatik acil plan kaydı');
  const planSayisi = (veri, id) => (veri.acilPlanlar || []).filter((k) => String(k.isyeriId) === String(id)).length;
  const yeniIsyeri = {
    ad: 'OTOMATİK PLAN TEST İŞYERİ', tehlikeSinifi: 'tehlikeli', calisanSayisi: 12,
    sgkSicil: '2-9999-01-01-9999999-99', yetkili: 'Test Sorumlusu', adres: 'Aydın / Efeler', sektor: 'Test'
  };
  const kaydedilen = D.isyeriKaydet(yeniIsyeri);
  const otomatikPlan = ISG.acilPlanKaydi(D.al(), kaydedilen.id) || {};
  kontrol('İşyeri açılınca plan kaydı oluştu', !!otomatikPlan.id, 'id=' + (otomatikPlan.id || 'yok'));
  kontrol('Plan kimliği işyeri kimliğinden türetildi', otomatikPlan.id === 'ap-' + kaydedilen.id,
    'id=' + (otomatikPlan.id || 'yok') + ' / beklenen=ap-' + kaydedilen.id);
  kontrol('Plan işyerine bağlandı', String(otomatikPlan.isyeriId) === String(kaydedilen.id),
    'isyeriId=' + (otomatikPlan.isyeriId || 'yok'));
  kontrol('Otomatik planın üç tarihi de boş',
    otomatikPlan.hazirlanma === '' && otomatikPlan.sonYenileme === '' && otomatikPlan.tatbikat === '',
    'h=' + (otomatikPlan.hazirlanma || '-') + ' sy=' + (otomatikPlan.sonYenileme || '-') + ' t=' + (otomatikPlan.tatbikat || '-'));
  kontrol('Otomatik planın ekip listesi boş dizi', Array.isArray(otomatikPlan.ekip) && otomatikPlan.ekip.length === 0,
    'ekip=' + (Array.isArray(otomatikPlan.ekip) ? otomatikPlan.ekip.length : 'dizi değil'));

  const hamPlan = (JSON.parse(w.localStorage.getItem(D.anahtar) || '{}').acilPlanlar || [])
    .filter((k) => String(k.isyeriId) === String(kaydedilen.id));
  kontrol('Otomatik plan kalıcı yazıldı (yenilemede kaybolmaz)', hamPlan.length === 1 && hamPlan[0].id === 'ap-' + kaydedilen.id,
    hamPlan.length + ' kayıt');

  const bosOzet = ISG.acilPlanOzeti(D.al().isyerleri.filter((i) => String(i.id) === String(kaydedilen.id))[0], otomatikPlan);
  const bosRozet = ISG.sayfalar.acilPlanRozeti(bosOzet);
  kontrol('Boş plan listede "Plan tarihi girilmedi" rozetiyle görünür',
    bosRozet.indexOf('Plan tarihi girilmedi') >= 0 && bosRozet.indexOf('Plan geçerli') < 0, bosRozet);

  /* Düzenleme yolu (aynı işyeri yeniden kaydedilir): plan çoğalmaz. */
  D.isyeriKaydet(Object.assign({}, kaydedilen, { calisanSayisi: 14 }));
  kontrol('İşyeri yeniden kaydedilince plan çoğalmıyor', planSayisi(D.al(), kaydedilen.id) === 1,
    planSayisi(D.al(), kaydedilen.id) + ' kayıt');

  /* Kullanıcı tarih girerse kayıt aynı kalır, tarih yazılır. */
  const yazilanTarih = gunMetni(30);
  D.acilPlanKaydet(kaydedilen.id, { hazirlanma: yazilanTarih });
  const tarihliPlan = ISG.acilPlanKaydi(D.al(), kaydedilen.id) || {};
  kontrol('Tarih aynı plan kaydına yazıldı', tarihliPlan.id === 'ap-' + kaydedilen.id && tarihliPlan.hazirlanma === yazilanTarih,
    'id=' + (tarihliPlan.id || 'yok') + ' h=' + (tarihliPlan.hazirlanma || '-'));

  /* Bulut birleşimi: karşı tarafta plan yoksa otomatik kayıt geri gelir, varsa korunur. */
  const planliYerel = JSON.parse(JSON.stringify(D.al()));
  const plansizBulut = JSON.parse(JSON.stringify(D.al()));
  plansizBulut.acilPlanlar = plansizBulut.acilPlanlar.filter((k) => String(k.isyeriId) !== String(kaydedilen.id));
  const birlesim1 = D.birlestir(planliYerel, plansizBulut).veri;
  kontrol('Birleşimde eksik plan geri tamamlandı',
    planSayisi(birlesim1, kaydedilen.id) === 1 && (ISG.acilPlanKaydi(birlesim1, kaydedilen.id) || {}).hazirlanma === yazilanTarih,
    planSayisi(birlesim1, kaydedilen.id) + ' kayıt');
  const birlesim2 = D.birlestir(birlesim1, JSON.parse(JSON.stringify(birlesim1))).veri;
  kontrol('Birleşim tekrarında plan çoğalmıyor', planSayisi(birlesim2, kaydedilen.id) === 1,
    planSayisi(birlesim2, kaydedilen.id) + ' kayıt');
  kontrol('Birleşimde tüm plan kimlikleri dolu', (birlesim2.acilPlanlar || []).every((k) => !!k.id));

  /* Mevcut planlar dokunulmadan kalır (boş tarihli AYULAŞ dahil). isyerleri
     dizisi canlı referanstır: otomatik test işyeri de içine düşer, süzülür. */
  const demoIsyerleri = isyerleri.filter((isyeri) => String(isyeri.id) !== String(kaydedilen.id));
  const dokunulmamis = demoIsyerleri.every((isyeri, indeks) => {
    const kayit = ISG.acilPlanKaydi(birlesim2, isyeri.id) || {};
    return planSayisi(birlesim2, isyeri.id) === 1 && kayit.hazirlanma === beklenen[indeks];
  });
  kontrol('Var olan planlar (boş tarihli olanlar dahil) korunuyor', dokunulmamis,
    demoIsyerleri.map((isyeri, indeks) => {
      const kayit = ISG.acilPlanKaydi(birlesim2, isyeri.id) || {};
      return '[' + (indeks + 1) + '] ' + planSayisi(birlesim2, isyeri.id) + 'k h=' +
        (kayit.hazirlanma || '-') + '/beklenen=' + (beklenen[indeks] || '-');
    }).join(' | '));

  /* İşyeri silinince planı da gider ve birleşim onu geri getirmez. */
  D.isyeriSil(kaydedilen.id);
  kontrol('İşyeri silinince plan kaydı da silindi', planSayisi(D.al(), kaydedilen.id) === 0,
    planSayisi(D.al(), kaydedilen.id) + ' kayıt');
  const sonrakiBirlestir = D.birlestir(JSON.parse(JSON.stringify(D.al())), planliYerel).veri;
  kontrol('Silinen işyerinin planı birleşimle geri gelmiyor', planSayisi(sonrakiBirlestir, kaydedilen.id) === 0,
    planSayisi(sonrakiBirlestir, kaydedilen.id) + ' kayıt');

  /* 8) Sonuç */
  console.log('\n=== Sonuç: ' + gecen + ' geçti, ' + hata + ' başarısız ===');
  if (hata) {
    console.log('\nBaşarısız kontroller:');
    basarisizlar.forEach((metin) => console.log('  - ' + metin));
  }
  sunucu.close();
  dom.window.close();
  process.exit(hata ? 1 : 0);
})().catch((e) => {
  console.error('\nAraç çalıştırılamadı: ' + (e && e.stack ? e.stack : e));
  process.exit(1);
});


