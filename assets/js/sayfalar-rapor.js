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

  function ekipAraclari(kaynak, isyeriId, rol, ad) {
    return '<span class="rol-arac">' +
      '<button type="button" class="dugme ince" data-islem="ekip-uye" data-kaynak="' + kacis(kaynak) +
        '" data-isyeri="' + kacis(isyeriId) + '" data-rol="' + kacis(rol) + '">' +
        (ad ? 'Değiştir' : 'Ekle') + '</button>' +
      (ad ? '<button type="button" class="dugme ince" data-islem="ekip-uye-sil" data-kaynak="' + kacis(kaynak) +
        '" data-isyeri="' + kacis(isyeriId) + '" data-rol="' + kacis(rol) + '">Kaldır</button>' : '') +
    '</span>';
  }

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
          return '<div class="rol-satir"><span class="rol-ad">' + kacis(rol.ad) + '</span>' +
            (ad ? '<b>' + kacis(ad) + '</b>' : '<b class="yok">Kişi kaydedilmedi</b>') +
            ekipAraclari('risk', isyeri.id, rol.id, ad) + '</div>';
        }).join('') + '</div>' +
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
    var sinif = ISG.RISK_SINIFLARI[isyeri.tehlikeSinifi] || { ad: '', acilYenilemeYil: 4 };
    var ekip = ozet.ekip || [];
    var ekipRolleri = ISG.ACIL_ROLLERI;

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
      '<div class="ek-kutu">' +
        '<p class="bolum-baslik">Ekli belgeler</p>' +
        ekListesi('acil', isyeri.id) +
      '</div>' +
      '<button type="button" class="akis" data-islem="acil-plan" data-id="' + kacis(isyeri.id) + '">Yapılan plan yenilemesini kaydet →</button>' +
      '<div>' +
        '<div class="satir-arac" style="justify-content:space-between;margin-bottom:7px">' +
          '<p class="bolum-baslik">Acil durum planı hazırlama ekibi</p>' +
          (ekip.length ? B.rozet(ekip.length + ' kişi', 'iyi') : B.rozet('Kişi eklenmedi', 'tehlike')) +
        '</div>' +
        '<div class="rol-list">' + ekipRolleri.map(function (rol) {
          var uye = ekip.filter(function (k) { return k.rol === rol.ad; })[0];
          return '<div class="rol-satir"><span class="rol-ad">' + kacis(rol.ad) + '</span>' +
            (uye ? '<b>' + kacis(uye.ad) + '</b>' : '<b class="yok">Kişi eklenmedi</b>') +
            ekipAraclari('acil', isyeri.id, rol.ad, uye ? uye.ad : '') + '</div>';
        }).join('') + '</div>' +
        '<p style="margin-top:8px"><button type="button" class="dugme ince" data-islem="ekip-uye" ' +
          'data-kaynak="acil" data-isyeri="' + kacis(isyeri.id) + '">' + B.ikon('i-plus') +
          'Ekip üyesi ekle</button></p>' +
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

  SAYFALAR.onaylar = function () {
    var hesap = veri();
    var o = ISG.yetki ? ISG.yetki.oturum() : null;
    var rol = o && ISG.yetki ? ISG.yetki.rolTanimi(o.rol) : null;
    var onaylayabilir = !!(rol && rol.onaylar);

    var liste = (hesap.talepler || []).slice().sort(function (a, b) {
      if (a.durum === 'bekliyor' && b.durum !== 'bekliyor') { return -1; }
      if (b.durum === 'bekliyor' && a.durum !== 'bekliyor') { return 1; }
      return String(b.olusturma || '').localeCompare(String(a.olusturma || ''));
    });

    var bekleyen = liste.filter(function (talep) { return talep.durum === 'bekliyor'; }).length;

    var satirlar = liste.map(function (talep) {
      var durum = TALEP_DURUM[talep.durum] || { ad: talep.durum || '—', sinif: 'notr' };
      var karar = talep.kararNotu ? ' · Not: ' + talep.kararNotu : '';
      var kararBilgi = talep.kararVeren ?
        '<span class="kucuk">' + kacis(talep.kararVeren) + ' · ' + B.tarih(String(talep.kararTarihi || '').slice(0, 10)) + kacis(karar) + '</span>' :
        '<span class="kucuk">Gönderen: ' + kacis(talep.kullaniciAd || '—') + ' · ' + B.tarih(talepGun(talep)) + '</span>';

      var eylemler = talep.durum === 'bekliyor' && onaylayabilir ?
        '<button type="button" class="dugme kucuk ikincil" data-islem="talep-reddet" data-id="' + kacis(talep.id) + '">Reddet</button>' +
        '<button type="button" class="dugme kucuk birincil" data-islem="talep-onayla" data-id="' + kacis(talep.id) + '">Onayla</button>' :
        '';

      return '<div class="onay-satir">' +
        '<div class="onay-satir-bilgi">' +
          '<strong>' + kacis(talep.etiket || 'Değişiklik') + ' · ' + kacis(talep.isyeriAd || isyeriAdi(talep.isyeriId) || 'Tüm işyerleri') + '</strong>' +
          '<span>' + kacis(talep.ozet || '') + '</span>' +
          kararBilgi +
        '</div>' +
        '<div class="sag">' +
          B.rozet(durum.ad, durum.sinif) +
          eylemler +
        '</div>' +
      '</div>';
    }).join('');

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




