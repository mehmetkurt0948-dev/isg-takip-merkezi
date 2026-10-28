# İSG Takip Merkezi — çalışma alanı (v2)

> İşyeri bazlı İSG takibi: personel, dosya kontrolleri, çalışma planı, saha/DÖF,
> risk değerlendirmesi, acil durum planı, ekip davetleri ve mevzuat kapsamı.
> **Statik** uygulama: build yok, CDN yok, veritabanı yok — tarayıcıda çalışır.

Bu sürüm, ChatGPT Sites'te yayınlanan ve 401 ile erişime kapanan "İSG Takip
Merkezi" fikrinin sıfırdan yazılmış, işyeri bazlı çoklu kapsam destekleyen
halidir. Ekran dili, sağlanan ürün görsellerindeki yapıya göre kurulmuştur:
koyu lacivert kenar, açık gri çalışma zemini, petrol yeşili vurgular ve yoğun
kayıt tabloları.

## 1. Ekranlar

| Ekran | Ne yapar? |
|---|---|
| **Genel bakış** | Tüm işyerlerinden türetilen görev motoru: geciken / bugün / yaklaşan / tarihsiz işler, öncelik sıralı liste, işyeri bazında durum tablosu |
| **İşyerleri** | Kurum şeridi (ana kurum, ad değiştir, kurum sil), işyeri kartları (tehlike sınıfı, çalışan ve kontrol maddesi sayısı), işyeri CRUD |
| **Personel listesi** | İşyeri bazında bloklar, sicil/TC/meslek/departman/şube/kıdem/telefon/cinsiyet kolonları, arama, detay açma, eğitim kayıtları, CSV şablonu ve içe aktarma, "listeyi temizle" |
| **Dosya kontrolleri** | İşyerine göre üretilen kontrol kataloğu (bölüm + madde), Var/Eksik/Yok/İncelenmedi durumları, yenileme tarihleri, 14 günlük uyarı lejantı, bölüm/durum/tarih filtreleri, sayfalama, DÖF oluşturma |
| **Çalışma planı** | İlk yardımcı ihtiyaç/mevcut karşılaştırması, yıllık plan kartları, plan kalemi CRUD, tamamlandı işaretleme, plan KPI'ları |
| **Saha ve DÖF** | Açık/geciken/doğrulama/kapatılan tespitler, öncelik-tür filtreleri, kapatma akışı, ramak kala ve olay bildirimleri |
| **Yönetim raporu** | Tarih aralığı, açık/geciken iş, doğrulama bekleyen, dönemde tamamlanan, işyeri bazında karşılaştırma tablosu, Excel (CSV) çıktısı |
| **Risk değerlendirmesi** | İşyeri başına son değerlendirme / en geç yenileme / olağan üst sınır, 6 rollü ekip listesi ve eksik rol uyarısı, 5×5 risk kayıt tablosu |
| **Acil durum planı** | Çalışan sayısı, plan tarihi, yenileme sınırı (tehlike sınıfına göre), 4 rollü destek ekibi, plan/ekip kaydı |
| **Ekip ve davetler** | E-posta + rol + yetkili işyeri seçimiyle davet oluşturma, davet listesi ve iptal |
| **Mevzuat ve kapsam** | 20 başlıklı katalog (kanun/yönetmelik/tebliğ/rehber/standart), kategori ve konu araması, teyit durumu, seçili işyeri kapsam özeti, Mevzuat Bilgi Sistemi bağlantısı |

Ek yetenekler: `localStorage` kalıcılığı, JSON yedek al / geri yükle, demo
sıfırlama, işyeri kapsam filtresi (tüm ekranlarda), menüyü gizleme, mobil
menü, yazdırma dostu görünüm, klavye erişilebilir `<dialog>` formları,
CSV içe aktarma ve dışa aktarma.

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
├─ index.html                 # iskelet, SVG ikon sprite, 10 <dialog> formu
├─ 404.html                   # Pages için "sayfa bulunamadı" ekranı
├─ manifest.webmanifest       # PWA kimliği, tema rengi, simgeler
├─ robots.txt                 # arama motoru kuralları
├─ .nojekyll                  # GitHub Pages Jekyll işlemesini kapatır
├─ assets/
│  ├─ css/style.css           # açık tema, bileşenler, duyarlı + yazdırma
│  ├─ img/
│  │  ├─ favicon.svg          # simge kaynağı (vektör)
│  │  ├─ ikon-192.png         # manifest / Android
│  │  ├─ ikon-512.png         # manifest / maskable
│  │  └─ apple-touch-icon.png # iOS ana ekran
│  └─ js/
│     ├─ ornek-veri.js        # 6 işyeri, personel, katalog üretimi, mevzuat
│     ├─ depo.js              # alan kuralları, localStorage, CRUD, görev motoru
│     ├─ bicim.js             # tarih/rozet/CSV/sayfalama yardımcıları
│     ├─ sayfalar.js          # Genel bakış, İşyerleri, Personel
│     ├─ sayfalar-kayit.js    # Dosya kontrolleri, Çalışma planı, Saha/DÖF
│     ├─ sayfalar-rapor.js    # Rapor, Risk, Acil durum, Ekip, Mevzuat
│     └─ uygulama.js          # yönlendirme, formlar, filtreler, CSV, yedekleme
├─ tools/
│  ├─ kontrol.js              # jsdom duman testi (147 kontrol)
│  ├─ ikon.js                 # favicon.svg → PNG simgeler
│  └─ yayin-hazirla.js        # yayin/ klasörünü üretir
├─ package.json               # npm test / ikon / yayin
└─ README.md
```

Kod bilinçli olarak ES5 tarzı (IIFE + `var`) yazıldı: derleme adımı olmadan,
doğrudan `file://` veya herhangi bir statik sunucuda çalışır.

## 5. Veri modeli (localStorage: `isgtakip.v2`)

```js
{
  surum: 2,
  ayarlar: { kurum, kullanici, gorev, sonMevzuatKontrolu },
  isyerleri: [{ id, ad, tehlikeSinifi, calisanSayisi, sgkSicil, yetkili, adres, sektor, ana }],
  personel:  [{ id, isyeriId, sicil, adSoyad, tc, meslek, departman, grupKodu, sube, iseBaslama, telefon, cinsiyet, durum }],
  egitimler: [{ id, personelId, isyeriId, tur, tarih, sureSaat, egitmen, gecerlilik }],
  dosyalar:  [{ id, isyeriId, no, bolum, madde, durum, sorumlu, yenileme, kontrolTarihi, aciklama }],
  planlar:   [{ id, isyeriId, sira, ay, gun, faaliyet, sorumlu, takipTarihi, durum, aciklama }],
  tespitler: [{ id, isyeriId, tespit, konum, sorumlu, oncelik, tur, termin, durum, dogrulama, not }],
  riskler:   [{ id, isyeriId, tehlike, alan, olasilik, siddet, onlem, sorumlu, termin, durum }],
  olaylar:   [{ id, isyeriId, tur, tarih, yer, personelId, aciklama, kokNeden, durum }],
  riskEkipleri: [{ isyeriId, sonDegerlendirme, enGecYenileme, uyeler: { isveren, uzman, hekim, temsilci, destek, birim } }],
  acilPlanlar:  [{ isyeriId, hazirlanma, sonYenileme, tatbikat, ekip: [{ rol, ad }] }],
  davetler:     [{ id, eposta, rol, isyerleri: [], tarih, durum }],
  mevzuat:      [{ id, baslik, kategori, dayanak, durum, ozet }]
}
```

Tüm kayıtlar işyeri kimliğiyle (`isyeriId`) ilişkilidir; işyeri silindiğinde
bağlı kayıtlar da silinir. Yedek dosyası bu yapının tamamını taşır.

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
npm test                     # 147 kontrol, başarısızda çıkış kodu 1
```

Test; yükleme, tohum veri, iş kuralları, kapsam filtresi, personel CRUD,
eğitim geçerliliği, dosya filtreleri ve sayfalama, DÖF oluşturma, plan
tamamlama, saha, risk/acil kayıtları, rapor, davet, mevzuat, yapısal
kontroller (tekrarlanan id, SVG referansı, göreli yollar), JSON yedekleme,
demo sıfırlama ve yayın paketini (manifest, simgeler, 404, `.nojekyll`,
CDN'sizlik) kapsar.

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
├─ robots.txt
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
`manifest.webmanifest` (404/robots/.nojekyll isteğe bağlı ama önerilir).

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
git add index.html 404.html manifest.webmanifest robots.txt .nojekyll README.md assets
```

### 7.2. Yol B — Git kurmadan tarayıcıdan

1. `npm run yayin` çalıştırın → `yayin/` klasörü oluşur.
2. GitHub'da **New repository** → `isg-takip-merkezi` → Public → Create.
3. Depo sayfasında **Add file → Upload files**.
4. `yayin/` klasörünün **içindeki** her şeyi (`index.html`, `404.html`,
   `assets/`, `manifest.webmanifest`, `robots.txt`, `.nojekyll`, `README.md`)
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

- Demo verisi **gerçek kurum verisi değildir**; sayılar ve tarihler örnek amaçlı
  üretilir. Sağlık verisi, TC kimlik no ve kişisel dosya içeriği bu ortamda
  saklanmamalıdır.
- Veriler yalnızca tarayıcının `localStorage` alanında tutulur; gizli sekmede
  veya depolama temizlendiğinde kaybolur. Çok kullanıcılı, çok cihazlı bir
  kurulum için gerçek bir arka uç (Supabase/Firebase) gerekir.
- Ekip ve davetler ekranı davet **kaydı** oluşturur; otomatik e-posta
  gönderimi, kimlik doğrulama ve yetki denetimi yoktur.
- Excel çıktıları `.csv` (UTF-8 BOM, noktalı virgül) biçimindedir; Excel'de
  doğrudan açılır. Gerçek `.xlsx` üretimi yoktur.
- Mevzuat başlıkları özet niteliğindedir; güncel birleştirilmiş metinler ve
  değişiklik takibi otomatik değildir.
- Kontrol kataloğu şablon tabanlıdır; işyerine özel madde eklenebilir ve
  düzenlenebilir, ancak resmî bir kontrol listesi değildir.
- Yazdırma görünümü temel düzeydedir; imzalı tutanak/PDF üretimi yoktur.

## 9. Yol haritası

1. Sağlık gözetimi (periyodik muayene, odyometri, SFT, aşı) ve KKD zimmeti.
2. Saha denetimleri için fotoğraf/kanıt eki ve DÖF onay akışı.
3. Gerçek `.xlsx` içe/dışa aktarma ve sütun eşleme sihirbazı.
4. PDF tutanak ve imza (İSG kurul kararı, tatbikat raporu).
5. Kurul, tatbikat ve yıllık değerlendirme modülleri; hatırlatma e-postaları.
6. Supabase/Firebase ile çok kullanıcılı yapı, rol bazlı yetki, denetim izi.
7. Mevzuat değişiklik takibi ve işyeri kapsam kararının gerekçelendirilmesi.

## 10. Bu sürümde neler değişti?

- Tek kurum/tek sayfa yapısından **6 işyerli, kapsam filtreli** yapıya geçildi.
- 5 sayfa → **11 ekran**; Genel bakış artık gerçek bir görev motoruyla besleniyor.
- Her işyeri için **kontrol kataloğu** üretildi (bölüm, madde, durum, tarih).
- Personel listesi ürün görsellerindeki kolonlarla yeniden kuruldu; CSV
  şablonu, içe aktarma, detay satırı ve "listeyi temizle" eklendi.
- Koyu altın tema yerine ürün görsellerine uygun **açık gri + petrol yeşili**
  tema; mobil menü, daraltılabilir kenar ve yazdırma kuralları yenilendi.
- Test kapsamı 41 → **147 kontrol**'e çıkarıldı.

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


