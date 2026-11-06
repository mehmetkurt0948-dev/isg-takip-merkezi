/* İSG Takip Merkezi — oturum, roller, işyeri kapsamı ve onay kuyruğu
   depo.js ve bicim.js'ten sonra, sayfa modüllerinden ve uygulama.js'ten önce yüklenir. */
(function (global) {
  'use strict';

  var ISG = global.ISG = global.ISG || {};
  var D = ISG.depo;

  var OTURUM_ANAHTAR = 'isgtakip.oturum';

  var ROLLER = {
    yonetici: {
      id: 'yonetici', ad: 'Yönetici', kisa: 'Yönetici',
      aciklama: 'Tüm işyerleri; kayıtlar doğrudan uygulanır, onay kuyruğunu yönetir.',
      tumIsyerleri: true, dogrudanYazar: true, onaylar: true, yonetir: true
    },
    osgbMuduru: {
      id: 'osgbMuduru', ad: 'OSGB Müdürü', kisa: 'OSGB Müdürü',
      aciklama: 'Kendi kurumundaki bütün işyerlerini izler ve raporlar; mesleki kayıtları değiştirmez, onay vermez.',
      tumIsyerleri: false, kurumKapsami: true, saltOkunur: true,
      dogrudanYazar: false, onaylar: false, yonetir: false
    },
    yetkili: {
      id: 'yetkili', ad: 'Yetkili', kisa: 'Yetkili',
      aciklama: 'Atandığı işyerlerinde çalışır; değişiklikler yetki modeline göre doğrudan ya da onaya gönderilir.',
      tumIsyerleri: false, dogrudanYazar: false, onaylar: false, yonetir: false
    },
    goruntuleyici: {
      id: 'goruntuleyici', ad: 'Görüntüleyici', kisa: 'Görüntüleyici',
      aciklama: 'Yalnızca okuma yetkisi; hiçbir kaydı değiştiremez.',
      tumIsyerleri: false, dogrudanYazar: false, onaylar: false, yonetir: false
    }
  };

  var ROL_ESLEME = {
    yonetici: 'yonetici',
    'yönetici': 'yonetici',
    'kurum sahibi': 'yonetici',
    'kurum yoneticisi': 'yonetici',
    'kurum yöneticisi': 'yonetici',
    osgbmuduru: 'osgbMuduru',
    'osgb müdürü': 'osgbMuduru',
    'osgb muduru': 'osgbMuduru',
    'osgb müdür': 'osgbMuduru',
    'osgb mudur': 'osgbMuduru',
    yetkili: 'yetkili',
    'isg uzmani': 'yetkili',
    'isg uzmanı': 'yetkili',
    'iş güvenliği uzmanı': 'yetkili',
    'is guvenligi uzmani': 'yetkili',
    goruntuleyici: 'goruntuleyici',
    'görüntüleyici': 'goruntuleyici',
    izleyici: 'goruntuleyici',
    viewer: 'goruntuleyici',
    admin: 'yonetici'
  };

  function kucult(metin) {
    return String(metin || '').toLocaleLowerCase('tr-TR').trim();
  }

  function rolCoz(deger) {
    var anahtar = kucult(deger);
    if (ROLLER[anahtar]) { return anahtar; }
    if (ROL_ESLEME[anahtar]) { return ROL_ESLEME[anahtar]; }
    return 'goruntuleyici';
  }

  function rolTanimi(rol) { return ROLLER[rolCoz(rol)] || ROLLER.goruntuleyici; }

  /* ---------- Oturum ---------- */

  var oturumKaydi = null;

  function oturumOku() {
    try {
      var ham = global.localStorage.getItem(OTURUM_ANAHTAR);
      if (!ham) { return null; }
      var kayit = JSON.parse(ham);
      return kayit && kayit.kullaniciId ? kayit : null;
    } catch (hata) {
      return null;
    }
  }

  function oturumYaz(kayit) {
    try {
      if (kayit) { global.localStorage.setItem(OTURUM_ANAHTAR, JSON.stringify(kayit)); }
      else { global.localStorage.removeItem(OTURUM_ANAHTAR); }
    } catch (hata) { /* kalıcı depolama yoksa oturum yalnızca bellekte kalır */ }
  }

  oturumKaydi = oturumOku();

  function oturum() {
    if (!oturumKaydi) { return null; }
    var kullanici = D.kullaniciBul(oturumKaydi.kullaniciId);
    if (!kullanici || kullanici.aktif === false) {
      oturumKaydi = null;
      oturumYaz(null);
      return null;
    }
    return {
      kullaniciId: kullanici.id,
      adSoyad: kullanici.adSoyad || '',
      eposta: kullanici.eposta || '',
      gorev: kullanici.gorev || '',
      rol: rolCoz(kullanici.rol),
      isyerleri: (kullanici.isyerleri || []).slice(),
      tumIsyerleri: kullanici.tumIsyerleri === true,
      kurumId: kullanici.kurumId || '',
      uzmanSinifi: typeof ISG.uzmanSinifiKodu === 'function'
        ? ISG.uzmanSinifiKodu(kullanici.uzmanSinifi) : (kullanici.uzmanSinifi || ''),
      giris: oturumKaydi.giris || ''
    };
  }

  function oturumAc(kullanici) {
    if (!kullanici || !kullanici.id) { return null; }
    oturumKaydi = { kullaniciId: kullanici.id, giris: new Date().toISOString() };
    oturumYaz(oturumKaydi);
    D.denetimEkle({
      tur: 'giris', islem: 'oturumAc', kullaniciId: kullanici.id,
      kullaniciAd: kullanici.adSoyad || '', ozet: 'Oturum açıldı'
    });
    return oturum();
  }

  function oturumKapat() {
    var o = oturum();
    oturumKaydi = null;
    oturumYaz(null);
    if (o) {
      D.denetimEkle({
        tur: 'cikis', islem: 'oturumKapat', kullaniciId: o.kullaniciId,
        kullaniciAd: o.adSoyad, ozet: 'Oturum kapatıldı'
      });
    }
    return null;
  }

  /* ---------- Kapsam ---------- */

  /* Oturum sahibinin erişebildiği işyeri kimlikleri.
     Yönetici → tüm işyerleri; OSGB Müdürü → yalnız KENDİ KURUMUNDAKİ işyerleri;
     diğerleri → atandığı işyerleri. Kurum dışına çıkış yolu yoktur. */
  function kapsam() {
    var o = oturum();
    if (!o) { return []; }
    var veri = D.al();
    var rol = rolTanimi(o.rol);
    if (rol.tumIsyerleri) {
      return (veri.isyerleri || []).map(function (isyeri) { return isyeri.id; });
    }
    if (rol.kurumKapsami) {
      if (!o.kurumId) { return []; }
      var tekKurum = (veri.kurumlar || []).length === 1 ? veri.kurumlar[0].id : '';
      return (veri.isyerleri || []).filter(function (isyeri) {
        if (!isyeri) { return false; }
        var kurumId = isyeri.kurumId || tekKurum;
        return kurumId === o.kurumId;
      }).map(function (isyeri) { return isyeri.id; });
    }
    /* Rolü tüm işyerlerini kapsamayan ama "Tüm işyerleri" işaretli kullanıcı. */
    if (o.tumIsyerleri) {
      return (veri.isyerleri || []).map(function (isyeri) { return isyeri.id; });
    }
    return o.isyerleri.slice();
  }

  function kapsamda(isyeriId) {
    if (!isyeriId) { return false; }
    return kapsam().indexOf(isyeriId) > -1;
  }

  function diziSuz(liste, izinli, alan) {
    var anahtar = alan || 'isyeriId';
    return (liste || []).filter(function (kayit) { return izinli.indexOf(kayit[anahtar]) > -1; });
  }

  function bosVeri(veri) {
    var ayarlar = {};
    Object.keys((veri && veri.ayarlar) || {}).forEach(function (anahtar) { ayarlar[anahtar] = veri.ayarlar[anahtar]; });
    return {
      surum: veri ? veri.surum : 4,
      olusturma: veri ? veri.olusturma : '',
      ayarlar: ayarlar,
      kurumlar: [],
      isyerleri: [], personel: [], egitimler: [], riskler: [], olaylar: [],
      dosyalar: [], belgeler: [], planlar: [], tespitler: [],
      riskEkipleri: [], acilPlanlar: [], kullanicilar: [], talepler: [],
      denetim: [], mevzuat: []
    };
  }

  /* Kullanıcı kaydının arayüze verilebilen alanları. Şifre ve şifre değişim
     zamanı hiçbir görünüme taşınmaz; gözetim ekranı yalnızca kimlik, sınıf ve
     kapsam bilgisini görür. */
  function kullaniciOzet(kullanici) {
    if (!kullanici) { return null; }
    return {
      id: kullanici.id, adSoyad: kullanici.adSoyad || '', eposta: kullanici.eposta || '',
      rol: kullanici.rol, gorev: kullanici.gorev || '',
      isyerleri: (kullanici.isyerleri || []).slice(),
      tumIsyerleri: kullanici.tumIsyerleri === true,
      kurumId: kullanici.kurumId || '',
      uzmanSinifi: kullanici.uzmanSinifi || '',
      aktif: kullanici.aktif, sonGiris: kullanici.sonGiris || ''
    };
  }

  /* Arayüzün gördüğü veri: oturum sahibinin işyeri (ya da kurum) kapsamına göre
     süzülmüş kopya. OSGB Müdürü kendi kurumundaki işyerlerini, o işyerlerinin
     taleplerini ve kullanıcı listesini (şifresiz) görür; başka kurumun kaydı
     hiçbir listede görünmez. */
  function kapsamliVeri(veri) {
    if (!veri) { return veri; }
    var o = oturum();
    if (!o) { return bosVeri(veri); }
    var rol = rolTanimi(o.rol);
    if (rol.tumIsyerleri) { return veri; }
    var kurumGorunumu = !!rol.kurumKapsami;

    if (!kurumGorunumu && o.tumIsyerleri) { return veri; }

    var izinli = kapsam();
    var kurumIdleri = {};
    (veri.isyerleri || []).forEach(function (isyeri) {
      if (isyeri && izinli.indexOf(isyeri.id) >= 0) { kurumIdleri[isyeri.kurumId || ''] = true; }
    });
    var tekKurum = (veri.kurumlar || []).length === 1 ? veri.kurumlar[0].id : '';

    var dosyalar = diziSuz(veri.dosyalar, izinli);
    var dosyaIdleri = dosyalar.map(function (dosya) { return dosya.id; });

    var ayarlar = {};
    Object.keys(veri.ayarlar || {}).forEach(function (anahtar) { ayarlar[anahtar] = veri.ayarlar[anahtar]; });
    ayarlar.kullanici = o.adSoyad;
    ayarlar.gorev = rol.ad + (o.gorev ? ' · ' + o.gorev : '');

    /* Kurum müdürü gözetim için kurumundaki uzmanları görür (şifresiz);
       diğer roller yalnızca kendi hesabını görür. */
    var kullanicilar;
    if (kurumGorunumu) {
      kullanicilar = (veri.kullanicilar || []).filter(function (kullanici) {
        if (!kullanici) { return false; }
        var kurumId = kullanici.kurumId || tekKurum;
        return !!o.kurumId && kurumId === o.kurumId;
      }).map(kullaniciOzet).filter(Boolean);
    } else {
      kullanicilar = [kullaniciOzet(D.kullaniciBul(o.kullaniciId))].filter(Boolean);
    }

    var talepler;
    if (kurumGorunumu) {
      talepler = (veri.talepler || []).filter(function (talep) {
        return !!talep && izinli.indexOf(talep.isyeriId) >= 0;
      });
    } else {
      talepler = (veri.talepler || []).filter(function (talep) { return talep.kullaniciId === o.kullaniciId; });
    }

    return {
      surum: veri.surum,
      olusturma: veri.olusturma,
      ayarlar: ayarlar,
      kurumlar: (veri.kurumlar || []).filter(function (kurum) {
        return !!kurum && (kurum.id === o.kurumId || (kurumGorunumu && kurumIdleri[kurum.id]));
      }),
      isyerleri: diziSuz(veri.isyerleri, izinli, 'id'),
      personel: diziSuz(veri.personel, izinli),
      egitimler: diziSuz(veri.egitimler, izinli),
      riskler: diziSuz(veri.riskler, izinli),
      olaylar: diziSuz(veri.olaylar, izinli),
      dosyalar: dosyalar,
      belgeler: (veri.belgeler || []).filter(function (belge) { return dosyaIdleri.indexOf(belge.dosyaId) > -1; }),
      planlar: diziSuz(veri.planlar, izinli),
      tespitler: diziSuz(veri.tespitler, izinli),
      riskEkipleri: diziSuz(veri.riskEkipleri, izinli),
      acilPlanlar: diziSuz(veri.acilPlanlar, izinli),
      kullanicilar: kullanicilar,
      talepler: talepler,
      denetim: (veri.denetim || []).filter(function (kayit) {
        if (kurumGorunumu) { return izinli.indexOf(kayit.isyeriId) >= 0; }
        return kayit.kullaniciId === o.kullaniciId;
      }),
      mevzuat: veri.mevzuat || []
    };
  }

  /* ---------- Yazma koruması ---------- */

  var ADMIN_ISLEMLERI = {
    isyeriKaydet: 1, isyeriSil: 1, kullaniciKaydet: 1, kullaniciSil: 1,
    ayarKaydet: 1, iceAktar: 1, sifirla: 1
  };

  var YAZMA_ISLEMLERI = [
    'personelKaydet', 'personelSil', 'personelTemizle', 'personelTopluEkle',
    'egitimKaydet', 'egitimSil',
    'riskKaydet', 'riskSil',
    'olayKaydet', 'olaySil',
    'dosyaKaydet', 'dosyaSil', 'dosyaDurumToplu', 'listeUygula', 'listeGeriAl',
    'belgeKaydet', 'belgeSil',
    'planKaydet', 'planSil', 'planDurumDegistir', 'planTopluEkle', 'planTopluSil',
    'tespitKaydet', 'tespitSil', 'tespitDurumDegistir',
    'riskEkipKaydet', 'acilPlanKaydet', 'riskEkipUyeEkle', 'riskEkipUyeSil',
    'acilEkipEkle', 'acilEkipSil'
  ];

  var ETIKETLER = {
    personelKaydet: 'Personel kaydı', personelSil: 'Personel kaydı silme', personelTemizle: 'Personel listesi temizliği',
    personelTopluEkle: 'Toplu personel yükleme',
    egitimKaydet: 'Eğitim kaydı', egitimSil: 'Eğitim kaydı silme',
    riskKaydet: 'Risk kaydı', riskSil: 'Risk kaydı silme',
    olayKaydet: 'Olay / iş kazası bildirimi', olaySil: 'Olay kaydı silme',
    dosyaKaydet: 'Dosya kontrolü', dosyaSil: 'Dosya kaydı silme', dosyaDurumToplu: 'Toplu dosya durumu',
    listeUygula: 'Hazır dosya kontrol listesi',
    listeGeriAl: 'Hazır dosya kontrol listesini silme',
    belgeKaydet: 'Belge yükleme', belgeSil: 'Belge silme',
    planKaydet: 'Çalışma planı maddesi', planSil: 'Plan maddesi silme', planDurumDegistir: 'Plan durumu',
    planTopluEkle: 'Çalışma planı toplu yükleme', planTopluSil: 'Çalışma planı toplu silme',
    tespitKaydet: 'Saha tespiti', tespitSil: 'Tespit silme', tespitDurumDegistir: 'Tespit durumu',
    riskEkipKaydet: 'Risk değerlendirme ekibi', acilPlanKaydet: 'Acil durum planı',
    riskEkipUyeEkle: 'Risk ekibi üyesi', riskEkipUyeSil: 'Risk ekibi üyesi silme',
    acilEkipEkle: 'Acil durum ekibi üyesi', acilEkipSil: 'Acil durum ekibi üyesi silme',
    isyeriKaydet: 'İşyeri kaydı', isyeriSil: 'İşyeri silme',
    kullaniciKaydet: 'Kullanıcı kaydı', kullaniciSil: 'Kullanıcı silme',
    ayarKaydet: 'Ayarlar'
  };

  var SAYFA_ESLEME = {
    personelKaydet: 'personel', personelSil: 'personel', personelTemizle: 'personel',
    personelTopluEkle: 'personel',
    egitimKaydet: 'personel', egitimSil: 'personel',
    riskKaydet: 'risk', riskSil: 'risk', riskEkipKaydet: 'risk', riskEkipUyeEkle: 'risk', riskEkipUyeSil: 'risk',
    olayKaydet: 'saha', olaySil: 'saha', tespitKaydet: 'saha', tespitSil: 'saha', tespitDurumDegistir: 'saha',
    dosyaKaydet: 'dosyalar', dosyaSil: 'dosyalar', dosyaDurumToplu: 'dosyalar', listeUygula: 'dosyalar', listeGeriAl: 'dosyalar',
    belgeKaydet: 'dosyalar', belgeSil: 'dosyalar',
    planKaydet: 'plan', planSil: 'plan', planDurumDegistir: 'plan',
    planTopluEkle: 'plan', planTopluSil: 'plan',
    acilPlanKaydet: 'acil', acilEkipEkle: 'acil', acilEkipSil: 'acil'
  };

  var ISYERI_ILK_ARG = {
    personelTemizle: 1, personelTopluEkle: 1, dosyaDurumToplu: 1, listeUygula: 1, listeGeriAl: 1,
    planTopluEkle: 1,
    riskEkipKaydet: 1, acilPlanKaydet: 1,
    riskEkipUyeEkle: 1, riskEkipUyeSil: 1, acilEkipEkle: 1, acilEkipSil: 1
  };

  var KAYIT_LISTELERI = ['personel', 'egitimler', 'riskler', 'olaylar', 'dosyalar', 'belgeler', 'planlar', 'tespitler'];

  function kayitBul(id) {
    if (!id) { return null; }
    var veri = D.al();
    for (var i = 0; i < KAYIT_LISTELERI.length; i += 1) {
      var liste = veri[KAYIT_LISTELERI[i]] || [];
      for (var j = 0; j < liste.length; j += 1) {
        if (liste[j].id === id) { return liste[j]; }
      }
    }
    return null;
  }

  /* ---------- İşyeri bazlı kayıtlar: risk ekibi ve acil durum planı ----------
     Bu iki liste kayıt kimliğiyle değil işyeri kimliğiyle tutulur: her işyeri
     için tek kayıt vardır ve eylemin ilk argümanı işyeri kimliğidir. kayitBul()
     yalnızca kendi kimliği olan listelerde aradığı için bu eylemlerde kayıt
     bulunamaz; sürüm denetimi "Kayıt artık bulunmuyor" deyip Onayla düğmesini
     çalışmaz hâle getirirdi. Arama ve denetim bu yüzden eylem adına göre
     işyeri kaydına yönlendirilir. */
  var ISYERI_KAYIT_EYLEMLERI = {
    riskEkipKaydet: 'riskEkipleri', riskEkipUyeEkle: 'riskEkipleri', riskEkipUyeSil: 'riskEkipleri',
    acilPlanKaydet: 'acilPlanlar', acilEkipEkle: 'acilPlanlar', acilEkipSil: 'acilPlanlar'
  };

  /* Üye ekleme/silme eylemleri işyeri kaydını yerinde değiştirir; gönderilen
     veride (işyeri, görev, ad, ...) kaydın tamamı yoktur. Bu eylemlerde
     "talep sonra kayıt değişti mi" denetimi yapılmaz: uygulama tek alanı
     güncellediği için eski değerin üzerine yazma riski yoktur. */
  var ISYERI_YERINDE_EYLEMLER = {
    riskEkipUyeEkle: 1, riskEkipUyeSil: 1, acilEkipEkle: 1, acilEkipSil: 1
  };

  /* İşyeriyle çalışıp kaydı yerinde değiştirmeyen toplu eylemler: ilk argüman
     gene işyeri kimliğidir, ama eylem ya yeni kayıt ekler (toplu yükleme) ya da
     filtreyle birden çok kaydın tek alanını günceller (dosya durumu) ya da liste
     siler (personel temizliği). Tek bir hedef kayıt olmadığından "talep anındaki
     kayıt" aranmaz; denetim işyerinin hâlâ var olmasıyla sınırlıdır. Bu liste
     olmadığında sürüm denetimi işyeri kimliğini kayıtlar arasında arıyor ve
     "Kayıt artık bulunmuyor" diyip Onayla düğmesini kalıcı olarak kilitliyordu. */
  var ISYERI_TOPLU_EYLEMLER = {
    personelTemizle: 'sil', personelTopluEkle: 'ekle', planTopluEkle: 'ekle',
    dosyaDurumToplu: 'guncelle', listeUygula: 'ekle', listeGeriAl: 'sil'
  };

  function isyeriVar(isyeriId) {
    if (!isyeriId) { return false; }
    return (D.al().isyerleri || []).some(function (isyeri) {
      return isyeri && isyeri.id === isyeriId;
    });
  }

  function isyeriKayitBul(listeAdi, isyeriId) {
    if (!listeAdi || !isyeriId || typeof ISG.ilgiliKayit !== 'function') { return null; }
    return ISG.ilgiliKayit(D.al(), listeAdi, isyeriId) || null;
  }

  function kayitIsyeri(kayit) {
    if (!kayit) { return ''; }
    if (kayit.isyeriId) { return kayit.isyeriId; }
    if (kayit.dosyaId) {
      var dosya = kayitBul(kayit.dosyaId);
      if (dosya && dosya.isyeriId) { return dosya.isyeriId; }
    }
    if (kayit.personelId) {
      var kisi = kayitBul(kayit.personelId);
      if (kisi && kisi.isyeriId) { return kisi.isyeriId; }
    }
    return '';
  }

  function hedefIsyeri(ad, args) {
    var ilk = args[0];
    if (!ilk) { return ''; }
    if (Array.isArray(ilk)) {
      for (var i = 0; i < ilk.length; i += 1) {
        var kayit = typeof ilk[i] === 'string' ? kayitBul(ilk[i]) : ilk[i];
        var isyeriId = kayitIsyeri(kayit);
        if (isyeriId) { return isyeriId; }
      }
      return '';
    }
    if (typeof ilk === 'object') { return kayitIsyeri(ilk); }
    if (ISYERI_ILK_ARG[ad]) { return String(ilk); }
    return kayitIsyeri(kayitBul(String(ilk)));
  }

  /* ---------- Onay yetkisi motoru ----------
     İki katman vardır:
       1) `ayarlar.onayModeli !== 'isyeri'` (bugünkü varsayılan): yönetici
          doğrudan yazar, diğer yazarların değişikliği talebe dönüşür.
       2) `ayarlar.onayModeli === 'isyeri'`: işyeri bazlı model — tek aktif uzman
          doğrudan yazar; çok uzmanlı işyerinde tehlike sınıfına uygun sınıftaki
          uzman onay yetkilisidir; uygun uzman yoksa talep "yetkili eksik" bekler.
     Model ayrı bir anahtarla açıldığı için canlı veri tek hamlede davranış
     değiştirmez; anahtar silinirse eski davranışa dönülür. */

  function onayModeli() {
    var ayarlar = (D.al() || {}).ayarlar || {};
    return ayarlar.onayModeli === 'isyeri' ? 'isyeri' : 'rol';
  }

  function onayEsigi(tehlikeSinifi) {
    var kod = typeof ISG.tehlikeSinifiKodu === 'function'
      ? ISG.tehlikeSinifiKodu(tehlikeSinifi) : (tehlikeSinifi || '');
    var tablo = ISG.ONAY_ESIGI || {};
    return (tablo[kod] || []).slice();
  }

  /* İşyerine atanmış aktif uzmanlar; pasif hesap onay yetkilisi sayılmaz. */
  function isyeriUzmanlari(isyeriId) {
    if (!isyeriId) { return []; }
    var gorulen = {};
    return (D.al().kullanicilar || []).filter(function (kullanici) {
      if (!kullanici || kullanici.aktif === false) { return false; }
      if (rolCoz(kullanici.rol) !== 'yetkili') { return false; }
      var atanmis = kullanici.tumIsyerleri === true ||
        (kullanici.isyerleri || []).indexOf(isyeriId) >= 0;
      if (!atanmis || gorulen[kullanici.id]) { return false; }
      gorulen[kullanici.id] = true;
      return true;
    });
  }

  function uzmanSinifKodu(uzman) {
    return typeof ISG.uzmanSinifiKodu === 'function'
      ? ISG.uzmanSinifiKodu(uzman && uzman.uzmanSinifi) : ((uzman && uzman.uzmanSinifi) || '');
  }

  /* İşyerinin onay durumu. `mod`:
       'tekUzman'  → tek aktif uzman var; doğrudan yazar (sınıf şartı yok)
       'onayli'    → çok uzman var, en az biri eşiği karşılıyor
       'eksik'     → çok uzman var ama hiçbiri tehlike sınıfı eşiğini karşılamıyor
       'uzman-yok' → işyerine atanmış aktif uzman yok */
  function onayDurumu(isyeriId) {
    var isyeri = (D.al().isyerleri || []).filter(function (kayit) { return kayit.id === isyeriId; })[0] || null;
    var tehlikeSinifi = isyeri ? (isyeri.tehlikeSinifi || '') : '';
    var esik = onayEsigi(tehlikeSinifi);
    var uzmanlar = isyeriUzmanlari(isyeriId);
    var uygun = uzmanlar.filter(function (uzman) {
      var sinif = uzmanSinifKodu(uzman);
      return !!sinif && esik.indexOf(sinif) >= 0;
    });
    var mod = 'uzman-yok';
    if (uzmanlar.length === 1) { mod = 'tekUzman'; }
    else if (uzmanlar.length > 1) { mod = uygun.length ? 'onayli' : 'eksik'; }
    return {
      mod: mod,
      isyeriId: isyeriId,
      isyeriAd: isyeri ? (isyeri.ad || '') : '',
      tehlikeSinifi: tehlikeSinifi,
      esik: esik,
      uzmanSayisi: uzmanlar.length,
      uzmanlar: uzmanlar,
      onaylayanlar: uygun,
      onaylayanIdler: uygun.map(function (uzman) { return uzman.id; })
    };
  }

  /* ---------- Yetki soruları ---------- */

  function izin(eylem, isyeriId) {
    var o = oturum();
    if (!o) { return false; }
    var rol = rolTanimi(o.rol);
    if (ADMIN_ISLEMLERI[eylem]) { return !!rol.yonetir; }
    if (eylem === 'onayla' || eylem === 'talepKarar') {
      if (rol.saltOkunur || rol.id === 'goruntuleyici') { return false; }
      if (rol.onaylar) { return true; }
      if (!isyeriId) { return onaylayiciMi(); }
      var durum = onayDurumu(isyeriId);
      return durum.mod === 'onayli' && durum.onaylayanIdler.indexOf(o.kullaniciId) >= 0;
    }
    if (eylem === 'denetim') { return true; }
    if (eylem === 'ekle' || eylem === 'duzenle' || eylem === 'sil') {
      if (rol.saltOkunur || rol.id === 'goruntuleyici') { return false; }
      if (rol.tumIsyerleri) { return true; }
      if (isyeriId) { return kapsam().indexOf(isyeriId) > -1; }
      return kapsam().length > 0;
    }
    return true;
  }

  /* Oturum sahibi bu işyerinde yazarken hangi yol izlenir?
       'dogrudan'    → kayıt hemen yazılır
       'talep'       → onay kuyruğuna gider (işyerinde onay yetkilisi var)
       'eksik'       → kuyruğa gider, "onay yetkilisi eksik" durumunda bekler
       'kapsam-disi' → işyeri yetki kapsamı dışında
       'red'         → rol hiç yazamaz (görüntüleyici, OSGB müdürü, oturum yok) */
  function yazmaModu(isyeriId) {
    var o = oturum();
    if (!o) { return 'red'; }
    var rol = rolTanimi(o.rol);
    if (rol.yonetir) { return 'dogrudan'; }
    if (rol.saltOkunur || rol.id === 'goruntuleyici') { return 'red'; }
    if (isyeriId && kapsam().indexOf(isyeriId) < 0) { return 'kapsam-disi'; }
    var durum = onayDurumu(isyeriId);
    /* Rol modeli açıkken (bugünkü varsayılan) bütün yazımlar talebe dönüşür. */
    if (onayModeli() !== 'isyeri') { return 'talep'; }
    if (durum.mod === 'tekUzman') { return 'dogrudan'; }
    if (durum.mod === 'onayli') { return 'talep'; }
    return 'eksik';
  }

  /* Oturum sahibi bu talebe karar verebilir mi?
     Yönetici mevcut yetkisini korur. Onaylayıcı uzman ise yalnız kendi
     işyerinin, tehlike sınıfına uygun sınıftaki onay yetkilisidir; kendi
     talebini ve kapsamı dışındaki talebi onaylayamaz. */
  function onayYetkisi(talep) {
    var o = oturum();
    if (!o || !talep) { return false; }
    var rol = rolTanimi(o.rol);
    if (rol.saltOkunur || rol.id === 'goruntuleyici') { return false; }
    if (talep.kullaniciId && talep.kullaniciId === o.kullaniciId) { return false; }
    if (rol.onaylar) { return true; }
    var durum = onayDurumu(talep.isyeriId);
    if (durum.mod !== 'onayli') { return false; }
    return durum.onaylayanIdler.indexOf(o.kullaniciId) >= 0;
  }

  /* Kullanıcı en az bir işyerinde onay yetkilisi mi? (menü/rozet görünürlüğü) */
  function onaylayiciMi() {
    var o = oturum();
    if (!o) { return false; }
    var rol = rolTanimi(o.rol);
    if (rol.onaylar) { return true; }
    if (rol.saltOkunur || rol.id === 'goruntuleyici') { return false; }
    return kapsam().some(function (isyeriId) {
      var durum = onayDurumu(isyeriId);
      return durum.mod === 'onayli' && durum.onaylayanIdler.indexOf(o.kullaniciId) >= 0;
    });
  }

  function degistirebilir(isyeriId) { return izin('ekle', isyeriId); }

  /* ---------- Onay kuyruğu ---------- */

  /* Durum sözlüklerinden görünür adı bulur. */
  function durumAdi(sozluk, anahtar) {
    var tanim = sozluk && sozluk[anahtar];
    return (tanim && tanim.ad) ? tanim.ad : String(anahtar || '');
  }

  function ozetUret(ad, args) {
    var etiket = ETIKETLER[ad] || 'Değişiklik';
    /* Toplu personelde ilk argüman işyeri kimliği, ikincisi kayıt listesidir. */
    if (ad === 'personelTopluEkle') {
      return etiket + ' · ' + ((args[1] || []).length) + ' personel';
    }
    if (ad === 'planTopluEkle') {
      var ilkKayit = (args[1] || [])[0] || {};
      return etiket + ' · ' + ((args[1] || []).length) + ' faaliyet' +
        (ilkKayit.yil ? ' · ' + ilkKayit.yil + ' yılı' : '');
    }
    if (ad === 'planTopluSil') {
      var filtre = args[0] || {};
      return etiket + ' · ' + (filtre.yil ? filtre.yil + ' yılı' : 'seçili kayıtlar') +
        (filtre.idler && filtre.idler.length ? ' · ' + filtre.idler.length + ' kayıt' : '');
    }
    /* Tek argümanlı durum eylemlerinde gönderilen kayıt nesnesi yoktur; karar
       veriyor yönetici neyin değişeceğini özet satırından okuyabilir. */
    if (ad === 'planDurumDegistir') {
      return etiket + ' → ' + durumAdi(ISG.PLAN_DURUMLARI, ISG.planDurumNormal
        ? ISG.planDurumNormal(args[1]) : args[1]);
    }
    if (ad === 'tespitDurumDegistir') {
      return etiket + ' → ' + durumAdi(ISG.TESPIT_DURUMLARI, args[1]);
    }
    if (ad === 'dosyaDurumToplu') {
      return etiket + ' → ' + durumAdi(ISG.DOSYA_DURUMLARI, args[1]) + ' (incelenmemiş tüm dosyalar)';
    }
    var ilk = args[0];
    if (Array.isArray(ilk)) { return etiket + ' · ' + ilk.length + ' kayıt'; }
    if (ilk && typeof ilk === 'object') {
      var adi = ilk.adSoyad || ilk.ad || ilk.baslik || ilk.tanim || ilk.kategori || ilk.dosyaAdi || ilk.kod || '';
      return etiket + (adi ? ': ' + adi : '');
    }
    return etiket;
  }

  /* Onay talebinin denetlenebilir gövdesi: modül, kayıt kimliği, işlem türü ve
     eski/yeni değerler talebin içinde saklanır. Yönetici karar verirken kaydın
     talep anındaki hâli ile bugünkü hâlini karşılaştırabilir. */
  function kayitKimligi(args) {
    var ilk = args && args[0];
    if (ilk && typeof ilk === 'object' && !Array.isArray(ilk)) { return String(ilk.id || ''); }
    if (typeof ilk === 'string') { return String(ilk); }
    return '';
  }

  function islemTuru(ad, kayitId) {
    if (/Sil$/.test(ad)) { return 'sil'; }
    return kayitId ? 'guncelle' : 'ekle';
  }

  function kopyala(deger) {
    if (!deger || typeof deger !== 'object') { return null; }
    try { return JSON.parse(JSON.stringify(deger)); } catch (hata) { return null; }
  }

  function talepYaz(ad, args, isyeriId, o, ekstra) {
    var ek = ekstra || {};
    var eksik = ek.yetkiDurumu === 'eksik';
    var isyeri = (D.al().isyerleri || []).filter(function (kayit) { return kayit.id === isyeriId; })[0];
    var kayitId = kayitKimligi(args);
    var tur = islemTuru(ad, kayitId);
    /* Risk ekibi ve acil durum planında args[0] işyeri kimliğidir: eski değer
       işyeri kaydından okunur, böylece yönetici gerçek değişikliği görür. */
    var isyeriListe = ISYERI_KAYIT_EYLEMLERI[ad] || '';
    /* args[0] işyeri kimliği olup tek kayıtla eşleşmeyen toplu eylemlerde kayıt
       aranmaz; aksi hâlde talep, onaylanamaz hâlde kuyrukta kalırdı. */
    var toplu = ISYERI_TOPLU_EYLEMLER[ad] || '';
    if (toplu) { kayitId = ''; tur = toplu; }
    var mevcut = isyeriListe ? isyeriKayitBul(isyeriListe, kayitId || isyeriId) : (kayitId ? kayitBul(kayitId) : null);
    if (isyeriListe) { kayitId = kayitId || isyeriId; tur = mevcut ? 'guncelle' : 'ekle'; }
    var talep = D.talepKaydet({
      kullaniciId: o.kullaniciId,
      kullaniciAd: o.adSoyad,
      kullaniciRol: rolTanimi(o.rol).id,
      rol: rolTanimi(o.rol).ad,
      isyeriId: isyeriId,
      isyeriAd: isyeri ? (isyeri.ad || isyeri.kisaAd || '') : '',
      modul: SAYFA_ESLEME[ad] || 'panel',
      sayfa: SAYFA_ESLEME[ad] || 'panel',
      kayitId: kayitId,
      kayitTur: isyeriListe || toplu ? 'isyeri' : 'kayit',
      islemTuru: tur,
      eskiKayit: mevcut ? kopyala(mevcut) : null,
      yeniKayit: tur === 'sil' ? null : kopyala(args[0]),
      etiket: ETIKETLER[ad] || 'Değişiklik',
      ozet: ozetUret(ad, args) + (eksik ? ' · onay yetkilisi eksik' : ''),
      durum: 'bekliyor',
      yetkiDurumu: eksik ? 'eksik' : '',
      eylem: { ad: ad, args: args }
    });
    D.denetimEkle({
      tur: 'talep', islem: ad, kullaniciId: o.kullaniciId, kullaniciAd: o.adSoyad,
      isyeriId: isyeriId, kayitId: kayitId, ozet: 'Onaya gönderildi: ' + (talep.etiket || ad)
    });
    return {
      id: (args[0] && args[0].id) || talep.id, talep: talep, bekliyor: true, yetkiDurumu: eksik ? 'eksik' : ''
    };
  }

  /* Onay yetkilisi eksik işyerlerinin listesi: yönetici paneli bu listeyi
     gösterip atama/sınıf düzeltmesi yapabilir. Yalnızca işyeri modeli açıkken
     anlamlıdır; rol modelinde boş döner. */
  function yetkiliEksikListe() {
    var o = oturum();
    if (!o) { return []; }
    var rol = rolTanimi(o.rol);
    if (!rol.yonetir && !rol.kurumKapsami) { return []; }
    if (onayModeli() !== 'isyeri') { return []; }
    var kapsamIdleri = kapsam();
    return (D.al().isyerleri || []).filter(function (isyeri) {
      return isyeri && kapsamIdleri.indexOf(isyeri.id) >= 0;
    }).map(function (isyeri) {
      var durum = onayDurumu(isyeri.id);
      durum.kurumId = isyeri.kurumId || '';
      return durum;
    }).filter(function (durum) {
      return durum.mod === 'eksik' || durum.mod === 'uzman-yok';
    });
  }

  /* Yarım kalan karar kilidi kuyruğu sonsuza dek tutamasın: sekme kapanır ya da
     cihaz donarsa "uygulaniyor"da kalan talep ne onaylanabilir ne reddedilebilir;
     5 dakikadan eski kilit kendiliğinden çözülmüş sayılır. */
  function bayatKilCoz() {
    var simdi = Date.now();
    (D.al().talepler || []).forEach(function (talep) {
      if (talep.durum !== 'uygulaniyor') { return; }
      var zaman = Date.parse(talep.durumTarihi || '');
      if (isNaN(zaman) || simdi - zaman > 5 * 60 * 1000) { D.talepDurum(talep.id, 'bekliyor'); }
    });
  }

  /* Görünür talepler:
       - yönetici → tüm kuyruk (karar verebilir)
       - OSGB müdürü (salt okunur kurum denetçisi) → kurumundaki tüm talepler
       - diğerleri → kendi talepleri + onay yetkilisi olduğu talepler
     Karar hakkı ayrıca `onayYetkisi()` ile son kapıda sınanır. */
  function talepler(hepsi) {
    var o = oturum();
    if (!o) { return []; }
    bayatKilCoz();
    var liste = D.al().talepler || [];
    var rol = rolTanimi(o.rol);
    if (rol.kurumKapsami && !rol.onaylar) {
      var kurumIdleri = kapsam();
      return liste.filter(function (talep) {
        return kurumIdleri.indexOf(talep.isyeriId) > -1;
      });
    }
    if (!rol.onaylar) {
      return liste.filter(function (talep) {
        if (talep.kullaniciId === o.kullaniciId) { return true; }
        return onayYetkisi(talep);
      });
    }
    if (hepsi) { return liste.slice(); }
    return liste.filter(function (talep) { return talep.durum === 'bekliyor'; });
  }

  function bekleyenSayisi() {
    var o = oturum();
    if (!o) { return 0; }
    return talepler().filter(function (talep) { return talep.durum === 'bekliyor'; }).length;
  }

  /* Talebin kaydettiği eylemi yönetici kararından sonra asil depo üzerinden
     çalıştırır. Eylem bulunamazsa ya da hata verirse onay tamamlanmaz; böylece
     "onaylandı" görünen ama veriye yazmamış talep kalmaz. */
  function talepUygula(talep) {
    if (!talep || !talep.eylem || !talep.eylem.ad) {
      throw new Error('Talebin uygulanacak eylemi bulunamadı; talep uygulanmadı.');
    }
    var asil = orijinal[talep.eylem.ad] || D[talep.eylem.ad];
    if (typeof asil !== 'function') {
      throw new Error('Talebin eylemi depoda tanımlı değil: ' + talep.eylem.ad);
    }
    var sonuc = asil.apply(D, talep.eylem.args || []);
    return (sonuc && typeof sonuc === 'object') ? kopyala(sonuc) : true;
  }

  /* Eski/yeni kayıt karşılaştırması. Depodaki kayitEsit() anahtar sırasını ve
     eşitleme damgasını yok sayar; düz JSON.stringify, buluta gidip gelen ya da
     başka bir yazımla damgası tazedelenen kaydı "değişmiş" sayar ve talep
     hiçbir cihazda onaylanamaz hâle gelirdi. Eski depo sürümlerine karşı
     fallback olarak metin karşılaştırması korunur. */
  function kayitDegisti(guncel, eskiKayit) {
    if (typeof D.kayitEsit === 'function') { return !D.kayitEsit(guncel, eskiKayit); }
    return JSON.stringify(guncel) !== JSON.stringify(eskiKayit);
  }

  /* Kayıt sürüm denetimi: talep oluşturulduktan sonra kayıt başka bir kullanıcı
     tarafından değiştirildiyse kullanıcı UYARILIR ama onay ENGELLENMEZ — onaylanan
     istek her hâlükârda uygulanır (talep sahibi kimin değerinin geçerli olduğunu
     kendisi karar verir). Uyarı hem karar notuna hem denetim kaydına işlenir;
     böylece üzerine yazılan değişiklik sonradan izlenebilir. Eylemin kendisi hata
     verirse (kayıt bulunamazsa vb.) onay tamamlanmaz; bu durumda depo katmanı
     'Kayıt bulunamadı' gibi kendi hatasını verir. */
  function surumDenetle(talep) {
    if (!talep) { return ''; }
    var ad = (talep.eylem && talep.eylem.ad) || '';
    var DEGISTI = 'Kayıt talep oluşturulduktan sonra değişmiş; onay yine de uygulandı ve talepteki değerler ' +
      'yazıldı. Kaydı açılan ekrandan kontrol edin.';
    if (ISYERI_TOPLU_EYLEMLER[ad]) {
      /* Tek hedef kaydı olmayan toplu eylem: yalnızca işyeri denetlenir. */
      return isyeriVar(talep.isyeriId) ? '' : 'İşyeri artık bulunmuyor; uygulama adımı kayıt bulamayabilir.';
    }
    var isyeriListe = ISYERI_KAYIT_EYLEMLERI[ad] || '';
    if (isyeriListe) {
      if (ISYERI_YERINDE_EYLEMLER[ad]) { return ''; }
      var guncelIsyeri = isyeriKayitBul(isyeriListe, talep.kayitId);
      if (talep.islemTuru === 'ekle') {
        return guncelIsyeri ? 'Kayıt bu arada oluşturulmuş; onaylanan istek onun üzerine yazılacak.' : '';
      }
      if (!guncelIsyeri) { return 'Kayıt artık bulunmuyor; uygulama adımı hiçbir şey yazmayabilir.'; }
      if (!talep.eskiKayit) { return ''; }
      return kayitDegisti(guncelIsyeri, talep.eskiKayit) ? DEGISTI : '';
    }
    if (!talep.kayitId) { return ''; }
    var guncel = kayitBul(talep.kayitId);
    if (talep.islemTuru === 'ekle') {
      return guncel ? 'Aynı kayıt bu arada oluşturulmuş; onaylanan istek ikinci bir kayıt olarak eklenebilir.' : '';
    }
    if (!guncel) { return 'Kayıt artık bulunmuyor; uygulama adımı hiçbir şey yazmayabilir.'; }
    if (!talep.eskiKayit) { return ''; }
    return kayitDegisti(guncel, talep.eskiKayit) ? DEGISTI : '';
  }

  function talepOnayla(id, not) {
    var o = oturum();
    if (!o) { throw new Error('Talepleri onaylama yetkiniz yok.'); }
    bayatKilCoz();
    var talep = D.talepBul(id);
    if (!talep) { throw new Error('Talep bulunamadı.'); }
    /* Kullanıcı kendi talebini onaylayamaz (yönetici olsa bile). Kontrol,
       onay yetkisi süzgecinden önce yapılır ki hata mesajı nedeni açıkça söylesin. */
    if (talep.kullaniciId && talep.kullaniciId === o.kullaniciId) {
      throw new Error('Kendi oluşturduğunuz talebi onaylayamazsınız; başka bir onay yetkilisi karar vermeli.');
    }
    if (!onayYetkisi(talep)) { throw new Error('Talepleri onaylama yetkiniz yok.'); }
    if (talep.durum !== 'bekliyor') { throw new Error('Bu talep zaten karara bağlanmış.'); }
    var uyari = surumDenetle(talep);
    /* Aynı talebin iki kez uygulanmasını engelleyen kilit. Uygulama hata verirse
       talep yeniden "bekliyor" durumuna döner; yarım kalan kayıt onaylanmış sayılmaz. */
    D.talepDurum(id, 'uygulaniyor');
    try {
      talepUygula(talep);
    } catch (hata) {
      D.talepDurum(id, 'bekliyor');
      throw hata;
    }
    /* Uyarı karar notuna işlenir: üzerine yazılan kayıtta "kimin değeri ezildi"
       sonradan okunabilsin. */
    var kararNotu = [not || '', uyari ? 'UYARI: ' + uyari : ''].filter(function (parca) { return parca; }).join(' — ');
    var sonuc = D.talepKarar(id, 'onaylandi', o.adSoyad, kararNotu, o.kullaniciId);
    D.denetimEkle({
      tur: 'onay', islem: 'talepOnayla', kullaniciId: o.kullaniciId, kullaniciAd: o.adSoyad,
      isyeriId: talep.isyeriId, kayitId: talep.kayitId || '',
      ozet: 'Onaylandı: ' + (talep.etiket || '') + ' · ' + (talep.ozet || '') +
        (uyari ? ' · UYARI: ' + uyari : '')
    });
    if (sonuc && typeof sonuc === 'object') { sonuc.uyari = uyari; }
    return sonuc;
  }

  function talepReddet(id, not) {
    var o = oturum();
    if (!o) { throw new Error('Talepleri reddetme yetkiniz yok.'); }
    bayatKilCoz();
    var talep = D.talepBul(id);
    if (!talep) { throw new Error('Talep bulunamadı.'); }
    /* Kendi talebini geri çekmek serbesttir; başkasının talebini reddetmek
       onay yetkisi ister. */
    var kendiTalebi = !!talep.kullaniciId && talep.kullaniciId === o.kullaniciId;
    if (!kendiTalebi && !onayYetkisi(talep)) { throw new Error('Talepleri reddetme yetkiniz yok.'); }
    if (talep.durum !== 'bekliyor') { throw new Error('Bu talep zaten karara bağlanmış.'); }
    var sonuc = D.talepKarar(id, 'reddedildi', o.adSoyad, not, o.kullaniciId);
    D.denetimEkle({
      tur: 'ret', islem: 'talepReddet', kullaniciId: o.kullaniciId, kullaniciAd: o.adSoyad,
      isyeriId: talep.isyeriId, kayitId: talep.kayitId || '',
      ozet: 'Reddedildi: ' + (talep.etiket || '') + ' · ' + (talep.ozet || '')
    });
    return sonuc;
  }

  function denetimListe() {
    var o = oturum();
    if (!o) { return []; }
    var kayitlar = D.al().denetim || [];
    if (rolTanimi(o.rol).yonetir) { return kayitlar.slice(); }
    return kayitlar.filter(function (kayit) { return kayit.kullaniciId === o.kullaniciId; });
  }

  /* ---------- Koruma kurulumu ---------- */

  var orijinal = {};

  /* Kullanıcı yönetimi işlemlerinde etkilenen kayıt denetim özetine işlenir;
     böylece kimin kimi eklediği/güncellediği/sildiği sonradan incelenebilir. */
  function hedefKullanici(ad, args) {
    if (ad !== 'kullaniciKaydet' && ad !== 'kullaniciSil') { return null; }
    var ilk = args[0];
    if (!ilk) { return null; }
    if (typeof ilk !== 'object') { ilk = { id: String(ilk) }; }
    var arama = String(ilk.id || ilk.eposta || '');
    if (arama) {
      var kullanicilar = (D.al().kullanicilar || []);
      for (var i = 0; i < kullanicilar.length; i += 1) {
        if (String(kullanicilar[i].id) === arama || String(kullanicilar[i].eposta) === arama) {
          return kullanicilar[i];
        }
      }
    }
    return ilk.adSoyad || ilk.eposta ? ilk : null;
  }

  function denetimYaz(ad, args, o, hedef) {
    var etiket = ETIKETLER[ad] || ad;
    var kayit = {
      tur: 'yazma', islem: ad, kullaniciId: o.kullaniciId, kullaniciAd: o.adSoyad,
      isyeriId: hedefIsyeri(ad, args), ozet: etiket + ' kaydedildi'
    };
    if (hedef) {
      kayit.hedefKullanici = hedef.id || '';
      kayit.hedefAd = hedef.adSoyad || '';
      kayit.hedefEposta = hedef.eposta || '';
      kayit.ozet = etiket + ': ' + (hedef.adSoyad || '-') + ' (' + (hedef.eposta || '-') + ')';
    }
    D.denetimEkle(kayit);
  }

  /* Şifre sıfırlama gibi oturum öncesi meşru işlemler için korumasız erişim. */
  function korunmasiz(ad) {
    var asil = orijinal[ad] || D[ad];
    if (typeof asil !== 'function') { throw new Error('Bilinmeyen depo işlemi: ' + ad); }
    return function () { return asil.apply(D, arguments); };
  }

  var ADMIN_KORUMA = ['isyeriKaydet', 'isyeriSil', 'kullaniciKaydet', 'kullaniciSil',
    'ayarKaydet', 'sifirla', 'iceAktar', 'kurumKaydet', 'kurumSil'];

  ADMIN_KORUMA.forEach(function (ad) {
    var asil = D[ad];
    if (typeof asil !== 'function') { return; }
    orijinal[ad] = asil;
    D[ad] = function () {
      var args = Array.prototype.slice.call(arguments);
      var o = oturum();
      if (!o) { throw new Error('Oturum bulunamadı, lütfen yeniden giriş yapın.'); }
      if (!rolTanimi(o.rol).yonetir) { throw new Error('Bu işlem yalnızca yöneticilere açıktır.'); }
      var hedef = hedefKullanici(ad, args);
      var sonuc = asil.apply(D, args);
      denetimYaz(ad, args, o, hedef || hedefKullanici(ad, args));
      return sonuc;
    };
  });

  YAZMA_ISLEMLERI.forEach(function (ad) {
    var asil = D[ad];
    if (typeof asil !== 'function') { return; }
    orijinal[ad] = asil;
    D[ad] = function () {
      var args = Array.prototype.slice.call(arguments);
      var o = oturum();
      if (!o) { throw new Error('Oturum bulunamadı, lütfen yeniden giriş yapın.'); }
      var rol = rolTanimi(o.rol);
      if (rol.dogrudanYazar) {
        var sonuc = asil.apply(D, args);
        denetimYaz(ad, args, o);
        return sonuc;
      }
      if (rol.id !== 'yetkili') {
        throw new Error(rol.saltOkunur
          ? 'Salt okunur hesap kayıt değiştiremez.'
          : 'Görüntüleyici hesabıyla kayıt değiştirilemez.');
      }
      var isyeriId = hedefIsyeri(ad, args);
      if (!isyeriId) {
        throw new Error('Kaydın işyeri belirlenemedi, işlem onaya gönderilemedi.');
      }
      /* Yazma yolu tek karar noktasından geçer: tek uzmanlı işyerinde kayıt
         doğrudan yazılır, çok uzmanlı işyerinde onaya gider, uygun sınıfta
         onay yetkilisi yoksa talep "yetkili eksik" durumunda bekler. */
      var mod = yazmaModu(isyeriId);
      if (mod === 'red') { throw new Error('Bu işyerinde kayıt değiştirme yetkiniz yok.'); }
      if (mod === 'kapsam-disi') { throw new Error('Bu işyeri yetki kapsamınızda değil.'); }
      if (mod === 'dogrudan') {
        var yazilan = asil.apply(D, args);
        denetimYaz(ad, args, o);
        return yazilan;
      }
      return talepYaz(ad, args, isyeriId, o, mod === 'eksik' ? { yetkiDurumu: 'eksik' } : null);
    };
  });


  /* ---------- Sağlık verileri erişim kontrolü ---------- */
  /* Yalnızca yönetici ve işyeri hekimi/yetkili (işyeri kapsamında) sağlık kayıtlarını
     oluşturabilir/silerebilir. Görüntüleyici erişemez. */
  var SAGLIK_ISLEMLERI = ['saglikTakipKaydet', 'saglikTakipSil'];
  SAGLIK_ISLEMLERI.forEach(function (ad) {
    var asil = D[ad];
    if (typeof asil !== 'function') { return; }
    orijinal[ad] = asil;
    D[ad] = function () {
      var args = Array.prototype.slice.call(arguments);
      var o = oturum();
      if (!o) { throw new Error('Oturum bulunamadı, lütfen yeniden giriş yapın.'); }
      var rol = rolTanimi(o.rol);
      if (rol.id !== 'yonetici' && rol.id !== 'yetkili') {
        throw new Error('Sağlık kayıtlarına yalnızca yönetici ve işyeri hekimi/yetkili erişebilir.');
      }
      if (rol.id === 'yetkili') {
        var isyeriId = (args && args[0] && args[0].isyeriId) || '';
        if (!isyeriId) { throw new Error('İşyeri belirlenemedi.'); }
        if (o.isyerleri.indexOf(isyeriId) < 0) { throw new Error('Bu işyeri yetki kapsamınızda değil.'); }
      }
      var sonuc = asil.apply(D, args);
      denetimYaz(ad, args, o);
      return sonuc;
    };
  });
  ISG.yetki = {
    ROLLER: ROLLER,
    rolCoz: rolCoz,
    rolTanimi: rolTanimi,
    oturum: oturum,
    oturumAc: oturumAc,
    oturumKapat: oturumKapat,
    kapsam: kapsam,
    kapsamda: kapsamda,
    kapsamliVeri: kapsamliVeri,
    gorunum: function () { return kapsamliVeri(D.al()); },
    izin: izin,
    degistirebilir: degistirebilir,
    onayModeli: onayModeli,
    onayEsigi: onayEsigi,
    onayDurumu: onayDurumu,
    onayYetkisi: onayYetkisi,
    onaylayiciMi: onaylayiciMi,
    yazmaModu: yazmaModu,
    isyeriUzmanlari: isyeriUzmanlari,
    yetkiliEksikListe: yetkiliEksikListe,
    talepler: talepler,
    bekleyenSayisi: bekleyenSayisi,
    talepOnayla: talepOnayla,
    talepReddet: talepReddet,
    denetimListe: denetimListe,
    korunmasiz: korunmasiz,
    etiket: function (ad) { return ETIKETLER[ad] || ad; }
  };
})(window);
