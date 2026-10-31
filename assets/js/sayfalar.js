/* İSG Takip Merkezi — görünümler: ortak parçalar, Genel bakış, İşyerleri, Personel */
(function (global) {
  'use strict';

  var ISG = global.ISG = global.ISG || {};
  var B = ISG.bicim;
  var SAYFALAR = ISG.sayfalar = ISG.sayfalar || {};
  var UI = ISG.ui = ISG.ui || {};

  function veri() { return ISG.yetki ? ISG.yetki.gorunum() : ISG.depo.al(); }
  function kacis(deger) { return B.kacis(deger); }
  function ui(deger, varsayilan) {
    return typeof deger === 'undefined' || deger === null || deger === '' ? (varsayilan || '') : deger;
  }
  function isyeriAdi(id) { return ISG.isyeriAdi(veri(), id); }

  function secili(deger, beklenen) {
    return String(deger) === String(beklenen) ? ' selected' : '';
  }

  function sayfaBaslik(ust, baslik, aciklama, arac) {
    var hesap = veri();
    return '<div class="sayfa-ust">' +
      '<div class="sayfa-baslik">' +
        '<span class="kurum">' + kacis(hesap.ayarlar.kurum) + '</span>' +
        '<h1>' + kacis(baslik) + '</h1>' +
        '<p>' + kacis(aciklama || '') + '</p>' +
      '</div>' +
      (arac ? '<div class="sayfa-ust-arac">' + arac + '</div>' : '') +
    '</div>';
  }

  function kapsamSecici(hesap) {
    var secenekler = '<option value="">Tüm yetkili işyerleri</option>' +
      (hesap.isyerleri || []).map(function (isyeri) {
        return '<option value="' + kacis(isyeri.id) + '"' + secili(UI.kapsam, isyeri.id) + '>' + kacis(isyeri.ad) + '</option>';
      }).join('');
    return '<div class="kapsam">' + B.ikon('i-building') +
      '<label for="kapsam" class="sr-only">İşyeri filtresi</label>' +
      '<select id="kapsam" data-ui="kapsam">' + secenekler + '</select>' +
    '</div>';
  }

  function kpi(secenek) {
    return '<button type="button" class="kpi ' + (secenek.sinif || '') + '" data-islem="' + (secenek.islem || 'panel-filtre') + '"' +
      (secenek.filtre ? ' data-filtre="' + kacis(secenek.filtre) + '"' : '') +
      (secenek.hedef ? ' data-hedef="' + kacis(secenek.hedef) + '"' : '') + '>' +
      '<span class="kpi-ust">' + B.ikon(secenek.ikon || 'i-alert') + kacis(secenek.baslik) + '</span>' +
      '<span class="kpi-deger">' + kacis(secenek.deger) + '</span>' +
      '<span class="kpi-alt"><span>' + kacis(secenek.alt || '') + '</span>' + B.ikon('i-arrow') + '</span>' +
    '</button>';
  }

  function bosKart(baslik, metin, ikon) {
    return '<div class="kart"><div class="kart-ic">' + B.bosDurum(baslik, metin, ikon) + '</div></div>';
  }

  function durumNoktasi(sinif) {
    return '<span class="gorev-nokta ' + (sinif || 'notr') + '" aria-hidden="true"></span>';
  }

  /* ---------- Genel bakış ---------- */

  function panelGorevleri(hesap) {
    var gorevler = ISG.gorevler(hesap, UI.kapsam);
    if (UI.panelSekme === 'tumu') {
      return gorevler.filter(function (gorev) { return ISG.gorevDurumu(gorev).id !== 'ileri'; });
    }
    if (UI.panelSekme && UI.panelSekme !== 'oncelikli') {
      return gorevler.filter(function (gorev) { return ISG.gorevDurumu(gorev).id === UI.panelSekme; });
    }
    return gorevler.filter(function (gorev) {
      var id = ISG.gorevDurumu(gorev).id;
      return id === 'geciken' || id === 'bugun' || id === 'yaklasan';
    });
  }

  function gorevSatiri(gorev) {
    var durum = ISG.gorevDurumu(gorev);
    return '<button type="button" class="gorev-satir" data-islem="gorev-ac" data-hedef="' + kacis(gorev.sayfa) + '" data-id="' + kacis(gorev.hedefId || '') + '">' +
      durumNoktasi(durum.sinif) +
      '<span class="gorev-metin">' +
        '<span class="gorev-baslik">' + kacis(gorev.baslik) + '</span>' +
        '<span class="gorev-alt">' + kacis(isyeriAdi(gorev.isyeriId)) + ' · ' + kacis(gorev.tur) + '</span>' +
      '</span>' +
      '<span class="gorev-sag">' +
        '<span class="gorev-tarih ' + durum.sinif + '">' + (gorev.tarih ? B.tarih(gorev.tarih) : 'Tarih yok') + '</span>' +
        '<span class="gorev-not ' + durum.sinif + '">' + kacis(['geciken', 'bugun', 'yaklasan', 'tarihsiz'].indexOf(durum.id) >= 0 ? durum.ad : '') + '</span>' +
      '</span>' +
      '<span class="gorev-ok">' + B.ikon('i-arrow') + '</span>' +
    '</button>';
  }

  function panelTakipKarti(hesap, gorunen) {
    var ozet = ISG.gorevOzet(ISG.gorevler(hesap, UI.kapsam));
    var isyeriSayisi = UI.kapsam ? 1 : (hesap.isyerleri || []).length;
    var satirlar = gorunen.slice(0, 50).map(gorevSatiri).join('');

    return '<section class="kart">' +
      '<div class="kart-baslik" style="flex-direction:column;align-items:flex-start">' +
        '<span class="ustyazi">GÜNLÜK TAKİP</span>' +
        '<h2 style="font-size:24px;letter-spacing:-.02em">Önce hangi iş?</h2>' +
        '<p>' + isyeriSayisi + ' işyeri · ' + B.tarihUzun(B.bugunIso()) + '</p>' +
      '</div>' +
      '<div class="kart-ic"><div class="kpi-izgara">' +
        kpi({ baslik: 'Geciken', ikon: 'i-alert', deger: B.sayi(ozet.geciken), alt: 'Kayıtları inceleyin', sinif: 'tehlike', filtre: 'geciken' }) +
        kpi({ baslik: 'Bugün', ikon: 'i-calendar', deger: B.sayi(ozet.bugun), alt: 'Bugün yapın', sinif: 'uyari', filtre: 'bugun' }) +
        kpi({ baslik: 'Yaklaşan', ikon: 'i-clock', deger: B.sayi(ozet.yaklasan), alt: '30 gün içinde', sinif: 'bilgi', filtre: 'yaklasan' }) +
        kpi({ baslik: 'Tarihsiz işler', ikon: 'i-flag', deger: B.sayi(ozet.tarihsiz), alt: 'Takip tarihi belirleyin', sinif: 'soluk', filtre: 'tarihsiz' }) +
      '</div></div>' +
      '<div class="sekme-satir">' +
        '<button type="button" class="sekme' + (ui(UI.panelSekme, 'oncelikli') === 'oncelikli' ? ' aktif' : '') + '" data-islem="panel-sekme" data-sekme="oncelikli">Öncelikli işler (' + B.sayi(ozet.oncelikli) + ')</button>' +
        '<button type="button" class="sekme' + (UI.panelSekme === 'tumu' ? ' aktif' : '') + '" data-islem="panel-sekme" data-sekme="tumu">Tüm açık işler</button>' +
        '<span class="sekme-sag">Çalışma, saha faaliyetleri ve belge yenilemeleri</span>' +
      '</div>' +
      (satirlar ? '<div class="gorev-liste">' + satirlar + '</div>' :
        '<div class="kart-ic">' + B.bosDurum('Bu filtrede iş yok', 'Başka bir filtre seçin veya yeni kayıt ekleyin.', 'i-check') + '</div>') +
      (gorunen.length > 50 ? '<div class="filtre-ozet">İlk 50 kayıt gösteriliyor · toplam ' + B.sayi(gorunen.length) + '</div>' : '') +
    '</section>';
  }

  SAYFALAR.panel = function () {
    var hesap = veri();
    var gorunen = panelGorevleri(hesap);
    return sayfaBaslik('GENEL BAKIŞ', 'Genel bakış', 'Öncelikli işler, belge yenilemeleri ve işyerlerinin güncel takibi.',
        '<button type="button" class="dugme ince" data-islem="yenile">' + B.ikon('i-refresh') + 'Yenile</button>') +
      kapsamSecici(hesap) +
      panelTakipKarti(hesap, gorunen) +
      '<section class="kart">' +
        '<div class="kart-baslik"><div><h2>İşyeri bazında durum</h2><p>Açık iş, gecikme ve belge süresi karşılaştırması.</p></div>' +
          '<div class="kart-arac"><button type="button" class="dugme ince" data-islem="rapor-csv">' + B.ikon('i-download') + 'Excel indir</button></div></div>' +
        '<div class="tablo-kap"><table class="tablo-kucuk"><thead><tr><th>İşyeri</th><th>Açık iş</th><th>Geciken</th><th>Belge süresi geçen</th><th>Açık tespit</th><th>Durum</th></tr></thead>' +
        '<tbody>' + panelIsyeriSatirlari(hesap) + '</tbody></table></div>' +
      '</section>';
  };

  function panelIsyeriSatirlari(hesap) {
    var satirlar = (hesap.isyerleri || []).filter(function (isyeri) {
      return !UI.kapsam || isyeri.id === UI.kapsam;
    }).map(function (isyeri) {
      var isyeriGorevleri = ISG.gorevler(hesap, isyeri.id).filter(function (g) { return ISG.gorevDurumu(g).id !== 'ileri'; });
      var ozet = ISG.gorevOzet(isyeriGorevleri);
      var dosyaOzet = ISG.dosyaOzeti(ISG.kapsamda(hesap, isyeri.id, 'dosyalar'));
      var tespitOzet = ISG.tespitOzeti(ISG.kapsamda(hesap, isyeri.id, 'tespitler'));
      var sinif = ISG.RISK_SINIFLARI[isyeri.tehlikeSinifi] || {};
      return '<tr>' +
        '<td><strong>' + kacis(isyeri.ad) + '</strong><span class="hucre-alt">' + kacis(sinif.ad || '') + ' · ' + B.sayi(isyeri.calisanSayisi) + ' çalışan</span></td>' +
        '<td class="sayi-sutun">' + ozet.toplam + '</td>' +
        '<td class="sayi-sutun"><b style="color:var(--red)">' + ozet.geciken + '</b></td>' +
        '<td class="sayi-sutun">' + dosyaOzet.gecen + '</td>' +
        '<td class="sayi-sutun">' + tespitOzet.acik + '</td>' +
        '<td>' + (ozet.geciken > 25 ? B.rozet('Öncelikli', 'tehlike') : (ozet.geciken > 0 ? B.rozet('İzlemede', 'uyari') : B.rozet('Uygun', 'iyi'))) + '</td>' +
      '</tr>';
    }).join('');
    if (!satirlar) {
      return '<tr><td colspan="6">' + B.bosDurum('İşyeri yok', 'Yeni bir işyeri ekleyerek başlayın.', 'i-building') + '</td></tr>';
    }
    return satirlar;
  }

  /* ---------- İşyerleri ---------- */

  function isyeriKarti(isyeri, hesap) {
    var sinif = ISG.RISK_SINIFLARI[isyeri.tehlikeSinifi] || { ad: isyeri.tehlikeSinifi };
    var dosyaSayisi = ISG.kapsamda(hesap, isyeri.id, 'dosyalar').length;
    var calisan = ISG.kapsamda(hesap, isyeri.id, 'personel').length;
    return '<article class="isyeri-kart">' +
      '<div class="isyeri-kart-ust">' +
        '<span class="isyeri-ikon">' + B.ikon('i-building') + '</span>' +
        B.rozet(sinif.ad, isyeri.tehlikeSinifi === 'az' ? 'bilgi' : (isyeri.tehlikeSinifi === 'cokTehlikeli' ? 'tehlike' : 'uyari')) +
      '</div>' +
      '<h3>' + kacis(isyeri.ad) + '</h3>' +
      '<button type="button" class="isyeri-baglanti" data-islem="isyeri-dosya" data-id="' + kacis(isyeri.id) + '">Dosya kontrollerini görüntüle ' + B.ikon('i-arrow') + '</button>' +
      '<span class="isyeri-etiket">İşyeri bilgileri ve işlemler</span>' +
      '<div class="isyeri-satir"><span>Kayıtlı personel</span><b>' + B.sayi(calisan) + ' / ' + B.sayi(isyeri.calisanSayisi) + ' çalışan</b></div>' +
      '<div class="isyeri-satir"><span>Kontrol maddesi</span><b>' + B.sayi(dosyaSayisi) + ' madde</b></div>' +
      '<div class="isyeri-eylem">' +
        '<button type="button" class="dugme ince" data-islem="isyeri-duzenle" data-id="' + kacis(isyeri.id) + '">İşyerini düzenle</button>' +
        '<button type="button" class="dugme ince birincil" data-islem="dosya-yeni" data-isyeri="' + kacis(isyeri.id) + '">' + B.ikon('i-plus') + 'Dosya kontrolü ekle</button>' +
        '<button type="button" class="dugme ince tehlike-dugme" data-islem="isyeri-sil" data-id="' + kacis(isyeri.id) + '">' + B.ikon('i-trash') + 'İşyerini sil</button>' +
      '</div>' +
    '</article>';
  }

  SAYFALAR.isyerleri = function () {
    var hesap = veri();
    var anaKurum = (hesap.isyerleri || []).filter(function (i) { return i.ana; })[0] || (hesap.isyerleri || [])[0];
    var kartlar = (hesap.isyerleri || []).filter(function (isyeri) {
      return !UI.kapsam || isyeri.id === UI.kapsam;
    }).map(function (isyeri) { return isyeriKarti(isyeri, hesap); }).join('');

    return sayfaBaslik('İŞYERLERİ', 'İşyerleri', 'İşyerleri ve faaliyet bilgileri',
      '<button type="button" class="dugme" data-islem="isyerleri-csv">' + B.ikon('i-download') + 'Excel indir</button>' +
      '<button type="button" class="dugme birincil" data-islem="isyeri-yeni">' + B.ikon('i-plus') + 'İşyeri ekle</button>') +

      '<details class="kurum-katlanabilir">' +
        '<summary>Çalışılan kurum: ' + (hesap.ayarlar.kurum ? kacis(hesap.ayarlar.kurum) : 'belirtilmedi') + ' · Kurum değiştir</summary>' +
        '<p class="bolum-aciklama">Kurum adı değiştirildiğinde tüm ekranlardaki başlık güncellenir. ' +
        'Site boş başlar; işyeri ve personel kayıtları buradan eklenir. "Tüm verileri sil" siteyi yeniden boş bırakır.</p>' +
        '<div class="satir-arac" style="margin-top:10px">' +
          '<button type="button" class="dugme ince" data-islem="kurum-duzenle">Kurum adını düzenle</button>' +
          '<button type="button" class="dugme ince tehlike-dugme" data-islem="kurum-sil">Tüm verileri sil</button>' +
        '</div>' +
      '</details>' +

      '<div class="kurum-serit">' +
        '<span>Kurum: <strong>' + (hesap.ayarlar.kurum ? kacis(hesap.ayarlar.kurum) : 'belirtilmedi — "Kurum adını düzenle" ile girin') + '</strong></span>' +
        '<span class="kurum-serit-sag">' +
          (anaKurum ? B.rozet('Ana kurum', 'bilgi') : '') +
          '<button type="button" class="dugme ince" data-islem="kurum-duzenle">Kurum adını düzenle</button>' +
          '<button type="button" class="dugme ince tehlike-dugme" data-islem="kurum-sil">' + B.ikon('i-trash') + 'Tüm verileri sil</button>' +
        '</span>' +
      '</div>' +

      kapsamSecici(hesap) +
      (kartlar ? '<div class="isyeri-izgara">' + kartlar + '</div>' :
        bosKart('İşyeri bulunamadı', 'Yeni işyeri ekleyerek takip başlatın.', 'i-building'));
  };

  /* ---------- Personel listesi ---------- */

  function kisiSatiri(kisi, hesap) {
    var durum = ISG.kisiDurumu(kisi, hesap.egitimler);
    var acik = UI.acikPersonel === kisi.id;
    var egitimler = hesap.egitimler.filter(function (e) { return e.personelId === kisi.id; });
    var egitimHtml = egitimler.length ? egitimler.map(function (e) {
      var d = ISG.egitimDurumu(e);
      return '<div class="rol-satir"><span>' + kacis(ISG.egitimTuru(e.tur).ad) + ' · ' + B.tarih(e.tarih) + ' · ' + kacis(String(e.sureSaat)) + ' saat</span>' +
        '<b>' + B.tarih(e.gecerlilik) + ' ' + B.durumRozeti(d.id, d.ad) + '</b></div>';
    }).join('') : '<p class="bolum-aciklama">Eğitim kaydı yok. Temel İSG eğitimi eklenmeli.</p>';

    var satir = '<tr>' +
      '<td class="islem-sutun"><div class="personel-eylem">' +
        '<button type="button" data-islem="personel-detay" data-id="' + kacis(kisi.id) + '">' + (acik ? 'Gizle' : 'Görüntüle') + '</button>' +
        '<button type="button" data-islem="personel-duzenle" data-id="' + kacis(kisi.id) + '">Düzenle</button>' +
        '<button type="button" class="tehlike" data-islem="personel-sil" data-id="' + kacis(kisi.id) + '">Sil</button>' +
      '</div></td>' +
      '<td class="sayi-sutun">' + kacis(kisi.sicil || '—') + '</td>' +
      '<td><strong>' + kacis(kisi.adSoyad) + '</strong>' + (acik ? '<span class="hucre-alt">' + B.durumRozeti(durum.id, durum.ad) + '</span>' : '') + '</td>' +
      '<td class="sayi-sutun">' + kacis(kisi.tc || '—') + '</td>' +
      '<td>' + kacis(kisi.meslek || '—') + '</td>' +
      '<td>' + kacis(kisi.departman || '—') + '</td>' +
      '<td>' + kacis(kisi.grupKodu || '—') + '</td>' +
      '<td>' + kacis(kisi.sube || '—') + '</td>' +
      '<td class="sayi-sutun">' + B.tarih(kisi.iseBaslama) + '</td>' +
      '<td class="sayi-sutun">' + B.tarih(kisi.kidemTarihi || '') + '</td>' +
      '<td class="sayi-sutun">' + kacis(kisi.telefon || '—') + '</td>' +
      '<td>' + kacis(kisi.cinsiyet || '—') + '</td>' +
    '</tr>';

    if (!acik) { return satir; }
    return satir + '<tr class="detay-satir"><td colspan="12">' +
      '<div class="izgara-2-esit" style="padding:6px 0">' +
        '<div><p class="bolum-baslik" style="margin-bottom:8px">Eğitim kayıtları</p><div class="rol-list">' + egitimHtml + '</div>' +
          '<div class="satir-arac" style="margin-top:10px">' +
            '<button type="button" class="dugme ince birincil" data-islem="egitim-yeni" data-personel="' + kacis(kisi.id) + '">' + B.ikon('i-plus') + 'Eğitim ekle</button>' +
            '<button type="button" class="dugme ince" data-islem="personel-duzenle" data-id="' + kacis(kisi.id) + '">Personeli düzenle</button>' +
          '</div>' +
        '</div>' +
        '<div><p class="bolum-baslik" style="margin-bottom:8px">Kayıt bilgileri</p>' +
          '<div class="rol-list">' +
            '<div class="rol-satir"><span>İşyeri</span><b>' + kacis(isyeriAdi(kisi.isyeriId)) + '</b></div>' +
            '<div class="rol-satir"><span>Temel eğitim geçerliliği</span><b>' + B.tarih(durum.gecerlilik || '') + '</b></div>' +
            '<div class="rol-satir"><span>Kalan süre</span><b>' + kacis(B.kalan(durum.kalan)) + '</b></div>' +
            '<div class="rol-satir"><span>Durum</span><b>' + kacis(kisi.durum === 'pasif' ? 'Pasif' : 'Aktif') + '</b></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</td></tr>';
  }

  function personelBloku(isyeri, hesap) {
    var arama = String(UI.personelArama || '').toLocaleLowerCase('tr');
    var liste = hesap.personel.filter(function (kisi) {
      if (kisi.isyeriId !== isyeri.id) { return false; }
      if (!arama) { return true; }
      return [kisi.adSoyad, kisi.meslek, kisi.departman, kisi.sicil, kisi.sube].join(' ').toLocaleLowerCase('tr').indexOf(arama) >= 0;
    });
    var aktifSayi = liste.filter(function (kisi) { return kisi.durum === 'aktif'; }).length;
    var sinif = ISG.RISK_SINIFLARI[isyeri.tehlikeSinifi] || { ad: '' };
    var fark = Number(isyeri.calisanSayisi) - aktifSayi;
    var kapali = UI.personelListeKapali === isyeri.id;

    return '<section class="kart personel-blok' + (kapali ? ' liste-kapali' : '') + '">' +
      '<div class="personel-ust">' +
        '<div>' +
          '<h3>' + kacis(isyeri.ad) + '</h3>' +
          '<p>' + kacis(sinif.ad) + ' · İşyeri çalışan sayısı: ' + B.sayi(isyeri.calisanSayisi) + '</p>' +
        '</div>' +
        '<div class="personel-sag">' +
          '<strong>' + B.sayi(aktifSayi) + ' aktif kayıt</strong>' +
          (fark !== 0 ? '<span style="color:var(--red);font-size:11.5px;font-weight:600">İşyeri çalışan sayısı farkı: ' + B.sayi(Math.abs(fark)) + ' kaydı karşılaştırın.</span>' : '<span class="hucre-alt">Çalışan sayısı ile kayıt sayısı uyumlu</span>') +
        '</div>' +
      '</div>' +
      '<div class="personel-arac">' +
        '<div class="personel-arac-sol">' +
          '<button type="button" class="dugme ince" data-islem="personel-liste" data-id="' + kacis(isyeri.id) + '">' + (kapali ? 'Listeyi göster' : 'Listeyi gizle') + '</button>' +
          '<button type="button" class="dugme ince birincil" data-islem="personel-yeni" data-isyeri="' + kacis(isyeri.id) + '">' + B.ikon('i-plus') + 'Personel ekle</button>' +
          '<button type="button" class="dugme ince tehlike-dugme" data-islem="personel-temizle" data-id="' + kacis(isyeri.id) + '">Bu işyerinin listesini temizle</button>' +
        '</div>' +
        '<div class="arama personel-arama">' + B.ikon('i-search') +
          '<input type="search" data-ui="personelArama" value="' + kacis(UI.personelArama || '') + '" placeholder="Ad, meslek, birim veya sicil ara" aria-label="Personel ara">' +
        '</div>' +
      '</div>' +
      '<div class="filtre-cubugu" style="padding-top:0">' +
        '<span class="filtre-etiket">' + B.sayi(liste.length) + ' kayıt listeleniyor</span>' +
        '<span class="sag-arac lejant"><span class="nokta nokta-kirmizi"></span>Eğitimi eksik / süresi dolmuş</span>' +
      '</div>' +
      '<div class="tablo-kap"><table class="personel-tablo">' +
        '<thead><tr><th>İşlemler</th><th>Sicil No</th><th>Adı Soyadı</th><th>TC Kimlik No</th><th>Mesleği</th><th>Departman</th><th>Grup Kodu Açıklama</th><th>Şube</th><th>İşe Başlama</th><th>Kıdem Tarihi</th><th>Cep Telefonu</th><th>Cinsiyet</th></tr></thead>' +
        '<tbody>' + (liste.length ? liste.map(function (kisi) { return kisiSatiri(kisi, hesap); }).join('') :
          '<tr><td colspan="12">' + B.bosDurum('Kayıt bulunamadı', 'Arama ölçütünü değiştirin ya da yeni personel ekleyin.', 'i-users') + '</td></tr>') +
        '</tbody>' +
      '</table></div>' +
    '</section>';
  }

  SAYFALAR.personel = function () {
    var hesap = veri();
    var isyerleri = (hesap.isyerleri || []).filter(function (isyeri) {
      return !UI.kapsam || isyeri.id === UI.kapsam;
    });
    var bloklar = isyerleri.map(function (isyeri) { return personelBloku(isyeri, hesap); }).join('');

    return sayfaBaslik('PERSONEL', 'Personel listesi', 'İşyeri bazında kayıt ve durum takibi',
      '<button type="button" class="dugme" data-islem="personel-sablon">' + B.ikon('i-download') + 'Excel şablonu indir (XLSX)</button>' +
      '<button type="button" class="dugme" data-islem="personel-csv">' + B.ikon('i-download') + 'Güncel listeyi XLSX indir</button>' +
      '<button type="button" class="dugme" data-islem="personel-ice-aktar">' + B.ikon('i-upload') + 'Excel/CSV içe aktar</button>' +
      '<button type="button" class="dugme birincil" data-islem="personel-yeni" data-isyeri="' + kacis(UI.kapsam || '') + '">' + B.ikon('i-plus') + 'Personel ekle</button>') +

      '<div class="kart"><div class="kart-baslik" style="border-bottom:0">' +
        '<div><h2>Güncel personel listesi</h2><p>Personeli işyeri bazında izleyin; XLSX şablonunu doldurup yükleyin ya da elle ekleyin.</p></div>' +
        '<div class="kart-arac">' + kapsamSecici(hesap) + '</div>' +
      '</div></div>' +

      (bloklar || bosKart('Personel yok', 'Yeni personel ekleyerek listeyi oluşturun.', 'i-users'));
  };

  /* İş kazası ve meslek hastalığı kayıt listesi: Saha ve DÖF ile İstatistikler sayfasında ortak kullanılır. */
  function kazaTablosu(kayitlar, hesap) {
    var liste = kayitlar || [];
    var kazaSayi = liste.filter(function (kayit) { return kayit.tur !== 'meslekHastaligi'; }).length;
    var hastalikSayi = liste.length - kazaSayi;
    var satirlar = liste.map(function (kaza) {
      var kisi = (hesap.personel || []).filter(function (p) { return p.id === kaza.personelId; })[0];
      var hastalik = kaza.tur === 'meslekHastaligi';
      var tur = ISG.OLAY_TURLERI[kaza.tur] || ISG.OLAY_TURLERI.isKazasi;
      var bolge = ISG.listeAdi(ISG.YARALANMA_BOLGELERI, kaza.vucutBolgesi, 'Belirtilmedi');
      var tanim = ISG.listeAdi(hastalik ? ISG.HASTALIK_TURLERI : ISG.YARALANMA_TURLERI,
        kaza.yaralanmaTuru, 'Belirtilmedi');
      var grup = hastalik ? ISG.listeAdi(ISG.MESLEK_HASTALIK_GRUPLARI, kaza.hastalikGrubu, '') : '';
      var neden = ISG.listeAdi(ISG.KAZA_NEDENLERI, kaza.neden, '');
      var siddet = ISG.siddetTanim(kaza.siddet);
      var kayip = ISG.kazaKayipGun(kaza);
      var kisiAlt = [];
      if (kisi && kisi.sicil) { kisiAlt.push('Sicil ' + kisi.sicil); }
      if (kisi && kisi.departman) { kisiAlt.push(kisi.departman); }
      kisiAlt.push(isyeriAdi(kaza.isyeriId));
      return '<tr class="kaza-satir" data-tur="' + kacis(kaza.tur || 'isKazasi') + '">' +
        '<td>' + B.tarih(kaza.tarih) + '<span class="hucre-alt">' + kacis(kaza.yer || '—') + '</span></td>' +
        '<td>' + kacis(kisi ? kisi.adSoyad : '—') + '<span class="hucre-alt">' + kacis(kisiAlt.join(' · ')) + '</span></td>' +
        '<td>' + B.rozet(tur.ad, tur.sinif) +
          '<span class="hucre-alt">' + kacis(bolge) + ' · ' + kacis(tanim) + '</span>' +
          (grup ? '<span class="hucre-alt">' + kacis(grup) + '</span>' : '') +
          (hastalik && kaza.etken ? '<span class="hucre-alt">Etken: ' + kacis(kaza.etken) + '</span>' : '') +
          (siddet ? '<span class="hucre-alt">' + B.rozet(siddet.ad, siddet.sinif) + '</span>' : '') + '</td>' +
        '<td>' + (kayip ? B.sayi(kayip) + ' gün' : '—') + (kaza.saglikKurulusu ? '<span class="hucre-alt">' + kacis(kaza.saglikKurulusu) + '</span>' : '') + '</td>' +
        '<td>' + kacis(kaza.aciklama) +
          (neden ? '<span class="hucre-alt">Neden: ' + kacis(neden) + '</span>' : '') +
          (kaza.kokNeden ? '<span class="hucre-alt">Kök neden: ' + kacis(kaza.kokNeden) + '</span>' : '') + '</td>' +
        '<td>' + B.rozet(kaza.durum === 'kapali' ? 'Kapatıldı' : 'Açık', kaza.durum === 'kapali' ? 'iyi' : 'tehlike') + '</td>' +
        '<td class="sag"><div class="dosya-eylem">' +
          '<button type="button" data-islem="kaza-duzenle" data-id="' + kacis(kaza.id) + '">Düzenle</button>' +
          '<button type="button" data-islem="olay-kapat" data-id="' + kacis(kaza.id) + '">' + (kaza.durum === 'kapali' ? 'Yeniden aç' : 'Kapat') + '</button>' +
          '<button type="button" class="sil" data-islem="olay-sil" data-id="' + kacis(kaza.id) + '">Sil</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');

    var toplamGun = liste.reduce(function (toplam, kaza) { return toplam + ISG.kazaKayipGun(kaza); }, 0);

    return '<section class="kart"><div class="kart-baslik"><div><h2>İş kazası ve meslek hastalığı kayıtları</h2>' +
      '<p>Kaza ve meslek hastalığı bildirimleri aynı listede; personel, tanı ve iş günü kaybı birlikte izlenir.</p></div>' +
      '<div class="kart-arac">' +
        '<button type="button" class="dugme ince" data-islem="kaza-csv">' + B.ikon('i-download') + 'Liste indir</button>' +
        '<button type="button" class="dugme birincil kucuk" data-islem="kaza-yeni" data-tur="isKazasi" data-isyeri="' + kacis(UI.kapsam || '') + '">' + B.ikon('i-plus') + 'Kaza bildir</button>' +
        '<button type="button" class="dugme ince" data-islem="kaza-yeni" data-tur="meslekHastaligi" data-isyeri="' + kacis(UI.kapsam || '') + '">' + B.ikon('i-plus') + 'Meslek hastalığı bildir</button>' +
      '</div></div>' +
      '<div class="kart-ic"><div class="filtre-ozet"><span>' + B.sayi(kazaSayi) + ' iş kazası · ' +
        B.sayi(hastalikSayi) + ' meslek hastalığı · ' + B.sayi(toplamGun) + ' iş günü kaybı</span></div></div>' +
      '<div class="tablo-kap"><table class="tablo-kucuk">' +
        '<thead><tr><th>Tarih / yer</th><th>Personel / işyeri</th><th>Kayıt / tanı</th><th>Kayıp gün</th><th>Açıklama / kök neden</th><th>Durum</th><th class="sag">İşlem</th></tr></thead>' +
        '<tbody>' + (satirlar || '<tr><td colspan="7">' + B.bosDurum('İş kazası veya meslek hastalığı kaydı yok', 'Bildirim yapıldığında personel, tanı ve iş günü kaybı burada listelenir.', 'i-risk') + '</td></tr>') + '</tbody>' +
      '</table></div>' +
    '</section>';
  }

  ISG.parcalar = {
    sayfaBaslik: sayfaBaslik,
    kapsamSecici: kapsamSecici,
    kpi: kpi,
    bosKart: bosKart,
    secili: secili,
    kazaTablosu: kazaTablosu
  };
})(window);




