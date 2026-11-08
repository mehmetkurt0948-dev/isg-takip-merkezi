/* İSG Takip Merkezi — varsayılan başlangıç verisi ve tarih yardımcıları
   Site boş açılır: yeni bir cihazda hiçbir işyeri, personel veya kayıt
   yoktur. Başlangıçta yalnızca yönetici hesabı bulunur (aksi hâlde giriş
   yapılamaz). Tanıtım amaçlı dolu küme yayında değildir; test fixture'ı
   tools/demo-veri.js içinde durur ve yalnızca testlerde yüklenir. */
(function (global) {
  'use strict';

  var ISG = global.ISG = global.ISG || {};

  function iso(tarih) {
    return tarih.getFullYear() + '-' +
      String(tarih.getMonth() + 1).padStart(2, '0') + '-' +
      String(tarih.getDate()).padStart(2, '0');
  }

  /* ISO tarihe yıl ekler; öğlen saatine sabitleyerek saat dilimi kaymasını
     önler. 29 Şubat hedef yılda yoksa tarih 28 Şubat'a çekilir: aksi hâlde
     JavaScript tarihi 1 Mart'a taşır ve "2 yıl sonra" hesabı bir gün kayardı.
     Belge geçerlilik süresi, risk ve acil durum planı yenileme hesapları
     (depo/uygulama) bu tek kaynağı kullanır. */
  function yilEkle(isoTarih, yil) {
    var parca = String(isoTarih || '').split('-');
    var yilDeger = Number(parca[0]);
    var ayDeger = Number(parca[1]);
    var gunDeger = Number(parca[2]);
    if (!yilDeger || !ayDeger || !gunDeger) { return ''; }
    var hedefYil = yilDeger + (Number(yil) || 0);
    var ayGunu = new Date(hedefYil, ayDeger, 0).getDate();
    var d = new Date(hedefYil, ayDeger - 1, Math.min(gunDeger, ayGunu), 12, 0, 0, 0);
    return iso(d);
  }

  ISG.yilEkle = yilEkle;

  /* Kurulum hesabı için asgari şifre uzunluğu. Tek kaynak: giriş ekranı,
     şifre sıfırlama ve ilk kurulum adımı bu sabiti kullanır. */
  ISG.SIFRE_MIN_UZUNLUK = 8;

  /* Tek gerçek hesap: site yöneticisi. Boş başlangıçta ve veri sıfırlandığında
     bu hesap korunur, böylece giriş anahtarı hiçbir cihazda kaybolmaz.

     ŞİFRE YOKTUR (2.28.0 — R0): burada eskiden düz metin '1234' yazıyordu. Site
     herkese açık yayınlandığı için bu, yayındaki her kurulumda BİLİNEN kimlik
     bilgisi demekti: adresi bilen herkes yönetici olarak girebiliyordu. Artık
     hesap şifresiz doğar ve `ilkKurulum: true` taşır; giriş ekranı bu hesapta
     oturum açmaz, bunun yerine "ilk kurulum" adımında yeni şifre belirletir
     (bkz. giris.js). Var olan cihazlarda kayıtlı şifre SİLİNMEZ: göç yalnızca
     şifresi boş hesapları işaretler, kimse kilitlenmez.

     KAPSAM YOKTUR (2.26.0): yönetici rolü tek başına işyeri kapsamı sağlamaz ve
     bu hesaba kurulumda `tumIsyerleri` ya da işyeri ataması YAZILMAZ. İlk
     yönetici, işyerlerini kendisi tanımladıktan sonra Kullanıcılar ve yetkiler
     ekranından kendi hesabına açıkça işyeri atar; bu iki yönetim ekranı atamasız
     yöneticiye açıktır, dolayısıyla sistem kendini kilitlemez. Atama yapılana
     kadar veri ekranlarında "İşyeri atamanız bulunmuyor" uyarısı görünür. */
  ISG.YONETICI_HESAP = function () {
    return [{
      id: 'u1', adSoyad: 'Mehmet Kurt', eposta: 'mehmetkurt0948@gmail.com', sifre: '',
      rol: 'yonetici', gorev: 'İSG yöneticisi', isyerleri: [],
      aktif: true, sonGiris: '', ilkKurulum: true
    }];
  };

  /* Yerleşik mevzuat kapsam kataloğu — "Mevzuat ve kapsam" sayfası bu başlıkları
     listeler. Cihazda kayıtlı mevzuat başlığı yoksa sayfa bu kataloğu okur; veriye
     yazılmaz ve kayıt sayılmaz. Böylece boş açılan cihazda da kapsam listesi dolu
     görünür. durum: 'incelendi' | 'gozdenGecir'.
     Bu katalog bir uygunluk belgesi değildir: güncel birleştirilmiş metinler Resmî
     Gazete / Mevzuat Bilgi Sistemi üzerinden doğrulanmalıdır. */
  ISG.MEVZUAT_KATALOGU = function () {
    return [
      {
        id: 'm01', kategori: 'Kanun', durum: 'incelendi',
        baslik: 'İş Sağlığı ve Güvenliği Kanunu',
        dayanak: '6331 sayılı Kanun (RG 20.06.2012 / 28339)',
        kapsam: 'Çalışanı olan kamu ve özel sektör işyerlerinin tamamı. Ev hizmetleri, TSK, genel kolluk ve MİT faaliyetleri ile afet ve acil durum birimlerinin müdahale faaliyetleri kapsam dışıdır.',
        ozet: 'İşveren yükümlülükleri, risk değerlendirmesi, eğitim ve kurul esasları.'
      },
      {
        id: 'm02', kategori: 'Yönetmelik', durum: 'incelendi',
        baslik: 'İSG Risk Değerlendirmesi Yönetmeliği',
        dayanak: 'RG 29.12.2012 / 28512',
        kapsam: 'Tüm işyerleri ve tüm çalışanlar (alt işveren, geçici çalışan ve stajyer dahil). Yenileme: çok tehlikeli 2, tehlikeli 4, az tehlikeli 6 yıl.',
        ozet: 'Risk değerlendirmesi ekip yapısı, yenileme süreleri ve dokümantasyon.'
      },
      {
        id: 'm03', kategori: 'Yönetmelik', durum: 'incelendi',
        baslik: 'İSG Kurulları Hakkında Yönetmelik',
        dayanak: 'RG 18.01.2013 / 28532',
        kapsam: '50 ve daha fazla çalışanı bulunan sürekli işlerin yapıldığı işyerleri; alt işveren çalışanları sayıya eklenir. Eşiğin altında çalışan temsilcisi görevlendirilir.',
        ozet: '50 ve üzeri çalışan işyerlerinde kurul, aylık toplantı ve karar takibi.'
      },
      {
        id: 'm04', kategori: 'Yönetmelik', durum: 'incelendi',
        baslik: 'Çalışanların İSG Eğitimlerinin Usul ve Esasları',
        dayanak: 'RG 15.05.2013 / 28648',
        kapsam: 'İşe başlamadan önce ve tehlike sınıfına göre belirlenen sürelerde tüm çalışanlar; iş değişikliği, iş kazası ve uzun devamsızlık sonrası yenileme eğitimi.',
        ozet: 'Tehlike sınıfına göre eğitim süreleri ve yenileme aralıkları.'
      },
      {
        id: 'm05', kategori: 'Yönetmelik', durum: 'gozdenGecir',
        baslik: 'İşyeri Hekimi ve İSG Uzmanlarının Görevleri',
        dayanak: 'RG 20.07.2013 / 28713',
        kapsam: 'İşyeri hekimi ve İSG uzmanı görevlendirmekle yükümlü işyerleri; OSGB hizmet sözleşmeleri, çalışma süreleri ve İSG-KATİP bildirimleri.',
        ozet: 'Görevlendirme, çalışma süreleri ve İSG-KATİP bildirimleri.'
      },
      {
        id: 'm06', kategori: 'Yönetmelik', durum: 'incelendi',
        baslik: 'Acil Durumlar Hakkında Yönetmelik',
        dayanak: 'RG 18.06.2013 / 28681',
        kapsam: 'Tüm işyerleri; acil durum planı, ekiplerin görevlendirilmesi, tahliye ve tatbikat kayıtları ile planın yenilenmesi.',
        ozet: 'Acil durum planı, ekipler, tatbikat ve yenileme yükümlülüğü.'
      },
      {
        id: 'm07', kategori: 'Yönetmelik', durum: 'incelendi',
        baslik: 'İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları',
        dayanak: 'RG 25.04.2013 / 28628',
        kapsam: 'İş ekipmanı kullanılan tüm işyerleri; periyodik kontrollerin yetkili kişilerce yapılması ve kayıt altına alınması.',
        ozet: 'Periyodik kontrol sıklıkları ve yetkili kontrol firmaları.'
      },
      {
        id: 'm08', kategori: 'Yönetmelik', durum: 'incelendi',
        baslik: 'Kişisel Koruyucu Donanım Yönetmeliği',
        dayanak: 'RG 02.07.2013 / 28695',
        kapsam: 'KKD kullanımı gereken işlerde çalışanlar; donanımın ücretsiz sağlanması, zimmet kaydı, eğitim, bakım ve değişimi.',
        ozet: 'KKD seçimi, zimmet, kullanım ve bakım yükümlülükleri.'
      },
      {
        id: 'm09', kategori: 'Yönetmelik', durum: 'incelendi',
        baslik: 'Sağlık ve Güvenlik İşaretleri Yönetmeliği',
        dayanak: 'RG 23.12.2003 / 25325',
        kapsam: 'Tüm işyerleri; uyarı, yasak, emir, acil çıkış ve yangınla mücadele işaretlerinin standart biçimde kullanılması.',
        ozet: 'Uyarı, yasak, emir ve acil çıkış işaretlerinin standardı.'
      },
      {
        id: 'm10', kategori: 'Tebliğ', durum: 'incelendi',
        baslik: 'Yangın Söndürme Sistemleri ve Ekipmanları',
        dayanak: 'Binaların Yangından Korunması Hakkında Yönetmelik',
        kapsam: 'Kullanım amacı ve alanı ne olursa olsun binaların tamamı; söndürme cihazı sayısı, yerleşimi, kontrol ve bakım kayıtları.',
        ozet: 'Söndürücü cihaz sayısı, yerleşimi ve kontrol periyotları.'
      },
      {
        id: 'm11', kategori: 'Yönetmelik', durum: 'gozdenGecir',
        baslik: 'Kimyasal Maddelerle Çalışmalarda Sağlık ve Güvenlik',
        dayanak: 'RG 12.08.2013 / 28733',
        kapsam: 'Kimyasal madde bulunan, kullanılan veya depolanan işyerleri; güvenlik bilgi formu, etiketleme, maruziyet ölçümü ve kayıt.',
        ozet: 'GBF, etiketleme, maruziyet ölçümü ve depolama kuralları.'
      },
      {
        id: 'm12', kategori: 'Yönetmelik', durum: 'incelendi',
        baslik: 'Gürültü Yönetmeliği',
        dayanak: 'RG 28.07.2013 / 28721',
        kapsam: 'Gürültüye maruz kalınan işlerde çalışanlar; maruziyet ölçümü, eylem ve sınır değerleri, korunma ve sağlık gözetimi.',
        ozet: 'Maruziyet sınır değerleri, ölçüm ve korunma önlemleri.'
      },
      {
        id: 'm13', kategori: 'Yönetmelik', durum: 'incelendi',
        baslik: 'Titreşim Yönetmeliği',
        dayanak: 'RG 22.08.2013 / 28743',
        kapsam: 'El-kol ve tüm vücut titreşimine maruz kalan çalışanlar; maruziyet ölçümü, sınır değerler ve önleme çalışmaları.',
        ozet: 'El-kol ve tüm vücut titreşimi maruziyet değerleri.'
      },
      {
        id: 'm14', kategori: 'Yönetmelik', durum: 'incelendi',
        baslik: 'Elle Taşıma İşleri Yönetmeliği',
        dayanak: 'RG 24.07.2013 / 28717',
        kapsam: 'Yükün elle taşındığı işler; ergonomik risk değerlendirmesi, yardımcı ekipman ve çalışan eğitimi.',
        ozet: 'Ergonomik risk değerlendirmesi ve yardımcı ekipman kullanımı.'
      },
      {
        id: 'm15', kategori: 'Yönetmelik', durum: 'incelendi',
        baslik: 'Ekranlı Araçlarla Çalışmalar Yönetmeliği',
        dayanak: 'RG 16.07.2013 / 28709',
        kapsam: 'Ekranlı araçlarla çalışanlar; iş istasyonu ergonomisi, göz muayenesi ve ara verme düzeni.',
        ozet: 'Ofis ergonomisi, göz muayenesi ve ara verme düzeni.'
      },
      {
        id: 'm16', kategori: 'Yönetmelik', durum: 'gozdenGecir',
        baslik: 'Yapı İşlerinde Sağlık ve Güvenlik Yönetmeliği',
        dayanak: 'RG 05.10.2013 / 28786',
        kapsam: 'İnşaat, tadilat, bakım-onarım gibi yapı işleri; iskele, kazı, yüksekte çalışma ve birden çok işveren varsa koordinatör görevleri.',
        ozet: 'İskele, kazı, yüksekte çalışma ve koordinatör yükümlülükleri.'
      },
      {
        id: 'm17', kategori: 'Tebliğ', durum: 'incelendi',
        baslik: 'İş Kazası ve Meslek Hastalığı Bildirim Usulleri',
        dayanak: 'SGK 2018/24 Genelge',
        kapsam: 'İş kazası ve meslek hastalığı yaşanan tüm işyerleri; olayın üç iş günü içinde SGK ve ÇSGB birimlerine bildirilmesi.',
        ozet: 'Üç iş günü içinde bildirim ve e-bildirge işlemleri.'
      },
      {
        id: 'm18', kategori: 'Yönetmelik', durum: 'incelendi',
        baslik: 'İşyerlerinde İşveren ve Çalışan Temsilcisi Görevleri',
        dayanak: 'RG 31.01.2013 / 28554',
        kapsam: 'Tüm işyerleri; çalışan temsilcisi seçimi, desteklenmesi ve İSG ile ilgili konularda yetkilendirilmesi.',
        ozet: 'Çalışan temsilcisi seçimi, yetkileri ve desteklenmesi.'
      },
      {
        id: 'm19', kategori: 'Rehber', durum: 'gozdenGecir',
        baslik: 'İSG Veri Analizi ve Yıllık Değerlendirme Rehberi',
        dayanak: 'İSGGM yayını',
        kapsam: 'İSG performansını ölçen işyerleri için yol gösterici niteliktedir; bağlayıcı hüküm içermez.',
        ozet: 'Kaza oranları, DÖF kapanma süresi ve performans göstergeleri.'
      },
      {
        id: 'm20', kategori: 'Standart', durum: 'incelendi',
        baslik: 'ISO 45001 İş Sağlığı ve Güvenliği Yönetim Sistemi',
        dayanak: 'TS ISO 45001:2018',
        kapsam: 'Yönetim sistemi kurmak isteyen işyerleri için gönüllü standarttır; sözleşme veya müşteri şartı ile bağlayıcı hâle gelir.',
        ozet: 'Tehlike tanımlama, uygunluk değerlendirmesi ve sürekli iyileştirme.'
      }
    ];
  };

  /* Boş başlangıç veri kümesi — yayındaki sitenin açıldığı hâl. */
  ISG.BOS_VERI = function () {
    return {
      surum: 4,
      olusturma: new Date().toISOString(),
      ayarlar: {
        kurum: '', kullanici: '', gorev: '', yillikCalismaSaati: 2250, sonMevzuatKontrolu: ''
      },
      isyerleri: [], personel: [], egitimler: [], riskler: [], olaylar: [],
      dosyalar: [], belgeler: [], planlar: [], tespitler: [],
      riskEkipleri: [], acilPlanlar: [], mevzuat: [], saglikTakip: [],
      kurumlar: [], kullanicilar: ISG.YONETICI_HESAP(), talepler: [], denetim: [],
      senkron: { kayit: {}, silinen: {}, ayarlar: '' }
    };
  };
})(window);
