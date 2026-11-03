# Sağlık Takibi Görev Raporu

- **Tarih:** 3 Kasım 2026
- **Sürüm:** `2.18.0`
- **Commit:** `a23d5ac` — *ozellik: saglik takibinde tam personel listesi, katlanir kayit formu ve excel ice/disa aktarma*
- **Yayın:** https://mehmetkurt0948-dev.github.io/isg-takip-merkezi/#saglik
- **Yedek:** `%TEMP%\isg-saglik-yedek-20261103-175238` (değiştirilen dosyaların işlem öncesi kopyası)

## 1. Bildirilen sorunlar ve kök nedenleri

| Sorun | Kök neden | Çözüm |
|---|---|---|
| Çalışma kitabı sekmelerinde **`[object Object]`** | `calismaKitabi.sekmeler` dizisi `{ ad, satirlar }` nesneleri tutuyor; arayüz doğrudan nesneyi `kacis()` ile basıyordu. | Etiket için `sekme.ad` okunuyor; eski düz metin biçimi de destekleniyor. |
| Sekme sayaçlarının yanlış/şişkin olması | Başlık satırı sayımdan düşülüyordu ancak etiketler nesne olduğu için tablo hiç doğru sekmeyi göstermiyordu. | Sayaç `satirlar.length - 1` olarak, seçili sekme sınırlandırılarak hesaplanıyor. |
| 1163 satırlık TAM LİSTE'nin tek seferde basılması | Sayfalama yoktu. | Çalışma kitabı tablosuna **50 satırlık sayfalama** eklendi. |
| Sağlık aramasının çalışma kitabı aramasını ezmesi | `data-ui` değeri `saglik*` ile başlayan **her** giriş `UI.saglikKitapArama` alanına da yazılıyordu. | Her kutu yalnızca kendi listesini/sayfasını sıfırlıyor (`saglikArama`, `saglikKitapArama`, `saglikKisiArama`). |
| Formun sayfada sürekli açık ve ham kimlikli olması | `personelId` / `isyeriId` serbest metin alanıydı, form her çizimde açıktı. | Form katlanır panele alındı; kişi/işyeri kayıtlı listelerden seçiliyor, kişi seçilince işyeri otomatik doluyor. |
| Kaydı olmayan personelin görünmemesi | Liste yalnızca sağlık kayıtlarından üretiliyordu. | **Tam personel listesi** eklendi; kaydı olmayanlar `MUAYENE YOK` rozetiyle izleniyor. |
| Excel içe/dışa aktarma ve şablon eksikliği | Yalnızca beş sekmeli çalışma kitabı görüntülenebiliyordu. | `ISG.saglikToplu` modülü + şablon, ön izlemeli içe aktarma ve dışa aktarma eklendi. |

## 2. Yapılan değişiklikler

### 2.1. `assets/js/sayfalar.js`
- Sekme etiketleri `sekme.ad` üzerinden; sayaçlar düzeltildi; sekme indeksi sınırlandı.
- Çalışma kitabı tablosuna sayfalama (`UI.saglikKitapSayfa`) ve `#saglik-kitap-tablo` kimliği.
- **Personel listesi kartı** (`#saglik-kisi-kart`, `#saglik-kisi-tablo`):
  - kapsamdaki tüm personel, son muayene tarihi ve durum rozeti (`UYGUN / SEVKLİ / YASAK VAR / MUAYENE YOK`),
  - arama + durum + işyeri filtreleri, 25 satırlık sayfalama,
  - satır başına **Muayene ekle**, **Geçmiş (n)** (tarih/sonuç/sevk/yasak ve Düzenle/Sil),
  - `MUAYENE YOK` sayacı.
- **Muayene kayıtları kartı** (`#saglik-kayit-kart`, `#saglik-kayit-tablo`) başlığına **Yeni kayıt** düğmesi.
- **Katlanır form** (`<details id="saglik-giris">`): varsayılan kapalı; düzenleme/ekleme ve `UI.saglikFormuAc` ile açılır.
- Form üç `fieldset` grubuna ayrıldı: *Personel ve muayene*, *Sağlık bilgileri (gizli)*, *Muayene sonucu ve iş kısıtları*.
- `personelId` ve `isyeriId` artık `<select>`; silinmiş personel/işyeri etiketi korunuyor.
- Çalışma kitabı kartına **Şablon indir**, **Sağlık kaydı Excel'den yükle**, **Excel'e aktar** düğmeleri.
- Bekleyen erişim talepleri kartı ayrı değişkene alındı ve sayfaya basılıyor.

### 2.2. `assets/js/saglik-toplu.js` (yeni)
`ISG.saglikToplu` — personel/plan toplu yükleme kalıbı:

- `SUTUNLAR` / `BASLIKLAR`: 15 sütun (Sicil No, Ad Soyad, Muayene Tarihi, Hekim, Sonuç, Sevk, Çalışma Yasağı, İzinsizlik, Çalışma Şekli, Kan Grubu, Alerji, Kronik Hastalık, İlaç, Engel, Notlar).
- `norm` / `baslikNorm`: Türkçe duyarlı eşleştirme; `2025 MUAYENE TARİHİ` gibi yıl bloklu ve parantezli başlıklar da okunur.
- `haritaBul`: başlık satırını ilk 25 satırda bulur (en az tarih + sicil/ad).
- `analizEt`: kişiyi **Sicil No → Ad Soyad** sırasıyla bulur; aynı sicil/ad birden çok kişide varsa hata verir; tarihi `ISG.excel.tariheCevir` ile çözer; dosya içi ve mevcut kayıtlara göre mükerrer ayıklar; satır bazında neden üretir.
- `uygula`: yalnızca `hazir` satırları `ISG.saglikTakip.kaydet` ile yazar (şifreleme + yetki + günlük atlanmaz).
- `sablonSayfalar` / `sablonIndir`: gerçek XLSX (2 sayfa: kayıtlar + kılavuz), CDN'siz.
- `disaAktarSayfalar` / `disaAktar`: çözülmüş kayıtları yeniden yüklenebilir XLSX'e çevirir (`İşyeri` bilgi sütunu).
- `onizlemeSatirlari`: hatalı/mükerrer satırlar önce.

### 2.3. `assets/js/uygulama.js`
- Yeni işlemler: `saglik-yeni`, `saglik-kisi-ekle`, `saglik-kisi-gecmis`, `saglik-kisi-sil`, `saglik-sablon`, `saglik-ice-aktar`, `saglik-disa-aktar`.
- `saglikTopluOnizle` / `saglikTopluDiyalogCiz` / `saglikTopluKaydetIsle` / `saglikSablon` / `saglikExcel`.
- `saglikKayitGirdi` dosya girişi (yalnız `.xlsx`), `saglikTopluForm` bağlama, diyalog kapanışında durum temizliği.
- Kişi seçimi değişince işyeri otomatik dolduruluyor.
- Sayfalama düğmeleri `data-sayfa-anahtar` ile doğru listeyi (çalışma kitabı / personel / kayıtlar) güncelliyor.
- Form kaydı/vazgeç/sil sonrası `UI.saglikFormuAc` ve `UI.saglikKisi` temizleniyor.
- Test için `ISG.uygulama.saglikToplu*` ve `saglikSablon/saglikExcel` dışa açıldı.

### 2.4. `index.html`, `assets/css/style.css`
- `saglik-toplu.js` betiği (sürüm damgalı) ve `saglikKayitGirdi` dosya girişi.
- `saglikTopluDiyalog`: dosya satırı, özet sayaçları, satır satır ön izleme, uyarı ve onay düğmeleri.
- Katlanır panel, alan grupları ve mobil görünüm stilleri.

### 2.5. Test ve araçlar
- `test/sagliktest.js`: satır/seçiciler `#saglik-kayit-tablo` ile daraltıldı (yeni tablolar sayımları bozmasın).
- `test/sagliktoplutest.js` (yeni, **50 kontrol**): personel listesi, katlanır form, kişi/işyeri seçimi, sekme etiketleri ve sayfalama, şablon, analiz, mükerrer koruması, onaylı içe aktarma, XLSX yaz/oku turu.
- `tools/kontrol.js`: diyalog sayısı 19 → 20 ve `saglikTopluDiyalog` denetimi.
- `package.json`: sürüm `2.18.0`, `test:saglik` iki test dosyasını çalıştırır.
- `.gitignore`: `yedek-saglik/`, `saglik-analiz.txt`, `saglik-yazim.txt` (kişisel sağlık verisi).

## 3. Veri güvenliği

- Mevcut personel, işyeri, kullanıcı ve sağlık kayıtlarına **dokunulmadı**; hiçbir sıfırlama yapılmadı.
- Sağlık alanları yine yalnızca `ISG.saglikTakip.kaydet` üzerinden, cihazdaki şifreli kasaya yazılıyor; içe aktarma da bu yolu kullanıyor.
- Sağlık kasası genel bulut eşitlemesine dâhil edilmedi.
- Dışa aktarılan dosyalar kişisel sağlık verisi içerir; README ve şablon kılavuzunda paylaşım uyarısı var.
- Sağlık verisi içeren geçici çıktılar ve `yedek-saglik/` artık `.gitignore` kapsamında.

## 4. Doğrulama sonuçları

| Denetim | Sonuç |
|---|---|
| `npm test` → `tools/kontrol.js` | **669 geçti / 0 başarısız** |
| `npm test` → `tools/belge-test.js` | **27 geçti / 0 başarısız** |
| `npm run test:saglik` → `sagliktest.js` | **Tüm sağlık takibi testleri geçti** |
| `npm run test:saglik` → `sagliktoplutest.js` | **50/50 geçti** |
| `node test/kullanicitest.js` | **Tüm testler geçti** (çıkış kodu 0) |
| `node test/senkrontest.js` | **SONUÇ: PASS** (çıkış kodu 0) |
| `npm run surum:denetle` | **Varlık sürümleri güncel** (index.html, 404.html) |
| `npm run yayin:dogrula -- --bekle 300` | **1. denemede canlı sürüm yerelle aynı** — 19 varlık doğrulandı |

Canlı doğrulamada `assets/js/saglik-toplu.js v=30fd72d0`, `sayfalar.js v=764f44ca`,
`uygulama.js v=adcfd3a0`, `style.css v=28a488ff` damgaları GitHub Pages'te yerelle birebir aynı.

## 5. Kullanım özeti

1. **Sağlık Takibi → Şablon indir (.xlsx)** ile şablonu indir, doldur.
2. **Sağlık kaydı Excel'den yükle** → dosyayı seç → ön izlemede *Kaydedilecek / Mükerrer / Hatalı* sayılarını ve nedenleri kontrol et.
3. **Kaydedilecekleri ekle** → kayıtlar şifreli kasaya yazılır.
4. **Personel listesi** kartında arama/durum/işyeri filtreleriyle kadroyu izle; satırdan **Muayene ekle**, **Geçmiş** ve kayıt **Düzenle/Sil**.
5. **Excel'e aktar** ile mevcut kayıtları yedekle (dosya yeniden yüklenebilir).

## 6. Bilinen, kapsam dışı bırakılanlar

- `tools/plan-aktar.js` çalışma kopyasındaki önceki oturumdan kalan değişiklikler **bilinçli olarak commit edilmedi**.
- `tools/saglik-aktar.js` (CLI) ve `yedek-plan/`, `_tmp-plan/`, `test/_*` geçici dosyaları bu göreve dâhil edilmedi.
- Beş sekmeli çalışma kitabı yükleme hâlâ SheetJS'i CDN'den çeker (önceki davranış korundu); şablon/içe-dışa aktarma CDN'siz çalışır.
- MFA/RLS gibi sunucu taraflı sağlık verisi koruması bu statik uygulamanın kapsamı dışındadır (README 1.3 ve `KURULUM-SAGLIK-TAKIP.md`).

