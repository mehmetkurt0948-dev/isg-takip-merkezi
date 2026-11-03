/* Sağlık çalışma kitabı: XLSX metinlerini onaylı erişimden sonra yerel kasaya alır. */
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
  function erisimiDogrula() {
    var o = ISG.yetki.oturum();
    if (!o || (ISG.yetki.rolTanimi(o.rol).id !== 'yonetici' && !ISG.depo.saglikYetkiliMi(o.kullaniciId))) {
      throw new Error('Excel sağlık listesi için yönetici onayı gerekir.');
    }
  }
  function oku(dosya) {
    erisimiDogrula();
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
        ISG.depo.saglikCalismaKitabiKaydet({ dosyaAdi: dosya.name, yuklemeTarihi: new Date().toISOString(), sekmeler: sekmeler });
        return sekmeler;
      });
    });
  }
  ISG.saglikCalismaKitabi = { oku: oku };
})(window);
