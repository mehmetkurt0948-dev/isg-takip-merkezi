# İSG Takip Merkezi — çalışma alanı (v3)

> İşyeri bazlı İSG takibi: giriş/roller, personel, dosya kontrolleri, çalışma
> planı, saha/DÖF, risk değerlendirmesi, acil durum planı, ekip davetleri,
> onay kuyruğu ve mevzuat kapsamı.
> **Statik** uygulama: build yok, CDN yok, veritabanı yok — tarayıcıda çalışır.

Bu sürüm, ChatGPT Sites'te yayınlanan ve 401 ile erişime kapanan "İSG Takip
Merkezi" fikrinin sıfırdan yazılmış, işyeri bazlı çoklu kapsam destekleyen
halidir. Ekran dili, sağlanan ürün görsellerindeki yapıya göre kurulmuştur:
koyu lacivert kenar, açık gri çalışma zemini, petrol yeşili vurgular ve yoğun
kayıt tabloları.

## 1. Ekranlar

| Ekran | Ne yapar? |
|---|---|
| **Giriş** | Oturum katmanı: e-posta/şifre doğrulama, hatalı şifre uyarısı, davet kodu ile hesap açma, **6 haneli e-posta koduyla şifre sıfırlama**, oturumu tarayıcıda hatırlama, çıkışta onay |
| **Genel bakış** | Tüm işyerlerinden türetilen görev motoru: geciken / bugün / yaklaşan / tarihsiz işler, öncelik sıralı liste, işyeri bazında durum tablosu |
| **İşyerleri** | Kurum şeridi (ana kurum, ad değiştir, kurum sil), işyeri kartları (tehlike sınıfı, çalışan ve kontrol maddesi sayısı), işyeri CRUD |
| **Personel listesi** | İşyeri bazında bloklar, sicil/TC/meslek/departman/şube/kıdem/telefon/cinsiyet kolonları, arama, detay açma, eğitim kayıtları, gerçek **XLSX şablonu** ve XLSX/CSV içe-dışa aktarma, "listeyi temizle" |
| **Dosya kontrolleri** | İşyerine göre üretilen kontrol kataloğu (bölüm + madde), Var/Eksik/Yok/İncelenmedi durumları, yenileme tarihleri, 14 günlük uyarı lejantı, bölüm/durum/tarih filtreleri, sayfalama, DÖF oluşturma, **belge eki yükle / görüntüle / indir / kaldır** (belge başına ≤ 1 MB, `localStorage`) |
| **Çalışma planı** | İlk yardımcı ihtiyaç/mevcut karşılaştırması, yıllık plan kartları, plan kalemi CRUD, tamamlandı işaretleme, plan KPI'ları |
| **Saha ve DÖF** | Açık/geciken/doğrulama/kapatılan tespitler, öncelik-tür filtreleri, kapatma akışı, ramak kala ve olay bildirimleri |
| **Yönetim raporu** | Tarih aralığı, açık/geciken iş, doğrulama bekleyen, dönemde tamamlanan, işyeri bazında karşılaştırma tablosu, Excel (CSV) çıktısı |
| **İstatistikler** | Personel, eğitim geçerliliği, saha tespiti, risk seviyesi ve belge durumu dağılımlarının çubuk grafikleri; dört özet KPI; kapsam filtresi |
| **Risk değerlendirmesi** | İşyeri başına son değerlendirme / en geç yenileme / olağan üst sınır, 6 rollü ekip listesi, rol bazlı **ekip üyesi ekle / değiştir / kaldır**, eksik rol uyarısı, **risk belgesi yükle / görüntüle / indir**, 5×5 risk kayıt tablosu |
| **Acil durum planı** | Çalışan sayısı, plan tarihi, yenileme sınırı (tehlike sınıfına göre), 5 rollü destek ekibi (destek elemanı dâhil), rol bazlı **ekip üyesi ekle / değiştir / kaldır**, **plan belgesi yükle / görüntüle / indir**, plan/ekip kaydı |
| **Ekip ve davetler** | E-posta + rol + yetkili işyeri seçimiyle davet oluşturma, davet listesi ve iptal |
| **Mevzuat ve kapsam** | 20 başlıklı katalog (kanun/yönetmelik/tebliğ/rehber/standart), kategori ve konu araması, teyit durumu, seçili işyeri kapsam özeti, Mevzuat Bilgi Sistemi bağlantısı |
| **Onay kuyruğu** | Yetkili kullanıcıların yazma işlemlerinden doğan talepler: işlem özeti, işyeri, talep sahibi, onayla / reddet, bekleyen sayısı rozeti, denetim izi |

Ek yetenekler: `localStorage` kalıcılığı, JSON yedek al / geri yükle, işyeri
kapsam filtresi (tüm ekranlarda), menüyü gizleme, mobil menü, yazdırma dostu
görünüm, klavye erişilebilir `<dialog>` formları, personel için gerçek
**XLSX** (şablon + dışa/içe aktarma) desteği, diğer listeler için CSV dışa
aktarma, belge önizleme (blob adresiyle yeni sekme), e-posta kodlu şifre
sıfırlama, rol bazlı yetki ve onay akışı.

### 1.1. Roller ve yetkiler

| Rol | Kapsam | Yazma | Onay kuyruğu |
|---|---|---|---|
| **Yönetici** | Tüm işyerleri | Doğrudan yazar | Görür ve yönetir |
| **Yetkili** | Yalnızca atandığı işyerleri | Talebe dönüşür, yönetici onayı gerekir | Görmez |
| **Görüntüleyici** | Yalnızca atandığı işyerleri | Yok (`salt-okunur` gövde sınıfı) | Görmez |

Başlangıç hesapları (şifre: `1234`):

| E-posta | Ad | Rol | İşyerleri |
|---|---|---|---|
| `mehmetkurt0948@gmail.com` | Mehmet Kurt | Yönetici | Tümü (6) |
| `buse.senol@ornek.com` | Buse Şenol | Yetkili | `iy1`, `iy2` |
| `selin.aydin@ornek.com` | Selin Aydın | Görüntüleyici | `iy1` |

> Giriş ekranında hazır hesap düğmesi yoktur; kullanıcı e-posta ve şifresini
> kendisi yazar. Yanlış adres girilirse uyarı metni kayıtlı hesapların
> e-postalarını hatırlatır. Şifresini unutan kullanıcı **Şifremi unuttum**
> sekmesinden 6 haneli e-posta koduyla yeni şifre belirler.

### 1.2. Şifre sıfırlama (e-posta kodu)

Statik sitede sunucu yoktur; kodun gerçekten e-postaya gitmesi için tarayıcıdan
çağrılabilen bir e-posta servisi gerekir. `assets/js/giris.js` dosyasının
başındaki `POSTA` nesnesine [EmailJS](https://www.emailjs.com/) hesabınızdan
aldığınız üç değeri yazın:

```js
var POSTA = {
  servisId: 'service_xxx',     // EmailJS service ID
  sablonId: 'template_xxx',    // EmailJS template ID
  genelAnahtar: 'xxxxxxxxxxx', // EmailJS public key
  adres: 'https://api.emailjs.com/api/v1.0/email/send'
};
```

EmailJS şablonunda `{{to_email}}`, `{{kod}}`, `{{gecerlilik_dakika}}` ve
`{{kurum}}` değişkenlerini kullanın. Akış: kullanıcı e-postasını yazar → 6
haneli kod üretilir (10 dakika geçerli, 5 hatalı deneme sınırı) → kod
`localStorage` içindeki `isgtakip.sifirlama` anahtarında tutulur → kod
doğrulanınca `ISG.depo.sifreGuncelle` ile şifre yazılır.

Değerler boşken gönderim denenmez; uygulama kodu ekranda gösterir ve
"e-posta servisi tanımlı değil" uyarısı verir. Bu durumda kod yalnızca
kurulum amaçlıdır, güvenli kabul edilmemelidir.

Yetki katmanı `assets/js/yetki.js` içinde üç parçadan oluşur: **rol tanımları**
(`ISG.yetki.ROLLER`, Türkçe rol adları `ROL_ESLEME` ile normalize edilir),
**işyeri kapsamı** (`kapsam`, `kapsamda`, `kapsamliVeri`) ve **onay kuyruğu**
(`talepler`, `talepOnayla`, `talepReddet`, `denetimListe`). Arayüz
`ISG.yetki.gorunum()` üzerinden okur; böylece menü, KPI, tablo ve raporlar
kendiliğinden oturum kapsamına düşer. Yazma işlemleri `depo.js` içinde
sarmalanır (`ISG.yetki.izin`): yöneticide doğrudan uygulanır, yetkilide
`talepler` dizisine `bekliyor` durumuyla eklenir, görüntüleyicide hata verir.
Yönetici işlemleri (`isyeriKaydet`, `isyeriSil`, `kullaniciKaydet`,
`davetKaydet`, `ayarKaydet`, `sifirla`, `iceAktar`) yalnızca yönetici rolüne
açıktır; her yazma `denetim` izine düşer.

## 2. Görev motoru (Genel bakış'ın kalbi)

Tek bir "iş" listesi, beş ayrı kaynaktan türetilir:

1. **Belge yenileme** — yenileme tarihi girilmiş kontrol maddeleri.
2. **Eğitim** — temel İSG eğitimi süresi dolmuş veya kaydı olmayan personel.
3. **Risk değerlendirmesi** — tarih girilmemişse "tarih gir" görevi, en geç
   yenileme tarihi varsa yenileme görevi.
4. **Acil durum planı** — plan tarihi yoksa hazırlama, varsa yenileme görevi
   (tehlike sınıfına göre 4 / 6 yıl).
5. **Çalışma planı + saha** — takip tarihi geçmiş plan faaliyetleri, terminli
   açık tespitler ve kapatılmamış olay bildirimleri.

Her görev şu durumlardan birine düşer: `geciken` (< 0 gün), `bugun` (0),
`yaklasan` (1–30 gün), `ileri` (> 30), `tarihsiz`. Genel bakış'taki dört KPI
ve "Öncelikli işler" sayısı bu dağılımdan hesaplanır.

## 3. İş kuralları

| Kural | Değer |
|---|---|
| Temel İSG eğitimi geçerliliği | Az tehlikeli **3 yıl**, tehlikeli **2 yıl**, çok tehlikeli **1 yıl** |
| Temel eğitim süresi | 8 / 12 / 16 saat (tehlike sınıfına göre) |
| İlk yardım | 3 yıl, 16 saat |
| Yangın / acil durum | 1 yıl |
| Yüksekte çalışma / KKD | 2 yıl |
| Risk değerlendirmesi olağan üst sınır | Az **6**, tehlikeli **4**, çok tehlikeli **2** yıl |
| Acil durum planı yenileme | Az **6**, tehlikeli **4**, çok tehlikeli **4** yıl |
| Belge uyarı eşiği | Yenilemeye ≤ 14 gün: sarı, < 0 gün: kırmızı |
| Risk skoru | Olasılık × şiddet; 15+ kritik, 10–14 yüksek, 5–9 orta, < 5 düşük |
| İlk yardımcı ihtiyacı | Çalışan / 15 (az: 20, çok tehlikeli: 10), en az 1 |
| Kontrol kataloğu | 110 temel madde + çok tehlikelide 15 ek + her 100 çalışan için 5 ek |

## 4. Dosya düzeni

```text
isg-takip-merkezi/
├─ index.html                 # iskelet, SVG ikon sprite, 11 <dialog> formu
├─ 404.html                   # Pages için "sayfa bulunamadı" ekranı
├─ manifest.webmanifest       # PWA kimliği, tema rengi, simgeler
├─ .nojekyll                  # GitHub Pages Jekyll işlemesini kapatır
├─ assets/
│  ├─ css/style.css           # açık tema, bileşenler, duyarlı + yazdırma
│  ├─ img/
│  │  ├─ favicon.svg          # simge kaynağı (vektör)
│  │  ├─ ikon-192.png         # manifest / Android
│  │  ├─ ikon-512.png         # manifest / maskable
│  │  └─ apple-touch-icon.png # iOS ana ekran
│  └─ js/
│     ├─ ornek-veri.js        # 6 işyeri, 37 personel, katalog üretimi, mevzuat
│     ├─ depo.js              # alan kuralları, localStorage, CRUD, görev motoru
│     ├─ bicim.js             # tarih/rozet/CSV/sayfalama yardımcıları
│     ├─ yetki.js             # oturum, roller, işyeri kapsamı, onay kuyruğu
│     ├─ excel.js             # bağımlılıksız XLSX yazıcı/okuyucu (ZIP + OpenXML)
│     ├─ sayfalar.js          # Genel bakış, İşyerleri, Personel
│     ├─ sayfalar-kayit.js    # Dosya kontrolleri, Çalışma planı, Saha/DÖF
│     ├─ sayfalar-rapor.js    # Rapor, İstatistik, Risk, Acil durum, Ekip, Mevzuat, Onaylar
│     ├─ giris.js             # giriş katmanı, davet kabulü, e-posta kodlu şifre sıfırlama
│     └─ uygulama.js          # yönlendirme, formlar, filtreler, XLSX/CSV, yedekleme
├─ tools/
│  ├─ kontrol.js              # jsdom duman testi (261 kontrol)
│  ├─ belge-test.js           # belge eki (yükle/indir/sil, 1 MB sınırı) testi (25 kontrol)
│  ├─ ikon.js                 # favicon.svg → PNG simgeler
│  └─ yayin-hazirla.js        # yayin/ klasörünü üretir
├─ package.json               # npm test / test:belge / ikon / yayin
└─ README.md
```

Kod bilinçli olarak ES5 tarzı (IIFE + `var`) yazıldı: derleme adımı olmadan,
doğrudan `file://` veya herhangi bir statik sunucuda çalışır.

## 5. Veri modeli (localStorage: `isgtakip.v3`)

```js
{
  surum: 3,
  ayarlar: { kurum, kullanici, gorev, sonMevzuatKontrolu },
  kullanicilar: [{ id, adSoyad, eposta, sifre, rol, gorev, isyerleri: [], aktif, sonGiris }],
  isyerleri: [{ id, ad, tehlikeSinifi, calisanSayisi, sgkSicil, yetkili, adres, sektor, ana }],
  personel:  [{ id, isyeriId, sicil, adSoyad, tc, meslek, departman, grupKodu, sube, iseBaslama, telefon, cinsiyet, durum }],
  egitimler: [{ id, personelId, isyeriId, tur, tarih, sureSaat, egitmen, gecerlilik }],
  dosyalar:  [{ id, isyeriId, no, bolum, madde, durum, sorumlu, yenileme, kontrolTarihi, aciklama }],
  belgeler:  [{ id, kaynak, kaynakId, dosyaId?, isyeriId, ad, boyut, tur, tarih, icerik }],
  planlar:   [{ id, isyeriId, sira, ay, gun, faaliyet, sorumlu, takipTarihi, durum, aciklama }],
  tespitler: [{ id, isyeriId, tespit, konum, sorumlu, oncelik, tur, termin, durum, dogrulama, not }],
  riskler:   [{ id, isyeriId, tehlike, alan, olasilik, siddet, onlem, sorumlu, termin, durum }],
  olaylar:   [{ id, isyeriId, tur, tarih, yer, personelId, aciklama, kokNeden, durum }],
  riskEkipleri: [{ isyeriId, sonDegerlendirme, enGecYenileme, uyeler: { isveren, uzman, hekim, temsilci, destek, birim }, uyeIdleri }],
  acilPlanlar:  [{ isyeriId, hazirlanma, sonYenileme, tatbikat, ekip: [{ rol, ad, personelId }] }],
  davetler:     [{ id, eposta, rol, isyerleri: [], tarih, durum }],
  talepler:     [{ id, tur, eylem: { ad, args }, isyeriId, kullaniciId, kullaniciAd, ozet, durum, tarih, karar, kararVeren, kararTarihi }],
  denetim:      [{ id, tur, islem, kullaniciId, kullaniciAd, isyeriId, ozet, tarih }],
  mevzuat:      [{ id, baslik, kategori, dayanak, durum, ozet }]
}
```

Oturum bilgisi ayrı bir anahtarda (`isgtakip.oturum`) yalnızca
`{ kullaniciId, giris }` olarak tutulur; şifre orada saklanmaz. Eski
`isgtakip.v2` verisi ilk açılışta okunup `v3` yapısına taşınır, kullanıcı
listesi boşsa başlangıç hesapları eklenir.

Tüm kayıtlar işyeri kimliğiyle (`isyeriId`) ilişkilidir; işyeri silindiğinde
bağlı kayıtlar ve belge ekleri de silinir. Yedek dosyası bu yapının tamamını
taşır.

Belge ekleri base64 data URL olarak `belgeler[].icerik` alanında saklanır;
`kaynak` alanı `dosya`, `risk` veya `acil` olur, `kaynakId` ilgili kaydın
kimliğini (dosya maddesi ya da işyeri) taşır. Eski kayıtlar yalnızca `dosyaId`
alanıyla gelir ve `dosya` kaynağı sayılır. `ad`, `boyut`, `tur`, `tarih` üst
verileri listede gösterilir. Bir belge eklendiğinde dosya **hemen** kaydedilir;
yeni maddede önce seçilen belgeler ise madde kaydedilene kadar bellekte tutulur
ve kayıtla birlikte yazılır. Görüntüleme, data URL'nin blob adresine çevrilip
yeni sekmede açılmasıyla yapılır; sekme açılamazsa dosya indirilir. Belge silme
ve boyut denetimi `ISG.depo.ekSil` / `ISG.BELGE_SINIRI` üzerinden yürür; kota
dolarsa kayıt geri alınır ve kullanıcı uyarılır.

## 6. Hızlı başlangıç

```powershell
# Doğrudan aç
start index.html

# veya yerel sunucu (localStorage ve dosya indirmeleri için önerilir)
npx --yes serve .            # http://localhost:3000
```

Test:

```powershell
npm install
npm test                     # 261 kontrol + belge testi, başarısızda çıkış kodu 1
npm run test:belge           # yalnızca belge eki testi (25 kontrol)
```

Test; yükleme, tohum veri, **giriş/oturum**, **rol ve işyeri kapsamı**,
**onay kuyruğu ve denetim izi**, iş kuralları, kapsam filtresi, personel CRUD,
eğitim geçerliliği, dosya filtreleri ve sayfalama, DÖF oluşturma, plan
tamamlama, saha, risk/acil kayıtları ve belge ekleri, istatistikler, rapor,
davet, mevzuat, şifre sıfırlama kodu, yapısal
kontroller (tekrarlanan id, SVG referansı, göreli yollar), JSON yedekleme,
veri sıfırlama ve yayın paketini (manifest, simgeler, 404, `.nojekyll`,
CDN'sizlik) kapsar. `belge-test.js` ayrıca belge yükleme/indirme/silme,
liste satırındaki belge sayısı, bekleyen belgenin kayıtla birlikte yazılması,
1 MB sınırı ve `dosyaSil` ile belge temizliğini doğrular; yetki katmanı
bölümünde yönetici oturumu açıldığını ve giriş katmanının göründüğünü denetler.

Simgeleri yeniden üretmek (favicon.svg değiştiğinde):

```powershell
npm run ikon                 # assets/img/*.png
```

## 6.1. Yayın paketini hazırlama

```powershell
npm test                     # yeşil olmalı
npm run yayin                # yayin/ klasörünü üretir
```

`yayin/` içinde yalnızca yayına giden dosyalar bulunur:

```text
yayin/
├─ index.html
├─ 404.html
├─ manifest.webmanifest
├─ .nojekyll
├─ README.md
└─ assets/   (css, js, img)
```

`tools/`, `package.json`, `package-lock.json`, `node_modules/`, `yayin/`
sürüm denetimine alınmaz (`.gitignore`). Bu klasörü olduğu gibi herhangi bir
statik sunucuya (GitHub Pages, Netlify, kurum içi IIS/nginx) yükleyebilirsiniz.

## 7. Yayınlama (GitHub Pages)

Uygulama tamamen statiktir: sunucu tarafı, derleme adımı, veritabanı veya API
anahtarı yoktur. Üç dosya grubu yeterlidir — `index.html`, `assets/` ve
`manifest.webmanifest` (404 ve `.nojekyll` isteğe bağlı ama önerilir).

### 7.1. Yol A — Git ile (önerilen)

Git kurulu değilse bir kez kurun:

```powershell
winget install --id Git.Git -e --source winget
# yeni bir PowerShell penceresi açın, sonra:
git --version
```

Kimlik ayarı (ilk kez):

```powershell
git config --global user.name "Ad Soyad"
git config --global user.email "eposta@ornek.com"
```

GitHub'da boş bir depo açın: **github.com → New repository →**
ad: `isg-takip-merkezi`, **Public**, "Add a README" işaretini **boş bırakın**.

Proje klasöründe:

```powershell
cd C:\Users\MEHMET\.cline\data\workspaces\chat\isg-siteleri\isg-takip-merkezi
git init
git add .
git commit -m "İSG Takip Merkezi v2"
git branch -M main
git remote add origin https://github.com/<kullanici>/isg-takip-merkezi.git
git push -u origin main
```

`.gitignore` sayesinde `node_modules/`, `tools/` dışındaki geçici dosyalar ve
`yayin/` depoya girmez. Yalnızca ürün dosyalarını göndermek isterseniz:

```powershell
git add index.html 404.html manifest.webmanifest .nojekyll README.md assets
```

### 7.2. Yol B — Git kurmadan tarayıcıdan

1. `npm run yayin` çalıştırın → `yayin/` klasörü oluşur.
2. GitHub'da **New repository** → `isg-takip-merkezi` → Public → Create.
3. Depo sayfasında **Add file → Upload files**.
4. `yayin/` klasörünün **içindeki** her şeyi (`index.html`, `404.html`,
   `assets/`, `manifest.webmanifest`, `.nojekyll`, `README.md`)
   sürükleyip bırakın → **Commit changes**.
5. `.nojekyll` gibi nokta ile başlayan dosya Windows Gezgini'nde görünmez;
   görünür yapmak için **View → Show → Hidden items** işaretleyin
   (veya `GitHub → Add file → Create new file` ile adını `.nojekyll` yazıp
   boş commit edin — içerik gerekmez).

### 7.3. Pages'i açma

Depo → **Settings → Pages**:

- **Source:** Deploy from a branch
- **Branch:** `main` / **(root)**
- **Save** → 1–2 dakika bekleyin.

Yayın adresi: `https://<kullanici>.github.io/isg-takip-merkezi/`

Kontrol listesi (yayından sonra):

| Kontrol | Beklenen |
|---|---|
| Adres açılıyor | Genel bakış ekranı, sol menüde 11 sayfa |
| Simge | Sekmede petrol yeşili kalkan ikonu |
| Stil | Renkli KPI kartları (stilsiz metin görünmemeli) |
| Konsol | Kırmızı hata / 404 yok (F12 → Console, Network) |
| Veri | Personel ekleyip sayfayı yenileyin: kayıt kalıcı (`localStorage`) |
| 404 | Var olmayan bir adres (`.../isg-takip-merkezi/yok`) 404 sayfasını gösterir |

Notlar:

- `localStorage` alan adına bağlıdır: her yayın adresi kendi verisini tutar.
  Adresi değiştirirseniz eski veriler görünmez.
- Alt dizinde (`/isg-takip-merkezi/`) çalışsın diye tüm yollar **göreli**
  tutuldu; test bunu doğrular ("Varlık yolları göreli").
- Özel alan adı: **Settings → Pages → Custom domain**; DNS'te `CNAME` kaydı
  gerekir. HTTPS kutusunu işaretleyin.
- Yayını kaldırmak: **Settings → Pages → Unpublish** veya depoyu private yapın
  (ücretsiz planlarda Pages kapanır).

## 8. Bilinen sınırlar

- Örnek veriler **gerçek kurum verisi değildir**; sayılar ve tarihler örnek
  amaçlı üretilir. Sağlık verisi, TC kimlik no ve kişisel dosya içeriği bu
  ortamda saklanmamalıdır.
- Veriler yalnızca tarayıcının `localStorage` alanında tutulur; gizli sekmede
  veya depolama temizlendiğinde kaybolur. Çok kullanıcılı, çok cihazlı bir
  kurulum için gerçek bir arka uç (Supabase/Firebase) gerekir.
- Belge ekleri de `localStorage` içinde base64 olarak tutulur: tarayıcı kotası
  genelde 5 MB olduğu için belge başına sınır **1 MB**, toplamda birkaç belge
  pratik sınırdır. Daha büyük arşivler için dosya sunucusu / bulut depolama
  gerekir; kota dolarsa yükleme reddedilir ve veri bozulmaz.
- Ekip ve davetler ekranı davet **kaydı** oluşturur; otomatik e-posta
  gönderimi yoktur. Davet kabulü kod ile istemci tarafında çalışır: giriş ve
  roller tarayıcı içinde doğrulanır, şifreler `localStorage` içinde düz metin
  tutulur. Gerçek kimlik doğrulama (OTP, SSO, parola özeti, sunucu tarafı
  oturum) için bir arka uç gerekir; bu yüzden yetki katmanı **arayüz ve iş
  kuralı** düzeyinde koruma sağlar, güvenlik sınırı değildir.
- Şifre sıfırlama kodu istemci tarafında üretilir ve `localStorage` içinde
  tutulur; kodun e-postaya gitmesi için EmailJS gibi bir tarayıcı servisi
  gerekir. Servis tanımlı değilse kod ekranda gösterilir ve bu durum açıkça
  uyarılır. Sunucu tarafı doğrulama olmadığı için bu akış güvenlik sınırı
  değildir.
- Personel listesi gerçek `.xlsx` (Office Open XML) olarak indirilip yüklenir;
  diğer ekranların "Excel indir" düğmeleri hâlâ `.csv` (UTF-8 BOM, noktalı
  virgül) üretir. Şablon tarih hücrelerini `YYYY-AA-GG` metnine çevirir; birleşik
  hücre, grafik ve formül içeren karmaşık dosyalar desteklenmez.
- Mevzuat başlıkları özet niteliğindedir; güncel birleştirilmiş metinler ve
  değişiklik takibi otomatik değildir.
- Kontrol kataloğu şablon tabanlıdır; işyerine özel madde eklenebilir ve
  düzenlenebilir, ancak resmî bir kontrol listesi değildir.
- Yazdırma görünümü temel düzeydedir; imzalı tutanak/PDF üretimi yoktur.

## 9. Yol haritası

1. Sağlık gözetimi (periyodik muayene, odyometri, SFT, aşı) ve KKD zimmeti.
2. Saha denetimleri için fotoğraf/kanıt eki ve DÖF onay akışı.
3. Şablon sütun eşleme sihirbazı; diğer listeler (risk, saha, plan) için XLSX çıktısı.
4. PDF tutanak ve imza (İSG kurul kararı, tatbikat raporu).
5. Kurul, tatbikat ve yıllık değerlendirme modülleri; hatırlatma e-postaları.
6. Supabase/Firebase ile çok kullanıcılı yapı ve sunucu tarafı kimlik doğrulama
   (rol bazlı yetki ve denetim izi demo düzeyinde hazır).
7. Mevzuat değişiklik takibi ve işyeri kapsam kararının gerekçelendirilmesi.
8. İstatistik panosu, çevrimdışı PWA güncelleme bildirimi ve yönetim paneli.

## 10. Bu sürümde neler değişti?

### 2.2.0 — istatistikler, belge önizleme, şifre sıfırlama

- **İstatistikler** ekranı (`#istatistik`) eklendi: dört özet KPI ve beş çubuk
  grafik (işyeri bazında personel, eğitim geçerliliği, saha tespitleri, risk
  seviyeleri, belge kontrol durumu). Ortak kapsam filtresi burada da geçerli.
- **Risk değerlendirmesi ve acil durum planı** diyaloglarına belge yükleme
  eklendi. Dosya maddelerinin yanı sıra risk/acil ekleri de
  **görüntülenebilir** (blob adresiyle yeni sekme), indirilebilir ve silinebilir.
  `belgeler` kayıtları `kaynak` + `kaynakId` ile ayrıştırıldı; eski kayıtlar
  `dosyaId` alanıyla uyumlu kalır (`ISG.depo.ekler`, `ekKaydet`, `ekSil`).
- **Şifremi unuttum** akışı: 6 haneli kod, 10 dakika geçerlilik, 5 hatalı
  deneme sınırı ve `ISG.depo.sifreGuncelle` ile şifre yenileme. Kod EmailJS
  üzerinden e-postaya gönderilir; servis tanımlı değilse kod ekranda gösterilir
  ve uyarı verilir.
- Giriş ekranındaki **demo hesap düğmeleri**, alt bilgideki demo notu ve
  **demo verilerini sıfırla** düğmesi kaldırıldı; hesap listesi yerine
  "Şifremi unuttum" sekmesi geldi. `robots.txt` kaldırıldı ve yayın listesinden
  çıkarıldı.
- Yönetici hesabı `mehmet.kurt@ornek.com` → **`mehmetkurt0948@gmail.com`**.
- JS/CSS varlık sürümü `?v=3` → `?v=4`; test kapsamı **226 → 261 kontrol**.

### 2.1.0 — giriş, roller, onay kuyruğu

- **Giriş ekranı** eklendi (`assets/js/giris.js`): oturum yoksa uygulama
  katmanı kapanır, demo hesap düğmeleri formu doldurur, hatalı şifre/kullanıcı
  satır içi uyarıyla bildirilir, çıkış onay ister.
- **Yetki katmanı** eklendi (`assets/js/yetki.js`): üç rol (yönetici, yetkili,
  görüntüleyici), işyeri kapsamı, `salt-okunur` gövde sınıfı ve `ISG.yetki.izin`
  denetimi. Menüde yalnızca yetkili olunan ekranlar görünür.
- **Onay kuyruğu** eklendi: yetkilinin yazma çağrıları `talepler` dizisine
  düşer, yönetici onaylayınca işlem gerçekten uygulanır; reddedilen talep
  veriyi değiştirmez. Menüde bekleyen talep rozeti gösterilir.
- **Denetim izi** (`denetim`) giriş/çıkış, yazma, onay ve ret olaylarını
  kullanıcı + zaman + özetle kaydeder (son 400 kayıt).
- Veri anahtarı `isgtakip.v2` → **`isgtakip.v3`**; oturum `isgtakip.oturum`.
  Eski veri otomatik taşınır, `kullanicilar` boşsa üç demo hesap eklenir
  (şifre `1234`).
- 12. ekran **Onay kuyruğu** (`#sayfa-onaylar`) ve menü sayacı eklendi.
- Test kapsamı **183 → 226 kontrol** (giriş/oturum, roller ve kapsam, onay
  akışı, denetim izi) + belge testi **23 → 25 kontrol** (yetki katmanı).
- Depo yardımcıları genişletildi: `ISG.depo.anahtar` (depolama anahtarı),
  `kullaniciBul`, `kullaniciEpostaBul`, `kullaniciKaydet`,
  `kullaniciGirisIsaretle`, `talepEkle`, `talepBul`, `denetimEkle`.

### 2.0.0 — işyeri bazlı yeniden yazım

- Tek kurum/tek sayfa yapısından **6 işyerli, kapsam filtreli** yapıya geçildi.
- 5 sayfa → **11 ekran**; Genel bakış artık gerçek bir görev motoruyla besleniyor.
- Her işyeri için **kontrol kataloğu** üretildi (bölüm, madde, durum, tarih).
- Personel listesi ürün görsellerindeki kolonlarla yeniden kuruldu; CSV
  şablonu, içe aktarma, detay satırı ve "listeyi temizle" eklendi.
- Koyu altın tema yerine ürün görsellerine uygun **açık gri + petrol yeşili**
  tema; mobil menü, daraltılabilir kenar ve yazdırma kuralları yenilendi.
- Test kapsamı 41 → **159 kontrol**'e çıkarıldı.

### 2.0.1 — yayın hazırlığı

- Uygulama simgesi (`favicon.svg` + 192/512/apple-touch PNG) ve
  `manifest.webmanifest` eklendi; telefonda "ana ekrana ekle" ile tam ekran
  açılır.
- `404.html`, `robots.txt` ve `.nojekyll` ile GitHub Pages yayını
  sağlamlaştırıldı.
- `npm run ikon` (SVG → PNG) ve `npm run yayin` (`yayin/` paketi) eklendi.
- Testlere **19) Yayın paketi** bölümü eklendi: manifest geçerliliği, simge
  boyutları, 404/robots/.nojekyll varlığı, kök mutlak yol ve dış CDN
  bağımlılığı denetimi.

### 2.0.2 — rastgele demo personeli

- Her işyerine rastgele ad, cinsiyet, meslek, departman ve işe başlama
  tarihiyle **3–5 ek personel** üretildi (toplam **37 personel**). Rastgelelik
  tohumu sabit olduğundan demo her açılışta aynı listeyi gösterir.
- Ek personelin tamamına tehlike sınıfına uygun geçerlilikte **temel İSG
  eğitimi**, her işyerinin ilk kişisine güncel **ilk yardım sertifikası**
  tanımlandı; böylece çalışma planındaki ilk yardımcı kartları boş kalmıyor.
- Personel blokları artık her işyerinde dolu; testler 37 personel satırını,
  işyeri başına en az bir güncel ilk yardımcıyı ve kartlardaki
  ihtiyaç/mevcut sayılarının veriyle uyumunu doğruluyor (**159 kontrol**).

### 2.0.3 — gerçek Excel ve ekip üyesi ekleme

- **Gerçek `.xlsx` altyapısı** eklendi (`assets/js/excel.js`): sıfır bağımlılıkla
  ZIP + OpenXML üretir; birden fazla sayfa, donmuş başlık, sütun genişliği,
  otomatik filtre ve UTF-8 (Türkçe karakter) desteği vardır. Excel'in
  sıkıştırdığı dosyalar `DecompressionStream` ile okunur; tarayıcı desteklemezse
  kullanıcıya CSV yönlendirmesi gösterilir.
- Personel ekranında **"Excel şablonu indir (XLSX)"** (Personel + Kılavuz
  sayfaları) ve **"Güncel listeyi XLSX indir"** düğmeleri; `.xlsx` ve `.csv`
  dosyalarını aynı **"Excel/CSV içe aktar"** girişinden yükleme. `GG.AA.YYYY`,
  `YYYY-AA-GG` ve Excel seri tarih hücreleri normalize edilir; Kıdem Tarihi de
  artık içe aktarılır. Başlık satırı ilk 10 satır içinde otomatik bulunur, üstte
  başlık/logo satırı olan dosyalar da okunur.
- Risk değerlendirmesi ve acil durum planı kartlarına **rol bazlı ekip üyesi
  ekleme** eklendi: her rol satırında `Ekle / Değiştir` ve dolu rollerde
  `Kaldır`; ayrıca kart altında "Ekip üyesi ekle" düğmesi. Yeni diyalog,
  işyerinin personel listesinden seçim yapıp adı otomatik doldurur, elle yazmaya
  da izin verir. Acil durum ekiplerine **Destek elemanı** rolü eklendi (5 rol).
- Risk ekibi üyeleri artık `personelId` ile de izlenebiliyor; acil ekip
  kayıtları `{ rol, ad, personelId }` biçiminde saklanıyor. Kaldırma işlemleri
  onay diyaloğundan geçiyor.
- Testlere **12b) Ekip üyesi ekleme** ve **12c) Excel (.xlsx) altyapısı**
  bölümleri eklendi: XLSX ZIP imzası, iş kitabı/sayfa varlığı, yaz→oku turu,
  tarih normalizasyonu, içe aktarma ve ekip ekleme/kaldırma akışları
  doğrulanıyor (**183 kontrol**).

### 2.0.4 — kontrol maddesine belge eki

- Dosya kontrolü diyaloğuna **Belgeler** bölümü eklendi: "Belge yükle" ile
  PDF, Word, Excel, CSV, TXT ve görsel eklenebilir; liste dosya adı, boyut ve
  tarihle gösterilir, tek tıkla **indirilir** veya onay alınarak **kaldırılır**.
- Belge içeriği base64 data URL olarak `isgtakip.v2` → `belgeler` dizisinde
  saklanır (belge başına **≤ 1 MB**); kota dolarsa kayıt geri alınır ve
  "depolama alanı dolu" uyarısı verilir. `dosyaSil` ve işyeri silme belge
  eklerini de temizler; JSON yedek dosyası belgeleri taşır.
- Yeni maddede önce belge seçilirse “kayıtla birlikte yüklenecek” notuyla
  bekletilir, madde kaydedildiğinde kalıcı yazılır. Liste satırında maddenin
  belge sayısı (`· N belge`) görünür.
- `tools/belge-test.js` (23 kontrol) eklendi; `npm test` artık iki testi de
  çalıştırır.


