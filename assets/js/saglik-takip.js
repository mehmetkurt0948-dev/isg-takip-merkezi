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
    { id: 'calismaYasagi', ad: 'Çalışma Yasağı / Önerisi', tip: 'textarea', gizli: true },
    { id: 'izinsizlik', ad: 'İzinsizlik Günleri', tip: 'number', gizli: true },
    { id: 'calismaSesi', ad: 'Çalışma Şekli', tip: 'select', secenekler: ['saha', 'buro', 'karisik'] },
    { id: 'notlar', ad: 'Ek Notlar', tip: 'textarea', gizli: true },
    { id: 'girisYapan', ad: 'Giriş Yapan', tip: 'text', gizli: true }
  ];

  ISG.saglikGizliAlanlar = ['kanGrubu', 'alerji', 'kronikHastalik', 'ilac', 'engelDurumu', 'sonMuayene', 'calismaYasagi', 'izinsizlik', 'notlar', 'girisYapan'];

  /* ---------- Client-side şifreleme (XOR + base64) ---------- */
  /* Not: Bu basit bir obfuscation'dur. Üretim ortamında Supabase RLS + istemci
     tarafında AES-GCM (örn. Web Crypto API) kullanılmasını öneririz. */
  var SIFRE_ANAHTAR = 'isgtakip-saglik-2026';
  function xorCevir(metin, anahtar) {
    var cikti = '';
    for (var i = 0; i < metin.length; i += 1) {
      cikti += String.fromCharCode(metin.charCodeAt(i) ^ anahtar.charCodeAt(i % anahtar.length));
    }
    return cikti;
  }
  function sifrele(metin) {
    if (!metin) { return ''; }
    try { return btoa(xorCevir(String(metin), SIFRE_ANAHTAR)); } catch (e) { return String(metin); }
  }
  function coz(sifreli) {
    if (!sifreli) { return ''; }
    try { return xorCevir(atob(String(sifreli)), SIFRE_ANAHTAR); } catch (e) { return String(sifreli); }
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
    if (rol.id !== 'yonetici' && rol.id !== 'yetkili') {
      throw new Error('Sağlık kaydı yalnızca yönetici veya işyeri hekimi/yetkili tarafından kaydedilebilir.');
    }
    if (rol.id === 'yetkili' && (!kayit.isyeriId || o.isyerleri.indexOf(kayit.isyeriId) < 0)) {
      throw new Error('Bu işyeri yetki kapsamınızda değil.');
    }
    var hatalar = dogrula(kayit);
    if (hatalar.length) { throw new Error(hatalar.join(' ')); }
    kayit.girisYapan = o.kullaniciId;
    var sifreli = kayidiSifrele(kayit);
    return D.saglikTakipKaydet(sifreli);
  }

  function listele(isyeriId, personelId) {
    var o = Y.oturum();
    if (!o) { throw new Error('Oturum bulunamadı, lütfen yeniden giriş yapın.'); }
    var rol = Y.rolTanimi(o.rol);
    if (rol.id !== 'yonetici' && rol.id !== 'yetkili' && rol.id !== 'goruntuleyici') {
      throw new Error('Sağlık kayıtlarını görüntüleme izniniz yok.');
    }
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

  /* ---------- Arayüz açısı ---------- */
  ISG.saglikTakip = {
    kaydet: kaydet,
    listele: listele,
    sil: sil,
    dogrula: dogrula,
    alanlar: ISG.saglikAlanlari,
    gizliAlanlar: ISG.saglikGizliAlanlar,
    sifrele: sifrele,
    coz: coz
  };

  /* Basit rapor metni (ekrana yazdırma / rapor sayfası için). */
  function raporMetni(liste) {
    if (!liste || !liste.length) { return 'Sağlık kaydı bulunamadı.'; }
    var satirlar = ['Tarih\tPersonel\tİşyeri\tHekim\tÇalışma Şekli\tÇalışma Yasağı'];
    liste.forEach(function (k) {
      satirlar.push([k.tarih, k.personelId, k.isyeriId, k.doktor || '-', k.calismaSesi || '-', k.calismaYasagi || '-'].join('\t'));
    });
    return satirlar.join('\n');
  }
  ISG.saglikTakip.raporMetni = raporMetni;

})(window);