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


  /* ---------- Şifre sıfırlama (e-posta kodu) ---------- */

  /* Statik sitede sunucu yok; kod e-posta ile gönderilsin isteniyorsa
     EmailJS hesabından alınan üç değer aşağıya yazılır. Değerler boşken
     kod gönderilemez ve uygulama kodu ekranda gösterip bunu açıkça bildirir. */
  var POSTA = {
    servisId: '',
    sablonId: '',
    genelAnahtar: '',
    adres: 'https://api.emailjs.com/api/v1.0/email/send'
  };

  var SIFIRLAMA_ANAHTAR = 'isgtakip.sifirlama';
  var KOD_GECERLILIK_DK = 10;
  var KOD_DENEME_SINIRI = 5;

  function sifirlamaOku() {
    try {
      var ham = global.localStorage.getItem(SIFIRLAMA_ANAHTAR);
      var kayit = ham ? JSON.parse(ham) : null;
      return kayit && kayit.kod ? kayit : null;
    } catch (hata) {
      return null;
    }
  }

  function sifirlamaYaz(kayit) {
    try {
      if (kayit) { global.localStorage.setItem(SIFIRLAMA_ANAHTAR, JSON.stringify(kayit)); }
      else { global.localStorage.removeItem(SIFIRLAMA_ANAHTAR); }
    } catch (hata) { /* depolama yoksa kod yalnızca bu sekmede geçerli olur */ }
  }

  function kodUret() {
    if (global.crypto && typeof global.crypto.getRandomValues === 'function') {
      var dizi = new Uint32Array(1);
      global.crypto.getRandomValues(dizi);
      return String(100000 + (dizi[0] % 900000));
    }
    return String(100000 + Math.floor(Math.random() * 900000));
  }

  function postaTanimli() {
    return !!(POSTA.servisId && POSTA.sablonId && POSTA.genelAnahtar);
  }

  function postaGonder(kayit) {
    if (!postaTanimli()) { return Promise.resolve({ gonderildi: false, neden: 'tanimsiz' }); }
    if (typeof global.fetch !== 'function') { return Promise.resolve({ gonderildi: false, neden: 'fetch-yok' }); }
    var govde = {
      service_id: POSTA.servisId,
      template_id: POSTA.sablonId,
      user_id: POSTA.genelAnahtar,
      template_params: {
        to_email: kayit.eposta,
        kod: kayit.kod,
        gecerlilik_dakika: KOD_GECERLILIK_DK,
        kurum: 'İSG Takip Merkezi'
      }
    };
    return global.fetch(POSTA.adres, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(govde)
    }).then(function (yanit) {
      if (!yanit || !yanit.ok) { throw new Error('HTTP ' + (yanit ? yanit.status : '?') ); }
      return { gonderildi: true };
    }).catch(function (hata) {
      return { gonderildi: false, neden: hata && hata.message ? hata.message : 'gonderilemedi' };
    });
  }

  /* Kodu üretir, saklar ve göndermeyi dener. Dönen söz (promise)
     { kayit, sonuc, kullanici } nesnesi verir. */
  function kodGonder(eposta) {
    var kullanici = D.kullaniciEpostaBul(eposta);
    if (!kullanici) { return Promise.reject(new Error(kayitliEpostaIpucu())); }
    if (kullanici.aktif === false) {
      return Promise.reject(new Error('Bu kullanıcı pasif durumda, yöneticinizle görüşün.'));
    }
    var simdi = Date.now();
    var kayit = {
      eposta: String(kullanici.eposta || '').toLowerCase(),
      kod: kodUret(),
      olusturma: simdi,
      sonGecerlilik: simdi + KOD_GECERLILIK_DK * 60000,
      deneme: 0,
      gonderildi: false
    };
    sifirlamaYaz(kayit);
    return postaGonder(kayit).then(function (sonuc) {
      kayit.gonderildi = !!sonuc.gonderildi;
      kayit.hata = sonuc.neden || '';
      sifirlamaYaz(kayit);
      return { kayit: kayit, sonuc: sonuc, kullanici: kullanici };
    });
  }

  function kodDogrula(eposta, kod) {
    var kayit = sifirlamaOku();
    if (!kayit) { throw new Error('Önce kod isteyin.'); }
    if (String(kayit.eposta) !== String(eposta || '').trim().toLowerCase()) {
      throw new Error('Kod bu e-posta için istenmedi. Kodu yeniden talep edin.');
    }
    if (Date.now() > Number(kayit.sonGecerlilik)) {
      sifirlamaYaz(null);
      throw new Error('Kodun süresi doldu. Yeni kod isteyin.');
    }
    if (Number(kayit.deneme) >= KOD_DENEME_SINIRI) {
      sifirlamaYaz(null);
      throw new Error('Çok fazla hatalı deneme yapıldı. Yeni kod isteyin.');
    }
    if (String(kod || '').trim() !== String(kayit.kod)) {
      kayit.deneme = Number(kayit.deneme) + 1;
      sifirlamaYaz(kayit);
      throw new Error('Kod hatalı. Kalan deneme: ' + (KOD_DENEME_SINIRI - kayit.deneme) + '.');
    }
    return kayit;
  }

  function sifreSifirla(eposta, kod, yeniSifre, sifreTekrar) {
    var kayit = kodDogrula(eposta, kod);
    if (String(yeniSifre || '').length < 6) { throw new Error('Yeni şifre en az 6 karakter olmalı.'); }
    if (yeniSifre !== sifreTekrar) { throw new Error('Yeni şifreler birbiriyle uyuşmuyor.'); }
    var kullanici = Y.korunmasiz('sifreGuncelle')(kayit.eposta, yeniSifre);
    if (!kullanici) { throw new Error('Kullanıcı bulunamadı.'); }
    sifirlamaYaz(null);
    try {
      D.denetimEkle({
        tur: 'sifre', islem: 'sifreSifirla', kullaniciId: kullanici.id,
        kullaniciAd: kullanici.adSoyad || '', ozet: 'Şifre e-posta koduyla yenilendi'
      });
    } catch (hata) { /* denetim kaydı yazılamazsa işlem sürer */ }
    return kullanici;
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
          '<button type="button" class="sekme" role="tab" aria-selected="false" data-giris-sekme="sifirla">Şifremi unuttum</button>' +
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

        '<form id="sifirlaForm" class="giris-form" hidden novalidate>' +
          '<div id="sifirlaAdim1">' +
            '<label class="alan"><span>E-posta</span>' +
              '<input type="email" name="eposta" id="sifirlaEposta" autocomplete="username" placeholder="ad.soyad@ornek.com" required>' +
            '</label>' +
            '<p class="giris-ipucu">Kayıtlı e-posta adresinize 6 haneli doğrulama kodu göndereceğiz. Kod ' + KOD_GECERLILIK_DK + ' dakika geçerlidir.</p>' +
            '<button type="submit" class="dugme birincil giris-dugme" id="sifirlaGonderDugme">Kod gönder</button>' +
          '</div>' +
          '<div id="sifirlaAdim2" hidden>' +
            '<div class="sifirla-kod" id="sifirlaKodKutu" hidden>' +
              '<span>Doğrulama kodu (e-posta gönderilemedi)</span>' +
              '<code id="sifirlaKod"></code>' +
            '</div>' +
            '<label class="alan"><span>Doğrulama kodu</span>' +
              '<input type="text" name="kod" id="sifirlaKodGirdi" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="6 hane" required>' +
            '</label>' +
            '<div class="form-izgara">' +
              '<label class="alan"><span>Yeni şifre</span>' +
                '<input type="password" name="sifre" autocomplete="new-password" placeholder="En az 6 karakter" required>' +
              '</label>' +
              '<label class="alan"><span>Yeni şifre (tekrar)</span>' +
                '<input type="password" name="sifreTekrar" autocomplete="new-password" placeholder="Şifreyi yineleyin" required>' +
              '</label>' +
            '</div>' +
            '<button type="submit" class="dugme birincil giris-dugme">Şifreyi güncelle</button>' +
            '<button type="button" class="baglanti-dugme sifirla-geri" id="sifirlaGeri">Kodu yeniden gönder</button>' +
          '</div>' +
          '<p class="form-uyari" id="sifirlaUyari" role="alert" hidden></p>' +
          '<p class="giris-ipucu" id="sifirlaBilgi" hidden></p>' +
        '</form>' +
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
    var sifirlaForm = el('sifirlaForm');
    if (girisForm) { girisForm.hidden = ad !== 'giris'; }
    if (davetForm) { davetForm.hidden = ad !== 'davet'; }
    if (sifirlaForm) { sifirlaForm.hidden = ad !== 'sifirla'; }
    if (ad === 'sifirla') { sifirlaAdimi(1); }
    var odak = ad === 'davet' ? el('davetKod') : (ad === 'sifirla' ? el('sifirlaEposta') : el('girisEposta'));
    if (odak) { setTimeout(function () { try { odak.focus(); } catch (hata) { /* yok say */ } }, 30); }
  }

  function sifirlaAdimi(adim) {
    var bir = el('sifirlaAdim1');
    var iki = el('sifirlaAdim2');
    if (bir) { bir.hidden = adim !== 1; }
    if (iki) { iki.hidden = adim !== 2; }
    if (adim === 2) {
      var kodGirdi = el('sifirlaKodGirdi');
      if (kodGirdi) { setTimeout(function () { try { kodGirdi.focus(); } catch (hata) { /* yok say */ } }, 30); }
    }
  }

  function bilgiGoster(metin, uyari) {
    var kutu = el('sifirlaBilgi');
    if (!kutu) { return; }
    if (!metin) { kutu.hidden = true; kutu.textContent = ''; kutu.classList.remove('uyari'); return; }
    kutu.hidden = false;
    kutu.textContent = metin;
    kutu.classList.toggle('uyari', !!uyari);
  }

  function sifirlaKoduGoster(kayit) {
    var kutu = el('sifirlaKodKutu');
    var kod = el('sifirlaKod');
    if (!kutu || !kod) { return; }
    kutu.hidden = false;
    kod.textContent = String((kayit && kayit.kod) || '');
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

  function sifirlaGonder(olay) {
    olay.preventDefault();
    var form = olay.target;
    if (!form || !form.elements) { return; }
    var eposta = String((form.elements.eposta || {}).value || '').trim();
    uyariGoster('sifirlaUyari', '');
    bilgiGoster('');
    var kutu = el('sifirlaKodKutu');
    if (kutu) { kutu.hidden = true; }
    if (!eposta) {
      uyariGoster('sifirlaUyari', 'E-posta adresinizi yazın.');
      return;
    }
    var dugme = el('sifirlaGonderDugme');
    if (dugme) { dugme.disabled = true; }
    kodGonder(eposta).then(function (sonuc) {
      sifirlaAdimi(2);
      if (sonuc.sonuc.gonderildi) {
        bilgiGoster(sonuc.kayit.eposta + ' adresine 6 haneli kod gönderildi. Kod ' +
          KOD_GECERLILIK_DK + ' dakika geçerlidir.');
      } else {
        sifirlaKoduGoster(sonuc.kayit);
        bilgiGoster('E-posta servisi tanımlı değil ya da gönderim başarısız oldu; kod ekranda gösteriliyor. ' +
          'Kurulumda EmailJS bilgileri girildiğinde kod e-posta ile gönderilir.', true);
      }
    }).catch(function (hata) {
      uyariGoster('sifirlaUyari', hata.message);
    }).then(function () {
      if (dugme) { dugme.disabled = false; }
    });
  }

  function sifirlaKaydet(olay) {
    olay.preventDefault();
    var form = olay.target;
    if (!form || !form.elements) { return; }
    var eposta = String((form.elements.eposta || {}).value || '').trim();
    var kod = String((form.elements.kod || {}).value || '').trim();
    var sifre = String((form.elements.sifre || {}).value || '');
    var sifreTekrar = String((form.elements.sifreTekrar || {}).value || '');
    uyariGoster('sifirlaUyari', '');
    if (!/^\d{6}$/.test(kod)) {
      uyariGoster('sifirlaUyari', 'Doğrulama kodu 6 haneli sayı olmalı.');
      return;
    }
    try {
      sifreSifirla(eposta, kod, sifre, sifreTekrar);
      var epostaGirdi = el('girisEposta');
      var kutu = el('sifirlaKodKutu');
      form.reset();
      sifirlaAdimi(1);
      bilgiGoster('');
      if (kutu) { kutu.hidden = true; }
      sekmeSec('giris');
      if (epostaGirdi) { epostaGirdi.value = eposta.toLowerCase(); }
      B.bildir('Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.', 'basari');
    } catch (hata) {
      uyariGoster('sifirlaUyari', hata.message);
    }
  }

  function bagla() {
    if (baglandi) { return; }
    baglandi = true;

    document.addEventListener('submit', function (olay) {
      if (!olay.target) { return; }
      if (olay.target.id === 'girisForm') { girisGonder(olay); }
      if (olay.target.id === 'davetGirisForm') { davetGonder(olay); }
      if (olay.target.id === 'sifirlaForm') {
        var ikinciAdim = el('sifirlaAdim2');
        if (ikinciAdim && !ikinciAdim.hidden) { sifirlaKaydet(olay); }
        else { sifirlaGonder(olay); }
      }
    });

    document.addEventListener('click', function (olay) {
      var hedef = olay.target;
      if (!hedef || !hedef.closest) { return; }
      var sekme = hedef.closest('[data-giris-sekme]');
      if (sekme && katman && katman.contains(sekme)) {
        sekmeSec(sekme.getAttribute('data-giris-sekme'));
        return;
      }
      var geri = hedef.closest('#sifirlaGeri');
      if (geri && katman && katman.contains(geri)) {
        var eposta = el('sifirlaEposta');
        uyariGoster('sifirlaUyari', '');
        bilgiGoster('');
        var kutu = el('sifirlaKodKutu');
        if (kutu) { kutu.hidden = true; }
        sifirlaAdimi(1);
        if (eposta) {
          setTimeout(function () { try { eposta.focus(); } catch (hata) { /* yok say */ } }, 30);
        }
      }
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
    davetKabulEt: davetKabulEt,
    kodGonder: kodGonder,
    kodDogrula: kodDogrula,
    sifreSifirla: sifreSifirla,
    sifirlamaOku: sifirlamaOku,
    sifirlamaSil: function () { sifirlamaYaz(null); },
    kodGecerlilikDk: KOD_GECERLILIK_DK,
    denemeSiniri: KOD_DENEME_SINIRI
  };
})(window);

