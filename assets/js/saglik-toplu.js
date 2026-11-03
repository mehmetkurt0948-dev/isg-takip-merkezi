/* İSG Takip Merkezi — sağlık kayıtları toplu içe/dışa aktarma
   Excel satırlarını tek bir standart sütun tanımına eşler, kişiyi önce Sicil No
   sonra Ad Soyad ile bulur, satır satır doğrular ve mükerrer kayıtları ayıklar.
   Yazma yalnızca kullanıcı onayından sonra ISG.saglikTakip.kaydet ile yapılır;
   böylece hassas alanların şifrelenmesi ve yetki denetimi korunur.

   Saf mantıktır: arayüz ögesi okumaz. Hem ekrandan hem testlerden aynı kurallarla
   çalışır (personel-toplu.js / plan-toplu.js kalıbı). */
(function (global) {
  'use strict';

  var ISG = global.ISG = global.ISG || {};

  /* işyeriId sütunu bilinçli olarak yok: kayıt her zaman kişinin kendi
     işyerine yazılır, böylece işyerleri arasında veri karışmaz. */
  var SUTUNLAR = [
    {
      alan: 'sicil', baslik: 'Sicil No', genislik: 14,
      esler: ['sicil no', 'sicil', 'sicil numarasi', 'personel sicil no', 'kurum sicil no'],
      ipucu: 'Personel listesindeki sicil ile aynı olmalı. Boşsa Ad Soyad ile eşleştirilir.'
    },
    {
      alan: 'adSoyad', baslik: 'Ad Soyad', genislik: 26,
      esler: ['ad soyad', 'adi soyadi', 'adsoyad', 'isim', 'personel adi'],
      ipucu: 'Sicil bulunamazsa eşleştirme bu sütunla yapılır; aynı ad birden çok kişide varsa satır hata verir.'
    },
    {
      alan: 'tarih', baslik: 'Muayene Tarihi', genislik: 16, tur: 'tarih', zorunlu: true,
      esler: ['muayene tarihi', 'tarih', 'muayene gunu', 'muayene tarih'],
      ipucu: 'Zorunlu. YYYY-AA-GG veya GG.AA.YYYY yazın; Excel tarih hücresi de okunur.'
    },
    {
      alan: 'doktor', baslik: 'Muayene Eden Hekim', genislik: 26,
      esler: ['muayene eden hekim', 'isyeri hekimi', 'hekim', 'doktor'],
      ipucu: 'Serbest metin.'
    },
    {
      alan: 'sonMuayene', baslik: 'Muayene Sonucu', genislik: 32,
      esler: ['muayene sonucu', 'sonuc', 'son muayene', 'sonuc aciklamasi'],
      ipucu: 'Örn. "ÇALIŞMASI UYGUNDUR" veya kısıt açıklaması.'
    },
    {
      alan: 'sevkEdilen', baslik: 'Sevk Edilen', genislik: 30,
      esler: ['sevk edilen', 'sevk', 'sevk edilen hastane', 'sevk edilen bolum'],
      ipucu: 'Sevk varsa hastane ve bölüm yazılır; boşsa kayıt sevkli sayılmaz.'
    },
    {
      alan: 'calismaYasagi', baslik: 'Çalışma Yasağı', genislik: 28,
      esler: ['calisma yasagi', 'calisma yasagi onerisi', 'yasak', 'calisma kisiti'],
      ipucu: 'Doluysa kayıt "YASAK VAR" olarak izlenir.'
    },
    {
      alan: 'izinsizlik', baslik: 'İzinsizlik Günü', genislik: 14, tur: 'sayi',
      esler: ['izinsizlik gunu', 'izinsizlik', 'rapor gunu', 'istirahat gunu', 'kayip gun'],
      ipucu: 'Tam sayı. Boşsa 0 yazılır.'
    },
    {
      alan: 'calismaSesi', baslik: 'Çalışma Şekli', genislik: 15,
      esler: ['calisma sekli', 'calisma sesi', 'calisma tipi', 'gorev yeri'],
      ipucu: 'saha / büro / karışık. Tanınmayan değer boş bırakılır.'
    },
    {
      alan: 'kanGrubu', baslik: 'Kan Grubu', genislik: 12,
      esler: ['kan grubu', 'kan'],
      ipucu: 'Gizli alan; cihazda şifreli saklanır.'
    },
    {
      alan: 'alerji', baslik: 'Alerjiler', genislik: 26,
      esler: ['alerji', 'alerjiler'],
      ipucu: 'Gizli alan; cihazda şifreli saklanır.'
    },
    {
      alan: 'kronikHastalik', baslik: 'Kronik Hastalıklar', genislik: 26,
      esler: ['kronik hastalik', 'kronik hastaliklar', 'kronik'],
      ipucu: 'Gizli alan; cihazda şifreli saklanır.'
    },
    {
      alan: 'ilac', baslik: 'Kullanılan İlaçlar', genislik: 26,
      esler: ['kullanilan ilac', 'kullanilan ilaclar', 'ilac', 'ilaclar'],
      ipucu: 'Gizli alan; cihazda şifreli saklanır.'
    },
    {
      alan: 'engelDurumu', baslik: 'Engel Durumu', genislik: 20,
      esler: ['engel durumu', 'engel', 'engelli'],
      ipucu: 'Gizli alan; cihazda şifreli saklanır.'
    },
    {
      alan: 'notlar', baslik: 'Notlar', genislik: 32,
      esler: ['notlar', 'not', 'aciklama'],
      ipucu: 'Gizli alan; cihazda şifreli saklanır.'
    }
  ];

  var BASLIKLAR = SUTUNLAR.map(function (sutun) { return sutun.baslik; });
  var ORNEK_KAYIT = ['12345', 'Örnek Personel', '2026-01-15', 'Dr. Selin Arı',
    'ÇALIŞMASI UYGUNDUR', '', '', '0', 'saha', 'A Rh+', '', '', '', '', ''];

  /* Türkçe duyarlı normalizasyon: başlık ve ad eşleştirmesinde kullanılır. */
  function norm(metin) {
    return String(metin === null || typeof metin === 'undefined' ? '' : metin)
      .toLocaleLowerCase('tr-TR')
      .replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ğ/g, 'g')
      .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  /* Yıl bloklu başlıklar ("2025 MUAYENE TARİHİ") ve parantezli ekler
     ("Sicil No (zorunlu)") aynı sütuna düşsün diye baştan yıl, sondan
     parantez içi atılır. */
  function baslikNorm(metin) {
    return norm(String(metin === null || typeof metin === 'undefined' ? '' : metin)
      .replace(/^\s*\d{4}\s*/, '')
      .replace(/\([^)]*\)/g, ' '));
  }

  function hucre(satir, indeks) {
    if (!satir || typeof indeks !== 'number' || indeks < 0) { return ''; }
    var deger = satir[indeks];
    return String(deger === null || typeof deger === 'undefined' ? '' : deger).trim();
  }

  function bosSatir(satir) {
    return !(satir || []).some(function (hucreDegeri) {
      return String(hucreDegeri === null || typeof hucreDegeri === 'undefined' ? '' : hucreDegeri).trim();
    });
  }

  /* Başlık satırını bulur: en az "tarih" ve bir kimlik sütunu (sicil/ad) eşleşmeli.
     Dönen değer: { satirIndeksi, alanlar: { alan: sütunIndeksi } } veya null. */
  function haritaBul(satirlar) {
    var liste = satirlar || [];
    for (var i = 0; i < Math.min(liste.length, 25); i += 1) {
      var satir = liste[i] || [];
      var alanlar = {};
      for (var j = 0; j < satir.length; j += 1) {
        var anahtar = baslikNorm(satir[j]);
        if (!anahtar) { continue; }
        for (var k = 0; k < SUTUNLAR.length; k += 1) {
          var sutun = SUTUNLAR[k];
          if (typeof alanlar[sutun.alan] === 'number') { continue; }
          var eslesme = false;
          for (var e = 0; e < sutun.esler.length; e += 1) {
            if (anahtar === norm(sutun.esler[e])) { eslesme = true; break; }
          }
          if (!eslesme) {
            for (var e2 = 0; e2 < sutun.esler.length; e2 += 1) {
              var es2 = norm(sutun.esler[e2]);
              if (es2.length > 6 && (anahtar.indexOf(es2) >= 0 || es2.indexOf(anahtar) >= 0)) { eslesme = true; break; }
            }
          }
          if (eslesme) { alanlar[sutun.alan] = j; break; }
        }
      }
      if (typeof alanlar.tarih === 'number' &&
        (typeof alanlar.sicil === 'number' || typeof alanlar.adSoyad === 'number')) {
        return { satirIndeksi: i, alanlar: alanlar };
      }
    }
    return null;
  }

  function tarihCoz(deger) {
    var metin = String(deger === null || typeof deger === 'undefined' ? '' : deger).trim();
    if (!metin) { return ''; }
    if (ISG.excel && typeof ISG.excel.tariheCevir === 'function') {
      var cevrilen = ISG.excel.tariheCevir(metin);
      if (cevrilen) { return cevrilen; }
    }
    var iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(metin);
    if (iso) {
      return iso[1] + '-' + ('0' + iso[2]).slice(-2) + '-' + ('0' + iso[3]).slice(-2);
    }
    return '';
  }

  function calismaSesiCoz(deger) {
    var anahtar = norm(deger);
    if (!anahtar) { return ''; }
    if (anahtar.indexOf('saha') >= 0 || anahtar.indexOf('arazi') >= 0) { return 'saha'; }
    if (anahtar.indexOf('buro') >= 0 || anahtar.indexOf('ofis') >= 0 || anahtar.indexOf('masa') >= 0) { return 'buro'; }
    if (anahtar.indexOf('karisik') >= 0 || anahtar.indexOf('karma') >= 0) { return 'karisik'; }
    return '';
  }

  /* Kişi dizini: aynı sicil/ad birden çok kişide görülürse eşleştirme hata verir
     (yanlış kişiye sağlık kaydı yazmak, kaydı hiç yazmamaktan daha kötüdür). */
  function kisiDizini(veri) {
    var dizin = { sicil: {}, ad: {} };
    ((veri && veri.personel) || []).forEach(function (kisi) {
      if (!kisi || !kisi.id) { return; }
      var sicil = norm(kisi.sicil);
      var ad = norm(kisi.adSoyad);
      if (sicil) { (dizin.sicil[sicil] = dizin.sicil[sicil] || []).push(kisi); }
      if (ad) { (dizin.ad[ad] = dizin.ad[ad] || []).push(kisi); }
    });
    return dizin;
  }

  function kisiBul(dizin, sicil, adSoyad) {
    var s = norm(sicil);
    var a = norm(adSoyad);
    if (s && dizin.sicil[s]) {
      if (dizin.sicil[s].length === 1) { return { kisi: dizin.sicil[s][0] }; }
      return { hata: 'Aynı sicil (' + sicil + ') birden çok personelde kayıtlı; sicil düzeltilmeli.' };
    }
    if (a && dizin.ad[a]) {
      if (dizin.ad[a].length === 1) { return { kisi: dizin.ad[a][0] }; }
      return { hata: 'Aynı ad soyad (' + adSoyad + ') birden çok personelde kayıtlı; sicil no yazın.' };
    }
    return { hata: 'Personel bulunamadı (sicil: ' + (sicil || '—') + ', ad: ' + (adSoyad || '—') + ').' };
  }

  /* Ham Excel satırlarını analiz eder; hiçbir kayıt yazmaz.
     secenekler: { mevcut: [çözülmüş sağlık kayıtları], veri: { personel: [] } } */
  function analizEt(satirlar, secenekler) {
    var ayalar = secenekler || {};
    var veri = ayalar.veri || (ISG.depo && ISG.depo.al ? ISG.depo.al() : { personel: [] });
    var dizin = kisiDizini(veri);
    var harita = haritaBul(satirlar);
    var sonuc = {
      satirlar: [],
      ozet: { dosyaSatir: 0, hazir: 0, mukerrer: 0, hatali: 0, atlanan: 0 },
      uyarilar: [],
      hata: ''
    };
    if (!harita) {
      sonuc.hata = 'Başlık satırı bulunamadı. Şablonu indirip "Muayene Tarihi" ve "Sicil No" sütunlarını koruyun.';
      return sonuc;
    }
    var alanlar = harita.alanlar;
    var mevcutAnahtar = {};
    var mevcut = ayalar.mevcut;
    if (!mevcut && ISG.saglikTakip && ISG.saglikTakip.listele) {
      try { mevcut = ISG.saglikTakip.listele('', ''); } catch (hata) { mevcut = []; }
    }
    (mevcut || []).forEach(function (kayit) {
      if (kayit && kayit.personelId && kayit.tarih) { mevcutAnahtar[kayit.personelId + '|' + kayit.tarih] = true; }
    });
    var dosyaAnahtar = {};

    for (var i = harita.satirIndeksi + 1; i < (satirlar || []).length; i += 1) {
      var satir = satirlar[i] || [];
      if (bosSatir(satir)) { sonuc.ozet.atlanan += 1; continue; }
      sonuc.ozet.dosyaSatir += 1;
      var sicil = hucre(satir, alanlar.sicil);
      var adSoyad = hucre(satir, alanlar.adSoyad);
      var tarih = tarihCoz(hucre(satir, alanlar.tarih));
      var kayit = {
        personelId: '', isyeriId: '', tarih: tarih,
        doktor: hucre(satir, alanlar.doktor),
        sonMuayene: hucre(satir, alanlar.sonMuayene),
        sevkEdilen: hucre(satir, alanlar.sevkEdilen),
        calismaYasagi: hucre(satir, alanlar.calismaYasagi),
        izinsizlik: Number(String(hucre(satir, alanlar.izinsizlik)).replace(/[^\d-]/g, '')) || 0,
        calismaSesi: calismaSesiCoz(hucre(satir, alanlar.calismaSesi)),
        kanGrubu: hucre(satir, alanlar.kanGrubu),
        alerji: hucre(satir, alanlar.alerji),
        kronikHastalik: hucre(satir, alanlar.kronikHastalik),
        ilac: hucre(satir, alanlar.ilac),
        engelDurumu: hucre(satir, alanlar.engelDurumu),
        notlar: hucre(satir, alanlar.notlar)
      };
      var kayitSatiri = {
        satirNo: i + 1, durum: 'hazir', mesaj: '',
        kisiAd: adSoyad, sicil: sicil, kayit: kayit
      };

      var eslesme = kisiBul(dizin, sicil, adSoyad);
      if (eslesme.hata) {
        kayitSatiri.durum = 'hata';
        kayitSatiri.mesaj = eslesme.hata;
      } else if (!tarih) {
        kayitSatiri.durum = 'hata';
        kayitSatiri.mesaj = 'Muayene tarihi okunamadı (YYYY-AA-GG veya GG.AA.YYYY yazın).';
        kayitSatiri.kisiAd = eslesme.kisi.adSoyad || adSoyad;
      } else {
        kayit.personelId = eslesme.kisi.id;
        kayit.isyeriId = eslesme.kisi.isyeriId || '';
        kayit.personelAd = eslesme.kisi.adSoyad || '';
        kayit.personelSicil = eslesme.kisi.sicil || '';
        kayitSatiri.kisiAd = eslesme.kisi.adSoyad || adSoyad;
        kayitSatiri.sicil = eslesme.kisi.sicil || sicil;
        if (!kayit.isyeriId) {
          kayitSatiri.durum = 'hata';
          kayitSatiri.mesaj = 'Personelin işyeri kayıtlı değil; önce personel listesinde işyeri atayın.';
        }
        var anahtar = kayit.personelId + '|' + kayit.tarih;
        if (kayitSatiri.durum === 'hazir' && mevcutAnahtar[anahtar]) {
          kayitSatiri.durum = 'mukerrer';
          kayitSatiri.mesaj = 'Bu personel için aynı tarihte sağlık kaydı zaten var.';
        }
        if (kayitSatiri.durum === 'hazir' && dosyaAnahtar[anahtar]) {
          kayitSatiri.durum = 'mukerrer';
          kayitSatiri.mesaj = 'Aynı personel ve tarih dosyada birden çok satırda geçiyor.';
        }
        dosyaAnahtar[anahtar] = true;
      }

      if (kayitSatiri.durum === 'hata') { sonuc.ozet.hatali += 1; }
      else if (kayitSatiri.durum === 'mukerrer') { sonuc.ozet.mukerrer += 1; }
      else { sonuc.ozet.hazir += 1; }
      sonuc.satirlar.push(kayitSatiri);
    }

    if (!sonuc.ozet.dosyaSatir) {
      sonuc.hata = 'Dosyada başlık altında veri satırı bulunamadı.';
    } else if (!sonuc.ozet.hazir) {
      sonuc.uyarilar.push('Kaydedilecek satır yok: mükerrer ve hatalı satırları dosyada düzeltip yeniden yükleyin.');
    }
    return sonuc;
  }

  /* Yalnızca kullanıcı onayından sonra çağrılır; her kayıt kaydet() üzerinden
     geçtiği için şifreleme ve yetki denetimi atlanmaz. */
  function uygula(analiz) {
    var sonuc = { eklenen: 0, hatali: 0, hatalar: [] };
    var liste = (analiz && analiz.satirlar) || [];
    liste.forEach(function (satir) {
      if (!satir || satir.durum !== 'hazir') { return; }
      try {
        var kopya = {};
        Object.keys(satir.kayit || {}).forEach(function (alan) { kopya[alan] = satir.kayit[alan]; });
        ISG.saglikTakip.kaydet(kopya);
        sonuc.eklenen += 1;
      } catch (hata) {
        sonuc.hatali += 1;
        if (sonuc.hatalar.length < 20) {
          sonuc.hatalar.push('Satır ' + satir.satirNo + ': ' + ((hata && hata.message) || 'kaydedilemedi'));
        }
      }
    });
    return sonuc;
  }

  /* Ön izleme listesi: hatalı ve mükerrer satırlar önce görünür. */
  function onizlemeSatirlari(analiz, sinir) {
    var liste = (analiz && analiz.satirlar) || [];
    var ust = typeof sinir === 'number' ? sinir : 150;
    var oncelik = { hata: 0, mukerrer: 1, hazir: 2 };
    var sirali = liste.slice().sort(function (a, b) {
      var fark = (oncelik[a.durum] || 9) - (oncelik[b.durum] || 9);
      return fark !== 0 ? fark : a.satirNo - b.satirNo;
    });
    return { goruntulenecek: sirali.slice(0, ust), toplam: sirali.length };
  }

  /* ---------- Standart şablon ---------- */

  function sablonSayfalar() {
    var kilavuz = SUTUNLAR.map(function (sutun) {
      return [sutun.baslik, sutun.zorunlu ? 'Zorunlu' : 'İsteğe bağlı', sutun.ipucu];
    });
    kilavuz.push(['İşyeri', 'Kullanılmaz',
      'Dosyada "İşyeri" sütunu olsa bile okunmaz; kayıt kişinin kendi işyerine yazılır.']);
    kilavuz.push(['Mükerrer kayıt', 'Kural',
      'Aynı personel için aynı muayene tarihi ikinci kez kaydedilmez; ön izlemede "Mükerrer" olarak raporlanır.']);
    kilavuz.push(['Örnek satır', 'Kural',
      '"Sağlık Kayıtları" sayfasının ikinci satırı biçimi gösterir; yüklerken otomatik atlanır.']);
    kilavuz.push(['Yükleme', 'Adım',
      'Sağlık Takibi → Excel\'den yükle → dosyayı seçin → ön izlemeyi kontrol edin → "Kaydedilecekleri ekle".']);
    kilavuz.push(['Gizlilik', 'Kural',
      'Yüklenen sağlık alanları bu cihazın korumalı sağlık kasasında şifreli saklanır; genel bulut eşitlemesine eklenmez.']);
    return [{
      ad: 'Sağlık Kayıtları',
      basliklar: BASLIKLAR,
      satirlar: [ORNEK_KAYIT.slice()],
      genislikler: SUTUNLAR.map(function (sutun) { return sutun.genislik; })
    }, {
      ad: 'Kılavuz',
      basliklar: ['Sütun', 'Zorunluluk', 'Biçim ve kural'],
      satirlar: kilavuz,
      genislikler: [24, 16, 96]
    }];
  }

  function sablonIndir(dosyaAdi) {
    if (!ISG.excel || typeof ISG.excel.indir !== 'function') {
      throw new Error('Excel modülü yüklenmediği için şablon indirilemedi.');
    }
    ISG.excel.indir(dosyaAdi || 'Saglik-Kayitlari-Sablonu.xlsx', sablonSayfalar());
    return true;
  }

  /* ---------- Dışa aktarma ---------- */

  function disaAktarSatirlari(liste, personel) {
    var kisiInd = {};
    (personel || []).forEach(function (kisi) { if (kisi && kisi.id) { kisiInd[kisi.id] = kisi; } });
    var satirlar = (liste || []).map(function (kayit) {
      var kisi = kisiInd[kayit.personelId];
      return [
        kisi ? (kisi.sicil || '') : (kayit.personelSicil || ''),
        kisi ? (kisi.adSoyad || '') : (kayit.personelAd || ''),
        kayit.tarih || '', kayit.doktor || '', kayit.sonMuayene || '',
        kayit.sevkEdilen || '', kayit.calismaYasagi || '',
        Number(kayit.izinsizlik) || 0, kayit.calismaSesi || '', kayit.kanGrubu || '',
        kayit.alerji || '', kayit.kronikHastalik || '', kayit.ilac || '',
        kayit.engelDurumu || '', kayit.notlar || '',
        kayit.isyeriAd || (kisi ? '' : (kayit.isyeriId || ''))
      ];
    });
    return {
      ad: 'Sağlık Kayıtları',
      basliklar: BASLIKLAR.concat(['İşyeri']),
      satirlar: satirlar,
      genislikler: SUTUNLAR.map(function (sutun) { return sutun.genislik; }).concat([24])
    };
  }

  function disaAktarSayfalar(liste, personel) {
    return [disaAktarSatirlari(liste, personel), {
      ad: 'Kılavuz',
      basliklar: ['Sütun', 'Açıklama'],
      satirlar: [
        ['Muayene Tarihi', 'Dosya yeniden yüklenebilir; aynı personel ve tarih mükerrer sayılır.'],
        ['İşyeri', 'Yalnız bilgi amaçlıdır; içe aktarmada okunmaz, kayıt kişinin işyerine yazılır.'],
        ['Gizlilik', 'Bu dosya kişisel sağlık verisi içerir; paylaşımını kurum politikanıza göre sınırlayın.']
      ],
      genislikler: [20, 96]
    }];
  }

  function disaAktar(dosyaAdi, liste, personel) {
    if (!ISG.excel || typeof ISG.excel.indir !== 'function') {
      throw new Error('Excel modülü yüklenmediği için dosya oluşturulamadı.');
    }
    ISG.excel.indir(dosyaAdi || 'Saglik-Kayitlari.xlsx', disaAktarSayfalar(liste, personel));
    return true;
  }

  ISG.saglikToplu = {
    SUTUNLAR: SUTUNLAR,
    BASLIKLAR: BASLIKLAR,
    ORNEK_KAYIT: ORNEK_KAYIT,
    norm: norm,
    baslikNorm: baslikNorm,
    tarihCoz: tarihCoz,
    haritaBul: haritaBul,
    kisiDizini: kisiDizini,
    analizEt: analizEt,
    uygula: uygula,
    onizlemeSatirlari: onizlemeSatirlari,
    sablonSayfalar: sablonSayfalar,
    sablonIndir: sablonIndir,
    disaAktarSayfalar: disaAktarSayfalar,
    disaAktar: disaAktar
  };
})(window);
