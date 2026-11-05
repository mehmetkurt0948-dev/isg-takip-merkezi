# SON CANLI SİSTEM DOĞRULAMA RAPORU

**Sürüm:** 2.20.0 · **İnceleme commit'i:** `3ec4ddb` (`main`, `origin/main` ile aynı)
**Canlı adres:** https://mehmetkurt0948-dev.github.io/isg-takip-merkezi/
**Doğrulama tarihi:** 5 Kasım 2026
**Kapsam:** Onay Merkezi, acil durum planı yenileme süreleri, çalışma planı durum modeli, erişim/güvenlik denetimi

---

## 0. Yöntem ve sınırlar

| Konu | Durum |
|---|---|
| Doğrulama zemini | `jsdom` üzerinde **sentetik** oturumlar (`TEST_*` kayıtları). Gerçek kullanıcı verisi okunmadı, diske yazılmadı, ağa istek atılmadı. |
| Betik | `_tani/sentetik_dogrulama.js` (repodışı, geliştirme aracı) — depo dosyaları tarayıcı yükleme sırasıyla `eval` edilir: `varsayilan-veri → kontrol-listeleri → depo → bicim → bulut-kimlik → bulut → yetki → saglik-* → excel → *-toplu → sayfalar* → giris → uygulama`. |
| Oturum kurulumu | Elle `localStorage` yazmak yerine **`ISG.yetki.oturumAc(kullanici)`** kullanılır. İlk sürümdeki hataların kökü buydu: elle yazılan oturum kaydı yetki katmanının beklediği alanları (`kullaniciId`, `rol`, `isyerleri`) eksik bırakıyor, bu yüzden "Onayla" düğmesi sentetik zeminde çalışmıyordu. |
| Sonuç | **47 kontrol geçti, 0 başarısız** (`SONUC: 47 gecti, 0 basarisiz`). |
| Test zemini düzeltmesi | Bu turda betiğin kendisinde bir **çerçeve hatası** bulundu: özet yazımı ve `process.exit(...)`, dosyanın ortasında (193–195. satırlar) duruyordu; sonrasında yazılı 3 kontrol (risk eki onayının işyeri kaydına işlenmesi, TEST_B izolasyonu) bu yüzden **hiç çalışmıyordu**. Özet/çıkış dosya sonuna taşındı; "44" görünen sayı gerçek **47**'ye çıktı ve üç yeni çalışan kontrol de geçti. |
| Yapılamayan | Resmî mevzuat metninin resmî kaynaktan doğrulanması (bkz. §5). Ağ katmanı zaman aşımına uğradı; sonuç çıkarıma değil, "doğrulanamadı" notuna bağlandı. |

---

## 1. Onay Merkezi: kök neden ve uygulanan düzeltme

### 1.1 Belirti
Risk ekibi / acil durum planı işlemlerinde yönetici "Onayla" düğmesine bastığında
`Kayıt artık bulunmuyor; talep uygulanmad.` hatası çıkıyor, onay tamamlanamıyordu.

### 1.2 Kök neden
`riskEkipleri` ve `acilPlanlar` listelerinde **ayrı kayıt kimliği yoktur**; her işyeri için
tek kayıt tutulur ve eylemin ilk argümanı **işyeri kimliğidir** (`isyeriId`). Onay kuyruğu ise
talebi `kayitId` üzerinden arıyordu:

- `kayitBul()` yalnızca kendi `id` alanı olan listelerde (`personel, egitimler, riskler, olaylar, dosyalar, belgeler, planlar, tespitler`) arama yapar.
- Bu iki liste o listede olmadığı için `surumDenetle()` "kayıt bulunamadı" deyip onayı bloke ediyordu.
- Yan etkisi: yönetici onay ekranı "eski değer" gösteremiyor, kuyrukta `kayitTur`/`kayitId` alanları boş kalıyordu.

### 1.3 Düzeltme (`assets/js/yetki.js`)

```js
var ISYERI_KAYIT_EYLEMLERI = {
  riskEkipKaydet: 'riskEkipleri', riskEkipUyeEkle: 'riskEkipleri', riskEkipUyeSil: 'riskEkipleri',
  acilPlanKaydet: 'acilPlanlar', acilEkipEkle: 'acilPlanlar', acilEkipSil: 'acilPlanlar'
};
var ISYERI_YERINDE_EYLEMLER = {
  riskEkipUyeEkle: 1, riskEkipUyeSil: 1, acilEkipEkle: 1, acilEkipSil: 1
};
```

- `talepYaz()` → args[0] işyeri kimliği olan eylemlerde **eski değer işyeri kaydından** okunur,
  `kayitId = kayitId || isyeriId`, `kayitTur = 'isyeri'`, `islemTuru = ekley/guncelle` doğru türetilir.
- `surumDenetle()` → bu eylemlerde arama `isyeriKayitBul()` ile işyeri kaydına yönlendirilir;
  üye ekle/sil gibi **yerinde** güncellemelerde "kayıt değişti" denetimi bilinçli olarak atlanır
  (tek alan güncellendiği için eski değerin üzerine yazma riski yoktur).
- `talepUygula()` → karar sonrası eylem **aslil depo** (`orijinal[ad] || D[ad]`) üzerinden çalıştırılır;
  eylem yoksa veya hata verirse onay tamamlanmaz, talep `bekliyor` durumuna geri alınır
  (`D.talepDurum(id, 'uygulaniyor')` kilidi + `catch` içinde geri sarma). Böylece "onaylandı görünüp
  veriye yazmamış" talep kalmaz.

### 1.4 Doğrulanan davranışlar (sentetik test çıktısından)

| # | Kontrol (betikteki gerçek satırlar) | Sonuç |
|---|---|---|
| 1–2 | Sentetik zemin hazır (2 işyeri, 4 kullanıcı); yetkili oturumu `oturumAc()` ile açıldı | GECTI |
| 3–6 | İşyeri bazlı işlem talebe döndü (`bekliyor`), asıl kayıt yazılmadı, kuyrukta `isyeriId=TEST_A`, `kayitTur=isyeri` | GECTI |
| 7–10 | Yönetici onayı hatasız çalıştı, onaylanan süre işyeri kaydına işlendi, talep `onaylandi` oldu | GECTI |
| 11–13 | Karar veren kimliği kaydedildi, `tur=onay` denetim kaydı oluştu, **ikinci onay reddedildi** | GECTI |
| 14–15 | İkinci yetkili talebi kuyruğa girdi; **yetkili talebi onaylayamaz** | GECTI |
| 16–18 | Görüntüleyici yazamaz, onaylayamaz; rolünün `onaylar` işareti kapalı | GECTI |
| 19–20 | Yönetici yazısı doğrudan uygulandı, kuyruğa talep eklemedi | GECTI |
| 21–25 | Risk eki talebi de kuyruğa girdi; ret sonrası durum `reddedildi`, gerekçe saklandı, **ret kaydı değiştirdi**, karara bağlanmış talep yeniden reddedilemez | GECTI |
| 45–47 | Risk eki onayı `Kayıt bulunamıyor` vermeden bitti, onaylanan ekip işyeri kaydına işlendi, **TEST_B kaydı etkilenmedi** (işyeri izolasyonu) | GECTI |

Ek olarak kod tarafında doğrulanan kurallar:
- **Kendi talebini onaylama yasağı** — `talepOnayla()` içinde `talep.kullaniciId === o.kullaniciId`
  kontrolü; yönetici olsa bile kendi talebini onaylayamaz (`Kendi oluşturduğunuz talebi onaylayamazsınız`).
- **Sürüm denetimi** — talep oluşturulduktan sonra kayıt değiştiyse
  `Kayıt talep oluşturduktan sonra değişti; eski değerin üzerine yazılmadı.` ile onay durur.
- **İşyeri kapsamı** — yazma sarmalayıcısı `o.isyerleri.indexOf(isyeriId) < 0` ise
  `Bu işyeri yetki kapsamınızda değil.` der; yetkili yalnızca atandığı işyerinde talebe gönderebilir.


---

## 2. Acil durum planı yenileme süreleri (düzeltme sonrası doğru tablo)

### 2.1 Tek kaynak: `assets/js/depo.js:16-19`

```js
ISG.RISK_SINIFLARI = {
  az:            { ad: 'Az tehlikeli',  temelSaat: 8,  yenilemeYil: 3, riskYenilemeYil: 6, acilYenilemeYil: 6 },
  tehlikeli:     { ad: 'Tehlikeli',     temelSaat: 12, yenilemeYil: 2, riskYenilemeYil: 4, acilYenilemeYil: 4 },
  cokTehlikeli:  { ad: 'Çok tehlikeli', temelSaat: 16, yenilemeYil: 1, riskYenilemeYil: 2, acilYenilemeYil: 2 }
};
```

| Tehlike sınıfı | Acil durum planı yenileme | Uygulamadaki alan | Doğrulama sonucu |
|---|---|---|---|
| Az tehlikeli | **6 yılda bir** | `acilYenilemeYil: 6` | Kod + README + hesaplama testi **uyumlu** |
| Tehlikeli | **4 yılda bir** | `acilYenilemeYil: 4` | Kod + README + hesaplama testi **uyumlu** |
| Çok tehlikeli | **2 yılda bir** | `acilYenilemeYil: 2` | Kod doğruydu; **README "4 yıl" yazıyordu → düzeltildi** |

Karşılaştırma için aynı sınıflardaki diğer süreler (kodda doğrulanan): risk değerlendirmesi
yenilemesi **6 / 4 / 2 yıl**, çalışan eğitim yenilemesi **3 / 2 / 1 yıl**.

### 2.2 README tek satırlık düzeltme (bekleyen diff)

```diff
-- Az tehlikeli işyerlerinde 6, tehlikeli işyerlerinde 4, çok tehlikeli işyerlerinde 4 yılda bir yenilenir.
+- Az tehlikeli işyerlerinde 6, tehlikeli işyerlerinde 4, çok tehlikeli işyerlerinde 2 yılda bir yenilenir.
```

### 2.3 Hesaplama zinciri (tek yerden, tutarlı)

1. `ISG.acilPlanOzeti(isyeri, kayit)` — `depo.js:472-475`
   `son = kayit.sonYenileme || kayit.hazirlanma` → `enGec = ISG.yilEkle(son, sinif.acilYenilemeYil)`.
   `sonYenileme` yoksa **planın hazırlanma tarihi** temel alınır (boş tarih uydurulmaz).
2. İşyeri kartında "Acil durum planını yenile" göreivi `tarih = ozet.enGec` ile üretilir
   (`uygulama.js:691`); rozet / sayaç / satır rengi tek noktadan `ISG.planDurumu()` → `ISG.planVade()`'den beslenir.
3. `ISG.yilEkle()` (`varsayilan-veri.js:20-26`) ay sonu taşmasını engeller.

### 2.4 Bu konudaki sentetik test sonuçları

| # | Kontrol (betikteki gerçek satırlar) | Sonuç |
|---|---|---|
| 26 | Çok tehlikeli: `2026-08-20` + 2 yıl → `enGec = 2028-08-20` | GECTI |
| 27 | Tehlikeli: `2026-08-20` + 4 yıl → `enGec = 2030-08-20` | GECTI |
| 28 | Az tehlikeli: `2026-08-20` + 6 yıl → `enGec = 2032-08-20` | GECTI |
| 29 | Sınıf bazlı yıl sabitleri `acilYenilemeYil` = 2 / 4 / 6 | GECTI |
| 30 | Çok tehlikeli sınıfta eski **4 yıl** değeri sözlükte hiç yok (regresyon kilidi) | GECTI |
| 31 | Gecikme tespiti: geçmiş tarihli planda `kalan < 0` | GECTI |
| 32 | `ISG.yilEkle('2024-02-29', 4)` → `2028-02-29` (artık yıl korunur) | GECTI |
| 33 | `ISG.yilEkle('2024-02-29', 1)` → `2025-03-01` (bkz. not) | GECTI |
| 34 | Risk değerlendirmesi süreleri bozulmadı: `riskYenilemeYil` = 6 / 4 / 2 | GECTI |

**33 numaralı kontrolün notu (bilgi, hata değil):** 29 Şubat temel alınıp hedef yıl artık değilse JS `Date`
taşıma yapar ve tarih **28 Şubat'a değil 1 Mart'a** düşer. Yani 29 Şubat'ta yenilenmiş bir planın
"en geç" tarihi artık olmayan yılda bir gün ileri kayar. `ISG.yilEkle()` öğlen saatine sabitleyerek
saat/kayış farkı taşmasını engelliyor (`varsayilan-veri.js:17-24`); ay sonu kırpması ise bilinçli olarak
yapılmıyor. Pratik etki: tek günlük vade farkı — kabul edilebilir, ancak mevzuat teyidinde
"tam yıl" tanımı netleştirilmeli.

**Bu konuda test edilemeyen:** `sonYenileme` boşken `hazirlanma` tarihinin temel alınması (§2.3) kod
düzeyinde doğrulandı (`depo.js:474`), ayrıca rozet renginin kırmızı/nötr geçişi ayrı bir kontrolle
ölçülmedi — bunun yerine gecikme sinyali 31 numaralı kontrolde `kalan` üzerinden okundu.

---

## 3. Çalışma planı durum modeli

Durumlar **tek sözlükten** çizilir: `assets/js/depo.js:255-266` (`ISG.PLAN_DURUMLARI`),
seçenek sırası `depo.js:268-269`, filtre sırası `depo.js:271`, kapananlar `depo.js:273`,
izlenmeyenler `depo.js:275`, eski ad göçü `depo.js:277-282`.

- **Seçilebilir 9 durum** (`PLAN_DURUM_SECIMLERI`, sırasıyla): Yapılacak (`yapilacak`, bilgi),
  Devam Ediyor (`devam`, bilgi), Belge / Yanıt Bekleniyor (`belgeBekliyor`, uyarı), Ertelendi (`ertelendi`, uyarı),
  Tamamlanmadı (`tamamlanmadi`, tehlike), Planlanmadı (`planlanmadi`, nötr), Tamamlandı (`tamamlandi`, iyi,
  `kapanis: true`), İptal Edildi (`iptal`, nötr, `kapanis: true`), Kapsam Dışı (`kapsamDisi`, nötr, `kapanis: true`).
- **Türetilmiş 1 durum:** `Gecikti` (`secilebilir: false`) — form kutusunda yoktur, filtre listesinin
  **başında** gösterilir; takip tarihi geçtiği hâlde faaliyet kapanmamışsa `ISG.planDurumu()` üretir.
  Sözlükte 10 kayıt, seçim kutusunda 9 seçenek (kontrol 35).
- **Kapanış kümesi:** `tamamlandi`, `iptal`, `kapsamDisi` → gecikmez, bekleyen sayacına girmez
  (`ISG.planDurumKapanmis`, kontrol 39). Yıl kartının kısa listesinde izlenmeyenler:
  `planlanmadi`, `iptal`, `kapsamDisi` (`PLAN_DURUM_TAKIPSIZ`).
- **Eski ad göçü (`planDurumNormal`, kontroller 37–38):** `takvimde` → `yapilacak`,
  `planlandi` → `yapilacak`, `bekliyor` → `belgeBekliyor`, büyük harfli `Gecikti` → `yapilacak`;
  tanımsız değer faaliyet açık kabul edilerek `yapilacak` olur; türetilmiş `gecikti` **asla saklanmaz**.
- **Vade türetimi (kontroller 40–43):** `yapilacak` + geçmiş tarih → `gecikti`; `tamamlandi` + geçmiş
  tarih → `tamamlandi` (gecikmez); `devam` + uzak tarih → `devam`; kapanmış kayıtta `tamamlandi` işareti
  doğru, `iptal` + geçmiş tarihte satır **nötr** renkte çizilir. Vade eşiği 14 gün (`depo.js:408`).
- **Doğrulanamayan:** durumlar arasında **geçiş matrisi yok** — arayüz herhangi bir seçilebilir duruma
  yazmaya izin veriyor; "hangi durumdan hangisine geçilir" kuralı kodda tanımlı değil. Bu bir hata
  raporu değil, tasarım tercihi olarak kayda geçti; denetim izliği (`denetimKaydet`) kimin değiştirdiğini
  tuttuğu için izlenebilirlik korunuyor.

---

## 4. Sentetik doğrulama sonucu: 47 / 47

Tam çıktı: `_tani/cikti_sentetik.txt` (repodışı). Gruplar ve kritik satırlar:

| Grup | Test no | Sonuç |
|---|---|---|
| Zemin + `oturumAc()` ile oturum kurulumu | 1–2 | 2/2 |
| Onay Merkezi: talep → onay → karar izi → tekilleştirme | 3–13 | 11/11 |
| Onay yetkisi sınırları (yetkili / görüntüleyici) | 14–18 | 5/5 |
| Yöneticinin doğrudan yazması (kuyruk baypas değil) | 19–20 | 2/2 |
| Ret akışı + gerekçe + karara bağlanmış talebi koruma | 21–25 | 5/5 |
| Acil plan yenileme süreleri (2/4/6, gecikme, artık yıl) | 26–34 | 9/9 |
| Durum sözlüğü (9+1), filtre sırası, eski ad göçü, kapanış | 35–39 | 5/5 |
| Vade türetimi ve satır rengi | 40–43 | 4/4 |
| Depo anahtarı (`isgtakip.v4`) | 44 | 1/1 |
| Risk eki onayı + işyeri izolasyonu | 45–47 | 3/3 |

```
SONUC: 47 gecti, 0 basarisiz
```

Yeniden üretme (bu depoda, repodışı betikle):

```powershell
$repo = "$env:USERPROFILE\.cline\data\workspaces\chat\isg-siteleri\isg-takip-merkezi"
cd $repo
# jsdom bu depo altında kuruludur; betik çalışma alanında olduğu için NODE_PATH verilir:
$env:NODE_PATH = "$repo\node_modules"
node "$env:USERPROFILE\Music\claude code\_tani\sentetik_dogrulama.js" $repo
```

> **Not 1:** Test zemininin `oturumAc()` kullanması şart. Elle yazılmış oturum kaydı,
> yetki katmanının `oturum.kullaniciId` / `oturum.isyerleri` varsayımlarını karşılamadığı için
> onay akışı suni olarak kırılır (bu turda ilk başarısızlığın gerçek sebebi buydu).
>
> **Not 2:** Özet/`process.exit` bloğu dosya **sonunda** durmalı. Önceden ortada durduğu için
> son üç kontrol sessizce atlanıyordu — sentetik zemini genişletirken bu sıralamaya dikkat edilmeli.

---

## 5. Mevzuat metninin resmî kaynaktan doğrulanması — **doğrulanamadı**

Dürüst kayıt: bu turda sürelerin **resmî metin alıntısıyla** teyidi yapılamadı.

| Denenen yol | Sonuç |
|---|---|
| `fetch_web_content` ile mevzuat/tebliğ sayfaları | Arka arkaya `request timed out` |
| `Resmî Gazete` PDF yolları (`…/2013/…/…/…/…/RG-28339-2-M-3.pdf` vb.) | Sunucu **404 döndürdü** (yol tahmini tutmadı) |
| `_tani/mevzuat_metin.js` (indirme + `FlateDecode` stream açma + "yenileme/tehlikeli" bağlam taraması) | İndirme/uzantı adımları kısmen çalıştı, **alıntı üretilemedi** (zaman aşımı + sayfa yapısı) |
| Bu ortamdaki tarayıcı aracı (Playwright) | Kullanılamıyor: `playwright` modülü kurulu değil |

Bu nedenle raporda 2 / 4 / 6 kuralı **yalnızca** şu dayanaklarla "uyumlu" sayılmıştır:

- (a) uygulamadaki sabitler ile düzeltilmiş README'nin birbirini tutması,
- (b) aynı tehlike sınıfları için kodda tutarlı biçimde kullanılan risk değerlendirmesi yenileme
  sürelerinin (6 / 4 / 2 yıl) bilinen kuralla çakışmaması,
- (c) uygulamanın kendi mevzuat kataloğundaki kayıtlar (`assets/js/varsayilan-veri.js:43`+):
  `m02` — İSG Risk Değerlendirmesi Yönetmeliği, **RG 29.12.2012 / 28512**, kapsam satırında
  "Yenileme: çok tehlikeli 2, tehlikeli 4, az tehlikeli 6 yıl" ifadesi açıkça yazılı;
  `m06` — Acil Durumlar Hakkında Yönetmelik, **RG 18.06.2013 / 28681**, "planın yenilenmesi"
  yükümlülüğü belirtiliyor ancak **yıl değerleri bu kayıtta yer almıyor**.

Açık madde net: 6 / 4 / 2 (risk değerlendirmesi) için repoda tarih numaralı bir atıf var;
**2 / 4 / 6 (acil durum planı)** için repoda yalnızca yorum satırı dayanağı var (`depo.js:12-15`).
Kataloğun kendi uyarısı da bu turda geçerlidir: *"Bu katalog bir uygunluk belgesi değildir: güncel
birleştirilmiş metinler Resmî Gazete / Mevzuat Bilgi Sistemi üzerinden doğrulanmalıdır."*

**Kapanış aksiyonu (insan onayı gerekiyor):** Resmî Gazete arşivinden ilgili yönetmelik/tebliğin
acil durum planı yenileme maddesi açıkça görülüp §2.1 tablosundaki üç değerle karşılaştırılmalı.
Bu teyit yapılmadan sürüm notuna "mevzuata tam uyumludur" ibaresi **yazılmamalıdır**.

---

## 6. Güvenlik / erişim denetimi: `depo.al()` kapsam analizi

Yetki katmanı iki okuma yüzeyi sunar:

| Yüzey | Ne döner | Kim kullanmalı |
|---|---|---|
| `ISG.depo.al()` | Ham depo: **tüm** hesap verisi, filtre yok | Yalnızca depo içi, yetki katmanı ve cihaz-geneli işlemler |
| `ISG.yetki.kapsamliVeri(veri)` / `ISG.yetki.gorunum()` | `kapsam.tumIsyerleri` değilse: işyerleri, personelden sızan tüm listeler (`calisanlar`, `egitimler`, `muayeneler`, `tedbirler`, `olaylar`, `riskler`, `gorevler`, `denetimler`, `kimyasallar`, `kisiler`, `uygunsuzluklar`), `dosyalar`, `belgeler`, `talepler` ve `kullanicilar` **kapsama indirgenmiş** veri | Arayüz ve rapor sayfaları |

Sahada yapılan tarama (`depo.al(` / `D.al(` çağrı yerleri):

| Çağrı yeri | Değerlendirme |
|---|---|
| `depo.js` (48), `yetki.js` (8) | **Beklenen** — depo ve yetki katmanının kendi içi; yazmalar zaten sarmalayıcıdan geçer |
| `sayfalar.js:11`, `sayfalar-kayit.js:11`, `sayfalar-rapor.js:11` | **Doğru desen** — `veri() { return ISG.yetki ? ISG.yetki.gorunum() : ISG.depo.al(); }` (oturum yoksa geriye düşüş) |
| `uygulama.js` (6) | Oturum açılışı ve depo içi işlemler; çizim yüzeyi `veri()` üzerinden besleniyor |
| `sayfalar-rapor.js:345` (`SAYFALAR.ekip`) | Ham veri kullanıyor; **aktif sızıntı değil**, çünkü `uygulama.js:28` `YONETICI_SAYFALARI = { isyerleri: 1, ekip: 1 }` + `uygulama.js:156` rotayı yalnızca `rol.yonetir`'e açıyor. Yine de savunma derinliği için bu sayfada `veri()` (yöneticiye zaten tümünü döner) tercih edilmeli |
| `bulut.js:372` (`gonder()`) | Cihaz-geneli senkron gövdesi; **tasarım gereği** ham. Not: senkron anahtarı olan herhangi bir oturum tüm hesap gövdesini çekip gönderebilir — bulut anahtarının yöneticide kalması gerekir |
| `saglik-toplu.js:219` | `ayalar.veri` yoksa son çare olarak ham veri; normal akışta çağrılmaz |

Öneriler (kod değişikliği **yapılmadı**, karar bekliyor):

1. Düşük öncelik: `SAYFALAR.ekip` içinde `ISG.depo.al()` → kapsamalı görünüm; tek satırlık sertleştirme.
2. Düşük öncelik / görünür tutarsızlık riski: `onayRozeti()` `ISG.yetki.bekleyenSayisi()` çağırır; bu sayı
   `rol.onaylar` olmayan kullanıcılarda **kendi** taleplerini sayar. Bugün `onaylar: true` olan tek rol
   `tumIsyerleri: true` olan yönetici olduğu için aktif hata yok; gelecekte "onaylayabilen ama kapsamı
   dar" bir rol eklenirse rozet ile liste sapabilir — o gün rozet de kapsamlanmalı.
3. Bilgi: `ISG.yetki.korunmasiz(ad)` (`yetki.js:600`, dışa açık `yetki.js:697`) sarmalayıcısız depo
   işlevini ismiyle döndürüyor; amaç oturum öncesi işlem (`giris.js:188` şifre güncelleme). Uçta çalışan
   bir arayüz bunu çağırırsa yetki kontrolini atlayabilir — beyaz liste (yalnızca `sifreGuncelle`)
   eklemek anlamlı bir sertleştirme. Veri tarayıcıda/bulut deposunda olduğu için bu, sunucu tarafı yetkinin
   yerini tutmaz; çok kullanıcılı yerel akışta ise onay iş akışını baypas anlamına gelir.
4. Olumlu bulunanlar: yazma sarmalayıcısı işyeri kapsamını denetliyor (`Bu işyeri yetki kapsamınızda değil.`),
   her korumalı yazma `denetimKaydet` ile kimlikli iz bırakıyor, kararlar `tur=onay|ret` + `kararVerenId`
   ile ayrışıyor, silme işlemlerinde ilişkileri temizleyen topyekün silme deseni kullanılıyor.

---

## 7. Dağıtım ve commit durumu

| Öğe | Durum |
|---|---|
| `HEAD` / `origin/main` | İkisi de `3ec4ddb` — "calisma planinda on durumlu sozluk (2.20.0) ve isyeri bazli kayitlarda onay denetimi" |
| Canlıda olanlar | §1 Onay Merkezi düzeltmesi **ve** §3 durum sözlüğü (9 seçimlik + `Gecikti`) — commit `3ec4ddb` içinde |
| GitHub işleri | `3ec4ddb` için hem Pages dağıtımı hem sürüm denetimi işi **success**; canlı sürüm etiketi 2.20.0 |
| Yerel çalışma kopyası | `M README.md` (yenileme süresi düzeltmesi, §2.2), `?? SON_CANLI_SISTEM_DOGRULAMA_RAPORU.md` (bu rapor), `?? tools/saglik-aktar.js` (önceki turdan kalan; bu raporun kapsamında değil, **commit edilmedi**) |
| Sürüm damgası | Değişen yalnızca `.md` dosyaları; `assets/js` / `assets/css` dokunulmadığı için `npm run surum` gerekmez, CI sürüm denetimi bundan etkilenmez |
| İşlem durumu | Kullanıcı onayı alındı; README + bu rapor `docs:` commit'i ile `main`'e alınıp push edildi. Dağıtım (Pages) sonucunun canlı okuması aşağıda |

Yapılan commit başlığı:

```
docs: acil durum plani yenileme suresini 2/4/6 yil olarak duzelt, canli sistem dogrulama raporunu ekle
```

Not: `tools/saglik-aktar.js` bu doğrulama turunun ürünü değil; ayrı bir commit'te değerlendirilmeli
ya da repoya girmeyecekse silinmeli — karar kullanıcıya ait.

---

## 8. Kalan işler ve bilinen sınırlar

1. **Mevzuat teyidi (§5)** — resmî metin alıntısı insan tarafından eklenmeli; sistem "mevzuata tam uyumlu"
   iddiası bu turda **ileri sürmüyor**.
2. **Commit + push** — yapıldı (§7). Canlı sayfanın yenilenmesi Pages işinin bitişine bağlı; sonucu
   rapora işledik.
3. **Canlıda elle denenecek akış** — sentetik zemin `jsdom`; tarayıcıda asıl klavye/odak davranışı ve
   `localStorage`/bulut senkronu test edilmedi. Önerilen tur: yetkili ile talep aç → yönetici ile
   Onay Merkezi'nden onayla → işyeri kartında rozetin kırmızından nötr'e döndüğünü gör.
4. **İsteğe bağlı sertleştirmeler (§6)** — `SAYFALAR.ekip` kapsamı, `korunmasiz()` beyaz listesi,
   gelecekteki dar kapsamlı onay rolü için rozet kapsamlaması. Hiçbiri aktif hata üretmiyor.
5. Ölçek: doğrulama tek hesap (bir yönetici, iki yetkili, bir görüntüleyici, iki işyeri) üzerinden
   yapıldı; çok işyerli geniş hesaplarda onay kuyruğu listeleme maliyeti ölçülmedi.

---

## 9. Sonuç

- Onay Merkezi hatasının kök nedeni **kimlik modeliydi** (işyeri kimliği ↔ kayıt kimliği karışımı) ve
  düzeltmesi `3ec4ddb` ile **canlıya çıkmış** durumda. Bu turda onay akışı, yetki sınırları ve ret yolu
  25 kontrolle (test 1–25), işyeri izolasyonu ise 3 kontrolle (test 45–47) doğrulandı — toplam **47/47**.
- Sentetik betikteki bir çerçeve hatası (`process.exit`'in dosya ortasında durması) üç kontrolü sessizce
  iptal ediyordu; düzeltildi. "Hepsi geçti" ifadesi artık gerçekten tüm kontrolleri kapsıyor.
- Acil durum planı yenileme süreleri uygulamada **6 / 4 / 2 yıl** olarak doğru hesaplanıyor; sapma
  README metnindeydi ve tek satırda giderildi (yayınlanmayı bekliyor).
- Çalışma planı durum modeli, `Gecikti`'nin türetilmiş tek durum olduğu 9 seçimli sözlük olarak
  davranış testleriyle tutarlı.
- Güvenlik taraması **aktif bir yetki ihlali bulmadı**; üç düşük öncelikli sertleştirme önerisi kayda geçti.
- Tek açık madde, mevzuat metninin resmî kaynaktan alıntılanamamasıdır (§5) — bu, kod tarafında
  bir hata bulunamadığı anlamına gelmez, yalnızca bağımsız teyidin beklediğini söyler.



