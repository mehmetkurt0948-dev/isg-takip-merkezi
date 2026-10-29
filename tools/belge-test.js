const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path');
const fs = require('fs');
const http = require('http');

const kok = path.resolve(__dirname, '..');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function sunucuBaslat() {
  return new Promise((coz) => {
    const sunucu = http.createServer((istek, yanit) => {
      const yol = decodeURIComponent(String(istek.url).split('?')[0].split('#')[0]);
      const dosya = path.join(kok, yol === '/' ? 'index.html' : yol);
      if (!dosya.startsWith(kok)) { yanit.writeHead(403); yanit.end(); return; }
      fs.readFile(dosya, (hataOkuma, icerik) => {
        if (hataOkuma) { yanit.writeHead(404); yanit.end('bulunamadi'); return; }
        yanit.writeHead(200, { 'Content-Type': MIME[path.extname(dosya)] || 'application/octet-stream' });
        yanit.end(icerik);
      });
    });
    sunucu.listen(0, '127.0.0.1', () => coz({ sunucu, port: sunucu.address().port }));
  });
}

(async () => {
  const { sunucu, port } = await sunucuBaslat();
  const hatalar = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => hatalar.push(String(e.message)));
  const dom = await JSDOM.fromURL('http://127.0.0.1:' + port + '/index.html', {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: vc
  });
  const w = dom.window;
  const d = w.document;
  await new Promise((r) => {
    if (d.readyState === 'complete') { r(); } else { w.addEventListener('load', r, { once: true }); }
  });
  await new Promise((r) => setTimeout(r, 200));

  const sonuc = [];
  const kontrol = (ad, kosul, ek) => {
    sonuc.push((kosul ? 'GECTI' : 'BASARISIZ') + ' | ' + ad + (ek ? ' -> ' + ek : ''));
  };

  const ISG = w.ISG;
  const D = ISG.depo;

  // 0) Yetki katmanı: belge işlemleri yönetici oturumu ister
  const girisYap = async (eposta, sifre) => {
    d.getElementById('girisEposta').value = eposta;
    d.getElementById('girisSifre').value = sifre;
    d.getElementById('girisForm').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 250));
  };
  kontrol('Giriş katmanı açılışta görünür', d.getElementById('girisKatman').hidden === false);
  await girisYap('mehmet.kurt@ornek.com', '1234');
  kontrol('Yönetici oturumu açıldı', !!ISG.yetki.oturum() && ISG.yetki.oturum().rol === 'yonetici');

  const isyeriId = D.al().isyerleri[0].id;

  // 1) belgeKaydet / belgeler / belgeBul / belgeBoyutu
  const dosya = D.dosyaKaydet({ isyeriId, madde: 'Test belge maddesi', bolum: 'TEST', durum: 'var' });
  const belge = D.belgeKaydet({
    dosyaId: dosya.id, isyeriId, ad: 'deneme belgesi.txt', boyut: 2048,
    tur: 'text/plain', icerik: 'data:text/plain;base64,bWVyaGFiYQ=='
  });
  kontrol('belgeKaydet kayıt döndürür', !!belge && /^bl/.test(belge.id), belge && belge.id);
  kontrol('belgeler(dosyaId) listesi', D.belgeler(dosya.id).length === 1);
  kontrol('belgeBul çalışır', D.belgeBul(belge.id) && D.belgeBul(belge.id).ad === 'deneme belgesi.txt');
  kontrol('belgeBoyutu 2 KB', D.belgeBoyutu(dosya.id) === 2048, String(D.belgeBoyutu(dosya.id)));

  // 2) localStorage kalıcılığı
  const ham = JSON.parse(w.localStorage.getItem(D.anahtar));
  kontrol('localStorage belgeler dizisi', Array.isArray(ham.belgeler) && ham.belgeler.length === 1);

  // 3) Liste ekranı dosya satırında belge sayısı
  w.location.hash = '#dosyalar';
  await new Promise((r) => setTimeout(r, 80));
  const arama = d.querySelector('[data-ui="dosyaArama"]');
  arama.value = 'Test belge maddesi';
  arama.dispatchEvent(new w.Event('input', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 600));
  const satir = Array.from(d.querySelectorAll('tr')).find((tr) => tr.textContent.includes('Test belge maddesi'));
  kontrol('liste satırında belge sayısı', !!satir && satir.textContent.includes('1 belge'), satir && satir.textContent.slice(0, 90));
  if (!satir) {
    sonuc.push('BASARISIZ | liste satırı bulunamadı (arama filtresi çalışmadı)');
    console.log(sonuc.join('\n'));
    w.close();
    sunucu.close();
    process.exit(1);
  }

  // 4) Düzenle diyaloğunda belge listesi
  const duzenle = satir.querySelector('[data-islem="dosya-duzenle"]');
  duzenle.click();
  await new Promise((r) => setTimeout(r, 50));
  const kutu = d.getElementById('dosyaBelgeListe');
  kontrol('diyalog belge listesi basıldı', kutu.textContent.includes('deneme belgesi.txt'));
  kontrol('belge boyutu biçimlendi (2 KB)', kutu.textContent.includes('2 KB'), kutu.textContent.trim());
  kontrol('özet metni', d.getElementById('dosyaBelgeOzet').textContent.includes('1 belge'));

  // 5) Belge kaldırma akışı (onay diyaloğu)
  kutu.querySelector('[data-islem="belge-sil"]').click();
  await new Promise((r) => setTimeout(r, 30));
  kontrol('onay diyaloğu açıldı', d.getElementById('onayDiyalog').hasAttribute('open') || d.getElementById('onayDiyalog').open === true);
  d.getElementById('onayEvet').click();
  await new Promise((r) => setTimeout(r, 50));
  kontrol('belge silindi (depo)', D.belgeler(dosya.id).length === 0);
  kontrol('belge listesi güncellendi', !d.getElementById('dosyaBelgeListe').textContent.includes('deneme belgesi.txt'),
    d.getElementById('dosyaBelgeListe').textContent.trim());
  d.querySelector('#dosyaDiyalog [data-kapat]').click();
  await new Promise((r) => setTimeout(r, 30));

  // 6) Yeni madde + bekleyen belge (FileReader akışı) + kayıt
  const yeniDugme = Array.from(d.querySelectorAll('[data-islem="dosya-yeni"], [data-islem="dosya-ekle"]'))[0];
  kontrol('yeni dosya düğmesi bulundu', !!yeniDugme);
  if (yeniDugme) {
    yeniDugme.click();
    await new Promise((r) => setTimeout(r, 50));
    const girdi = d.getElementById('dosyaBelgeGirdi');
    const dosyaNesnesi = new w.File(['merhaba dunya'], 'yeni-belge.txt', { type: 'text/plain' });
    Object.defineProperty(girdi, 'files', { value: [dosyaNesnesi], configurable: true });
    girdi.dispatchEvent(new w.Event('change'));
    await new Promise((r) => setTimeout(r, 300));
    const bekleyenMetin = d.getElementById('dosyaBelgeListe').textContent;
    kontrol('bekleyen belge listelendi', bekleyenMetin.includes('yeni-belge.txt'), bekleyenMetin.trim());
    kontrol('bekleyen belge işareti', bekleyenMetin.includes('kayıtla birlikte yüklenecek'));

    const form = d.getElementById('dosyaForm');
    form.elements.madde.value = 'Bekleyen belgeli madde';
    form.elements.isyeriId.value = isyeriId;
    form.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 100));
    const yeniKayit = D.al().dosyalar.filter((k) => k.madde === 'Bekleyen belgeli madde')[0];
    kontrol('madde kaydedildi', !!yeniKayit);
    kontrol('bekleyen belge kalıcı yazıldı', !!yeniKayit && D.belgeler(yeniKayit.id).length === 1,
      yeniKayit ? JSON.stringify(D.belgeler(yeniKayit.id).map((b) => b.ad)) : 'yok');
    kontrol('dosya diyaloğu kapandı', !d.getElementById('dosyaDiyalog').open);
  }

  // 7) Boyut sınırı
  kontrol('sınır sabiti 1 MB', ISG.BELGE_SINIRI === 1024 * 1024, String(ISG.BELGE_SINIRI));
  if (yeniDugme) {
    yeniDugme.click();
    await new Promise((r) => setTimeout(r, 50));
    const girdi = d.getElementById('dosyaBelgeGirdi');
    const buyuk = new w.File([Buffer.alloc(1024 * 1024 + 10, 97)], 'buyuk.txt', { type: 'text/plain' });
    const oncekiSayi = D.al().belgeler.length;
    Object.defineProperty(girdi, 'files', { value: [buyuk], configurable: true });
    girdi.dispatchEvent(new w.Event('change'));
    await new Promise((r) => setTimeout(r, 200));
    kontrol('1 MB üstü belge reddedildi', D.al().belgeler.length === oncekiSayi);
    kontrol('boyut uyarısı gösterildi', /en fazla 1 MB/.test(d.getElementById('bildirimler').textContent),
      d.getElementById('bildirimler').textContent.trim().slice(-90));
    d.querySelector('#dosyaDiyalog [data-kapat]').click();
  }

  // 8) dosyaSil belgeleri de temizler
  D.belgeKaydet({ dosyaId: dosya.id, isyeriId, ad: 'silinecek.txt', boyut: 3, icerik: 'data:text/plain;base64,QQ==' });
  D.dosyaSil(dosya.id);
  kontrol('dosyaSil belgeleri temizler', D.belgeler(dosya.id).length === 0 && !D.belgeBul(belge.id));

  kontrol('jsdom hata yok', hatalar.filter((h) => !/scrollTo/.test(h)).length === 0, hatalar.join(' ; '));
  console.log(sonuc.join('\n'));
  const basarisiz = sonuc.filter((s) => s.startsWith('BASARISIZ')).length;
  console.log('\n' + (sonuc.length - basarisiz) + ' geçti, ' + basarisiz + ' başarısız');
  w.close();
  sunucu.close();
  process.exit(basarisiz ? 1 : 0);
})();
