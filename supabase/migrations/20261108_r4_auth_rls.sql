-- İSG Takip Merkezi — R4 Supabase Auth + RLS geçiş betiği (TASLAK)
--
-- DURUM: UYGULANMADI. Bu dosya yalnız inceleme içindir; canlı projede
-- (liosxpgtdbtpharkirmt) ÇALIŞTIRILMAMIŞTIR. Geçiş kararı ve sırası için
-- PLAN-R4-SUPABASE.md dosyasına bakın.
--
-- Bugünkü model: `public.isg_veri` tek satırlık JSONB blok + `anon` rolüne
-- `using (true)` politikası. Yani anon anahtarı bilen herkes oda kodunu bilirse
-- tüm veriyi okur/yazar. R4 bunu Supabase Auth oturumuna bağlar.
--
-- Sıra: 1) bu betiğin "HAZIRLIK" bölümü, 2) istemci Auth geçişi, 3) "KESİM"
-- bölümü (anon politikasının kaldırılması). 1 ve 2 tamamlanmadan 3 çalıştırılırsa
-- mevcut istemciler veriye erişemez.

-- ============================ HAZIRLIK =====================================

create table if not exists public.isg_uyelik (
  oda text not null,
  kullanici_id uuid not null references auth.users (id) on delete cascade,
  eposta text not null,
  rol text not null default 'goruntuleyici'
    check (rol in ('sistem', 'yonetici', 'uzman', 'goruntuleyici')),
  olusturma timestamptz not null default now(),
  primary key (oda, kullanici_id)
);

comment on table public.isg_uyelik is
  'Hangi Auth kullanıcısı hangi odaya (veri kümesine) erişebilir. RLS kararı buradan verilir.';

alter table public.isg_uyelik enable row level security;

-- Kullanıcı yalnız kendi üyelik satırını okur; yazma yalnız servis tarafından
-- (service_role) veya Supabase panelinden yapılır.
drop policy if exists "isg_uyelik_kendi" on public.isg_uyelik;
create policy "isg_uyelik_kendi" on public.isg_uyelik
  for select to authenticated
  using (kullanici_id = auth.uid());

-- Üyelik kontrolü: RLS politikalarında tekrar tekrar alt sorgu yazmamak için.
create or replace function public.isg_uye(hedef_oda text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.isg_uyelik m
    where m.oda = hedef_oda and m.kullanici_id = auth.uid()
  );
$$;

revoke all on function public.isg_uye(text) from public;
grant execute on function public.isg_uye(text) to authenticated;

-- ============================ KESİM ========================================
-- Aşağıdaki blok, Auth geçişi istemcide tamamlandıktan SONRA çalıştırılır.

-- 1) Oturumlu kullanıcı yalnız üyesi olduğu odayı okur/yazar.
drop policy if exists "isg_veri_uye" on public.isg_veri;
create policy "isg_veri_uye" on public.isg_veri
  for all to authenticated
  using (public.isg_uye(oda))
  with check (public.isg_uye(oda));

-- 2) Anon erişimini kapat (kesim anı). Geri dönüş: aynı politikayı yeniden
--    oluşturmak (rollback bölümü, PLAN-R4-SUPABASE.md).
-- drop policy if exists "isg_veri_anon" on public.isg_veri;

-- 3) Yeni oda açılışını da denetimli hale getir: oda satırı olmayan yeni oda
--    yalnız üyelik kaydı olan kullanıcı tarafından yazılabilir (isg_uye zaten
--    bunu gerektirir; oda ilk kez oluşturulacaksa üyelik önce eklenmelidir).

-- ============================ DOĞRULAMA ====================================
-- Uygulandıktan sonra Supabase SQL editöründe:
--   select oda, count(*) from public.isg_uyelik group by oda;
--   select polname, roles, cmd from pg_policies
--    where schemaname = 'public' and tablename = 'isg_veri';
--   -- anon ile: 401 / boş küme dönmelidir
--   -- auth ile (kendi odası): satır dönmelidir
