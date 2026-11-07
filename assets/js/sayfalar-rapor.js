/* İSG Takip Merkezi — görünümler: yönetim raporu, risk, acil durum, ekip, mevzuat */
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

  function tarihAraligi() {
    var bugun = B.bugunIso();
    return {
      bas: UI.raporBaslangic || (bugun.slice(0, 8) + '01'),
      bitis: UI.raporBitis || bugun
    };
  }

  /* ---------- Yönetim raporu ---------- */

  SAYFALAR.rapor = function () {
    var hesap = veri();
    var aralik = tarihAraligi();
    var isyerleri = (hesap.isyerleri || []).filter(function (isyeri) { return !UI.kapsam || isyeri.id === UI.kapsam; });

    var satirlar = isyerleri.map(function (isyeri) {
      var gorevler = ISG.gorevler(hesap, isyeri.id).filter(function (g) { return ISG.gorevDurumu(g).id !== 'ileri'; });
      var ozet = ISG.gorevOzet(gorevler);
      var dosyalar = ISG.kapsamda(hesap, isyeri.id, 'dosyalar');
      var tespitler = ISG.kapsamda(hesap, isyeri.id, 'tespitler');
      var tespitOzet = ISG.tespitOzeti(tespitler);
      var planlar = ISG.kapsamda(hesap, isyeri.id, 'planlar');
      var donemTamam = planlar.filter(function (plan) {
        return plan.durum === 'tamamlandi' && plan.tamamlanmaTarihi &&
          plan.tamamlanmaTarihi >= aralik.bas && plan.tamamlanmaTarihi <= aralik.bitis;
      }).length;
      var tarihEksik = gorevler.filter(function (g) { return !g.tarih; }).length;
      var sorumluEksik = planlar.filter(function (plan) { return !plan.sorumlu; }).length +
        dosyalar.filter(function (dosya) { return dosya.durum !== 'incelenmedi' && !dosya.sorumlu; }).length;
      var belgeGecen = ISG.dosyaOzeti(dosyalar).gecen;
      return '<tr>' +
        '<td><strong>' + kacis(isyeri.ad) + '</strong><span class="hucre-alt">' + kacis((ISG.RISK_SINIFLARI[isyeri.tehlikeSinifi] || {}).ad || '') + '</span></td>' +
        '<td class="sayi-sutun">' + ozet.toplam + ' açık<br><b style="color:var(--red)">' + ozet.geciken + ' geciken</b></td>' +
        '<td class="sayi-sutun">' + tarihEksik + ' tarih yok<br><span class="muted">' + sorumluEksik + ' sorumlu yok</span></td>' +
        '<td class="sayi-sutun">' + donemTamam + '</td>' +
        '<td class="sayi-sutun">' + tespitOzet.acik + ' açık tespit<br><span class="muted">' + tespitOzet.dogrulama + ' doğrulama</span></td>' +
        '<td class="sayi-sutun"><span style="' + (belgeGecen ? 'color:var(--red);font-weight:700' : '') + '">' + belgeGecen + ' belge</span></td>' +
      '</tr>';
    }).join('');

    var toplamGorev = 0;
    var toplamGeciken = 0;
    var toplamDogrulama = 0;
    var donemTamamlanan = 0;
    isyerleri.forEach(function (isyeri) {
      var liste = ISG.gorevler(hesap, isyeri.id);
      var ozet = ISG.gorevOzet(liste);
      toplamGorev += ozet.toplam;
      toplamGeciken += ozet.geciken;
      toplamDogrulama += ISG.tespitOzeti(ISG.kapsamda(hesap, isyeri.id, 'tespitler')).dogrulama;
      donemTamamlanan += ISG.kapsamda(hesap, isyeri.id, 'planlar').filter(function (plan) {
        return plan.durum === 'tamamlandi' && plan.tamamlanmaTarihi &&
          plan.tamamlanmaTarihi >= aralik.bas && plan.tamamlanmaTarihi <= aralik.bitis;
      }).length;
    });

    return P.sayfaBaslik('YÖNETİM RAPORU', 'Yönetim raporu', 'İşyeri bazında kayıt ve durum takibi',
      '<button type="button" class="dugme ince" data-islem="yenile">' + B.ikon('i-refresh') + 'Yenile</button>') +
      P.kapsamSecici(hesap) +

      '<section class="kart"><div class="kart-baslik"><div><h2>İşyeri takip özeti</h2>' +
        '<p>İş yükünü, gecikmeleri ve sorumluluk boşluklarını karşılaştırın.</p></div></div>' +
        '<div class="kart-ic"><div class="satir-arac" style="justify-content:space-between">' +
          '<div><p class="bolum-baslik">Tamamlanan işlerin gerçekleşme dönemi</p>' +
            '<p class="bolum-aciklama">Diğer göstergeler bugünkü açık kayıtları gösterir.</p></div>' +
          '<div class="satir-arac">' +
            '<label class="filtre-etiket" for="raporBas">Başlangıç</label>' +
            '<input type="date" id="raporBas" data-ui="raporBaslangic" value="' + kacis(aralik.bas) + '" style="padding:8px 10px;border:1px solid var(--line-strong);border-radius:9px">' +
            '<label class="filtre-etiket" for="raporBit">Bitiş</label>' +
            '<input type="date" id="raporBit" data-ui="raporBitis" value="' + kacis(aralik.bitis) + '" style="padding:8px 10px;border:1px solid var(--line-strong);border-radius:9px">' +
            '<button type="button" class="dugme birincil" data-islem="rapor-ozet-csv">' + B.ikon('i-download') + 'Özeti Excel indir</button>' +
          '</div>' +
        '</div></div>' +
      '</section>' +

      '<div class="kpi-izgara">' +
        P.kpi({ baslik: 'Açık iş', ikon: 'i-clipboard', deger: B.sayi(toplamGorev), alt: 'Tüm işyerleri', sinif: 'bilgi', islem: 'panel-filtre', filtre: 'tumu' }) +
        P.kpi({ baslik: 'Geciken iş', ikon: 'i-alert', deger: B.sayi(toplamGeciken), alt: 'Termini geçen', sinif: 'tehlike', islem: 'panel-filtre', filtre: 'geciken' }) +
        P.kpi({ baslik: 'Doğrulama bekleyen', ikon: 'i-check', deger: B.sayi(toplamDogrulama), alt: 'Saha kapanışı', sinif: 'uyari' }) +
        P.kpi({ baslik: 'Dönemde tamamlanan', ikon: 'i-calendar', deger: B.sayi(donemTamamlanan), alt: B.tarih(aralik.bas) + ' – ' + B.tarih(aralik.bitis), sinif: 'soluk' }) +
      '</div>' +

      '<section class="kart">' +
        '<div class="tablo-kap"><table class="tablo-kucuk">' +
          '<thead><tr><th>İşyeri</th><th>Açık / geciken</th><th>Sorumlu / tarih eksik</th><th>Dönemde tamamlanan</th><th>Saha / doğrulama</th><th>Belge süresi geçen</th></tr></thead>' +
          '<tbody>' + (satirlar || '<tr><td colspan="6">' + B.bosDurum('İşyeri yok', 'Yeni bir işyeri ekleyerek raporu oluşturun.', 'i-building') + '</td></tr>') + '</tbody>' +
        '</table></div>' +
      '</section>';
  };

  /* ---------- Risk değerlendirmesi ---------- */

  function ekListesi(kaynak, kaynakId) {
    var liste = ISG.depo.ekler(kaynak, kaynakId);
    if (!liste.length) {
      return '<p class="bolum-aciklama" style="margin-top:6px">Ekli belge yok. “Belge yükle” ile PDF, görsel veya ofis dosyası ekleyebilirsiniz.</p>';
    }
    return '<div class="belge-liste" style="margin-top:6px">' + liste.map(function (belge) {
      return '<div class="belge-satir">' +
        '<span class="belge-simge">' + B.ikon('i-bos') + '</span>' +
        '<span class="belge-bilgi"><strong title="' + kacis(belge.ad) + '">' + kacis(belge.ad) + '</strong>' +
          '<small>' + B.boyut(belge.boyut) + ' · ' + B.tarih(belge.tarih) + '</small></span>' +
        '<span class="belge-eylem">' +
          '<button type="button" class="dugme simge" data-islem="ek-goruntule" data-id="' + kacis(belge.id) + '" title="Belgeyi görüntüle" aria-label="Belgeyi görüntüle">' + B.ikon('i-eye') + '</button>' +
          '<button type="button" class="dugme simge" data-islem="belge-indir" data-id="' + kacis(belge.id) + '" title="Belgeyi indir" aria-label="Belgeyi indir">' + B.ikon('i-download') + '</button>' +
        '</span>' +
      '</div>';
    }).join('') + '</div>';
  }

  /* Görev grubu özeti: tek kişide ad, çok kişide "N kişi" (ayrıntılar alt satırlarda). */
  function rolOzeti(uyeler, bosMetin) {
    var liste = uyeler || [];
    if (!liste.length) { return '<b class="yok">' + kacis(bosMetin || 'Kişi kaydedilmedi') + '</b>'; }
    if (liste.length === 1) { return '<b>' + kacis(liste[0].ad || '—') + '</b>'; }
    return '<b>' + liste.length + ' kişi</b>';
  }

  /* Görev grubu araçları: her rol için bir "ekle" düğmesi; tek kişi varsa
     rol satırından kaldırma, birden çok kişi varsa kişi başına kaldırma. */
  function ekipAraclari(kaynak, isyeriId, rol, uyeler) {
    var liste = uyeler || [];
    var dugmeler = '<button type="button" class="dugme ince" data-islem="ekip-uye" data-kaynak="' + kacis(kaynak) +
      '" data-isyeri="' + kacis(isyeriId) + '" data-rol="' + kacis(rol) + '">' +
      (liste.length ? 'Kişi ekle' : 'Ekle') + '</button>';
    if (liste.length === 1) {
      dugmeler += '<button type="button" class="dugme ince" data-islem="ekip-uye-sil" data-kaynak="' + kacis(kaynak) +
        '" data-isyeri="' + kacis(isyeriId) + '" data-rol="' + kacis(rol) + '" data-uye="' + kacis(liste[0].id || '') +
        '" data-uye-ad="' + kacis(liste[0].ad || '') + '">Kaldır</button>';
    }
    return '<span class="rol-arac">' + dugmeler + '</span>';
  }

  /* Bir görev grubunda birden çok personel varsa alt satırlarda listelenir. */
  function uyeAltSatirlari(kaynak, isyeriId, rol, uyeler) {
    if (!uyeler || uyeler.length < 2) { return ''; }
    return '<div class="rol-uyeler">' + uyeler.map(function (uye, sira) {
      var ek = [];
      if (uye.belgeSinifi) { ek.push('Belge sınıfı: ' + uye.belgeSinifi); }
      if (uye.belgeNo) { ek.push('Belge no: ' + uye.belgeNo); }
      if (uye.gecerlilik) { ek.push('Geçerlilik: ' + B.tarih(uye.gecerlilik)); }
      if (uye.sicil) { ek.push('Sicil: ' + uye.sicil); }
      return '<div class="rol-uye">' +
        '<span class="rol-uye-no">' + (sira + 1) + '.</span>' +
        '<b>' + kacis(uye.ad || '—') + '</b>' +
        (ek.length ? '<span class="kucuk muted">' + kacis(ek.join(' · ')) + '</span>' : '') +
        (uye.aciklama ? '<span class="kucuk muted">' + kacis(uye.aciklama) + '</span>' : '') +
        '<span class="rol-arac">' +
          '<button type="button" class="dugme ince" data-islem="ekip-uye-duzenle" data-kaynak="' + kacis(kaynak) +
            '" data-isyeri="' + kacis(isyeriId) + '" data-rol="' + kacis(rol) + '" data-uye="' + kacis(uye.id || '') +
            '">Düzenle</button>' +
          '<button type="button" class="dugme ince" data-islem="ekip-uye-sil" data-kaynak="' + kacis(kaynak) +
            '" data-isyeri="' + kacis(isyeriId) + '" data-rol="' + kacis(rol) + '" data-uye="' + kacis(uye.id || '') +
            '" data-uye-ad="' + kacis(uye.ad || '') + '">Kaldır</button>' +
        '</span>' +
      '</div>';
    }).join('') + '</div>';
  }

  /* Zorunlu ekip satırının kısa rozeti: görev satırının yanında "kaç kişi gerekli,
     kaç kişi kayıtlı" bilgisini gösterir. Zorunlu olmayan görevlerde (koordinatör,
     işyeri hekimi vb.) boş döner — o satırlarda ihtiyaç aranmaz. */
  function ihtiyacRozeti(satir) {
    if (!satir) { return ''; }
    if (satir.durum === 'hesaplanamadi') { return B.rozet('sayı hesaplanamadı', 'notr'); }
    if (satir.durum === 'gerekYok') { return B.rozet('gerekli 0 · çalışan yok', 'notr'); }
    var metin = 'gerekli ' + satir.gerekli + ' · kayıtlı ' + satir.kisiSayisi;
    var sinif = 'uyari';
    if (satir.durum === 'tamam') { sinif = 'iyi'; }
    else if (satir.durum === 'yok') { sinif = 'tehlike'; metin += ' · ekip yok'; }
    else if (satir.eksik > 0) { metin += ' · ' + satir.eksik + ' eksik'; }
    if (satir.onayli !== satir.kisiSayisi) { metin += ' · geçerli ' + satir.onayli; }
    return B.rozet(metin, sinif);
  }

  /* Tablo sütunlarındaki durum rozeti. Sınıf adları tablo satırı renkleriyle
     (satir-tehlike / satir-uyari / satir-notr) aynı anlamı taşır. */
  function ekipDurumRozeti(satir) {
    if (!satir) { return ''; }
    switch (satir.durum) {
      case 'tamam': return B.rozet('Yeterli', 'iyi');
      case 'eksik': return B.rozet(satir.eksik + ' kişi eksik', 'uyari');
      case 'yok': return B.rozet('Ekip yok', 'tehlike');
      case 'gerekYok': return B.rozet('Gerek yok', 'notr');
      default: return B.rozet('Hesaplanamadı', 'notr');
    }
  }

  /* Kişi bazlı belge notları: süresi dolan sayılmaz, tarihi işlenmemiş kişi uyarılır. */
  function belgeNotu(satir) {
    if (!satir) { return ''; }
    var notlar = [];
    var adlar = function (liste) {
      return liste.slice(0, 3).map(function (k) { return k.ad; }).join(', ') +
        (liste.length > 3 ? ' (+' + (liste.length - 3) + ')' : '');
    };
    if (satir.suresiDolan && satir.suresiDolan.length) {
      notlar.push('Süresi dolmuş belge: ' + adlar(satir.suresiDolan) + ' — kişi sayılmadı.');
    }
    if (satir.tarihsiz && satir.tarihsiz.length) {
      notlar.push('Belge tarihi işlenmemiş: ' + adlar(satir.tarihsiz) + '.');
    }
    return notlar.length ? '<span class="ihtiyac-not">' + kacis(notlar.join(' · ')) + '</span>' : '';
  }

  /* Zorunlu ekip mevcudu tablosu — şartnamenin istediği beş sütun:
     Ekip | Mevcut | Gerekli | Eksik | Durum. Ana ekranda ve düzenleme
     diyaloğunda AYNI nesne (ISG.acilEkipDurumu) okunur, ikinci bir hesap yok. */
  function ekipIhtiyacTablosu(durum) {
    if (!durum) { return ''; }
    var satirlar = durum.satirlar || [];
    if (!satirlar.length) { return ''; }
    var gecerli = !!durum.gecerli;
    var govde = satirlar.map(function (satir) {
      var sinif = satir.durum === 'tamam' ? 'satir-iyi' :
        (satir.durum === 'hesaplanamadi' || satir.durum === 'gerekYok') ? 'satir-notr' :
          (satir.durum === 'yok' ? 'satir-tehlike' : 'satir-uyari');
      var mevcut = gecerli ? B.sayi(satir.onayli) : '—';
      var mevcutAlt = (gecerli && satir.onayli !== satir.kisiSayisi)
        ? '<span class="hucre-alt">kayıtlı ' + B.sayi(satir.kisiSayisi) + '</span>' : '';
      var gerekli = gecerli ? B.sayi(satir.gerekli) : '—';
      var eksik = gecerli ? (satir.eksik ? B.sayi(satir.eksik) : '—') : '—';
      var oran = satir.oranEtiketi
        ? '<span class="hucre-alt">oran ' + kacis(satir.oranEtiketi) + '</span>' : '';
      return '<tr class="' + sinif + '">' +
        '<td><span class="ihtiyac-ad">' + kacis(satir.ad) + '</span>' + oran +
          belgeNotu(satir) + '</td>' +
        '<td class="orta"><b>' + mevcut + '</b>' + mevcutAlt + '</td>' +
        '<td class="orta"><b>' + gerekli + '</b></td>' +
        '<td class="orta">' + eksik + '</td>' +
        '<td>' + ekipDurumRozeti(satir) + '</td>' +
      '</tr>';
    }).join('');
    return '<div class="tablo-kap ekip-tablo-kap">' +
      '<table class="ekip-tablo">' +
        '<thead><tr>' +
          '<th scope="col">Ekip</th>' +
          '<th scope="col" class="orta">Mevcut</th>' +
          '<th scope="col" class="orta">Gerekli</th>' +
          '<th scope="col" class="orta">Eksik</th>' +
          '<th scope="col">Durum</th>' +
        '</tr></thead>' +
        '<tbody>' + govde + '</tbody>' +
      '</table>' +
    '</div>';
  }

  /* Otomatik hesaplanan zorunlu ekip mevcudu bloğu. Kart, diyalog ve rapor aynı
     nesneyi (ISG.acilEkipDurumu) okur; burada yalnızca yazıma çevrilir.
     `kompakt` yalnızca dış boşluğu daraltır — tablo hiçbir yerde gizlenmez. */
  function ekipIhtiyacOzeti(durum, secenekler) {
    if (!durum) { return ''; }
    var sec = secenekler || {};
    var g = durum.gereksinim || {};
    var ozet = durum.ozet || {};
    var ust = '';
    if (!durum.gecerli) { ust = B.rozet('Hesaplanamadı', 'notr'); }
    else if (g.sifir) { ust = B.rozet('Çalışan yok', 'notr'); }
    else if (durum.gorevEksik) { ust = B.rozet((ozet.eksikEkip || 0) + ' ekip hiç yok', 'tehlike'); }
    else if ((ozet.eksik || 0) > 0) { ust = B.rozet(ozet.eksik + ' kişi eksik', 'uyari'); }
    else { ust = B.rozet('Mevcut yeterli', 'iyi'); }
    var oranlar = {};
    (durum.satirlar || []).forEach(function (satir) {
      if (!satir.oranEtiketi) { return; }
      if (satir.id === 'ilkYardim') { oranlar.ilk = satir.oranEtiketi; }
      else if (!oranlar.diger) { oranlar.diger = satir.oranEtiketi; }
    });
    var calisan = durum.calisan || {};
    var alt = [];
    if (calisan.tip === 'veriYok') { alt.push('Çalışan sayısı girilmemiş'); }
    else { alt.push(B.sayi(calisan.calisanSayisi) + ' çalışan (' + (calisan.kaynak || 'kaynak belirsiz') + ')'); }
    if (calisan.pasifPersonel) { alt.push(B.sayi(calisan.pasifPersonel) + ' pasif kayıt sayılmadı'); }
    if (g.sinifAdi) { alt.push(g.sinifAdi + ' sınıfı'); }
    else { alt.push('Tehlike sınıfı girilmedi'); }
    if (oranlar.diger) { alt.push('söndürme/kurtarma/koruma ' + oranlar.diger); }
    if (oranlar.ilk) { alt.push('ilk yardım ' + oranlar.ilk); }
    var uyarilar = (durum.uyarilar || []).map(function (metin) {
      return '<div class="uyari-serit">' + B.ikon('i-alert') + kacis(metin) + '</div>';
    }).join('');
    var bilgiler = (durum.bilgiler || []).map(function (metin) {
      return '<div class="uyari-serit uyari">' + B.ikon('i-info') + kacis(metin) + '</div>';
    }).join('');
    var cakisma = (durum.cakismalar || []).map(function (kisi) {
      return '<div class="uyari-serit">' + B.ikon('i-alert') + kacis(kisi.ad) + ' aynı anda ' +
        kacis(kisi.ekipler.join(', ')) + ' ekiplerinde sayılmış.</div>';
    }).join('');
    return '<div class="ekip-ihtiyac' + (sec.kompakt ? ' kompakt' : '') + '">' +
      '<div class="ihtiyac-ust"><b>Zorunlu ekip mevcudu</b>' + ust + '</div>' +
      '<p class="kucuk muted">' + kacis(alt.join(' · ')) + '</p>' +
      ekipIhtiyacTablosu(durum) +
      cakisma + uyarilar + bilgiler +
      '</div>';
  }

  /* Görev grubu listesi: risk kartı, acil durum kartı ve acil plan diyaloğu aynı
     düzeni kullanır. `uyelerAl` verilen roldeki kişi listesini döndürür.
     `durumAl` verilirse (acil durum planı) her göreve ihtiyaca göre rozet basılır. */
  function ekipListesi(kaynak, isyeriId, roller, uyelerAl, bosMetin, durumAl) {
    return '<div class="rol-list">' + roller.map(function (rol) {
      var uyeler = uyelerAl(rol) || [];
      var anahtar = kaynak === 'acil' ? rol.ad : rol.id;
      return '<div class="rol-satir"><span class="rol-ad">' + kacis(rol.ad) + '</span>' +
        rolOzeti(uyeler, bosMetin) +
        (durumAl ? ihtiyacRozeti(durumAl(rol)) : '') +
        ekipAraclari(kaynak, isyeriId, anahtar, uyeler) + '</div>' +
        uyeAltSatirlari(kaynak, isyeriId, anahtar, uyeler);
    }).join('') + '</div>';
  }

  /* Diyalog ve kartlar aynı listeyi üretir; tek kaynak korunur. */
  SAYFALAR.ekipListesi = ekipListesi;
  SAYFALAR.ekipIhtiyacOzeti = ekipIhtiyacOzeti;
  SAYFALAR.ekipIhtiyacTablosu = ekipIhtiyacTablosu;
  SAYFALAR.ekipDurumRozeti = ekipDurumRozeti;
  SAYFALAR.ihtiyacRozeti = ihtiyacRozeti;

  /* Tarih denetimi sonuçlarının (ISG.acilPlanTarihKontrol ve benzerleri) yazıma
     çevrilmiş hâli: engelleyen hatalar kırmızı, bilgilendiren uyarılar amber şerit.
     Boş sonuç boş döner — diyalohta yer kaplamaz. Kartlar tek satır istediği için
     orada ISG.acilPlanTarihOzet kullanılır, bu şeritler ayrıntı isteyen yere girer. */
  function uyariSeritleri(sonuc) {
    var hatalar = (sonuc && sonuc.hatalar) || [];
    var uyarilar = (sonuc && sonuc.uyarilar) || [];
    if (!hatalar.length && !uyarilar.length) { return ''; }
    return hatalar.map(function (metin) {
      return '<div class="uyari-serit">' + B.ikon('i-alert') + kacis(metin) + '</div>';
    }).join('') +
      uyarilar.map(function (metin) {
        return '<div class="uyari-serit uyari">' + B.ikon('i-alert') + kacis(metin) + '</div>';
      }).join('');
  }
  SAYFALAR.uyariSeritleri = uyariSeritleri;

  function riskKarti(isyeri, hesap) {
    var kayit = ISG.ilgiliKayit(hesap, 'riskEkipleri', isyeri.id);
    var ozet = ISG.riskEkipOzeti(kayit);
    var sinif = ISG.RISK_SINIFLARI[isyeri.tehlikeSinifi] || { ad: '', riskYenilemeYil: 4 };
    var tarihDurumu = !kayit || !kayit.sonDegerlendirme ? B.rozet('Değerlendirme tarihi eksik', 'tehlike') :
      (ozet.durum === 'geciken' ? B.rozet('Yenileme gecikti', 'tehlike') : B.rozet('Güncel', 'iyi'));

    return '<article class="risk-kart">' +
      '<div class="risk-kart-ust">' +
        '<div><h3>' + kacis(isyeri.ad) + '</h3>' +
          '<p class="alt">' + kacis(sinif.ad) + ' · ' + B.sayi(isyeri.calisanSayisi) + ' çalışan</p></div>' +
        tarihDurumu +
      '</div>' +
      '<div class="mini-izgara">' +
        '<div class="mini-kutu"><span>Son değerlendirme</span><b>' + (kayit && kayit.sonDegerlendirme ? B.tarih(kayit.sonDegerlendirme) : 'Girilmedi') + '</b></div>' +
        '<div class="mini-kutu"><span>En geç yenileme</span><b>' + (kayit && kayit.enGecYenileme ? B.tarih(kayit.enGecYenileme) : 'Girilmedi') + '</b></div>' +
        '<div class="mini-kutu"><span>Olağan üst sınır</span><b>' + sinif.riskYenilemeYil + ' yıl</b></div>' +
      '</div>' +
      '<div>' +
        '<div class="satir-arac" style="justify-content:space-between;margin-bottom:7px">' +
          '<p class="bolum-baslik">Risk değerlendirmesi ekibi</p>' +
          (ozet.eksik ? B.rozet(ozet.eksik + ' rol eksik', 'tehlike') : B.rozet('Ekip tam', 'iyi')) +
        '</div>' +
        ekipListesi('risk', isyeri.id, ISG.RISK_ROLLERI, function (rol) {
          return ISG.depo.riskEkipUyeleri(kayit, rol.id);
        }) +
        '<p style="margin-top:8px"><button type="button" class="dugme ince" data-islem="ekip-uye" ' +
          'data-kaynak="risk" data-isyeri="' + kacis(isyeri.id) + '">' + B.ikon('i-plus') +
          'Ekip üyesi ekle</button></p>' +
      '</div>' +
      '<div class="ek-kutu">' +
        '<p class="bolum-baslik">Ekli belgeler</p>' +
        ekListesi('risk', isyeri.id) +
      '</div>' +
      '<button type="button" class="akis" data-islem="risk-ekip" data-id="' + kacis(isyeri.id) + '">Değerlendirme ve ekibi düzenle →</button>' +
    '</article>';
  }

  function riskKayitTablosu(hesap) {
    var riskler = ISG.kapsamda(hesap, UI.kapsam, 'riskler');
    if (!riskler.length) {
      return '<div class="kart-ic">' + B.bosDurum('Risk kaydı yok', 'Seçili kapsamda 5x5 risk kaydı bulunmuyor. Risk değerlendirmesi ekibi ve tarih bilgisini yukarıdan kaydedin.', 'i-risk') + '</div>';
    }
    return '<div class="tablo-kap"><table class="tablo-kucuk">' +
      '<thead><tr><th>Tehlike / alan</th><th>Olasılık × şiddet</th><th>Skor</th><th>Seviye</th><th>Önlem</th><th>Termin</th><th>Durum</th></tr></thead>' +
      '<tbody>' + riskler.map(function (risk) {
        var skor = ISG.riskSkor(risk);
        var seviye = ISG.riskSeviye(skor);
        return '<tr>' +
          '<td><strong>' + kacis(risk.tehlike) + '</strong><span class="hucre-alt">' + kacis(isyeriAdi(risk.isyeriId)) + ' · ' + kacis(risk.alan || '—') + '</span></td>' +
          '<td class="sayi-sutun">' + risk.olasilik + ' × ' + risk.siddet + '</td>' +
          '<td class="sayi-sutun"><b>' + skor + '</b></td>' +
          '<td>' + B.rozet(seviye.ad, seviye.sinif) + '</td>' +
          '<td>' + kacis(risk.onlem || '—') + '</td>' +
          '<td class="sayi-sutun">' + B.tarih(risk.termin) + '</td>' +
          '<td>' + B.rozet(ISG.RISK_DURUMLARI[risk.durum] || risk.durum, risk.durum === 'kapali' ? 'iyi' : (risk.durum === 'izlemede' ? 'uyari' : 'tehlike')) + '</td>' +
        '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  SAYFALAR.risk = function () {
    var hesap = veri();
    var isyerleri = (hesap.isyerleri || []).filter(function (isyeri) { return !UI.kapsam || isyeri.id === UI.kapsam; });
    var kartlar = isyerleri.map(function (isyeri) { return riskKarti(isyeri, hesap); }).join('');

    return P.sayfaBaslik('RİSK DEĞERLENDİRMESİ', 'Risk değerlendirmesi', 'İşyeri bazında kayıt ve durum takibi',
      '<button type="button" class="dugme" data-islem="risk-csv">' + B.ikon('i-download') + 'Excel indir</button>') +
      P.kapsamSecici(hesap) +

      '<section class="kart"><div class="kart-baslik" style="flex-direction:column;align-items:flex-start">' +
        '<h2>Risk değerlendirmesi kontrolü</h2>' +
        '<p>Her işyeri için ekip, yapılan değerlendirme, yenileme takvimi ve erken yenileme nedenleri.</p></div>' +
        '<div class="kart-ic"><div class="kart-izgara-3">' + (kartlar || '<p class="bolum-aciklama">İşyeri bulunmuyor.</p>') + '</div></div>' +
      '</section>' +

      '<section class="kart"><div class="kart-baslik"><div><h2>5 × 5 risk kayıtları</h2>' +
        '<p>Olasılık ve şiddet çarpımıyla skorlanan açık riskler ve alınan önlemler.</p></div>' +
        '<div class="kart-arac"><span class="muted kucuk">' + B.sayi(ISG.kapsamda(hesap, UI.kapsam, 'riskler').length) + ' kayıt</span></div></div>' +
        riskKayitTablosu(hesap) +
      '</section>';
  };

  /* ---------- Acil durum planı ---------- */

  function acilKarti(isyeri, hesap) {
    var kayit = ISG.ilgiliKayit(hesap, 'acilPlanlar', isyeri.id);
    var ozet = ISG.acilPlanOzeti(isyeri, kayit);
    /* Tehlike sınıfı girilmemişse varsayılan sınıf UYDURULMAZ: kart "girilmedi"
       der, yenileme aralığı boş kalır (şartname §2.3 / §7.6). */
    var sinif = ozet.sinif || { ad: '', acilYenilemeYil: 0 };
    var sinifAdi = sinif.ad || 'Tehlike sınıfı girilmedi';
    var ekip = ozet.ekip || [];
    var ekipRolleri = ISG.ACIL_ROLLERI;
    /* Zorunlu ekip mevcudu otomatik hesaplanır (yönetici sayı girmeden). */
    var durum = ISG.acilEkipDurumu(isyeri, kayit, hesap);
    var tarihKontrol = ISG.acilPlanTarihKontrol(kayit || ISG.acilPlanBosKayit(), isyeri.tehlikeSinifi);
    /* Kart, listede tek satır durur: hataların tam listesi diyaloğa bırakılır,
       burada yalnızca ilk sebep ve kalanların sayısı görünür (ISG.acilPlanTarihOzet). */
    var tarihOzet = ISG.acilPlanTarihOzet(tarihKontrol);
    var tarihSerit = !tarihOzet ? '' : '<div class="uyari-serit' +
      (tarihKontrol.gecerli ? ' uyari' : '') + '">' +
      B.ikon(tarihKontrol.gecerli ? 'i-info' : 'i-alert') + kacis(tarihOzet) + '</div>';
    var ihtiyacRozet = !durum.gecerli ? B.rozet('Ekip sayısı hesaplanamadı', 'notr') :
      (durum.gereksinim.sifir ? B.rozet('Çalışan yok', 'notr') :
        (durum.gorevEksik ? B.rozet(durum.ozet.eksikEkip + ' ekip eksik', 'tehlike') :
          (durum.ozet.eksik > 0 ? B.rozet(durum.ozet.eksik + ' kişi eksik', 'uyari') :
            B.rozet('Mevcut yeterli', 'iyi'))));
    var calisanMetni = durum.calisan.tip === 'veriYok' ? 'Girilmedi'
      : B.sayi(durum.calisan.calisanSayisi) + ' (' + durum.calisan.kaynak + ')';

    return '<article class="risk-kart" data-acil-kart data-id="' + kacis(isyeri.id) + '">' +
      '<div class="risk-kart-ust">' +
        '<div><h3>' + kacis(isyeri.ad) + '</h3><p class="alt">' + kacis(sinifAdi) + '</p></div>' +
        (sinif.ad ? B.rozet(sinif.ad, isyeri.tehlikeSinifi === 'az' ? 'bilgi' : 'uyari')
          : B.rozet('Sınıf girilmedi', 'notr')) +
      '</div>' +
      '<div class="mini-izgara">' +
        '<div class="mini-kutu"><span>Ekipte esas çalışan</span><b>' + kacis(calisanMetni) + '</b></div>' +
        '<div class="mini-kutu"><span>İşyeri kartındaki sayı</span><b>' + B.sayi(isyeri.calisanSayisi) + '</b></div>' +
        '<div class="mini-kutu"><span>Zorunlu ekip mevcudu</span><b>' + B.sayi(durum.ozet.gerekli) + ' kişi</b></div>' +
      '</div>' +
      '<div>' +
        '<div class="satir-arac" style="justify-content:space-between;margin-bottom:7px">' +
          '<p class="bolum-baslik">Acil durum planı</p>' +
          (!ozet.son ? B.rozet('Plan tarihi girilmedi', 'tehlike') :
            (ozet.kalan !== null && ozet.kalan < 0 ? B.rozet('Yenileme gecikti', 'tehlike') : B.rozet('Plan geçerli', 'iyi'))) +
        '</div>' +
        '<div class="mini-izgara">' +
          '<div class="mini-kutu"><span>Hazırlanma / son yenileme</span><b>' + (ozet.son ? B.tarih(ozet.son) : 'Girilmedi') + '</b></div>' +
          '<div class="mini-kutu"><span>En geç yenileme</span><b>' + (ozet.enGec ? B.tarih(ozet.enGec) : 'Girilmedi') + '</b></div>' +
          '<div class="mini-kutu"><span>Olağan üst sınır</span><b>' + (sinif.acilYenilemeYil ? sinif.acilYenilemeYil + ' yıl' : 'Sınıf girilmedi') + '</b></div>' +
        '</div>' +
        (tarihSerit ? '<div style="margin-top:8px">' + tarihSerit + '</div>' : '') +
        '<p class="bolum-aciklama" style="margin-top:8px">' + (sinif.acilYenilemeYil ?
          kacis(sinifAdi) + ' sınıfında plan en geç ' + sinif.acilYenilemeYil +
            ' yılda bir yenilenir. İşyeri, çalışan sayısı veya ekip değişikliği planı daha önce gözden geçirmeyi gerektirebilir.'
          : 'İşyeri kaydında tehlike sınıfı seçilmediği için plan yenileme aralığı hesaplanamıyor; işyeri kaydından sınıfı seçin.') + '</p>' +
      '</div>' +
      '<div class="ek-kutu">' +
        '<p class="bolum-baslik">Ekli belgeler</p>' +
        ekListesi('acil', isyeri.id) +
      '</div>' +
      '<button type="button" class="akis" data-islem="acil-plan" data-id="' + kacis(isyeri.id) + '">Yapılan plan yenilemesini kaydet →</button>' +
      '<div>' +
        '<div class="satir-arac" style="justify-content:space-between;margin-bottom:7px">' +
          '<p class="bolum-baslik">Acil durum planı hazırlama ekibi</p>' +
          ihtiyacRozet +
        '</div>' +
        ekipListesi('acil', isyeri.id, ekipRolleri, function (rol) {
          return ekip.filter(function (k) { return k.rol === rol.ad; });
        }, 'Kişi eklenmedi', function (rol) {
          return ISG.acilEkipSatiri(durum, rol.ad);
        }) +
        ekipIhtiyacOzeti(durum, { kompakt: true }) +
        '<p style="margin-top:8px"><button type="button" class="dugme ince" data-islem="ekip-uye" ' +
          'data-kaynak="acil" data-isyeri="' + kacis(isyeri.id) + '">' + B.ikon('i-plus') +
          'Ekip üyesi ekle</button></p>' +
        '<p class="bolum-aciklama" style="margin-top:8px">Plan hazırlanırken görev alan işveren/işveren vekili, iş güvenliği uzmanı ve diğer ilgili kişileri işyeri bazında kaydedin. Zorunlu dört ekibin mevcudu, ekip hesaplamasında esas alınan çalışan sayısı (aktif personel kayıtları; yoksa işyeri kartı) ve tehlike sınıfına göre yönetmelik ekindeki oranlarla otomatik karşılaştırılır.</p>' +
      '</div>' +
    '</article>';
  }

  /* İşyeri arama: kullanıcı çok sayıda işyeri arasında kartı bulabilsin.
     Ad, tehlike sınıfı etiketi ve sınıf kodu üzerinden eşleşir (Türkçe küçük harf). */
  function acilAramaEslesir(isyeri, arama) {
    if (!arama) { return true; }
    var ozet = ISG.acilPlanOzeti(isyeri, null);
    var metin = [isyeri.ad, isyeri.kisaAd, isyeri.tehlikeSinifi,
      ozet.sinifAdi, ozet.sinif ? 'tehlike sinifi' : 'sinif girilmedi'].join(' ');
    return metin.toLocaleLowerCase('tr').indexOf(arama) >= 0;
  }

  SAYFALAR.acil = function () {
    var hesap = veri();
    var arama = String(UI.acilArama || '').toLocaleLowerCase('tr').trim();
    var tumIsyerleri = (hesap.isyerleri || []).filter(function (isyeri) { return !UI.kapsam || isyeri.id === UI.kapsam; });
    var isyerleri = tumIsyerleri.filter(function (isyeri) { return acilAramaEslesir(isyeri, arama); });
    var kartlar = isyerleri.map(function (isyeri) { return acilKarti(isyeri, hesap); }).join('');

    /* İşyeri arama: kart listesi uzadıkça aranan işyeri kaybolmasın. Ölçüt ad,
       tehlike sınıfı etiketi ve sınıf kodudur; sonuç sayısı altında yazar. */
    var aramaKutusu = '<div class="filtre-cubugu">' +
      '<div class="arama">' + B.ikon('i-search') +
        '<input type="search" data-ui="acilArama" value="' + kacis(UI.acilArama || '') +
        '" placeholder="İşyeri adı veya tehlike sınıfı ara" aria-label="Acil durum planında işyeri ara">' +
      '</div>' +
      '<span class="filtre-etiket">' + B.sayi(isyerleri.length) + ' / ' + B.sayi(tumIsyerleri.length) + ' işyeri listeleniyor</span>' +
      '</div>';

    /* Sayfa özeti: kartları tek tek açmadan hangi işyerinde ne eksik, görünsün. */
    var toplam = { eksikKisi: 0, eksikEkip: 0, eksikIsyeri: 0, tarihHata: 0, tarihUyari: 0 };
    isyerleri.forEach(function (isyeri) {
      var kayit = ISG.ilgiliKayit(hesap, 'acilPlanlar', isyeri.id);
      var durum = ISG.acilEkipDurumu(isyeri, kayit, hesap);
      toplam.eksikKisi += durum.ozet.eksik;
      toplam.eksikEkip += durum.gorevEksik ? durum.ozet.eksikEkip : 0;
      if (!durum.gecerli || durum.gorevEksik || durum.ozet.eksik > 0) { toplam.eksikIsyeri += 1; }
      var tarih = ISG.acilPlanTarihKontrol(kayit || ISG.acilPlanBosKayit(), isyeri.tehlikeSinifi);
      if (!tarih.gecerli) { toplam.tarihHata += 1; }
      else if ((tarih.uyarilar || []).length) { toplam.tarihUyari += 1; }
    });
    var uyarilar = [];
    if (toplam.eksikEkip) { uyarilar.push(toplam.eksikEkip + ' zorunlu ekip hiç oluşturulmamış'); }
    if (toplam.eksikKisi) { uyarilar.push('gereklinin altında ' + B.sayi(toplam.eksikKisi) + ' kişi'); }
    if (toplam.tarihHata) { uyarilar.push(toplam.tarihHata + ' işyerinde plan tarihi hatalı'); }
    if (toplam.tarihUyari) { uyarilar.push(toplam.tarihUyari + ' işyerinde plan tarihi için gözden geçirme uyarısı'); }
    var uyariblok = uyarilar.length ?
      '<div class="uyari-serit">' + kacis(uyarilar.join(' · ') + '. Zorunlu ekip mevcudu, aktif personel sayısı (personel kaydı yoksa işyeri kartı) ve tehlike sınıfına göre otomatik hesaplanır.') + '</div>' :
      (isyerleri.length ? '<div class="uyari-serit tamam">Zorunlu dört ekibin mevcudu yönetmelik ekindeki oranların üzerinde.</div>' : '');

    var icerik = kartlar || (arama
      ? B.bosDurum('Aramayla eşleşen işyeri yok', 'Arama ölçütünü değiştirin veya temizleyin.', 'i-search')
      : '<p class="bolum-aciklama">İşyeri bulunmuyor.</p>');

    return P.sayfaBaslik('ACİL DURUM PLANI', 'Acil durum planı', 'İşyeri bazında kayıt ve durum takibi',
      '<button type="button" class="dugme" data-islem="acil-csv">' + B.ikon('i-download') + 'Excel indir</button>') +
      P.kapsamSecici(hesap) +
      aramaKutusu +
      uyariblok +

      '<section class="kart"><div class="kart-baslik" style="flex-direction:column;align-items:flex-start">' +
        '<h2>Acil durum planı ve destek ekipleri</h2>' +
        '<p>Görevli kişileri, eğitim kayıtlarını ve planın gözden geçirilmesini işyeri bazında izleyin.</p></div>' +
        '<div class="kart-ic"><div class="kart-izgara-3">' + icerik + '</div></div>' +
      '</section>';
  };

  /* ---------- Kullanıcılar ve yetkiler ---------- */

  var ROL_ROZET = { yonetici: 'iyi', sistemYoneticisi: 'bilgi', osgbMuduru: 'notr', yetkili: 'bilgi', goruntuleyici: 'notr' };

  SAYFALAR.ekip = function () {
    var oturum = ISG.yetki.oturum();
    var yonetici = !!(oturum && ISG.yetki.rolTanimi(oturum.rol).yonetir);
    var hesap = ISG.depo.al();
    var kullanicilar = (hesap.kullanicilar || []).slice().sort(function (a, b) {
      return String(a.adSoyad || '').localeCompare(String(b.adSoyad || ''), 'tr');
    });

    var satirlar = kullanicilar.map(function (kullanici) {
      var tanim = ISG.yetki.rolTanimi(kullanici.rol);
      var kapsamMetni = kullanici.tumIsyerleri ? 'Tüm işyerleri'
        : ((kullanici.isyerleri || []).map(isyeriAdi).join(', ') || 'İşyeri tanımlı değil');
      var kendiHesabi = !!(oturum && oturum.kullaniciId === kullanici.id);
      /* Kurum ve uzman sınıfı onay yetkisini belirler; listede görünmezse
         yönetici neden onay yetkilisi atanamadığını anlayamaz. */
      var kurumId = kullanici.kurumId || '';
      if (!kurumId && (hesap.kurumlar || []).length === 1) { kurumId = hesap.kurumlar[0].id; }
      var kurum = (hesap.kurumlar || []).filter(function (kayit) { return kayit.id === kurumId; })[0];
      var kurumAdi = kurum ? (kurum.ad || '') : '';
      var sinifKodu = typeof ISG.uzmanSinifiKodu === 'function'
        ? ISG.uzmanSinifiKodu(kullanici.uzmanSinifi) : '';
      var sinifAdi = sinifKodu && tanim.id === 'yetkili'
        ? (typeof ISG.uzmanSinifiAdi === 'function' ? ISG.uzmanSinifiAdi(sinifKodu) : sinifKodu + ' sınıfı') : '';
      var ekBilgi = [kurumAdi, sinifAdi].filter(function (parca) { return parca; }).join(' · ');
      var islemler = yonetici
        ? '<button type="button" class="dugme kucuk" data-islem="kullanici-duzenle" data-id="' + kacis(kullanici.id) + '">Düzenle</button>' +
          '<button type="button" class="dugme kucuk" data-islem="kullanici-sifre" data-id="' + kacis(kullanici.id) + '">Şifre ver</button>' +
          (kendiHesabi ? '' : '<button type="button" class="dugme kucuk tehlike-dugme" data-islem="kullanici-sil" data-id="' + kacis(kullanici.id) + '">Sil</button>')
        : '';
      return '<div class="kullanici-satir">' +
        '<strong>' + kacis(kullanici.adSoyad) + '</strong>' +
        '<span class="muted">' + kacis(kullanici.eposta) + '</span>' +
        B.rozet(tanim.ad, ROL_ROZET[tanim.id] || 'bilgi') +
        '<span class="muted">' + kacis(kapsamMetni) + '</span>' +
        (ekBilgi ? '<span class="muted kucuk">' + kacis(ekBilgi) + '</span>' : '') +
        '<span class="sag">' +
          '<span class="muted kucuk">' + (kullanici.sonGiris ? 'Son giriş ' + B.tarih(String(kullanici.sonGiris).slice(0, 10)) : 'Henüz giriş yapmadı') + '</span>' +
          islemler +
        '</span>' +
      '</div>';
    }).join('');

    /* Onay yetkilisi eksik işyerleri: işyeri onay modeli açıkken karar verecek
       uzmanı olmayan işyerleri burada listelenir; yönetici atamayı buradan
       görüp kullanıcı ekranından düzeltir. Rol modelinde liste boş döner. */
    var eksikYetkili = (yonetici && typeof ISG.yetki.yetkiliEksikListe === 'function')
      ? ISG.yetki.yetkiliEksikListe() : [];
    var eksikBlok = eksikYetkili.length
      ? '<section class="kart"><div class="kart-baslik" style="flex-direction:column;align-items:flex-start">' +
          '<h2>Onay yetkilisi eksik</h2>' +
          '<p>İşyeri onay modeli açık. Bu işyerlerinde onay verecek uzman yok; ' +
          'gönderilen değişiklikler karar bekler.</p></div>' +
          '<div class="kart-ic">' + eksikYetkili.map(function (durum) {
            var esikMetni = (durum.esik || []).map(function (kod) { return kod + ' sınıfı'; }).join(' / ') || 'tanımsız';
            return '<div class="rol-satir">' +
              '<span>' + kacis(durum.isyeriAd || durum.isyeriId || '') +
                '<small class="muted"> · eşik: ' + kacis(esikMetni) +
                ' · uzman: ' + B.sayi(durum.uzmanSayisi) + '</small></span>' +
              '<b>' + B.rozet(durum.mod === 'eksik' ? 'Sınıf uygun değil' : 'Uzman atanmamış', 'uyari') + '</b>' +
            '</div>';
          }).join('') + '</div></section>'
      : '';

    return P.sayfaBaslik('KULLANICILAR VE YETKİLER', 'Kullanıcılar ve yetkiler', 'Siteye giriş yapacak kişiler ve erişim kapsamları') +
      '<section class="kart ekip-kart">' +
        '<div class="kart-baslik" style="flex-direction:column;align-items:flex-start">' +
          '<h2>Kullanıcılar</h2>' +
          '<p>' + B.sayi(kullanicilar.length) + ' kayıtlı kullanıcı · Rol ve işyeri yetkisi yalnızca yöneticiden değiştirilir.</p>' +
        '</div>' +
        '<div class="kart-ic">' +
          '<p class="bolum-aciklama">Kullanıcıları yalnızca yönetici ekler; davet kodu veya kendi kendine kayıt yoktur. ' +
            'E-posta adresi giriş kimliğidir, ilk şifreyi de yönetici belirler. Şifresini unutan kullanıcıya yine bu ekrandan yeni şifre verilir.</p>' +
          (yonetici
            ? '<p style="margin-top:12px"><button type="button" class="dugme birincil" data-islem="kullanici-yeni">' +
              B.ikon('i-plus') + 'Yeni kullanıcı</button></p>'
            : '<p class="bolum-aciklama" style="margin-top:8px">Yetki değişikliği için yöneticinize başvurun.</p>') +
        '</div>' +
        (satirlar ? '<div class="kullanici-list">' + satirlar + '</div>' :
          '<div class="kart-ic">' + B.bosDurum('Kayıtlı kullanıcı yok', 'Yeni kullanıcı düğmesiyle ilk hesabı tanımlayın.', 'i-team') + '</div>') +
      '</section>' +
      eksikBlok;
  };

  /* ---------- Kurum denetim panosu (salt okunur) ---------- */

  /* OSGB Müdürü kendi kurumunun işyerlerini, onay yetkilisi durumunu ve
     bekleyen taleplerini izler. Ekran SALT OKUNUR: hiçbir düğme kayıt
     değiştirmez, veri katmanı da bu rolde yazmayı reddeder. Şifre ve sağlık
     verisi bu görünüme taşınmaz; kullanıcı satırları `kullaniciOzet()` ile
     süzülmüş kopyadan gelir. */
  var ONAY_MOD_ADI = {
    tekUzman: 'Tek uzman · doğrudan yazma',
    onayli: 'Onay zorunlu · yetkili var',
    eksik: 'Onay yetkilisi eksik',
    'uzman-yok': 'Uzman atanmamış'
  };
  var ONAY_MOD_ROZET = { tekUzman: 'bilgi', onayli: 'iyi', eksik: 'uyari', 'uzman-yok': 'tehlike' };
  var TALEP_DURUM_ADI = { bekliyor: 'Bekliyor', onaylandi: 'Onaylandı', reddedildi: 'Reddedildi' };

  /* ---------- Sistem yönetimi (Sistem Yöneticisi) ---------- */

  /* Kurum, işyeri, kullanıcı, rol, atama ve onay yönetimini tek ekranda
     toplar. Yeni bir yönetim altyapısı KURMAZ: her satır mevcut diyalogları
     (`kullanici-duzenle`, `kullanici-yeni`, `isyeri-duzenle`, `isyeri-yeni`),
     mevcut onay eylemlerini (`talep-onayla`, `talep-reddet`) ve mevcut depo
     işlemlerini kullanır. Erişim `ISG.yetki` rol tanımına bağlıdır: OSGB
     Müdürü (salt okunur) bu ekranı ne menüde görür ne de URL ile açabilir. */
  var ROL_YETKI_TABLOSU = ['sistemYoneticisi', 'yonetici', 'osgbMuduru', 'yetkili', 'goruntuleyici'];

  function sistemKapsamYazisi(kullanici, hesap, tanim) {
    if (tanim.tumIsyerleri || kullanici.tumIsyerleri) { return 'Tüm işyerleri'; }
    if (tanim.kurumKapsami) {
      var kurum = (hesap.kurumlar || []).filter(function (kayit) {
        return kayit.id === (kullanici.kurumId || '');
      })[0];
      return kurum ? 'Kurum: ' + kurum.ad : 'Kurum atanmamış';
    }
    var adlar = (kullanici.isyerleri || []).map(function (id) { return ISG.isyeriAdi(hesap, id); })
      .filter(function (ad) { return ad; });
    return adlar.length ? adlar.join(', ') : 'İşyeri tanımlı değil';
  }

  SAYFALAR.sistem = function () {
    var hesap = veri();
    var oturum = ISG.yetki ? ISG.yetki.oturum() : null;
    var rol = oturum ? ISG.yetki.rolTanimi(oturum.rol) : null;

    if (!rol || !rol.yonetir) {
      return P.sayfaBaslik('SİSTEM YÖNETİMİ', 'Sistem yönetimi', 'Yönetim yetkisi gerekir') +
        '<section class="kart"><div class="kart-ic">' +
          B.bosDurum('Erişim yok', 'Bu ekran yalnızca sistem yöneticisi hesaplarına açıktır.', 'i-alert') +
        '</div></section>';
    }

    var kurumlar = hesap.kurumlar || [];
    var isyerleri = hesap.isyerleri || [];
    var kullanicilar = hesap.kullanicilar || [];
    var talepler = hesap.talepler || [];

    var onayDurumlari = isyerleri.map(function (isyeri) {
      var durum = ISG.yetki.onayDurumu(isyeri.id);
      durum.tehlikeSinifi = isyeri.tehlikeSinifi || '';
      durum.kurumId = isyeri.kurumId || '';
      return durum;
    });
    var eksikIsyerleri = onayDurumlari.filter(function (durum) {
      return durum.mod === 'eksik' || durum.mod === 'uzman-yok';
    });
    var bekleyenTalepler = talepler.filter(function (talep) { return talep.durum === 'bekliyor'; });
    var pasifKullanicilar = kullanicilar.filter(function (kisi) { return kisi.aktif === false; });
    var dosyaOzet = ISG.dosyaOzeti(hesap.dosyalar || []);
    var sahaOzet = ISG.tespitOzeti(hesap.tespitler || []);
    var kurumsuzIsyeri = kurumlar.length
      ? isyerleri.filter(function (isyeri) { return !isyeri.kurumId; }).length : 0;
    var saglikTalepleri = [];
    if (ISG.saglikTakip && typeof ISG.saglikTakip.erisimTalepleri === 'function') {
      try {
        saglikTalepleri = ISG.saglikTakip.erisimTalepleri()
          .filter(function (talep) { return talep.durum === 'bekliyor'; });
      } catch (hata) { saglikTalepleri = []; }
    }
    var bulut = (ISG.bulut && typeof ISG.bulut.ozet === 'function') ? ISG.bulut.ozet() : null;

    /* Sistem geneli uyarı ve hata durumları tek listede toplanır. */
    var uyarilar = [];
    var uyariEkle = function (metin, sinif) { uyarilar.push({ metin: metin, sinif: sinif || 'uyari' }); };
    if (eksikIsyerleri.length) {
      uyariEkle(eksikIsyerleri.length + ' işyerinde onay yetkilisi eksik; karar verecek uzman atanmalı.', 'tehlike');
    }
    if (bekleyenTalepler.length) {
      uyariEkle(bekleyenTalepler.length + ' değişiklik talebi karar bekliyor.', 'uyari');
    }
    if (pasifKullanicilar.length) {
      uyariEkle(pasifKullanicilar.length + ' kullanıcı pasif durumda; giriş yapamaz ve onay yetkilisi sayılmaz.', 'notr');
    }
    if (dosyaOzet.gecen) {
      uyariEkle(dosyaOzet.gecen + ' dosya kontrolünün yenileme tarihi geçmiş.', 'uyari');
    }
    if (sahaOzet.geciken) {
      uyariEkle(sahaOzet.geciken + ' saha faaliyeti gecikmiş.', 'uyari');
    }
    if (kurumsuzIsyeri) {
      uyariEkle(kurumsuzIsyeri + ' işyeri bir kuruma bağlı değil; OSGB Müdürü bu işyerlerini göremez.', 'uyari');
    }
    if (saglikTalepleri.length) {
      uyariEkle(saglikTalepleri.length + ' sağlık verisi erişim talebi bekliyor.', 'uyari');
    }
    if (bulut && bulut.hata) {
      uyariEkle('Ortak kayıt eşitlemesi hata veriyor: ' + (bulut.ayrinti || bulut.hata), 'uyari');
    }
    if (!uyarilar.length) {
      uyariEkle('Sistem genelinde bekleyen uyarı yok.', 'iyi');
    }
    var uyariSatirlari = uyarilar.map(function (uyari) {
      var etiket = uyari.sinif === 'iyi' ? 'Normal' : (uyari.sinif === 'tehlike' ? 'Acil' : 'İzle');
      return '<div class="rol-satir"><span>' + kacis(uyari.metin) + '</span>' +
        '<b>' + B.rozet(etiket, uyari.sinif) + '</b></div>';
    }).join('');
    /* ---- Kurum (OSGB) yönetimi: liste + satır içi oluştur/düzenle formu ---- */
    var duzenlenenKurum = kurumlar.filter(function (kurum) { return kurum.id === UI.sistemKurumId; })[0] || null;
    var kurumSatirlari = kurumlar.map(function (kurum) {
      var isyeriSayisi = isyerleri.filter(function (isyeri) { return isyeri.kurumId === kurum.id; }).length;
      var kullaniciSayisi = kullanicilar.filter(function (kisi) { return (kisi.kurumId || '') === kurum.id; }).length;
      return '<tr>' +
        '<td><strong>' + kacis(kurum.ad || '') + '</strong>' +
          (duzenlenenKurum && duzenlenenKurum.id === kurum.id ? ' ' + B.rozet('Düzenleniyor', 'bilgi') : '') + '</td>' +
        '<td class="sayi-sutun">' + B.sayi(isyeriSayisi) + '</td>' +
        '<td class="sayi-sutun">' + B.sayi(kullaniciSayisi) + '</td>' +
        '<td class="sag"><div class="dosya-eylem">' +
          '<button type="button" data-islem="sistem-kurum-duzenle" data-id="' + kacis(kurum.id) + '">Düzenle</button>' +
          '<button type="button" class="sil" data-islem="sistem-kurum-sil" data-id="' + kacis(kurum.id) + '">Sil</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');

    var kurumFormu =
      '<div class="satir-arac" style="padding:14px 18px;border-top:1px solid var(--line)">' +
        '<label class="alan" style="flex:1 1 240px;margin:0">' +
          '<span>' + (duzenlenenKurum ? 'Kurum adını düzenle' : 'Yeni kurum (OSGB) adı') + '</span>' +
          '<input type="text" id="sistemKurumAd" maxlength="120" placeholder="Örn. ABC OSGB" value="' +
            kacis(duzenlenenKurum ? (duzenlenenKurum.ad || '') : '') + '">' +
        '</label>' +
        '<button type="button" class="dugme birincil" data-islem="sistem-kurum-kaydet">' +
          B.ikon(duzenlenenKurum ? 'i-check' : 'i-plus') + (duzenlenenKurum ? 'Güncelle' : 'Kurum oluştur') +
        '</button>' +
        (duzenlenenKurum
          ? '<button type="button" class="dugme ikincil" data-islem="sistem-kurum-yeni">Vazgeç</button>' : '') +
      '</div>';

    /* ---- İşyeri yönetimi: tehlike sınıfı, kurum bağı ve onay durumu ---- */
    var isyeriSatirlari = isyerleri.map(function (isyeri) {
      var durum = ISG.yetki.onayDurumu(isyeri.id);
      var sinif = ISG.RISK_SINIFLARI[isyeri.tehlikeSinifi];
      var kurum = kurumlar.filter(function (kayit) { return kayit.id === (isyeri.kurumId || ''); })[0];
      var personelSayisi = (hesap.personel || []).filter(function (kisi) { return kisi.isyeriId === isyeri.id; }).length;
      return '<tr>' +
        '<td><strong>' + kacis(isyeri.ad || '') + '</strong>' +
          (isyeri.ana ? ' ' + B.rozet('Ana kurum', 'bilgi') : '') + '</td>' +
        '<td>' + kacis(kurum ? kurum.ad : '—') + '</td>' +
        '<td>' + kacis(sinif ? sinif.ad : (isyeri.tehlikeSinifi || '—')) + '</td>' +
        '<td class="sayi-sutun">' + B.sayi(isyeri.calisanSayisi || 0) + '</td>' +
        '<td class="sayi-sutun">' + B.sayi(personelSayisi) + '</td>' +
        '<td>' + B.rozet(ONAY_MOD_ADI[durum.mod] || durum.mod, ONAY_MOD_ROZET[durum.mod] || 'notr') + '</td>' +
        '<td class="sag"><div class="dosya-eylem">' +
          '<button type="button" data-islem="isyeri-duzenle" data-id="' + kacis(isyeri.id) + '">Düzenle</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
    /* ---- Kullanıcı, rol ve atama yönetimi ---- */
    var kullaniciSatirlari = kullanicilar.slice().sort(function (a, b) {
      return String(a.adSoyad || '').localeCompare(String(b.adSoyad || ''), 'tr');
    }).map(function (kullanici) {
      var tanim = ISG.yetki.rolTanimi(kullanici.rol);
      var kurum = kurumlar.filter(function (kayit) { return kayit.id === (kullanici.kurumId || ''); })[0];
      var sinifKodu = typeof ISG.uzmanSinifiKodu === 'function' ? ISG.uzmanSinifiKodu(kullanici.uzmanSinifi) : '';
      var sinifAdi = sinifKodu
        ? (typeof ISG.uzmanSinifiAdi === 'function' ? ISG.uzmanSinifiAdi(sinifKodu) : sinifKodu + ' sınıfı') : '';
      var kendiHesabi = !!(oturum && oturum.kullaniciId === kullanici.id);
      return '<tr>' +
        '<td><strong>' + kacis(kullanici.adSoyad || '') + '</strong>' +
          '<small class="muted"> · ' + kacis(kullanici.eposta || '') + '</small>' +
          (kullanici.sonGiris ? '<small class="muted"> · Son giriş ' +
            B.tarih(String(kullanici.sonGiris).slice(0, 10)) + '</small>' : '') + '</td>' +
        '<td>' + B.rozet(tanim.ad, ROL_ROZET[tanim.id] || 'bilgi') + '</td>' +
        '<td>' + kacis(kurum ? kurum.ad : '—') + '</td>' +
        '<td>' + kacis(sinifAdi || '—') + '</td>' +
        '<td>' + kacis(sistemKapsamYazisi(kullanici, hesap, tanim)) + '</td>' +
        '<td>' + (kullanici.aktif === false ? B.rozet('Pasif', 'notr') : B.rozet('Aktif', 'iyi')) + '</td>' +
        '<td class="sag"><div class="dosya-eylem">' +
          '<button type="button" data-islem="kullanici-duzenle" data-id="' + kacis(kullanici.id) + '">Düzenle</button>' +
          '<button type="button" data-islem="kullanici-sifre" data-id="' + kacis(kullanici.id) + '">Şifre</button>' +
          (kendiHesabi ? '' : '<button type="button" class="sil" data-islem="kullanici-sil" data-id="' +
            kacis(kullanici.id) + '">Sil</button>') +
        '</div></td>' +
      '</tr>';
    }).join('');

    /* ---- Rol yetki özeti: iki yönetim rolünün ayrımı burada okunur ---- */
    var rolSatirlari = ROL_YETKI_TABLOSU.map(function (id) {
      var tanim = ISG.yetki.ROLLER[id];
      if (!tanim) { return ''; }
      return '<tr>' +
        '<td><strong>' + kacis(tanim.ad) + '</strong></td>' +
        '<td>' + kacis(tanim.tumIsyerleri ? 'Tüm işyerleri' : (tanim.kurumKapsami ? 'Kendi kurumu' : 'Atandığı işyerleri')) + '</td>' +
        '<td>' + kacis(tanim.yonetir ? 'Yönetir · doğrudan yazar' : (tanim.saltOkunur ? 'Salt okunur' : 'Değişiklik onaya gider')) + '</td>' +
        '<td>' + kacis(tanim.onaylar ? 'Karar verir' : 'Karar vermez') + '</td>' +
        '<td>' + kacis(tanim.sistem ? 'Sistem yönetimi' : (tanim.kurumKapsami ? 'Kurum panosu' : '—')) + '</td>' +
      '</tr>';
    }).join('');
    /* ---- Bekleyen onay talepleri: karar yetkisi son kapıda yeniden sınanır ---- */
    var talepSatirlari = bekleyenTalepler.slice().sort(function (a, b) {
      return String(a.olusturma || '').localeCompare(String(b.olusturma || ''));
    }).slice(0, 12).map(function (talep) {
      var kararVerebilir = ISG.yetki.onayYetkisi(talep);
      var eylemler = kararVerebilir
        ? '<input type="text" class="girdi kucuk-girdi" data-talep-not data-id="' + kacis(talep.id) + '" ' +
            'maxlength="160" placeholder="Ret gerekçesi (isteğe bağlı)" aria-label="Ret gerekçesi">' +
          '<button type="button" class="dugme kucuk ikincil" data-islem="talep-reddet" data-id="' + kacis(talep.id) + '">Reddet</button>' +
          '<button type="button" class="dugme kucuk birincil" data-islem="talep-onayla" data-id="' + kacis(talep.id) + '">Onayla</button>'
        : B.rozet('Karar yetkiniz yok', 'notr');
      return '<div class="onay-satir">' +
        '<div class="onay-satir-bilgi">' +
          '<strong>' + kacis(talep.etiket || 'Değişiklik') + ' · ' +
            kacis(talep.isyeriAd || isyeriAdi(talep.isyeriId) || 'Tüm işyerleri') + '</strong>' +
          '<span>' + kacis(talep.ozet || '') + '</span>' +
          '<span class="kucuk">Gönderen: ' + kacis(talep.kullaniciAd || '—') + ' · ' +
            B.tarih(String(talep.olusturma || '').slice(0, 10)) + '</span>' +
          (talep.yetkiDurumu === 'eksik'
            ? '<span class="kucuk">Onay yetkilisi eksik olduğu için bekliyor.</span>' : '') +
        '</div>' +
        '<div class="sag">' + eylemler + '</div>' +
      '</div>';
    }).join('');

    var eksikSatirlari = eksikIsyerleri.map(function (durum) {
      var sinif = ISG.RISK_SINIFLARI[durum.tehlikeSinifi];
      var esik = durum.esik.length
        ? durum.esik.map(function (kod) { return kod + ' sınıfı'; }).join(' / ') : 'tanımsız';
      return '<div class="rol-satir">' +
        '<span>' + kacis(durum.isyeriAd || durum.isyeriId) +
          '<small class="muted"> · ' + kacis(sinif ? sinif.ad : (durum.tehlikeSinifi || 'Tehlike sınıfı yok')) +
          ' · eşik: ' + kacis(esik) + ' · uzman: ' + B.sayi(durum.uzmanSayisi) + '</small></span>' +
        '<b>' + B.rozet(durum.mod === 'eksik' ? 'Sınıf uygun değil' : 'Uzman atanmamış', 'uyari') + '</b>' +
      '</div>';
    }).join('');

    var raporLinkleri =
      '<div class="satir-arac">' +
        '<a class="dugme ince" href="#rapor">Yönetim raporu</a>' +
        '<a class="dugme ince" href="#istatistik">İstatistikler</a>' +
        '<a class="dugme ince" href="#kurum">Kurum panosu</a>' +
        '<a class="dugme ince" href="#onaylar">Onay kuyruğu</a>' +
        '<a class="dugme ince" href="#isyerleri">İşyerleri</a>' +
        '<a class="dugme ince" href="#ekip">Kullanıcılar ve yetkiler</a>' +
      '</div>';
    return P.sayfaBaslik('SİSTEM YÖNETİMİ', 'Sistem yönetimi',
      'Kurum, işyeri, kullanıcı, rol ve onay yönetimi · ' + rol.ad, B.rozet(rol.ad, 'bilgi')) +

      '<section class="kart"><div class="kart-ic"><div class="kpi-izgara kpi-izgara-alti">' +
        istKutu('Kurum (OSGB)', B.sayi(kurumlar.length), 'kayıtlı kurum', 'i-building', 'soluk') +
        istKutu('İşyeri', B.sayi(isyerleri.length), 'yönetilen işyeri', 'i-building', 'soluk') +
        istKutu('Kullanıcı', B.sayi(kullanicilar.length), B.sayi(pasifKullanicilar.length) + ' pasif', 'i-team', 'soluk') +
        istKutu('Onay yetkilisi eksik', B.sayi(eksikIsyerleri.length), 'atanmalı', 'i-alert',
          eksikIsyerleri.length ? 'uyari' : '') +
        istKutu('Bekleyen talep', B.sayi(bekleyenTalepler.length), 'karar bekliyor', 'i-check',
          bekleyenTalepler.length ? 'uyari' : 'soluk') +
      '</div></div></section>' +

      '<section class="kart"><div class="kart-baslik" style="flex-direction:column;align-items:flex-start">' +
        '<h2>Sistem uyarıları ve hata durumları</h2>' +
        '<p>Onay yetkilisi eksiği, bekleyen talep, vadesi geçen kayıt ve eşitleme hataları tek listede.</p></div>' +
        '<div class="kart-ic">' + uyariSatirlari + '</div></section>' +

      '<section class="kart"><div class="kart-baslik"><div><h2>Kurum (OSGB) yönetimi</h2>' +
        '<p>Kurum oluşturun, adını düzenleyin. Kurum silinince işyeri ve kullanıcı kayıtları silinmez, yalnızca bağ boşalır.</p></div>' +
        '<div class="kart-arac"><span class="muted kucuk">' + B.sayi(kurumlar.length) + ' kurum</span></div></div>' +
        (kurumSatirlari
          ? '<div class="tablo-kap"><table class="tablo-kucuk"><thead><tr>' +
              '<th>Kurum</th><th class="sag">İşyeri</th><th class="sag">Kullanıcı</th><th class="sag">İşlem</th>' +
            '</tr></thead><tbody>' + kurumSatirlari + '</tbody></table></div>'
          : '<div class="kart-ic"><p class="bolum-aciklama">Henüz kurum kaydı yok. Aşağıdaki alandan ilk OSGB kurumunu oluşturun.</p></div>') +
        kurumFormu +
      '</section>' +

      '<section class="kart"><div class="kart-baslik"><div><h2>İşyeri yönetimi</h2>' +
        '<p>Tehlike sınıfı, kurum bağı, çalışan sayısı ve onay yetkisi durumu.</p></div>' +
        '<div class="kart-arac">' +
          '<button type="button" class="dugme birincil" data-islem="isyeri-yeni">' + B.ikon('i-plus') + 'Yeni işyeri</button>' +
        '</div></div>' +
        (isyeriSatirlari
          ? '<div class="tablo-kap"><table class="tablo-kucuk"><thead><tr>' +
              '<th>İşyeri</th><th>Kurum</th><th>Tehlike sınıfı</th><th class="sag">Çalışan</th>' +
              '<th class="sag">Personel</th><th>Onay durumu</th><th class="sag">İşlem</th>' +
            '</tr></thead><tbody>' + isyeriSatirlari + '</tbody></table></div>'
          : '<div class="kart-ic">' + B.bosDurum('İşyeri yok', 'Yeni işyeri düğmesiyle ilk işyerini oluşturun.', 'i-building') + '</div>') +
      '</section>' +

      '<section class="kart"><div class="kart-baslik"><div><h2>Kullanıcı, rol ve atama yönetimi</h2>' +
        '<p>Rol, kurum, uzman sınıfı (A/B/C), işyeri atamaları ve aktif/pasif durumu tek ekranda yönetilir.</p></div>' +
        '<div class="kart-arac">' +
          '<button type="button" class="dugme birincil" data-islem="kullanici-yeni">' + B.ikon('i-plus') + 'Yeni kullanıcı</button>' +
        '</div></div>' +
        (kullaniciSatirlari
          ? '<div class="tablo-kap"><table class="tablo-kucuk"><thead><tr>' +
              '<th>Kullanıcı</th><th>Rol</th><th>Kurum</th><th>Uzman sınıfı</th><th>Kapsam</th>' +
              '<th>Durum</th><th class="sag">İşlem</th>' +
            '</tr></thead><tbody>' + kullaniciSatirlari + '</tbody></table></div>'
          : '<div class="kart-ic">' + B.bosDurum('Kullanıcı yok', 'Yeni kullanıcı düğmesiyle ilk hesabı tanımlayın.', 'i-team') + '</div>') +
      '</section>' +

      '<section class="kart"><div class="kart-baslik" style="flex-direction:column;align-items:flex-start">' +
        '<h2>Rol yetkileri</h2>' +
        '<p>OSGB Müdürü salt okunur kurum denetçisidir; Sistem Yöneticisi kurum, işyeri ve kullanıcı yönetimini yapar. İki rol bağımsızdır.</p></div>' +
        '<div class="tablo-kap"><table class="tablo-kucuk"><thead><tr>' +
          '<th>Rol</th><th>Kapsam</th><th>Yazma</th><th>Onay kuyruğu</th><th>Ekran</th>' +
        '</tr></thead><tbody>' + rolSatirlari + '</tbody></table></div>' +
      '</section>' +

      '<section class="kart"><div class="kart-baslik"><div><h2>Bekleyen onay talepleri</h2>' +
        '<p>Yetkiniz dahilinde onaylayın veya gerekçe yazarak reddedin. Karar yetkisi her talepte yeniden sınanır.</p></div>' +
        '<div class="kart-arac"><span class="muted kucuk">' + B.sayi(bekleyenTalepler.length) + ' bekleyen</span></div></div>' +
        (talepSatirlari
          ? talepSatirlari
          : '<div class="kart-ic">' + B.bosDurum('Bekleyen talep yok',
              'Yetkili kullanıcılar değişiklik gönderdiğinde burada listelenir.', 'i-check') + '</div>') +
      '</section>' +

      '<section class="kart"><div class="kart-baslik" style="flex-direction:column;align-items:flex-start">' +
        '<h2>Onay yetkilisi eksik işyerleri</h2>' +
        '<p>İşyeri onay modelinde karar verecek uzman yok. Atamayı kullanıcı ekranından yapın; sınıf eşiği korunur.</p></div>' +
        (eksikSatirlari
          ? '<div class="kart-ic">' + eksikSatirlari + '</div>'
          : '<div class="kart-ic">' + B.bosDurum('Eksik işyeri yok',
              'Bütün işyerlerinde onay yetkilisi tanımlı.', 'i-check') + '</div>') +
      '</section>' +

      '<section class="kart"><div class="kart-baslik" style="flex-direction:column;align-items:flex-start">' +
        '<h2>Genel raporlar</h2>' +
        '<p>Kurum ve işyeri bazlı raporlar mevcut ekranlardan açılır.</p></div>' +
        '<div class="kart-ic">' + raporLinkleri + '</div></section>';
  };


  SAYFALAR.kurum = function () {
    var hesap = veri();
    var oturum = ISG.yetki ? ISG.yetki.oturum() : null;
    var kurumId = (oturum && oturum.kurumId) || '';
    var kurumlar = hesap.kurumlar || [];
    var kurum = kurumlar.filter(function (kayit) { return kayit.id === kurumId; })[0] ||
      (kurumlar.length === 1 ? kurumlar[0] : null);
    var isyerleri = hesap.isyerleri || [];
    var kullanicilar = hesap.kullanicilar || [];
    var talepler = hesap.talepler || [];

    var satirlar = isyerleri.map(function (isyeri) {
      var durum = ISG.yetki.onayDurumu(isyeri.id);
      var yetkiliAdlari = durum.onaylayanIdler.map(function (id) {
        var kisi = kullanicilar.filter(function (k) { return k.id === id; })[0];
        return kisi ? (kisi.adSoyad || '') : '';
      }).filter(function (ad) { return ad; });
      var sinifMetni = durum.esik.length
        ? durum.esik.map(function (kod) { return kod + ' sınıfı'; }).join(' / ')
        : 'tanımsız';
      var sinif = ISG.RISK_SINIFLARI[isyeri.tehlikeSinifi];
      return '<tr>' +
        '<td>' + kacis(isyeri.ad || '') + '</td>' +
        '<td>' + kacis(sinif ? sinif.ad : (isyeri.tehlikeSinifi || '—')) + '</td>' +
        '<td class="sayi-sutun">' + B.sayi(durum.uzmanSayisi) + '</td>' +
        '<td>' + B.rozet(ONAY_MOD_ADI[durum.mod] || durum.mod, ONAY_MOD_ROZET[durum.mod] || 'notr') +
          '<small class="muted"> · eşik: ' + kacis(sinifMetni) + '</small></td>' +
        '<td>' + kacis(yetkiliAdlari.length ? yetkiliAdlari.join(', ') : '—') + '</td>' +
      '</tr>';
    }).join('');

    var eksik = isyerleri.filter(function (isyeri) {
      var mod = ISG.yetki.onayDurumu(isyeri.id).mod;
      return mod === 'eksik' || mod === 'uzman-yok';
    }).length;

    var talepSatirlari = talepler.slice().sort(function (a, b) {
      return String(b.olusturma || '').localeCompare(String(a.olusturma || ''));
    }).slice(0, 20).map(function (talep) {
      var durumAdi = TALEP_DURUM_ADI[talep.durum] || talep.durum || '';
      var durumRozet = talep.durum === 'onaylandi' ? 'iyi' : (talep.durum === 'reddedildi' ? 'tehlike' : 'uyari');
      return '<div class="rol-satir">' +
        '<span>' + kacis((talep.isyeriAd || talep.isyeriId || '') + ' · ' + (talep.etiket || '')) +
          '<small class="muted"> · ' + kacis(talep.kullaniciAd || '') +
          (talep.olusturma ? ' · ' + B.tarih(String(talep.olusturma).slice(0, 10)) : '') + '</small></span>' +
        '<b>' + B.rozet(durumAdi, durumRozet) + '</b>' +
      '</div>';
    }).join('');

    var ekipSatirlari = kullanicilar.map(function (kisi) {
      var tanim = ISG.yetki.rolTanimi(kisi.rol);
      var kapsamMetni = kisi.tumIsyerleri ? 'Tüm işyerleri'
        : ((kisi.isyerleri || []).map(function (id) { return ISG.isyeriAdi(hesap, id); }).join(', ') || 'İşyeri tanımlı değil');
      var sinif = kisi.uzmanSinifi && tanim.id === 'yetkili'
        ? ' · ' + (ISG.uzmanSinifiAdi ? ISG.uzmanSinifiAdi(kisi.uzmanSinifi) : kisi.uzmanSinifi) : '';
      return '<div class="rol-satir">' +
        '<span>' + kacis(kisi.adSoyad || '') + '<small class="muted"> · ' + kacis(kapsamMetni) + '</small></span>' +
        '<b>' + kacis(tanim.ad + sinif) + (kisi.aktif === false ? ' ' + B.rozet('Pasif', 'notr') : '') + '</b>' +
      '</div>';
    }).join('');

    return P.sayfaBaslik('KURUM DENETİM PANOSU',
      kurum ? kurum.ad : 'Kurum kaydı yok',
      'Salt okunur kurumsal gözetim · kayıt değiştirme yetkisi yoktur',
      B.rozet('Salt okunur', 'notr')) +
      '<section class="kart"><div class="kart-ic"><div class="kpi-izgara">' +
        istKutu('İşyeri', B.sayi(isyerleri.length), 'kuruma bağlı', 'i-building', 'soluk') +
        istKutu('Kurum kullanıcısı', B.sayi(kullanicilar.length), 'aktif ve pasif', 'i-team', 'soluk') +
        istKutu('Onay yetkilisi eksik', B.sayi(eksik), 'atanmalı', 'i-alert', eksik ? 'uyari' : '') +
        istKutu('Bekleyen talep', B.sayi(talepler.filter(function (t) { return t.durum === 'bekliyor'; }).length), 'karar bekliyor', 'i-check', 'soluk') +
      '</div></div></section>' +

      '<section class="kart"><div class="kart-baslik" style="flex-direction:column;align-items:flex-start">' +
        '<h2>Onay yetkisi durumu</h2>' +
        '<p>Tek uzmanlı işyerinde uzman doğrudan yazar; çok uzmanlı işyerinde tehlike sınıfına uygun sınıftaki uzman onay verir.</p>' +
      '</div>' +
      (satirlar ? '<div class="tablo-kap"><table class="tablo-kucuk"><thead><tr>' +
        '<th>İşyeri</th><th>Tehlike sınıfı</th><th class="sag">Uzman</th>' +
        '<th>Onay durumu</th><th>Onay yetkilisi</th>' +
        '</tr></thead><tbody>' + satirlar + '</tbody></table></div>' :
        '<div class="kart-ic">' + B.bosDurum('İşyeri yok', 'Kuruma bağlı işyeri kaydı bulunmuyor.', 'i-building') + '</div>') +
      '</section>' +

      '<section class="kart"><div class="kart-baslik" style="flex-direction:column;align-items:flex-start">' +
        '<h2>Bekleyen ve sonuçlanan talepler</h2>' +
        '<p>Karar yetkisi onay yetkilisinde ve yöneticidedir; bu ekran yalnızca izler.</p></div>' +
        '<div class="kart-ic">' +
          (talepSatirlari || '<p class="bolum-aciklama">Kurum kapsamında onay talebi bulunmuyor.</p>') +
        '</div>' +
      '</section>' +

      '<section class="kart"><div class="kart-baslik" style="flex-direction:column;align-items:flex-start">' +
        '<h2>Kurum ekibi</h2>' +
        '<p>Rol, kapsam ve uzman sınıfı; şifre ve sağlık verisi bu ekranda yer almaz.</p></div>' +
        '<div class="kart-ic">' +
          (ekipSatirlari || '<p class="bolum-aciklama">Kurum kullanıcısı bulunmuyor.</p>') +
        '</div>' +
      '</section>';
  };

  /* ---------- Mevzuat ve kapsam ---------- */

  /* Kayıtlı mevzuat başlığı yoksa sayfa yerleşik kataloğu gösterir; böylece boş
     açılan cihazda "Mevzuat ve kapsam" listesi boş kalmaz. Katalog veriye yazılmaz,
     yalnızca okunur (kayıt değildir). */
  function mevzuatKaynagi(hesap) {
    var kayitli = (hesap && hesap.mevzuat) || [];
    if (kayitli.length) { return { liste: kayitli, yerlesik: false }; }
    var katalog = typeof ISG.MEVZUAT_KATALOGU === 'function' ? ISG.MEVZUAT_KATALOGU() : [];
    return { liste: katalog, yerlesik: katalog.length > 0 };
  }

  SAYFALAR.mevzuat = function () {
    var hesap = veri();
    var kaynak = mevzuatKaynagi(hesap);
    var basliklar = kaynak.liste;
    var kategoriler = [];
    basliklar.forEach(function (madde) {
      if (kategoriler.indexOf(madde.kategori) < 0) { kategoriler.push(madde.kategori); }
    });
    var arama = String(UI.mevzuatArama || '').toLocaleLowerCase('tr');
    var liste = basliklar.filter(function (madde) {
      if (UI.mevzuatKategori && madde.kategori !== UI.mevzuatKategori) { return false; }
      if (arama && [madde.baslik, madde.dayanak, madde.kapsam, madde.ozet].join(' ').toLocaleLowerCase('tr').indexOf(arama) < 0) { return false; }
      return true;
    });
    var isyeri = ISG.isyeriBul(hesap, UI.kapsam) || (hesap.isyerleri || []).filter(function (i) { return i.ana; })[0] || (hesap.isyerleri || [])[0];
    var gozdenGecir = basliklar.filter(function (m) { return m.durum === 'gozdenGecir'; }).length;

    var satirlar = liste.map(function (madde, sira) {
      return '<div class="mevzuat-satir">' +
        '<span class="mevzuat-no">' + (sira + 1) + '</span>' +
        '<div><strong>' + kacis(madde.baslik) + '</strong>' +
          '<small>' + kacis(madde.kategori) + ' · ' + kacis(madde.dayanak) + '</small>' +
          (madde.kapsam ? '<small class="mevzuat-kapsam"><b>Kapsam:</b> ' + kacis(madde.kapsam) + '</small>' : '') +
          '<p>' + kacis(madde.ozet) + '</p></div>' +
        B.rozet(madde.durum === 'gozdenGecir' ? 'Gözden geçir' : 'İncelendi', madde.durum === 'gozdenGecir' ? 'uyari' : 'iyi') +
      '</div>';
    }).join('');

    return P.sayfaBaslik('MEVZUAT VE KAPSAM', 'Mevzuat ve kapsam', 'Yasal kuralların doğrulama durumu') +
      P.kapsamSecici(hesap) +

      '<section class="kart"><div class="kart-baslik" style="flex-direction:column;align-items:flex-start">' +
        '<h2>Mevzuattan işyeri takibine</h2>' +
        '<p class="muted">' + B.sayi(basliklar.length) + ' başlıkta kapsam, dayanak ve belge takibi.' +
          (kaynak.yerlesik ? ' Liste yerleşik katalogdan geliyor.' : '') +
          ' Son kaynak kontrolü: ' + B.tarih(hesap.ayarlar.sonMevzuatKontrolu) + '.</p>' +
      '</div><div class="kart-ic">' +
        '<div class="prose">' +
          '<p>Bu katalog bir uygunluk belgesi değildir. Resmî kaynak özetleri ve rehberler incelendi; güncel birleştirilmiş metinlerin tamamına erişilemedi. ' +
            'Her başlığın teyit durumu aşağıdadır. Mevzuat değişiklikleri otomatik izlenmez. Sağlık verileri ve kişisel dosyalar için bu ortak kayıt ekranını kullanmayın. ' +
            'Yenileme tarihleri kaydettiğiniz belge tarihi ve tehlike sınıfından hesaplanır; olay ve faaliyet kaynaklı erken yenileme gerekebilir.</p>' +
        '</div>' +
        (kaynak.yerlesik ? '<p class="bolum-aciklama" style="margin-top:10px"><strong>Yerleşik mevzuat kataloğu.</strong> ' +
          'Bu cihazda kayıtlı mevzuat başlığı yok; liste 6331 sayılı Kanun ve bağlı yönetmeliklerin kapsam özetiyle açıldı. ' +
          'Katalog kayıt sayılmaz, yedeğe ve dışa aktarıma girmez. Kapsam kararı sizin işyerinize aitse kontrol maddesi açıp gerekçesini yazın.</p>' : '') +
        '<div class="filtre-cubugu" style="padding:16px 0 0;border-bottom:0;margin-top:10px">' +
          '<select data-ui="mevzuatKategori" aria-label="Kategori filtresi"><option value="">Tüm başlıklar</option>' +
            kategoriler.map(function (kategori) {
              return '<option value="' + kacis(kategori) + '"' + (UI.mevzuatKategori === kategori ? ' selected' : '') + '>' + kacis(kategori) + '</option>';
            }).join('') + '</select>' +
          '<div class="arama">' + B.ikon('i-search') +
            '<input type="search" data-ui="mevzuatArama" value="' + kacis(UI.mevzuatArama || '') + '" placeholder="Konu ara (örn. eğitim, gaz, periyodik kontrol)" aria-label="Mevzuat konusu ara">' +
          '</div>' +
          '<span class="sag-arac lejant"><span class="nokta nokta-sari"></span>' + gozdenGecir + ' başlık gözden geçirilmeli</span>' +
        '</div>' +
        (isyeri ? '<p class="bolum-aciklama" style="margin-top:10px"><strong>' + kacis(isyeri.ad) + '</strong> · ' +
          kacis((ISG.RISK_SINIFLARI[isyeri.tehlikeSinifi] || {}).ad || '') + ' · ' + B.sayi(isyeri.calisanSayisi) + ' çalışan. ' +
          'Kesin kapsam için faaliyet, sicil, alt işveren ilişkileri ve saha koşulları ayrıca değerlendirilmelidir.</p>' : '') +
        '<p class="bolum-aciklama" style="margin-top:8px">İlgili başlıktan kontrol maddesi oluşturabilir, kapsam kararınızı açıklamasına yazabilir ve sağlık verisi içermeyen kanıtları yükleyebilirsiniz. ' +
          'Tarihli işleri çalışma planından takip edin.</p>' +
        '<p style="margin-top:12px"><a class="link-dis" href="https://mevzuat.gov.tr" target="_blank" rel="noopener noreferrer">Mevzuat Bilgi Sistemi ' + B.ikon('i-arrow') + '</a></p>' +
      '</div></section>' +

      '<section class="kart"><div class="kart-baslik"><div><h2>Kapsam başlıkları</h2>' +
        '<p>Seçili kategoriye göre ' + B.sayi(liste.length) + ' başlık listeleniyor.</p></div></div>' +
        '<div class="mevzuat-list">' + (satirlar || '<div class="kart-ic">' + B.bosDurum('Başlık bulunamadı', 'Arama ölçütünü değiştirin ya da kategori filtresini sıfırlayın.', 'i-law') + '</div>') + '</div>' +
      '</section>';
  };

  /* ---------- Onay kuyruğu ---------- */

  var TALEP_DURUM = {
    bekliyor: { ad: 'Onay bekliyor', sinif: 'uyari' },
    onaylandi: { ad: 'Onaylandı', sinif: 'iyi' },
    reddedildi: { ad: 'Reddedildi', sinif: 'hata' }
  };

  function talepGun(talep) {
    return String(talep.kararTarihi || talep.olusturma || '').slice(0, 10);
  }

  /* ---------- İstatistikler ---------- */

  function istKutu(baslik, deger, alt, ikon, sinif) {
    return '<div class="kpi ' + (sinif || '') + '">' +
      '<span class="kpi-ust">' + B.ikon(ikon) + kacis(baslik) + '</span>' +
      '<span class="kpi-deger">' + kacis(deger) + '</span>' +
      '<span class="kpi-alt"><span>' + kacis(alt) + '</span></span>' +
    '</div>';
  }

  function istCubuklar(satirlar, bosMetin) {
    var dolu = (satirlar || []).filter(function (satir) { return Number(satir.deger) > 0; });
    if (!dolu.length) { return '<p class="bolum-aciklama">' + kacis(bosMetin || 'Gösterilecek veri yok.') + '</p>'; }
    var enBuyuk = dolu.reduce(function (en, satir) { return Math.max(en, Number(satir.deger) || 0); }, 0);
    return '<div class="ist-cubuklar">' + satirlar.map(function (satir) {
      var oran = enBuyuk ? Math.round(((Number(satir.deger) || 0) / enBuyuk) * 100) : 0;
      return '<div class="ist-cubuk ' + (satir.sinif || 'notr') + '">' +
        '<span class="ist-cubuk-ad" title="' + kacis(satir.ad) + '">' + kacis(satir.ad) + '</span>' +
        '<span class="ist-cubuk-ray"><span class="ist-cubuk-dolgu" style="width:' + oran + '%"></span></span>' +
        '<b class="ist-cubuk-deger">' + B.sayi(satir.deger) + '</b>' +
      '</div>';
    }).join('') + '</div>';
  }

  function istDagilim(kaynaklar, sayac) {
    return kaynaklar.map(function (kaynak) {
      return { ad: kaynak.ad, deger: sayac[kaynak.id] || 0, sinif: kaynak.sinif };
    });
  }

  function istKart(baslik, aciklama, icerik) {
    return '<section class="kart">' +
      '<div class="kart-baslik"><div><h2>' + kacis(baslik) + '</h2><p>' + kacis(aciklama) + '</p></div></div>' +
      '<div class="kart-ic">' + icerik + '</div>' +
    '</section>';
  }

  /* ISO tarihin haftanın hangi gününe denk geldiği (Pazartesi = 0); geçersizse -1. */
  function haftaGunu(tarih) {
    var iso = String(tarih || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) { return -1; }
    var gun = new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))).getDay();
    return (gun + 6) % 7;
  }

  /* Dikey sütun grafiği — aylık sıklık gibi zaman serileri için. */
  function istSutunlar(satirlar, bosMetin) {
    var dolu = (satirlar || []).filter(function (satir) { return Number(satir.deger) > 0; });
    if (!dolu.length) { return '<p class="bolum-aciklama">' + kacis(bosMetin || 'Gösterilecek veri yok.') + '</p>'; }
    var enBuyuk = dolu.reduce(function (en, satir) { return Math.max(en, Number(satir.deger) || 0); }, 0);
    return '<div class="ist-sutunlar">' + satirlar.map(function (satir) {
      var deger = Number(satir.deger) || 0;
      var oran = enBuyuk ? Math.round((deger / enBuyuk) * 100) : 0;
      return '<div class="ist-sutun ' + (satir.sinif || 'notr') + '" title="' + kacis(satir.ad + ': ' + B.sayi(deger)) + '">' +
        '<b class="ist-sutun-deger">' + (deger ? B.sayi(deger) : '·') + '</b>' +
        '<span class="ist-sutun-ray"><span class="ist-sutun-dolgu" style="height:' + (deger ? Math.max(oran, 6) : 0) + '%"></span></span>' +
        '<span class="ist-sutun-ad">' + kacis(satir.ad) + '</span>' +
      '</div>';
    }).join('') + '</div>';
  }

  /* Neden × vücut bölgesi çapraz tablosu — hücre koyuluğu sıklığı gösterir. */
  function istMatris(kolonlar, satirlar, bosMetin) {
    var toplam = (satirlar || []).reduce(function (t, satir) { return t + satir.toplam; }, 0);
    if (!toplam || !kolonlar.length) { return '<p class="bolum-aciklama">' + kacis(bosMetin || 'Gösterilecek veri yok.') + '</p>'; }
    var enBuyuk = 0;
    satirlar.forEach(function (satir) {
      satir.degerler.forEach(function (deger) { enBuyuk = Math.max(enBuyuk, Number(deger) || 0); });
    });
    var bas = '<div class="ist-matris-kap"><table class="ist-matris"><thead><tr><th scope="col">Kök neden</th>' +
      kolonlar.map(function (kolon) { return '<th scope="col">' + kacis(kolon.ad) + '</th>'; }).join('') +
      '<th scope="col" class="sag">Toplam</th></tr></thead><tbody>';
    var govde = satirlar.map(function (satir) {
      return '<tr><th scope="row">' + kacis(satir.ad) + '</th>' + satir.degerler.map(function (deger) {
        var sayi = Number(deger) || 0;
        if (!sayi) { return '<td class="bos">·</td>'; }
        var oran = enBuyuk ? sayi / enBuyuk : 0;
        var stil = ' style="background:rgba(180,35,24,' + (0.08 + oran * 0.5).toFixed(2) + ')"';
        return '<td class="dolu' + (oran > 0.55 ? ' koyu' : '') + '"' + stil + '>' + B.sayi(sayi) + '</td>';
      }).join('') + '<td class="sag"><b>' + B.sayi(satir.toplam) + '</b></td></tr>';
    }).join('');
    return bas + govde + '</tbody></table></div>' +
      '<p class="bolum-aciklama" style="margin-top:8px">Koyu hücre, aynı kök neden içinde daha sık görülen yaralanma bölgesini gösterir.</p>';
  }

  /* Kişi bazlı sıralama listesi (ad + alt bilgi + değer). */
  function istListe(satirlar, bosMetin) {
    if (!satirlar || !satirlar.length) { return '<p class="bolum-aciklama">' + kacis(bosMetin || 'Gösterilecek veri yok.') + '</p>'; }
    return '<div class="ist-liste">' + satirlar.map(function (satir) {
      return '<div class="ist-liste-satir">' +
        '<span class="ist-liste-ad"><b>' + kacis(satir.ad) + '</b>' +
          (satir.alt ? '<span class="kucuk">' + kacis(satir.alt) + '</span>' : '') + '</span>' +
        '<span class="ist-liste-deger">' + kacis(satir.deger) + '</span>' +
      '</div>';
    }).join('') + '</div>';
  }

  /* Düz sayısal tablo — aylık KSO/KAO gibi dönem karşılaştırmaları için.
     kolonlar: [{ ad }], satirlar: [{ degerler: [ilk kolon başlık hücresi, ...] }] */
  function istTablo(kolonlar, satirlar, bosMetin) {
    if (!satirlar || !satirlar.length) {
      return '<p class="bolum-aciklama">' + kacis(bosMetin || 'Gösterilecek veri yok.') + '</p>';
    }
    var bas = '<div class="ist-matris-kap"><table class="ist-tablo"><thead><tr>' +
      (kolonlar || []).map(function (kolon) { return '<th scope="col">' + kacis(kolon.ad) + '</th>'; }).join('') +
      '</tr></thead><tbody>';
    var govde = satirlar.map(function (satir) {
      return '<tr>' + (satir.degerler || []).map(function (deger, sira) {
        return sira === 0 ? '<th scope="row">' + kacis(deger) + '</th>' : '<td>' + kacis(deger) + '</td>';
      }).join('') + '</tr>';
    }).join('');
    return bas + govde + '</tbody></table></div>';
  }

  SAYFALAR.istatistik = function () {
    var hesap = veri();
    var kapsam = UI.kapsam;
    var isyerleri = (hesap.isyerleri || []).filter(function (isyeri) { return !kapsam || isyeri.id === kapsam; });
    var personel = ISG.kapsamda(hesap, kapsam, 'personel');
    var egitimler = hesap.egitimler || [];
    var dosyalar = ISG.kapsamda(hesap, kapsam, 'dosyalar');
    var tespitler = ISG.kapsamda(hesap, kapsam, 'tespitler');
    var riskler = ISG.kapsamda(hesap, kapsam, 'riskler');
    var planlar = ISG.kapsamda(hesap, kapsam, 'planlar');

    var aktifPersonel = personel.filter(function (kisi) { return kisi.durum !== 'pasif'; });
    var acikTespit = tespitler.filter(function (tespit) { return ISG.tespitDurumu(tespit).id !== 'kapali'; });
    var gecikenTespit = tespitler.filter(function (tespit) { return ISG.tespitDurumu(tespit).id === 'geciken'; });
    var eksikBelge = dosyalar.filter(function (dosya) { return dosya.durum === 'eksik' || dosya.durum === 'yok'; });
    var acikRisk = riskler.filter(function (risk) { return risk.durum !== 'kapali'; });
    var tamamlananPlan = planlar.filter(function (plan) { return plan.durum === 'tamamlandi'; });

    var personelSatir = isyerleri.map(function (isyeri) {
      var sayi = personel.filter(function (kisi) { return kisi.isyeriId === isyeri.id; }).length;
      return { ad: isyeri.ad, deger: sayi, sinif: 'bilgi' };
    }).sort(function (a, b) { return b.deger - a.deger; });

    var dofSayac = {};
    tespitler.forEach(function (tespit) {
      var anahtar = ISG.tespitDurumu(tespit).id;
      dofSayac[anahtar] = (dofSayac[anahtar] || 0) + 1;
    });
    var dofSatir = istDagilim([
      { id: 'acik', ad: 'Açık', sinif: 'bilgi' },
      { id: 'geciken', ad: 'Geciken', sinif: 'tehlike' },
      { id: 'dogrulama', ad: 'Doğrulama bekliyor', sinif: 'uyari' },
      { id: 'kapali', ad: 'Kapatıldı', sinif: 'iyi' }
    ], dofSayac);

    var riskSayac = {};
    riskler.forEach(function (risk) {
      var seviye = ISG.riskSeviye(ISG.riskSkor(risk));
      riskSayac[seviye.id] = (riskSayac[seviye.id] || 0) + 1;
    });
    var riskSatir = [20, 12, 6, 2].map(function (ornekSkor) {
      var seviye = ISG.riskSeviye(ornekSkor);
      return { ad: seviye.ad, deger: riskSayac[seviye.id] || 0, sinif: seviye.sinif };
    });

    var belgeSayac = {};
    dosyalar.forEach(function (dosya) {
      var anahtar = ISG.DOSYA_DURUMLARI[dosya.durum] ? dosya.durum : 'incelenmedi';
      belgeSayac[anahtar] = (belgeSayac[anahtar] || 0) + 1;
    });
    var belgeSatir = istDagilim([
      { id: 'var', ad: 'Var', sinif: 'iyi' },
      { id: 'eksik', ad: 'Eksik', sinif: 'tehlike' },
      { id: 'yok', ad: 'Yok', sinif: 'notr' },
      { id: 'incelenmedi', ad: 'İncelenmedi', sinif: 'uyari' }
    ], belgeSayac);

    var egitimSayac = {};
    aktifPersonel.forEach(function (kisi) {
      var durum = ISG.kisiDurumu(kisi, egitimler);
      egitimSayac[durum.id] = (egitimSayac[durum.id] || 0) + 1;
    });
    var egitimSatir = istDagilim([
      { id: 'gecerli', ad: 'Geçerli', sinif: 'iyi' },
      { id: 'yaklasiyor', ad: '60 gün içinde doluyor', sinif: 'uyari' },
      { id: 'suresiDoldu', ad: 'Süresi doldu', sinif: 'tehlike' },
      { id: 'yok', ad: 'Eğitim kaydı yok', sinif: 'notr' }
    ], egitimSayac);

    var olaylar = ISG.kapsamda(hesap, kapsam, 'olaylar');
    var kazalar = olaylar.filter(function (olay) { return olay.tur === 'isKazasi'; });
    /* Liste iş kazası ve meslek hastalığı kayıtlarını birlikte gösterir; SGK oranları yalnız iş kazasına dayanır. */
    var kayitlar = olaylar.filter(ISG.kazaKaydi);
    var kazaPersonel = [];
    kazalar.forEach(function (kaza) {
      if (kaza.personelId && kazaPersonel.indexOf(kaza.personelId) < 0) { kazaPersonel.push(kaza.personelId); }
    });
    var kayipGun = kazalar.reduce(function (toplam, kaza) { return toplam + ISG.kazaKayipGun(kaza); }, 0);
    var kayipliKaza = kazalar.filter(function (kaza) { return ISG.kazaKayipGun(kaza) > 0; }).length;
    var sonKaza = kazalar.slice().sort(function (a, b) { return String(b.tarih).localeCompare(String(a.tarih)); })[0];

    var kazaIsyeriSatir = isyerleri.map(function (isyeri) {
      var sayi = kazalar.filter(function (kaza) { return kaza.isyeriId === isyeri.id; }).length;
      return { ad: isyeri.ad, deger: sayi, sinif: sayi ? 'tehlike' : 'notr' };
    }).sort(function (a, b) { return b.deger - a.deger; });

    var bolgeSayac = {};
    var yaralanmaSayac = {};
    kazalar.forEach(function (kaza) {
      var bolge = kaza.vucutBolgesi || 'belirtilmedi';
      var tur = kaza.yaralanmaTuru || 'belirtilmedi';
      bolgeSayac[bolge] = (bolgeSayac[bolge] || 0) + 1;
      yaralanmaSayac[tur] = (yaralanmaSayac[tur] || 0) + 1;
    });
    var bolgeSatir = istDagilim(ISG.YARALANMA_BOLGELERI.map(function (bolge) {
      return { id: bolge.id, ad: bolge.ad, sinif: 'tehlike' };
    }), bolgeSayac);
    var yaralanmaSatir = istDagilim(ISG.YARALANMA_TURLERI.map(function (tur) {
      return { id: tur.id, ad: tur.ad, sinif: 'uyari' };
    }), yaralanmaSayac);
    if (bolgeSayac.belirtilmedi) {
      bolgeSatir.push({ ad: 'Belirtilmedi', deger: bolgeSayac.belirtilmedi, sinif: 'notr' });
    }
    if (yaralanmaSayac.belirtilmedi) {
      yaralanmaSatir.push({ ad: 'Belirtilmedi', deger: yaralanmaSayac.belirtilmedi, sinif: 'notr' });
    }

    /* --- İş kazası kırılımları: neden, bölge, departman, kıdem, şiddet, sıklık --- */
    var personelHarita = {};
    (hesap.personel || []).forEach(function (kisi) { personelHarita[kisi.id] = kisi; });

    var bugunIso = B.bugunIso();
    var ayAnahtarlari = [];
    var ayYil = Number(bugunIso.slice(0, 4));
    var ayNo = Number(bugunIso.slice(5, 7));
    for (var geri = 11; geri >= 0; geri -= 1) {
      var yil = ayYil;
      var ay = ayNo - geri;
      while (ay <= 0) { ay += 12; yil -= 1; }
      ayAnahtarlari.push(yil + '-' + ('0' + ay).slice(-2));
    }

    var nedenSayac = {};
    var bolgeNedenSayac = {};
    var deptSayac = {};
    var kidemSayac = {};
    var siddetSayac = {};
    var sinifSayac = {};
    var vardiyaSayac = {};
    var gunSayac = {};
    var kisiSayac = {};
    var aySayac = {};
    var ayKayipSayac = {};
    var sonYilKaza = 0;
    var sonYilKayip = 0;
    var sevkKaza = 0;

    /* SGK oranları için çalışılan saat: personel × aylık kişi saati varsayımı. */
    var aySaatSatir = ayAnahtarlari.map(function (anahtar) {
      var kisiSayisi = ISG.ayAktifPersonel(personel, anahtar);
      return { anahtar: anahtar, kisi: kisiSayisi, saat: kisiSayisi * ISG.AYLIK_KISI_SAATI };
    });
    var toplamSaat = aySaatSatir.reduce(function (toplam, satir) { return toplam + satir.saat; }, 0);
    var ortalamaKisi = aySaatSatir.length ?
      Math.round(aySaatSatir.reduce(function (toplam, satir) { return toplam + satir.kisi; }, 0) / aySaatSatir.length) : 0;

    kazalar.forEach(function (kaza) {
      var kisi = personelHarita[kaza.personelId] || null;
      var nedenId = kaza.neden || 'belirtilmedi';
      var bolgeId = kaza.vucutBolgesi || 'belirtilmedi';

      nedenSayac[nedenId] = (nedenSayac[nedenId] || 0) + 1;
      bolgeNedenSayac[nedenId] = bolgeNedenSayac[nedenId] || {};
      bolgeNedenSayac[nedenId][bolgeId] = (bolgeNedenSayac[nedenId][bolgeId] || 0) + 1;

      var dept = kisi && kisi.departman ? kisi.departman : 'Belirtilmedi';
      deptSayac[dept] = (deptSayac[dept] || 0) + 1;

      var kidemAralik = ISG.kidemAraligi(kisi ? ISG.kidemYil(kisi.iseBaslama, kaza.tarih) : null);
      var kidemId = kidemAralik ? kidemAralik.id : 'bilinmiyor';
      kidemSayac[kidemId] = (kidemSayac[kidemId] || 0) + 1;

      var siddetAralik = ISG.kayipGunAraligi(ISG.kazaKayipGun(kaza));
      siddetSayac[siddetAralik.id] = (siddetSayac[siddetAralik.id] || 0) + 1;

      var sinifId = kaza.siddet || 'belirtilmedi';
      sinifSayac[sinifId] = (sinifSayac[sinifId] || 0) + 1;

      var vardiyaId = kaza.vardiya || 'belirtilmedi';
      vardiyaSayac[vardiyaId] = (vardiyaSayac[vardiyaId] || 0) + 1;

      var gunSirasi = haftaGunu(kaza.tarih);
      if (gunSirasi >= 0) { gunSayac[gunSirasi] = (gunSayac[gunSirasi] || 0) + 1; }

      if (kaza.hastaneSevk === 'evet') { sevkKaza += 1; }

      if (kaza.personelId) { kisiSayac[kaza.personelId] = (kisiSayac[kaza.personelId] || 0) + 1; }

      var ayAnahtar = String(kaza.tarih || '').slice(0, 7);
      if (ayAnahtarlari.indexOf(ayAnahtar) >= 0) {
        aySayac[ayAnahtar] = (aySayac[ayAnahtar] || 0) + 1;
        ayKayipSayac[ayAnahtar] = (ayKayipSayac[ayAnahtar] || 0) + ISG.kazaKayipGun(kaza);
        sonYilKaza += 1;
        sonYilKayip += ISG.kazaKayipGun(kaza);
      }
    });

    /* KSO / KAO / KSH — 1.000.000 çalışma saati ve çalışan başına oranlar. */
    var kso = toplamSaat ? (sonYilKaza / toplamSaat) * 1000000 : 0;
    var kao = toplamSaat ? (sonYilKayip / toplamSaat) * 1000000 : 0;
    var ksh = ortalamaKisi ? sonYilKaza / ortalamaKisi : 0;

    var nedenSatir = ISG.KAZA_NEDENLERI.map(function (neden) {
      return { ad: neden.ad, deger: nedenSayac[neden.id] || 0, sinif: neden.sinif };
    });
    if (nedenSayac.belirtilmedi) {
      nedenSatir.push({ ad: 'Belirtilmedi', deger: nedenSayac.belirtilmedi, sinif: 'notr' });
    }

    var AY_KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    var aylikSatir = ayAnahtarlari.map(function (anahtar) {
      return {
        ad: AY_KISA[Number(anahtar.slice(5, 7)) - 1] + ' ' + anahtar.slice(2, 4),
        deger: aySayac[anahtar] || 0,
        sinif: 'tehlike'
      };
    });


    var matrisKolonlar = ISG.YARALANMA_BOLGELERI.filter(function (bolge) {
      return bolgeSayac[bolge.id];
    }).map(function (bolge) { return { id: bolge.id, ad: bolge.ad }; });
    if (bolgeSayac.belirtilmedi) { matrisKolonlar.push({ id: 'belirtilmedi', ad: 'Belirtilmedi' }); }

    var matrisSatir = [];
    ISG.KAZA_NEDENLERI.forEach(function (neden) {
      var sayac = bolgeNedenSayac[neden.id];
      if (!sayac) { return; }
      var degerler = matrisKolonlar.map(function (kolon) { return sayac[kolon.id] || 0; });
      matrisSatir.push({
        ad: neden.ad,
        degerler: degerler,
        toplam: degerler.reduce(function (toplam, deger) { return toplam + deger; }, 0)
      });
    });
    if (bolgeNedenSayac.belirtilmedi) {
      var belirsizDegerler = matrisKolonlar.map(function (kolon) {
        return bolgeNedenSayac.belirtilmedi[kolon.id] || 0;
      });
      matrisSatir.push({
        ad: 'Belirtilmedi',
        degerler: belirsizDegerler,
        toplam: belirsizDegerler.reduce(function (toplam, deger) { return toplam + deger; }, 0)
      });
    }

    var deptSatir = Object.keys(deptSayac).map(function (ad) {
      return { ad: ad, deger: deptSayac[ad], sinif: 'bilgi' };
    }).sort(function (a, b) { return b.deger - a.deger; });

    var kidemSatir = ISG.KIDEM_ARALIKLARI.map(function (aralik) {
      return { ad: aralik.ad, deger: kidemSayac[aralik.id] || 0, sinif: aralik.sinif };
    });
    if (kidemSayac.bilinmiyor) {
      kidemSatir.push({ ad: 'Kıdem bilgisi yok', deger: kidemSayac.bilinmiyor, sinif: 'notr' });
    }

    var siddetSatir = ISG.KAYIP_GUN_ARALIKLARI.map(function (aralik) {
      return { ad: aralik.ad, deger: siddetSayac[aralik.id] || 0, sinif: aralik.sinif };
    });

    var sinifSatir = ISG.KAZA_SIDDETLERI.map(function (sinif) {
      return { ad: sinif.ad, deger: sinifSayac[sinif.id] || 0, sinif: sinif.sinif };
    });
    if (sinifSayac.belirtilmedi) {
      sinifSatir.push({ ad: 'Belirtilmedi', deger: sinifSayac.belirtilmedi, sinif: 'notr' });
    }

    var vardiyaSatir = ISG.VARDIYALAR.map(function (vardiya) {
      return { ad: vardiya.ad, deger: vardiyaSayac[vardiya.id] || 0, sinif: 'bilgi' };
    });
    if (vardiyaSayac.belirtilmedi) {
      vardiyaSatir.push({ ad: 'Belirtilmedi', deger: vardiyaSayac.belirtilmedi, sinif: 'notr' });
    }

    var GUN_ADLARI = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    var gunSatir = GUN_ADLARI.map(function (ad, sira) {
      return { ad: ad, deger: gunSayac[sira] || 0, sinif: sira >= 5 ? 'uyari' : 'tehlike' };
    });

    var oranSatir = ayAnahtarlari.map(function (anahtar, sira) {
      var saat = aySaatSatir[sira].saat;
      var kazaSayi = aySayac[anahtar] || 0;
      var aylikKayip = ayKayipSayac[anahtar] || 0;
      return {
        degerler: [
          AY_KISA[Number(anahtar.slice(5, 7)) - 1] + ' ' + anahtar.slice(2, 4),
          B.sayi(kazaSayi),
          B.sayi(aylikKayip),
          B.sayi(saat),
          saat ? B.ondalik((kazaSayi / saat) * 1000000, 1) : '—',
          saat ? B.ondalik((aylikKayip / saat) * 1000000, 1) : '—'
        ]
      };
    });

    var kisiSatir = Object.keys(kisiSayac).map(function (id) {
      var kisi = personelHarita[id] || {};
      var alt = [kisi.sicil ? 'Sicil ' + kisi.sicil : '', kisi.departman || '', kisi.meslek || '']
        .filter(function (parca) { return !!parca; }).join(' · ');
      return {
        ad: kisi.adSoyad || 'Silinmiş personel',
        alt: alt,
        sayi: kisiSayac[id],
        deger: B.sayi(kisiSayac[id]) + ' kaza'
      };
    }).sort(function (a, b) { return b.sayi - a.sayi; }).slice(0, 6);

    var kazaliOran = aktifPersonel.length ? Math.round((kazaPersonel.length / aktifPersonel.length) * 100) : 0;
    var ortalamaKayip = kazalar.length ? Math.round((kayipGun / kazalar.length) * 10) / 10 : 0;

    var kazaKpi =
      '<div class="kpi-izgara ist-kpi">' +
        istKutu('İş kazası', B.sayi(kazalar.length), 'Son 12 ayda ' + B.sayi(sonYilKaza) + ' bildirim', 'i-risk',
          kazalar.length ? 'tehlike' : 'soluk') +
        istKutu('Kazalı personel', B.sayi(kazaPersonel.length), 'Kazalı / aktif personel: %' + kazaliOran, 'i-users',
          kazaPersonel.length ? 'uyari' : 'soluk') +
        istKutu('İş günü kaybı', B.sayi(kayipGun), B.sayi(kayipliKaza) + ' kazada kayıp bildirildi', 'i-plan',
          kayipGun ? 'uyari' : 'soluk') +
        istKutu('Kaza başına kayıp', B.sayi(ortalamaKayip) + ' gün',
          sonKaza ? 'Son kaza ' + B.tarih(sonKaza.tarih) : 'Kayıt yok', 'i-chart', 'bilgi') +
        istKutu('KSO (sıklık oranı)', B.ondalik(kso, 1), '1.000.000 çalışma saatinde kaza', 'i-chart',
          kso ? 'uyari' : 'soluk') +
        istKutu('KAO (ağırlık oranı)', B.ondalik(kao, 1), '1.000.000 saatte kayıp gün', 'i-chart',
          kao ? 'tehlike' : 'soluk') +
        istKutu('KSH (kişi başına)', B.ondalik(ksh, 2), B.sayi(ortalamaKisi) + ' çalışan ortalaması', 'i-users',
          ksh ? 'uyari' : 'soluk') +
        istKutu('Hastane sevk', B.sayi(sevkKaza), kazalar.length ? '%' + Math.round((sevkKaza / kazalar.length) * 100) + ' kazada sevk' : 'Kayıt yok',
          'i-plan', sevkKaza ? 'bilgi' : 'soluk') +
      '</div>';



    var kazaKartlari =
      '<div class="ist-kartlar">' +
        istKart('Aylık kaza sıklığı', 'Son 12 ayda bildirilen iş kazası sayısı; sütun yüksekliği aylık sıklığı gösterir.',
          istSutunlar(aylikSatir, 'Son 12 ayda iş kazası bildirilmedi.')) +
      '</div>' +
      '<div class="kart-izgara-3 ist-kartlar">' +
        istKart('Kök neden dağılımı', 'Kaza kayıtlarının neden sınıfına göre dağılımı.', istCubuklar(nedenSatir, 'Kök neden girilmiş kaza yok.')) +
        istKart('Yaralanma bölgesi', 'Kaza kayıtlarında bildirilen vücut bölgesi dağılımı.', istCubuklar(bolgeSatir, 'Yaralanma bilgisi girilmiş kaza yok.')) +
        istKart('Yaralanma türü', 'Ezilme, kesik, burkulma gibi yaralanma şekillerinin dağılımı.', istCubuklar(yaralanmaSatir, 'Yaralanma türü girilmiş kaza yok.')) +
      '</div>' +
      '<div class="kart-izgara-3 ist-kartlar">' +
        istKart('İşyeri bazında iş kazası', 'Kapsamdaki işyerlerinde bildirilen iş kazası sayısı.', istCubuklar(kazaIsyeriSatir, 'İş kazası kaydı yok.')) +
        istKart('Departman bazında kaza', 'Kazaların kazazedenin departmanına göre dağılımı.', istCubuklar(deptSatir, 'Departman bilgisi olan kaza yok.')) +
        istKart('Kıdem dağılımı', 'Kaza anındaki kıdeme göre dağılım; yeni çalışan yoğunluğunu gösterir.', istCubuklar(kidemSatir, 'Kıdem bilgisi hesaplanamadı.')) +
      '</div>' +
      '<section class="kart">' +
        '<div class="kart-baslik"><div><h2>Neden × vücut bölgesi</h2>' +
          '<p>Hangi kök nedenin hangi vücut bölgesinde hasara yol açtığını çapraz gösterir.</p></div>' +
          '<div class="kart-arac"><span class="muted kucuk">' + B.sayi(kazalar.length) + ' kaza · ' +
            B.sayi(kazaPersonel.length) + ' kazalı personel · ' + B.sayi(kayipGun) + ' iş günü kaybı</span></div></div>' +
        '<div class="kart-ic">' + istMatris(matrisKolonlar, matrisSatir, 'Neden ve bölge bilgisi girilmiş kaza yok.') + '</div>' +
      '</section>' +
      '<div class="kart-izgara-3 ist-kartlar">' +
        istKart('İş günü kaybı (şiddet)', 'Kazaların iş günü kaybı aralıklarına göre dağılımı.', istCubuklar(siddetSatir, 'Kaza kaydı yok.')) +
        istKart('En çok kazaya uğrayan personel', 'Kapsamda en fazla kaza kaydı bulunan çalışanlar.', istListe(kisiSatir, 'Personel eşleşen kaza yok.')) +
      '</div>' +
      '<div class="kart-izgara-3 ist-kartlar">' +
        istKart('Yaralanma şiddeti (SGK)', 'Hafif/orta, ağır, uzuv kaybı ve ölüm sınıflarına göre dağılım; ölümlü kaza 6.000 iş günü kaybı sayılır.',
          istCubuklar(sinifSatir, 'Şiddet sınıfı girilmiş kaza yok.')) +
        istKart('Vardiya dağılımı', 'Kazaların bildirildiği vardiyaya göre dağılımı.', istCubuklar(vardiyaSatir, 'Vardiya bilgisi girilmiş kaza yok.')) +
        istKart('Haftanın günü', 'Kaza tarihinin haftanın hangi gününe denk geldiğini gösterir; hafta sonu vurgulanır.', istCubuklar(gunSatir, 'Tarih bilgisi olan kaza yok.')) +
      '</div>' +
      '<section class="kart">' +
        '<div class="kart-baslik"><div><h2>Aylık kaza oranları (SGK)</h2>' +
          '<p>KSO = kaza sayısı / 1.000.000 çalışma saati, KAO = kayıp iş günü / 1.000.000 çalışma saati. ' +
          'Çalışma saati, ay içinde aktif personel × ' + B.sayi(ISG.AYLIK_KISI_SAATI) + ' saat/ay varsayımıyla hesaplanır.</p></div>' +
          '<div class="kart-arac"><span class="muted kucuk">' + B.sayi(toplamSaat) + ' saat · ' +
            B.sayi(ortalamaKisi) + ' çalışan (ort.) · ' + B.sayi(sonYilKaza) + ' kaza</span></div></div>' +
        '<div class="kart-ic">' + istTablo(
          [{ ad: 'Ay' }, { ad: 'Kaza' }, { ad: 'Kayıp gün' }, { ad: 'İş saati' }, { ad: 'KSO' }, { ad: 'KAO' }],
          oranSatir, 'Son 12 ayda kaza kaydı yok.') + '</div>' +
      '</section>';


    var dosyaTamlik = dosyalar.length ? Math.round(((dosyalar.length - eksikBelge.length) / dosyalar.length) * 100) : 0;
    var kartlar = '';

    kartlar = kazaKpi + kazaKartlari +
      '<div class="kart-izgara-3 ist-kartlar">' +
        istKart('İşyeri bazında personel', 'Kapsamdaki işyerlerinin çalışan dağılımı.', istCubuklar(personelSatir, 'Personel kaydı yok.')) +
        istKart('Eğitim geçerliliği', 'Aktif personelin temel İSG eğitimi durumu.', istCubuklar(egitimSatir, 'Aktif personel yok.')) +
      '</div>' +
      '<div class="kart-izgara-3 ist-kartlar">' +
        istKart('Saha tespitleri', 'DÖF kayıtlarının durum dağılımı.', istCubuklar(dofSatir, 'Saha tespiti yok.')) +
        istKart('Risk seviyeleri', '5 × 5 skorlarına göre risk kayıtları.', istCubuklar(riskSatir, 'Risk kaydı yok.')) +
      '</div>' +
      '<section class="kart">' +
        '<div class="kart-baslik"><div><h2>Belge kontrol durumu</h2>' +
          '<p>' + B.sayi(dosyalar.length) + ' kontrol maddesinin durum dağılımı.</p></div>' +
          '<div class="kart-arac"><span class="muted kucuk">Tamlık %' + dosyaTamlik + '</span></div></div>' +
        '<div class="kart-ic">' + istCubuklar(belgeSatir, 'Kontrol maddesi yok.') + '</div>' +
      '</section>';

    return P.sayfaBaslik('İSTATİSTİK', 'İstatistikler',
      'İş kazası ve meslek hastalığı oranları (KSO/KAO/KSH), kök neden, şiddet, vardiya ve tanı dağılımları; personel, belge, saha ve risk özetleri.',
      '<button type="button" class="dugme ince" data-islem="kaza-yeni" data-tur="meslekHastaligi" data-isyeri="' + kacis(kapsam || '') + '">' + B.ikon('i-plus') + 'Meslek hastalığı bildir</button>' +
      '<button type="button" class="dugme birincil" data-islem="kaza-yeni" data-tur="isKazasi" data-isyeri="' + kacis(kapsam || '') + '">' + B.ikon('i-plus') + 'Kaza bildir</button>') +
      P.kapsamSecici(hesap) +
      '<div class="kpi-izgara">' +
        istKutu('Aktif personel', B.sayi(aktifPersonel.length), isyerleri.length + ' işyeri kapsamında', 'i-users', 'bilgi') +
        istKutu('Açık saha tespiti', B.sayi(acikTespit.length), gecikenTespit.length + ' geciken', 'i-clipboard', acikTespit.length ? 'uyari' : 'soluk') +
        istKutu('Eksik / yok belge', B.sayi(eksikBelge.length), 'Belge tamlığı %' + dosyaTamlik, 'i-folder', eksikBelge.length ? 'tehlike' : 'soluk') +
        istKutu('Açık risk kaydı', B.sayi(acikRisk.length), tamamlananPlan.length + ' tamamlanan plan', 'i-risk', acikRisk.length ? 'uyari' : 'soluk') +
      '</div>' +
      '<section class="kart"><div class="kart-baslik"><div><h2>İş kazası / meslek hastalığı veri girişi</h2>' +
        '<p>Yeni bildirimi buradan ekleyin; kayıt aşağıdaki listede ve Saha ve DÖF ekranında görünür.</p></div>' +
        '<div class="kart-arac"><span class="muted kucuk">' + B.sayi(kazalar.length) + ' iş kazası · ' +
          B.sayi(kayitlar.length - kazalar.length) + ' meslek hastalığı</span></div></div>' +
        '<div class="kart-ic"><div class="satir-arac">' +
          '<button type="button" class="dugme birincil" data-islem="kaza-yeni" data-tur="isKazasi" data-isyeri="' + kacis(kapsam || '') + '">' + B.ikon('i-plus') + 'İş kazası bildir</button>' +
          '<button type="button" class="dugme" data-islem="kaza-yeni" data-tur="meslekHastaligi" data-isyeri="' + kacis(kapsam || '') + '">' + B.ikon('i-plus') + 'Meslek hastalığı bildir</button>' +
        '</div></div>' +
      '</section>' +
      P.kazaTablosu(kayitlar.slice().sort(function (a, b) {
        return String(b.tarih).localeCompare(String(a.tarih));
      }), hesap) +
      kartlar;
  };

  /* ---------- Değişiklik onayları ---------- */

  var MODUL_ADLARI = {
    panel: 'Genel bakış', personel: 'Personel', egitim: 'Eğitim', risk: 'Risk değerlendirmesi',
    saha: 'Saha ve DÖF', dosyalar: 'Dosya kontrolleri', belge: 'Belgeler', plan: 'Çalışma planı',
    tespit: 'Saha tespiti', acil: 'Acil durum planı', isyerleri: 'İşyerleri',
    kullanici: 'Kullanıcılar', ayarlar: 'Ayarlar'
  };

  var ISLEM_ADLARI = { ekle: 'Yeni kayıt', guncelle: 'Güncelleme', sil: 'Silme' };

  var ALAN_ADLARI = {
    adSoyad: 'Ad soyad', ad: 'Ad', sicil: 'Sicil no', meslek: 'Meslek', departman: 'Departman',
    iseBaslama: 'İşe başlama', durum: 'Durum', aciklama: 'Açıklama', madde: 'Kontrol maddesi',
    bolum: 'Bölüm', sorumlu: 'Sorumlu', yenileme: 'Yenileme tarihi', kontrolTarihi: 'Kontrol tarihi',
    isyeriId: 'İşyeri', baslik: 'Başlık', tanim: 'Tanım', tarih: 'Tarih', termin: 'Termin',
    kategori: 'Kategori', olasilik: 'Olasılık', siddet: 'Şiddet', onlem: 'Önlem',
    faaliyet: 'Faaliyet', yil: 'Yıl', ay: 'Ay', aylar: 'Aylar', sorumluKisi: 'Sorumlu kişi',
    eposta: 'E-posta', rol: 'Rol', gorev: 'Görev', telefon: 'Telefon', tc: 'TC kimlik no'
  };

  function kisaDeger(deger) {
    if (deger === null || typeof deger === 'undefined') { return '—'; }
    var metin = typeof deger === 'object' ? JSON.stringify(deger) : String(deger);
    if (!metin) { return '—'; }
    return metin.length > 80 ? metin.slice(0, 77) + '…' : metin;
  }

  function degisimTablosu(talep) {
    var eski = talep.eskiKayit || {};
    var yeni = talep.yeniKayit || {};
    var satirlar = [];
    var ekle = function (alan, eskiDeger, yeniDeger) {
      satirlar.push('<tr><td><b>' + kacis(ALAN_ADLARI[alan] || alan) + '</b></td>' +
        '<td>' + kacis(kisaDeger(eskiDeger)) + '</td>' +
        '<td>' + kacis(kisaDeger(yeniDeger)) + '</td></tr>');
    };

    if (talep.islemTuru === 'sil') {
      Object.keys(eski).slice(0, 8).forEach(function (alan) {
        if (alan === 'id') { return; }
        ekle(alan, eski[alan], '');
      });
    } else if (talep.islemTuru === 'ekle' || !talep.kayitId) {
      Object.keys(yeni).slice(0, 8).forEach(function (alan) {
        if (alan === 'id') { return; }
        ekle(alan, '', yeni[alan]);
      });
    } else if (!talep.yeniKayit) {
      /* Durum değiştirme gibi tek alanlı eylemlerde gönderilen kayıt nesnesi
         yoktur; eski kaydın alanlarını yanına "—" yazmak değişmemiş alanı
         değişmiş gibi gösterir. Ne değişeceği üstteki özet satırındadır. */
    } else {
      var alanlar = Object.keys(yeni).concat(Object.keys(eski)).filter(function (alan, sira, liste) {
        return alan !== 'id' && liste.indexOf(alan) === sira;
      });
      alanlar.forEach(function (alan) {
        if (satirlar.length >= 8) { return; }
        var a = kisaDeger(eski[alan]);
        var b = kisaDeger(yeni[alan]);
        if (a === b) { return; }
        ekle(alan, eski[alan], yeni[alan]);
      });
    }

    if (!satirlar.length) { return ''; }
    return '<details class="onay-degisim"><summary>Eski / yeni değerler (' + satirlar.length + ')</summary>' +
      '<table class="tablo kucuk"><thead><tr><th>Alan</th><th>Eski</th><th>Yeni</th></tr></thead>' +
      '<tbody>' + satirlar.join('') + '</tbody></table></details>';
  }

  SAYFALAR.onaylar = function () {
    var hesap = veri();
    var o = ISG.yetki ? ISG.yetki.oturum() : null;
    var rol = o && ISG.yetki ? ISG.yetki.rolTanimi(o.rol) : null;
    var onaylayabilir = !!(rol && rol.onaylar);
    var saglikTalepleri = onaylayabilir && ISG.saglikTakip ? ISG.saglikTakip.erisimTalepleri().filter(function (t) { return t.durum === 'bekliyor'; }) : [];
    var saglikSatirlari = saglikTalepleri.map(function (t) {
      return '<div class="onay-satir"><div class="onay-satir-bilgi"><strong>Sağlık verisi erişimi · ' + kacis(t.kullaniciAd || '') + '</strong><span>' + kacis(t.eposta || '') + ' · ' + kacis(ISG.yetki.rolTanimi(t.rol).ad) + '</span><span class="kucuk">Erişim onayı talep edildi. Sağlık satırları bu isteğe eklenmez.</span></div><div class="sag"><button type="button" class="dugme kucuk ikincil" data-islem="saglik-erisim-ret" data-id="' + kacis(t.id) + '">Reddet</button><button type="button" class="dugme kucuk birincil" data-islem="saglik-erisim-onay" data-id="' + kacis(t.id) + '">Erişim ver</button></div></div>';
    }).join('');

    var liste = (hesap.talepler || []).slice().sort(function (a, b) {
      if (a.durum === 'bekliyor' && b.durum !== 'bekliyor') { return -1; }
      if (b.durum === 'bekliyor' && a.durum !== 'bekliyor') { return 1; }
      return String(b.olusturma || '').localeCompare(String(a.olusturma || ''));
    });

    var bekleyen = liste.filter(function (talep) { return talep.durum === 'bekliyor'; }).length;

    var satirlar = liste.map(function (talep) {
      var durum = TALEP_DURUM[talep.durum] || { ad: talep.durum || '—', sinif: 'notr' };
      var karar = talep.kararNotu ? ' · Gerekçe: ' + talep.kararNotu : '';
      var kararBilgi = talep.kararVeren ?
        '<span class="kucuk">' + kacis(talep.kararVeren) + ' · ' + B.tarih(String(talep.kararTarihi || '').slice(0, 10)) + kacis(karar) + '</span>' :
        '<span class="kucuk">Gönderen: ' + kacis(talep.kullaniciAd || '—') + (talep.rol ? ' · ' + kacis(talep.rol) : '') +
          ' · ' + B.tarih(talepGun(talep)) + '</span>';

      var modul = MODUL_ADLARI[talep.modul || talep.sayfa] || (talep.modul || talep.sayfa || 'Genel bakış');
      var islem = ISLEM_ADLARI[talep.islemTuru] || 'Değişiklik';
      var kayitBilgi = '<span class="kucuk">Modül: ' + kacis(modul) + ' · ' + kacis(islem) +
        (talep.kayitId ? ' · Kayıt: ' + kacis(talep.kayitId) : '') + '</span>';

      var eylemler = talep.durum === 'bekliyor' && onaylayabilir ?
        '<input type="text" class="girdi kucuk-girdi" data-talep-not data-id="' + kacis(talep.id) + '" ' +
          'maxlength="160" placeholder="Ret gerekçesi (isteğe bağlı)" aria-label="Ret gerekçesi">' +
        '<button type="button" class="dugme kucuk ikincil" data-islem="talep-reddet" data-id="' + kacis(talep.id) + '">Reddet</button>' +
        '<button type="button" class="dugme kucuk birincil" data-islem="talep-onayla" data-id="' + kacis(talep.id) + '">Onayla</button>' :
        '';

      return '<div class="onay-satir">' +
        '<div class="onay-satir-bilgi">' +
          '<strong>' + kacis(talep.etiket || 'Değişiklik') + ' · ' + kacis(talep.isyeriAd || isyeriAdi(talep.isyeriId) || 'Tüm işyerleri') + '</strong>' +
          '<span>' + kacis(talep.ozet || '') + '</span>' +
          kayitBilgi +
          kararBilgi +
          (talep.talepNotu ? '<span class="kucuk">Talep açıklaması: ' + kacis(talep.talepNotu) + '</span>' : '') +
          degisimTablosu(talep) +
        '</div>' +
        '<div class="sag">' +
          B.rozet(durum.ad, durum.sinif) +
          eylemler +
        '</div>' +
      '</div>';
    }).join('') + saglikSatirlari;

    var aciklama = onaylayabilir ?
      'Yetkili kullanıcıların gönderdiği değişiklik taleplerini inceleyin. Onaylanan talepler kayda hemen uygulanır.' :
      'Gönderdiğiniz değişiklik taleplerinin durumu. Onay yönetici tarafından verilir.';

    return P.sayfaBaslik('DEĞİŞİKLİK ONAYLARI', 'Onay kuyruğu', aciklama,
      '<button type="button" class="dugme ince" data-islem="yenile">' + B.ikon('i-refresh') + 'Yenile</button>') +
      '<section class="kart">' +
        '<div class="kart-baslik"><div><h2>Değişiklik talepleri</h2><p>' + kacis(aciklama) + '</p></div>' +
          '<div class="kart-arac"><span class="muted kucuk">' + B.sayi(bekleyen) + ' bekleyen · ' + B.sayi(liste.length) + ' kayıt</span></div></div>' +
        (satirlar ? satirlar :
          '<div class="kart-ic">' + B.bosDurum('Bekleyen talep yok', onaylayabilir ?
            'Yetkili kullanıcılar değişiklik gönderdiğinde burada listelenir.' :
            'Bir kaydı değiştirdiğinizde talep otomatik olarak yönetici onayına gönderilir.', 'i-check') + '</div>') +
      '</section>';
  };
})(window);




