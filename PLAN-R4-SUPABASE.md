# R4 — Supabase Auth + RLS geçiş planı (uygulanmadı)

Bu belge **plandır**; hiçbir adım canlı projede çalıştırılmadı. Betik taslağı:
`supabase/migrations/20261108_r4_auth_rls.sql`.

## 1. Bugünkü durum (2.28.0)

- Bulut eşitlemesi `public.isg_veri` tablosunda **tek satırlık JSONB blok**
  (`oda` birincil anahtar, `veri jsonb`, `guncelleme timestamptz`).
- RLS açık ama politika `anon` rolüne `using (true)` veriyor: **anon anahtarı +
  oda kodunu bilen herkes tüm veriyi okur/yazar**. Oda kodu tek sırdır.
- Kimlik doğrulama tamamen **istemci tarafında**: hesaplar `veri.hesaplar[]`
  içinde, şifreler `sifreOzeti` (SHA-256 + tuz) ile tutulur; oturum
  `localStorage`'da. Sunucu, kullanıcının kim olduğunu bilmez.
- Bu nedenle yetki kuralları (R0/R1/A′) yalnız istemcide uygulanır; istemciyi
  atlatan bir aktör (doğrudan REST çağrısı) bunları aşabilir.

## 2. Hedef

1. Kimlik **Supabase Auth**'ta (e-posta + şifre), oturum `access_token` (JWT).
2. RLS kararı **üyelik tablosundan**: kullanıcı yalnız üyesi olduğu `oda`
   satırını okur/yazar. `anon` rolü veriye erişemez.
3. Uygulama yetkileri (rol, işyeri kapsamı, onay akışı) **istemcide kalmaya
   devam eder**; sunucu tarafı yalnız "hangi oda" sınırını uygular. Rol/kapsam
   RLS'e taşınmak istenirse `isg_uyelik.rol` başlangıç noktasıdır.

## 3. Aşamalar

### Aşama 0 — Envanter ve bayraklama (yalnız okuma)

- Boş şifreli hesapları işaretle. Tarayıcı konsolunda:

```js
ISG.depo.al().hesaplar
  .filter(function (h) { return !String(h.sifreOzeti || h.sifre || '').trim(); })
  .map(function (h) { return { id: h.id, eposta: h.eposta, rol: h.rol }; });
```

  Sonuç: geçiş öncesi bu hesaplar **şifre belirleme** akışına alınmalı; boş
  şifreli hesap Auth'a taşınamaz (Auth şifresiz kullanıcı kabul etmez).
- Yedek: bulut panelindeki "yedek indir" + `public.isg_veri` satırının
  `pg_dump`/CSV çıktısı. Geçiş **tek yönlü geri dönüşü olmayan** adım değil ama
  aşağıdaki geri dönüş planı yalnız bu yedekle anlamlıdır.

### Aşama 1 — Sunucu hazırlığı (betiğin "HAZIRLIK" bölümü)

- `public.isg_uyelik` tablosu + `public.isg_uye(text)` fonksiyonu + kendi
  satırını okuma politikası.
- `isg_veri` politikası **değişmez**; mevcut anon istemciler çalışmaya devam
  eder (kesintisiz geçiş).
- Her mevcut kullanıcı için Auth kullanıcısı + üyelik satırı eklenir
  (Supabase paneli veya `service_role` ile; **service_role anahtarı siteye
  yazılmaz**).

### Aşama 2 — İstemci geçişi

- `bulut.js`: `apikey: anon` + `Authorization: Bearer anon` yerine
  `Authorization: Bearer <access_token>`; token yoksa eşitleme durur ve
  kullanıcıya "oturum gerekli" durumu gösterilir.
- `giris.js`: `hesaplar[]` içindeki yerel şifre denetimi yerine
  `supabase.auth.signInWithPassword`. İlk kurulum akışı (2.28.0 R0)
  `signUp` + yönetici rolü atamasına dönüşür.
- Yerel `hesaplar[]` **okunur yedek** olarak korunur; iki kaynak çelişirse Auth
  kazanır.

### Aşama 3 — Kesim (betiğin "KESİM" bölümü)

- `isg_veri_uye` politikası eklenir, ardından `isg_veri_anon` **kaldırılır**.
- Sıra kritiktir: istemci Auth'a geçmeden anon politikası kaldırılırsa tüm
  cihazlar veriye erişemez. Kesim, tüm cihazların yeni sürümü aldığı
  doğrulandıktan **sonra** yapılır.

## 4. Geri dönüş (rollback)

```sql
-- 1) Anon erişimini geri aç (eski istemciler çalışsın)
drop policy if exists "isg_veri_uye" on public.isg_veri;
create policy "isg_veri_anon" on public.isg_veri
  for all to anon using (true) with check (true);
-- 2) Üyelik tablosu veri kaybına yol açmaz; yerinde bırakılabilir.
```

Veri kaybı riski düşüktür: geçiş `isg_veri` şemasını **değiştirmez**, yalnız
erişim politikasını değiştirir. Yine de Aşama 0 yedeği olmadan kesim yapılmaz.

## 5. Riskler ve açık sorular

| Risk | Etki | Önlem |
| --- | --- | --- |
| Boş şifreli hesaplar Auth'a taşınamaz | O hesaplar giriş yapamaz | Aşama 0 bayraklama + şifre belirleme akışı |
| Ortak hesap kullanımı (tek e-posta paylaşımı) | Denetim izi anlamsızlaşır | Kişi başı hesap kuralı; belge ile duyuru |
| Çevrimdışı kullanım | Auth oturumu yokken eşitleme durur | Yerel `localStorage` çalışmaya devam eder; eşitleme kuyruğa alınır |
| Oda kodu artık sır değil, üyelik sır | Yeni oda açma yetkisi | Yeni oda/üyelik yalnız panelden |
| Testler canlı DB'ye bağlanamaz | RLS davranışı test edilemez | RLS betiği + manuel doğrulama sorguları; canlı test yok (README ile uyumlu) |

Açık soru: rol ve işyeri kapsamı sunucuya taşınacak mı? Bu plan **taşımıyor**;
sunucu yalnız oda sınırını uygular. Taşınması R5 kapsamındadır ve
`veri.hesaplar[].isyeriKapsami` alanının normal tabloya ayrılmasını gerektirir.

## 6. Kabul ölçütleri

- [ ] `isg_uyelik` ve `isg_uye()` canlıda; `isg_veri` politikası hâlâ eski
      (kesintisiz geçiş) ve istemci testleri yeşil.
- [ ] Boş şifreli hesap sayısı **0** (bayrak listesi boş).
- [ ] Auth ile giriş: doğru şifre açar, yanlış şifre açmaz; ilk kurulum akışı
      `signUp` ile çalışır.
- [ ] `anon` anahtarıyla `select * from isg_veri` **boş/401**; kendi odasıyla
      dolu döner.
- [ ] Bulut eşitleme, çevrimdışı açılış, iki cihaz çakışması senaryoları
      (`test/senkrontest.js`, `test/girisbuluttest.js`) Auth'lu istemcide de
      geçer.

## 7. Bilinçli olarak yapılmayanlar (2.28.0)

- Canlı projeye **hiçbir** DDL uygulanmadı; betik yalnız depoda taslak.
- `bulut.js`/`giris.js` değiştirilmedi; anon akışı aynen çalışıyor.
- Rol/kapsam RLS'e taşınmadı.
- Yalnız **boş şifreli hesaplar** bayraklandı (Aşama 0 sorgusu); başka hiçbir
  hesaba dokunulmadı.
