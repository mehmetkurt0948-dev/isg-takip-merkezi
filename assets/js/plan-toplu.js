/* İSG Takip Merkezi — yıllık çalışma planı toplu aktarma modülü
   Excel/CSV satırlarını yıllık çalışma planı kayıt yapısına çevirir. Saf
   mantıktır: arayüz ögesi okumaz, depo yazımı dışında yan etkisi yoktur; böylece
   hem arayüzden hem Node testlerinden aynı kurallarla çalışır.

   Standart şablon sütunları (bütün kurum ve iş yerlerinde aynıdır):
   Sıra No · Ana Başlık · Çalışma Konusu · Sorumlu · Açıklama · Ocak–Aralık

   Modül ayrıca kurumlardan gelen eski biçimli plan dosyalarını da okur:
   · sayfa üstü bilgi blokları (Doküman No, Revizyon, Sayfa, İlk Yayın Tarihi),
   · her sayfada tekrar eden tablo başlığı ve ay numarası satırı,
   · "1", "2", "6" gibi yalnızca numaradan oluşan bölüm (ana başlık) satırları,
   · HAZIRLAYANLAR / ONAYLAYAN / imza satırları
   faaliyet olarak kaydedilmez; bunlar ayrıştırılıp raporlanır. */
(function (global) {
  'use strict';

  var ISG = global.ISG = global.ISG || {};

  var AYLAR = (ISG.bicim && ISG.bicim.AYLAR) ||
    ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz',
      'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  var AY_KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

  var TR_HARF = {
    'ı': 'i', 'İ': 'i', 'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g',
    'ü': 'u', 'Ü': 'u', 'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c'
  };

  /* Türkçe duyarlı normalize: önce tr küçültmesi, sonra harf eşlemesi yapılır;
   başlık eşleştirmede ve mükerrer anahtarında kullanılır. */
  function norm(metin) {
    var ham = String(metin === null || typeof metin === 'undefined' ? '' : metin);
    var kucuk = ham.replace(/\u0307/g, '').toLocaleLowerCase('tr');
    return kucuk
      .replace(/[ıişşğüöç]/g, function (harf) { return TR_HARF[harf] || harf; })
      .replace(/\s+/g, ' ')
      .replace(/[^a-z0-9 ]/g, '')
      .trim();
  }

  var AY_ARAMA = AYLAR.map(function (ad, i) { return [norm(ad), norm(AY_KISA[i])]; });

  /* Hücre bir ay adı mı? Olursa 1-12, değilse 0 döner. */
  function ayKac(deger) {
    var n = norm(deger);
    if (!n) { return 0; }
    for (var a = 0; a < 12; a += 1) {
      if (n === AY_ARAMA[a][0] || n === AY_ARAMA[a][1]) { return a + 1; }
    }
    return 0;
  }

  var SUTUNLAR = [
    {
      alan: 'sira', baslik: 'Sıra No', genislik: 10,
      esler: ['sıra no', 'sıra', 'no', 'sıra nr', 'faaliyet no']
    },
    {
      alan: 'anaBaslik', baslik: 'Ana Başlık', genislik: 28,
      esler: ['ana başlık', 'ana başlıklar', 'bölüm', 'kategori', 'grup', 'başlık']
    },
    {
      alan: 'faaliyet', baslik: 'Çalışma Konusu', genislik: 56, zorunlu: true,
      esler: ['çalışma konusu', 'faaliyet', 'konu', 'yapılacak iş', 'faaliyet adı', 'işin adı']
    },
    {
      alan: 'sorumlu', baslik: 'Sorumlu', genislik: 26,
      esler: ['sorumlu', 'sorumlular', 'sorumlu kişi', 'sorumlu birim', 'sorumlu kişi veya birim']
    },
    {
      alan: 'aciklama', baslik: 'Açıklama', genislik: 60,
      esler: ['açıklama', 'not', 'notlar', 'detay', 'bilgi']
    }
  ];

  var BASLIK_ESLER = SUTUNLAR.map(function (sutun) {
    return { alan: sutun.alan, esler: sutun.esler.map(norm) };
  });
  var AYLAR_BASLIK = ['aylar', 'planlanan zaman', 'planlanan aylar'].map(norm);
  var FAALIYET_UZUNLUK = 180;

  /* ---------- Yardımcılar ---------- */

  function hucre(satir, indeks) {
    if (!satir || typeof indeks !== 'number' || indeks < 0) { return ''; }
    var deger = satir[indeks];
    return String(deger === null || typeof deger === 'undefined' ? '' : deger).replace(/\s+/g, ' ').trim();
  }

  function bosMu(satir) {
    if (!satir || !satir.length) { return true; }
    for (var i = 0; i < satir.length; i += 1) {
      if (hucre(satir, i)) { return false; }
    }
    return true;
  }

  function metinHucreleri(satir) {
    var liste = [];
    (satir || []).forEach(function (deger, i) {
      var metin = hucre(satir, i);
      if (metin) { liste.push({ indeks: i, metin: metin }); }
    });
    return liste;
  }

  /* Ay hücresi doluysa planlanmış sayılır; "-", "yok", "hayır" gibi olumsuzlar hariç. */
  var OLUMSUZ_ISARET = ['', '-', '--', 'yok', 'hayır', 'hayir', 'boş', 'bos', 'ne', 'no', '0'];
  function isaretMi(deger) {
    var ham = String(deger === null || typeof deger === 'undefined' ? '' : deger).replace(/\s+/g, ' ').trim();
    if (!ham) { return false; }
    if (/^[-–—_.\s•·*+]+$/.test(ham)) { return false; }
    var n = norm(ham);
    if (OLUMSUZ_ISARET.indexOf(n) > -1) { return false; }
    if (OLUMSUZ_ISARET.indexOf(ham.toLocaleLowerCase('tr')) > -1) { return false; }
    return true;
  }

  var IMZA_KELIME = [
    'hazırlayanlar', 'hazırlayan', 'onaylayanlar', 'onaylayan', 'imza', 'imzalar', 'revizyon tarihi',
    'revizyon no', 'revizyon', 'doküman no', 'dokuman no', 'ilk yayın tarihi', 'sayfa', 'şirket adı',
    'sirket adi', 'iş yeri sgk sicil no', 'sgk sicil no', 'planlanan tarih', 'iş güvenliği uzmanı',
    'işyeri hekimi', 'iş yeri hekimi', 'a sınıfı iş güvenliği uzmanı', 'b sınıfı iş güvenliği uzmanı',
    'c sınıfı iş güvenliği uzmanı', 'işveren işveren vekili', 'işveren vekili', 'uygulayan',
    'dağıtım', 'gözden geçiren', 'vize'
  ].map(norm);

  function imzaSatiriMi(satir, harita) {
    var hucreler = metinHucreleri(satir);
    if (!hucreler.length) { return false; }
    var faaliyet = harita ? hucre(satir, harita.faaliyet) : '';
    /* Faaliyeti olan satırda ay işaretleri denetim sözcüsü sayılmaz; faaliyeti
       olmayan bilgi satırında (Doküman No, Revizyon, imza bloğu) her hücreye bakılır. */
    var uygun = faaliyet ? hucreler.filter(function (h) {
      return !(harita && harita.aylar && harita.aylar.indexOf(h.indeks) > -1);
    }) : hucreler;
    var bulundu = uygun.some(function (h) {
      var n = norm(h.metin);
      if (!n) { return false; }
      return IMZA_KELIME.some(function (kelime) { return n === kelime || n.indexOf(kelime) === 0; });
    });
    if (!bulundu) { return false; }
    if (!faaliyet) { return true; }
    var isaretli = harita && harita.aylar ? harita.aylar.some(function (kolon) { return isaretMi(satir[kolon]); }) : false;
    return !isaretli;
  }

  /* Dosya başlığındaki "( 2026 YILI )" gibi ifadelerden plan yılı. */
  function yilBul(satirlar) {
    var sayim = {};
    (satirlar || []).slice(0, 14).forEach(function (satir) {
      metinHucreleri(satir).forEach(function (h) {
        var eslesme = String(h.metin).match(/(19|20)\d{2}/g);
        (eslesme || []).forEach(function (yil) {
          var deger = Number(yil);
          if (deger >= 1990 && deger <= 2100) { sayim[deger] = (sayim[deger] || 0) + 1; }
        });
      });
    });
    var en = 0, adet = 0;
    Object.keys(sayim).forEach(function (yil) {
      if (sayim[yil] > adet) { en = Number(yil); adet = sayim[yil]; }
    });
    return en;
  }

  /* Şablonda biçimi gösteren satırlar; "Örnek:" ile başladığı için yüklerken atlanır. */
  var ORNEK_KAYITLAR = [
    ['1.1', 'Eğitimler', 'Örnek: Temel iş sağlığı ve güvenliği eğitimi', 'İGU, İH',
      'Yeni işe başlayan personele işe başlamadan önce verilir.',
      '', '', 'X', '', '', '', '', '', '', '', '', 'X', ''],
    ['2.1', 'Acil Durumlar', 'Örnek: Yangın ve tahliye tatbikatı', 'İGU, Birim Sorumluları',
      'Yılda en az bir kez yapılır; tatbikat tutanağı arşivlenir.',
      '', '', '', '', '', '', 'X', '', '', '', '', '']
  ];

  /* ---------- Tablo başlığı ve sütun eşlemesi ---------- */

  function alanEsle(metin) {
    var n = norm(metin);
    if (!n) { return ''; }
    for (var i = 0; i < BASLIK_ESLER.length; i += 1) {
      if (BASLIK_ESLER[i].esler.indexOf(n) > -1) { return BASLIK_ESLER[i].alan; }
    }
    if (n.indexOf('calisma') > -1 && n.indexOf('konu') > -1) { return 'faaliyet'; }
    if (n.indexOf('anabasl') > -1 || n.indexOf('anabaslik') > -1) { return 'anaBaslik'; }
    if (n.indexOf('sorumlu') === 0) { return 'sorumlu'; }
    if (n.indexOf('aciklama') === 0) { return 'aciklama'; }
    if (n.indexOf('sira') === 0) { return 'sira'; }
    if (n.indexOf('faaliyet') === 0) { return 'faaliyet'; }
    return '';
  }

  function ayNumaraSatiri(satir) {
    var hucreler = metinHucreleri(satir);
    if (hucreler.length < 10) { return false; }
    var bulunan = [];
    hucreler.forEach(function (h) {
      if (/^\d{1,2}$/.test(h.metin)) {
        var deger = Number(h.metin);
        if (deger >= 1 && deger <= 12) { bulunan[deger] = h.indeks; }
      }
    });
    var adet = 0;
    for (var a = 1; a <= 12; a += 1) { if (bulunan[a] !== undefined) { adet += 1; } }
    return adet >= 10;
  }

  /* Tek satırdan sütun haritası üretir; tablo başlığı değilse null döner. */
  function haritaBul(satir, sonraki) {
    if (!satir || !satir.length) { return null; }
    var harita = { sira: -1, anaBaslik: -1, faaliyet: -1, sorumlu: -1, aciklama: -1, aylarBaslik: -1, aylar: [], ayAdi: false };
    var adli = {};
    metinHucreleri(satir).forEach(function (h) {
      var ay = ayKac(h.metin);
      if (ay && adli[ay] === undefined) { adli[ay] = h.indeks; }
      if (AYLAR_BASLIK.indexOf(norm(h.metin)) > -1 && harita.aylarBaslik < 0) { harita.aylarBaslik = h.indeks; }
      var alan = alanEsle(h.metin);
      if (alan && harita[alan] < 0) { harita[alan] = h.indeks; }
    });
    if (harita.faaliyet < 0 || (harita.sira < 0 && harita.sorumlu < 0 && harita.aciklama < 0)) { return null; }
    /* En az iki farklı alan eşleşmeli: "Açıklama: -" gibi bilgi satırları başlık
       sayılmaz. Gerçek tablo başlığında birden çok sütun adı bulunur. */
    var eslesen = 0;
    ['sira', 'anaBaslik', 'faaliyet', 'sorumlu', 'aciklama'].forEach(function (alan) {
      if (harita[alan] >= 0) { eslesen += 1; }
    });
    if (eslesen < 2 && harita.aylarBaslik < 0) { return null; }

    var adSayisi = 0;
    for (var a = 1; a <= 12; a += 1) { if (adli[a] !== undefined) { adSayisi += 1; } }
    if (adSayisi >= 6) {
      for (var b = 1; b <= 12; b += 1) { harita.aylar.push(adli[b] === undefined ? -1 : adli[b]); }
      harita.ayAdi = true;
    } else if (harita.aylarBaslik >= 0) {
      for (var c = 0; c < 12; c += 1) { harita.aylar.push(harita.aylarBaslik + c); }
    } else if (ayNumaraSatiri(sonraki)) {
      var numara = {};
      metinHucreleri(sonraki).forEach(function (h) {
        if (/^\d{1,2}$/.test(h.metin)) {
          var deger = Number(h.metin);
          if (deger >= 1 && deger <= 12 && numara[deger] === undefined) { numara[deger] = h.indeks; }
        }
      });
      for (var d = 1; d <= 12; d += 1) { harita.aylar.push(numara[d] === undefined ? -1 : numara[d]); }
    }
    harita.aylar = harita.aylar.filter(function (kolon) { return kolon >= 0; });
    return harita;
  }

  function eslesmeAnahtari(kayit) {
    return norm(kayit && kayit.faaliyet) + '|' + norm(kayit && kayit.sorumlu);
  }

  function kayitYili(kayit) {
    if (!kayit) { return 0; }
    var deger = Number(kayit.yil);
    if (deger >= 1990) { return deger; }
    var takip = String(kayit.takipTarihi || '');
    var yil = Number(takip.slice(0, 4));
    return yil >= 1990 ? yil : 0;
  }

  function tamSayiMi(metin) { return /^\d{1,2}[.)+]?$/.test(String(metin || '').trim()); }
  function ondalikSiraMi(metin) { return /^\d{1,2}[.,]\d{1,2}[.+)*]*$/.test(String(metin || '').trim()); }
  function ornekMi(metin) { return /^ornek\b/.test(norm(metin)); }


  /* ---------- Satır sınıflandırma ve analiz ---------- */

  function ayIsaretleri(satir, harita) {
    var liste = [];
    for (var i = 0; i < harita.aylar.length; i += 1) {
      if (isaretMi(satir[harita.aylar[i]])) { liste.push(i + 1); }
    }
    return liste;
  }

  /* Eski şablonlarda sorumlu sütunu kayabiliyor: faaliyet ile açıklama arasındaki
     ilk dolu hücre sorumlu kabul edilir. */
  function kaymisSorumlu(satir, harita) {
    var altSinir = Math.max(harita.faaliyet, harita.sira, harita.anaBaslik) + 1;
    var ustSinir = harita.aciklama > 0 ? harita.aciklama : (harita.aylar.length ? harita.aylar[0] : satir.length);
    for (var i = altSinir; i < ustSinir; i += 1) {
      if (i === harita.anaBaslik || i === harita.sira) { continue; }
      var metin = hucre(satir, i);
      if (metin && metin.length < 120) { return metin; }
    }
    return '';
  }

  /* secenekler: {isyeriId, yil, mevcut:[plan kayıtları]} */
  function analizEt(satirlar, secenekler) {
    var sec = secenekler || {};
    var sonuc = {
      hata: '',
      uyarilar: [],
      yil: Number(sec.yil) || 0,
      baslikSatir: 0,
      harita: null,
      bolumler: [],
      ozet: {
        dosyaSatir: 0, hazir: 0, mukerrer: 0, hatali: 0, bos: 0, ornek: 0,
        bolum: 0, imza: 0, baslik: 0, ayIsaret: 0
      },
      satirlar: []
    };

    if (!Array.isArray(satirlar) || !satirlar.length) {
      sonuc.hata = 'Dosyada okunabilir satır bulunamadı. Dosyanın .xlsx veya .csv olduğunu doğrulayın.';
      return sonuc;
    }

    var ilk = -1, harita = null;
    for (var i = 0; i < satirlar.length; i += 1) {
      var aday = haritaBul(satirlar[i], satirlar[i + 1]);
      if (aday) { ilk = i; harita = aday; break; }
    }
    if (!harita) {
      sonuc.hata = 'Çalışma planı tablo başlığı bulunamadı. Şablondaki "Sıra No · Ana Başlık · ' +
        'Çalışma Konusu · Sorumlu · Açıklama · Ocak-Aralık" satırını koruyun.';
      return sonuc;
    }
    if (!harita.aylar.length) {
      sonuc.hata = 'Ay sütunları (Ocak-Aralık) bulunamadı. Şablondaki on iki ay sütununu silmeyin.';
      return sonuc;
    }

    sonuc.baslikSatir = ilk + 1;
    sonuc.harita = harita;
    if (!sonuc.yil) { sonuc.yil = yilBul(satirlar) || 0; }
    if (!sonuc.yil) {
      sonuc.uyarilar.push('Plan dosyasında yıl bulunamadı; kayıtlar seçtiğiniz yıla yazılacak.');
    }

    var planYili = sonuc.yil;
    var mevcutAnahtar = {};
    (sec.mevcut || []).forEach(function (kayit) {
      if (kayitYili(kayit) !== planYili) { return; }
      mevcutAnahtar[eslesmeAnahtari(kayit)] = kayit;
    });
    var dosyaAnahtar = {};
    var bolum = '';

    for (var r = ilk + 1; r < satirlar.length; r += 1) {
      var satir = satirlar[r] || [];
      var satirNo = r + 1;
      if (bosMu(satir)) {
        sonuc.satirlar.push({ satirNo: satirNo, durum: 'bos', tur: 'bos', faaliyet: '' });
        sonuc.ozet.bos += 1;
        continue;
      }
      sonuc.ozet.dosyaSatir += 1;

      var tekrarBaslik = haritaBul(satir, satirlar[r + 1]);
      if (tekrarBaslik) {
        harita = tekrarBaslik;
        sonuc.satirlar.push({ satirNo: satirNo, durum: 'baslik', tur: 'baslik', faaliyet: 'Tablo başlığı — faaliyet olarak kaydedilmez' });
        sonuc.ozet.baslik += 1;
        continue;
      }
      if (ayNumaraSatiri(satir)) {
        sonuc.satirlar.push({ satirNo: satirNo, durum: 'baslik', tur: 'baslik', faaliyet: 'Ay başlığı (1-12) — faaliyet olarak kaydedilmez' });
        sonuc.ozet.baslik += 1;
        continue;
      }
      if (imzaSatiriMi(satir, harita)) {
        sonuc.satirlar.push({ satirNo: satirNo, durum: 'imza', tur: 'imza', faaliyet: 'İmza / doküman bilgisi — faaliyet olarak kaydedilmez' });
        sonuc.ozet.imza += 1;
        continue;
      }

      var siraMetin = harita.sira >= 0 ? hucre(satir, harita.sira) : '';
      var anaBaslikMetni = harita.anaBaslik >= 0 ? hucre(satir, harita.anaBaslik) : '';
      var faaliyet = hucre(satir, harita.faaliyet);
      var sorumlu = harita.sorumlu >= 0 ? hucre(satir, harita.sorumlu) : '';
      var aciklama = harita.aciklama >= 0 ? hucre(satir, harita.aciklama) : '';
      var aylar = ayIsaretleri(satir, harita);
      if (!sorumlu) { sorumlu = kaymisSorumlu(satir, harita); }

      /* Yalnızca numaradan ve başlıktan oluşan satır: ana başlık (bölüm). */
      if (faaliyet && tamSayiMi(siraMetin) && !sorumlu && !aciklama && !aylar.length) {
        bolum = faaliyet;
        if (sonuc.bolumler.indexOf(bolum) < 0) { sonuc.bolumler.push(bolum); }
        sonuc.satirlar.push({ satirNo: satirNo, durum: 'bolum', tur: 'bolum', faaliyet: faaliyet });
        sonuc.ozet.bolum += 1;
        continue;
      }

      if (!faaliyet) {
        /* Bilgi satırında (Doküman No, Revizyon, Sayfa ...) sıra, sorumlu veya
           açıklama yoktur; faaliyet satırında en az biri bulunur. */
        var veriVar = !!siraMetin || !!sorumlu || !!aciklama;
        if (veriVar) {
          sonuc.satirlar.push({
            satirNo: satirNo, durum: 'hata', tur: 'bos', faaliyet: '',
            nedenler: ['Çalışma Konusu sütunu boş — satır kaydedilmeyecek.']
          });
          sonuc.ozet.hatali += 1;
        } else {
          sonuc.satirlar.push({
            satirNo: satirNo, durum: 'imza', tur: 'imza',
            faaliyet: 'Doküman / sayfa bilgisi — faaliyet olarak kaydedilmez'
          });
          sonuc.ozet.imza += 1;
        }
        continue;
      }

      var nedenler = [];
      var uyarilar = [];
      var kayitFaaliyet = faaliyet;
      if (kayitFaaliyet.length > FAALIYET_UZUNLUK) {
        kayitFaaliyet = kayitFaaliyet.slice(0, FAALIYET_UZUNLUK - 1) + '…';
        uyarilar.push('Çalışma konusu ' + FAALIYET_UZUNLUK + ' karaktere kısaltıldı.');
      }
      if (!aylar.length) {
        uyarilar.push('Hiçbir ay işaretlenmedi; faaliyet ay bilgisi olmadan kaydedilecek.');
      }

      var anahtar = norm(kayitFaaliyet) + '|' + norm(sorumlu);
      var durum = 'hazir';
      if (ornekMi(kayitFaaliyet) || ornekMi(anaBaslikMetni)) {
        durum = 'ornek';
        uyarilar.push('Örnek satır — şablonu gösterdiği için kaydedilmez.');
      } else if (mevcutAnahtar[anahtar]) {
        durum = 'mukerrer';
        nedenler.push('Bu iş yerinin ' + (planYili || 'seçilen') + ' yılında aynı konu ve sorumluyla kayıt zaten var.');
      } else if (dosyaAnahtar[anahtar]) {
        durum = 'mukerrer';
        nedenler.push('Aynı dosyada ' + dosyaAnahtar[anahtar] + '. satırda aynı faaliyet var; tekrar kaydedilmeyecek.');
      }

      var kayit = {
        isyeriId: sec.isyeriId || '',
        yil: planYili,
        sira: 0,
        siraExcel: siraMetin,
        anaBaslik: anaBaslikMetni || bolum || '',
        faaliyet: kayitFaaliyet,
        sorumlu: sorumlu,
        aciklama: aciklama,
        aylar: aylar,
        ay: aylar.length ? aylar[0] : 0,
        gun: 0,
        durum: 'takvimde',
        takipTarihi: '',
        kaynak: 'Excel',
        kaynakSatir: satirNo
      };

      if (durum === 'hazir') {
        dosyaAnahtar[anahtar] = satirNo;
        sonuc.ozet.hazir += 1;
        sonuc.ozet.ayIsaret += aylar.length;
      } else if (durum === 'mukerrer') { sonuc.ozet.mukerrer += 1; }
      else if (durum === 'ornek') { sonuc.ozet.ornek += 1; }

      sonuc.satirlar.push({
        satirNo: satirNo, durum: durum, tur: 'faaliyet',
        faaliyet: kayitFaaliyet, kayit: kayit, nedenler: nedenler, uyarilar: uyarilar
      });
    }

    if (!sonuc.ozet.hazir && !sonuc.ozet.mukerrer && !sonuc.ozet.hatali) {
      sonuc.hata = 'Dosyada kaydedilecek faaliyet bulunamadı. Tablo başlığı altındaki satırları denetleyin.';
    }
    if (sonuc.ozet.bolum || sonuc.ozet.imza || sonuc.ozet.baslik) {
      sonuc.uyarilar.push('Ayrıştırma notu: ' + sonuc.ozet.bolum + ' ana başlık, ' + sonuc.ozet.baslik +
        ' tablo/ay başlığı ve ' + sonuc.ozet.imza + ' imza-doküman satırı faaliyet olarak kaydedilmedi.');
    }
    return sonuc;
  }

  /* ---------- Depoya yazma (yalnızca kullanıcı onayından sonra) ---------- */

  function uygulanacaklar(analiz) {
    var liste = [];
    var sira = 0;
    ((analiz && analiz.satirlar) || []).forEach(function (satir) {
      if (satir.durum !== 'hazir' || !satir.kayit) { return; }
      sira += 1;
      var kayit = {};
      Object.keys(satir.kayit).forEach(function (anahtar) {
        kayit[anahtar] = satir.kayit[anahtar];
      });
      kayit.sira = sira;
      liste.push(kayit);
    });
    return liste;
  }

  function uygula(analiz, secenekler) {
    var sec = secenekler || {};
    var sonuc = {
      isyeriId: sec.isyeriId || '', yil: Number(analiz && analiz.yil) || Number(sec.yil) || 0,
      eklenen: 0, bekleyen: 0, mukerrer: (analiz && analiz.ozet && analiz.ozet.mukerrer) || 0,
      hatali: (analiz && analiz.ozet && analiz.ozet.hatali) || 0, idler: []
    };
    var kayitlar = uygulanacaklar(analiz);
    if (!sonuc.isyeriId) { throw new Error('Plan kaydı için işyeri seçilmedi.'); }
    if (!kayitlar.length) { return sonuc; }
    if (ISG.depo && typeof ISG.depo.planTopluEkle === 'function') {
      var yazim = ISG.depo.planTopluEkle(sonuc.isyeriId, kayitlar);
      if (yazim && yazim.bekliyor) {
        sonuc.bekleyen = kayitlar.length;
        return sonuc;
      }
      sonuc.eklenen = (yazim && yazim.eklenen) || 0;
      sonuc.idler = (yazim && yazim.idler) || [];
    }
    return sonuc;
  }

  /* ---------- Standart şablon ve dışa aktarma ---------- */

  var BASLIKLAR = SUTUNLAR.map(function (sutun) { return sutun.baslik; }).concat(AYLAR);
  var GENISLIKLER = SUTUNLAR.map(function (sutun) { return sutun.genislik; })
    .concat([7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7]);

  function sablonSayfalar() {
    var kilavuz = [
      ['Sıra No', 'İsteğe bağlı', 'Faaliyet sıra numarası. "1.2", "6.5+" gibi ondalık numaralar da yazılabilir; ' +
        'boş bırakılıysa faaliyet yine kaydedilir.'],
      ['Ana Başlık', 'Önerilir', 'Faaliyetin bağlı olduğu üst başlık (Eğitimler, Acil Durumlar, Evraklar...). ' +
        'Plan ekranı faaliyetleri bu başlık altında gruplar.'],
      ['Çalışma Konusu', 'Zorunlu', 'Yapılacak İSG faaliyeti. Boş olan satır kaydedilmez, hatalı satır olarak raporlanır.'],
      ['Sorumlu', 'Önerilir', 'İGU, İH, İşveren/Vekili, Birim Sorumluları vb. Mükerrer kontrolü faaliyet + sorumlu birlikte ele alınır.'],
      ['Açıklama', 'İsteğe bağlı', 'Faaliyetin dayanağı, periyodu veya notu.'],
      ['Ocak - Aralık', 'Planlanan ay', 'Planlanan aya X yazın (veya herhangi bir işaret/doldurun). ' +
        '"-", "yok", "hayır" yazılı hücre planlanmamış sayılır. Bir faaliyet birden fazla aya planlanabilir.']
    ];
    kilavuz.push(['Ana başlık satırı', 'Kural', 'Eski plan dosyalarındaki gibi yalnızca "1", "2", "6" numarası ve başlık ' +
      'içeren satırlar ana başlık kabul edilir; altındaki faaliyetlere Ana Başlık olarak yazılır, faaliyet olarak kaydedilmez.']);
    kilavuz.push(['İmza ve sayfa bilgisi', 'Kural', 'HAZIRLAYANLAR, ONAYLAYAN, imza, Doküman No, Revizyon, Sayfa ve ' +
      'tekrar eden tablo başlığı satırları otomatik ayıklanır; faaliyet olarak kaydedilmez.']);
    kilavuz.push(['Mükerrer kayıt', 'Kural', 'Aynı iş yerinde ve aynı yılda aynı Çalışma Konusu + Sorumlu ikilisi zaten ' +
      'varsa satır tekrar kaydedilmez; ön izlemede "Mükerrer" olarak raporlanır.']);
    kilavuz.push(['İş yeri izolasyonu', 'Kural', 'Dosyada "İşyeri" sütunu olsa bile okunmaz. Kayıtlar daima ekranda seçilen ' +
      'iş yerine ve seçilen yıla yazılır; başka iş yerlerinin planlarına dokunulmaz.']);
    kilavuz.push(['Örnek satır', 'Kural', '"Örnek:" ile başlayan satırlar biçimi gösterir, yüklerken otomatik atlanır.']);
    kilavuz.push(['Yükleme adımları', 'Adım', 'Şablonu doldurun → Yıllık Çalışma Planı ekranında "Excel\'den Toplu Yükle" → ' +
      'dosyayı seçin → ön izlemeyi kontrol edin → "Kaydedilecekleri ekle". Mevcut plan kayıtları silinmez veya değiştirilmez.']);
    return [{
      ad: 'Yıllık Çalışma Planı',
      basliklar: BASLIKLAR,
      satirlar: ORNEK_KAYITLAR.map(function (satir) { return satir.slice(); }),
      genislikler: GENISLIKLER
    }, {
      ad: 'Kılavuz',
      basliklar: ['Sütun / konu', 'Zorunluluk', 'Biçim ve kural'],
      satirlar: kilavuz,
      genislikler: [26, 18, 108]
    }];
  }

  function sablonIndir(dosyaAdi) {
    var ad = dosyaAdi || 'Yillik-Calisma-Plani-Sablonu.xlsx';
    if (!ISG.excel || typeof ISG.excel.indir !== 'function') {
      throw new Error('Excel modülü yüklenmediği için şablon indirilemedi.');
    }
    ISG.excel.indir(ad, sablonSayfalar());
    return true;
  }

  var AY_ISARETI = 'X';

  /* Mevcut plan kayıtlarını şablon biçiminde dışa aktarır: indirilen dosya
     doldurulup geri yüklenebilir (round-trip). */
  function disaAktarSayfalar(kayitlar, secenekler) {
    var sec = secenekler || {};
    var liste = kayitlar || [];
    var satirlar = liste.map(function (kayit, i) {
      var planAylari = Array.isArray(kayit.aylar) ? kayit.aylar : (kayit.ay ? [kayit.ay] : []);
      var satir = [
        kayit.siraExcel || kayit.sira || (i + 1),
        kayit.anaBaslik || '',
        kayit.faaliyet || '',
        kayit.sorumlu || '',
        kayit.aciklama || ''
      ];
      for (var a = 1; a <= 12; a += 1) {
        satir.push(planAylari.indexOf(a) > -1 ? AY_ISARETI : '');
      }
      return satir;
    });
    return [{
      ad: 'Yıllık Çalışma Planı',
      basliklar: BASLIKLAR,
      satirlar: satirlar,
      genislikler: GENISLIKLER
    }];
  }

  function disaAktar(dosyaAdi, kayitlar, secenekler) {
    if (!ISG.excel || typeof ISG.excel.indir !== 'function') {
      throw new Error('Excel modülü yüklenmediği için dışa aktarma yapılamadı.');
    }
    ISG.excel.indir(dosyaAdi || 'Yillik-Calisma-Plani.xlsx', disaAktarSayfalar(kayitlar, secenekler));
    return true;
  }

  /* Ön izleme listesi uzun dosyalarda sınırlı basılır; sayımlar daima tamdır. */
  function onizlemeSatirlari(analiz, sinir) {
    var liste = ((analiz && analiz.satirlar) || []).filter(function (satir) {
      return satir.durum !== 'bos';
    });
    var ust = typeof sinir === 'number' ? sinir : 200;
    var oncelik = { hata: 0, mukerrer: 1, bolum: 2, imza: 3, baslik: 4, ornek: 5, hazir: 6 };
    var sirali = liste.slice().sort(function (a, b) {
      var fark = (oncelik[a.durum] === undefined ? 9 : oncelik[a.durum]) -
        (oncelik[b.durum] === undefined ? 9 : oncelik[b.durum]);
      return fark !== 0 ? fark : a.satirNo - b.satirNo;
    });
    return { goruntulenecek: sirali.slice(0, ust), toplam: liste.length, sirali: sirali };
  }

  ISG.planToplu = {
    AYLAR: AYLAR,
    AY_KISA: AY_KISA,
    SUTUNLAR: SUTUNLAR,
    BASLIKLAR: BASLIKLAR,
    GENISLIKLER: GENISLIKLER,
    ORNEK_KAYITLAR: ORNEK_KAYITLAR,
    norm: norm,
    ayKac: ayKac,
    isaretMi: isaretMi,
    yilBul: yilBul,
    haritaBul: haritaBul,
    ayNumaraSatiri: ayNumaraSatiri,
    eslesmeAnahtari: eslesmeAnahtari,
    kayitYili: kayitYili,
    analizEt: analizEt,
    uygulanacaklar: uygulanacaklar,
    uygula: uygula,
    sablonSayfalar: sablonSayfalar,
    sablonIndir: sablonIndir,
    disaAktarSayfalar: disaAktarSayfalar,
    disaAktar: disaAktar,
    onizlemeSatirlari: onizlemeSatirlari
  };
})(window);

