/* İSG Takip Merkezi — işyeri bazlı hazır dosya kontrol listeleri
   ÜRETİLMİŞ DOSYA — elle düzenlemeyin.
   Kaynak: tools/kontrol-listeleri/*.json (Word dönüştürme çıktısı)
   Yeni işyeri: node tools/kontrol-listesi.js donustur "<liste.docx>" <KOD>
   Yeniden üretim: node tools/kontrol-listesi.js olustur */
(function (global) {
  'use strict';

  var ISG = global.ISG = global.ISG || {};

  var SABLONLAR = [
  {
    kod: "ASKI-1", ad: "ASKİ-1 — Dosya Kontrol Listesi", kaynak: "Doküman Kodu: ABB-OSGB-KL-001 • Revizyon: 00 • Yürürlük: 01.04.2026",
    duzenleyen: "KONTROLÜ YAPAN / A Sınıfı İş Güvenliği Uzmanı — Oğuzhan ÖNAY / Ad Soyad / İmza / Tarih", sicilNo: "1 3700 01 01 1178351 009 18 97-000",
    isyeriAdi: "ASKİ-1", asilIsveren: "AYDIN SU VE KANALİZASYON İDARESİ GENEL MÜDÜRLÜĞÜ",
    kontrolTarihi: "2026-08-24", sonrakiKontrol: "2026-09-24",
    eslesme: ["ASKİ-1", "ASKİ 1"],
    genelDegerlendirme: "Genel olarak yapılan kontrollerde dosyada alt işveren olarak aypaşda görevli isg görevlilerinin çok fazla eksiği bulunmamaktadır. Lakin üst işveren ile yapılması gereken dosya alışverişleri ve alınması gereken evraklarda eksikliklerin olduğu gözlemlenmiştir.",
    bolumler: [
      { ad: "BÖLÜM 1 YÖNETSEL VE ORGANİZASYONEL BELGELER", maddeler: [
        { no: 1, madde: "İSG-KATİP onaylı iş güvenliği uzmanı görevlendirme sözleşmesi", dayanak: "6331 s.K. m.6, 8 / Görev süresince geçerli", isaret: "VAR", tarih: "2026-08-24" },
        { no: 2, madde: "İSG-KATİP onaylı işyeri hekimi görevlendirme sözleşmesi", dayanak: "6331 s.K. m.6, 8 / Görev süresince geçerli", isaret: "VAR", tarih: "2026-08-24" },
        { no: 3, madde: "Diğer sağlık personeli görevlendirmesi (gerekli ise)", dayanak: "İSG Hizmetleri Yön. / Çalışan sayısına bağlı", isaret: "KD", tarih: "2026-08-24" },
        { no: 4, madde: "İşyeri SGK sicil numarası ve tehlike sınıfı tespit belgesi", dayanak: "İş Kolları Tebliği", isaret: "YOK", tarih: "2026-08-24" },
        { no: 5, madde: "İşveren imzalı ve çalışanlara ilan edilmiş İSG politikası", dayanak: "6331 s.K. m.4", isaret: "YOK", tarih: "2026-08-24" },
        { no: 6, madde: "Yıllık çalışma planı (uzman + hekim imzalı, işveren onaylı)", dayanak: "İSG Hizmetleri Yön. m.7 / Her yıl yenilenir", isaret: "VAR", tarih: "2026-08-24" },
        { no: 7, madde: "Bir önceki yıla ait yıllık değerlendirme raporu", dayanak: "İSG Hizmetleri Yön. m.7 / Yılda 1 kez", isaret: "VAR", tarih: "2026-08-24" },
        { no: 8, madde: "Onaylı İSG defteri (tespit ve öneri defteri) — imzalı, tarihli", dayanak: "İSG Hizmetleri Yön. m.7 / Sürekli güncel", isaret: "VAR", tarih: "2026-08-24" },
        { no: 9, madde: "İSG Kurulu kuruluş kararı ve üye görevlendirme yazıları", dayanak: "İSG Kurulları Yön. / 50+ çalışan / 6 aydan uzun iş", isaret: "VAR", tarih: "2026-08-24" },
        { no: 10, madde: "İSG Kurulu iç yönergesi", dayanak: "İSG Kurulları Yön. m.8", isaret: "YOK", tarih: "2026-08-24" },
        { no: 11, madde: "Kurul toplantı tutanakları ve karar takip çizelgesi", dayanak: "İSG Kurulları Yön. m.9 / Tehlikeli: 2 ayda bir", isaret: "VAR", tarih: "2026-08-24" },
        { no: 12, madde: "Çalışan temsilcisi seçim/atama tutanağı ve ilan belgesi", dayanak: "Çalışan Temsilcisi Tebliği", isaret: "VAR", tarih: "2026-08-24" },
        { no: 13, madde: "Destek elemanı görevlendirme belgeleri", dayanak: "6331 s.K. m.3, 11", isaret: "YOK", tarih: "2026-08-24" },
        { no: 14, madde: "İSG talimatları listesi ve tebliğ-tebellüğ (imza) kayıtları", dayanak: "6331 s.K. m.16", isaret: "VAR", tarih: "2026-08-24" },
        { no: 15, madde: "Çalışanların görüş, öneri ve katılım kayıtları", dayanak: "6331 s.K. m.18", isaret: "YOK", tarih: "2026-08-24" }
      ]},
      { ad: "BÖLÜM 2 ASIL İŞVEREN (ASKİ) İLİŞKİSİ VE ORTAK ÇALIŞMA ALANI KOORDİNASYONU", maddeler: [
        { no: 1, madde: "Hizmet alım sözleşmesi ve teknik şartnamenin İSG hükümleri (KKD, eğitim, ölçüm ve periyodik kontrol maliyet/sorumluluk dağılımı)", dayanak: "6331 s.K. m.23 / Sözleşme süresince", isaret: "YOK", tarih: "2026-08-24" },
        { no: 2, madde: "Personel A.Ş. adına düzenlenmiş bağımsız SGK işyeri sicil numarası ve tescil belgesi", dayanak: "5510 s.K. m.11", isaret: "YOK", tarih: "2026-08-24" },
        { no: 3, madde: "İSG-KATİP görevlendirmelerinin Personel A.Ş. sicili üzerinden yapıldığının teyidi", dayanak: "İSG Hizmetleri Yön. / ASKİ sicili üzerinden olmamalı", isaret: "VAR", tarih: "2026-08-24" },
        { no: 4, madde: "ASKİ tesis/birim bazlı personel dağılım listesi ve çalışma alanı tanımları", dayanak: "6331 s.K. m.23 / Sürekli güncel", isaret: "VAR", tarih: "2026-08-24" },
        { no: 5, madde: "Ortak çalışma alanı İSG koordinasyon protokolü ve sorumluluk matrisi", dayanak: "6331 s.K. m.23/1 / Hangi yükümlülük kimde", isaret: "YOK", tarih: "2026-08-24" },
        { no: 6, madde: "ASKİ'nin risk değerlendirmesinin Personel A.Ş.'ye yazılı tebliği", dayanak: "Risk Değ. Yön. m.15 / Evrak kayıt numaralı", isaret: "YOK", tarih: "2026-08-24" },
        { no: 7, madde: "Personel A.Ş. risk değerlendirmesinin ASKİ'ye yazılı bildirimi", dayanak: "Risk Değ. Yön. m.15 / Evrak kayıt numaralı", isaret: "YOK", tarih: "2026-08-24" },
        { no: 8, madde: "Tesis, bina ve iş ekipmanı mülkiyet-sorumluluk envanteri (ASKİ'ye ait olanlar ayrı gösterilmiş)", dayanak: "İş Ekipmanları Yön. m.4", isaret: "YOK", tarih: "2026-08-24" },
        { no: 9, madde: "ASKİ'ye ait iş ekipmanlarının periyodik kontrol raporlarının temin edildiğine dair yazışmalar", dayanak: "İş Ekipmanları Yön. m.7 / Kontrol periyoduna göre", isaret: "YOK", tarih: "2026-08-24" },
        { no: 10, madde: "ASKİ tesislerine ait patlamadan korunma dokümanı ve ortam ölçüm raporlarının temini", dayanak: "Patlayıcı Ortamlar Yön. • İş Hijyeni Ölçüm Yön.", isaret: "YOK", tarih: "2026-08-24" },
        { no: 11, madde: "ASKİ acil durum planına Personel A.Ş. çalışanlarının dâhil edilmesi ve ortak tatbikat kayıtları", dayanak: "Acil Durumlar Yön. m.15 / Yılda en az 1", isaret: "YOK", tarih: "2026-08-24" },
        { no: 12, madde: "İSG Kurulu işleyişi: kurul kararlarının ASKİ'ye tebliği ve ASKİ kurul kararlarının temini", dayanak: "İSG Kurulları Yön. m.11 / Her toplantı sonrası", isaret: "YOK", tarih: "2026-08-24" },
        { no: 13, madde: "ASKİ'ye yapılan yazılı eksiklik bildirimleri, talep yazıları ve cevapları", dayanak: "6331 s.K. m.23 / Evrak kayıt numaralı", isaret: "VAR", tarih: "2026-08-24" },
        { no: 14, madde: "Tespit ve öneri defterinde çözümü ASKİ'de olan hususların ayrı takip listesi", dayanak: "İSG Hizmetleri Yön. m.7 / Sürekli", isaret: "YOK", tarih: "2026-08-24" },
        { no: 15, madde: "Çalışma izin sisteminde yetki devri protokolü (izni kim verir, gaz ölçümünü kim yapar)", dayanak: "6331 s.K. m.23 • Risk Değ. Yön.", isaret: "YOK", tarih: "2026-08-24" },
        { no: 16, madde: "İş kazasında karşılıklı bildirim ve ortak inceleme prosedürü", dayanak: "6331 s.K. m.14, 23", isaret: "YOK", tarih: "2026-08-24" }
      ]},
      { ad: "BÖLÜM 3 RİSK DEĞERLENDİRMESİ VE ACİL DURUM YÖNETİMİ", maddeler: [
        { no: 1, madde: "Güncel risk değerlendirmesi raporu (ekip imzalı, işveren onaylı)", dayanak: "Risk Değ. Yön. / Ç.Tehlikeli 2 / Tehlikeli 4 / Az T. 6 yıl", isaret: "VAR", tarih: "2026-08-24" },
        { no: 2, madde: "Risk değerlendirmesi ekibi görevlendirme belgesi", dayanak: "Risk Değ. Yön. m.6", isaret: "VAR", tarih: "2026-08-24" },
        { no: 3, madde: "Düzeltici ve önleyici faaliyet (DÖF) planı, termin ve kapatma takibi", dayanak: "Risk Değ. Yön. m.10 / Sürekli", isaret: "YOK", tarih: "2026-08-24" },
        { no: 4, madde: "Yenilemeyi gerektiren durum kayıtları (kaza, yeni ekipman, taşınma, mevzuat değişikliği)", dayanak: "Risk Değ. Yön. m.12", isaret: "YOK", tarih: "2026-08-24" },
        { no: 5, madde: "İşveren onaylı güncel acil durum planı", dayanak: "Acil Durumlar Yön. / Ç.Tehlikeli 2 / Tehlikeli 4 / Az T. 6 yıl", isaret: "VAR", tarih: "2026-08-24" },
        { no: 6, madde: "Acil durum ekipleri: söndürme, kurtarma, koruma, ilkyardım görevlendirmeleri", dayanak: "Acil Durumlar Yön. m.11", isaret: "YOK", tarih: "2026-08-24" },
        { no: 7, madde: "Ekip üyelerinin yangın ve arama-kurtarma-tahliye eğitim belgeleri", dayanak: "Acil Durumlar Yön. m.11", isaret: "YOK", tarih: "2026-08-24" },
        { no: 8, madde: "İlkyardımcı sertifikaları ve yeterli sayı kontrolü", dayanak: "İlkyardım Yön. / Sertifika 3 yılda bir güncellenir", isaret: "YOK", tarih: "2026-08-24" },
        { no: 9, madde: "Tahliye tatbikatı tutanağı ve tatbikat değerlendirme raporu", dayanak: "Acil Durumlar Yön. m.13 / Yılda en az 1 kez", isaret: "VAR", tarih: "2026-08-24" },
        { no: 10, madde: "Kaçış yolu, acil çıkış ve toplanma yeri işaretlemeleri ile kat planları", dayanak: "Sağlık ve Güvenlik İşaretleri Yön.", isaret: "YOK", tarih: "2026-08-24" },
        { no: 11, madde: "Güncel acil durum haberleşme ve irtibat listesi", dayanak: "Acil Durumlar Yön. / Sürekli güncel", isaret: "YOK", tarih: "2026-08-24" },
        { no: 12, madde: "İlkyardım dolabı malzeme listesi ve miat takip formu", dayanak: "İlkyardım Yön. / Aylık kontrol", isaret: "YOK", tarih: "2026-08-24" }
      ]},
      { ad: "BÖLÜM 4 İSG EĞİTİM KAYITLARI", maddeler: [
        { no: 1, madde: "İşveren onaylı yıllık eğitim programı", dayanak: "Çalışanların İSG Eğitimleri Yön. m.6 / Her yıl", isaret: "VAR", tarih: "2026-08-24" },
        { no: 2, madde: "Temel İSG eğitimi katılım tutanakları (konu, süre, tarih, eğitmen imzalı)", dayanak: "Eğitim Yön. m.11 / Ç.T. 16 saat/yıl • T. 12 saat/2 yıl • A.T. 8 saat/3 yıl", isaret: "VAR", tarih: "2026-08-24" },
        { no: 3, madde: "Eğitim sonrası ölçme-değerlendirme (sınav) kâğıtları ve sonuç listesi", dayanak: "Eğitim Yön. m.13", isaret: "VAR", tarih: "2026-08-24" },
        { no: 4, madde: "Düzenlenen İSG eğitim belgeleri / sertifikaları", dayanak: "Eğitim Yön. m.13 / Özlük dosyasında saklanır", isaret: "YOK", tarih: "2026-08-24" },
        { no: 5, madde: "İşe başlamadan önce verilen oryantasyon eğitimi kayıtları", dayanak: "Eğitim Yön. m.5 / İşe girişte", isaret: "YOK", tarih: "2026-08-24" },
        { no: 6, madde: "İş değişikliği, yeni ekipman veya uzun süreli işten uzak kalma sonrası ilave eğitimler", dayanak: "Eğitim Yön. m.6 / Olay bazlı", isaret: "VAR", tarih: "2026-08-24" },
        { no: 7, madde: "Mesleki yeterlilik / MYK belgeleri (tehlikeli ve çok tehlikeli işler)", dayanak: "Mesleki Eğitim Yön.", isaret: "YOK", tarih: "2026-08-24" },
        { no: 8, madde: "Özel eğitimler: yüksekte çalışma, kapalı-dar alan, LOTO, sıcak iş, forklift ve iş makinesi operatörlüğü", dayanak: "İş Ekipmanları Yön.", isaret: "YOK", tarih: "2026-08-24" },
        { no: 9, madde: "Eğiticilerin yetki belgeleri ve eğitim müfredatı / sunum içerikleri", dayanak: "Eğitim Yön. m.13", isaret: "YOK", tarih: "2026-08-24" },
        { no: 10, madde: "Alt işveren ve geçici çalışanların eğitim kayıtları", dayanak: "6331 s.K. m.23", isaret: "YOK", tarih: "2026-08-24" }
      ]},
      { ad: "BÖLÜM 5 SAĞLIK GÖZETİMİ", maddeler: [
        { no: 1, madde: "İşe giriş sağlık raporları (tüm çalışanlar için eksiksiz)", dayanak: "6331 s.K. m.15 / İşe girişte", isaret: "VAR", tarih: "2026-08-24" },
        { no: 2, madde: "Periyodik muayene kayıtları", dayanak: "6331 s.K. m.15 / Ç.Tehlikeli 1 / Tehlikeli 3 / Az T. 5 yıl", isaret: "VAR", tarih: "2026-08-24" },
        { no: 3, madde: "İş değişikliği ve iş kazası/meslek hastalığı sonrası kontrol muayeneleri", dayanak: "6331 s.K. m.15 / Olay bazlı", isaret: "YOK", tarih: "2026-08-24" },
        { no: 4, madde: "Odyometri (işitme) testleri — gürültülü ortamda çalışanlar", dayanak: "Gürültü Yön. / Maruziyet düzeyine göre", isaret: "VAR", tarih: "2026-08-24" },
        { no: 5, madde: "Solunum fonksiyon testi (SFT) ve akciğer grafisi — toz/kimyasal maruziyeti", dayanak: "Tozla Mücadele Yön.", isaret: "YOK", tarih: "2026-08-24" },
        { no: 6, madde: "Portör / hijyen muayeneleri (yemekhane ve gıda ile temaslı personel)", dayanak: "Hijyen Eğitimi Yön.", isaret: "YOK", tarih: "2026-08-24" },
        { no: 7, madde: "Aşı kayıtları (tetanoz, hepatit A-B) — atıksu, kanalizasyon ve veteriner hizmetleri", dayanak: "Biyolojik Etkenler Yön. m.10 / Aşı takvimine göre", isaret: "YOK", tarih: "2026-08-24" },
        { no: 8, madde: "Biyolojik izleme ve laboratuvar tetkik sonuçları", dayanak: "Kimyasal Maddeler Yön.", isaret: "VAR", tarih: "2026-08-24" },
        { no: 9, madde: "Kişisel sağlık dosyalarının gizlilik esasına uygun muhafazası", dayanak: "6331 s.K. m.15 • KVKK / Görev sonrası 15 yıl", isaret: "VAR", tarih: "2026-08-24" },
        { no: 10, madde: "İşe uygunluk kısıtlamaları ve rapora itiraz kayıtları", dayanak: "6331 s.K. m.15", isaret: "YOK", tarih: "2026-08-24" },
        { no: 11, madde: "Gebe, emziren, genç ve engelli çalışanlara ilişkin özel gözetim kayıtları", dayanak: "İlgili özel yönetmelikler", isaret: "YOK", tarih: "2026-08-24" }
      ]},
      { ad: "BÖLÜM 6 KİŞİSEL KORUYUCU DONANIM (KKD)", maddeler: [
        { no: 1, madde: "KKD risk analizi ve iş/görev bazlı KKD matrisi", dayanak: "KKD Kullanılması Yön. m.7", isaret: "YOK", tarih: "2026-08-24" },
        { no: 2, madde: "CE belgeleri, AT uygunluk beyanları ve Türkçe kullanım kılavuzları", dayanak: "KKD Yön. m.5", isaret: "YOK", tarih: "2026-08-24" },
        { no: 3, madde: "KKD zimmet tutanakları (çalışan imzalı ve tarihli)", dayanak: "KKD Yön. m.6 / Teslimde", isaret: "YOK", tarih: "2026-08-24" },
        { no: 4, madde: "KKD kullanım, bakım ve muhafaza eğitimi kayıtları", dayanak: "KKD Yön. m.11", isaret: "YOK", tarih: "2026-08-24" },
        { no: 5, madde: "KKD bakım, muayene ve kullanım ömrü / değişim takip çizelgesi", dayanak: "KKD Yön. m.6 / Üretici periyoduna göre", isaret: "YOK", tarih: "2026-08-24" },
        { no: 6, madde: "Düşme durdurma sistemleri (kemer, halat, ankraj) periyodik muayene kayıtları", dayanak: "İş Ekipmanları Yön. Ek-3 / Yılda en az 1", isaret: "YOK", tarih: "2026-08-24" },
        { no: 7, madde: "Solunum koruyucu filtre değişim kayıtları ve sızdırmazlık (fit) testleri", dayanak: "KKD Yön.", isaret: "YOK", tarih: "2026-08-24" },
        { no: 8, madde: "KKD kullanmama durumunda düzenlenen uyarı ve tutanak kayıtları", dayanak: "6331 s.K. m.19", isaret: "YOK", tarih: "2026-08-24" }
      ]},
      { ad: "BÖLÜM 7 İŞ EKİPMANLARI PERİYODİK KONTROLLERİ", maddeler: [
        { no: 1, madde: "Kaldırma-iletme ekipmanları (vinç, caraskal, forklift, transpalet)", dayanak: "İş Ekipmanları Yön. Ek-3 / Yılda 1 (aksi belirtilmedikçe)", isaret: "YOK", tarih: "2026-08-24" },
        { no: 2, madde: "Kaldırma aksesuarları (sapan, çelik halat, zincir, kanca)", dayanak: "İş Ekipmanları Yön. Ek-3 / Yılda 1", isaret: "YOK", tarih: "2026-08-24" },
        { no: 3, madde: "Basınçlı kaplar: kompresör, hava tankı, hidrofor, genleşme tankı", dayanak: "İş Ekipmanları Yön. Ek-3 / Yılda 1", isaret: "YOK", tarih: "2026-08-24" },
        { no: 4, madde: "Kazanlar, emniyet vanaları ve basınç göstergeleri", dayanak: "İş Ekipmanları Yön. Ek-3 / Yılda 1", isaret: "YOK", tarih: "2026-08-24" },
        { no: 5, madde: "Yangın söndürme cihazları kontrol ve dolum kayıtları", dayanak: "TS ISO 11602-2 / Kontrol 6 ayda 1 • dolum periyodik", isaret: "YOK", tarih: "2026-08-24" },
        { no: 6, madde: "Yangın algılama-alarm, hidrant, sprinkler ve yangın pompası testleri", dayanak: "Binaların Yangından Korunması Yön. / Aylık test • yıllık kontrol", isaret: "YOK", tarih: "2026-08-24" },
        { no: 7, madde: "Elektrik tesisatı genel kontrolü ve pano termal kamera ölçümü", dayanak: "Elektrik Tesislerinde Topraklamalar Yön. / Yılda 1", isaret: "YOK", tarih: "2026-08-24" },
        { no: 8, madde: "Topraklama ve süreklilik ölçümleri (jeneratör ve seyyar cihazlar dâhil)", dayanak: "Topraklamalar Yön. / Sabit tesis: yılda 1", isaret: "YOK", tarih: "2026-08-24" },
        { no: 9, madde: "Yıldırımdan korunma (paratoner) tesisatı ölçüm raporu", dayanak: "İş Ekipmanları Yön. Ek-3 / Yılda 1", isaret: "YOK", tarih: "2026-08-24" },
        { no: 10, madde: "Kaçak akım koruma rölesi test kayıtları", dayanak: "İş Ekipmanları Yön. Ek-3 / Ayda 1 (test butonu)", isaret: "YOK", tarih: "2026-08-24" },
        { no: 11, madde: "Jeneratör, UPS ve akü grubu bakım-test kayıtları", dayanak: "İş Ekipmanları Yön. / Üretici periyoduna göre", isaret: "YOK", tarih: "2026-08-24" },
        { no: 12, madde: "Asansör periyodik kontrolü ve etiket durumu", dayanak: "Asansör İşletme ve Bakım Yön. / Yılda 1", isaret: "YOK", tarih: "2026-08-24" },
        { no: 13, madde: "Havalandırma, aspirasyon ve klima sistemleri bakım kayıtları", dayanak: "İşyeri Bina ve Eklentileri Yön.", isaret: "YOK", tarih: "2026-08-24" },
        { no: 14, madde: "Platform, korkuluk, sabit merdiven ve çalışma iskelesi kontrol kayıtları", dayanak: "İş Ekipmanları Yön. Ek-2", isaret: "YOK", tarih: "2026-08-24" },
        { no: 15, madde: "Araç ve iş makinesi bakım-muayene kayıtları, operatör belgeleri", dayanak: "İş Ekipmanları Yön.", isaret: "YOK", tarih: "2026-08-24" },
        { no: 16, madde: "Periyodik kontrolü yapan kişilerin yetki belgeleri (rapor ekinde)", dayanak: "İş Ekipmanları Yön. m.13", isaret: "YOK", tarih: "2026-08-24" }
      ]},
      { ad: "BÖLÜM 8 ORTAM ÖLÇÜMLERİ VE İŞ HİJYENİ", maddeler: [
        { no: 1, madde: "Ölçüm yapan laboratuvarın Bakanlık yetki belgesi ve akreditasyon kapsamı", dayanak: "İş Hijyeni Ölçüm Yön. / Geçerlilik kontrolü", isaret: "YOK", tarih: "2026-08-24" },
        { no: 2, madde: "Gürültü maruziyet ölçüm raporu ve maruziyet haritası", dayanak: "Gürültü Yön. / Risk değ. periyoduna göre", isaret: "YOK", tarih: "2026-08-24" },
        { no: 3, madde: "Toz ölçümü (solunabilir ve toplam toz)", dayanak: "Tozla Mücadele Yön.", isaret: "YOK", tarih: "2026-08-24" },
        { no: 4, madde: "Kimyasal maruziyet ölçümleri (klor, H₂S, amonyak, çözücü buharları vb.)", dayanak: "Kimyasal Maddeler Yön.", isaret: "YOK", tarih: "2026-08-24" },
        { no: 5, madde: "Titreşim ölçümü (el-kol ve tüm vücut)", dayanak: "Titreşim Yön.", isaret: "YOK", tarih: "2026-08-24" },
        { no: 6, madde: "Aydınlatma ölçüm raporu", dayanak: "İşyeri Bina ve Eklentileri Yön.", isaret: "YOK", tarih: "2026-08-24" },
        { no: 7, madde: "Termal konfor ölçümü (sıcaklık, nem, hava akım hızı)", dayanak: "İşyeri Bina ve Eklentileri Yön.", isaret: "YOK", tarih: "2026-08-24" },
        { no: 8, madde: "Ölçüm sonuçlarının sınır değerlerle karşılaştırılması ve DÖF kayıtları", dayanak: "İş Hijyeni Ölçüm Yön. m.14", isaret: "YOK", tarih: "2026-08-24" },
        { no: 9, madde: "Sağlık ve güvenlik işaretlerinin yerinde, okunur ve güncel olduğunun kontrolü", dayanak: "Sağlık ve Güvenlik İşaretleri Yön.", isaret: "YOK", tarih: "2026-08-24" }
      ]},
      { ad: "BÖLÜM 9 ÇALIŞMA İZİN SİSTEMİ VE TEHLİKELİ İŞLER", maddeler: [
        { no: 1, madde: "Çalışma izni (PTW) prosedürü, yetkili imza listesi ve form setleri", dayanak: "6331 s.K. m.10 • Risk Değ. Yön.", isaret: "YOK", tarih: "2026-08-24" },
        { no: 2, madde: "Kapalı / dar alana giriş izinleri ve gaz ölçüm kayıtları (O₂, LEL, H₂S, CO)", dayanak: "İş Ekipmanları Yön. • Risk Değ. Yön. / Her giriş öncesi", isaret: "YOK", tarih: "2026-08-24" },
        { no: 3, madde: "Sıcak iş (kaynak, kesme, taşlama) izin formları ve yangın gözcüsü kaydı", dayanak: "Binaların Yangından Korunması Yön. / İş bazlı", isaret: "YOK", tarih: "2026-08-24" },
        { no: 4, madde: "Yüksekte çalışma izni ve düşmeyi önleme / kurtarma planı", dayanak: "İş Ekipmanları Yön. Ek-2 / İş bazlı", isaret: "YOK", tarih: "2026-08-24" },
        { no: 5, madde: "Kazı, iksa ve şevlendirme çalışma izni ile altyapı sorgu yazıları", dayanak: "Yapı İşlerinde İSG Yön. Ek-4 / İş bazlı", isaret: "YOK", tarih: "2026-08-24" },
        { no: 6, madde: "LOTO (enerji kesme-kilitleme-etiketleme) prosedürü, kilit-etiket envanteri ve uygulama kayıtları", dayanak: "İş Ekipmanları Yön. m.8 / Her müdahalede", isaret: "YOK", tarih: "2026-08-24" },
        { no: 7, madde: "Elektrikte çalışma izni, arc-flash risk analizi ve yetkili personel listesi", dayanak: "Elektrik Kuvvetli Akım Tesisleri Yön.", isaret: "YOK", tarih: "2026-08-24" },
        { no: 8, madde: "Gaz ölçüm cihazı kalibrasyon sertifikaları ve bump test kayıtları", dayanak: "İş Ekipmanları Yön. / Kalibrasyon yıllık • bump test günlük", isaret: "YOK", tarih: "2026-08-24" },
        { no: 9, madde: "Kapalı alan kurtarma ekipmanı (tripod, vinç, temiz hava solunum cihazı) kontrol kayıtları", dayanak: "İş Ekipmanları Yön. Ek-3 / Yılda 1", isaret: "YOK", tarih: "2026-08-24" },
        { no: 10, madde: "Tek başına çalışma ve gözcü (watchman) uygulama talimatı", dayanak: "Risk Değ. Yön.", isaret: "YOK", tarih: "2026-08-24" }
      ]},
      { ad: "BÖLÜM 10 KİMYASAL, BİYOLOJİK VE PATLAYICI ORTAM", maddeler: [
        { no: 1, madde: "Kimyasal madde envanteri (miktar, CAS no, depolama yeri)", dayanak: "Kimyasal Maddeler Yön. m.6 / Sürekli güncel", isaret: "YOK", tarih: "2026-08-24" },
        { no: 2, madde: "Türkçe ve 16 bölümlü güncel güvenlik bilgi formları (GBF/SDS)", dayanak: "GBF Hazırlanması Hk. Yön. / Sürekli güncel", isaret: "YOK", tarih: "2026-08-24" },
        { no: 3, madde: "GBF'lerin kullanım noktalarında erişilebilirliği ve CLP etiketleme kontrolü", dayanak: "SEA (CLP) Yön.", isaret: "YOK", tarih: "2026-08-24" },
        { no: 4, madde: "Kimyasal depolama uygunluğu (ayrıştırma, havalandırma, sızdırmazlık havuzu)", dayanak: "Kimyasal Maddeler Yön. m.7", isaret: "YOK", tarih: "2026-08-24" },
        { no: 5, madde: "Acil duş ve göz yıkama ünitesi test/kontrol kayıtları", dayanak: "Kimyasal Maddeler Yön. / Haftalık test önerilir", isaret: "YOK", tarih: "2026-08-24" },
        { no: 6, madde: "Dökülme-saçılma müdahale seti envanteri ve müdahale talimatı", dayanak: "Kimyasal Maddeler Yön. m.8", isaret: "YOK", tarih: "2026-08-24" },
        { no: 7, madde: "Patlamadan Korunma Dokümanı (PKD) ve bölge (zone) sınıflandırma haritası", dayanak: "Patlayıcı Ortamlar Yön. m.10 / Çürütücü, gaz deposu, klor odası", isaret: "YOK", tarih: "2026-08-24" },
        { no: 8, madde: "Ex-proof ekipman envanteri, uygunluk ve bakım kayıtları", dayanak: "Patlayıcı Ortamlar Yön. Ek-3", isaret: "YOK", tarih: "2026-08-24" },
        { no: 9, madde: "Biyolojik etken risk değerlendirmesi ve maruz kalan çalışan listesi", dayanak: "Biyolojik Etkenler Yön. m.5, 11 / Atıksu: Grup 2/3 etkenler", isaret: "YOK", tarih: "2026-08-24" },
        { no: 10, madde: "Hijyen tesisleri: el yıkama, duş, kirli-temiz soyunma alanı ayrımı kontrolü", dayanak: "Biyolojik Etkenler Yön. m.9", isaret: "YOK", tarih: "2026-08-24" },
        { no: 11, madde: "Klor gazı sızıntı algılama-alarm sistemi ve kaçış maskesi kontrol kayıtları", dayanak: "Kimyasal Maddeler Yön. m.8 / Periyodik test", isaret: "YOK", tarih: "2026-08-24" },
        { no: 12, madde: "Tehlikeli ve tıbbi atık yönetim kayıtları, ulusal atık beyanı", dayanak: "Atık Yönetimi Yön. / Yıllık beyan", isaret: "YOK", tarih: "2026-08-24" }
      ]},
      { ad: "BÖLÜM 11 İŞ KAZASI, RAMAK KALA VE MESLEK HASTALIĞI", maddeler: [
        { no: 1, madde: "İş kazası SGK bildirim kayıtları", dayanak: "6331 s.K. m.14 / Kazadan sonra 3 iş günü", isaret: "VAR", tarih: "2026-08-24" },
        { no: 2, madde: "İş kazası inceleme ve kök neden analizi raporları", dayanak: "6331 s.K. m.14 / Her kaza için", isaret: "VAR", tarih: "2026-08-24" },
        { no: 3, madde: "Ramak kala bildirim formları ve değerlendirme kayıtları", dayanak: "6331 s.K. m.14 / Sürekli", isaret: "YOK", tarih: "2026-08-24" },
        { no: 4, madde: "Meslek hastalığı şüphesi bildirim kayıtları", dayanak: "6331 s.K. m.14 / Öğrenilmesinden itibaren 3 iş günü", isaret: "YOK", tarih: "2026-08-24" },
        { no: 5, madde: "Ölümlü veya ağır yaralanmalı kazada kolluk kuvvetlerine bildirim", dayanak: "6331 s.K. m.14 / Derhâl", isaret: "YOK", tarih: "2026-08-24" },
        { no: 6, madde: "Kaza sıklık ve ağırlık oranı istatistikleri, trend analizi", dayanak: "6331 s.K. m.14 / Aylık / yıllık", isaret: "VAR", tarih: "2026-08-24" },
        { no: 7, madde: "Kaza sonrası düzeltici faaliyetler ve etkinlik doğrulama kayıtları", dayanak: "6331 s.K. m.10", isaret: "VAR", tarih: "2026-08-24" },
        { no: 8, madde: "İş kazası ve olay kayıt defteri / dijital kayıt sistemi", dayanak: "6331 s.K. m.14 / Sürekli", isaret: "VAR", tarih: "2026-08-24" }
      ]},
      { ad: "BÖLÜM 12 PERSONEL A.Ş.'NİN KENDİ ALT İŞVERENLERİ, ZİYARETÇİ VE STAJYERLER", maddeler: [
        { no: 1, madde: "Personel A.Ş. tarafından çalıştırılan alt işverenin İSG şartnamesi ve sözleşme hükümleri", dayanak: "6331 s.K. m.23", isaret: "YOK", tarih: "2026-08-24" },
        { no: 2, madde: "Alt işveren çalışan listesi, SGK bildirimleri, eğitim ve sağlık raporları", dayanak: "6331 s.K. m.23 / İşe başlamadan önce", isaret: "KD", tarih: "2026-08-24" },
        { no: 3, madde: "Alt işveren risk değerlendirmesi ve asıl işverenle koordinasyon tutanakları", dayanak: "Risk Değ. Yön. m.14", isaret: "YOK", tarih: "2026-08-24" },
        { no: 4, madde: "Ortak kullanım alanlarında İSG koordinasyon toplantı kayıtları", dayanak: "6331 s.K. m.23", isaret: "YOK", tarih: "2026-08-24" },
        { no: 5, madde: "Yapı işlerinde sağlık ve güvenlik planı ile koordinatör atama belgeleri", dayanak: "Yapı İşlerinde İSG Yön. / Proje bazlı", isaret: "YOK", tarih: "2026-08-24" },
        { no: 6, madde: "Ziyaretçi ve stajyer giriş kayıtları, İSG bilgilendirme formları", dayanak: "6331 s.K. m.5", isaret: "YOK", tarih: "2026-08-24" },
        { no: 7, madde: "Alt işverene yönelik İSG saha denetimi ve uygunsuzluk tutanakları", dayanak: "6331 s.K. m.23 / Periyodik", isaret: "YOK", tarih: "2026-08-24" }
      ]},
      { ad: "BÖLÜM 13 İŞYERİ ORTAMI, SOSYAL TESİS VE ERGONOMİ", maddeler: [
        { no: 1, madde: "Soyunma yeri, duş, WC, yemekhane ve dinlenme alanı uygunluk kontrolü", dayanak: "İşyeri Bina ve Eklentileri Yön.", isaret: "YOK", tarih: "2026-08-24" },
        { no: 2, madde: "İçme ve kullanma suyu analiz raporları", dayanak: "İnsani Tüketim Amaçlı Sular Yön. / Periyodik", isaret: "YOK", tarih: "2026-08-24" },
        { no: 3, madde: "Su deposu temizlik ve dezenfeksiyon kayıtları", dayanak: "İnsani Tüketim Amaçlı Sular Yön. / Yılda en az 1", isaret: "YOK", tarih: "2026-08-24" },
        { no: 4, madde: "Hijyen eğitimi belgeleri (yemekhane ve gıda personeli)", dayanak: "Hijyen Eğitimi Yön.", isaret: "YOK", tarih: "2026-08-24" },
        { no: 5, madde: "Haşere ve kemirgen mücadelesi (ilaçlama) kayıtları ve firma yetki belgesi", dayanak: "Biyosidal Ürünler Yön. / Periyodik", isaret: "YOK", tarih: "2026-08-24" },
        { no: 6, madde: "Elle taşıma iş analizi ve ergonomi değerlendirme raporu", dayanak: "Elle Taşıma İşleri Yön.", isaret: "YOK", tarih: "2026-08-24" },
        { no: 7, madde: "Ekranlı araçlarla çalışma değerlendirmesi ve göz muayeneleri (ofis birimleri)", dayanak: "Ekranlı Araçlarla Çalışmalar Yön.", isaret: "YOK", tarih: "2026-08-24" },
        { no: 8, madde: "İşyeri düzeni, temizlik ve saha denetim (turne) formları", dayanak: "İSG Hizmetleri Yön. m.9 / Periyodik", isaret: "YOK", tarih: "2026-08-24" }
      ]}
    ]
  }
  ];

  /* ---------- Şablon yardımcıları (salt okunur) ---------- */

  var HARF = {
    'ı': 'i', 'İ': 'i', 'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g',
    'ü': 'u', 'Ü': 'u', 'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c',
    'â': 'a', 'î': 'i', 'û': 'u'
  };

  /* Madde eşleştirmesinde kullanılan anahtar: Türkçe sadeleşir, noktalama düşer. */
  ISG.listeAnahtar = function (metin) {
    return String(metin === undefined || metin === null ? '' : metin)
      .replace(/[\S]/g, function (harf) { return HARF[harf] || harf; })
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  };

  ISG.listeSablonBul = function (kod) {
    var anahtar = ISG.listeAnahtar(kod);
    return SABLONLAR.filter(function (sablon) { return ISG.listeAnahtar(sablon.kod) === anahtar; })[0] || null;
  };

  /* İşyeri adı / kısa adı / sicil numarası ile şablon önerisi. */
  ISG.listeEsleyenSablonlar = function (isyeri) {
    if (!isyeri) { return []; }
    var hedef = [isyeri.ad, isyeri.kisaAd, isyeri.sicilNo].map(ISG.listeAnahtar).filter(Boolean);
    if (!hedef.length) { return []; }
    return SABLONLAR.filter(function (sablon) {
      return (sablon.eslesme || []).some(function (anahtar) {
        var deger = ISG.listeAnahtar(anahtar);
        if (!deger) { return false; }
        return hedef.some(function (h) { return h.indexOf(deger) > -1 || (deger.length > 3 && deger.indexOf(h) > -1); });
      });
    });
  };

  /* Word işaretini uygulama durumuna çevirir: VAR→var, YOK→eksik, K/D→yok. */
  ISG.listeDurumKod = function (isaret) {
    var deger = String(isaret || '').toUpperCase();
    if (deger === 'VAR') { return 'var'; }
    if (deger === 'YOK') { return 'eksik'; }
    if (deger === 'KD' || deger === 'K/D') { return 'yok'; }
    return 'incelenmedi';
  };

  ISG.listeMaddeSayisi = function (sablon) {
    if (!sablon) { return 0; }
    return (sablon.bolumler || []).reduce(function (toplam, bolum) {
      return toplam + (bolum.maddeler || []).length;
    }, 0);
  };

  /* Şablon maddelerinin işyerinde kaçının zaten açık olduğunu sayar. */
  ISG.listeKarsilastir = function (sablon, dosyalar) {
    var mevcut = {};
    (dosyalar || []).forEach(function (dosya) {
      mevcut[ISG.listeAnahtar(dosya.madde)] = true;
    });
    var toplam = 0, eslesen = 0, eksik = 0;
    (((sablon && sablon.bolumler) || [])).forEach(function (bolum) {
      (bolum.maddeler || []).forEach(function (madde) {
        toplam += 1;
        if (mevcut[ISG.listeAnahtar(madde.madde)]) { eslesen += 1; }
        if (ISG.listeDurumKod(madde.isaret) === 'eksik') { eksik += 1; }
      });
    });
    return { toplam: toplam, mevcut: eslesen, yeni: toplam - eslesen, eksik: eksik };
  };

  ISG.KONTROL_LISTESI_SABLONLARI = SABLONLAR;})(window);
