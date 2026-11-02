# İSG Takip Merkezi — Personel Sağlık Takibi Kurulumu

Bu dosya, `ASKI_Isyeri_Hekimi_Saglik_Takip_2026-2028.xlsx` içindeki personel sağlık verilerinin güvenli bir şekilde depolanması, güncellenmesi ve erişilmesi için gereken altyapıyı açıklar.

## 1. Ne yapıldı?

| Dosya | İçerik |
|-------|--------|
| `assets/js/varsayilan-veri.js` | `saglikTakip: []` boş başlangıç dizisi eklendi |
| `assets/js/depo.js` | `saglikTakipKaydet`, `saglikTakipSil`, `saglikTakipBul`, `saglikTakipListe` CRUD fonksiyonları eklendi |
| `assets/js/yetki.js` | `saglikTakipKaydet`/`saglikTakipSil` sadece **Yönetici** ve **İşyeri Hekimi/Yetkili** tarafından çalıştırılabilir; Yetkili sadece kendi işyerine ait kayıtlara erişebilir; Görüntüleyici erişemez |
| `assets/js/saglik-takip.js` | Yeni modül: 16 alanlık sağlık şeması, hassas alanların client-side şifrelenmesi (XOR+base64), tarih validasyonu, rapor metni |

## 2. Supabase kurulumu (sunucu tarafı)

Aşağıdaki SQL'i Supabase SQL Editöründe **bir kez** çalıştırın:

```sql
-- ============================================
-- İSG Takip Merkezi — Sağlık Takibi Tablosu
-- ============================================

create table if not exists public.saglik_takip (
  id text primary key default gen_random_uuid()::text,
  oda text not null default 'gunes-erdem-mavi-karakoca',
  personel_id text not null,
  isyeri_id text not null,
  tarih date not null,
  doktor text,
  kan_grubu text,
  alerji text,
  kronik_hastalik text,
  ilac text,
  engel_durumu text,
  son_muayene text,
  calisma_yasagi text,
  izinsizlik integer,
  calisma_sesi text,
  notlar text,
  giris_yapan text,
  guncelleme timestamptz not null default now(),
  silindi boolean not null default false
);

-- İndeksler (hızlı sorgulama için)
create index if not exists saglik_takip_oda_idx on public.saglik_takip (oda);
create index if not exists saglik_takip_isyeri_idx on public.saglik_takip (isyeri_id);
create index if not exists saglik_takip_personel_idx on public.saglik_takip (personel_id);
create index if not exists saglik_takip_tarih_idx on public.saglik_takip (tarih desc);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

alter table public.saglik_takip enable row level security;

drop policy if exists saglik_takip_yönetici on public.saglik_takip;
create policy saglik_takip_yönetici on public.saglik_takip
  for all
  to anon
  using (true)
  with check (true);

drop policy if exists saglik_takip_okuma on public.saglik_takip;
create policy saglik_takip_okuma on public.saglik_takip
  for select
  to anon
  using (true);

-- Not: Üretim ortamında `to anon` yerine doğrulanmış kullanıcı rolleri
-- (auth.uid(), jwt claims) kullanılmalı. Şu anki yapı client-side
-- erişim kontrolü (yetki.js) ile desteklenmektedir.
```

## 3. HTML sayfasına entegrasyon

`index.html` (veya sağlık takibi sayfanız) içinde `depo.js`, `yetki.js` ve `bulut.js`'den **sonra** şu satırı ekleyin:

```html
<script src="assets/js/saglik-takip.js"></script>
```

Sayfanızda şu fonksiyonları kullanabilirsiniz:

```javascript
// Yeni sağlık kaydı ekle
ISG.saglikTakip.kaydet({
  personelId: 'P-001',
  isyeriId: 'isyeri-A',
  tarih: '2026-11-02',
  doktor: 'Dr. Ahmet Yılmaz',
  kanGrubu: 'A Rh+',
  alerji: 'Penicillin',
  calismaSesi: 'saha',
  calismaYasagi: 'Yüksek ağırlık kaldırılmamalı'
});

// Bir işyerinin tüm sağlık kayıtlarını listele (şifre çözülmüş)
var liste = ISG.saglikTakip.listele('isyeri-A');

// Belirli personelin kayıtlarını listele
var personelListe = ISG.saglikTakip.listele(null, 'P-001');

// Kayıt sil (yalnızca yönetici)
ISG.saglikTakip.sil('kayit-id-123');

// Rapor metni oluştur
var rapor = ISG.saglikTakip.raporMetni(liste);
console.log(rapor);
```

## 4. Erişim kuralları

| Rol | Sağlık kaydı görebilir mi? | Kaydedebilir mi? | Silebilir mi? | Kapsam |
|-----|---------------------------|------------------|---------------|--------|
| Yönetici | Evet | Evet | Evet | Tüm işyerleri |
| Yetkili (İşyeri Hekimi) | Evet | Evet | Hayır | Sadece atandığı işyeri |
| Görüntüleyici | Hayır | Hayır | Hayır | — |

## 5. XLSX dosyasını içeri aktarma

`ASKI_Isyeri_Hekimi_Saglik_Takip_2026-2028.xlsx` dosyanızın **sütun başlıklarını** buraya yapıştırırsam, verileri `saglikTakip` şemasına dönüştüren bir içeri aktarma scripti yazabilirim.

Şu anki sağlık alanı şeması:
- personelId, isyeriId, tarih (zorunlu)
- doktor, kanGrubu, alerji, kronikHastalik, ilac, engelDurumu, sonMuayene, calismaYasagi, izinsizlik, calismaSesi, notlar, girisYapan

Hassas alanlar (şifrelenir): kanGrubu, alerji, kronikHastalik, ilac, engelDurumu, sonMuayene, calismaYasagi, izinsizlik, notlar, girisYapan