/* İSG Takip Merkezi — görünümler: yönetim raporu, risk, acil durum, ekip, mevzuat */
(function (global) {
  'use strict';

  var ISG = global.ISG = global.ISG || {};
  var B = ISG.bicim;
  var P = ISG.parcalar;
  var SAYFALAR = ISG.sayfalar = ISG.sayfalar || {};
  var UI = ISG.ui = ISG.ui || {};

  function veri() { return ISG.depo.al(); }
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

  function riskKarti(isyeri, hesap) {
    var kayit = ISG.ilgiliKayit(hesap, 'riskEkipleri', isyeri.id);
    var ozet = ISG.riskEkipOzeti(kayit);
    var sinif = ISG.RISK_SINIFLARI[isyeri.tehlikeSinifi] || { ad: '', riskYenilemeYil: 4 };
    var uyeler = (kayit && kayit.uyeler) || {};
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
        '<div class="rol-list">' + ISG.RISK_ROLLERI.map(function (rol) {
          var ad = uyeler[rol.id];
          return '<div class="rol-satir"><span>' + kacis(rol.ad) + '</span>' +
            (ad ? '<b>' + kacis(ad) + '</b>' : '<b class="yok">Kişi kaydedilmedi</b>') + '</div>';
        }).join('') + '</div>' +
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
    var sinif = ISG.RISK_SINIFLARI[isyeri.tehlikeSinifi] || { ad: '', acilYenilemeYil: 4 };
    var ekip = ozet.ekip || [];
    var ekipRolleri = ['Acil durum koordinatörü', 'Yangın söndürme ekibi', 'İlk yardım ekibi', 'Tahliye / arama kurtarma'];

    return '<article class="risk-kart">' +
      '<div class="risk-kart-ust">' +
        '<div><h3>' + kacis(isyeri.ad) + '</h3><p class="alt">' + kacis(sinif.ad) + '</p></div>' +
        B.rozet(sinif.ad, isyeri.tehlikeSinifi === 'az' ? 'bilgi' : 'uyari') +
      '</div>' +
      '<div class="mini-kutu"><span>Çalışan sayısı</span><b>' + B.sayi(isyeri.calisanSayisi) + '</b></div>' +
      '<div>' +
        '<div class="satir-arac" style="justify-content:space-between;margin-bottom:7px">' +
          '<p class="bolum-baslik">Acil durum planı</p>' +
          (!ozet.son ? B.rozet('Plan tarihi girilmedi', 'tehlike') :
            (ozet.kalan !== null && ozet.kalan < 0 ? B.rozet('Yenileme gecikti', 'tehlike') : B.rozet('Plan geçerli', 'iyi'))) +
        '</div>' +
        '<div class="mini-izgara">' +
          '<div class="mini-kutu"><span>Hazırlanma / son yenileme</span><b>' + (ozet.son ? B.tarih(ozet.son) : 'Girilmedi') + '</b></div>' +
          '<div class="mini-kutu"><span>En geç yenileme</span><b>' + (ozet.enGec ? B.tarih(ozet.enGec) : 'Girilmedi') + '</b></div>' +
          '<div class="mini-kutu"><span>Olağan üst sınır</span><b>' + sinif.acilYenilemeYil + ' yıl</b></div>' +
        '</div>' +
        '<p class="bolum-aciklama" style="margin-top:8px">' + kacis(sinif.ad) + ' sınıfında plan en geç ' + sinif.acilYenilemeYil +
          ' yılda bir yenilenir. İşyeri, çalışan sayısı veya ekip değişikliği planı daha önce gözden geçirmeyi gerektirebilir.</p>' +
      '</div>' +
      '<button type="button" class="akis" data-islem="acil-plan" data-id="' + kacis(isyeri.id) + '">Yapılan plan yenilemesini kaydet →</button>' +
      '<div>' +
        '<div class="satir-arac" style="justify-content:space-between;margin-bottom:7px">' +
          '<p class="bolum-baslik">Acil durum planı hazırlama ekibi</p>' +
          (ekip.length ? B.rozet(ekip.length + ' kişi', 'iyi') : B.rozet('Kişi eklenmedi', 'tehlike')) +
        '</div>' +
        '<div class="rol-list">' + ekipRolleri.map(function (rol) {
          var uye = ekip.filter(function (k) { return k.rol === rol; })[0];
          return '<div class="rol-satir"><span>' + kacis(rol) + '</span>' +
            (uye ? '<b>' + kacis(uye.ad) + '</b>' : '<b class="yok">Kişi eklenmedi</b>') + '</div>';
        }).join('') + '</div>' +
        '<p class="bolum-aciklama" style="margin-top:8px">Plan hazırlanırken görev alan işveren/işveren vekili, iş güvenliği uzmanı ve diğer ilgili kişileri işyeri bazında kaydedin.</p>' +
      '</div>' +
    '</article>';
  }

  SAYFALAR.acil = function () {
    var hesap = veri();
    var isyerleri = (hesap.isyerleri || []).filter(function (isyeri) { return !UI.kapsam || isyeri.id === UI.kapsam; });
    var kartlar = isyerleri.map(function (isyeri) { return acilKarti(isyeri, hesap); }).join('');

    return P.sayfaBaslik('ACİL DURUM PLANI', 'Acil durum planı', 'İşyeri bazında kayıt ve durum takibi',
      '<button type="button" class="dugme" data-islem="acil-csv">' + B.ikon('i-download') + 'Excel indir</button>') +
      P.kapsamSecici(hesap) +

      '<section class="kart"><div class="kart-baslik" style="flex-direction:column;align-items:flex-start">' +
        '<h2>Acil durum planı ve destek ekipleri</h2>' +
        '<p>Görevli kişileri, eğitim kayıtlarını ve planın gözden geçirilmesini işyeri bazında izleyin.</p></div>' +
        '<div class="kart-ic"><div class="kart-izgara-3">' + (kartlar || '<p class="bolum-aciklama">İşyeri bulunmuyor.</p>') + '</div></div>' +
      '</section>';
  };

  /* ---------- Ekip ve davetler ---------- */

  SAYFALAR.ekip = function () {
    var hesap = veri();
    var davetler = hesap.davetler || [];
    var isyerleri = hesap.isyerleri || [];

    var davetSatirlari = davetler.map(function (davet) {
      var yetkiler = (davet.isyerleri || []).map(function (id) { return isyeriAdi(id); }).join(', ');
      return '<div class="davet-satir">' +
        '<strong>' + kacis(davet.eposta) + '</strong>' +
        B.rozet(davet.rol, 'bilgi') +
        '<span class="muted">' + kacis(yetkiler || 'Tüm işyerleri') + '</span>' +
        '<span class="sag">' +
          B.rozet(davet.durum === 'kabul' ? 'Kabul edildi' : 'Bekliyor', davet.durum === 'kabul' ? 'iyi' : 'uyari') +
          '<span class="muted kucuk">' + B.tarih(davet.tarih) + '</span>' +
          '<button type="button" class="dugme kucuk tehlike-dugme" data-islem="davet-sil" data-id="' + kacis(davet.id) + '">İptal</button>' +
        '</span>' +
      '</div>';
    }).join('');

    return P.sayfaBaslik('EKİP VE DAVETLER', 'Ekip ve davetler', 'İşyeri bazında kayıt ve durum takibi') +
      '<section class="kart ekip-kart">' +
        '<div class="kart-baslik" style="flex-direction:column;align-items:flex-start">' +
          '<h2>Ekip ve davetler</h2>' +
          '<p>Seçili kurum için erişim yönetimi · Kurum sahibi</p>' +
        '</div>' +
        '<div class="kart-ic">' +
          '<p class="bolum-aciklama">Davet altyapısı hazır. Otomatik e-posta gönderimi henüz bağlı değil. ' +
            'Site şu anda özel erişimde; davetli kişinin ayrıca site paylaşım ayarlarından giriş izni alması gerekir.</p>' +
          '<p class="bolum-aciklama" style="margin-top:8px">Davet 7 gün geçerlidir ve yalnızca belirtilen e-posta ile giriş yapan kişi tarafından kabul edilebilir. ' +
            'Kullanıcılar yalnızca seçtiğiniz işyerlerine erişir. Kurum yöneticisi kurumun tüm işyerlerini yönetir.</p>' +

          '<div style="margin-top:18px;max-width:420px">' +
            '<label class="form-satir"><span>E-posta</span>' +
              '<input type="email" id="davetEposta" placeholder="kisi@kurum.com" autocomplete="email">' +
            '</label>' +
            '<label class="form-satir"><span>Rol</span>' +
              '<select id="davetRol">' + ISG.DAVET_ROLLERI.map(function (rol) {
                return '<option value="' + kacis(rol) + '"' + (rol === 'Görüntüleyici' ? ' selected' : '') + '>' + kacis(rol) + '</option>';
              }).join('') + '</select>' +
            '</label>' +
            '<div class="form-satir"><span>Yetkili işyerleri</span>' +
              '<div class="secim-listesi">' +
                '<label><input type="checkbox" class="davet-isyeri" value="__tumu"> Tüm işyerleri (kurum geneli)</label>' +
                isyerleri.map(function (isyeri) {
                  return '<label><input type="checkbox" class="davet-isyeri" value="' + kacis(isyeri.id) + '"> ' + kacis(isyeri.ad) + '</label>';
                }).join('') +
              '</div>' +
            '</div>' +
            '<button type="button" class="dugme birincil" data-islem="davet-gonder">' + B.ikon('i-plus') + 'Davet oluştur</button>' +
          '</div>' +
        '</div>' +
        '<div class="kart-baslik" style="border-top:1px solid var(--line);border-bottom:0"><div><h2 style="font-size:15px">Gönderilen davetler</h2></div>' +
          '<div class="kart-arac"><span class="muted kucuk">' + B.sayi(davetler.length) + ' davet</span></div></div>' +
        (davetSatirlari ? '<div class="davet-list">' + davetSatirlari + '</div>' :
          '<div class="kart-ic">' + B.bosDurum('Henüz davet yok', 'E-posta ve işyeri seçerek ekibinize erişim verebilirsiniz.', 'i-team') + '</div>') +
      '</section>';
  };

  /* ---------- Mevzuat ve kapsam ---------- */

  SAYFALAR.mevzuat = function () {
    var hesap = veri();
    var kategoriler = [];
    (hesap.mevzuat || []).forEach(function (madde) {
      if (kategoriler.indexOf(madde.kategori) < 0) { kategoriler.push(madde.kategori); }
    });
    var arama = String(UI.mevzuatArama || '').toLocaleLowerCase('tr');
    var liste = (hesap.mevzuat || []).filter(function (madde) {
      if (UI.mevzuatKategori && madde.kategori !== UI.mevzuatKategori) { return false; }
      if (arama && [madde.baslik, madde.dayanak, madde.ozet].join(' ').toLocaleLowerCase('tr').indexOf(arama) < 0) { return false; }
      return true;
    });
    var isyeri = ISG.isyeriBul(hesap, UI.kapsam) || (hesap.isyerleri || []).filter(function (i) { return i.ana; })[0] || (hesap.isyerleri || [])[0];
    var gozdenGecir = (hesap.mevzuat || []).filter(function (m) { return m.durum === 'gozdenGecir'; }).length;

    var satirlar = liste.map(function (madde, sira) {
      return '<div class="mevzuat-satir">' +
        '<span class="mevzuat-no">' + (sira + 1) + '</span>' +
        '<div><strong>' + kacis(madde.baslik) + '</strong>' +
          '<small>' + kacis(madde.kategori) + ' · ' + kacis(madde.dayanak) + '</small>' +
          '<p>' + kacis(madde.ozet) + '</p></div>' +
        B.rozet(madde.durum === 'gozdenGecir' ? 'Gözden geçir' : 'İncelendi', madde.durum === 'gozdenGecir' ? 'uyari' : 'iyi') +
      '</div>';
    }).join('');

    return P.sayfaBaslik('MEVZUAT VE KAPSAM', 'Mevzuat ve kapsam', 'Yasal kuralların doğrulama durumu') +
      P.kapsamSecici(hesap) +

      '<section class="kart"><div class="kart-baslik" style="flex-direction:column;align-items:flex-start">' +
        '<h2>Mevzuattan işyeri takibine</h2>' +
        '<p class="muted">' + B.sayi((hesap.mevzuat || []).length) + ' başlıkta kapsam, dayanak ve belge takibi. Son kaynak kontrolü: ' + B.tarih(hesap.ayarlar.sonMevzuatKontrolu) + '.</p>' +
      '</div><div class="kart-ic">' +
        '<div class="prose">' +
          '<p>Bu katalog bir uygunluk belgesi değildir. Resmî kaynak özetleri ve rehberler incelendi; güncel birleştirilmiş metinlerin tamamına erişilemedi. ' +
            'Her başlığın teyit durumu aşağıdadır. Mevzuat değişiklikleri otomatik izlenmez. Sağlık verileri ve kişisel dosyalar için bu ortak kayıt ekranını kullanmayın. ' +
            'Yenileme tarihleri kaydettiğiniz belge tarihi ve tehlike sınıfından hesaplanır; olay ve faaliyet kaynaklı erken yenileme gerekebilir.</p>' +
        '</div>' +
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
})(window);




