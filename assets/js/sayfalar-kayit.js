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
    /* Hazır listeden üretilen maddeler tek hamlede listelenebilir/silinebilir. */
    if (UI.dosyaSablon) {
      liste = liste.filter(function (dosya) { return (dosya.sablon || '') === UI.dosyaSablon; });
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

  /* Bu bölüm: hazır listelerin özeti, kaynak filtresi ve silme düğmesi;
     düğmeler görüntüleyici rolüne hiçbir zaman gösterilmez. */
  /* Bu kapsama uygulanmış hazır listeler: kaynak filtresi ve tek hamlede
     silme düğmesi bu özetten beslenir. */
  function uygulananListeler(hesap) {
    if (typeof ISG.listeUygulananOzeti !== 'function') { return []; }
    return ISG.listeUygulananOzeti(ISG.kapsamda(hesap, UI.kapsam, 'dosyalar'));
  }

  /* Yanlış işyerine ya da yanlış bölüme eklenen liste tek tek silinmez;
     düğme silme diyaloğunu açar. Görüntüleyici rolü düğmeyi görmez. */
  function listeGeriAlDugmesi(uygulananlar) {
    if (!uygulananlar || !uygulananlar.length) { return ''; }
    if (ISG.yetki && !ISG.yetki.degistirebilir(UI.kapsam || '')) { return ''; }
    var adet = uygulananlar.reduce(function (toplam, ozet) { return toplam + ozet.adet; }, 0);
    return '<button type="button" class="dugme" data-islem="dosya-liste-geri-al" data-isyeri="' +
      kacis(UI.kapsam || '') + '">' + B.ikon('i-trash') +
      'Listeyi sil (' + B.sayi(adet) + ')</button>';
  }

  function kaynakFiltresi(uygulananlar) {
    if (!uygulananlar || !uygulananlar.length) { return ''; }
    return '<div class="filtre-cubugu"><label class="filtre-etiket" for="dosyaSablonSecim">Hazır liste kaynağı</label>' +
      '<select id="dosyaSablonSecim" data-ui="dosyaSablon" aria-label="Hazır liste kaynağı filtresi">' +
      '<option value="">Tüm kaynaklar</option>' +
      uygulananlar.map(function (ozet) {
        return '<option value="' + kacis(ozet.kod) + '"' + (UI.dosyaSablon === ozet.kod ? ' selected' : '') + '>' +
          'Liste: ' + kacis(ozet.kod) + ' (' + B.sayi(ozet.adet) + ' madde)</option>';
      }).join('') + '</select></div>';
  }


  /* Word'den üretilen hazır kontrol listesi varsa ekleme düğmesi görünür. */
  function listeDugmesi() {
    var sablonVar = typeof ISG.listeSablonBul === 'function' &&
      (ISG.KONTROL_LISTESI_SABLONLARI || []).length > 0;
    if (!sablonVar) { return ''; }
    if (ISG.yetki && !ISG.yetki.degistirebilir(UI.kapsam || '')) { return ''; }
    return '<button type="button" class="dugme" data-islem="dosya-liste" data-isyeri="' +
      kacis(UI.kapsam || '') + '">' + B.ikon('i-upload') + 'Hazır kontrol listesi</button>';
  }

  function dosyaSatiri(dosya) {
    var durum = ISG.DOSYA_DURUMLARI[dosya.durum] || { ad: dosya.durum, sinif: 'notr' };
    var tarihDurum = ISG.dosyaDurumEtiketi(dosya);
    /* Zaman baskısı (rozetten bağımsız): satırı ve yenileme tarihini boyar. */
    var zaman = ISG.dosyaZamanDurumu(dosya);
    var belgeSayisi = ISG.depo.belgeler(dosya.id).length;
    return '<tr' + (zaman.satirSinifi ? ' class="' + zaman.satirSinifi + '"' : '') + '>' +
      '<td><span class="dosya-no">' + kacis(dosya.no) + '</span></td>' +
      '<td><span class="dosya-madde">' + kacis(dosya.madde) + '</span>' +
        '<span class="dosya-bolum">BÖLÜM: ' + kacis(dosya.bolum) + (dosya.aciklama ? ' · ' + kacis(dosya.aciklama) : '') +
          (belgeSayisi ? ' · ' + belgeSayisi + ' belge' : '') + '</span></td>' +
      '<td>' + kacis(isyeriAdi(dosya.isyeriId)) + '</td>' +
      '<td>' + B.rozet(durum.ad, durum.sinif) + (dosya.sorumlu ? '<span class="hucre-alt">' + kacis(dosya.sorumlu) + '</span>' : '') + '</td>' +
      '<td><div class="tarih-liste">' +
        '<span>Yenileme: <b class="' + zaman.vadeSinif + '">' + (dosya.yenileme ? B.tarih(dosya.yenileme) : 'Belirlenmedi') + '</b></span>' +
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
    var uygulananlar = uygulananListeler(hesap);

    var satirlar = dilim.map(dosyaSatiri).join('');

    return P.sayfaBaslik('DOSYA KONTROLLERİ', 'Dosya kontrolleri', 'İşyeri bazında kayıt ve durum takibi',
      '<button type="button" class="dugme" data-islem="dosya-csv">' + B.ikon('i-download') + 'Excel indir</button>' +
      listeDugmesi() +
      listeGeriAlDugmesi(uygulananlar) +

      '<button type="button" class="dugme birincil" data-islem="dosya-yeni" data-isyeri="' + kacis(UI.kapsam || '') + '">' + B.ikon('i-plus') + 'Yeni madde ekle</button>') +

      P.kapsamSecici(hesap) +

      '<div class="kpi-izgara">' +
        P.kpi({ baslik: 'Süresi geçen', ikon: 'i-alert', deger: B.sayi(ozet.gecen), alt: 'Kırmızı satır · Listelemek için tıklayın', sinif: 'tehlike', islem: 'dosya-tarih-filtre', filtre: 'gecen' }) +
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
          kaynakFiltresi(uygulananlar) +

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

  /* Kart sayaçları tek kaynaktan beslenir: görünen durum (ISG.planDurumu).
     Böylece türeyen "Gecikti" hem kartta, hem filtrede, hem tabloda aynı
     sayıyı verir. "Bugün" bir durum değil takvim kısayoludur. */
  function planOzet(liste) {
    var ozet = { planlandi: 0, tamamlandi: 0, tamamlanmadi: 0, gecikti: 0, planlanmadi: 0,
      toplam: liste.length, bekleyen: 0, bugun: 0 };
    var bugunIso = B.bugunIso();
    liste.forEach(function (plan) {
      var durum = ISG.planDurumu(plan);
      ozet[durum.id] = (ozet[durum.id] || 0) + 1;
      if (!durum.tamamlandi) {
        ozet.bekleyen += 1;
        if (plan.takipTarihi === bugunIso) { ozet.bugun += 1; }
      }
    });
    return ozet;
  }

  /* Durum filtresi: beş durum + "Bugün" kısayolu. Karttan ya da kutudan
     seçilir; liste, kart sayıları ve tablo aynı fonksiyonla süzülür. */
  function planDurumSecici() {
    var aktif = String(UI.planDurum || '');
    var secenekler = '<option value=""' + (aktif ? '' : ' selected') + '>Tüm durumlar</option>' +
      ISG.PLAN_DURUM_FILTRELERI.map(function (id) {
        return '<option value="' + id + '"' + (aktif === id ? ' selected' : '') + '>' +
          ISG.PLAN_DURUMLARI[id].ad + '</option>';
      }).join('') +
      '<option value="bugun"' + (aktif === 'bugun' ? ' selected' : '') + '>Bugün ödenecek</option>';
    return '<label class="plan-yil-secim"><span class="filtre-etiket">Durum</span>' +
      '<select data-ui="planDurum" aria-label="Durum filtresi">' + secenekler + '</select></label>';
  }

  function planDurumaGore(plan, filtre) {
    if (!filtre) { return true; }
    var durum = ISG.planDurumu(plan);
    if (filtre === 'bugun') { return !durum.tamamlandi && plan.takipTarihi === B.bugunIso(); }
    return durum.id === filtre;
  }

  /* Ay şeridi: Ocak-Aralık, planlanmış aylar işaretli; içinde bulunulan ay vurgulu. */
  function planAyCiplari(plan) {
    var planliAylar = ISG.planAylari(plan);
    var buAy = new Date().getMonth() + 1;
    var hucreler = '';
    for (var a = 1; a <= 12; a += 1) {
      var planli = planliAylar.indexOf(a) > -1;
      hucreler += '<span class="plan-hucre' + (planli ? ' planli' : '') +
        (planli && a === buAy ? ' buay' : '') + '" title="' + kacis(B.AYLAR[a - 1]) + '">' +
        kacis(B.AYLAR[a - 1].slice(0, 3)) + '</span>';
    }
    return '<div class="plan-aylar">' + hucreler + '</div>';
  }

  /* Ana başlık grupları: tek grup varsa başlık satırı basılmaz (liste sade kalır). */
  function planGruplari(liste) {
    var gruplar = [];
    var indeks = {};
    liste.forEach(function (plan) {
      var ad = ISG.planAnaBaslik(plan);
      if (typeof indeks[ad] === 'undefined') {
        indeks[ad] = gruplar.length;
        gruplar.push({ ad: ad, kayitlar: [] });
      }
      gruplar[indeks[ad]].kayitlar.push(plan);
    });
    return gruplar;
  }

  function planSirala(liste) {
    return liste.slice().sort(function (a, b) {
      var siraA = String(a.siraExcel || a.sira || '');
      var siraB = String(b.siraExcel || b.sira || '');
      var fark = siraA.localeCompare(siraB, 'tr', { numeric: true });
      if (fark) { return fark; }
      return String(a.faaliyet || '').localeCompare(String(b.faaliyet || ''), 'tr');
    });
  }

  /* Yıl filtresi: 0 "tüm yıllar" demektir; yılı belirsiz kayıtlar yalnızca tüm görünümde gelir. */
  function yilaGore(plan, yil) {
    if (!yil) { return true; }
    return ISG.planYil(plan) === Number(yil);
  }

  function planSatiri(plan, secim) {
    var durum = ISG.planDurumu(plan);
    var secili = secim && secim[plan.id] ? ' checked' : '';
    var altBilgi = [isyeriAdi(plan.isyeriId), ISG.planYil(plan) ? ISG.planYil(plan) + ' yılı' : '',
      plan.aciklama || ''].filter(Boolean).join(' · ');
    /* Durum hücresi: görünen rozet + vade bilgisi. Kayıtlı durum ile görünen
       durum farklıysa (tarih geçtiği hâlde tamamlanmamış gibi) ikisi de yazılır. */
    var durumAlt = durum.vadeAd
      ? '<span class="hucre-alt"><span class="' + durum.vadeSinif + '">' + kacis(durum.vadeAd) + '</span></span>' : '';
    if (durum.kayitliDurum !== durum.id) {
      durumAlt += '<span class="hucre-alt">Kayıtlı durum: ' + kacis(durum.kayitliAd) + '</span>';
    }
    return '<tr' + (durum.satirSinifi ? ' class="' + durum.satirSinifi + '"' : '') + '>' +
      '<td class="plan-sec-hucre"><input type="checkbox" data-plan-sec="' + kacis(plan.id) + '"' + secili +
        ' aria-label="' + kacis(plan.faaliyet) + ' kaydını seç"></td>' +
      '<td class="sayi-sutun">' + kacis(plan.siraExcel || plan.sira || '') + '</td>' +
      '<td><strong>' + kacis(plan.faaliyet) + '</strong>' +
        '<span class="hucre-alt">' + kacis(altBilgi) + '</span></td>' +
      '<td>' + kacis(plan.sorumlu || '—') + '</td>' +
      '<td class="plan-aylar-hucre">' + planAyCiplari(plan) + '</td>' +
      '<td class="sayi-sutun">' + (plan.takipTarihi ? B.tarih(plan.takipTarihi) : '—') +
        (plan.tamamlanmaTarihi ? '<span class="hucre-alt">Tamamlandı: ' + B.tarih(plan.tamamlanmaTarihi) + '</span>' : '') + '</td>' +
      '<td>' + B.rozet(durum.ad, durum.sinif) + durumAlt + '</td>' +
      '<td class="sag"><div class="dosya-eylem">' +
        (durum.tamamlandi
          ? '<button type="button" data-islem="plan-geri-al" data-id="' + kacis(plan.id) + '">Takvime geri al</button>'
          : '<button type="button" data-islem="plan-tamamla" data-id="' + kacis(plan.id) + '">Tamamlandı</button>' +
            '<button type="button" data-islem="plan-tamamlanmadi" data-id="' + kacis(plan.id) + '">Tamamlanmadı</button>') +
        '<button type="button" data-islem="plan-duzenle" data-id="' + kacis(plan.id) + '">Düzenle</button>' +
        '<button type="button" class="sil" data-islem="plan-sil" data-id="' + kacis(plan.id) + '">Sil</button>' +
      '</div></td>' +
    '</tr>';
  }


  /* Yıl seçimi: 'tumu' varsayılandır; yıllar kayıtlardan gelir. */
  function planYilSecici(hesap) {
    var yillar = ISG.planYillari(hesap, UI.kapsam);
    var aktif = UI.planYili ? String(UI.planYili) : 'tumu';
    var secenekler = '<option value="tumu"' + (aktif === 'tumu' ? ' selected' : '') + '>Tüm yıllar</option>' +
      yillar.map(function (yil) {
        return '<option value="' + yil + '"' + (aktif === String(yil) ? ' selected' : '') + '>' + yil + '</option>';
      }).join('');
    return '<label class="plan-yil-secim"><span class="filtre-etiket">Plan yılı</span>' +
      '<select id="planYili" data-ui="planYili" aria-label="Plan yılı">' + secenekler + '</select></label>';
  }

  /* Ay seçimi: Ocak-Aralık + "Tüm aylar". Seçilen ay, faaliyetin ay şeridinde
     ya da tek ay alanında geçiyorsa kayıt listelenir. */
  function planAyi(plan) {
    var aylar = ISG.planAylari(plan);
    if (aylar.length) { return aylar; }
    var tek = Number(plan && plan.ay);
    return tek >= 1 && tek <= 12 ? [tek] : [];
  }

  function planAySecici() {
    var aktif = String(UI.planAy || '');
    var secenekler = '<option value=""' + (aktif ? '' : ' selected') + '>Tüm aylar</option>' +
      (B.AYLAR || []).map(function (ad, sira) {
        var ay = sira + 1;
        return '<option value="' + ay + '"' + (aktif === String(ay) ? ' selected' : '') + '>' + ad + '</option>';
      }).join('');
    return '<label class="plan-yil-secim"><span class="filtre-etiket">Plan ayı</span>' +
      '<select id="planAy" data-ui="planAy" aria-label="Plan ayı">' + secenekler + '</select></label>';
  }

  function planSecimCubugu(planlar, secim) {
    var seciliSayi = planlar.filter(function (plan) { return !!secim[plan.id]; }).length;
    var tumuSecili = planlar.length > 0 && seciliSayi === planlar.length;
    var degistirebilir = !ISG.yetki || ISG.yetki.degistirebilir(UI.kapsam || '');
    return '<div class="plan-secim-cubugu">' +
      (degistirebilir ? '<label class="plan-tumu-sec"><input type="checkbox" data-plan-sec-tumu' +
        (tumuSecili ? ' checked' : '') + ' aria-label="Tümünü seç"> <span>Tümünü seç</span></label>' : '') +
      '<span class="filtre-etiket">' + B.sayi(seciliSayi) + ' kayıt seçili</span>' +
      (degistirebilir ? '<button type="button" class="dugme kucuk tehlike-dugme" data-islem="plan-sec-sil"' +
        (seciliSayi ? '' : ' disabled') + '>Seçilenleri sil</button>' : '') +
      '<button type="button" class="dugme kucuk" data-islem="plan-csv">' + B.ikon('i-download') + 'CSV indir</button>' +
    '</div>';
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

  function yillikPlanKartlari(hesap, isyerleri, yil) {
    return isyerleri.map(function (isyeri) {
      var kayitlar = planSirala(ISG.kapsamda(hesap, isyeri.id, 'planlar').filter(function (plan) {
        return plan.durum !== 'planlanmadi' && yilaGore(plan, yil);
      }));
      var yilRozet = yil ? B.rozet(yil + ' yılı', 'notr') : B.rozet(kayitlar.length + ' faaliyet', 'notr');
      return '<div class="plan-kart">' +
        '<div class="plan-kart-ust"><h3>' + kacis(isyeri.ad) + '</h3>' +
          '<button type="button" class="dugme kucuk" data-islem="plan-yeni" data-isyeri="' + kacis(isyeri.id) + '">' + B.ikon('i-plus') + 'Faaliyet</button></div>' +
        '<div class="plan-liste">' + (kayitlar.length ? kayitlar.slice(0, 8).map(function (plan) {
          var durum = ISG.planDurumu(plan);
          var aylar = ISG.planAylari(plan).map(function (a) { return B.AYLAR[a - 1].slice(0, 3); }).join(', ');
          var etiket = aylar || (plan.ay ? B.AYLAR[Number(plan.ay) - 1].slice(0, 3) : '—');
          return '<div class="plan-satir' + (durum.id === 'gecikti' ? ' plan-gecikti' : '') + '">' +
            '<span class="plan-ay">' + kacis(etiket) + '</span>' +
            '<span class="plan-metin">' + kacis(plan.faaliyet) + '<small>' + kacis(plan.sorumlu || '') + (plan.takipTarihi ? ' · ' + B.tarih(plan.takipTarihi) : '') + '</small></span>' +
            '<span class="rozet ' + durum.sinif + '">' + kacis(durum.ad) + '</span>' +
          '</div>';
        }).join('') : '<p class="bolum-aciklama">' + (yil ? yil + ' yılı için plan faaliyeti yok.' : 'Bu işyeri için plan faaliyeti yok.') + '</p>') + '</div>' +
        '<div class="satir-arac">' + yilRozet +
          B.rozet(kayitlar.filter(function (p) { return p.durum === 'tamamlandi'; }).length + ' tamamlandı', 'bilgi') +
          '<button type="button" class="akis sag-arac" data-islem="plan-yeni" data-isyeri="' + kacis(isyeri.id) + '">Faaliyet ekle →</button></div>' +
      '</div>';
    }).join('') || '<p class="bolum-aciklama">İşyeri bulunmuyor.</p>';
  }

  SAYFALAR.plan = function () {
    var hesap = veri();
    var isyerleri = (hesap.isyerleri || []).filter(function (isyeri) { return !UI.kapsam || isyeri.id === UI.kapsam; });
    var tumPlanlar = ISG.kapsamda(hesap, UI.kapsam, 'planlar');
    var yillar = ISG.planYillari(hesap, UI.kapsam);
    var seciliYil = UI.planYili && UI.planYili !== 'tumu' ? Number(UI.planYili) : 0;
    if (seciliYil && yillar.indexOf(seciliYil) < 0) { seciliYil = 0; }
    var planlar = planSirala(tumPlanlar.filter(function (plan) { return yilaGore(plan, seciliYil); }));
    var seciliAy = Number(UI.planAy) || 0;
    if (seciliAy < 1 || seciliAy > 12) { seciliAy = 0; }
    if (seciliAy) {
      planlar = planlar.filter(function (plan) { return planAyi(plan).indexOf(seciliAy) > -1; });
    }
    var aysiz = seciliAy ? tumPlanlar.filter(function (plan) { return !planAyi(plan).length; }).length : 0;
    var yilsiz = seciliYil ? tumPlanlar.filter(function (plan) { return !ISG.planYil(plan); }).length : 0;
    var ozet = planOzet(planlar);
    /* Kartlar yıl+ay süzgecinden geçmiş listayı sayar; durum filtresi yalnızca
       tabloyu daraltır. Aksi hâlde bir karta tıklayınca diğer kartlar sıfırlanır. */
    var durumFiltre = String(UI.planDurum || '');
    if (durumFiltre) {
      planlar = planlar.filter(function (plan) { return planDurumaGore(plan, durumFiltre); });
    }
    var durumFiltreAdi = durumFiltre
      ? (durumFiltre === 'bugun' ? 'Bugün ödenecek' : (ISG.PLAN_DURUMLARI[durumFiltre] || {}).ad || durumFiltre) : '';
    var secim = UI.planSecim || {};
    var gruplar = planGruplari(planlar);
    var tekGrup = gruplar.length <= 1;
    var govde = '';
    gruplar.forEach(function (grup) {
      if (!tekGrup) {
        govde += '<tr class="plan-grup"><td colspan="8"><strong>' + kacis(grup.ad) + '</strong>' +
          '<span class="hucre-alt">' + B.sayi(grup.kayitlar.length) + ' faaliyet</span></td></tr>';
      }
      govde += grup.kayitlar.map(function (plan) { return planSatiri(plan, secim); }).join('');
    });

    return P.sayfaBaslik('ÇALIŞMA PLANI', 'Çalışma planı', 'İşyeri bazında kayıt ve durum takibi',
      '<button type="button" class="dugme" data-islem="plan-sablon">' + B.ikon('i-download') + 'Örnek Excel şablonunu indir</button>' +
      '<button type="button" class="dugme" data-islem="plan-toplu-yukle" data-isyeri="' + kacis(UI.kapsam || '') + '">' + B.ikon('i-upload') + 'Excel\'den toplu yükle</button>' +
      '<button type="button" class="dugme" data-islem="plan-excel">' + B.ikon('i-download') + 'Excel\'e aktar</button>' +
      '<button type="button" class="dugme tehlike-dugme" data-islem="plan-toplu-sil" data-isyeri="' + kacis(UI.kapsam || '') + '">' + B.ikon('i-trash') + 'Toplu sil</button>' +
      '<button type="button" class="dugme birincil" data-islem="plan-yeni" data-isyeri="' + kacis(UI.kapsam || '') + '">' + B.ikon('i-plus') + 'Plan faaliyeti ekle</button>') +
      P.kapsamSecici(hesap) +

      '<section class="kart"><div class="kart-baslik"><div><h2>İlk yardımcı ihtiyacı</h2>' +
        '<p>Tehlike sınıfına göre asgari ilk yardımcı sayısı ve mevcut sertifika durumu.</p></div></div>' +
        '<div class="kart-ic"><div class="plan-izgara-kucuk">' + ilkYardimKartlari(hesap, isyerleri) + '</div></div>' +
      '</section>' +

      '<div class="kpi-izgara kpi-izgara-alti">' +
        P.kpi({ baslik: 'Gecikti', ikon: 'i-alert', deger: B.sayi(ozet.gecikti), alt: 'Tarihi geçti, tamamlanmadı', sinif: 'tehlike', islem: 'plan-durum-filtre', filtre: 'gecikti' }) +
        P.kpi({ baslik: 'Tamamlanmadı', ikon: 'i-close', deger: B.sayi(ozet.tamamlanmadi), alt: 'Yapılmadı olarak işaretli', sinif: 'tehlike', islem: 'plan-durum-filtre', filtre: 'tamamlanmadi' }) +
        P.kpi({ baslik: 'Planlandı', ikon: 'i-calendar', deger: B.sayi(ozet.planlandi), alt: 'Vadesi beklenen faaliyet', sinif: 'bilgi', islem: 'plan-durum-filtre', filtre: 'planlandi' }) +
        P.kpi({ baslik: 'Tamamlandı', ikon: 'i-check', deger: B.sayi(ozet.tamamlandi), alt: 'Bekleyen iş: ' + B.sayi(ozet.bekleyen), sinif: 'iyi', islem: 'plan-durum-filtre', filtre: 'tamamlandi' }) +
        P.kpi({ baslik: 'Planlanmadı', ikon: 'i-flag', deger: B.sayi(ozet.planlanmadi), alt: 'Takip tarihi belirleyin', sinif: 'soluk', islem: 'plan-durum-filtre', filtre: 'planlanmadi' }) +
        P.kpi({ baslik: 'Bugün', ikon: 'i-clock', deger: B.sayi(ozet.bugun), alt: 'Bugün ödenecek iş', sinif: 'uyari', islem: 'plan-durum-filtre', filtre: 'bugun' }) +
      '</div>' +

      '<section class="kart"><div class="kart-baslik"><div><h2>Yıllık çalışma planı</h2>' +
        '<p>İşyeri bazında yıl içi faaliyet takvimi. Excel şablonunu doldurup toplu yükleyebilir, ' +
        'seçtiğiniz yılın planını tek hamlede silebilirsiniz.</p></div></div>' +
        '<div class="kart-ic"><div class="plan-izgara">' + yillikPlanKartlari(hesap, isyerleri, seciliYil) + '</div></div>' +
      '</section>' +

      '<section class="kart"><div class="kart-baslik"><div><h2>Çalışma planı ve takip' +
        (seciliYil ? ' · ' + seciliYil : '') + (seciliAy ? ' · ' + B.AYLAR[seciliAy - 1] : '') + '</h2>' +
        '<p>Ana başlık altında gruplanan faaliyetler ve Ocak-Aralık planlama şeridi. Yıl ve ay seçerek ' +
        'o dönemin planını görüntüleyebilirsiniz.</p></div>' +
        '<div class="kart-arac">' + planYilSecici(hesap) + planAySecici() + planDurumSecici() +
          '<span class="muted kucuk">' + B.sayi(planlar.length) + ' kayıt</span></div></div>' +
        '<div class="filtre-cubugu" style="padding-top:0">' + planSecimCubugu(planlar, secim) +
          (durumFiltreAdi ? '<span class="rozet uyari">Durum: ' + kacis(durumFiltreAdi) + '</span>' : '') +
          (yilsiz ? '<span class="hucre-alt">' + yilsiz + ' kaydın yılı belirsiz; yalnızca "Tüm yıllar" görünümünde listelenir.</span>' : '') +
          (aysiz ? '<span class="hucre-alt">' + aysiz + ' kaydın ayı belirsiz; yalnızca "Tüm aylar" görünümünde listelenir.</span>' : '') +
        '</div>' +
        '<div class="tablo-kap"><table class="tablo-kucuk plan-tablo">' +
          '<thead><tr><th></th><th>#</th><th>Faaliyet</th><th>Sorumlu</th><th>Aylar</th>' +
            '<th>Takip</th><th>Durum</th><th class="sag">İşlemler</th></tr></thead>' +
          '<tbody id="planTablo">' + (govde ||
            '<tr><td colspan="8">' + B.bosDurum('Plan kalemi yok',
              seciliYil ? 'Bu yıl için plan kaydı bulunmuyor. Şablonu indirip toplu yükleyebilirsiniz.' :
                'Yeni bir faaliyet ekleyerek yıllık planı oluşturun.', 'i-plan') + '</td></tr>') + '</tbody>' +
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






