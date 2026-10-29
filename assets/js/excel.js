/* İSG Takip Merkezi — bağımlılıksız Excel (.xlsx) okuyucu/yazıcı
   Gerçek Office Open XML üretir: ZIP (store) + worksheet + inline string.
   Okuma tarafı, Excel'in ürettiği deflate sıkıştırmasını DecompressionStream
   ile açar; desteklenmiyorsa kullanıcıya CSV önerilir. */
(function (global) {
  'use strict';

  var ISG = global.ISG = global.ISG || {};
  var XML_BASI = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  var XLSX_TIPI = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  /* ---------- Metin / bayt yardımcıları ---------- */

  function kodla(metin) {
    var s = String(metin === null || typeof metin === 'undefined' ? '' : metin);
    var baytlar = [];
    for (var i = 0; i < s.length; i += 1) {
      var k = s.charCodeAt(i);
      if (k >= 0xD800 && k <= 0xDBFF && i + 1 < s.length) {
        var alt = s.charCodeAt(i + 1);
        if (alt >= 0xDC00 && alt <= 0xDFFF) {
          k = 0x10000 + ((k - 0xD800) << 10) + (alt - 0xDC00);
          i += 1;
        }
      }
      if (k < 0x80) { baytlar.push(k); }
      else if (k < 0x800) { baytlar.push(0xC0 | (k >> 6), 0x80 | (k & 63)); }
      else if (k < 0x10000) { baytlar.push(0xE0 | (k >> 12), 0x80 | ((k >> 6) & 63), 0x80 | (k & 63)); }
      else { baytlar.push(0xF0 | (k >> 18), 0x80 | ((k >> 12) & 63), 0x80 | ((k >> 6) & 63), 0x80 | (k & 63)); }
    }
    return new Uint8Array(baytlar);
  }

  function coz(baytlar) {
    var parcalar = [];
    var mevcut = '';
    for (var i = 0; i < baytlar.length; i += 1) {
      var b = baytlar[i];
      var k;
      if (b < 0x80) { k = b; }
      else if (b >= 0xC0 && b < 0xE0) { k = ((b & 31) << 6) | (baytlar[++i] & 63); }
      else if (b >= 0xE0 && b < 0xF0) { k = ((b & 15) << 12) | ((baytlar[++i] & 63) << 6) | (baytlar[++i] & 63); }
      else {
        k = ((b & 7) << 18) | ((baytlar[++i] & 63) << 12) |
          ((baytlar[++i] & 63) << 6) | (baytlar[++i] & 63);
      }
      if (k > 0xFFFF) {
        k -= 0x10000;
        mevcut += String.fromCharCode(0xD800 + (k >> 10), 0xDC00 + (k & 1023));
      } else {
        mevcut += String.fromCharCode(k);
      }
      if (mevcut.length > 4096) { parcalar.push(mevcut); mevcut = ''; }
    }
    parcalar.push(mevcut);
    return parcalar.join('');
  }

  function xmlKacis(deger) {
    return String(deger === null || typeof deger === 'undefined' ? '' : deger)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function xmlCoz(metin) {
    return String(metin || '')
      .replace(/&#x([0-9a-f]+);/gi, function (t, kod) { return String.fromCharCode(parseInt(kod, 16)); })
      .replace(/&#(\d+);/g, function (t, kod) { return String.fromCharCode(Number(kod)); })
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&');
  }
  /* ---------- ZIP yazma (store) ---------- */

  var crcTablosu = null;

  function crc32(baytlar) {
    if (!crcTablosu) {
      crcTablosu = new Uint32Array(256);
      for (var n = 0; n < 256; n += 1) {
        var c = n;
        for (var k = 0; k < 8; k += 1) { c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); }
        crcTablosu[n] = c >>> 0;
      }
    }
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < baytlar.length; i += 1) {
      crc = (crc >>> 8) ^ crcTablosu[(crc ^ baytlar[i]) & 0xFF];
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function birlestir(parcalar) {
    var toplam = parcalar.reduce(function (top, p) { return top + p.length; }, 0);
    var sonuc = new Uint8Array(toplam);
    var konum = 0;
    parcalar.forEach(function (p) { sonuc.set(p, konum); konum += p.length; });
    return sonuc;
  }

  function zipYaz(dosyalar) {
    var yereller = [];
    var merkezler = [];
    var ofset = 0;
    dosyalar.forEach(function (dosya) {
      var ad = kodla(dosya.ad);
      var veri = dosya.veri;
      var crc = crc32(veri);
      var yerel = new Uint8Array(30 + ad.length);
      var yv = new DataView(yerel.buffer);
      yv.setUint32(0, 0x04034b50, true);
      yv.setUint16(4, 20, true);
      yv.setUint16(6, 0x0800, true);
      yv.setUint16(8, 0, true);
      yv.setUint16(10, 0, true);
      yv.setUint16(12, 0x21, true);
      yv.setUint32(14, crc, true);
      yv.setUint32(18, veri.length, true);
      yv.setUint32(22, veri.length, true);
      yv.setUint16(26, ad.length, true);
      yv.setUint16(28, 0, true);
      yerel.set(ad, 30);

      var merkez = new Uint8Array(46 + ad.length);
      var mv = new DataView(merkez.buffer);
      mv.setUint32(0, 0x02014b50, true);
      mv.setUint16(4, 20, true);
      mv.setUint16(6, 20, true);
      mv.setUint16(8, 0x0800, true);
      mv.setUint16(10, 0, true);
      mv.setUint16(12, 0, true);
      mv.setUint16(14, 0x21, true);
      mv.setUint32(16, crc, true);
      mv.setUint32(20, veri.length, true);
      mv.setUint32(24, veri.length, true);
      mv.setUint16(28, ad.length, true);
      mv.setUint32(42, ofset, true);
      merkez.set(ad, 46);

      yereller.push(yerel, veri);
      merkezler.push(merkez);
      ofset += yerel.length + veri.length;
    });

    var merkezBoy = merkezler.reduce(function (top, p) { return top + p.length; }, 0);
    var son = new Uint8Array(22);
    var sv = new DataView(son.buffer);
    sv.setUint32(0, 0x06054b50, true);
    sv.setUint16(8, dosyalar.length, true);
    sv.setUint16(10, dosyalar.length, true);
    sv.setUint32(12, merkezBoy, true);
    sv.setUint32(16, ofset, true);
    return birlestir(yereller.concat(merkezler, [son]));
  }

  /* ---------- XLSX yazma ---------- */

  function sutunAdi(indeks) {
    var ad = '';
    var n = indeks + 1;
    while (n > 0) {
      var kalan = (n - 1) % 26;
      ad = String.fromCharCode(65 + kalan) + ad;
      n = Math.floor((n - 1) / 26);
    }
    return ad;
  }

  function sayfaAdiTemizle(ad, sira) {
    var temiz = String(ad || ('Sayfa' + (sira + 1))).replace(/[\[\]:*?\/\\]/g, ' ').trim().slice(0, 31);
    return temiz || ('Sayfa' + (sira + 1));
  }
  function hucreXml(satirNo, sutunIndeks, deger, stil) {
    if (deger === null || typeof deger === 'undefined' || deger === '') { return ''; }
    var adres = sutunAdi(sutunIndeks) + satirNo;
    var stilOz = stil ? ' s="' + stil + '"' : '';
    if (typeof deger === 'number' && isFinite(deger)) {
      return '<c r="' + adres + '"' + stilOz + '><v>' + deger + '</v></c>';
    }
    return '<c r="' + adres + '"' + stilOz + ' t="inlineStr"><is><t xml:space="preserve">' +
      xmlKacis(deger) + '</t></is></c>';
  }

  function sayfaXml(sayfa) {
    var basliklar = sayfa.basliklar || [];
    var satirlar = sayfa.satirlar || [];
    var genislikler = sayfa.genislikler || [];
    var sutunlar = genislikler.length ? '<cols>' + genislikler.map(function (genislik, i) {
      return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + genislik + '" customWidth="1"/>';
    }).join('') + '</cols>' : '';
    var satirXml = [];
    if (basliklar.length) {
      satirXml.push('<row r="1" ht="22" customHeight="1">' + basliklar.map(function (baslik, i) {
        return hucreXml(1, i, baslik, 1);
      }).join('') + '</row>');
    }
    satirlar.forEach(function (satir, sira) {
      var no = sira + 2;
      var hucreler = (satir || []).map(function (deger, i) { return hucreXml(no, i, deger); }).join('');
      satirXml.push('<row r="' + no + '">' + hucreler + '</row>');
    });
    var filtre = basliklar.length ? '<autoFilter ref="A1:' + sutunAdi(basliklar.length - 1) + '1"/>' : '';
    return XML_BASI +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        '<sheetViews><sheetView workbookViewId="0">' +
          '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' +
        '</sheetView></sheetViews>' +
        sutunlar + '<sheetData>' + satirXml.join('') + '</sheetData>' + filtre +
      '</worksheet>';
  }

  function stilXml() {
    return XML_BASI +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        '<fonts count="2">' +
          '<font><sz val="11"/><name val="Calibri"/><family val="2"/></font>' +
          '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>' +
        '</fonts>' +
        '<fills count="3">' +
          '<fill><patternFill patternType="none"/></fill>' +
          '<fill><patternFill patternType="gray125"/></fill>' +
          '<fill><patternFill patternType="solid"><fgColor rgb="FF0F4C81"/><bgColor indexed="64"/></patternFill></fill>' +
        '</fills>' +
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
        '<cellXfs count="2">' +
          '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
          '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
        '</cellXfs>' +
        '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
      '</styleSheet>';
  }

  function xlsxYaz(sayfalar) {
    var liste = Array.isArray(sayfalar) ? sayfalar.slice() : [sayfalar];
    if (!liste.length) { liste = [{ ad: 'Sayfa1', basliklar: [], satirlar: [] }]; }
    var kullanilan = {};
    liste.forEach(function (sayfa, i) {
      var ad = sayfaAdiTemizle(sayfa.ad, i);
      if (kullanilan[ad]) { ad = ad.slice(0, 28) + ' ' + (i + 1); }
      kullanilan[ad] = true;
      sayfa.ad = ad;
    });

    var icerikTurleri = liste.map(function (sayfa, i) {
      return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ' +
        'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
    }).join('');

    var dosyalar = [
      {
        ad: '[Content_Types].xml',
        veri: kodla(XML_BASI +
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
            '<Default Extension="xml" ContentType="application/xml"/>' +
            '<Override PartName="/xl/workbook.xml" ' +
              'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
            icerikTurleri +
            '<Override PartName="/xl/styles.xml" ' +
              'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
          '</Types>')
      },
      {
        ad: '_rels/.rels',
        veri: kodla(XML_BASI +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
            '<Relationship Id="rId1" ' +
              'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" ' +
              'Target="xl/workbook.xml"/>' +
          '</Relationships>')
      },
      {
        ad: 'xl/workbook.xml',
        veri: kodla(XML_BASI +
          '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
            'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
            '<sheets>' + liste.map(function (sayfa, i) {
              return '<sheet name="' + xmlKacis(sayfa.ad) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>';
            }).join('') + '</sheets>' +
          '</workbook>')
      },
      {
        ad: 'xl/_rels/workbook.xml.rels',
        veri: kodla(XML_BASI +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
            liste.map(function (sayfa, i) {
              return '<Relationship Id="rId' + (i + 1) + '" ' +
                'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" ' +
                'Target="worksheets/sheet' + (i + 1) + '.xml"/>';
            }).join('') +
            '<Relationship Id="rId' + (liste.length + 1) + '" ' +
              'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" ' +
              'Target="styles.xml"/>' +
          '</Relationships>')
      },
      { ad: 'xl/styles.xml', veri: kodla(stilXml()) }
    ];

    liste.forEach(function (sayfa, i) {
      dosyalar.push({ ad: 'xl/worksheets/sheet' + (i + 1) + '.xml', veri: kodla(sayfaXml(sayfa)) });
    });

    return zipYaz(dosyalar);
  }

  function indir(dosyaAdi, sayfalar) {
    var bayt = xlsxYaz(sayfalar);
    if (ISG.bicim && typeof ISG.bicim.dosyaIndirBayt === 'function') {
      ISG.bicim.dosyaIndirBayt(dosyaAdi, bayt, XLSX_TIPI);
      return bayt;
    }
    var blob = new Blob([bayt], { type: XLSX_TIPI });
    var adres = URL.createObjectURL(blob);
    var bag = document.createElement('a');
    bag.href = adres;
    bag.download = dosyaAdi;
    document.body.appendChild(bag);
    bag.click();
    document.body.removeChild(bag);
    setTimeout(function () { URL.revokeObjectURL(adres); }, 1500);
    return bayt;
  }

  /* ---------- ZIP okuma ---------- */

  function zipOku(baytlar) {
    var dv = new DataView(baytlar.buffer, baytlar.byteOffset, baytlar.byteLength);
    var son = -1;
    for (var i = baytlar.length - 22; i >= 0; i -= 1) {
      if (dv.getUint32(i, true) === 0x06054b50) { son = i; break; }
    }
    if (son < 0) { throw new Error('Excel dosyası geçerli bir .xlsx paketi değil.'); }
    var adet = dv.getUint16(son + 10, true);
    var ofset = dv.getUint32(son + 16, true);
    var kayitlar = {};
    for (var n = 0; n < adet; n += 1) {
      if (dv.getUint32(ofset, true) !== 0x02014b50) { break; }
      var yontem = dv.getUint16(ofset + 10, true);
      var sikisikBoy = dv.getUint32(ofset + 20, true);
      var adUzun = dv.getUint16(ofset + 28, true);
      var ekUzun = dv.getUint16(ofset + 30, true);
      var yorumUzun = dv.getUint16(ofset + 32, true);
      var yerelOfset = dv.getUint32(ofset + 42, true);
      var ad = coz(baytlar.subarray(ofset + 46, ofset + 46 + adUzun));
      var yerelAd = dv.getUint16(yerelOfset + 26, true);
      var yerelEk = dv.getUint16(yerelOfset + 28, true);
      var bas = yerelOfset + 30 + yerelAd + yerelEk;
      kayitlar[ad] = { yontem: yontem, veri: baytlar.subarray(bas, bas + sikisikBoy) };
      ofset += 46 + adUzun + ekUzun + yorumUzun;
    }
    return kayitlar;
  }

  function sisir(baytlar) {
    return new Promise(function (cozBasarili, reddet) {
      if (typeof global.DecompressionStream !== 'function') {
        reddet(new Error('Bu tarayıcı sıkıştırılmış Excel dosyasını açamıyor. ' +
          'Dosyayı CSV olarak kaydedip yükleyin.'));
        return;
      }
      try {
        var akis = new Blob([baytlar]).stream().pipeThrough(new global.DecompressionStream('deflate-raw'));
        var okuyucu = akis.getReader();
        var parcalar = [];
        var oku = function () {
          okuyucu.read().then(function (sonuc) {
            if (sonuc.done) { cozBasarili(birlestir(parcalar)); return; }
            parcalar.push(new Uint8Array(sonuc.value));
            oku();
          }, reddet);
        };
        oku();
      } catch (hata) {
        reddet(new Error('Excel dosyası açılamadı: ' + hata.message));
      }
    });
  }

  function kayitMetni(kayit) {
    if (!kayit) { return Promise.resolve(''); }
    if (kayit.yontem === 0) { return Promise.resolve(coz(kayit.veri)); }
    if (kayit.yontem === 8) { return sisir(kayit.veri).then(coz); }
    return Promise.reject(new Error('Desteklenmeyen Excel sıkıştırma yöntemi (' + kayit.yontem + ').'));
  }

  /* ---------- XML ayrıştırma ---------- */

  function etiketMetni(parca, etiket) {
    var re = new RegExp('<' + etiket + '\\b[^>]*>([\\s\\S]*?)</' + etiket + '>', 'gi');
    var bulunan = [];
    var eslesme;
    while ((eslesme = re.exec(parca)) !== null) { bulunan.push(eslesme[1]); }
    return bulunan.length ? bulunan.join('') : '';
  }

  function tumMetinler(parca) {
    var re = /<t\b[^>]*>([\s\S]*?)<\/t>/gi;
    var metin = '';
    var eslesme;
    while ((eslesme = re.exec(parca)) !== null) { metin += xmlCoz(eslesme[1]); }
    return metin;
  }

  function paylasilanMetinler(xmlMetin) {
    var liste = [];
    var re = /<si\b[^>]*>([\s\S]*?)<\/si>/gi;
    var eslesme;
    while ((eslesme = re.exec(xmlMetin || '')) !== null) { liste.push(tumMetinler(eslesme[1])); }
    return liste;
  }

  function sutunIndeksi(harfler) {
    var indeks = 0;
    for (var i = 0; i < harfler.length; i += 1) {
      indeks = indeks * 26 + (harfler.charCodeAt(i) - 64);
    }
    return indeks - 1;
  }

  function hucreDegeri(attrs, icerik, paylasilan) {
    var tip = (/t="([^"]+)"/.exec(attrs) || [])[1] || '';
    if (tip === 'inlineStr') { return tumMetinler(icerik); }
    var ham = xmlCoz(etiketMetni(icerik, 'v'));
    if (tip === 's') { return paylasilan[Number(ham)] || ''; }
    if (tip === 'b') { return ham === '1' ? 'Evet' : 'Hayır'; }
    if (tip === 'e') { return ''; }
    return ham;
  }

  function sayfaSatirlari(xmlMetin, paylasilan) {
    var satirlar = [];
    var satirRe = /<row\b[^>]*>([\s\S]*?)<\/row>/gi;
    var satirEslesme;
    while ((satirEslesme = satirRe.exec(xmlMetin || '')) !== null) {
      var icerik = satirEslesme[1];
      var satir = [];
      var hucreRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/gi;
      var hucreEslesme;
      var sirali = 0;
      while ((hucreEslesme = hucreRe.exec(icerik)) !== null) {
        var attrs = hucreEslesme[1] || '';
        var adres = /r="([A-Z]+)\d+"/.exec(attrs);
        var indeks = adres ? sutunIndeksi(adres[1]) : sirali;
        sirali = indeks + 1;
        satir[indeks] = hucreDegeri(attrs, hucreEslesme[2] || '', paylasilan);
      }
      for (var i = 0; i < satir.length; i += 1) {
        if (typeof satir[i] === 'undefined') { satir[i] = ''; }
      }
      satirlar.push(satir);
    }
    return satirlar;
  }

  function dosyaBaytlari(kaynak) {
    if (kaynak && typeof kaynak.length === 'number' && typeof kaynak.byteLength === 'number') {
      return Promise.resolve(kaynak);
    }
    if (Object.prototype.toString.call(kaynak) === '[object ArrayBuffer]') {
      return Promise.resolve(new Uint8Array(kaynak));
    }
    if (kaynak && typeof kaynak.arrayBuffer === 'function') {
      return kaynak.arrayBuffer().then(function (tampon) { return new Uint8Array(tampon); });
    }
    if (typeof FileReader !== 'undefined') {
      return new Promise(function (cozBasarili, reddet) {
        var okuyucu = new FileReader();
        okuyucu.onload = function () { cozBasarili(new Uint8Array(okuyucu.result)); };
        okuyucu.onerror = function () { reddet(new Error('Dosya okunamadı.')); };
        okuyucu.readAsArrayBuffer(kaynak);
      });
    }
    return Promise.reject(new Error('Dosya okunamadı.'));
  }

  function xlsxOku(kaynak) {
    return dosyaBaytlari(kaynak).then(function (baytlar) {
      var kayitlar = zipOku(baytlar);
      var sayfaAdlari = Object.keys(kayitlar).filter(function (ad) {
        return /^xl\/worksheets\/sheet\d+\.xml$/i.test(ad);
      }).sort(function (a, b) {
        return Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, ''));
      });
      if (!sayfaAdlari.length) {
        throw new Error('Excel çalışma sayfası bulunamadı. Geçerli bir .xlsx dosyası seçin.');
      }
      return kayitMetni(kayitlar['xl/sharedStrings.xml']).then(function (paylasilanXml) {
        var paylasilan = paylasilanMetinler(paylasilanXml);
        return kayitMetni(kayitlar['xl/workbook.xml']).then(function (kitapXml) {
          var adlar = [];
          var adRe = /<sheet\b[^>]*name="([^"]+)"/gi;
          var eslesme;
          while ((eslesme = adRe.exec(kitapXml || '')) !== null) { adlar.push(xmlCoz(eslesme[1])); }
          return Promise.all(sayfaAdlari.map(function (ad) {
            return kayitMetni(kayitlar[ad]);
          })).then(function (sayfaMetinleri) {
            return sayfaMetinleri.map(function (metin, i) {
              return {
                ad: adlar[i] || ('Sayfa' + (i + 1)),
                satirlar: sayfaSatirlari(metin, paylasilan)
              };
            });
          });
        });
      });
    });
  }

  /* ---------- Tarih dönüşümü ---------- */

  function ikiHane(n) { return String(n).padStart(2, '0'); }

  function tariheCevir(deger) {
    var metin = String(deger === null || typeof deger === 'undefined' ? '' : deger).trim();
    if (!metin) { return ''; }
    var iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(metin);
    if (iso) { return iso[1] + '-' + ikiHane(iso[2]) + '-' + ikiHane(iso[3]); }
    var nokta = /^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})$/.exec(metin);
    if (nokta) { return nokta[3] + '-' + ikiHane(nokta[2]) + '-' + ikiHane(nokta[1]); }
    var sayi = Number(metin.replace(',', '.'));
    if (isFinite(sayi) && sayi > 20000 && sayi < 80000) {
      var tarih = new Date(Math.round((sayi - 25569) * 86400000));
      if (!isNaN(tarih.getTime())) {
        return tarih.getUTCFullYear() + '-' + ikiHane(tarih.getUTCMonth() + 1) + '-' + ikiHane(tarih.getUTCDate());
      }
    }
    return '';
  }

  ISG.excel = {
    xlsxYaz: xlsxYaz,
    xlsxOku: xlsxOku,
    oku: xlsxOku,
    indir: indir,
    zipOku: zipOku,
    tariheCevir: tariheCevir,
    tip: XLSX_TIPI
  };
})(window);
