/* İSG Takip Merkezi — alan kuralları, veri katmanı ve görev motoru */
(function (global) {
  'use strict';

  var ISG = global.ISG = global.ISG || {};
  var ANAHTAR = 'isgtakip.v3';
  var ESKI_ANAHTAR = 'isgtakip.v2';
  var SURUM = 3;

  /* ---------- Alan kuralları ---------- */

  ISG.RISK_SINIFLARI = {
    az: { ad: 'Az tehlikeli', temelSaat: 8, yenilemeYil: 3, riskYenilemeYil: 6, acilYenilemeYil: 6 },
    tehlikeli: { ad: 'Tehlikeli', temelSaat: 12, yenilemeYil: 2, riskYenilemeYil: 4, acilYenilemeYil: 4 },
    cokTehlikeli: { ad: 'Çok tehlikeli', temelSaat: 16, yenilemeYil: 1, riskYenilemeYil: 2, acilYenilemeYil: 4 }
  };

  ISG.EGITIM_TURLERI = [
    { id: 'temel', ad: 'Temel İSG eğitimi', yenilemeYil: null, saat: null, not: '8 / 12 / 16 saat • 3 / 2 / 1 yılda yenilenir' },
    { id: 'ilkYardim', ad: 'İlk yardım', yenilemeYil: 3, saat: 16, not: 'Sertifika 3 yıl geçerli' },
    { id: 'yangin', ad: 'Yangın güvenliği ve söndürme', yenilemeYil: 1, saat: 4, not: 'Yılda bir tekrar' },
    { id: 'yuksekte', ad: 'Yüksekte çalışma', yenilemeYil: 2, saat: 8, not: '2 yılda bir yenileme' },
    { id: 'kkd', ad: 'KKD kullanımı', yenilemeYil: 2, saat: 2, not: 'Zimmet ile birlikte' },
    { id: 'acilDurum', ad: 'Acil durum ve tahliye', yenilemeYil: 1, saat: 4, not: 'Tatbikat öncesi tekrar' },
    { id: 'kurul', ad: 'İSG kurul bilgilendirmesi', yenilemeYil: 2, saat: 2, not: 'Kurul üyeleri için' }
  ];

  ISG.OLAY_TURLERI = {
    ramakKala: { ad: 'Ramak kala', sinif: 'uyari' },
    isKazasi: { ad: 'İş kazası', sinif: 'tehlike' },
    cevresel: { ad: 'Çevresel olay', sinif: 'bilgi' }
  };

  ISG.RISK_DURUMLARI = { acik: 'Açık', izlemede: 'İzlemede', kapali: 'Kapatıldı' };

  ISG.DOSYA_DURUMLARI = {
    var: { ad: 'Var', sinif: 'iyi' },
    eksik: { ad: 'Eksik', sinif: 'tehlike' },
    yok: { ad: 'Yok', sinif: 'notr' },
    incelenmedi: { ad: 'İncelenmedi', sinif: 'uyari' }
  };

  ISG.TESPIT_DURUMLARI = {
    acik: { ad: 'Açık', sinif: 'tehlike' },
    dogrulama: { ad: 'Doğrulama bekliyor', sinif: 'uyari' },
    kapali: { ad: 'Kapatıldı', sinif: 'iyi' }
  };

  ISG.PLAN_DURUMLARI = {
    tamamlandi: { ad: 'Tamamlandı', sinif: 'iyi' },
    takvimde: { ad: 'Takvimde', sinif: 'bilgi' },
    planlanmadi: { ad: 'Planlanmadı', sinif: 'notr' }
  };

  ISG.RISK_ROLLERI = [
    { id: 'isveren', ad: 'İşveren / vekili' },
    { id: 'uzman', ad: 'İş güvenliği uzmanı' },
    { id: 'hekim', ad: 'İşyeri hekimi' },
    { id: 'temsilci', ad: 'Çalışan temsilcisi (en az 1 kişi)' },
    { id: 'destek', ad: 'Destek elemanı' },
    { id: 'birim', ad: 'Birimleri bilen çalışan' }
  ];

  ISG.ACIL_ROLLERI = [
    { id: 'koordinator', ad: 'Acil durum koordinatörü' },
    { id: 'yangin', ad: 'Yangın söndürme ekibi' },
    { id: 'ilkyardim', ad: 'İlk yardım ekibi' },
    { id: 'tahliye', ad: 'Tahliye / arama kurtarma' },
    { id: 'destek', ad: 'Destek elemanı' }
  ];

  ISG.DAVET_ROLLERI = ['Kurum sahibi', 'Yönetici', 'İSG uzmanı', 'Görüntüleyici'];

  ISG.egitimTuru = function (id) {
    return ISG.EGITIM_TURLERI.filter(function (t) { return t.id === id; })[0] || { id: id, ad: id, yenilemeYil: 2 };
  };

  ISG.egitimGecerlilik = function (turId, riskSinifi, tarihIso) {
    if (!tarihIso) { return ''; }
    var tur = ISG.egitimTuru(turId);
    var yil = tur.yenilemeYil;
    if (yil === null || typeof yil === 'undefined') {
      var sinif = ISG.RISK_SINIFLARI[riskSinifi] || ISG.RISK_SINIFLARI.tehlikeli;
      yil = sinif.yenilemeYil;
    }
    return ISG.yilEkle(tarihIso, yil);
  };

  ISG.riskSkor = function (risk) {
    return (Number(risk.olasilik) || 0) * (Number(risk.siddet) || 0);
  };

  ISG.riskSeviye = function (skor) {
    if (skor >= 15) { return { id: 'kritik', ad: 'Kritik', sinif: 'tehlike' }; }
    if (skor >= 10) { return { id: 'yuksek', ad: 'Yüksek', sinif: 'uyari' }; }
    if (skor >= 5) { return { id: 'orta', ad: 'Orta', sinif: 'bilgi' }; }
    return { id: 'dusuk', ad: 'Düşük', sinif: 'iyi' };
  };

  ISG.gunFarki = function (tarihIso) {
    if (!tarihIso) { return null; }
    var parca = String(tarihIso).split('-');
    if (parca.length !== 3) { return null; }
    var hedef = new Date(Number(parca[0]), Number(parca[1]) - 1, Number(parca[2]), 12, 0, 0, 0);
    var bugun = new Date();
    bugun.setHours(12, 0, 0, 0);
    return Math.round((hedef - bugun) / 86400000);
  };

  ISG.egitimDurumu = function (egitim) {
    var kalan = ISG.gunFarki(egitim.gecerlilik);
    if (kalan === null) { return { id: 'yok', ad: 'Tarih yok', kalan: null }; }
    if (kalan < 0) { return { id: 'suresiDoldu', ad: 'Süresi doldu', kalan: kalan }; }
    if (kalan <= 60) { return { id: 'yaklasiyor', ad: 'Yaklaşıyor', kalan: kalan }; }
    return { id: 'gecerli', ad: 'Geçerli', kalan: kalan };
  };

  ISG.kisiDurumu = function (kisi, egitimler) {
    var temeller = egitimler.filter(function (e) {
      return e.personelId === kisi.id && e.tur === 'temel' && e.gecerlilik;
    }).sort(function (a, b) { return a.gecerlilik < b.gecerlilik ? 1 : -1; });
    if (!temeller.length) { return { id: 'yok', ad: 'Eğitim yok', kalan: null, gecerlilik: '' }; }
    var durum = ISG.egitimDurumu(temeller[0]);
    durum.gecerlilik = temeller[0].gecerlilik;
    return durum;
  };

  /* ---------- Kapsam yardımcıları ---------- */

  ISG.isyeriBul = function (veri, id) {
    return (veri.isyerleri || []).filter(function (i) { return i.id === id; })[0] || null;
  };

  ISG.isyeriAdi = function (veri, id) {
    var isyeri = ISG.isyeriBul(veri, id);
    return isyeri ? isyeri.ad : '—';
  };

  ISG.kapsamda = function (veri, kapsam, anahtar) {
    var liste = veri[anahtar] || [];
    if (!kapsam) { return liste.slice(); }
    return liste.filter(function (kayit) { return kayit.isyeriId === kapsam; });
  };

  ISG.ilgiliKayit = function (veri, anahtar, isyeriId) {
    var liste = veri[anahtar] || [];
    var bulunan = liste.filter(function (k) { return k.isyeriId === isyeriId; })[0];
    return bulunan || null;
  };

  ISG.planDurumu = function (plan) {
    if (plan.durum === 'tamamlandi') { return { id: 'tamamlandi', ad: 'Tamamlandı', sinif: 'iyi' }; }
    if (!plan.takipTarihi) { return { id: 'planlanmadi', ad: 'Tarih yok', sinif: 'notr' }; }
    var kalan = ISG.gunFarki(plan.takipTarihi);
    if (kalan !== null && kalan < 0) { return { id: 'geciken', ad: Math.abs(kalan) + ' gün gecikti', sinif: 'tehlike', kalan: kalan }; }
    if (kalan === 0) { return { id: 'bugun', ad: 'Bugün', sinif: 'uyari', kalan: 0 }; }
    return { id: 'takvimde', ad: 'Takvimde', sinif: 'bilgi', kalan: kalan };
  };

  ISG.tespitDurumu = function (tespit) {
    if (tespit.durum === 'kapali') { return { id: 'kapali', ad: 'Kapatıldı', sinif: 'iyi' }; }
    if (tespit.durum === 'dogrulama') { return { id: 'dogrulama', ad: 'Doğrulama bekliyor', sinif: 'uyari' }; }
    var kalan = ISG.gunFarki(tespit.termin);
    if (kalan !== null && kalan < 0) { return { id: 'geciken', ad: 'Geciken', sinif: 'tehlike', kalan: kalan }; }
    return { id: 'acik', ad: 'Açık', sinif: 'bilgi', kalan: kalan };
  };

  ISG.riskEkipOzeti = function (kayit) {
    if (!kayit) { return { eksik: ISG.RISK_ROLLERI.length, durum: 'eksik' }; }
    var uyeler = kayit.uyeler || {};
    var eksik = ISG.RISK_ROLLERI.filter(function (rol) { return !uyeler[rol.id]; }).length;
    var kalan = ISG.gunFarki(kayit.enGecYenileme);
    var durum = 'eksik';
    if (kayit.sonDegerlendirme && kalan !== null && kalan < 0) { durum = 'geciken'; }
    else if (kayit.sonDegerlendirme) { durum = 'gecerli'; }
    return { eksik: eksik, kalan: kalan, durum: durum };
  };

  ISG.acilPlanOzeti = function (isyeri, kayit) {
    var sinif = ISG.RISK_SINIFLARI[isyeri.tehlikeSinifi] || ISG.RISK_SINIFLARI.tehlikeli;
    var son = kayit && (kayit.sonYenileme || kayit.hazirlanma);
    var enGec = son ? ISG.yilEkle(son, sinif.acilYenilemeYil) : '';
    var kalan = ISG.gunFarki(enGec);
    return {
      son: son || '',
      enGec: enGec,
      kalan: kalan,
      sinif: sinif,
      ekip: (kayit && kayit.ekip) || []
    };
  };

  /* ---------- Görev motoru ---------- */

  function gorevEkle(liste, kapsam, gorev) {
    if (kapsam && gorev.isyeriId !== kapsam) { return; }
    liste.push(gorev);
  }

  ISG.gorevler = function (veri, kapsam) {
    var liste = [];
    var personel = veri.personel || [];
    var egitimler = veri.egitimler || [];

    (veri.dosyalar || []).forEach(function (dosya) {
      if (!dosya.yenileme) { return; }
      gorevEkle(liste, kapsam, {
        id: 'g_dosya_' + dosya.id,
        isyeriId: dosya.isyeriId,
        baslik: dosya.madde,
        tur: 'Belge yenileme',
        detay: 'Bölüm ' + dosya.bolum,
        tarih: dosya.yenileme,
        sayfa: 'dosyalar',
        hedefId: dosya.id
      });
    });

    personel.forEach(function (kisi) {
      if (kisi.durum !== 'aktif') { return; }
      var durum = ISG.kisiDurumu(kisi, egitimler);
      if (durum.id === 'gecerli') { return; }
      gorevEkle(liste, kapsam, {
        id: 'g_egitim_' + kisi.id,
        isyeriId: kisi.isyeriId,
        baslik: (durum.id === 'yok' ? 'İSG eğitimi kaydı yok: ' : 'İSG eğitimi yenilemesi: ') + kisi.adSoyad,
        tur: 'Eğitim',
        detay: kisi.meslek,
        tarih: durum.gecerlilik || '',
        sayfa: 'personel',
        hedefId: kisi.id
      });
    });

    (veri.riskEkipleri || []).forEach(function (kayit) {
      var isyeri = ISG.isyeriBul(veri, kayit.isyeriId);
      if (!isyeri) { return; }
      if (!kayit.sonDegerlendirme) {
        gorevEkle(liste, kapsam, {
          id: 'g_risk_' + kayit.isyeriId,
          isyeriId: kayit.isyeriId,
          baslik: 'Risk değerlendirmesi tarihini gir',
          tur: 'Risk değerlendirmesi',
          detay: isyeri.ad,
          tarih: '',
          sayfa: 'risk',
          hedefId: kayit.isyeriId
        });
        return;
      }
      if (kayit.enGecYenileme) {
        gorevEkle(liste, kapsam, {
          id: 'g_risk_' + kayit.isyeriId,
          isyeriId: kayit.isyeriId,
          baslik: 'Risk değerlendirmesini yenile',
          tur: 'Risk değerlendirmesi',
          detay: isyeri.ad,
          tarih: kayit.enGecYenileme,
          sayfa: 'risk',
          hedefId: kayit.isyeriId
        });
      }
    });

    (veri.acilPlanlar || []).forEach(function (kayit) {
      var isyeri = ISG.isyeriBul(veri, kayit.isyeriId);
      if (!isyeri) { return; }
      var ozet = ISG.acilPlanOzeti(isyeri, kayit);
      if (!ozet.son) {
        gorevEkle(liste, kapsam, {
          id: 'g_acil_' + kayit.isyeriId,
          isyeriId: kayit.isyeriId,
          baslik: 'Acil durum planı hazırla ve tarihini kaydet',
          tur: 'Acil durum',
          detay: isyeri.ad,
          tarih: '',
          sayfa: 'acil',
          hedefId: kayit.isyeriId
        });
        return;
      }
      gorevEkle(liste, kapsam, {
        id: 'g_acil_' + kayit.isyeriId,
        isyeriId: kayit.isyeriId,
        baslik: 'Acil durum planını yenile',
        tur: 'Acil durum',
        detay: isyeri.ad,
        tarih: ozet.enGec,
        sayfa: 'acil',
        hedefId: kayit.isyeriId
      });
    });

    (veri.planlar || []).forEach(function (plan) {
      if (!plan.takipTarihi || plan.durum === 'tamamlandi') { return; }
      gorevEkle(liste, kapsam, {
        id: 'g_plan_' + plan.id,
        isyeriId: plan.isyeriId,
        baslik: plan.faaliyet,
        tur: 'Çalışma planı',
        detay: plan.sorumlu,
        tarih: plan.takipTarihi,
        sayfa: 'plan',
        hedefId: plan.id
      });
    });

    (veri.tespitler || []).forEach(function (tespit) {
      if (tespit.durum === 'kapali' || !tespit.termin) { return; }
      gorevEkle(liste, kapsam, {
        id: 'g_tespit_' + tespit.id,
        isyeriId: tespit.isyeriId,
        baslik: 'DÖF: ' + tespit.tespit,
        tur: 'Saha / DÖF',
        detay: tespit.sorumlu,
        tarih: tespit.termin,
        sayfa: 'saha',
        hedefId: tespit.id
      });
    });

    (veri.olaylar || []).forEach(function (olay) {
      if (olay.durum === 'kapali') { return; }
      gorevEkle(liste, kapsam, {
        id: 'g_olay_' + olay.id,
        isyeriId: olay.isyeriId,
        baslik: 'Olay bildirimini kapat: ' + olay.aciklama,
        tur: 'Olay',
        detay: olay.yer || '',
        tarih: olay.tarih,
        sayfa: 'saha',
        hedefId: olay.id
      });
    });

    liste.sort(function (a, b) {
      if (!a.tarih && !b.tarih) { return a.baslik.localeCompare(b.baslik, 'tr'); }
      if (!a.tarih) { return 1; }
      if (!b.tarih) { return -1; }
      if (a.tarih === b.tarih) { return a.baslik.localeCompare(b.baslik, 'tr'); }
      return a.tarih < b.tarih ? -1 : 1;
    });
    return liste;
  };

  ISG.gorevDurumu = function (gorev) {
    var kalan = ISG.gunFarki(gorev.tarih);
    if (kalan === null) { return { id: 'tarihsiz', ad: 'Tarih belirtilmedi', sinif: 'notr' }; }
    if (kalan < 0) { return { id: 'geciken', ad: Math.abs(kalan) + ' gün gecikti', sinif: 'tehlike', kalan: kalan }; }
    if (kalan === 0) { return { id: 'bugun', ad: 'Bugün', sinif: 'uyari', kalan: 0 }; }
    if (kalan <= 30) { return { id: 'yaklasan', ad: kalan + ' gün kaldı', sinif: 'bilgi', kalan: kalan }; }
    return { id: 'ileri', ad: kalan + ' gün kaldı', sinif: 'notr', kalan: kalan };
  };

  ISG.gorevOzet = function (gorevler) {
    var say = { geciken: 0, bugun: 0, yaklasan: 0, tarihsiz: 0, ileri: 0 };
    gorevler.forEach(function (gorev) {
      var durum = ISG.gorevDurumu(gorev);
      say[durum.id] = (say[durum.id] || 0) + 1;
    });
    say.toplam = gorevler.length;
    say.oncelikli = say.geciken + say.bugun + say.yaklasan;
    return say;
  };

  /* ---------- Dosya ve tespit özetleri ---------- */

  ISG.dosyaOzeti = function (liste) {
    var ozet = { gecen: 0, bugun: 0, yaklasan: 0, tarihsiz: 0, toplam: liste.length, durum: { var: 0, eksik: 0, yok: 0, incelenmedi: 0 } };
    liste.forEach(function (dosya) {
      ozet.durum[dosya.durum] = (ozet.durum[dosya.durum] || 0) + 1;
      var kalan = ISG.gunFarki(dosya.yenileme);
      if (kalan === null) { ozet.tarihsiz += 1; }
      else if (kalan < 0) { ozet.gecen += 1; }
      else if (kalan === 0) { ozet.bugun += 1; }
      else if (kalan <= 14) { ozet.yaklasan += 1; }
    });
    return ozet;
  };

  ISG.dosyaDurumEtiketi = function (dosya) {
    var kalan = ISG.gunFarki(dosya.yenileme);
    if (kalan === null) { return { ad: 'Tarih girilmedi', sinif: 'notr' }; }
    if (kalan < 0) { return { ad: Math.abs(kalan) + ' gün geçti', sinif: 'tehlike' }; }
    if (kalan === 0) { return { ad: 'Bugün', sinif: 'uyari' }; }
    if (kalan <= 14) { return { ad: kalan + ' gün kaldı', sinif: 'uyari' }; }
    return { ad: kalan + ' gün kaldı', sinif: 'iyi' };
  };

  ISG.tespitOzeti = function (liste) {
    var ozet = { acik: 0, geciken: 0, dogrulama: 0, kapali: 0, toplam: liste.length };
    liste.forEach(function (tespit) {
      var durum = ISG.tespitDurumu(tespit);
      if (durum.id === 'geciken') { ozet.geciken += 1; }
      if (tespit.durum === 'acik') { ozet.acik += 1; }
      if (durum.id === 'dogrulama') { ozet.dogrulama += 1; }
      if (durum.id === 'kapali') { ozet.kapali += 1; }
    });
    return ozet;
  };

  /* ---------- Depo ---------- */

  var depoDurumu = { veri: null, kalici: true, dinleyiciler: [] };

  var LISTE_ANAHTARLARI = [
    'egitimler', 'riskler', 'olaylar', 'dosyalar', 'belgeler', 'planlar', 'tespitler',
    'riskEkipleri', 'acilPlanlar', 'davetler', 'mevzuat',
    'kullanicilar', 'talepler', 'denetim'
  ];

  function yayinla() {
    depoDurumu.dinleyiciler.forEach(function (fn) {
      try { fn(depoDurumu.veri); } catch (hata) { /* dinleyici hatası uygulamayı durdurmaz */ }
    });
  }

  function davetKoduUret() {
    var harfler = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var govde = '';
    for (var i = 0; i < 5; i += 1) { govde += harfler.charAt(Math.floor(Math.random() * harfler.length)); }
    return 'ISG-' + govde;
  }

  ISG.davetKoduUret = davetKoduUret;

  /* Eski sürümden gelen ya da içe aktarılan veriyi güncel şemaya tamamlar. */
  function veriTamamla(veri) {
    if (!veri) { return veri; }
    LISTE_ANAHTARLARI.forEach(function (anahtar) {
      veri[anahtar] = Array.isArray(veri[anahtar]) ? veri[anahtar] : [];
    });
    veri.isyerleri = Array.isArray(veri.isyerleri) ? veri.isyerleri : [];
    veri.personel = Array.isArray(veri.personel) ? veri.personel : [];
    veri.ayarlar = veri.ayarlar || {};

    (veri.davetler || []).forEach(function (davet) {
      if (!davet.kod) { davet.kod = davetKoduUret(); }
      if (davet.durum !== 'kabul') { davet.durum = davet.durum || 'bekliyor'; }
    });

    var kullaniciVar = (veri.kullanicilar || []).length > 0;
    if (!kullaniciVar && typeof ISG.ORNEK_KULLANICILAR === 'function') {
      veri.kullanicilar = ISG.ORNEK_KULLANICILAR();
    }

    veri.surum = SURUM;
    return veri;
  }

  function oku(anahtar) {
    try {
      var ham = global.localStorage.getItem(anahtar);
      if (!ham) { return null; }
      var okunan = JSON.parse(ham);
      return okunan && typeof okunan === 'object' ? okunan : null;
    } catch (hata) {
      depoDurumu.kalici = false;
      return null;
    }
  }

  var okunanVeri = oku(ANAHTAR);
  var tasindi = false;
  if (!okunanVeri) {
    var eskiVeri = oku(ESKI_ANAHTAR);
    if (eskiVeri) { okunanVeri = eskiVeri; tasindi = true; }
  }
  if (okunanVeri) { depoDurumu.veri = veriTamamla(okunanVeri); }
  if (!depoDurumu.veri) { depoDurumu.veri = veriTamamla(ISG.ORNEK_VERI()); }

  var depo = ISG.depo = {
    anahtar: ANAHTAR,
    al: function () { return depoDurumu.veri; },
    /* Oturum sahibinin yetkisine göre süzülmüş görünüm (arayüz bunu kullanır). */
    gorunum: function () {
      if (ISG.yetki && typeof ISG.yetki.kapsamliVeri === 'function') {
        return ISG.yetki.kapsamliVeri(depoDurumu.veri);
      }
      return depoDurumu.veri;
    },
    /* Onay kuyruğundaki bir talebi uygularken anlık geri alma için kullanılır. */
    geriYukle: function (veri) {
      depoDurumu.veri = veri;
      depo.kaydet();
      return depoDurumu.veri;
    },
    surum: function () { return SURUM; },
    kaliciMi: function () { return depoDurumu.kalici; },
    kaydet: function () {
      try {
        global.localStorage.setItem(ANAHTAR, JSON.stringify(depoDurumu.veri));
        depoDurumu.kalici = true;
      } catch (hata) {
        depoDurumu.kalici = false;
      }
      yayinla();
      return depoDurumu.kalici;
    },
    sifirla: function () {
      depoDurumu.veri = veriTamamla(ISG.ORNEK_VERI());
      depo.kaydet();
      return depoDurumu.veri;
    },
    abone: function (fn) {
      if (typeof fn === 'function') { depoDurumu.dinleyiciler.push(fn); }
    },
    disariAktar: function () {
      return JSON.stringify(depo.gorunum(), null, 2);
    },
    iceAktar: function (metin) {
      var veri = JSON.parse(metin);
      if (!veri || !Array.isArray(veri.isyerleri) || !Array.isArray(veri.personel)) {
        throw new Error('Dosya biçimi tanınmadı: işyerleri ve personel dizileri gerekli.');
      }
      veriTamamla(veri);
      depoDurumu.veri = veri;
      depo.kaydet();
      return veri;
    }
  };

  if (tasindi) { depo.kaydet(); }

  /* ---------- Kayıt işlemleri ---------- */

  ISG.yeniId = function (onek) {
    return onek + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  };

  function kaydetListede(liste, kayit, onek) {
    if (kayit.id) {
      var index = -1;
      liste.forEach(function (mevcut, i) { if (mevcut.id === kayit.id) { index = i; } });
      if (index >= 0) { liste[index] = kayit; return kayit; }
    }
    kayit.id = kayit.id || ISG.yeniId(onek);
    liste.push(kayit);
    return kayit;
  }

  function silListeden(liste, id) {
    return liste.filter(function (kayit) { return kayit.id !== id; });
  }

  ISG.depo.isyeriKaydet = function (kayit) {
    var veri = depo.al();
    var sonuc = kaydetListeden(veri.isyerleri, kayit, 'iy');
    if (kayit.ana) {
      veri.isyerleri.forEach(function (isyeri) { if (isyeri.id !== sonuc.id) { isyeri.ana = false; } });
    }
    if (!veri.isyerleri.some(function (isyeri) { return isyeri.ana; }) && veri.isyerleri.length) {
      veri.isyerleri[0].ana = true;
    }
    depo.kaydet();
    return sonuc;
  };

  ISG.depo.isyeriSil = function (id) {
    var veri = depo.al();
    veri.isyerleri = silListeden(veri.isyerleri, id);
    ['personel', 'egitimler', 'riskler', 'olaylar', 'dosyalar', 'belgeler', 'planlar', 'tespitler', 'riskEkipleri', 'acilPlanlar'].forEach(function (anahtar) {
      veri[anahtar] = (veri[anahtar] || []).filter(function (kayit) { return kayit.isyeriId !== id; });
    });
    veri.talepler = (veri.talepler || []).filter(function (talep) { return talep.isyeriId !== id; });
    veri.kullanicilar = (veri.kullanicilar || []).map(function (kullanici) {
      kullanici.isyerleri = (kullanici.isyerleri || []).filter(function (isyeriId) { return isyeriId !== id; });
      return kullanici;
    });
    veri.davetler = (veri.davetler || []).map(function (davet) {
      davet.isyerleri = (davet.isyerleri || []).filter(function (isyeriId) { return isyeriId !== id; });
      return davet;
    });
    if (veri.isyerleri.length && !veri.isyerleri.some(function (isyeri) { return isyeri.ana; })) {
      veri.isyerleri[0].ana = true;
    }
    depo.kaydet();
  };

  ISG.depo.personelKaydet = function (kayit) {
    var veri = depo.al();
    kayit.sicil = String(kayit.sicil || '');
    var sonuc = kaydetListede(veri.personel, kayit, 'p');
    depo.kaydet();
    return sonuc;
  };

  ISG.depo.personelSil = function (id) {
    var veri = depo.al();
    veri.personel = silListeden(veri.personel, id);
    veri.egitimler = veri.egitimler.filter(function (e) { return e.personelId !== id; });
    veri.olaylar.forEach(function (olay) { if (olay.personelId === id) { olay.personelId = ''; } });
    depo.kaydet();
  };

  ISG.depo.personelTemizle = function (isyeriId) {
    var veri = depo.al();
    var silinenler = veri.personel.filter(function (p) { return p.isyeriId === isyeriId; }).map(function (p) { return p.id; });
    veri.personel = veri.personel.filter(function (p) { return p.isyeriId !== isyeriId; });
    veri.egitimler = veri.egitimler.filter(function (e) { return silinenler.indexOf(e.personelId) < 0; });
    veri.olaylar.forEach(function (olay) {
      if (silinenler.indexOf(olay.personelId) >= 0) { olay.personelId = ''; }
    });
    depo.kaydet();
    return silinenler.length;
  };

  ISG.depo.egitimKaydet = function (kayit) {
    var veri = depo.al();
    var kisi = veri.personel.filter(function (p) { return p.id === kayit.personelId; })[0];
    var isyeri = kisi ? ISG.isyeriBul(veri, kisi.isyeriId) : null;
    kayit.isyeriId = kisi ? kisi.isyeriId : kayit.isyeriId;
    kayit.gecerlilik = ISG.egitimGecerlilik(kayit.tur, isyeri ? isyeri.tehlikeSinifi : 'tehlikeli', kayit.tarih);
    kayit.sureSaat = Number(kayit.sureSaat) || 0;
    var sonuc = kaydetListede(veri.egitimler, kayit, 'e');
    depo.kaydet();
    return sonuc;
  };

  ISG.depo.egitimSil = function (id) {
    var veri = depo.al();
    veri.egitimler = silListeden(veri.egitimler, id);
    depo.kaydet();
  };

  ISG.depo.riskKaydet = function (kayit) {
    var veri = depo.al();
    kayit.olasilik = Number(kayit.olasilik) || 1;
    kayit.siddet = Number(kayit.siddet) || 1;
    var sonuc = kaydetListede(veri.riskler, kayit, 'r');
    depo.kaydet();
    return sonuc;
  };

  ISG.depo.riskSil = function (id) {
    var veri = depo.al();
    veri.riskler = silListeden(veri.riskler, id);
    depo.kaydet();
  };

  ISG.depo.olayKaydet = function (kayit) {
    var veri = depo.al();
    var sonuc = kaydetListede(veri.olaylar, kayit, 'o');
    depo.kaydet();
    return sonuc;
  };

  ISG.depo.olaySil = function (id) {
    var veri = depo.al();
    veri.olaylar = silListeden(veri.olaylar, id);
    depo.kaydet();
  };

  ISG.depo.dosyaKaydet = function (kayit) {
    var veri = depo.al();
    kayit.no = Number(kayit.no) || 0;
    if (!kayit.no) {
      var kardesler = veri.dosyalar.filter(function (d) { return d.isyeriId === kayit.isyeriId; });
      kayit.no = kardesler.reduce(function (enBuyuk, d) { return Math.max(enBuyuk, Number(d.no) || 0); }, 0) + 1;
    }
    var sonuc = kaydetListede(veri.dosyalar, kayit, 'd');
    depo.kaydet();
    return sonuc;
  };

  ISG.depo.dosyaSil = function (id) {
    var veri = depo.al();
    veri.dosyalar = silListeden(veri.dosyalar, id);
    veri.belgeler = (veri.belgeler || []).filter(function (belge) { return belge.dosyaId !== id; });
    depo.kaydet();
  };

  /* ---------- Belge (dosya eki) işlemleri ---------- */

  ISG.BELGE_SINIRI = 1024 * 1024;

  ISG.depo.belgeler = function (dosyaId) {
    if (!dosyaId) { return []; }
    return (depo.al().belgeler || []).filter(function (belge) { return belge.dosyaId === dosyaId; });
  };

  ISG.depo.belgeBul = function (id) {
    if (!id) { return null; }
    return (depo.al().belgeler || []).filter(function (belge) { return belge.id === id; })[0] || null;
  };

  ISG.depo.belgeKaydet = function (kayit) {
    var veri = depo.al();
    var belgeler = veri.belgeler = veri.belgeler || [];
    kayit.id = kayit.id || ISG.yeniId('bl');
    kayit.tarih = kayit.tarih || ISG.bicim.bugunIso();
    kayit.boyut = Number(kayit.boyut) || 0;
    var yer = -1;
    belgeler.forEach(function (belge, i) { if (belge.id === kayit.id) { yer = i; } });
    var onceki = yer >= 0 ? belgeler[yer] : null;
    if (yer >= 0) { belgeler[yer] = kayit; } else { belgeler.push(kayit); }
    if (!depo.kaydet()) {
      if (yer >= 0) { belgeler[yer] = onceki; } else { belgeler.pop(); }
      throw new Error('Belge kaydedilemedi: tarayıcı depolama alanı dolu. Daha küçük bir dosya deneyin veya eski belgeleri silin.');
    }
    return kayit;
  };

  ISG.depo.belgeSil = function (id) {
    var veri = depo.al();
    veri.belgeler = (veri.belgeler || []).filter(function (belge) { return belge.id !== id; });
    depo.kaydet();
  };

  ISG.depo.belgeBoyutu = function (dosyaId) {
    return (depo.al().belgeler || []).reduce(function (toplam, belge) {
      if (dosyaId && belge.dosyaId !== dosyaId) { return toplam; }
      return toplam + (Number(belge.boyut) || 0);
    }, 0);
  };

  ISG.depo.dosyaDurumToplu = function (isyeriId, durum) {
    var veri = depo.al();
    var sayi = 0;
    veri.dosyalar.forEach(function (dosya) {
      if (dosya.isyeriId === isyeriId && dosya.durum === 'incelenmedi') { dosya.durum = durum; sayi += 1; }
    });
    depo.kaydet();
    return sayi;
  };

  ISG.depo.planKaydet = function (kayit) {
    var veri = depo.al();
    kayit.sira = Number(kayit.sira) || 1;
    var sonuc = kaydetListede(veri.planlar, kayit, 'pl');
    depo.kaydet();
    return sonuc;
  };

  ISG.depo.planSil = function (id) {
    var veri = depo.al();
    veri.planlar = silListeden(veri.planlar, id);
    depo.kaydet();
  };

  ISG.depo.planDurumDegistir = function (id, durum) {
    var veri = depo.al();
    veri.planlar.forEach(function (plan) {
      if (plan.id !== id) { return; }
      plan.durum = durum;
      if (durum === 'tamamlandi') { plan.tamamlanmaTarihi = new Date().toISOString().slice(0, 10); }
    });
    depo.kaydet();
  };

  ISG.depo.tespitKaydet = function (kayit) {
    var veri = depo.al();
    var sonuc = kaydetListede(veri.tespitler, kayit, 't');
    depo.kaydet();
    return sonuc;
  };

  ISG.depo.tespitSil = function (id) {
    var veri = depo.al();
    veri.tespitler = silListeden(veri.tespitler, id);
    depo.kaydet();
  };

  ISG.depo.tespitDurumDegistir = function (id, durum) {
    var veri = depo.al();
    veri.tespitler.forEach(function (tespit) {
      if (tespit.id !== id) { return; }
      tespit.durum = durum;
      if (durum === 'kapali') { tespit.dogrulama = new Date().toISOString().slice(0, 10); }
    });
    depo.kaydet();
  };

  ISG.depo.riskEkipKaydet = function (isyeriId, alanlar) {
    var veri = depo.al();
    var kayit = ISG.ilgiliKayit(veri, 'riskEkipleri', isyeriId);
    if (!kayit) {
      kayit = { isyeriId: isyeriId, sonDegerlendirme: '', enGecYenileme: '', uyeler: {} };
      veri.riskEkipleri.push(kayit);
    }
    kayit.sonDegerlendirme = alanlar.sonDegerlendirme || '';
    kayit.enGecYenileme = alanlar.enGecYenileme || '';
    kayit.uyeler = kayit.uyeler || {};
    ISG.RISK_ROLLERI.forEach(function (rol) {
      if (Object.prototype.hasOwnProperty.call(alanlar, rol.id)) {
        kayit.uyeler[rol.id] = alanlar[rol.id] || '';
      }
    });
    depo.kaydet();
    return kayit;
  };

  ISG.depo.acilPlanKaydet = function (isyeriId, alanlar) {
    var veri = depo.al();
    var kayit = ISG.ilgiliKayit(veri, 'acilPlanlar', isyeriId);
    if (!kayit) {
      kayit = { isyeriId: isyeriId, hazirlanma: '', sonYenileme: '', tatbikat: '', ekip: [] };
      veri.acilPlanlar.push(kayit);
    }
    kayit.hazirlanma = alanlar.hazirlanma || '';
    kayit.sonYenileme = alanlar.sonYenileme || '';
    kayit.tatbikat = alanlar.tatbikat || '';
    depo.kaydet();
    return kayit;
  };

  ISG.depo.riskEkipUyeEkle = function (isyeriId, rol, ad, personelId) {
    var veri = depo.al();
    var kayit = ISG.ilgiliKayit(veri, 'riskEkipleri', isyeriId);
    if (!kayit) {
      kayit = { isyeriId: isyeriId, sonDegerlendirme: '', enGecYenileme: '', uyeler: {}, uyeIdleri: {} };
      veri.riskEkipleri.push(kayit);
    }
    kayit.uyeler = kayit.uyeler || {};
    kayit.uyeler[rol] = ad || '';
    if (personelId) {
      kayit.uyeIdleri = kayit.uyeIdleri || {};
      kayit.uyeIdleri[rol] = personelId;
    }
    depo.kaydet();
    return kayit;
  };

  ISG.depo.riskEkipUyeSil = function (isyeriId, rol) {
    var veri = depo.al();
    var kayit = ISG.ilgiliKayit(veri, 'riskEkipleri', isyeriId);
    if (!kayit) { return null; }
    if (kayit.uyeler) { kayit.uyeler[rol] = ''; }
    if (kayit.uyeIdleri) { delete kayit.uyeIdleri[rol]; }
    depo.kaydet();
    return kayit;
  };

  ISG.depo.acilEkipEkle = function (isyeriId, rol, ad, personelId) {
    var veri = depo.al();
    var kayit = ISG.ilgiliKayit(veri, 'acilPlanlar', isyeriId);
    if (!kayit) {
      kayit = { isyeriId: isyeriId, hazirlanma: '', sonYenileme: '', tatbikat: '', ekip: [] };
      veri.acilPlanlar.push(kayit);
    }
    kayit.ekip = (kayit.ekip || []).filter(function (uye) { return uye.rol !== rol; });
    if (ad) {
      kayit.ekip.push({ rol: rol, ad: ad, personelId: personelId || '' });
    }
    depo.kaydet();
    return kayit;
  };

  ISG.depo.acilEkipSil = function (isyeriId, rol) {
    var veri = depo.al();
    var kayit = ISG.ilgiliKayit(veri, 'acilPlanlar', isyeriId);
    if (!kayit) { return null; }
    kayit.ekip = (kayit.ekip || []).filter(function (uye) { return uye.rol !== rol; });
    depo.kaydet();
    return kayit;
  };

  ISG.depo.davetKaydet = function (kayit) {
    var veri = depo.al();
    kayit.tarih = kayit.tarih || new Date().toISOString().slice(0, 10);
    kayit.durum = kayit.durum || 'bekliyor';
    kayit.kod = kayit.kod || davetKoduUret();
    var sonuc = kaydetListede(veri.davetler, kayit, 'dv');
    depo.kaydet();
    return sonuc;
  };

  ISG.depo.davetSil = function (id) {
    var veri = depo.al();
    veri.davetler = silListeden(veri.davetler, id);
    depo.kaydet();
  };
  /* ---------- Kullanıcılar ve davet kabulü ---------- */

  ISG.depo.kullaniciBul = function (id) {
    if (!id) { return null; }
    return (depo.al().kullanicilar || []).filter(function (kullanici) { return kullanici.id === id; })[0] || null;
  };

  ISG.depo.kullaniciEpostaBul = function (eposta) {
    var hedef = String(eposta || '').trim().toLowerCase();
    if (!hedef) { return null; }
    return (depo.al().kullanicilar || []).filter(function (kullanici) {
      return String(kullanici.eposta || '').toLowerCase() === hedef;
    })[0] || null;
  };

  ISG.depo.kullaniciKaydet = function (kayit) {
    var veri = depo.al();
    kayit.eposta = String(kayit.eposta || '').trim().toLowerCase();
    kayit.isyerleri = Array.isArray(kayit.isyerleri) ? kayit.isyerleri : [];
    var sonuc = kaydetListede(veri.kullanicilar, kayit, 'u');
    depo.kaydet();
    return sonuc;
  };

  ISG.depo.kullaniciSil = function (id) {
    var veri = depo.al();
    veri.kullanicilar = silListeden(veri.kullanicilar, id);
    depo.kaydet();
  };

  ISG.depo.kullaniciGirisIsaretle = function (id) {
    var kullanici = ISG.depo.kullaniciBul(id);
    if (!kullanici) { return null; }
    kullanici.sonGiris = new Date().toISOString();
    depo.kaydet();
    return kullanici;
  };

  ISG.depo.davetKodBul = function (kod) {
    var hedef = String(kod || '').trim().toUpperCase();
    if (!hedef) { return null; }
    return (depo.al().davetler || []).filter(function (davet) {
      return String(davet.kod || '').toUpperCase() === hedef;
    })[0] || null;
  };

  ISG.depo.davetKabul = function (id, kullaniciId) {
    var veri = depo.al();
    var davet = (veri.davetler || []).filter(function (kayit) { return kayit.id === id; })[0];
    if (!davet) { return null; }
    davet.durum = 'kabul';
    davet.kabulTarihi = new Date().toISOString().slice(0, 10);
    davet.kullaniciId = kullaniciId || '';
    depo.kaydet();
    return davet;
  };

  /* ---------- Onay kuyruğu ---------- */

  ISG.depo.talepKaydet = function (kayit) {
    var veri = depo.al();
    kayit.olusturma = kayit.olusturma || new Date().toISOString();
    kayit.durum = kayit.durum || 'bekliyor';
    var sonuc = kaydetListede(veri.talepler, kayit, 'tp');
    depo.kaydet();
    return sonuc;
  };

  ISG.depo.talepBul = function (id) {
    if (!id) { return null; }
    return (depo.al().talepler || []).filter(function (talep) { return talep.id === id; })[0] || null;
  };

  ISG.depo.talepKarar = function (id, durum, kararVeren, not) {
    var talep = ISG.depo.talepBul(id);
    if (!talep) { return null; }
    talep.durum = durum;
    talep.kararTarihi = new Date().toISOString();
    talep.kararVeren = kararVeren || '';
    talep.kararNotu = not || '';
    depo.kaydet();
    return talep;
  };

  ISG.depo.talepSil = function (id) {
    var veri = depo.al();
    veri.talepler = silListeden(veri.talepler, id);
    depo.kaydet();
  };

  /* ---------- Denetim izi ---------- */

  ISG.depo.denetimEkle = function (kayit) {
    var veri = depo.al();
    var girdi = kayit || {};
    girdi.id = girdi.id || ISG.yeniId('dn');
    girdi.tarih = girdi.tarih || new Date().toISOString();
    veri.denetim = veri.denetim || [];
    veri.denetim.unshift(girdi);
    if (veri.denetim.length > 400) { veri.denetim = veri.denetim.slice(0, 400); }
    depo.kaydet();
    return girdi;
  };

  ISG.depo.denetimTemizle = function () {
    var veri = depo.al();
    veri.denetim = [];
    depo.kaydet();
  };

  ISG.depo.ayarKaydet = function (alanlar) {
    var veri = depo.al();
    veri.ayarlar = veri.ayarlar || {};
    Object.keys(alanlar || {}).forEach(function (anahtar) { veri.ayarlar[anahtar] = alanlar[anahtar]; });
    depo.kaydet();
    return veri.ayarlar;
  };
})(window);


