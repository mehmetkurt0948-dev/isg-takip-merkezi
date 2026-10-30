/* İSG Takip Merkezi — biçimlendirme ve arayüz yardımcıları */
(function (global) {
  'use strict';

  var ISG = global.ISG = global.ISG || {};

  var AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  function kacis(deger) {
    return String(deger === null || typeof deger === 'undefined' ? '' : deger)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function tarih(isoTarih) {
    if (!isoTarih) { return '—'; }
    var parca = String(isoTarih).split('-');
    if (parca.length !== 3) { return kacis(isoTarih); }
    return parca[2] + '.' + parca[1] + '.' + parca[0];
  }

  function tarihUzun(isoTarih) {
    if (!isoTarih) { return '—'; }
    var parca = String(isoTarih).split('-');
    if (parca.length !== 3) { return kacis(isoTarih); }
    var ay = AYLAR[Number(parca[1]) - 1] || '';
    return Number(parca[2]) + ' ' + ay + ' ' + parca[0];
  }

  function bugunIso() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function kalan(gunSayisi) {
    if (gunSayisi === null || typeof gunSayisi === 'undefined' || isNaN(gunSayisi)) { return '—'; }
    if (gunSayisi === 0) { return 'Bugün'; }
    if (gunSayisi < 0) { return Math.abs(gunSayisi) + ' gün gecikti'; }
    if (gunSayisi === 1) { return 'Yarın'; }
    return gunSayisi + ' gün kaldı';
  }

  function rozet(metin, sinif) {
    return '<span class="rozet ' + (sinif || 'notr') + '">' + kacis(metin) + '</span>';
  }

  function ikon(id, ekSinif) {
    return '<svg class="ikon ' + (ekSinif || '') + '" aria-hidden="true"><use href="#' + id + '"></use></svg>';
  }

  function durumRozeti(durumId, metin) {
    var esleme = {
      gecerli: 'iyi', yaklasiyor: 'uyari', suresiDoldu: 'tehlike', yok: 'notr',
      acik: 'tehlike', izlemede: 'uyari', kapali: 'iyi',
      var: 'iyi', eksik: 'tehlike', incelenmedi: 'uyari',
      tamamlandi: 'iyi', takvimde: 'bilgi', planlanmadi: 'notr',
      dogrulama: 'uyari', geciken: 'tehlike', bugun: 'uyari', tarihsiz: 'notr',
      bekliyor: 'uyari', kabul: 'iyi'
    };
    return rozet(metin, esleme[durumId] || 'notr');
  }

  function bildir(mesaj, tur) {
    var kap = document.getElementById('bildirimler');
    if (!kap) { return; }
    var kutu = document.createElement('div');
    kutu.className = 'bildirim ' + (tur || 'bilgi');
    kutu.setAttribute('role', tur === 'hata' ? 'alert' : 'status');
    kutu.innerHTML = '<span class="bildirim-nokta" aria-hidden="true"></span><span>' + kacis(mesaj) + '</span>';
    kap.appendChild(kutu);
    setTimeout(function () { kutu.classList.add('gidiyor'); }, 3200);
    setTimeout(function () { if (kutu.parentNode) { kutu.parentNode.removeChild(kutu); } }, 3800);
  }

  function dosyaIndir(dosyaAdi, icerik, tip, bomEkle) {
    var metin = (bomEkle ? '\ufeff' : '') + icerik;
    var blob = new Blob([metin], { type: (tip || 'text/plain') + ';charset=utf-8' });
    var adres = URL.createObjectURL(blob);
    var bag = document.createElement('a');
    bag.href = adres;
    bag.download = dosyaAdi;
    document.body.appendChild(bag);
    bag.click();
    document.body.removeChild(bag);
    setTimeout(function () { URL.revokeObjectURL(adres); }, 1500);
  }

  function dosyaIndirBayt(dosyaAdi, baytlar, tip) {
    var blob = new Blob([baytlar], { type: tip || 'application/octet-stream' });
    var adres = URL.createObjectURL(blob);
    var bag = document.createElement('a');
    bag.href = adres;
    bag.download = dosyaAdi;
    document.body.appendChild(bag);
    bag.click();
    document.body.removeChild(bag);
    setTimeout(function () { URL.revokeObjectURL(adres); }, 1500);
  }

  function hucre(deger) {
    var metin = String(deger === null || typeof deger === 'undefined' ? '' : deger).replace(/"/g, '""');
    return '"' + metin + '"';
  }

  function csv(dosyaAdi, basliklar, satirlar) {
    var govde = [basliklar.map(hucre).join(';')];
    satirlar.forEach(function (satir) { govde.push(satir.map(hucre).join(';')); });
    dosyaIndir(dosyaAdi, govde.join('\r\n'), 'text/csv', true);
  }

  function bosDurum(baslik, metin, ikonId) {
    return '<div class="bos-durum">' +
      '<span class="bos-durum-ikon">' + ikon(ikonId || 'i-bos') + '</span>' +
      '<strong>' + kacis(baslik) + '</strong><p>' + kacis(metin) + '</p></div>';
  }

  function secenekler(liste, secili) {
    return liste.map(function (oge) {
      var deger = (oge && typeof oge === 'object') ? oge.deger : oge;
      var metin = (oge && typeof oge === 'object') ? oge.metin : oge;
      return '<option value="' + kacis(deger) + '"' + (String(deger) === String(secili) ? ' selected' : '') + '>' +
        kacis(metin) + '</option>';
    }).join('');
  }

  function boyut(bayt) {
    var deger = Number(bayt) || 0;
    if (deger < 1024) { return deger + ' B'; }
    if (deger < 1024 * 1024) {
      return (deger / 1024).toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + ' KB';
    }
    return (deger / (1024 * 1024)).toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + ' MB';
  }

  function sayi(deger) {
    return (Number(deger) || 0).toLocaleString('tr-TR');
  }

  /* Sabit ondalıklı sayı biçimi; oran göstergeleri için. */
  function ondalik(deger, basamak) {
    var adet = typeof basamak === 'number' ? basamak : 1;
    return (Number(deger) || 0).toLocaleString('tr-TR', {
      minimumFractionDigits: adet,
      maximumFractionDigits: adet
    });
  }

  function sayfalama(toplam, sayfa, boyut) {
    var sonSayfa = Math.max(1, Math.ceil(toplam / boyut));
    var aktif = Math.min(Math.max(1, sayfa), sonSayfa);
    var dugmeler = [];
    for (var i = 1; i <= sonSayfa; i += 1) {
      if (sonSayfa > 9 && i > 2 && i < sonSayfa - 1 && Math.abs(i - aktif) > 1) {
        if (dugmeler[dugmeler.length - 1] !== '…') { dugmeler.push('…'); }
        continue;
      }
      dugmeler.push(i);
    }
    return '<div class="sayfalama" role="navigation" aria-label="Sayfalar">' +
      '<button type="button" class="sayfa-dugme" data-sayfa-git="' + (aktif - 1) + '"' + (aktif === 1 ? ' disabled' : '') + ' aria-label="Önceki sayfa">‹</button>' +
      dugmeler.map(function (d) {
        if (d === '…') { return '<span class="sayfa-bosluk">…</span>'; }
        return '<button type="button" class="sayfa-dugme' + (d === aktif ? ' aktif' : '') + '" data-sayfa-git="' + d + '"' +
          (d === aktif ? ' aria-current="page"' : '') + '>' + d + '</button>';
      }).join('') +
      '<button type="button" class="sayfa-dugme" data-sayfa-git="' + (aktif + 1) + '"' + (aktif === sonSayfa ? ' disabled' : '') + ' aria-label="Sonraki sayfa">›</button>' +
      '</div>';
  }

  ISG.bicim = {
    AYLAR: AYLAR,
    kacis: kacis,
    tarih: tarih,
    tarihUzun: tarihUzun,
    bugunIso: bugunIso,
    kalan: kalan,
    rozet: rozet,
    ikon: ikon,
    durumRozeti: durumRozeti,
    bildir: bildir,
    dosyaIndir: dosyaIndir,
    dosyaIndirBayt: dosyaIndirBayt,
    csv: csv,
    bosDurum: bosDurum,
    secenekler: secenekler,
    sayi: sayi,
    ondalik: ondalik,
    boyut: boyut,
    sayfalama: sayfalama
  };
})(window);
