/* İSG Takip Merkezi — alan kuralları, veri katmanı ve görev motoru */
(function (global) {
  'use strict';

  var ISG = global.ISG = global.ISG || {};
  var ANAHTAR = 'isgtakip.v4';
  var ESKI_ANAHTARLAR = ['isgtakip.v3', 'isgtakip.v2'];
  var SURUM = 4;

  /* ---------- Alan kuralları ---------- */

  /* acilYenilemeYil: acil durum planının kaç yıl arayla yenileneceği. Yasal
     sınır tehlike sınıfına göre değişir: çok tehlikeli 2, tehlikeli 4,
     az tehlikeli 6 yıl. Hesap tek yerden ISG.acilPlanOzeti içinde yapılır
     (son yenileme + bu değer = en geç yenileme tarihi). */
  ISG.RISK_SINIFLARI = {
    az: { ad: 'Az tehlikeli', temelSaat: 8, yenilemeYil: 3, riskYenilemeYil: 6, acilYenilemeYil: 6 },
    tehlikeli: { ad: 'Tehlikeli', temelSaat: 12, yenilemeYil: 2, riskYenilemeYil: 4, acilYenilemeYil: 4 },
    cokTehlikeli: { ad: 'Çok tehlikeli', temelSaat: 16, yenilemeYil: 1, riskYenilemeYil: 2, acilYenilemeYil: 2 }
  };

  /* İş güvenliği uzmanı sınıfları. `kod` hesap kaydında saklanan değerdir;
     boş değer "belirtilmedi" demektir (uydurma sınıf atanmaz). */
  ISG.UZMAN_SINIFLARI = [
    { kod: 'A', ad: 'A sınıfı', kisa: 'A' },
    { kod: 'B', ad: 'B sınıfı', kisa: 'B' },
    { kod: 'C', ad: 'C sınıfı', kisa: 'C' }
  ];

  /* Uzman sınıfı tek biçime indirilir: 'a', 'A sınıfı', 'A SINIFI' → 'A'.
     Tanınmayan değer boş döner; bu, "sınıfı olmayan uzman onay yetkilisi
     sayılmaz" kuralının girdisidir. */
  ISG.uzmanSinifiKodu = function (deger) {
    var metin = String(deger === null || deger === undefined ? '' : deger)
      .replace(/\s+/g, ' ').trim().toLocaleUpperCase('tr-TR');
    if (!metin) { return ''; }
    var ilk = metin.charAt(0);
    return 'ABC'.indexOf(ilk) >= 0 ? ilk : '';
  };

  ISG.uzmanSinifiAdi = function (deger) {
    var kod = ISG.uzmanSinifiKodu(deger);
    if (!kod) { return 'Sınıf belirtilmedi'; }
    for (var i = 0; i < ISG.UZMAN_SINIFLARI.length; i += 1) {
      if (ISG.UZMAN_SINIFLARI[i].kod === kod) { return ISG.UZMAN_SINIFLARI[i].ad; }
    }
    return kod + ' sınıfı';
  };

  /* Uygulama içi onay yetkisi eşiği: işyerinin tehlike sınıfına göre çok uzmanlı
     işyerinde onay verebilecek en düşük uzman sınıfları. Bu tablo MEVZUATIN
     GÖREVLENDİRME ŞARTI DEĞİLDİR; uygulamanın kendi değişiklik onayı kuralıdır.
     (20.07.2013 tarihli Yönetmelik uzman görevlendirmesini düzenler, "onay
     yetkilisi" diye bir kavram tanımlamaz.) */
  ISG.ONAY_ESIGI = {
    cokTehlikeli: ['A'],
    tehlikeli: ['A', 'B'],
    az: ['A', 'B', 'C']
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

  /* ---------- Çalışma planı durumları ----------
     Kullanıcı dokuz durumdan birini kaydeder. Onuncu durum olan "Gecikti"
     hiçbir zaman elle seçilmez: takip tarihi geçtiği hâlde kapanmamış
     faaliyet için ISG.planDurumu tarafından otomatik türetilir.
     Kapanmış sayılan durumlar (tamamlandi, iptal, kapsamDisi) gecikmez,
     panelde görev üretmez ve "bekleyen" sayacına girmez.
     Eski kayıtlardaki "takvimde" (v7) ve "planlandi" (beşli sürüm) değerleri
     "yapilacak" karşılığıdır ve yüklemede bu ada göçtürülür. */
  ISG.PLAN_DURUMLARI = {
    yapilacak: { ad: 'Yapılacak', sinif: 'bilgi', secilebilir: true },
    devam: { ad: 'Devam Ediyor', sinif: 'bilgi', secilebilir: true },
    belgeBekliyor: { ad: 'Belge / Yanıt Bekleniyor', sinif: 'uyari', secilebilir: true },
    ertelendi: { ad: 'Ertelendi', sinif: 'uyari', secilebilir: true },
    tamamlanmadi: { ad: 'Tamamlanmadı', sinif: 'tehlike', secilebilir: true },
    planlanmadi: { ad: 'Planlanmadı', sinif: 'notr', secilebilir: true },
    tamamlandi: { ad: 'Tamamlandı', sinif: 'iyi', secilebilir: true, kapanis: true },
    iptal: { ad: 'İptal Edildi', sinif: 'notr', secilebilir: true, kapanis: true },
    kapsamDisi: { ad: 'Kapsam Dışı', sinif: 'notr', secilebilir: true, kapanis: true },
    gecikti: { ad: 'Gecikti', sinif: 'tehlike', secilebilir: false }
  };
  /* Form kutusundaki seçenekler (sıralı); "Gecikti" türetildiği için yoktur. */
  ISG.PLAN_DURUM_SECIMLERI = ['yapilacak', 'devam', 'belgeBekliyor', 'ertelendi',
    'tamamlanmadi', 'planlanmadi', 'tamamlandi', 'iptal', 'kapsamDisi'];
  /* Filtrelerde gösterilen sıralı liste; türetilmiş "Gecikti" başta gelir. */
  ISG.PLAN_DURUM_FILTRELERI = ['gecikti'].concat(ISG.PLAN_DURUM_SECIMLERI);
  /* Kapanmış durumlar: iş akışı biter, gecikme aranmaz. */
  ISG.PLAN_DURUM_KAPALI = ['tamamlandi', 'iptal', 'kapsamDisi'];
  /* Takip edilmeyen durumlar: yıl kartlarının kısa listesinde gösterilmez. */
  ISG.PLAN_DURUM_TAKIPSIZ = ['planlanmadi', 'iptal', 'kapsamDisi'];
  /* Eski sürüm kayıtlarında biriken durum adları → güncel karşılıkları. */
  var PLAN_DURUM_ESKI = {
    takvimde: 'yapilacak',
    planlandi: 'yapilacak',
    bekliyor: 'belgeBekliyor',
    Gecikti: 'yapilacak'
  };

  /* Kayıtlı durumu güncel onlu kümeye çevirir. Tanınmayan değer faaliyetin
     açık kaldığı varsayımıyla "yapilacak" kabul edilir; türetilmiş "gecikti"
     hiçbir zaman saklanmaz. */
  ISG.planDurumNormal = function (durum) {
    var id = String(durum || '').trim();
    if (PLAN_DURUM_ESKI[id]) { return PLAN_DURUM_ESKI[id]; }
    var tanim = ISG.PLAN_DURUMLARI[id];
    return tanim && tanim.secilebilir ? id : 'yapilacak';
  };

  /* Kapanmış durum mu? (tamamlandı / iptal / kapsam dışı) */
  ISG.planDurumKapanmis = function (durum) {
    return ISG.PLAN_DURUM_KAPALI.indexOf(ISG.planDurumNormal(durum)) > -1;
  };

  /* Durum yıl kartının kısa listesinde izlenmiyor mu? */
  ISG.planDurumTakipsiz = function (durum) {
    return ISG.PLAN_DURUM_TAKIPSIZ.indexOf(ISG.planDurumNormal(durum)) > -1;
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
    var liste = (veri && veri[anahtar]) || [];
    /* Kimlikler her yerde dizi olarak taşınmaz (içe aktarma/sayaç kaynakları);
       karşılaştırma metne çevrilerek yapılır ki aynı işyerinin kaydı bulunamasın
       ve yanlış kayıt diğerinin yerine kullanılmasın. */
    var hedef = String(isyeriId === null || isyeriId === undefined ? '' : isyeriId);
    var bulunanlar = liste.filter(function (k) {
      return String((k && k.isyeriId !== null && k.isyeriId !== undefined) ? k.isyeriId : '') === hedef;
    });
    if (!bulunanlar.length) { return null; }
    if (bulunanlar.length === 1) { return bulunanlar[0]; }
    /* Göç öncesi veride aynı işyerine ait ikinci kopya olabilir. Hangi kopyanın
       okunacağı liste sırasına bırakılmaz: en son güncellenen kazanır; eşitlikte
       dolu alan sayısı, sonra kimlik, en son kayıt metni belirler. Böylece kayıt
       ekranı, kart ve rapor aynı kopyayı okur; bulut birleşiminden sonra tarih
       yer değiştirmez. */
    var doluluk = function (kayit) {
      var sayi = 0;
      Object.keys(kayit || {}).forEach(function (alan) {
        var deger = kayit[alan];
        if (typeof deger === 'string' ? !!deger.trim() : (Array.isArray(deger) ? deger.length > 0 : !!deger)) { sayi += 1; }
      });
      return sayi;
    };
    bulunanlar.sort(function (a, b) {
      var za = String((a && (a.guncelleme || a.olusturma)) || '');
      var zb = String((b && (b.guncelleme || b.olusturma)) || '');
      if (za !== zb) { return za < zb ? 1 : -1; }
      var da = doluluk(a), db = doluluk(b);
      if (da !== db) { return db - da; }
      var ia = String((a && a.id) || ''), ib = String((b && b.id) || '');
      if (ia !== ib) { return ia < ib ? -1 : 1; }
      var ja = JSON.stringify(a), jb = JSON.stringify(b);
      return ja === jb ? 0 : (ja < jb ? -1 : 1);
    });
    return bulunanlar[0];
  };

  /* Acil durum planının TEK okuma kapısı: kayıt ekranı, mevcut durum kartı,
     Excel çıktısı ve doğrulama araçları buradan okur. Farklı ekranların farklı
     kopyayı okuması bu fonksiyonun dışına çıkılarak engellenir. */
  ISG.acilPlanKaydi = function (veri, isyeriId) {
    var hesap = veri || (ISG.depo && typeof ISG.depo.al === 'function' ? ISG.depo.al() : null);
    return ISG.ilgiliKayit(hesap, 'acilPlanlar', isyeriId);
  };

  /* Vade yalnızca zamana bakar: tarih geçmiş mi, bugün mü, yaklaşıyor mu?
     Eşik dosya kontrolleriyle aynı tutulur (14 gün). Tamamlanmış faaliyetler
     için sonuç gösterilmez; bunu planDurumu ayıklar. */
  var VADE_YAKLASAN_GUN = 14;

  ISG.planVade = function (plan) {
    var kalan = ISG.gunFarki(plan && plan.takipTarihi);
    if (kalan === null) { return { id: 'tarihsiz', ad: 'Takip tarihi belirlenmedi', sinif: 'notr', kalan: null }; }
    if (kalan < 0) { return { id: 'gecikti', ad: Math.abs(kalan) + ' gün geçti', sinif: 'tehlike', kalan: kalan }; }
    if (kalan === 0) { return { id: 'bugun', ad: 'Bugün yapılmalı', sinif: 'uyari', kalan: 0 }; }
    if (kalan <= VADE_YAKLASAN_GUN) { return { id: 'yaklasan', ad: kalan + ' gün kaldı', sinif: 'uyari', kalan: kalan }; }
    return { id: 'ileri', ad: kalan + ' gün kaldı', sinif: 'notr', kalan: kalan };
  };

  /* Görünen durum = kayıtlı durum + zaman. Tek kural: takip tarihi geçtiği
     hâlde faaliyet kapanmamışsa görünür durum "Gecikti"dir. Kapanmış
     (tamamlandı / iptal / kapsam dışı) kayıtlar gecikmez. Rozet, filtre,
     sayaç ve tablo satırı rengi bu tek fonksiyondan beslenir.
     `satirSinifi`: renkli sold çerçeve + açık zemin (uygulama.js çiziminde). */
  ISG.planDurumu = function (plan) {
    var kayitli = ISG.planDurumNormal(plan && plan.durum);
    var vade = ISG.planVade(plan);
    var kapali = ISG.PLAN_DURUM_KAPALI.indexOf(kayitli) > -1;
    var id = (!kapali && vade.id === 'gecikti') ? 'gecikti' : kayitli;
    var tanim = ISG.PLAN_DURUMLARI[id] || ISG.PLAN_DURUMLARI.yapilacak;
    var satirSinifi = '';
    if (id === 'gecikti' || id === 'tamamlanmadi') { satirSinifi = 'satir-tehlike'; }
    else if (kayitli === 'iptal' || kayitli === 'kapsamDisi') { satirSinifi = 'satir-notr'; }
    else if (!kapali && (vade.id === 'bugun' || vade.id === 'yaklasan')) { satirSinifi = 'satir-uyari'; }
    return {
      id: id,
      ad: tanim.ad,
      sinif: tanim.sinif,
      kayitliDurum: kayitli,
      kayitliAd: (ISG.PLAN_DURUMLARI[kayitli] || tanim).ad,
      tamamlandi: kayitli === 'tamamlandi',
      kapali: kapali,
      bekleyen: !kapali,
      takipsiz: ISG.PLAN_DURUM_TAKIPSIZ.indexOf(kayitli) > -1,
      kalan: vade.kalan,
      vade: vade.id,
      vadeAd: kapali ? '' : vade.ad,
      vadeSinif: kapali ? '' : vade.sinif,
      satirSinifi: satirSinifi,
      uyari: satirSinifi !== ''
    };
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
    /* Tehlike sınıfı okunamıyorsa sınıf UYDURULMAZ (şartname §2.3): yenileme
       aralığı da hesaplanmaz, ekran "sınıf girilmedi" der. Varsayılan sınıf
       atamak 6 yıllık az tehlikeli bir işyerini 2 yıllık çok tehlikeli gibi
       göstereceği için sonuç sessizce yanlış olurdu. */
    var sinifKodu = typeof ISG.tehlikeSinifiKodu === 'function'
      ? ISG.tehlikeSinifiKodu(isyeri && isyeri.tehlikeSinifi) : '';
    var sinif = sinifKodu ? (ISG.RISK_SINIFLARI[sinifKodu] || null) : null;

    /* Üç tarih BAĞIMSIZ alan olarak okunur: biri diğerinin yerine geçmez.
       Biçimi geçersiz tarih gizlenmez; `gecersiz` işaretiyle ekrana taşınır ki
       geçerliymiş gibi gösterilmesin. */
    var tarihAlani = function (alan) {
      var ham = String((kayit && kayit[alan]) || '').trim();
      return { deger: ham, gecerli: !!ham && ISG.tarihGecerliMi(ham) };
    };
    var hazirlanma = tarihAlani('hazirlanma');
    var sonYenileme = tarihAlani('sonYenileme');
    var tatbikat = tarihAlani('tatbikat');

    /* Geçerlilik hesabının dayanağı: son yenileme; yoksa ilk hazırlanma.
       Tatbikat tarihi yenileme yerine SAYILMAZ (ayrı izlenen çalışmadır). */
    var esasAlani = '';
    var esas = '';
    if (sonYenileme.gecerli) { esasAlani = 'sonYenileme'; esas = sonYenileme.deger; }
    else if (hazirlanma.gecerli) { esasAlani = 'hazirlanma'; esas = hazirlanma.deger; }

    var enGec = (esas && sinif) ? ISG.yilEkle(esas, sinif.acilYenilemeYil) : '';
    var kalan = ISG.gunFarki(enGec);
    /* Dört durum ayrı ayrı adlandırılır: "kayıt yok" ile "tarih girilmedi" ve
       "vadesi geçti" birbirine karıştırılmaz. */
    var durum;
    if (!kayit) { durum = 'kayitYok'; }
    else if (!esas) { durum = 'tarihsiz'; }
    else if (!sinif) { durum = 'sinifYok'; }
    else { durum = (kalan !== null && kalan < 0) ? 'gecikti' : 'gecerli'; }

    /* Ekip üyeleri tek biçimde (rol adı + kimlik) okunur: eski kayıtlardaki
       rol kimliği ya da nesne biçimli ekip alanı görünümde kaybolmaz. */
    var ekip = kayit && ISG.depo && typeof ISG.depo.acilEkipUyeleri === 'function'
      ? ISG.depo.acilEkipUyeleri(kayit)
      : ((kayit && kayit.ekip) || []);
    return {
      hazirlanma: hazirlanma.deger,
      sonYenileme: sonYenileme.deger,
      tatbikat: tatbikat.deger,
      gecersiz: {
        hazirlanma: !!hazirlanma.deger && !hazirlanma.gecerli,
        sonYenileme: !!sonYenileme.deger && !sonYenileme.gecerli,
        tatbikat: !!tatbikat.deger && !tatbikat.gecerli
      },
      esas: esas,
      esasAlani: esasAlani,
      /* Geriye dönük alan adı: geçerlilik hesabına giren tarih. */
      son: esas || '',
      enGec: enGec,
      kalan: kalan,
      durum: durum,
      sinif: sinif,
      sinifKodu: sinifKodu,
      sinifAdi: sinif ? sinif.ad : '',
      yenilemeYil: sinif ? sinif.acilYenilemeYil : 0,
      ekip: ekip
    };
  };

  /* ---------- Zorunlu acil durum ekipleri: oran ve sayım kuralları ----------
     Mevzuat (Acil Durum Yönetmeliği ve 17.12.2013 tarihli Eğitim Yönetmeliği) ekip
     mevcudu için sabit bir sayı vermez; yerleşik uygulama çalışan sayısının tehlike
     sınıfına göre oranlanmasıdır:
       • Söndürme / kurtarma / koruma: az tehlikeli 1/50, tehlikeli 1/40, çok tehlikeli 1/30
       • İlk yardım: az tehlikeli 1/20, tehlikeli 1/15, çok tehlikeli 1/10
     Kesirli sonuç yukarı yuvarlanır. Yasal bir "en az 3 kişi" tabanı YOKTUR:
     önceden uygulanan 3 kişilik yapay alt sınır kaldırıldı (1 kişilik az tehlikeli
     işyerinde 1 kişi, 20 kişilik az tehlikeli işyerinde yine 1 kişi gerekir).
     Oranlar tek yerden değiştirilir. Çalışan sayısı ya da tehlike sınıfı eksikse
     sayı UYDURULMAZ (0 gösterilip "gerek yok" izlenimi verilmez): hesap geçersiz
     sayılır ve kullanıcı eksik alanı girmesi için uyarılır. Personel kaydı olan
     işyerinde gerçek 0 çalışan ise "veri eksik" değildir; bu durum çağıran tarafın
     `sifirGecerli` seçeneğiyle bildirilir. */
  var ACIL_EQIP_ORANLARI = {
    az: { sondurme: 50, kurtarma: 50, koruma: 50, ilkYardim: 20 },
    tehlikeli: { sondurme: 40, kurtarma: 40, koruma: 40, ilkYardim: 15 },
    cokTehlikeli: { sondurme: 30, kurtarma: 30, koruma: 30, ilkYardim: 10 }
  };
  ISG.ACIL_EQIP_ORANLARI = ACIL_EQIP_ORANLARI;

  /* Zorunlu dört ekip. `rolAdlari` plan kaydındaki görev adlarıyla eşleşir; eski
     sürümlerde yazılan adlar `eskiRolAdlari` içinde tutulur ki eski kayıtlar yeniden
     düzenlenmek zorunda kalmasın. `belgeEgitim` doluysa üyenin sayılabilmesi için o
     eğitim türünün (ya da üyenin belge tarihinin) süresinin dolmamış olması gerekir. */
  ISG.ACIL_EQIP_TANIMLARI = [
    { id: 'sondurme', ad: 'Söndürme ekibi',
      gorev: 'Yangına ilk müdahale, söndürme ve tahliyeye destek',
      rolAdlari: ['Yangın söndürme ekibi'],
      eskiRolAdlari: ['Söndürme ekibi', 'Yangın söndürme'],
      belgeEgitim: '', belgeEtiketi: '' },
    { id: 'kurtarma', ad: 'Kurtarma ekibi',
      gorev: 'Arama, kurtarma ve tahliye çalışmaları',
      rolAdlari: ['Kurtarma ekibi', 'Tahliye / arama kurtarma'],
      eskiRolAdlari: ['Arama kurtarma', 'Tahliye / Arama Kurtarma'],
      belgeEgitim: '', belgeEtiketi: '' },
    { id: 'koruma', ad: 'Koruma ekibi',
      gorev: 'Alan güvenliği, kayıt ve envanter koruması',
      rolAdlari: ['Koruma ekibi'],
      eskiRolAdlari: ['Koruma/Güvenlik ekibi', 'Koruma / Güvenlik ekibi', 'Savunma/GS ekibi', 'Savunma / GS ekibi'],
      belgeEgitim: '', belgeEtiketi: '' },
    { id: 'ilkYardim', ad: 'İlk yardım ekibi',
      gorev: 'Olay yerinde ilk yardım uygulaması',
      rolAdlari: ['İlk yardım ekibi'],
      eskiRolAdlari: ['İlk Yardım Ekibi', 'Ilk yardim ekibi', 'İlk yardımcılar'],
      belgeEgitim: 'ilkYardim', belgeEtiketi: 'İlk yardım sertifikası' }
  ];

  /* Türkçe karakter duyarlı karşılaştırma: "Çok Tehlikeli" ile "çok tehlikeli" aynı. */
  function metinKucuk(deger) {
    var metin = String(deger === null || deger === undefined ? '' : deger).replace(/\s+/g, ' ').trim();
    try { return metin.toLocaleLowerCase('tr-TR'); } catch (hata) { return metin.toLowerCase(); }
  }

  var TEHLIKE_SINIF_KODLARI = {
    'az': 'az', 'az tehlikeli': 'az',
    'tehlikeli': 'tehlikeli',
    'coktehlikeli': 'cokTehlikeli', 'çoktehlikeli': 'cokTehlikeli',
    'cok tehlikeli': 'cokTehlikeli', 'çok tehlikeli': 'cokTehlikeli'
  };

  /* Tehlike sınıfı tek biçime indirilir: kayıt anahtarı ('cokTehlikeli'), etiket
     ('Çok tehlikeli') ya da dışa aktarımdan gelen düz metin kabul edilir. */
  ISG.tehlikeSinifiKodu = function (deger) {
    if (ISG.RISK_SINIFLARI && ISG.RISK_SINIFLARI[String(deger)]) { return String(deger); }
    var metin = metinKucuk(deger);
    return TEHLIKE_SINIF_KODLARI[metin] || '';
  };

  /* "1.140", "1140 ", 1140 → 1140; boş/sıfır/geçersiz → 0 (sayım yapılamaz). */
  function tamsayiOku(deger) {
    if (deger === null || deger === undefined || deger === '') { return 0; }
    var ham = String(deger).replace(/\s/g, '');
    var sayi = Number(ham);
    if (!isFinite(sayi)) { sayi = parseInt(ham.replace(/[^\d]/g, ''), 10); }
    sayi = Math.floor(sayi || 0);
    return sayi > 0 ? sayi : 0;
  }
  ISG.tamsayiOku = tamsayiOku;

  function bugunIso() {
    var simdi = new Date();
    var ay = String(simdi.getMonth() + 1);
    var gun = String(simdi.getDate());
    return simdi.getFullYear() + '-' + (ay.length < 2 ? '0' + ay : ay) + '-' + (gun.length < 2 ? '0' + gun : gun);
  }
  ISG.bugunIso = bugunIso;

  /* ISO (YYYY-AA-GG) ve gerçek takvime uyan tarih kabul edilir; 2026-02-31 reddedilir. */
  ISG.tarihGecerliMi = function (deger) {
    var metin = String(deger || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(metin)) { return false; }
    var parca = metin.split('-');
    var tarih = new Date(Number(parca[0]), Number(parca[1]) - 1, Number(parca[2]), 12, 0, 0, 0);
    return tarih.getFullYear() === Number(parca[0]) &&
      tarih.getMonth() === Number(parca[1]) - 1 &&
      tarih.getDate() === Number(parca[2]);
  };

  /* Ekip sayısında esas alınan çalışan sayısı.
     Kural (D1): öncelik AKTİF personel kayıtlarıdır. Pasif (ayrılmış) personel
     sayılmaz; personel kaydı hiç yoksa işyeri kartındaki çalışan sayısı yedek
     kaynaktır. Kart ile aktif personel farklıysa aktif personel esas alınır ve
     kullanıcıya veri tutarsızlığı uyarısı döner. "Gerçek sıfır" (personel var,
     hepsi pasif) ile "veri eksik" (ne personel ne kart) ayrı işaretlenir: `tip`
     alanı 'personel' / 'personelSifir' / 'kart' / 'veriYok' değerlerini alır. */
  ISG.acilCalisanSayisi = function (isyeri, veri) {
    var isyeriId = isyeri && isyeri.id !== null && isyeri.id !== undefined ? String(isyeri.id) : '';
    var kayitSayisi = tamsayiOku(isyeri && isyeri.calisanSayisi);
    var kayitliPersonel = 0;
    var pasifPersonel = 0;
    var personelVar = false;
    if (veri && isyeriId) {
      (veri.personel || []).forEach(function (kisi) {
        if (!kisi) { return; }
        if (String(kisi.isyeriId === null || kisi.isyeriId === undefined ? '' : kisi.isyeriId) !== isyeriId) { return; }
        personelVar = true;
        /* Yalnızca açıkça 'pasif' işaretli kayıt dışarıda kalır: durum alanı
           olmayan eski aktarımlar aktif sayılır (bkz. ISG.ayAktifPersonel). */
        if (String(kisi.durum || '') === 'pasif') { pasifPersonel += 1; }
        else { kayitliPersonel += 1; }
      });
    }
    var sayi = personelVar ? kayitliPersonel : kayitSayisi;
    var tip = personelVar ? (sayi > 0 ? 'personel' : 'personelSifir') : (kayitSayisi > 0 ? 'kart' : 'veriYok');
    var uyari = '';
    var bilgi = '';
    if (personelVar && kayitSayisi && kayitliPersonel !== kayitSayisi) {
      uyari = 'Personel listesinde ' + kayitliPersonel + ' aktif kişi var, işyeri kartında ' +
        kayitSayisi + ' çalışan yazıyor. Ekip ihtiyacı aktif personel (' + kayitliPersonel +
        ' kişi) üzerinden hesaplandı' +
        (pasifPersonel ? '; ' + pasifPersonel + ' pasif kayıt sayılmadı' : '') +
        '. İşyeri kartındaki çalışan sayısını güncelleyin.';
    } else if (personelVar && !kayitSayisi) {
      bilgi = 'İşyeri kartında çalışan sayısı girilmemiş; ekip ihtiyacı personel listesindeki ' +
        kayitliPersonel + ' aktif kişi üzerinden hesaplandı.';
    } else if (personelVar && sayi === 0) {
      bilgi = 'Personel kayıtlarının tamamı pasif görünüyor (' + pasifPersonel +
        ' kayıt); ekip ihtiyacı 0 çalışan üzerinden hesaplandı.';
    }
    /* "Personel kaydı yok, kart kullanıldı" bilgisi ayrı şerit olarak yazılmaz:
       alt satırdaki kaynak etiketi ("İşyeri kartı") bunu zaten söyler. */
    return {
      isyeriId: isyeriId,
      calisanSayisi: sayi,
      isyeriSayisi: kayitSayisi,
      kayitliPersonel: kayitliPersonel,
      pasifPersonel: pasifPersonel,
      personelVar: personelVar,
      tip: tip,
      kaynak: personelVar ? 'Aktif personel kayıtları' : (kayitSayisi ? 'İşyeri kartı' : ''),
      eksik: tip === 'veriYok',
      sifir: sayi === 0,
      uyari: uyari,
      bilgi: bilgi
    };
  };

  /* Oran tablosundan zorunlu mevcut. Dönüş: {gecerli, neden, satirlar:[…], gerekli}.
     `secenekler.sifirGecerli` çağıran taraf "0 çalışan doğrulanmış" diyorsa true
     gelir (personel kaydı var, hepsi pasif): bu durumda hesap geçerlidir ve gerekli
     ekip sayısı 0'dır. Aksi hâlde 0 çalışan "veri eksik" sayılır. */
  ISG.acilEkipGereksinimi = function (tehlikeSinifi, calisanSayisi, secenekler) {
    var sec = secenekler || {};
    var sifirGecerli = !!sec.sifirGecerli;
    var sinifKodu = ISG.tehlikeSinifiKodu(tehlikeSinifi);
    var sayi = tamsayiOku(calisanSayisi);
    var neden = '';
    if (!sinifKodu) { neden = 'Tehlike sınıfı tanımlı değil (az / tehlikeli / çok tehlikeli).'; }
    else if (!sayi && !sifirGecerli) { neden = 'Çalışan sayısı girilmemiş ya da 0; zorunlu ekip sayısı hesaplanamıyor.'; }
    var oranlar = sinifKodu ? (ACIL_EQIP_ORANLARI[sinifKodu] || {}) : {};
    var hesaplanabilir = !!sinifKodu && (sayi > 0 || sifirGecerli);
    var toplam = 0;
    var satirlar = ISG.ACIL_EQIP_TANIMLARI.map(function (tanim) {
      var oran = oranlar[tanim.id] ? Number(oranlar[tanim.id]) : 0;
      /* Şartname formülü: gerekli = ceil(çalışan / oran). Yapay alt sınır YOK. */
      var gerekli = (hesaplanabilir && oran) ? Math.ceil(sayi / oran) : 0;
      toplam += gerekli;
      return {
        id: tanim.id,
        ad: tanim.ad,
        gorev: tanim.gorev,
        belgeEgitim: tanim.belgeEgitim || '',
        belgeEtiketi: tanim.belgeEtiketi || '',
        rolAdlari: (tanim.rolAdlari || []).concat(tanim.eskiRolAdlari || []),
        oran: oran,
        oranEtiketi: oran ? '1/' + oran : '',
        calisan: sayi,
        gerekli: gerekli,
        eksikHesap: !hesaplanabilir
      };
    });
    return {
      gecerli: !neden,
      neden: neden,
      sinifKodu: sinifKodu,
      sinifAdi: (ISG.RISK_SINIFLARI[sinifKodu] || {}).ad || '',
      calisanSayisi: sayi,
      sifir: hesaplanabilir && sayi === 0,
      satirlar: satirlar,
      gerekli: toplam
    };
  };


  /* Üyeyi kişi olarak tanımlayan anahtar: personel kimliği önceliklidir, personel
     listesinde olmayan kişilerde ad kullanılır. Aynı kişinin aynı ekibe iki kez
     yazılması mevcut sayısını şişirmez. */
  function ekipKisiKimligi(uye) {
    var kimlik = String((uye && uye.personelId) || '').trim();
    if (kimlik) { return 'p:' + kimlik; }
    var ad = metinKucuk((uye && uye.ad) || '');
    return ad ? 'a:' + ad : '';
  }

  /* Belge/eğitim süresi denetimi. Tarih yoksa 'tarihsiz' (kişi sayılır ama uyarılır),
     geçmişse 'suresiDoldu' (kişi sayılmaz). Belge tarihi hem üyenin kendi alanından hem
     Eğitimler kaydından (kimlik ya da ad eşleşmesiyle) okunur; böylece alan adı farklı
     olan eski veride de çalışır. İlk yardım dışındaki ekiplerde denetim yapılmaz. */
  function uyeBelgeDurumu(uye, tanim, veri, bugun) {
    if (!tanim.belgeEgitim) { return { durum: 'gerekmiyor', tarih: '', etiket: '' }; }
    var etiket = tanim.belgeEtiketi || tanim.belgeEgitim;
    var adaylar = [];
    if (uye.gecerlilik) { adaylar.push(String(uye.gecerlilik)); }
    var kims = [];
    var pid = String(uye.personelId || '').trim();
    if (pid) { kims.push(pid); }
    var ad = metinKucuk(uye.ad || '');
    if (ad) {
      ((veri && veri.personel) || []).forEach(function (kisi) {
        if (metinKucuk(kisi.adSoyad || '') === ad) { kims.push(String(kisi.id)); }
      });
    }
    ((veri && veri.egitimler) || []).forEach(function (kayit) {
      if (String(kayit.tur || '') !== tanim.belgeEgitim) { return; }
      if (!kayit.gecerlilik) { return; }
      if (kims.indexOf(String(kayit.personelId || '')) < 0) { return; }
      adaylar.push(String(kayit.gecerlilik));
    });
    var okunan = adaylar.filter(function (deger) { return ISG.tarihGecerliMi(deger); }).sort();
    var enYeni = okunan.length ? okunan[okunan.length - 1] : '';
    if (!enYeni) { return { durum: 'tarihsiz', tarih: adaylar[0] || '', etiket: etiket }; }
    return enYeni >= bugun
      ? { durum: 'gecerli', tarih: enYeni, etiket: etiket }
      : { durum: 'suresiDoldu', tarih: enYeni, etiket: etiket };
  }


  /* Ekip tablosunun tek gerçeği: her zorunlu ekip için gerekli / kayıtlı / onaylı
     kişi, eksik, belge durumu, mükerrer ve çakışma uyarıları. Ekran ve CSV bu nesneyi
     okur; hesaplama burada, tek yerde yapılır. */
  ISG.acilEkipDurumu = function (isyeri, planKaydi, veri) {
    var sayim = ISG.acilCalisanSayisi(isyeri, veri);
    var gereksinim = ISG.acilEkipGereksinimi(isyeri && isyeri.tehlikeSinifi, sayim.calisanSayisi,
      { sifirGecerli: sayim.personelVar });
    var uyarilar = [];
    var bilgiler = [];
    if (sayim.uyari) { uyarilar.push(sayim.uyari); }
    if (sayim.bilgi) { bilgiler.push(sayim.bilgi); }
    if (!gereksinim.gecerli) { uyarilar.push(gereksinim.neden + ' Ekip ihtiyacı hesaplanamadı, eksik alanı doldurun.'); }
    var bugun = bugunIso();
    var uyeler = (planKaydi && ISG.depo && typeof ISG.depo.acilEkipUyeleri === 'function')
      ? ISG.depo.acilEkipUyeleri(planKaydi)
      : ((planKaydi && planKaydi.ekip) || []);
    var kisiEkipleri = {};
    var satirlar = gereksinim.satirlar.map(function (satir) {
      var gruptakiler = uyeler.filter(function (uye) {
        return satir.rolAdlari.indexOf(acilRolAdi(uye && uye.rol)) > -1;
      });
      var kisiler = {}, onayli = 0, tarihsiz = [], suresiDolan = [], mukerrer = 0;
      gruptakiler.forEach(function (uye) {
        var kimlik = ekipKisiKimligi(uye);
        var ad = String((uye && uye.ad) || '').trim();
        if (!kimlik) { uyarilar.push(satir.ad + ' satırında adı olmayan kişi var; sayıya dahil edilmedi.'); return; }
        if (kisiler[kimlik]) { mukerrer += 1; return; }
        var belge = uyeBelgeDurumu(uye || {}, satir, veri, bugun);
        kisiler[kimlik] = { ad: ad || '(adsız)', belge: belge.durum, tarih: belge.tarih };
        if (!kisiEkipleri[kimlik]) { kisiEkipleri[kimlik] = { ad: ad || '(adsız)', ekipler: [] }; }
        kisiEkipleri[kimlik].ekipler.push(satir.ad);
        if (belge.durum === 'suresiDoldu') { suresiDolan.push({ ad: ad || '(adsız)', tarih: belge.tarih }); return; }
        if (belge.durum === 'tarihsiz') { tarihsiz.push({ ad: ad || '(adsız)', etiket: belge.etiket }); }
        onayli += 1;
      });
      if (mukerrer) { uyarilar.push(satir.ad + ' ekibinde ' + mukerrer + ' mükerrer kayıt var; aynı kişi bir kez sayıldı.'); }
      var kisiSayisi = Object.keys(kisiler).length;
      var eksik = gereksinim.gecerli ? Math.max(0, satir.gerekli - onayli) : 0;
      var durum = 'hesaplanamadi';
      if (gereksinim.gecerli) {
        if (satir.gerekli === 0) { durum = 'gerekYok'; }
        else if (kisiSayisi === 0) { durum = 'yok'; }
        else { durum = eksik > 0 ? 'eksik' : 'tamam'; }
      }
      return {
        id: satir.id, ad: satir.ad, gorev: satir.gorev, rolAdlari: satir.rolAdlari,
        oranEtiketi: satir.oranEtiketi, calisan: satir.calisan, gerekli: satir.gerekli,
        uyeSayisi: gruptakiler.length, kisiSayisi: kisiSayisi, onayli: onayli, eksik: eksik,
        durum: durum,
        kisiler: Object.keys(kisiler).map(function (anahtar) { return kisiler[anahtar]; }),
        tarihsiz: tarihsiz, suresiDolan: suresiDolan, mukerrer: mukerrer
      };
    });
    var cakismalar = Object.keys(kisiEkipleri).filter(function (anahtar) {
      return kisiEkipleri[anahtar].ekipler.length > 1;
    }).map(function (anahtar) {
      return { ad: kisiEkipleri[anahtar].ad, ekipler: kisiEkipleri[anahtar].ekipler };
    });
    cakismalar.forEach(function (cakisma) {
      uyarilar.push(cakisma.ad + ' birden fazla zorunlu ekipte görünüyor (' + cakisma.ekipler.join(', ') +
        '); zorunlu mevcut her ekip için ayrı kişi görevlendirin.');
    });
    var ozet = {
      gerekli: gereksinim.gerekli, kisi: 0, onayli: 0, eksik: 0, eksikEkip: 0,
      tarihsiz: 0, suresiDoldu: 0
    };
    satirlar.forEach(function (satir) {
      ozet.kisi += satir.kisiSayisi;
      ozet.onayli += satir.onayli;
      ozet.eksik += satir.eksik;
      ozet.tarihsiz += satir.tarihsiz.length;
      ozet.suresiDoldu += satir.suresiDolan.length;
      /* "Ekip yok" yalnızca gerçekten kişi gerektiğinde sayılır: 0 çalışanlı
         işyerinde zorunlu ekip mevcudu yoktur, eksik gibi gösterilmez. */
      if (satir.gerekli > 0 && satir.kisiSayisi === 0) { ozet.eksikEkip += 1; }
    });
    return {
      isyeriId: sayim.isyeriId,
      calisan: sayim,
      gereksinim: gereksinim,
      gecerli: gereksinim.gecerli,
      satirlar: satirlar,
      cakismalar: cakismalar,
      uyarilar: uyarilar,
      bilgiler: bilgiler,
      gorevEksik: gereksinim.gecerli && ozet.eksikEkip > 0,
      eksik: ozet.eksik,
      ozet: ozet
    };
  };



  /* Görünüm köprüsü: görev (rol) adı hangi zorunlu ekibin satırıdır? Koordinatör,
     işyeri hekimi gibi zorunlu olmayan görevler satır dışı kalır (null) ve ekran onlara
     "gerekli sayısı" rozeti basmaz. Eski rol adları da aynı satıra bağlanır. */
  ISG.acilEkipSatiri = function (durum, rolAdi) {
    if (!durum || !durum.satirlar) { return null; }
    var ad = acilRolAdi(rolAdi);
    return durum.satirlar.filter(function (satir) {
      return (satir.rolAdlari || []).indexOf(ad) > -1;
    })[0] || null;
  };


  /* Acil durum planı tarih denetimi: biçimi bozuk ya da takvimi olmayan tarih,
     ileri tarih ve tutarsız sıra KAYDI ENGELLER. Yenileme vadesinin geçmiş olması
     tek başına engel değildir (vade geciktiğini gösterir; geçmiş tarihi silmeye
     zorlamaz). Tatbikat tarihi yenileme hesabına HİÇ girmez. */
  ISG.acilPlanTarihKontrol = function (alanlar, tehlikeSinifi) {
    var etiketler = { hazirlanma: 'Hazırlanma tarihi', sonYenileme: 'Son yenileme tarihi', tatbikat: 'Son tatbikat tarihi' };
    var hatalar = [], uyarilar = [], degerler = {}, gecersiz = {};
    Object.keys(etiketler).forEach(function (alan) {
      degerler[alan] = String((alanlar || {})[alan] || '').trim();
    });
    Object.keys(etiketler).forEach(function (alan) {
      var deger = degerler[alan];
      if (!deger) { return; }
      if (!ISG.tarihGecerliMi(deger)) {
        gecersiz[alan] = true;
        hatalar.push(etiketler[alan] + ' geçerli bir tarih değil («' + deger + '»). Takvimden YYYY-AA-GG biçiminde seçin.');
        return;
      }
      if (deger > bugunIso()) {
        hatalar.push(etiketler[alan] + ' bugünden (' + bugunIso() + ') ileri bir tarih olamaz; yapılmamış bir çalışmayı işlenmiş gibi göstermeyin.');
      }
    });
    if (!hatalar.length && degerler.hazirlanma && degerler.sonYenileme && degerler.sonYenileme < degerler.hazirlanma) {
      hatalar.push('Son yenileme tarihi (' + degerler.sonYenileme + ') hazırlanma tarihinden (' + degerler.hazirlanma + ') eski olamaz.');
    }
    if (!degerler.hazirlanma && !degerler.sonYenileme) {
      hatalar.push('Hazırlanma ya da son yenileme tarihinden biri zorunlu; aksi hâlde en geç yenileme tarihi hesaplanamaz.');
    } else if (!degerler.sonYenileme) {
      uyarilar.push('Son yenileme girilmedi; en geç yenileme tarihi ilk hazırlanma tarihine (' + degerler.hazirlanma + ') göre hesaplanıyor.');
    }
    if (!degerler.tatbikat) {
      uyarilar.push('Son tatbikat tarihi boş: tatbikat ayrı izlenen bir çalışma ve kayıt zorunluluğudur; plan yenilemesi tatbikat yerine geçmez.');
    } else if (!gecersiz.tatbikat && !gecersiz.hazirlanma && degerler.hazirlanma && degerler.tatbikat < degerler.hazirlanma) {
      /* Planın hazırlanmasından önce yapılmış bir tatbikat plana dayanamaz:
         kaydı engellemez ama tarihlerin aynı plan dönemine ait olmadığını söyler. */
      uyarilar.push('Son tatbikat tarihi (' + degerler.tatbikat + ') ilk hazırlanma tarihinden (' +
        degerler.hazirlanma + ') önce; tatbikat plan hazırlandıktan sonra yapılır. Tarihleri doğrulayın.');
    }
    var sinif = ISG.RISK_SINIFLARI[ISG.tehlikeSinifiKodu(tehlikeSinifi)] || null;
    /* Geçerlilik hesabının dayanağı kart ve Excel ile aynı kuraldır:
       son yenileme; yoksa ilk hazırlanma. Tatbikat hiçbir zaman dayanak değildir. */
    var esasAlani = '';
    if (degerler.sonYenileme && !gecersiz.sonYenileme) { esasAlani = 'sonYenileme'; }
    else if (degerler.hazirlanma && !gecersiz.hazirlanma) { esasAlani = 'hazirlanma'; }
    var esas = esasAlani ? degerler[esasAlani] : '';
    var enGec = (sinif && esas) ? ISG.yilEkle(esas, sinif.acilYenilemeYil) : '';
    var kalan = ISG.gunFarki(enGec);
    var vadeDurumu = !esas ? 'tarihsiz' : (!sinif ? 'sinifYok' : (kalan !== null && kalan < 0 ? 'gecikti' : 'gecerli'));
    /* Tehlike sınıfı yoksa yenileme aralığı belirlenemez: varsayılan sınıf
       uydurmak yerine kayıt engellenir ve eksik alan adıyla söylenir. */
    if (!sinif) {
      hatalar.push('Tehlike sınıfı tanımlı olmadığı için acil durum planının yenileme aralığı belirlenemiyor; ' +
        'işyeri kaydında tehlike sınıfını (az / tehlikeli / çok tehlikeli) seçin.');
    }
    return {
      hatalar: hatalar,
      uyarilar: uyarilar,
      gecersiz: gecersiz,
      esas: esas,
      esasAlani: esasAlani,
      enGec: enGec,
      kalan: kalan,
      vadeDurumu: vadeDurumu,
      gecerli: hatalar.length === 0
    };
  };

  /* Ekip ve tarih denetimleri her zaman bir "alan nesnesi" üzerinden yapılır.
     Henüz kaydı olmayan işyerinde `null` yerine bu boş nesne kullanılır; böylece
     "tarih girilmedi" uyarısı ile "kayıt yok" durumu aynı akışta değerlendirilir. */
  ISG.acilPlanBosKayit = function () {
    return { hazirlanma: '', sonYenileme: '', tatbikat: '' };
  };

  /* Tarih denetiminin kısa yazısı: kartlarda ve Excel çıktısında tek satıra sığar.
     Hatalar tek tek yazılmaz ("N tarih hatası" + ilk hatanın kendisi); ayrıntılı
     liste diyalohta ve ISG.acilPlanTarihMetni ile uyarı kutularında gösterilir. */
  ISG.acilPlanTarihOzet = function (sonuc) {
    var kontrol = sonuc || {};
    var hatalar = kontrol.hatalar || [];
    var uyarilar = kontrol.uyarilar || [];
    if (hatalar.length) {
      return hatalar[0] + (hatalar.length > 1 ? ' (+' + (hatalar.length - 1) + ' tarih hatası daha)' : '');
    }
    if (uyarilar.length) {
      return uyarilar[0] + (uyarilar.length > 1 ? ' (+' + (uyarilar.length - 1) + ' tarih uyarısı daha)' : '');
    }
    return null;
  };

  /* Uyarı kutuları ve onay soruları için ayrıntılı yazı: her satır bir kalem.
     Satır başına numara konulur; kullanıcı hangi tarihi düzelteceğini karıştırmaz. */
  ISG.acilPlanTarihMetni = function (sonuc) {
    var kontrol = sonuc || {};
    var satirlar = [];
    (kontrol.hatalar || []).forEach(function (metin, sira) {
      satirlar.push((kontrol.hatalar.length > 1 ? (sira + 1) + '. ' : '') + metin);
    });
    (kontrol.uyarilar || []).forEach(function (metin, sira) {
      satirlar.push((kontrol.uyarilar.length > 1 ? (sira + 1) + '. ' : '') + metin);
    });
    return satirlar.join('\n');
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
      /* Tarihsiz (Planlanmadı) ve tamamlanan faaliyet panelde iş üretmez;
         "Tamamlanmadı" kayıtlar izlenmeye devam eder. */
      /* Tarihsiz (Planlanmadı) ve kapanmış faaliyetler panelde iş üretmez;
         "Tamamlanmadı", "Devam Ediyor", "Belge bekliyor" ve "Ertelendi"
         kayıtlar izlenmeye devam eder. */
      if (!plan.takipTarihi || ISG.planDurumKapanmis(plan.durum)) { return; }
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

  /* Dosya kontrolünün zaman durumu: yenileme tarihine göre uyarı üretir.
     Eşik: süre geçmişse kırmızı, bugün veya 14 gün içindeyse amber.
     `satirSinifi` tablo satırının renklendirilmesinde kullanılır. */
  ISG.dosyaZamanDurumu = function (dosya) {
    var kalan = ISG.gunFarki(dosya && dosya.yenileme);
    if (kalan === null) { return { id: 'tarihsiz', ad: 'Tarih girilmedi', sinif: 'notr', kalan: null, vadeSinif: '', satirSinifi: '' }; }
    if (kalan < 0) { return { id: 'gecen', ad: Math.abs(kalan) + ' gün geçti', sinif: 'tehlike', kalan: kalan, vadeSinif: 'tehlike', satirSinifi: 'satir-tehlike' }; }
    if (kalan === 0) { return { id: 'bugun', ad: 'Bugün yenilenmeli', sinif: 'uyari', kalan: 0, vadeSinif: 'uyari', satirSinifi: 'satir-uyari' }; }
    if (kalan <= 14) { return { id: 'yaklasan', ad: kalan + ' gün kaldı', sinif: 'uyari', kalan: kalan, vadeSinif: 'uyari', satirSinifi: 'satir-uyari' }; }
    return { id: 'guncel', ad: kalan + ' gün kaldı', sinif: 'iyi', kalan: kalan, vadeSinif: '', satirSinifi: '' };
  };

  /* Etiket adı/sınıfını kullanan eski çağrılar aynı nesnenin alanlarını okur. */
  ISG.dosyaDurumEtiketi = ISG.dosyaZamanDurumu;

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
    'kurumlar',
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

  /* Kayıt kimliği: aynı milisaniyede üretilen toplu kayıtlarda çakışma
     olmaması için zaman damgası + artan sayaç + rastgele eklenir. Çakışan
     kimlikler bulut eşitlemesinde kayıtların birbirini yutmasına yol açar.
     Tanım, veriTamamla() ilk kez çağrılmadan ÖNCE yapılır: göç sırasında da
     kimlik gerekir. */
  var idSayaci = 0;
  ISG.yeniId = function (onek) {
    idSayaci = (idSayaci + 1) % 46656;
    var onlar = idSayaci.toString(36);
    while (onlar.length < 3) { onlar = '0' + onlar; }
    return String(onek || '') + Date.now().toString(36) + onlar +
      Math.random().toString(36).slice(2, 6);
  };

  function yayinla() {
    depoDurumu.dinleyiciler.forEach(function (fn) {
      try { fn(depoDurumu.veri); } catch (hata) { /* dinleyici hatasi uygulamayi durdurmaz */ }
    });
  }
  /* ---------- İşyeri başına tek plan / ekip kaydı (v11) ----------
     `acilPlanlar` ve `riskEkipleri` listelerinde işyeri başına TEK kayıt
     bulunur. Ancak bu kayıtlar eski sürümlerde `id` üretilmeden yazılıyordu.
     Kimliksiz kayıt kayıt bazlı bulut eşitlemesine girmediği için:
       • birleşimde yerel kopya atılıp bulutun ESKİ kopyası kalıyordu
         (kullanıcı kaydediyor, ekran yenilenince eski tarih geri geliyordu),
       • iki cihaz aynı işyerine yazdığında kayıtlar yan yana birikiyor ve
         ISG.ilgiliKayit hangi kopyayı önce bulursa onu okuyordu
         (kayıt ekranı ile mevcut durum farklı tarih gösteriyordu).
     Bu göç:
       1) kopyaları işyeri kimliğine göre gruplar,
       2) en son güncellenen kaydı sahip seçer; TARİHLERDE eski kopya geri
          getirilmez (kullanıcı bir tarihi silmişse eski kopya onu diriltmez),
          ekip üyeleri ise mükerrer olmadan birleştirilir,
       3) sahip kayda KALICI kimlik verir. Kimlik işyeri kimliğinden türetilir
          ('ap-<isyeriId>'): iki cihaz da aynı kaydı üretirse birleşimde tek
          kayda iner, her birleşimde kimlik değişmez.
     Göç idempotenttir: ikinci çalıştırmada değişiklik üretmez. */
  var TEK_KAYIT_ONEKLERI = { acilPlanlar: 'ap', riskEkipleri: 're' };

  function kayitZamanMetni(kayit) {
    return String((kayit && (kayit.guncelleme || kayit.olusturma)) || '');
  }

  /* Üye karşılaştırması Türkçe küçük harfe duyarsızdır: "İşyeri hekimi" ile
     "işyeri hekimi" aynı üyedir, iki satıra bölünmez. */
  function uyeEsitMi(a, b) {
    if (!a || !b) { return false; }
    if (a.id && b.id) { return String(a.id) === String(b.id); }
    var ad = function (uye) { return String(uye.ad || '').toLocaleLowerCase('tr').trim(); };
    return String(a.rol || '') === String(b.rol || '') && ad(a) === ad(b);
  }

  function tekKayitYap(veri, anahtar, onek) {
    var liste = Array.isArray(veri[anahtar]) ? veri[anahtar] : [];
    var gruplar = {}, sira = [];
    liste.forEach(function (kayit, indeks) {
      if (!kayit || typeof kayit !== 'object') { return; }
      var isyeriId = String(kayit.isyeriId === null || kayit.isyeriId === undefined ? '' : kayit.isyeriId);
      /* İşyeri kimliği olmayan (sahipsiz) kayıtlar birleştirilmez: her biri
         kendi grubunda kalır, böylece farklı işyerlerinin artıkları tek kayda
         yapıştırılmaz. */
      var anahtarDeger = isyeriId || ('sahipsiz:' + indeks);
      if (!gruplar[anahtarDeger]) { gruplar[anahtarDeger] = []; sira.push(anahtarDeger); }
      gruplar[anahtarDeger].push(kayit);
    });

    var sonuc = [];
    sira.forEach(function (anahtarDeger) {
      var grup = gruplar[anahtarDeger];
      grup.sort(function (a, b) {
        var za = kayitZamanMetni(a), zb = kayitZamanMetni(b);
        if (za !== zb) { return za < zb ? 1 : -1; }
        return String(a.id || '') < String(b.id || '') ? -1 : 1;
      });
      var sahip = grup[0];
      var kopyalar = grup.slice(1);
      /* Tarihlerde son güncellenen kopya esastır: eski kopyadan tarih geri
         getirilmez (kullanıcı bir tarihi sildiyse dirilmez). Boş alan boş kalır,
         tarih uydurulmaz. Ekip listeleri ise birleşimdir: eski kopyada kalan
         üyeler kaybolmaz, aynı kişi iki kez yazılmaz. */
      var tarihAlanlari = anahtar === 'acilPlanlar'
        ? ['hazirlanma', 'sonYenileme', 'tatbikat']
        : ['sonDegerlendirme', 'enGecYenileme'];
      tarihAlanlari.forEach(function (alan) {
        sahip[alan] = String(sahip[alan] || '').trim();
      });

      if (anahtar === 'acilPlanlar') {
        var ekip = Array.isArray(sahip.ekip) ? sahip.ekip.slice() : [];
        kopyalar.forEach(function (kopya) {
          (Array.isArray(kopya.ekip) ? kopya.ekip : []).forEach(function (uye) {
            if (!uye || typeof uye !== 'object') { return; }
            if (!ekip.some(function (varOlan) { return uyeEsitMi(varOlan, uye); })) { ekip.push(uye); }
          });
        });
        sahip.ekip = ekip;
      } else {
        ['uyeler', 'uyeIdleri'].forEach(function (alan) {
          sahip[alan] = sahip[alan] && typeof sahip[alan] === 'object' ? sahip[alan] : {};
          kopyalar.forEach(function (kopya) {
            var kaynak = kopya[alan] && typeof kopya[alan] === 'object' ? kopya[alan] : {};
            Object.keys(kaynak).forEach(function (rol) {
              if (!sahip[alan][rol]) { sahip[alan][rol] = kaynak[rol]; }
            });
          });
        });
        sahip.uyeListe = sahip.uyeListe && typeof sahip.uyeListe === 'object' ? sahip.uyeListe : {};
        kopyalar.forEach(function (kopya) {
          var kaynak = kopya.uyeListe && typeof kopya.uyeListe === 'object' ? kopya.uyeListe : {};
          Object.keys(kaynak).forEach(function (rol) {
            var mevcut = Array.isArray(sahip.uyeListe[rol]) ? sahip.uyeListe[rol].slice() : [];
            (Array.isArray(kaynak[rol]) ? kaynak[rol] : []).forEach(function (uye) {
              if (!uye || typeof uye !== 'object') { return; }
              if (!mevcut.some(function (varOlan) { return uyeEsitMi(varOlan, uye); })) { mevcut.push(uye); }
            });
            if (mevcut.length) { sahip.uyeListe[rol] = mevcut; }
          });
        });
      }
      sonuc.push(sahip);
    });

    /* Kalıcı kimlik: işyeri kimliğinden türetilir ki iki cihaz aynı kaydı
       bağımsız oluştursa bile eşitlemede tek kayda insin. */
    var gorulen = {};
    sonuc.forEach(function (kayit) {
      var isyeriId = String(kayit.isyeriId === null || kayit.isyeriId === undefined ? '' : kayit.isyeriId);
      if (!kayit.id || gorulen[kayit.id]) {
        kayit.id = isyeriId ? (onek + '-' + isyeriId) : ISG.yeniId(onek);
        /* Türetilmiş kimlik de çakışırsa rastgele kimliğe düşülür. */
        if (gorulen[kayit.id]) { kayit.id = ISG.yeniId(onek); }
      }
      gorulen[kayit.id] = true;
    });
    veri[anahtar] = sonuc;
  }

  /* İşyeri başına tek kaydın kimliği: işyeri kimliğinden türetilir. İki cihaz
     aynı işyerine ilk kez yazdığında aynı kimliği üretir; bulut birleşimi
     kayıtları yan yana eklemek yerine tek kayıtta birleştirir. */
  function tekKayitId(onek, isyeriId) {
    var metin = String(isyeriId === null || isyeriId === undefined ? '' : isyeriId).trim();
    return metin ? (onek + '-' + metin) : ISG.yeniId(onek);
  }

  function tekKayitlariTamamla(veri) {
    Object.keys(TEK_KAYIT_ONEKLERI).forEach(function (anahtar) {
      tekKayitYap(veri, anahtar, TEK_KAYIT_ONEKLERI[anahtar]);
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

    /* v10: kurum varlığı. Önce yalnızca `ayarlar.kurum` serbest metni vardı;
       OSGB Müdürünün kurum kapsamı ve kurum bazlı raporlama için gerçek kayıt
       gerekir. Göç tek yönlüdür ve veri silmez: metin doluysa tek kurum kaydı
       üretilir, tek kurum varsa işyerleri ve kullanıcılar ona bağlanır.
       Üretim tarihi veriden türetilir; her açılışta yeni damga yazılırsa
       bulut eşitlemesi kaydı sürekli "değişmiş" sayardı. */
    var kurumAdi = String(veri.ayarlar.kurum || '').trim();
    if (!veri.kurumlar.length && kurumAdi) {
      veri.kurumlar.push({
        id: 'kr1', ad: kurumAdi,
        olusturma: veri.olusturma || new Date().toISOString()
      });
    }
    veri.kurumlar.forEach(function (kurum) {
      if (!kurum || typeof kurum !== 'object') { return; }
      kurum.id = String(kurum.id || '');
      kurum.ad = String(kurum.ad || '').trim();
    });
    veri.kurumlar = veri.kurumlar.filter(function (kurum) { return kurum && kurum.id; });
    var tekKurum = veri.kurumlar.length === 1 ? veri.kurumlar[0].id : '';
    if (tekKurum) {
      veri.isyerleri.forEach(function (isyeri) {
        if (isyeri && !isyeri.kurumId) { isyeri.kurumId = tekKurum; }
      });
    }

    /* Uzman sınıfı (A/B/C) tek biçime indirilir; tanınmayan değer boşaltılır.
       Boş sınıf "belirtilmedi" sayılır ve o hesap onay yetkilisi olarak
       sayılmaz — uydurma sınıf atanmaz. */
    (veri.kullanicilar || []).forEach(function (kullanici) {
      if (!kullanici || typeof kullanici !== 'object') { return; }
      kullanici.uzmanSinifi = ISG.uzmanSinifiKodu(kullanici.uzmanSinifi);
      kullanici.kurumId = String(kullanici.kurumId || (tekKurum || ''));
    });

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

    /* v8: çalışma planı durumları tek sözlüğe indirilir. v9: sözlük on duruma
       genişler (Yapılacak, Devam Ediyor, Belge/Yanıt Bekleniyor, Ertelendi,
       Tamamlanmadı, Planlanmadı, Tamamlandı, İptal Edildi, Kapsam Dışı +
       türetilmiş Gecikti). Eski kayıtlardaki "takvimde" ve "planlandi"
       değerleri "yapilacak" olur; türetilmiş "Gecikti" hiçbir zaman saklanmaz.
       Kayıtlar burada yerinde düzeltilir, sonraki kaydet() kalıcı hâle getirir. */
    (veri.planlar || []).forEach(function (plan) {
      var onceki = plan.durum;
      plan.durum = ISG.planDurumNormal(plan.durum);
      if (plan.durum === 'tamamlandi' && !plan.tamamlanmaTarihi && plan.takipTarihi) {
        plan.tamamlanmaTarihi = plan.takipTarihi;
      }
      if (onceki && onceki !== plan.durum) { plan.durumGoc = SURUM; }
    });

    /* v11: işyeri başına tek acil plan / risk ekibi kaydı ve kalıcı kimlik.
       Kimliksiz kayıt bulut birleşiminde korunmuyordu; ayrıntı: tekKayitYap. */
    tekKayitlariTamamla(veri);

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
     karşılaştırması yanıltıcı olurdu. `atlananlar` verilirse o alanlar metne
     girmez (bkz. ISG.depo.kayitEsit). */
  function kanonikMetin(deger, atlananlar) {
    if (deger === null || deger === undefined) { return 'null'; }
    if (typeof deger !== 'object') { return JSON.stringify(deger); }
    if (Array.isArray(deger)) {
      return '[' + deger.map(function (uye) { return kanonikMetin(uye, atlananlar); }).join(',') + ']';
    }
    var anahtarlar = Object.keys(deger).filter(function (anahtar) {
      return !atlananlar || !atlananlar[anahtar];
    }).sort();
    return '{' + anahtarlar.map(function (anahtar) {
      return JSON.stringify(anahtar) + ':' + kanonikMetin(deger[anahtar], atlananlar);
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

  /* Tek tuşla durum değiştirme. "Gecikti" türetilmiş bir durumdur; buradan
     verilmez, bu yüzden kaydedilmez. Yalnızca "Tamamlandı" tamamlanma tarihi
     alır; diğer durumlarda tarih temizlenir — faaliyet yeniden takvime
     alındığında gecikme sonraki güne doğru hesaplanır ve panelde iş tekrar
     görünür. */
  ISG.depo.planDurumDegistir = function (id, durum) {
    var yeni = ISG.planDurumNormal(durum);
    var veri = depo.al();
    veri.planlar.forEach(function (plan) {
      if (plan.id !== id) { return; }
      plan.durum = yeni;
      plan.tamamlanmaTarihi = yeni === 'tamamlandi' ? new Date().toISOString().slice(0, 10) : null;
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
      kayit.durum = ISG.planDurumNormal(kayit.durum);
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
    if (bulunan) { return bulunan.ad; }
    /* Ekipte tek kişi vardı: eski sürümlerde görev adı farklı yazılmış olabilir
       ('Söndürme ekibi' → 'Yangın söndürme ekibi'). Eski ad tek biçime indirilir. */
    var eski = (ISG.ACIL_EQIP_TANIMLARI || []).filter(function (tanim) {
      var adlar = (tanim.rolAdlari || []).concat(tanim.eskiRolAdlari || []);
      return adlar.some(function (ad) { return ad === metin; });
    })[0];
    return eski ? eski.rolAdlari[0] : metin;
  }
  ISG.acilRolAdi = acilRolAdi;

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
      kayit = { id: tekKayitId('re', isyeriId), isyeriId: isyeriId, sonDegerlendirme: '', enGecYenileme: '', uyeler: {}, uyeListe: {} };
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
    var kayit = ISG.acilPlanKaydi(veri, isyeriId);
    if (!kayit) {
      /* Kimlik işyeri kimliğinden türetilir: kayıt bulut eşitlemesine girer,
         böylece yerel yazı bulutun eski kopyasıyla değiştirilmez. */
      kayit = { id: tekKayitId('ap', isyeriId), isyeriId: isyeriId, hazirlanma: '', sonYenileme: '', tatbikat: '', ekip: [] };
      veri.acilPlanlar.push(kayit);
    }
    /* Üç tarih bağımsız yazılır; boş alan boş kalır (otomatik tarih uydurulmaz). */
    kayit.hazirlanma = String(alanlar.hazirlanma || '').trim();
    kayit.sonYenileme = String(alanlar.sonYenileme || '').trim();
    kayit.tatbikat = String(alanlar.tatbikat || '').trim();
    depo.kaydet();
    return kayit;
  };

  /* Risk ekibine üye ekler. Aynı kişi aynı görevde ikinci kez kaydedilmez;
     farklı kişiler aynı görevde yan yana durabilir (çoklu personel). */
  ISG.depo.riskEkipUyeEkle = function (isyeriId, rol, ad, personelId, ek) {
    var veri = depo.al();
    var kayit = ISG.ilgiliKayit(veri, 'riskEkipleri', isyeriId);
    if (!kayit) {
      kayit = { id: tekKayitId('re', isyeriId), isyeriId: isyeriId, sonDegerlendirme: '', enGecYenileme: '', uyeler: {}, uyeIdleri: {}, uyeListe: {} };
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
    var kayit = ISG.acilPlanKaydi(veri, isyeriId);
    if (!kayit) {
      kayit = { id: tekKayitId('ap', isyeriId), isyeriId: isyeriId, hazirlanma: '', sonYenileme: '', tatbikat: '', ekip: [] };
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
      if (acilRolAdi(uye.rol) !== rolAdi) { return false; }
      /* Personel kimliği varsa mükerrer denetimi kimlikle yapılır: ad düzeltmesi
         aynı kişiyi ikinci satıra taşımaz. Kimlik yoksa ad ölçüt alınır. */
      var uyePid = String(uye.personelId || '');
      if (personelId && uyePid) { return String(uyePid) === String(personelId); }
      return uyeAnahtari(uye) === anahtar;
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
    var kayit = ISG.acilPlanKaydi(veri, isyeriId);
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

  /* Onay bekleyen talep sayısı; `isyeriId` verilirse yalnızca o işyeri sayılır.
     Uygulama kabuğu bu sayıyı rozette gösterir. */
  ISG.depo.talepBekleyenSayisi = function (isyeriId) {
    return (depo.al().talepler || []).filter(function (talep) {
      if (talep.durum !== 'bekliyor') { return false; }
      return !isyeriId || talep.isyeriId === isyeriId;
    }).length;
  };

  /* İki kaydın ANLAM olarak eşit olup olmadığını verir; onay kuyruğunun sürüm
     denetimi bunu kullanır. Anahtar sırası (sunucu jsonb anahtarları yeniden
     sıralıyor) ve kaydet()'in her yazımda tazelediği eşitleme damgası değişimi
     bildirmez. Düz JSON.stringify karşılaştırması, hiçbir alanına dokunulmamış
     kaydı "değişmiş" sayıp yöneticinin Onayla düğmesini kilitliyordu. */
  var SURUM_ATLANAN = { guncelleme: 1 };
  ISG.depo.kayitEsit = function (birinci, ikinci) {
    return kanonikMetin(birinci, SURUM_ATLANAN) === kanonikMetin(ikinci, SURUM_ATLANAN);
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
    /* Kurum adı ayarlardan da yazılabiliyor (eski ekran). Kurum kaydı tek
       kaynak olduğundan metin ile kayıt birbirinden kopmamalı: ad değişince
       tek kurum kaydı da güncellenir, hiç yoksa oluşturulur. */
    if (Object.prototype.hasOwnProperty.call(alanlar || {}, 'kurum')) {
      var ad = String(veri.ayarlar.kurum || '').trim();
      veri.kurumlar = Array.isArray(veri.kurumlar) ? veri.kurumlar : [];
      if (!veri.kurumlar.length && ad) {
        veri.kurumlar.push({ id: 'kr1', ad: ad, olusturma: new Date().toISOString() });
      } else if (veri.kurumlar.length) {
        veri.kurumlar[0].ad = ad || veri.kurumlar[0].ad;
      }
    }
    depo.kaydet();
    return veri.ayarlar;
  };

  /* ---------- Kurum kayıtları ----------
     OSGB Müdürünün kapsamı kurum üzerinden belirlenir. Kurum silinirken
     işyerleri ve kullanıcılar SİLİNMEZ; yalnızca kurum bağı boşaltılır, aksi
     hâlde tek bir kurum kaydını silmek bütün İSG kayıtlarını götürürdü. */
  ISG.depo.kurumKaydet = function (kayit) {
    var veri = depo.al();
    var girdi = kayit || {};
    girdi.ad = String(girdi.ad || '').trim();
    if (!girdi.ad) { throw new Error('Kurum adı zorunlu.'); }
    var sonuc = kaydetListede(veri.kurumlar, girdi, 'kr');
    depo.kaydet();
    return sonuc;
  };

  ISG.depo.kurumSil = function (id) {
    var veri = depo.al();
    if (!id) { return null; }
    var silinen = (veri.kurumlar || []).filter(function (kurum) { return kurum.id === id; })[0];
    if (!silinen) { return null; }
    veri.kurumlar = silListeden(veri.kurumlar, id);
    (veri.isyerleri || []).forEach(function (isyeri) {
      if (isyeri && isyeri.kurumId === id) { isyeri.kurumId = ''; }
    });
    (veri.kullanicilar || []).forEach(function (kullanici) {
      if (kullanici && kullanici.kurumId === id) { kullanici.kurumId = ''; }
    });
    /* Kurum listesi boşaldıysa serbest metin de temizlenir; aksi hâlde göç
       aynı kurumu yeniden üretirdi. */
    if (!veri.kurumlar.length && veri.ayarlar) { veri.ayarlar.kurum = ''; }
    depo.kaydet();
    return silinen;
  };

  /* İşyerinin kurum kimliği: kayıt alanı yoksa tek kurum varsayılır. */
  ISG.depo.isyeriKurumId = function (isyeriId) {
    var veri = depo.al();
    var isyeri = (veri.isyerleri || []).filter(function (kayit) { return kayit.id === isyeriId; })[0];
    if (isyeri && isyeri.kurumId) { return isyeri.kurumId; }
    return (veri.kurumlar || []).length === 1 ? veri.kurumlar[0].id : '';
  };
})(window);



