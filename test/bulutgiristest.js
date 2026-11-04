/* ISG Takip Merkezi - bulut verisiyle giris dogrulama testi.
   Senaryo: Yonetici yeni bir kullaniciyi buluta ekliyor (or. enginozcan1402@gmail.com).
   Bu test GERCEK Supabase satirini ceker ve uc cihaz durumunu canlandirir:
     1) Yeni cihaz  -> bos yerel veri + bulut birlesimi  -> yeni kullanici GIRIS YAPABILMELI
     2) Eski cihaz  -> yalnizca varsayilan yonetici + bulut birlesimi -> yeni kullanici GIRIS YAPABILMELI
     3) Cevrimdisi  -> bulut yok, yalnizca yerel varsayilan veri -> yeni kullanici GIRIS YAPAMAZ
                      (raporlanan belirti: "sadece mehmetkurt0948@gmail.com aciliyor")
   Calistirma: node test/bulutgiristest.js */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const KOK = path.join(__dirname, '..');
process.on('uncaughtException', (hata) => {
  console.error('BEKLENMEDIK HATA: ' + ((hata && hata.stack) || hata));
  process.exit(1);
});
const dosyaOku = (goreli) => fs.readFileSync(path.join(KOK, goreli), 'utf8');
function ok(kosul, ad) {
  console.log((kosul ? 'PASS' : 'FAIL') + ': ' + ad);
  if (!kosul) { process.exitCode = 1; }
  return !!kosul;
}

/* 1) Uygulama uretim sayfasiyla ayni sirada yuklenir */
const indexMetni = dosyaOku('index.html');
const ISG_SCRIPTLER = [];
indexMetni.replace(/<script[^>]+src="(assets\/js\/[^"?]+)/g, function (_eslesme, yol) {
  ISG_SCRIPTLER.push(yol);
  return _eslesme;
});

const pencere = new JSDOM(indexMetni, {
  url: 'https://localhost/', runScripts: 'outside-only', pretendToBeVisual: true
}).window;
pencere.matchMedia = pencere.matchMedia || ((sorgu) => ({
  matches: false, media: sorgu, onchange: null,
  addEventListener() {}, removeEventListener() {},
  addListener() {}, removeListener() {}, dispatchEvent() { return false; }
}));
pencere.scrollTo = () => {};
pencere.HTMLElement.prototype.scrollIntoView = () => {};
ISG_SCRIPTLER.forEach((yol) => pencere.eval(dosyaOku(yol)));
const ISG = pencere.ISG;

/* 2) Sitede gomulu bulut kimligiyle GERCEK satiri cek */
const kimlik = pencere.ISG_KIMLIK;
if (!kimlik || !kimlik.url || !kimlik.anahtar || !kimlik.oda) {
  console.error('FAIL: bulut-kimlik.js icinde ISG_KIMLIK yok');
  process.exit(1);
}

async function bulutVerisiAl() {
  const yol = kimlik.url + '/rest/v1/isg_veri?oda=eq.' + encodeURIComponent(kimlik.oda) +
    '&select=veri,guncelleme';
  const yanit = await fetch(yol, {
    headers: { apikey: kimlik.anahtar, Authorization: 'Bearer ' + kimlik.anahtar }
  });
  if (!yanit.ok) { throw new Error('Bulut okuma hatasi: HTTP ' + yanit.status); }
  const satirlar = await yanit.json();
  return (satirlar && satirlar[0] && satirlar[0].veri) || null;
}

function girisDene(eposta, sifre) {
  try {
    const kullanici = ISG.giris.kullaniciDogrula(eposta, sifre);
    return { basarili: true, kullanici: kullanici, mesaj: '' };
  } catch (hata) {
    return { basarili: false, kullanici: null, mesaj: String(hata.message || hata) };
  }
}

(async function main() {
  const uzak = await bulutVerisiAl();
  if (!uzak) {
    console.error('FAIL: bulutta kayit yok (oda: ' + kimlik.oda + ')');
    process.exit(1);
  }
  const uzakKullanicilar = (uzak.kullanicilar || []).map(function (k) { return k.eposta; });
  ok(uzakKullanicilar.indexOf('enginozcan1402@gmail.com') >= 0,
    'bulutta enginozcan1402@gmail.com kayitli (' + uzakKullanicilar.join(', ') + ')');

  /* --- Senaryo 1: yeni cihaz (bos yerel veri) + bulut birlesimi --- */
  ISG.depo.geriYukle(ISG.BOS_VERI());
  const birlesik = ISG.depo.birlestir(uzak).veri;
  ISG.depo.geriYukle(birlesik);
  let sonuc = girisDene('enginozcan1402@gmail.com', '1402');
  ok(sonuc.basarili, 'yeni cihaz: enginozcan1402@gmail.com girisi ' +
    (sonuc.basarili ? 'basarili' : ('BASARISIZ -> ' + sonuc.mesaj)));
  sonuc = girisDene('mehmetkurt0948@gmail.com', String((birlesik.kullanicilar || []).filter(function (k) {
    return k.eposta === 'mehmetkurt0948@gmail.com';
  })[0] && (birlesik.kullanicilar || []).filter(function (k) {
    return k.eposta === 'mehmetkurt0948@gmail.com';
  })[0].sifre));
  ok(sonuc.basarili, 'yeni cihaz: mehmetkurt0948@gmail.com girisi (buluttaki sifreyle) ' +
    (sonuc.basarili ? 'basarili' : ('BASARISIZ -> ' + sonuc.mesaj)));

  /* --- Senaryo 2: eski cihaz (yalnizca varsayilan yonetici) + bulut birlesimi --- */
  ISG.depo.geriYukle(ISG.BOS_VERI());
  const eskiYerel = ISG.BOS_VERI();
  eskiYerel.kullanicilar = ISG.YONETICI_HESAP();
  ISG.depo.geriYukle(eskiYerel);
  const birlesik2 = ISG.depo.birlestir(uzak).veri;
  ISG.depo.geriYukle(birlesik2);
  sonuc = girisDene('enginozcan1402@gmail.com', '1402');
  ok(sonuc.basarili, 'eski cihaz: enginozcan1402@gmail.com girisi ' +
    (sonuc.basarili ? 'basarili' : ('BASARISIZ -> ' + sonuc.mesaj)));

  /* --- Senaryo 3: çevrimdışı cihaz (bulut yok) - raporlanan belirti ---
     Not: arayüzde giriş, yerelde bulunamayan hesap için önce ortak kaydı
     dener (bkz. test/girisbuluttest.js). Burada doğrulama katmanı doğrudan
     çağrıldığı için yerel veri yokken hesap reddedilmelidir. */
  ISG.depo.geriYukle(ISG.BOS_VERI());
  sonuc = girisDene('enginozcan1402@gmail.com', '1402');
  ok(!sonuc.basarili, 'cevrimdisi cihaz: yeni kullanici girisi REDDEDILMELI (belirtinin mekanizmasi)');
  ok(sonuc.mesaj.indexOf('mehmetkurt0948@gmail.com') >= 0,
    'cevrimdisi cihaz: hata mesaji yalnizca varsayilan yoneticiyi listeliyor -> "' + sonuc.mesaj + '"');
  const yerelHesaplar = (ISG.depo.al().kullanicilar || []).map(function (k) { return k.eposta; });
  ok(yerelHesaplar.length === 1 && yerelHesaplar[0] === 'mehmetkurt0948@gmail.com',
    'cevrimdisi cihaz: yerelde tek hesap var (' + yerelHesaplar.join(', ') + ')');

  console.log(process.exitCode ? 'SONUC: FAIL' : 'SONUC: PASS');
  pencere.close(); /* jsdom zamanlayicilari process'i ayakta tutmasin */
  process.exit(process.exitCode || 0);

})();