/* Sağlık çalışma kitabı: XLSX metinlerini onaylı erişimden sonra yerel kasaya alır.
   Kitap satırları bir işyerinin personelini ve tanı metnini taşır: kayıt HER ZAMAN
   bir işyerine bağlıdır (işyeri seçilmeden okunmaz/saklanmaz), satırlar kasada
   şifreli gövde (sg2:) olarak durur ve okuma işyeri kapsamı sorularak yapılır. */
(function (global) {
  'use strict';
  var ISG = global.ISG;
  var XLSX_CDN = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
  var SEKME_ADLARI = ['TAM LİSTE', 'YÜKSEK RİSKLİ MESLEKLER', 'ÇALIŞMASI UYGUN DEĞİLDİR', 'SAĞLIK TARAMALARI EKSİK OLANLAR', 'MALULİYETİ OLANLAR'];
  function moduluYukle() {
    if (global.XLSX) { return Promise.resolve(global.XLSX); }
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script'); s.src = XLSX_CDN;
      s.onload = function () { resolve(global.XLSX); };
      s.onerror = function () { reject(new Error('Excel dosyası açılamadı. İnternet bağlantısını denetleyin.')); };
      document.head.appendChild(s);
    });
  }
  /* Yükleme izni: görüntüleme yetmez, yazma izni ve işyeri kapsamı gerekir.
     İşyeri boşsa yükleme reddedilir; işyeri bağı olmayan kitap satırları
     başka işyerinin görünümünde okunabildiği için bu kapı zorunludur. */
  function yuklemeIzni(isyeriId) {
    var o = ISG.yetki.oturum();
    if (!o) { throw new Error('Oturum bulunamadı, lütfen yeniden giriş yapın.'); }
    if (!ISG.yetki.saglikGoruntule()) { throw new Error('Excel sağlık listesi için yönetici onayı gerekir.'); }
    if (!ISG.yetki.saglikIzin('ekle')) { throw new Error('Excel sağlık listesini yalnızca yönetici yükleyebilir.'); }
    var hedef = String(isyeriId === null || isyeriId === undefined ? '' : isyeriId).trim();
    if (!hedef) {
      throw new Error('Çalışma kitabı bir işyerine bağlanır: yüklemeden önce işyeri seçicisinden işyerini seçin.');
    }
    if (!ISG.yetki.kapsamda(hedef)) { throw new Error('Bu işyeri yetki kapsamınızda değil.'); }
    return { kullanici: o, isyeriId: hedef };
  }

  /* Okuma izni: görüntüleme onayı + işyeri kapsamı. Kapsam dışı işyerinin
     kitabı istenirse satır dönmez. */
  function okumaIzni(isyeriId) {
    var o = ISG.yetki.oturum();
    if (!o || !ISG.yetki.saglikGoruntule()) { return false; }
    if (!isyeriId) { return false; }
    var kapsam = ISG.yetki.saglikKapsam();
    return !!kapsam && (kapsam.tum === true || kapsam.sozluk[isyeriId] === true);
  }

  /* Kitap satırları bir işyerinin personelini ve tanı metnini taşır; kayıt
     işyerine bağlanmadan saklanmaz. Satırlar kasada şifreli gövde olarak durur. */
  function oku(dosya, isyeriId) {
    var izin;
    try { izin = yuklemeIzni(isyeriId); }
    catch (hata) { return Promise.reject(hata); }
    return moduluYukle().then(function (XLSX) {
      var bufferSozu;
      if (dosya && typeof dosya.arrayBuffer === 'function') {
        bufferSozu = dosya.arrayBuffer();
      } else {
        bufferSozu = new Promise(function (resolve, reject) {
          var reader = new FileReader();
          reader.onload = function () { resolve(reader.result); };
          reader.onerror = function () { reject(new Error('Excel dosyası okunamadı.')); };
          reader.readAsArrayBuffer(dosya);
        });
      }
      return bufferSozu.then(function (buffer) {
        var kitap = XLSX.read(buffer, { type: 'array', cellDates: true });
        var sekmeler = SEKME_ADLARI.map(function (ad) {
          var kaynakAd = kitap.SheetNames.filter(function (n) { return n.toLocaleUpperCase('tr-TR') === ad; })[0];
          var satirlar = kaynakAd ? XLSX.utils.sheet_to_json(kitap.Sheets[kaynakAd], { header: 1, defval: '', raw: false }) : [];
          return { ad: ad, satirlar: satirlar.filter(function (r) { return r.some(function (c) { return String(c || '').trim(); }); }) };
        });
        if (!sekmeler.some(function (s) { return s.satirlar.length; })) {
          throw new Error('Excel çalışma kitabındaki beklenen sekmeler boş veya bulunamadı.');
        }
        ISG.depo.saglikCalismaKitabiKaydet(izin.isyeriId, {
          dosyaAdi: dosya && dosya.name,
          yuklemeTarihi: new Date().toISOString(),
          yukleyen: izin.kullanici.kullaniciId,
          sifreli: ISG.saglikTakip.sifrele(JSON.stringify(sekmeler))
        });
        return sekmeler;
      });
    });
  }

  /* Tek işyerinin kitabı (çözülmüş sekmeler). Kapsam dışıysa null döner. */
  function kitap(isyeriId) {
    var hedef = String(isyeriId === null || isyeriId === undefined ? '' : isyeriId).trim();
    if (!okumaIzni(hedef)) { return null; }
    var kayit = ISG.depo.saglikCalismaKitabiBul(hedef);
    if (!kayit || !kayit.sifreli) { return null; }
    var sekmeler = [];
    try { sekmeler = JSON.parse(ISG.saglikTakip.coz(kayit.sifreli)) || []; }
    catch (hata) { sekmeler = []; }
    if (!Array.isArray(sekmeler) || !sekmeler.length) { return null; }
    return {
      isyeriId: hedef, dosyaAdi: kayit.dosyaAdi || '',
      yuklemeTarihi: kayit.yuklemeTarihi || '', sekmeler: sekmeler
    };
  }

  /* Kapsam içindeki kitapların ÖZETİ: satır içeriği dönmez. İşyeri seçilmeden
     hangi işyerinde kitap olduğu görünsün, satır sızmasın. */
  function ozetListe() {
    var o = ISG.yetki.oturum();
    if (!o || !ISG.yetki.saglikGoruntule()) { return []; }
    var kapsam = ISG.yetki.saglikKapsam();
    return ISG.depo.saglikCalismaKitaplari().filter(function (kayit) {
      var isyeriId = String((kayit && kayit.isyeriId) || '');
      return !!isyeriId && (kapsam.tum === true || kapsam.sozluk[isyeriId] === true);
    }).map(function (kayit) {
      return { isyeriId: kayit.isyeriId, dosyaAdi: kayit.dosyaAdi || '', yuklemeTarihi: kayit.yuklemeTarihi || '' };
    });
  }

  ISG.saglikCalismaKitabi = { oku: oku, kitap: kitap, ozetListe: ozetListe };
})(window);
