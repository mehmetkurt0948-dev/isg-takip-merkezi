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
    risk: 'Risk değerlendirmesi',
    acil: 'Acil durum planı',
    ekip: 'Ekip ve davetler',
    mevzuat: 'Mevzuat ve kapsam'
  };

  var bekleyenOnay = null;
  var cizZamanlayici = null;
  var odakBilgi = null;

  function el(id) { return document.getElementById(id); }
  function veri() { return D.al(); }

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

  function tarihliAd(onek) {
    var d = new Date();
    return onek + '-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '.csv';
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

    var kullanici = hesap.ayarlar.kullanici || 'Mehmet Kurt';
    var parcalar = kullanici.split(' ');
    var avatar = el('kullaniciAvatar');
    if (avatar) { avatar.textContent = (parcalar[0][0] || '') + (parcalar[1] ? parcalar[1][0] : ''); }
    var ad = el('kullaniciAd');
    if (ad) { ad.textContent = kullanici; }
    var gorev = el('kullaniciGorev');
    if (gorev) { gorev.textContent = hesap.ayarlar.gorev || 'Yönetici oturumu'; }

    var durum = el('kayitDurumu');
    if (durum) {
      durum.classList.toggle('hata', !D.kaliciMi());
      durum.innerHTML = '<span></span>' + (D.kaliciMi() ? 'Yerel kayıt açık' : 'Kayıt yapılamıyor (gizli mod)');
    }
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
    diyalogAc(el('dosyaDiyalog'), form.elements.madde);
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
    diyalogAc(el('acilPlanDiyalog'), form.elements.hazirlanma);
  }

  /* ---------- Dışa aktarma ---------- */

  function csvPersonel(sablon) {
    var basliklar = ['Sicil No', 'Adı Soyadı', 'TC Kimlik No', 'Mesleği', 'Departman', 'Grup Kodu Açıklama', 'Şube', 'İşe Başlama', 'Kıdem Tarihi', 'Cep Telefonu', 'Cinsiyet', 'İşyeri', 'Durum', 'Eğitim geçerliliği'];
    if (sablon) {
      B.csv('personel-sablonu.csv', basliklar, [['1', 'Örnek Personel', '', 'Pres operatörü', 'Üretim', '', 'Merkez', '2024-01-15', '', '05xx xxx xx xx', 'Erkek', (veri().isyerleri[0] || {}).ad || '', 'aktif', '']]);
      B.bildir('Boş personel şablonu indirildi. Doldurup CSV içe aktar ile yükleyin.', 'basari');
      return;
    }
    var hesap = veri();
    var liste = hesap.personel.filter(function (kisi) { return !UI.kapsam || kisi.isyeriId === UI.kapsam; });
    B.csv(tarihliAd('personel'), basliklar, liste.map(function (kisi) {
      var durum = ISG.kisiDurumu(kisi, hesap.egitimler);
      return [kisi.sicil, kisi.adSoyad, kisi.tc, kisi.meslek, kisi.departman, kisi.grupKodu, kisi.sube,
        kisi.iseBaslama, kisi.kidemTarihi || '', kisi.telefon, kisi.cinsiyet, ISG.isyeriAdi(hesap, kisi.isyeriId),
        kisi.durum === 'aktif' ? 'Aktif' : 'Pasif', durum.gecerlilik || ''];
    }));
    B.bildir('Personel listesi Excel (CSV) olarak indirildi.', 'basari');
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

  function personelIceAktar(metin) {
    var satirlar = csvSatirlari(metin);
    if (satirlar.length < 2) {
      B.bildir('Dosyada başlık ve en az bir veri satırı olmalı.', 'hata');
      return;
    }
    var hesap = veri();
    var basliklar = satirlar[0].map(normalize);
    var indeks = {};
    basliklar.forEach(function (baslik, i) { indeks[baslik] = i; });
    var bul = function (satir, adlar) {
      for (var i = 0; i < adlar.length; i += 1) {
        var konum = indeks[normalize(adlar[i])];
        if (typeof konum === 'number' && satir[konum]) { return satir[konum]; }
      }
      return '';
    };

    var eklenen = 0;
    for (var s = 1; s < satirlar.length; s += 1) {
      var satir = satirlar[s];
      var adSoyad = bul(satir, ['Adı Soyadı', 'Ad Soyad']);
      if (!adSoyad) { continue; }
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
        iseBaslama: bul(satir, ['İşe Başlama', 'İşe Giriş']),
        telefon: bul(satir, ['Cep Telefonu', 'Telefon']),
        cinsiyet: bul(satir, ['Cinsiyet']),
        durum: normalize(bul(satir, ['Durum'])) === 'pasif' ? 'pasif' : 'aktif'
      });
      eklenen += 1;
    }
    B.bildir(eklenen + ' personel kaydı içe aktarıldı.', eklenen ? 'basari' : 'uyari');
    ciz();
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
        onayIste('Kurum silinsin mi?', 'Kurum adı ve tüm demo verileri sıfırlanacak. Bu işlem geri alınamaz.', function () {
          D.sifirla();
          UI.kapsam = '';
          B.bildir('Kurum verileri demo başlangıcına döndürüldü.', 'basari');
          ciz();
        }, 'Kurumu sil');
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
        csvPersonel(false);
        break;
      case 'personel-sablon':
        csvPersonel(true);
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
      case 'olay-kapat': {
        var olay = veri().olaylar.filter(function (o) { return o.id === id; })[0];
        if (!olay) { return; }
        olay.durum = olay.durum === 'kapali' ? 'acik' : 'kapali';
        D.olayKaydet(olay);
        B.bildir('Olay durumu güncellendi.', 'basari');
        ciz();
        break;
      }
      case 'olay-sil':
        onayIste('Olay bildirimi silinsin mi?', 'Bildirim kaydı silinecek.', function () {
          D.olaySil(id);
          B.bildir('Olay bildirimi silindi.', 'basari');
          ciz();
        });
        break;

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
      case 'demo-sifirla':
        onayIste('Demo verileri sıfırlansın mı?', 'Bu cihazdaki tüm yerel değişiklikler silinip örnek veriler geri yüklenecek.', function () {
          D.sifirla();
          UI.kapsam = '';
          B.bildir('Demo verileri sıfırlandı.', 'basari');
          ciz();
        }, 'Sıfırla');
        break;
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
    B.bildir('Davet oluşturuldu (demo: e-posta gönderilmedi).', 'basari');
    ciz();
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
      D.dosyaKaydet({
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

  function dosyaGirdileriBagla() {
    var personelGirdi = el('personelDosya');
    if (personelGirdi) {
      personelGirdi.addEventListener('change', function () {
        var secilen = this.files && this.files[0];
        if (!secilen) { return; }
        var okuyucu = new FileReader();
        okuyucu.onload = function () { personelIceAktar(String(okuyucu.result || '')); };
        okuyucu.onerror = function () { B.bildir('Dosya okunamadı.', 'hata'); };
        okuyucu.readAsText(secilen, 'utf-8');
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
  }


  /* ---------- Başlat ---------- */

  function baslat() {
    try {
      if (global.localStorage.getItem('isgtakip.menu') === 'kapali') { document.body.classList.add('menu-kapali'); }
    } catch (hata) { /* yok say */ }

    formlariBagla();
    filtreBagla();
    dosyaGirdileriBagla();

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
      if (olay.key === 'isgtakip.v2') { global.location.reload(); }
    });

    document.addEventListener('keydown', function (olay) {
      if (olay.key === 'Escape') { kenariKapat(); }
    });

    ciz();
  }

  ISG.uygulama = {
    ciz: ciz,
    git: git,
    baslat: baslat
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baslat);
  } else {
    baslat();
  }
})(window);











