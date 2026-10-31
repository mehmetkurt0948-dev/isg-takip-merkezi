# İSG Takip Merkezi — çalışma alanı (v4)

> İşyeri bazlı İSG takibi: giriş/roller, personel, dosya kontrolleri, çalışma
> planı, saha/DÖF, risk değerlendirmesi, acil durum planı, ekip davetleri,
> onay kuyruğu ve mevzuat kapsamı.
> **Statik** uygulama: build yok, CDN yok — tarayıcıda çalışır. Kayıtlar önce
> `localStorage`'a yazılır; **isteğe bağlı Supabase eşitlemesi** açılırsa aynı
> kayıtlar birden çok cihazda **kayıt bazında birleştirilerek** paylaşılır
> (bkz. [1.3](#13-cihazlar-arası-ortak-kayıt-supabase)).

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
| **İşyerleri** | Kurum şeridi (ana kurum, ad değiştir, tüm verileri sil), işyeri kartları (tehlike sınıfı, çalışan ve kontrol maddesi sayısı), işyeri CRUD |
| **Personel listesi** | İşyeri bazında bloklar, sicil/TC/meslek/departman/şube/kıdem/telefon/cinsiyet kolonları, arama, detay açma, eğitim kayıtları, gerçek **XLSX şablonu** ve XLSX/CSV içe-dışa aktarma, "listeyi temizle" |
| **Dosya kontrolleri** | İşyerine göre üretilen kontrol kataloğu (bölüm + madde), Var/Eksik/Yok/İncelenmedi durumları, yenileme tarihleri, 14 günlük uyarı lejantı, bölüm/durum/tarih filtreleri, sayfalama, DÖF oluşturma, **belge eki yükle / görüntüle / indir / kaldır** (belge başına ≤ 1 MB, `localStorage`) |
| **Çalışma planı** | İlk yardımcı ihtiyaç/mevcut karşılaştırması, yıllık plan kartları, plan kalemi CRUD, tamamlandı işaretleme, plan KPI'ları |
| **Saha ve DÖF** | Açık/geciken/doğrulama/kapatılan tespitler, öncelik-tür filtreleri, kapatma akışı, **iş kazası ve meslek hastalığı kayıt tablosu** (personel + sicil/departman, tanı bölgesi/türü, SGK hastalık grubu, etken, kök neden sınıfı ve açıklaması, kayıp gün, sağlık kuruluşu) ve CSV çıktısı, ramak kala ve diğer olay bildirimleri |
| **Yönetim raporu** | Tarih aralığı, açık/geciken iş, doğrulama bekleyen, dönemde tamamlanan, işyeri bazında karşılaştırma tablosu, Excel (CSV) çıktısı |
| **İstatistikler** | On iki özet KPI, **iş kazası / meslek hastalığı veri girişi ve ortak kayıt listesi** (tarihe göre sıralı; satırdan düzenle / kapat / sil, kapsam işyeriyle "Kaza bildir" ve "Meslek hastalığı bildir") ve iş kazası analizi: **aylık kaza sıklığı (sütun grafik)**, **KSO / KAO / KSH oranları ve 12 aylık oran tablosu**, **kök neden dağılımı**, **neden × vücut bölgesi ısı matrisi**, yaralanma bölgesi/türü, **şiddet sınıfı (SGK)**, **vardiya**, **haftanın günü**, işyeri, departman, kıdem ve iş günü kaybı dağılımları, en çok kazaya uğrayan personel; personel, eğitim, DÖF, risk ve belge dağılımları; kapsam filtresi |
| **Risk değerlendirmesi** | İşyeri başına son değerlendirme / en geç yenileme / olağan üst sınır, 6 rollü ekip listesi, rol bazlı **ekip üyesi ekle / değiştir / kaldır**, eksik rol uyarısı, **risk belgesi yükle / görüntüle / indir**, 5×5 risk kayıt tablosu |
| **Acil durum planı** | Çalışan sayısı, plan tarihi, yenileme sınırı (tehlike sınıfına göre), 5 rollü destek ekibi (destek elemanı dâhil), rol bazlı **ekip üyesi ekle / değiştir / kaldır**, **plan belgesi yükle / görüntüle / indir**, plan/ekip kaydı |
| **Ekip ve davetler** | E-posta + rol + yetkili işyeri seçimiyle davet oluşturma, davet listesi ve iptal |
| **Mevzuat ve kapsam** | 20 başlıklı katalog (kanun/yönetmelik/tebliğ/rehber/standart), kategori ve konu araması, teyit durumu, seçili işyeri kapsam özeti, Mevzuat Bilgi Sistemi bağlantısı |
| **Onay kuyruğu** | Yetkili kullanıcıların yazma işlemlerinden doğan talepler: işlem özeti, işyeri, talep sahibi, onayla / reddet, bekleyen sayısı rozeti, denetim izi |

Ek yetenekler: `localStorage` kalıcılığı, **isteğe bağlı Supabase bulut
eşitlemesi** (cihazlar arası ortak kayıt), JSON yedek al / geri yükle, işyeri
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

Site **boş açılır**; kayıtlı tek hesap yönetici hesabıdır (şifre: `1234`):

| E-posta | Ad | Rol | İşyerleri |
|---|---|---|---|
| `mehmetkurt0948@gmail.com` | Mehmet Kurt | Yönetici | Tümü (içi boşken tümü) |

Örnek veri yüklendiğinde (`Örnek veri` düğmesi — bkz. [1.4](#14-boş-açılış-örnek-veri-ve-temizlik))
ayrıca iki tanıtım hesabı gelir: `buse.senol@ornek.com` (Yetkili · `iy1`, `iy2`) ve
`selin.aydin@ornek.com` (Görüntüleyici · `iy1`).

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

### 1.3. Cihazlar arası ortak kayıt (Supabase)

Yerel kayıt tek başına yeterlidir; iki bilgisayarda **aynı veriyi** görmek için
isteğe bağlı bulut katmanı (`assets/js/bulut.js`) açılır. Üst çubuktaki
**Bulut** düğmesi ayar diyaloğunu açar.

1. [supabase.com](https://supabase.com) üzerinde ücretsiz bir proje açın.
2. Diyalogdaki **SQL betiği** bloğunu kopyalayıp Supabase → *SQL Editor* →
   *New query* alanında çalıştırın. Betik `public.isg_veri` tablosunu, zaman
   damgası tetikleyicisini ve anon rolü için satır politikalarını oluşturur.
3. **Project URL** (`https://xxxx.supabase.co`), **anon public** anahtarı ve
   ortak bir **oda kodu** (örn. `isg-merkez`) yazın.
4. **Bağlan**'ı seçin:
   - *Bu cihazdaki kayıtlar öncelikli olsun* işaretliyse (ilk kurulum) bu
     cihazdaki kayıtlar "şimdi değişti" sayılır; bulut verisiyle birleştirilir
     ve çakışan kayıtta bu cihaz kazanır. Buluta özgü kayıtlar korunur.
   - işaretsizse buluttaki veri önceliklidir (ikinci cihaz). Yine birleştirme
     yapılır; bu cihazda olup bulutta olmayan kayıtlar silinmez.

Eşitleme kuralları:

- Yerel `localStorage` **tek doğru kaynak** olarak kalır; bulut bir üst katmandır.
  Bağlantı yokken uygulama normal çalışır, değişiklikler `kirli` olarak
  işaretlenip bağlantı gelince gönderilir.
- **Birleştirme kayıt bazındadır.** Her kayıt kendi ISO değişiklik damgasını
  (`guncelleme`, yedek olarak `senkron.kayit[kimlik]`) taşır; `kaydet()` yalnızca
  gerçekten değişen kaydı damgalar. Aynı kimlikte **son yazan kazanır**, farklı
  kayıtlar birbirini ezmez. `isyerleri`, `personel` ve tüm listeler (eğitim,
  risk, olay, belge, plan, tespit, ekip, acil plan, davet, mevzuat, kullanıcı,
  talep, denetim) bu şekilde birleştirilir.
- **Silme yayılır.** Silinen kayıt `senkron.silinen` altında mezar taşı olarak
  saklanır; mezar taşı kaydın kendi damgasından yeni ya da eşitse kayıt her iki
  taraftan da düşer. Mezar taşları **120 gün** sonra budanır.
- `ayarlar` tek nesnedir; `senkron.ayarlar` damgası daha yeni olan tarafın
  ayarları geçerlidir.
- **Gönderim döngüsü yoktur:** birleşim buluttaki hâlden farksızsa POST
  yapılmaz. Karşılaştırma JSON anahtar sırasından ve liste sırasından bağımsız
  kanonik özetle yapılır; indirilen veri yeniden yukarı gönderilmez.
- Bağlanırken ve açılışta **önce çekilir, sonra birleştirilir**; kirli yerel veri
  olsa bile buluttaki diğer cihaz kayıtları körlemesine ezilmez.
- Otomatik çekme varsayılan **20 saniyede** birdir (10–300 arası ayarlanır);
  sekme görünür olduğunda ve ağ geri geldiğinde de çekilir. **Şimdi eşitle**
  düğmesi elle çalıştırır.
- Aynı tabloyu paylaşan farklı kurulumlar **oda kodu** ile ayrılır; farklı oda
  kodları birbirinin verisini görmez.
- Anon anahtar tarayıcıda görünür ve bu kurulumda kullanıcı doğrulaması yoktur:
  URL + anahtar + oda kodunu bilen herkes veriyi okuyabilir/yazabilir. Kişisel
  sağlık verisi veya gerçek kurum verisi için Supabase Auth + satır düzeyi
  güvenlik (`auth.uid()` koşullu politika) eklenmelidir.
- **Bağlantıyı kes** yerel veriyi silmez; yalnızca bu cihazın buluta yazmayı
  bırakmasını sağlar.

### 1.4. Boş açılış, örnek veri ve temizlik

Sürüm 2.11.0 ile birlikte **yayınlanan site boş açılır**: işyeri, personel,
eğitim, kontrol maddesi, plan, tespit, kaza ve mevzuat kaydı yoktur. Açılışta
yalnızca yönetici hesabı ve kurum ayarları durur (hesap silinirse giriş
yapılamayacağı için korunur).

| Davranış | Ne olur? |
|---|---|
| Yeni cihaz açılışı | `ISG.BOS_VERI()` — 0 işyeri, 0 kayıt. Ekranlar boş durum mesajı gösterir. |
| Eski sürümden kalan demo veri | İlk açılışta **bir kez** silinir (`isgtakip.temizlik` cihaz damgası). Silinen her kayıt için **mezar taşı** yazıldığından buluttan geri gelmez. |
| Silinen verinin geri alınması | Temizlikten önceki hâl `isgtakip.oncekiVeri` anahtarında saklanır; üst bardaki **Eski veri** düğmesiyle JSON olarak indirilir. |
| Tanıtım/deneme verisi | Üst bardaki **Örnek veri** düğmesi (yalnızca yönetici) `ISG.ORNEK_VERI()` kümesini yükler: 6 işyeri, 37 personel, katalog, plan, tespit, kaza, mevzuat ve iki örnek hesap. |
| Tüm verileri silme | İşyerleri → **Tüm verileri sil** siteyi yeniden boşlatır; hesaplar korunur, silinen kayıtlar buluta da silinir. |

Kod tarafında ayrım nettir: `ISG.BOS_VERI()` tohum verisi, `ISG.ORNEK_VERI()`
ise yalnızca arayüz düğmesinin çağırdığı tanıtım kümesidir. Kontrol kataloğu
(`ISG.katalogMaddeleri` / `ISG.katalogUret`) gerçek bir işyeri eklendiğinde yine
otomatik üretilir — katalog demo veri değildir.

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
| İş kazası bildirimi | SGK'ya en geç **3 iş günü** içinde; iş günü kaybı 0–365 gün |
| İş kazası istatistiği | Kıdem = işe başlama ↔ kaza tarihi (tam yıl); şiddet aralıkları 0 / 1–3 / 4–7 / 8–14 / 15+ gün |
| Risk skoru | Olasılık × şiddet; 15+ kritik, 10–14 yüksek, 5–9 orta, < 5 düşük |
| İlk yardımcı ihtiyacı | Çalışan / 15 (az: 20, çok tehlikeli: 10), en az 1 |
| Kontrol kataloğu | 110 temel madde + çok tehlikelide 15 ek + her 100 çalışan için 5 ek |

## 4. Dosya düzeni

```text
isg-takip-merkezi/
├─ index.html                 # iskelet, SVG ikon sprite, 14 <dialog> formu
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
│     ├─ ornek-veri.js        # boş tohum (BOS_VERI), örnek/tanıtım verisi, katalog üretimi, mevzuat
│     ├─ kontrol-listeleri.js # ÜRETİLMİŞ: işyeri bazlı hazır dosya kontrol listeleri (Word çıktısı)
│     ├─ depo.js              # alan kuralları, localStorage, CRUD, görev motoru
│     ├─ bicim.js             # tarih/rozet/CSV/sayfalama yardımcıları
│     ├─ yetki.js             # oturum, roller, işyeri kapsamı, onay kuyruğu
│     ├─ excel.js             # bağımlılıksız XLSX yazıcı/okuyucu (ZIP + OpenXML)
│     ├─ bulut.js             # isteğe bağlı Supabase eşitleme katmanı (REST)
│     ├─ sayfalar.js          # Genel bakış, İşyerleri, Personel
│     ├─ sayfalar-kayit.js    # Dosya kontrolleri, Çalışma planı, Saha/DÖF
│     ├─ sayfalar-rapor.js    # Rapor, İstatistik, Risk, Acil durum, Ekip, Mevzuat, Onaylar
│     ├─ giris.js             # giriş katmanı, davet kabulü, e-posta kodlu şifre sıfırlama
│     └─ uygulama.js          # yönlendirme, formlar, filtreler, XLSX/CSV, yedekleme
├─ tools/
│  ├─ kontrol.js              # jsdom duman testi (471 kontrol)
│  ├─ belge-test.js           # belge eki (yükle/indir/sil, 1 MB sınırı) testi (27 kontrol)
│  ├─ kontrol-listesi.js      # Word (.docx) kontrol listesini hazır şablona çevirir
│  ├─ kontrol-listeleri/      # dönüştürülmüş işyeri listeleri (ASKI-1.json …)
│  ├─ ikon.js                 # favicon.svg → PNG simgeler
│  └─ yayin-hazirla.js        # yayin/ klasörünü üretir
├─ package.json               # npm test / test:belge / ikon / yayin
└─ README.md
```

Kod bilinçli olarak ES5 tarzı (IIFE + `var`) yazıldı: derleme adımı olmadan,
doğrudan `file://` veya herhangi bir statik sunucuda çalışır.

## 5. Veri modeli (localStorage: `isgtakip.v4`)

```js
{
  surum: 4,
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
  olaylar:   [{ id, isyeriId, tur, tarih, yer, personelId, aciklama, kokNeden, durum,
                kayipGun, vucutBolgesi, yaralanmaTuru, saglikKurulusu,
                siddet, vardiya, hastaneSevk, istirahatBaslangic, istirahatBitis }],
  riskEkipleri: [{ isyeriId, sonDegerlendirme, enGecYenileme, uyeler: { isveren, uzman, hekim, temsilci, destek, birim }, uyeIdleri }],
  acilPlanlar:  [{ isyeriId, hazirlanma, sonYenileme, tatbikat, ekip: [{ rol, ad, personelId }] }],
  davetler:     [{ id, eposta, rol, isyerleri: [], tarih, durum }],
  talepler:     [{ id, tur, eylem: { ad, args }, isyeriId, kullaniciId, kullaniciAd, ozet, durum, tarih, karar, kararVeren, kararTarihi }],
  denetim:      [{ id, tur, islem, kullaniciId, kullaniciAd, isyeriId, ozet, tarih }],
  mevzuat:      [{ id, baslik, kategori, dayanak, durum, ozet }],
  /* v7: bulut eşitlemesi için kayıt bazlı damgalar (aşağıda açıklanır). */
  senkron: {
    kayit:   { 'personel|<id>': 'ISO zaman', 'egitimler|<id>': 'ISO zaman' },
    silinen: { 'personel|<id>': 'ISO zaman' },
    ayarlar: 'ISO zaman'
  }
}
```

`senkron` alanı bulut eşitlemesinin temelidir:

- `kayit[kimlik]`, o kaydın son değişiklik zamanıdır; `kaydet()` yalnızca
  değişen kayıtları damgalar ve kayda `guncelleme` alanı olarak da yazar.
- `silinen[kimlik]`, silinen kaydın **mezar taşı** zamanıdır. Mezar taşı, kaydın
  son değişikliğinden yeni/eşit olduğu sürece kayıt birleşime girmez; böylece
  silme diğer cihazlara yayılır. 120 günden eski mezar taşları budanır.
- `ayarlar`, ayar nesnesinin son değişiklik zamanıdır (ayarlar tek parça hâlinde
  en yeni taraftan alınır).
- JSON yedeğine bu alanlar da yazılır. Yedek geri yüklenirken mezar taşları
  atılır ve yedekteki tüm kayıtlar "yeni değişiklik" sayılır; geri yükleme
  silme anlamına gelmez.

Oturum bilgisi ayrı bir anahtarda (`isgtakip.oturum`) yalnızca
`{ kullaniciId, giris }` olarak tutulur; şifre orada saklanmaz. Eski
`isgtakip.v3` / `isgtakip.v2` verisi ilk açılışta okunup `v4` yapısına taşınır
(`veriTamamla`), kullanıcı listesi boşsa başlangıç hesapları eklenir.

İş kazası ayrı bir dizi değildir: `olaylar` içinde `tur: 'isKazasi'` olan
kayıtlardır ve yaralanma alanlarını (`kayipGun`, `vucutBolgesi`,
`yaralanmaTuru`, `saglikKurulusu`), kök neden sınıfını (`neden`), SGK şiddet
sınıfını (`siddet`) ve vardiya / hastane sevk / istirahat aralığını taşır.
**Meslek hastalığı** da aynı dizide `tur: 'meslekHastaligi'` olarak tutulur;
ortak alanlara ek olarak SGK hastalık grubunu (`hastalikGrubu`:
`ISG.MESLEK_HASTALIK_GRUPLARI`, A–E) ve etken/maruziyet metnini (`etken`)
taşır. Tanı türleri kaza yaralanma türlerinden ayrıdır
(`ISG.HASTALIK_TURLERI`); hangi kayıtların kaza/hastalık sayıldığı
`ISG.kazaKaydi(olay)` ile, görünen adı `ISG.kazaKaydiAdi(olay)` ile bulunur.
Personel bilgisi kaza kaydına kopyalanmaz; `personelId` ile personel
listesine bağlanır, sicil/departman/meslek/kıdem istatistikleri bu bağdan
türetilir. Sınıflandırma listeleri `ISG.YARALANMA_BOLGELERI` /
`ISG.YARALANMA_TURLERI` / `ISG.HASTALIK_TURLERI` /
`ISG.MESLEK_HASTALIK_GRUPLARI` / `ISG.KAZA_NEDENLERI` /
`ISG.KAZA_SIDDETLERI` / `ISG.VARDIYALAR`, görünen ad üretimi
`ISG.listeAdi(liste, id)` ile yapılır; `v4` göçü eski kayıtlara boş yaralanma
ve neden alanları, `v5` göçü şiddet/vardiya/sevk/istirahat alanlarını, `v6`
göçü hastalık grubu/etken alanlarını ekler, böylece ramak kala ve çevresel
olaylar değişmeden kalır. Kıdem
(`ISG.kidemYil`) işe başlama tarihi ile kaza tarihi arasındaki tam yıldır;
kayıp gün şiddeti (`ISG.kayipGunAraligi`) 0 / 1–3 / 4–7 / 8–14 / 15+
aralıklarına ayrılır.

Kayıp iş günü tek kaynaktan türetilir: `ISG.kazaKayipGun` ölümlü kazada
6.000 gün (`ISG.OLUM_KAYIP_GUN`), istirahat tarihleri varsa
`bitiş − başlangıç + 1`, aksi hâlde elle girilen `kayipGun` değerini döndürür.
Sıklık/ağırlık oranları (`KSO`, `KAO`) 1.000.000 çalışma saati üzerinden
hesaplanır; saat verisi tutulmadığı için `ISG.ayAktifPersonel` ile ay bazında
personel sayısı bulunup `ISG.AYLIK_KISI_SAATI` (176 saat) ile çarpılır.

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

Gereksinim: **Node.js 22.22+ veya 24+** (test bağımlılığı `jsdom@30` daha eski
sürümlerde çalışmaz; `package.json` → `engines` alanı bunu belirtir).

Test:

```powershell
npm install
npm test                     # 471 kontrol + belge testi (27 kontrol), başarısızda çıkış kodu 1
npm run test:belge           # yalnızca belge eki testi (27 kontrol)
```

Test; yükleme, **boş açılış ve örnek veri temizliği** (0 kayıt, boş ekran
dolaşımı, mezar taşı üretimi, `ornekYukle()` ve düğme akışı), **giriş/oturum**,
**rol ve işyeri kapsamı**,
**onay kuyruğu ve denetim izi**, iş kuralları, kapsam filtresi, personel CRUD,
eğitim geçerliliği, dosya filtreleri ve sayfalama, DÖF oluşturma, plan
tamamlama, saha, risk/acil kayıtları ve belge ekleri, istatistikler, rapor,
davet, mevzuat, şifre sıfırlama kodu, bulut eşitleme (ayar doğrulama, gönderim,
indirme, çevrimdışı hata, bağlantı kesme), yapısal
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

## 6.2. Sürüm damgası, kancalar ve canlı doğrulama (otomatik)

Bu projede “JS'i değiştirdim ama `?v=` numarasını artırmayı unuttum” ve
“commit ettim ama push etmedim” hataları **elle iş yapmaya bırakılmaz**.
Üç katmanlı otomatik altyapı vardır:

| Katman | Dosya | Ne yapar |
|---|---|---|
| Sürüm damgası | `tools/varlik-surum.js` | Her JS/CSS dosyasının SHA-1 özetinin ilk 8 karakterini `?v=` olarak yazar |
| Git kancaları | `.githooks/pre-commit`, `pre-push`, `post-commit` | Commit'te damgayı eşitler, push'ta test ister, commit'i otomatik gönderir |
| CI | `.github/workflows/kontrol.yml` | Damga uyuşmazlığında/test kırıldığında derlemeyi düşürür, yayını doğrular |

### 6.2.1. Damga neden artık sayı değil?

Eskiden `?v=10` → `?v=11` elle yazılıyordu; unutulunca tarayıcı eski dosyayı
önbellekten veriyordu (2.8.1'de yaşanan sorun buydu). Artık damga **içerik
özetidir**: `assets/js/uygulama.js` değişirse damga kendiliğinden değişir,
değişmezse aynı kalır. Kimsenin numara takip etmesi gerekmez. Özet hesaplanırken
satır sonları LF'e normalize edilir; böylece Windows (CRLF) ve Linux/macOS (LF)
çalışma kopyaları aynı damgayı üretir ve GitHub Pages'teki içerikle birebir
eşleşir.

```powershell
npm run surum             # damgaları eşitle (değişiklik yoksa hiçbir şey yazmaz)
npm run surum:denetle     # yalnızca denetle; eski damga varsa çıkış kodu 1
```

### 6.2.2. Kancaları kurma

`npm install` çalıştıran herkes kancaları **otomatik** alır (`prepare` betiği
`tools/hooks-kur.js`'i çağırır ve `git config core.hooksPath .githooks` yazar).
Bağımlılık kurmadan klonlayan biri için:

```powershell
npm run hooks
```

Kurulan kancalar:

- **pre-commit** — `?v=` damgalarını eşitler, değişen JS dosyalarında
  `node --check` ile sözdizimi denetler, çakışma işareti (`<<<<<<<`) arar.
  Damga güncellemesi commit'e kendiliğinden eklenir.
- **pre-push** — `npm test` yeşil değilse push'u **durdurur**; ayrıca damgaları
  yeniden denetler (kancayı atlayan biri olsa bile yakalanır).
- **post-commit** — commit'i `origin/<dal>` dalına **otomatik push eder**.
  Yani “yerelde kaldı, kullanıcı eski sürümü görüyor” durumu oluşamaz.

Atlatma/kapatma (bilinçli istisnalar):

```powershell
$env:ISG_OTOMATIK_PUSH=0; git commit -m "..."   # yalnızca bu commit'te push yok
$env:ISG_TEST_ATLA=1; git push                  # testleri atla (önerilmez)
git config --unset core.hooksPath               # kancaları tamamen devre dışı bırak
```

Not: GitHub Pages'e **elle** (tarayıcıdan, Yol B) yüklenen sürümlerde kanca
devrede olmaz; bu durumda commit öncesi `npm run surum` çalıştırın.

### 6.2.3. Yayının gerçekten kullanıcıya ulaştığını doğrulama

```powershell
npm run yayin:dogrula                      # tek deneme
npm run yayin:dogrula -- --bekle 300       # 5 dakika, 15 sn'de bir dene
```

Betik (`tools/yayin-dogrula.js`) canlı `index.html`'i ve bütün JS/CSS
dosyalarını indirir, **içerik özetini yerelle karşılaştırır**. Uyuşmazlık
varsa çıkış kodu 1'dir; panoda “yayınladım” demekle yetinilmez. Aynı betik
`.github/workflows/kontrol.yml` içinde her `main` push'undan sonra çalışır ve
Pages yeni sürümü servis etmezse derlemeyi kırmızıya çevirir.

## 6.4. İşyeri Word kontrol listesini uygulamaya ekleme

Her işyeri için Word olarak hazırlanan dosya kontrol listesi (ABB-OSGB-KL-001
şablonu) iki adımda uygulamaya girer:

```powershell
# 1) Word listesini şablona çevir → tools/kontrol-listeleri/<KOD>.json + assets/js/kontrol-listeleri.js
node tools/kontrol-listesi.js donustur "C:\...\ASKI-1 DOSYA KONTROL LISTESI.docx" ASKI-1

# 2) Damgaları yenile, testi koştur, yayın paketini hazırla
npm run surum
npm test
npm run yayin
```

Dönüştürücü Word'de şunları okur: `BÖLÜM n …` başlıkları,
`NO | BELGE / KAYIT | YASAL DAYANAK • PERİYOT | VAR | YOK | K/D | KONTROL TARİHİ`
tablosu (sütunlar başlık satırından bulunur, sıra değişebilir), dolu kutu (☒)
işaretleri, işyeri/birim adı, SGK sicili, asıl işveren, kontrol ve sıradaki
kontrol tarihi, genel değerlendirme notu ile kontrolü yapan uzman.

Uygulamada **Dosya kontrolleri → Hazır kontrol listesi**: işyeri ve liste
seçilir; önizleme "kaç madde eklenecek / kaçı zaten açık / kaçı eksik işaretli"
bilgisini gösterir. Eklenen her madde `bölüm`, `durum` (VAR→Var, YOK→Eksik,
K/D→Yok), `kontrol tarihi` ve `Yasal dayanak: …` açıklamasıyla açılır, kaydına
`sablon: ASKI-1` etiketi yazılır. Aynı liste ikinci kez eklenirse maddeler
çoğalmaz (Türkçe duyarlı metin anahtarıyla atlanır). Yönetici dışında kayıt
yapan 142 tekil talep yerine **tek bir onay talebi** üretilecek şekilde yetki
kuyruğuna `listeUygula` olarak girer.

Yeni bir işyeri listesi geldiğinde tek gereken, komutu yeni bir `KOD` ile
çalıştırmaktır: `tools/kontrol-listeleri/*.json` dosyalarının tamamı
`assets/js/kontrol-listeleri.js` içine yeniden yazılır.

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
Sonraki tüm değişikliklerde yalnızca `git add` + `git commit` yeterlidir:
`pre-commit` kancası `?v=` damgalarını içerikle eşitler, `post-commit` kancası
commit'i `origin/main` dalına gönderir, `pre-push` kancası testleri çalıştırır
(bkz. §6.2). Elle `git push` ve elle numara artırma gerekmez.



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
| Canlı sürüm | `npm run yayin:dogrula` → “canlı sürüm yerelle aynı” |

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

- Yayınlanan site boş açılır; **örnek veriler** yalnızca `Örnek veri` düğmesiyle
  gelir ve **gerçek kurum verisi değildir** — sayılar ve tarihler örnek amaçlı
  üretilir. Sağlık verisi, TC kimlik no ve kişisel dosya içeriği bu ortamda
  saklanmamalıdır.
- Veriler önce tarayıcının `localStorage` alanında tutulur; gizli sekmede veya
  depolama temizlendiğinde kaybolur. Cihazlar arası paylaşım için isteğe bağlı
  **Supabase** eşitlemesi vardır ([1.3](#13-cihazlar-arası-ortak-kayıt-supabase)),
  ancak orada da kullanıcı doğrulaması yoktur: oda kodunu bilen herkes veriyi
  okuyup yazabilir. Gerçek çok kullanıcılı kurulum için Supabase Auth + RLS
  politikaları gerekir.
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
- İş kazası ve meslek hastalığı ekranı kayıt tutar; SGK e-bildirge / ÇSGB
  entegrasyonu yoktur, bildirim süresi takibi kullanıcıya bırakılır. Yaralanma
  bölgesi/türü ve meslek hastalığı grubu sınıflandırmaları kısaltılmış
  listelerdir, resmî istatistik kodları (ISCO/ICD eşlemesi) içermez.
- İstatistikler tanımlayıcıdır (kaza sayısı, dağılım, kayıp gün, KSO/KAO/KSH).
  KSO/KAO/KSH yalnızca `isKazasi` kayıtlarından hesaplanır; meslek hastalığı
  kayıtları listede ve sayımlarda görünür ama SGK kaza oranlarına katılmaz.
  Çalışılan saat ayrıca tutulmadığı için KSO/KAO oranları **aktif personel ×
  176 saat/ay** (`ISG.AYLIK_KISI_SAATI`) varsayımına dayanır; puantaj/PDKS
  verisiyle değiştirilmeden resmî SGK bildirimi yerine geçmez. Kırılımlar
  yalnızca girilen kayıtlara dayanır ve boş alanlar "Belirtilmedi" sayılır.
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
8. Sunucu tarafı raporlama, gerçek puantaj/PDKS çalışma saatiyle KSO/KAO, yaş
   ve öğrenim kırılımları (personelde doğum tarihi/öğrenim alanı) ve PWA
   güncelleme bildirimi.

## 10. Bu sürümde neler değişti?

### 2.12.0 — İşyerine özel hazır dosya kontrol listeleri (Word → uygulama)

- **Word listesi artık uygulamaya tek tıkla ekleniyor.** Paylaşılan
  `ASKİ-1 DOSYA KONTROL LİSTESİ.docx` (ABB-OSGB-KL-001) **13 bölüm / 142 madde**
  olarak dönüştürüldü. Dosya kontrolleri sayfasındaki **Hazır kontrol listesi**
  düğmesi işyeri + liste seçtirir, önizleme gösterir ve maddeleri tek seferde
  açar.
- **Word'den gelen bilgiler korunuyor.** Bölüm başlığı `bölüm` alanına, yasal
  dayanak/periyot `Yasal dayanak: …` açıklamasına, kontrol tarihi `kontrol
  tarihi` alanına yazılır; VAR→**Var**, YOK→**Eksik**, K/D→**Yok** durumuna
  dönüşür (ASKİ-1: 30 var, 110 eksik, 2 kapsam dışı). Kayıtlar `sablon: ASKI-1`
  etiketi taşır.
- **Çoğaltma yok.** Aynı işyerinde aynı madde açıksa ikinci uygulama o maddeyi
  atlar; `listeUygula` `{eklenen, atlanan, toplam}` döndürür.
- **Yeni işyerleri için aynı yol:** `node tools/kontrol-listesi.js donustur
  "<liste.docx>" <KOD>` → `tools/kontrol-listeleri/<KOD>.json` üretilir ve
  `assets/js/kontrol-listeleri.js` tüm listelerle yeniden yazılır (sütunlar
  başlıktan bulunur, ☒ işaretleri okunur, Türkçe başlık/karakter katlaması
  yapılır).
- **Yetki ve denetim:** işlem `listeUygula` adıyla yazma işlemlerine,
  etiketlere ve sayfa eşlemesine kayıtlı; yönetici dışındaki roller tek bir
  onay talebi açar, denetim izine tek satır düşer.
- **Test kapsamı 451 → 471 kontrol** (şablon bütünlüğü, durum eşlemesi, işyeri
  adı eşleşmesi, uçtan uca diyalog akışı, ikinci uygulamada çoğalmama, yanlış
  kodun reddi, 14 diyalog) + belge testi 27 kontrol.
- `package.json` sürümü **2.12.0**, yeni `npm run liste` komutu;
  `depo.js`, `yetki.js`, `sayfalar-kayit.js`, `uygulama.js` ve yeni
  `kontrol-listeleri.js` damgaları yeniden üretildi.

### 2.11.1 — İşyeri ekleme düzeltildi, form hataları artık sessiz kalmıyor

- **"İşyeri ekle" kaydetmiyordu.** `depo.isyeriKaydet()` var olmayan bir
  yardımcıyı (`kaydetListeden`) çağırıyordu; kaydetme `ReferenceError` ile
  yarıda kesiliyor, hiçbir uyarı çıkmadığı için düğme ölü görünüyordu. Doğru
  yardımcı `kaydetListede` kullanılıyor; yeni kayıt, düzenleme ve silme akışı
  birlikte çalışıyor. Bu hayalet çağrı 2.11.0 yayınıyla canlıya çıkmıştı.
- **Form hataları ekrana yazılıyor.** Diyalog formlarında beklenmeyen bir hata
  kaydı engellerse *"Kayıt yapılamadı: <sebep>"* uyarısı (`role="alert"`)
  gösteriliyor ve hata konsola düşüyor; kullanıcı sebepsiz beklemiyor.
- **Regresyon testi:** Boş sitede işyeri ekleme uçtan uca denetleniyor
  (düğme → diyalog → kayıt → `localStorage` → kart → ana kurum → düzenle → sil);
  test kapsamı **443 → 451 kontrol**.
- `package.json` sürümü **2.11.1**; `depo.js` (`v=688c2e36`) ve `uygulama.js`
  (`v=4fba4f5d`) varlık damgaları yeniden üretildi.

### 2.11.0 — Site boş açılıyor: demo veriler silindi, temizlik ve örnek veri düğmesi

- **Yayındaki site artık boş başlıyor.** 2.10.0 ve öncesinde ilk açılış 6 işyeri,
  37 personel, ~700 kontrol maddesi, plan/tespit/kaza/mevzuat kaydıyla doluydu.
  Tohum veri `ISG.BOS_VERI()` oldu: 0 işyeri, 0 kayıt; yalnızca yönetici hesabı
  ve kurum ayarları korunur (hesap kalmazsa giriş yapılamaz).
- **Eski cihazlardaki demo veri kendiliğinden temizleniyor.** Açılışta bir kez
  çalışan göç (`isgtakip.temizlik` damgası) örnek kayıtları siler; her silinen
  kayıt için mezar taşı yazıldığından kayıtlar buluttan geri dönmez. Silinmeden
  önceki hâl `isgtakip.oncekiVeri` anahtarında saklanır ve üst bardaki
  **Eski veri** düğmesiyle indirilebilir.
- **Örnek veri artık bir düğme.** Üst bardaki **Örnek veri** (yalnızca yönetici)
  onay sonrası `ISG.ORNEK_VERI()` kümesini yükler (`depo.ornekYukle()`); kayıtlar
  bu cihazda yeni sayılıp buluta yazılır ve kendi mezar taşları silinir.
- **"Kurumu sil" → "Tüm verileri sil".** Onay metni doğru davranışı anlatıyor;
  işlem örnek veriye değil boş veriye döndürüyor, hesapları ve önceki silme
  mezar taşlarını koruyor.
- Boş veriyle 13 ekranın tamamı test ediliyor: boş durum mesajları, kırık ikon
  ve `undefined/NaN` üretmeyen render denetleniyor.
- Test kapsamı **384 → 443 kontrol** (boş açılış, göç birim testi, mezar taşı,
  örnek veri düğmesi uçtan uca, boş ekran dolaşımı) + belge testi
  **25 → 27 kontrol** (boş açılış sonrası `ornekYukle()`).
- `package.json` sürümü **2.11.0**; JS varlık damgaları yeniden üretildi.

### 2.10.0 — Bulut eşitlemesi kayıt bazına indi: birleştirme, silme yayılımı, döngü yok

- **Cihazlar artık birbirinin verisini ezmiyor.** Önceki akış tüm veri kümesini
  tek bir "son yazan kazanır" yarışına sokuyordu: bir cihaz eğitim eklerken
  diğeri personel düzenlerse biri kayboluyor, bir cihazda silinen kayıt diğer
  cihazdan geri geliyordu. Artık `isyerleri`, `personel` ve 14 liste (eğitim,
  risk, olay, belge, plan, tespit, ekip, acil plan, davet, mevzuat, kullanıcı,
  talep, denetim) **kayıt bazında** birleştiriliyor.
- **Kayıt damgası:** her kayıt son değişiklik zamanını (`guncelleme`, yedek
  olarak `senkron.kayit[kimlik]`) taşır. `kaydet()` yalnızca gerçekten değişen
  kaydı damgalar; bunu yerelde son kaydedilen hâlin anlık görüntüsüyle (`temel`)
  karşılaştırarak bulur. Aynı kimlikte yeni damga kazanır, damgasız eski
  kayıtlarda eşitlikte bulut kopyası geçerli olur.
- **Silme yayılır.** Silinen kayıt `senkron.silinen` altında **mezar taşı**
  bırakır; mezar taşı, kaydın kendi damgasından yeni ya da eşitse kayıt her iki
  taraftan da düşer. Mezar taşları 120 gün sonra budanır. Böylece "sildim ama
  diğer cihaz geri getirdi" durumu ortadan kalkar.
- **Gönderim döngüsü kapatıldı.** İndirilen veri önceden `kirli` sayılıp yeniden
  yukarı gönderiliyordu. Karşılaştırma artık anahtar sırasından ve liste
  sırasından bağımsız **kanonik özetle** yapılıyor; birleşim buluttaki hâlden
  farksızsa POST yapılmıyor, indirilen kayıtlar geri gönderilmiyor. Boşta
  çalışan iki cihazlı simülasyonda 12 saniyede 0 gönderim doğrulandı.
- **Bağlanma ve açılış sırası:** bağlanırken ve açılışta artık önce çekme,
  sonra birleştirme yapılıyor. *Bu cihazdaki kayıtlar öncelikli olsun* seçeneği
  tüm yerel kayıtları "şimdi değişti" olarak damgalayıp çakışan kayıtta bu
  cihazı öne geçiriyor (`ISG.depo.damgala`); buluta özgü kayıtlar yine korunuyor.
  Arayüz etiketi, bağlantı bildirimleri ve yorumlar bu anlama göre güncellendi.
- **Ayarlar** tek nesne olarak, `senkron.ayarlar` damgası daha yeni olan taraftan
  alınıyor. `ISG.depo.birlestir(uzak)` ve `birlestir(yerel, uzak)` imzaları
  birlikte destekleniyor; dönüş `{ veri, yerelFazla, uzakFazla }`.
- **Veri modeli** `senkron.kayit` / `senkron.silinen` / `senkron.ayarlar` ile
  genişledi; eski veriler `veriTamamla` ile tamamlanıp ilk kayıtta damgalanıyor.
  JSON yedeği bu alanları korur; yedek geri yüklemede mezar taşları taşınmaz ve
  kayıtlar yeni değişiklik sayılır (geri yükleme silme anlamına gelmez).
- Test kapsamı **361 → 369** (8 yeni: iki cihazın yeni kayıtları korunur, buluta
  yazılacak yenilik bildirilir, aynı veri gönderim üretmez, anahtar sırası
  değişikliği sayılmaz, mezar taşı kaydı buluttan düşürür, silme yenilik sayılır,
  aynı kayıtta son yazan kazanır, eski taraf yeniden yazılmaz). Ayrıca iki
  cihazlı jsdom simülasyonuyla silme yayılımı, boşta gönderim olmaması ve
  eşzamanlı düzenleme doğrulandı. `package.json` sürümü **2.10.0**.

### 2.9.0 — Sürüm damgası, git kancaları ve canlı doğrulama otomatikleşti

- **`?v=` damgası artık elle artırılmıyor.** Yeni `tools/varlik-surum.js`, her
  JS/CSS dosyasının SHA-1 özetinin ilk 8 karakterini `?v=` olarak yazar
  (`v=11` → `v=adffbcf6` gibi). Dosya değişmezse damga aynı kalır, değişirse
  kendiliğinden değişir; “numara artırmayı unuttum” hatası imkânsız hale gelir.
  `npm run surum` yazar, `npm run surum:denetle` yalnızca denetler.
  `404.html` içindeki sürümsüz `style.css` referansı da damgalandı.
- **Git kancaları** (`.githooks/`) eklendi ve `npm install` sırasında
  (`prepare` → `tools/hooks-kur.js`) herkese otomatik kuruluyor:
  `pre-commit` damgayı eşitleyip sözdizimi/çakışma denetler, `pre-push`
  testler yeşil değilse push'u engeller, `post-commit` commit'i `origin`'e
  otomatik gönderir. Yani “commit ettim ama push etmedim” durumu oluşamaz.
  `ISG_OTOMATIK_PUSH=0` ve `ISG_TEST_ATLA=1` ile bilinçli istisna yapılabilir.
- **`tools/yayin-dogrula.js`** (`npm run yayin:dogrula`) canlı `index.html` ve
  tüm JS/CSS dosyalarını indirip içerik özetini yerelle karşılaştırır;
  `--bekle 300` ile yayılma süresini bekler, uyuşmazlıkta çıkış kodu 1 verir.
- **CI:** `.github/workflows/kontrol.yml` her `main` push'unda damga
  uyuşmazlığını ve test kırıklarını yakalar, ardından GitHub Pages'in yeni
  sürümü servis ettiğini doğrular; aksi halde derleme kırmızı olur.
- `.gitattributes` eklendi (kanca ve araç dosyaları LF satır sonuyla saklanır).
  `package.json` sürümü **2.9.0**, `homepage` ve `engines` (Node ≥ 22.22) alanları
  eklendi. CI, `jsdom@30` ile uyumlu **Node 24** üzerinde çalışır.
- Test kapsamı **347 → 361 kontrol** (14 yeni denetim: her JS/CSS referansında
  `?v=` var mı, damga dosya içeriğiyle uyumlu mu, kanca dosyaları var ve LF mi,
  kancalar beklenen komutları çağırıyor mu, `package.json` betikleri ve
  `homepage` alanı, CI iş akışının damga/test/canlı doğrulama adımları,
  `.gitattributes` satır sonu kuralı). Belge testi 25 kontrol.

### 2.8.1 — Kaza girişi istatistikte görünmüyor şikâyeti: varlık sürümü ve regresyon testi

- İstatistikler sayfasındaki **“İş kazası / meslek hastalığı veri girişi”** kartı
  2.7.0'dan beri kodda; ancak yayınlanan sürüm 2.2.0'da kaldığı ve JS dosyası
  `?v=10` ile önbellekten geldiği için ekranda görünmüyordu. JS/CSS varlık
  sürümü `?v=10` → `?v=11` yapıldı; tarayıcı yeni dosyaları çeker.
- Giriş akışı **regresyon testine** bağlandı (8 yeni kontrol): kart var mı,
  kart/başlık/liste olmak üzere üç yerde iki bildirim düğmesi var mı,
  “Kaza bildir” giriş ekranını `isKazasi` türüyle açıyor mu, “Meslek hastalığı
  bildir” `meslekHastaligi` türüyle açıp tanı alanlarını gösteriyor mu, iş
  kazasında hastalık alanları gizli mi.
- Test kapsamı **339 → 347 kontrol**.

### 2.8.0 — Cihazlar arası ortak kayıt: isteğe bağlı Supabase eşitlemesi

- Yeni **bulut katmanı** eklendi (`assets/js/bulut.js`): sıfır bağımlılıkla,
  doğrudan Supabase REST (`/rest/v1/isg_veri`) üzerinden çalışır. Veri
  `localStorage`'ta kalmaya devam eder; bulut yalnızca **üst katman**dır, yani
  çevrimdışı kullanım bozulmaz.
- Üst çubuğa **Bulut** düğmesi ve 13. diyalog eklendi: Project URL, anon
  anahtar, **oda kodu**, otomatik çekme aralığı (10–300 sn, varsayılan 20),
  "bu cihazdaki kayıtlar buluta gönderilsin" seçeneği, **Şimdi eşitle** ve
  **Bağlantıyı kes** düğmeleri, canlı durum satırı ve kopyalanabilir **SQL
  betiği** bloğu.
- Bağlanırken yön seçilebilir: işaretliyse yerel veri buluta yazılır (ilk
  kurulum), işaretsizse buluttaki veri bu cihaza indirilir (ikinci cihaz).
- Çakışma **son yazan kazanır** kuralıyla çözülür: istemci ISO zaman damgası
  (`yerelZaman` ↔ `sonUzakZaman`) karşılaştırılır; yalnızca değişen kayıtlar
  (`kirli`) gönderilir.
- Bağlantı kesildiğinde/çevrimdışıyken değişiklikler yerelde birikir, ağ geri
  gelince veya sekme görünür olunca otomatik eşitlenir; `online` / `offline` ve
  `visibilitychange` olayları dinlenir.
- Ayarlar `isgtakip.bulut` anahtarında saklanır; **Bağlantıyı kes** yerel
  kayıtları silmez.
- README'ye kurulum ve güvenlik notları eklendi ([1.3](#13-cihazlar-arası-ortak-kayıt-supabase)):
  anon anahtar tarayıcıda görünür, bu kurulumda kullanıcı doğrulaması yoktur —
  oda kodunu bilen herkes veriye erişebilir.
- Bulut verisi bu cihaza indirildiğinde aynı veri yeniden yukarı gönderilmez;
  eşitleme başarısız olduğunda durum satırı "Bulut bağlantısı yok" uyarısıyla
  hata durumunda kalır (sessizce "güncel" yazmaz).
- JS/CSS varlık sürümü `?v=9` → `?v=10`. Test kapsamı **315 → 339 kontrol**
  (bulut diyaloğu, alan doğrulama, SQL betiği, ayar kaydı, ilk gönderim, uzak
  kaydın indirilmesi, çevrimdışı hata durumu ve bağlantı kesme akışı).

### 2.7.0 — Meslek hastalığı veri girişi ve İstatistikler'de belirgin giriş kartı

- Bildirim formuna **kayıt türü** seçimi eklendi: **iş kazası** veya
  **meslek hastalığı**. Tür değişince form başlığı ve alan etiketleri
  uyarlanır (kaza tarihi ↔ tanı tarihi, yaralanan ↔ hastalanan personel,
  yaralanma türü ↔ tanı türü, hastane sevk ↔ sağlık kuruluşuna sevk).
- Meslek hastalığına özel iki alan eklendi: **SGK meslek hastalığı grubu**
  (`ISG.MESLEK_HASTALIK_GRUPLARI`, A–E) ve **etken / maruziyet** metni. Tanı
  türü listesi `ISG.HASTALIK_TURLERI` ile ayrıştırıldı.
- `ISG.OLAY_TURLERI` içine `meslekHastaligi` eklendi; kayıtlar aynı
  `olaylar` dizisinde tutulur (`ISG.kazaKaydi`, `ISG.kazaKaydiAdi`).
- **İstatistikler** ekranında KPI şeridinin altına **"İş kazası / meslek
  hastalığı veri girişi"** kartı eklendi: iki belirgin düğme (İş kazası
  bildir, Meslek hastalığı bildir) ve mevcut kayıt sayacı. Sayfa başlığına da
  "Meslek hastalığı bildir" düğmesi eklendi.
- Ortak kayıt listesi (`ISG.parcalar.kazaTablosu`) artık iki türü birlikte
  gösterir: **tür rozeti**, tanı/yaralanma bilgisi, SGK hastalık grubu ve
  etken; özet satırında `iş kazası · meslek hastalığı · iş günü kaybı` sayılır.
- CSV çıktısı iki türü kapsayacak şekilde genişletildi: **Kayıt türü**,
  **SGK hastalık grubu** ve **Etken / maruziyet** kolonları eklendi.
- Kapatma/silme onay metinleri kayıt türüne göre uyarlanır; meslek
  hastalığı kaydı silinirken "tanı bilgileri" uyarısı verilir.
- `v6` veri göçü `hastalikGrubu` / `etken` alanlarını normalleştirir; örnek
  veriye bir meslek hastalığı kaydı (`o14` — pnömokonyoz, grup D) eklendi.
- JS/CSS varlık sürümü `?v=8` → `?v=9`. Test kapsamı **308 → 315 kontrol**
  (veri girişi kartı, meslek hastalığı diyaloğu, türe özel alanlar, tanı türü
  listesi, kayıt ve satır rozeti).

### 2.6.0 — Statik arayüzden kaza bildirme ve İstatistikler'de kaza kaydı listesi

- İş kazası kayıt listesi **ortak bir parçaya** taşındı
  (`ISG.parcalar.kazaTablosu`) ve artık hem **Saha ve DÖF** hem
  **İstatistikler** ekranında aynı tablo kullanılıyor; kod ikiye kopyalanmıyor.
- **İstatistikler** ekranına kaza **veri girişi ve liste** kartı eklendi: KPI
  şeridinin altında tarih/yer, personel/işyeri (sicil, departman), yaralanma
  bölgesi/türü, şiddet rozeti, kayıp gün, açıklama/kök neden, durum kolonları;
  satırda **Düzenle / Kapat (Yeniden aç) / Sil** işlemleri.
- Sayfa başlığına ve kart başlığına **"Kaza bildir"** düğmesi eklendi; kapsam
  filtresindeki işyeri forma taşınır. Kart ayrıca `kaza · iş günü kaybı` özetini
  ve **CSV liste indirme** düğmesini taşır.
- Liste **tarihe göre yeniden eskiye** sıralanır (`saha` sayfasındaki sıralama
  ile aynı davranış).
- Yeni CSS yazılmadı; mevcut `kart`, `tablo-kucuk`, `kaza-satir`,
  `kart-arac` ve `filtre-ozet` sınıfları yeniden kullanıldı.
- JS/CSS varlık sürümü `?v=7` → `?v=8`. Test kapsamı **301 → 308 kontrol**
  (İstatistikler'de liste, yeni kayıt, bildir düğmesi, diyalog açma ve satırdan
  düzenleme).

### 2.5.0 — SGK uyumlu kaza istatistikleri (referans çalışma kitabı)

- Kaza kaydına **SGK şiddet sınıfı** (`ISG.KAZA_SIDDETLERI`: hafif/orta, ağır,
  uzuv kaybı, ölüm), **vardiya** (`ISG.VARDIYALAR`), **hastane sevk**
  (`ISG.EVET_HAYIR`) ve **istirahat başlangıç/bitiş** alanları eklendi.
- **Kayıp iş günü tek kaynaktan türetilir** (`ISG.kazaKayipGun`): ölümde 6.000
  gün (`ISG.OLUM_KAYIP_GUN`), istirahat tarihleri varsa `bitiş − başlangıç + 1`
  (`ISG.tarihFarki`), aksi hâlde elle girilen değer. Diyalogda şiddet veya
  tarihler değiştiğinde kayıp gün alanı otomatik güncellenir; bitiş < başlangıç
  hatası engellenir.
- **KSO / KAO / KSH oranları** eklendi: `KSO = kaza / 1.000.000 çalışma saati`,
  `KAO = kayıp gün / 1.000.000 çalışma saati`, `KSH = kaza / çalışan`.
  Çalışma saati, ay bazında `ISG.ayAktifPersonel` × `ISG.AYLIK_KISI_SAATI`
  (176 saat) varsayımıyla hesaplanır; bu varsayım arayüzde ve README'de açıkça
  belirtilir.
- **İstatistikler** ekranı: dört yeni KPI (KSO, KAO, KSH, hastane sevk) ile KPI
  sayısı 8 → 12; **12 aylık oran tablosu** (ay, kaza, kayıp gün, iş saati, KSO,
  KAO), **yaralanma şiddeti (SGK)**, **vardiya** ve **haftanın günü** kırılım
  kartları; kayıp gün şiddet aralıkları ve matris artık türetilen kayıp günü
  kullanır.
- Saha ekranındaki kaza tablosu şiddet rozetini gösterir ve toplam kayıp günü
  `ISG.kazaKayipGun` üzerinden hesaplar; CSV çıktısına şiddet, vardiya, hastane
  sevk, istirahat başlangıç/bitiş kolonları eklendi.
- `veriTamamla` **v5** göçü: eski kayıtlara boş `siddet` / `vardiya` /
  `hastaneSevk` / istirahat alanları ekler ve iş kazalarında `kayipGun` değerini
  yeni kuralla yeniden hesaplar.
- `ISG.bicim.ondalik` (sabit ondalıklı biçim) ve `.ist-tablo` stil sınıfı
  eklendi; örnek verideki 10 kazanın tamamına şiddet/vardiya/sevk ve istirahat
  aralığı işlendi (bir uzuv kaybı, iki ağır kaza).
- JS/CSS varlık sürümü `?v=6` → `?v=7`. Test kapsamı **286 → 301 kontrol**
  (yeni seçenek listeleri, otomatik kayıp gün, 6.000 gün kuralı, tarih farkı,
  ay bazlı personel sayımı, oran KPI'ları ve aylık tablo).

### 2.4.0 — iş kazası istatistikleri

- **Kök neden sınıfı** alanı eklendi (`ISG.KAZA_NEDENLERI`: KKD, makine
  koruyucusu / kilitleme, arızalı ekipman, çalışma yöntemi, eğitim,
  dikkatsizlik, zemin / ortam, kimyasal, elektrik, trafik, diğer). Kaza
  diyalogunda serbest metin kök neden açıklaması ayrı alan olarak korunur;
  CSV çıktısı kök neden sınıfı, departman ve kıdem kolonlarını taşır.
- Kaza diyalogunda personel listesinden seçilen kişinin **sicil, departman,
  meslek, şube ve işe başlama tarihi** özetlenir; kayıt yalnızca `personelId`
  tutar, istatistikler personel listesinden türetilir.
- **İstatistikler** ekranı iş kazası analizine göre yenilendi: aylık kaza
  sıklığı sütun grafiği (son 12 ay), kök neden dağılımı, neden × vücut bölgesi
  ısı matrisi, departman ve kıdem kırılımı, iş günü kaybı şiddet dağılımı, en
  çok kazaya uğrayan personel listesi ve dört kaza KPI'ı (kaza sayısı, kazalı
  personel oranı, iş günü kaybı, kaza başına kayıp gün). Toplam KPI sayısı 8.
- Yardımcılar: `ISG.kidemYil`, `ISG.kidemAraligi`, `ISG.KAYIP_GUN_ARALIKLARI`,
  `ISG.kayipGunAraligi` ve `ISG.KIDEM_ARALIKLARI`; `veriTamamla` eski
  kayıtlara boş `neden` alanı ekler (şema `v4` ve veri anahtarı korunur).
- Örnek veri 6 → 10 iş kazasına çıktı (`o03`, `o05`–`o13`) ve neden sınıfları
  eklendi; sütun ve matris grafikleri dolu görünür.
- JS/CSS varlık sürümü `?v=5` → `?v=6`. Test kapsamı **274 → 286 kontrol**
  (neden seçenekleri, personel özeti, neden kaydı, kıdem / kayıp gün
  yardımcıları, sütun grafik, ısı matrisi ve kırılım kartları).

### 2.3.0 — iş kazası kayıtları

- **İş kazası kaydı** eklendi: saha ekranında ayrı tablo (`İş kazası kayıtları`),
  diyalogda personel, tarih, kaza yeri, yaralanma bölgesi/türü, kayıp gün,
  sağlık kuruluşu, kök neden ve durum alanları. Kayıt yeni `olaylar` şemasına
  `tur: 'isKazasi'` olarak yazılır; ramak kala ve çevresel olaylar aynı ekranda
  ayrı tabloda kalır (`kaza-yeni`, `kaza-duzenle`, `kaza-csv` işlemleri).
- Sınıflandırma listeleri `ISG.YARALANMA_BOLGELERI` (baş, göz, sırt/bel, kol,
  el, bacak, ayak, iç organ, çoklu, diğer) ve `ISG.YARALANMA_TURLERI` (ezilme,
  kesik, burkulma, kırık, yanık, yabancı cisim, kimyasal, elektrik, diğer);
  görünen ad üretimi `ISG.listeAdi`.
- **İstatistikler** ekranına iş kazası blokları geldi: kaza sayısı, etkilenen
  personel, kayıp gün toplamı ve ortalama, işyeri bazında kaza dağılımı,
  yaralanma bölgesi ve türü çubuk grafikleri; alt bilgi satırında son kaza
  tarihi ve kayıp günlü kaza sayısı.
- Örnek veriye beş iş kazası (`o05`–`o09`) eklendi; `saha` tablosu ve CSV
  çıktısı bu kayıtları yaralanma bilgileriyle listeler.
- Veri anahtarı `isgtakip.v3` → **`isgtakip.v4`** ve şema `surum: 4`; `v3`/`v2`
  verisi ilk açılışta okunup taşınır, eski olay kayıtlarına boş yaralanma
  alanları eklenir. JS/CSS varlık sürümü `?v=4` → `?v=5`.
- Test kapsamı **261 → 274 kontrol** (kaza tablosu, diyalog doğrulaması, kayıt
  ve istatistik blokları). Onay kuyruğu etiketi `Olay / iş kazası bildirimi`.

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


