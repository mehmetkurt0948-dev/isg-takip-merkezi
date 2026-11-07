# İSG Takip Merkezi — çalışma alanı (v4)

> İşyeri bazlı İSG takibi: giriş/roller, kurum (OSGB) kaydı ve kurum panosu,
> personel, dosya kontrolleri, çalışma planı, saha/DÖF, risk değerlendirmesi,
> zorunlu ekipli acil durum planı, ekip davetleri, onay kuyruğu ve mevzuat
> kapsamı.
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
| **İşyerleri** | Kurum şeridi (kurum adı, ad değiştir, tüm verileri sil), işyeri kartları (kurum, tehlike sınıfı, çalışan ve kontrol maddesi sayısı), kurum seçimli işyeri CRUD |
| **Personel listesi** | İşyeri bazında bloklar, sicil/TC/meslek/departman/şube/kıdem/telefon/cinsiyet kolonları, arama, detay açma, eğitim kayıtları, gerçek **XLSX şablonu** ve XLSX/CSV içe-dışa aktarma, "listeyi temizle" |
| **Sağlık takibi** | İşyeri hekimi sağlık kayıtları: personel, işyeri, tarih, doktor, kan grubu, alerji, kronik hastalık, ilaç, engel durumu, son muayene, çalışma yasağı, izinsizlik ve not alanları; hassas alanlar cihazda şifreli saklanır, kayıt ekleme/güncelleme yönetici ve yetkilide, silme yalnızca yöneticide. Personel veya işyeri silinse de muayene kayıtları silinmez: kişi adı, sicil ve işyeri adı kayda dondurulur, listede "silinmiş personel" rozetiyle okunmaya devam eder; silme onayında kaç kaydın korunduğu belirtilir; **tam personel listesi** (muayene kaydı olmayanlar dâhil, arama + durum + işyeri filtresi, kişi geçmişi ve kayıt düzenleme/silme), **üç gruplu katlanır kayıt formu**, **Excel şablonu / içe aktarma (ön izleme + onay) / dışa aktarma**, **işyeri başına ayrı ve şifreli çalışma kitabı** (`ISG.saglikCalismaKitabi.kitap(isyeriId)`, yükleme işyeri seçimi ister). **Erişim ve izolasyon:** liste, sayaç, arama, tarama özeti, çalışma kitabı ve Excel çıktısı **seçili işyeriyle** sınırlıdır (`#kapsam`); kayıtlar yalnız oturum sahibinin yetkili olduğu işyerlerinden döner, işyeri kimliği boş eski kayıtlar personelin işyeriyle eşleştirilir (aktarılan personelin eski kaydı yeni işyerine taşınmaz); görüntüleme izni (`ISG.yetki.saglikIzin()`) yazma izninden ayrıdır — OSGB Müdürü ve Görüntüleyici salt okunurdur, yetkisiz erişim denemeleri denetim izine yazılır |
| **Dosya kontrolleri** | İşyerine göre üretilen kontrol kataloğu (bölüm + madde), Var/Eksik/Yok/İncelenmedi durumları, yenileme tarihleri, 14 günlük uyarı lejantı, bölüm/durum/tarih filtreleri, sayfalama, DÖF oluşturma, **belge eki yükle / görüntüle / indir / kaldır** (belge başına ≤ 1 MB, `localStorage`) |
| **Çalışma planı** | İlk yardımcı ihtiyaç/mevcut karşılaştırması, yıllık plan kartları, plan kalemi CRUD, tamamlandı işaretleme, plan KPI'ları, **yıl filtresi**, **hazır Excel şablonu indir**, **Excel/CSV toplu yükleme (ön izleme + onay)**, **Excel'e aktar**, satır seçip **toplu silme** |
| **Saha ve DÖF** | Açık/geciken/doğrulama/kapatılan tespitler, öncelik-tür filtreleri, kapatma akışı, **iş kazası ve meslek hastalığı kayıt tablosu** (personel + sicil/departman, tanı bölgesi/türü, SGK hastalık grubu, etken, kök neden sınıfı ve açıklaması, kayıp gün, sağlık kuruluşu) ve CSV çıktısı, ramak kala ve diğer olay bildirimleri |
| **Yönetim raporu** | Tarih aralığı, açık/geciken iş, doğrulama bekleyen, dönemde tamamlanan, işyeri bazında karşılaştırma tablosu, Excel (CSV) çıktısı |
| **İstatistikler** | On iki özet KPI, **iş kazası / meslek hastalığı veri girişi ve ortak kayıt listesi** (tarihe göre sıralı; satırdan düzenle / kapat / sil, kapsam işyeriyle "Kaza bildir" ve "Meslek hastalığı bildir") ve iş kazası analizi: **aylık kaza sıklığı (sütun grafik)**, **KSO / KAO / KSH oranları ve 12 aylık oran tablosu**, **kök neden dağılımı**, **neden × vücut bölgesi ısı matrisi**, yaralanma bölgesi/türü, **şiddet sınıfı (SGK)**, **vardiya**, **haftanın günü**, işyeri, departman, kıdem ve iş günü kaybı dağılımları, en çok kazaya uğrayan personel; personel, eğitim, DÖF, risk ve belge dağılımları; kapsam filtresi |
| **Risk değerlendirmesi** | İşyeri başına son değerlendirme / en geç yenileme / olağan üst sınır, 6 rollü ekip listesi, rol bazlı **ekip üyesi ekle / değiştir / kaldır**, eksik rol uyarısı, **risk belgesi yükle / görüntüle / indir**, 5×5 risk kayıt tablosu |
| **Acil durum planı** | Her işyeri için plan kaydı **otomatik açılır** (`ap-<isyeriId>`, tarihler boş — sonradan doldurulur), çalışan sayısı, plan tarihi, **tarih denetimi** (hazırlanma / son yenileme zorunlu, takvimce geçerli, en geç yenileme tarihi), yenileme sınırı (tehlike sınıfına göre), **zorunlu dört ekipte gerekli / kayıtlı / onaylı mevcut** (yönetmelik oranlarından otomatik), rol bazlı **ekip üyesi ekle / değiştir / kaldır**, **plan belgesi yükle / görüntüle / indir**, plan/ekip kaydı |
| **Ekip ve davetler** | E-posta + rol + **kurum** + yetkili işyeri seçimiyle davet oluşturma, davet listesi ve iptal; **kullanıcılar ve yetkiler** bölümünde rol, kapsam, kurum ve **uzman sınıfı (A/B/C)**, **onay yetkilisi eksik** işyerleri listesi |
| **Mevzuat ve kapsam** | 20 başlıklı katalog (kanun/yönetmelik/tebliğ/rehber/standart), kategori ve konu araması, teyit durumu, seçili işyeri kapsam özeti, Mevzuat Bilgi Sistemi bağlantısı |
| **Onay kuyruğu** | Yetkili kullanıcıların yazma işlemlerinden doğan talepler: işlem özeti, işyeri, talep sahibi, **dağıtık onay yetkilisi** bilgisi, onayla / reddet, bekleyen sayısı rozeti, denetim izi |
| **Kurum denetim panosu** | Yalnızca **OSGB Müdürü** görür (salt okunur): kurumun işyeri sayısı, kullanıcı sayısı, **onay yetkilisi eksik işyeri** sayacı, bekleyen talep sayacı, işyeri başına uzman sayısı + onay durumu (tek uzman / onay zorunlu / yetkili eksik / uzman yok) + eşik sınıfı, son 20 talep ve kurum ekibi listesi |
| **Sistem yönetimi** | Yalnızca **Sistem Yöneticisi** (ve mevcut Yönetici) görür: kurum (OSGB) oluşturma/düzenleme, işyeri listesi (kurum, tehlike sınıfı, çalışan, personel, onay durumu) ve düzenleme, kullanıcı/rol/uzman sınıfı/atama yönetimi, rol yetki özeti tablosu, **sistem uyarı ve hata listesi** (onay yetkilisi eksiği, bekleyen talep, vadesi geçen kayıt, eşitleme hatası), bekleyen talepleri onaylama/reddetme, onay yetkilisi eksik işyerleri ve rapor bağlantıları |

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
| **Yönetici** | Tüm işyerleri; **ancak kullanıcıya açıkça işyeri atanmışsa yalnız atandığı işyerleri** (atama yoksa tümü) | Doğrudan yazar | Görür ve yönetir |
| **Sistem Yöneticisi** | Tüm işyerleri | Doğrudan yazar | Görür ve yönetir; **sistem yönetimi** paneliyle kurum, işyeri ve kullanıcı yönetimi |
| **OSGB Müdürü** | Kendi **kurumu** (`kurumId`) | Yok — salt okunur | Görmez, karar vermez; **kurum denetim panosu**nu görür; **Sağlık Takibi**'ni yönetici onaylı görüntüleme izniyle okur |
| **Yetkili** | Yalnızca atandığı işyerleri | Talebe dönüşür; **işyeri onay modeli** açıksa tek uzmanda doğrudan, çok uzmanda eşik sınıfındaki uzmanın onayıyla | Onay yetkilisiyse görür |
| **Görüntüleyici** | Yalnızca atandığı işyerleri | Yok (`salt-okunur` gövde sınıfı) | Görmez |

**Sistem Yöneticisi ile OSGB Müdürü bağımsızdır.** Sistem Yöneticisi
(`sistemYoneticisi`) kurum, işyeri ve kullanıcı yönetimini sistem genelinde
yapar ve onay kuyruğuna karar verir; kendi kurumuna bağlı değildir. OSGB
Müdürü (`osgbMuduru`) ise yalnız kendi kurumunu **salt okunur** izler: kayıt
oluşturamaz/değiştiremez/silemez, onay veremez, kullanıcı-rol yönetemez ve
sistem yönetimi panelini ne menüde görür ne de doğrudan `#sistem` adresiyle
açabilir. Yetki kararı arayüzde buton gizlemekle değil, `ISG.yetki` rol
tanımı (`yonetir` / `onaylar` / `saltOkunur`) ve depo sarmalayıcısı üzerinden
verilir; normal **Yetkili** hesabı `kullaniciKaydet` gibi yönetim işlemlerinde
"Bu işlem yalnızca yöneticilere açıktır" hatası alır.

**Kurum (OSGB) ve uzman sınıfı.** Her işyeri bir `kurumId` taşır; üst düzey
`kurumlar` listesi kurum kayıtlarını tutar. Yetkili kullanıcıda **uzman sınıfı**
(`uzmanSinifi`: `A` / `B` / `C`) tutulur ve onay eşiğiyle karşılaştırılır:

| Tehlike sınıfı | Onay yetkilisi olabilecek uzman sınıfı |
|---|---|
| Çok tehlikeli | A |
| Tehlikeli | A veya B |
| Az tehlikeli | A, B veya C |

**İki onay modeli.** `ayarlar.onayModeli` boş/`rol` iken bugünkü davranış sürer:
yönetici doğrudan yazar, diğer yazarların değişikliği talebe dönüşür. Değer
`isyeri` yapıldığında onay işyeri bazına iner: işyerinde **tek aktif uzman**
varsa o uzman doğrudan yazar; **birden çok uzman** varsa tehlike sınıfına uygun
sınıftaki uzman(lar) onay yetkilisidir ve diğerlerinin değişikliği talebe döner;
uygun sınıfta uzman yoksa talep **"onay yetkilisi eksik"** durumunda bekler ve
onaylanamaz. Pasif hesaplar onay yetkilisi sayılmaz. Model ayrı bir anahtarla
açıldığı için canlı veri tek hamlede davranış değiştirmez; anahtar silinirse
eski davranışa dönülür. `ISG.yetki.onayDurumu(isyeriId)` bu kararı
(`tekUzman` / `onayli` / `eksik` / `uzman-yok`) ve eşik sınıflarını döndürür;
onay kuyruğu, kurum panosu ve `tools/yetki-envanter.js` aynı hesabı kullanır.

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
- **Hesap değişiklikleri beklemeden gönderilir.** Yeni hesap eklemek, mevcut
  hesabı güncellemek/silmek ve e-posta koduyla şifre yenilemek değişikliğin hemen
  ardından ortak kayda yazmayı tetikler; eşitleme sürüyorsa kısa aralıklarla
  yeniden denenir. Böylece bir bilgisayarda açılan hesap diğerinde saniyeler
  içinde kullanılabilir. Gönderilemezse kullanıcı "değişiklik yalnızca bu
  cihazda" uyarısını görür; veri kaybı olmaz, değişiklik yerelde durur ve
  sonraki eşitlemede gider.
- **Hesap bu cihazda tanımlı değilse giriş ve şifre sıfırlama ortak kayda
  bakar.** E-posta yerelde bulunamazsa oturum hemen reddedilmez; açılış
  eşitlemesi sürüyorsa onun bitmesi beklenir, sonra ortak kayıt çekilip hesap
  orada doğrulanır. Ortak kayda da ulaşılamazsa mesaj "kayıtlı hesap yok" ile
  "ortak kayda ulaşılamadı" / "ortak kayıt hâlâ eşitleniyor" olarak ayrılır;
  kullanıcı ne yapması gerektiğini anlar.

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
| Acil durum planı yenileme | Az **6**, tehlikeli **4**, çok tehlikeli **2** yıl |
| Acil durum planı tarih denetimi | Hazırlanma **veya** son yenileme zorunlu; ikisi de varsa son yenileme hazırlanmadan eski olamaz; biçimi bozuk / takvim dışı / **ileri tarih** kaydı engeller. Vade geçmişi engellemez, gecikme olarak gösterilir; son tatbikat boşsa uyarı verilir (`ISG.acilPlanTarihKontrol`) |
| Zorunlu acil durum ekipleri | Söndürme / kurtarma / koruma: az **1/50**, tehlikeli **1/40**, çok tehlikeli **1/30**; ilk yardım: **1/20 · 1/15 · 1/10**; kesir yukarı yuvarlanır. Yasal bir "en az 3 kişi" tabanı **yoktur** (kaldırıldı: 1 kişilik az tehlikeli işyerinde 1 kişi yeter). Çalışan sayısı veya tehlike sınıfı yoksa sayı uydurulmaz, hesap geçersiz sayılır (`ISG.acilEkipGereksinimi`, `ISG.acilEkipDurumu`) |
| Uzman sınıfı / onay eşiği | Onay yetkilisi olabilecek en düşük sınıf: çok tehlikeli **A**, tehlikeli **A–B**, az tehlikeli **A–C**. Bu tablo uygulamanın **değişiklik onayı** kuralıdır, mevzuatın görevlendirme şartı değildir (`ISG.ONAY_ESIGI`) |
| Belge uyarı eşiği | Yenilemeye ≤ 14 gün: sarı, < 0 gün: kırmızı |
| İş kazası bildirimi | SGK'ya en geç **3 iş günü** içinde; iş günü kaybı 0–365 gün |
| İş kazası istatistiği | Kıdem = işe başlama ↔ kaza tarihi (tam yıl); şiddet aralıkları 0 / 1–3 / 4–7 / 8–14 / 15+ gün |
| Risk skoru | Olasılık × şiddet; 15+ kritik, 10–14 yüksek, 5–9 orta, < 5 düşük |
| İlk yardımcı ihtiyacı | Çalışan / 15 (az: 20, çok tehlikeli: 10), en az 1 |
| Kontrol kataloğu | 110 temel madde + çok tehlikelide 15 ek + her 100 çalışan için 5 ek |

## 4. Dosya düzeni

```text
isg-takip-merkezi/
├─ index.html                 # iskelet, SVG ikon sprite, <dialog> formları
├─ 404.html                   # Pages için "sayfa bulunamadı" ekranı
├─ manifest.webmanifest       # PWA kimliği, tema rengi, simgeler
├─ .nojekyll                  # GitHub Pages Jekyll işlemesini kapatır
├─ assets/
│  ├─ css/style.css           # açık tema, bileşenler, duyarlı + yazdırma
│  ├─ img/                    # favicon.svg + ikon-192/512 + apple-touch-icon
│  └─ js/
│     ├─ varsayilan-veri.js   # boş tohum (BOS_VERI), örnek/tanıtım verisi, katalog üretimi, mevzuat
│     ├─ kontrol-listeleri.js # ÜRETİLMİŞ: işyeri bazlı hazır dosya kontrol listeleri (Word/Excel çıktısı)
│     ├─ depo.js              # alan kuralları, localStorage, CRUD, görev motoru, uzman sınıfı, acil ekip
│     ├─ bicim.js             # tarih/rozet/CSV/sayfalama yardımcıları
│     ├─ yetki.js             # oturum, roller (Sistem Yöneticisi, OSGB müdürü), kurum kapsamı, onay eşiği/modeli, onay kuyruğu
│     ├─ excel.js             # bağımlılıksız XLSX yazıcı/okuyucu (ZIP + OpenXML)
│     ├─ personel-toplu.js    # personel Excel/CSV şablonu, ayrıştırma, toplu kayıt
│     ├─ plan-toplu.js        # yıllık çalışma planı: şablon üretimi, Excel/CSV ayrıştırma, toplu kayıt/silme, XLSX çıktısı
│     ├─ saglik-takip.js      # sağlık kayıtları kasası (hassas alanlar cihazda şifreli)
│     ├─ saglik-toplu.js      # sağlık Excel şablonu, içe aktarma analizi, dışa aktarma
│     ├─ saglik-calisma-kitabi.js # sağlık çalışma kitabı yardımcıları
│     ├─ bulut.js             # isteğe bağlı Supabase eşitleme katmanı (REST)
│     ├─ bulut-kimlik.js      # bulut oda kodu / anahtar yardımcıları
│     ├─ sayfalar.js          # Genel bakış, İşyerleri, Personel
│     ├─ sayfalar-kayit.js    # Dosya kontrolleri, Çalışma planı, Saha/DÖF
│     ├─ sayfalar-rapor.js    # Rapor, İstatistik, Risk, Acil durum, Ekip, Kurum panosu, Mevzuat, Onaylar
│     ├─ giris.js             # giriş katmanı, davet kabulü, e-posta kodlu şifre sıfırlama
│     └─ uygulama.js          # yönlendirme, formlar, filtreler, XLSX/CSV, yedekleme
├─ tools/
│  ├─ kontrol.js              # jsdom duman testi (929 kontrol)
│  ├─ belge-test.js           # belge eki (yükle/indir/sil, 1 MB sınırı) testi (27 kontrol)
│  ├─ acil-tarih-dogrula.js   # bütün işyerlerinde acil plan tarihi: depo ↔ diyalog ↔ kart ↔ bulut
│  ├─ acil-tarih-canli.js     # SALT OKUNUR: gerçek Supabase satırında aynı doğrulama (canlı veri)
│  ├─ kontrol-listesi.js      # Word (.docx) / Excel (.xlsx) kontrol listesini hazır şablona çevirir
│  ├─ kontrol-listesi-kaynaklari.json  # Excel dosya adı → işyeri kodu/ad eşleşmesi (toplu dönüşüm)
│  ├─ kontrol-listeleri/      # dönüştürülmüş işyeri listeleri (ASKI-1.json, ASKI-2.json, …)
│  ├─ personel-aktar.js       # kurum personel Excel'ini yedek + delta ile işyerine aktarır (dry-run varsayılan)
│  ├─ plan-aktar.js           # yıllık plan Excel'ini aynı güvenlik sırasıyla aktarır
│  ├─ saglik-aktar.js         # sağlık takip Excel'ini saglikTakip yığınına aktarır (analiz / --yaz)
│  ├─ yetki-envanter.js       # SALT OKUNUR: işyeri başına uzman sınıfı ve onay yetkilisi envanteri
│  ├─ varlik-surum.js         # varlık sürüm damgası (yaz / --denetle)
│  ├─ hooks-kur.js            # git kancalarını kurar (prepare)
│  ├─ ikon.js                 # favicon.svg → PNG simgeler
│  ├─ demo-veri.js            # tanıtım verisi üreticisi
│  ├─ yayin-hazirla.js        # yayin/ klasörünü üretir
│  └─ yayin-dogrula.js        # canlı sürümün yerelle aynı olduğunu doğrular
├─ test/                      # modül testleri (jsdom): kullanıcı, sağlık, senkron, giriş, onay
├─ package.json               # npm test / test:* / envanter / surum / yayin
└─ README.md
```

Kod bilinçli olarak ES5 tarzı (IIFE + `var`) yazıldı: derleme adımı olmadan,
doğrudan `file://` veya herhangi bir statik sunucuda çalışır.

## 5. Veri modeli (localStorage: `isgtakip.v4`)

```js
{
  surum: 4,
  ayarlar: { kurum, kullanici, gorev, sonMevzuatKontrolu, onayModeli },
  kurumlar: [{ id, ad, kisa, telefon, eposta, adres, not }],
  kullanicilar: [{ id, adSoyad, eposta, sifre, rol, gorev, kurumId, uzmanSinifi,
                   isyerleri: [], aktif, sonGiris }],
  isyerleri: [{ id, kurumId, ad, tehlikeSinifi, calisanSayisi, sgkSicil, yetkili, adres, sektor, ana }],
  personel:  [{ id, isyeriId, sicil, adSoyad, tc, meslek, departman, grupKodu, sube, iseBaslama, telefon, cinsiyet, durum }],
  egitimler: [{ id, personelId, isyeriId, tur, tarih, sureSaat, egitmen, gecerlilik }],
  dosyalar:  [{ id, isyeriId, no, bolum, madde, durum, sorumlu, yenileme, kontrolTarihi, aciklama }],
  belgeler:  [{ id, kaynak, kaynakId, dosyaId?, isyeriId, ad, boyut, tur, tarih, icerik }],
  planlar:   [{ id, isyeriId, yil, sira, siraExcel, anaBaslik, faaliyet, sorumlu, aciklama,
                aylar: [1..12], ay, gun, durum, takipTarihi, kaynak, kaynakSatir }],
  tespitler: [{ id, isyeriId, tespit, konum, sorumlu, oncelik, tur, termin, durum, dogrulama, not }],
  riskler:   [{ id, isyeriId, tehlike, alan, olasilik, siddet, onlem, sorumlu, termin, durum }],
  olaylar:   [{ id, isyeriId, tur, tarih, yer, personelId, aciklama, kokNeden, durum,
                kayipGun, vucutBolgesi, yaralanmaTuru, saglikKurulusu,
                siddet, vardiya, hastaneSevk, istirahatBaslangic, istirahatBitis }],
  riskEkipleri: [{ id: 're-<isyeriId>', isyeriId, sonDegerlendirme, enGecYenileme, uyeler: { isveren, uzman, hekim, temsilci, destek, birim }, uyeIdleri }],
  acilPlanlar:  [{ id: 'ap-<isyeriId>', isyeriId, hazirlanma, sonYenileme, tatbikat, ekip: [{ rol, ad, personelId }] }],
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

**Kurum (OSGB) kapsamı.** `kurumlar` üst düzey listesi OSGB kayıtlarını tutar;
her işyeri `kurumId` ile bir kuruma bağlanır (boş `kurumId` "kurum dışı / bağımsız
işyeri" demektir). OSGB Müdürü rolündeki hesap `kurumId` taşır ve yalnızca o
kurumun işyerlerini, personelini, kayıtlarını ve şifresiz kullanıcı listesini
görür; başka kurumun kaydı hiçbir listede görünmez (`ISG.yetki.kapsam`,
`ISG.yetki.kapsamliVeri`). Kullanıcı `uzmanSinifi` alanı onay eşiğiyle
karşılaştırılır; tanınmayan ya da boş değer "sınıf belirtilmedi" sayılır ve o
hesap onay yetkilisi olmaz (`ISG.uzmanSinifiKodu`, `ISG.ONAY_ESIGI`).

`acilPlanlar[].ekip` zorunlu dört ekibin (söndürme, kurtarma, koruma, ilk
yardım) üyelerini `rol` + `personelId` ile taşır; ekip tablosunun gerekli /
kayıtlı / onaylı sayıları bu diziden ve işyerinin çalışan sayısından türetilir,
ayrı bir yerde saklanmaz.

**Acil plan ve risk ekibi kayıtları işyeri başına TEKTİR ve kalıcı kimlik taşır**
(`id: 'ap-<isyeriId>'` / `'re-<isyeriId>'`). Üç tarih (`hazirlanma`,
`sonYenileme`, `tatbikat`) bağımsız alanlardır; biri diğerinin yerine yazılmaz,
boş alan boş kalır. Okuma tek kapıdan yapılır: `ISG.acilPlanKaydi(veri, isyeriId)`.
Geçerlilik hesabı da tek yerdedir (`ISG.acilPlanOzeti`): dayanak **son yenileme**,
o yoksa **ilk hazırlanma**; tatbikat tarihi yenileme yerine sayılmaz. Kayıt
ekranı, mevcut durum kartı, Excel çıktısı ve doğrulama araçları aynı kaydı ve aynı
hesabı okur. Eski sürümlerde bu kayıtlar `id` üretmeden yazılıyordu; bulut
birleşimi kimliksiz kaydı korumadığı için kaydedilen tarih eski kopyaya
dönebiliyor, aynı işyerinde ikinci kopya birikebiliyordu. `veriTamamla()` içindeki
v11 göçü kimliksiz kayıtları işyeri kimliğinden türetilen kalıcı kimlikle
eşitler, aynı işyerine ait kopyaları tek kayda indirir ve ekip üyelerini
mükerrer olmadan birleştirir.

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

Çalışma planı durumu (`planlar[].durum`) dokuz kaydedilen artı bir türetilmiş
değerden oluşur: `yapilacak`, `devam`, `belgeBekliyor`, `ertelendi`,
`tamamlanmadi`, `planlanmadi`, `tamamlandi`, `iptal`, `kapsamDisi` ve
`gecikti`. Kalıcı olarak yalnızca ilk dokuzu yazılır; `gecikti` (Gecikti)
`ISG.planDurumu(plan)` tarafından "takip tarihi geçmiş, kayıt kapanmamış"
varsayımıyla üretilir. Tek tanım kaynağı `ISG.PLAN_DURUMLARI`dır
(`ad` / `sinif` / `secilebilir` / `kapanis`); biçim tarafındaki karşılıkları
`bicim.js` durum eşlemesi taşır. Kapanmış durumlar `ISG.PLAN_DURUM_KAPALI`
(tamamlandı, iptal, kapsam dışı), yıl kartının kısa listesinde gösterilmeyenler
`ISG.PLAN_DURUM_TAKIPSIZ` (planlanmadı, iptal, kapsam dışı) ile belirlenir.
Eski kayıtlardaki `takvimde`, `planlandi`, `bekliyor` ve elle yazılmış
`Gecikti` değerleri ilk açılışta `ISG.planDurumNormal` ile güncel ada döner;
veri anahtarı (`isgtakip.v4`) değişmez.

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
npm test                     # 816 kontrol + belge testi (27 kontrol), başarısızda çıkış kodu 1
npm run test:belge           # yalnızca belge eki testi (27 kontrol)
npm run test:onay            # onay motoru + onay arayüzü (eşik, dağıtık yetkili, "yetkili eksik")
npm run envanter             # SALT OKUNUR: işyeri başına uzman sınıfı / onay yetkilisi dökümü
npm run surum:denetle        # varlık ?v= damgaları yerelle uyuşuyor mu
```

Test; yükleme, **boş açılış ve örnek veri temizliği** (0 kayıt, boş ekran
dolaşımı, mezar taşı üretimi, `ornekYukle()` ve düğme akışı), **giriş/oturum**,
**rol ve işyeri kapsamı**, **kurum (OSGB) kapsamı ve OSGB Müdürü salt okunur
panosu**, **uzman sınıfı / onay eşiği** (tek uzman doğrudan yazar, çok uzmanda
eşik sınıfı onaylar, uygun sınıf yoksa "onay yetkilisi eksik"),
**onay kuyruğu ve denetim izi**, iş kuralları, kapsam filtresi, personel CRUD,
eğitim geçerliliği, dosya filtreleri ve sayfalama, DÖF oluşturma, plan
tamamlama, **yıllık plan şablonu / Excel toplu yükleme / seçimle ve yıl bazında
toplu silme / XLSX gidiş-dönüşü**, saha, risk/acil kayıtları ve belge ekleri,
**acil durum planı tarih denetimi ile zorunlu dört ekibin gerekli/kayıtlı/onaylı
mevcudu**, istatistikler, rapor,
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

## 6.3. İşyeri kontrol listesini uygulamaya ekleme (Word / Excel)

İşyerleri için iki kaynak paylaşılıyor: Word dosya kontrol listesi
(ABB-OSGB-KL-001 şablonu) ve Excel **"İSG DOSYA KONTROL CHECKLİSTİ"**. İkisi de
aynı hazır şablona (`tools/kontrol-listeleri/<KOD>.json`) dönüştürülür:

```powershell
# 1) Tek dosyayı şablona çevir → tools/kontrol-listeleri/<KOD>.json + assets/js/kontrol-listeleri.js
node tools/kontrol-listesi.js donustur "C:\...\ASKI-1 DOSYA KONTROL LISTESI.docx" ASKI-1
node tools/kontrol-listesi.js donustur "C:\...\halk ekmek.xlsx" HALK-EKMEK --isyeri="Halk Ekmek"

# 1b) Klasördeki tüm Excel listelerini birden çevir (kod/ad eşleşmesi kaynak dosyasından)
node tools/kontrol-listesi.js toplu "C:\...\kontrol listeleri" `
  --kaynaklar=tools/kontrol-listesi-kaynaklari.json

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

Excel'de (`İSG Dosya Checklist` sayfası) üst bilgi satırları — `İşyeri / Birim`,
`Kontrol Tarihi` (Excel seri tarihi ISO'ya çevrilir), `Kontrolü Yapan`,
`İSG Uzmanı` — ve `No | Ana Başlık | Kontrol Edilecek Belge / Kayıt | Durum |
Açıklama / Eksiklik | Kontrol` tablosu okunur. `Ana Başlık` bölüm adı olur,
`Durum` işarete döner: **Var / Uygun → VAR**, **Eksik → YOK**,
**Güncellenecek → GUNCELLENECEK**, **Uygulanamaz → KD (kapsam dışı)**;
"Açıklama / Eksiklik" hücresi maddenin `not` alanına taşınır. Sayfadaki "Özet"
sekmesi okunmaz; özet satırı kontrol sayımlarından yeniden üretilir.

Uygulamada **Dosya kontrolleri → Hazır kontrol listesi**: işyeri ve liste
seçilir; önizleme "kaç madde eklenecek / kaçı zaten açık / kaçı eksik işaretli"
bilgisini gösterir. Eklenen her madde `bölüm`, `durum` (VAR→Var,
YOK/GÜNCLENECEK→Eksik, K-D/Uygulanamaz→Yok), `kontrol tarihi` ve `Yasal
dayanak: …` ya da Excel'deki eksiklik notuyla açılır, kaydına `sablon: <KOD>`
etiketi yazılır. Aynı liste ikinci kez eklenirse maddeler çoğalmaz (Türkçe
duyarlı metin anahtarıyla atlanır — aynı madde iki bölümde tekrarlı yazılıysa da
tek kayıt açılır). Yönetici dışında kayıt yapan, 107 tekil talep yerine **tek bir
onay talebi** üretilecek şekilde yetki kuyruğuna `listeUygula` olarak girer.

Katalogda bugün **18 işyeri listesi / 1.965 madde** var: Word'den ASKİ-1;
Excel'den ASKİ-2, Aybel, Ayulaş, Çevre Koruma ve Kontrol Dairesi (+kadrolu),
Destek Hizmetleri, Diğer Daire Başkanlıkları, Güvenlik, Halk Ekmek, İtfaiye,
Makine İkmal ve Fen İşleri, Park ve Bahçeler (+kadrolu), Sosyal Hizmetler,
Ulaşım ve Veterinerlik (Aypaş + kadrolu). İşyeri adı bu adlarla eşleşen listeyi
otomatik önerir; birden fazla liste uygunsa (ör. kadrolu / daire) önizlemede
"Bu işyeri adına N liste uygun" yazılır ve liste kutusundan değiştirilebilir.

Yeni bir işyeri listesi geldiğinde tek gereken, komutu yeni bir `KOD` ile
çalıştırmaktır: `tools/kontrol-listeleri/*.json` dosyalarının tamamı
`assets/js/kontrol-listeleri.js` içine yeniden yazılır.

## 6.4. Yıllık çalışma planını Excel'den yüklemek (şablon → ön izleme → onay)

Çalışma planı ekranının başlık şeridinde **Örnek Excel şablonunu indir**,
**Excel'den toplu yükle**, **Excel'e aktar**, **Toplu sil** ve **Plan faaliyeti
ekle** düğmeleri; tablonun üstündeki seçim çubuğunda **Tümünü seç**,
**Seçilenleri sil** ve **CSV indir** düğmeleri bulunur. **Plan yılı** kutusu hem
listeyi hem de yüklemenin işleneceği yılı belirler.

```powershell
# 1) Ekrandan "Örnek Excel şablonunu indir" → Yillik-Calisma-Plani-Sablonu.xlsx
# 2) "Yıllık Çalışma Planı" sayfasını doldur (Kılavuz sekmesi okunmaz)
# 3) "Excel'den toplu yükle" → dosyayı seç → ön izleme → "Kaydedilecekleri ekle"
```

**Sütunlar (17):** `Sıra No | Ana Başlık | Çalışma Konusu | Sorumlu | Açıklama |
Ocak … Aralık`. Başlık eşleşmesi Türkçe duyarlıdır ve eşanlamlıları da kabul
eder (`Faaliyet/Konu/Yapılacak İş`, `Bölüm/Kategori/Grup`, `Notlar`,
`Sorumlu Birim` …). Ay grubu iki satırlıysa (`AYLAR` üstünde, `1…12` altında)
iki satır birlikte okunur. Dosya seçici `.xlsx` ve `.csv` kabul eder.

**Ayrıştırma kuralları** (`assets/js/plan-toplu.js` → `ISG.planToplu.analizEt`):

- **Yıl** dosya içindeki serbest metinden bulunur (`2026 Yılı Çalışma Planı`,
  `2026-2027 Yıllık Çalışma Planı`, `Yıl: 2026`); bulunursa ön izlemedeki yıl
  alanına yazılır. Kullanıcı iş yerini veya yılı değiştirirse mükerrer denetimi
  o kapsam için **anında yeniden koşar** (sayımlar tazelenir, dosya yeniden
  okunmaz). Dosyada yıl bulunamazsa ekranın mevcut yılı kullanılır; yılı
  belirsiz kayıtlar yalnızca **Tüm yıllar** görünümünde listelenir ve tabloda
  "N kaydın yılı belirsiz" uyarısı çıkar.
- Başlık satırı ilk 25 satırda aranır; bulunamazsa "Dosyada plan tablosu
  başlığı bulunamadı" hatası verilir ve hiçbir kayıt yazılmaz.
- Yalnızca numara/başlık içeren satırlar **ana başlık** sayılır, altındaki
  faaliyetlere `anaBaslik` olarak yazılır. `HAZIRLAYANLAR`, `ONAYLAYAN`, imza,
  `Doküman No`, `Revizyon`, `Sayfa` ve tekrar eden tablo başlığı satırları
  ayıklanır; sayıları ön izlemede "Ayrıştırma notu" olarak yazılır.
- **Mükerrer** denetimi iş yeri + yıl kapsamında, `Çalışma Konusu + Sorumlu`
  ikilisiyle (Türkçe duyarlı normalizasyonla) yapılır; hem dosya içi tekrarlar
  hem uygulamada zaten açık kayıtlar "Mükerrer" olarak raporlanır.
- `Çalışma Konusu` boş satır **hatalı**dır; 180 karakterden uzun faaliyetler
  kısaltılır ve uyarı olarak yazılır; `Örnek:` ile başlayan satırlar atlanır.
- Ay hücresindeki her işaret planlanmış sayılır; `-`, `yok`, `hayır`, `0`
  planlanmamış sayılır. Hiç ay işaretlenmeyen faaliyet uyarıyla, ay bilgisi
  olmadan kaydedilir.
- Dosyadaki `İşyeri` sütunu **okunmaz**: kayıtlar daima ekranda seçilen iş yerine
  ve seçilen yıla yazılır (`ISG.depo.planTopluEkle` tek iş yeri + tek yazım).
- **Yazma yalnız ön onaydan sonra** yapılır; `Vazgeç`/kapatma hiçbir kayıt
  bırakmaz, tekrar yükmede "Kaydedilecek satır" 0 olur. Yetkisiz kullanıcı
  akışında kayıt doğrudan yazılmaz, onay kuyruğuna bekleyen talep düşer.

**Toplu silme** iki kapsamla çalışır: *tabloda seçilen satırlar* veya *seçili iş
yerinin seçili yılındaki tüm kayıtlar* (`ISG.depo.planTopluSil({ isyeriId, yil,
idler })`). `isyeriId` zorunludur; `yil` ile `idler` birlikte verilirse **kesişim**
silinir, hiçbiri verilmezse işlem reddedilir — başka iş yerinin kayıtlarına hiçbir
koşulda dokunulmaz ve kaydı olmayan yıl için `silinen: 0` döner. Diyalog silinecek
kayıt sayısıyla birlikte **kalan kayıt sayısını** da yazar; tabloda seçim yoksa
"seçtiklerim" seçeneği açılmaz. "Bu işlemin geri alınamayacağını anladım."
işaretlenmeden Sil düğmesi açılmaz; her iki toplu işlem de (`planTopluEkle`,
`planTopluSil`) yetki sarmalayıcısından geçtiği için denetim izine iş yeri,
faaliyet sayısı/yıl özetli kayıt düşer.

**Excel'e aktar** ekrandaki (yıl ve iş yeri kapsamında süzülmüş) listeyi şablonla
aynı 17 sütunda `yillik-calisma-plani-YYYYMMDD.xlsx` adıyla yazar; indirilen dosya
doldurulup geri yüklenebilir — test bu gidiş-dönüşü doğrular.

## 6.5. Toplu personel yükleme (şablon → ön izleme → onay) ve Excel aktarımı

Personel listesi bütün iş yerlerinde aynı standarttaydı; sürüm 2.16.0 ile bu
standart **içe aktarmada da** tek kaynak haline geldi. Ayrıştırma, doğrulama,
mükerrer ve kayıt kuralları arayüzden ayrılmadı (`assets/js/personel-toplu.js`,
`ISG.personelToplu`) — aynı kuralları geliştirme aracı da (`tools/personel-aktar.js`)
kullanır, böylece "arayüzde görünen" ile "veritabanına yazılan" birebir aynıdır.

**Standart on bir sütun** (`ISG.personelToplu.SUTUNLAR` / `BASLIKLAR`):

```
Sicil No · Ad Soyad · T.C. Kimlik No · Mesleği · Departman · Grup Kodu Açıklama ·
Şube · İşe Başlama Tarihi · Kıdem Tarihi · Cep Telefonu · Cinsiyet
```

| Düğme / alan | Ne yapar |
| --- | --- |
| **Örnek Excel şablonunu indir** | `Personel-Sablonu.xlsx` — `Personel` sayfası (başlıklar ilk satırda, örnek satır ikinci satırda, sütun genişlikleri ve tarih/metin ipuçları) + `Kılavuz` sayfası. Bütün kurum ve iş yerlerinde aynı dosya üretilir. |
| **Excel'den toplu yükle** (kişi başına tek kayıt) | Tek personeli şablondaki alanlarla kaydeder. |
| **Toplu personel yükle** | `ISG.excel` ile XLSX/CSV okunur (mobilde `input[type=file]` + yerel ayrıştırıcı), hedef iş yeri seçilir, **satır satır ön izleme** açılır, kullanıcı **"Kaydedilecekleri ekle"** dedikten sonra tek kalıcı yazımda eklenir. |
| **Güncel listeyi XLSX indir** | Ekrandaki personeli on bir sütun + İşyeri + Durum ile yazar; indirilen dosya düzenlenip geri yüklenebilir. |

Kurallar (`analizEt` → `uygula`):

- **Mevcut kayıtlar korunur:** toplu yükleme yalnızca **yeni** kayıt ekler; hiçbir
  kayıt güncellenmez veya silinmez. Aynı dosya tekrar yüklenirse tek kayıt bile
  çıkmaz, satırlar **Mükerrer** olarak işaretlenir ve onay düğmesi kapanır.
- **Mükerrer sırası:** önce **T.C. Kimlik No**, yoksa **Sicil No**, ikisi de boşsa
  **Ad Soyad** (gerekçesiyle birlikte). Dosya içi yineleneler de mükerrer sayılır.
- **İş yeri izolasyonu:** kayıtlar daima ekranda seçilen iş yerine yazılır;
  dosyadaki "İşyeri" sütunu okunmaz. Aynı kimlik başka bir iş yerinde kayıtlıysa
  **uyarı** verilir ama listeler ayrı tutulur. Yetkisiz kullanıcı akışında kayıt
  doğrudan yazılmaz, onay kuyruğuna bekleyen talep düşer (`personelTopluEkle`
  `yetki.js`-te yazma işlemi ve iş yeri ilk argümandır).
- **Hatalı satır kaydedilmez:** Ad Soyad boş, TC 11 hane değil/0 ile başlıyor,
  tarih tanınmıyor veya Cinsiyet bilinmiyorsa satır **Hatalı**dır; nedeni satır
  numarasıyla ön izlemede yazar. Başarılı / mükerrer / hatalı sayıları ayrı yazılır.
- **Kıdem Tarihi** personel düzenleme formunda da tutulur (`kidemTarihi`), böylece
  şablondan gelen tarih sonraki düzenlemede sessizce silinmez.

### 6.5.1. Geliştirme aracı: `tools/personel-aktar.js`

Kurumdan gelen büyük personel listelerini (ör. ASKİ-1'in 1140 kişilik listesi)
incelemek, **yedek alarak** hedef iş yerine aktarmak ve izolasyonu kanıtlamak için
çalıştırma zamanı köprüsü — `tools/plan-aktar.js` ile aynı kalıp:

```bash
# 1) KURU DENEME (varsayılan): hiçbir yere yazmaz, raporlar + yükleme dosyası üretir
node tools/personel-aktar.js "Aski - 1.xlsx" --isyeri="Aski - 1" --bulut \
     --hazirla=ASKI-1-personel.xlsx --rapor=aktarim-raporu.txt

# 2) SANDIK: demo veritabanında yazma denemesi + izolasyon/damga denetimi
node tools/personel-aktar.js liste.xlsx --isyeri=iy5 --fixture

# 3) GERÇEK AKTARIM: yedeği alır, deltasını yazar, bulutu yeniden okuyup doğrular
node tools/personel-aktar.js "Aski - 1.xlsx" --isyeri="Aski - 1" --bulut --yaz
```

Güvenlik sırası araçta da aynıdır: `--isyeri` tek eşleşmeyle çözülür (belirsizse
işlem reddedilir), bulut satırı **okunur okunmaz** `yedek-personel/isg-veri-<zaman>.json`
yedeklenir, kayıt `ISG.depo.personelTopluEkle` üzerinden (arayüzle aynı yol) yazılır,
yazmadan hemen önce satır yeniden okunur — eşzamanlı değişiklik varsa tam yığın yerine
**yalnızca yeni kayıt deltası** taze yığına uygulanır. Rapor şunları kanıtlar: hedef
iş yeri personel sayısı önce/sonra, **diğer iş yerlerinin personeli ve tüm diğer
koleksiyonların bayt bayt aynı kaldığı**, değişen mevcut eşitleme damgası `0` ve
silinen mezar taşı `0`. `--denetim-yok` verilmezse denetim izine
"Toplu personel yükleme · N personel" kaydı düşer.



## 6.6. Sağlık kayıtlarını Excel'den yüklemek ve dışa aktarmak

Sağlık Takibi ekranında üç Excel işlemi vardır:

| Düğme | Ne yapar? |
|---|---|
| **Şablon indir (.xlsx)** | `ISG.excel` ile gerçek XLSX üretir: `Sağlık Kayıtları` (15 sütun + örnek satır) ve `Kılavuz` sayfaları. İnternet/CDN gerekmez. |
| **Sağlık kaydı Excel'den yükle** | `.xlsx` dosyasını okur, kişiyi önce **Sicil No** sonra **Ad Soyad** ile eşleştirir, satırları doğrular ve **hiçbir şey yazmadan** ön izleme diyaloğu açar. |
| **Excel'e aktar** | Kapsamdaki sağlık kayıtlarını (çözülmüş hâliyle) XLSX olarak indirir; dosya yeniden yüklenebilir. |

Ayrıca **Excel listesini yükle** düğmesi işyeri hekiminin beş sekmeli çalışma
kitabını (TAM LİSTE, YÜKSEK RİSKLİ MESLEKLER, ÇALIŞMASI UYGUN DEĞİLDİR, SAĞLIK
TARAMALARI EKSİK OLANLAR, MALULİYETİ OLANLAR) okur. Bu liste **işyeri başına
ayrı** saklanır ve yükleme **işyeri seçimini zorunlu** kılar:

- Kayıt `isgtakip.saglik.kasa` içindeki `calismaKitaplari[]` dizisinde,
  kimliği `ck-<isyeriId>` olacak şekilde tutulur; satırlar `sg2:` şifreli gövde
  hâlindedir (düz metin ad/tanı kasada durmaz).
- Okuma tek kapıdan yapılır: `ISG.saglikCalismaKitabi.kitap(isyeriId)`; kapsam
  dışı işyeri için `null` döner. Ekran kitabı **yalnız seçili işyerinde** açar;
  işyeri seçilmemişse satır basılmaz, yalnız `#saglik-kitap-ozet` özeti gösterilir.
- Dosyada "İşyeri" sütunu varsa satır seçili işyeriyle eşleşmiyorsa ayrıca
  süzülür; işyeri bağı olmayan **eski tek-kitap kaydı hiçbir görünüme taşınmaz**
  (sahibine bildirilir, "Eski kaydı sil" ile kaldırılır).

Ön izleme diyaloğunda **Dosya satırı / Kaydedilecek / Mükerrer / Hatalı** sayıları
ve satır satır neden listelenir. Kayıtlar yalnızca **"Kaydedilecekleri ekle"**
onayından sonra `ISG.saglikTakip.kaydet` üzerinden yazılır; böylece hassas
alanların şifrelenmesi, yönetici denetimi ve günlük kaydı atlanmaz.

Kurallar:

- **Zorunlu:** `Muayene Tarihi` (YYYY-AA-GG veya GG.AA.YYYY) ve personel eşleşmesi.
- Aynı personel + aynı muayene tarihi **mükerrer** sayılır, ikinci kez yazılmaz
  (dosya içinde tekrar eden satırlar da).
- **Hatalı** satırlar: personel bulunamadı/aynı sicil veya ad birden çok kişide,
  tarih okunamadı, personelin işyeri yok. Hatalı satır kaydedilmez; nedeni yazılır.
- **İşyeri sütunu okunmaz:** kayıt her zaman kişinin kendi işyerine yazılır.
- Aynı ad birden çok personelde varsa satıra **Sicil No** yazılmalıdır.
- Sağlık kasası genel bulut eşitlemesine dâhil değildir; içe/dışa aktarma
  dosyaları kişisel sağlık verisi içerir, paylaşımı sınırlandırılmalıdır.

Modül `assets/js/saglik-toplu.js` (`ISG.saglikToplu`) altındadır; `analizEt`,
`uygula`, `sablonSayfalar`, `sablonIndir`, `disaAktarSayfalar`, `disaAktar` ve
`onizlemeSatirlari` arayüzden bağımsız test edilir (`test/sagliktoplutest.js`).

### 6.6.1. Geliştirme aracı: `tools/saglik-aktar.js`

İşyeri hekiminden gelen sağlık takip Excel'ini uygulamanın kendi `saglikTakip`
yığınına aktaran köprü (`personel-aktar.js` ile aynı kalıp; modüller jsdom
içinde yüklenir, yani şifreleme ve kayıt kuralları arayüzdekiyle aynıdır):

```bash
# 1) ANALİZ (varsayılan): hiçbir yere yazmaz, rapor üretir
node tools/saglik-aktar.js "saglik.xlsx" --rapor=saglik-raporu.txt

# 2) Buluttaki gerçek veri üzerinden analiz + örnek kayıt
node tools/saglik-aktar.js saglik.xlsx --bulut --sinir=40

# 3) YAZMA: yedeği alır, deltasını yazar
node tools/saglik-aktar.js saglik.xlsx --bulut --yaz
node tools/saglik-aktar.js saglik.xlsx --bulut --yaz --sifirla   # önceki aktarımı tazele
```

- **Eşleştirme sırası** T.C. Kimlik No → Sicil No → Ad Soyad; eşleşmeyen kişi
  raporlanır ve **kişisiz sağlık kaydı açılmaz**.
- Kişi başına **yıl başına bir kayıt** üretilir (tarih doluysa); `Sonuç` →
  `sonMuayene`, sevk → `calismaYasagi`, meslek → `calismaSesi`. Diğer sayfalar
  (YÜKSEK RİSKLİ, MALULİYET …) eşleşen kişinin kaydına bayrak/not olarak işlenir.
- Aynı `personelId + tarih` ikilisi **mükerrer** sayılır, ikinci kez yazılmaz.
- `--yaz` en az bir veri kaynağı (`--bulut` veya `--yerel=veri.json`) ister;
  `--sifirla` yalnızca bu araçla açılmış kayıtları siler, elle girilenlere
  dokunmaz. `--isyeri=` verilirse aktarım tek iş yeriyle sınırlanır.

## 6.7. Yetki envanteri (salt okunur): `tools/yetki-envanter.js`

Onay modelini açmadan önce "hangi işyeri tek uzmanlı (doğrudan yazma) kalacak,
nerede onay yetkilisi eksik" sorusunu yanıtlar. Demo verisi ya da bir JSON
yedeği üzerinde çalışır; **hiçbir dosyaya yazmaz, buluta bağlanmaz**:

```powershell
npm run envanter                          # demo verisi üzerinde
node tools/yetki-envanter.js --yedek yedek.json
node tools/yetki-envanter.js --json       # raporu JSON olarak
```

## 6.8. Acil durum planı tarih doğrulaması: `tools/acil-tarih-dogrula.js`

Kayıt ekranındaki tarihler ile mevcut durum kartındaki tarihlerin **bütün kurum
ve işyerlerinde** aynı olduğunu kanıtlar. Demo verisi ya da bir JSON yedeği
üzerinde çalışır; jsdom içinde kalır, **Supabase'e/üretim verisine yazmaz**:

```powershell
npm run test:acil                        # demo verisi (6 işyeri, 2 kurum)
node tools/acil-tarih-dogrula.js --veri yedek.json
node tools/acil-tarih-dogrula.js --sessiz   # yalnızca özet
```

Her işyeri için ayrı ayrı doğrulananlar:

- Veri deposundaki üç tarih (ilk hazırlanma, son yenileme, son tatbikat) ile kayıt
  diyaloğundaki alanlar ve mevcut durum kartındaki kutular birebir aynı mı?
- Kart "En geç yenileme" değeri tek kuraldan mı geliyor (son yenileme; yoksa ilk
  hazırlanma + tehlike sınıfı aralığı) ve tatbikat yenileme yerine sayılmıyor mu?
- Bir işyerinin tarihleri başka işyerine taşınıyor mu? İşyeri başına kaç kayıt var,
  kayıt kimlikleri benzersiz mi, sahipsiz kayıt var mı?
- Kaydet → yeniden oku → sayfayı yeniden çiz → localStorage: değer korunuyor mu?
- Eski bulut kopyası birleşime girdiğinde yeni tarihi eziyor mu? Göç öncesi
  kimliksiz kopya ikinci kayda yol açıyor mu?
- Takvimde olmayan tarih, ileri tarih ve ters sıra reddediliyor mu; 29 Şubat +
  yıl hesabı bir gün kayıyor mu?

Çıkış kodu başarısızlıkta `1`'dir; `npm test` bu aracı `--sessiz` kipte çalıştırır.

## 6.9. Canlı veri doğrulaması (salt okunur): `tools/acil-tarih-canli.js`

§6.8'deki doğrulamanın **gerçek üretim verisi** üzerindeki sürümüdür. Demo verisi
yerine `assets/js/bulut-kimlik.js` içindeki Supabase adresi, anon anahtar ve oda
koduyla yayındaki tek satırı okur; hiçbir yazma isteği göndermez:

```powershell
npm run acil:canli                       # gerçek bulut satırı (yalnızca GET)
node tools/acil-tarih-canli.js --json    # makine okunur rapor
node tools/acil-tarih-canli.js --veri yedek.json   # yedek dosya (canlı DEĞİL)
node tools/acil-tarih-canli.js --demo    # demo fixture (canlı DEĞİL)
```

Her kurum ve her işyeri için ayrı ayrı:

- İlk hazırlanma / son yenileme / son tatbikat: bulut kaydı ↔ veri deposu ↔
  kayıt ekranı ↔ mevcut durum kartı ↔ kalıcı depo (localStorage) aynı mı?
- Kayıt kimliği işyeri kimliğiyle eşleşiyor mu; kimliksiz, çift kimlikli,
  mükerrer ve sahipsiz kayıt var mı? (Ölçüt **ham** veridir.)
- Kaydet → çek → birleştir zinciri bellekte simüle edilir: eski bulut kopyası
  yeni tarihi eziyor mu, yerel değişiklik korunuyor mu, kayıt çoğalıyor mu?
- Kart "En geç yenileme" tek kuraldan mı geliyor, tatbikat dayanak sayılmış mı?

Güvenlik ve sınırlar:

- Yalnızca `GET .../rest/v1/isg_veri?select=…&oda=eq.…` çalışır. jsdom içinde
  `fetch` kapatılır; araç çalışırken bulut çağrısı denense bile engellenir
  (raporda "Engellenen bulut isteği" olarak görünür).
- Gerçek veri **değiştirilmez, silinmez, otomatik düzeltilmez**. Birleştirme
  denemeleri Node belleğinde yapılır. Tarih farkı bulunursa yalnızca listelenir.
- Bulut satırı kanonik kaynaktır; **cihazların kendi localStorage kopyaları
  uzaktan okunamaz**. Şüphe varsa o cihazda dışa aktarılan yedek
  `--veri yedek.json` ile incelenir.
- Çıkış kodu: `0` = tutarsızlık yok, `1` = tutarsızlık/erişim hatası.
- Rapor, veri kaynağını başlıkta ve sonunda açıkça yazar: **canlı**, **yedek**
  veya **demo**. Demo çıktısı hiçbir zaman canlı doğrulama olarak sunulmaz.


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
- **Sistem Yöneticisi yetkisi de istemci tarafındadır.** Rol kontrolü
  (`ISG.yetki`) tarayıcıda çalışır; geliştirici araçlarıyla `localStorage`
  içindeki kullanıcı kaydı değiştirilebilirse rol yükseltmesi mümkündür. Bu
  nedenle Sistem Yöneticisi / OSGB Müdürü ayrımı **arayüz ve iş kuralı**
  düzeyinde korumadır, güvenlik sınırı değildir. Sunucu tarafı doğrulama
  (Supabase Auth + RLS) eklendiğinde rol kontrolü orada yinelenmelidir.
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
3. Şablon sütun eşleme sihirbazı; diğer listeler (risk, saha) için XLSX çıktısı.
4. PDF tutanak ve imza (İSG kurul kararı, tatbikat raporu).
5. Kurul, tatbikat ve yıllık değerlendirme modülleri; hatırlatma e-postaları.
6. Supabase/Firebase ile çok kullanıcılı yapı ve sunucu tarafı kimlik doğrulama
   (rol bazlı yetki ve denetim izi demo düzeyinde hazır).
7. Mevzuat değişiklik takibi ve işyeri kapsam kararının gerekçelendirilmesi.
8. Sunucu tarafı raporlama, gerçek puantaj/PDKS çalışma saatiyle KSO/KAO, yaş
   ve öğrenim kırılımları (personelde doğum tarihi/öğrenim alanı) ve PWA
   güncelleme bildirimi.

## 10. Bu sürümde neler değişti?

### 2.25.0 — Çalışma kitabı işyerine bağlandı; aktarılan personelin kaydı eski işyerinde kalır

- **Kök neden 1 — çalışma kitabı tek ortak kayıttı.** `isgtakip.saglik.kasa`
  içinde `calismaKitabi` adlı **tek** kayıt tutuluyor, satırların hangi işyerine
  ait olduğu bilinmiyordu. `SAYFALAR.saglik`, kitabı `seciliIsyeri` ve
  `ISG.yetki.saglikKapsam()` sormadan doğrudan basıyordu: ASKI-2 seçiliyken
  ASKI-1'in personeli, muayene tarihi ve **tanı metni** okunabiliyordu (kayıt
  tablosu, personel listesi ve Excel çıktısı ise kapsamı uyguluyordu — tek istisna
  kitap kartıydı). Artık kayıt **işyeri başına ayrıdır**: `calismaKitaplari[]`,
  kimlik `ck-<isyeriId>` (`tekKayitId`), işyerisiz kayıt reddedilir
  (`ISG.depo.saglikCalismaKitabiKaydet(isyeriId, kitap)`), okuma
  `ISG.saglikCalismaKitabi.kitap(isyeriId)` üzerinden kapsam sorularak yapılır.
- **Yükleme işyeri seçimi ister.** `saglik-xlsx-yukle` akışı işyeri seçili
  değilse dosyayı hiç okumaz; `ISG.saglikCalismaKitabi.oku(dosya, isyeriId)`
  görüntüleme izni + yazma izni + kapsam denetimi yapar (OSGB Müdürü
  yükleyemez). Geç yanıt koruması işyeri kimliğini de karşılaştırır.
- **İki savunma hattı.** Kitap yalnız **seçili işyerinde** açılır; işyeri
  seçilmemişse satır basılmaz, yalnız hangi işyerinde kitap olduğunu söyleyen
  özet (`#saglik-kitap-ozet`) gösterilir. Dosyada "İşyeri" sütunu varsa satır,
  seçili işyerinin adıyla eşleşmiyorsa ayrıca süzülür.
- **Kitap satırları artık şifreli.** Satırlar kasaya `sg2:` gövdesi hâlinde
  yazılır; düz metin ad/tanı `localStorage`'da durmaz.
- **Eski tek-kitap kaydı gösterilmez.** İşyeri bağı olmadığı ve karışık işyeri
  satırları taşıdığı için hiçbir görünüme taşınmaz; sahibine varlığı bildirilir
  ve "Eski kaydı sil" düğmesi verilir. Veri otomatik silinmez.
- **Kök neden 2 — personel aktarımı kaydı yeni işyerine taşıyordu.**
  `kayitKapsamda` kaydın kendi `isyeriId`'si kapsam dışıysa **personelin** yeni
  işyerine düşüyordu: ASKI-2'ye ait kayıt, personel ASKI-1'e aktarılınca ASKI-1
  yetkilisinin listesine giriyordu ("Tüm yetkili işyerleri" görünümünde). Kişiye
  düşme artık **yalnızca işyeri kimliği boş** eski kayıtlarda; ekran süzgeci
  (`SAYFALAR.saglik`) ve silme denetimi aynı kuralı kullanır.
- **Regresyon testleri.** `test/yetkikapsam.js` bölüm 16–18 (kitap işyeri
  ayrımı, kripto, işyeri seçmeden yükleme reddi, kapsam dışı kitap okunamaz,
  aktarılan personelin kaydı sızmaz); `test/sagliktest.js` ve
  `test/sagliktoplutest.js` yeni sözleşmeye (işyeri başına kitap) güncellendi.

### 2.24.0 — Sağlık takibi erişimi, işyeri bazlı veri izolasyonu ve yönetici kapsamı

- **Kök neden 1 — OSGB Müdürü sağlık ekranına hiç giremiyordu.** `SAYFALAR.saglik`
  kapısı rol adına bakıyordu (`rol.id !== 'yetkili' && !== 'goruntuleyici'` →
  "Erişim yok"). Artık kapı tek merkezden sorulur: `ISG.yetki.saglikGoruntule()`.
  OSGB Müdürü ekranı açar, kendi kurumundaki işyerlerini seçer, **kendi
  kurumunun** muayene kayıtlarını ve eksik tarama özetini salt okunur görür;
  görüntüleme izni yoksa ekran kapanmaz, mevcut **erişim talebi** akışı sunulur.
- **Kök neden 2 — sağlık listesi işyeri parametresi olmadan çekiliyordu.**
  Ekran `listele('', '')` çağırdığı için cihazdaki bütün sağlık kayıtları
  geliyordu; işyeri filtresi yalnız personel tablosunu süzüyor, muayene
  listesini, sayaçları, aramayı ve Excel çıktısını **etkilemiyordu**. ASKI-1
  seçiliyken ASKI-2'ye geçildiğinde eski işyerinin satırları ekranda kalıyordu.
  Düzeltme: kapsam **sorgu katmanında** uygulanır
  (`ISG.saglikTakip.listele` → `Y.saglikKapsam()`), işyeri kimliği boş/eski
  kayıtlar personelin işyeriyle eşleştirilir, hiçbir işyeriyle eşleşmeyen kayıt
  başka işyerine yazılmaz. Ekranda ayrıca tek işyeri seçici (üst çubuktaki
  `#kapsam`) kullanılır; personel listesi, sekme sayaçları, tarama özeti, arama,
  sayfalama ve Excel çıktısı aynı kapsamdan türetilir.
- **Kök neden 3 — "Yönetici" rolü koşulsuz tüm işyerlerine erişiyordu.**
  `kapsam()` yalnız role bakıyordu ve kullanıcı kaydındaki işyeri atamalarını
  yok sayıyordu. Yeni tek karar noktası `tumunuGorur(o, rol)`: Sistem Yöneticisi
  her zaman tüm işyerlerini görür; **açıkça işyeri atanmış yönetici yalnız
  atandığı işyerlerini görür**; "Tüm işyerleri" işaretli kullanıcı tümünü görür;
  OSGB Müdürü yalnız kendi kurumunu görür. Atama yapılmamış eski yönetici
  hesabı (varsayılan `u1`) kilitlenmesin diye eski davranış korunur.
- **Görüntüleme izni ≠ yazma izni.** Sağlık için `ISG.yetki.saglikIzin()` tek
  kaynak oldu: `goruntule / ekle / duzenle / sil / disaAktar / karar`. Yönetim
  yetkisi olmayan roller (OSGB Müdürü, Görüntüleyici, onaysız Yetkili) yalnız
  görüntüleyebilir; ekleme/güncelleme/silme/Excel aktarma reddedilir. Depo
  katmanındaki `saglikTakipKaydet` / `saglikTakipSil` sarmalayıcısı hedef
  işyerini de denetler.
- **Kimlik bilmek erişim hakkı vermez.** Kapsam dışı işyeri kimliğiyle liste
  istemek ve kapsam dışı kaydı silmek/düzenlemek `Bu işyeri yetki kapsamınızda
  değil.` hatasıyla reddedilir; deneme `denetim` kaydına (`tur:
  'saglik-erisim'`) yazılır.
- **İşyeri değişiminde ekran durumu temizlenir.** `kapsamDurumunuTemizle()`
  seçili personeli, açık kaydı, düzenleme formunu, sayfa numaralarını ve özet
  ön izlemesini siler; `UI.kapsamSurum` artırılarak **geç gelen asenkron
  yanıtlar** (Excel çalışma kitabı, sağlık kaydı ön izlemesi) yeni ekranı
  ezmez. Oturum değişiminde de önceki kullanıcının seçimleri devralınmaz;
  yetkiler her zaman kullanıcı kaydından okunur.
- **Doğrulama.** Yeni `test/yetkikapsam.js` (65 kontrol) sentetik veriyle:
  OSGB Müdürü menü/ekran erişimi, kurum sınırı, salt okunurluk, onay akışı,
  ASKI-1 → ASKI-2 geçişinde veri temizliği, kapsam dışı liste/silme/yazma
  reddi, Excel kaynağının kapsamı, onay eşikleri ve tek uzman kuralının
  korunması, yeniden girişte yetki sürekliliği. `npm test` zincirine eklendi.
  `test/sagliktest.js` görüntüleyici fixture'ı işyeri atamasıyla güncellendi
  (atamasız hesabın veri görememesi yeni kuralın gereğidir).
- **Supabase/RLS.** Bu sürümde tarayıcı tarafı kurallar sıkılaştırıldı; sunucu
  tarafı RLS politikaları **henüz uygulanmadı** (bkz. §1.3). Sağlık kasası
  cihazda (`localStorage`, `sg2:` şifreli) tutulduğu için bulut eşitlemesine
  konu değildir; yine de çok kullanıcılı kurulumda gerçek güvenlik sınırı
  Supabase Auth + RLS ile kurulmalıdır.

### 2.23.0 — Yeni işyeri açılınca acil durum planı kaydı kendiliğinden oluşur

- **Otomatik plan iskeleti.** İşyeri kaydedildiğinde o işyeri için acil durum
  planı kaydı **kendiliğinden** açılır (`ap-<isyeriId>`, üç tarih boş, ekip
  listesi boş). Boş tarih bilinçlidir: uygulama tarih uydurmaz, kartta
  "Plan tarihi girilmedi" yazar; kullanıcı tarihi girince aynı kayıt dolar.
- **Tek merkez, iki kapı.** İskelet `acilPlanIskeleti(isyeriId)` ile tek yerde
  üretilir; hem `ISG.depo.isyeriKaydet` (yeni işyeri) hem de
  `tekKayitlariTamamla` (açılış/göç/bulut birleşimi) aynı yardımcıyı çağırır.
  Böylece yönetici, kullanıcı, OSGB ve Excel/içe aktarma yollarının hepsi aynı
  davranışı görür; ayrı ayrı kod yok.
- **Idempotent ve veri kaybı yok.** Var olan plan kaydına dokunulmaz (tarih,
  ekip, belge, kimlik ezilmez); kayıt yoksa eklenir. İşyeri düzenlendiğinde,
  sayfa yenilendiğinde veya bulut eşitlemesi tekrarlandığında plan çoğalmaz.
- **Eski verinin tamamlanması (backfill).** Sürüm yükseltildiğinde mevcut
  işyerleri için eksik plan kayıtları da tamamlanır; dolu planlar aynen kalır.
- **Onarım kancası.** `ISG.depo.acilPlanOtomatikOlustur(isyeriId)` tek bir
  işyeri için kaydı doğrular/oluşturur (elle onarım ve içe aktarma için).
- **Doğrulama.** `tools/acil-tarih-dogrula.js` 7. bölümü eklendi (15 kontrol):
  otomatik oluşum, deterministik kimlik, boş tarihler, kalıcı yazım, boş plan
  rozeti, yeniden kaydetme, tarih yazımı, birleşimde geri tamamlama, birleşim
  tekrarında çoğalmama, mevcut planların (boş tarihli AYULAŞ dahil) korunması,
  işyeri silinince planın silinmesi ve silinenin birleşimle geri gelmemesi.

### 2.22.1 — Acil durum planı tarihleri: kayıt ekranı ile mevcut durum artık aynı kaydı okuyor

- **Kök neden 1 — kimliksiz kayıt.** `acilPlanlar` ve `riskEkipleri` kayıtları
  `id` üretilmeden yazılıyordu. Kayıt bazlı bulut eşitlemesi kimliksiz kaydı
  korumadığı için birleşimde **yerel yazı atılıp bulutun eski kopyası kalıyordu**
  (kullanıcı kaydediyor, ekran yenilenince eski tarih geri geliyordu) ve iki cihaz
  aynı işyerine yazdığında kayıtlar yan yana birikiyordu. `ISG.ilgiliKayit` hangi
  kopyayı önce bulursa onu okuduğu için kayıt ekranı ile mevcut durum kartı farklı
  tarih gösterebiliyordu.
- **Kök neden 2 — tek kutuya sıkıştırılmış tarih.** Kart, üç bağımsız tarihi tek
  "Hazırlanma / son yenileme" kutusunda `sonYenileme || hazirlanma` olarak
  gösteriyor, son tatbikat tarihini hiç göstermiyordu. Kayıt ekranında 20.08.2024
  (hazırlanma) ve 20.08.2026 (son yenileme) varken kart yalnız 20.08.2026 yazıyordu.
- **Kalıcı kimlik ve göç (v11).** Kimlik işyeri kimliğinden türetilir
  (`ap-<isyeriId>`, `re-<isyeriId>`): iki cihaz aynı kaydı bağımsız oluştursa bile
  birleşimde tek kayda iner. `veriTamamla()` göçü kimliksiz kayıtları eşitler, aynı
  işyerine ait kopyaları tek kayda indirir (en son güncellenen kopya esastır; eski
  kopyadan tarih **geri getirilmez**), ekip üyelerini mükerrer olmadan birleştirir.
  Göç idempotenttir. `ISG.ilgiliKayit` çok kopya durumunda liste sırasına değil
  damga/doluluk/kimlik sırasına göre **deterministik** seçim yapar.
- **Tek okuma kapısı ve tek hesap.** `ISG.acilPlanKaydi(veri, isyeriId)` kayıt
  ekranı, kart, Excel ve doğrulama aracının ortak okumasıdır. `ISG.acilPlanOzeti`
  artık üç tarihi **ayrı ayrı** döndürür (`hazirlanma`, `sonYenileme`, `tatbikat`),
  geçersiz tarihi `gecersiz` ile işaretler, geçerlilik dayanağını (`esasAlani`) ve
  durumu (`kayitYok` / `tarihsiz` / `sinifYok` / `gecikti` / `gecerli`) ayrı verir.
- **Mevcut durum kartı.** "İlk hazırlanma", "Son yenileme", "Son tatbikat",
  "En geç yenileme" ve "Olağan üst sınır" ayrı kutularda; boş alan "Girilmedi",
  bozuk tarih "Geçersiz: …" yazar. Durum rozeti vadesi geçmiş planı tarih verisi
  eksik plandan ayırır. Kayıt diyaloğunda kartla aynı hesabı gösteren
  "En geç yenileme · dayanak" şeridi eklendi.
- **Yazma doğrulaması.** Kaydetten sonra kayıt geri okunur; tarihler farklıysa ya da
  cihaz depolaması yazamıyorsa diyalog kapanmaz, "Plan kaydı doğrulanamadı" uyarısı
  çıkar (sessiz "kaydedildi" yok).
- **Tarih kuralları.** Takvimde olmayan tarih, ileri tarih, `sonYenileme <
  hazirlanma` reddedilir; tatbikat yenileme yerine sayılmaz; tehlike sınıfı yoksa
  aralık uydurulmaz; tatbikatın ilk hazırlanmadan önce olması uyarı üretir.
  `ISG.yilEkle` 29 Şubat'ı hedef yılda 28 Şubat'a çeker (bir günlük kayma bitti).
- **Doğrulama.** `tools/acil-tarih-dogrula.js` eklendi: bütün kurum/işyerlerini
  gezerek depo ↔ diyalog ↔ kart ↔ localStorage ↔ bulut birleşimini karşılaştırır
  (**121 kontrol**); `npm test` ve `npm run test:acil` ile çalışır.

### 2.22.0 — Sistem Yöneticisi rolü ve sistem yönetim paneli

- **Bağımsız Sistem Yöneticisi rolü.** `ISG.yetki.ROLLER.sistemYoneticisi`
  eklendi (`yonetir`, `onaylar`, `tumIsyerleri`, `sistem`). Türkçe/bitişik
  yazımlar `ROL_ESLEME` ile normalize edilir (`Sistem Yöneticisi`,
  `sistem yoneticisi`, `sysadmin`). OSGB Müdürü salt okunur kalır; iki rol
  birbirine bağımlı değildir.
- **Sistem yönetimi ekranı (`#sistem`).** Kurum (OSGB) oluşturma/düzenleme,
  işyeri listesi + tehlike sınıfı düzenleme, kullanıcı/rol/uzman sınıfı/atama
  yönetimi, rol yetki özeti, sistem uyarı ve hata listesi, bekleyen talepleri
  onaylama/reddetme, onay yetkilisi eksik işyerleri ve rapor bağlantıları.
  Yeni altyapı kurulmadı: mevcut `kullanici-*`, `isyeri-*`, `talep-onayla`,
  `talep-reddet` eylemleri ve mevcut depo işlemleri kullanıldı.
- **Gerçek rol kontrolü.** Panel menüsü yalnız menüde gizlenmez: `#sistem`
  doğrudan açıldığında sayfa `Erişim yok` döner; `kurumKaydet/kurumSil,
  kullaniciKaydet/kullaniciSil, isyeriKaydet/isyeriSil, ayarKaydet, sifirla`
  yalnız `yonetir` rollerine açıktır. Normal uzman rol yükseltemez; OSGB
  Müdürü yönetim işlemi yapamaz.
- **Sağlık verisi ayrı yetki.** Sağlık modülünün yönetici kontrolü rol
  kimliği yerine `yonetir` üzerinden yapılır; erişim talep/onay mekanizması
  aynen korunur (yönetici onayı olmayan yetkili/görüntüleyici sağlık
  verisini göremez).
- **Testler.** `tools/kontrol.js` içine 56 yeni kontrol eklendi (rol tanımı,
  atama, panel görünümü, kurum/işyeri/kullanıcı yönetimi, onay-ret akışı,
  yetki yükseltme ve doğrudan URL denemeleri, temizlik): **929 kontrol**.

### 2.21.0 — Kurum (OSGB) desteği, uzman sınıfına göre onay eşiği, zorunlu acil ekipler

- **Kurum kaydı ve kapsam.** `kurumlar` üst düzey listesi OSGB kayıtlarını
  tutar; işyerleri ve kullanıcılar `kurumId` ile bu kayda bağlanır. Boş
  `kurumId` işyerinin kurumsuz (bağımsız) çalışmaya devam ettiği anlamına
  gelir; tek kurumlu kurulumda alan otomatik seçilir. Kurum silinirken
  işyerleri ve kullanıcılar silinmez, yalnızca bağ boşaltılır
  (`ISG.depo.kurumKaydet` / `kurumSil`). Ayarlardaki eski serbest metin
  `ayarlar.kurum` tek kurum kaydıyla eşitlenir.
- **OSGB Müdürü rolü ve kurum panosu.** Yeni rol yalnız **kendi
  kurumundaki** işyerlerini görür; yazma yetkisi yoktur. "Kurum panosu"
  menüsü yalnız yönetici ve kurum kapsamlı rolde görünür: kurumun işyeri ve
  kullanıcı sayıları, işyeri başına onay yetkilisi durumu, bekleyen talepler
  ve kurum ekibi salt okunur listelenir (`SAYFALAR.kurum`).
- **Uzman sınıfı ve onay eşiği.** Kullanıcıya `uzmanSinifi` (A/B/C) alanı
  eklendi. Değişiklik onayı isteyen hesap, işyerinin tehlike sınıfına göre
  `ISG.ONAY_ESIGI` eşiğini karşılamalıdır: çok tehlikeli **A**, tehlikeli
  **A–B**, az tehlikeli **A–C**. Sınıf boş/bilinmiyorsa hesap onay yetkilisi
  sayılmaz; uygun sınıfta uzman yoksa ekran "onay yetkilisi eksik" uyarısı
  verir ve `npm run envanter` bunu işyeri bazında döker.
- **İki onay modeli.** `ayarlar.onayModeli` boş/`rol` iken mevcut davranış
  sürer; `isyeri` seçilirse onay işyeri bazlı dağıtık yetkililere gider.
- **Acil durum planı tarih denetimi.** `ISG.acilPlanTarihKontrol` gelecekteki
  hazırlanma/yenileme tarihlerini reddeder, süresi geçmiş planı yalnız
  "gecikmiş" olarak işaretler, son tatbikat tarihi yoksa uyarı üretir.
- **Zorunlu dört ekip.** Söndürme, kurtarma, koruma ve ilk yardım ekipleri
  çalışan sayısı ve tehlike sınıfına göre oranla (1/50 · 1/40 · 1/30, ilk
  yardım 1/20 · 1/15 · 1/10, yukarı yuvarlanır, en az 3) hesaplanır; çalışan
  sayısı veya tehlike sınıfı yoksa gereksinim geçersizdir. Üyeler
  `acilPlanlar[].ekip` altında rol + personel kimliğiyle tutulur, gerekli /
  kayıtlı / onaylı mevcut karşılaştırması türetilir.
- **Yeni araçlar ve testler.** `tools/yetki-envanter.js` (salt okunur onay
  yetkilisi envanteri), `tools/saglik-aktar.js` (sağlık aktarım köprüsü),
  `tools/varlik-surum.js --denetle`, `tools/hooks-kur.js` ve
  `tools/yayin-dogrula.js`. Test kapsamı **816 kontrol + 27 belge kontrolü**;
  `npm run test:onay` onay motoru ve arayüzünü ayrıca koşar.

### 2.20.0 — Çalışma planı durumu on seçenekli yeni modele göç etti

- **Dokuzu kaydedilen, biri türetilmiş.** `ISG.PLAN_DURUMLARI` tek tanım
  kaynağı: Yapılacak, Devam Ediyor, Belge / Yanıt Bekleniyor, Ertelendi,
  Tamamlanmadı, Planlanmadı, Tamamlandı, İptal Edildi, Kapsam Dışı. Onuncu
  durum **Gecikti** hiçbir zaman saklanmaz; takip tarihi geçtiği hâlde
  kapanmamış faaliyet için `ISG.planDurumu(plan)` üretir.
- **Renk kodu yerine rozet.** Satır rengi durumu tek başına anlatmıyor:
  iptal / kapsam dışı kayıtlar `satir-notr`, vadesi bugün veya 14 gün içinde
  olan açık kayıtlar `satir-uyari`, Gecikti ile Tamamlanmadı `satir-tehlike`
  alır; durumun kendisi rozetten okunur, hücrenin altında vade bilgisi ve
  kayıtlı durum farklıysa "Kayıtlı durum: …" satırı yer alır.
- **Menüden atama, tek tuşla.** "Diğer durumlar" menüsü kayıttaki durum
  dışındaki sekiz seçeneği listeler ve doğrudan yazar; tamamlanma tarihi
  yalnızca "Tamamlandı" seçildiğinde üretilir.
- **Sessiz göç.** `takvimde`, `planlandi`, `bekliyor` ve eski türetilmiş
  `Gecikti` değerleri ilk açılışta güncel ada döner (`ISG.planDurumNormal`);
  `isgtakip.v4` anahtarı ve yedek biçimi değişmez.
- **Sayımlar tek yerden.** Panel görevleri, yıl kartları, KPI kartları ve
  Excel dışa aktarımı kapanmış durumu `ISG.PLAN_DURUM_KAPALI` üzerinden,
  yıl kartının kısa listesini `ISG.PLAN_DURUM_TAKIPSIZ` üzerinden sayar.
- **Onay kuyruğu iş yeri kayıtlarında da çalışıyor.** Risk ekibi ve acil
  durum planı iş yeri kimliğiyle tutulduğu için talep eskisi o listede
  bulunamıyordu; denetim artık eylem adına göre iş yeri kaydına yönelir
  (`ISYERI_KAYIT_EYLEMLERI`), onaylanan işlem gerçek depoda uygulanır ve
  bilgi kutusu "kuyruğa alındı" / "kaydedildi" ayrımını doğru bildirir.

### 2.19.0 — "Mevzuat ve kapsam" sayfası yerleşik kapsam kataloğuyla açılıyor

- **Boş açılışta da dolu kapsam listesi.** Sayfa kayıtlı başlık yokken
  `ISG.MEVZUAT_KATALOGU()` (`assets/js/varsayilan-veri.js`) kataloğunu okur:
  6331 sayılı Kanun ve bağlı yönetmeliklerden **20 başlık**. Katalog veriye
  yazılmaz; yedek, dışa aktarma ve bulut eşitlemesine girmez. Yerleşik katalog
  kullanıldığında sayfada "Yerleşik mevzuat kataloğu" bilgisi görünür.
- **Her başlıkta "Kapsam" satırı.** Katalog kayıtlarına `kapsam` alanı eklendi:
  hangi işyerleri/çalışanlar kapsamda (alt işveren, geçici çalışan, stajyer dahil),
  hangi faaliyetler kapsam dışı (ev hizmetleri, TSK, genel kolluk, MİT), yenileme
  süreleri gibi kısa kapsam notları listelenir.
- **Arama kapsam metnini de tarıyor.** Arama kutusu artık `kapsam` alanında da
  eşleşir; kategori filtresi ve "gözden geçir" sayacı aynı kaynaktan beslenir.
- **Tek kaynak.** `tools/demo-veri.js` kendi mevzuat dizisini taşımıyor,
  `ISG.MEVZUAT_KATALOGU()` çağırıyor; demo ile yayın aynı başlıkları görür.

### 2.18.1 — Giriş ve şifre sıfırlama ortak kaydı da deniyor

- **Eşitleme giriş ekranından önce başlar.** `ISG.uygulama`, giriş katmanı
  kurulmadan önce `ISG.bulut.baslat()` çağırır (`uygulama.js → erkenBulutBaslat`);
  temiz bir tarayıcıda hesap listesi ortak kayıttan gelir. Ayar düğmeleri ve
  durum çubuğu eskisi gibi giriş sonrasında (`bulutBagla`) bağlanır.
- **Giriş, hesabı ortak kayıtta da arar.** Yerelde hiç bulunmayan bir adres için
  form reddetmeden önce `giris.js → hesaplariBuluttanCek()` ile ortak kayıt çekilir
  ve doğrulama yeniden denenir. Eşitleme sürüyorsa (`asama === senkron`) 400 ms
  aralıklarla en çok 5 kez beklenir, sonra "ortak kayıt hâlâ eşitleniyor" denir.
  Adres yerelde var ama şifre/pasiflik hatası varsa bulut hiç denenmez —
  "Şifre hatalı" olduğu gibi söylenir.
- **Şifre sıfırlama aynı kuralı izler.** `kodIsteBuluttan()` kodu istemeden önce
  ortak kaydı çeker; hesap hâlâ yoksa "kullanıcı bulunamadı" ile birlikte bağlantı
  bilgisi gösterilir. Yenilenen şifre `sifreniBulutaGonder()` ile bekleme süresi
  (`BEKLEME_MS`) dolmadan `ISG.bulut.gonder(false)` üzerinden ortak kayda yazılır;
  4 deneme de boşa giderse "şifreniz bu cihazda yenilendi, ortak kayda
  gönderilemedi" uyarısı verilir — şifre bu cihazda geçerlidir ve sıradaki
  eşitleme turu onu kendiliğinden taşır.
- **Hesap değişiklikleri bekletilmez.** Yöneticinin hesap eklemesi, düzenlemesi ve
  silmesi `uygulama.js → hesapBulutaGonder()` ile anında ortak kayda yazılır;
  ulaşılamazsa "yalnızca bu cihaza yazıldı" uyarısı gösterilir.
- **Bozuk hesap kaydı engellendi.** `depo.kullaniciKaydet` boş adresi ve yeni
  kayıtta aynı adrese ikinci hesabı reddeder, `guncelleme` damgası yazar ve
  `localStorage` yazılamazsa (kota dolu) hata verir; `kullaniciEpostaBul` adresleri
  boşluksuz karşılaştırır, `kullaniciSifreDegistir` de yazma hatasını yutmaz.
- **Yeni test: `test/girisbuluttest.js`** — sahte PostgREST (gövde + damga +
  koşullu PATCH) üzerinde 7 senaryo / 28 doğrulama; `npm run test:giris` ile
  çalışır. `test/bulutgiristest.js` artık jsdom pencerelerini kapatıp temiz
  çıkıyor (çalıştırıcıda asılı kalmıyordu).

### 2.18.0 — Sağlık takibi: tam personel listesi, katlanır form, Excel içe/dışa aktarma

- **Sekme etiketleri düzeltildi.** Çalışma kitabı sekmeleri `{ ad, satirlar }`
  nesneleri olarak saklanıyor, arayüz ise etiket olarak nesneyi basıyordu: beş
  sekme de **"[object Object]"** görünüyordu. Artık `sekme.ad` okunuyor; sayaçlar
  başlık satırını düşerek hesaplanıyor. 1163 satırlık TAM LİSTE tek seferde
  basılmasın diye çalışma kitabı tablosuna **50 satırlık sayfalama** eklendi.
- **Tam personel listesi.** Sağlık Takibi'ne kapsamdaki **tüm personel** basılıyor
  (muayene kaydı olmayanlar **"MUAYENE YOK"** rozetiyle). Arama, durum
  (Tümü/Muayene yok/Sevkli/Yasaklı/Uygun) ve işyeri filtreleri, sayfalama,
  kişi başına **geçmiş** (kayıt sayısı, tarih, sonuç, sevk, yasak) ve satırdan
  **Muayene ekle / Düzenle / Sil** işlemleri var.
- **Katlanır kayıt formu.** Form artık sayfaya sürekli açık basılmıyor:
  `<details>` paneli varsayılan kapalı; "Yeni kayıt"/"Muayene ekle"/"Düzenle"
  açıyor, kayıt veya "Vazgeç" kapatıyor. Alanlar üç grupta: **Personel ve
  muayene**, **Sağlık bilgileri (gizli)**, **Muayene sonucu ve iş kısıtları**.
  Personel ve işyeri serbest metin yerine **kayıtlı listelerden seçilir**; kişi
  seçilince işyeri otomatik dolar.
- **Excel şablonu, içe ve dışa aktarma.** Yeni `assets/js/saglik-toplu.js`
  (`ISG.saglikToplu`): 15 sütunluk şablon (`Şablon indir`), kişiyi Sicil No →
  Ad Soyad sırasıyla eşleştiren, tarihleri çözen, mükerrer/hata ayıklayan
  `analizEt`, yalnız onaydan sonra `ISG.saglikTakip.kaydet` ile yazan `uygula`,
  ve kayıtları yeniden yüklenebilir XLSX'e çeviren `disaAktar`. Ön izleme
  diyaloğu personel/plan toplu yükleme kalıbındadır.
- **Arama kutusu karışıklığı giderildi.** Sağlık ekranındaki her `input` olayı
  çalışma kitabı aramasını da eziyordu; artık her kutu yalnızca kendi listesini
  ve sayfasını sıfırlar.
- **Testler:** mevcut `test/sagliktest.js` korunarak kapsam `#saglik-kayit-tablo`
  ile daraltıldı; yeni `test/sagliktoplutest.js` 50 kontrolle personel listesi,
  katlanır form, sekme etiketleri/sayfalama, şablon, analiz, mükerrer koruması ve
  onaylı içe aktarma akışını doğrular.

### 2.16.0 — Toplu personel yükleme: Kıdem Tarihi korunuyor, tekil kimlik, ASKİ-1 aktarım aracı

- **Personel formunda Kıdem Tarihi (`kidemTarihi`).** Standart şablon on birinci
  sütun olarak Kıdem Tarihi’ni taşıyor ve liste bu değeri gösteriyordu, ancak
  düzenleme formunda alan yoktu; personeli bir kez düzenleyen kullanıcı içe
  aktarılan tarihi **sessizce kaybediyordu**. Form alanı eklendi (`index.html`),
  `personelAc` alanı dolduruyor ve kayıtta geri yazıyor — regresyon testi dahil.
- **Toplu yazımda tekil kimlik.** `ISG.yeniId()` yalnızca zaman damgası + 3 rastgele
  karakter üretiyordu; aynı milisaniyedeki toplu kayıtlarda çakışma olasılığı
  yüksekti (1140 satırlık gerçek listede 7 çakışma ölçüldü). Çakışan kimlikler bulut
  eşitlemesinde kayıtların birbirini yutmasına, silmenin iki kaydı silmesine yol
  açıyor. Üretece artan sayaç eklendi, `kaydetListede` liste içi çakışmayı reddediyor;
  20.000 üretim ve 1140 kayıtlık toplu ekleme testleri benzersizliği doğruluyor.
- **Yeni geliştirme aracı `tools/personel-aktar.js`.** Kurum listesini uygulamanın
  kendi ayrıştırıcısıyla okur, hedef iş yerini kimlik/ad ile tekil olarak çözer,
  satır satır doğrulayıp raporlar (hatalı, mükerrer, uyarılı, veri kalitesi dağılımı),
  `--hazirla` ile arayüzden aynen yüklenebilir standart XLSX üretir. `--bulut` satırı
  salt okunur okur ve **okuma anında yedek alır**; `--yaz` ile yazmadan önce satırı
  yeniden okuyup eşzamanlı değişikliği denetler, gerekirse yalnızca yeni kayıt
  deltasını uygular. Rapor, diğer iş yerlerinin personelinin ve tüm diğer
  koleksiyonların değişmediğini, mevcut eşitleme damgalarının korunduğunu kanıtlar.
- **ASKİ-1 personel listesi gerçek veride aktarıldı:** 4.202 satırlık kaynak dosyada
  1.140 personel satırı, **0 mükerrer ve 0 hatalı** satır; 1.140 kayıt ASKİ-1’e
  eklendi, Aypaş OSGB (13) ve ASKİ-2 (0) listelerine dokunulmadı.
- **Belgeleme:** yeni **6.5** bölümü (şablon → ön izleme → onay kuralları ve
  `tools/personel-aktar.js` kullanımı).
- **Doğrulama:** `kontrol.js` 651 geçti / 0 başarısız (6 yeni kontrol),
  `belge-test.js` 27 geçti / 0 başarısız; `package.json` sürümü **2.16.0**, JS varlık
  damgaları (`depo.js`, `uygulama.js`) yeniden üretildi. ASKİ-1 aktarımı ayrı bir
  salt okunur denetimle de doğrulandı: hedef dışı 13 personel **birebir aynı**,
  diğer koleksiyonlar değişmedi, denetim izi 62 → 63.

### 2.15.0 — Yıllık çalışma planı: Excel şablonu, toplu yükleme, yıl filtresi, toplu silme

- **Yeni modül `assets/js/plan-toplu.js` (`ISG.planToplu`).** Plan akışı personel
  toplu yükleme kalıbıyla kuruldu: `analizEt` (ayrıştır + eşleştir + doğrula +
  mükerrer), `uygulanacaklar` / `uygula` (yalnız onaydan sonra tek yazım),
  `sablonSayfalar` / `sablonIndir`, `disaAktarSayfalar` / `disaAktar`,
  `onizlemeSatirlari`. 17 sütun tek yerde tanımlı (`BASLIKLAR` + `AYLAR`), başlık
  eşleşmesi Türkçe duyarlı ve eşanlamlı adları kabul ediyor; `AYLAR` üstünde
  `1…12` altındaki iki satırlı ay grupları da okunuyor. Ayrıntı:
  [6.4](#64-yıllık-çalışma-planını-excelden-yüklemek-şablon--ön-izleme--onay).
- **Eski plan dosyaları okunabilir hâle getirildi:** ana başlık satırları
  altındaki faaliyetlere `anaBaslik` olarak yazılıyor; `HAZIRLAYANLAR`,
  `ONAYLAYAN`, imza, `Doküman No`, `Revizyon`, `Sayfa` ve tekrar eden tablo
  başlığı satırları ayıklanıyor; `2026 Yılı Çalışma Planı` / `2026-2027 Yıllık
  Çalışma Planı` / `Yıl: 2026` kalıplarından yıl otomatik bulunuyor; `Örnek:`
  satırları atlanıyor. Ayarlar ve Yönetim Göstergeleri gibi plan olmayan
  sekmeler ayrıştırma dışı kalıyor.
- **Plan kaydı modeli genişledi:** `yil`, `siraExcel`, `anaBaslik`, `aylar`
  (bir faaliyet birden fazla aya planlanabiliyor), `kaynak` / `kaynakSatir`
  (hangi dosyanın hangi satırından geldiği). Okuma yardımcıları
  `ISG.planYil`, `ISG.planAylari`, `ISG.planYillari` hem yeni kayıtları hem tek
  `ay`/`ayAdi` taşıyan eski kayıtları birlikte işliyor; bir yılda planlanmamış
  faaliyetler **Yıl = Tümü** seçiliyken listeye düşüyor.
- **Depoya iki toplu işlem:** `ISG.depo.planTopluEkle(isyeriId, kayitlar)` tek
  iş yerine tek kalıcı yazım yapar, `ISG.depo.planTopluSil({ isyeriId, yil,
  idler })` iş yeri filtresi zorunlu olacak şekilde ya seçili kayıtları ya seçili
  yılın tüm kayıtlarını siler; başka iş yerinin planına dokunmaz, iş yeri veya
  kapsam verilmezse hata verir (hiçbir kayıt silinmez), kaydı olmayan yıl için
  `silinen: 0` döner.
- **Arayüz:** **Plan yılı** filtresi, **Örnek Excel şablonunu indir**
  (`Yillik-Calisma-Plani-Sablonu.xlsx` — biçim + doldurma kuralları + 2 örnek
  faaliyet satırı ve **Kılavuz** sekmesi), **Excel'den toplu yükle** (Toplam /
  Ayıklanan / Mükerrer / Kaydedilecek sayıları + satır satır gerekçe ön
  izlemesi; yıl alanı dosyadan gelir, iş yeri veya yıl değiştirilince mükerrer
  denetimi o kapsam için hemen yeniden koşar), **Excel'e aktar**
  (`yillik-calisma-plani-YYYYMMDD.xlsx`, şablonla aynı 17 sütun, round-trip),
  seçim çubuğu (**Tümünü seç**, *N kayıt seçili*, **Seçilenleri sil**,
  **CSV indir**) ve **Toplu sil** onay diyaloğu (iş yeri, yıl, silinecek kayıt
  sayısı, kalan kayıt sayısı, geri alınamaz uyarısı onay kutusu).
- **Yetki, onay ve denetim:** `planTopluEkle` ve `planTopluSil` yazma
  işlemlerine eklendi; yetkisi olmayan kullanıcıda işlem onay kuyruğuna düşer
  (`{ bekliyor: true }`), yapılan her toplu işlem denetim izine yazılır.
  Diyalogdan kapatmak hiçbir kayıt bırakmaz.
- **Test kapsamı 500 → 645 kontrol** (şablon sütun sırası ve Kılavuz sayfası,
  şablonun geri okunması, XLSX/CSV ayrıştırma, bölüm/imza/tekrar eden başlık/
  `Örnek:` satırlarının ayıklanması, hatalı satır gerekçesi, mükerrer sayımı ve
  iş yeri izolasyonu, yıl değişince denetimin tazelenmesi, onay öncesi yazım
  olmaması, satır kalmayınca onay düğmesinin kapanması, dosya seçme kutusundan
  uçtan uca yükleme, Kılavuz sayfasının yok sayılması, kayıt alanlarının
  doğruluğu, **Excel'e aktar** → geri yükleme round-trip'i, seçim kutuları ve
  "Tümünü seç", seçimle silme, yıl bazında toplu silme, başka yıl/iş yerinin
  korunması, iş yeri veya yıl filtresi eksik silmenin reddi, kaydı olmayan yıl
  için 0 dönüş, denetim izi kayıtları). Diyalog sayısı 19'a çıktı.
- `package.json` sürümü **2.15.0**; JS varlık damgaları yeniden üretildi.

### 2.14.0 — 17 işyerinin Excel kontrol listesi hazır şablon oldu

- **Excel (.xlsx) dönüştürücü eklendi.** `tools/kontrol-listesi.js` Word'ün
  yanında "İSG DOSYA KONTROL CHECKLİSTİ" sayfalarını da okuyor: üst bilgi
  (işyeri/birim, kontrol tarihi, kontrolü yapan, İSG uzmanı), `Ana Başlık`
  bölümleri, `Durum` işaretleri ve `Açıklama / Eksiklik` notları.
- **17 işyeri listesi kataloğa girdi** (16 bölüm / 107–108 madde): ASKİ-2,
  Aybel, Ayulaş, Çevre Koruma ve Kontrol Dairesi (+kadrolu), Destek Hizmetleri,
  Diğer Daire Başkanlıkları, Güvenlik, Halk Ekmek, İtfaiye, Makine İkmal ve Fen
  İşleri, Park ve Bahçeler (+kadrolu), Sosyal Hizmetler, Ulaşım ve Veterinerlik
  (Aypaş + kadrolu). Katalog **18 listeye / 1.965 maddeye** çıktı.
- **Durum eşlemesi genişledi:** Var / Uygun→**Var**, Eksik→**Eksik**,
  **Güncellenecek→Eksik**, **Uygulanamaz→Kapsam dışı (Yok)**. Excel'deki
  eksiklik notu kaydın açıklamasına yazılır; maddenin kendi tarihi yoksa
  listenin kontrol tarihi kullanılır.
- **Toplu dönüşüm:** `node tools/kontrol-listesi.js toplu "<klasör>"
  --kaynaklar=tools/kontrol-listesi-kaynaklari.json` klasördeki tüm Excel
  listelerini işyeri kod/adlarıyla birlikte çevirir; yeni Excel geldiğinde tek
  komut yeter.
- **Önizleme uyarısı:** işyeri adına birden fazla liste uygunsa (kadrolu /
  daire) "Bu işyeri adına N liste uygun: …" satırı gösterilir.
- **Üretici dosya disipline edildi:** `listeUygulananOzeti` yalnız üretilmiş
  dosyada duruyordu; üretici yardımcılara (`YARDIMCILAR`) taşındı, böylece
  `olustur` yeniden çalıştığında kaybolmuyor.
- **Test kapsamı 471 → 500 kontrol** (Excel şablon bütünlüğü, bölüm/not/tarih
  taşınması, GÜNCLENECEK/UYGULANAMAZ eşlemesi, Excel listesinin uçtan uca
  eklenip tek hamlede silinmesi) + belge testi 27 kontrol.
- `package.json` sürümü **2.14.0**; `kontrol-listeleri.js`, `depo.js` ve
  `uygulama.js` damgaları yeniden üretildi.

### 2.13.0 — Uygulanan hazır liste tek hamlede siliniyor

- **Listeyi geri al:** yanlış işyerine/bölüme eklenen hazır liste
  `depo.listeGeriAl(isyeriId, kod, bolumAdi?)` ile, ekli belgeleriyle birlikte,
  tek hamlede silinir; elle eklenen maddeler hiçbir zaman toplu silinmez.
- **Kaynak filtresi:** hazır şablondan üretilen maddeler `sablon` etiketiyle
  süzülebilir; liste eklenince çalışma alanı otomatik olarak o listeye odaklanır
  (içe aktarılan maddeler hemen görünür).
- **Yetki ve denetim:** silme işlemi `listeGeriAl` adıyla yazma işlemlerine
  kayıtlı; yönetici dışındaki roller tek bir onay talebi açar.

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


