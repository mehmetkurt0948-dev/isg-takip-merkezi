/* ISG Takip Merkezi - bulut verisiyle giris dogrulama testi (SENTETIK).

   2.27.0 GUVENLIK DUZELTMESI: Bu test artik URETIM Supabase satirini cekmez.
   Eski surum gercek proje adresine aga cikiyor, gercek kisi e-postasi ve sabit
   parola kullaniyordu. Yeni surum:
     - bulut verisini sentetik olarak uretir (gercek kisi/kurum/veri yok),
     - gercek adres, oda kodu, e-posta veya parola icermez,
     - ag erisimini stub'lar: `fetch` cagrisi sayilir, tek cagri bile FAIL'dir,
     - siteye gomulu bulut kimligini test icinde devre disi birakir.

   Senaryolar (uc cihaz davranisi, mevcut mantik korunur):
     1) Yeni cihaz  -> bos yerel veri + sentetik bulut birlesimi -> hesap GIRER
     2) Eski cihaz  -> yalnizca varsayilan yonetici + birlesim     -> hesap GIRER
     3) Cevrimdisi  -> bulut yok, yalnizca varsayilan yonetici     -> hesap GIREMEZ

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
function ok(kosul, ad, deger) {
  console.log((kosul ? 'PASS' : 'FAIL') + ': ' + ad + (deger ? ' [' + deger + ']' : ''));
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

/* 2) Ag kapisi: test boyunca tek bir fetch cagrisi bile yapilmamali. */
let agCagrisi = 0;
pencere.fetch = function () {
  agCagrisi += 1;
  return Promise.reject(new Error('Test ortaminda ag erisimi kapalidir.'));
};
/* Siteye gomulu bulut kimligi devre disi: otomatik esitleme hic baslamaz. */
pencere.localStorage.setItem('isgtakip.bulut.kapali', '1');

ISG_SCRIPTLER.forEach((yol) => pencere.eval(dosyaOku(yol)));
const ISG = pencere.ISG;

/* 3) Sentetik bulut verisi: gercek kisi, kurum, e-posta ve parola kullanilmaz. */
const DAMGA = '2026-01-01T00:00:00.000Z';
const sentetikHesap = {
  id: 'u-sentetik', adSoyad: 'Sentetik Kullanici', eposta: 'sentetik.kullanici@ornek.local',
  sifre: 'sentetik-parola-1', rol: 'yetkili', isyerleri: ['iy-sentetik'],
  aktif: true, guncelleme: DAMGA
};
function sentetikBulut() {
  const veri = ISG.BOS_VERI();
  veri.ayarlar.kurum = 'Sentetik OSGB';
  veri.isyerleri = [{
    id: 'iy-sentetik', ad: 'Sentetik Isyeri', kurumId: '', tehlikeSinifi: 'Az Tehlikeli',
    guncelleme: DAMGA
  }];
  veri.personel = [{
    id: 'p-sentetik', sicil: 'S-1', adSoyad: 'Sentetik Personel', isyeriId: 'iy-sentetik',
    gorev: 'Operator', aktif: true, guncelleme: DAMGA
  }];
  /* Varsayilan yonetici bulutta farkli bir sifreyle duruyor: "buluttaki sifreyle
     giris" davranisi gercek hesaba dokunmadan sinanabilsin. */
  const varsayilan = Object.assign({}, ISG.YONETICI_HESAP()[0], {
    sifre: 'sentetik-yonetici-2', guncelleme: DAMGA
  });
  veri.kullanicilar = [varsayilan, sentetikHesap];
  return veri;
}

function girisDene(eposta, sifre) {
  try {
    const kullanici = ISG.giris.kullaniciDogrula(eposta, sifre);
    return { basarili: true, kullanici: kullanici, mesaj: '' };
  } catch (hata) {
    return { basarili: false, kullanici: null, mesaj: String(hata.message || hata) };
  }
}

(function main() {
  /* Test dosyasinin kendisi de temiz olmali: uretim adresi ya da gercek hesap
     (gmail) bu dosyada tutulmaz. */
  const kendiKaynagi = fs.readFileSync(__filename, 'utf8');
  ok(!/supabase\.co|@gmail\.com/i.test(kendiKaynagi),
    'test dosyasi uretim adresi ve gercek hesap icermiyor');

  const varsayilanEposta = ISG.YONETICI_HESAP()[0].eposta;
  const uzak = sentetikBulut();
  const uzakEpostalar = uzak.kullanicilar.map(function (k) { return k.eposta; });
  ok(uzakEpostalar.indexOf(sentetikHesap.eposta) >= 0 && uzakEpostalar.length === 2,
    'sentetik bulut iki hesap getiriyor', uzakEpostalar.join(', '));

  /* --- Senaryo 1: yeni cihaz (bos yerel veri) + bulut birlesimi --- */
  ISG.depo.yukle(ISG.BOS_VERI());
  const birlesik = ISG.depo.birlestir(uzak).veri;
  ISG.depo.yukle(birlesik);
  ok(ISG.depo.kullaniciEpostaBul(sentetikHesap.eposta) !== null,
    'birlesim sentetik hesabi yerel depoya tasiyor');
  ok((birlesik.personel || []).length === 1 && (birlesik.isyerleri || []).length === 1,
    'birlesim sentetik isyeri ve personeli koruyor',
    (birlesik.isyerleri || []).length + ' isyeri / ' + (birlesik.personel || []).length + ' personel');
  let sonuc = girisDene(sentetikHesap.eposta, sentetikHesap.sifre);
  ok(sonuc.basarili, 'yeni cihaz: sentetik kullanici girisi ' +
    (sonuc.basarili ? 'basarili' : ('BASARISIZ -> ' + sonuc.mesaj)));
  sonuc = girisDene(varsayilanEposta, 'sentetik-yonetici-2');
  ok(sonuc.basarili, 'yeni cihaz: varsayilan yonetici buluttaki sifreyle giriyor ' +
    (sonuc.basarili ? 'basarili' : ('BASARISIZ -> ' + sonuc.mesaj)));

  /* --- Senaryo 2: eski cihaz (yalnizca varsayilan yonetici) + bulut birlesimi --- */
  ISG.depo.yukle(ISG.BOS_VERI());
  const eskiYerel = ISG.BOS_VERI();
  eskiYerel.kullanicilar = ISG.YONETICI_HESAP();
  ISG.depo.yukle(eskiYerel);
  const birlesik2 = ISG.depo.birlestir(uzak).veri;
  ISG.depo.yukle(birlesik2);
  sonuc = girisDene(sentetikHesap.eposta, sentetikHesap.sifre);
  ok(sonuc.basarili, 'eski cihaz: sentetik kullanici girisi ' +
    (sonuc.basarili ? 'basarili' : ('BASARISIZ -> ' + sonuc.mesaj)));

  /* --- Senaryo 3: cevrimdisi cihaz (bulut yok) - raporlanan belirti ---
     Not: arayuzde giris, yerelde bulunamayan hesap icin once ortak kaydi dener
     (bkz. test/girisbuluttest.js). Burada dogrulama katmani dogrudan cagrildigi
     icin yerel veri yokken hesap reddedilmelidir. */
  ISG.depo.yukle(ISG.BOS_VERI());
  sonuc = girisDene(sentetikHesap.eposta, sentetikHesap.sifre);
  ok(!sonuc.basarili, 'cevrimdisi cihaz: yeni kullanici girisi REDDEDILMELI (belirtinin mekanizmasi)');
  ok(sonuc.mesaj.indexOf(varsayilanEposta) >= 0,
    'cevrimdisi cihaz: hata mesaji yalnizca varsayilan yoneticiyi listeliyor -> "' + sonuc.mesaj + '"');
  const yerelHesaplar = (ISG.depo.al().kullanicilar || []).map(function (k) { return k.eposta; });
  ok(yerelHesaplar.length === 1 && yerelHesaplar[0] === varsayilanEposta,
    'cevrimdisi cihaz: yerelde tek hesap var', yerelHesaplar.join(', '));

  /* --- 4) Ag kapisi ve kimlik: test hicbir zaman canliya baglanmaz. --- */
  ok(agCagrisi === 0, 'test boyunca ag cagrisi yapilmadi', String(agCagrisi));
  ok(ISG.bulut.hazirMi() === false,
    'gomulu bulut kimligi testte devre disi (otomatik esitleme kapali)');

  console.log(process.exitCode ? 'SONUC: FAIL' : 'SONUC: PASS');
  pencere.close(); /* jsdom zamanlayicilari process'i ayakta tutmasin */
  process.exit(process.exitCode || 0);
})();

