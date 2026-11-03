# İSG Takip Merkezi — Personel Sağlık Takibi Kurulumu

Bu dosya, `ASKI_Isyeri_Hekimi_Saglik_Takip_2026-2028.xlsx` içindeki personel sağlık verilerinin güvenli bir şekilde depolanması, güncellenmesi ve erişilmesi için gereken altyapıyı açıklar.

## 1. Erişim ve gizlilik

Sağlık kayıtları `isgtakip.saglik.kasa` adlı ayrı yerel tarayıcı deposunda saklanır; genel `isgtakip.v4` verisine ve anonim bulut JSON eşitlemesine dahil edilmez. Yönetici doğrudan erişir. Diğer kullanıcılar Sağlık Takibi ekranından erişim ister ve yönetici karar verir. Listeyi görüntüleme onaydan sonra açılır; kayıt ekleme, düzenleme ve Excel yükleme yalnızca yöneticiye açıktır.

Bu onay istemci tarafındadır ve aynı tarayıcı/profil için geçerlidir. Mevcut uygulama parolaları ve Supabase anon anahtarı sunucu kimlik doğrulaması sağlamaz. Sağlık verisini cihazlar arasında paylaşmak için Supabase Auth ve `auth.uid()` kullanan RLS ile ayrı bir sağlık tablosu/Edge Function kurulmalıdır. Eski anonim tam erişim politikası kullanılmamalıdır.

## 2. Ne yapıldı?

| Dosya | İçerik |
|-------|--------|
| `assets/js/varsayilan-veri.js` | `saglikTakip: []` boş başlangıç dizisi eklendi |
| `assets/js/depo.js` | `saglikTakipKaydet`, `saglikTakipSil`, `saglikTakipBul`, `saglikTakipListe` CRUD fonksiyonları eklendi |
| `assets/js/depo.js` | Sağlık verisi ayrı yerel kasada; eski genel sağlık kayıtları ilk kullanımda ayrılır |
| `assets/js/saglik-takip.js` | Sağlık erişim talebi ve yönetici karar kontrolü |
| `assets/js/saglik-calisma-kitabi.js` | XLSX sekmelerini sağlık kasasına alan yardımcı |

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
-- Güvenli varsayılan: hiçbir anon/authenticated erişim politikası oluşturmayın.
revoke all on public.saglik_takip from anon, authenticated;
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
| Yönetici onaylı kullanıcı | Evet | Hayır | Hayır | Yönetici onayı verilmiş hesap |
| Yetkili / Görüntüleyici | Talep edebilir | Hayır | Hayır | Onay verilene kadar erişim yok |

## 5. XLSX dosyasını içeri aktarma

Sağlık Takibi sayfasındaki **Excel listesini yükle** düğmesi çalışma kitabının bütün sekmelerini adlarıyla birlikte yerel sağlık kasasına alır. Yönetici onayı olmayan kullanıcılar sekmeleri göremez.

Şu anki sağlık alanı şeması:
- personelId, isyeriId, tarih (zorunlu)
- doktor, kanGrubu, alerji, kronikHastalik, ilac, engelDurumu, sonMuayene, calismaYasagi, izinsizlik, calismaSesi, notlar, girisYapan

Hassas alanlar (şifrelenir): kanGrubu, alerji, kronikHastalik, ilac, engelDurumu, sonMuayene, calismaYasagi, izinsizlik, notlar, girisYapan
