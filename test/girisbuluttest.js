/* ISG Takip Merkezi - giriş öncesi bulut eşitlemesi testi (sahte Supabase).
   Kanıtlanmak istenen davranışlar:
     1) Uygulama açılırken (oturum yokken) bulut eşitlemesi BAŞLAR ve ortak
        kayıttaki hesaplar yerele iner; taze tarayıcıda hesap bulunabilir.
     2) Yerelde olmayan ama bulutta tanımlı hesap formdan giriş yapabilir:
        giriş reddedilmeden önce ortak kayıt çekilir, doğrulama yeniden denenir.
     3) Bu deneme sürerken kullanıcıya "ortak kayıt denetleniyor" bilgisi verilir.
     4) Buluta ulaşılamıyorsa kullanıcı yanıltılmaz: hata mesajı bağlantı
        denetimi önerir ve oturum açılmaz.
   Çalıştırma: node test/girisbuluttest.js */
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
const bekle = (ms) => new Promise((coz) => setTimeout(coz, ms));

/* 1) Üretim sayfasıyla aynı sırada yüklenen betikler */
const indexMetni = dosyaOku('index.html');
const ISG_SCRIPTLER = [];
indexMetni.replace(/<script[^>]+src="(assets\/js\/[^"?]+)/g, function (_eslesme, yol) {
  ISG_SCRIPTLER.push(yol);
  return _eslesme;
});

/* Ortak kayıtta bulunan, yerelde HİÇ olmayan test hesabı */
const BULUT_HESAP = {
  id: 'ub-test', adSoyad: 'Bulut Kullanıcı', eposta: 'bulut.kullanici@ornek.com',
  sifre: '2468', rol: 'uzman', gorev: 'İSG uzmanı', isyerleri: [], aktif: true, sonGiris: ''
};

function yanitla(govde, durumKodu) {
  return {
    ok: (durumKodu || 200) < 400,
    status: durumKodu || 200,
    text: () => Promise.resolve(JSON.stringify(govde))
  };
}

/* Sahte PostgREST: tek satırlı isg_veri tablosu + damga yoklaması + koşullu PATCH */
function sahteFetch(durum, sayac, url, secenekler) {
  const ayrica = new URL(url);
  const yontem = (secenekler && secenekler.method) || 'GET';
  const sorgu = ayrica.searchParams;
  const govde = secenekler && secenekler.body ? JSON.parse(secenekler.body) : null;

  if (yontem === 'GET') {
    if (String(sorgu.get('select') || '') === 'guncelleme') {
      sayac.damga += 1;
      return yanitla(durum.satir ? [{ guncelleme: durum.satir.guncelleme }] : []);
    }
    sayac.govde += 1;
    return yanitla(durum.satir
      ? [{ veri: durum.satir.veri, guncelleme: durum.satir.guncelleme }] : []);
  }
  if (yontem === 'POST') {
    sayac.post += 1;
    const satir = govde[0];
    durum.satir = { oda: satir.oda, veri: satir.veri, guncelleme: satir.guncelleme };
    return yanitla(null, 201);
  }
  if (yontem === 'PATCH') {
    sayac.patch += 1;
    const beklenen = String(sorgu.get('guncelleme') || '').replace(/^eq\./, '');
    if (!durum.satir || durum.satir.guncelleme !== beklenen) { return yanitla([]); }
    durum.satir.veri = govde.veri;
    durum.satir.guncelleme = govde.guncelleme;
    return yanitla([{ guncelleme: govde.guncelleme }]);
  }
  return yanitla({ message: 'desteklenmeyen yontem' }, 405);
}

/* Her senaryo kendi tarayıcısını (temiz localStorage) kurar. Ağ isteği
   kapı (kapi) ile tutulur; test satırı hazırlayınca coz() ile bırakılır. */
const PENCELER = [];

/* `pretendToBeVisual` jsdom içinde çizim döngüsü (requestAnimationFrame)
   çalıştırır; pencere kapatılmazsa Node süreci hiç sonlanmaz ve testi çağıran
   çalıştırıcı (npm run test:giris, git kancası) asılı kalır. */
function hepsiniKapat() {
  PENCELER.forEach(function (dom) {
    try { dom.window.close(); } catch (hata) { /* yok say */ }
  });
  PENCELER.length = 0;
}

function pencereKur(secenek) {
  const sec = secenek || {};
  const dom = new JSDOM(indexMetni, {
    url: 'https://localhost/', runScripts: 'outside-only', pretendToBeVisual: true
  });
  const pencere = dom.window;
  PENCELER.push(dom);
  pencere.matchMedia = pencere.matchMedia || ((sorgu) => ({
    matches: false, media: sorgu, onchange: null,
    addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {}, dispatchEvent() { return false; }
  }));
  pencere.scrollTo = () => {};
  pencere.HTMLElement.prototype.scrollIntoView = () => {};

  const sayac = { govde: 0, damga: 0, patch: 0, post: 0 };
  const durum = { satir: null, cevrimdisi: !!sec.cevrimdisi, gecikme: sec.gecikme || 0 };
  let kapiCoz = null;
  const kapi = new Promise((coz) => { kapiCoz = coz; });

  pencere.fetch = function (url, secenekler) {
    return kapi.then(function () {
      if (durum.cevrimdisi) { return Promise.reject(new TypeError('Failed to fetch')); }
      const gecikme = durum.gecikme;
      return bekle(gecikme).then(function () {
        return sahteFetch(durum, sayac, url, secenekler);
      });
    });
  };

  ISG_SCRIPTLER.forEach((yol) => pencere.eval(dosyaOku(yol)));
  return { pencere: pencere, ISG: pencere.ISG, sayac: sayac, durum: durum, coz: kapiCoz };
}

/* Açılışta (DOMContentLoaded) kurulan uygulamayı bekler; bazı jsdom
   sürümlerinde hazır durum betik yüklenirken "complete" olur ve başlatma
   eşzamanlı çalışır. Giriş katmanı yoksa elle başlatılır. */
async function uygulamayiBekle(pencere, ISG) {
  await bekle(80);
  if (!pencere.document.getElementById('girisKatman')) {
    ISG.uygulama.baslat();
    await bekle(80);
  }
  return pencere.document.getElementById('girisKatman');
}

function bulutSatiri(ISG, ekHesaplar) {
  const veri = ISG.BOS_VERI();
  (ekHesaplar || []).forEach(function (hesap) { veri.kullanicilar.push(hesap); });
  return { veri: veri, guncelleme: new Date().toISOString() };
}

function formuGonder(pencere, eposta, sifre) {
  const belge = pencere.document;
  belge.getElementById('girisEposta').value = eposta;
  belge.getElementById('girisSifre').value = sifre;
  const form = belge.getElementById('girisForm');
  form.dispatchEvent(new pencere.Event('submit', { bubbles: true, cancelable: true }));
  return form;
}

function uyariMetni(pencere) {
  const kutu = pencere.document.getElementById('girisUyari');
  return kutu ? String(kutu.textContent || '') : '';
}

function sifirlaUyariMetni(pencere) {
  const kutu = pencere.document.getElementById('sifirlaUyari');
  return kutu ? String(kutu.textContent || '') : '';
}

/* Şifre sıfırlama formu iki adımlıdır: 1) e-posta 2) kod + yeni şifre. */
function sifirlaFormuGonder(pencere, eposta) {
  const belge = pencere.document;
  belge.getElementById('sifirlaEposta').value = eposta;
  const form = belge.getElementById('sifirlaForm');
  form.dispatchEvent(new pencere.Event('submit', { bubbles: true, cancelable: true }));
  return form;
}

function sifirlaKoduGonder(pencere, eposta, kod, sifre) {
  const form = pencere.document.getElementById('sifirlaForm');
  form.elements.eposta.value = eposta;
  form.elements.kod.value = kod;
  form.elements.sifre.value = sifre;
  form.elements.sifreTekrar.value = sifre;
  form.dispatchEvent(new pencere.Event('submit', { bubbles: true, cancelable: true }));
}

/* E-posta servisi tanımsızken kod ekranda gösterilir (#sifirlaKod). */
function ekrandakiKod(pencere) {
  const kutu = pencere.document.getElementById('sifirlaKod');
  const eslesme = String(kutu ? kutu.textContent : '').match(/\d{6}/);
  return eslesme ? eslesme[0] : '';
}

function buluttakiHesap(durum, eposta) {
  const veri = (durum && durum.satir && durum.satir.veri) || {};
  const hesaplar = veri.kullanicilar || [];
  for (let i = 0; i < hesaplar.length; i += 1) {
    if (String(hesaplar[i].eposta || '').toLowerCase() === eposta) { return hesaplar[i]; }
  }
  return null;
}

(async function main() {
  /* --- Senaryo 1: taze tarayıcı, ortak kayıtta hesap var --- */
  const a = pencereKur();
  a.durum.satir = bulutSatiri(a.ISG, [BULUT_HESAP]);
  a.coz();
  const katmanA = await uygulamayiBekle(a.pencere, a.ISG);
  await bekle(120);

  ok(!!katmanA && katmanA.hidden === false, 'taze tarayıcıda giriş ekranı açıldı');
  ok(a.sayac.govde >= 1, 'oturum açılmadan önce ortak kayıt okundu (gövde isteği: ' +
    a.sayac.govde + ')');
  ok(!!a.ISG.depo.kullaniciEpostaBul(BULUT_HESAP.eposta),
    'ortak kayıttaki hesap giriş öncesi yerele indi');

  formuGonder(a.pencere, BULUT_HESAP.eposta, BULUT_HESAP.sifre);
  await bekle(80);
  const oturumA = a.ISG.yetki.oturum();
  ok(!!oturumA && oturumA.eposta === BULUT_HESAP.eposta,
    'taze tarayıcıda bulut hesabıyla giriş başarılı (' +
    (oturumA ? oturumA.eposta : 'oturum yok') + ')');
  ok(katmanA.hidden === true, 'giriş başarılı olunca giriş ekranı kapandı');

  /* --- Senaryo 2: açılış eşitlemesi başarısız, kullanıcı erken davranıyor --- */
  const b = pencereKur({ cevrimdisi: true });
  b.durum.satir = bulutSatiri(b.ISG, [BULUT_HESAP]);
  b.coz();
  const katmanB = await uygulamayiBekle(b.pencere, b.ISG);
  await bekle(120);
  ok(!b.ISG.depo.kullaniciEpostaBul(BULUT_HESAP.eposta),
    'ilk eşitleme başarısızken hesap henüz yerelde yok');
  ok(!!katmanB && katmanB.hidden === false, 'eşitleme hatası giriş ekranını engellemedi');

  /* Bağlantı düzeldi; giriş denemesi ortak kaydı kendisi çeksin. */
  b.durum.cevrimdisi = false;
  b.durum.gecikme = 120;
  const govdeOncesi = b.sayac.govde;
  formuGonder(b.pencere, BULUT_HESAP.eposta, BULUT_HESAP.sifre);
  await bekle(40);
  ok(uyariMetni(b.pencere).indexOf('denetleniyor') >= 0,
    'bulut denetimi sürerken kullanıcıya durum bildirildi ("' + uyariMetni(b.pencere) + '")');
  await bekle(400);
  ok(b.sayac.govde > govdeOncesi, 'giriş sırasında ortak kayıt yeniden çekildi');
  const oturumB = b.ISG.yetki.oturum();
  ok(!!oturumB && oturumB.eposta === BULUT_HESAP.eposta,
    'yerelde olmayan hesap buluttan doğrulanıp giriş yaptı (' +
    (oturumB ? oturumB.eposta : 'oturum yok') + ')');
  ok(uyariMetni(b.pencere) === '', 'başarılı girişten sonra uyarı metni temizlendi');

  /* --- Senaryo 3: bulut kapalı, hesap yerelde de yok --- */
  const c = pencereKur({ cevrimdisi: true });
  c.durum.satir = bulutSatiri(c.ISG, [BULUT_HESAP]);
  c.coz();
  const katmanC = await uygulamayiBekle(c.pencere, c.ISG);
  await bekle(120);
  formuGonder(c.pencere, BULUT_HESAP.eposta, BULUT_HESAP.sifre);
  await bekle(600);
  const uyariC = uyariMetni(c.pencere);
  ok(!c.ISG.yetki.oturum(), 'buluta ulaşılamıyorsa oturum açılmadı');
  ok(uyariC.indexOf('Ortak kayda ulaşılamadı') >= 0,
    'bağlantı hatası kullanıcıya açıkça bildirildi ("' + uyariC + '")');
  ok(!!katmanC && katmanC.hidden === false, 'başarısız denemeden sonra giriş ekranı açık kaldı');

  /* --- Senaryo 4: yerelde VAR olan hesapta hatalı şifre buluta sorulmaz --- */
  const d = pencereKur();
  d.durum.satir = bulutSatiri(d.ISG, [BULUT_HESAP]);
  d.coz();
  await uygulamayiBekle(d.pencere, d.ISG);
  await bekle(120);
  const oncesi = { govde: d.sayac.govde, patch: d.sayac.patch };
  formuGonder(d.pencere, 'mehmetkurt0948@gmail.com', 'yanlis-sifre');
  await bekle(300);
  ok(!d.ISG.yetki.oturum(), 'hatalı şifreyle oturum açılmadı');
  ok(d.sayac.govde === oncesi.govde && d.sayac.patch === oncesi.patch,
    'bilinen hesapta hatalı şifre için gereksiz bulut isteği yapılmadı');
  ok(uyariMetni(d.pencere).indexOf('Ortak kayda ulaşılamadı') < 0,
    'hatalı şifre mesajı bağlantı hatasıyla karıştırılmadı ("' +
    uyariMetni(d.pencere) + '")');

  /* --- Senaryo 5: yavaş bağlantı (açılış indirmesi 4 sn sürüyor) ---
     Kullanıcı indirme bitmeden şifresini yazıp Enter'a bastı. Açılıştaki
     eşitleme "meşgul" gerekçesiyle düşürülmemeli; indirme biter bitmez giriş
     İKİNCİ KEZ BASKI GEREKMEDEN tamamlanmalı. (Sahadaki şikâyet: yöneticinin
     oluşturduğu hesap telefonda "kullanıcı bulunamadı" veriyordu.) */
  const e = pencereKur({ gecikme: 4000 });
  e.durum.satir = bulutSatiri(e.ISG, [BULUT_HESAP]);
  e.coz();
  await uygulamayiBekle(e.pencere, e.ISG);
  e.durum.istekler = []; /* bundan sonrası: yalnızca giriş sırasında yapılan istekler */
  formuGonder(e.pencere, BULUT_HESAP.eposta, BULUT_HESAP.sifre);
  await bekle(1200);
  const uyariBekleme = uyariMetni(e.pencere);
  ok(!e.ISG.yetki.oturum(), 'yavaş bağlantıda indirme bitmeden oturum açılmadı');
  ok(uyariBekleme.indexOf('ortak kayıt denetleniyor') >= 0,
    'indirme sürerken kullanıcıya bekleme bilgisi verildi ("' + uyariBekleme + '")');
  ok(uyariBekleme.indexOf('bulunamadı') < 0,
    'indirme bitmeden "kullanıcı bulunamadı" denmedi ("' + uyariBekleme + '")');
  let girisE = null;
  for (let i = 0; i < 60; i += 1) {
    girisE = e.ISG.yetki.oturum();
    if (girisE) { break; }
    await bekle(250);
  }
  ok(!!girisE && girisE.kullaniciId === BULUT_HESAP.id,
    'yavaş bağlantıda ikinci kez basmadan giriş tamamlandı (' +
    (girisE ? girisE.kullaniciId : 'oturum yok') + ')');
  const indirmeSayisi = e.durum.istekler.filter(function (s) { return s.indexOf('select=') === 0; }).length;
  ok(indirmeSayisi === 0,
    'başarılı açılış indirmesi giriş için yeniden yapılmadı (yeniden indirme: ' + indirmeSayisi + ')');
  ok(uyariMetni(e.pencere).indexOf('Ortak kayda ulaşılamadı') < 0,
    'yavaş bağlantı bağlantı hatası gibi sunulmadı');

  /* --- Senaryo 6: yeni cihazda şifre sıfırlama hesabı buluttan bulur --- */
  const f = pencereKur({ cevrimdisi: true });
  f.durum.satir = bulutSatiri(f.ISG, [BULUT_HESAP]);
  f.coz();
  const katmanF = await uygulamayiBekle(f.pencere, f.ISG);
  await bekle(220);
  ok(!!katmanF && katmanF.hidden === false, 'senaryo 6: taze tarayıcıda giriş ekranı açık');
  ok(!f.ISG.depo.kullaniciEpostaBul(BULUT_HESAP.eposta),
    'senaryo 6: hesap bu cihazda tanımlı değil (açılış eşitlemesi başarısız)');

  /* Bağlantı düzeldi: kod isteği hesabı kendisi bulmalı. */
  f.durum.cevrimdisi = false;
  f.durum.gecikme = 120;
  const govdeOncesiF = f.sayac.govde;
  sifirlaFormuGonder(f.pencere, BULUT_HESAP.eposta);
  await bekle(700);
  ok(f.sayac.govde > govdeOncesiF,
    'şifre sıfırlama da hesabı ortak kayıtta aradı (gövde isteği: ' + f.sayac.govde + ')');
  ok(!!f.ISG.depo.kullaniciEpostaBul(BULUT_HESAP.eposta),
    'sıfırlama öncesi ortak kayıttaki hesap yerele indi');
  ok(sifirlaUyariMetni(f.pencere).indexOf('bulunamadı') < 0,
    'ortak kayıttaki hesap için "kullanıcı bulunamadı" denmedi ("' + sifirlaUyariMetni(f.pencere) + '")');
  const kodF = ekrandakiKod(f.pencere);
  ok(/^\d{6}$/.test(kodF), 'doğrulama kodu ekranda gösterildi (' + kodF + ')');

  /* --- Senaryo 7: yenilenen şifre beklemeden ortak kayda yazılır --- */
  const YENI_SIFRE = 'yeni-sifre-9137';
  sifirlaKoduGonder(f.pencere, BULUT_HESAP.eposta, kodF, YENI_SIFRE);
  let bulutHesabi = null;
  for (let i = 0; i < 14; i += 1) {
    bulutHesabi = buluttakiHesap(f.durum, BULUT_HESAP.eposta);
    if (bulutHesabi && bulutHesabi.sifre === YENI_SIFRE) { break; }
    await bekle(250);
  }
  const yerelHesap = f.ISG.depo.kullaniciEpostaBul(BULUT_HESAP.eposta);
  ok(!!yerelHesap && yerelHesap.sifre === YENI_SIFRE, 'yenilenen şifre bu cihazda geçerli');
  ok(!!bulutHesabi && bulutHesabi.sifre === YENI_SIFRE,
    'yenilenen şifre ortak kayda anında yazıldı (buluttaki: ' +
    (bulutHesabi ? bulutHesabi.sifre : 'hesap yok') + ')');

  console.log(process.exitCode ? 'SONUC: FAIL' : 'SONUC: PASS');
  hepsiniKapat(); /* jsdom zamanlayicilari process'i ayakta tutmasin */
  process.exit(process.exitCode || 0);
})().catch(function (hata) {
  console.error('BEKLENMEDIK HATA: ' + ((hata && hata.stack) || hata));
  hepsiniKapat();
  process.exit(1);
});
