# Bulut Eşitleme Kurulumu (Supabase) — İSG Takip Merkezi

Bu rehber, İSG Takip Merkezi sitesine **cihazlar arası otomatik eşitleme** kurmak
için tek seferlik yapılacak adımları anlatır. Kurulum bittiğinde:

- Siteyi açan **her cihaz** hiçbir ayar girmeden otomatik bulutla eşitlenir.
- İnternet kesilse bile her cihaz yerel olarak çalışmaya devam eder; bağlantı
  gelince kayıtlar kayıp olmadan birleşir.
- Kayıt bazlı birleştirme sayesinde iki cihazda aynı anda yapılan değişiklikler
  birbirini silmez (aynı kayıtta son kaydeden kazanır).

Toplam süre: yaklaşık 5 dakika.

> ✅ **Kurulum tamamlandı (31.10.2026):** `isg-takip` projesi ayakta, tablo
> `public.isg_veri` + RLS politikası çalışıyor ve kimlik
> `assets/js/bulut-kimlik.js` dosyasına gömüldü. Aşağıdaki adımlar yalnızca
> **yeni bir site/oda** kurulacağı zaman yeniden gerekir; günlük kullanımda
> hiçbir şey yapmanıza gerek yoktur.

---

## 1) Supabase projesi oluşturma (yaklaşık 2 dk)

1. Tarayıcıda **supabase.com** adresini açın.
2. **Start your project** → **Continue with Google** ile giriş yapın
   (mehmetkurt0948@gmail.com).
3. **New project** düğmesine basın:
   - **Name:** `isg-takip`
   - **Database Password:** boş bırakabilirsiniz (ücretsiz katmanda bu şifre
     siteye gömülmez, hiç kullanılmayacak).
   - **Region:** Türkiye'ye yakın bir bölge — `Central EU (Frankfurt)` veya
     `Nord Europe (Stockholm)`. (Bizim kurulumda `eu-north-1` / Stockholm seçildi.)
   - **Create new project** ile onaylayın; proje 1–2 dakikada hazır olur.

## 2) Tabloyu oluşturma (yaklaşık 1 dk)

1. Sol menüde **SQL Editor**'ü açın (**New query**).
2. Aşağıdaki betiği yapıştırıp **Run** düğmesine basın
   (bu betikle sitedeki *Ayarlar → Bulut eşitleme* panelinde gösterilen betik aynıdır):

```sql
create table if not exists public.isg_veri (
  oda text primary key,
  veri jsonb not null,
  guncelleme timestamptz not null default now()
);

alter table public.isg_veri enable row level security;

drop policy if exists "isg_veri_anon" on public.isg_veri;
create policy "isg_veri_anon" on public.isg_veri
  for all to anon
  using (true)
  with check (true);
```

Başarılıysa `Success. No rows returned` yazar.

## 3) Anahtarları kopyalama (yaklaşık 1 dk)

1. Sol menüde **Project Settings** (dişli) → **API** sayfasını açın.
2. Şu iki değeri kopyalayın:
   - **Project URL** — `https://xxxxx.supabase.co` biçiminde
   - **Project API keys** altındaki **anon public** anahtarı (uzun bir metin)

> ⚠️ Yalnızca **anon public** anahtarı kullanılır; bu anahtar Supabase tasarımı
> gereği siteye gömülebilir (veri erişimi RLS ile sınırlıdır).
> **service_role** anahtarını ASLA yazmayın — o gizli yönetim anahtarıdır.

## 4) Kimliği siteye gömme (bizim yapacağımız adım)

`assets/js/bulut-kimlik.js` dosyasındaki üç alanı doldurmak yeterli:

```js
global.ISG_KIMLIK = {
  url: 'https://xxxxx.supabase.co',   // Project URL
  anahtar: 'eyJhbGciOi...',           // anon public anahtarı
  oda: 'BURAYA-KENDI-ODA-KODUNUZ',    // kendi belirlediğiniz oda kodu
  otomatik: true,
  aralik: 20
};
```

**Oda kodu** ortak sırdır: aynı kodu kullanan tüm cihazlar aynı kayıtları
görür. Tahmin edilemeyecek bir kod seçin (örneğin 3–4 rastgele kelime).
Bunu yazılım tarafı doldurup yayınlayacaktır; el ile düzenlemeniz gerekmez.

## 5) Yayınlama ve doğrulama

1. `npm run surum` (varlık damgalarını yeniler) → `git commit` (kancalar
   otomatik testleri çalıştırır ve yayınlar).
2. **Birinci cihazda** siteyi açın: Bulut panelinde
   *"Bu site hazır yapılandırılmıştır"* notu ve
   *"Bulut kayıt açık · Oda: … · site varsayılanı"* durumu görünmeli.
3. **İkinci cihazda** (örn. telefon) siteyi açın ve bir kayıt ekleyin;
   birinci cihazda 20 saniye içinde görünmesi yeterli (elle hemen kontrol için
   Bulut panelindeki **Şimdi eşitle** düğmesi kullanılabilir).

## Sık karşılaşılan durumlar

| Belirti | Neden / Çözüm |
| --- | --- |
| "Bulut bağlantısı yok" | Anahtar/URL yanlış ya da internet yok; Project URL'nin `/rest/v1/...` ile biten adresle eşleştiğini kontrol edin. |
| Diğer cihazda kayıtlar görünmüyor | Oda kodu farklıdır; her cihaz Bulut panelinde aynı odayı göstermeli (site kimliğinde otomatik). |
| "relation does not exist" | 2. adımdaki SQL betiği çalıştırılmamıştır. |
| Cihazda bulutu kapatmak istiyorum | Bulut panelinde **Bağlantıyı kes** — o cihaz açılışta otomatik bağlanmayı bırakır; diğer cihazlar etkilenmez. Yeniden bağlanmak için panele aynı bilgileri girin. |

## Güvenlik notu

- Kimlik dosyasına yalnızca **anon public** anahtar gömülür; `service_role` asla gömülmez.
- Tablo, RLS ile `anon` rolüne açıktır ancak **oda kodu** bilinmeden kayıtlara
  erişilemez (URL sorgusu `oda eq.` filtresi ile çalışır). Oda kodunu tahmin
  edilemez seçmek bu nedenle önemlidir.
- Yerel kayıt her zaman önceliklidir: bulut yalnızca kayıt bazlı birleştirme
  yapar, elle silinen kayıtlar "mezar taşı" mekanizmasıyla geri gelmez.
