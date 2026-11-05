# Otonom Geliştirme Raporu — İSG Takip Merkezi

**Tarih:** 2026-11-04  
**Sürüm:** 2.19.0 (yayın paketi yenilendi)  
**Canlı adres:** https://mehmetkurt0948-dev.github.io/isg-takip-merkezi/  
**Kapsam:** Yetkilendirme ve yönetici onay mekanizması, çalışma planında yıl/ay seçimi,
çoklu personel veri modeli, dosya kontrolü işyeri bağının korunması, KVKK maskeleme.

---

## 1. Özet

Bu turda üç kritik başlık uçtan uca ele alındı ve **testlerle kanıtlandı**:

1. **Dosya Kontrolleri hatası (bildirilen hata) düzeltildi.** Kök neden: `dosyaKaydet`
   kaydı bütünüyle değiştiriyordu; form yalnızca 8 alan gönderdiği için kaydın
   `sablon` (hazır liste kodu) ve `no` (sıra numarası) alanları düşüyor, kayıt
   "Liste: …" filtresinden çıkıp **"Tüm kaynaklar"** görünümüne düşüyordu. Ayrıca
   düzenleme formunda kaydın işyeri seçenekler arasında yoksa tarayıcı ilk işyerini
   seçiyor ve kayıt yanlış işyerine taşınabiliyordu.
2. **Çoklu personel sistemi** acil durum planı ve risk değerlendirmesi ekipleri için
   rol başına **liste** modeline geçirildi. Eski tek kişilik kayıtlar silinmeden
   yeni modele köprü kuruldu (geriye dönük uyum).
3. **Yönetici onay mekanizması sertleştirildi:** talep artık modül/kayıt/işlem türü ve
   eski-yeni değerleri taşıyor; **sürüm çakışması**, **kendi talebini onaylama** ve
   **aynı talebin iki kez uygulanması** engellendi.

Ek olarak: **Çalışma planında yıl + ay seçimi** (12 ay) tamamlandı, plan kaydı kısmi
güncellemeye geçirildi ve **T.C. kimlik numarası** listede maskelenmeye başladı.

---

## 2. Değiştirilen dosyalar

| Dosya | Değişiklik |
|---|---|
| `assets/js/depo.js` | `dosyaKaydet` ve `planKaydet` kısmi güncelleme; çoklu personel modeli (`uyeListe`, üye kimlikleri, `riskEkipUyeleri` / `acilEkipUyeleri`, seçimli silme); `talepDurum`; `talepKarar` karar veren kimliği; `ISG.tcMaskele` / `ISG.tcGoster`; `ACIL_ROLLERI` 5 → 10 görev grubu |
| `assets/js/yetki.js` | Talep gövdesi (modül, kayıtId, işlemTuru, eskiKayit, yeniKayit); `surumDenetle`; kendini onaylama engeli; "uygulanıyor" kilidi (çift uygulama engeli); karar veren kimliği denetim kaydına |
| `assets/js/sayfalar-rapor.js` | Onay ekranında modül/kayıt/işlem bilgisi, eski-yeni değer tablosu, ret gerekçesi alanı; risk ve acil kartlarında çoklu personel listesi (kişi başına düzenle/kaldır); `rolOzeti` ile rol satırı özeti (tek kişide ad, çok kişide "N kişi") ve etiketli belge alanları |
| `assets/js/sayfalar-kayit.js` | Plan sayfasında **ay seçici** (Ocak–Aralık + Tüm aylar) ve ay filtresi, "ayı belirsiz" bilgisi |
| `assets/js/sayfalar.js` | Personel listesinde T.C. kimlik numarası maskeleme |
| `assets/js/uygulama.js` | Dosya düzenleme formunda işyeri seçeneği garantisi; ekip üyesi diyaloğunda çoklu üye + belge alanları; plan diyaloğunda 12 aylık seçim ızgarası ve yıl varsayılanı; talep reddinde gerekçe okuma |
| `index.html`, `404.html` | Ekip üyesi formuna `uyeId/eskiRol/eskiAd` ve belge alanları; varlık sürüm damgaları |
| `assets/css/style.css` | Ay seçim ızgarası, çoklu personel alt satırları, onay eski/yeni tablosu ve ret gerekçesi alanı stilleri; **rol satırı düzen düzeltmesi** (etiket sıkışması/sarması) |
| `tools/kontrol.js` | Yeni test bölümleri (22–25), güncellenmiş rol/buton sayıları ve düzen regresyon testleri |

> **§13 sonrası ek değişiklikler:** `assets/js/depo.js` (acil ekip normalizasyonu:
> `acilEkipHazirla`, `acilRolAdi`, `acilEkipUyeleri/Ekle/Sil`), `assets/js/uygulama.js`
> (acil plan diyaloğunda çoklu ekip düzenleyicisi, `isyeriKutulari` yeni markup),
> `assets/js/sayfalar-rapor.js` (ortak `SAYFALAR.ekipListesi`), `index.html`
> (yetki listesi `secim-listesi`, plan diyaloğu `#acilPlanEkip`), `assets/css/style.css`
> (onay kutusu hizalama kuralları), `tools/kontrol.js` (13 yeni kontrol).
>
> **§14 sonrası ek değişiklikler:** `assets/js/varsayilan-veri.js`
> (`ISG.MEVZUAT_KATALOGU`, 20 başlık + `kapsam` alanı), `assets/js/sayfalar-rapor.js`
> (`mevzuatKaynagi`, `Kapsam:` satırı, kapsam araması), `assets/css/style.css`
> (`.mevzuat-kapsam`), `tools/demo-veri.js` (katalog tek kaynak),
> `tools/kontrol.js` (§15'e 14 kontrol).

---

## 3. Yetkilendirme ve yönetici onay mekanizması

### 3.1 Mevcut yapı (korundu)
- Roller: **Yönetici** (tüm işyerleri, doğrudan yazar, onaylar), **Yetkili**
  (atandığı işyerlerinde çalışır, değişiklikleri onaya gönderir), **Görüntüleyici**
  (salt okuma). Rol çözümlemesi Türkçe/İngilizce eşlemelerle yapılır.
- `yetki.js` depo yazma işlemlerini sarar: yetkili kullanıcı `personelKaydet`,
  `dosyaSil`, `planKaydet` gibi çağrıları doğrudan veriye yazamaz; **talep**
  oluşturulur (`eylem.ad`, `eylem.args` ile yeniden oynatılır).
- İşyeri kapsamı (`kapsam`, `kapsamliVeri`) arayüzün gördüğü veriyi süzer; yetkisiz
  işyeri görünmez.

### 3.2 Bu turda eklenenler
- **Talep gövdesi genişletildi:** `modul`, `kayitId`, `islemTuru` (`ekle` /
  `guncelle` / `sil`), `eskiKayit`, `yeniKayit`, `kullaniciRol`.
- **Sürüm denetimi:** Talep oluşturulduktan sonra kayıt başka bir kullanıcı
  tarafından değiştirilmişse onay **reddedilir**; eski değerin üzerine yazılmaz.
- **Kendi talebini onaylama engeli:** Yönetici dahi kendi oluşturduğu talebi
  onaylayamaz (ikinci yönetici gerekir).
- **Çift uygulama engeli:** Onay öncesi talep `uygulaniyor` durumuna kilitlenir;
  uygulama hata verirse talep yeniden `bekliyor` olur. İkinci onay denemesi
  "Bu talep zaten karara bağlanmış" hatası alır.
- **Onay ekranı:** Talep sahibi, rolü, kurum/işyeri, modül, işlem türü, kayıt
  kimliği, talep tarihi, **eski/yeni değer tablosu** ve **ret gerekçesi** alanı.
- **Denetim izi:** `talep`, `onay`, `ret`, `yazma`, `giris`, `cikis` kayıtları;
  onaylayan kimliği ve karar tarihi saklanır.

### 3.3 Sunucu tarafı (dürüst sınır)
Uygulama **statik** bir GitHub Pages sitesidir; ortak kayıt Supabase'de tek satırlık
`isg_veri` tablosunda **JSON gövde** olarak tutulur (`veri`, `guncelleme`, `oda`) ve
anon anahtarıyla REST üzerinden okunur/yazılır. Bu mimaride kayıt bazında RLS
politikası yazılamaz: istemci tüm gövdeyi indirir. Bu nedenle:
- Yetki/onay denetimi **istemci katmanında** (depo sarmalayıcıları) uygulanır,
- Doğrudan REST çağrısı yapan biri gövdeyi değiştirebilir; bunu engellemek için
  **Supabase Edge Function + RLS** tabanlı bir yazma yolu (ve ayrı tablolar)
  gereklidir. Bu, ayrı bir mimari göç çalışmasıdır ve bu turda yapılmadı.
- Parolalar ortak kayıtta **düz metin** tutulmaktadır (bilinen risk; hash'leme
  ayrı bir görev olarak önerilir).

---

## 4. Çalışma planı: yıl ve ay seçimi

- Plan sayfasına **"Plan ayı"** seçicisi eklendi (Tüm aylar + Ocak…Aralık).
  Yıl seçicisi zaten vardı; ikisi birlikte çalışır.
- Filtre, kaydın `aylar` dizisinde (yoksa `ay` alanında) seçilen ayı arar.
- Plan diyaloğunda **12 aylık seçim ızgarası** artık gerçekten üretiliyor
  (önceden boş bir `<div>` idi); yıl alanı kayıttan / ekrandaki yıldan / içinde
  bulunulan yıldan doldurulur, birden çok ay işaretlenebilir.
- **Plan kaydı kısmi güncellenir:** düzenleme sırasında formda olmayan `yil`,
  `aylar`, `anaBaslik` alanları korunur (önceden kayıt bütünüyle değiştiği için
  yıl/ay bilgisi kayboluyordu).
- Ayı belirlenemeyen kayıtlar silinmez/taşınmaz; "Tüm aylar" görünümünde listelenir
  ve arayüz "ayı belirsiz" bilgisini gösterir.

---

## 5. Çoklu personel sistemi (acil durum + risk)

### 5.1 Veri modeli
- `acilPlanlar[].ekip` → `[{ id, rol, ad, personelId, belgeNo, belgeSinifi, gecerlilik, aciklama }]`
  (aynı görevde birden çok kişi).
- `riskEkipleri[].uyeListe[rol]` → aynı yapı; eski `uyeler[rol]` ve `uyeIdleri[rol]`
  alanları **silinmedi**, ilk üyeyle eşitlenerek okunabilir kaldı (dışa aktarımlar
  ve eski ekranlar bozulmadı).
- Aynı kişi aynı görevde ikinci kez eklenmez (ad + personel kimliği ile mükerrer
  denetimi). Bir kişi farklı görevlerde yer alabilir.
- Görev grupları: iş güvenliği uzmanı, işyeri hekimi, diğer sağlık personeli,
  ilk yardım, yangın söndürme, kurtarma, tahliye/arama kurtarma, koruma, destek,
  acil durum koordinatörü (5 → 10 grup). **Mevcut görev adları değiştirilmedi**,
  böylece eski kayıtlar yeni gruplara kaymadan yerinde kalır.

### 5.2 Arayüz
- Her görev grubunda "Kişi ekle" düğmesi; tek kişi varsa rol satırından "Kaldır",
  birden çok kişi varsa **kişi başına** "Düzenle" ve "Kaldır".
- Üye diyaloğunda belge numarası, belge sınıfı, belge geçerlilik tarihi ve açıklama
  alanları; liste satırlarında bu bilgiler görünür (yazdırma görünümünde de).
- Kayıtlar `localStorage` + ortak kayıt üzerinden kalıcıdır; sayfa yenilendiğinde korunur.

---

## 6. Dosya kontrolü hatasının çözümü

**Belirti:** Bir kontrol maddesi güncellendiğinde madde kendi işyerinden/listesinden
çıkıp "Tüm Kaynaklar" alanına geçiyordu.

**Kök neden (kanıtlanmış):**
1. `depo.dosyaKaydet`, kaydı **bütünüyle değiştiriyordu**. Form yalnızca `id,
   isyeriId, bolum, madde, durum, sorumlu, yenileme, kontrolTarihi, aciklama`
   gönderdiğinden hazır listeden gelen kayıtların **`sablon`** alanı siliniyordu.
   Dosya Kontrolleri ekranındaki kaynak filtresi `dosya.sablon` ile çalıştığı için
   madde "Liste: …" seçeneğinden düşüp yalnızca "Tüm kaynaklar" altında kalıyordu.
2. Aynı nedenle `no` (sıra numarası) sıfırlanıp yeniden hesaplanıyordu.
3. Düzenleme formu işyeri listesini kapsam süzgeciyle dolduruyordu; kaydın işyeri
   listede yoksa tarayıcı **ilk işyerini** seçiyor ve kayıt yanlış işyerine
   taşınabiliyordu.

**Çözüm:**
- `dosyaKaydet` **kısmi güncelleme** yapar: gönderilmeyen alanlar korunur, boş
  `isyeriId` gönderimi bağı koparmaz, `no` korunur.
- `dosyaAc` kaydın işyeri seçeneklerde yoksa o seçeneği listeye ekleyip seçili getirir.
- İşyeri değişikliği yalnızca kullanıcı açıkça farklı işyeri seçerse uygulanır.

**Test (kontrol.js §22):** madde açılır → durum/açıklama/tarih değiştirilir →
kaydedilir → `isyeriId`, `sablon`, `no` aynı kalır, mükerrer kayıt oluşmaz, boş
işyeri gönderimi bağı koparmaz, diskteki (localStorage) kayıt da doğrudur. **Geçti.**

**Not:** Bu hatadan önce bozulmuş kayıtlar (sablon alanı zaten kaybolmuş olanlar)
otomatik onarılmadı; hangi listeye ait oldukları veri içinde bilinmiyor. Gerekirse
ilgili işyerinde hazır liste yeniden uygulanabilir (mükerrer maddeler atlanır).

---

## 7. Veri bütünlüğü ve migration

- **Hiçbir veri silinmedi, sıfırlanmadı.** Tüm değişiklikler geriye dönük uyumlu:
  - Eski `uyeler` / `uyeIdleri` / `ekip` alanları korunur, okunurken yeni modele köprü kurulur.
  - Eski plan kayıtlarının `yil` / `aylar` alanı yoksa zorla doldurulmaz; görünümde türetilir.
  - Eski acil durum görev adları korunduğu için mevcut ekip üyeleri yerinde kalır.
- Kısmi güncelleme (`dosyaKaydet`, `planKaydet`) sayesinde formdan geçen kayıtlar
  artık bilinmeyen alanlarını kaybetmez.
- Onay akışında **sürüm denetimi** ile eşzamanlı düzenleme çakışması veri kaybına
  dönüşmez.
- Ortak kayıt (Supabase) şeması değiştirilmedi: `isg_veri(veri, guncelleme, oda)`.
- Silme işlemleri depo katmanında **mezar taşı** (`senkron.silinen`) ile işaretlenir;
  bu, bulut eşitlemesinde silinen kaydın geri gelmesini engeller. "Geri alınabilir
  arşivleme" (soft delete) ayrı bir görev olarak açık bırakılmıştır.

---

## 8. Sağlık verileri ve KVKK

- Sağlık Takibi modülünde erişim **talep + yönetici onayı** ile verilir
  (`saglikErisimTalepKaydet` / `saglikErisimKarar`); görüntüleyici erişemez,
  yetkili yalnızca kendi işyeri kapsamında yazar.
- Personel listesinde **T.C. kimlik numarası maskelenir** (`123******01`);
  tam değeri yalnızca yönetici görür (`ISG.tcMaskele` / `ISG.tcGoster`).
- Görüntüleme/yazma/onay/ret işlemleri denetim izine yazılır; denetim kayıtlarını
  sıradan kullanıcı temizleyemez (`denetimTemizle` yönetici korumasındadır).
- Sağlık verileri ortak kayıtta ayrı bir kasada (`isgtakip.saglik.kasa`) tutulur.

---

## 9. Gerçekleştirilen testler

| Test | Sonuç |
|---|---|
| `npm test` → `tools/kontrol.js` (duman testi, 719 kontrol) | **PASS (719 geçti, 0 başarısız)** |
| `npm test` → `tools/belge-test.js` (27 kontrol) | **PASS** |
| `node test/kullanicitest.js` (kullanıcı/rol/denetim) | **PASS** |
| `node test/senkrontest.js` (bulut eşitleme, CAS, geri çekilme) | **PASS** |
| `node test/girisbuluttest.js` (yavaş bağlantıda giriş) | **PASS** |
| `node test/bulutgiristest.js` (çevrimdışı cihaz hesabı) | **PASS** |
| `node test/sagliktest.js` | **PASS** |
| `node test/sagliktoplutest.js` | **PASS** |
| `node tools/varlik-surum.js --denetle` (damga denetimi) | **PASS** |

### Bu turda eklenen/etkinleştirilen test bölümleri (kontrol.js)
- **§22 Dosya kontrolü:** işyeri, `sablon`, `no` korunumu; boş işyeri gönderimi;
  mükerrer kayıt yok; disk kalıcılığı.
- **§23 Çoklu personel:** aynı göreve iki personel, belge alanları, benzersiz kimlik,
  mükerrer engeli, tek kişi silme, eski kayıt korunumu, risk ekibi çoklu üye,
  geriye dönük `uyeler` uyumu, arayüzde alt satırlar, disk kalıcılığı.
- **§24 Onay mekanizması:** talebe dönüşme, modül/kayıt/işlem türü, eski-yeni değer,
  kaydın değişmemesi, silme talebi, onay ekranında diff + ret gerekçesi,
  sürüm çakışması, kendini onaylama engeli, çift uygulama engeli, karar bilgisi.
- **§25 Çalışma planı:** yıl ve ay seçicileri, 12 aylık ızgara, ay/yıl kaydı,
  ay filtresi (dolu/boş ay), plan düzenlemesinde yıl-ay korunumu.
- **KVKK:** kimlik maskesi ve yönetici görünümü.

### Başarısız / yapılmayan
- **Başarısız test yok.** Tüm suite'ler yeşil.
- Bu turda **yapılmayanlar** (bilerek, dürüstçe raporlanır):
  - Sunucu tarafı RLS / Edge Function ile yetki zorlaması (mimari göç gerekir).
  - Parolaların hash'lenmesi (ortak kayıtta hâlâ düz metin).
  - Silmelerde geri alınabilir arşiv (soft delete) akışı.
  - Geçmişte bozulmuş dosya kontrolü kayıtlarının otomatik onarımı.
  - `tools/plan-aktar.js` içindeki önceden var olan yerel değişiklik (bu göreve ait
    değil; commit'e dahil edilmedi).

---

## 10. Git ve yayın

- Varlık damgaları (`?v=…`) `npm run surum` ile yenilendi; `node tools/varlik-surum.js --denetle`
  → **"Varlık sürümleri güncel (index.html, 404.html)"**.
- Yayın paketi `npm run yayin` ile üretildi (28 dosya, 1205.1 KB).
- **Commit:** `face3e3` — "Onay akisi sertlestirme, plan yil/ay secimi, coklu personel
  ekipleri ve dosya kontrolu isyeri bagi duzeltmesi"
- `post-commit` kancası `origin/main` dalına gönderdi; `pre-push` kancası tüm testleri
  yeniden çalıştırdı ve geçti. `git status` → `main...origin/main` (fark yok).
- `.github/workflows/kontrol.yml` push sonrası damga denetimi + `npm test` + canlı
  doğrulama işlerini çalıştırır.

### Canlı doğrulama
`node tools/yayin-dogrula.js --bekle 300` → **çıkış kodu 0**

```
Deneme 1: canlı sürüm yerelle aynı (19 varlık doğrulandı).
  assets/css/style.css               v=d49b574a   içerik aynı
  assets/js/depo.js                  v=a24ad5ec   içerik aynı
  assets/js/yetki.js                 v=1bc4f36c   içerik aynı
  assets/js/sayfalar.js              v=c64892d6   içerik aynı
  assets/js/sayfalar-kayit.js        v=3d87e3b8   içerik aynı
  assets/js/sayfalar-rapor.js        v=006297aa   içerik aynı
  assets/js/uygulama.js              v=c5e58d89   içerik aynı
  … (19/19 varlık eşleşti)
```

Canlı site: https://mehmetkurt0948-dev.github.io/isg-takip-merkezi/

**Not:** Önceki `yayin:dogrula` çıktısındaki "HTML damgası farklı" satırları, push
henüz tamamlanmadan çalıştırıldığı içindi; push sonrası doğrulama **tam eşleşme** verdi.

---

## 11. Kullanıcıya notlar

- Tarayıcıda **Ctrl+F5** (sert yenileme) yapın; `?v=` damgaları değişti.
- Çalışma planında yıl ve ay seçicileri sağ üstte; seçili dönem başlıkta görünür.
- Acil durum/risk kartlarında aynı göreve birden çok kişi ekleyebilirsiniz;
  kişi başına belge no, belge sınıfı ve geçerlilik tarihi girilebilir.
- Yetkili kullanıcı bir kaydı düzenlediğinde talep oluşur; yönetici onay ekranında
  eski/yeni değerleri görür, gerekçe yazarak reddedebilir. Yönetici kendi talebini
  onaylayamaz — ikinci bir yönetici gerekir.
- Dosya Kontrolleri'nde bir maddeyi düzenlemek artık maddeyi listesinden/işyerinden
  koparmaz. Bu hatadan önce bozulmuş maddeler için hazır listeyi yeniden
  uygulayabilirsiniz (mükerrerler atlanır).
- Personel listesinde kimlik numarası maskeli görünür; tam değer yönetici hesabında.
- Risk/acil kartlarında çoklu grupta rol satırı **"N kişi"** yazar; kişiler alt
  satırlarda numaralı listelenir, belge alanları etiketli görünür ("Belge sınıfı: A",
  "Belge no: …", "Geçerlilik: …", "Sicil: …").

---

## 12. Ek düzeltme (kullanıcı bildirimi): ekip rol satırı düzeni

**Belirti:** Risk Değerlendirmesi kartında "İş güvenliği uzmanı" gibi bir görev
grubunda birden çok kişi varken rol etiketi sıkışıp dikey harf kırıntısına
dönüşüyor, isim listesi ve alt satır bilgileri üst üste biniyordu. Ayrıca kişi
alt satırlarında yalnızca "A" gibi çıplak bir belge sınıfı harfi görünüyordu.

**Kök neden:**
1. `.rol-satir .rol-ad { flex: 1; min-width: 0; }` — rol etiketi esneyen tek öğeydi;
   satırdaki uzun isim listesi (`b`) ve düğme grubu yer kapladığında etiket
   sıfıra kadar sıkışıp harf harf alt satıra kırılıyordu (görseldeki dikey
   "İs / 9 gü / uzma" kırıntıları).
2. Rol satırında isimler virgülle birleştirilip yazılıyor, aynı isimler alt
   satırlarda tekrar listeleniyordu (gereksiz kalabalık).
3. `rol-uye` satırında belge sınıfı etiketsiz (`A`) yazılıyordu.

**Çözüm:**
- `.rol-satir` artık **sarılabilir** (`flex-wrap: wrap`); `.rol-ad` esnemiyor
  (`flex: 0 0 auto`), isim özeti `flex: 1 1 150px` + `overflow-wrap: anywhere`.
  Böylece etiket her zaman tek parça okunur, uzun isimler alt satıra iner ve
  düğmeler sağda kalır.
- Yeni `rolOzeti()` yardımcısı: tek kişide ad, çok kişide **"N kişi"** özeti
  (ayrıntılar alt satırlarda). İsim listesi tekrarı kaldırıldı.
- `.rol-uye` satırında belge bilgisi kendi satırına alındı
  (`.rol-uye .kucuk { flex: 1 1 100% }`) ve etiketlendi
  ("Belge sınıfı: A", "Belge no: …").
- Dar ekranlar için `rol-uyeler` girintisi azaltıldı.

**Test (kontrol.js §23):** çoklu grupta rol satırı "N kişi" gösterir, rol
satırında virgüllü isim listesi tekrar etmez, "İş güvenliği uzmanı" etiketi tek
parça ve tam yazılır, kişi alt satırında "Belge sınıfı: A" etiketi görünür.
**Geçti.**

**Doğrulama:** `node tools/varlik-surum.js` → `?v=` damgaları yenilendi;
`node tools/varlik-surum.js --denetle` → güncel. `node tools/kontrol.js`
→ **723 geçti, 0 başarısız**; `node tools/belge-test.js` → 27 geçti;
`kullanicitest / sagliktest / sagliktoplutest / senkrontest / girisbuluttest`
→ hepsi 0. `npm run yayin` → 28 dosya.

## 13. Ek düzeltme (kullanıcı bildirimi): yetki kutuları hizası + acil planda çoklu ekip

### 13.1 Kullanıcılar / Yetkiler — işaretleme kayması

**Belirti:** Yeni kullanıcı diyaloğundaki "Yetkili olduğu işyerleri" listesinde
onay kutuları satırın sağına kayıyor, uzun işyeri adlarında kutu bir alt satıra
düşüyor ve etiketler tek hizada durmuyordu (ekli görsel).

**Kök neden:** Liste kapsayıcısı `rol-kutulari`, satırlar `satir-secenek`
sınıfını kullanıyordu ve bu iki sınıfın **hiçbir CSS kuralı yoktu**. Kutular bu
yüzden satır içi (inline) akışa düşüyordu. Dahası kapsayıcı `fieldset.alan`
içindeydi; `.alan input { width: 100% }` kuralı onay kutularını da tam satır
genişliğine açıyor, işaret ile etiketin yerini bozuyordu.

**Çözüm:**
- Kapsayıcı, projede zaten var olan `.secim-listesi` bileşenine bağlandı
  (`index.html` → `class="secim-listesi"`); satırlardaki `satir-secenek` sınıfı
  kaldırıldı, her kutu kendi `<label>` + `<strong>`/`<small>` yapısında.
- `.alan` bloğundan **sonra** gelen yeni kurallar (`style.css`):
  onay kutusu `15×15`, `flex: none`, `width:auto`; etiket `display:flex` +
  `align-items:flex-start`; ad ve açıklama `span` içinde alt alta.
  Böylece işaretler tek sütunda hizalanır, açıklama taşmaz.
- `isyeriKutulari()` (uygulama.js) markup'ı yeni yapıya göre sadeleştirildi.

### 13.2 Acil Durum Planı — aynı göreve birden fazla kişi

**Belirti:** "Acil durum planı" diyaloğunda görev başına tek isim alanı vardı
(koordinatör, yangın, ilk yardım, tahliye). Aynı göreve ikinci kişi (ör. ikinci
bir işyeri hekimi) bu diyalogdan eklenemiyordu; risk değerlendirmesindeki çoklu
personel davranışının aynısı isteniyordu.

**Çözüm:**
- `acilPlanDiyalog` içindeki dört tek kişilik metin alanı kaldırıldı; yerine
  `#acilPlanEkip` çoklu ekip düzenleyicisi geldi. Risk kartındaki satır düzeni
  ortak yardımcıya taşındı: `SAYFALAR.ekipListesi()` (`sayfalar-rapor.js`) hem
  risk kartı, hem acil kartı, hem plan diyaloğu için **tek kaynak**.
- Plan diyaloğu `ACIL_ROLLERI`nin **10 görev grubunu** da listeler; her satırda
  kişi özeti ("N kişi"), "Kişi ekle" ve kişi başına "Düzenle / Kaldır" bulunur.
  Kişi ekleme/silme sonrası diyalog listesi anında tazelenir
  (`acilPlanEkipTazele`).
- `acilPlanForm` gönderimi artık yalnızca tarihleri kaydeder
  (`D.acilPlanKaydet`); ekip üyeleri plan kaydı sırasında **silinmez**.
- Depo katmanı sağlamlaştırıldı (`depo.js`):
  `acilEkipHazirla()` çok eski kayıtlardaki **nesne** biçimli ekip alanını
  (rol→ad) diziye çevirir; `acilRolAdi()` hem rol kimliğini (`hekim`) hem rol
  adını (`İşyeri hekimi`) aynı görev kabul eder. `acilEkipEkle/Sil/Uyeleri` ve
  `ISG.acilPlanOzeti` bu köprüyü kullanır — eski kayıtlarda kayıtlı kişiler
  görünümde kaybolmaz.

**Test (kontrol.js §12, §12b, §14):**
- Plan diyaloğunda 10 görev satırı var, tek kişilik `ekip_*` alanı kalmadı.
- Plan diyaloğundan aynı göreve iki hekim eklendi → `ekip` içinde 2 kayıt,
  liste anında "2 kişi" gösteriyor, plan kaydından sonra üyeler korunuyor.
- Eski nesne biçimli ekip dizisine çevriliyor; rol kimliğiyle yazılmış üye
  doğru görev grubunda görünüyor, başka gruba sızmıyor.
- Yetki listesi `secim-listesi` kabında, `satir-secenek` kalmadı, her kutu kendi
  etiketi içinde ve etiketler `strong` + `small` taşıyor.

**Doğrulama:** `node tools/varlik-surum.js` → `?v=` damgaları yenilendi;
`--denetle` → güncel. `node tools/kontrol.js` → **736 geçti, 0 başarısız**
(13 yeni kontrol). `belge-test` 27, `kullanicitest / sagliktest /
sagliktoplutest / senkrontest / girisbuluttest` → hepsi geçti.

## 14. Mevzuat ve kapsam sayfası: yerleşik kapsam kataloğu (kullanıcı isteği)

**İstek:** "Mevzuat kapsam" bölümünün canlı sitedeki `Mevzuat ve kapsam` sayfasına
eklenmesi.

**Durum tespiti:** Sayfa `assets/js/sayfalar-rapor.js → SAYFALAR.mevzuat` içinde
zaten vardı; ancak listeyi yalnızca `hesap.mevzuat` dizisinden okuyordu. Bu dizi
`ISG.BOS_VERI()` içinde **boş** açılıyor ve arayüzde mevzuat başlığı **ekleme
yolu yok** (kayıt/dışa aktarma akışı bulunmuyor). Sonuç: canlı sitede sayfa her
zaman "0 başlık / Başlık bulunamadı" görünüyordu. Ekteki `İsg takip merkezi chat
cpt` klasöründe ise kod yok — yalnızca `README.md` ve boş `site/`, `sources/`
klasörleri var (kaynak, ChatGPT oturumu istediği için alınamamış). Bu yüzden
kapsam içeriği projenin kendi mevzuat kataloğundan (eski `tools/demo-veri.js`
dizisi) üretilip **kalıcı katalog** hâline getirildi.

### 14.1 Yapılan değişiklikler

| Dosya | Değişiklik |
|---|---|
| `assets/js/varsayilan-veri.js` | Yeni `ISG.MEVZUAT_KATALOGU()`: 20 başlık (1 kanun, 14 yönetmelik, 2 tebliğ, 1 rehber, 1 standart) ve her başlıkta `kapsam` alanı |
| `assets/js/sayfalar-rapor.js` | `mevzuatKaynagi()` yardımcısı: kayıtlı başlık varsa onu, yoksa yerleşik kataloğu okur (veriye yazmaz); satırlarda `Kapsam:` alt satırı; sayaç, kategori listesi ve "gözden geçir" sayısı tek kaynaktan; aramaya `kapsam` alanı eklendi |
| `assets/css/style.css` | `.mevzuat-satir small.mevzuat-kapsam` ve içindeki `b` için stil (mevcut `.mevzuat-satir small` kuralını ezer) |
| `tools/demo-veri.js` | Kendi mevzuat dizisi kaldırıldı; `ISG.MEVZUAT_KATALOGU()` çağrılıyor (demo ile yayın aynı başlıkları görür) |
| `tools/kontrol.js` | §15'e 14 yeni kontrol (kapsam satırı, kapsam araması, kategori filtresi, yerleşik katalog davranışı) |

### 14.2 Kapsam alanı ne yazıyor?

Her başlık üç bilgi taşıyor: `dayanak` (RG tarih/sayı veya standart no), `ozet`
(tek cümlelik yükümlülük) ve **`kapsam`** (kimlerin kapsamda olduğu). Örnek:

- `m01` **6331** — çalışanı olan tüm kamu/özel işyerleri; ev hizmetleri, TSK,
  genel kolluk, MİT faaliyetleri ve afet-acil müdahale faaliyetleri **kapsam dışı**.
- `m02` **Risk Değerlendirmesi Yönetmeliği** — tüm çalışanlar (alt işveren, geçici
  çalışan, stajyer dahil); yenileme çok tehlikeli 2 / tehlikeli 4 / az tehlikeli 6 yıl.
- `m03` **İSG Kurulları** — 50 ve üzeri çalışanı olan sürekli işler; alt işveren
  çalışanları sayıya eklenir, eşik altında çalışan temsilcisi.
- `m20` **ISO 45001** — gönüllü standart; sözleşme veya müşteri şartıyla bağlayıcı.

Katalog bir uygunluk belgesi sayılmıyor: sayfadaki mevcut uyarı metni korunarak
"güncel birleştirilmiş metinler Resmî Gazete / Mevzuat Bilgi Sistemi üzerinden
doğrulanmalıdır" bilgisi duruyor.

### 14.3 Davranış kuralları

- **Katalog veriye yazılmaz.** `hesap.mevzuat` boş kalır; yedek, dışa aktarma ve
  bulut eşitlemesi katalogla şişmez. Kayıt geldiğinde (ileride başlık ekleme
  eklenirse) sayfa otomatik olarak kayıtlı listeye döner.
- **Kullanıcıya görünür bilgi.** Yerleşik katalog kullanılıyorsa sayfada
  "Yerleşik mevzuat kataloğu" açıklaması ve "Liste yerleşik katalogdan geliyor"
  ifadesi çıkar; kayıtlı başlık varsa bu ifadeler kaybolur.
- **Boş açılış kuralı bozulmadı.** `ISG.BOS_VERI()` hâlâ boş açılır; §0b
  testlerindeki "tüm kayıt listeleri boş" kontrolü geçmeye devam ediyor.

**Test (kontrol.js §15):** 20 satır; her satırda `small.mevzuat-kapsam`; "Kapsam:"
ve "kapsam dışıdır" metni; katalog kayıtlarının `id/baslik/dayanak/kapsam/ozet`
alanları; "gürültü" araması 1 satır; "kapsam dışıdır" araması 1 satır (kapsam
metni taranıyor); `Standart` kategorisi 1 satır; kayıt yokken yerleşik katalog 20
satır + uyarı metni + sayaç; mevzuat dizisinin **boş kalması** (veriye yazılmıyor);
demo yeniden yüklenince yerleşik uyarının kaybolması.

**Doğrulama:** `node tools/kontrol.js` → **747 geçti, 0 başarısız**;
`node tools/belge-test.js` → geçti; `node tools/varlik-surum.js --denetle` → güncel.



