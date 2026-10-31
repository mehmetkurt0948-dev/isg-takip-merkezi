/* İSG Takip Merkezi — siteye gömülü bulut kimliği (Supabase)

   Bu dosya site yöneticisi tarafından BİR KEZ doldurulur. Doldurulduğu anda
   siteyi açan HER CİHAZ, hiçbir ayar girmeden otomatik olarak bulut eşitlemesine
   bağlanır ve aynı kayıtları eşzamanlı görür.

   Nasıl doldurulur (ayrıntılar: KURULUM-BULUT.md):
   1. supabase.com üzerinde ücretsiz bir proje oluşturun.
   2. Proje ayarlarındaki "Project URL" ve "anon public" anahtarını aşağıya yazın.
   3. "oda" için kendi belirlediğiniz bir oda kodu yazın (örn. isg-merkez).
      Aynı oda kodunu kullanan tüm cihazlar aynı kayıtları paylaşır.
   4. SQL editöründe KURULUM-BULUT.md içindeki (veya sitedeki Bulut panelindeki)
      tablo betiğini bir kez çalıştırın.
   5. Yayınladığınızda tüm cihazlar otomatik bağlanır.

   Güvenlik notu: buraya yazılan "anon public" anahtar Supabase tasarımı gereği
   herkese açık olabilir; veri erişimi satır düzeyi güvenlik (RLS) ile sınırlıdır.
   Yalnızca "anon public" anahtar kullanın; "service_role" anahtarını ASLA
   yazmayın. Oda kodu ortak sırdır: bilen herkes o kayıtları görebildiği için
   tahmin edilemeyecek bir kod seçin. */
(function (global) {
  'use strict';

  /* Kurulum tamamlandı (31.10.2026): supabase.com → "isg-takip" projesi,
     bölge eu-north-1, tablo public.isg_veri + RLS politikası çalışır durumda.
     Oda kodu değişirse tüm cihazlar ayrı bir veri kümesine geçmiş olur. */
  global.ISG_KIMLIK = {
    /* Supabase proje adresi: https://xxxx.supabase.co */
    url: 'https://liosxpgtdbtpharkirmt.supabase.co',

    /* Supabase → Project Settings → API → Project API keys → anon public */
    anahtar: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpb3N4cGd0ZGJ0cGhhcmtpcm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0MzkyNDMsImV4cCI6MjEwOTAxNTI0M30.OePeWzzAoYibEPX-CClWNFFYbDw2KrgUVyjAJ84gttM',

    /* Ortak oda kodu: aynı kodu kullanan cihazlar aynı kayıtları paylaşır. */
    oda: 'gunes-erdem-mavi-karakoca',

    /* Değişiklikler otomatik gönderilsin ve yeni kayıtlar kontrol edilsin mi? */
    otomatik: true,

    /* Bulut kontrol aralığı (saniye): 10–300. */
    aralik: 20
  };
})(window);
