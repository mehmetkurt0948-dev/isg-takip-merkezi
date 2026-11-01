/* İSG Takip Merkezi — toplu personel yükleme modülü
   Excel/CSV satırlarını standart şablon sütunlarına eşler, her satırı tek tek
   doğrular, mükerrer kayıtları (önce T.C. Kimlik No, sonra Sicil No) ayıklar ve
   yalnızca kullanıcı onayından sonra depoya yazar. Saf mantıktır: arayüz ögesi
   okumaz, böylece hem arayüzden hem testlerden aynı kurallarla çalışır.

   Standart şablon sütunları (bütün kurum ve iş yerlerinde aynıdır):
   Sicil No · Ad Soyad · T.C. Kimlik No · Mesleği · Departman · Grup Kodu
   Açıklama · Şube · İşe Başlama Tarihi · Kıdem Tarihi · Cep Telefonu · Cinsiyet */
(function (global) {
  'use strict';

  var ISG = global.ISG = global.ISG || {};

  var ZORUNLU_ALAN = 'adSoyad';

  var SUTUNLAR = [
    {
      alan: 'sicil', baslik: 'Sicil No', genislik: 14,
      esler: ['sicil no', 'sicil', 'sicil numarasi', 'personel sicil no', 'kurum sicil no'],
      ipucu: 'Boş bırakılabilir; tekil olması önerilir. Metin biçiminde yazın.'
    },
    {
      alan: 'adSoyad', baslik: 'Ad Soyad', genislik: 26, zorunlu: true,
      esler: ['ad soyad', 'adı soyadı', 'adsoyad', 'adı soyad', 'ad', 'adı', 'isim', 'personel adı'],
      ipucu: 'Zorunlu. Boş olan satır kaydedilmez, hatalı satır olarak raporlanır.'
    },
    {
      alan: 'tc', baslik: 'T.C. Kimlik No', genislik: 15,
      esler: ['t c kimlik no', 'tc kimlik no', 't c no', 'tc no', 'tckn', 'kimlik no', 'tc', 'cumhuriyet kimlik no'],
      ipucu: 'Boş bırakılabilir; doluysa 11 hane olur ve 0 ile başlayamaz. Hücreyi metin biçiminde tutun.'
    },
    {
      alan: 'meslek', baslik: 'Mesleği', genislik: 30,
      esler: ['mesleği', 'meslegi', 'meslek', 'görevi', 'gorev', 'unvan'],
      ipucu: 'Serbest metin.'
    },
    {
      alan: 'departman', baslik: 'Departman', genislik: 30,
      esler: ['departman', 'birim', 'bölüm', 'departman adı'],
      ipucu: 'Serbest metin.'
    },
    {
      alan: 'grupKodu', baslik: 'Grup Kodu Açıklama', genislik: 28,
      esler: ['grup kodu açıklama', 'grup kodu', 'grup', 'grup açıklaması'],
      ipucu: 'Serbest metin.'
    },
    {
      alan: 'sube', baslik: 'Şube', genislik: 16,
      esler: ['şube', 'sube', 'şubesi', 'hizmet birimi'],
      ipucu: 'Serbest metin.'
    },
    {
      alan: 'iseBaslama', baslik: 'İşe Başlama Tarihi', genislik: 18, tur: 'tarih',
      esler: ['işe başlama tarihi', 'işe başlama', 'işe giriş tarihi', 'işe giriş', 'göreve başlama'],
      ipucu: 'YYYY-AA-GG veya GG.AA.YYYY. Excel tarih hücresi de kabul edilir.'
    },
    {
      alan: 'kidemTarihi', baslik: 'Kıdem Tarihi', genislik: 16, tur: 'tarih',
      esler: ['kıdem tarihi', 'kidem tarihi', 'kıdem'],
      ipucu: 'YYYY-AA-GG veya GG.AA.YYYY. Excel tarih hücresi de kabul edilir.'
    },
    {
      alan: 'telefon', baslik: 'Cep Telefonu', genislik: 16,
      esler: ['cep telefonu', 'telefon', 'tel', 'gsm', 'telefon no', 'cepl tel'],
      ipucu: '05xx xxx xx xx biçimi önerilir.'
    },
    {
      alan: 'cinsiyet', baslik: 'Cinsiyet', genislik: 11, tur: 'cinsiyet',
      esler: ['cinsiyet'],
      ipucu: 'Kadın / Erkek (K / E kısaltması da kabul edilir).'
    }
  ];

  /* Dışa aktarılan listelerde bulunan, içe aktarmada kullanılan ek sütun.
     "İşyeri" sütunu bilinçli olarak yok sayılır: kayıtlar her zaman ekranda
     seçilen işyerine yazılır, böylece işyerleri arası veri karışamaz. */
  var EK_SUTUNLAR = [
    { alan: 'durum', baslik: 'Durum', esler: ['durum', 'personel durumu'] }
  ];

  var ORNEK_KAYIT = ['12345', 'Örnek Personel', '12345678901', 'Pres operatörü', 'Üretim',
    '9112.11', 'Merkez', '2024-01-15', '2024-01-15', '0555 123 45 67', 'Erkek'];

  /* ---------- Küçük yardımcılar ---------- */

  function metin(deger) {
    return String(deger === null || typeof deger === 'undefined' ? '' : deger).trim();
  }

  /* Türkçe başlık karşılaştırması: noktalama, İ/I ve boşluk farkları önemsizdir. */
  function norm(deger) {
    var s = String(deger === null || typeof deger === 'undefined' ? '' : deger);
    s = s.replace(/İ/g, 'i').replace(/I/g, 'ı');
    try { s = s.toLocaleLowerCase('tr'); } catch (hata) { s = s.toLowerCase(); }
    return s.replace(/[.,;:_\-/\\()[\]"'’]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function tcknTemiz(deger) {
    var s = metin(deger);
    /* Excel büyük sayıları 1,23457E+10 biçiminde yazabilir. */
    if (/^\d(?:[.,]\d+)?[eE]\+?\d+$/.test(s)) {
      var sayi = Number(s.replace(',', '.'));
      if (isFinite(sayi)) { s = sayi.toFixed(0); }
    }
    return s.replace(/\D/g, '');
  }

  function telefonTemiz(deger) {
    var ham = metin(deger);
    var rakam = ham.replace(/\D/g, '');
    if (!rakam) { return ''; }
    if (ham.charAt(0) === '+' && rakam.length > 11) { rakam = rakam.slice(-11); }
    return rakam.length <= 11 ? rakam : rakam.slice(0, 11);
  }

  function cinsiyetCoz(deger) {
    var s = norm(deger);
    if (!s) { return { deger: '', tanindi: true }; }
    if (s === 'k' || s === 'kadın' || s === 'female' || s === 'f' || s === 'bayan') {
      return { deger: 'Kadın', tanindi: true };
    }
    if (s === 'e' || s === 'erkek' || s === 'male' || s === 'm' || s === 'bay') {
      return { deger: 'Erkek', tanindi: true };
    }
    return { deger: '', tanindi: false };
  }

  function tarihCoz(deger) {
    var ham = metin(deger);
    if (!ham) { return { deger: '', tanindi: true }; }
    var iso = ISG.excel && typeof ISG.excel.tariheCevir === 'function' ?
      ISG.excel.tariheCevir(ham) : '';
    if (!iso && /^\d{4}-\d{1,2}-\d{1,2}$/.test(ham)) {
      var parca = ham.split('-');
      iso = parca[0] + '-' + parca[1].padStart(2, '0') + '-' + parca[2].padStart(2, '0');
    }
    return { deger: iso, tanindi: !!iso };
  }

  /* ---------- Başlık eşleme ---------- */

  /* En az on iki satır taranır: üstte başlık/rapor satırı olan dosyalar da çalışır. */
  function baslikBul(satirlar) {
    var ust = Math.min(satirlar.length, 12);
    for (var h = 0; h < ust; h += 1) {
      var hucreler = (satirlar[h] || []).map(norm);
      var aday = [];
      SUTUNLAR.concat(EK_SUTUNLAR).forEach(function (sutun) {
        for (var i = 0; i < sutun.esler.length; i += 1) {
          if (hucreler.indexOf(sutun.esler[i]) > -1) {
            if (aday.indexOf(sutun.alan) < 0) { aday.push(sutun.alan); }
            break;
          }
        }
      });
      if (aday.indexOf(ZORUNLU_ALAN) > -1) { return { satirNo: h, eslesen: aday }; }
    }
    return null;
  }

  function sutunHaritasi(baslikSatiri) {
    var hucreler = (baslikSatiri || []).map(norm);
    var haritalar = {};
    SUTUNLAR.concat(EK_SUTUNLAR).forEach(function (sutun) {
      for (var i = 0; i < sutun.esler.length; i += 1) {
        var konum = hucreler.indexOf(sutun.esler[i]);
        if (konum > -1 && typeof haritalar[sutun.alan] === 'undefined') {
          haritalar[sutun.alan] = konum;
          break;
        }
      }
    });
    return haritalar;
  }

  function hucreAl(satir, haritalar, alan) {
    var konum = haritalar[alan];
    return typeof konum === 'number' ? metin(satir ? satir[konum] : '') : '';
  }

  /* ---------- Doğrulama ve mükerrer kontrolü ---------- */

  function kisiIndeks(liste, tcHarita, sicilHarita, adHarita) {
    (liste || []).forEach(function (kisi) {
      if (!kisi) { return; }
      var ad = metin(kisi.adSoyad);
      var tc = tcknTemiz(kisi.tc);
      var sicil = metin(kisi.sicil);
      if (tc && !tcHarita[tc]) { tcHarita[tc] = kisi; }
      if (sicil && !sicilHarita[sicil]) { sicilHarita[sicil] = kisi; }
      if (ad && !adHarita[norm(ad)]) { adHarita[norm(ad)] = kisi; }
    });
  }

  function kisiEtiketi(kisi) {
    if (!kisi) { return 'mevcut kayıt'; }
    var parcalar = [metin(kisi.adSoyad) || 'adı boş'];
    if (metin(kisi.sicil)) { parcalar.push('sicil ' + metin(kisi.sicil)); }
    if (metin(kisi.tc)) { parcalar.push('TC ' + metin(kisi.tc)); }
    return parcalar.join(' · ');
  }

  function ornekSatirMi(ham) {
    return norm(ham.adSoyad) === norm(ORNEK_KAYIT[1]) && norm(ham.sicil) === norm(ORNEK_KAYIT[0]);
  }

  /* satirlar: ISG.excel.xlsxOku ya da CSV ayrıştırıcısından gelen ham satırlar.
     secenekler:
       mevcut         → hedef iş yerinin kayıtlı personeli (mükerrer kontrolü bundan yapılır)
       digerIsyerleri → kullanıcının yetki kapsamındaki diğer iş yeri personelleri
                        (yalnızca uyarı üretir; bu listedekilere yazılmaz)
     Dönen: satır satır durum (hazir / mukerrer / hata / ornek) ve sayım özeti. */
  function analizEt(satirlar, secenekler) {
    secenekler = secenekler || {};
    var sonuc = {
      hata: '',
      baslikSatiri: 0,
      haritalar: {},
      eksikSutunlar: [],
      uyarilar: [],
      satirlar: [],
      ozet: { dosyaSatir: 0, veriSatir: 0, hazir: 0, mukerrer: 0, hatali: 0, bos: 0, ornek: 0 }
    };

    if (!satirlar || !satirlar.length) {
      sonuc.hata = 'Dosyada okunabilir satır bulunamadı.';
      return sonuc;
    }
    var baslik = baslikBul(satirlar);
    if (!baslik || baslik.eslesen.indexOf(ZORUNLU_ALAN) < 0) {
      sonuc.hata = 'Başlık satırı bulunamadı. "Ad Soyad" sütunu olan bir satır olmalı; ' +
        'örnek şablonu indirip onu doldurun.';
      return sonuc;
    }
    sonuc.baslikSatiri = baslik.satirNo;
    sonuc.haritalar = sutunHaritasi(satirlar[baslik.satirNo]);

    SUTUNLAR.forEach(function (sutun) {
      if (typeof sonuc.haritalar[sutun.alan] === 'undefined') {
        sonuc.eksikSutunlar.push(sutun.baslik);
      }
    });
    if (sonuc.eksikSutunlar.length) {
      sonuc.uyarilar.push('Şablondaki şu sütunlar dosyada yok: ' + sonuc.eksikSutunlar.join(', ') +
        '. Bu alanlar boş kaydedilir.');
    }
    var ustSatirlar = (satirlar[baslik.satirNo] || []).map(norm);
    if (ustSatirlar.indexOf('işyeri') > -1) {
      sonuc.uyarilar.push('Dosyadaki "İşyeri" sütunu yok sayılıyor; bütün kayıtlar seçilen iş yerine eklenecek.');
    }

    var hedefTc = {}, hedefSicil = {}, hedefAd = {};
    kisiIndeks(secenekler.mevcut, hedefTc, hedefSicil, hedefAd);
    var digerTc = {}, digerSicil = {}, digerAd = {};
    kisiIndeks(secenekler.digerIsyerleri, digerTc, digerSicil, digerAd);
    /* Dosya içi yineleneler de bu haritalara işlenir: ikinci satır mükerrer sayılır. */
    var eklenecekTc = {}, eklenecekSicil = {};

    for (var s = baslik.satirNo + 1; s < satirlar.length; s += 1) {
      var hamSatir = satirlar[s] || [];
      var satirNo = s + 1;
      sonuc.ozet.dosyaSatir += 1;
      var doluMu = hamSatir.some(function (hucre) { return metin(hucre) !== ''; });
      if (!doluMu) {
        sonuc.ozet.bos += 1;
        continue;
      }

      var ham = {};
      SUTUNLAR.forEach(function (sutun) { ham[sutun.alan] = hucreAl(hamSatir, sonuc.haritalar, sutun.alan); });
      var durumHam = hucreAl(hamSatir, sonuc.haritalar, 'durum');

      if (ornekSatirMi(ham)) {
        sonuc.ozet.ornek += 1;
        sonuc.satirlar.push({
          satirNo: satirNo, ham: ham, kayit: null, durum: 'ornek',
          nedenler: [], uyarilar: ['Şablondaki örnek satır; kaydedilmedi.']
        });
        continue;
      }

      var hatalar = [];
      var uyarilar = [];
      var kayit = {
        isyeriId: '',
        sicil: ham.sicil,
        adSoyad: ham.adSoyad,
        tc: '',
        meslek: ham.meslek,
        departman: ham.departman,
        grupKodu: ham.grupKodu,
        sube: ham.sube,
        iseBaslama: '',
        kidemTarihi: '',
        telefon: telefonTemiz(ham.telefon),
        cinsiyet: '',
        durum: norm(durumHam) === 'pasif' ? 'pasif' : 'aktif'
      };

      if (!kayit.adSoyad) {
        hatalar.push('Ad Soyad boş olamaz.');
      } else if (kayit.adSoyad.length > 80) {
        hatalar.push('Ad Soyad 80 karakteri aşamaz (' + kayit.adSoyad.length + ' karakter).');
      }

      var tcRakam = tcknTemiz(ham.tc);
      if (ham.tc && !tcRakam) {
        hatalar.push('T.C. Kimlik No okunamadı: "' + ham.tc + '".');
      } else if (tcRakam) {
        if (tcRakam.length !== 11) {
          hatalar.push('T.C. Kimlik No 11 hane olmalı, ' + tcRakam.length + ' hane bulundu.');
        } else if (tcRakam.charAt(0) === '0') {
          hatalar.push('T.C. Kimlik No 0 ile başlayamaz.');
        } else {
          kayit.tc = tcRakam;
        }
      }

      ['iseBaslama', 'kidemTarihi'].forEach(function (alan) {
        var cozum = tarihCoz(ham[alan]);
        if (cozum.tanindi) { kayit[alan] = cozum.deger; }
        else {
          hatalar.push((alan === 'iseBaslama' ? 'İşe Başlama Tarihi' : 'Kıdem Tarihi') +
            ' tanınmadı: "' + ham[alan] + '". YYYY-AA-GG biçiminde yazın.');
        }
      });

      var cinsiyet = cinsiyetCoz(ham.cinsiyet);
      if (cinsiyet.tanindi) { kayit.cinsiyet = cinsiyet.deger; }
      else { uyarilar.push('Cinsiyet tanınmadı ("' + ham.cinsiyet + '"), boş kaydedildi.'); }
      if (ham.telefon && !kayit.telefon) {
        uyarilar.push('Cep Telefonu okunamadı ("' + ham.telefon + '"), boş kaydedildi.');
      }
      if (!kayit.sicil) { uyarilar.push('Sicil No boş; mükerrer kontrolü T.C. Kimlik No ile yapıldı.'); }
      if (!kayit.iseBaslama) { uyarilar.push('İşe Başlama Tarihi boş.'); }
      if (norm(durumHam) && norm(durumHam) !== 'aktif' && norm(durumHam) !== 'pasif') {
        uyarilar.push('Durum değeri tanınmadı ("' + durumHam + '"), Aktif kaydedildi.');
      }

      /* Mükerrer kontrolü: önce T.C. Kimlik No, sonra Sicil No, en son ad soyad. */
      var mukerrer = '';
      var eslesme = null;
      if (kayit.tc && (hedefTc[kayit.tc] || eklenecekTc[kayit.tc])) {
        eslesme = hedefTc[kayit.tc] || eklenecekTc[kayit.tc];
        mukerrer = hedefTc[kayit.tc] ?
          'Bu iş yerinde aynı T.C. Kimlik No ile kayıtlı personel var: ' + kisiEtiketi(eslesme) :
          'Dosyada aynı T.C. Kimlik No birden fazla satırda geçiyor.';
      } else if (kayit.sicil && (hedefSicil[kayit.sicil] || eklenecekSicil[kayit.sicil])) {
        eslesme = hedefSicil[kayit.sicil] || eklenecekSicil[kayit.sicil];
        mukerrer = hedefSicil[kayit.sicil] ?
          'Bu iş yerinde aynı Sicil No ile kayıtlı personel var: ' + kisiEtiketi(eslesme) :
          'Dosyada aynı Sicil No birden fazla satırda geçiyor.';
      } else if (!kayit.tc && !kayit.sicil && kayit.adSoyad && hedefAd[norm(kayit.adSoyad)]) {
        mukerrer = 'Bu iş yerinde aynı Ad Soyad kayıtlı (' + kisiEtiketi(hedefAd[norm(kayit.adSoyad)]) +
          '). T.C. Kimlik No ve Sicil No boş olduğu için mükerrer riski alındı; satır kaydedilmedi.';
      } else if (kayit.tc && digerTc[kayit.tc]) {
        uyarilar.push('Bu T.C. Kimlik No başka bir iş yerinde kayıtlı: ' + kisiEtiketi(digerTc[kayit.tc]) + '.');
      } else if (!kayit.tc && kayit.sicil && digerSicil[kayit.sicil]) {
        uyarilar.push('Bu Sicil No başka bir iş yerinde kayıtlı: ' + kisiEtiketi(digerSicil[kayit.sicil]) + '.');
      } else if (!kayit.tc && !kayit.sicil && kayit.adSoyad && digerAd[norm(kayit.adSoyad)]) {
        uyarilar.push('Bu Ad Soyad başka bir iş yerinde kayıtlı: ' + kisiEtiketi(digerAd[norm(kayit.adSoyad)]) + '.');
      }

      var durum;
      if (hatalar.length) { durum = 'hata'; sonuc.ozet.hatali += 1; }
      else if (mukerrer) { durum = 'mukerrer'; sonuc.ozet.mukerrer += 1; }
      else { durum = 'hazir'; sonuc.ozet.hazir += 1; }

      if (durum === 'hazir') {
        if (kayit.tc) { eklenecekTc[kayit.tc] = kayit; }
        if (kayit.sicil) { eklenecekSicil[kayit.sicil] = kayit; }
      }

      sonuc.ozet.veriSatir += 1;
      sonuc.satirlar.push({
        satirNo: satirNo,
        ham: ham,
        kayit: durum === 'hazir' ? kayit : null,
        onizlemeKayit: kayit,
        durum: durum,
        nedenler: mukerrer ? hatalar.concat([mukerrer]) : hatalar,
        uyarilar: uyarilar
      });

    }

    if (!sonuc.ozet.veriSatir) {
      sonuc.hata = 'Dosyada kaydedilecek veri satırı yok. Başlık satırının altında personel satırı olmalı.';
    }
    return sonuc;
  }

  /* ---------- Kayıt ----------
     Yalnızca "hazir" satırlar yazılır; mevcut kayıtlara dokunulmaz, hiçbir kayıt
     güncellenmez veya silinmez. Depoya tek yazımda işlendiği için binlerce satır
     yerel kaydı zorlamaz. Yetkili rolünde tek onay talebi olarak yöneticiye düşer. */
  function uygula(analiz, secenekler) {
    secenekler = secenekler || {};
    var sonuc = {
      eklenen: 0, bekleyen: 0, mukerrer: 0, hatali: 0, ornek: 0, idler: [],
      isyeriId: secenekler.isyeriId || ''
    };
    if (!analiz) { return sonuc; }
    sonuc.mukerrer = analiz.ozet ? analiz.ozet.mukerrer : 0;
    sonuc.hatali = analiz.ozet ? analiz.ozet.hatali : 0;
    sonuc.ornek = analiz.ozet ? analiz.ozet.ornek : 0;
    if (!sonuc.isyeriId) { throw new Error('Kayıt yapılacak işyeri seçilmedi.'); }

    var hazirlar = (analiz.satirlar || []).filter(function (satir) { return satir.durum === 'hazir'; });
    if (!hazirlar.length) { return sonuc; }

    var kayitlar = hazirlar.map(function (satir) {
      var kisi = {};
      Object.keys(satir.kayit).forEach(function (alan) { kisi[alan] = satir.kayit[alan]; });
      kisi.isyeriId = sonuc.isyeriId;
      return kisi;
    });

    var yazim = ISG.depo.personelTopluEkle(sonuc.isyeriId, kayitlar);
    if (yazim && yazim.bekliyor) {
      sonuc.bekleyen = kayitlar.length;
      return sonuc;
    }
    sonuc.eklenen = yazim && yazim.eklenen ? yazim.eklenen : 0;
    sonuc.idler = (yazim && yazim.idler) || [];
    return sonuc;
  }

  /* ---------- Standart şablon ---------- */

  function sablonSayfalar() {
    var kilavuz = SUTUNLAR.map(function (sutun) {
      return [sutun.baslik, sutun.zorunlu ? 'Zorunlu' : 'İsteğe bağlı', sutun.ipucu];
    });
    kilavuz.push(['İşyeri', 'Kullanılmaz',
      'Dosyada "İşyeri" sütunu olsa bile okunmaz; kayıtlar ekranda seçilen iş yerine eklenir. ' +
      'Her iş yeri kendi listesine yükler, iş yerleri arasındaki veri ayrıdır.']);
    kilavuz.push(['Mükerrer kayıt', 'Kural',
      'Aynı iş yerinde aynı T.C. Kimlik No (yoksa aynı Sicil No) bulunan satır tekrar kaydedilmez; ' +
      'ön izlemede "Mükerrer" olarak raporlanır.']);
    kilavuz.push(['Örnek satır', 'Kural',
      '"Personel" sayfasının ikinci satırındaki "Örnek Personel" kaydı biçimi gösterir; ' +
      'yüklerken otomatik atlanır. İsterseniz silebilirsiniz.']);
    kilavuz.push(['Yükleme', 'Adım',
      'Personel listesi → Toplu personel yükle → dosyayı seçin → ön izlemeyi kontrol edin → ' +
      '"Kaydedilecekleri ekle". Mevcut personel kayıtları silinmez veya değişmez.']);
    kilavuz.push(['Hatalı satır', 'Adım',
      'Hatalı satırlar kaydedilmez; ön izlemede satır numarası ve nedeni yazar. Dosyayı düzeltip ' +
      'yeniden yükleyebilirsiniz; doğru satırlar tekrar kaydedilmez (mükerrer sayılır).']);
    return [{
      ad: 'Personel',
      basliklar: SUTUNLAR.map(function (sutun) { return sutun.baslik; }),
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
    var ad = dosyaAdi || 'personel-sablonu.xlsx';
    if (!ISG.excel || typeof ISG.excel.indir !== 'function') {
      throw new Error('Excel modülü yüklenmediği için şablon indirilemedi.');
    }
    ISG.excel.indir(ad, sablonSayfalar());
    return true;
  }

  /* Ön izleme listesi uzun dosyalarda sınırlı basılır; sayımlar daima tamdır. */
  function onizlemeSatirlari(analiz, sinir) {
    var liste = (analiz && analiz.satirlar || []).filter(function (satir) {
      return satir.durum !== 'bos';
    });
    var ust = typeof sinir === 'number' ? sinir : 150;
    var oncelik = { hata: 0, mukerrer: 1, ornek: 2, hazir: 3 };
    var sirali = liste.slice().sort(function (a, b) {
      var fark = (oncelik[a.durum] || 9) - (oncelik[b.durum] || 9);
      return fark !== 0 ? fark : a.satirNo - b.satirNo;
    });
    return { goruntulenecek: sirali.slice(0, ust), toplam: liste.length, sirali: sirali };
  }

  ISG.personelToplu = {
    SUTUNLAR: SUTUNLAR,
    BASLIKLAR: SUTUNLAR.map(function (sutun) { return sutun.baslik; }),
    ORNEK_KAYIT: ORNEK_KAYIT,
    norm: norm,
    tcknTemiz: tcknTemiz,
    telefonTemiz: telefonTemiz,
    cinsiyetCoz: cinsiyetCoz,
    baslikBul: baslikBul,
    analizEt: analizEt,
    uygula: uygula,
    sablonSayfalar: sablonSayfalar,
    sablonIndir: sablonIndir,
    onizlemeSatirlari: onizlemeSatirlari
  };
})(window);
