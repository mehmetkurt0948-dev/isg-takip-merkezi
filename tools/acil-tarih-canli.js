/* İSG Takip Merkezi — CANLI acil durum planı tarih doğrulaması (salt okunur)
   Kullanım:
     node tools/acil-tarih-canli.js               # gerçek bulut satırını okur
     node tools/acil-tarih-canli.js --json        # makine okunur rapor
     node tools/acil-tarih-canli.js --sessiz      # yalnızca özet
     node tools/acil-tarih-canli.js --veri yedek.json   # yedek dosya (canlı DEĞİL)
     node tools/acil-tarih-canli.js --demo        # demo fixture (canlı DEĞİL)

   Ne yapar: `assets/js/bulut-kimlik.js` içindeki Supabase adresi, anon anahtar ve
   oda koduyla ÜRETİM verisinin tek satırını **yalnızca GET** ile okur; sonra bu
   veriyi jsdom içinde uygulamaya yükleyip HER kurum ve HER işyeri için:
     • İlk hazırlanma / son yenileme / son tatbikat tarihlerini kayıt ekranı,
       mevcut durum kartı, veri deposu ve kalıcı depo arasında karşılaştırır.
     • İşyeri kimliği eşleşmesini, kimliksiz ve mükerrer kayıtları, sahipsiz
       kayıtları listeler.
     • Bulut birleşimi (kaydet → çek → birleştir) sonrası tarihlerin korunup
       korunmadığını bellekte simüle eder.

   GÜVENLİK: hiçbir yazma isteği gönderilmez. jsdom içinde `fetch` kapatılır;
   bulut satırına POST/PATCH/DELETE çıkması teknik olarak engellenir. Gerçek veri
   değiştirilmez, silinmez, otomatik düzeltilmez — araç yalnızca raporlar.

   Çıkış kodu: 0 = tutarsızlık yok, 1 = tutarsızlık/erişim hatası var. */
'use strict';

const path = require('path');
const fs = require('fs');
const http = require('http');
const vm = require('vm');
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
const jsonCikti = argumanlar.includes('--json');
const sessiz = argumanlar.includes('--sessiz') || jsonCikti;
const demoKipi = argumanlar.includes('--demo');
const veriDosyasi = (() => {
  const yer = argumanlar.indexOf('--veri');
  return yer > -1 ? argumanlar[yer + 1] : '';
})();

const yaz = (metin) => { if (!jsonCikti) { console.log(metin); } };
const bosSatir = () => yaz('');

/* ---------- Canlı veri okuma (yalnızca GET) ---------- */

function kimlikOku() {
  const sanal = {};
  vm.runInNewContext(fs.readFileSync(path.join(kok, 'assets', 'js', 'bulut-kimlik.js'), 'utf8'),
    { window: sanal, global: sanal });
  const kimlik = sanal.ISG_KIMLIK;
  if (!kimlik || !kimlik.url || !kimlik.anahtar || !kimlik.oda) {
    throw new Error('assets/js/bulut-kimlik.js içinde url/anahtar/oda dolu değil; canlı veri okunamaz.');
  }
  return kimlik;
}

async function canliSatirOku(kimlik) {
  const adres = kimlik.url.replace(/\/+$/, '') + '/rest/v1/isg_veri'
    + '?select=oda,guncelleme,veri&oda=eq.' + encodeURIComponent(kimlik.oda);
  let yanit;
  try {
    yanit = await fetch(adres, {
      method: 'GET',
      headers: {
        apikey: kimlik.anahtar,
        Authorization: 'Bearer ' + kimlik.anahtar,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });
  } catch (hata) {
    throw new Error('Supabase adresine ulaşılamadı (' + kimlik.url + '): ' + (hata && hata.message ? hata.message : hata));
  }
  const metin = await yanit.text();
  if (!yanit.ok) {
    throw new Error('Bulut okuması reddedildi (HTTP ' + yanit.status + '): ' + metin.slice(0, 300));
  }
  let satirlar;
  try { satirlar = JSON.parse(metin); } catch (hata) { satirlar = null; }
  if (!Array.isArray(satirlar)) { throw new Error('Bulut yanıtı beklenen JSON dizisi değil.'); }
  return { satirlar, adres };
}

/* ---------- jsdom sunucusu (yerel dosyalar; dış ağ kapalı) ---------- */

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

/* ---------- Ham veri denetimi (göç/kimlik öncesi gerçek kayıtlar) ---------- */

function hamDenetim(veri) {
  const planlar = Array.isArray(veri.acilPlanlar) ? veri.acilPlanlar : [];
  const isyerleri = Array.isArray(veri.isyerleri) ? veri.isyerleri : [];
  const kurumlar = Array.isArray(veri.kurumlar) ? veri.kurumlar : [];
  const isyeriIdleri = {};
  isyerleri.forEach((i) => { isyeriIdleri[String(i.id)] = i; });

  const kimliksiz = planlar.filter((k) => !k || !k.id || !String(k.id).trim());
  const kimlikSayaci = {};
  planlar.forEach((k) => {
    if (k && k.id) { kimlikSayaci[String(k.id)] = (kimlikSayaci[String(k.id)] || 0) + 1; }
  });
  const ciftKimlik = Object.keys(kimlikSayaci).filter((id) => kimlikSayaci[id] > 1);
  const isyeriSayaci = {};
  planlar.forEach((k) => {
    if (!k) { return; }
    const anahtar = String(k.isyeriId);
    isyeriSayaci[anahtar] = (isyeriSayaci[anahtar] || 0) + 1;
  });
  const mukerrerIsyeri = Object.keys(isyeriSayaci).filter((id) => isyeriSayaci[id] > 1);
  const sahipsiz = planlar.filter((k) => !isyeriIdleri[String(k && k.isyeriId)]);
  const bicimAykiri = planlar.filter((k) => k && k.id && k.isyeriId && String(k.id) !== 'ap-' + String(k.isyeriId));

  return {
    kurumSayisi: kurumlar.length,
    isyeriSayisi: isyerleri.length,
    planSayisi: planlar.length,
    kimliksiz: kimliksiz.length,
    ciftKimlik,
    mukerrerIsyeri,
    sahipsiz: sahipsiz.length,
    kimlikBicimiAykiri: bicimAykiri.map((k) => String(k.id)),
    planliIsyeri: Object.keys(isyeriSayaci).length
  };
}

function alanNormal(deger) {
  return deger === undefined || deger === null ? '' : String(deger).trim();
}


/* ---------- Ana akış ---------- */

(async () => {
  const rapor = {
    kaynakTuru: '',
    kaynakEtiketi: '',
    bulutAdresi: '',
    oda: '',
    bulutGuncelleme: '',
    semaSurumu: null,
    kurumlar: [],
    isyerleri: [],
    farklar: [],
    ham: null,
    birlesim: { denenen: 0, korunmayan: [], yerelDegisiklikDenenen: 0, yerelKaybi: [] },
    engellenenAgIstegi: 0,
    uyarilar: []
  };

  let kaynakVeri = null;

  if (demoKipi) {
    rapor.kaynakTuru = 'demo';
    rapor.kaynakEtiketi = 'DEMO VERİ (tools/demo-veri.js) — CANLI VERİ DEĞİLDİR';
  } else if (veriDosyasi) {
    const tam = path.resolve(process.cwd(), veriDosyasi);
    if (!fs.existsSync(tam)) { throw new Error('Veri dosyası bulunamadı: ' + tam); }
    rapor.kaynakTuru = 'yedek';
    rapor.kaynakEtiketi = 'YEDEK DOSYA (' + tam + ') — canlı bulut satırı değil';
    kaynakVeri = JSON.parse(fs.readFileSync(tam, 'utf8'));
    if (kaynakVeri && kaynakVeri.veri) { kaynakVeri = kaynakVeri.veri; }
    rapor.semaSurumu = kaynakVeri.surum === undefined ? null : kaynakVeri.surum;
    rapor.ham = hamDenetim(kaynakVeri);
    yaz('=== VERİ KAYNAĞI (YEDEK DOSYA) ===');
    yaz('Dosya        : ' + tam);
    yaz('Kapsam       : ' + rapor.ham.kurumSayisi + ' kurum, ' + rapor.ham.isyeriSayisi +
      ' işyeri, ' + rapor.ham.planSayisi + ' acil plan kaydı (canlı bulut DEĞİL)');
    bosSatir();
  } else {
    const kimlik = kimlikOku();
    const { satirlar } = await canliSatirOku(kimlik);
    rapor.kaynakTuru = 'canli';
    rapor.kaynakEtiketi = 'CANLI ÜRETİM VERİSİ (Supabase oda: ' + kimlik.oda + ')';
    rapor.bulutAdresi = kimlik.url;
    rapor.oda = kimlik.oda;

    yaz('=== CANLI VERİ KAYNAĞI ===');
    yaz('Sunucu       : ' + kimlik.url + '/rest/v1/isg_veri');
    yaz('Oda kodu     : ' + kimlik.oda);
    yaz('Sorgu        : GET ?select=oda,guncelleme,veri&oda=eq.' + kimlik.oda + '   (yalnızca okuma)');
    yaz('Dönen satır  : ' + satirlar.length);

    if (satirlar.length !== 1) {
      rapor.uyarilar.push('Oda koduna ait satır sayısı 1 değil: ' + satirlar.length +
        ' (0 ise oda kodu hatalı ya da tablo boş)');
      if (satirlar.length === 0) {
        throw new Error('Canlı bulut satırı bulunamadı (oda: ' + kimlik.oda + '); doğrulama yapılamaz.');
      }
    }
    const satir = satirlar[0];
    rapor.bulutGuncelleme = String(satir.guncelleme || '');
    kaynakVeri = satir.veri;
    if (!kaynakVeri || !Array.isArray(kaynakVeri.isyerleri)) {
      throw new Error('Bulut satırındaki veri beklenen biçimde değil (isyerleri dizisi yok).');
    }
    rapor.semaSurumu = kaynakVeri.surum === undefined ? null : kaynakVeri.surum;
    rapor.ham = hamDenetim(kaynakVeri);

    yaz('Bulut damgası: ' + rapor.bulutGuncelleme + '   |   veri.surum: ' + rapor.semaSurumu);
    yaz('Kapsam       : ' + rapor.ham.kurumSayisi + ' kurum, ' + rapor.ham.isyeriSayisi +
      ' işyeri, ' + rapor.ham.planSayisi + ' acil plan kaydı');
    bosSatir();
  }


  /* 1) jsdom: uygulamayı yükle; bulut çağrılarını kes */
  const { sunucu, port } = await sunucuBaslat();
  const sanalKonsol = new VirtualConsole();
  sanalKonsol.on('jsdomError', (e) => {
    const mesaj = String(e && e.message ? e.message : e);
    if (/Not implemented/.test(mesaj) && /scrollTo/.test(mesaj)) { return; }
    rapor.uyarilar.push('jsdom: ' + mesaj);
  });

  const dom = await JSDOM.fromURL('http://127.0.0.1:' + port + '/index.html', {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: sanalKonsol,
    beforeParse(win) {
      /* Tek ağ istisnası yerel sunucudur; bulut istekleri burada kesilir.
         Böylece doğrulama sırasında üretim verisine yazma imkânı kalmaz. */
      win.fetch = function (adres) {
        rapor.engellenenAgIstegi += 1;
        return Promise.reject(new Error('Ağ kapalı: canlı doğrulama salt okunurdur (' +
          String(adres).slice(0, 80) + ')'));
      };
      try { win.localStorage.setItem('isgtakip.bulut.kapali', '1'); } catch (hata) { /* yok say */ }
    }
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

  const oturumAcYonetici = () => {
    const kullanicilar = D.al().kullanicilar || [];
    const aday = kullanicilar.filter((k) => {
      return k && k.aktif !== false && ISG.yetki.rolTanimi(k.rol).yonetir;
    })[0] || kullanicilar[0];
    if (!aday) { return null; }
    ISG.yetki.oturumAc(aday);
    return aday;
  };
  if (!oturumAcYonetici()) { throw new Error('Veride oturum açılabilecek kullanıcı yok.'); }

  /* 2) Doğrulanacak kümeyi tarayıcı belleğine yükle */
  if (rapor.kaynakTuru === 'demo') {
    w.eval(fs.readFileSync(path.join(kok, 'tools', 'demo-veri.js'), 'utf8'));
    const demo = w.ISG.ORNEK_VERI();
    delete w.ISG.ORNEK_VERI;
    D.iceAktar(JSON.stringify(demo));
    kaynakVeri = demo;
    rapor.semaSurumu = demo.surum === undefined ? null : demo.surum;
    rapor.ham = hamDenetim(demo);
  } else {
    D.iceAktar(JSON.stringify(kaynakVeri));
  }
  oturumAcYonetici();
  /* Göç (v11) bellekte çalıştı; kalıcı depoya yazımı da doğrulanabilsin diye
     jsdom'un kendi localStorage'ına yazılır (tarayıcı belleği; buluta gitmez). */
  if (typeof D.kaydet === 'function') { D.kaydet(); }
  if (ISG.uygulama && typeof ISG.uygulama.girisSonrasi === 'function') { ISG.uygulama.girisSonrasi(); }
  await bekle(250);

  const alinan = D.al();
  const isyerleri = alinan.isyerleri || [];
  const kurumlar = alinan.kurumlar || [];
  const kurumAdi = (isyeri) => {
    const kurum = kurumlar.filter((k) => String(k.id) === String(isyeri.kurumId))[0];
    return kurum ? (kurum.ad || 'Kurum') : 'Kurum belirtilmedi';
  };
  const metin = (oge) => (oge ? oge.textContent.replace(/\s+/g, ' ').trim() : '');
  const bicim = (deger) => (deger ? B.tarih(deger) : 'Girilmedi');

  /* Referans: göç öncesi gerçek bulut kopyası (karşılaştırma tabanı). */
  const bulutKopya = kaynakVeri ? JSON.parse(JSON.stringify(kaynakVeri)) : null;
  const bulutTarihleri = {};
  isyerleri.forEach((isyeri) => {
    const kayit = ((bulutKopya || {}).acilPlanlar || []).filter((k) => {
      return k && String(k.isyeriId) === String(isyeri.id);
    })[0] || null;
    bulutTarihleri[String(isyeri.id)] = {
      hazirlanma: alanNormal(kayit && kayit.hazirlanma),
      sonYenileme: alanNormal(kayit && kayit.sonYenileme),
      tatbikat: alanNormal(kayit && kayit.tatbikat),
      kayitId: kayit && kayit.id ? String(kayit.id) : '',
      varMi: !!kayit
    };
  });


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
      tatbikat: (form && form.elements.tatbikat ? form.elements.tatbikat.value : '') || ''
    };
    const diyalog = doc.getElementById('acilPlanDiyalog');
    if (diyalog) { diyalog.removeAttribute('open'); }
    return okunan;
  };

  w.location.hash = '#acil';
  await bekle(300);
  const arama = doc.querySelector('[data-ui="acilArama"]');
  if (arama) { arama.value = ''; }

  const alanEtiketleri = { hazirlanma: 'İlk hazırlanma', sonYenileme: 'Son yenileme', tatbikat: 'Son tatbikat' };
  const alanlar = ['hazirlanma', 'sonYenileme', 'tatbikat'];

  const farkEkle = (bilgi, alan, degerler, not) => {
    const fark = {
      kurum: bilgi.kurum,
      isyeri: bilgi.isyeri,
      isyeriId: bilgi.isyeriId,
      kayitId: bilgi.kayitId,
      alan: alanEtiketleri[alan] || alan,
      degerler
    };
    if (not) { fark.not = not; }
    rapor.farklar.push(fark);
    return fark;
  };


  /* 3) HER işyeri için: bulut ↔ depo ↔ kayıt diyaloğu ↔ kart ↔ kalıcı depo */
  yaz('');
  yaz('=== 1) İŞYERİ BAZINDA TARİH EŞLEŞMESİ ===');
  yaz('Kaynak: ' + rapor.kaynakEtiketi);
  for (let sira = 0; sira < isyerleri.length; sira += 1) {
    const isyeri = isyerleri[sira];
    const kayit = ISG.acilPlanKaydi(alinan, isyeri.id) || {};
    const ozet = ISG.acilPlanOzeti(isyeri, kayit);
    const bulut = bulutTarihleri[String(isyeri.id)] || { varMi: false };
    const kart = kartTarihleri(isyeri.id);
    const diyalog = await diyalogOku(isyeri.id);
    const kalici = (() => {
      try {
        const ham = JSON.parse(w.localStorage.getItem(D.anahtar) || '{}');
        return ISG.acilPlanKaydi(ham, isyeri.id) || {};
      } catch (hata) { return {}; }
    })();

    const bilgi = {
      kurum: kurumAdi(isyeri),
      isyeri: isyeri.ad || '(ad yok)',
      isyeriId: String(isyeri.id),
      kayitId: kayit.id ? String(kayit.id) : (bulut.kayitId || '')
    };
    const satir = {
      kurum: bilgi.kurum,
      isyeri: bilgi.isyeri,
      isyeriId: bilgi.isyeriId,
      kayitId: bilgi.kayitId,
      kayitVarMi: !!kayit.id,
      diyalogVarMi: !!diyalog,
      kartVarMi: !!kart,
      tarihler: {},
      enGec: ozet.enGec || '',
      durum: ozet.durum || '',
      farkSayisi: 0
    };

    if (!diyalog || !kart) {
      rapor.uyarilar.push(bilgi.isyeri + ': ' +
        (!kart ? '#acil kartı bulunamadı' : 'kayıt diyaloğu açılamadı') +
        ' (tarih karşılaştırması yapılamadı)');
    }

    alanlar.forEach((alan) => {
      const beklenen = alanNormal(bulut[alan]);
      const degerler = {
        bulut: beklenen,
        depo: alanNormal(kayit[alan]),
        diyalog: diyalog ? alanNormal(diyalog[alan]) : '(yok)',
        kart: kart ? (kart[alanEtiketleri[alan]] || '(yok)') : '(yok)',
        kalici: alanNormal(kalici[alan])
      };
      satir.tarihler[alan] = degerler;
      const kartBeklenen = beklenen
        ? (ISG.tarihGecerliMi(beklenen) ? bicim(beklenen) : 'Geçersiz: ' + beklenen)
        : 'Girilmedi';
      if (degerler.depo !== beklenen) {
        farkEkle(bilgi, alan, degerler, 'veri deposu bulutla aynı değil');
        satir.farkSayisi += 1;
      }
      if (diyalog && degerler.diyalog !== beklenen) {
        farkEkle(bilgi, alan, degerler, 'kayıt ekranı bulutla aynı değil');
        satir.farkSayisi += 1;
      }
      if (kart && degerler.kart !== kartBeklenen) {
        farkEkle(bilgi, alan, degerler, 'mevcut durum kartı bulutla aynı değil');
        satir.farkSayisi += 1;
      }
      if (degerler.kalici !== beklenen) {
        farkEkle(bilgi, alan, degerler, 'kalıcı depo (localStorage) bulutla aynı değil');
        satir.farkSayisi += 1;
      }
    });


    /* Kart "En geç yenileme" tek kuraldan mı ve tatbikat dayanak sayılmıyor mu? */
    if (kart) {
      const kartEnGec = kart['En geç yenileme'] || '';
      const beklenenEnGec = ozet.enGec ? bicim(ozet.enGec) : 'Girilmedi';
      if (kartEnGec !== beklenenEnGec) {
        farkEkle(bilgi, 'enGec', { kart: kartEnGec, hesap: beklenenEnGec },
          'kart "En geç yenileme" hesaptan farklı');
        satir.farkSayisi += 1;
      }
      if (ozet.esasAlani === 'tatbikat') {
        farkEkle(bilgi, 'dayanak', { esasAlani: 'tatbikat' }, 'tatbikat yenileme dayanağı sayılmış');
        satir.farkSayisi += 1;
      }
    }

    /* Bulut kopyasındaki kayıt kimliği ile ekrandaki kayıt kimliği aynı mı? */
    if (bulut.kayitId && bulut.kayitId !== bilgi.kayitId) {
      farkEkle(bilgi, 'kayitKimligi', { bulut: bulut.kayitId, ekran: bilgi.kayitId },
        'kayıt kimliği bulutla eşleşmiyor');
      satir.farkSayisi += 1;
    }

    rapor.isyerleri.push(satir);

    if (!sessiz) {
      yaz('');
      yaz('[' + (sira + 1) + '/' + isyerleri.length + '] ' + satir.isyeri + '  ·  ' + satir.kurum);
      yaz('    işyeriId=' + satir.isyeriId + '   kayıtId=' + (satir.kayitId || '(yok)') +
        (satir.kayitVarMi ? '' : '   [bu işyerinde plan kaydı yok]'));
      alanlar.forEach((alan) => {
        const d = satir.tarihler[alan];
        const ayni = d.bulut === d.depo && d.bulut === d.diyalog && d.kalici === d.bulut;
        yaz('    ' + (alanEtiketleri[alan] + '                ').slice(0, 17) +
          ' bulut=' + (d.bulut || '—') + ' | depo=' + (d.depo || '—') + ' | ekran=' + (d.diyalog || '—') +
          ' | kart=' + d.kart + ' | kalıcı=' + (d.kalici || '—') + '   ' + (ayni ? 'OK' : 'FARK'));
      });
      yaz('    En geç yenileme: ' + (ozet.enGec ? bicim(ozet.enGec) : 'Girilmedi') +
        '   |   durum: ' + (satir.durum || '-') + '   |   bu işyerinde fark: ' + satir.farkSayisi);
    }
  }


  /* 4) Mükerrer / kimliksiz / sahipsiz kayıtlar
     Ölçüt HAM veridir (canlı kayıt neyse odur); göç sonrası durum yalnızca
     bilgi olarak yazılır. Böylece göçün maskelediği bir sorun görünmez kalmaz. */
  const gocSonrasi = hamDenetim(D.al());
  const hamKimliksiz = rapor.ham ? rapor.ham.kimliksiz : gocSonrasi.kimliksiz;
  const hamMukerrer = rapor.ham ? rapor.ham.mukerrerIsyeri : gocSonrasi.mukerrerIsyeri;
  const hamCiftKimlik = rapor.ham ? rapor.ham.ciftKimlik : gocSonrasi.ciftKimlik;
  const hamSahipsiz = rapor.ham ? rapor.ham.sahipsiz : gocSonrasi.sahipsiz;
  const kimliksiz = hamKimliksiz;
  const mukerrer = hamMukerrer;

  yaz('');
  yaz('=== 2) MÜKERRER / KİMLİKSİZ / SAHİPSİZ PLAN KAYITLARI ===');
  yaz('Ham veri (olduğu gibi): ' + (rapor.ham ? rapor.ham.planSayisi + ' kayıt, ' + rapor.ham.kimliksiz +
    ' kimliksiz, ' + rapor.ham.mukerrerIsyeri.length + ' mükerrer işyeri, ' + rapor.ham.sahipsiz +
    ' sahipsiz' : '(yok)'));
  yaz('Göç sonrası (bellek)  : ' + gocSonrasi.planSayisi + ' kayıt, ' + gocSonrasi.kimliksiz +
    ' kimliksiz, ' + gocSonrasi.mukerrerIsyeri.length + ' mükerrer işyeri, ' + gocSonrasi.sahipsiz +
    ' sahipsiz');
  if (kimliksiz) { rapor.farklar.push({ alan: 'kimliksiz kayıt', degerler: { sayi: kimliksiz } }); }
  mukerrer.forEach((isyeriId) => {
    const isyeri = isyerleri.filter((i) => String(i.id) === String(isyeriId))[0];
    rapor.farklar.push({
      kurum: isyeri ? kurumAdi(isyeri) : '?',
      isyeri: isyeri ? (isyeri.ad || '(ad yok)') : '(bilinmeyen işyeri)',
      isyeriId: String(isyeriId),
      kayitId: '',
      alan: 'mükerrer kayıt',
      degerler: {
        kayitSayisi: ((bulutKopya || D.al()).acilPlanlar || []).filter((k) => {
          return String(k && k.isyeriId) === String(isyeriId);
        }).length
      }
    });
  });
  if (hamCiftKimlik.length) {
    rapor.farklar.push({ alan: 'çift kayıt kimliği', degerler: { kimlikler: hamCiftKimlik } });
  }
  if (hamSahipsiz) {
    rapor.farklar.push({ alan: 'sahipsiz kayıt', degerler: { sayi: hamSahipsiz } });
  }
  if (!kimliksiz && !mukerrer.length && !hamCiftKimlik.length && !hamSahipsiz) {
    yaz('Sonuç: mükerrer, kimliksiz, çift kimlikli ve sahipsiz kayıt YOK.');
  }



  /* 5) Bulut senkronizasyonu: kaydet → çek → birleştir (bellek simülasyonu) */
  yaz('');
  yaz('=== 3) BULUT SENKRONİZASYONU SONRASI KORUMA (bellek simülasyonu) ===');
  yaz('Gerçek veri değiştirilmedi: birleştirme yalnızca Node belleğinde çalışır.');
  const kopyala = (nesne) => JSON.parse(JSON.stringify(nesne));
  const testTarihi = (sira) => '2019-01-' + String((sira % 28) + 1).padStart(2, '0');

  if (bulutKopya) {
    for (let sira = 0; sira < isyerleri.length; sira += 1) {
      const isyeri = isyerleri[sira];
      const bulut = bulutTarihleri[String(isyeri.id)] || {};
      const bilgi = {
        kurum: kurumAdi(isyeri),
        isyeri: isyeri.ad || '(ad yok)',
        isyeriId: String(isyeri.id),
        kayitId: ''
      };

      /* A) Kullanıcı tarihleri yeniden kaydeder, ardından eski bulut kopyası
         birleşime girer: değerler korunmalı, kayıt çoğalmamalı. */
      const yazilacak = {
        hazirlanma: bulut.varMi ? bulut.hazirlanma : testTarihi(sira),
        sonYenileme: bulut.varMi ? bulut.sonYenileme : '',
        tatbikat: bulut.varMi ? bulut.tatbikat : ''
      };
      const yazilan = D.acilPlanKaydet(isyeri.id, yazilacak);
      bilgi.kayitId = yazilan && yazilan.id ? String(yazilan.id) : '';
      rapor.birlesim.denenen += 1;
      const birlesik = D.birlestir(kopyala(D.al()), kopyala(bulutKopya)).veri;
      const okunan = ISG.acilPlanKaydi(birlesik, isyeri.id) || {};
      const ayniIsyeriKayitlari = (birlesik.acilPlanlar || []).filter((k) => {
        return k && String(k.isyeriId) === String(isyeri.id);
      });

      const sorunlar = [];
      alanlar.forEach((alan) => {
        if (alanNormal(okunan[alan]) !== alanNormal(yazilacak[alan])) {
          sorunlar.push({ alan, beklenen: alanNormal(yazilacak[alan]), bulunan: alanNormal(okunan[alan]) });
        }
      });
      if (ayniIsyeriKayitlari.length !== 1) {
        sorunlar.push({ alan: 'kayıt sayısı', beklenen: '1', bulunan: String(ayniIsyeriKayitlari.length) });
      }
      if (sorunlar.length) {
        rapor.birlesim.korunmayan.push({
          kurum: bilgi.kurum,
          isyeri: bilgi.isyeri,
          isyeriId: bilgi.isyeriId,
          kayitId: bilgi.kayitId,
          sorunlar
        });
        rapor.farklar.push({
          kurum: bilgi.kurum,
          isyeri: bilgi.isyeri,
          isyeriId: bilgi.isyeriId,
          kayitId: bilgi.kayitId,
          alan: 'bulut birleşimi',
          degerler: { sorunlar: sorunlar.map((s) => s.alan + ': ' + s.bulunan + ' ≠ ' + s.beklenen).join('; ') }
        });
      }

      /* B) Yerel değişiklik: kullanıcı farklı bir tarih kaydeder, sonra eski
         bulut kopyası birleşime girer. Yeni değer korunmalı (bildirilen hata). */
      const yeniTarih = testTarihi(sira);
      D.acilPlanKaydet(isyeri.id, { hazirlanma: yeniTarih, sonYenileme: '', tatbikat: '' });
      const birlesikB = D.birlestir(kopyala(D.al()), kopyala(bulutKopya)).veri;
      const okunanB = ISG.acilPlanKaydi(birlesikB, isyeri.id) || {};
      const korunan = alanNormal(okunanB.hazirlanma) === yeniTarih;
      rapor.birlesim.yerelDegisiklikDenenen += 1;
      if (!korunan) {
        rapor.birlesim.yerelKaybi.push({
          kurum: bilgi.kurum,
          isyeri: bilgi.isyeri,
          isyeriId: bilgi.isyeriId,
          kayitId: bilgi.kayitId,
          yazilan: yeniTarih,
          okunan: alanNormal(okunanB.hazirlanma)
        });
        rapor.farklar.push({
          kurum: bilgi.kurum,
          isyeri: bilgi.isyeri,
          isyeriId: bilgi.isyeriId,
          kayitId: bilgi.kayitId,
          alan: 'bulut birleşimi (yerel değişiklik)',
          degerler: { yazilan: yeniTarih, okunan: alanNormal(okunanB.hazirlanma) }
        });
      }
      /* Bellekteki durumu gerçek değerlere geri al (yalnızca simülasyon). */
      D.acilPlanKaydet(isyeri.id, {
        hazirlanma: bulut.varMi ? bulut.hazirlanma : '',
        sonYenileme: bulut.varMi ? bulut.sonYenileme : '',
        tatbikat: bulut.varMi ? bulut.tatbikat : ''
      });

      if (!sessiz) {
        yaz('  ' + (sorunlar.length || !korunan ? 'FARK ' : 'OK   ') + bilgi.isyeri +
          ' (' + bilgi.kayitId + ')  kayıt=' + ayniIsyeriKayitlari.length +
          '  yerel değişiklik korundu=' + (korunan ? 'evet' : 'HAYIR') +
          (sorunlar.length ? '  -> ' + sorunlar.map((s) => s.alan).join(', ') : ''));
      }
    }
  } else {
    rapor.uyarilar.push('Birleşim simülasyonu atlandı: karşılaştırılacak bulut/yedek kopyası yok.');
  }


  /* 6) Özet rapor */
  const farkliIsyerleri = {};
  rapor.farklar.forEach((fark) => {
    const anahtar = fark.isyeriId || fark.isyeri || 'bilinmeyen';
    farkliIsyerleri[anahtar] = (farkliIsyerleri[anahtar] || 0) + 1;
  });
  const planliIsyeri = isyerleri.filter((i) => {
    const b = bulutTarihleri[String(i.id)] || {};
    return b.varMi;
  }).length;
  const dogrulanan = rapor.isyerleri.filter((i) => i.diyalogVarMi && i.kartVarMi).length;

  rapor.ozet = {
    kaynakTuru: rapor.kaynakTuru,
    kaynakEtiketi: rapor.kaynakEtiketi,
    bulutGuncelleme: rapor.bulutGuncelleme,
    semaSurumu: rapor.semaSurumu,
    toplamKurum: kurumlar.length,
    toplamIsyeri: isyerleri.length,
    planliIsyeri,
    plansizIsyeri: isyerleri.length - planliIsyeri,
    dogrulananIsyeri: dogrulanan,
    farkliIsyeriSayisi: Object.keys(farkliIsyerleri).length,
    farkSayisi: rapor.farklar.length,
    kimliksizKayit: kimliksiz,
    mukerrerIsyeri: mukerrer.length,
    sahipsizKayit: hamSahipsiz,
    birlesimDenenen: rapor.birlesim.denenen,
    birlesimKorunmayan: rapor.birlesim.korunmayan.length,
    yerelDegisiklikDenenen: rapor.birlesim.yerelDegisiklikDenenen,
    yerelKaybi: rapor.birlesim.yerelKaybi.length,
    engellenenAgIstegi: rapor.engellenenAgIstegi,
    uyariSayisi: rapor.uyarilar.length,
    sonuc: rapor.farklar.length === 0 ? 'TUTARLI' : 'TUTARSIZ'
  };
  rapor.kurumlar = kurumlar.map((k) => ({ id: String(k.id), ad: k.ad || '' }));

  if (jsonCikti) {
    console.log(JSON.stringify(rapor, null, 2));
  } else {
    yaz('');
    yaz('=== 4) RAPOR ===');
    yaz('Veri kaynağı            : ' + rapor.kaynakEtiketi);
    if (rapor.kaynakTuru === 'canli') {
      yaz('Bulut damgası (son yazım): ' + (rapor.bulutGuncelleme || '-'));
      yaz('Şema sürümü             : ' + (rapor.semaSurumu === null ? '-' : rapor.semaSurumu));
      yaz('Engellenen bulut isteği : ' + rapor.engellenenAgIstegi + ' (tümü fetch; yazma denemesi varsa burada kesildi)');
    }
    yaz('Toplam kurum            : ' + kurumlar.length);
    yaz('Toplam işyeri           : ' + isyerleri.length);
    yaz('Plan kaydı olan işyeri  : ' + planliIsyeri);
    yaz('Plan kaydı olmayan      : ' + (isyerleri.length - planliIsyeri) +
      ' (tarih uydurulmadı; kart "Girilmedi" göstermeli)');
    yaz('Doğrulanan işyeri       : ' + dogrulanan + ' / ' + isyerleri.length +
      (dogrulanan < isyerleri.length ? '  (kart/diyalog açılamayan var)' : ''));
    yaz('Tarih farkı bulunan     : ' + Object.keys(farkliIsyerleri).length + ' işyeri, ' +
      rapor.farklar.length + ' fark');
    yaz('Kimliksiz plan kaydı    : ' + kimliksiz);
    yaz('Mükerrer kayıtlı işyeri : ' + mukerrer.length);
    yaz('Sahipsiz plan kaydı     : ' + hamSahipsiz);
    yaz('Birleşim denemesi       : ' + rapor.birlesim.denenen + ' işyeri, korunmayan: ' +
      rapor.birlesim.korunmayan.length);
    yaz('Yerel değişiklik denemesi: ' + (rapor.birlesim.yerelDegisiklikDenenen || 0) +
      ' işyeri, kaybolan: ' + ((rapor.birlesim.yerelKaybi || []).length));

    if (rapor.farklar.length) {
      yaz('');
      yaz('--- SORUNLU KAYITLAR ---');
      rapor.farklar.forEach((fark, n) => {
        yaz(' ' + (n + 1) + ') ' + (fark.kurum || '-') + ' / ' + (fark.isyeri || '-') +
          '  ·  işyeriId=' + (fark.isyeriId || '-') + '  ·  kayıtId=' + (fark.kayitId || '-'));
        yaz('    alan: ' + fark.alan + (fark.not ? '  (' + fark.not + ')' : ''));
        Object.keys(fark.degerler || {}).forEach((anahtar) => {
          yaz('      ' + anahtar + '=' + fark.degerler[anahtar]);
        });
      });
    }

    if (rapor.uyarilar.length) {
      yaz('');
      yaz('--- UYARILAR ---');
      rapor.uyarilar.forEach((uyari) => yaz('  - ' + uyari));
    }

    yaz('');
    yaz('--- DEMO / CANLI AYRIMI ---');
    if (rapor.kaynakTuru === 'canli') {
      yaz('Bu rapor CANLI üretim verisiyle üretildi: ' + rapor.bulutAdresi + ' (oda ' + rapor.oda + ').');
      yaz('Demo verisi KULLANILMADI. Demo doğrulaması ayrı araçtır: node tools/acil-tarih-dogrula.js');
    } else if (rapor.kaynakTuru === 'yedek') {
      yaz('Bu rapor bir YEDEK DOSYA üzerinde üretildi; canlı bulut doğrulaması DEĞİLDİR.');
      yaz('Canlı doğrulama: node tools/acil-tarih-canli.js');
    } else {
      yaz('Bu rapor DEMO verisiyle üretildi; CANLI VERİ DOĞRULAMASI DEĞİLDİR.');
      yaz('Canlı doğrulama: node tools/acil-tarih-canli.js');
    }

    yaz('');
    yaz('=== SONUÇ: ' + rapor.ozet.sonuc + ' (' + rapor.farklar.length + ' fark) ===');
  }

  sunucu.close();
  dom.window.close();
  process.exit(rapor.farklar.length ? 1 : 0);
})().catch((e) => {
  console.error('\nAraç çalıştırılamadı: ' + (e && e.stack ? e.stack : e));
  process.exit(1);
});

