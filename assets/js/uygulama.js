/* İSG Takip Merkezi — uygulama denetleyicisi */
(function (global) {
  'use strict';

  var ISG = global.ISG;
  var B = ISG.bicim;
  var D = ISG.depo;
  var UI = ISG.ui = ISG.ui || {};

  var SAYFA_BILGI = {
    panel: 'Genel bakış',
    isyerleri: 'İşyerleri',
    personel: 'Personel listesi',
    dosyalar: 'Dosya kontrolleri',
    plan: 'Çalışma planı',
    saha: 'Saha ve DÖF',
    rapor: 'Yönetim raporu',
    istatistik: 'İstatistikler',
    risk: 'Risk değerlendirmesi',
    acil: 'Acil durum planı',
    ekip: 'Ekip ve davetler',
    onaylar: 'Onay kuyruğu',
    mevzuat: 'Mevzuat ve kapsam'
  };

  /* Yalnızca yöneticiye açık sayfalar */
  var YONETICI_SAYFALARI = { isyerleri: 1, ekip: 1 };

  var bekleyenOnay = null;
  var cizZamanlayici = null;
  var odakBilgi = null;
  var bekleyenBelgeler = [];
  var baglandi = false;

  function el(id) { return document.getElementById(id); }
  function veri() { return ISG.yetki ? ISG.yetki.gorunum() : D.al(); }

  function formVerisi(form) {
    var data = {};
    new FormData(form).forEach(function (deger, anahtar) { data[anahtar] = String(deger).trim(); });
    return data;
  }

  function uyariGoster(id, mesaj) {
    var kutu = el(id);
    if (!kutu) { return; }
    if (!mesaj) { kutu.hidden = true; kutu.textContent = ''; return; }
    kutu.hidden = false;
    kutu.textContent = mesaj;
  }

  function diyalogAc(diyalog, odak) {
    if (!diyalog) { return; }
    if (typeof diyalog.showModal === 'function') {
      if (!diyalog.open) { diyalog.showModal(); }
    } else {
      diyalog.setAttribute('open', 'open');
    }
    var hedef = odak || diyalog.querySelector('input:not([type="hidden"]), select, textarea');
    if (hedef) { setTimeout(function () { try { hedef.focus(); } catch (hata) { /* yok say */ } }, 30); }
  }

  function diyalogKapat(diyalog) {
    if (!diyalog) { return; }
    if (typeof diyalog.close === 'function' && diyalog.open) { diyalog.close(); }
    else { diyalog.removeAttribute('open'); }
  }

  function onayIste(baslik, metin, eylem, dugmeMetni) {
    el('onayBaslik').textContent = baslik;
    el('onayMetin').textContent = metin;
    el('onayEvet').textContent = dugmeMetni || 'Sil';
    bekleyenOnay = eylem;
    diyalogAc(el('onayDiyalog'));
  }

  function aktifSayfa() {
    var anahtar = String(global.location.hash || '#panel').replace('#', '').split('?')[0];
    return SAYFA_BILGI[anahtar] ? anahtar : 'panel';
  }

  function git(sayfa, kapsam) {
    if (typeof kapsam !== 'undefined') { UI.kapsam = kapsam; }
    if (aktifSayfa() === sayfa) { ciz(); }
    else { global.location.hash = '#' + sayfa; }
  }

  function tarihliAd(onek, uzanti) {
    var d = new Date();
    return onek + '-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '.' + (uzanti || 'csv');
  }

  function isyeriSecenekleri(secili) {
    return (veri().isyerleri || []).map(function (isyeri) {
      return '<option value="' + B.kacis(isyeri.id) + '"' + (isyeri.id === secili ? ' selected' : '') + '>' + B.kacis(isyeri.ad) + '</option>';
    }).join('');
  }

  function kisileriDoldur() {
    var hesap = veri();
    var departmanlar = [];
    var bolumler = [];
    hesap.personel.forEach(function (kisi) {
      if (kisi.departman && departmanlar.indexOf(kisi.departman) < 0) { departmanlar.push(kisi.departman); }
    });
    hesap.dosyalar.forEach(function (dosya) {
      if (dosya.bolum && bolumler.indexOf(dosya.bolum) < 0) { bolumler.push(dosya.bolum); }
    });
    var dDep = el('departmanlar');
    var dBol = el('bolumler');
    var dKisi = el('kisiler');
    if (dDep) { dDep.innerHTML = departmanlar.map(function (d) { return '<option value="' + B.kacis(d) + '"></option>'; }).join(''); }
    if (dBol) { dBol.innerHTML = bolumler.map(function (b) { return '<option value="' + B.kacis(b) + '"></option>'; }).join(''); }
    if (dKisi) { dKisi.innerHTML = hesap.personel.map(function (k) { return '<option value="' + B.kacis(k.adSoyad) + '"></option>'; }).join(''); }
  }

  /* ---------- Oturum ve rol arayüzü ---------- */

  function basHarfler(ad) {
    var parcalar = String(ad || '').trim().split(/\s+/).filter(function (p) { return p; });
    if (!parcalar.length) { return '?'; }
    var harf = parcalar[0].charAt(0) + (parcalar.length > 1 ? parcalar[parcalar.length - 1].charAt(0) : '');
    return harf.toLocaleUpperCase('tr-TR');
  }

  function aktifRol() {
    var o = ISG.yetki ? ISG.yetki.oturum() : null;
    return o ? { oturum: o, rol: ISG.yetki.rolTanimi(o.rol) } : null;
  }

  function sayfaIzinli(sayfa, rol) {
    if (!rol) { return false; }
    if (YONETICI_SAYFALARI[sayfa] && !rol.yonetir) { return false; }
    if (sayfa === 'onaylar' && !(rol.onaylar || rol.id === 'yetkili')) { return false; }
    return true;
  }

  function onayRozeti() {
    var kutu = el('rozetOnay');
    var menu = el('menuOnaylar');
    var bilgi = aktifRol();

    if (menu) { menu.hidden = !(bilgi && sayfaIzinli('onaylar', bilgi.rol)); }
    if (!kutu) { return; }

    var sayi = bilgi && ISG.yetki ? ISG.yetki.bekleyenSayisi() : 0;
    kutu.textContent = sayi > 99 ? '99+' : String(sayi);
    kutu.hidden = !sayi;
    kutu.title = sayi ? sayi + ' bekleyen değişiklik talebi' : '';
  }

  /* Menüyü ve kullanıcı alanını oturum rolüne göre düzenler. */
  function rolArayuzu() {
    var bilgi = aktifRol();
    Array.prototype.forEach.call(document.querySelectorAll('.menu-oge[data-sayfa]'), function (dugme) {
      var sayfa = dugme.getAttribute('data-sayfa');
      if (sayfa === 'onaylar') { return; }
      dugme.hidden = !sayfaIzinli(sayfa, bilgi && bilgi.rol);
    });

    document.body.classList.toggle('salt-okunur', !!(bilgi && bilgi.rol.id === 'goruntuleyici'));
    onayRozeti();

    /* Örnek veri ve eski veri yedeği yalnızca yöneticiye açıktır; yedek düğmesi
       bu cihazda gerçek bir yedek varsa görünür. */
    var yoneticiMi = bilgi && bilgi.rol && bilgi.rol.id === 'yonetici';
    var ornekDugme = el('ornekVeriDugme');
    if (ornekDugme) { ornekDugme.hidden = !yoneticiMi; }
    var eskiDugme = el('oncekiVeriDugme');
    if (eskiDugme) {
      eskiDugme.hidden = !(yoneticiMi && typeof D.temizlikYedegi === 'function' && D.temizlikYedegi());
    }

    if (!sayfaIzinli(aktifSayfa(), bilgi && bilgi.rol)) {
      UI.kapsam = '';
      if (String(global.location.hash || '') !== '#panel') { global.location.hash = '#panel'; }
    }
  }

  /* Alt çubuktaki kayıt durumu: yerel depolama + bulut eşitleme özeti. */
  function kayitDurumuCiz() {
    var durum = el('kayitDurumu');
    if (!durum) { return; }
    var bilgi = bulutVarMi() ? ISG.bulut.ozet() : null;
    var kalici = D.kaliciMi();
    var metin = kalici ? ((bilgi && bilgi.metin) || 'Yerel kayıt açık') : 'Kayıt yapılamıyor (gizli mod)';
    var ayrinti = !kalici
      ? 'Tarayıcı yerel depolamaya izin vermiyor; sayfayı normal pencerede açın.'
      : ((bilgi && bilgi.ayrinti) || 'Veriler bu cihazda saklanır.');
    durum.classList.toggle('hata', !kalici || !!(bilgi && bilgi.hata));
    durum.title = ayrinti;
    durum.innerHTML = '<span></span>' + B.kacis(metin);
  }

  function rozetleriGuncelle() {
    var hesap = veri();
    var dosyaOzet = ISG.dosyaOzeti(hesap.dosyalar || []);
    var sahaOzet = ISG.tespitOzeti(hesap.tespitler || []);
    [
      ['rozetDosya', dosyaOzet.gecen, 'Süresi geçen belge'],
      ['rozetSaha', sahaOzet.geciken, 'Geciken saha faaliyeti']
    ].forEach(function (satir) {
      var kutu = el(satir[0]);
      if (!kutu) { return; }
      kutu.textContent = satir[1] > 99 ? '99+' : String(satir[1]);
      kutu.hidden = !satir[1];
      kutu.title = satir[2];
    });

    var o = ISG.yetki ? ISG.yetki.oturum() : null;
    var rol = o && ISG.yetki ? ISG.yetki.rolTanimi(o.rol) : null;
    var kullanici = (o && (o.adSoyad || o.eposta)) || hesap.ayarlar.kullanici || 'Mehmet Kurt';
    var avatar = el('kullaniciAvatar');
    if (avatar) { avatar.textContent = basHarfler(kullanici); }
    var ad = el('kullaniciAd');
    if (ad) { ad.textContent = kullanici; }
    var gorev = el('kullaniciGorev');
    if (gorev) {
      gorev.textContent = (rol ? rol.ad + (o.gorev ? ' · ' + o.gorev : '') : '') || hesap.ayarlar.gorev || 'Yönetici oturumu';
    }

    onayRozeti();

    kayitDurumuCiz();
  }

  function ciz(sessiz) {
    var sayfa = aktifSayfa();
    var hesap = veri();
    var gorunum = el('gorunum');
    if (gorunum) { gorunum.innerHTML = ISG.sayfalar[sayfa](hesap); }

    var kirinti = el('kirintiSayfa');
    if (kirinti) { kirinti.textContent = SAYFA_BILGI[sayfa]; }
    document.title = SAYFA_BILGI[sayfa] + ' • İSG Takip';

    Array.prototype.forEach.call(document.querySelectorAll('.menu-oge[data-sayfa]'), function (dugme) {
      var aktif = dugme.getAttribute('data-sayfa') === sayfa;
      dugme.classList.toggle('aktif', aktif);
      if (aktif) { dugme.setAttribute('aria-current', 'page'); }
      else { dugme.removeAttribute('aria-current'); }
    });

    rozetleriGuncelle();

    var katla = el('menuKatla');
    if (katla) {
      var metin = katla.querySelector('span');
      if (metin) { metin.textContent = document.body.classList.contains('menu-kapali') ? 'Menüyü göster' : 'Menüyü gizle'; }
    }

    if (!sessiz) {
      kenariKapat();
      try { global.scrollTo({ top: 0, behavior: 'smooth' }); } catch (hata) { global.scrollTo(0, 0); }
    }

    if (sessiz && odakBilgi) {
      var kutu = document.querySelector('[data-ui="' + odakBilgi + '"]');
      if (kutu) {
        try {
          kutu.focus();
          var uzunluk = String(kutu.value || '').length;
          if (kutu.setSelectionRange) { kutu.setSelectionRange(uzunluk, uzunluk); }
        } catch (hata) { /* yok say */ }
      }
      odakBilgi = null;
    }
  }


  function cizGecikmeli() {
    if (cizZamanlayici) { global.clearTimeout(cizZamanlayici); }
    cizZamanlayici = global.setTimeout(function () { cizZamanlayici = null; ciz(true); }, 260);
  }

  /* ---------- Kenar menü ---------- */

  function kenariKapat() {
    var kenar = el('kenar');
    if (kenar) { kenar.classList.remove('acik'); }
    var perde = el('perde');
    if (perde) { perde.hidden = true; }
    var dugme = el('menuAc');
    if (dugme) { dugme.setAttribute('aria-expanded', 'false'); }
  }

  function kenariAc() {
    var kenar = el('kenar');
    if (kenar) { kenar.classList.add('acik'); }
    var perde = el('perde');
    if (perde) { perde.hidden = false; }
    var dugme = el('menuAc');
    if (dugme) { dugme.setAttribute('aria-expanded', 'true'); }
  }

  function menuDurumu(acik) {
    document.body.classList.toggle('menu-kapali', !acik);
    var katla = el('menuKatla');
    if (katla) {
      var metin = katla.querySelector('span');
      if (metin) { metin.textContent = acik ? 'Menüyü gizle' : 'Menüyü göster'; }
      katla.setAttribute('aria-expanded', acik ? 'true' : 'false');
    }
    try { global.localStorage.setItem('isgtakip.menu', acik ? 'acik' : 'kapali'); } catch (hata) { /* yok say */ }
  }

  /* ---------- İşyeri / kurum ---------- */

  function isyeriAc(id, varsayilanIsyeri) {
    var form = el('isyeriForm');
    var kayit = id ? veri().isyerleri.filter(function (i) { return i.id === id; })[0] : null;
    form.reset();
    uyariGoster('isyeriUyari', '');
    form.elements.id.value = kayit ? kayit.id : '';
    el('isyeriBaslik').textContent = kayit ? 'İşyerini düzenle' : 'Yeni işyeri';
    if (kayit) {
      ['ad', 'tehlikeSinifi', 'calisanSayisi', 'sgkSicil', 'yetkili', 'adres', 'sektor'].forEach(function (alan) {
        if (form.elements[alan]) { form.elements[alan].value = kayit[alan] || ''; }
      });
      form.elements.ana.checked = !!kayit.ana;
    } else {
      form.elements.tehlikeSinifi.value = 'tehlikeli';
      form.elements.calisanSayisi.value = '0';
      if (varsayilanIsyeri) { form.elements.ana.checked = false; }
    }
    diyalogAc(el('isyeriDiyalog'), form.elements.ad);
  }

  function kurumAc() {
    var form = el('kurumForm');
    form.reset();
    uyariGoster('kurumUyari', '');
    form.elements.kurum.value = veri().ayarlar.kurum || '';
    diyalogAc(el('kurumDiyalog'), form.elements.kurum);
  }

  /* ---------- Personel / eğitim ---------- */

  function personelAc(id, isyeriId) {
    var form = el('personelForm');
    var hesap = veri();
    var kayit = id ? hesap.personel.filter(function (p) { return p.id === id; })[0] : null;
    form.reset();
    uyariGoster('personelUyari', '');
    el('personelIsyeri').innerHTML = isyeriSecenekleri(kayit ? kayit.isyeriId : (isyeriId || UI.kapsam || (hesap.isyerleri[0] || {}).id));
    form.elements.id.value = kayit ? kayit.id : '';
    el('personelBaslik').textContent = kayit ? 'Personeli düzenle' : 'Yeni personel';

    if (kayit) {
      ['adSoyad', 'sicil', 'tc', 'meslek', 'departman', 'grupKodu', 'sube', 'iseBaslama', 'telefon', 'cinsiyet', 'durum'].forEach(function (alan) {
        if (form.elements[alan]) { form.elements[alan].value = kayit[alan] || ''; }
      });
    } else {
      var seciliIsyeri = form.elements.isyeriId.value;
      form.elements.sicil.value = String(hesap.personel.filter(function (p) { return p.isyeriId === seciliIsyeri; }).length + 1);
      form.elements.durum.value = 'aktif';
      form.elements.iseBaslama.value = B.bugunIso();
    }
    diyalogAc(el('personelDiyalog'), form.elements.adSoyad);
  }

  function egitimSecenekleri(secili) {
    var liste = veri().personel.slice().sort(function (a, b) { return a.adSoyad.localeCompare(b.adSoyad, 'tr'); });
    return '<option value="">Seçiniz…</option>' + liste.map(function (kisi) {
      var pasif = kisi.durum === 'aktif' ? '' : ' (pasif)';
      return '<option value="' + B.kacis(kisi.id) + '"' + (kisi.id === secili ? ' selected' : '') + '>' +
        B.kacis(kisi.adSoyad + pasif) + '</option>';
    }).join('');
  }

  function egitimOnizleme(saatSifirla) {
    var form = el('egitimForm');
    if (!form) { return; }
    var hesap = veri();
    var kisi = hesap.personel.filter(function (p) { return p.id === form.elements.personelId.value; })[0];
    var isyeri = kisi ? ISG.isyeriBul(hesap, kisi.isyeriId) : null;
    var tur = ISG.egitimTuru(form.elements.tur.value);
    var tarih = form.elements.tarih.value;
    var gecerlilik = tarih ? ISG.egitimGecerlilik(form.elements.tur.value, isyeri ? isyeri.tehlikeSinifi : 'tehlikeli', tarih) : '';
    form.elements.gecerlilik.value = gecerlilik ? B.tarih(gecerlilik) : '';

    var sinif = isyeri ? ISG.RISK_SINIFLARI[isyeri.tehlikeSinifi] : null;
    if (saatSifirla && !form.elements.sureSaat.value) {
      form.elements.sureSaat.value = tur.saat || (sinif ? sinif.temelSaat : 8);
    }
    var ipucu = el('egitimIpucu');
    if (ipucu) {
      var parcalar = [tur.not || ''];
      if (sinif && !tur.saat) { parcalar.push(kisi.adSoyad + ' için ' + sinif.temelSaat + ' saat'); }
      if (gecerlilik) { parcalar.push('Geçerlilik bitişi: ' + B.tarih(gecerlilik)); }
      ipucu.textContent = parcalar.filter(Boolean).join(' • ');
    }
  }

  function egitimAc(id, personelId) {
    var form = el('egitimForm');
    var hesap = veri();
    var kayit = id ? hesap.egitimler.filter(function (e) { return e.id === id; })[0] : null;
    form.reset();
    uyariGoster('egitimUyari', '');
    el('egitimPersonel').innerHTML = egitimSecenekleri(kayit ? kayit.personelId : personelId);
    el('egitimTur').innerHTML = ISG.EGITIM_TURLERI.map(function (tur) {
      return '<option value="' + tur.id + '">' + B.kacis(tur.ad) + '</option>';
    }).join('');
    form.elements.id.value = kayit ? kayit.id : '';
    el('egitimBaslik').textContent = kayit ? 'Eğitim kaydını düzenle' : 'Yeni eğitim';

    if (kayit) {
      form.elements.tur.value = kayit.tur;
      form.elements.tarih.value = kayit.tarih || '';
      form.elements.sureSaat.value = kayit.sureSaat || '';
      form.elements.egitmen.value = kayit.egitmen || '';
    } else {
      form.elements.tarih.value = B.bugunIso();
      form.elements.sureSaat.value = '';
    }
    egitimOnizleme(!kayit);
    diyalogAc(el('egitimDiyalog'), form.elements.personelId);
  }

  /* ---------- Dosya maddesi / plan / saha ---------- */

  function dosyaAc(id, isyeriId) {
    var form = el('dosyaForm');
    var hesap = veri();
    var kayit = id ? hesap.dosyalar.filter(function (d) { return d.id === id; })[0] : null;
    form.reset();
    bekleyenBelgeler = [];
    uyariGoster('dosyaUyari', '');
    el('dosyaIsyeri').innerHTML = isyeriSecenekleri(kayit ? kayit.isyeriId : (isyeriId || UI.kapsam || (hesap.isyerleri[0] || {}).id));
    form.elements.id.value = kayit ? kayit.id : '';
    el('dosyaBaslik').textContent = kayit ? 'Kontrol maddesini düzenle' : 'Yeni kontrol maddesi';
    if (kayit) {
      ['madde', 'bolum', 'durum', 'sorumlu', 'yenileme', 'kontrolTarihi', 'aciklama'].forEach(function (alan) {
        if (form.elements[alan]) { form.elements[alan].value = kayit[alan] || ''; }
      });
    } else {
      form.elements.durum.value = 'incelenmedi';
    }
    belgeleriCiz(kayit ? kayit.id : '');
    diyalogAc(el('dosyaDiyalog'), form.elements.madde);
  }

  /* ---------- Dosya belgeleri (ekler) ---------- */

  function belgeListesi(dosyaId) {
    return dosyaId ? D.belgeler(dosyaId) : bekleyenBelgeler;
  }

  function belgeBulucu(id) {
    return D.belgeBul(id) ||
      bekleyenBelgeler.filter(function (belge) { return belge.id === id; })[0] || null;
  }

  function belgeSatiriHtml(belge, ekNotu) {
    return '<div class="belge-satir">' +
      '<span class="belge-simge">' + B.ikon('i-bos') + '</span>' +
      '<span class="belge-bilgi">' +
        '<strong title="' + B.kacis(belge.ad) + '">' + B.kacis(belge.ad) + '</strong>' +
        '<small>' + B.boyut(belge.boyut) + ' · ' + B.tarih(belge.tarih) + (ekNotu || '') + '</small>' +
      '</span>' +
      '<span class="belge-eylem">' +
        '<button type="button" class="dugme simge" data-islem="ek-goruntule" data-id="' + B.kacis(belge.id) + '" title="Belgeyi görüntüle" aria-label="Belgeyi görüntüle">' +
          B.ikon('i-eye') + '</button>' +
        '<button type="button" class="dugme simge" data-islem="belge-indir" data-id="' + B.kacis(belge.id) + '" title="Belgeyi indir" aria-label="Belgeyi indir">' +
          B.ikon('i-download') + '</button>' +
        '<button type="button" class="dugme simge tehlike" data-islem="belge-sil" data-id="' + B.kacis(belge.id) + '" title="Belgeyi kaldır" aria-label="Belgeyi kaldır">' +
          B.ikon('i-trash') + '</button>' +
      '</span>' +
      '</div>';
  }

  function belgeleriCiz(dosyaId) {
    var kap = el('dosyaBelgeListe');
    if (!kap) { return; }
    var liste = belgeListesi(dosyaId);
    var toplam = liste.reduce(function (toplamBoyut, belge) { return toplamBoyut + (Number(belge.boyut) || 0); }, 0);
    var ozet = el('dosyaBelgeOzet');
    if (ozet) {
      ozet.textContent = liste.length
        ? liste.length + ' belge · ' + B.boyut(toplam)
        : (dosyaId ? 'Bu maddeye henüz belge eklenmedi' : 'Henüz belge seçilmedi');
    }
    if (!liste.length) {
      kap.innerHTML = '<p class="belge-bos">' + (dosyaId
        ? 'Belge yüklemek için “Belge yükle” düğmesini kullanın.'
        : 'Belge seçebilirsiniz; madde kaydedildiğinde yüklenecek.') + '</p>';
      return;
    }
    kap.innerHTML = liste.map(function (belge) {
      return belgeSatiriHtml(belge, belge.dosyaId ? '' : ' · kayıtla birlikte yüklenecek');
    }).join('');
  }

  /* Risk değerlendirmesi ve acil durum planı ekleri işyerine bağlıdır;
     yükleme anında kaydedilir ve sayfadaki kartlarda da listelenir. */
  function eklerCiz(kaynak, kaynakId, listeId, ozetId) {
    var kap = el(listeId);
    if (!kap) { return; }
    var liste = D.ekler(kaynak, kaynakId);
    var toplam = liste.reduce(function (toplamBoyut, belge) { return toplamBoyut + (Number(belge.boyut) || 0); }, 0);
    var ozet = el(ozetId);
    if (ozet) {
      ozet.textContent = liste.length
        ? liste.length + ' belge · ' + B.boyut(toplam)
        : 'Henüz belge eklenmedi';
    }
    kap.innerHTML = liste.length
      ? liste.map(function (belge) { return belgeSatiriHtml(belge); }).join('')
      : '<p class="belge-bos">Belge yüklemek için “Belge yükle” düğmesini kullanın.</p>';
  }

  function ekYukle(kaynak, kaynakId, secilen, listeId, ozetId) {
    if (!kaynakId) {
      B.bildir('Belge eklemek için önce işyeri seçilmelidir.', 'hata');
      return;
    }
    if (!secilen.size) {
      B.bildir('Boş dosya yüklenemez.', 'hata');
      return;
    }
    if (secilen.size > ISG.BELGE_SINIRI) {
      B.bildir('Belge en fazla ' + B.boyut(ISG.BELGE_SINIRI) + ' olabilir. Seçilen: ' + B.boyut(secilen.size), 'hata');
      return;
    }
    var okuyucu = new FileReader();
    okuyucu.onload = function () {
      try {
        D.ekKaydet({
          kaynak: kaynak,
          kaynakId: kaynakId,
          isyeriId: kaynakId,
          ad: secilen.name,
          boyut: secilen.size,
          tur: secilen.type || 'application/octet-stream',
          tarih: B.bugunIso(),
          icerik: String(okuyucu.result || '')
        });
      } catch (hata) {
        B.bildir(hata.message, 'hata');
        return;
      }
      eklerCiz(kaynak, kaynakId, listeId, ozetId);
      B.bildir('Belge yüklendi.', 'basari');
      ciz(true);
    };
    okuyucu.onerror = function () { B.bildir('Belge okunamadı.', 'hata'); };
    okuyucu.readAsDataURL(secilen);
  }

  function belgeYukle(secilen) {
    var form = el('dosyaForm');
    var dosyaId = form ? form.elements.id.value : '';
    if (!secilen.size) {
      B.bildir('Boş dosya yüklenemez.', 'hata');
      return;
    }
    if (secilen.size > ISG.BELGE_SINIRI) {
      B.bildir('Belge en fazla ' + B.boyut(ISG.BELGE_SINIRI) + ' olabilir. Seçilen: ' + B.boyut(secilen.size), 'hata');
      return;
    }
    var okuyucu = new FileReader();
    okuyucu.onload = function () {
      var kayit = {
        id: '',
        dosyaId: dosyaId,
        isyeriId: form ? form.elements.isyeriId.value : '',
        ad: secilen.name,
        boyut: secilen.size,
        tur: secilen.type || 'application/octet-stream',
        tarih: B.bugunIso(),
        icerik: String(okuyucu.result || '')
      };
      if (!dosyaId) {
        kayit.id = ISG.yeniId('bl');
        bekleyenBelgeler.push(kayit);
        belgeleriCiz('');
        B.bildir('Belge seçildi, madde kaydedilince yüklenecek.');
        return;
      }
      try {
        D.belgeKaydet(kayit);
      } catch (hata) {
        B.bildir(hata.message, 'hata');
        return;
      }
      belgeleriCiz(dosyaId);
      B.bildir('Belge yüklendi.', 'basari');
      ciz(true);
    };
    okuyucu.onerror = function () { B.bildir('Belge okunamadı.', 'hata'); };
    okuyucu.readAsDataURL(secilen);
  }

  function belgeIndir(id) {
    var belge = belgeBulucu(id);
    if (!belge || !belge.icerik) {
      B.bildir('Belge içeriği bulunamadı.', 'hata');
      return;
    }
    var bag = document.createElement('a');
    bag.href = belge.icerik;
    bag.download = belge.ad;
    document.body.appendChild(bag);
    bag.click();
    document.body.removeChild(bag);
  }

  /* Base64 veri adresini blob adresine çevirip yeni sekmede açar.
     Tarayıcı yeni sekme açmaya izin vermezse dosya indirilir. */
  function veriAdresindenBlob(icerik) {
    var metin = String(icerik || '');
    var virgul = metin.indexOf(',');
    if (virgul < 0) { return null; }
    var baslik = metin.slice(0, virgul);
    if (!/;base64$/i.test(baslik)) { return null; }
    if (!global.atob || !global.Blob) { return null; }
    var tur = (baslik.match(/^data:([^;]+)/) || [])[1] || 'application/octet-stream';
    var ikili = global.atob(metin.slice(virgul + 1));
    var baytlar = new Uint8Array(ikili.length);
    for (var i = 0; i < ikili.length; i += 1) { baytlar[i] = ikili.charCodeAt(i); }
    return new global.Blob([baytlar], { type: tur });
  }

  function ekGoruntule(id) {
    var belge = belgeBulucu(id);
    if (!belge || !belge.icerik) {
      B.bildir('Belge içeriği bulunamadı.', 'hata');
      return;
    }
    var adres = '';
    try {
      var blob = veriAdresindenBlob(belge.icerik);
      if (blob && global.URL && typeof global.URL.createObjectURL === 'function') {
        adres = global.URL.createObjectURL(blob);
      }
    } catch (hata) {
      adres = '';
    }
    if (!adres) {
      B.bildir('Bu belge tarayıcıda görüntülenemiyor; indirme başlatıldı.');
      belgeIndir(id);
      return;
    }
    var pencere = null;
    try { pencere = global.open(adres, '_blank', 'noopener'); } catch (hata) { pencere = null; }
    if (!pencere) {
      try { global.URL.revokeObjectURL(adres); } catch (hata) { /* yok say */ }
      B.bildir('Yeni sekme açılamadı; belge indiriliyor.');
      belgeIndir(id);
      return;
    }
    global.setTimeout(function () {
      try { global.URL.revokeObjectURL(adres); } catch (hata) { /* yok say */ }
    }, 60000);
  }

  function belgeKaldir(id) {
    var belge = belgeBulucu(id);
    if (!belge) { return; }
    var form = el('dosyaForm');
    var dosyaId = belge.dosyaId || (form ? form.elements.id.value : '');
    var kaynak = belge.kaynak || 'dosya';
    onayIste('Belge kaldırılsın mı?',
      '"' + belge.ad + '" belgesi bu kayıttan kaldırılacak.',
      function () {
        if (D.belgeBul(id)) {
          D.ekSil(id);
        } else {
          bekleyenBelgeler = bekleyenBelgeler.filter(function (kayit) { return kayit.id !== id; });
        }
        if (kaynak === 'risk' || kaynak === 'acil') {
          eklerCiz(kaynak, belge.kaynakId || belge.isyeriId,
            kaynak === 'risk' ? 'riskEkipBelgeListe' : 'acilPlanBelgeListe',
            kaynak === 'risk' ? 'riskEkipBelgeOzet' : 'acilPlanBelgeOzet');
        } else {
          belgeleriCiz(dosyaId);
        }
        B.bildir('Belge kaldırıldı.', 'basari');
        ciz(true);
      }, 'Kaldır');
  }

  function planAc(id, isyeriId) {
    var form = el('planForm');
    var hesap = veri();
    var kayit = id ? hesap.planlar.filter(function (p) { return p.id === id; })[0] : null;
    form.reset();
    uyariGoster('planUyari', '');
    el('planIsyeri').innerHTML = isyeriSecenekleri(kayit ? kayit.isyeriId : (isyeriId || UI.kapsam || (hesap.isyerleri[0] || {}).id));
    form.elements.id.value = kayit ? kayit.id : '';
    el('planBaslik').textContent = kayit ? 'Plan faaliyetini düzenle' : 'Yeni plan faaliyeti';
    if (kayit) {
      ['faaliyet', 'sorumlu', 'takipTarihi', 'durum', 'aciklama'].forEach(function (alan) {
        if (form.elements[alan]) { form.elements[alan].value = kayit[alan] || ''; }
      });
    } else {
      form.elements.durum.value = 'takvimde';
      form.elements.takipTarihi.value = B.bugunIso();
    }
    diyalogAc(el('planDiyalog'), form.elements.faaliyet);
  }

  function tespitAc(id, isyeriId) {
    var form = el('tespitForm');
    var hesap = veri();
    var kayit = id ? hesap.tespitler.filter(function (t) { return t.id === id; })[0] : null;
    form.reset();
    uyariGoster('tespitUyari', '');
    el('tespitIsyeri').innerHTML = isyeriSecenekleri(kayit ? kayit.isyeriId : (isyeriId || UI.kapsam || (hesap.isyerleri[0] || {}).id));
    form.elements.id.value = kayit ? kayit.id : '';
    el('tespitBaslik').textContent = kayit ? 'Saha tespitini düzenle' : 'Yeni tespit';
    if (kayit) {
      ['tespit', 'konum', 'sorumlu', 'oncelik', 'tur', 'termin', 'durum', 'not'].forEach(function (alan) {
        if (form.elements[alan]) { form.elements[alan].value = kayit[alan] || ''; }
      });
    } else {
      form.elements.oncelik.value = 'orta';
      form.elements.tur.value = 'Uygunsuzluk';
      form.elements.durum.value = 'acik';
      form.elements.termin.value = B.bugunIso();
    }
    diyalogAc(el('tespitDiyalog'), form.elements.tespit);
  }

  /* ---------- İş kazası bildirimi ---------- */

  function kazaSecenekDoldur(selectId, liste, secili, bosEtiket) {
    var select = el(selectId);
    if (!select) { return; }
    var html = '<option value="">' + B.kacis(bosEtiket) + '</option>';
    (liste || []).forEach(function (oge) {
      html += '<option value="' + B.kacis(oge.id) + '"' + (oge.id === secili ? ' selected' : '') + '>' + B.kacis(oge.ad) + '</option>';
    });
    select.innerHTML = html;
  }

  function kazaPersonelDoldur(isyeriId, secili) {
    var hesap = veri();
    var liste = (hesap.personel || []).filter(function (kisi) { return !isyeriId || kisi.isyeriId === isyeriId; })
      .map(function (kisi) {
        var etiket = kisi.adSoyad;
        if (kisi.sicil) { etiket += ' · Sicil ' + kisi.sicil; }
        if (kisi.meslek) { etiket += ' · ' + kisi.meslek; }
        return { id: kisi.id, ad: etiket };
      });
    kazaSecenekDoldur('kazaPersonel', liste, secili, 'Personel seçilmedi');
  }

  /* Seçilen personelin sicil/departman/kıdem bilgisini personel listesinden özetler. */
  function kazaPersonelOzet(kisiId) {
    var kutu = el('kazaPersonelOzet');
    if (!kutu) { return; }
    var hesap = veri();
    var kisi = (hesap.personel || []).filter(function (p) { return p.id === kisiId; })[0];
    if (!kisi) {
      kutu.hidden = true;
      kutu.textContent = '';
      return;
    }
    var parcalar = [];
    if (kisi.sicil) { parcalar.push('Sicil ' + kisi.sicil); }
    if (kisi.departman) { parcalar.push(kisi.departman); }
    if (kisi.meslek) { parcalar.push(kisi.meslek); }
    if (kisi.sube) { parcalar.push(kisi.sube); }
    if (kisi.iseBaslama) { parcalar.push('İşe başlama ' + B.tarih(kisi.iseBaslama)); }
    kutu.textContent = kisi.adSoyad + (parcalar.length ? ' · ' + parcalar.join(' · ') : '');
    kutu.hidden = false;
  }

  /* Kayıt türüne göre form başlığını, alan etiketlerini ve türe özel alanları uyarlar. */
  function kazaTurUygula(form) {
    if (!form || !form.elements.tur) { return; }
    var hastalik = form.elements.tur.value === 'meslekHastaligi';
    var duzenleme = !!form.elements.id.value;
    var etiketler = hastalik ? {
      ust: 'MESLEK HASTALIĞI BİLDİRİMİ',
      baslik: duzenleme ? 'Meslek hastalığı kaydını düzenle' : 'Meslek hastalığı bildir',
      tarih: 'Tanı tarihi *',
      personel: 'Hastalanan personel',
      yer: 'Maruziyet yeri',
      bolge: 'Etkilenen vücut bölgesi',
      yaralanma: 'Tanı türü',
      siddet: 'Hastalık şiddeti',
      sevk: 'Sağlık kuruluşuna sevk',
      aciklama: 'Tanı açıklaması *',
      neden: 'Maruziyet nedeni'
    } : {
      ust: 'İŞ KAZASI BİLDİRİMİ',
      baslik: duzenleme ? 'İş kazası kaydını düzenle' : 'İş kazası bildir',
      tarih: 'Kaza tarihi *',
      personel: 'Yaralanan personel',
      yer: 'Kazanın olduğu yer',
      bolge: 'Vücut bölgesi',
      yaralanma: 'Yaralanma türü',
      siddet: 'Yaralanma şiddeti',
      sevk: 'Hastane sevk',
      aciklama: 'Olay açıklaması *',
      neden: 'Kök neden sınıfı'
    };

    var etiketAlanlari = {
      kazaUstYazi: 'ust', kazaBaslik: 'baslik', kazaTarihEtiket: 'tarih', kazaPersonelEtiket: 'personel',
      kazaYerEtiket: 'yer', kazaBolgeEtiket: 'bolge', kazaYaralanmaEtiket: 'yaralanma', kazaSiddetEtiket: 'siddet',
      kazaSevkEtiket: 'sevk', kazaAciklamaEtiket: 'aciklama', kazaNedenEtiket: 'neden'
    };
    Object.keys(etiketAlanlari).forEach(function (id) {
      var dugum = el(id);
      if (dugum) { dugum.textContent = etiketler[etiketAlanlari[id]]; }
    });

    ['kazaHastalikGrupAlan', 'kazaEtkenAlan'].forEach(function (id) {
      var alan = el(id);
      if (alan) { alan.hidden = !hastalik; }
    });
    if (!hastalik) {
      if (form.elements.hastalikGrubu) { form.elements.hastalikGrubu.value = ''; }
      if (form.elements.etken) { form.elements.etken.value = ''; }
    }

    var yaralanma = el('kazaYaralanma');
    if (yaralanma) {
      var secili = yaralanma.value;
      kazaSecenekDoldur('kazaYaralanma', hastalik ? ISG.HASTALIK_TURLERI : ISG.YARALANMA_TURLERI, secili, 'Belirtilmedi');
    }
  }

  function kazaAc(id, isyeriId, tur) {
    var form = el('kazaForm');
    if (!form) { return; }
    var hesap = veri();
    var kayit = id ? (hesap.olaylar || []).filter(function (o) { return o.id === id; })[0] : null;
    var seciliIsyeri = kayit ? kayit.isyeriId : (isyeriId || UI.kapsam || (hesap.isyerleri[0] || {}).id || '');
    var kayitTuru = kayit ? (kayit.tur === 'meslekHastaligi' ? 'meslekHastaligi' : 'isKazasi')
      : (tur === 'meslekHastaligi' ? 'meslekHastaligi' : 'isKazasi');
    form.reset();
    uyariGoster('kazaUyari', '');
    form.elements.id.value = kayit ? kayit.id : '';
    form.elements.tur.value = kayitTuru;
    el('kazaIsyeri').innerHTML = isyeriSecenekleri(seciliIsyeri);
    kazaSecenekDoldur('kazaBolge', ISG.YARALANMA_BOLGELERI, kayit ? kayit.vucutBolgesi : '', 'Belirtilmedi');
    kazaSecenekDoldur('kazaNeden', ISG.KAZA_NEDENLERI, kayit ? kayit.neden : '', 'Belirtilmedi');
    kazaSecenekDoldur('kazaSiddet', ISG.KAZA_SIDDETLERI, kayit ? kayit.siddet : '', 'Belirtilmedi');
    kazaSecenekDoldur('kazaVardiya', ISG.VARDIYALAR, kayit ? kayit.vardiya : '', 'Belirtilmedi');
    kazaSecenekDoldur('kazaSevk', ISG.EVET_HAYIR, kayit ? kayit.hastaneSevk : '', 'Belirtilmedi');
    kazaSecenekDoldur('kazaHastalikGrup', ISG.MESLEK_HASTALIK_GRUPLARI, kayit ? kayit.hastalikGrubu : '', 'Belirtilmedi');
    kazaPersonelDoldur(seciliIsyeri, kayit ? kayit.personelId : '');
    kazaPersonelOzet(kayit ? kayit.personelId : '');
    kazaTurUygula(form);
    form.elements.yaralanmaTuru.value = kayit ? (kayit.yaralanmaTuru || '') : '';
    if (kayit) {
      form.elements.etken.value = kayit.etken || '';
      form.elements.tarih.value = kayit.tarih || '';
      form.elements.yer.value = kayit.yer || '';
      form.elements.aciklama.value = kayit.aciklama || '';
      form.elements.kokNeden.value = kayit.kokNeden || '';
      form.elements.istirahatBaslangic.value = kayit.istirahatBaslangic || '';
      form.elements.istirahatBitis.value = kayit.istirahatBitis || '';
      form.elements.kayipGun.value = ISG.kazaKayipGun(kayit);
      form.elements.saglikKurulusu.value = kayit.saglikKurulusu || '';
      form.elements.durum.value = kayit.durum === 'kapali' ? 'kapali' : 'acik';
    } else {
      form.elements.tarih.value = B.bugunIso();
      form.elements.kayipGun.value = 0;
      form.elements.durum.value = 'acik';
    }
    diyalogAc(el('kazaDiyalog'), form.elements.tarih);
  }

  /* Şiddet sınıfı ve istirahat tarihlerine göre kayıp iş günü alanını tazeler. */
  function kazaKayipGunTazele(form) {
    if (!form || !form.elements.kayipGun) { return; }
    form.elements.kayipGun.value = ISG.kazaKayipGun({
      siddet: form.elements.siddet ? form.elements.siddet.value : '',
      istirahatBaslangic: form.elements.istirahatBaslangic ? form.elements.istirahatBaslangic.value : '',
      istirahatBitis: form.elements.istirahatBitis ? form.elements.istirahatBitis.value : '',
      kayipGun: form.elements.kayipGun.value
    });
  }

  function kazaFormuBagla() {
    var isyeriSecim = el('kazaIsyeri');
    if (isyeriSecim) {
      isyeriSecim.addEventListener('change', function () {
        kazaPersonelDoldur(this.value, '');
        kazaPersonelOzet('');
      });
    }
    var kisiSecim = el('kazaPersonel');
    if (kisiSecim) {
      kisiSecim.addEventListener('change', function () { kazaPersonelOzet(this.value); });
    }
    var kazaForm = el('kazaForm');
    if (kazaForm) {
      ['siddet', 'istirahatBaslangic', 'istirahatBitis'].forEach(function (alan) {
        if (!kazaForm.elements[alan]) { return; }
        kazaForm.elements[alan].addEventListener('change', function () { kazaKayipGunTazele(kazaForm); });
      });
      if (kazaForm.elements.tur) {
        kazaForm.elements.tur.addEventListener('change', function () { kazaTurUygula(kazaForm); });
      }
    }
    formuBagla('kazaForm', function (form) {
      var veriForm = formVerisi(form);
      var tur = veriForm.tur === 'meslekHastaligi' ? 'meslekHastaligi' : 'isKazasi';
      var hastalik = tur === 'meslekHastaligi';
      if (!veriForm.tarih) {
        uyariGoster('kazaUyari', (hastalik ? 'Tanı tarihi' : 'Kaza tarihi') + ' zorunlu.');
        return;
      }
      if (!veriForm.isyeriId) { uyariGoster('kazaUyari', 'İşyeri seçilmeli.'); return; }
      if (!veriForm.aciklama) {
        uyariGoster('kazaUyari', hastalik ? 'Tanı açıklaması zorunlu.' : 'Olay açıklaması zorunlu.');
        return;
      }
      if (veriForm.istirahatBaslangic && veriForm.istirahatBitis &&
        veriForm.istirahatBitis < veriForm.istirahatBaslangic) {
        uyariGoster('kazaUyari', 'İstirahat bitiş tarihi başlangıçtan önce olamaz.');
        return;
      }
      D.olayKaydet({
        id: veriForm.id || '',
        isyeriId: veriForm.isyeriId,
        tur: tur,
        tarih: veriForm.tarih,
        yer: veriForm.yer || '',
        personelId: veriForm.personelId || '',
        aciklama: veriForm.aciklama,
        neden: veriForm.neden || '',
        kokNeden: veriForm.kokNeden || '',
        vucutBolgesi: veriForm.vucutBolgesi || '',
        yaralanmaTuru: veriForm.yaralanmaTuru || '',
        siddet: veriForm.siddet || '',
        vardiya: veriForm.vardiya || '',
        hastaneSevk: veriForm.hastaneSevk || '',
        istirahatBaslangic: veriForm.istirahatBaslangic || '',
        istirahatBitis: veriForm.istirahatBitis || '',
        kayipGun: ISG.kazaKayipGun({
          siddet: veriForm.siddet || '',
          istirahatBaslangic: veriForm.istirahatBaslangic || '',
          istirahatBitis: veriForm.istirahatBitis || '',
          kayipGun: veriForm.kayipGun
        }),
        saglikKurulusu: veriForm.saglikKurulusu || '',
        hastalikGrubu: hastalik ? (veriForm.hastalikGrubu || '') : '',
        etken: hastalik ? (veriForm.etken || '') : '',
        durum: veriForm.durum === 'kapali' ? 'kapali' : 'acik'
      });
      diyalogKapat(el('kazaDiyalog'));
      B.bildir(ISG.kazaKaydiAdi({ tur: tur }) + ' kaydedildi.', 'basari');
      ciz();
    });
  }

  /* ---------- Risk ekibi / acil durum ---------- */

  function riskEkipAc(isyeriId) {
    var form = el('riskEkipForm');
    var hesap = veri();
    var kayit = ISG.ilgiliKayit(hesap, 'riskEkipleri', isyeriId);
    var isyeri = ISG.isyeriBul(hesap, isyeriId);
    form.reset();
    uyariGoster('riskEkipUyari', '');
    form.elements.isyeriId.value = isyeriId;
    el('riskEkipBaslik').textContent = (isyeri ? isyeri.ad : 'Risk değerlendirmesi') + ' · ekip';
    form.elements.sonDegerlendirme.value = (kayit && kayit.sonDegerlendirme) || '';
    form.elements.enGecYenileme.value = (kayit && kayit.enGecYenileme) || '';
    var uyeler = (kayit && kayit.uyeler) || {};
    ISG.RISK_ROLLERI.forEach(function (rol) {
      if (form.elements[rol.id]) { form.elements[rol.id].value = uyeler[rol.id] || ''; }
    });
    eklerCiz('risk', isyeriId, 'riskEkipBelgeListe', 'riskEkipBelgeOzet');
    diyalogAc(el('riskEkipDiyalog'), form.elements.sonDegerlendirme);
  }

  function acilPlanAc(isyeriId) {
    var form = el('acilPlanForm');
    var hesap = veri();
    var kayit = ISG.ilgiliKayit(hesap, 'acilPlanlar', isyeriId);
    var isyeri = ISG.isyeriBul(hesap, isyeriId);
    form.reset();
    uyariGoster('acilUyari', '');
    form.elements.isyeriId.value = isyeriId;
    el('acilPlanBaslik').textContent = (isyeri ? isyeri.ad : 'Acil durum planı') + ' · plan kaydı';
    if (kayit) {
      form.elements.hazirlanma.value = kayit.hazirlanma || '';
      form.elements.sonYenileme.value = kayit.sonYenileme || '';
      form.elements.tatbikat.value = kayit.tatbikat || '';
      (kayit.ekip || []).forEach(function (uye) {
        var alan = { 'Acil durum koordinatörü': 'ekip_koordinator', 'Yangın söndürme ekibi': 'ekip_yangin', 'İlk yardım ekibi': 'ekip_ilkyardim', 'Tahliye / arama kurtarma': 'ekip_tahliye' }[uye.rol];
        if (alan && form.elements[alan]) { form.elements[alan].value = uye.ad || ''; }
      });
    }
    eklerCiz('acil', isyeriId, 'acilPlanBelgeListe', 'acilPlanBelgeOzet');
    diyalogAc(el('acilPlanDiyalog'), form.elements.hazirlanma);
  }

  /* ---------- Ekip üyesi ekleme ---------- */

  function rolEtiketi(kaynak, deger) {
    var roller = kaynak === 'acil' ? ISG.ACIL_ROLLERI : ISG.RISK_ROLLERI;
    var bulunan = roller.filter(function (rol) {
      return (kaynak === 'acil' ? rol.ad : rol.id) === deger;
    })[0];
    return bulunan ? bulunan.ad : deger;
  }

  function ekipUyeMevcut(kaynak, isyeriId, rol) {
    var hesap = veri();
    if (kaynak === 'acil') {
      var plan = ISG.ilgiliKayit(hesap, 'acilPlanlar', isyeriId);
      var uye = ((plan && plan.ekip) || []).filter(function (k) { return k.rol === rol; })[0];
      return uye || null;
    }
    var kayit = ISG.ilgiliKayit(hesap, 'riskEkipleri', isyeriId);
    var ad = (kayit && kayit.uyeler && kayit.uyeler[rol]) || '';
    if (!ad) { return null; }
    return { rol: rol, ad: ad, personelId: ((kayit.uyeIdleri || {})[rol]) || '' };
  }

  function ekipUyeAc(kaynak, isyeriId, rol) {
    var form = el('ekipUyeForm');
    if (!form) { return; }
    var hesap = veri();
    kaynak = kaynak === 'acil' ? 'acil' : 'risk';
    isyeriId = isyeriId || UI.kapsam || ((hesap.isyerleri[0] || {}).id || '');
    var isyeri = ISG.isyeriBul(hesap, isyeriId);
    var roller = kaynak === 'acil' ? ISG.ACIL_ROLLERI : ISG.RISK_ROLLERI;
    form.reset();
    uyariGoster('ekipUyeUyari', '');
    form.elements.kaynak.value = kaynak;
    form.elements.isyeriId.value = isyeriId;
    form.elements.rol.innerHTML = roller.map(function (r) {
      var deger = kaynak === 'acil' ? r.ad : r.id;
      return '<option value="' + B.kacis(deger) + '">' + B.kacis(r.ad) + '</option>';
    }).join('');
    var secili = rol || (kaynak === 'acil' ? roller[0].ad : roller[0].id);
    form.elements.rol.value = secili;

    var kisiler = hesap.personel.filter(function (k) { return k.isyeriId === isyeriId; })
      .sort(function (a, b) { return String(a.adSoyad).localeCompare(String(b.adSoyad), 'tr'); });
    form.elements.personelId.innerHTML = '<option value="">Listeden seçin (isteğe bağlı)</option>' +
      kisiler.map(function (k) {
        return '<option value="' + B.kacis(k.id) + '">' + B.kacis(k.adSoyad) +
          (k.meslek ? ' · ' + B.kacis(k.meslek) : '') + '</option>';
      }).join('');

    var mevcut = ekipUyeMevcut(kaynak, isyeriId, secili);
    form.elements.ad.value = mevcut ? mevcut.ad : '';
    if (mevcut && mevcut.personelId) { form.elements.personelId.value = mevcut.personelId; }

    el('ekipUyeUst').textContent = kaynak === 'acil' ? 'ACİL DURUM PLANI' : 'RİSK DEĞERLENDİRMESİ';
    el('ekipUyeBaslik').textContent = (isyeri ? isyeri.ad : 'Ekip') + ' · ' + rolEtiketi(kaynak, secili);
    diyalogAc(el('ekipUyeDiyalog'), form.elements.rol);
  }

  function ekipUyeSilOnay(kaynak, isyeriId, rol) {
    var mevcut = ekipUyeMevcut(kaynak, isyeriId, rol);
    if (!mevcut) { return; }
    onayIste('Ekip üyesi kaldırılsın mı?', rolEtiketi(kaynak, rol) + ' görevinden ' + mevcut.ad + ' kaldırılacak.', function () {
      if (kaynak === 'acil') { D.acilEkipSil(isyeriId, rol); }
      else { D.riskEkipUyeSil(isyeriId, rol); }
      B.bildir('Ekip üyesi kaldırıldı.', 'basari');
      ciz();
    }, 'Kaldır');
  }

  /* ---------- Dışa aktarma ---------- */

  var PERSONEL_BASLIKLARI = ['Sicil No', 'Adı Soyadı', 'TC Kimlik No', 'Mesleği', 'Departman', 'Grup Kodu Açıklama', 'Şube', 'İşe Başlama', 'Kıdem Tarihi', 'Cep Telefonu', 'Cinsiyet', 'İşyeri', 'Durum', 'Eğitim geçerliliği'];
  var PERSONEL_GENISLIKLERI = [10, 26, 14, 20, 18, 22, 12, 13, 13, 16, 10, 26, 10, 15];

  function personelExcel(sablon) {
    var hesap = veri();
    var liste = hesap.personel.filter(function (kisi) { return !UI.kapsam || kisi.isyeriId === UI.kapsam; });
    var satirlar;
    if (sablon) {
      satirlar = [[
        '1', 'Örnek Personel', '', 'Pres operatörü', 'Üretim', '', 'Merkez',
        '2024-01-15', '', '05xx xxx xx xx', 'Erkek', (hesap.isyerleri[0] || {}).ad || '', 'Aktif', ''
      ]];
    } else {
      satirlar = liste.map(function (kisi) {
        var durum = ISG.kisiDurumu(kisi, hesap.egitimler);
        return [kisi.sicil, kisi.adSoyad, kisi.tc, kisi.meslek, kisi.departman, kisi.grupKodu, kisi.sube,
          kisi.iseBaslama, kisi.kidemTarihi || '', kisi.telefon, kisi.cinsiyet, ISG.isyeriAdi(hesap, kisi.isyeriId),
          kisi.durum === 'aktif' ? 'Aktif' : 'Pasif', durum.gecerlilik || ''];
      });
    }

    var sayfalar = [{
      ad: 'Personel',
      basliklar: PERSONEL_BASLIKLARI,
      satirlar: satirlar,
      genislikler: PERSONEL_GENISLIKLERI
    }];

    if (sablon) {
      sayfalar.push({
        ad: 'Kılavuz',
        basliklar: ['Sütun', 'Açıklama', 'Kural'],
        satirlar: [
          ['Sicil No', 'Personel sicil numarası', 'Boş bırakılabilir; tekil olması önerilir'],
          ['Adı Soyadı', 'Personelin adı ve soyadı', 'Zorunlu'],
          ['TC Kimlik No', '11 haneli kimlik numarası', 'Boş ya da 11 hane'],
          ['Mesleği / Departman', 'Görev ve birim bilgisi', 'Serbest metin'],
          ['İşe Başlama / Kıdem Tarihi', 'YYYY-AA-GG ya da GG.AA.YYYY', 'Excel tarih hücresi de kabul edilir'],
          ['İşyeri', 'Kayıtlı işyeri adı', 'Ad birebir eşleşmezse seçili kapsam kullanılır'],
          ['Durum', 'Aktif / Pasif', 'Boşsa Aktif kabul edilir'],
          ['Eğitim geçerliliği', 'Hesaplanan bitiş tarihi', 'Salt okunur; içe aktarmada kullanılmaz']
        ],
        genislikler: [24, 40, 46]
      });
    }

    ISG.excel.indir(sablon ? 'personel-sablonu.xlsx' : tarihliAd('personel', 'xlsx'), sayfalar);
    B.bildir(sablon
      ? 'Boş personel şablonu (XLSX) indirildi. Doldurup "Excel içe aktar" ile yükleyin.'
      : 'Personel listesi Excel (XLSX) olarak indirildi.', 'basari');
  }

  function csvIsyerleri() {
    var hesap = veri();
    B.csv(tarihliAd('isyerleri'),
      ['İşyeri', 'Tehlike sınıfı', 'Çalışan sayısı', 'Kayıtlı personel', 'SGK sicil', 'Yetkili', 'Adres', 'Sektör', 'Kontrol maddesi', 'Ana kurum'],
      hesap.isyerleri.map(function (isyeri) {
        return [isyeri.ad, (ISG.RISK_SINIFLARI[isyeri.tehlikeSinifi] || {}).ad, isyeri.calisanSayisi,
          ISG.kapsamda(hesap, isyeri.id, 'personel').length, isyeri.sgkSicil, isyeri.yetkili, isyeri.adres, isyeri.sektor,
          ISG.kapsamda(hesap, isyeri.id, 'dosyalar').length, isyeri.ana ? 'Evet' : 'Hayır'];
      }));
    B.bildir('İşyeri listesi indirildi.', 'basari');
  }

  function csvDosyalar() {
    var hesap = veri();
    var liste = ISG.kapsamda(hesap, UI.kapsam, 'dosyalar');
    B.csv(tarihliAd('dosya-kontrolleri'),
      ['İşyeri', 'No', 'Bölüm', 'Kontrol maddesi', 'Durum', 'Sorumlu', 'Yenileme tarihi', 'Son kontrol', 'Açıklama'],
      liste.map(function (dosya) {
        return [ISG.isyeriAdi(hesap, dosya.isyeriId), dosya.no, dosya.bolum, dosya.madde,
          (ISG.DOSYA_DURUMLARI[dosya.durum] || {}).ad, dosya.sorumlu, dosya.yenileme, dosya.kontrolTarihi, dosya.aciklama];
      }));
    B.bildir(liste.length + ' kontrol maddesi indirildi.', 'basari');
  }

  function csvPlan() {
    var hesap = veri();
    var liste = ISG.kapsamda(hesap, UI.kapsam, 'planlar');
    B.csv(tarihliAd('calisma-plani'),
      ['İşyeri', 'Sıra', 'Faaliyet', 'Sorumlu', 'Takip tarihi', 'Durum', 'Tamamlanma', 'Açıklama'],
      liste.map(function (plan) {
        return [ISG.isyeriAdi(hesap, plan.isyeriId), plan.sira, plan.faaliyet, plan.sorumlu, plan.takipTarihi,
          ISG.planDurumu(plan).ad, plan.tamamlanmaTarihi || '', plan.aciklama];
      }));
    B.bildir('Çalışma planı indirildi.', 'basari');
  }

  function csvSaha() {
    var hesap = veri();
    var liste = ISG.kapsamda(hesap, UI.kapsam, 'tespitler');
    B.csv(tarihliAd('saha-tespitleri'),
      ['İşyeri', 'Tespit', 'Konum', 'Sorumlu', 'Öncelik', 'Tür', 'Termin', 'Durum', 'Doğrulama', 'Not'],
      liste.map(function (tespit) {
        return [ISG.isyeriAdi(hesap, tespit.isyeriId), tespit.tespit, tespit.konum, tespit.sorumlu, tespit.oncelik,
          tespit.tur, tespit.termin, ISG.tespitDurumu(tespit).ad, tespit.dogrulama || '', tespit.not || ''];
      }));
    B.bildir('Saha tespitleri indirildi.', 'basari');
  }

  function csvKaza() {
    var hesap = veri();
    var liste = ISG.kapsamda(hesap, UI.kapsam, 'olaylar')
      .filter(ISG.kazaKaydi)
      .sort(function (a, b) { return String(b.tarih).localeCompare(String(a.tarih)); });
    B.csv(tarihliAd('kaza-meslek-hastaligi'),
      ['Kayıt türü', 'İşyeri', 'Tarih', 'Personel', 'Sicil', 'Departman', 'Kıdem (yıl)', 'Yer', 'Vücut bölgesi',
        'Tanı / yaralanma türü', 'SGK hastalık grubu', 'Etken / maruziyet', 'Şiddet', 'Vardiya', 'Sağlık kuruluşuna sevk',
        'İstirahat başlangıç', 'İstirahat bitiş', 'İş günü kaybı', 'Sağlık kuruluşu', 'Kök neden sınıfı',
        'Kök neden açıklaması', 'Açıklama', 'Durum'],
      liste.map(function (kaza) {
        var kisi = (hesap.personel || []).filter(function (p) { return p.id === kaza.personelId; })[0];
        var kidem = kisi ? ISG.kidemYil(kisi.iseBaslama, kaza.tarih) : null;
        var hastalik = kaza.tur === 'meslekHastaligi';
        return [ISG.kazaKaydiAdi(kaza), ISG.isyeriAdi(hesap, kaza.isyeriId), kaza.tarih,
          kisi ? kisi.adSoyad : '', kisi ? kisi.sicil : '',
          kisi ? kisi.departman || '' : '', kidem === null ? '' : kidem,
          kaza.yer || '', ISG.listeAdi(ISG.YARALANMA_BOLGELERI, kaza.vucutBolgesi),
          ISG.listeAdi(hastalik ? ISG.HASTALIK_TURLERI : ISG.YARALANMA_TURLERI, kaza.yaralanmaTuru),
          hastalik ? ISG.listeAdi(ISG.MESLEK_HASTALIK_GRUPLARI, kaza.hastalikGrubu) : '',
          hastalik ? (kaza.etken || '') : '',
          ISG.listeAdi(ISG.KAZA_SIDDETLERI, kaza.siddet), ISG.listeAdi(ISG.VARDIYALAR, kaza.vardiya),
          kaza.hastaneSevk === 'evet' ? 'Evet' : (kaza.hastaneSevk === 'hayir' ? 'Hayır' : ''),
          kaza.istirahatBaslangic || '', kaza.istirahatBitis || '', ISG.kazaKayipGun(kaza),
          kaza.saglikKurulusu || '', ISG.listeAdi(ISG.KAZA_NEDENLERI, kaza.neden),
          kaza.kokNeden || '', kaza.aciklama, kaza.durum === 'kapali' ? 'Kapatıldı' : 'Açık'];
      }));
    B.bildir('Kaza ve meslek hastalığı listesi indirildi.', 'basari');
  }

  function csvRisk() {
    var hesap = veri();
    var liste = ISG.kapsamda(hesap, UI.kapsam, 'riskler');
    B.csv(tarihliAd('risk-kayitlari'),
      ['İşyeri', 'Tehlike', 'Alan', 'Olasılık', 'Şiddet', 'Skor', 'Seviye', 'Önlem', 'Sorumlu', 'Termin', 'Durum'],
      liste.map(function (risk) {
        var skor = ISG.riskSkor(risk);
        return [ISG.isyeriAdi(hesap, risk.isyeriId), risk.tehlike, risk.alan, risk.olasilik, risk.siddet, skor,
          ISG.riskSeviye(skor).ad, risk.onlem, risk.sorumlu, risk.termin, ISG.RISK_DURUMLARI[risk.durum] || risk.durum];
      }));
    B.bildir('Risk kayıtları indirildi.', 'basari');
  }

  function csvAcil() {
    var hesap = veri();
    B.csv(tarihliAd('acil-durum-planlari'),
      ['İşyeri', 'Tehlike sınıfı', 'Çalışan sayısı', 'Hazırlanma', 'Son yenileme', 'En geç yenileme', 'Son tatbikat', 'Ekip'],
      hesap.isyerleri.filter(function (isyeri) { return !UI.kapsam || isyeri.id === UI.kapsam; }).map(function (isyeri) {
        var kayit = ISG.ilgiliKayit(hesap, 'acilPlanlar', isyeri.id);
        var ozet = ISG.acilPlanOzeti(isyeri, kayit);
        return [isyeri.ad, (ISG.RISK_SINIFLARI[isyeri.tehlikeSinifi] || {}).ad, isyeri.calisanSayisi,
          (kayit && kayit.hazirlanma) || '', (kayit && kayit.sonYenileme) || '', ozet.enGec,
          (kayit && kayit.tatbikat) || '', ozet.ekip.map(function (uye) { return uye.rol + ': ' + uye.ad; }).join(' | ')];
      }));
    B.bildir('Acil durum plan kayıtları indirildi.', 'basari');
  }

  function csvRapor() {
    var hesap = veri();
    var satirlar = hesap.isyerleri.filter(function (isyeri) { return !UI.kapsam || isyeri.id === UI.kapsam; }).map(function (isyeri) {
      var ozet = ISG.gorevOzet(ISG.gorevler(hesap, isyeri.id));
      var dosyaOzet = ISG.dosyaOzeti(ISG.kapsamda(hesap, isyeri.id, 'dosyalar'));
      var tespitOzet = ISG.tespitOzeti(ISG.kapsamda(hesap, isyeri.id, 'tespitler'));
      return [isyeri.ad, (ISG.RISK_SINIFLARI[isyeri.tehlikeSinifi] || {}).ad, isyeri.calisanSayisi,
        ozet.toplam, ozet.geciken, ozet.tarihsiz, dosyaOzet.gecen, tespitOzet.acik, tespitOzet.dogrulama];
    });
    B.csv(tarihliAd('yonetim-raporu'),
      ['İşyeri', 'Tehlike sınıfı', 'Çalışan', 'Açık iş', 'Geciken', 'Tarihsiz', 'Belge süresi geçen', 'Açık tespit', 'Doğrulama bekleyen'],
      satirlar);
    B.bildir('Yönetim raporu özeti indirildi.', 'basari');
  }

  /* ---------- CSV içe aktarma ---------- */

  function csvAyirici(satir) {
    if (satir.indexOf(';') >= 0) { return ';'; }
    if (satir.indexOf('\t') >= 0) { return '\t'; }
    return ',';
  }

  function csvSatirlari(metin) {
    var temiz = String(metin || '').replace(/^\ufeff/, '');
    var satirlar = temiz.split(/\r?\n/).filter(function (satir) { return satir.trim().length; });
    if (!satirlar.length) { return []; }
    var ayirici = csvAyirici(satirlar[0]);
    return satirlar.map(function (satir) {
      var hucreler = [];
      var mevcut = '';
      var tirnak = false;
      for (var i = 0; i < satir.length; i += 1) {
        var karakter = satir[i];
        if (karakter === '"') {
          if (tirnak && satir[i + 1] === '"') { mevcut += '"'; i += 1; }
          else { tirnak = !tirnak; }
        } else if (karakter === ayirici && !tirnak) {
          hucreler.push(mevcut.trim());
          mevcut = '';
        } else {
          mevcut += karakter;
        }
      }
      hucreler.push(mevcut.trim());
      return hucreler;
    });
  }

  function normalize(metin) {
    return String(metin || '').toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();
  }

  function personelSatirlariAktar(satirlar) {
    if (!satirlar || satirlar.length < 2) {
      B.bildir('Dosyada başlık ve en az bir veri satırı olmalı.', 'hata');
      return 0;
    }
    var hesap = veri();
    var baslikSatiri = 0;
    for (var h = 0; h < Math.min(satirlar.length, 10); h += 1) {
      var adlar = (satirlar[h] || []).map(normalize);
      if (adlar.indexOf(normalize('Adı Soyadı')) >= 0 || adlar.indexOf(normalize('Ad Soyad')) >= 0) {
        baslikSatiri = h;
        break;
      }
    }
    var basliklar = (satirlar[baslikSatiri] || []).map(normalize);
    var indeks = {};
    basliklar.forEach(function (baslik, i) { if (baslik) { indeks[baslik] = i; } });
    var bul = function (satir, adlar) {
      for (var i = 0; i < adlar.length; i += 1) {
        var konum = indeks[normalize(adlar[i])];
        if (typeof konum === 'number' && satir[konum]) { return String(satir[konum]).trim(); }
      }
      return '';
    };
    var tarih = function (satir, adlar) {
      var ham = bul(satir, adlar);
      return ISG.excel.tariheCevir(ham) || ham;
    };

    var eklenen = 0;
    for (var s = baslikSatiri + 1; s < satirlar.length; s += 1) {
      var satir = satirlar[s] || [];
      var adSoyad = bul(satir, ['Adı Soyadı', 'Ad Soyad']);
      if (!adSoyad || normalize(adSoyad) === normalize('Adı Soyadı') || normalize(adSoyad) === normalize('Ad Soyad')) { continue; }
      var isyeriAd = bul(satir, ['İşyeri']);
      var isyeri = hesap.isyerleri.filter(function (i) { return normalize(i.ad) === normalize(isyeriAd); })[0];
      if (!isyeri) { isyeri = ISG.isyeriBul(hesap, UI.kapsam) || hesap.isyerleri[0]; }
      if (!isyeri) { continue; }
      D.personelKaydet({
        isyeriId: isyeri.id,
        sicil: bul(satir, ['Sicil No', 'Sicil']),
        adSoyad: adSoyad,
        tc: bul(satir, ['TC Kimlik No', 'TC No']),
        meslek: bul(satir, ['Mesleği', 'Meslek']),
        departman: bul(satir, ['Departman', 'Birim']),
        grupKodu: bul(satir, ['Grup Kodu Açıklama', 'Grup Kodu']),
        sube: bul(satir, ['Şube']),
        iseBaslama: tarih(satir, ['İşe Başlama', 'İşe Giriş']),
        kidemTarihi: tarih(satir, ['Kıdem Tarihi']),
        telefon: bul(satir, ['Cep Telefonu', 'Telefon']),
        cinsiyet: bul(satir, ['Cinsiyet']),
        durum: normalize(bul(satir, ['Durum'])) === 'pasif' ? 'pasif' : 'aktif'
      });
      eklenen += 1;
    }
    B.bildir(eklenen + ' personel kaydı içe aktarıldı.', eklenen ? 'basari' : 'uyari');
    ciz();
    return eklenen;
  }

  function personelIceAktar(metin) {
    return personelSatirlariAktar(csvSatirlari(metin));
  }

  function personelDosyaOku(dosya) {
    if (!dosya) { return; }
    if (/\.xlsx$/i.test(dosya.name || '')) {
      ISG.excel.oku(dosya).then(function (sayfalar) {
        var sayfa = (sayfalar || [])[0];
        if (!sayfa || !sayfa.satirlar.length) {
          B.bildir('Excel dosyasında veri bulunamadı.', 'hata');
          return;
        }
        personelSatirlariAktar(sayfa.satirlar);
      }).catch(function (hata) {
        B.bildir('Excel dosyası okunamadı: ' + hata.message, 'hata');
      });
      return;
    }
    var okuyucu = new FileReader();
    okuyucu.onload = function () { personelIceAktar(String(okuyucu.result || '')); };
    okuyucu.onerror = function () { B.bildir('Dosya okunamadı.', 'hata'); };
    okuyucu.readAsText(dosya, 'utf-8');
  }

  /* ---------- Tıklama işlemleri ---------- */

  function isyeriSilOnay(id) {
    var isyeri = ISG.isyeriBul(veri(), id);
    if (!isyeri) { return; }
    onayIste('İşyeri silinsin mi?', isyeri.ad + ' ve bağlı tüm personel, eğitim, belge, plan ve saha kayıtları silinecek.', function () {
      D.isyeriSil(id);
      if (UI.kapsam === id) { UI.kapsam = ''; }
      B.bildir('İşyeri ve bağlı kayıtlar silindi.', 'basari');
      ciz();
    }, 'İşyerini sil');
  }

  function personelSilOnay(id) {
    var kisi = veri().personel.filter(function (p) { return p.id === id; })[0];
    if (!kisi) { return; }
    onayIste('Personel silinsin mi?', kisi.adSoyad + ' ve bu kişiye bağlı eğitim kayıtları silinecek.', function () {
      D.personelSil(id);
      B.bildir('Personel kaydı silindi.', 'basari');
      ciz();
    });
  }

  function dosyaSilOnay(id) {
    var dosya = veri().dosyalar.filter(function (d) { return d.id === id; })[0];
    if (!dosya) { return; }
    onayIste('Kontrol maddesi silinsin mi?', dosya.madde + ' kaydı silinecek.', function () {
      D.dosyaSil(id);
      B.bildir('Kontrol maddesi silindi.', 'basari');
      ciz();
    });
  }

  function tiklamaIslemi(olay) {
    var kapat = olay.target.closest('[data-kapat]');
    if (kapat) {
      diyalogKapat(kapat.closest('dialog'));
      return;
    }

    var sayfaGit = olay.target.closest('[data-sayfa-git]');
    if (sayfaGit) {
      UI.dosyaSayfa = Number(sayfaGit.getAttribute('data-sayfa-git')) || 1;
      ciz();
      return;
    }

    var menuOge = olay.target.closest('.menu-oge[data-sayfa]');
    if (menuOge) {
      git(menuOge.getAttribute('data-sayfa'));
      if (global.innerWidth <= 1024) { kenariKapat(); }
      return;
    }

    var dugme = olay.target.closest('[data-islem]');
    if (!dugme) { return; }
    var islem = dugme.getAttribute('data-islem');
    var id = dugme.getAttribute('data-id') || '';
    var isyeriId = dugme.getAttribute('data-isyeri') || '';
    var kapsam = dugme.getAttribute('data-kapsam');

    switch (islem) {
      case 'menu-ac':
        kenariAc();
        break;
      case 'menu-katla':
        menuDurumu(document.body.classList.contains('menu-kapali'));
        break;
      case 'yenile':
        ciz();
        B.bildir('Görünüm yenilendi.', 'basari');
        break;
      case 'bulut-ayar':
        bulutAc();
        break;

      /* Oturum */
      case 'oturum-kapat':
        onayIste('Oturum kapatılsın mı?', 'Bu cihazdaki oturum sonlandırılacak. Devam etmek için yeniden giriş yapmanız gerekir.', function () {
          if (ISG.giris && typeof ISG.giris.cikis === 'function') { ISG.giris.cikis(); return; }
          if (ISG.yetki) { ISG.yetki.oturumKapat(); }
          try { global.location.reload(); } catch (hata) { /* yok say */ }
        }, 'Oturumu kapat');
        break;
      case 'oturum-ac':
        if (ISG.giris && typeof ISG.giris.goster === 'function') { ISG.giris.goster(); }
        break;

      /* Onay kuyruğu */
      case 'talep-onayla':
        onayIste('Talep onaylansın mı?', 'Onaylanan değişiklik kayda hemen uygulanır. Bu işlem geri alınamaz.', function () {
          try {
            ISG.yetki.talepOnayla(id, 'Onaylandı');
            B.bildir('Talep onaylandı ve kayda uygulandı.', 'basari');
          } catch (hata) {
            B.bildir(hata.message, 'hata');
          }
          ciz();
        }, 'Onayla');
        break;
      case 'talep-reddet':
        onayIste('Talep reddedilsin mi?', 'Talep reddedildiğinde kayıt değişmez; talep sahibi durumu onay kuyruğunda görür.', function () {
          try {
            ISG.yetki.talepReddet(id, 'Reddedildi');
            B.bildir('Talep reddedildi.', 'basari');
          } catch (hata) {
            B.bildir(hata.message, 'hata');
          }
          ciz();
        }, 'Reddet');
        break;

      /* Genel bakış */
      case 'panel-sekme':
        UI.panelSekme = dugme.getAttribute('data-sekme');
        ciz();
        break;
      case 'panel-filtre':
        UI.panelSekme = dugme.getAttribute('data-filtre');
        if (aktifSayfa() !== 'panel') { git('panel'); } else { ciz(); }
        break;
      case 'gorev-ac': {
        var hedef = dugme.getAttribute('data-hedef');
        if (hedef === 'dosyalar') {
          var dosya = veri().dosyalar.filter(function (d) { return d.id === id; })[0];
          if (dosya) { UI.kapsam = dosya.isyeriId; git('dosyalar'); dosyaAc(dosya.id); break; }
        }
        if (hedef === 'personel') {
          var kisi = veri().personel.filter(function (p) { return p.id === id; })[0];
          if (kisi) { UI.kapsam = kisi.isyeriId; UI.acikPersonel = kisi.id; git('personel'); break; }
        }
        if (hedef) { git(hedef); }
        break;
      }

      /* İşyerleri */
      case 'isyerleric-csv':
      case 'isyerleri-csv':
        csvIsyerleri();
        break;
      case 'isyeri-yeni':
        isyeriAc('');
        break;
      case 'isyeri-duzenle':
        isyeriAc(id);
        break;
      case 'isyeri-sil':
        isyeriSilOnay(id);
        break;
      case 'isyeri-dosya':
        UI.kapsam = id;
        git('dosyalar');
        break;
      case 'kurum-duzenle':
        kurumAc();
        break;
      case 'kurum-sil':
        onayIste('Tüm veriler silinsin mi?',
          'Kurum adı ve tüm kayıtlar silinecek; site boş olarak başlayacak. Kullanıcı hesapları korunur. ' +
          'Bu işlem geri alınamaz, ancak üst bardaki "Yedekle" ile önce yedek alabilirsiniz.',
          function () {
            D.sifirla();
            UI.kapsam = '';
            girisSonrasi();
            B.bildir('Tüm veriler silindi; site boş başladı.', 'basari');
            ciz();
          }, 'Verileri sil');
        break;

      /* Personel */
      case 'personel-yeni':
        personelAc('', isyeriId);
        break;
      case 'personel-duzenle':
        personelAc(id);
        break;
      case 'personel-sil':
        personelSilOnay(id);
        break;
      case 'personel-detay':
        UI.acikPersonel = UI.acikPersonel === id ? '' : id;
        ciz();
        break;
      case 'personel-liste':
        UI.personelListeKapali = UI.personelListeKapali === id ? '' : id;
        ciz();
        break;
      case 'personel-temizle': {
        var iy = ISG.isyeriBul(veri(), id);
        onayIste('Personel listesi temizlensin mi?',
          (iy ? iy.ad : 'Seçili işyeri') + ' için tüm personel ve bağlı eğitim kayıtları silinecek.',
          function () {
            var sayi = D.personelTemizle(id);
            B.bildir(sayi + ' personel kaydı silindi.', 'basari');
            ciz();
          }, 'Listeyi temizle');
        break;
      }
      case 'personel-csv':
        personelExcel(false);
        break;
      case 'personel-sablon':
        personelExcel(true);
        break;
      case 'personel-ice-aktar': {
        var dosyaGirdi = el('personelDosya');
        if (dosyaGirdi) { dosyaGirdi.click(); }
        break;
      }
      case 'egitim-yeni':
        egitimAc('', dugme.getAttribute('data-personel') || '');
        break;
      case 'egitim-listesi':
        UI.kapsam = id;
        git('personel');
        break;
      default:
        tiklamaIslemiEk(islem, id, isyeriId, dugme);
        break;
    }
  }

  function tiklamaIslemiEk(islem, id, isyeriId, dugme) {
    switch (islem) {
      /* Dosya kontrolleri */
      case 'dosya-csv':
        csvDosyalar();
        break;
      case 'dosya-yeni':
        dosyaAc('', isyeriId);
        break;
      case 'dosya-duzenle':
        dosyaAc(id);
        break;
      case 'dosya-sil':
        dosyaSilOnay(id);
        break;
      case 'belge-sec': {
        var belgeGirdi = el('dosyaBelgeGirdi');
        if (belgeGirdi) { belgeGirdi.click(); }
        break;
      }
      case 'belge-indir':
        belgeIndir(id);
        break;
      case 'ek-goruntule':
        ekGoruntule(id);
        break;
      case 'ek-sec': {
        var ekGirdi = el(dugme.getAttribute('data-hedef') || '');
        if (ekGirdi) { ekGirdi.click(); }
        break;
      }
      case 'belge-sil':
        belgeKaldir(id);
        break;
      case 'dosya-dof': {
        var dosya = veri().dosyalar.filter(function (d) { return d.id === id; })[0];
        if (!dosya) { return; }
        onayIste('DÖF kaydı oluşturulsun mu?',
          '"' + dosya.madde + '" için saha tespiti oluşturulacak ve saha takibine eklenecek.',
          function () {
            D.tespitKaydet({
              isyeriId: dosya.isyeriId,
              tespit: 'DÖF: ' + dosya.madde,
              konum: dosya.bolum,
              sorumlu: dosya.sorumlu || '',
              oncelik: dosya.durum === 'eksik' ? 'yuksek' : 'orta',
              tur: 'Eksiklik',
              termin: B.bugunIso(),
              durum: 'acik',
              not: dosya.aciklama || 'Dosya kontrolünden oluşturuldu.'
            });
            B.bildir('DÖF kaydı saha takibine eklendi.', 'basari');
            git('saha');
          }, 'DÖF oluştur');
        break;
      }
      case 'dosya-sekme':
        UI.dosyaSekme = dugme.getAttribute('data-sekme');
        UI.dosyaSayfa = 1;
        ciz();
        break;
      case 'dosya-tarih-filtre':
        UI.dosyaTarih = dugme.getAttribute('data-filtre') || '';
        UI.dosyaSayfa = 1;
        ciz();
        break;

      /* Çalışma planı */
      case 'plan-csv':
        csvPlan();
        break;
      case 'plan-yeni':
        planAc('', isyeriId);
        break;
      case 'plan-duzenle':
        planAc(id);
        break;
      case 'plan-sil':
        onayIste('Plan faaliyeti silinsin mi?', 'Seçili plan kalemi silinecek.', function () {
          D.planSil(id);
          B.bildir('Plan faaliyeti silindi.', 'basari');
          ciz();
        });
        break;
      case 'plan-tamamla':
        D.planDurumDegistir(id, 'tamamlandi');
        B.bildir('Faaliyet tamamlandı olarak işaretlendi.', 'basari');
        ciz();
        break;
      case 'plan-geri-al':
        D.planDurumDegistir(id, 'takvimde');
        B.bildir('Faaliyet yeniden takvime alındı.', 'basari');
        ciz();
        break;
      case 'plan-filtre':
        UI.panelSekme = dugme.getAttribute('data-filtre');
        git('panel');
        break;

      /* Saha ve DÖF */
      case 'saha-csv':
        csvSaha();
        break;
      case 'tespit-yeni':
        tespitAc('', isyeriId);
        break;
      case 'tespit-duzenle':
        tespitAc(id);
        break;
      case 'tespit-sil':
        onayIste('Saha tespiti silinsin mi?', 'Tespit ve bağlı DÖF kaydı silinecek.', function () {
          D.tespitSil(id);
          B.bildir('Saha tespiti silindi.', 'basari');
          ciz();
        });
        break;
      case 'tespit-kapat':
        D.tespitDurumDegistir(id, 'kapali');
        B.bildir('Tespit kapatıldı.', 'basari');
        ciz();
        break;
      case 'tespit-dogrula':
        D.tespitDurumDegistir(id, 'dogrulama');
        B.bildir('Tespit doğrulama bekliyor olarak işaretlendi.', 'basari');
        ciz();
        break;
      case 'saha-filtre':
        UI.sahaDurum = dugme.getAttribute('data-filtre') || '';
        ciz();
        break;
      case 'kaza-yeni':
        kazaAc('', isyeriId || UI.kapsam, dugme.getAttribute('data-tur') || 'isKazasi');
        break;
      case 'kaza-duzenle':
        kazaAc(id);
        break;
      case 'kaza-csv':
        csvKaza();
        break;
      case 'olay-kapat': {
        var olay = veri().olaylar.filter(function (o) { return o.id === id; })[0];
        if (!olay) { return; }
        var kazaKaydi = ISG.kazaKaydi(olay);
        var kayitAdi = ISG.kazaKaydiAdi(olay);
        olay.durum = olay.durum === 'kapali' ? 'acik' : 'kapali';
        D.olayKaydet(olay);
        B.bildir(kazaKaydi
          ? (olay.durum === 'kapali' ? kayitAdi + ' kaydı kapatıldı.' : kayitAdi + ' kaydı yeniden açıldı.')
          : 'Olay durumu güncellendi.', 'basari');
        ciz();
        break;
      }
      case 'olay-sil': {
        var silinecek = veri().olaylar.filter(function (o) { return o.id === id; })[0];
        var kazaMi = ISG.kazaKaydi(silinecek);
        var silinenAd = ISG.kazaKaydiAdi(silinecek);
        var detay = silinecek && silinecek.tur === 'meslekHastaligi'
          ? 'Kayıt ve tanı bilgileri silinecek.' : 'Kaza kaydı ve yaralanma bilgileri silinecek.';
        onayIste(kazaMi ? silinenAd + ' kaydı silinsin mi?' : 'Olay bildirimi silinsin mi?',
          kazaMi ? detay : 'Bildirim kaydı silinecek.', function () {
            D.olaySil(id);
            B.bildir(kazaMi ? silinenAd + ' kaydı silindi.' : 'Olay bildirimi silindi.', 'basari');
            ciz();
          });
        break;
      }

      /* Rapor / risk / acil */
      case 'rapor-csv':
      case 'rapor-ozet-csv':
        csvRapor();
        break;
      case 'risk-csv':
        csvRisk();
        break;
      case 'risk-ekip':
        riskEkipAc(id);
        break;
      case 'ekip-uye':
        ekipUyeAc(dugme.getAttribute('data-kaynak') || 'risk', isyeriId, dugme.getAttribute('data-rol') || '');
        break;
      case 'ekip-uye-sil':
        ekipUyeSilOnay(dugme.getAttribute('data-kaynak') || 'risk', isyeriId, dugme.getAttribute('data-rol') || '');
        break;
      case 'acil-csv':
        csvAcil();
        break;
      case 'acil-plan':
        acilPlanAc(id);
        break;

      /* Ekip */
      case 'davet-sil':
        D.davetSil(id);
        B.bildir('Davet iptal edildi.', 'basari');
        ciz();
        break;
      case 'davet-gonder':
        davetGonder();
        break;

      /* Yedekleme */
      case 'yedekle':
        B.dosyaIndir('isg-takip-yedek-' + B.bugunIso() + '.json', D.disariAktar(), 'application/json', false);
        B.bildir('JSON yedeği indirildi.', 'basari');
        break;
      case 'geri-yukle': {
        var girdi = el('yedekDosya');
        if (girdi) { girdi.click(); }
        break;
      }
      /* Örnek (tanıtım) verisi: boş açılan siteye doldurmak içindir. */
      case 'ornek-veri':
        onayIste('Örnek veri yüklensin mi?',
          'Tanıtım amaçlı 6 işyeri, 37 personel ve ilgili kayıtlar yüklenecek. ' +
          'Aynı kayıtlar bulutta duruyorsa birleştirilir, yoksa diğer cihazlara da gönderilir. ' +
          'Geri almak için İşyerleri → Kurumu sil.',
          function () {
            var yuklenen = D.ornekYukle();
            UI.kapsam = '';
            girisSonrasi();
            B.bildir('Örnek veri yüklendi: ' + yuklenen.isyerleri.length + ' işyeri, ' +
              yuklenen.personel.length + ' personel.', 'basari');
          }, 'Örnek veriyi yükle');
        break;
      case 'onceki-veri': {
        var onceki = typeof D.temizlikYedegi === 'function' ? D.temizlikYedegi() : '';
        if (!onceki) { B.bildir('Bu cihazda saklanan eski veri yedeği yok.', 'hata'); break; }
        B.dosyaIndir('isg-takip-temizlik-oncesi-' + B.bugunIso() + '.json', onceki, 'application/json', false);
        B.bildir('Temizlik öncesi veri indirildi.', 'basari');
        break;
      }
      default:
        break;
    }
  }

  function davetGonder() {
    var eposta = el('davetEposta');
    var rol = el('davetRol');
    var seciliIsyerleri = [];
    Array.prototype.forEach.call(document.querySelectorAll('.davet-isyeri:checked'), function (kutu) {
      seciliIsyerleri.push(kutu.value);
    });
    if (!eposta || !eposta.value.trim() || eposta.value.indexOf('@') < 1) {
      B.bildir('Geçerli bir e-posta adresi girin.', 'hata');
      if (eposta) { eposta.focus(); }
      return;
    }
    var tumu = seciliIsyerleri.indexOf('__tumu') >= 0;
    var yetkiler = tumu ? (veri().isyerleri || []).map(function (i) { return i.id; }) : seciliIsyerleri;
    if (!yetkiler.length) {
      B.bildir('En az bir işyeri seçin.', 'hata');
      return;
    }
    D.davetKaydet({ eposta: eposta.value.trim(), rol: rol ? rol.value : 'Görüntüleyici', isyerleri: yetkiler });
    B.bildir('Davet oluşturuldu. Davet kodunu kullanıcıya iletin.', 'basari');
    ciz();
  }

  /* ---------- Bulut eşitleme arayüzü ---------- */

  function bulutVarMi() {
    return !!(ISG.bulut && typeof ISG.bulut.ozet === 'function');
  }

  function bulutAlanlari() {
    return {
      url: el('bulutUrl'),
      anahtar: el('bulutAnahtar'),
      oda: el('bulutOda'),
      aralik: el('bulutAralik'),
      otomatik: el('bulutOtomatik'),
      yukari: el('bulutYukari'),
      uyari: el('bulutUyari'),
      durum: el('bulutDurumSatir'),
      sql: el('bulutSql'),
      kes: el('bulutKes'),
      simdi: el('bulutSimdi'),
      kimlikNotu: el('bulutKimlikNotu'),
      form: el('bulutForm')
    };
  }

  function bulutDurumYaz(bilgi) {
    var a = bulutAlanlari();
    var acik = bulutVarMi() && ISG.bulut.hazirMi();
    /* Siteye gömülü kimlik varsa kullanıcıya "ayar girmenize gerek yok"
       bilgisi gösterilir; bağlantıyı elle kesmişse gizlenir. */
    if (a.kimlikNotu && bulutVarMi() && typeof ISG.bulut.kimlikVarMi === 'function') {
      a.kimlikNotu.hidden = !(ISG.bulut.kimlikVarMi() && !ISG.bulut.kimlikKapaliMi());
    }
    if (a.sql && !a.sql.textContent && bulutVarMi()) {
      a.sql.textContent = ISG.bulut.sqlMetni();
    }
    if (a.durum) {
      a.durum.textContent = 'Durum: ' + ((bilgi && bilgi.metin) || 'yerel kayıt açık') +
        (bilgi && bilgi.ayrinti ? ' · ' + bilgi.ayrinti : '');
    }
    if (a.kes) { a.kes.hidden = !acik; }
    if (a.simdi) { a.simdi.hidden = !acik; }
    var yukariSatiri = a.yukari && a.yukari.parentNode;
    if (yukariSatiri) { yukariSatiri.hidden = acik; }
    if (a.form) {
      var gonder = a.form.querySelector('button[type="submit"]');
      if (gonder) { gonder.textContent = acik ? 'Ayarları kaydet' : 'Bağlan'; }
    }
  }

  function bulutAc() {
    var a = bulutAlanlari();
    if (!bulutVarMi()) {
      B.bildir('Bulut modülü yüklenemedi; sayfayı yenileyin.', 'hata');
      return;
    }
    var ayar = ISG.bulut.ayar();
    if (a.uyari) { a.uyari.hidden = true; a.uyari.textContent = ''; }
    if (a.url) { a.url.value = (ayar && ayar.url) || ''; }
    if (a.anahtar) { a.anahtar.value = (ayar && ayar.anahtar) || ''; }
    if (a.oda) { a.oda.value = (ayar && ayar.oda) || ''; }
    if (a.aralik) { a.aralik.value = String((ayar && ayar.aralik) || 20); }
    if (a.otomatik) { a.otomatik.checked = !ayar || ayar.otomatik !== false; }
    if (a.yukari) { a.yukari.checked = false; }
    bulutDurumYaz(ISG.bulut.ozet());
    diyalogAc(el('bulutDiyalog'), a.url);
  }

  function bulutDugmeleriKapali(kapali) {
    var diyalog = el('bulutDiyalog');
    if (!diyalog) { return; }
    Array.prototype.forEach.call(diyalog.querySelectorAll('.diyalog-eylem button'), function (dugme) {
      dugme.disabled = !!kapali;
    });
  }

  function bulutGirdisi(form) {
    var a = bulutAlanlari();
    return {
      url: String((form.elements.url && form.elements.url.value) || ''),
      anahtar: String((form.elements.anahtar && form.elements.anahtar.value) || ''),
      oda: String((form.elements.oda && form.elements.oda.value) || ''),
      aralik: String((form.elements.aralik && form.elements.aralik.value) || ''),
      otomatik: !!(a.otomatik && a.otomatik.checked)
    };
  }

  function bulutDogrula(girdi) {
    if (!/^https?:\/\/[^\s/]+\.[^\s/]+/i.test(girdi.url.trim())) {
      return 'Proje adresi https://xxxx.supabase.co biçiminde olmalı.';
    }
    if (girdi.anahtar.trim().length < 20) {
      return 'Anon anahtar eksik ya da çok kısa görünüyor; Supabase panelinden kopyalayın.';
    }
    if (!/[a-z0-9]/i.test(girdi.oda.replace(/[^a-z0-9]+/gi, ''))) {
      return 'Oda kodu en az bir harf ya da rakam içermeli (örn. isg-merkez).';
    }
    return '';
  }

  /* yukari = true: bu cihazdaki kayıtlar öncelikli olarak birleştirilir,
     false: buluttaki veri öncelikli olarak birleştirilir. Hiçbir kayıt silinmez. */
  function bulutBaglanIslemi(form, yukari) {
    if (!bulutVarMi()) {
      B.bildir('Bulut modülü yüklenemedi; sayfayı yenileyin.', 'hata');
      return;
    }
    var girdi = bulutGirdisi(form);
    var hata = bulutDogrula(girdi);
    if (hata) { uyariGoster('bulutUyari', hata); return; }

    var a = bulutAlanlari();
    if (a.uyari) { a.uyari.hidden = true; a.uyari.textContent = ''; }
    if (a.durum) { a.durum.textContent = 'Durum: buluta bağlanıyor…'; }
    bulutDugmeleriKapali(true);

    ISG.bulut.baglan(girdi, !!yukari).then(function () {
      bulutDugmeleriKapali(false);
      var bilgi = ISG.bulut.ozet();
      bulutDurumYaz(bilgi);
      kayitDurumuCiz();
      if (bilgi.asama === 'hata') {
        uyariGoster('bulutUyari', bilgi.ayrinti || 'Bulut bağlantısı kurulamadı.');
        return;
      }
      diyalogKapat(el('bulutDiyalog'));
      B.bildir(yukari
        ? 'Bulut bağlandı; bu cihazdaki kayıtlar öncelikli olarak birleştirildi.'
        : 'Bulut bağlandı; ortak kayıtlar birleştirilerek bu cihaza indirildi.', 'basari');
      ciz();
    });
  }

  function bulutSimdiIslemi() {
    if (!bulutVarMi() || !ISG.bulut.hazirMi()) { return; }
    var a = bulutAlanlari();
    if (a.uyari) { a.uyari.hidden = true; a.uyari.textContent = ''; }
    if (a.durum) { a.durum.textContent = 'Durum: eşitleniyor…'; }
    bulutDugmeleriKapali(true);
    ISG.bulut.senkronla(true).then(function () {
      bulutDugmeleriKapali(false);
      var bilgi = ISG.bulut.ozet();
      bulutDurumYaz(bilgi);
      kayitDurumuCiz();
      if (bilgi.asama === 'hata') {
        uyariGoster('bulutUyari', bilgi.ayrinti || 'Eşitleme tamamlanamadı.');
        return;
      }
      ciz();
    });
  }

  function bulutKesIslemi() {
    onayIste('Bulut bağlantısı kesilsin mi?',
      'Bu cihaz buluta yazmayı bırakır. Yerel kayıtlar silinmez, veriler bu cihazda kalır.',
      function () {
        if (bulutVarMi()) { ISG.bulut.kapat(); }
        bulutDurumYaz(bulutVarMi() ? ISG.bulut.ozet() : null);
        diyalogKapat(el('bulutDiyalog'));
        kayitDurumuCiz();
        B.bildir('Bulut bağlantısı kesildi; yerel kayıt sürüyor.', 'basari');
        ciz();
      }, 'Bağlantıyı kes');
  }

  function bulutBagla() {
    var sql = el('bulutSql');
    if (sql && bulutVarMi()) { sql.textContent = ISG.bulut.sqlMetni(); }

    formuBagla('bulutForm', function (form) {
      var a = bulutAlanlari();
      bulutBaglanIslemi(form, !!(a.yukari && a.yukari.checked));
    });
    var simdi = el('bulutSimdi');
    if (simdi) { simdi.addEventListener('click', bulutSimdiIslemi); }
    var kes = el('bulutKes');
    if (kes) { kes.addEventListener('click', bulutKesIslemi); }

    if (!bulutVarMi()) { return; }

    ISG.bulut.abone(function () {
      kayitDurumuCiz();
      bulutDurumYaz(ISG.bulut.ozet());
    });
    ISG.bulut.baslat();
    kayitDurumuCiz();
  }

  /* ---------- Formlar ---------- */

  function formuBagla(formId, isleyici) {
    var form = el(formId);
    if (!form) { return; }
    form.addEventListener('submit', function (olay) {
      olay.preventDefault();
      isleyici(form);
    });
  }

  function formlariBagla() {
    formuBagla('kurumForm', function (form) {
      var deger = form.elements.kurum.value.trim();
      if (!deger) { uyariGoster('kurumUyari', 'Kurum adı zorunlu.'); return; }
      D.ayarKaydet({ kurum: deger });
      diyalogKapat(el('kurumDiyalog'));
      B.bildir('Kurum adı güncellendi.', 'basari');
      ciz();
    });

    formuBagla('isyeriForm', function (form) {
      var veriForm = formVerisi(form);
      if (!veriForm.ad) { uyariGoster('isyeriUyari', 'İşyeri adı zorunlu.'); return; }
      var calisan = Number(veriForm.calisanSayisi);
      D.isyeriKaydet({
        id: veriForm.id || '',
        ad: veriForm.ad,
        tehlikeSinifi: veriForm.tehlikeSinifi || 'tehlikeli',
        calisanSayisi: isNaN(calisan) ? 0 : Math.max(0, calisan),
        sgkSicil: veriForm.sgkSicil || '',
        yetkili: veriForm.yetkili || '',
        adres: veriForm.adres || '',
        sektor: veriForm.sektor || '',
        ana: form.elements.ana.checked
      });
      diyalogKapat(el('isyeriDiyalog'));
      B.bildir('İşyeri kaydedildi.', 'basari');
      ciz();
    });

    formuBagla('personelForm', function (form) {
      var veriForm = formVerisi(form);
      if (!veriForm.adSoyad) { uyariGoster('personelUyari', 'Adı soyadı zorunlu.'); return; }
      if (!veriForm.isyeriId) { uyariGoster('personelUyari', 'İşyeri seçilmeli.'); return; }
      if (veriForm.tc && veriForm.tc.replace(/\D/g, '').length !== 11) {
        uyariGoster('personelUyari', 'TC kimlik no 11 haneli olmalı.');
        return;
      }
      D.personelKaydet({
        id: veriForm.id || '',
        isyeriId: veriForm.isyeriId,
        sicil: veriForm.sicil || '',
        adSoyad: veriForm.adSoyad,
        tc: veriForm.tc || '',
        meslek: veriForm.meslek || '',
        departman: veriForm.departman || '',
        grupKodu: veriForm.grupKodu || '',
        sube: veriForm.sube || '',
        iseBaslama: veriForm.iseBaslama || '',
        telefon: veriForm.telefon || '',
        cinsiyet: veriForm.cinsiyet || '',
        durum: veriForm.durum || 'aktif'
      });
      diyalogKapat(el('personelDiyalog'));
      B.bildir('Personel kaydı kaydedildi.', 'basari');
      ciz();
    });

    formuBagla('egitimForm', function (form) {
      var veriForm = formVerisi(form);
      if (!veriForm.personelId) { uyariGoster('egitimUyari', 'Personel seçilmeli.'); return; }
      if (!veriForm.tarih) { uyariGoster('egitimUyari', 'Eğitim tarihi zorunlu.'); return; }
      D.egitimKaydet({
        id: veriForm.id || '',
        personelId: veriForm.personelId,
        tur: veriForm.tur,
        tarih: veriForm.tarih,
        sureSaat: Number(veriForm.sureSaat) || 0,
        egitmen: veriForm.egitmen || ''
      });
      diyalogKapat(el('egitimDiyalog'));
      B.bildir('Eğitim kaydı eklendi, geçerlilik tarihi hesaplandı.', 'basari');
      ciz();
    });

    formuBagla('dosyaForm', function (form) {
      var veriForm = formVerisi(form);
      if (!veriForm.madde) { uyariGoster('dosyaUyari', 'Kontrol maddesi zorunlu.'); return; }
      if (!veriForm.isyeriId) { uyariGoster('dosyaUyari', 'İşyeri seçilmeli.'); return; }
      var kaydedilen = D.dosyaKaydet({
        id: veriForm.id || '',
        isyeriId: veriForm.isyeriId,
        bolum: veriForm.bolum || 'DİĞER KONTROL MADDELERİ',
        madde: veriForm.madde,
        durum: veriForm.durum || 'incelenmedi',
        sorumlu: veriForm.sorumlu || '',
        yenileme: veriForm.yenileme || '',
        kontrolTarihi: veriForm.kontrolTarihi || '',
        aciklama: veriForm.aciklama || ''
      });
      bekleyenBelgeler.forEach(function (belge) {
        belge.dosyaId = kaydedilen.id;
        belge.isyeriId = kaydedilen.isyeriId;
        try { D.belgeKaydet(belge); } catch (hata) { B.bildir(hata.message, 'hata'); }
      });
      bekleyenBelgeler = [];
      diyalogKapat(el('dosyaDiyalog'));
      B.bildir('Kontrol maddesi kaydedildi.', 'basari');
      ciz();
    });

    formuBagla('planForm', function (form) {
      var veriForm = formVerisi(form);
      if (!veriForm.faaliyet) { uyariGoster('planUyari', 'Faaliyet adı zorunlu.'); return; }
      var ay = 0;
      var gun = 0;
      if (veriForm.takipTarihi) {
        ay = Number(veriForm.takipTarihi.slice(5, 7));
        gun = Number(veriForm.takipTarihi.slice(8, 10));
      }
      var mevcut = veriForm.id ? veri().planlar.filter(function (p) { return p.id === veriForm.id; })[0] : null;
      D.planKaydet({
        id: veriForm.id || '',
        isyeriId: veriForm.isyeriId,
        sira: mevcut ? mevcut.sira : (ISG.kapsamda(veri(), veriForm.isyeriId, 'planlar').length + 1),
        ay: ay,
        gun: gun,
        faaliyet: veriForm.faaliyet,
        sorumlu: veriForm.sorumlu || '',
        takipTarihi: veriForm.takipTarihi || '',
        durum: veriForm.durum || 'takvimde',
        aciklama: veriForm.aciklama || ''
      });
      diyalogKapat(el('planDiyalog'));
      B.bildir('Plan faaliyeti kaydedildi.', 'basari');
      ciz();
    });

    kazaFormuBagla();

    formuBagla('tespitForm', function (form) {
      var veriForm = formVerisi(form);
      if (!veriForm.tespit) { uyariGoster('tespitUyari', 'Tespit metni zorunlu.'); return; }
      if (!veriForm.isyeriId) { uyariGoster('tespitUyari', 'İşyeri seçilmeli.'); return; }
      D.tespitKaydet({
        id: veriForm.id || '',
        isyeriId: veriForm.isyeriId,
        tespit: veriForm.tespit,
        konum: veriForm.konum || '',
        sorumlu: veriForm.sorumlu || '',
        oncelik: veriForm.oncelik || 'orta',
        tur: veriForm.tur || 'Uygunsuzluk',
        termin: veriForm.termin || '',
        durum: veriForm.durum || 'acik',
        not: veriForm.not || '',
        dogrulama: veriForm.durum === 'kapali' ? B.bugunIso() : ''
      });
      diyalogKapat(el('tespitDiyalog'));
      B.bildir('Saha tespiti kaydedildi.', 'basari');
      ciz();
    });

    formuBagla('riskEkipForm', function (form) {
      var veriForm = formVerisi(form);
      var isyeri = ISG.isyeriBul(veri(), veriForm.isyeriId);
      var sinif = isyeri ? ISG.RISK_SINIFLARI[isyeri.tehlikeSinifi] : null;
      var enGec = veriForm.enGecYenileme;
      if (veriForm.sonDegerlendirme && sinif) {
        enGec = ISG.yilEkle(veriForm.sonDegerlendirme, sinif.riskYenilemeYil);
      }
      D.riskEkipKaydet(veriForm.isyeriId, {
        sonDegerlendirme: veriForm.sonDegerlendirme,
        enGecYenileme: enGec,
        isveren: veriForm.isveren,
        uzman: veriForm.uzman,
        hekim: veriForm.hekim,
        temsilci: veriForm.temsilci,
        destek: veriForm.destek,
        birim: veriForm.birim
      });
      diyalogKapat(el('riskEkipDiyalog'));
      B.bildir('Risk değerlendirmesi ekibi kaydedildi.', 'basari');
      ciz();
    });

    formuBagla('ekipUyeForm', function (form) {
      var veriForm = formVerisi(form);
      var kisi = veriForm.personelId ? veri().personel.filter(function (p) { return p.id === veriForm.personelId; })[0] : null;
      var ad = veriForm.ad || (kisi ? kisi.adSoyad : '');
      if (!ad) {
        uyariGoster('ekipUyeUyari', 'Listeden bir kişi seçin ya da adı soyadı yazın.');
        return;
      }
      if (veriForm.kaynak === 'acil') {
        D.acilEkipEkle(veriForm.isyeriId, veriForm.rol, ad, veriForm.personelId || '');
      } else {
        D.riskEkipUyeEkle(veriForm.isyeriId, veriForm.rol, ad, veriForm.personelId || '');
      }
      diyalogKapat(el('ekipUyeDiyalog'));
      B.bildir('Ekip üyesi kaydedildi.', 'basari');
      ciz();
    });

    formuBagla('acilPlanForm', function (form) {
      var veriForm = formVerisi(form);
      D.acilPlanKaydet(veriForm.isyeriId, {
        hazirlanma: veriForm.hazirlanma,
        sonYenileme: veriForm.sonYenileme,
        tatbikat: veriForm.tatbikat
      });
      [
        ['Acil durum koordinatörü', veriForm.ekip_koordinator],
        ['Yangın söndürme ekibi', veriForm.ekip_yangin],
        ['İlk yardım ekibi', veriForm.ekip_ilkyardim],
        ['Tahliye / arama kurtarma', veriForm.ekip_tahliye]
      ].forEach(function (satir) {
        D.acilEkipEkle(veriForm.isyeriId, satir[0], satir[1]);
      });
      diyalogKapat(el('acilPlanDiyalog'));
      B.bildir('Acil durum planı ve ekip kaydedildi.', 'basari');
      ciz();
    });
  }

  /* ---------- Filtreler ve dosya girişleri ---------- */

  function filtreBagla() {
    document.addEventListener('input', function (olay) {
      var kutu = olay.target;
      if (!kutu || !kutu.getAttribute) { return; }
      var anahtar = kutu.getAttribute('data-ui');
      if (!anahtar) { return; }
      if (kutu.tagName === 'SELECT' || kutu.type === 'date' || kutu.type === 'number') { return; }
      UI[anahtar] = kutu.value;
      if (anahtar.indexOf('dosya') === 0) { UI.dosyaSayfa = 1; }
      if (anahtar === 'raporBaslangic' || anahtar === 'raporBitis') { return; }
      odakBilgi = anahtar;
      cizGecikmeli();
    });

    document.addEventListener('change', function (olay) {
      var kutu = olay.target;
      var anahtar = kutu && kutu.getAttribute ? kutu.getAttribute('data-ui') : '';
      if (!anahtar) { return; }
      if (kutu.type === 'search' || kutu.type === 'text' || kutu.type === 'email' || kutu.type === 'tel') { return; }
      UI[anahtar] = kutu.value;
      if (anahtar.indexOf('dosya') === 0) { UI.dosyaSayfa = 1; }
      if (anahtar === 'kapsam') { UI.dosyaSayfa = 1; UI.acikPersonel = ''; }
      ciz(true);
    });
  }

  function ekGirdisiBagla(girdiId, formId, kaynak, listeId, ozetId) {
    var girdi = el(girdiId);
    if (!girdi) { return; }
    girdi.addEventListener('change', function () {
      var secilen = this.files && this.files[0];
      if (!secilen) { return; }
      var form = el(formId);
      var kaynakId = form && form.elements.isyeriId ? form.elements.isyeriId.value : '';
      ekYukle(kaynak, kaynakId, secilen, listeId, ozetId);
      this.value = '';
    });
  }

  function dosyaGirdileriBagla() {
    var belgeGirdi = el('dosyaBelgeGirdi');
    if (belgeGirdi) {
      belgeGirdi.addEventListener('change', function () {
        var secilen = this.files && this.files[0];
        if (!secilen) { return; }
        belgeYukle(secilen);
        this.value = '';
      });
    }

    ekGirdisiBagla('riskEkipBelgeGirdi', 'riskEkipForm', 'risk', 'riskEkipBelgeListe', 'riskEkipBelgeOzet');
    ekGirdisiBagla('acilPlanBelgeGirdi', 'acilPlanForm', 'acil', 'acilPlanBelgeListe', 'acilPlanBelgeOzet');

    var personelGirdi = el('personelDosya');
    if (personelGirdi) {
      personelGirdi.addEventListener('change', function () {
        var secilen = this.files && this.files[0];
        if (!secilen) { return; }
        personelDosyaOku(secilen);
        this.value = '';
      });
    }

    var yedekGirdi = el('yedekDosya');
    if (yedekGirdi) {
      yedekGirdi.addEventListener('change', function () {
        var secilen = this.files && this.files[0];
        if (!secilen) { return; }
        var okuyucu = new FileReader();
        okuyucu.onload = function () {
          try {
            D.iceAktar(String(okuyucu.result || ''));
            UI.kapsam = '';
            B.bildir('Yedek geri yüklendi.', 'basari');
            ciz();
          } catch (hata) {
            B.bildir('Yedek yüklenemedi: ' + hata.message, 'hata');
          }
        };
        okuyucu.readAsText(secilen, 'utf-8');
        this.value = '';
      });
    }

    var riskForm = el('riskEkipForm');
    if (riskForm && riskForm.elements.sonDegerlendirme) {
      riskForm.elements.sonDegerlendirme.addEventListener('change', function () {
        var isyeri = ISG.isyeriBul(veri(), riskForm.elements.isyeriId.value);
        var sinif = isyeri ? ISG.RISK_SINIFLARI[isyeri.tehlikeSinifi] : null;
        if (this.value && sinif) {
          riskForm.elements.enGecYenileme.value = ISG.yilEkle(this.value, sinif.riskYenilemeYil);
        }
      });
    }

    var ekipForm = el('ekipUyeForm');
    if (ekipForm && ekipForm.elements.rol) {
      ekipForm.elements.rol.addEventListener('change', function () {
        var kaynak = ekipForm.elements.kaynak.value === 'acil' ? 'acil' : 'risk';
        var isyeriId = ekipForm.elements.isyeriId.value;
        var isyeri = ISG.isyeriBul(veri(), isyeriId);
        var mevcut = ekipUyeMevcut(kaynak, isyeriId, this.value);
        ekipForm.elements.ad.value = mevcut ? mevcut.ad : '';
        ekipForm.elements.personelId.value = (mevcut && mevcut.personelId) || '';
        el('ekipUyeBaslik').textContent = (isyeri ? isyeri.ad : 'Ekip') + ' · ' + rolEtiketi(kaynak, this.value);
        uyariGoster('ekipUyeUyari', '');
      });
      ekipForm.elements.personelId.addEventListener('change', function () {
        var secilenId = this.value;
        if (!secilenId) { return; }
        var kisi = veri().personel.filter(function (p) { return p.id === secilenId; })[0];
        if (kisi) { ekipForm.elements.ad.value = kisi.adSoyad; }
        uyariGoster('ekipUyeUyari', '');
      });
    }
  }


  /* ---------- Başlat ---------- */

  function hazirla() {
    if (baglandi) { return; }
    baglandi = true;

    formlariBagla();
    filtreBagla();
    dosyaGirdileriBagla();
    bulutBagla();

    document.addEventListener('click', tiklamaIslemi);

    var onay = el('onayEvet');
    if (onay) {
      onay.addEventListener('click', function () {
        diyalogKapat(el('onayDiyalog'));
        var eylem = bekleyenOnay;
        bekleyenOnay = null;
        if (typeof eylem === 'function') { eylem(); }
      });
    }

    var perde = el('perde');
    if (perde) { perde.addEventListener('click', kenariKapat); }

    global.addEventListener('hashchange', function () { ciz(); });
    global.addEventListener('storage', function (olay) {
      if (olay.key === 'isgtakip.v4' || olay.key === 'isgtakip.v3' || olay.key === 'isgtakip.oturum') { global.location.reload(); }
    });

    document.addEventListener('keydown', function (olay) {
      if (olay.key === 'Escape') { kenariKapat(); }
    });
  }

  /* Oturum açıldıktan sonra arayüzü hazırlar ve ilk çizimi yapar. */
  var temizlikBildirildi = false;
  function temizlikBildir() {
    if (temizlikBildirildi || typeof D.temizlikBilgisi !== 'function') { return; }
    var bilgi = D.temizlikBilgisi();
    if (!bilgi) { return; }
    temizlikBildirildi = true;
    B.bildir('Örnek veriler temizlendi: ' + bilgi.adet + ' kayıt silindi. ' +
      (bilgi.yedekVar ? 'Eski veriyi üst bardaki "Eski veri" düğmesiyle indirebilirsiniz.' : ''), 'bilgi');
  }

  function girisSonrasi() {
    hazirla();
    kisileriDoldur();
    rolArayuzu();
    ciz();
    temizlikBildir();
  }

  function baslat() {
    try {
      if (global.localStorage.getItem('isgtakip.menu') === 'kapali') { document.body.classList.add('menu-kapali'); }
    } catch (hata) { /* yok say */ }

    if (ISG.giris && typeof ISG.giris.baslat === 'function') {
      var acik = ISG.giris.baslat(girisSonrasi);
      if (!acik) { return; }
    }

    girisSonrasi();
  }

  ISG.uygulama = {
    ciz: ciz,
    git: git,
    baslat: baslat,
    girisSonrasi: girisSonrasi,
    personelIceAktar: personelIceAktar,
    personelSatirlariAktar: personelSatirlariAktar
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baslat);
  } else {
    baslat();
  }
})(window);











