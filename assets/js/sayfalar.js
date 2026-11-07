/* İSG Takip Merkezi — görünümler: ortak parçalar, Genel bakış, İşyerleri, Personel */
(function (global) {
  'use strict';

  var ISG = global.ISG = global.ISG || {};
  var B = ISG.bicim;
  var Y = ISG.yetki;
  var SAYFALAR = ISG.sayfalar = ISG.sayfalar || {};
  var UI = ISG.ui = ISG.ui || {};

  function veri() { return ISG.yetki ? ISG.yetki.gorunum() : ISG.depo.al(); }
  function kacis(deger) { return B.kacis(deger); }
  function rolTanimi(rol) { return ISG.yetki.rolTanimi(rol); }
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

  /* İşyerinin bağlı olduğu kurumun adı; kurum kaydı yoksa boş döner. */
  function isyeriKurumAdi(isyeri, hesap) {
    var kurumId = isyeri.kurumId || '';
    if (!kurumId && (hesap.kurumlar || []).length === 1) { kurumId = hesap.kurumlar[0].id; }
    var kurum = (hesap.kurumlar || []).filter(function (kayit) { return kayit.id === kurumId; })[0];
    return kurum ? (kurum.ad || '') : '';
  }

  function isyeriKarti(isyeri, hesap) {
    var sinif = ISG.RISK_SINIFLARI[isyeri.tehlikeSinifi] || { ad: isyeri.tehlikeSinifi };
    var dosyaSayisi = ISG.kapsamda(hesap, isyeri.id, 'dosyalar').length;
    var calisan = ISG.kapsamda(hesap, isyeri.id, 'personel').length;
    var kurumAdi = isyeriKurumAdi(isyeri, hesap);
    return '<article class="isyeri-kart">' +
      '<div class="isyeri-kart-ust">' +
        '<span class="isyeri-ikon">' + B.ikon('i-building') + '</span>' +
        B.rozet(sinif.ad, isyeri.tehlikeSinifi === 'az' ? 'bilgi' : (isyeri.tehlikeSinifi === 'cokTehlikeli' ? 'tehlike' : 'uyari')) +
      '</div>' +
      '<h3>' + kacis(isyeri.ad) + '</h3>' +
      '<button type="button" class="isyeri-baglanti" data-islem="isyeri-dosya" data-id="' + kacis(isyeri.id) + '">Dosya kontrollerini görüntüle ' + B.ikon('i-arrow') + '</button>' +
      '<span class="isyeri-etiket">İşyeri bilgileri ve işlemler</span>' +
      (kurumAdi ? '<div class="isyeri-satir"><span>Bağlı kurum</span><b>' + kacis(kurumAdi) + '</b></div>' : '') +
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
      '<td class="sayi-sutun">' + kacis(kisi.tc ? ISG.tcGoster(kisi.tc) : '—') + '</td>' +
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
          '<button type="button" class="dugme ince" data-islem="personel-toplu-aktar" data-isyeri="' + kacis(isyeri.id) + '">' + B.ikon('i-upload') + 'Toplu personel yükle</button>' +
          '<button type="button" class="dugme ince" data-islem="personel-sablon">' + B.ikon('i-download') + 'Örnek Excel şablonunu indir</button>' +

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
      '<button type="button" class="dugme" data-islem="personel-sablon">' + B.ikon('i-download') + 'Örnek Excel şablonunu indir</button>' +
      '<button type="button" class="dugme" data-islem="personel-csv">' + B.ikon('i-download') + 'Güncel listeyi XLSX indir</button>' +
      '<button type="button" class="dugme" data-islem="personel-toplu-aktar" data-isyeri="' + kacis(UI.kapsam || '') + '">' + B.ikon('i-upload') + 'Toplu personel yükle (Excel)</button>' +
      '<button type="button" class="dugme birincil" data-islem="personel-yeni" data-isyeri="' + kacis(UI.kapsam || '') + '">' + B.ikon('i-plus') + 'Personel ekle</button>') +

      '<div class="kart"><div class="kart-baslik" style="border-bottom:0">' +
        '<div><h2>Güncel personel listesi</h2><p>Personeli işyeri bazında izleyin; standart XLSX şablonunu doldurup "Toplu personel yükle" ile aktarın. ' +
        'Ön izleme, mükerrer ve hatalı satır denetimi yüklemeden önce yapılır; mevcut kayıtlar korunur.</p></div>' +
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

  /* ---------- Sayfa: Sağlık Takibi (dosya kontrolleri benzeri tablo görünümü) ---------- */
  function saglikOzet(k) {
    if (k.calismaYasagi) { return { id: 'yasakli', ad: 'YASAK VAR' }; }
    if (k.sevkEdilen) { return { id: 'sevkli', ad: 'SEVKLİ' }; }
    return { id: 'uygun', ad: 'UYGUN' };
  }
  function saglikKes(metin, uzunluk) {
    var s = String(metin || '');
    return s.length > uzunluk ? s.slice(0, uzunluk) + '…' : (s || '-');
  }
  function saglikDetay(k) {
    return '<table class="tablo-kucuk saglik-tablo">' +
      '<tr><td>Muayene tarihi</td><td>' + kacis(k.tarih || '-') + '</td></tr>' +
      '<tr><td>Hekim</td><td>' + kacis(k.doktor || '-') + '</td></tr>' +
      '<tr><td>Çalışma şekli</td><td>' + kacis(k.calismaSesi || '-') + '</td></tr>' +
      '<tr><td>Son muayene</td><td>' + kacis(k.sonMuayene || '-') + '</td></tr>' +
      '<tr><td>Sevk edilen</td><td>' + kacis(k.sevkEdilen || '-') + '</td></tr>' +
      '<tr><td>Çalışma yasağı</td><td>' + kacis(k.calismaYasagi || 'Yok') + '</td></tr>' +
      '<tr><td>İzinsizlik günü</td><td>' + kacis(k.izinsizlik || '0') + '</td></tr>' +
      '<tr><td>Kan grubu</td><td>' + kacis(k.kanGrubu || '-') + '</td></tr>' +
      '<tr><td>Alerji</td><td>' + kacis(k.alerji || '-') + '</td></tr>' +
      '<tr><td>Kronik hastalık</td><td>' + kacis(k.kronikHastalik || '-') + '</td></tr>' +
      '<tr><td>Kullanılan ilaç</td><td>' + kacis(k.ilac || '-') + '</td></tr>' +
      '<tr><td>Engel durumu</td><td>' + kacis(k.engelDurumu || '-') + '</td></tr>' +
      '<tr><td>Notlar</td><td>' + kacis(k.notlar || '-') + '</td></tr>' +
    '</table>';
  }
  function saglikSatiri(z, sira, yonetir) {
    var k = z.k;
    var acik = UI.acikSaglik === k.id;
    var durumRozet = B.rozet(z.durum.ad, z.durum.id === 'uygun' ? 'iyi' : (z.durum.id === 'sevkli' ? 'uyari' : 'tehlike'));
    return '<tr>' +
      '<td>' + sira + '</td>' +
      '<td><b>' + kacis(z.ad) + '</b>' + (z.silinmis ? ' ' + B.rozet('silinmiş personel', 'notr') : '') +
      (z.sicil ? '<p class="hucre-alt">Sicil: ' + kacis(z.sicil) + '</p>' : '') + '</td>' +
      '<td>' + kacis(z.isyeri) + (z.isyeriSilinmis ? '<p class="hucre-alt">silinmiş işyeri</p>' : '') + '</td>' +
      '<td>' + B.tarih(k.tarih) + '</td>' +
      '<td>' + kacis(saglikKes(k.sonMuayene, 60)) + '</td>' +
      '<td>' + kacis(saglikKes(k.sevkEdilen, 40)) + '</td>' +
      '<td>' + durumRozet + '</td>' +
      '<td class="sag"><div class="dosya-eylem">' +
        '<button type="button" data-islem="saglik-kapat" data-id="' + kacis(k.id) + '">' + (acik ? 'Gizle' : 'Detay') + '</button>' +
        (yonetir ? '<button type="button" data-islem="saglik-duzenle" data-id="' + kacis(k.id) + '">Düzenle</button>' : '') +
        (yonetir ? '<button type="button" class="sil" data-islem="saglik-sil" data-id="' + kacis(k.id) + '">Sil</button>' : '') +
      '</div></td>' +
    '</tr>' +
    (acik ? '<tr class="saglik-detay-satir"><td></td><td colspan="7">' + saglikDetay(k) + '</td></tr>' : '');
  }

  /* ---------- Sağlık formu: kişi/işyeri seçimi + üç alan grubu ---------- */
  /* Form alanları üç mantıklı grupta toplanır; kullanıcı hangi bilginin gizli
     (şifreli) olduğunu görür. Kişi ve işyeri serbest metin değil, kayıtlı
     listelerden seçilir; böylece "p1" gibi ham kimlik yazılamaz. */
  var SAGLIK_GRUPLARI = [
    { ad: 'Personel ve muayene', alanlar: ['personelId', 'isyeriId', 'tarih', 'doktor'] },
    { ad: 'Sağlık bilgileri (gizli)', alanlar: ['kanGrubu', 'alerji', 'kronikHastalik', 'ilac', 'engelDurumu'] },
    { ad: 'Muayene sonucu ve iş kısıtları', alanlar: ['sonMuayene', 'sevkEdilen', 'calismaYasagi', 'izinsizlik', 'calismaSesi', 'notlar'] }
  ];

  function saglikAlanBul(id) {
    return (ISG.saglikAlanlari || []).filter(function (alan) { return alan.id === id; })[0] || null;
  }

  function saglikIsyeriSecenekleri(hesap, seciliId, kayit) {
    var isyerleri = ((hesap && hesap.isyerleri) || []).slice();
    var html = '<option value="">İşyeri seçin…</option>';
    html += isyerleri.map(function (isyeri) {
      return '<option value="' + kacis(isyeri.id) + '"' + secili(isyeri.id, seciliId) + '>' + kacis(isyeri.ad) + '</option>';
    }).join('');
    /* Silinmiş işyerine bağlı eski kayıt düzenlenebilsin: etiketi koru. */
    if (seciliId && !isyerleri.some(function (isyeri) { return isyeri.id === seciliId; })) {
      html += '<option value="' + kacis(seciliId) + '" selected>' +
        kacis((kayit && kayit.isyeriAd) || 'Silinmiş işyeri') + '</option>';
    }
    return html;
  }

  function saglikPersonelSecenekleri(hesap, seciliId, kayit) {
    var isyeriInd = {};
    ((hesap && hesap.isyerleri) || []).forEach(function (isyeri) { isyeriInd[isyeri.id] = isyeri; });
    var liste = ((hesap && hesap.personel) || []).slice().sort(function (a, b) {
      return String(a.adSoyad || '').localeCompare(String(b.adSoyad || ''), 'tr');
    });
    var html = '<option value="">Personel seçin…</option>' + liste.map(function (kisi) {
      var isyeri = isyeriInd[kisi.isyeriId];
      var etiket = (kisi.adSoyad || '') + (kisi.sicil ? ' · ' + kisi.sicil : '') +
        (isyeri ? ' — ' + isyeri.ad : '');
      return '<option value="' + kacis(kisi.id) + '"' + secili(kisi.id, seciliId) + '>' + kacis(etiket) + '</option>';
    }).join('');
    if (seciliId && !liste.some(function (kisi) { return kisi.id === seciliId; })) {
      html += '<option value="' + kacis(seciliId) + '" selected>' +
        kacis(((kayit && kayit.personelAd) || 'Silinmiş personel') +
          ((kayit && kayit.personelSicil) ? ' · ' + kayit.personelSicil : '')) + '</option>';
    }
    return html;
  }

  function saglikAlanGirdisi(alan, kayit, hesap) {
    var deger = kayit[alan.id];
    if (deger === null || typeof deger === 'undefined') { deger = ''; }
    var zorunlu = alan.zorunlu ? ' required' : '';
    var input;
    if (alan.id === 'personelId') {
      input = '<select name="personelId"' + zorunlu + '>' +
        saglikPersonelSecenekleri(hesap, String(deger), kayit) + '</select>';
    } else if (alan.id === 'isyeriId') {
      input = '<select name="isyeriId"' + zorunlu + '>' +
        saglikIsyeriSecenekleri(hesap, String(deger), kayit) + '</select>';
    } else if (alan.id === 'girisYapan') {
      input = '<input type="hidden" name="girisYapan" value="' + kacis(deger) + '">';
    } else if (alan.tip === 'textarea') {
      input = '<textarea name="' + alan.id + '"' + zorunlu + '>' + kacis(deger) + '</textarea>';
    } else if (alan.tip === 'select' && alan.secenekler) {
      input = '<select name="' + alan.id + '">' +
        '<option value="">Seçin…</option>' +
        alan.secenekler.map(function (secenek) {
          return '<option value="' + kacis(secenek) + '"' + secili(secenek, deger) + '>' + kacis(secenek) + '</option>';
        }).join('') + '</select>';
    } else if (alan.tip === 'date') {
      input = '<input type="date" name="' + alan.id + '" value="' + kacis(deger) + '"' + zorunlu + '>';
    } else if (alan.tip === 'number') {
      input = '<input type="number" name="' + alan.id + '" min="0" step="1" value="' + kacis(deger) + '">';
    } else {
      input = '<input type="text" name="' + alan.id + '" value="' + kacis(deger) + '"' + zorunlu + '>';
    }
    var genis = (alan.tip === 'textarea' || alan.id === 'personelId' || alan.id === 'isyeriId') ? ' genis' : '';
    return '<label class="alan' + genis + '"><span>' + kacis(alan.ad) + (alan.zorunlu ? ' *' : '') + '</span>' +
      input + '</label>';
  }

  function saglikFormu(k, hesap) {
    k = k || {};
    var gruplar = SAGLIK_GRUPLARI.map(function (grup) {
      return '<fieldset class="saglik-grup"><legend>' + kacis(grup.ad) + '</legend>' +
        '<div class="form-izgara">' +
        grup.alanlar.map(function (id) {
          var alan = saglikAlanBul(id);
          return alan ? saglikAlanGirdisi(alan, k, hesap) : '';
        }).join('') +
        '</div></fieldset>';
    }).join('');
    return '<form id="saglik-form" class="form-kutu">' +
      '<input type="hidden" name="id" value="' + kacis(k.id || '') + '">' +
      '<input type="hidden" name="girisYapan" value="' + kacis(k.girisYapan || '') + '">' +
      gruplar +
      '<div class="form-islem">' +
        '<button type="button" class="dugme ikincil" data-islem="saglik-vazgec">Vazgeç</button>' +
        '<button type="submit" class="dugme birincil">' + (k.id ? 'Güncelle' : 'Kaydet') + '</button>' +
      '</div>' +
    '</form>';
  }


  /* Tam personel listesi satırı: kişinin son muayenesi ve tüm geçmişi.
     Kaydı olmayan personel de listelenir; "MUAYENE YOK" rozetiyle takip edilir. */
  function saglikKisiGecmisi(satir, yonetir) {
    if (!satir.kayitlar.length) {
      return '<p class="hucre-alt">Bu personel için muayene kaydı yok. “Muayene ekle” ile ilk kaydı girin.</p>';
    }
    return '<table class="tablo-kucuk saglik-tablo"><thead><tr><th>Tarih</th><th>Sonuç</th>' +
      '<th>Sevk</th><th>Çalışma yasağı</th><th class="sag">İşlem</th></tr></thead><tbody>' +
      satir.kayitlar.map(function (kayit) {
        return '<tr><td>' + B.tarih(kayit.tarih) + '</td>' +
          '<td>' + kacis(saglikKes(kayit.sonMuayene, 60)) + '</td>' +
          '<td>' + kacis(saglikKes(kayit.sevkEdilen, 40)) + '</td>' +
          '<td>' + kacis(saglikKes(kayit.calismaYasagi, 40)) + '</td>' +
          '<td class="sag"><div class="dosya-eylem">' +
            (yonetir ? '<button type="button" data-islem="saglik-duzenle" data-id="' + kacis(kayit.id) + '">Düzenle</button>' : '') +
            (yonetir ? '<button type="button" class="sil" data-islem="saglik-kisi-sil" data-id="' + kacis(kayit.id) + '">Sil</button>' : '') +
          '</div></td></tr>';
      }).join('') + '</tbody></table>';
  }

  function saglikKisiSatiri(satir, sira, yonetir) {
    var kisi = satir.kisi;
    var acik = UI.acikSaglikKisi === kisi.id;
    var sinif = satir.durum.id === 'uygun' ? 'iyi' :
      (satir.durum.id === 'sevkli' ? 'uyari' : (satir.durum.id === 'yasakli' ? 'tehlike' : 'notr'));
    var html = '<tr>' +
      '<td>' + sira + '</td>' +
      '<td><b>' + kacis(kisi.adSoyad) + '</b>' +
        (kisi.sicil ? '<p class="hucre-alt">Sicil: ' + kacis(kisi.sicil) + '</p>' : '') +
        (kisi.gorev ? '<p class="hucre-alt">' + kacis(kisi.gorev) + '</p>' : '') + '</td>' +
      '<td>' + kacis(satir.isyeri || '—') + '</td>' +
      '<td>' + (satir.son ? B.tarih(satir.son.tarih) : '—') + '</td>' +
      '<td>' + B.rozet(satir.durum.ad, sinif) + '</td>' +
      '<td>' + B.sayi(satir.kayitlar.length) + '</td>' +
      '<td class="sag"><div class="dosya-eylem">' +
        (yonetir ? '<button type="button" data-islem="saglik-kisi-ekle" data-id="' + kacis(kisi.id) + '">Muayene ekle</button>' : '') +
        (satir.kayitlar.length ? '<button type="button" data-islem="saglik-kisi-gecmis" data-id="' + kacis(kisi.id) + '">' +
          (acik ? 'Geçmişi gizle' : 'Geçmiş (' + satir.kayitlar.length + ')') + '</button>' : '') +
      '</div></td>' +
    '</tr>';
    if (acik) {
      html += '<tr class="saglik-detay-satir"><td></td><td colspan="6">' +
        saglikKisiGecmisi(satir, yonetir) + '</td></tr>';
    }
    return html;
  }


  SAYFALAR.saglik = function (hesap) {
    var o = Y.oturum();
    if (!o) { return '<div class="hata">' + B.bosDurum('Oturum bulunamadı', 'Lütfen giriş yapın.', 'i-saglik') + '</div>'; }
    var rol = rolTanimi(o.rol);
    /* Görüntüleme/yazma izni tek merkezden sorulur (yetki.js). OSGB Müdürü
       ekranı açabilir ve kendi kurumunu izler ama salt okunurdur; görüntüleme
       izni yoksa ekran kapanmaz, erişim talebi sunulur. */
    var saglikIzinleri = Y.saglikIzin ? Y.saglikIzin() : { goruntule: false, ekle: false, duzenle: false, sil: false };
    var yonetir = saglikIzinleri.ekle === true;
    if (!saglikIzinleri.goruntule) {
      var kendiTalep = ISG.depo.saglikErisimTalepleri().filter(function (t) { return t.kullaniciId === o.kullaniciId; })[0];
      var onaylayabilir = rol.yonetir === true;
      var talepler = onaylayabilir ? ISG.saglikTakip.erisimTalepleri().filter(function (t) { return t.durum === 'bekliyor'; }) : [];
      return '<section class="sayfa saglik-sayfa"><div class="sayfa-ust"><div class="sayfa-baslik"><span class="kurum">SAĞLIK TAKİBİ</span><h1>Yönetici onayı gerekli</h1><p>Sağlık bilgileri yalnızca yönetici tarafından erişim izni verilen hesaplara açılır.</p></div></div>' +
        (onaylayabilir ? '<div class="kart"><h2>Bekleyen erişim talepleri</h2>' + (talepler.length ? talepler.map(function (t) { return '<div class="kullanici-satir"><strong>' + kacis(t.kullaniciAd) + '</strong><span>' + kacis(t.eposta) + '</span><button class="dugme ikincil" data-islem="saglik-erisim-ret" data-id="' + kacis(t.id) + '">Reddet</button><button class="dugme birincil" data-islem="saglik-erisim-onay" data-id="' + kacis(t.id) + '">Erişim ver</button></div>'; }).join('') : '<p>Bekleyen talep yok.</p>') + '</div>' : '<div class="kart"><h2>Sağlık verisi erişimi</h2><p>' + (kendiTalep && kendiTalep.durum === 'bekliyor' ? 'Erişim talebiniz yönetici onayı bekliyor.' : (kendiTalep && kendiTalep.durum === 'reddedildi' ? 'Talebiniz reddedildi. Yeniden erişim isteyebilirsiniz.' : 'Sağlık listesini ve kayıtlarını görüntülemek için erişim talep edin.')) + '</p>' + (kendiTalep && kendiTalep.durum === 'bekliyor' ? '' : '<button class="dugme birincil" data-islem="saglik-erisim-talep">Yönetici onayı iste</button>') + '</div>') + '</section>';
    }

    /* Tek işyeri seçimi: üst çubuktaki kapsam seçici hem personel kadrosunu
       hem muayene kayıtlarını, sayımları, aramayı ve Excel çıktısını sınırlar.
       Seçim yoksa yetkili olunan bütün işyerleri gösterilir. */
    var seciliIsyeri = UI.kapsam || '';
    if (seciliIsyeri && !(hesap.isyerleri || []).some(function (isyeri) { return isyeri.id === seciliIsyeri; })) {
      seciliIsyeri = '';
    }

    var liste;
    try {
      liste = ISG.saglikTakip.listele(seciliIsyeri, '');
    } catch (hata) {
      return '<div class="hata">' + B.bosDurum('Kayıtlar okunamadı', (hata && hata.message) || 'Beklenmeyen hata.', 'i-saglik') + '</div>';
    }

    var kisiInd = {}, isyInd = {};
    (hesap.personel || []).forEach(function (p) { kisiInd[p.id] = p; });
    (hesap.isyerleri || []).forEach(function (i) { isyInd[i.id] = i; });
    var zengin = liste.map(function (k) {
      var kisi = kisiInd[k.personelId];
      var isy = isyInd[k.isyeriId];
      /* Kişi veya işyeri silinmişse kayıt listeden düşmez: silinmeden önce kayda
         dondurulan ad/sicil okunur, arayüzde "silinmiş personel" rozeti basılır. */
      return {
        k: k,
        ad: kisi ? kisi.adSoyad : (k.personelAd || k.personelId || '-'),
        sicil: kisi ? (kisi.sicil || '') : (k.personelSicil || ''),
        isyeri: isy ? isy.ad : (k.isyeriAd || k.isyeriId || '-'),
        silinmis: !kisi,
        isyeriSilinmis: !isy,
        durum: saglikOzet(k)
      };
    });
    /* İkinci savunma hattı: sorgu katmanı kapsamı zaten süzüyor, ekranda da
       seçili işyeri dışındaki kayıt (geç/bozuk yanıt) gösterilmez. İşyeri
       kimliği boş eski kayıtlar, personelin bağlı olduğu işyeriyle eşleşiyorsa
       görünür; hiçbir işyeriyle eşleşmeyen kayıt başkasına yazılmaz. */
    if (seciliIsyeri) {
      zengin = zengin.filter(function (z) {
        if (z.k.isyeriId === seciliIsyeri) { return true; }
        var kisi = kisiInd[z.k.personelId];
        return !!kisi && kisi.isyeriId === seciliIsyeri;
      });
    }
    /* En yeni muayene tarihi üstte; aynı tarihte ad soyad sıra ile. */
    zengin.sort(function (a, b) {
      return String(b.k.tarih || '').localeCompare(String(a.k.tarih || '')) || a.ad.localeCompare(b.ad, 'tr');
    });
    /* ---------- Tam personel listesi: kaydı olmayan personel de görünür ---------- */
    var kayitlarKisi = {};
    liste.forEach(function (kayit) {
      if (!kayit || !kayit.personelId) { return; }
      (kayitlarKisi[kayit.personelId] = kayitlarKisi[kayit.personelId] || []).push(kayit);
    });
    Object.keys(kayitlarKisi).forEach(function (kisiId) {
      kayitlarKisi[kisiId].sort(function (a, b) {
        return String(b.tarih || '').localeCompare(String(a.tarih || ''));
      });
    });
    var kadro = ((hesap && hesap.personel) || []).filter(function (kisi) {
      return kisi && kisi.id && (!seciliIsyeri || kisi.isyeriId === seciliIsyeri);
    }).map(function (kisi) {
      var kayitlar = kayitlarKisi[kisi.id] || [];
      return {
        kisi: kisi,
        kayitlar: kayitlar,
        son: kayitlar[0] || null,
        isyeri: isyInd[kisi.isyeriId] ? isyInd[kisi.isyeriId].ad : '',
        durum: kayitlar.length ? saglikOzet(kayitlar[0]) : { id: 'yok', ad: 'MUAYENE YOK' }
      };
    });
    kadro.sort(function (a, b) {
      return String(a.kisi.adSoyad || '').localeCompare(String(b.kisi.adSoyad || ''), 'tr');
    });
    var kisiArama = String(UI.saglikKisiArama || '').toLocaleLowerCase('tr');
    var kisiDurum = UI.saglikKisiDurum || 'tumu';
    var kisiIsyeri = seciliIsyeri;
    var kadroFiltre = kadro.filter(function (satir) {
      if (kisiDurum !== 'tumu' && satir.durum.id !== kisiDurum) { return false; }
      if (kisiIsyeri && satir.kisi.isyeriId !== kisiIsyeri) { return false; }
      if (kisiArama) {
        return [satir.kisi.adSoyad, satir.kisi.sicil, satir.isyeri, satir.kisi.gorev, satir.kisi.departman]
          .join(' ').toLocaleLowerCase('tr').indexOf(kisiArama) >= 0;
      }
      return true;
    });
    var kisiSayilar = { tumu: kadro.length, yok: 0, sevkli: 0, yasakli: 0, uygun: 0 };
    kadro.forEach(function (satir) {
      kisiSayilar[satir.durum.id] = (kisiSayilar[satir.durum.id] || 0) + 1;
    });
    var kisiBoyut = 25;
    var kisiSonSayfa = Math.max(1, Math.ceil(kadroFiltre.length / kisiBoyut));
    var kisiSayfa = Math.min(Math.max(1, Number(UI.saglikKisiSayfa) || 1), kisiSonSayfa);
    var kisiSatirlar = kadroFiltre.slice((kisiSayfa - 1) * kisiBoyut, kisiSayfa * kisiBoyut);
    var kisiHtml = kisiSatirlar.map(function (satir, i) {
      return saglikKisiSatiri(satir, (kisiSayfa - 1) * kisiBoyut + i + 1, rol.yonetir === true);
    }).join('');

    var sayilar = { tumu: zengin.length, sevkli: 0, yasakli: 0, uygun: 0 };
    zengin.forEach(function (z) { sayilar[z.durum.id] = (sayilar[z.durum.id] || 0) + 1; });

    var arama = String(UI.saglikArama || '').toLocaleLowerCase('tr');
    var sekme = UI.saglikSekme || 'tumu';
    var filtreli = zengin.filter(function (z) {
      if (sekme !== 'tumu' && z.durum.id !== sekme) { return false; }
      if (arama) {
        return [z.ad, z.sicil, z.isyeri, z.k.tarih, z.k.sonMuayene, z.k.sevkEdilen, z.k.doktor]
          .join(' ').toLocaleLowerCase('tr').indexOf(arama) >= 0;
      }
      return true;
    });

    var boyut = Number(UI.saglikBoyut) || 25;
    var sonSayfa = Math.max(1, Math.ceil(filtreli.length / boyut));
    var sayfa = Math.min(Math.max(1, Number(UI.saglikSayfa) || 1), sonSayfa);
    var dilim = filtreli.slice((sayfa - 1) * boyut, sayfa * boyut);
    var satirHtml = dilim.map(function (z, i) {
      return saglikSatiri(z, (sayfa - 1) * boyut + i + 1, rol.yonetir === true);
    }).join('');

    var duzenlenen = UI.duzenleSaglik ? liste.filter(function (k) { return k.id === UI.duzenleSaglik; })[0] || null : null;
    /* "Muayene ekle" seçilen kişi: form kişi/işyeri seçili ve açık gelir. */
    var yeniKayit = {};
    if (!duzenlenen && UI.saglikKisi) {
      var secilenKisi = ((hesap && hesap.personel) || []).filter(function (kisi) { return kisi.id === UI.saglikKisi; })[0];
      if (secilenKisi) {
        yeniKayit.personelId = secilenKisi.id;
        yeniKayit.isyeriId = secilenKisi.isyeriId || '';
      }
    }
    var formAcik = !!(UI.saglikFormuAc || duzenlenen || UI.saglikKisi);
    var form = rol.yonetir ? '<details class="saglik-giris" id="saglik-giris"' + (formAcik ? ' open' : '') + '>' +
      '<summary>' + (duzenlenen ? 'Sağlık kaydını düzenle' : 'Yeni sağlık kaydı') + '</summary>' +
      '<div class="kart-ic">' + saglikFormu(duzenlenen || yeniKayit, hesap) + '</div>' +
    '</details>' : '';
    var talepKart = '';
    if (rol.yonetir) {
      var bekleyenler = ISG.saglikTakip.erisimTalepleri().filter(function (t) { return t.durum === 'bekliyor'; });
      if (bekleyenler.length) {
        talepKart = '<div class="kart"><h3>Bekleyen erişim talepleri</h3>' +
          bekleyenler.map(function (t) {
            return '<div class="kullanici-satir"><strong>' + kacis(t.kullaniciAd) + '</strong><span>' + kacis(t.eposta) + '</span>' +
              '<button type="button" class="dugme ikincil" data-islem="saglik-erisim-ret" data-id="' + kacis(t.id) + '">Reddet</button>' +
              '<button type="button" class="dugme birincil" data-islem="saglik-erisim-onay" data-id="' + kacis(t.id) + '">Erişim ver</button></div>';
          }).join('') + '</div>';
      }
    }

    /* İşyeri bazında tarama özeti: OSGB Müdürü kurumundaki eksik muayeneleri
       tek bakışta görür. Yalnızca yetkili olunan (kapsamdaki) işyerleri
       listelenir; başka kurumun satırı bu listeye giremez. */
    var taramaOzeti = '';
    if ((hesap.isyerleri || []).length) {
      var isyeriSayim = {};
      (hesap.isyerleri || []).forEach(function (isyeri) {
        isyeriSayim[isyeri.id] = { ad: isyeri.ad, toplam: 0, yok: 0, sevkli: 0, yasakli: 0, uygun: 0 };
      });
      kadro.forEach(function (satir) {
        var kova = isyeriSayim[satir.kisi.isyeriId];
        if (!kova) { return; }
        kova.toplam += 1;
        kova[satir.durum.id] = (kova[satir.durum.id] || 0) + 1;
      });
      var ozetSatirlari = Object.keys(isyeriSayim).map(function (id) { return isyeriSayim[id]; })
        .filter(function (kova) { return kova.toplam > 0; });
      if (ozetSatirlari.length) {
        var eksikToplam = ozetSatirlari.reduce(function (toplam, kova) { return toplam + (kova.yok || 0); }, 0);
        taramaOzeti = '<div class="kart" id="saglik-tarama-kart"><div class="kart-baslik"><div>' +
          '<h2>İşyeri sağlık taraması özeti</h2>' +
          '<p>“Muayene yok”, bu işyerinde hiç sağlık kaydı bulunmayan personel sayısıdır.</p></div>' +
          '<span class="rozet ' + (eksikToplam ? 'uyari' : 'iyi') + '">' + B.sayi(eksikToplam) + ' eksik tarama</span></div>' +
          '<div class="tablo-kap"><table class="tablo-kucuk" id="saglik-tarama-tablo"><thead><tr>' +
            '<th>İşyeri</th><th>Personel</th><th>Muayene yok</th><th>Sevkli</th><th>Yasaklı</th><th>Uygun</th>' +
          '</tr></thead><tbody>' + ozetSatirlari.map(function (kova) {
            return '<tr><td><b>' + kacis(kova.ad) + '</b></td><td>' + B.sayi(kova.toplam) + '</td>' +
              '<td>' + (kova.yok ? B.rozet(B.sayi(kova.yok), 'uyari') : '0') + '</td>' +
              '<td>' + B.sayi(kova.sevkli || 0) + '</td><td>' + B.sayi(kova.yasakli || 0) + '</td>' +
              '<td>' + B.sayi(kova.uygun || 0) + '</td></tr>';
          }).join('') + '</tbody></table></div></div>';
      }
    }

    var calismaKitabi = ISG.depo.saglikCalismaKitabi ? ISG.depo.saglikCalismaKitabi() : null;
    var varsayilanSekmeler = ['TAM LİSTE', 'YÜKSEK RİSKLİ MESLEKLER', 'ÇALIŞMASI UYGUN DEĞİLDİR',
      'SAĞLIK TARAMALARI EKSİK OLANLAR', 'MALULİYETİ OLANLAR'];
    /* Sekmeler {ad, satirlar} nesneleridir. Etiket olarak nesne basılırsa ekranda
       "[object Object]" görünür; ad alanı okunur. Eski düz metin biçimi de desteklenir. */
    var kitapSekmeleri = (calismaKitabi && calismaKitabi.sekmeler) || [];
    var sekmeAdlari = kitapSekmeleri.length ? kitapSekmeleri.map(function (sekme, i) {
      if (typeof sekme === 'string') { return sekme; }
      return (sekme && sekme.ad) || varsayilanSekmeler[i] || ('Sekme ' + (i + 1));
    }) : varsayilanSekmeler;
    var seciliListeSekmesi = Math.min(Math.max(0, Number(UI.saglikListeSekmesi) || 0),
      Math.max(0, sekmeAdlari.length - 1));
    var seciliSekme = kitapSekmeleri[seciliListeSekmesi];
    var calismaSatirlari = Array.isArray(seciliSekme) ? seciliSekme : ((seciliSekme && seciliSekme.satirlar) || []);
    function sekmeSatirSayisi(sekme) {
      var satirlar = Array.isArray(sekme) ? sekme : ((sekme && sekme.satirlar) || []);
      return Math.max(0, satirlar.length - 1);
    }
    var calismaTablo = '';
    if (calismaKitabi) {
      var basliklar = calismaSatirlari.length ? calismaSatirlari[0] : [];
      var veriSatirlari = calismaSatirlari.slice(1);
      var aramaKitap = String(UI.saglikKitapArama || '').toLocaleLowerCase('tr-TR');
      if (aramaKitap) {
        veriSatirlari = veriSatirlari.filter(function (r) { return r.join(' ').toLocaleLowerCase('tr-TR').indexOf(aramaKitap) >= 0; });
      }
      var kitapBoyut = 50;
      var kitapSonSayfa = Math.max(1, Math.ceil(veriSatirlari.length / kitapBoyut));
      var kitapSayfa = Math.min(Math.max(1, Number(UI.saglikKitapSayfa) || 1), kitapSonSayfa);
      var kitapDilim = veriSatirlari.slice((kitapSayfa - 1) * kitapBoyut, kitapSayfa * kitapBoyut);
      calismaTablo = '<div class="filtre-cubugu"><input type="search" data-ui="saglikKitapArama" value="' +
          kacis(UI.saglikKitapArama || '') + '" placeholder="Çalışma kitabında ara..." aria-label="Excel çalışma kitabında ara">' +
          '<span class="muted">' + B.sayi(veriSatirlari.length) + ' kayıt</span></div>' +
        '<div class="tablo-kap"><table class="tablo-kucuk" id="saglik-kitap-tablo"><thead><tr>' +
          basliklar.map(function (c) { return '<th>' + kacis(c || '') + '</th>'; }).join('') + '</tr></thead><tbody>' +
        (kitapDilim.length ? kitapDilim.map(function (r) {
          return '<tr>' + basliklar.map(function (_, i) { return '<td>' + kacis(r[i] || '') + '</td>'; }).join('') + '</tr>';
        }).join('') : '<tr><td colspan="' + Math.max(1, basliklar.length) + '">' +
          B.bosDurum('Bu sekmede kayıt yok', 'Arama ölçütünü temizleyin veya Excel çalışma kitabını yeniden yükleyin.', 'i-saglik') +
          '</td></tr>') +
        '</tbody></table></div>' +
        '<div class="filtre-ozet" style="border-top:1px solid var(--line)">' +
          '<span class="muted">' + (veriSatirlari.length ? ((kitapSayfa - 1) * kitapBoyut + 1) + '–' +
            Math.min(kitapSayfa * kitapBoyut, veriSatirlari.length) + ' / ' + B.sayi(veriSatirlari.length) : '0 kayıt') + '</span>' +
          '<span class="sag-arac" data-sayfa-anahtar="saglikKitapSayfa">' + B.sayfalama(veriSatirlari.length, kitapSayfa, kitapBoyut) + '</span>' +
        '</div>';
    }
    var kitapArac = rol.yonetir ? '<div class="kart-arac">' +
      '<button type="button" class="dugme birincil" data-islem="saglik-xlsx-yukle">' +
        (calismaKitabi ? 'Excel listesini güncelle' : 'Excel listesini yükle') + '</button>' +
      '<button type="button" class="dugme" data-islem="saglik-ice-aktar">Sağlık kaydı Excel\'den yükle</button>' +
      '<button type="button" class="dugme" data-islem="saglik-sablon">Şablon indir (.xlsx)</button>' +
      '<button type="button" class="dugme" data-islem="saglik-disa-aktar">Excel\'e aktar</button>' +
    '</div>' : '';
    return '<section class="sayfa saglik-sayfa">' +
      sayfaBaslik('SAĞLIK TAKİBİ', 'Personel Sağlık Takibi',
        'Muayene kayıtları, sevk ve çalışma yasağı takibi.', kapsamSecici(hesap)) +
      talepKart +
      taramaOzeti +
      '<div class="kart"><div class="kart-baslik"><div><h2>İşyeri hekimi çalışma kitabı</h2><p>' + (calismaKitabi ? 'Kaynak: ' + kacis(calismaKitabi.dosyaAdi || 'ASKI İş Yeri Hekimi Sağlık Takip 2026–2028') + ' · ' + B.tarih(String(calismaKitabi.yuklemeTarihi || '').slice(0, 10)) : 'ASKI İş Yeri Hekimi Sağlık Takip 2026–2028 · beş sekmeli liste') + '</p></div>' + kitapArac + '</div><div class="sekme-satir">' + sekmeAdlari.map(function (ad, i) { return '<button type="button" class="sekme' + (i === seciliListeSekmesi ? ' aktif' : '') + '" data-islem="saglik-liste-sekme" data-sekme="' + i + '">' + kacis(ad) + (kitapSekmeleri[i] ? ' <b>' + B.sayi(sekmeSatirSayisi(kitapSekmeleri[i])) + '</b>' : '') + '</button>'; }).join('') + '</div>' + (calismaKitabi ? calismaTablo : '<div class="kart-ic">' + B.bosDurum('Çalışma kitabı henüz yüklenmedi', rol.yonetir ? '“Excel listesini yükle” düğmesini seçin. Dosyanın beş sekmesi sağlık kasasına aktarılacak.' : 'Çalışma kitabı yönetici tarafından yüklendikten sonra burada görünür.', 'i-saglik') + '</div>') + (calismaKitabi && rol.yonetir ? '<p class="muted">Liste bu cihazın korumalı sağlık kasasında saklanır. Genel bulut eşitlemesine eklenmez.</p>' : '') + '</div>' +
      /* Personel listesi: kaydı olmayanlar dâhil tüm kadro */
      '<div class="kart" id="saglik-kisi-kart">' +
        '<div class="kart-baslik"><div><h2>Personel listesi</h2><p>Kapsamdaki tüm personel ve son muayene durumu; kaydı olmayanlar da izlenir.</p></div>' +
          '<span class="rozet notr">' + B.sayi(kadro.length) + ' personel</span></div>' +
        '<div class="filtre-cubugu">' +
          '<input type="search" data-ui="saglikKisiArama" value="' + kacis(UI.saglikKisiArama || '') + '" placeholder="Ad, sicil, görev veya işyeri ara..." aria-label="Personel listesinde ara">' +
          '<select data-ui="saglikKisiDurum" aria-label="Muayene durumu">' +
            [['tumu', 'Tümü'], ['yok', 'Muayene yok'], ['sevkli', 'Sevkli'], ['yasakli', 'Yasaklı'], ['uygun', 'Uygun']].map(function (ikili) {
              return '<option value="' + ikili[0] + '"' + secili(ikili[0], kisiDurum) + '>' + ikili[1] + ' (' + B.sayi(kisiSayilar[ikili[0]] || 0) + ')</option>';
            }).join('') +
          '</select>' +
        '</div>' +
        '<div class="tablo-kap"><table class="tablo-kucuk" id="saglik-kisi-tablo">' +
          '<thead><tr><th>#</th><th>Personel</th><th>İşyeri</th><th>Son muayene</th><th>Durum</th><th>Kayıt</th><th class="sag">İşlemler</th></tr></thead>' +
          '<tbody>' + (kisiHtml || '<tr><td colspan="7">' + B.bosDurum('Personel bulunamadı', 'Arama veya durum filtresini temizleyin. Personel listesi boşsa önce personel ekleyin.', 'i-team') + '</td></tr>') + '</tbody>' +
        '</table></div>' +
        '<div class="filtre-ozet" style="border-top:1px solid var(--line)">' +
          '<span class="muted">' + (kadroFiltre.length ? ((kisiSayfa - 1) * kisiBoyut + 1) + '–' + Math.min(kisiSayfa * kisiBoyut, kadroFiltre.length) + ' / ' + B.sayi(kadroFiltre.length) : '0 personel') + '</span>' +
          '<span class="sag-arac" data-sayfa-anahtar="saglikKisiSayfa">' + B.sayfalama(kadroFiltre.length, kisiSayfa, kisiBoyut) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="kart" id="saglik-kayit-kart">' +
        '<div class="kart-baslik"><div><h2>Muayene kayıtları</h2><p>Kayıt bazında arama, sekme, detay ve düzenleme.</p></div>' +
          (rol.yonetir ? '<button type="button" class="dugme birincil" data-islem="saglik-yeni">Yeni kayıt</button>' : '') + '</div>' +
        '<div class="filtre-cubugu">' +
          '<input type="search" data-ui="saglikArama" value="' + kacis(UI.saglikArama || '') + '"' +
            ' placeholder="Personel, sicil, sonuç veya sevk ara..." aria-label="Sağlık kayıtlarında ara">' +
        '</div>' +
        '<div class="sekme-satir">' +
          [['tumu', 'Tümü'], ['sevkli', 'Sevkli'], ['yasakli', 'Yasaklı'], ['uygun', 'Uygun']].map(function (ikili) {
            return '<button type="button" class="sekme' + (sekme === ikili[0] ? ' aktif' : '') + '" data-islem="saglik-sekme" data-sekme="' + ikili[0] + '">' +
              ikili[1] + ' <b>' + B.sayi(sayilar[ikili[0]] || 0) + '</b></button>';
          }).join('') +
        '</div>' +
        '<div class="filtre-ozet">' +
          '<span><strong>' + B.sayi(filtreli.length) + '</strong> kayıt gösteriliyor</span>' +
          '<span class="sag-arac"><label class="filtre-etiket" for="saglikBoyut">Sayfada</label>' +
            '<select id="saglikBoyut" data-ui="saglikBoyut" style="padding:6px 10px;border:1px solid var(--line-strong);border-radius:8px;background:#fff">' +
              [10, 25, 50, 100].map(function (adet) { return '<option value="' + adet + '"' + (boyut === adet ? ' selected' : '') + '>' + adet + ' kayıt</option>'; }).join('') +
            '</select></span>' +
        '</div>' +
        '<div class="tablo-kap"><table class="tablo-kucuk" id="saglik-kayit-tablo">' +
          '<thead><tr><th>#</th><th>Personel</th><th>İşyeri</th><th>Muayene</th><th>Sonuç</th><th>Sevk</th><th>Durum</th><th class="sag">İşlemler</th></tr></thead>' +
          '<tbody>' + (satirHtml || '<tr><td colspan="8">' + B.bosDurum('Kayıt bulunamadı', 'Filtreleri sıfırlayın ya da yeni sağlık kaydı ekleyin.', 'i-saglik') + '</td></tr>') + '</tbody>' +
        '</table></div>' +
        '<div class="filtre-ozet" style="border-top:1px solid var(--line)">' +
          '<span class="muted">' + (filtreli.length ? ((sayfa - 1) * boyut + 1) + '–' + Math.min(sayfa * boyut, filtreli.length) + ' / ' + B.sayi(filtreli.length) : '0 kayıt') + '</span>' +
          '<span class="sag-arac">' + B.sayfalama(filtreli.length, sayfa, boyut) + '</span>' +
        '</div>' +
      '</div>' +
      (form ? '<div class="kart saglik-giris-kart">' + form + '</div>' : '') +
    '</section>';
  };

  /* Sayfa ataması (uygulama.js ISG.sayfalar[data-sayfa] ile çağırır). */
  ISG.sayfalar = ISG.sayfalar || SAYFALAR;
  ISG.sayfalar.saglik = SAYFALAR.saglik;

  ISG.parcalar = {
    sayfaBaslik: sayfaBaslik,
    kapsamSecici: kapsamSecici,
    kpi: kpi,
    bosKart: bosKart,
    secili: secili,
    kazaTablosu: kazaTablosu
  };
})(window);





