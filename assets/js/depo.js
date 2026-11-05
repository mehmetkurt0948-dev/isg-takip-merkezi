/* İSG Takip Merkezi — alan kuralları, veri katmanı ve görev motoru */
(function (global) {
  'use strict';

  var ISG = global.ISG = global.ISG || {};
  var ANAHTAR = 'isgtakip.v4';
  var ESKI_ANAHTARLAR = ['isgtakip.v3', 'isgtakip.v2'];
  var SURUM = 4;

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
    meslekHastaligi: { ad: 'Meslek hastalığı', sinif: 'tehlike' },
    cevresel: { ad: 'Çevresel olay', sinif: 'bilgi' }
  };

  /* İş kazası ve meslek hastalığı kayıtları aynı bildirim formunda ve aynı listede tutulur. */
  ISG.kazaKaydi = function (olay) {
    return !!olay && (olay.tur === 'isKazasi' || olay.tur === 'meslekHastaligi');
  };

  ISG.kazaKaydiAdi = function (olay) {
    var tanim = ISG.OLAY_TURLERI[(olay && olay.tur) || ''];
    return tanim ? tanim.ad : 'Kayıt';
  };

  /* İş kazası yaralanma sınıflandırması */
  ISG.YARALANMA_BOLGELERI = [
    { id: 'bas', ad: 'Baş / yüz' },
    { id: 'goz', ad: 'Göz' },
    { id: 'sirt', ad: 'Sırt / bel' },
    { id: 'kol', ad: 'Kol / omuz' },
    { id: 'el', ad: 'El / parmak' },
    { id: 'bacak', ad: 'Bacak / diz' },
    { id: 'ayak', ad: 'Ayak / bilek' },
    { id: 'icOrgan', ad: 'İç organ / solunum' },
    { id: 'cilt', ad: 'Cilt / genel' }
  ];

  ISG.YARALANMA_TURLERI = [
    { id: 'ezilme', ad: 'Ezilme / sıkışma' },
    { id: 'kesik', ad: 'Kesik / batma' },
    { id: 'burkulma', ad: 'Burkulma / zorlanma' },
    { id: 'kirik', ad: 'Kırık / çıkık' },
    { id: 'yanik', ad: 'Yanık' },
    { id: 'yabanciCisim', ad: 'Yabancı cisim' },
    { id: 'kimyasal', ad: 'Kimyasal temas' },
    { id: 'elektrik', ad: 'Elektrik çarpması' },
    { id: 'diger', ad: 'Diğer' }
  ];

  /* Meslek hastalığı tanı türleri — bildirim formunda yaralanma türü alanının yerini alır. */
  ISG.HASTALIK_TURLERI = [
    { id: 'solunum', ad: 'Solunum yolu hastalığı' },
    { id: 'cilt', ad: 'Deri hastalığı' },
    { id: 'kasIskelet', ad: 'Kas-iskelet hastalığı' },
    { id: 'isitme', ad: 'İşitme kaybı' },
    { id: 'sinir', ad: 'Sinir sistemi hastalığı' },
    { id: 'zehirlenme', ad: 'Zehirlenme / maruziyet' },
    { id: 'diger', ad: 'Diğer' }
  ];

  /* SGK meslek hastalığı grupları — tanı sınıflandırması için kullanılır. */
  ISG.MESLEK_HASTALIK_GRUPLARI = [
    { id: 'a', ad: 'A · Kimyasal etkenler', sinif: 'tehlike' },
    { id: 'b', ad: 'B · Fiziksel etkenler', sinif: 'uyari' },
    { id: 'c', ad: 'C · Biyolojik etkenler', sinif: 'uyari' },
    { id: 'd', ad: 'D · Tozlar (pnömokonyoz)', sinif: 'tehlike' },
    { id: 'e', ad: 'E · Ergonomik / diğer', sinif: 'bilgi' }
  ];

  /* İş kazası kök neden sınıflandırması — istatistik kırılımı bu listeye dayanır.
     Serbest metin kök neden açıklaması (`kokNeden`) ayrıca saklanır. */
  ISG.KAZA_NEDENLERI = [
    { id: 'kkd', ad: 'KKD kullanılmaması', sinif: 'tehlike' },
    { id: 'makine', ad: 'Makine koruyucusu / kilitleme eksikliği', sinif: 'tehlike' },
    { id: 'ekipman', ad: 'Arızalı veya uygun olmayan ekipman', sinif: 'uyari' },
    { id: 'yontem', ad: 'Uygun olmayan çalışma yöntemi', sinif: 'uyari' },
    { id: 'egitim', ad: 'Eğitim / bilgilendirme yetersizliği', sinif: 'bilgi' },
    { id: 'dikkatsizlik', ad: 'Dikkatsizlik / hatalı davranış', sinif: 'uyari' },
    { id: 'ortam', ad: 'Zemin ve ortam koşulları', sinif: 'bilgi' },
    { id: 'kimyasal', ad: 'Kimyasal / malzeme teması', sinif: 'tehlike' },
    { id: 'elektrik', ad: 'Elektrik ve enerji', sinif: 'tehlike' },
    { id: 'trafik', ad: 'Araç ve trafik düzeni', sinif: 'bilgi' },
    { id: 'diger', ad: 'Diğer / belirlenemedi', sinif: 'notr' }
  ];

  /* Kayıp gün aralıkları — kaza şiddeti dağılımı */
  ISG.KAYIP_GUN_ARALIKLARI = [
    { id: 'yok', ad: 'Kayıp yok', enAz: 0, enCok: 0, sinif: 'bilgi' },
    { id: 'kisa', ad: '1–3 gün', enAz: 1, enCok: 3, sinif: 'uyari' },
    { id: 'orta', ad: '4–7 gün', enAz: 4, enCok: 7, sinif: 'uyari' },
    { id: 'uzun', ad: '8–14 gün', enAz: 8, enCok: 14, sinif: 'tehlike' },
    { id: 'cokUzun', ad: '15 gün ve üzeri', enAz: 15, enCok: Infinity, sinif: 'tehlike' }
  ];

  ISG.kayipGunAraligi = function (gun) {
    var deger = Math.max(0, Number(gun) || 0);
    for (var i = 0; i < ISG.KAYIP_GUN_ARALIKLARI.length; i += 1) {
      var aralik = ISG.KAYIP_GUN_ARALIKLARI[i];
      if (deger >= aralik.enAz && deger <= aralik.enCok) { return aralik; }
    }
    return ISG.KAYIP_GUN_ARALIKLARI[ISG.KAYIP_GUN_ARALIKLARI.length - 1];
  };

  /* İş kazası şiddet sınıfı — SGK bildirim sınıflandırması.
     Ölüm sınıfında kayıp iş günü sabit 6.000 gün alınır. */
  ISG.KAZA_SIDDETLERI = [
    { id: 'hafifOrta', ad: 'Hafif / orta', sinif: 'uyari' },
    { id: 'agir', ad: 'Ağır', sinif: 'tehlike' },
    { id: 'uzuvKaybi', ad: 'Uzuv kaybı', sinif: 'tehlike' },
    { id: 'olum', ad: 'Ölüm', sinif: 'tehlike', kayipGunSabit: 6000 }
  ];

  ISG.VARDIYALAR = [
    { id: '1', ad: '1. vardiya' },
    { id: '2', ad: '2. vardiya' },
    { id: '3', ad: '3. vardiya' },
    { id: 'gunduz', ad: 'Gündüz / normal' }
  ];

  ISG.EVET_HAYIR = [
    { id: 'evet', ad: 'Evet' },
    { id: 'hayir', ad: 'Hayır' }
  ];

  /* Ölümle sonuçlanan kazada varsayılan kayıp iş günü. */
  ISG.OLUM_KAYIP_GUN = 6000;

  /* Kişi başına aylık çalışma saati varsayımı (45 saat/hafta ≈ 176 saat/ay).
     Çalışılan saat ayrıca tutulmadığı için SGK oranları bu varsayıma dayanır. */
  ISG.AYLIK_KISI_SAATI = 176;

  ISG.siddetTanim = function (id) {
    var liste = ISG.KAZA_SIDDETLERI || [];
    for (var i = 0; i < liste.length; i += 1) {
      if (liste[i].id === id) { return liste[i]; }
    }
    return null;
  };

  /* İki ISO tarih arasındaki gün sayısı (bitiş − başlangıç); tarih eksikse null. */
  ISG.tarihFarki = function (baslangic, bitis) {
    var bas = String(baslangic || '').slice(0, 10);
    var bit = String(bitis || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bas) || !/^\d{4}-\d{2}-\d{2}$/.test(bit)) { return null; }
    var basTarih = Date.UTC(Number(bas.slice(0, 4)), Number(bas.slice(5, 7)) - 1, Number(bas.slice(8, 10)));
    var bitTarih = Date.UTC(Number(bit.slice(0, 4)), Number(bit.slice(5, 7)) - 1, Number(bit.slice(8, 10)));
    return Math.round((bitTarih - basTarih) / 86400000);
  };

  /* Kaza kaydının kayıp iş günü: ölüm > istirahat aralığı > elle girilen değer. */
  ISG.kazaKayipGun = function (kaza) {
    if (!kaza) { return 0; }
    if (kaza.siddet === 'olum') { return ISG.OLUM_KAYIP_GUN; }
    var fark = ISG.tarihFarki(kaza.istirahatBaslangic, kaza.istirahatBitis);
    if (fark !== null) { return Math.max(0, fark + 1); }
    return Math.max(0, Number(kaza.kayipGun) || 0);
  };

  /* Ayın sonuna kadar işe başlamış (pasif olmayan) personel sayısı; ay: 'YYYY-MM'. */
  ISG.ayAktifPersonel = function (personel, ayAnahtari) {
    var ay = String(ayAnahtari || '').slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(ay)) { return 0; }
    var aySonu = ay + '-31';
    var sayi = 0;
    (personel || []).forEach(function (kisi) {
      if (!kisi || kisi.durum === 'pasif') { return; }
      var bas = String(kisi.iseBaslama || '').slice(0, 10);
      if (bas && bas > aySonu) { return; }
      sayi += 1;
    });
    return sayi;
  };

  /* Kıdem aralıkları — yeni çalışanlarda kaza yoğunluğunu gösterir */
  ISG.KIDEM_ARALIKLARI = [
    { id: 'yeni', ad: '0–1 yıl', enAz: 0, enCok: 1, sinif: 'tehlike' },
    { id: 'gelisim', ad: '1–3 yıl', enAz: 1, enCok: 3, sinif: 'uyari' },
    { id: 'deneyimli', ad: '3–5 yıl', enAz: 3, enCok: 5, sinif: 'bilgi' },
    { id: 'kidemli', ad: '5 yıl ve üzeri', enAz: 5, enCok: Infinity, sinif: 'iyi' }
  ];

  /* İşe başlama ile olay tarihi arasındaki tam yıl; tarih eksikse null. */
  ISG.kidemYil = function (iseBaslama, tarih) {
    var bas = String(iseBaslama || '').slice(0, 10);
    var bit = String(tarih || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bas) || !/^\d{4}-\d{2}-\d{2}$/.test(bit)) { return null; }
    var yil = Number(bit.slice(0, 4)) - Number(bas.slice(0, 4));
    if (bit.slice(5, 10) < bas.slice(5, 10)) { yil -= 1; }
    return yil < 0 ? 0 : yil;
  };

  ISG.kidemAraligi = function (yil) {
    if (yil === null || typeof yil === 'undefined') { return null; }
    for (var i = 0; i < ISG.KIDEM_ARALIKLARI.length; i += 1) {
      var aralik = ISG.KIDEM_ARALIKLARI[i];
      if (yil >= aralik.enAz && yil < aralik.enCok) { return aralik; }
    }
    return ISG.KIDEM_ARALIKLARI[ISG.KIDEM_ARALIKLARI.length - 1];
  };

  /* { id, ad } listelerinden görünen ad üretir. */
  ISG.listeAdi = function (liste, id, varsayilan) {
    if (!id) { return varsayilan || 'Belirtilmedi'; }
    var bulunan = (liste || []).filter(function (oge) { return oge.id === id; })[0];
    return bulunan ? bulunan.ad : (varsayilan || 'Belirtilmedi');
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

  /* Acil durum planı görev grupları. `ad` alanı kayıtlarda görev anahtarı olarak
     kullanılır; bu yüzden mevcut adlar korunur (eski kayıtlar yerinde kalır). */
  ISG.ACIL_ROLLERI = [
    { id: 'koordinator', ad: 'Acil durum koordinatörü' },
    { id: 'uzman', ad: 'İş güvenliği uzmanı' },
    { id: 'hekim', ad: 'İşyeri hekimi' },
    { id: 'digerSaglik', ad: 'Diğer sağlık personeli' },
    { id: 'ilkyardim', ad: 'İlk yardım ekibi' },
    { id: 'yangin', ad: 'Yangın söndürme ekibi' },
    { id: 'kurtarma', ad: 'Kurtarma ekibi' },
    { id: 'tahliye', ad: 'Tahliye / arama kurtarma' },
    { id: 'koruma', ad: 'Koruma ekibi' },
    { id: 'destek', ad: 'Destek elemanı' }
  ];

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
    /* Ekip üyeleri tek biçimde (rol adı + kimlik) okunur: eski kayıtlardaki
       rol kimliği ya da nesne biçimli ekip alanı görünümde kaybolmaz. */
    var ekip = kayit && ISG.depo && typeof ISG.depo.acilEkipUyeleri === 'function'
      ? ISG.depo.acilEkipUyeleri(kayit)
      : ((kayit && kayit.ekip) || []);
    return {
      son: son || '',
      enGec: enGec,
      kalan: kalan,
      sinif: sinif,
      ekip: ekip
    };
  };

  /* ---------- KVKK: kimlik numarası maskeleme ----------
     T.C. kimlik numarası özel nitelikli veri sayılmasa da gereksiz yerlerde
     açık gösterilmez. Listede maskelenir; tam değeri yalnızca yönetici görür. */
  ISG.tcMaskele = function (tc) {
    var rakam = String(tc || '').replace(/\D/g, '');
    if (rakam.length < 5) { return String(tc || ''); }
    return rakam.slice(0, 3) + '******' + rakam.slice(-2);
  };

  ISG.tcGoster = function (tc) {
    if (!tc) { return ''; }
    var yonetici = false;
    try {
      var o = ISG.yetki && typeof ISG.yetki.oturum === 'function' ? ISG.yetki.oturum() : null;
      yonetici = !!(o && ISG.yetki.rolTanimi(o.rol).yonetir);
    } catch (hata) { yonetici = false; }
    return yonetici ? String(tc) : ISG.tcMaskele(tc);
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
    'riskEkipleri', 'acilPlanlar', 'mevzuat',
    'kullanicilar', 'talepler', 'denetim', 'saglikTakip'
  ];

  /* Bulut eşitlemesinde kayıt bazında birleştirilen listeler. */
  var ESITLEME_ANAHTARLARI = ['isyerleri', 'personel'].concat(LISTE_ANAHTARLARI);
  /* Sağlık dosyası ayrı ve onay korumalı yerel kasada saklanır; genel bulut
     JSON'una hiçbir zaman eklenmez. */
  ESITLEME_ANAHTARLARI = ESITLEME_ANAHTARLARI.filter(function (anahtar) { return anahtar !== 'saglikTakip'; });

  /* Silinen kayıtların mezar taşları bu süre sonunda birleşimden düşer. */
  var MEZAR_OMRU_GUN = 120;

  function yayinla() {
    depoDurumu.dinleyiciler.forEach(function (fn) {
      try { fn(depoDurumu.veri); } catch (hata) { /* dinleyici hatasi uygulamayi durdurmaz */ }
    });
  }
  /* Eski sürümden gelen ya da içe aktarılan veriyi güncel şemaya tamamlar. */
  function veriTamamla(veri) {
    if (!veri) { return veri; }
    LISTE_ANAHTARLARI.forEach(function (anahtar) {
      veri[anahtar] = Array.isArray(veri[anahtar]) ? veri[anahtar] : [];
    });
    veri.isyerleri = Array.isArray(veri.isyerleri) ? veri.isyerleri : [];
    veri.personel = Array.isArray(veri.personel) ? veri.personel : [];
    veri.ayarlar = veri.ayarlar || {};

    /* v7: kayıt bazlı eşitleme bilgisi. `kayit` kimlik→son değişiklik zamanı,
       `silinen` silinen kayıtların mezar taşı zamanıdır. */
    var senkron = veri.senkron && typeof veri.senkron === 'object' ? veri.senkron : {};
    veri.senkron = {
      kayit: senkron.kayit && typeof senkron.kayit === 'object' ? senkron.kayit : {},
      silinen: senkron.silinen && typeof senkron.silinen === 'object' ? senkron.silinen : {},
      ayarlar: String(senkron.ayarlar || '')
    };

    /* v4: olay kayıtlarına iş kazası yaralanma ve kök neden sınıfı alanları eklendi. */
    (veri.olaylar || []).forEach(function (olay) {
      olay.kayipGun = Number(olay.kayipGun) || 0;
      olay.vucutBolgesi = olay.vucutBolgesi || '';
      olay.yaralanmaTuru = olay.yaralanmaTuru || '';
      olay.saglikKurulusu = olay.saglikKurulusu || '';
      olay.neden = olay.neden || '';

      /* v5: şiddet sınıfı, vardiya, hastane sevk ve istirahat tarihleri. */
      var siddet = ISG.siddetTanim(olay.siddet);
      olay.siddet = siddet ? siddet.id : '';
      olay.vardiya = olay.vardiya || '';
      olay.hastaneSevk = olay.hastaneSevk === 'evet' || olay.hastaneSevk === 'hayir' ? olay.hastaneSevk : '';
      olay.istirahatBaslangic = String(olay.istirahatBaslangic || '').slice(0, 10);
      olay.istirahatBitis = String(olay.istirahatBitis || '').slice(0, 10);

      /* v6: meslek hastalığı kayıtları için SGK hastalık grubu ve etken alanları. */
      var hastalikGrubuGecerli = (ISG.MESLEK_HASTALIK_GRUPLARI || []).filter(function (grup) {
        return grup.id === olay.hastalikGrubu;
      }).length > 0;
      olay.hastalikGrubu = olay.tur === 'meslekHastaligi' && hastalikGrubuGecerli ? olay.hastalikGrubu : '';
      olay.etken = olay.tur === 'meslekHastaligi' ? (olay.etken || '') : '';

      /* Ölüm ve istirahat aralığı kayıp günün kaynağıdır; elle girilen değer yalnızca yedektir. */
      if (ISG.kazaKaydi(olay)) { olay.kayipGun = ISG.kazaKayipGun(olay); }
    });

    var kullaniciVar = (veri.kullanicilar || []).length > 0;
    if (!kullaniciVar && typeof ISG.YONETICI_HESAP === 'function') {
      /* Yönetici hesabı olmadan giriş yapılamaz: örnek hesaplar değil,
         yalnızca gerçek yönetici hesabı eklenir. */
      veri.kullanicilar = ISG.YONETICI_HESAP();

      /* ENGIN EKLE: enginozcan1402@gmail.com hesabı her cihazda yerel olarak 
      olsun, bulut senkronizasyonu kapalıysa bile giriş yapılabilsin. */
      veri.kullanicilar.push({
        id: 'u2', adSoyad: 'Engin Özcan', eposta: 'enginozcan1402@gmail.com',
        sifre: '1402', rol: 'yetkili', gorev: 'İSG Güvenliği Uzmanı',
        isyerleri: [], aktif: true, sonGiris: ''
      });
    }

    veri.surum = SURUM;
    return veri;
  }

  /* Sıfırlamada gerçek hesaplar korunur; aksi hâlde siteye giriş kapanabilir.
     Hiç hesap kalmadıysa boş verideki yönetici tanımı devreye girer. */
  function korunanHesaplar(liste) {
    var kalanlar = (liste || []).filter(function (kullanici) {
      return !!(kullanici && kullanici.eposta);
    });
    return kalanlar.length ? kalanlar : (typeof ISG.YONETICI_HESAP === 'function' ? ISG.YONETICI_HESAP() : []);
  }

  /* ---------- Kayıt bazlı eşitleme ---------- */

  /* Yerelde son kaydedilen hâlin anlık görüntüsü: kaydet() hangi kayıtların
     değiştiğini ve hangilerinin silindiğini buradan anlar. */
  var temel = { kayitlar: {}, ayarlar: '' };

  function esitlemeKodu(anahtar, id) { return anahtar + '|' + id; }

  function temelAl(veri) {
    temel.kayitlar = {};
    ESITLEME_ANAHTARLARI.forEach(function (anahtar) {
      (veri[anahtar] || []).forEach(function (kayit) {
        if (kayit && kayit.id) { temel.kayitlar[esitlemeKodu(anahtar, kayit.id)] = JSON.stringify(kayit); }
      });
    });
    temel.ayarlar = JSON.stringify(veri.ayarlar || {});
  }

  function enYeniZaman(a, b) {
    a = String(a || '');
    b = String(b || '');
    return a > b ? a : b;
  }

  function kayitZamani(kayit, senkron, kod) {
    if (!kayit) { return ''; }
    return String(kayit.guncelleme || (senkron && senkron.kayit[kod]) || '');
  }

  function mezarTaslariniBudat(veri, simdi) {
    var sinir = new Date(new Date(simdi).getTime() - MEZAR_OMRU_GUN * 24 * 60 * 60 * 1000).toISOString();
    Object.keys(veri.senkron.silinen).forEach(function (kod) {
      if (veri.senkron.silinen[kod] < sinir) { delete veri.senkron.silinen[kod]; }
    });
  }

  /* kaydet() öncesi çalışır: değişen kayıtları damgalar, silinenlere mezar
     taşı bırakır. Böylece bulut eşitlemesi kayıt kayıt karşılaştırma yapar. */
  function degisiklikDamgala(veri, simdi) {
    veri.senkron = veri.senkron && typeof veri.senkron === 'object' ? veri.senkron : {};
    veri.senkron.kayit = veri.senkron.kayit || {};
    veri.senkron.silinen = veri.senkron.silinen || {};
    ESITLEME_ANAHTARLARI.forEach(function (anahtar) {
      var gorulen = {};
      (veri[anahtar] || []).forEach(function (kayit) {
        if (!kayit || !kayit.id) { return; }
        var kod = esitlemeKodu(anahtar, kayit.id);
        gorulen[kod] = true;
        if (temel.kayitlar[kod] === JSON.stringify(kayit)) { return; }
        kayit.guncelleme = simdi;
        veri.senkron.kayit[kod] = simdi;
        delete veri.senkron.silinen[kod];
        temel.kayitlar[kod] = JSON.stringify(kayit);
      });
      Object.keys(temel.kayitlar).forEach(function (kod) {
        if (gorulen[kod] || kod.indexOf(anahtar + '|') !== 0) { return; }
        veri.senkron.silinen[kod] = simdi;
        delete veri.senkron.kayit[kod];
        delete temel.kayitlar[kod];
      });
    });

    var ayarOzeti = JSON.stringify(veri.ayarlar || {});
    if (temel.ayarlar !== ayarOzeti) {
      veri.senkron.ayarlar = simdi;
      temel.ayarlar = ayarOzeti;
    }
    mezarTaslariniBudat(veri, simdi);
  }

  function senkronBirlestir(yerelSenkron, uzakSenkron) {
    var birlesik = { kayit: {}, silinen: {}, ayarlar: enYeniZaman(yerelSenkron.ayarlar, uzakSenkron.ayarlar) };
    ['kayit', 'silinen'].forEach(function (tur) {
      Object.keys(uzakSenkron[tur] || {}).forEach(function (kod) {
        birlesik[tur][kod] = uzakSenkron[tur][kod];
      });
      Object.keys(yerelSenkron[tur] || {}).forEach(function (kod) {
        birlesik[tur][kod] = enYeniZaman(birlesik[tur][kod], yerelSenkron[tur][kod]);
      });
    });
    return birlesik;
  }

  function kayitHaritasi(liste) {
    var harita = {};
    (liste || []).forEach(function (kayit) { if (kayit && kayit.id) { harita[kayit.id] = kayit; } });
    return harita;
  }

  /* Anahtar sırasından ve liste sırasından bağımsız karşılaştırma metni.
     Sunucu jsonb alanı anahtarları yeniden sıraladığı için düz metin
     karşılaştırması yanıltıcı olurdu. */
  function kanonikMetin(deger) {
    if (deger === null || deger === undefined) { return 'null'; }
    if (typeof deger !== 'object') { return JSON.stringify(deger); }
    if (Array.isArray(deger)) {
      return '[' + deger.map(kanonikMetin).join(',') + ']';
    }
    return '{' + Object.keys(deger).sort().map(function (anahtar) {
      return JSON.stringify(anahtar) + ':' + kanonikMetin(deger[anahtar]);
    }).join(',') + '}';
  }

  function esitlemeOzeti(veri) {
    if (!veri) { return ''; }
    var kopya = {};
    Object.keys(veri).forEach(function (anahtar) { kopya[anahtar] = veri[anahtar]; });
    ESITLEME_ANAHTARLARI.forEach(function (anahtar) {
      kopya[anahtar] = (veri[anahtar] || []).slice().sort(function (a, b) {
        return String((a && a.id) || '') < String((b && b.id) || '') ? -1 : 1;
      });
    });
    return kanonikMetin(kopya);
  }

  /* Tek bir kimlik için yerel ve uzak kopyadan geçerli olanı seçer.
     Silme mezar taşı her iki taraftaki değişiklikten yeniyse kayıt düşer. */
  function kayitSec(baglam, anahtar, id, uzakKayit, yerelKayit) {
    var kod = esitlemeKodu(anahtar, id);
    var yerelZaman = kayitZamani(yerelKayit, baglam.yerelSenkron, kod);
    var uzakZaman = kayitZamani(uzakKayit, baglam.uzakSenkron, kod);
    var silinme = enYeniZaman(baglam.yerelSenkron.silinen[kod], baglam.uzakSenkron.silinen[kod]);
    if (silinme && silinme >= enYeniZaman(yerelZaman, uzakZaman)) { return null; }
    if (yerelKayit && uzakKayit) { return yerelZaman > uzakZaman ? yerelKayit : uzakKayit; }
    return yerelKayit || uzakKayit;
  }

  /* İki veri kümesini kayıt bazında birleştirir. `yerelFazla` birleşimde
     buluta yazılacak yenilik, `uzakFazla` bu cihaza inecek yenilik var demektir. */
  function birlestir(yerel, uzak) {
    if (!uzak) { return { veri: yerel, yerelFazla: !!yerel, uzakFazla: false }; }
    if (!yerel) { return { veri: uzak, yerelFazla: false, uzakFazla: true }; }

    var baglam = {
      yerelSenkron: yerel.senkron || { kayit: {}, silinen: {}, ayarlar: '' },
      uzakSenkron: uzak.senkron || { kayit: {}, silinen: {}, ayarlar: '' }
    };
    var sonuc = {};
    Object.keys(uzak).forEach(function (anahtar) { sonuc[anahtar] = uzak[anahtar]; });

    var mevcut = {};
    ESITLEME_ANAHTARLARI.forEach(function (anahtar) {
      var yerelHarita = kayitHaritasi(yerel[anahtar]);
      var uzakHarita = kayitHaritasi(uzak[anahtar]);
      var islenen = {};
      var birlesik = [];

      function ekle(kayit, uzakKayit, yerelKayit) {
        var secilen = kayitSec(baglam, anahtar, kayit.id, uzakKayit, yerelKayit);
        if (!secilen) { return; }
        birlesik.push(secilen);
        mevcut[esitlemeKodu(anahtar, kayit.id)] = true;
      }

      (uzak[anahtar] || []).forEach(function (kayit) {
        if (!kayit || !kayit.id) { birlesik.push(kayit); return; }
        islenen[kayit.id] = true;
        ekle(kayit, kayit, yerelHarita[kayit.id]);
      });
      (yerel[anahtar] || []).forEach(function (kayit) {
        if (!kayit || !kayit.id || islenen[kayit.id]) { return; }
        islenen[kayit.id] = true;
        ekle(kayit, uzakHarita[kayit.id], kayit);
      });

      sonuc[anahtar] = birlesik;
    });

    /* Ayarlar tek nesne olarak, en son değişen tarafın kopyasıyla gelir. */
    var ayarSahibi = String(baglam.yerelSenkron.ayarlar || '') > String(baglam.uzakSenkron.ayarlar || '') ? yerel : uzak;
    sonuc.ayarlar = (ayarSahibi && ayarSahibi.ayarlar) || {};
    sonuc.senkron = senkronBirlestir(baglam.yerelSenkron, baglam.uzakSenkron);
    /* Var olmayan kayıtların damgası tutulmaz; silme bilgisi mezar taşındadır. */
    Object.keys(sonuc.senkron.kayit).forEach(function (kod) {
      if (!mevcut[kod]) { delete sonuc.senkron.kayit[kod]; }
    });
    sonuc.surum = uzak.surum || yerel.surum;
    veriTamamla(sonuc);

    return {
      veri: sonuc,
      yerelFazla: esitlemeOzeti(sonuc) !== esitlemeOzeti(uzak),
      uzakFazla: esitlemeOzeti(sonuc) !== esitlemeOzeti(yerel)
    };
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
  var saglikKasasi = oku('isgtakip.saglik.kasa') || { kayitlar: [], talepler: [] };
  saglikKasasi.kayitlar = saglikKasasi.kayitlar || [];
  saglikKasasi.talepler = saglikKasasi.talepler || [];
  saglikKasasi.calismaKitabi = saglikKasasi.calismaKitabi || null;
  var tasindi = false;
  if (!okunanVeri) {
    for (var geri = 0; geri < ESKI_ANAHTARLAR.length && !okunanVeri; geri += 1) {
      var eskiVeri = oku(ESKI_ANAHTARLAR[geri]);
      if (eskiVeri) { okunanVeri = eskiVeri; tasindi = true; }
    }
  }
  if (okunanVeri) { depoDurumu.veri = veriTamamla(okunanVeri); }
  if (!depoDurumu.veri) {
    /* Site boş başlar: işyeri, personel ve kayıt yoktur. Yönetici hesabı
       ISG.BOS_VERI() içindedir, giriş bu sayede açık kalır. */
    depoDurumu.veri = veriTamamla(
      typeof ISG.BOS_VERI === 'function' ? ISG.BOS_VERI() : {});
  }
  temelAl(depoDurumu.veri);

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
      /* Değişen kayıtlar kalıcı yazımdan önce damgalanır; bulut eşitlemesi
         böylece kayıt bazında karşılaştırma yapabilir. */
      try {
        /* Ayrı sağlık kasasındaki kayıtlar genel depoya karışmaz. */
        depoDurumu.veri.saglikTakip = [];
        degisiklikDamgala(depoDurumu.veri, new Date().toISOString());
      } catch (hata) { /* damgalama hatası kaydı engellemez */ }
      try {
        global.localStorage.setItem(ANAHTAR, JSON.stringify(depoDurumu.veri));
        depoDurumu.kalici = true;
      } catch (hata) {
        depoDurumu.kalici = false;
      }
      yayinla();
      return depoDurumu.kalici;
    },
    /* Bulut eşitlemesinden gelen birleşik veriyi yerleştirir. Yeni kayıt
       damgası üretilmez; yalnızca yerel temel anlık görüntü güncellenir. */
    yukle: function (girdi) {
      var veri = veriTamamla(girdi);
      /* Eski/uzak JSON içindeki sağlık satırları kasaya aktarılmaz. */
      veri.saglikTakip = [];
      depoDurumu.veri = veri;
      temelAl(veri);
      try {
        global.localStorage.setItem(ANAHTAR, JSON.stringify(veri));
        depoDurumu.kalici = true;
      } catch (hata) {
        depoDurumu.kalici = false;
      }
      yayinla();
      return veri;
    },
    /* Yerel veri ile bulut verisini kayıt bazında birleştirir.
       Tek argüman: bulut verisi (yerel taraf depodan alınır).
       İki argüman: (yerel, uzak) — testler ve toplu doğrulama için. */
    birlestir: function (birinci, ikinci) {
      if (ikinci === undefined) { return birlestir(depoDurumu.veri, birinci); }
      return birlestir(birinci, ikinci);
    },
    /* Tüm kayıtları "şimdi değişti" olarak damgalar. "Bu cihazdaki veriyi
       buluta yükle" seçildiğinde yerel kayıtların birleşimde öne geçmesini
       sağlar; buluta özgü kayıtlar yine korunur. */
    damgala: function () {
      var veri = depoDurumu.veri;
      veri.senkron = veri.senkron || {};
      veri.senkron.kayit = veri.senkron.kayit || {};
      veri.senkron.silinen = veri.senkron.silinen || {};
      var simdi = new Date().toISOString();
      ESITLEME_ANAHTARLARI.forEach(function (anahtar) {
        (veri[anahtar] || []).forEach(function (kayit) {
          if (!kayit || !kayit.id) { return; }
          kayit.guncelleme = simdi;
          veri.senkron.kayit[esitlemeKodu(anahtar, kayit.id)] = simdi;
        });
      });
      veri.senkron.ayarlar = simdi;
      temelAl(veri);
      depo.kaydet();
      return veri;
    },
    sifirla: function () {
      /* Örnek veriye değil, BOŞ veriye döndürür. Kurum kayıtları silinir;
         gerçek kullanıcı hesapları korunur (giriş kapanmasın diye). */
      var oncekiSenkron = depoDurumu.veri && depoDurumu.veri.senkron;
      var yeni = veriTamamla(typeof ISG.BOS_VERI === 'function' ? ISG.BOS_VERI() : {});
      yeni.kullanicilar = korunanHesaplar(depoDurumu.veri && depoDurumu.veri.kullanicilar);
      /* Önceki silme mezar taşları unutulmaz: silinen kayıtlar buluttan
         geri dönmemeli. */
      if (oncekiSenkron && oncekiSenkron.silinen) {
        Object.keys(oncekiSenkron.silinen).forEach(function (kod) {
          if (!yeni.senkron.silinen[kod]) { yeni.senkron.silinen[kod] = oncekiSenkron.silinen[kod]; }
        });
      }
      depoDurumu.veri = yeni;
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
      /* İçe aktarma bilinçli bir kullanıcı işlemidir: yedekteki kayıtlar bu
         cihazda yeni değişiklik sayılır ve bulut birleşiminde öne geçer.
         Yedeğin kendi mezar taşları taşınmaz; yedek geri yükleme silmek
         anlamına gelmez. */
      veri.senkron.silinen = {};
      depo.damgala();
      return veri;
    }
  };

  if (tasindi) { depo.kaydet(); }

  /* ---------- Kayıt işlemleri ---------- */

  /* Kayıt kimliği: aynı milisaniyede üretilen toplu kayıtlarda çakışma
     olmaması için zaman damgası + artan sayaç + rastgele eklenir. Çakışan
     kimlikler bulut eşitlemesinde kayıtların birbirini yutmasına yol açar. */
  var idSayaci = 0;
  ISG.yeniId = function (onek) {
    idSayaci = (idSayaci + 1) % 46656;
    var onlar = idSayaci.toString(36);
    while (onlar.length < 3) { onlar = '0' + onlar; }
    return String(onek || '') + Date.now().toString(36) + onlar +
      Math.random().toString(36).slice(2, 6);
  };

  function kaydetListede(liste, kayit, onek) {
    if (kayit.id) {
      var index = -1;
      liste.forEach(function (mevcut, i) { if (mevcut.id === kayit.id) { index = i; } });
      if (index >= 0) { liste[index] = kayit; return kayit; }
    }
    kayit.id = kayit.id || ISG.yeniId(onek);
    /* Liste içinde kimlik çakışması bırakılmaz (toplu yüklemede kritik). */
    var cakisma = function () {
      return liste.some(function (mevcut) { return mevcut !== kayit && mevcut.id === kayit.id; });
    };
    var deneme = 0;
    while (cakisma() && deneme < 50) { kayit.id = ISG.yeniId(onek); deneme += 1; }
    liste.push(kayit);
    return kayit;
  }

  function silListeden(liste, id) {
    return liste.filter(function (kayit) { return kayit.id !== id; });
  }

  /* ---------- Sağlık kayıtlarında kimlik etiketi ----------
     Muayene kayıtları (saglikTakip) personel ya da işyeri silindiğinde SİLİNMEZ:
     geçmiş işyeri muayenesi bulguları mevzuat gereği saklanır. Kayıt sahipsiz
     kalmasın diye kişinin adı/sicili ve işyerinin adı kayda yazılır (dondurulur);
     silme sonrası listede ham kimlik yerine "Ayşe Demir · silinmiş personel" okunur. */
  function saglikIsyeriAdi(veri, isyeriId) {
    var isyeri = (veri.isyerleri || []).filter(function (i) { return i && i.id === isyeriId; })[0];
    return isyeri ? String(isyeri.ad || '') : '';
  }
  /* Canlı eşitleme: kişi ve işyeri hâlâ kayıtlıyken etiketler güncel tutulur. */
  function saglikEtiketSinla(veri, kayit) {
    if (!kayit || !kayit.personelId) { return; }
    var kisi = (veri.personel || []).filter(function (p) { return p && p.id === kayit.personelId; })[0];
    if (kisi) {
      kayit.personelAd = String(kisi.adSoyad || '');
      kayit.personelSicil = String(kisi.sicil || '');
    }
    var isyeriAd = saglikIsyeriAdi(veri, kayit.isyeriId);
    if (isyeriAd) { kayit.isyeriAd = isyeriAd; }
  }
  /* Silmeden hemen önce çağrılır: silinecek kişinin adı kayda dondurulur.
     Dönen değer etkilenen sağlık kaydı sayısıdır (onay metninde gösterilir). */
  function saglikEtiketDondur(veri, aitMi) {
    var kisiHarita = {};
    (veri.personel || []).forEach(function (p) { if (p && p.id) { kisiHarita[p.id] = p; } });
    var sayi = 0;
    (saglikKasasi.kayitlar || []).forEach(function (kayit) {
      if (!kayit || !aitMi(kayit)) { return; }
      var kisi = kisiHarita[kayit.personelId];
      if (kisi) {
        kayit.personelAd = String(kisi.adSoyad || '');
        kayit.personelSicil = String(kisi.sicil || '');
      }
      var isyeriAd = saglikIsyeriAdi(veri, kayit.isyeriId);
      if (isyeriAd) { kayit.isyeriAd = isyeriAd; }
      sayi += 1;
    });
    if (sayi) { try { global.localStorage.setItem('isgtakip.saglik.kasa', JSON.stringify(saglikKasasi)); } catch (hata) { depoDurumu.kalici = false; } }
    return sayi;
  }

  ISG.depo.isyeriKaydet = function (kayit) {
    var veri = depo.al();
    var sonuc = kaydetListede(veri.isyerleri, kayit, 'iy');
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
    /* Sağlık kayıtları silinmez; kişinin adı ve işyeri etiketi kayda dondurulur. */
    var isyeriPersoneli = {};
    (veri.personel || []).forEach(function (p) { if (p && p.isyeriId === id) { isyeriPersoneli[p.id] = true; } });
    saglikEtiketDondur(veri, function (kayit) {
      return kayit.isyeriId === id || !!isyeriPersoneli[kayit.personelId];
    });
    veri.isyerleri = silListeden(veri.isyerleri, id);
    ['personel', 'egitimler', 'riskler', 'olaylar', 'dosyalar', 'belgeler', 'planlar', 'tespitler', 'riskEkipleri', 'acilPlanlar'].forEach(function (anahtar) {
      veri[anahtar] = (veri[anahtar] || []).filter(function (kayit) { return kayit.isyeriId !== id; });
    });
    veri.talepler = (veri.talepler || []).filter(function (talep) { return talep.isyeriId !== id; });
    veri.kullanicilar = (veri.kullanicilar || []).map(function (kullanici) {
      kullanici.isyerleri = (kullanici.isyerleri || []).filter(function (isyeriId) { return isyeriId !== id; });
      return kullanici;
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
    /* Muayene kayıtları silinmez (geçmiş bulgular saklanır); kişinin adı kayda
       dondurulur, arayüz "silinmiş personel" olarak göstermeye devam eder. */
    saglikEtiketDondur(veri, function (kayit) { return kayit.personelId === id; });
    veri.personel = silListeden(veri.personel, id);
    veri.egitimler = veri.egitimler.filter(function (e) { return e.personelId !== id; });
    veri.olaylar.forEach(function (olay) { if (olay.personelId === id) { olay.personelId = ''; } });
    depo.kaydet();
  };

  ISG.depo.personelTemizle = function (isyeriId) {
    var veri = depo.al();
    var silinenler = veri.personel.filter(function (p) { return p.isyeriId === isyeriId; }).map(function (p) { return p.id; });
    /* Listeden silinen kişilerin muayene kayıtları korunur; adları kayda dondurulur. */
    saglikEtiketDondur(veri, function (kayit) {
      return silinenler.indexOf(kayit.personelId) >= 0 || kayit.isyeriId === isyeriId;
    });
    veri.personel = veri.personel.filter(function (p) { return p.isyeriId !== isyeriId; });
    veri.egitimler = veri.egitimler.filter(function (e) { return silinenler.indexOf(e.personelId) < 0; });
    veri.olaylar.forEach(function (olay) {
      if (silinenler.indexOf(olay.personelId) >= 0) { olay.personelId = ''; }
    });
    depo.kaydet();
    return silinenler.length;
  };

  /* Toplu personel yükleme: verilen kayıtları TEK işyerine, tek kalıcı yazımda
     ekler. Mevcut personel kayıtları hiçbir şekilde güncellenmez ya da silinmez;
     mükerrer ayıklama çağrıdan önce ISG.personelToplu.analizEt ile yapılır.
     Kayıt bazlı eşitleme damgası kaydet() içinde üretildiği için bulut senkronu
     bozulmaz. `isyeriId` yetki denetimi için ilk argümandır (bkz. yetki.js). */
  ISG.depo.personelTopluEkle = function (isyeriId, kayitlar) {
    var veri = depo.al();
    if (!isyeriId) { throw new Error('Kayıt yapılacak işyeri seçilmedi.'); }
    var idler = [];
    (kayitlar || []).forEach(function (kayit) {
      if (!kayit || !kayit.adSoyad) { return; }
      kayit.isyeriId = isyeriId;
      kayit.sicil = String(kayit.sicil || '');
      kayit.durum = kayit.durum === 'pasif' ? 'pasif' : 'aktif';
      idler.push(kaydetListede(veri.personel, kayit, 'p').id);
    });
    depo.kaydet();
    return { eklenen: idler.length, idler: idler, isyeriId: isyeriId };
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

  /* Kontrol maddesi güncellemesi KISMİDİR. Formdan gelmeyen alanlar (hazır liste
     kodu `sablon`, sıra numarası `no`, sonraki kontrol tarihi ve ileride eklenecek
     alanlar) korunur; işyeri bağı yalnızca açıkça farklı bir işyeri gönderilirse
     değişir. Böylece düzenlenen madde kendi işyerinde kalır, listeden kopup
     "Tüm kaynaklar" görünümüne düşmez ve sıra numarası değişmez. */
  ISG.depo.dosyaKaydet = function (kayit) {
    if (!kayit) { return null; }
    var veri = depo.al();
    var mevcut = kayit.id ?
      (veri.dosyalar || []).filter(function (d) { return d.id === kayit.id; })[0] : null;
    var hedef = mevcut || kayit;
    if (mevcut) {
      Object.keys(kayit).forEach(function (alan) {
        if (alan === 'id') { return; }
        var deger = kayit[alan];
        if (deger === undefined || deger === null) { return; }
        /* Boş işyeri gönderimi mevcut bağı koparmaz. */
        if (alan === 'isyeriId' && !String(deger).trim()) { return; }
        mevcut[alan] = deger;
      });
    }
    hedef.no = Number(hedef.no) || 0;
    if (!hedef.no) {
      var kardesler = veri.dosyalar.filter(function (d) { return d.isyeriId === hedef.isyeriId; });
      hedef.no = kardesler.reduce(function (enBuyuk, d) { return Math.max(enBuyuk, Number(d.no) || 0); }, 0) + 1;
    }
    var sonuc = kaydetListede(veri.dosyalar, hedef, 'd');
    depo.kaydet();
    return sonuc;
  };

  ISG.depo.dosyaSil = function (id) {
    var veri = depo.al();
    veri.dosyalar = silListeden(veri.dosyalar, id);
    veri.belgeler = (veri.belgeler || []).filter(function (belge) { return belge.dosyaId !== id; });
    depo.kaydet();
  };

  /* ---------- Ekler (dosya kontrolü, risk ve acil durum belgeleri) ---------- */

  ISG.BELGE_SINIRI = 1024 * 1024;

  /* Eski kayıtlarda yalnızca dosyaId vardı; yeni kayıtlar kaynak + kaynakId
     taşır. Böylece belgeler dosya maddelerine, risk değerlendirmesine ve
     acil durum planına ayrı ayrı bağlanabilir. */
  function ekKaynagi(belge) {
    return (belge && belge.kaynak) || 'dosya';
  }

  function ekKimligi(belge) {
    if (!belge) { return ''; }
    return belge.kaynakId || belge.dosyaId || '';
  }

  ISG.depo.ekler = function (kaynak, kaynakId) {
    if (!kaynak || !kaynakId) { return []; }
    return (depo.al().belgeler || []).filter(function (belge) {
      return ekKaynagi(belge) === kaynak && ekKimligi(belge) === kaynakId;
    });
  };

  ISG.depo.ekSayisi = function (kaynak, kaynakId) {
    return ISG.depo.ekler(kaynak, kaynakId).length;
  };

  ISG.depo.ekBul = function (id) {
    if (!id) { return null; }
    return (depo.al().belgeler || []).filter(function (belge) { return belge.id === id; })[0] || null;
  };

  ISG.depo.ekKaydet = function (kayit) {
    kayit.kaynak = kayit.kaynak || 'dosya';
    kayit.kaynakId = kayit.kaynakId || kayit.dosyaId || '';
    if (!kayit.kaynakId) { throw new Error('Belge bir kayda bağlanmalı.'); }
    if (kayit.kaynak === 'dosya') { kayit.dosyaId = kayit.kaynakId; }
    return ISG.depo.belgeKaydet(kayit);
  };

  ISG.depo.ekSil = function (id) {
    ISG.depo.belgeSil(id);
  };

  /* Geriye dönük uyumluluk: dosya maddesi belgeleri */
  ISG.depo.belgeler = function (dosyaId) {
    return ISG.depo.ekler('dosya', dosyaId);
  };

  ISG.depo.belgeBul = function (id) {
    return ISG.depo.ekBul(id);
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

  /* ---------- Hazır dosya kontrol listeleri ---------- */

  /* Word/Excel'den üretilen kontrol listesini işyerine madde madde ekler.
     Aynı madde o işyerinde zaten açıksa atlanır; düğmeye ikinci kez basmak
     kayıt çoğaltmaz. Durum eşlemesi: VAR→var, YOK/GÜNCELLENECEK→eksik, K-D/UYGULANAMAZ→yok.
     Excel'deki "Açıklama / Eksiklik" hücresi kaydın açıklamasına not olarak yazılır. */
  ISG.depo.listeUygula = function (isyeriId, kod) {
    if (typeof ISG.listeSablonBul !== 'function') { throw new Error('Hazır kontrol listesi kataloğu yüklü değil.'); }
    var sablon = ISG.listeSablonBul(kod);
    if (!sablon) { throw new Error('Hazır kontrol listesi bulunamadı: ' + kod); }

    var veri = depo.al();
    var isyeri = (veri.isyerleri || []).filter(function (kayit) { return kayit.id === isyeriId; })[0];
    if (!isyeri) { throw new Error('Listenin ekleneceği işyeri bulunamadı.'); }

    var kardesler = (veri.dosyalar || []).filter(function (dosya) { return dosya.isyeriId === isyeriId; });
    var mevcut = {};
    kardesler.forEach(function (dosya) { mevcut[ISG.listeAnahtar(dosya.madde)] = true; });
    var no = kardesler.reduce(function (enBuyuk, dosya) { return Math.max(enBuyuk, Number(dosya.no) || 0); }, 0);

    var eklenen = 0;
    var atlanan = 0;
    (sablon.bolumler || []).forEach(function (bolum) {
      (bolum.maddeler || []).forEach(function (madde) {
        var anahtar = ISG.listeAnahtar(madde.madde);
        if (!anahtar || mevcut[anahtar]) { atlanan += 1; return; }
        mevcut[anahtar] = true;
        no += 1;
        var aciklama = madde.dayanak ? 'Yasal dayanak: ' + madde.dayanak : '';
        if (ISG.listeDurumKod(madde.isaret) === 'yok') {
          aciklama = (aciklama ? aciklama + ' · ' : '') + 'Kapsam dışı';
        }
        /* Excel listelerindeki "Açıklama / Eksiklik" hücresi maddenin notu olarak taşınır. */
        if (madde.not) { aciklama = (aciklama ? aciklama + ' · ' : '') + madde.not; }
        kaydetListede(veri.dosyalar, {
          isyeriId: isyeriId,
          no: no,
          bolum: bolum.ad,
          madde: madde.madde,
          durum: ISG.listeDurumKod(madde.isaret),
          sorumlu: '',
          yenileme: '',
          kontrolTarihi: madde.tarih || sablon.kontrolTarihi || '',
          aciklama: aciklama.slice(0, 240),
          sablon: sablon.kod
        }, 'd');
        eklenen += 1;
      });
    });

    depo.kaydet();
    return {
      isyeriId: isyeriId,
      kod: sablon.kod,
      eklenen: eklenen,
      atlanan: atlanan,
      toplam: eklenen + atlanan
    };
  };

  /* Uygulanan hazır listeyi geri alır: o işyerinde şablondan üretilmiş maddeler
     (varsa ekli belgeleriyle birlikte) silinir. bolumAdi verilirse yalnızca o
     bölümün maddeleri düşer; yanlış bölüme eklenen liste tek tek silinmez.
     Silme kaydı mezar taşına dönüştüğü için bulutta da kaldırılır. */
  ISG.depo.listeGeriAl = function (isyeriId, kod, bolumAdi) {
    if (!isyeriId || !kod) { throw new Error('Listeyi silmek için işyeri ve liste kodu gerekli.'); }
    var veri = depo.al();
    var silinecek = Object.create(null);
    (veri.dosyalar || []).forEach(function (dosya) {
      if (dosya.isyeriId !== isyeriId || dosya.sablon !== kod) { return; }
      if (bolumAdi && dosya.bolum !== bolumAdi) { return; }
      silinecek[dosya.id] = true;
    });
    var idler = Object.keys(silinecek);
    if (!idler.length) {
      return { isyeriId: isyeriId, kod: kod, bolum: bolumAdi || '', silinen: 0, belge: 0 };
    }
    var oncekiBelge = (veri.belgeler || []).length;
    veri.dosyalar = (veri.dosyalar || []).filter(function (dosya) { return !silinecek[dosya.id]; });
    veri.belgeler = (veri.belgeler || []).filter(function (belge) { return !silinecek[belge.dosyaId]; });
    depo.kaydet();
    return {
      isyeriId: isyeriId,
      kod: kod,
      bolum: bolumAdi || '',
      silinen: idler.length,
      belge: oncekiBelge - (veri.belgeler || []).length
    };
  };

  /* Plan kaydı KISMİ güncellenir: formdan gelmeyen alanlar (yil, aylar,
     anaBaslik, guncelleme…) korunur. Ay bilgisi belirlenemeyen eski kayıtlar
     başka aya taşınmaz; alanlar boş bırakılır ve görünümde türetilir. */
  ISG.depo.planKaydet = function (kayit) {
    if (!kayit) { return null; }
    var veri = depo.al();
    var mevcut = kayit.id ?
      (veri.planlar || []).filter(function (p) { return p.id === kayit.id; })[0] : null;
    var hedef = mevcut || kayit;
    if (mevcut) {
      Object.keys(kayit).forEach(function (alan) {
        if (alan === 'id') { return; }
        var deger = kayit[alan];
        if (deger === undefined || deger === null) { return; }
        mevcut[alan] = deger;
      });
    }
    hedef.sira = Number(hedef.sira) || 1;
    if (hedef.yil !== undefined) { hedef.yil = Number(hedef.yil) || 0; }
    if (hedef.aylar !== undefined) {
      hedef.aylar = (Array.isArray(hedef.aylar) ? hedef.aylar : [])
        .map(function (ay) { return Number(ay); })
        .filter(function (ay) { return ay >= 1 && ay <= 12; })
        .filter(function (ay, sira, liste) { return liste.indexOf(ay) === sira; })
        .sort(function (a, b) { return a - b; });
      if (!Number(hedef.ay)) { hedef.ay = hedef.aylar[0] || 0; }
    }
    hedef.guncelleme = new Date().toISOString();
    var sonuc = kaydetListede(veri.planlar, hedef, 'pl');
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

  /* ---------- Yıllık çalışma planı: yıl, ay ve ana başlık türetmeleri ----------
     Eski kayıtlarda yil / aylar / anaBaslik alanları yoktur. Kayıtlar zorla
     değiştirilmez; değerler takip tarihinden ve ay alanından türetilir. */

  ISG.planYil = function (plan) {
    var dogrudan = Number(plan && plan.yil);
    if (dogrudan >= 1990) { return dogrudan; }
    var takip = String((plan && plan.takipTarihi) || '');
    var yil = Number(takip.slice(0, 4));
    return yil >= 1990 ? yil : 0;
  };

  ISG.planAylari = function (plan) {
    var liste = plan && Array.isArray(plan.aylar) ? plan.aylar : [];
    var temiz = [];
    liste.forEach(function (ay) {
      var deger = Number(ay);
      if (deger >= 1 && deger <= 12 && temiz.indexOf(deger) < 0) { temiz.push(deger); }
    });
    if (!temiz.length && plan && Number(plan.ay) >= 1 && Number(plan.ay) <= 12) { temiz.push(Number(plan.ay)); }
    return temiz.sort(function (a, b) { return a - b; });
  };

  ISG.planAnaBaslik = function (plan) {
    var ad = String((plan && plan.anaBaslik) || '').trim();
    return ad || 'Diğer faaliyetler';
  };

  /* İş yerinde kayıtlı plan yılları (büyükten küçüğe); yılı bilinmeyenler 0 ile gelir. */
  ISG.planYillari = function (hesap, isyeriId) {
    var planlar = ISG.kapsamda(hesap, isyeriId, 'planlar');
    var yillar = [];
    planlar.forEach(function (plan) {
      var yil = ISG.planYil(plan);
      if (yil && yillar.indexOf(yil) < 0) { yillar.push(yil); }
    });
    return yillar.sort(function (a, b) { return b - a; });
  };

  /* Toplu plan yükleme: kayıtlar TEK işyerine ve tek kalıcı yazımda eklenir.
     Mevcut plan kayıtları güncellenmez ya da silinmez; mükerrer ayıklama
     ISG.planToplu.analizEt ile çağrıdan önce yapılır. `isyeriId` hem kayıt
     izolasyonu hem yetki denetimi için ilk argümandır (bkz. yetki.js). */
  ISG.depo.planTopluEkle = function (isyeriId, kayitlar) {
    var veri = depo.al();
    if (!isyeriId) { throw new Error('Kayıt yapılacak işyeri seçilmedi.'); }
    var mevcutSayi = (veri.planlar || []).filter(function (plan) { return plan.isyeriId === isyeriId; }).length;
    var idler = [];
    (kayitlar || []).forEach(function (kayit, sira) {
      if (!kayit || !kayit.faaliyet) { return; }
      kayit.isyeriId = isyeriId;
      kayit.sira = Number(kayit.sira) || (mevcutSayi + sira + 1);
      kayit.yil = Number(kayit.yil) || 0;
      kayit.aylar = ISG.planAylari(kayit);
      kayit.ay = Number(kayit.ay) || kayit.aylar[0] || 0;
      kayit.gun = Number(kayit.gun) || 0;
      kayit.sorumlu = String(kayit.sorumlu || '');
      kayit.aciklama = String(kayit.aciklama || '');
      kayit.anaBaslik = String(kayit.anaBaslik || '');
      kayit.durum = kayit.durum || 'takvimde';
      kayit.takipTarihi = kayit.takipTarihi || '';
      idler.push(kaydetListede(veri.planlar, kayit, 'pl').id);
    });
    depo.kaydet();
    return { eklenen: idler.length, idler: idler, isyeriId: isyeriId };
  };

  /* Toplu plan silme: iş yeri filtresi ZORUNLU. `yil` verilirse yalnızca o yıl,
     `idler` verilirse yalnızca seçilen kayıtlar silinir; ikisi birlikte verilirse
     kesişim silinir. Başka iş yerlerinin kayıtlarına hiçbir koşulda dokunulmaz. */
  ISG.depo.planTopluSil = function (filtre) {
    var secim = filtre || {};
    if (!secim.isyeriId) { throw new Error('Toplu silme için işyeri seçilmedi.'); }
    var yil = Number(secim.yil) || 0;
    var idler = Array.isArray(secim.idler) ? secim.idler : [];
    if (!yil && !idler.length) {
      throw new Error('Silme kapsamı belirlenmedi: yıl veya kayıt seçimi gerekli.');
    }
    var secili = {};
    idler.forEach(function (id) { secili[String(id)] = true; });
    var veri = depo.al();
    var hedefler = [];
    (veri.planlar || []).forEach(function (plan) {
      if (plan.isyeriId !== secim.isyeriId) { return; }
      if (yil && ISG.planYil(plan) !== yil) { return; }
      if (idler.length && !secili[String(plan.id)]) { return; }
      hedefler.push(String(plan.id));
    });
    if (hedefler.length) {
      var silinecek = {};
      hedefler.forEach(function (id) { silinecek[id] = true; });
      veri.planlar = (veri.planlar || []).filter(function (plan) { return !silinecek[String(plan.id)]; });
      depo.kaydet();
    }
    return {
      silinen: hedefler.length,
      isyeriId: secim.isyeriId,
      yil: yil,
      idler: hedefler,
      kalan: (veri.planlar || []).filter(function (plan) { return plan.isyeriId === secim.isyeriId; }).length
    };
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

  /* ---------- Ekip üyeleri: çoklu personel modeli ----------
     Eski kayıtlar rol başına tek kişi tutuyordu (riskEkipleri.uyeler[rol] ve
     acilPlanlar.ekip[]). Yeni model rol başına üye LİSTESİ tutar:
       riskEkipleri.uyeListe[rol] = [{ id, rol, ad, personelId, belgeNo, ... }]
       acilPlanlar.ekip          = [{ id, rol, ad, personelId, belgeNo, ... }]
     Eski alanlar silinmez; okuma sırasında yeni modele köprü kurulur. Böylece
     geçiş sırasında hiçbir personel bilgisi kaybolmaz. */

  function uyeAnahtari(uye) {
    var ad = String((uye && uye.ad) || '').toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
    return String((uye && uye.personelId) || '') + '|' + ad;
  }

  function uyeNesnesi(rol, ad, personelId, ek) {
    var uye = {
      id: ISG.yeniId('uy'),
      rol: String(rol || ''),
      ad: String(ad || '').trim(),
      personelId: personelId || ''
    };
    var kaynak = ek || {};
    Object.keys(kaynak).forEach(function (alan) {
      if (alan === 'id' || alan === 'rol' || alan === 'ad' || alan === 'personelId') { return; }
      uye[alan] = kaynak[alan];
    });
    return uye;
  }

  /* Seçim (id veya ad) verilen üyeyle eşleşiyor mu? Kaldırma düğmeleri hem
     kimlik hem ad gönderir; eski kayıtlarda kimlik olmadığı için ad yedektir. */
  function uyeEslesir(uye, secim) {
    if (!uye || !secim) { return false; }
    if (secim.id && uye.id && String(uye.id) === String(secim.id)) { return true; }
    if (secim.ad && String(uye.ad || '') === String(secim.ad)) { return true; }
    return false;
  }

  /* Risk ekibi kaydında bir rolün üye listesi (eski tek kişilik alanla birlikte). */
  ISG.depo.riskEkipUyeleri = function (kayit, rol) {
    if (!kayit) { return []; }
    var liste = (kayit.uyeListe && kayit.uyeListe[rol]) || [];
    if (liste.length) { return liste.slice(); }
    var tek = ((kayit.uyeler || {})[rol]) || '';
    if (!String(tek).trim()) { return []; }
    return [{
      id: 'eski-' + rol,
      rol: rol,
      ad: tek,
      personelId: ((kayit.uyeIdleri || {})[rol]) || '',
      eskiKayit: true
    }];
  };

  /* Risk ekibinde rolün listesini yazmaya hazırlar: eski tek kişi yeni modele taşınır. */
  function riskUyeListeHazirla(kayit, rol) {
    kayit.uyeListe = kayit.uyeListe || {};
    kayit.uyeler = kayit.uyeler || {};
    kayit.uyeIdleri = kayit.uyeIdleri || {};
    if (!kayit.uyeListe[rol]) { kayit.uyeListe[rol] = []; }
    var liste = kayit.uyeListe[rol];
    var eskiAd = String(kayit.uyeler[rol] || '').trim();
    if (!liste.length && eskiAd) {
      liste.push({
        id: ISG.yeniId('uy'),
        rol: rol,
        ad: eskiAd,
        personelId: kayit.uyeIdleri[rol] || ''
      });
    }
    return liste;
  }

  /* Eski alanları (uyeler / uyeIdleri) listenin ilk üyesiyle eşitler. */
  function riskEskiAlanlariYaz(kayit, rol) {
    var liste = (kayit.uyeListe && kayit.uyeListe[rol]) || [];
    kayit.uyeler[rol] = liste.length ? liste[0].ad : '';
    if (liste.length && liste[0].personelId) { kayit.uyeIdleri[rol] = liste[0].personelId; }
    else { delete kayit.uyeIdleri[rol]; }
  }

  /* Acil durum planı ekip alanı her zaman dizi olmalı. Çok eski kayıtlarda alan
     rol→ad eşlemesi (nesne) olarak tutulmuştu; veri kaybı olmadan diziye çevrilir.
     Görev adı da hem rol kimliği ('hekim') hem rol adı ('İşyeri hekimi') biçiminde
     yazılmış olabilir; karşılaştırmalar tek biçime indirilir. */
  function acilEkipHazirla(kayit) {
    if (!kayit) { return []; }
    var ham = kayit.ekip;
    if (Array.isArray(ham)) { return ham; }
    var liste = [];
    if (ham && typeof ham === 'object') {
      Object.keys(ham).forEach(function (rol) {
        var ad = String(ham[rol] || '').trim();
        if (ad) { liste.push({ rol: rol, ad: ad, personelId: '' }); }
      });
    }
    kayit.ekip = liste;
    return liste;
  }

  function acilRolAdi(deger) {
    var metin = String(deger || '');
    var bulunan = (ISG.ACIL_ROLLERI || []).filter(function (rol) {
      return rol.id === metin || rol.ad === metin;
    })[0];
    return bulunan ? bulunan.ad : metin;
  }

  /* Acil durum planındaki üyeler; kimliği olmayan eski kayıtlara geçici kimlik verilir. */
  ISG.depo.acilEkipUyeleri = function (kayit, rol) {
    if (!kayit) { return []; }
    var hedef = rol ? acilRolAdi(rol) : '';
    return acilEkipHazirla(kayit).map(function (uye, sira) {
      var kopya = {};
      Object.keys(uye).forEach(function (alan) { kopya[alan] = uye[alan]; });
      kopya.id = uye.id || ('eski-acil-' + sira);
      kopya.rol = acilRolAdi(uye.rol);
      return kopya;
    }).filter(function (uye) { return !hedef || uye.rol === hedef; });
  };

  ISG.depo.riskEkipKaydet = function (isyeriId, alanlar) {
    var veri = depo.al();
    var kayit = ISG.ilgiliKayit(veri, 'riskEkipleri', isyeriId);
    if (!kayit) {
      kayit = { isyeriId: isyeriId, sonDegerlendirme: '', enGecYenileme: '', uyeler: {}, uyeListe: {} };
      veri.riskEkipleri.push(kayit);
    }
    kayit.sonDegerlendirme = alanlar.sonDegerlendirme || '';
    kayit.enGecYenileme = alanlar.enGecYenileme || '';
    kayit.uyeler = kayit.uyeler || {};
    kayit.uyeListe = kayit.uyeListe || {};
    ISG.RISK_ROLLERI.forEach(function (rol) {
      if (!Object.prototype.hasOwnProperty.call(alanlar, rol.id)) { return; }
      var ad = String(alanlar[rol.id] || '').trim();
      var liste = riskUyeListeHazirla(kayit, rol.id);
      if (!ad) { return; }
      /* Formdan gelen ad yeni bir kişiyse listeye eklenir; mevcut üyeler korunur. */
      var varMi = liste.some(function (uye) { return uyeAnahtari(uye) === ('|' + ad.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim()); });
      if (!varMi) {
        liste.push(uyeNesnesi(rol.id, ad, ''));
      }
      /* Eski tek kişilik alan okunabilir kalır (dışa aktarımlar ve eski ekranlar). */
      kayit.uyeler[rol.id] = ad;
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

  /* Risk ekibine üye ekler. Aynı kişi aynı görevde ikinci kez kaydedilmez;
     farklı kişiler aynı görevde yan yana durabilir (çoklu personel). */
  ISG.depo.riskEkipUyeEkle = function (isyeriId, rol, ad, personelId, ek) {
    var veri = depo.al();
    var kayit = ISG.ilgiliKayit(veri, 'riskEkipleri', isyeriId);
    if (!kayit) {
      kayit = { isyeriId: isyeriId, sonDegerlendirme: '', enGecYenileme: '', uyeler: {}, uyeIdleri: {}, uyeListe: {} };
      veri.riskEkipleri.push(kayit);
    }
    var temiz = String(ad || '').trim();
    var liste = riskUyeListeHazirla(kayit, rol);
    if (!temiz) { depo.kaydet(); return kayit; }
    var yeni = uyeNesnesi(rol, temiz, personelId, ek);
    var anahtar = uyeAnahtari(yeni);
    var eslesen = liste.filter(function (uye) { return uyeAnahtari(uye) === anahtar; })[0];
    if (eslesen) {
      Object.keys(yeni).forEach(function (alan) {
        if (alan === 'id' || alan === 'rol') { return; }
        eslesen[alan] = yeni[alan];
      });
    } else {
      liste.push(yeni);
    }
    /* Eski tek kişilik alan son eklenen kişiyi gösterir (geriye dönük uyum). */
    kayit.uyeler[rol] = (eslesen || yeni).ad;
    if (personelId) { kayit.uyeIdleri[rol] = personelId; }
    depo.kaydet();
    return kayit;
  };

  /* secim verilirse yalnızca o üye, verilmezse rolün tüm üyeleri kaldırılır. */
  ISG.depo.riskEkipUyeSil = function (isyeriId, rol, secim) {
    var veri = depo.al();
    var kayit = ISG.ilgiliKayit(veri, 'riskEkipleri', isyeriId);
    if (!kayit) { return null; }
    var liste = riskUyeListeHazirla(kayit, rol);
    if (!secim) {
      kayit.uyeListe[rol] = [];
      kayit.uyeler[rol] = '';
      delete kayit.uyeIdleri[rol];
    } else {
      kayit.uyeListe[rol] = liste.filter(function (uye) { return !uyeEslesir(uye, secim); });
      riskEskiAlanlariYaz(kayit, rol);
    }
    depo.kaydet();
    return kayit;
  };

  /* Acil durum planına üye ekler; aynı kişi aynı görevde tekrarlanmaz. */
  ISG.depo.acilEkipEkle = function (isyeriId, rol, ad, personelId, ek) {
    var veri = depo.al();
    var kayit = ISG.ilgiliKayit(veri, 'acilPlanlar', isyeriId);
    if (!kayit) {
      kayit = { isyeriId: isyeriId, hazirlanma: '', sonYenileme: '', tatbikat: '', ekip: [] };
      veri.acilPlanlar.push(kayit);
    }
    var ekip = acilEkipHazirla(kayit);
    var temiz = String(ad || '').trim();
    if (!temiz) { depo.kaydet(); return kayit; }
    /* Görev adı tek biçimde (rol adı) yazılır; eski rol kimliği de kabul edilir. */
    var rolAdi = acilRolAdi(rol);
    var yeni = uyeNesnesi(rolAdi, temiz, personelId, ek);
    var anahtar = uyeAnahtari(yeni);
    var eslesen = ekip.filter(function (uye) {
      return acilRolAdi(uye.rol) === rolAdi && uyeAnahtari(uye) === anahtar;
    })[0];
    if (eslesen) {
      Object.keys(yeni).forEach(function (alan) {
        if (alan === 'id' || alan === 'rol') { return; }
        eslesen[alan] = yeni[alan];
      });
    } else {
      ekip.push(yeni);
    }
    depo.kaydet();
    return kayit;
  };

  /* secim verilirse yalnızca o üye, verilmezse rolün tüm üyeleri kaldırılır. */
  ISG.depo.acilEkipSil = function (isyeriId, rol, secim) {
    var veri = depo.al();
    var kayit = ISG.ilgiliKayit(veri, 'acilPlanlar', isyeriId);
    if (!kayit) { return null; }
    var ekip = acilEkipHazirla(kayit);
    var rolAdi = acilRolAdi(rol);
    /* Kimliği olmayan eski kayıtlar silinirken kimlik kazanır; böylece tek üye
       kaldırılırken rolün tamamı yanlışlıkla silinmez. */
    if (secim) {
      var bulunan = null;
      ekip.forEach(function (uye) {
        if (acilRolAdi(uye.rol) !== rolAdi) { return; }
        if (!uye.id) { uye.id = ISG.yeniId('uy'); }
        if (!bulunan && uyeEslesir(uye, secim)) { bulunan = uye; }
      });
      kayit.ekip = bulunan ? ekip.filter(function (uye) { return uye !== bulunan; }) : ekip;
    } else {
      kayit.ekip = ekip.filter(function (uye) { return acilRolAdi(uye.rol) !== rolAdi; });
    }
    depo.kaydet();
    return kayit;
  };

  /* ---------- Kullanıcılar ---------- */

  ISG.depo.kullaniciBul = function (id) {
    if (!id) { return null; }
    return (depo.al().kullanicilar || []).filter(function (kullanici) { return kullanici.id === id; })[0] || null;
  };

  ISG.depo.kullaniciEpostaBul = function (eposta) {
    var hedef = String(eposta || '').trim().toLowerCase();
    if (!hedef) { return null; }
    return (depo.al().kullanicilar || []).filter(function (kullanici) {
      /* Eski/uzak kayıtlarda boşluk kalabilen adresler de bulunabilsin. */
      return String(kullanici.eposta || '').trim().toLowerCase() === hedef;
    })[0] || null;
  };

  ISG.depo.kullaniciKaydet = function (kayit) {
    var veri = depo.al();
    kayit.eposta = String(kayit.eposta || '').trim().toLowerCase();
    if (!kayit.eposta) { throw new Error('Hesap için e-posta adresi zorunludur.'); }
    kayit.isyerleri = Array.isArray(kayit.isyerleri) ? kayit.isyerleri : [];
    /* Giriş hesabı e-posta ile bulunur: aynı adrese ikinci hesap açılırsa
       hangisinin kullanılacağı belirsizleşir ve kullanıcı "bulunamadı" görür.
       Yalnızca yeni kayıtta denetlenir; var olan hesap düzenlenebilir. */
    if (!kayit.id) {
      var kopya = (veri.kullanicilar || []).filter(function (mevcut) {
        return String(mevcut.eposta || '').trim().toLowerCase() === kayit.eposta;
      })[0];
      if (kopya) {
        throw new Error(kayit.eposta + ' adresi "' + (kopya.adSoyad || 'mevcut hesap') +
          '" hesabında kayıtlı. Aynı adresle ikinci hesap açılamaz.');
      }
    }
    var sonuc = kaydetListede(veri.kullanicilar, kayit, 'u');
    /* Eşitleme sırası bu damgaya bakıyor; kayıt sahipsiz kalmasın. */
    sonuc.guncelleme = new Date().toISOString();
    /* Yazma başarısızsa (kota dolu) hesap yalnızca bellekte kalmış demektir:
       cihaz yeniden açılınca hesap yok olur, diğer cihazlar hiç göremez. */
    if (!depo.kaydet()) {
      throw new Error('Hesap bu cihazın kayıtlarına yazılamadı; depolama alanı dolmuş olabilir. ' +
        'Yedek alıp eski kayıtları temizledikten sonra yeniden deneyin.');
    }
    return sonuc;
  };

  ISG.depo.sifreGuncelle = function (eposta, yeniSifre) {
    var kullanici = ISG.depo.kullaniciEpostaBul(eposta);
    if (!kullanici) { return null; }
    kullanici.sifre = String(yeniSifre || '');
    kullanici.sifreDegisim = new Date().toISOString();
    kullanici.guncelleme = kullanici.sifreDegisim;
    if (!depo.kaydet()) {
      throw new Error('Şifre bu cihazın kayıtlarına yazılamadı; depolama alanı dolmuş olabilir.');
    }
    return kullanici;
  };

  ISG.depo.kullaniciSil = function (id) {
    var veri = depo.al();
    var silinen = (veri.kullanicilar || []).filter(function (kullanici) { return kullanici.id === id; })[0];
    if (!silinen) { return null; }
    veri.kullanicilar = silListeden(veri.kullanicilar, id);
    depo.kaydet();
    return silinen;
  };

  ISG.depo.kullaniciGirisIsaretle = function (id) {
    var kullanici = ISG.depo.kullaniciBul(id);
    if (!kullanici) { return null; }
    kullanici.sonGiris = new Date().toISOString();
    depo.kaydet();
    return kullanici;
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

  ISG.depo.talepKarar = function (id, durum, kararVeren, not, kararVerenId) {
    var talep = ISG.depo.talepBul(id);
    if (!talep) { return null; }
    talep.durum = durum;
    talep.kararTarihi = new Date().toISOString();
    talep.kararVeren = kararVeren || '';
    talep.kararVerenId = kararVerenId || talep.kararVerenId || '';
    talep.kararNotu = not || '';
    depo.kaydet();
    return talep;
  };

  /* Talep durumunu tek başına değiştirir (uygulanıyor kilidi gibi ara durumlar). */
  ISG.depo.talepDurum = function (id, durum) {
    var talep = ISG.depo.talepBul(id);
    if (!talep) { return null; }
    talep.durum = durum;
    talep.durumTarihi = new Date().toISOString();
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

  /* ---------- İş sağlığı / personel sağlık takibi ---------- */
  /* Hassas sağlık verileri: yalnızca yönetici ve işyeri hekimi/yetkili (işyeri kapsamında) erişebilir. */
  ISG.depo.saglikTakipKaydet = function (kayit) {
    saglikKasasi.kayitlar = saglikKasasi.kayitlar || [];
    kayit.id = kayit.id || ISG.yeniId('sk');
    kayit.tarih = kayit.tarih || ISG.bicim.bugunIso();
    /* Ad/sicil/işyeri etiketi canlıyken güncellenir; kişi silinirse son değer korunur. */
    saglikEtiketSinla(depo.al(), kayit);
    var yer = -1;
    saglikKasasi.kayitlar.forEach(function (k, i) { if (k.id === kayit.id) { yer = i; } });
    if (yer >= 0) { saglikKasasi.kayitlar[yer] = kayit; } else { saglikKasasi.kayitlar.push(kayit); }
    try { global.localStorage.setItem('isgtakip.saglik.kasa', JSON.stringify(saglikKasasi)); }
    catch (hata) { throw new Error('Sağlık kaydı kaydedilemedi: korumalı depolama dolu.'); }
    yayinla();
    return kayit;
  };

  ISG.depo.saglikTakipSil = function (id) {
    saglikKasasi.kayitlar = (saglikKasasi.kayitlar || []).filter(function (k) { return k.id !== id; });
    global.localStorage.setItem('isgtakip.saglik.kasa', JSON.stringify(saglikKasasi));
  };

  ISG.depo.saglikTakipBul = function (id) {
    if (!id) { return null; }
    return (saglikKasasi.kayitlar || []).filter(function (k) { return k.id === id; })[0] || null;
  };

  ISG.depo.saglikTakipListe = function (isyeriId, personelId) {
    var liste = (saglikKasasi.kayitlar || []).slice();
    if (isyeriId) { liste = liste.filter(function (k) { return k.isyeriId === isyeriId; }); }
    if (personelId) { liste = liste.filter(function (k) { return k.personelId === personelId; }); }
    return liste.sort(function (a, b) { return String(b.tarih || "").localeCompare(String(a.tarih || "")); });
  };

  /* Silme onaylarında kullanılır: muayene kayıtları silinmez, kaçıncı kaydın
     sahipsiz kalacağı (korunacağı) kullanıcıya söylenir. */
  ISG.depo.saglikTakipSay = function (personelId) {
    if (!personelId) { return 0; }
    return (saglikKasasi.kayitlar || []).filter(function (k) { return k.personelId === personelId; }).length;
  };

  /* İşyeri bazlı sayım: isyeriId alanı eski/bozuk kayıtlar da kişinin işyerinden
     sayılır, böylece onay metnindeki sayı hiçbir durumda eksik kalmaz. */
  ISG.depo.saglikTakipIsyeriSay = function (isyeriId) {
    if (!isyeriId) { return 0; }
    var veri = depo.al();
    var kisi = {};
    (veri.personel || []).forEach(function (p) { if (p && p.isyeriId === isyeriId) { kisi[p.id] = true; } });
    var sayi = (saglikKasasi.kayitlar || []).filter(function (k) {
      return k.isyeriId === isyeriId || !!kisi[k.personelId];
    }).length;
    return sayi;
  };

  ISG.depo.saglikErisimTalepKaydet = function (talep) {
    saglikKasasi.talepler = saglikKasasi.talepler || [];
    var bulunan = saglikKasasi.talepler.filter(function (x) { return x.kullaniciId === talep.kullaniciId && x.durum === 'bekliyor'; })[0];
    if (bulunan) { return bulunan; }
    talep.id = talep.id || ISG.yeniId('sa');
    talep.olusturma = new Date().toISOString();
    talep.durum = 'bekliyor';
    saglikKasasi.talepler.push(talep);
    global.localStorage.setItem('isgtakip.saglik.kasa', JSON.stringify(saglikKasasi));
    return talep;
  };
  ISG.depo.saglikErisimTalepleri = function () { return (saglikKasasi.talepler || []).slice(); };
  ISG.depo.saglikErisimKarar = function (id, onay) {
    var talep = (saglikKasasi.talepler || []).filter(function (x) { return x.id === id; })[0];
    if (!talep) { return null; }
    talep.durum = onay ? 'onaylandi' : 'reddedildi';
    talep.kararTarihi = new Date().toISOString();
    global.localStorage.setItem('isgtakip.saglik.kasa', JSON.stringify(saglikKasasi));
    return talep;
  };
  ISG.depo.saglikYetkiliMi = function (kullaniciId) {
    return (saglikKasasi.talepler || []).some(function (x) { return x.kullaniciId === kullaniciId && x.durum === 'onaylandi'; });
  };
  ISG.depo.saglikCalismaKitabi = function () { return saglikKasasi.calismaKitabi; };
  ISG.depo.saglikCalismaKitabiKaydet = function (kitap) {
    saglikKasasi.calismaKitabi = kitap;
    global.localStorage.setItem('isgtakip.saglik.kasa', JSON.stringify(saglikKasasi));
    yayinla();
    return kitap;
  };

  ISG.depo.ayarKaydet = function (alanlar) {
    var veri = depo.al();
    veri.ayarlar = veri.ayarlar || {};
    Object.keys(alanlar || {}).forEach(function (anahtar) { veri.ayarlar[anahtar] = alanlar[anahtar]; });
    depo.kaydet();
    return veri.ayarlar;
  };
})(window);



