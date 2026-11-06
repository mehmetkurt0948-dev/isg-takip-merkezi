# Onay kuyruğunda "Kayıt değişti" yanlış-pozitifinin giderilmesi

> **Durum (6 Kas 2026): UYGULANDI — 2. maddedeki "sert kilit" yürürlükten kalktı.**
>
> Yanlış-pozitif düzeltmesi devrede: kayıt **bütünüyle** `ISG.depo.kayitEsit()` ile karşılaştırılıyor,
> anahtar sırası ve `guncelleme` damgası yok sayılıyor (bulut turunda sunucu anahtarları yeniden
> sıraladığı, her yazım damgayı tazelediği için düz metin karşılaştırması kaydı hep "değişmiş" sayıyordu).
>
> **Gerçek çakışma ise onayı engellemiyor, uyarıya dönüştü.** Gerekçe: yönetici onay ekranında
> eski/yeni değeri görüp bilerek basıyor; kilit ise gerçek yarışı yakalamadan (üretim verisindeki
> 146 bekleyen talebin 146'si "kayıt silinmiş/uygulanamıyor" değildi ama hepsi aynı tuzağa
> yarıyordu) kuyruğu tamamen tıkıyordu.
>
> Nihai sözleşme — `assets/js/yetki.js` → `surumDenetle()`:
> * Kayıt anlam olarak aynıysa → **sessiz onay**.
> * Kayıt gerçekten değişmişse → onay **uygulanır**; `sonuc.uyari` doldurulur, metin karar
>   notuna (`kararNotu`) ve denetim kaydına (`denetimEkle`, özeti `UYARI: ...` ile) yazılır,
>   yöneticiye `B.bildir(sonuc.uyari, 'uyari')` ile ayrıca gösterilir.
> * Sürüm denetimi hiçbir durumda hata fırlatmaz: kaydı bu arada silinen talep de uyarıyla
>   uygulanır (depo katmanı böyle bir eylemde sessizce hiçbir şey yazmaz).
> * Kendini onaylama ve aynı talebi iki kez onaylama kilitleri aynen duruyor.
> * Tam kaydın üzerine yazan eylemlerde (`personelKaydet`, `egitimKaydet`, `riskKaydet`, `olayKaydet`,
>   `tespitKaydet`, `belgeKaydet`) talebin payload'ında olmayan alan geri yazılır — diğer kullanıcının
>   o alandaki değeri kaybolur. Bu kabul edilmiş takastır ve denetim kaydındaki `UYARI:` satırından
>   izlenir. Alan bazlı yazan eylemlerde (`planDurumDegistir`, `dosyaKaydet`, `planKaydet`)
>   dokunulmayan alanlar korunur.
> * Karar yarım kalırsa (sekme kapandı / cihaz dondu) talep `uygulaniyor` durumunda asılı kalamaz:
>   `durumTarihi` 5 dakikadan eskiyse kilit kendiliğinden çözülür ve talep yeniden bekleyen sayılır
>   (`yetki.js → bayatKilCoz()`; `talepler()`, `talepOnayla()`, `talepReddet()` içinde çalışır).
>
> Test karşılığı: `tools/kontrol.js` onay bloğu (yarış senaryosu — `npm test` içinde), `test/onaytest.js`
> (11 senaryo) ve `test/onayui_test.js` 3-5. senaryolar (`npm run test:onay`). Uygulanmayan plan
> maddeleri §2'deki "Uygulama notu"nda tek tek sayıldı.

## 1. Kök neden (doğrulandı)
- `assets/js/yetki.js:528 surumDenetle()` → `kayitDegisti()` (520) → `ISG.depo.kayitEsit()` (`depo.js:2201`).
  Karşılaştırma **tüm kaydı** yapar; `kayitEsit` yalnızca `guncelleme` damgasını yok sayar (`SURUM_ATLANAN`).
- `eskiKayit` = talep anındaki anlık kopya (`yetki.js:469 kopyala(mevcut)`), `guncel` = `D.al()` üzerinden
  **normalize edilmiş** kayıt. `veriTamamla()` canlı kayda alan ekler/değer üretir (`no`, `aylar`, `kayipGun`,
  `gecerlilik`, boş alan doldurma); talebin içindeki kopya normalleştirmeden geçmediği için
  `yok ↔ ''`, `null ↔ ''` gibi farklar "değişti" sayılıyor.
- Başka bir kullanıcının **aynı kaydın başka alanına** yazması da aynı hatayı veriyor. Uygulanan düzeltme
  anahtar sırası + damga kaynaklı farkı çözer; `veriTamamla()` dolgusundan doğan `yok ↔ ''` farkı
  teoride hâlâ "değişti" sayılır — ama uyarı-temelli sözleşme yüzünden kuyruğu artık kilitlemez (§4/1).
- Ek: `kaydetListede()` (`depo.js:1206`) güncellemede `liste[index] = kayit` yapar → tam üzerine yazma.
- Sonuç: Onayla düğmesi kalıcı kilitleniyor (regresyon testleri: `test/onaytest.js`, `test/onayui_test.js`).

## 2. Hedef davranış: üç taraflı, alan bazlı birleştirme

> **Uygulama notu (6 Kas 2026):** Aşağıdaki alan bazlı birleştirme planlanıp **uygulanmadı**. Kuyruğu
> kilitleyen yanlış-pozitifi çözen asıl düzeltme daha sadeydi ve o devrede: `surumDenetle()` tüm kaydı
> `ISG.depo.kayitEsit()` ile **anlamsal** karşılaştırır (anahtar sırası + `guncelleme` damgası önemsiz),
> fark bulursa uyarı üretir ve onay uygulanır. Kodda **olmayanlar**: `alanEsit`, `kayitFark`,
> `istenenDegerler`, `cakismaBul`, `EYLEM_ALANLARI`, `KAYIT_YAZAR` birleştirmesi, `talepCakisma`
> (kuyruk rozeti) ve kısmi güncelleme. Aşağıdaki maddeler tarihi plan olarak okunmalı.

S = talep anındaki kayıt (`talep.eskiKayit`), C = onay anındaki kayıt, I = talebin yazmak istediği `{alan: değer}`.
1. Yalnızca `I` alanları denetlenir (`I` çıkarılamazsa bugünkü tam kayıt denetimi = muhafazakâr geri dönüş).
2. `I[f] ≡ S[f]` (anlamsal eşit) → talep o alanı hiç değiştirmiyor → denetim dışı.
3. `C[f] ≡ S[f]` → kimse dokunmamış → sorun yok.
4. `I[f] ≢ S[f]` **ve** `C[f] ≢ S[f]` **ve** `C[f] ≢ I[f]` → gerçek çakışma → onay **engellenmez**,
   uygulanır ve uyarı üretilir: değişen alanın adı + eski/yeni değeri uyarı metnine yazılır,
   karar notuna ve denetim kaydına işlenir. (Kilit planlanmıştı, sonra kaldırıldı — girişteki kutu.)
5. Çakışma olsun ya da olmasın onay uygulanır; tam üzerine yazan eylemlerde **yalnızca gerçekten
   değişen alanlar** güncel kaydın üzerine yazılır → ilgisiz eşzamanlı değişiklik korunur (kısmi güncelleme).
6. `sil` talepleri de dahil hiçbir sürüm denetimi hata fırlatmaz; hepsi uyarıya döner. Onayı
   yalnızca eylemin **kendisinin** hatası düşürür (kayıt yoksa depo katmanı sessizce hiçbir şey
   yazmayabilir — bu yüzden uyarı metni "kaydı açılan ekrandan kontrol edin" der).
7. Toplu/işyeri düzeyi eylemler (`ISYERI_TOPLU_EYLEMLER`) ve yerinde üye eylemleri bugünkü gibi.

## 3. Değişiklikler
### A) `assets/js/depo.js` — yeni yardımcılar (`kayitEsit` yanına, ~satır 2201)
`kanonikMetin`/`esitlemeOzeti` değişmez (bulut eşitlemesi bundan türetiliyor), `kayitEsit` olduğu gibi kalır.
- `ISG.depo.alanEsit(a, b)`: boş değer denkliği (`undefined/null/''/[]/{}`), sayı↔metin (`5 ↔ '5'`),
  boolean↔metin, primitif dizilerde sıra duyarsız, nesnelerde `kanonikMetin`.
- `ISG.depo.kayitFark(eski, guncel, alanlar)`: değişen alan adları. `alanlar` yoksa tüm alanlar;
  defter alanları (`guncelleme`, `durumTarihi`, `surum`, `senkron`) ve `id` her zaman hariç.
### B) `assets/js/yetki.js` — onay çekirdeği
- `EYLEM_ALANLARI`: `planDurumDegistir → {durum: planDurumNormal(args[1]), tamamlanmaTarihi: hesaplanan}`,
  `tespitDurumDegistir → {durum: args[1]}`, `riskEkipKaydet → args[1] alanları (+uyeler/uyeListe)`,
  `acilPlanKaydet → {hazirlanma, sonYenileme, tatbikat}`; payload'lı eylemler → `talep.yeniKayit` alanları.
- `KAYIT_YAZAR = {personelKaydet, egitimKaydet, riskKaydet, olayKaydet, tespitKaydet, belgeKaydet}`
  (hepsi `kaydetListede` ile tam üzerine yazar) → onayda birleştirme uygulanacak.
  `dosyaKaydet`/`planKaydet` zaten kısmi yazar; birleştirme gerekmez.
- `istenenDegerler(talep)` ve `cakismaBul(talep) → {engelli, alanlar:[{alan,eski,yeni}], mesaj}` eklenir;
  `surumDenetle()` bunu kullanır. **(Uygulanmadı — uygulanan tek uyarı metni aşağıdaki geneldir.)**
  Uyarı metni (`yetki.js → DEGISTI`):
  `Kayıt talep oluşturulduktan sonra değişmiş; onay yine de uygulandı ve talepteki değerler yazıldı. Kaydı
  açılan ekrandan kontrol edin.` Ayrıca `Kayıt artık bulunmuyor; uygulama adımı hiçbir şey yazmayabilir.`
  (silinmiş kayıt) ve `Kayıt bu arada oluşturulmuş; ...` / `Aynı kayıt bu arada oluşturulmuş; ...` (ekleme)
  uyarıları üretilir — hiçbiri hata değildir. Tek hedef kaydı olmayan işyeri toplu eylemlerinde
  (`ISYERI_TOPLU_EYLEMLER`) yalnızca işyeri denetlenir: `İşyeri artık bulunmuyor; uygulama adımı kayıt
  bulamayabilir.`
- `talepUygula(talep)`: **(Kısmi güncelleme uygulanmadı.)** Eylem olduğu gibi kendi argümanlarıyla
  çalıştırılır; tam üzerine yazan eylemlerde payload'da olmayan alan geri yazılır (§D/girişteki takas).
- `ISG.yetki.talepCakisma = cakismaBul` dışa açılır. **(Uygulanmadı.)**
- Kilit sertleştirme: `talepDurum(id,'uygulaniyor')` uygulamadan önce alınır ve hata olursa talep
  `bekliyor`a geri alınır. **(Uygulandı + tamamlandı: `durumTarihi` 5 dk eskiyse `bayatKilCoz()`
  talebi yeniden `bekliyor` yapar; `talepler()`, `talepOnayla()`, `talepReddet()` çağrılarında çalışır.)**
### C) `assets/js/sayfalar-rapor.js` — onay kuyruğu (~1040-1140)
**(Alan adlı çakışma rozeti uygulanmadı.)** Kuyrukta olan: talebin eski/yeni değer farkı
`ALAN_ADLARI` ile tablo hâlinde gösterilir (`.onay-degisim`), Onayla/Reddet düğmeleri her durumda
aktiftir; çakışma uyarısı karar sonrası bildirim olarak düşer. Rozet eklenirse `talepCakisma`
dışa açılmadan (yani alan bazlı karşılaştırma yazılmadan) mümkün değildir.
### D) Testler (uygulanan hâli)
- `test/onaytest.js` (Node, 11 senaryo / 0 başarısız): anahtar sırası + `guncelleme` damgası farkı →
  onaylanır; ilgisiz alan değişti → uyarısız onay; istenen alan değişti → **onaylanır + uyarı**
  (`kararNotu` ve denetim kaydında `UYARI:`), talep `onaylandi` kapanır; normalize kaynaklı `''↔yok` →
  onaylanır; `planDurumDegistir` uçtan uca (uyarı hem karar notuna hem denetim kaydına işlenir,
  talepteki değer kayda yazılır).
- `test/onayui_test.js` (jsdom, 50 doğrulama / 0 başarısız) — beş blok:
  1. *Anlam aynıysa:* durum değiştirme talebi uyarısız onaylanır, fark tablosu (`.onay-degisim`) çıkmaz.
  2. *İşyeri düzeyi toplu eylem:* `kayitId` yok → "kayıt bulunmuyor" hatası değil, onaylanır.
  3. *Gerçek çakışma:* bildirim "değişmiş … yine de uygulandı" der, talep `onaylandi` kapanır,
     `UYARI:` hem `kararNotu`nda hem denetim kaydında; `planDurumDegistir` olduğu için diğer
     kullanıcının `tanim` alanı korunur.
  4. *Tüm kaydın üzerine yazan eylem* (`personelKaydet`): talepteki `pozisyon` yazılır, talepte
     olmayan `gorev` geri yazılır (bilinen takas) ve bu yalnızca uyarıda görünür.
  5. *Yarıda kalan karar kilidi:* taze `uygulaniyor` talebi kuyrukta Onayla düğmesi göstermez;
     `durumTarihi` 10 dk eskiye çekilince `bayatKilCoz()` talebi yeniden bekleyen sayar, onaylanır
     ve değişiklik kayda yazılır.
- `tools/kontrol.js` onay bloğu: aynı sözleşmenin tarayıcı tarafı doğrulaması (`npm test` içinde koşar).
- Doğrulama komutları: `npm run test:onay`, `npm run test:senkron`, `npm run test:kullanici`, `npm test`,
  sonra `npm run surum` + `npm run surum:denetle` (`?v=` damgası), gerekirse `npm run yayin` + `yayin:dogrula`.
- Son durum (6 Kas 2026): `npm test` → 771 geçti / 0 başarısız, `tools/belge-test.js` → 27/0,
  `npm run test:onay` → 11 senaryo + 50 doğrulama, 0 başarısız, `surum:denetle` → güncel.

## 4. Riskler / kabuller
- "Anlamsal" eşitlik = `ISG.depo.kayitEsit()` → `kanonikMetin()` metin eşitliği; yalnızca **anahtar
  sırası** ve **`guncelleme` damgası** yok sayılır. Dizi sırası, `''↔alan yok` ve `5↔'5'` gibi tip
  farkleri hâlâ "değişiklik" sayılır → bu tip kaynaklı yanlış-pozitifler devam edebilir; farkı yaratan
  şey artık bunların onayı **engellememesidir** (yalnızca gereksiz uyarı üretir).
- Tam kaydın üzerine yazan eylemlerde (`personelKaydet`, `egitimKaydet`, `riskKaydet`, `olayKaydet`,
  `tespitKaydet`, `belgeKaydet`) talepte bulunmayan alan canlı kaydin eski değeriyle geri yazılır.
  Kısmi güncelleme yazılmadığı için "alan kaldırma" amaçlı talepler de fiilen alanı silmez.
- Bayat kilit eşiği 5 dakikadır (`bayatKilCoz`, `durumTarihi` okunamazsa hemen çözülür). İki kabul:
  (a) çöken sekme **yazmayı yapıp** durumu yazamadıysa, 5 dk sonra ikinci yönetici onayladığında
  eylem tekrar uygulanır (toplu ekleme gibi idempotent olmayan eylemlerde çift kayıt riski);
  (b) aynı talebi iki yöneticinin aynı anda onaylaması ise `talepOnayla()` başındaki
  `durum !== 'bekliyor'` denetimiyle "Bu talep zaten karara bağlanmış." hatasına düşer.
- Uyarı metni düz metindir ve denetim özeti `UYARI:` önekiyle başlar; arama/filtre bunu anahtar
  sözcük olarak kullanır.
- Bulut eşitleme koduna (`kanonikMetin`, `esitlemeOzeti`, `kayitSec`) dokunulmadı; `kayitEsit`
  `SURUM_ATLANAN = { guncelleme: 1 }` ile çağrılıyor.
