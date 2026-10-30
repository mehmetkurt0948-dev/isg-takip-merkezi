/* İSG Takip Merkezi — bulut (Supabase) eşitleme katmanı
   Yerel kayıt her zaman çalışır. Proje adresi, anon anahtar ve oda kodu
   girildiğinde aynı veri buluttaki tek satırda tutulur; aynı oda kodunu
   kullanan tüm cihazlar aynı kayıtları görür.

   Tasarım notları:
   - Yerel depo (ISG.depo) çalışmaya devam eder; bulut onun üzerine çalışan
     bir eşitleme katmanıdır (çevrimdışı kullanım bozulmaz).
   - `guncelleme` alanı ISO 8601 zaman damgasıdır; sunucu saati kullanılmaz,
     böylece cihazlar arasında sıralama yapılabilir.
   - Çakışmada son yazan kazanır (tüm veri kümesi tek satır olarak yazılır). */
(function (global) {
  'use strict';

  var ISG = global.ISG;

  var AYAR_ANAHTAR = 'isgtakip.bulut';
  var DURUM_ANAHTAR = 'isgtakip.bulut.durum';
  var TABLO = 'isg_veri';
  var VARSAYILAN_ARALIK = 20;
  var ZAMAN_ASIMI = 15000;
  var GONDERME_GECIKMESI = 1500;

  var durum = {
    ayar: null,
    asama: 'kapali',
    hata: '',
    yerelZaman: '',
    sonUzakZaman: '',
    kirli: false,
    sonCekme: '',
    sonGonderme: ''
  };

  var aboneler = [];
  var uygulaniyor = false;
  var istekSuruyor = false;
  var baglandi = false;
  var gondermeZamanlayici = null;
  var cekmeZamanlayici = null;

  /* ---------- Yardımcılar ---------- */

  function oku(anahtar) {
    try {
      var ham = global.localStorage.getItem(anahtar);
      return ham ? JSON.parse(ham) : null;
    } catch (hata) {
      return null;
    }
  }

  function yaz(anahtar, deger) {
    try {
      global.localStorage.setItem(anahtar, JSON.stringify(deger));
    } catch (hata) {
      /* kota/gizli mod: bulut ayarı yazılamazsa yerel kayıt sürer */
    }
  }

  function sil(anahtar) {
    try { global.localStorage.removeItem(anahtar); } catch (hata) { /* yok say */ }
  }

  /* Yapıştırılan adres `.../rest/v1` veya sonunda `/` içerebilir. */
  function temizUrl(deger) {
    var url = String(deger || '').trim().replace(/\s+/g, '');
    if (!url) { return ''; }
    if (!/^https?:\/\//i.test(url)) { url = 'https://' + url; }
    return url.replace(/\/+$/, '').replace(/\/rest\/v1$/i, '');
  }

  /* Oda kodu: küçük harf, boşluk yerine tire; adres içinde güvenli. */
  function temizOda(deger) {
    return String(deger || '').trim().toLocaleLowerCase('tr-TR')
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
  }

  function zamanMetni(zaman) {
    if (!zaman) { return ''; }
    try {
      return new Date(zaman).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } catch (hata) {
      return '';
    }
  }

  function hazirMi() {
    return !!(durum.ayar && durum.ayar.url && durum.ayar.anahtar && durum.ayar.oda);
  }

  function kaydetDurum() {
    yaz(DURUM_ANAHTAR, {
      yerelZaman: durum.yerelZaman,
      sonUzakZaman: durum.sonUzakZaman,
      kirli: durum.kirli,
      sonCekme: durum.sonCekme,
      sonGonderme: durum.sonGonderme
    });
  }
  /* ---------- Durum yayını ---------- */

  function ozet() {
    var ayar = durum.ayar;
    if (!hazirMi()) {
      return {
        asama: 'kapali',
        metin: 'Yerel kayıt açık',
        ayrinti: 'Veriler yalnızca bu cihazda saklanır.',
        hata: false
      };
    }

    if (durum.asama === 'hata') {
      return {
        asama: 'hata',
        metin: 'Bulut bağlantısı yok · yerel kayıt',
        ayrinti: durum.hata || 'Bulut sunucusuna ulaşılamadı.',
        hata: true
      };
    }

    if (durum.asama === 'senkron') {
      return { asama: 'senkron', metin: 'Bulut eşitleniyor…', ayrinti: ayar.oda, hata: false };
    }

    var saat = zamanMetni(durum.sonGonderme || durum.sonCekme);
    return {
      asama: 'hazir',
      metin: 'Bulut kayıt açık' + (saat ? ' · ' + saat : ''),
      ayrinti: 'Oda: ' + ayar.oda + (durum.kirli ? ' · bekleyen değişiklik var' : ''),
      hata: false
    };
  }

  function bildir() {
    var bilgi = ozet();
    aboneler.forEach(function (fn) {
      try { fn(bilgi); } catch (hata) { /* dinleyici hatası eşitlemeyi durdurmaz */ }
    });
  }

  function asama(yeni) {
    durum.asama = yeni;
    if (yeni !== 'hata') { durum.hata = ''; }
    bildir();
  }

  function hataDurumu(hata, sessiz) {
    durum.asama = 'hata';
    durum.hata = (hata && hata.message) || 'Bulut bağlantısı kurulamadı.';
    bildir();
    if (!sessiz && ISG.bicim && typeof ISG.bicim.bildir === 'function') {
      ISG.bicim.bildir(durum.hata, 'hata');
    }
  }

  function bildirBasari(mesaj) {
    if (ISG.bicim && typeof ISG.bicim.bildir === 'function') {
      ISG.bicim.bildir(mesaj, 'basari');
    }
  }

  /* ---------- HTTP ---------- */

  function istek(yol, secenekler) {
    var secenek = secenekler || {};
    if (typeof global.fetch !== 'function') {
      return Promise.reject(new Error('Tarayıcı bulut bağlantısını desteklemiyor.'));
    }

    var basliklar = {
      apikey: durum.ayar.anahtar,
      Authorization: 'Bearer ' + durum.ayar.anahtar,
      Accept: 'application/json'
    };
    var istekSecenek = {
      method: secenek.method || 'GET',
      headers: basliklar,
      cache: 'no-store'
    };

    if (secenek.body) {
      basliklar['Content-Type'] = 'application/json';
      istekSecenek.body = JSON.stringify(secenek.body);
    }
    if (secenek.prefer) { basliklar.Prefer = secenek.prefer; }

    var kontrol = null;
    if (typeof global.AbortController === 'function') {
      kontrol = new global.AbortController();
      istekSecenek.signal = kontrol.signal;
    }

    var zamanlayici = global.setTimeout(function () {
      if (kontrol) { kontrol.abort(); }
    }, ZAMAN_ASIMI);

    return global.fetch(durum.ayar.url + '/rest/v1/' + TABLO + (yol || ''), istekSecenek).then(function (yanit) {
      global.clearTimeout(zamanlayici);
      return yanit.text().then(function (metin) {
        var govde = null;
        try { govde = metin ? JSON.parse(metin) : null; } catch (hata) { govde = null; }
        if (yanit.ok) { return govde; }
        var mesaj = 'Bulut isteği reddedildi (' + yanit.status + ').';
        if (govde && (govde.message || govde.hint)) {
          mesaj += ' ' + (govde.message || govde.hint);
        }
        throw new Error(mesaj);
      });
    }, function (hata) {
      global.clearTimeout(zamanlayici);
      if (hata && hata.name === 'AbortError') {
        throw new Error('Bulut isteği zaman aşımına uğradı.');
      }
      throw new Error('Bulut sunucusuna ulaşılamadı. İnternet bağlantısını denetleyin.');
    });
  }

  function satirYolu() {
    return '?oda=eq.' + encodeURIComponent(durum.ayar.oda) + '&select=veri,guncelleme';
  }

  /* ---------- Arayüz tazeleme ---------- */

  function arayuzTazele() {
    try {
      if (ISG.yetki && typeof ISG.yetki.oturum === 'function' && !ISG.yetki.oturum()) {
        return; /* giriş ekranı açık: ipuçları veriden anlık okunuyor */
      }
      if (ISG.uygulama && typeof ISG.uygulama.ciz === 'function') { ISG.uygulama.ciz(); }
    } catch (hata) {
      /* arayüz hatası eşitlemeyi durdurmaz */
    }
  }

  function uygula(veri, uzakZaman) {
    if (!veri || !Array.isArray(veri.isyerleri) || !Array.isArray(veri.personel)) {
      throw new Error('Bulut kaydı tanınmadı (işyerleri/personel dizileri yok).');
    }
    uygulaniyor = true;
    try {
      ISG.depo.iceAktar(JSON.stringify(veri));
    } finally {
      uygulaniyor = false;
    }
    durum.yerelZaman = uzakZaman || '';
    durum.sonUzakZaman = uzakZaman || '';
    durum.kirli = false;
    kaydetDurum();
    arayuzTazele();
    bildirBasari('Bulut verileri güncellendi.');
  }

  /* ---------- Aktarım ---------- */

  function gonder(elle) {
    if (!hazirMi()) { return Promise.resolve(false); }
    if (istekSuruyor) { return Promise.resolve(false); }

    istekSuruyor = true;
    asama('senkron');

    var zaman = new Date().toISOString();
    var govde = [{ oda: durum.ayar.oda, veri: ISG.depo.al(), guncelleme: zaman }];

    return istek('', {
      method: 'POST',
      body: govde,
      prefer: 'resolution=merge-duplicates,return=minimal'
    }).then(function () {
      istekSuruyor = false;
      durum.sonGonderme = zaman;
      durum.sonUzakZaman = zaman;
      durum.yerelZaman = zaman;
      durum.kirli = false;
      kaydetDurum();
      asama('hazir');
      if (elle) { bildirBasari('Veriler buluta kaydedildi.'); }
      return true;
    }).catch(function (hata) {
      istekSuruyor = false;
      hataDurumu(hata, !elle);
      return false;
    });
  }

  function cek(sessiz) {
    if (!hazirMi()) { return Promise.resolve(false); }
    if (istekSuruyor) { return Promise.resolve(false); }

    istekSuruyor = true;
    asama('senkron');

    return istek(satirYolu()).then(function (satirlar) {
      istekSuruyor = false;
      var satir = Array.isArray(satirlar) ? satirlar[0] : null;
      durum.sonCekme = new Date().toISOString();

      /* Bulutta kayıt yok: bu cihazdaki veri ilk kez yüklenir. */
      if (!satir || !satir.veri) {
        return gonder(false);
      }

      var uzak = String(satir.guncelleme || '');
      if (!durum.kirli && uzak && uzak === durum.sonUzakZaman) {
        asama('hazir');
        kaydetDurum();
        return false;
      }

      /* Gönderilmemiş yerel değişiklik daha yeniyse buluta yazılır. */
      if (durum.kirli && uzak && uzak <= durum.yerelZaman) {
        return gonder(false);
      }

      uygula(satir.veri, uzak);
      asama('hazir');
      kaydetDurum();
      return true;
    }).catch(function (hata) {
      istekSuruyor = false;
      hataDurumu(hata, sessiz);
      return false;
    });
  }

  function senkronla(elle) {
    if (!hazirMi()) {
      if (elle) { hataDurumu(new Error('Önce bulut ayarlarını girin.'), false); }
      return Promise.resolve(false);
    }
    return cek(!elle).then(function () {
      /* Çekme başarısız olduysa durum 'hata' kalır; başarı mesajı yazılmaz. */
      if (durum.asama === 'hata') { return false; }
      /* Uygulanan uzak kayıt zaten sunucuda: yeniden gönderilmez. */
      if (durum.kirli) { return gonder(!!elle); }
      if (elle) { asama('hazir'); bildirBasari('Bulut verileri güncel.'); }
      return true;
    });
  }

  /* ---------- Yerel değişiklik takibi ---------- */

  function degisiklik() {
    if (uygulaniyor || !hazirMi()) { return; }
    durum.kirli = true;
    durum.yerelZaman = new Date().toISOString();
    kaydetDurum();

    if (!durum.ayar.otomatik) { bildir(); return; }

    if (gondermeZamanlayici) { global.clearTimeout(gondermeZamanlayici); }
    gondermeZamanlayici = global.setTimeout(function () {
      gondermeZamanlayici = null;
      gonder(false);
    }, GONDERME_GECIKMESI);
  }

  function zamanlayiciKur() {
    if (cekmeZamanlayici) {
      global.clearInterval(cekmeZamanlayici);
      cekmeZamanlayici = null;
    }
    if (!hazirMi() || !durum.ayar.otomatik) { return; }
    var aralik = Math.max(10, Number(durum.ayar.aralik) || VARSAYILAN_ARALIK);
    cekmeZamanlayici = global.setInterval(function () {
      if (document.hidden || istekSuruyor || !hazirMi()) { return; }
      cek(true);
    }, aralik * 1000);
  }

  function bagla() {
    if (baglandi) { return; }
    baglandi = true;

    if (ISG.depo && typeof ISG.depo.abone === 'function') { ISG.depo.abone(degisiklik); }

    global.addEventListener('online', function () {
      if (hazirMi()) { asama('hazir'); cek(true); }
    });

    global.addEventListener('offline', function () {
      if (!hazirMi()) { return; }
      durum.asama = 'hata';
      durum.hata = 'İnternet bağlantısı yok; değişiklikler yerelde tutuluyor.';
      bildir();
    });

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && hazirMi() && durum.ayar.otomatik) { cek(true); }
    });
  }

  /* ---------- Genel API ---------- */

  /* Ayarları doğrular ve kaydeder. Eksik alan varsa bağlantı kapatılır (null). */
  function ayarYaz(girdi, secenekler) {
    var secenek = secenekler || {};
    var temiz = {
      url: temizUrl(girdi && girdi.url),
      anahtar: String((girdi && girdi.anahtar) || '').trim(),
      oda: temizOda(girdi && girdi.oda),
      otomatik: !(girdi && girdi.otomatik === false),
      aralik: Math.max(10, Math.min(300, Number(girdi && girdi.aralik) || VARSAYILAN_ARALIK))
    };

    yaz(AYAR_ANAHTAR, temiz);
    durum.ayar = temiz.url && temiz.anahtar && temiz.oda ? temiz : null;

    if (!durum.ayar) {
      asama('kapali');
      return null;
    }

    if (secenek.yukari) {
      durum.kirli = true;
      durum.yerelZaman = new Date().toISOString();
      kaydetDurum();
    } else if (secenek.sifirla) {
      durum.kirli = false;
      durum.yerelZaman = '';
      durum.sonUzakZaman = '';
      kaydetDurum();
    }

    return durum.ayar;
  }

  /* Ayarları kaydeder ve ilk eşitlemeyi yapar.
     yukari = true: bu cihazdaki veri buluta yazılır; false: buluttaki veri indirilir. */
  function baglan(girdi, yukari) {
    var ayar = ayarYaz(girdi, yukari ? { yukari: true } : { sifirla: true });
    if (!ayar) { return Promise.resolve(false); }
    bagla();
    zamanlayiciKur();
    return yukari ? gonder(true) : cek(false);
  }

  function kapat() {
    sil(AYAR_ANAHTAR);
    sil(DURUM_ANAHTAR);
    durum.ayar = null;
    durum.kirli = false;
    durum.yerelZaman = '';
    durum.sonUzakZaman = '';
    durum.sonCekme = '';
    durum.sonGonderme = '';
    durdur();
    asama('kapali');
  }

  function durdur() {
    if (cekmeZamanlayici) { global.clearInterval(cekmeZamanlayici); cekmeZamanlayici = null; }
    if (gondermeZamanlayici) { global.clearTimeout(gondermeZamanlayici); gondermeZamanlayici = null; }
  }

  function baslat() {
    bagla();

    if (!hazirMi()) {
      asama('kapali');
      return;
    }

    zamanlayiciKur();
    if (durum.kirli) { gonder(false); } else { cek(true); }
  }

  function abone(fn) {
    if (typeof fn === 'function') { aboneler.push(fn); }
  }

  /* Supabase SQL editöründe bir kez çalıştırılacak kurulum betiği. */
  var SQL = [
    'create table if not exists public.isg_veri (',
    '  oda text primary key,',
    '  veri jsonb not null,',
    '  guncelleme timestamptz not null default now()',
    ');',
    '',
    'alter table public.isg_veri enable row level security;',
    '',
    'drop policy if exists "isg_veri_anon" on public.isg_veri;',
    'create policy "isg_veri_anon" on public.isg_veri',
    '  for all to anon',
    '  using (true)',
    '  with check (true);'
  ].join('\n');

  /* Açılışta kayıtlı ayarları ve son eşitleme zamanını geri yükler. */
  var kayitliAyar = oku(AYAR_ANAHTAR);
  if (kayitliAyar) {
    var url = temizUrl(kayitliAyar.url);
    var anahtar = String(kayitliAyar.anahtar || '').trim();
    var oda = temizOda(kayitliAyar.oda);
    durum.ayar = url && anahtar && oda ? {
      url: url,
      anahtar: anahtar,
      oda: oda,
      otomatik: kayitliAyar.otomatik !== false,
      aralik: Math.max(10, Math.min(300, Number(kayitliAyar.aralik) || VARSAYILAN_ARALIK))
    } : null;
  }

  var kayitliDurum = oku(DURUM_ANAHTAR);
  if (kayitliDurum) {
    durum.yerelZaman = String(kayitliDurum.yerelZaman || '');
    durum.sonUzakZaman = String(kayitliDurum.sonUzakZaman || '');
    durum.kirli = !!kayitliDurum.kirli;
    durum.sonCekme = String(kayitliDurum.sonCekme || '');
    durum.sonGonderme = String(kayitliDurum.sonGonderme || '');
  }

  ISG.bulut = {
    ayar: function () { return durum.ayar; },
    ayarYaz: ayarYaz,
    hazirMi: hazirMi,
    ozet: ozet,
    abone: abone,
    baslat: baslat,
    baglan: baglan,
    kapat: kapat,
    cek: cek,
    gonder: gonder,
    senkronla: senkronla,
    sqlMetni: function () { return SQL; },
    tablo: TABLO
  };
})(window);

