/* ISG Takip Merkezi - bulut eszitleme davranis testi (sahte Supabase ile).
   Kanitlanmak istenen yeni davranislar:
     1) Damga yoklamasi: degisiklik yoksa tam kayit govdesi INDIRILMEZ,
        yalnizca select=guncelleme istegi yapilir.
     2) Kosullu yazma (compare-and-swap): baska cihaz bizden sonra yazdiysa
        PATCH sifir satir dondurur; istemci cekip birlestirir, hicbir kayit
        kaybolmadan yeniden yazar.
     3) Geri cekilme: hatali turlar ardise baglaninca olcum sayaci yukselir,
        basarili turda sifirlanir.
   Calistirma: node test/senkrontest.js */
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

/* 1) Uretim sayfasiyla ayni sira yuklenir; fetch onden takilir ki acilis
      esnasinda gercek aga dokunulmasin. */
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

/* 2) Sahte Supabase: tek satirli isg_veri tablosu + PostgREST filtresi taklidi */
const sayac = { govde: 0, damga: 0, patch: 0, post: 0, hata: 0 };
const tablo = { satir: null };
let cevrimdisi = false;
const simdiZaman = (ek) => new Date(Date.now() + (ek || 0)).toISOString();

function yanitla(govde, durumKodu) {
  return {
    ok: (durumKodu || 200) < 400,
    status: durumKodu || 200,
    text: () => Promise.resolve(JSON.stringify(govde))
  };
}

pencere.fetch = function (url, secenekler) {
  if (cevrimdisi) {
    sayac.hata += 1;
    return Promise.reject(new TypeError('Failed to fetch'));
  }
  const ayrica = new URL(url);
  const yontem = (secenekler && secenekler.method) || 'GET';
  const sorgu = ayrica.searchParams;
  const govde = secenekler && secenekler.body ? JSON.parse(secenekler.body) : null;

  if (yontem === 'GET') {
    const alanlar = String(sorgu.get('select') || '');
    if (alanlar === 'guncelleme') {
      sayac.damga += 1;
      return Promise.resolve(yanitla(tablo.satir ? [{ guncelleme: tablo.satir.guncelleme }] : []));
    }
    sayac.govde += 1;
    return Promise.resolve(yanitla(tablo.satir
      ? [{ veri: tablo.satir.veri, guncelleme: tablo.satir.guncelleme }] : []));
  }

  if (yontem === 'POST') {
    sayac.post += 1;
    const satir = govde[0];
    tablo.satir = { oda: satir.oda, veri: satir.veri, guncelleme: satir.guncelleme };
    return Promise.resolve(yanitla(null, 201));
  }

  if (yontem === 'PATCH') {
    sayac.patch += 1;
    const bekle = String(sorgu.get('guncelleme') || '').replace(/^eq\./, '');
    /* KOSULLU guncelleme: damga tutmuyorsa hic satir donmez (PostgREST gibi). */
    if (!tablo.satir || tablo.satir.guncelleme !== bekle) {
      return Promise.resolve(yanitla([], 200));
    }
    tablo.satir.veri = govde.veri;
    tablo.satir.guncelleme = govde.guncelleme;
    return Promise.resolve(yanitla([{ guncelleme: govde.guncelleme }]));
  }
  return Promise.resolve(yanitla({ message: 'desteklenmeyen yontem' }, 405));
};

ISG_SCRIPTLER.forEach((yol) => pencere.eval(dosyaOku(yol)));
const ISG = pencere.ISG;
if (!ISG || !ISG.bulut) { console.error('FAIL: ISG.bulut yuklenmedi'); process.exit(1); }

/* Yardimci: yeni isyeri kaydi ekleyip depoyu "kullanici degistirdi" haline getirir. */
function yerelIsyeriEkle(ad) {
  const veri = ISG.depo.al();
  veri.isyerleri.push({
    id: 'test-' + ad, ad: ad, tehlikeSinifi: 'azTehlikeli', calisanSayisi: 10,
    birim: 'Test', guncelleme: new Date().toISOString()
  });
  ISG.depo.kaydet();
  return 'test-' + ad;
}

function buluttaIsyeriVar(id) {
  const satir = tablo.satir;
  if (!satir || !satir.veri || !Array.isArray(satir.veri.isyerleri)) { return false; }
  return satir.veri.isyerleri.some(function (i) { return i && i.id === id; });
}

(async function main() {
  /* Acilis esnasinda gomulu kimlikle baslatilan ilk esitleme turu beklenir,
     sonra sahte sunucu sifirlanir: test yalnizca kendi senaryolarini olcer. */
  ISG.bulut.kapat();
  await new Promise((resolve) => setTimeout(resolve, 60));
  tablo.satir = null;
  Object.keys(sayac).forEach((k) => { sayac[k] = 0; });

  /* --- 0) Baglanti: bulut bos, ilk gonderim damga bilinmedigi icin POST --- */
  ISG.bulut.ayarYaz({
    url: 'https://test-sunucu.supabase.co', anahtar: 'test-anahtari',
    oda: 'test-odasi', otomatik: false, aralik: 30
  });
  yerelIsyeriEkle('Cihaz-A');
  const ilkGonderim = await ISG.bulut.gonder(false);
  ok(ilkGonderim === true, 'ilk gonderim basarili (damga bilinmiyor -> POST upsert)');
  ok(sayac.post === 1 && sayac.patch === 0, 'damga yokken kosullu PATCH degil POST kullanildi');
  ok(buluttaIsyeriVar('test-Cihaz-A'), 'bulutta Cihaz-A kaydi olusturuldu');

  /* --- 1) Degisiklik yoksa govde indirilmez, yalnizca damga yoklanir --- */
  await ISG.bulut.gonder(false);
  const govdeOncesi = sayac.govde, damgaOncesi = sayac.damga;
  const sonucYoklama = await ISG.bulut.cek(true);
  ok(sonucYoklama === false, 'degisiklik olmayan yoklama "is yok" olarak dondu');
  ok(sayac.damga > damgaOncesi, 'yoklama damga istegi yapti (select=guncelleme)');
  ok(sayac.govde === govdeOncesi, 'ayni surumde TAM KAYIT GOVDESI yeniden indirilmedi');

  /* --- 2) Baska cihaz yazdiysa yoklama govde cekmeye yonlendirir --- */
  const damgaOncesi2 = sayac.damga, govdeOncesi2 = sayac.govde;
  tablo.satir.veri.isyerleri.push({
    id: 'test-Cihaz-B', ad: 'Cihaz-B', tehlikeSinifi: 'tehlikeli',
    calisanSayisi: 20, birim: 'Test', guncelleme: simdiZaman(60000)
  });
  tablo.satir.guncelleme = simdiZaman(60000);
  await ISG.bulut.cek(true);
  ok(sayac.govde > govdeOncesi2, 'uzak damga degisince tam govde cekildi');
  const yerelKimler = ISG.depo.al().isyerleri.map(function (i) { return i.id; });
  ok(yerelKimler.indexOf('test-Cihaz-B') >= 0, 'uzak cihaz kaydi yerele birlesti');
  ok(sayac.damga > damgaOncesi2, 'yoklama once damga istegi ile basladi');


  /* --- 3) Kosullu yazma cakismasi: iki cihaz es zamanli kayit ekliyor --- */
  const patchOncesi = sayac.patch;
  yerelIsyeriEkle('Cihaz-C');
  /* Ayni anda B cihazi buluta yazdi: damga bizim gordugumuzden yeni. */
  tablo.satir.veri.isyerleri.push({
    id: 'test-Cihaz-D', ad: 'Cihaz-D', tehlikeSinifi: 'cokTehlikeli',
    calisanSayisi: 30, birim: 'Test', guncelleme: simdiZaman(120000)
  });
  tablo.satir.guncelleme = simdiZaman(120000);
  const cakismali = await ISG.bulut.gonder(true);
  ok(cakismali === true, 'cakisma yakalandi, birlestirme sonrasi gonderim tamamlandi');
  ok(sayac.patch > patchOncesi, 'kosullu PATCH denendi (guncelleme=eq.damga)');
  ok(ISG.bulut.istatistik().cakisma >= 1,
    'eszamanli degisiklik sayaci isledi (' + ISG.bulut.istatistik().cakisma + ')');
  ok(buluttaIsyeriVar('test-Cihaz-C') && buluttaIsyeriVar('test-Cihaz-D'),
    'bulutta hem bizim (C) hem diger cihazimizin (D) kaydi var -> ezilme yok');
  ok(buluttaIsyeriVar('test-Cihaz-A') && buluttaIsyeriVar('test-Cihaz-B'),
    'onceki kayitlar da bulutta korundu');

  /* --- 4) Geri cekilme: ulasilamayan sunucuda hata sayaci yukselir --- */
  cevrimdisi = true;
  yerelIsyeriEkle('Cihaz-E');
  const cevrimdisiSonuc = await ISG.bulut.gonder(true);
  ok(cevrimdisiSonuc === false, 'cevrimdisi gonderim basarisiz dondu');
  const hataSayaci = ISG.bulut.istatistik().ardicHata;
  ok(hataSayaci >= 1, 'ardisik hata sayaci yukseldi (' + hataSayaci + ') -> geri cekilme');
  const ilkKademe = ISG.bulut.istatistik();
  ok(ilkKademe.atlamaHedefi >= 1 && ilkKademe.etkinAralik >= 60,
    'ilk hatada yoklama en az ikiye katlandi: ' + ilkKademe.etkinAralik + ' sn (ayar 30 sn)');
  ok(ISG.bulut.ozet().hata === true, 'ozet hata durumu tasiyor: ' + ISG.bulut.ozet().ayrinti);

  await ISG.bulut.gonder(true);
  const ikinciKademe = ISG.bulut.istatistik();
  ok(ikinciKademe.etkinAralik > ilkKademe.etkinAralik,
    'ikinci ardisik hatada geri cekilme buyudu: ' + ikinciKademe.etkinAralik + ' sn');
  ok(ikinciKademe.etkinAralik <= 30 * 16,
    'geri cekilme ust sinirda duruyor ( sonsuza buyumuyor): ' + ikinciKademe.etkinAralik + ' sn');

  cevrimdisi = false;
  const toparlama = await ISG.bulut.gonder(true);
  ok(toparlama === true, 'baglanti duzelince bekleyen degisiklik gonderildi');
  ok(ISG.bulut.istatistik().ardicHata === 0,
    'basarili tur geri cekilmeyi sifirladi (' + ISG.bulut.istatistik().ardicHata + ')');
  ok(ISG.bulut.istatistik().etkinAralik === 30,
    'ritim yapilandirilan araliga dondu: ' + ISG.bulut.istatistik().etkinAralik + ' sn');
  ok(buluttaIsyeriVar('test-Cihaz-E'), 'cevrimdisi eklenen kayit sonunda buluta ulasti');

  ISG.bulut.kapat();
  console.log('olcumler: ' + JSON.stringify(sayac));
  console.log(process.exitCode ? 'SONUC: FAIL' : 'SONUC: PASS');
  process.exit(process.exitCode || 0);
})();

