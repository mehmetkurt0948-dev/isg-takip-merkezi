/* İSG Takip Merkezi — giriş ekranı, davet kodu kabulü ve oturum açma
   depo.js + bicim.js + yetki.js sonrasında, uygulama.js öncesinde yüklenir. */
(function (global) {
  'use strict';

  var ISG = global.ISG;
  var B = ISG.bicim;
  var D = ISG.depo;
  var Y = ISG.yetki;

  var katman = null;
  var sonrakiIslem = null;
  var baglandi = false;

  function el(id) { return document.getElementById(id); }
  function kacis(deger) { return B.kacis(deger); }

  function uyariGoster(id, mesaj) {
    var kutu = el(id);
    if (!kutu) { return; }
    if (!mesaj) { kutu.hidden = true; kutu.textContent = ''; return; }
    kutu.hidden = false;
    kutu.textContent = mesaj;
  }

  /* ---------- Doğrulama ---------- */

  /* Kayıtlı e-postaları hatırlatan hata metni: yanlış adres yazıldığında
     kullanıcı hangi hesapların tanımlı olduğunu giriş ekranında görür. */
  function kayitliEpostaIpucu() {
    var liste = (D.al().kullanicilar || []).filter(function (kullanici) {
      return kullanici.eposta && kullanici.aktif !== false;
    }).map(function (kullanici) { return kullanici.eposta; });
    if (!liste.length) {
      return 'Bu e-posta ile kayıtlı kullanıcı bulunamadı. Tanımlı hesap yok; yönetici hesabıyla veri yedeğini geri yükleyin.';
    }
    return 'Bu e-posta ile kayıtlı kullanıcı bulunamadı. Kayıtlı hesaplar: ' + liste.join(', ') + '.';
  }

  function kullaniciDogrula(eposta, sifre) {
    var kullanici = D.kullaniciEpostaBul(eposta);
    if (!kullanici) { throw new Error(kayitliEpostaIpucu()); }
    if (kullanici.aktif === false) { throw new Error('Bu kullanıcı pasif durumda, yöneticinizle görüşün.'); }
    if (String(kullanici.sifre || '') !== String(sifre || '')) { throw new Error('Şifre hatalı, yeniden deneyin.'); }
    return kullanici;
  }

  function davetKabulEt(alanlar) {
    var kod = String(alanlar.kod || '').trim().toUpperCase();
    var eposta = String(alanlar.eposta || '').trim().toLowerCase();
    var davet = D.davetKodBul(kod);
    if (!davet) { throw new Error('Davet kodu bulunamadı. Kodu yöneticinizden tekrar isteyin.'); }
    if (davet.durum === 'kabul') { throw new Error('Bu davet kodu daha önce kullanılmış.'); }
    if (davet.eposta && String(davet.eposta).toLowerCase() !== eposta) {
      throw new Error('Bu kod ' + davet.eposta + ' adresine tanımlı; farklı e-posta ile kullanılamaz.');
    }
    if (D.kullaniciEpostaBul(eposta)) {
      throw new Error('Bu e-posta ile bir kullanıcı zaten var. "Giriş" sekmesini kullanın.');
    }
    if (String(alanlar.sifre || '').length < 4) { throw new Error('Şifre en az 4 karakter olmalı.'); }
    if (alanlar.sifre !== alanlar.sifreTekrar) { throw new Error('Şifreler birbiriyle uyuşmuyor.'); }

    var kullanici = Y.korunmasiz('kullaniciKaydet')({
      adSoyad: alanlar.adSoyad,
      eposta: eposta,
      sifre: alanlar.sifre,
      rol: davet.rol || 'yetkili',
      gorev: davet.gorev || '',
      isyerleri: (davet.isyerleri || []).slice(),
      aktif: true
    });
    D.davetKabul(davet.id, kullanici.id);
    D.denetimEkle({
      tur: 'davet', islem: 'davetKabul', kullaniciId: kullanici.id, kullaniciAd: kullanici.adSoyad,
      isyeriId: (davet.isyerleri || [])[0] || '', ozet: 'Davet kodu ile hesap açıldı: ' + kod
    });
    return kullanici;
  }

  /* ---------- Oturum ---------- */

  function girisiTamamla(kullanici) {
    Y.oturumAc(kullanici);
    D.kullaniciGirisIsaretle(kullanici.id);
    gizle();
    B.bildir('Hoş geldiniz, ' + (kullanici.adSoyad || kullanici.eposta) + '.', 'basari');
    if (typeof sonrakiIslem === 'function') { sonrakiIslem(); }
  }

  function cikis() {
    Y.oturumKapat();
    try { global.location.reload(); } catch (hata) { goster(); }
  }


  /* ---------- Arayüz ---------- */

  function demoKullanicilar() {
    return (D.al().kullanicilar || []).filter(function (kullanici) {
      return kullanici.eposta && kullanici.aktif !== false;
    }).map(function (kullanici) {
      return {
        adSoyad: kullanici.adSoyad || '',
        eposta: kullanici.eposta || '',
        sifre: kullanici.sifre || '',
        rol: Y.rolTanimi(kullanici.rol).ad
      };
    });
  }

  function demoHtml() {
    var liste = demoKullanicilar();
    if (!liste.length) {
      return '<p class="muted kucuk">Kayıtlı kullanıcı bulunamadı. Yönetici hesabıyla veri yedeğini geri yükleyin.</p>';
    }
    return liste.map(function (kullanici) {
      return '<button type="button" class="giris-demo-oge" data-demo-eposta="' + kacis(kullanici.eposta) +
        '" data-demo-sifre="' + kacis(kullanici.sifre) + '">' +
        '<strong>' + kacis(kullanici.adSoyad) + '</strong>' +
        '<small>' + kacis(kullanici.rol) + ' · ' + kacis(kullanici.eposta) + '</small>' +
        '</button>';
    }).join('');
  }

  function kabukHtml() {
    return '' +
      '<div class="giris-kart" role="dialog" aria-modal="true" aria-labelledby="girisBaslik">' +
        '<div class="giris-marka">' +
          '<span class="giris-logo" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24"><path d="M12 2 4 5v6.5c0 5 3.4 9.4 8 10.5 4.6-1.1 8-5.5 8-10.5V5l-8-3Zm-1.2 13.6-3.2-3.2 1.4-1.4 1.8 1.8 4.2-4.2 1.4 1.4-5.6 5.6Z"/></svg>' +
          '</span>' +
          '<span class="giris-marka-metin"><strong><span class="marka-isg">isg</span> takip</strong><small>İSG TAKİP MERKEZİ</small></span>' +
        '</div>' +
        '<h1 id="girisBaslik">Oturum aç</h1>' +
        '<p class="giris-aciklama">Yetkili hesabınızla giriş yapın. İşyeri kapsamınız ve işlem yetkileriniz hesabınıza tanımlıdır.</p>' +

        '<div class="sekme-satir giris-sekmeler" role="tablist" aria-label="Giriş yöntemi">' +
          '<button type="button" class="sekme aktif" role="tab" aria-selected="true" data-giris-sekme="giris">Giriş</button>' +
          '<button type="button" class="sekme" role="tab" aria-selected="false" data-giris-sekme="davet">Davet kodum var</button>' +
        '</div>' +

        '<form id="girisForm" class="giris-form" novalidate>' +
          '<label class="alan"><span>E-posta</span>' +
            '<input type="email" name="eposta" id="girisEposta" autocomplete="username" placeholder="ad.soyad@ornek.com" required>' +
          '</label>' +
          '<label class="alan"><span>Şifre</span>' +
            '<input type="password" name="sifre" id="girisSifre" autocomplete="current-password" placeholder="••••••" required>' +
          '</label>' +
          '<p class="form-uyari" id="girisUyari" role="alert" hidden></p>' +
          '<button type="submit" class="dugme birincil giris-dugme">Giriş yap</button>' +
        '</form>' +

        '<form id="davetGirisForm" class="giris-form" hidden novalidate>' +
          '<label class="alan"><span>Davet kodu</span>' +
            '<input type="text" name="kod" id="davetKod" autocomplete="off" placeholder="ISG-XXXXXX" required>' +
          '</label>' +
          '<label class="alan"><span>Ad soyad</span>' +
            '<input type="text" name="adSoyad" autocomplete="name" placeholder="Ad Soyad" required>' +
          '</label>' +
          '<label class="alan"><span>E-posta</span>' +
            '<input type="email" name="eposta" autocomplete="email" placeholder="ad.soyad@ornek.com" required>' +
          '</label>' +
          '<div class="form-izgara">' +
            '<label class="alan"><span>Şifre</span>' +
              '<input type="password" name="sifre" autocomplete="new-password" placeholder="En az 4 karakter" required>' +
            '</label>' +
            '<label class="alan"><span>Şifre (tekrar)</span>' +
              '<input type="password" name="sifreTekrar" autocomplete="new-password" placeholder="Şifreyi yineleyin" required>' +
            '</label>' +
          '</div>' +
          '<p class="form-uyari" id="davetUyari" role="alert" hidden></p>' +
          '<button type="submit" class="dugme birincil giris-dugme">Daveti kabul et ve giriş yap</button>' +
          '<p class="giris-ipucu">Davet kodu, işyeri kapsamınızı ve rolünüzü belirler; yöneticiniz tarafından oluşturulur.</p>' +
        '</form>' +

        '<div class="giris-demo">' +
          '<p class="giris-demo-baslik">Demo hesapları<span class="muted kucuk"> — seçmek için tıklayın</span></p>' +
          '<div class="giris-demo-liste">' + demoHtml() + '</div>' +
        '</div>' +
      '</div>';
  }

  function sekmeSec(ad) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-giris-sekme]'), function (dugme) {
      var aktif = dugme.getAttribute('data-giris-sekme') === ad;
      dugme.classList.toggle('aktif', aktif);
      dugme.setAttribute('aria-selected', aktif ? 'true' : 'false');
    });
    var girisForm = el('girisForm');
    var davetForm = el('davetGirisForm');
    if (girisForm) { girisForm.hidden = ad !== 'giris'; }
    if (davetForm) { davetForm.hidden = ad !== 'davet'; }
    var odak = ad === 'davet' ? el('davetKod') : el('girisEposta');
    if (odak) { setTimeout(function () { try { odak.focus(); } catch (hata) { /* yok say */ } }, 30); }
  }

  function formDegerleri(form) {
    var alanlar = {};
    new FormData(form).forEach(function (deger, anahtar) { alanlar[anahtar] = String(deger).trim(); });
    return alanlar;
  }

  function girisGonder(olay) {
    olay.preventDefault();
    var form = olay.target;
    if (!form || String(form.tagName).toUpperCase() !== 'FORM') { return; }
    var alanlar = formDegerleri(form);
    uyariGoster('girisUyari', '');
    if (!alanlar.eposta || !alanlar.sifre) {
      uyariGoster('girisUyari', 'E-posta ve şifre alanlarını doldurun.');
      return;
    }
    try {
      var kullanici = kullaniciDogrula(alanlar.eposta, alanlar.sifre);
      form.reset();
      girisiTamamla(kullanici);
    } catch (hata) {
      uyariGoster('girisUyari', hata.message);
    }
  }

  function davetGonder(olay) {
    olay.preventDefault();
    var form = olay.target;
    if (!form || String(form.tagName).toUpperCase() !== 'FORM') { return; }
    var alanlar = formDegerleri(form);
    uyariGoster('davetUyari', '');
    if (!alanlar.kod || !alanlar.adSoyad || !alanlar.eposta || !alanlar.sifre) {
      uyariGoster('davetUyari', 'Tüm alanları doldurun.');
      return;
    }
    try {
      var kullanici = davetKabulEt(alanlar);
      form.reset();
      girisiTamamla(kullanici);
    } catch (hata) {
      uyariGoster('davetUyari', hata.message);
    }
  }

  function demoSec(dugme) {
    var epostaGirdi = el('girisEposta');
    var sifreGirdi = el('girisSifre');
    if (!epostaGirdi || !sifreGirdi) { return; }
    sekmeSec('giris');
    epostaGirdi.value = dugme.getAttribute('data-demo-eposta') || '';
    sifreGirdi.value = dugme.getAttribute('data-demo-sifre') || '';
    uyariGoster('girisUyari', '');
    sifreGirdi.focus();
  }

  function bagla() {
    if (baglandi) { return; }
    baglandi = true;

    document.addEventListener('submit', function (olay) {
      if (!olay.target) { return; }
      if (olay.target.id === 'girisForm') { girisGonder(olay); }
      if (olay.target.id === 'davetGirisForm') { davetGonder(olay); }
    });

    document.addEventListener('click', function (olay) {
      var hedef = olay.target;
      if (!hedef || !hedef.closest) { return; }
      var sekme = hedef.closest('[data-giris-sekme]');
      if (sekme && katman && katman.contains(sekme)) {
        sekmeSec(sekme.getAttribute('data-giris-sekme'));
        return;
      }
      var demo = hedef.closest('[data-demo-eposta]');
      if (demo && katman && katman.contains(demo)) { demoSec(demo); }
    });
  }

  function kur() {
    if (katman) { return katman; }
    katman = el('girisKatman');
    if (!katman) { return null; }
    katman.innerHTML = kabukHtml();
    return katman;
  }

  function goster() {
    if (!kur()) { return; }
    katman.hidden = false;
    document.body.classList.add('oturum-yok');
    var kabuk = el('kabuk');
    if (kabuk) { kabuk.setAttribute('aria-hidden', 'true'); }
    var eposta = el('girisEposta');
    if (eposta) { setTimeout(function () { try { eposta.focus(); } catch (hata) { /* yok say */ } }, 60); }
  }

  function gizle() {
    if (katman) { katman.hidden = true; }
    document.body.classList.remove('oturum-yok');
    var kabuk = el('kabuk');
    if (kabuk) { kabuk.removeAttribute('aria-hidden'); }
  }

  /* Oturum varsa true döner; yoksa giriş ekranını gösterip false döner. */
  function baslat(geriCagirim) {
    sonrakiIslem = geriCagirim || null;
    bagla();
    if (Y.oturum()) {
      gizle();
      return true;
    }
    goster();
    return false;
  }

  ISG.giris = {
    baslat: baslat,
    goster: goster,
    gizle: gizle,
    cikis: cikis,
    sekmeSec: sekmeSec,
    kullaniciDogrula: kullaniciDogrula,
    davetKabulEt: davetKabulEt
  };
})(window);

