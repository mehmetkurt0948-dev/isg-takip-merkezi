/* İSG Takip Merkezi — varsayılan başlangıç verisi ve tarih yardımcıları
   Site boş açılır: yeni bir cihazda hiçbir işyeri, personel veya kayıt
   yoktur. Başlangıçta yalnızca yönetici hesabı bulunur (aksi hâlde giriş
   yapılamaz). Tanıtım amaçlı dolu küme yayında değildir; test fixture'ı
   tools/demo-veri.js içinde durur ve yalnızca testlerde yüklenir. */
(function (global) {
  'use strict';

  var ISG = global.ISG = global.ISG || {};

  function iso(tarih) {
    return tarih.getFullYear() + '-' +
      String(tarih.getMonth() + 1).padStart(2, '0') + '-' +
      String(tarih.getDate()).padStart(2, '0');
  }

  /* ISO tarihe yıl ekler; öğlen saatine sabitleyerek saat/kayış ve 29 Şubat
     taşmalarını önler. Belge geçerlilik süresi ve risk yenileme hesapları
     (depo/uygulama) bu tek kaynağı kullanır. */
  function yilEkle(isoTarih, yil) {
    var parca = String(isoTarih).split('-');
    var d = new Date(Number(parca[0]) + yil, Number(parca[1]) - 1, Number(parca[2]), 12, 0, 0, 0);
    return iso(d);
  }

  ISG.yilEkle = yilEkle;

  /* Tek gerçek hesap: site yöneticisi. Boş başlangıçta ve veri sıfırlandığında
     bu hesap korunur, böylece giriş anahtarı hiçbir cihazda kaybolmaz. */
  ISG.YONETICI_HESAP = function () {
    return [{
      id: 'u1', adSoyad: 'Mehmet Kurt', eposta: 'mehmetkurt0948@gmail.com', sifre: '1234',
      rol: 'yonetici', gorev: 'İSG yöneticisi', isyerleri: [], aktif: true, sonGiris: ''
    }];
  };

  /* Boş başlangıç veri kümesi — yayındaki sitenin açıldığı hâl. */
  ISG.BOS_VERI = function () {
    return {
      surum: 4,
      olusturma: new Date().toISOString(),
      ayarlar: {
        kurum: '', kullanici: '', gorev: '', yillikCalismaSaati: 2250, sonMevzuatKontrolu: ''
      },
      isyerleri: [], personel: [], egitimler: [], riskler: [], olaylar: [],
      dosyalar: [], belgeler: [], planlar: [], tespitler: [],
      riskEkipleri: [], acilPlanlar: [], mevzuat: [],
      kullanicilar: ISG.YONETICI_HESAP(), talepler: [], denetim: [],
      senkron: { kayit: {}, silinen: {}, ayarlar: '' }
    };
  };
})(window);