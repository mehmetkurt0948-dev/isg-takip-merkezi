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

  global.ISG_KIMLIK = {
    /* Supabase proje adresi: https://xxxx.supabase.co */
    url: '',

    /* Supabase → Project Settings → API → Project API keys → anon public */
    anahtar: '',

    /* Ortak oda kodu: aynı kodu kullanan cihazlar aynı kayıtları paylaşır. */
    oda: '',

    /* Değişiklikler otomatik gönderilsin ve yeni kayıtlar kontrol edilsin mi? */
    otomatik: true,

    /* Bulut kontrol aralığı (saniye): 10–300. */
    aralik: 20
  };
})(window);
