/* İSG Takip Merkezi — örnek tohum verisi ve kontrol maddesi kataloğu
   Tüm tarihler bugüne göre üretilir; örnek veri her açıldığında güncel görünür. */
(function (global) {
  'use strict';

  var ISG = global.ISG = global.ISG || {};

  function iso(tarih) {
    return tarih.getFullYear() + '-' +
      String(tarih.getMonth() + 1).padStart(2, '0') + '-' +
      String(tarih.getDate()).padStart(2, '0');
  }

  function gun(gunSayisi) {
    var d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + gunSayisi);
    return iso(d);
  }

  function yilEkle(isoTarih, yil) {
    var parca = String(isoTarih).split('-');
    var d = new Date(Number(parca[0]) + yil, Number(parca[1]) - 1, Number(parca[2]), 12, 0, 0, 0);
    return iso(d);
  }

  ISG.yilEkle = yilEkle;

  /* ---------- Kontrol maddesi kataloğu ---------- */

  var BOLUMLER = [
    { ad: 'YÖNETSEL VE ORGANİZASYONEL BELGELER', maddeler: [
      'İSG-KATİP onaylı iş güvenliği uzmanı görevlendirme sözleşmesi',
      'İSG-KATİP onaylı işyeri hekimi görevlendirme sözleşmesi',
      'İşyeri hekimi ve İSG uzmanı çalışma saatleri bildirimi',
      'İSG kurulu kurulmasına ilişkin karar ve üye listesi',
      'İSG kurulu aylık toplantı tutanakları',
      'Yıllık İSG çalışma planı ve işveren onayı',
      'İşveren taahhütnamesi ve İSG politikası',
      'Acil durum koordinasyon ve iletişim listesi',
      'Destek elemanı görevlendirme yazıları',
      'İşyeri bildirgesi ve SGK sicil evrakları'
    ] },
    { ad: 'ÇALIŞANLARA İLİŞKİN BELGELER', maddeler: [
      'Personel özlük dosyaları ve işe giriş bildirimleri',
      'İşe giriş sağlık raporları',
      'Periyodik muayene ve tetkik sonuçları',
      'İSG eğitim kayıtları ve sertifikalar',
      'İSG eğitimi katılım tutanakları',
      'İlk yardımcı sertifikaları',
      'Yangın eğitimi ve tatbikat katılım kayıtları',
      'Mesleki yeterlilik belgeleri',
      'KKD zimmet ve teslim tutanakları',
      'Yüksekte çalışma yetki belgeleri'
    ] },
    { ad: 'RİSK DEĞERLENDİRMESİ', maddeler: [
      'Risk değerlendirmesi raporu ve ekip listesi',
      'Risk değerlendirmesi yenileme takvimi',
      'Risk azaltma planı ve aksiyon takibi',
      'Ramak kala ve kaza bildirim formları',
      'Kök neden analizleri ve DÖF kayıtları',
      'İş hijyeni ölçüm raporları (gürültü, toz, aydınlatma)',
      'Kimyasal maruziyet değerlendirmesi',
      'Ergonomik risk değerlendirmesi',
      'Patlamadan korunma dokümanı',
      'İş ekipmanları risk değerlendirmesi'
    ] },
    { ad: 'ACİL DURUM', maddeler: [
      'Acil durum planı ve ek listeleri',
      'Tahliye planları ve kat krokileri',
      'Acil durum ekipleri görev dağılımı',
      'Yangın söndürme cihazları kontrol kayıtları',
      'Yangın algılama ve alarm test kayıtları',
      'Acil çıkış ve aydınlatma kontrolleri',
      'Tatbikat raporu ve değerlendirmesi',
      'Deprem, sel ve salgın hazırlık dokümanları',
      'İlk yardım malzeme kontrol listesi',
      'Acil durum iletişim listesi güncelliği'
    ] },
    { ad: 'İŞ EKİPMANLARI VE PERİYODİK KONTROL', maddeler: [
      'Periyodik kontrol firması yetki belgesi',
      'Kaldırma ve iletme makinesi kontrol raporları',
      'Basınçlı kap kontrol raporları',
      'Elektrik tesisatı periyodik kontrol raporu',
      'Topraklama ve paratoner ölçüm raporları',
      'Yangın tesisatı kontrol raporları',
      'Forklift ve transpalet kontrol kayıtları',
      'İş ekipmanları günlük kontrol formları',
      'Kalibrasyon sertifikaları',
      'Bakım-onarım kayıtları ve iş emirleri'
    ] }
  ];

  var BOLUMLER_2 = [
    { ad: 'KKD VE SAĞLIK GÖZETİMİ', maddeler: [
      'KKD ihtiyaç analizi ve stok takibi',
      'Solunum koruyucu uygunluk testi',
      'Odyometri test sonuçları',
      'Solunum fonksiyon testi sonuçları',
      'Göz muayenesi kayıtları',
      'Biyolojik izleme sonuçları',
      'Aşı kayıtları ve bağışıklama takibi',
      'Gebe ve emziren çalışan değerlendirmesi',
      'Genç ve kadın çalışan risk değerlendirmesi',
      'Engelli çalışan işyeri düzenlemeleri'
    ] },
    { ad: 'KİMYASAL VE TEHLİKELİ MADDELER', maddeler: [
      'Güvenlik bilgi formları (GBF)',
      'Kimyasal envanter ve stok kayıtları',
      'Etiketleme ve uyarı işaretleri',
      'Depolama uygunluğu ve ayrım kuralları',
      'Dökülme ve acil müdahale setleri',
      'Atık yönetimi ve bertaraf kayıtları',
      'Asbest, kurşun ve radyasyon özel dosyaları',
      'Patlayıcı ortam sınıflandırması (ATEX)',
      'Kaynak gaz tüpü güvenliği',
      'Tehlikeli madde taşıma evrakları'
    ] },
    { ad: 'SAHA VE İŞARETLEME', maddeler: [
      'Güvenlik işaretleri ve etiketler',
      'Zemin işaretlemeleri ve yaya yolları',
      'Acil çıkış yollarının açıklığı',
      'Depolama raf sistemleri kontrolü',
      'Aydınlatma seviyeleri ölçümü',
      'Havalandırma ve iklimlendirme kontrolü',
      'Temizlik ve düzen (5S) denetimleri',
      'Çalışma alanı düzenleme fotoğrafları',
      'Trafik ve araç-yaya ayrımı',
      'Yüksekte çalışma alanı önlemleri'
    ] },
    { ad: 'YANGIN GÜVENLİĞİ', maddeler: [
      'Yangın yükü ve bölümleme hesabı',
      'Söndürme cihazı yerleşim planı',
      'Yangın dolabı ve hortum kontrolleri',
      'Sprinkler ve duman tahliye kontrolü',
      'Yanıcı madde depolama kuralları',
      'Sıcak çalışma izin formları',
      'Yangın tatbikatı senaryoları',
      'İtfaiye erişimi ve yangın yolu',
      'Elektrik kaynaklı yangın önlemleri',
      'Yangın eğitimlerinin güncelliği'
    ] },
    { ad: 'EĞİTİM VE FARKINDALIK', maddeler: [
      'Yıllık eğitim planı uygulama takibi',
      'Temel İSG eğitimi yenilemeleri',
      'İşbaşı ve uyum eğitimleri',
      'Tehlike iletişimi (etiket okuma) eğitimi',
      'İlk yardım tazeleme eğitimi',
      'Yangın ve tahliye tatbikatı eğitimi',
      'Yüksekte çalışma eğitimi',
      'KKD kullanım eğitimi',
      'Ergonomi ve ofis güvenliği eğitimi',
      'Operatör ve sürücü güvenliği eğitimi'
    ] },
    { ad: 'KAYIT VE RAPORLAMA', maddeler: [
      'Aylık İSG faaliyet raporları',
      'Yıllık İSG değerlendirme raporu',
      'İş kazalarının bildirimi (3 iş günü)',
      'Ramak kala istatistikleri',
      'DÖF takip listesi',
      'Denetim ve müfettişlik yazışmaları',
      'Taşeron ve alt işveren İSG dosyaları',
      'İSG kurul karar takip listesi',
      'Belge arşivleme ve saklama süreleri',
      'Kişisel verilerin korunması uyumu'
    ] }
  ];

  // Çok tehlikeli işyerlerine eklenen maddeler
  var COK_TEHLIKELI_EK = [
    'İş izin sistemi (sıcak çalışma, kapalı alan, yüksekte çalışma)',
    'Kapalı alan gaz ölçüm kayıtları',
    'Yüksekte çalışma izin formları',
    'LOTO enerji kilitleme prosedürü',
    'Kazı ve şev güvenliği önlemleri',
    'İskele kurulum ve kontrol kayıtları',
    'Elektrik güvenliği yetki belgeleri',
    'Ark koruyucu KKD kayıtları',
    'Kaldırma operasyon planları',
    'Acil kurtarma ekipmanı kontrolü',
    'Basınçlı kapların hidrostatik test kayıtları',
    'Kimyasal proses güvenliği (HAZOP)',
    'Yangın söndürme sistemi bakım sözleşmesi',
    'Yüksekte çalışma ekipmanı periyodik kontrolü',
    'Çalışanların acil durum tatbikatı performansı'
  ];

  // Büyük işyerlerinde (100+ çalışan) kataloğa eklenen maddeler
  var BUYUK_EK = [
    'İşyeri sağlık birimi kayıtları',
    'Vardiya devir teslim formları',
    'Servis araçları İSG kontrolleri',
    'Yemekhane hijyen denetim raporları',
    'Otopark ve trafik düzeni planı',
    'Ziyaretçi ve taşeron giriş-çıkış kayıtları',
    'Kamera ve güvenlik sistemi kontrolü',
    'İçme suyu analiz raporları',
    'Çalışan temsilcisi seçim tutanağı',
    'İşyeri hekimi poliklinik kayıtları',
    'Sağlık kabini ilaç ve malzeme envanteri',
    'İSG kurul eğitim kayıtları',
    'Kurumsal İSG hedefleri ve performans göstergeleri',
    'Taşeron koordinasyon toplantı tutanakları',
    'Yangın ekipleri nöbet listesi',
    'Acil durum senaryo güncellemeleri'
  ];

  /* ---------- Yardımcılar ---------- */

  function tohum(metin) {
    var h = 2166136261;
    for (var i = 0; i < metin.length; i += 1) {
      h ^= metin.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function rastgele(tohumDeger) {
    var x = (tohumDeger || 1) % 4294967296;
    return function () {
      x = (x * 1664525 + 1013904223) % 4294967296;
      return x / 4294967296;
    };
  }

  var SORUMLULAR = ['İSG uzmanı', 'İşyeri hekimi', 'İşveren vekili', 'Bakım şefi', 'İdari işler', 'Depo sorumlusu', 'Çalışan temsilcisi'];

  function katalogMaddeleri(isyeri) {
    var tum = BOLUMLER.concat(BOLUMLER_2);
    var liste = [];
    tum.forEach(function (bolum) {
      bolum.maddeler.forEach(function (madde) { liste.push({ bolum: bolum.ad, madde: madde }); });
    });
    var ekAdet = (isyeri.tehlikeSinifi === 'cokTehlikeli' ? 15 : 0) + Math.floor((Number(isyeri.calisanSayisi) || 0) / 100) * 5;
    var ekHavuz = (isyeri.tehlikeSinifi === 'cokTehlikeli' ? COK_TEHLIKELI_EK : []).concat(BUYUK_EK);
    for (var i = 0; i < ekAdet && i < ekHavuz.length; i += 1) {
      liste.push({ bolum: 'DİĞER KONTROL MADDELERİ', madde: ekHavuz[i] });
    }
    return liste;
  }

  function katalogUret(isyerleri) {
    var kayitlar = [];
    isyerleri.forEach(function (isyeri) {
      katalogMaddeleri(isyeri).forEach(function (oge, sira) {
        var no = sira + 1;
        var r = rastgele(tohum(isyeri.id + ':' + no));
        var sans = r();
        var durum = 'incelenmedi';
        if (sans < 0.04) { durum = 'var'; }
        else if (sans < 0.17) { durum = 'eksik'; }
        else if (sans < 0.175) { durum = 'yok'; }

        var t = rastgele(tohum(isyeri.id + '-tarih-' + no));
        var yenileme = '';
        var kontrolTarihi = '';
        if (durum === 'var') {
          var gecmis = t() < 0.36;
          var fark = gecmis ? -(5 + Math.floor(t() * 420)) : (3 + Math.floor(t() * 330));
          yenileme = gun(fark);
          kontrolTarihi = gun(fark - 400 - Math.floor(t() * 200));
        } else if (durum === 'eksik' && t() < 0.34) {
          kontrolTarihi = gun(-(1 + Math.floor(t() * 75)));
        } else if (durum === 'incelenmedi' && t() < 0.06) {
          kontrolTarihi = gun(-(3 + Math.floor(t() * 120)));
        }

        kayitlar.push({
          id: 'd_' + isyeri.id + '_' + no,
          isyeriId: isyeri.id,
          no: no,
          bolum: oge.bolum,
          madde: oge.madde,
          aciklama: '',
          durum: durum,
          sorumlu: durum === 'incelenmedi' ? '' : SORUMLULAR[Math.floor(t() * SORUMLULAR.length)],
          yenileme: yenileme,
          kontrolTarihi: kontrolTarihi,
          kaynak: durum === 'var' ? 'Dosyada' : (durum === 'eksik' ? 'Eksik' : '')
        });
      });
    });
    return kayitlar;
  }

  ISG.katalogMaddeleri = katalogMaddeleri;
  ISG.katalogUret = katalogUret;

  /* ---------- Tohum veri ---------- */

  /* ---------- Başlangıç kullanıcıları ----------
     Kurulumun ilk açılışında tanımlı hesaplar. Yeni kullanıcılar yönetici
     tarafından oluşturulan davet kodlarıyla katılır; şifreler "Şifremi
     unuttum" akışıyla e-posta kodu doğrulanarak yenilenebilir. */
  ISG.ORNEK_KULLANICILAR = function () {
    return [
      {
        id: 'u1', adSoyad: 'Mehmet Kurt', eposta: 'mehmetkurt0948@gmail.com', sifre: '1234',
        rol: 'yonetici', gorev: 'İSG yöneticisi', isyerleri: [], aktif: true, sonGiris: ''
      },
      {
        id: 'u2', adSoyad: 'Buse Şenol', eposta: 'buse.senol@ornek.com', sifre: '1234',
        rol: 'yetkili', gorev: 'B sınıfı İSG uzmanı', isyerleri: ['iy1', 'iy2'], aktif: true, sonGiris: ''
      },
      {
        id: 'u3', adSoyad: 'Selin Aydın', eposta: 'selin.aydin@ornek.com', sifre: '1234',
        rol: 'goruntuleyici', gorev: 'İdari işler sorumlusu', isyerleri: ['iy1'], aktif: true, sonGiris: ''
      }
    ];
  };

  ISG.ORNEK_VERI = function () {
    var isyerleri = [
      { id: 'iy1', ad: 'Aypaş OSGB', tehlikeSinifi: 'tehlikeli', calisanSayisi: 17, sgkSicil: '2-1234-01-01-1234567-01', ana: true, yetkili: 'Mehmet Kurt', adres: 'Aydın / Efeler', sektor: 'İSG hizmetleri' },
      { id: 'iy2', ad: 'AYULAŞ AYDIN ULAŞIM HİZMETLERİ SAN. TİC. A.Ş', tehlikeSinifi: 'az', calisanSayisi: 219, sgkSicil: '2-1234-02-02-2234567-02', ana: false, yetkili: 'Selin Aydın', adres: 'Aydın / Efeler', sektor: 'Ulaşım' },
      { id: 'iy3', ad: 'DİĞER DAİRE BAŞKANLIKLARI', tehlikeSinifi: 'az', calisanSayisi: 315, sgkSicil: '2-1234-03-03-3234567-03', ana: false, yetkili: 'Merve Aydın', adres: 'Aydın / Merkez', sektor: 'Kamu hizmetleri' },
      { id: 'iy4', ad: 'DESTEK HİZMETLERİ DAİRE BAŞKANLIĞI', tehlikeSinifi: 'tehlikeli', calisanSayisi: 354, sgkSicil: '2-1234-04-04-4234567-04', ana: false, yetkili: 'Fatma Öz', adres: 'Aydın / Merkez', sektor: 'Destek hizmetleri' },
      { id: 'iy5', ad: 'ASKİ-1', tehlikeSinifi: 'tehlikeli', calisanSayisi: 120, sgkSicil: '2-1234-05-05-5234567-05', ana: false, yetkili: 'Emre Koç', adres: 'Aydın / Kuşadası', sektor: 'Su ve kanalizasyon' },
      { id: 'iy6', ad: 'EGE ET VE MAMULLERİ YEM VE YAĞ SAN. TİC. A.Ş', tehlikeSinifi: 'tehlikeli', calisanSayisi: 122, sgkSicil: '2-1234-06-06-6234567-06', ana: false, yetkili: 'Hakan Çelik', adres: 'Aydın / Nazilli', sektor: 'Gıda üretimi' }
    ];

    var personel = [
      { id: 'p01', isyeriId: 'iy1', sicil: '1', adSoyad: 'Barış Taşdemir', meslek: 'A sınıfı İş Güvenliği Uzmanı', departman: 'İSG', grupKodu: '', sube: 'OSGB', iseBaslama: '2018-02-05', cinsiyet: 'Erkek', telefon: '', tc: '', durum: 'aktif' },
      { id: 'p02', isyeriId: 'iy1', sicil: '2', adSoyad: 'Buse Şenol', meslek: 'B sınıfı İş Güvenliği Uzmanı', departman: 'İSG', grupKodu: '', sube: 'OSGB', iseBaslama: '2021-09-13', cinsiyet: 'Kadın', telefon: '', tc: '', durum: 'aktif' },
      { id: 'p03', isyeriId: 'iy1', sicil: '3', adSoyad: 'Mehmet Kurt', meslek: 'İşyeri hekimi', departman: 'İSG', grupKodu: '', sube: 'OSGB', iseBaslama: '2017-11-20', cinsiyet: 'Erkek', telefon: '', tc: '', durum: 'aktif' },
      { id: 'p04', isyeriId: 'iy1', sicil: '4', adSoyad: 'Selin Aydın', meslek: 'İdari işler sorumlusu', departman: 'İdari İşler', grupKodu: '', sube: 'Merkez', iseBaslama: '2019-04-01', cinsiyet: 'Kadın', telefon: '', tc: '', durum: 'aktif' },
      { id: 'p05', isyeriId: 'iy1', sicil: '5', adSoyad: 'Fatma Öz', meslek: 'Depo sorumlusu', departman: 'Depo ve Lojistik', grupKodu: '', sube: 'Depo A', iseBaslama: '2019-07-22', cinsiyet: 'Kadın', telefon: '', tc: '', durum: 'aktif' },
      { id: 'p06', isyeriId: 'iy1', sicil: '6', adSoyad: 'Emre Koç', meslek: 'Elektrik teknisyeni', departman: 'Bakım', grupKodu: '', sube: 'Merkez', iseBaslama: '2020-10-05', cinsiyet: 'Erkek', telefon: '', tc: '', durum: 'aktif' },
      { id: 'p07', isyeriId: 'iy1', sicil: '7', adSoyad: 'Hakan Çelik', meslek: 'Bakım teknisyeni', departman: 'Bakım', grupKodu: '', sube: 'Merkez', iseBaslama: '2016-04-25', cinsiyet: 'Erkek', telefon: '', tc: '', durum: 'aktif' },
      { id: 'p08', isyeriId: 'iy1', sicil: '8', adSoyad: 'Serkan Yılmaz', meslek: 'Pres operatörü', departman: 'Üretim', grupKodu: '', sube: 'Üretim 2', iseBaslama: '2015-08-03', cinsiyet: 'Erkek', telefon: '', tc: '', durum: 'aktif' },
      { id: 'p09', isyeriId: 'iy1', sicil: '9', adSoyad: 'Elif Kaya', meslek: 'Kaynakçı (gazaltı)', departman: 'Üretim', grupKodu: '', sube: 'Kaynak atölyesi', iseBaslama: '2021-06-01', cinsiyet: 'Kadın', telefon: '', tc: '', durum: 'aktif' },
      { id: 'p10', isyeriId: 'iy1', sicil: '10', adSoyad: 'Zeynep Arslan', meslek: 'Laborant', departman: 'Kalite', grupKodu: '', sube: 'Laboratuvar', iseBaslama: '2020-02-17', cinsiyet: 'Kadın', telefon: '', tc: '', durum: 'aktif' },
      { id: 'p11', isyeriId: 'iy1', sicil: '11', adSoyad: 'Burak Şahin', meslek: 'Forklift operatörü', departman: 'Depo ve Lojistik', grupKodu: '', sube: 'Depo A', iseBaslama: '2018-11-19', cinsiyet: 'Erkek', telefon: '', tc: '', durum: 'aktif' },
      { id: 'p12', isyeriId: 'iy1', sicil: '12', adSoyad: 'Merve Aydın', meslek: 'İnsan kaynakları uzmanı', departman: 'İnsan Kaynakları', grupKodu: '', sube: 'Merkez', iseBaslama: '2022-01-10', cinsiyet: 'Kadın', telefon: '', tc: '', durum: 'aktif' },
      { id: 'p13', isyeriId: 'iy1', sicil: '13', adSoyad: 'Ali Uzun', meslek: 'Stajyer', departman: 'Üretim', grupKodu: '', sube: 'Üretim 2', iseBaslama: '2026-07-01', cinsiyet: 'Erkek', telefon: '', tc: '', durum: 'aktif' }
    ];

    /* ---------- Her işyeri için rastgele ek personel ----------
       Tohum sabit olduğundan örnek veri her açılışta aynı kişileri üretir;
       böylece ekranlar dolu görünür, testler de sayıları kesin doğrular. */
    var EK_KADIN = ['Ayşe', 'Elif', 'Zeynep', 'Merve', 'Selin', 'Buse', 'Fatma', 'Deniz', 'İrem', 'Ceren', 'Sude', 'Nazlı'];
    var EK_ERKEK = ['Ahmet', 'Mehmet', 'Mustafa', 'Ali', 'Hasan', 'Emre', 'Burak', 'Serkan', 'Kaan', 'Onur', 'Volkan', 'Cem'];
    var EK_SOYAD = ['Yıldız', 'Demir', 'Kaya', 'Şahin', 'Çetin', 'Aksoy', 'Polat', 'Erdem', 'Kılıç', 'Türk', 'Aydın', 'Özdemir', 'Güneş', 'Yalçın', 'Tekin', 'Bozkurt'];
    var EK_MESLEKLER = [
      { ad: 'Üretim operatörü', departman: 'Üretim', sube: 'Üretim hattı' },
      { ad: 'Bakım teknisyeni', departman: 'Bakım', sube: 'Bakım atölyesi' },
      { ad: 'Depo görevlisi', departman: 'Depo ve Lojistik', sube: 'Depo' },
      { ad: 'Şoför', departman: 'Lojistik', sube: 'Saha' },
      { ad: 'Temizlik görevlisi', departman: 'Destek Hizmetleri', sube: 'Merkez' },
      { ad: 'İdari personel', departman: 'İdari İşler', sube: 'Merkez' },
      { ad: 'Laborant', departman: 'Kalite', sube: 'Laboratuvar' },
      { ad: 'Güvenlik görevlisi', departman: 'Güvenlik', sube: 'Giriş' },
      { ad: 'Elektrikçi', departman: 'Bakım', sube: 'Merkez' },
      { ad: 'Kalite kontrol uzmanı', departman: 'Kalite', sube: 'Üretim hattı' }
    ];
    var EK_SAYI = { iy1: 3, iy2: 4, iy3: 5, iy4: 3, iy5: 4, iy6: 5 };
    var EK_TEMEL_YIL = { az: 3, tehlikeli: 2, cokTehlikeli: 1 };

    function ekRastgele(tohum) {
      var deger = tohum;
      return function () {
        deger = (deger * 1103515245 + 12345) % 2147483648;
        return deger / 2147483648;
      };
    }

    var ekRnd = ekRastgele(20261027);
    function ekSec(liste) { return liste[Math.floor(ekRnd() * liste.length)]; }

    var ekPersonel = [];
    var ekEgitimler = [];
    var ekKisiNo = 0;
    var ekEgitimNo = 22;

    isyerleri.forEach(function (isyeri) {
      var adet = EK_SAYI[isyeri.id] || 3;
      for (var i = 0; i < adet; i += 1) {
        ekKisiNo += 1;
        var kadin = ekRnd() >= 0.5;
        var meslek = ekSec(EK_MESLEKLER);
        var kisi = {
          id: 'pr' + ('0' + ekKisiNo).slice(-2),
          isyeriId: isyeri.id,
          sicil: String(100 + ekKisiNo),
          adSoyad: (kadin ? ekSec(EK_KADIN) : ekSec(EK_ERKEK)) + ' ' + ekSec(EK_SOYAD),
          meslek: meslek.ad,
          departman: meslek.departman,
          grupKodu: '',
          sube: meslek.sube,
          iseBaslama: gun(-(240 + Math.floor(ekRnd() * 2400))),
          cinsiyet: kadin ? 'Kadın' : 'Erkek',
          telefon: '',
          tc: '',
          durum: 'aktif'
        };
        ekPersonel.push(kisi);

        var temelTarih = gun(-(200 + Math.floor(ekRnd() * 120)));
        ekEgitimler.push({
          id: 'e' + ekEgitimNo,
          personelId: kisi.id,
          isyeriId: isyeri.id,
          tur: 'temel',
          tarih: temelTarih,
          sureSaat: 12,
          egitmen: 'B. Şenol',
          gecerlilik: yilEkle(temelTarih, EK_TEMEL_YIL[isyeri.tehlikeSinifi] || 2)
        });
        ekEgitimNo += 1;

        /* Her işyerinde en az bir güncel ilk yardımcı bulunsun. */
        if (i === 0) {
          var ilkTarih = gun(-(200 + Math.floor(ekRnd() * 200)));
          ekEgitimler.push({
            id: 'e' + ekEgitimNo,
            personelId: kisi.id,
            isyeriId: isyeri.id,
            tur: 'ilkYardim',
            tarih: ilkTarih,
            sureSaat: 16,
            egitmen: 'M. Kurt',
            gecerlilik: yilEkle(ilkTarih, 3)
          });
          ekEgitimNo += 1;
        }
      }
    });

    personel = personel.concat(ekPersonel);

    var YIL = { temel: 2, ilkYardim: 3, yangin: 1, yuksekte: 2, kkd: 2, acilDurum: 1, kurul: 2 };

    function egitim(id, personelId, tur, geriGun, sureSaat, egitmen) {
      var tarih = gun(-geriGun);
      return {
        id: id, personelId: personelId, isyeriId: 'iy1', tur: tur,
        tarih: tarih, sureSaat: sureSaat, egitmen: egitmen,
        gecerlilik: yilEkle(tarih, YIL[tur] || 2)
      };
    }

    var egitimler = [
      egitim('e01', 'p01', 'temel', 500, 12, 'B. Şenol'),
      egitim('e02', 'p01', 'ilkYardim', 1000, 16, 'M. Kurt'),
      egitim('e03', 'p02', 'temel', 700, 12, 'B. Şenol'),
      egitim('e04', 'p02', 'yangin', 200, 4, 'İtfaiye eğitmeni'),
      egitim('e05', 'p03', 'temel', 300, 12, 'B. Şenol'),
      egitim('e06', 'p03', 'kurul', 180, 2, 'B. Şenol'),
      egitim('e07', 'p04', 'temel', 900, 12, 'B. Şenol'),
      egitim('e08', 'p05', 'temel', 450, 12, 'B. Şenol'),
      egitim('e09', 'p05', 'kkd', 400, 2, 'B. Şenol'),
      egitim('e10', 'p06', 'temel', 600, 12, 'B. Şenol'),
      egitim('e11', 'p06', 'yuksekte', 730, 8, 'Dış eğitmen'),
      egitim('e12', 'p07', 'temel', 820, 12, 'B. Şenol'),
      egitim('e13', 'p08', 'temel', 500, 12, 'B. Şenol'),
      egitim('e14', 'p08', 'yangin', 365, 4, 'İtfaiye eğitmeni'),
      egitim('e15', 'p09', 'temel', 350, 12, 'B. Şenol'),
      egitim('e16', 'p09', 'yuksekte', 300, 8, 'Dış eğitmen'),
      egitim('e17', 'p10', 'temel', 250, 12, 'B. Şenol'),
      egitim('e18', 'p10', 'ilkYardim', 500, 16, 'M. Kurt'),
      egitim('e19', 'p11', 'temel', 150, 12, 'B. Şenol'),
      egitim('e20', 'p11', 'kkd', 100, 2, 'B. Şenol'),
      egitim('e21', 'p12', 'temel', 100, 12, 'B. Şenol')
    ].concat(ekEgitimler);

    var riskler = [
      { id: 'r01', isyeriId: 'iy1', tehlike: 'Pres makinesinde el sıkışması', alan: 'Üretim hattı 2', olasilik: 4, siddet: 5, onlem: 'Çift el kumandası, ışık perdesi ve LOTO prosedürü uygulanacak.', sorumlu: 'Bakım şefi', termin: gun(10), durum: 'acik' },
      { id: 'r02', isyeriId: 'iy1', tehlike: 'Forklift ile yaya çarpışması', alan: 'Depo A koridoru', olasilik: 4, siddet: 4, onlem: 'Yaya yolu boyanacak, ayna ve sesli uyarı eklenecek.', sorumlu: 'Depo sorumlusu', termin: gun(5), durum: 'acik' },
      { id: 'r03', isyeriId: 'iy1', tehlike: 'Kaynak dumanına maruziyet', alan: 'Kaynak atölyesi', olasilik: 3, siddet: 4, onlem: 'Nokta emiş sistemi kuruldu, filtre değişimi aylık izlenecek.', sorumlu: 'İSG uzmanı', termin: gun(30), durum: 'izlemede' },
      { id: 'r04', isyeriId: 'iy1', tehlike: 'Yüksekte çalışmada düşme', alan: 'Çatı ve cephe', olasilik: 3, siddet: 5, onlem: 'Tam vücut kemeri, yaşam hattı ve izinli çalışma formu zorunlu.', sorumlu: 'Bakım şefi', termin: gun(3), durum: 'acik' },
      { id: 'r05', isyeriId: 'iy1', tehlike: 'Elektrik panosunda ark', alan: 'Bakım atölyesi', olasilik: 2, siddet: 5, onlem: 'Ark koruyucu KKD, pano kilitleme ve yetki belgesi kontrolü.', sorumlu: 'Elektrik teknisyeni', termin: gun(20), durum: 'acik' },
      { id: 'r06', isyeriId: 'iy1', tehlike: 'Kaygan zemin / düşme', alan: 'Üretim girişi', olasilik: 3, siddet: 2, onlem: 'Tahliye kanalı açıldı, kaydırmaz paspas serildi.', sorumlu: 'İdari işler', termin: gun(-12), durum: 'kapali' },
      { id: 'r07', isyeriId: 'iy1', tehlike: 'Gürültü maruziyeti', alan: 'Pres hattı', olasilik: 4, siddet: 2, onlem: 'Odyometri takibi ve kulaklık denetimi sürüyor.', sorumlu: 'İşyeri hekimi', termin: gun(45), durum: 'izlemede' },
      { id: 'r08', isyeriId: 'iy1', tehlike: 'Kimyasal depolama uygunsuzluğu', alan: 'Laboratuvar', olasilik: 3, siddet: 3, onlem: 'Asit ve bazlar ayrı dolapta, göz duşu kontrol edilecek.', sorumlu: 'Laborant', termin: gun(8), durum: 'acik' }
    ];

    var olaylar = [
      { id: 'o01', isyeriId: 'iy1', tur: 'ramakKala', tarih: gun(-2), yer: 'Depo B kapısı', personelId: 'p11', aciklama: 'Forklift geri manevrada yayanın yaklaşık 1 m yakınından geçti.', kokNeden: 'Ayna kör noktası ve zemin yaya işareti silinmiş.', durum: 'acik' },
      { id: 'o02', isyeriId: 'iy1', tur: 'ramakKala', tarih: gun(-9), yer: 'Üretim hattı 2', personelId: 'p08', aciklama: 'Pres koruyucusu devre dışı bırakılmış hâlde çalışma tespit edildi.', kokNeden: 'Üretim baskısı; koruyucu by-pass anahtarı kilitlenmemiş.', durum: 'acik' },
      { id: 'o03', isyeriId: 'iy1', tur: 'isKazasi', tarih: gun(-21), yer: 'Bakım atölyesi', personelId: 'p06', aciklama: 'Pano kapağı açıkken ark oluştu, eldiven delindi; yaralanma yok.', kokNeden: 'Enerji kesme ve kilitleme adımı atlanmış.', neden: 'elektrik', siddet: 'hafifOrta', vardiya: '2', hastaneSevk: 'hayir', kayipGun: 0, durum: 'kapali' },
      { id: 'o04', isyeriId: 'iy1', tur: 'cevresel', tarih: gun(-5), yer: 'Kimyasal depo', personelId: 'p10', aciklama: 'Asit bidonunun altında yaklaşık 1 litre sızıntı görüldü.', kokNeden: 'Bidon contası ömrünü tamamlamış.', durum: 'kapali' },
      { id: 'o05', isyeriId: 'iy1', tur: 'isKazasi', tarih: gun(-34), yer: 'Depo A raf arası', personelId: 'p05', aciklama: 'Paleti elle çekerken belinde ani ağrı oluştu, işe devam edemedi.', kokNeden: 'Yük transpalet ile değil elle çekilmiş; zemin eğimi artırılmış.', neden: 'yontem', vucutBolgesi: 'sirt', yaralanmaTuru: 'burkulma', siddet: 'hafifOrta', vardiya: '1', hastaneSevk: 'evet', istirahatBaslangic: gun(-34), istirahatBitis: gun(-28), kayipGun: 7, saglikKurulusu: 'Aydın Devlet Hastanesi', durum: 'kapali' },
      { id: 'o06', isyeriId: 'iy1', tur: 'isKazasi', tarih: gun(-16), yer: 'Kaynak atölyesi', personelId: 'p09', aciklama: 'Kaynak sıçraması eldiven manşetinden içeri girdi; el sırtında yanık oluştu.', kokNeden: 'Manşet bağcıkları açık bırakılmış, deri önlük kullanılmamış.', neden: 'kkd', vucutBolgesi: 'el', yaralanmaTuru: 'yanik', siddet: 'hafifOrta', vardiya: '2', hastaneSevk: 'evet', istirahatBaslangic: gun(-16), istirahatBitis: gun(-14), kayipGun: 3, saglikKurulusu: 'Aypa OSGB işyeri hekimliği', durum: 'acik' },
      { id: 'o07', isyeriId: 'iy1', tur: 'isKazasi', tarih: gun(-58), yer: 'Pres hattı 2', personelId: 'p08', aciklama: 'Kalıp değişimi sırasında pres üst kalıbı el üzerine kaydı; iki parmakta ezilme.', kokNeden: 'Kalıp kilitleme pimi takılmadan müdahale edilmiş.', neden: 'makine', vucutBolgesi: 'el', yaralanmaTuru: 'ezilme', siddet: 'uzuvKaybi', vardiya: '1', hastaneSevk: 'evet', istirahatBaslangic: gun(-58), istirahatBitis: gun(-47), kayipGun: 12, saglikKurulusu: 'Aydın Devlet Hastanesi', durum: 'kapali' },
      { id: 'o08', isyeriId: 'iy1', tur: 'isKazasi', tarih: gun(-96), yer: 'Yükleme rampası', personelId: 'p11', aciklama: 'Rampa kenarından inerken ayak bileği burkuldu; iki gün istirahat verildi.', kokNeden: 'Rampa kenarında sarı-siyah uyarı şeridi aşınmış.', neden: 'ortam', vucutBolgesi: 'ayak', yaralanmaTuru: 'burkulma', siddet: 'hafifOrta', vardiya: '3', hastaneSevk: 'evet', istirahatBaslangic: gun(-96), istirahatBitis: gun(-95), kayipGun: 2, saglikKurulusu: 'Özel Yaşam Hastanesi', durum: 'kapali' },
      { id: 'o09', isyeriId: 'iy1', tur: 'isKazasi', tarih: gun(-7), yer: 'Bakım atölyesi', personelId: 'p07', aciklama: 'Taşlama yaparken göze metal tozu kaçtı; acil serviste yıkama yapıldı.', kokNeden: 'Koruyucu gözlük takılmamış, yüz siperi yok.', neden: 'kkd', vucutBolgesi: 'goz', yaralanmaTuru: 'yabanciCisim', siddet: 'hafifOrta', vardiya: '2', hastaneSevk: 'evet', istirahatBaslangic: gun(-7), istirahatBitis: gun(-7), kayipGun: 1, saglikKurulusu: 'Aydın Devlet Hastanesi acil', durum: 'acik' },
      { id: 'o10', isyeriId: 'iy1', tur: 'isKazasi', tarih: gun(-45), yer: 'Depo A çıkışı', personelId: 'p11', aciklama: 'Forklift geri manevrada çalışanın ayağını sıyırdı; ayak tarak kemiğinde ezilme.', kokNeden: 'Yaya yolu işaretlemesi silinmiş, forklift hızı sınırlanmamış.', neden: 'trafik', vucutBolgesi: 'ayak', yaralanmaTuru: 'ezilme', siddet: 'agir', vardiya: '1', hastaneSevk: 'evet', istirahatBaslangic: gun(-45), istirahatBitis: gun(-37), kayipGun: 9, saglikKurulusu: 'Aydın Devlet Hastanesi ortopedi', durum: 'acik' },
      { id: 'o11', isyeriId: 'iy1', tur: 'isKazasi', tarih: gun(-72), yer: 'Laboratuvar', personelId: 'p10', aciklama: 'Asit çözeltisi pipetlenirken göze sıçradı; göz yıkama yapıldı.', kokNeden: 'Göz duşu erişilemez durumda, koruyucu gözlük kullanılmamış.', neden: 'kimyasal', vucutBolgesi: 'goz', yaralanmaTuru: 'kimyasal', siddet: 'hafifOrta', vardiya: 'gunduz', hastaneSevk: 'evet', kayipGun: 0, saglikKurulusu: 'Aydın Devlet Hastanesi göz polikliniği', durum: 'kapali' },
      { id: 'o12', isyeriId: 'iy1', tur: 'isKazasi', tarih: gun(-28), yer: 'Ofis koridoru', personelId: 'p12', aciklama: 'Islak zeminde kayarak düştü; sırtta zorlanma ve kol çürüğü.', kokNeden: 'Temizlik sonrası ıslak zemin uyarı levhası konmamış.', neden: 'ortam', vucutBolgesi: 'sirt', yaralanmaTuru: 'burkulma', siddet: 'hafifOrta', vardiya: 'gunduz', hastaneSevk: 'hayir', istirahatBaslangic: gun(-28), istirahatBitis: gun(-25), kayipGun: 4, saglikKurulusu: 'Özel Yaşam Hastanesi', durum: 'kapali' },
      { id: 'o13', isyeriId: 'iy1', tur: 'isKazasi', tarih: gun(-81), yer: 'Trafo binası', personelId: 'p06', aciklama: 'Topraklama hattı bağlarken düşük voltajlı kaçak nedeniyle kolda kasılma ve yanık.', kokNeden: 'Kilitleme-etiketleme prosedürü uygulanmamış, izolasyon eldiveni eski.', neden: 'elektrik', vucutBolgesi: 'kol', yaralanmaTuru: 'elektrik', siddet: 'agir', vardiya: '3', hastaneSevk: 'evet', istirahatBaslangic: gun(-81), istirahatBitis: gun(-76), kayipGun: 6, saglikKurulusu: 'Aydın Devlet Hastanesi acil', durum: 'kapali' },
      { id: 'o14', isyeriId: 'iy1', tur: 'meslekHastaligi', tarih: gun(-40), yer: 'Kaynak atölyesi', personelId: 'p09', aciklama: 'Yıllık akciğer grafisinde pnömokonyoz bulgusu; göğüs hastalıklarına sevk edildi.', kokNeden: 'Toz ölçümü yapılmamış, lokal havalandırma yetersiz.', neden: 'ortam', vucutBolgesi: 'icOrgan', yaralanmaTuru: 'solunum', hastalikGrubu: 'd', etken: 'Kaynak dumanı ve metal tozu', siddet: 'agir', vardiya: '1', hastaneSevk: 'evet', saglikKurulusu: 'Aydın Devlet Hastanesi göğüs hastalıkları', durum: 'acik' }
    ];

    var dosyalar = katalogUret(isyerleri);

    var PLAN_SABLONU = [
      { faaliyet: 'İSG yıllık çalışma planının gözden geçirilmesi', sorumlu: 'İşveren vekili', ay: 1, gun: 15, durum: 'tamamlandi' },
      { faaliyet: 'Acil durum tatbikatı planla ve kaydet', sorumlu: 'İSG uzmanı', ay: 3, gun: 20, durum: 'takvimde' },
      { faaliyet: 'İlk yardımcı ihtiyacı ve belge yenilemeleri', sorumlu: 'İşyeri hekimi', ay: 5, gun: 10, durum: 'takvimde' },
      { faaliyet: 'Periyodik kontrol ve ölçümlerin tamamlanması', sorumlu: 'Bakım şefi', ay: 7, gun: 5, durum: 'takvimde' },
      { faaliyet: 'Yıllık eğitim planının uygulanması', sorumlu: 'İSG uzmanı', ay: 9, gun: 1, durum: 'takvimde' },
      { faaliyet: 'Yıl sonu İSG değerlendirme raporu', sorumlu: 'İşveren vekili', ay: 12, gun: 20, durum: 'takvimde' }
    ];

    function yilTarihi(ay, gunNo) {
      return new Date().getFullYear() + '-' + String(ay).padStart(2, '0') + '-' + String(gunNo).padStart(2, '0');
    }

    var planlar = [];
    isyerleri.forEach(function (isyeri, indeks) {
      PLAN_SABLONU.forEach(function (kalip, sira) {
        var durum = kalip.durum;
        if (indeks > 1 && sira === 1) { durum = 'tamamlandi'; }
        if (indeks % 2 === 1 && sira === 2) { durum = 'tamamlandi'; }
        planlar.push({
          id: 'pl_' + isyeri.id + '_' + (sira + 1),
          isyeriId: isyeri.id,
          sira: sira + 1,
          ay: kalip.ay,
          gun: kalip.gun,
          faaliyet: kalip.faaliyet,
          sorumlu: kalip.sorumlu,
          durum: durum,
          takipTarihi: yilTarihi(kalip.ay, kalip.gun),
          aciklama: durum === 'tamamlandi' ? 'Plan kapsamında tamamlandı, kayıt dosyada.' : ''
        });
      });
      planlar.push({
        id: 'pl_' + isyeri.id + '_7',
        isyeriId: isyeri.id,
        sira: 7,
        ay: 0,
        gun: 0,
        faaliyet: 'İSG kurul toplantı takviminin belirlenmesi',
        sorumlu: 'İşveren vekili',
        durum: 'planlanmadi',
        takipTarihi: '',
        aciklama: ''
      });
    });

    var tespitler = [
      { id: 't01', isyeriId: 'iy1', tespit: 'Acil çıkış önünde palet birikmesi', konum: 'Depo A', sorumlu: 'Depo sorumlusu', oncelik: 'yuksek', tur: 'Uygunsuzluk', termin: gun(4), durum: 'acik', dogrulama: '', not: 'Çıkış önü 1,2 m serbest bırakılacak.' },
      { id: 't02', isyeriId: 'iy1', tespit: 'Pres koruyucusunda kilit arızası', konum: 'Üretim hattı 2', sorumlu: 'Bakım şefi', oncelik: 'kritik', tur: 'Uygunsuzluk', termin: gun(-6), durum: 'acik', dogrulama: '', not: 'Makine devre dışı, parça bekleniyor.' },
      { id: 't03', isyeriId: 'iy1', tespit: 'Kaynak atölyesinde maske kullanılmaması', konum: 'Kaynak atölyesi', sorumlu: 'İSG uzmanı', oncelik: 'orta', tur: 'Davranış', termin: gun(10), durum: 'dogrulama', dogrulama: gun(2), not: 'KKD eğitimi tekrarlandı.' },
      { id: 't04', isyeriId: 'iy2', tespit: 'Servis aracında ilk yardım çantası eksik', konum: 'Otopark', sorumlu: 'İdari işler', oncelik: 'orta', tur: 'Eksiklik', termin: gun(-15), durum: 'kapali', dogrulama: gun(-10), not: 'Çanta tamamlandı, fotoğrafla kapatıldı.' },
      { id: 't05', isyeriId: 'iy4', tespit: 'Yangın dolabı önünde malzeme depolanmış', konum: 'Koridor 2', sorumlu: 'Destek hizmetleri', oncelik: 'yuksek', tur: 'Uygunsuzluk', termin: gun(1), durum: 'acik', dogrulama: '', not: '' },
      { id: 't06', isyeriId: 'iy5', tespit: 'Kimyasal depoda etiketsiz bidon', konum: 'Klor deposu', sorumlu: 'Depo sorumlusu', oncelik: 'kritik', tur: 'Uygunsuzluk', termin: gun(2), durum: 'acik', dogrulama: '', not: 'GBF ve etiketleme tamamlanacak.' }
    ];

    var riskEkipleri = isyerleri.map(function (isyeri, indeks) {
      var dolu = indeks === 0 || indeks === 3;
      return {
        isyeriId: isyeri.id,
        sonDegerlendirme: dolu ? gun(-380 - indeks * 30) : '',
        enGecYenileme: dolu ? gun(900 - indeks * 60) : '',
        uyeler: {
          isveren: dolu ? 'Mehmet Kurt' : '',
          uzman: dolu ? 'Barış Taşdemir' : '',
          hekim: indeks === 0 ? 'Mehmet Kurt' : (dolu ? 'Buse Şenol' : ''),
          temsilci: '',
          destek: '',
          birim: ''
        }
      };
    });

    var acilPlanlar = isyerleri.map(function (isyeri, indeks) {
      var hazir = indeks === 3;
      return {
        isyeriId: isyeri.id,
        hazirlanma: hazir ? gun(-520) : '',
        sonYenileme: hazir ? gun(-120) : '',
        tatbikat: hazir ? gun(-60) : '',
        ekip: hazir ? [
          { rol: 'Acil durum koordinatörü', ad: 'Barış Taşdemir' },
          { rol: 'Yangın söndürme ekibi', ad: 'Emre Koç' },
          { rol: 'İlk yardım ekibi', ad: 'Zeynep Arslan' }
        ] : []
      };
    });

    var davetler = [
      { id: 'dv1', kod: 'ISG-BUSE1', eposta: 'buse.senol@ornek.com', rol: 'yetkili', isyerleri: ['iy1', 'iy2'], tarih: gun(-3), durum: 'kabul', kabulTarihi: gun(-2), kullaniciId: 'u2' },
      { id: 'dv2', kod: 'ISG-DEPO7', eposta: 'depo.sorumlusu@ornek.com', rol: 'yetkili', isyerleri: ['iy1'], tarih: gun(-1), durum: 'bekliyor' }
    ];

    var talepler = [
      {
        id: 'tp1', kullaniciId: 'u2', kullaniciAd: 'Buse Şenol', isyeriId: 'iy1', isyeriAd: 'Aypaş OSGB',
        sayfa: 'personel', etiket: 'Personel kaydı', ozet: 'Yeni personel: Kaan Erdem (Forklift operatörü)',
        durum: 'bekliyor', olusturma: new Date().toISOString(),
        eylem: {
          ad: 'personelKaydet',
          args: [{
            id: 'tp1-p', isyeriId: 'iy1', sicil: '90', adSoyad: 'Kaan Erdem', meslek: 'Forklift operatörü',
            departman: 'Depo ve Lojistik', grupKodu: '', sube: 'Depo A', iseBaslama: gun(-4),
            cinsiyet: 'Erkek', telefon: '', tc: '', durum: 'aktif'
          }]
        }
      }
    ];

    var mevzuat = [
      { id: 'm01', baslik: 'İş Sağlığı ve Güvenliği Kanunu', kategori: 'Kanun', dayanak: '6331 sayılı Kanun', durum: 'incelendi', ozet: 'İşveren yükümlülükleri, risk değerlendirmesi, eğitim ve kurul esasları.' },
      { id: 'm02', baslik: 'İSG Risk Değerlendirmesi Yönetmeliği', kategori: 'Yönetmelik', dayanak: 'RG 29.12.2012 / 28512', durum: 'incelendi', ozet: 'Risk değerlendirmesi ekip yapısı, yenileme süreleri ve dokümantasyon.' },
      { id: 'm03', baslik: 'İSG Kurulları Hakkında Yönetmelik', kategori: 'Yönetmelik', dayanak: 'RG 18.01.2013 / 28532', durum: 'incelendi', ozet: '50 ve üzeri çalışan işyerlerinde kurul, aylık toplantı ve karar takibi.' },
      { id: 'm04', baslik: 'Çalışanların İSG Eğitimlerinin Usul ve Esasları', kategori: 'Yönetmelik', dayanak: 'RG 15.05.2013 / 28648', durum: 'incelendi', ozet: 'Tehlike sınıfına göre eğitim süreleri ve yenileme aralıkları.' },
      { id: 'm05', baslik: 'İşyeri Hekimi ve İSG Uzmanlarının Görevleri', kategori: 'Yönetmelik', dayanak: 'RG 20.07.2013 / 28713', durum: 'gozdenGecir', ozet: 'Görevlendirme, çalışma süreleri ve İSG-KATİP bildirimleri.' },
      { id: 'm06', baslik: 'Acil Durumlar Hakkında Yönetmelik', kategori: 'Yönetmelik', dayanak: 'RG 18.06.2013 / 28681', durum: 'incelendi', ozet: 'Acil durum planı, ekipler, tatbikat ve yenileme yükümlülüğü.' },
      { id: 'm07', baslik: 'İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları', kategori: 'Yönetmelik', dayanak: 'RG 25.04.2013 / 28628', durum: 'incelendi', ozet: 'Periyodik kontrol sıklıkları ve yetkili kontrol firmaları.' },
      { id: 'm08', baslik: 'Kişisel Koruyucu Donanım Yönetmeliği', kategori: 'Yönetmelik', dayanak: 'RG 02.07.2013 / 28695', durum: 'incelendi', ozet: 'KKD seçimi, zimmet, kullanım ve bakım yükümlülükleri.' },
      { id: 'm09', baslik: 'Sağlık ve Güvenlik İşaretleri Yönetmeliği', kategori: 'Yönetmelik', dayanak: 'RG 23.12.2003 / 25325', durum: 'incelendi', ozet: 'Uyarı, yasak, emir ve acil çıkış işaretlerinin standardı.' },
      { id: 'm10', baslik: 'Yangın Söndürme Sistemleri ve Ekipmanları', kategori: 'Tebliğ', dayanak: 'Binaların Yangından Korunması Hakkında Yönetmelik', durum: 'incelendi', ozet: 'Söndürücü cihaz sayısı, yerleşimi ve kontrol periyotları.' },
      { id: 'm11', baslik: 'Kimyasal Maddelerle Çalışmalarda Sağlık ve Güvenlik', kategori: 'Yönetmelik', dayanak: 'RG 12.08.2013 / 28733', durum: 'gozdenGecir', ozet: 'GBF, etiketleme, maruziyet ölçümü ve depolama kuralları.' },
      { id: 'm12', baslik: 'Gürültü Yönetmeliği', kategori: 'Yönetmelik', dayanak: 'RG 28.07.2013 / 28721', durum: 'incelendi', ozet: 'Maruziyet sınır değerleri, ölçüm ve korunma önlemleri.' },
      { id: 'm13', baslik: 'Titreşim Yönetmeliği', kategori: 'Yönetmelik', dayanak: 'RG 22.08.2013 / 28743', durum: 'incelendi', ozet: 'El-kol ve tüm vücut titreşimi maruziyet değerleri.' },
      { id: 'm14', baslik: 'Elle Taşıma İşleri Yönetmeliği', kategori: 'Yönetmelik', dayanak: 'RG 24.07.2013 / 28717', durum: 'incelendi', ozet: 'Ergonomik risk değerlendirmesi ve yardımcı ekipman kullanımı.' },
      { id: 'm15', baslik: 'Ekranlı Araçlarla Çalışmalar Yönetmeliği', kategori: 'Yönetmelik', dayanak: 'RG 16.07.2013 / 28709', durum: 'incelendi', ozet: 'Ofis ergonomisi, göz muayenesi ve ara verme düzeni.' },
      { id: 'm16', baslik: 'Yapı İşlerinde Sağlık ve Güvenlik Yönetmeliği', kategori: 'Yönetmelik', dayanak: 'RG 05.10.2013 / 28786', durum: 'gozdenGecir', ozet: 'İskele, kazı, yüksekte çalışma ve koordinatör yükümlülükleri.' },
      { id: 'm17', baslik: 'İş Kazası ve Meslek Hastalığı Bildirim Usulleri', kategori: 'Tebliğ', dayanak: 'SGK 2018/24 Genelge', durum: 'incelendi', ozet: 'Üç iş günü içinde bildirim ve e-bildirge işlemleri.' },
      { id: 'm18', baslik: 'İşyerlerinde İşveren ve Çalışan Temsilcisi Görevleri', kategori: 'Yönetmelik', dayanak: 'RG 31.01.2013 / 28554', durum: 'incelendi', ozet: 'Çalışan temsilcisi seçimi, yetkileri ve desteklenmesi.' },
      { id: 'm19', baslik: 'İSG Veri Analizi ve Yıllık Değerlendirme Rehberi', kategori: 'Rehber', dayanak: 'İSGGM yayını', durum: 'gozdenGecir', ozet: 'Kaza oranları, DÖF kapanma süresi ve performans göstergeleri.' },
      { id: 'm20', baslik: 'ISO 45001 İş Sağlığı ve Güvenliği Yönetim Sistemi', kategori: 'Standart', dayanak: 'TS ISO 45001:2018', durum: 'incelendi', ozet: 'Tehlike tanımlama, uygunluk değerlendirmesi ve sürekli iyileştirme.' }
    ];

    return {
      surum: 4,
      olusturma: new Date().toISOString(),
      ayarlar: {
        kurum: 'Aydın Büyükşehir Belediyesi Personel A.Ş',
        kullanici: 'Mehmet Kurt',
        gorev: 'Yönetici oturumu',
        yillikCalismaSaati: 2250,
        sonMevzuatKontrolu: gun(-30)
      },
      isyerleri: isyerleri,
      personel: personel,
      egitimler: egitimler,
      riskler: riskler,
      olaylar: olaylar,
      dosyalar: dosyalar,
      belgeler: [],
      planlar: planlar,
      tespitler: tespitler,
      riskEkipleri: riskEkipleri,
      acilPlanlar: acilPlanlar,
      kullanicilar: ISG.ORNEK_KULLANICILAR(),
      talepler: talepler,
      denetim: [],
      davetler: davetler,
      mevzuat: mevzuat
    };
  };
})(window);





