/* İSG Takip Merkezi — görünümler: dosya kontrolleri, çalışma planı, saha ve DÖF */
(function (global) {
  'use strict';

  var ISG = global.ISG = global.ISG || {};
  var B = ISG.bicim;
  var P = ISG.parcalar;
  var SAYFALAR = ISG.sayfalar = ISG.sayfalar || {};
  var UI = ISG.ui = ISG.ui || {};

  function veri() { return ISG.yetki ? ISG.yetki.gorunum() : ISG.depo.al(); }
  function kacis(deger) { return B.kacis(deger); }
  function isyeriAdi(id) { return ISG.isyeriAdi(veri(), id); }

  /* ---------- Dosya kontrolleri ---------- */

  function dosyaTemelListe(hesap) {
    var liste = ISG.kapsamda(hesap, UI.kapsam, 'dosyalar');
    var arama = String(UI.dosyaArama || '').toLocaleLowerCase('tr');
    if (arama) {
      liste = liste.filter(function (dosya) {
        return [dosya.madde, dosya.bolum, dosya.aciklama, dosya.sorumlu].join(' ').toLocaleLowerCase('tr').indexOf(arama) >= 0;
      });
    }
    if (UI.dosyaBolum) {
      liste = liste.filter(function (dosya) { return dosya.bolum === UI.dosyaBolum; });
    }
    if (UI.dosyaTarih) {
      liste = liste.filter(function (dosya) {
        var kalan = ISG.gunFarki(dosya.yenileme);
        if (UI.dosyaTarih === 'tarihsiz') { return kalan === null; }
        if (kalan === null) { return false; }
        if (UI.dosyaTarih === 'gecen') { return kalan < 0; }
        if (UI.dosyaTarih === 'bugun') { return kalan === 0; }
        if (UI.dosyaTarih === 'yaklasan') { return kalan > 0 && kalan <= 14; }
        return true;
      });
    }
    return liste;
  }

  function dosyaDurumSayilari(liste) {
    var say = { tumu: liste.length, var: 0, eksik: 0, yok: 0, incelenmedi: 0 };
    liste.forEach(function (dosya) { say[dosya.durum] = (say[dosya.durum] || 0) + 1; });
    return say;
  }

  function dosyaSatiri(dosya) {
    var durum = ISG.DOSYA_DURUMLARI[dosya.durum] || { ad: dosya.durum, sinif: 'notr' };
    var tarihDurum = ISG.dosyaDurumEtiketi(dosya);
    var belgeSayisi = ISG.depo.belgeler(dosya.id).length;
    return '<tr>' +
      '<td><span class="dosya-no">' + kacis(dosya.no) + '</span></td>' +
      '<td><span class="dosya-madde">' + kacis(dosya.madde) + '</span>' +
        '<span class="dosya-bolum">BÖLÜM: ' + kacis(dosya.bolum) + (dosya.aciklama ? ' · ' + kacis(dosya.aciklama) : '') +
          (belgeSayisi ? ' · ' + belgeSayisi + ' belge' : '') + '</span></td>' +
      '<td>' + kacis(isyeriAdi(dosya.isyeriId)) + '</td>' +
      '<td>' + B.rozet(durum.ad, durum.sinif) + (dosya.sorumlu ? '<span class="hucre-alt">' + kacis(dosya.sorumlu) + '</span>' : '') + '</td>' +
      '<td><div class="tarih-liste">' +
        '<span>Yenileme: <b class="' + (tarihDurum.sinif === 'tehlike' ? 'tehlike' : (tarihDurum.sinif === 'uyari' ? 'uyari' : '')) + '">' + (dosya.yenileme ? B.tarih(dosya.yenileme) : 'Belirlenmedi') + '</b></span>' +
        '<span class="rozet ' + tarihDurum.sinif + '" style="justify-self:start">' + kacis(tarihDurum.ad) + '</span>' +
        '<span>Kontrol: ' + B.tarih(dosya.kontrolTarihi) + '</span>' +
      '</div></td>' +
      '<td class="sag"><div class="dosya-eylem">' +
        '<button type="button" data-islem="dosya-duzenle" data-id="' + kacis(dosya.id) + '">Düzenle</button>' +
        '<button type="button" data-islem="dosya-dof" data-id="' + kacis(dosya.id) + '">DÖF oluştur</button>' +
        '<button type="button" class="sil" data-islem="dosya-sil" data-id="' + kacis(dosya.id) + '">Sil</button>' +
      '</div></td>' +
    '</tr>';
  }

  SAYFALAR.dosyalar = function () {
    var hesap = veri();
    var temel = dosyaTemelListe(hesap);
    var sayilar = dosyaDurumSayilari(temel);
    var sekme = UI.dosyaSekme || 'tumu';
    var liste = sekme === 'tumu' ? temel : temel.filter(function (dosya) { return dosya.durum === sekme; });

    var boyut = Number(UI.dosyaBoyut) || 25;
    var sayfaSayisi = Math.max(1, Math.ceil(liste.length / boyut));
    var sayfa = Math.min(Math.max(1, Number(UI.dosyaSayfa) || 1), sayfaSayisi);
    var dilim = liste.slice((sayfa - 1) * boyut, sayfa * boyut);

    var bolumler = [];
    ISG.kapsamda(hesap, UI.kapsam, 'dosyalar').forEach(function (dosya) {
      if (bolumler.indexOf(dosya.bolum) < 0) { bolumler.push(dosya.bolum); }
    });
    bolumler.sort(function (a, b) { return a.localeCompare(b, 'tr'); });

    var ozet = ISG.dosyaOzeti(ISG.kapsamda(hesap, UI.kapsam, 'dosyalar'));
    var satirlar = dilim.map(dosyaSatiri).join('');

    return P.sayfaBaslik('DOSYA KONTROLLERİ', 'Dosya kontrolleri', 'İşyeri bazında kayıt ve durum takibi',
      '<button type="button" class="dugme" data-islem="dosya-csv">' + B.ikon('i-download') + 'Excel indir</button>' +
      '<button type="button" class="dugme birincil" data-islem="dosya-yeni" data-isyeri="' + kacis(UI.kapsam || '') + '">' + B.ikon('i-plus') + 'Yeni madde ekle</button>') +

      P.kapsamSecici(hesap) +

      '<div class="kpi-izgara">' +
        P.kpi({ baslik: 'Süresi geçen', ikon: 'i-alert', deger: B.sayi(ozet.gecen), alt: 'Kırmızı uyarı · Listelemek için tıklayın', sinif: 'tehlike', islem: 'dosya-tarih-filtre', filtre: 'gecen' }) +
        P.kpi({ baslik: 'Bugün yenilenmeli', ikon: 'i-clock', deger: B.sayi(ozet.bugun), alt: 'Bugün işlem yapın', sinif: 'tehlike', islem: 'dosya-tarih-filtre', filtre: 'bugun' }) +
        P.kpi({ baslik: 'Süresi yaklaşan', ikon: 'i-calendar', deger: B.sayi(ozet.yaklasan), alt: '1–14 gün içinde', sinif: 'uyari', islem: 'dosya-tarih-filtre', filtre: 'yaklasan' }) +
        P.kpi({ baslik: 'Tarih girilmemiş', ikon: 'i-calendar', deger: B.sayi(ozet.tarihsiz), alt: 'Yenileme tarihini belirleyin', sinif: 'soluk', islem: 'dosya-tarih-filtre', filtre: 'tarihsiz' }) +
      '</div>' +

      '<div class="lejant"><span class="rozet uyari">7–14 gün: sarı</span><span class="rozet tehlike">7 günden az / geçiken: kırmızı</span>' +
        '<span>Uyarılar belge yenileme tarihine göre hesaplanır.</span></div>' +

      '<section class="kart">' +
        '<div class="filtre-cubugu">' +
          '<div class="arama">' + B.ikon('i-search') +
            '<input type="search" data-ui="dosyaArama" value="' + kacis(UI.dosyaArama || '') + '" placeholder="Madde, açıklama veya sorumlu ara…" aria-label="Kontrol maddesi ara">' +
          '</div>' +
          '<select data-ui="dosyaBolum" aria-label="Bölüm filtresi"><option value="">Tüm bölümler</option>' +
            bolumler.map(function (bolum) { return '<option value="' + kacis(bolum) + '"' + (UI.dosyaBolum === bolum ? ' selected' : '') + '>' + kacis(bolum) + '</option>'; }).join('') +
          '</select>' +
          '<select data-ui="dosyaTarih" aria-label="Yenileme süresi filtresi">' +
            '<option value="">Tüm tarihler</option>' +
            '<option value="gecen"' + (UI.dosyaTarih === 'gecen' ? ' selected' : '') + '>Süresi geçen</option>' +
            '<option value="bugun"' + (UI.dosyaTarih === 'bugun' ? ' selected' : '') + '>Bugün</option>' +
            '<option value="yaklasan"' + (UI.dosyaTarih === 'yaklasan' ? ' selected' : '') + '>14 gün içinde</option>' +
            '<option value="tarihsiz"' + (UI.dosyaTarih === 'tarihsiz' ? ' selected' : '') + '>Tarih girilmemiş</option>' +
          '</select>' +
        '</div>' +
        '<div class="sekme-satir">' +
          [['tumu', 'Tümü'], ['eksik', 'Eksik'], ['var', 'Var'], ['yok', 'Yok'], ['incelenmedi', 'İncelenmedi']].map(function (ikili) {
            return '<button type="button" class="sekme' + (sekme === ikili[0] ? ' aktif' : '') + '" data-islem="dosya-sekme" data-sekme="' + ikili[0] + '">' +
              ikili[1] + ' <b>' + B.sayi(sayilar[ikili[0]] || 0) + '</b></button>';
          }).join('') +
        '</div>' +
        '<div class="filtre-ozet">' +
          '<span><strong>' + B.sayi(liste.length) + '</strong> kayıt gösteriliyor</span>' +
          '<span class="sag-arac"><label class="filtre-etiket" for="dosyaBoyut">Sayfada</label>' +
            '<select id="dosyaBoyut" data-ui="dosyaBoyut" style="padding:6px 10px;border:1px solid var(--line-strong);border-radius:8px;background:#fff">' +
              [10, 25, 50, 100].map(function (adet) { return '<option value="' + adet + '"' + (boyut === adet ? ' selected' : '') + '>' + adet + ' kayıt</option>'; }).join('') +
            '</select></span>' +
        '</div>' +
        '<div class="tablo-kap"><table class="tablo-kucuk">' +
          '<thead><tr><th>#</th><th>Kontrol maddesi</th><th>İşyeri</th><th>Durum</th><th>Tarihler</th><th class="sag">İşlemler</th></tr></thead>' +
          '<tbody>' + (satirlar || '<tr><td colspan="6">' + B.bosDurum('Kayıt bulunamadı', 'Filtreleri sıfırlayın ya da yeni kontrol maddesi ekleyin.', 'i-folder') + '</td></tr>') + '</tbody>' +
        '</table></div>' +
        '<div class="filtre-ozet" style="border-top:1px solid var(--line)">' +
          '<span class="muted">' + (liste.length ? ((sayfa - 1) * boyut + 1) + '–' + Math.min(sayfa * boyut, liste.length) + ' / ' + B.sayi(liste.length) : '0 kayıt') + '</span>' +
          '<span class="sag-arac">' + B.sayfalama(liste.length, sayfa, boyut) + '</span>' +
        '</div>' +
      '</section>';
  };

  /* ---------- Çalışma planı ---------- */

  function ilkYardimIhtiyaci(isyeri) {
    var carpan = isyeri.tehlikeSinifi === 'cokTehlikeli' ? 10 : (isyeri.tehlikeSinifi === 'az' ? 20 : 15);
    return Math.max(1, Math.ceil((Number(isyeri.calisanSayisi) || 0) / carpan));
  }

  function ilkYardimDurumu(isyeri, hesap) {
    var kisiIdleri = hesap.personel.filter(function (p) { return p.isyeriId === isyeri.id; }).map(function (p) { return p.id; });
    var mevcut = hesap.egitimler.filter(function (e) {
      return e.tur === 'ilkYardim' && kisiIdleri.indexOf(e.personelId) >= 0 && (ISG.gunFarki(e.gecerlilik) || 0) >= 0;
    }).length;
    var ihtiyac = ilkYardimIhtiyaci(isyeri);
    return { mevcut: mevcut, ihtiyac: ihtiyac, tam: mevcut >= ihtiyac };
  }

  function planOzet(liste) {
    var ozet = { geciken: 0, bugun: 0, yaklasan: 0, tarihsiz: 0, tamamlandi: 0 };
    liste.forEach(function (plan) {
      var durum = ISG.planDurumu(plan);
      if (durum.id === 'tamamlandi') { ozet.tamamlandi += 1; return; }
      if (durum.id === 'geciken') { ozet.geciken += 1; return; }
      if (durum.id === 'bugun') { ozet.bugun += 1; return; }
      if (durum.id === 'planlanmadi') { ozet.tarihsiz += 1; return; }
      ozet.yaklasan += 1;
    });
    return ozet;
  }

  function planSatiri(plan) {
    var durum = ISG.planDurumu(plan);
    return '<tr>' +
      '<td class="sayi-sutun">' + kacis(plan.sira) + '</td>' +
      '<td><strong>' + kacis(plan.faaliyet) + '</strong>' +
        '<span class="hucre-alt">' + kacis(isyeriAdi(plan.isyeriId)) + (plan.aciklama ? ' · ' + kacis(plan.aciklama) : '') + '</span></td>' +
      '<td>' + kacis(plan.sorumlu || '—') + '</td>' +
      '<td class="sayi-sutun">' + (plan.takipTarihi ? B.tarih(plan.takipTarihi) : '—') +
        (plan.tamamlanmaTarihi ? '<span class="hucre-alt">Tamamlandı: ' + B.tarih(plan.tamamlanmaTarihi) + '</span>' : '') + '</td>' +
      '<td>' + B.rozet(durum.ad, durum.sinif) + '</td>' +
      '<td class="sag"><div class="dosya-eylem">' +
        (plan.durum === 'tamamlandi' ? '<button type="button" data-islem="plan-geri-al" data-id="' + kacis(plan.id) + '">Takvime al</button>' :
          '<button type="button" data-islem="plan-tamamla" data-id="' + kacis(plan.id) + '">Tamamlandı işaretle</button>') +
        '<button type="button" data-islem="plan-duzenle" data-id="' + kacis(plan.id) + '">Düzenle</button>' +
        '<button type="button" class="sil" data-islem="plan-sil" data-id="' + kacis(plan.id) + '">Sil</button>' +
      '</div></td>' +
    '</tr>';
  }

  function ilkYardimKartlari(hesap, isyerleri) {
    return isyerleri.map(function (isyeri) {
      var durum = ilkYardimDurumu(isyeri, hesap);
      return '<div class="plan-kucuk-kart">' +
        '<h4>' + kacis(isyeri.ad) + '</h4>' +
        '<div class="satir"><span>Çalışan sayısı</span><b>' + B.sayi(isyeri.calisanSayisi) + '</b></div>' +
        '<div class="satir"><span>İlk yardımcı ihtiyacı</span><b>' + durum.ihtiyac + ' kişi</b></div>' +
        '<div class="satir"><span>Kayıtlı ilk yardımcı</span><b>' + durum.mevcut + ' kişi</b></div>' +
        '<div class="satir">' + (durum.tam ? B.rozet('Yeterli', 'iyi') : B.rozet('Eksik', 'tehlike')) +
          '<button type="button" class="akis" data-islem="egitim-listesi" data-id="' + kacis(isyeri.id) + '">Eğitim kayıtları →</button></div>' +
      '</div>';
    }).join('') || '<p class="bolum-aciklama">İşyeri bulunmuyor.</p>';
  }

  function yillikPlanKartlari(hesap, isyerleri) {
    return isyerleri.map(function (isyeri) {
      var kayitlar = ISG.kapsamda(hesap, isyeri.id, 'planlar').filter(function (plan) { return plan.durum !== 'planlanmadi'; }).slice(0, 6);
      return '<div class="plan-kart">' +
        '<div class="plan-kart-ust"><h3>' + kacis(isyeri.ad) + '</h3>' +
          '<button type="button" class="dugme kucuk" data-islem="plan-yeni" data-isyeri="' + kacis(isyeri.id) + '">' + B.ikon('i-plus') + 'Faaliyet</button></div>' +
        '<div class="plan-liste">' + (kayitlar.length ? kayitlar.map(function (plan) {
          var durum = ISG.planDurumu(plan);
          return '<div class="plan-satir">' +
            '<span class="plan-ay">' + (plan.ay ? B.AYLAR[Number(plan.ay) - 1].slice(0, 3) : '—') + '</span>' +
            '<span class="plan-metin">' + kacis(plan.faaliyet) + '<small>' + kacis(plan.sorumlu || '') + ' · ' + B.tarih(plan.takipTarihi) + '</small></span>' +
            '<span class="rozet ' + durum.sinif + '">' + kacis(durum.ad) + '</span>' +
          '</div>';
        }).join('') : '<p class="bolum-aciklama">Bu işyeri için plan faaliyeti yok.</p>') + '</div>' +
        '<div class="satir-arac">' + B.rozet(kayitlar.filter(function (p) { return p.durum === 'tamamlandi'; }).length + ' tamamlandı', 'bilgi') +
          '<button type="button" class="akis sag-arac" data-islem="plan-yeni" data-isyeri="' + kacis(isyeri.id) + '">Faaliyet ekle →</button></div>' +
      '</div>';
    }).join('') || '<p class="bolum-aciklama">İşyeri bulunmuyor.</p>';
  }

  SAYFALAR.plan = function () {
    var hesap = veri();
    var isyerleri = (hesap.isyerleri || []).filter(function (isyeri) { return !UI.kapsam || isyeri.id === UI.kapsam; });
    var planlar = ISG.kapsamda(hesap, UI.kapsam, 'planlar');
    var ozet = planOzet(planlar);

    return P.sayfaBaslik('ÇALIŞMA PLANI', 'Çalışma planı', 'İşyeri bazında kayıt ve durum takibi',
      '<button type="button" class="dugme" data-islem="plan-csv">' + B.ikon('i-download') + 'Excel indir</button>' +
      '<button type="button" class="dugme birincil" data-islem="plan-yeni" data-isyeri="' + kacis(UI.kapsam || '') + '">' + B.ikon('i-plus') + 'Plan faaliyeti ekle</button>') +
      P.kapsamSecici(hesap) +

      '<section class="kart"><div class="kart-baslik"><div><h2>İlk yardımcı ihtiyacı</h2>' +
        '<p>Tehlike sınıfına göre asgari ilk yardımcı sayısı ve mevcut sertifika durumu.</p></div></div>' +
        '<div class="kart-ic"><div class="plan-izgara-kucuk">' + ilkYardimKartlari(hesap, isyerleri) + '</div></div>' +
      '</section>' +

      '<div class="kpi-izgara">' +
        P.kpi({ baslik: 'Geciken', ikon: 'i-alert', deger: B.sayi(ozet.geciken), alt: 'Plan faaliyetleri', sinif: 'tehlike', islem: 'plan-filtre', filtre: 'geciken' }) +
        P.kpi({ baslik: 'Bugün yenilenmeli', ikon: 'i-clock', deger: B.sayi(ozet.bugun), alt: 'Bugün yapılacak', sinif: 'uyari', islem: 'plan-filtre', filtre: 'bugun' }) +
        P.kpi({ baslik: 'Süresi yaklaşan', ikon: 'i-calendar', deger: B.sayi(ozet.yaklasan), alt: 'Takvimde', sinif: 'bilgi', islem: 'plan-filtre', filtre: 'yaklasan' }) +
        P.kpi({ baslik: 'Tarihlendirilmemiş', ikon: 'i-flag', deger: B.sayi(ozet.tarihsiz), alt: 'Takip tarihi belirleyin', sinif: 'soluk', islem: 'plan-filtre', filtre: 'tarihsiz' }) +
      '</div>' +

      '<section class="kart"><div class="kart-baslik"><div><h2>Yıllık çalışma planı</h2>' +
        '<p>İşyeri bazında yıl içi faaliyet takvimi.</p></div></div>' +
        '<div class="kart-ic"><div class="plan-izgara">' + yillikPlanKartlari(hesap, isyerleri) + '</div></div>' +
      '</section>' +

      '<section class="kart"><div class="kart-baslik"><div><h2>Çalışma planı ve takip</h2>' +
        '<p>Takip tarihi ve durum bilgisiyle plan kalemleri.</p></div>' +
        '<div class="kart-arac"><span class="muted kucuk">' + B.sayi(planlar.length) + ' kayıt</span></div></div>' +
        '<div class="tablo-kap"><table class="tablo-kucuk">' +
          '<thead><tr><th>#</th><th>Faaliyet</th><th>Sorumlu</th><th>Tarih</th><th>Durum</th><th class="sag">İşlemler</th></tr></thead>' +
          '<tbody>' + (planlar.length ? planlar.map(function (plan) { return planSatiri(plan); }).join('') :
            '<tr><td colspan="6">' + B.bosDurum('Plan kalemi yok', 'Yeni bir faaliyet ekleyerek yıllık planı oluşturun.', 'i-plan') + '</td></tr>') + '</tbody>' +
        '</table></div>' +
      '</section>';
  };

  /* ---------- Saha ve DÖF ---------- */

  function tespitListesi(hesap) {
    var liste = ISG.kapsamda(hesap, UI.kapsam, 'tespitler');
    var arama = String(UI.sahaArama || '').toLocaleLowerCase('tr');
    return liste.filter(function (tespit) {
      if (arama && [tespit.tespit, tespit.konum, tespit.sorumlu].join(' ').toLocaleLowerCase('tr').indexOf(arama) < 0) { return false; }
      if (UI.sahaDurum === 'acik' && tespit.durum !== 'acik') { return false; }
      if (UI.sahaDurum === 'geciken' && ISG.tespitDurumu(tespit).id !== 'geciken') { return false; }
      if (UI.sahaDurum === 'dogrulama' && tespit.durum !== 'dogrulama') { return false; }
      if (UI.sahaDurum === 'kapali' && tespit.durum !== 'kapali') { return false; }
      if (UI.sahaOncelik && tespit.oncelik !== UI.sahaOncelik) { return false; }
      if (UI.sahaTur && tespit.tur !== UI.sahaTur) { return false; }
      return true;
    });
  }

  function tespitSatiri(tespit) {
    var durum = ISG.tespitDurumu(tespit);
    var oncelikSinif = tespit.oncelik === 'kritik' ? 'tehlike' : (tespit.oncelik === 'yuksek' ? 'uyari' : 'bilgi');
    var oncelikAd = { kritik: 'Kritik', yuksek: 'Yüksek', orta: 'Orta', dusuk: 'Düşük' }[tespit.oncelik] || tespit.oncelik;
    return '<div class="tespit-satir">' +
      '<div>' +
        '<div class="tespit-ust">' +
          B.rozet(oncelikAd, oncelikSinif) +
          '<span class="tespit-baslik">' + kacis(tespit.tespit) + '</span>' +
        '</div>' +
        '<div class="tespit-alt">' + kacis(isyeriAdi(tespit.isyeriId)) + ' · ' + kacis(tespit.konum || 'Konum belirtilmedi') +
          ' · Sorumlu: ' + kacis(tespit.sorumlu || '—') + ' · Tür: ' + kacis(tespit.tur || '—') +
          ' · Termin: ' + B.tarih(tespit.termin) + (tespit.termin ? ' (' + B.kalan(ISG.gunFarki(tespit.termin)) + ')' : '') + '</div>' +
        (tespit.not ? '<div class="tespit-not">' + kacis(tespit.not) + '</div>' : '') +
      '</div>' +
      '<div class="tespit-sag">' +
        '<span class="rozet ' + durum.sinif + '">' + kacis(durum.ad) + '</span>' +
        '<div class="tespit-eylem">' +
          (tespit.durum === 'acik' ? '<button type="button" class="dugme kucuk" data-islem="tespit-dogrula" data-id="' + kacis(tespit.id) + '">Doğrulamaya gönder</button>' : '') +
          (tespit.durum !== 'kapali' ? '<button type="button" class="dugme kucuk birincil" data-islem="tespit-kapat" data-id="' + kacis(tespit.id) + '">Kapat</button>' : '') +
          '<button type="button" class="dugme kucuk" data-islem="tespit-duzenle" data-id="' + kacis(tespit.id) + '">Düzenle</button>' +
          '<button type="button" class="dugme kucuk tehlike-dugme" data-islem="tespit-sil" data-id="' + kacis(tespit.id) + '">Sil</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function sahaOlayKarti(olaylar, hesap) {
    var satirlar = olaylar.map(function (olay) {
      var kisi = hesap.personel.filter(function (p) { return p.id === olay.personelId; })[0];
      var tur = ISG.OLAY_TURLERI[olay.tur] || { ad: olay.tur, sinif: 'notr' };
      return '<tr>' +
        '<td>' + B.rozet(tur.ad, tur.sinif) + '<span class="hucre-alt">' + B.tarih(olay.tarih) + '</span></td>' +
        '<td>' + kacis(olay.yer || '—') + '</td>' +
        '<td>' + kacis(kisi ? kisi.adSoyad : '—') + '</td>' +
        '<td>' + kacis(olay.aciklama) + (olay.kokNeden ? '<span class="hucre-alt">Kök neden: ' + kacis(olay.kokNeden) + '</span>' : '') + '</td>' +
        '<td>' + B.rozet(olay.durum === 'kapali' ? 'Kapatıldı' : 'Açık', olay.durum === 'kapali' ? 'iyi' : 'tehlike') + '</td>' +
        '<td class="sag"><div class="dosya-eylem">' +
          '<button type="button" data-islem="olay-kapat" data-id="' + kacis(olay.id) + '">' + (olay.durum === 'kapali' ? 'Yeniden aç' : 'Kapat') + '</button>' +
          '<button type="button" class="sil" data-islem="olay-sil" data-id="' + kacis(olay.id) + '">Sil</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');

    return '<section class="kart"><div class="kart-baslik"><div><h2>Ramak kala ve olay bildirimleri</h2>' +
      '<p>Olay kayıtları kök neden analiziyle kapatılır.</p></div>' +
      '<div class="kart-arac"><span class="muted kucuk">' + B.sayi(olaylar.length) + ' bildirim</span></div></div>' +
      '<div class="tablo-kap"><table class="tablo-kucuk">' +
        '<thead><tr><th>Tür / tarih</th><th>Yer</th><th>Personel</th><th>Açıklama / kök neden</th><th>Durum</th><th class="sag">İşlem</th></tr></thead>' +
        '<tbody>' + (satirlar || '<tr><td colspan="6">' + B.bosDurum('Bildirim yok', 'Ramak kala bildirimi teşvik edilir; cezalandırıcı olmayan kayıt kültürü kaza oranını düşürür.', 'i-alert') + '</td></tr>') + '</tbody>' +
      '</table></div>' +
    '</section>';
  }

  SAYFALAR.saha = function () {
    var hesap = veri();
    var tumu = ISG.kapsamda(hesap, UI.kapsam, 'tespitler');
    var ozet = ISG.tespitOzeti(tumu);
    var liste = tespitListesi(hesap);
    var olaylar = ISG.kapsamda(hesap, UI.kapsam, 'olaylar');
    var kazalar = olaylar.filter(ISG.kazaKaydi)
      .sort(function (a, b) { return String(b.tarih).localeCompare(String(a.tarih)); });
    var digerOlaylar = olaylar.filter(function (olay) { return !ISG.kazaKaydi(olay); });

    return P.sayfaBaslik('SAHA VE DÖF', 'Saha ve DÖF', 'İşyeri bazında kayıt ve durum takibi',
      '<button type="button" class="dugme birincil" data-islem="tespit-yeni" data-isyeri="' + kacis(UI.kapsam || '') + '">' + B.ikon('i-plus') + 'Tespit ekle</button>') +
      P.kapsamSecici(hesap) +

      '<section class="kart"><div class="kart-baslik" style="flex-direction:column;align-items:flex-start">' +
        '<h2>Saha tespitinden doğrulanmış çözüme</h2>' +
        '<p>Tehlikeli durum, uygunsuzluk ve ramak kalan her kaydı takip edin.</p></div>' +
        '<div class="kart-ic"><div class="kpi-izgara">' +
          P.kpi({ baslik: 'Açık tespit', ikon: 'i-clipboard', deger: B.sayi(ozet.acik), alt: 'DÖF bekleyen', sinif: 'bilgi', islem: 'saha-filtre', filtre: 'acik' }) +
          P.kpi({ baslik: 'Geciken faaliyetler', ikon: 'i-clock', deger: B.sayi(ozet.geciken), alt: 'Termini geçen', sinif: 'tehlike', islem: 'saha-filtre', filtre: 'geciken' }) +
          P.kpi({ baslik: 'Doğrulama bekleyen', ikon: 'i-check', deger: B.sayi(ozet.dogrulama), alt: 'Kapanış kontrolü', sinif: 'uyari', islem: 'saha-filtre', filtre: 'dogrulama' }) +
          P.kpi({ baslik: 'Doğrulanarak kapatılan', ikon: 'i-shield', deger: B.sayi(ozet.kapali), alt: 'Arşivlenen kayıt', sinif: 'soluk', islem: 'saha-filtre', filtre: 'kapali' }) +
        '</div></div>' +
      '</section>' +

      '<section class="kart">' +
        '<div class="filtre-cubugu">' +
          '<div class="arama">' + B.ikon('i-search') +
            '<input type="search" data-ui="sahaArama" value="' + kacis(UI.sahaArama || '') + '" placeholder="Tespit, konum, sorumlu ara…" aria-label="Tespit ara">' +
          '</div>' +
          '<select data-ui="sahaDurum" aria-label="Durum filtresi">' +
            '<option value="">Tüm durumlar</option>' +
            ['acik', 'geciken', 'dogrulama', 'kapali'].map(function (id) {
              var ad = { acik: 'Açık tespitler', geciken: 'Gecikenler', dogrulama: 'Doğrulama bekleyen', kapali: 'Kapatılanlar' }[id];
              return '<option value="' + id + '"' + (UI.sahaDurum === id ? ' selected' : '') + '>' + ad + '</option>';
            }).join('') +
          '</select>' +
          '<select data-ui="sahaOncelik" aria-label="Öncelik filtresi"><option value="">Tüm öncelikler</option>' +
            ['kritik', 'yuksek', 'orta', 'dusuk'].map(function (id) {
              var ad = { kritik: 'Kritik', yuksek: 'Yüksek', orta: 'Orta', dusuk: 'Düşük' }[id];
              return '<option value="' + id + '"' + (UI.sahaOncelik === id ? ' selected' : '') + '>' + ad + '</option>';
            }).join('') + '</select>' +
          '<select data-ui="sahaTur" aria-label="Tür filtresi"><option value="">Tüm türler</option>' +
            ['Uygunsuzluk', 'Eksiklik', 'Davranış', 'Ramak kala'].map(function (ad) {
              return '<option value="' + ad + '"' + (UI.sahaTur === ad ? ' selected' : '') + '>' + ad + '</option>';
            }).join('') + '</select>' +
        '</div>' +
        '<div class="filtre-ozet"><span>' + B.sayi(liste.length) + ' tespit · Öncelik ve terminde göre</span>' +
          '<span class="sag-arac">' +
            '<button type="button" class="dugme ince" data-islem="yenile">' + B.ikon('i-refresh') + 'Yenile</button>' +
            '<button type="button" class="dugme ince" data-islem="saha-csv">' + B.ikon('i-download') + 'Excel indir</button>' +
          '</span>' +
        '</div>' +
        (liste.length ? '<div class="tespit-list">' + liste.map(tespitSatiri).join('') + '</div>' :
          '<div class="kart-ic">' + B.bosDurum('Henüz saha tespiti eklenmedi', 'Bir tespit ekleyin; sorumlu, termin, yapılan işlem ve kanıtları aynı kayıtta takip edin.', 'i-clipboard') +
            '<div class="satir-arac" style="justify-content:center;margin-top:6px">' +
              '<button type="button" class="dugme birincil" data-islem="tespit-yeni" data-isyeri="' + kacis(UI.kapsam || '') + '">' + B.ikon('i-plus') + 'Tespit ekle</button>' +
            '</div></div>') +
      '</section>' +
      sahaOlayKarti(digerOlaylar, hesap) +
      P.kazaTablosu(kazalar, hesap);
  };
})(window);






