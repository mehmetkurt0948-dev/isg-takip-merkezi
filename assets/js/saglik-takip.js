/* İSG Takip Merkezi — personel sağlık takibi modülü
   Hassas sağlık verileri: client-side şifreleme + erişim kontrolü + denetim izni.
   Bu dosya depo.js + yetki.js sonrasında yüklenir. */
(function (global) {
  'use strict';

  var ISG = global.ISG = global.ISG || {};
  var D = ISG.depo;
  var Y = ISG.yetki;

  /* ---------- Veri şeması ---------- */
  ISG.saglikAlanlari = [
    { id: 'personelId', ad: 'Personel', tip: 'text', zorunlu: true },
    { id: 'isyeriId', ad: 'İşyeri', tip: 'text', zorunlu: true },
    { id: 'tarih', ad: 'Muayene Tarihi', tip: 'date', zorunlu: true },
    { id: 'doktor', ad: 'Muayene Eden İşyeri Hekimi', tip: 'text' },
    { id: 'kanGrubu', ad: 'Kan Grubu', tip: 'text', gizli: true },
    { id: 'alerji', ad: 'Alerjiler', tip: 'textarea', gizli: true },
    { id: 'kronikHastalik', ad: 'Kronik Hastalıklar', tip: 'textarea', gizli: true },
    { id: 'ilac', ad: 'Kullanılan İlaçlar', tip: 'textarea', gizli: true },
    { id: 'engelDurumu', ad: 'Engel Durumu', tip: 'text', gizli: true },
    { id: 'sonMuayene', ad: 'Son Muayene Sonucu', tip: 'textarea', gizli: true },
    { id: 'sevkEdilen', ad: 'Sevk Edilen Hastane / Bölüm', tip: 'textarea', gizli: true },
    { id: 'calismaYasagi', ad: 'Çalışma Yasağı / Önerisi', tip: 'textarea', gizli: true },
    { id: 'izinsizlik', ad: 'İzinsizlik Günleri', tip: 'number', gizli: true },
    { id: 'calismaSesi', ad: 'Çalışma Şekli', tip: 'select', secenekler: ['saha', 'buro', 'karisik'] },
    { id: 'notlar', ad: 'Ek Notlar', tip: 'textarea', gizli: true },
    { id: 'girisYapan', ad: 'Giriş Yapan', tip: 'text', gizli: true }
  ];

  ISG.saglikGizliAlanlar = ['kanGrubu', 'alerji', 'kronikHastalik', 'ilac', 'engelDurumu', 'sonMuayene', 'sevkEdilen', 'calismaYasagi', 'izinsizlik', 'notlar', 'girisYapan'];

  /* ---------- Yerel kayıt uyumluluğu (gerçek güvenlik sınırı değildir) ---------- */
  /* Erişim sınırı ayrı sağlık kasası + yönetici onayıdır. Eski kayıtların
     okunabilmesi için bu biçim korunmuştur; bulut kimlik bilgisi tek başına
     sağlık kaydına erişim sağlamamalıdır. */
  var SIFRE_ANAHTAR = 'isgtakip-saglik-2026';
  var SIFRE_ISARETI = 'sg2:';
  function xorCevir(metin, anahtar) {
    var cikti = '';
    for (var i = 0; i < metin.length; i += 1) {
      cikti += String.fromCharCode(metin.charCodeAt(i) ^ anahtar.charCodeAt(i % anahtar.length));
    }
    return cikti;
  }
  /* btoa yalnızca tek baytlık karakter kabul eder. Türkçe karakterler (ğ, ı, ş...)
     iki bayta çıkarıldığı için dönüşüm yapılmadan şifrelenemiyordu ve hata yutulup
     değer düz metin olarak saklanıyordu. */
  function bayut(metin) {
    return encodeURIComponent(metin).replace(/%([0-9A-F]{2})/g, function (_, ikiHex) {
      return String.fromCharCode(parseInt(ikiHex, 16));
    });
  }
  function baylardan(dizi) {
    var hexliler = '';
    for (var i = 0; i < dizi.length; i += 1) {
      hexliler += '%' + ('00' + dizi.charCodeAt(i).toString(16)).slice(-2);
    }
    return decodeURIComponent(hexliler);
  }
  function sifrele(metin) {
    if (!metin) { return ''; }
    try { return SIFRE_ISARETI + btoa(xorCevir(bayut(String(metin)), SIFRE_ANAHTAR)); }
    catch (e) { return String(metin); }
  }
  function coz(sifreli) {
    if (!sifreli) { return ''; }
    var metin = String(sifreli);
    if (metin.indexOf(SIFRE_ISARETI) === 0) {
      try { return baylardan(xorCevir(atob(metin.slice(SIFRE_ISARETI.length)), SIFRE_ANAHTAR)); }
      catch (e) { return metin; }
    }
    /* Etiketsiz eski kayıt: tek baytlık XOR denenir. Çözünen metin okunabilir
       değilse değer eski sürümdeki UTF-8 hatası yüzünden düz metin yazılmıştır;
       olduğu gibi döndürülür ve mevcut kayıt bozulmaz. */
    try {
      var aday = xorCevir(atob(metin), SIFRE_ANAHTAR);
      if (!aday || /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(aday)) { return metin; }
      return aday;
    } catch (e) { return metin; }
  }

  function kaydiSifrele(kayit) {
    var k = {};
    Object.keys(kayit).forEach(function (alan) {
      var deger = kayit[alan];
      if (ISG.saglikGizliAlanlar.indexOf(alan) >= 0 && deger) { k[alan] = sifrele(deger); }
      else { k[alan] = deger; }
    });
    return k;
  }
  function kaydiCoze(kayit) {
    if (!kayit) { return null; }
    var k = {};
    Object.keys(kayit).forEach(function (alan) {
      var deger = kayit[alan];
      if (ISG.saglikGizliAlanlar.indexOf(alan) >= 0 && deger) { k[alan] = coz(deger); }
      else { k[alan] = deger; }
    });
    return k;
  }

  /* ---------- Validasyon ---------- */
  function dogrula(kayit) {
    var hatalar = [];
    ISG.saglikAlanlari.forEach(function (alan) {
      if (alan.zorunlu && (!kayit[alan.id] || String(kayit[alan.id]).trim() === '')) {
        hatalar.push(alan.ad + ' alanı zorunludur.');
      }
    });
    if (kayit.tarih && !/^\d{4}-\d{2}-\d{2}$/.test(String(kayit.tarih))) {
      hatalar.push('Tarih formatı YYYY-AA-GG olmalıdır.');
    }
    return hatalar;
  }

  /* ---------- Kayıt işlemleri (yetki kontrolüyle) ---------- */
  function kaydet(kayit) {
    var o = Y.oturum();
    if (!o) { throw new Error('Oturum bulunamadı, lütfen yeniden giriş yapın.'); }
    var rol = Y.rolTanimi(o.rol);
    if (rol.id !== 'yonetici' && !D.saglikYetkiliMi(o.kullaniciId)) {
      return D.saglikErisimTalepKaydet({ kullaniciId: o.kullaniciId, kullaniciAd: o.adSoyad, eposta: o.eposta, rol: o.rol });
    }
    if (rol.id !== 'yonetici' && rol.id !== 'yetkili') {
      throw new Error('Sağlık kaydı yalnızca yönetici veya işyeri hekimi/yetkili tarafından kaydedilebilir.');
    }
    if (rol.id === 'yetkili' && (!kayit.isyeriId || o.isyerleri.indexOf(kayit.isyeriId) < 0)) {
      throw new Error('Bu işyeri yetki kapsamınızda değil.');
    }
    var hatalar = dogrula(kayit);
    if (hatalar.length) { throw new Error(hatalar.join(' ')); }
    if (rol.id !== 'yonetici') { throw new Error('Yalnızca yönetici sağlık kayıtlarını ekleyip düzenleyebilir.'); }
    kayit.girisYapan = o.kullaniciId;
    var sifreli = kaydiSifrele(kayit);
    return D.saglikTakipKaydet(sifreli);
  }

  function listele(isyeriId, personelId) {
    var o = Y.oturum();
    if (!o) { throw new Error('Oturum bulunamadı, lütfen yeniden giriş yapın.'); }
    var rol = Y.rolTanimi(o.rol);
    if (rol.id !== 'yonetici' && !D.saglikYetkiliMi(o.kullaniciId)) { throw new Error('Sağlık verilerine erişmek için yönetici onayı gerekir.'); }
    if (!isyeriId && rol.id === 'yetkili' && o.isyerleri.length === 1) {
      isyeriId = o.isyerleri[0];
    }
    var liste = D.saglikTakipListe(isyeriId, personelId);
    return liste.map(function (k) { return kaydiCoze(k); });
  }

  function sil(id) {
    var o = Y.oturum();
    if (!o) { throw new Error('Oturum bulunamadı, lütfen yeniden giriş yapın.'); }
    var rol = Y.rolTanimi(o.rol);
    if (rol.id !== 'yonetici') { throw new Error('Sağlık kaydı yalnızca yönetici tarafından silinebilir.'); }
    D.saglikTakipSil(id);
  }

  function duzenlemeTalepEt(kayit) {
    var o = Y.oturum();
    if (!o) { throw new Error('Oturum bulunamadı.'); }
    if (Y.rolTanimi(o.rol).id !== 'yonetici' && !D.saglikYetkiliMi(o.kullaniciId)) {
      return D.saglikErisimTalepKaydet({ kullaniciId: o.kullaniciId, kullaniciAd: o.adSoyad, eposta: o.eposta, rol: o.rol });
    }
    throw new Error('Sağlık kayıtlarını yalnızca yönetici düzenleyebilir.');
  }

  function erisimTalepEt() {
    var o = Y.oturum();
    if (!o) { throw new Error('Önce oturum açın.'); }
    return D.saglikErisimTalepKaydet({ kullaniciId: o.kullaniciId, kullaniciAd: o.adSoyad, eposta: o.eposta, rol: o.rol });
  }
  function erisimTalepleri() {
    var o = Y.oturum();
    if (!o || Y.rolTanimi(o.rol).id !== 'yonetici') { throw new Error('Sağlık erişim taleplerini yalnızca yönetici görebilir.'); }
    return D.saglikErisimTalepleri();
  }
  function erisimKarar(id, onay) {
    var o = Y.oturum();
    if (!o || Y.rolTanimi(o.rol).id !== 'yonetici') { throw new Error('Erişim kararını yalnızca yönetici verebilir.'); }
    return D.saglikErisimKarar(id, !!onay);
  }

  /* ---------- Arayüz açısı ---------- */
  ISG.saglikTakip = {
    kaydet: kaydet,
    listele: listele,
    sil: sil,
    dogrula: dogrula,
    alanlar: ISG.saglikAlanlari,
    gizliAlanlar: ISG.saglikGizliAlanlar,
    sifrele: sifrele,
    coz: coz,
    erisimTalepEt: erisimTalepEt,
    erisimTalepleri: erisimTalepleri,
    erisimKarar: erisimKarar,
    duzenlemeTalepEt: duzenlemeTalepEt
  };

  /* Basit rapor metni (ekrana yazdırma / rapor sayfası için). */
  function raporMetni(liste) {
    if (!liste || !liste.length) { return 'Sağlık kaydı bulunamadı.'; }
    var satirlar = ['Tarih\tPersonel\tİşyeri\tHekim\tÇalışma Şekli\tSevk\tÇalışma Yasağı'];
    liste.forEach(function (k) {
      /* Kişi/işyeri silinmişse kayda dondurulan ad kullanılır; ham kimlik yazılmaz. */
      satirlar.push([k.tarih, k.personelAd || k.personelId, k.isyeriAd || k.isyeriId, k.doktor || '-', k.calismaSesi || '-', k.sevkEdilen || '-', k.calismaYasagi || '-'].join('\t'));
    });
    return satirlar.join('\n');
  }
  ISG.saglikTakip.raporMetni = raporMetni;

})(window);
