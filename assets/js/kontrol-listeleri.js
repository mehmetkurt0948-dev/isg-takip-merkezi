/* İSG Takip Merkezi — işyeri bazlı hazır dosya kontrol listeleri
   ÜRETİLMİŞ DOSYA — elle düzenlemeyin.
   Kaynak: tools/kontrol-listeleri/*.json (Word/Excel dönüştürme çıktısı)
   Yeni işyeri: node tools/kontrol-listesi.js donustur "<liste.docx|liste.xlsx>" <KOD>
   Toplu Excel: node tools/kontrol-listesi.js toplu "<klasör>" [--kaynaklar=<eslesme.json>]
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
        { no: 1, madde: "İSG-KATİP onaylı iş güvenliği uzmanı görevlendirme sözleşmesi", isaret: "VAR", dayanak: "6331 s.K. m.6, 8 / Görev süresince geçerli", tarih: "2026-08-24" },
        { no: 2, madde: "İSG-KATİP onaylı işyeri hekimi görevlendirme sözleşmesi", isaret: "VAR", dayanak: "6331 s.K. m.6, 8 / Görev süresince geçerli", tarih: "2026-08-24" },
        { no: 3, madde: "Diğer sağlık personeli görevlendirmesi (gerekli ise)", isaret: "KD", dayanak: "İSG Hizmetleri Yön. / Çalışan sayısına bağlı", tarih: "2026-08-24" },
        { no: 4, madde: "İşyeri SGK sicil numarası ve tehlike sınıfı tespit belgesi", isaret: "YOK", dayanak: "İş Kolları Tebliği", tarih: "2026-08-24" },
        { no: 5, madde: "İşveren imzalı ve çalışanlara ilan edilmiş İSG politikası", isaret: "YOK", dayanak: "6331 s.K. m.4", tarih: "2026-08-24" },
        { no: 6, madde: "Yıllık çalışma planı (uzman + hekim imzalı, işveren onaylı)", isaret: "VAR", dayanak: "İSG Hizmetleri Yön. m.7 / Her yıl yenilenir", tarih: "2026-08-24" },
        { no: 7, madde: "Bir önceki yıla ait yıllık değerlendirme raporu", isaret: "VAR", dayanak: "İSG Hizmetleri Yön. m.7 / Yılda 1 kez", tarih: "2026-08-24" },
        { no: 8, madde: "Onaylı İSG defteri (tespit ve öneri defteri) — imzalı, tarihli", isaret: "VAR", dayanak: "İSG Hizmetleri Yön. m.7 / Sürekli güncel", tarih: "2026-08-24" },
        { no: 9, madde: "İSG Kurulu kuruluş kararı ve üye görevlendirme yazıları", isaret: "VAR", dayanak: "İSG Kurulları Yön. / 50+ çalışan / 6 aydan uzun iş", tarih: "2026-08-24" },
        { no: 10, madde: "İSG Kurulu iç yönergesi", isaret: "YOK", dayanak: "İSG Kurulları Yön. m.8", tarih: "2026-08-24" },
        { no: 11, madde: "Kurul toplantı tutanakları ve karar takip çizelgesi", isaret: "VAR", dayanak: "İSG Kurulları Yön. m.9 / Tehlikeli: 2 ayda bir", tarih: "2026-08-24" },
        { no: 12, madde: "Çalışan temsilcisi seçim/atama tutanağı ve ilan belgesi", isaret: "VAR", dayanak: "Çalışan Temsilcisi Tebliği", tarih: "2026-08-24" },
        { no: 13, madde: "Destek elemanı görevlendirme belgeleri", isaret: "YOK", dayanak: "6331 s.K. m.3, 11", tarih: "2026-08-24" },
        { no: 14, madde: "İSG talimatları listesi ve tebliğ-tebellüğ (imza) kayıtları", isaret: "VAR", dayanak: "6331 s.K. m.16", tarih: "2026-08-24" },
        { no: 15, madde: "Çalışanların görüş, öneri ve katılım kayıtları", isaret: "YOK", dayanak: "6331 s.K. m.18", tarih: "2026-08-24" }
      ]},
      { ad: "BÖLÜM 2 ASIL İŞVEREN (ASKİ) İLİŞKİSİ VE ORTAK ÇALIŞMA ALANI KOORDİNASYONU", maddeler: [
        { no: 1, madde: "Hizmet alım sözleşmesi ve teknik şartnamenin İSG hükümleri (KKD, eğitim, ölçüm ve periyodik kontrol maliyet/sorumluluk dağılımı)", isaret: "YOK", dayanak: "6331 s.K. m.23 / Sözleşme süresince", tarih: "2026-08-24" },
        { no: 2, madde: "Personel A.Ş. adına düzenlenmiş bağımsız SGK işyeri sicil numarası ve tescil belgesi", isaret: "YOK", dayanak: "5510 s.K. m.11", tarih: "2026-08-24" },
        { no: 3, madde: "İSG-KATİP görevlendirmelerinin Personel A.Ş. sicili üzerinden yapıldığının teyidi", isaret: "VAR", dayanak: "İSG Hizmetleri Yön. / ASKİ sicili üzerinden olmamalı", tarih: "2026-08-24" },
        { no: 4, madde: "ASKİ tesis/birim bazlı personel dağılım listesi ve çalışma alanı tanımları", isaret: "VAR", dayanak: "6331 s.K. m.23 / Sürekli güncel", tarih: "2026-08-24" },
        { no: 5, madde: "Ortak çalışma alanı İSG koordinasyon protokolü ve sorumluluk matrisi", isaret: "YOK", dayanak: "6331 s.K. m.23/1 / Hangi yükümlülük kimde", tarih: "2026-08-24" },
        { no: 6, madde: "ASKİ'nin risk değerlendirmesinin Personel A.Ş.'ye yazılı tebliği", isaret: "YOK", dayanak: "Risk Değ. Yön. m.15 / Evrak kayıt numaralı", tarih: "2026-08-24" },
        { no: 7, madde: "Personel A.Ş. risk değerlendirmesinin ASKİ'ye yazılı bildirimi", isaret: "YOK", dayanak: "Risk Değ. Yön. m.15 / Evrak kayıt numaralı", tarih: "2026-08-24" },
        { no: 8, madde: "Tesis, bina ve iş ekipmanı mülkiyet-sorumluluk envanteri (ASKİ'ye ait olanlar ayrı gösterilmiş)", isaret: "YOK", dayanak: "İş Ekipmanları Yön. m.4", tarih: "2026-08-24" },
        { no: 9, madde: "ASKİ'ye ait iş ekipmanlarının periyodik kontrol raporlarının temin edildiğine dair yazışmalar", isaret: "YOK", dayanak: "İş Ekipmanları Yön. m.7 / Kontrol periyoduna göre", tarih: "2026-08-24" },
        { no: 10, madde: "ASKİ tesislerine ait patlamadan korunma dokümanı ve ortam ölçüm raporlarının temini", isaret: "YOK", dayanak: "Patlayıcı Ortamlar Yön. • İş Hijyeni Ölçüm Yön.", tarih: "2026-08-24" },
        { no: 11, madde: "ASKİ acil durum planına Personel A.Ş. çalışanlarının dâhil edilmesi ve ortak tatbikat kayıtları", isaret: "YOK", dayanak: "Acil Durumlar Yön. m.15 / Yılda en az 1", tarih: "2026-08-24" },
        { no: 12, madde: "İSG Kurulu işleyişi: kurul kararlarının ASKİ'ye tebliği ve ASKİ kurul kararlarının temini", isaret: "YOK", dayanak: "İSG Kurulları Yön. m.11 / Her toplantı sonrası", tarih: "2026-08-24" },
        { no: 13, madde: "ASKİ'ye yapılan yazılı eksiklik bildirimleri, talep yazıları ve cevapları", isaret: "VAR", dayanak: "6331 s.K. m.23 / Evrak kayıt numaralı", tarih: "2026-08-24" },
        { no: 14, madde: "Tespit ve öneri defterinde çözümü ASKİ'de olan hususların ayrı takip listesi", isaret: "YOK", dayanak: "İSG Hizmetleri Yön. m.7 / Sürekli", tarih: "2026-08-24" },
        { no: 15, madde: "Çalışma izin sisteminde yetki devri protokolü (izni kim verir, gaz ölçümünü kim yapar)", isaret: "YOK", dayanak: "6331 s.K. m.23 • Risk Değ. Yön.", tarih: "2026-08-24" },
        { no: 16, madde: "İş kazasında karşılıklı bildirim ve ortak inceleme prosedürü", isaret: "YOK", dayanak: "6331 s.K. m.14, 23", tarih: "2026-08-24" }
      ]},
      { ad: "BÖLÜM 3 RİSK DEĞERLENDİRMESİ VE ACİL DURUM YÖNETİMİ", maddeler: [
        { no: 1, madde: "Güncel risk değerlendirmesi raporu (ekip imzalı, işveren onaylı)", isaret: "VAR", dayanak: "Risk Değ. Yön. / Ç.Tehlikeli 2 / Tehlikeli 4 / Az T. 6 yıl", tarih: "2026-08-24" },
        { no: 2, madde: "Risk değerlendirmesi ekibi görevlendirme belgesi", isaret: "VAR", dayanak: "Risk Değ. Yön. m.6", tarih: "2026-08-24" },
        { no: 3, madde: "Düzeltici ve önleyici faaliyet (DÖF) planı, termin ve kapatma takibi", isaret: "YOK", dayanak: "Risk Değ. Yön. m.10 / Sürekli", tarih: "2026-08-24" },
        { no: 4, madde: "Yenilemeyi gerektiren durum kayıtları (kaza, yeni ekipman, taşınma, mevzuat değişikliği)", isaret: "YOK", dayanak: "Risk Değ. Yön. m.12", tarih: "2026-08-24" },
        { no: 5, madde: "İşveren onaylı güncel acil durum planı", isaret: "VAR", dayanak: "Acil Durumlar Yön. / Ç.Tehlikeli 2 / Tehlikeli 4 / Az T. 6 yıl", tarih: "2026-08-24" },
        { no: 6, madde: "Acil durum ekipleri: söndürme, kurtarma, koruma, ilkyardım görevlendirmeleri", isaret: "YOK", dayanak: "Acil Durumlar Yön. m.11", tarih: "2026-08-24" },
        { no: 7, madde: "Ekip üyelerinin yangın ve arama-kurtarma-tahliye eğitim belgeleri", isaret: "YOK", dayanak: "Acil Durumlar Yön. m.11", tarih: "2026-08-24" },
        { no: 8, madde: "İlkyardımcı sertifikaları ve yeterli sayı kontrolü", isaret: "YOK", dayanak: "İlkyardım Yön. / Sertifika 3 yılda bir güncellenir", tarih: "2026-08-24" },
        { no: 9, madde: "Tahliye tatbikatı tutanağı ve tatbikat değerlendirme raporu", isaret: "VAR", dayanak: "Acil Durumlar Yön. m.13 / Yılda en az 1 kez", tarih: "2026-08-24" },
        { no: 10, madde: "Kaçış yolu, acil çıkış ve toplanma yeri işaretlemeleri ile kat planları", isaret: "YOK", dayanak: "Sağlık ve Güvenlik İşaretleri Yön.", tarih: "2026-08-24" },
        { no: 11, madde: "Güncel acil durum haberleşme ve irtibat listesi", isaret: "YOK", dayanak: "Acil Durumlar Yön. / Sürekli güncel", tarih: "2026-08-24" },
        { no: 12, madde: "İlkyardım dolabı malzeme listesi ve miat takip formu", isaret: "YOK", dayanak: "İlkyardım Yön. / Aylık kontrol", tarih: "2026-08-24" }
      ]},
      { ad: "BÖLÜM 4 İSG EĞİTİM KAYITLARI", maddeler: [
        { no: 1, madde: "İşveren onaylı yıllık eğitim programı", isaret: "VAR", dayanak: "Çalışanların İSG Eğitimleri Yön. m.6 / Her yıl", tarih: "2026-08-24" },
        { no: 2, madde: "Temel İSG eğitimi katılım tutanakları (konu, süre, tarih, eğitmen imzalı)", isaret: "VAR", dayanak: "Eğitim Yön. m.11 / Ç.T. 16 saat/yıl • T. 12 saat/2 yıl • A.T. 8 saat/3 yıl", tarih: "2026-08-24" },
        { no: 3, madde: "Eğitim sonrası ölçme-değerlendirme (sınav) kâğıtları ve sonuç listesi", isaret: "VAR", dayanak: "Eğitim Yön. m.13", tarih: "2026-08-24" },
        { no: 4, madde: "Düzenlenen İSG eğitim belgeleri / sertifikaları", isaret: "YOK", dayanak: "Eğitim Yön. m.13 / Özlük dosyasında saklanır", tarih: "2026-08-24" },
        { no: 5, madde: "İşe başlamadan önce verilen oryantasyon eğitimi kayıtları", isaret: "YOK", dayanak: "Eğitim Yön. m.5 / İşe girişte", tarih: "2026-08-24" },
        { no: 6, madde: "İş değişikliği, yeni ekipman veya uzun süreli işten uzak kalma sonrası ilave eğitimler", isaret: "VAR", dayanak: "Eğitim Yön. m.6 / Olay bazlı", tarih: "2026-08-24" },
        { no: 7, madde: "Mesleki yeterlilik / MYK belgeleri (tehlikeli ve çok tehlikeli işler)", isaret: "YOK", dayanak: "Mesleki Eğitim Yön.", tarih: "2026-08-24" },
        { no: 8, madde: "Özel eğitimler: yüksekte çalışma, kapalı-dar alan, LOTO, sıcak iş, forklift ve iş makinesi operatörlüğü", isaret: "YOK", dayanak: "İş Ekipmanları Yön.", tarih: "2026-08-24" },
        { no: 9, madde: "Eğiticilerin yetki belgeleri ve eğitim müfredatı / sunum içerikleri", isaret: "YOK", dayanak: "Eğitim Yön. m.13", tarih: "2026-08-24" },
        { no: 10, madde: "Alt işveren ve geçici çalışanların eğitim kayıtları", isaret: "YOK", dayanak: "6331 s.K. m.23", tarih: "2026-08-24" }
      ]},
      { ad: "BÖLÜM 5 SAĞLIK GÖZETİMİ", maddeler: [
        { no: 1, madde: "İşe giriş sağlık raporları (tüm çalışanlar için eksiksiz)", isaret: "VAR", dayanak: "6331 s.K. m.15 / İşe girişte", tarih: "2026-08-24" },
        { no: 2, madde: "Periyodik muayene kayıtları", isaret: "VAR", dayanak: "6331 s.K. m.15 / Ç.Tehlikeli 1 / Tehlikeli 3 / Az T. 5 yıl", tarih: "2026-08-24" },
        { no: 3, madde: "İş değişikliği ve iş kazası/meslek hastalığı sonrası kontrol muayeneleri", isaret: "YOK", dayanak: "6331 s.K. m.15 / Olay bazlı", tarih: "2026-08-24" },
        { no: 4, madde: "Odyometri (işitme) testleri — gürültülü ortamda çalışanlar", isaret: "VAR", dayanak: "Gürültü Yön. / Maruziyet düzeyine göre", tarih: "2026-08-24" },
        { no: 5, madde: "Solunum fonksiyon testi (SFT) ve akciğer grafisi — toz/kimyasal maruziyeti", isaret: "YOK", dayanak: "Tozla Mücadele Yön.", tarih: "2026-08-24" },
        { no: 6, madde: "Portör / hijyen muayeneleri (yemekhane ve gıda ile temaslı personel)", isaret: "YOK", dayanak: "Hijyen Eğitimi Yön.", tarih: "2026-08-24" },
        { no: 7, madde: "Aşı kayıtları (tetanoz, hepatit A-B) — atıksu, kanalizasyon ve veteriner hizmetleri", isaret: "YOK", dayanak: "Biyolojik Etkenler Yön. m.10 / Aşı takvimine göre", tarih: "2026-08-24" },
        { no: 8, madde: "Biyolojik izleme ve laboratuvar tetkik sonuçları", isaret: "VAR", dayanak: "Kimyasal Maddeler Yön.", tarih: "2026-08-24" },
        { no: 9, madde: "Kişisel sağlık dosyalarının gizlilik esasına uygun muhafazası", isaret: "VAR", dayanak: "6331 s.K. m.15 • KVKK / Görev sonrası 15 yıl", tarih: "2026-08-24" },
        { no: 10, madde: "İşe uygunluk kısıtlamaları ve rapora itiraz kayıtları", isaret: "YOK", dayanak: "6331 s.K. m.15", tarih: "2026-08-24" },
        { no: 11, madde: "Gebe, emziren, genç ve engelli çalışanlara ilişkin özel gözetim kayıtları", isaret: "YOK", dayanak: "İlgili özel yönetmelikler", tarih: "2026-08-24" }
      ]},
      { ad: "BÖLÜM 6 KİŞİSEL KORUYUCU DONANIM (KKD)", maddeler: [
        { no: 1, madde: "KKD risk analizi ve iş/görev bazlı KKD matrisi", isaret: "YOK", dayanak: "KKD Kullanılması Yön. m.7", tarih: "2026-08-24" },
        { no: 2, madde: "CE belgeleri, AT uygunluk beyanları ve Türkçe kullanım kılavuzları", isaret: "YOK", dayanak: "KKD Yön. m.5", tarih: "2026-08-24" },
        { no: 3, madde: "KKD zimmet tutanakları (çalışan imzalı ve tarihli)", isaret: "YOK", dayanak: "KKD Yön. m.6 / Teslimde", tarih: "2026-08-24" },
        { no: 4, madde: "KKD kullanım, bakım ve muhafaza eğitimi kayıtları", isaret: "YOK", dayanak: "KKD Yön. m.11", tarih: "2026-08-24" },
        { no: 5, madde: "KKD bakım, muayene ve kullanım ömrü / değişim takip çizelgesi", isaret: "YOK", dayanak: "KKD Yön. m.6 / Üretici periyoduna göre", tarih: "2026-08-24" },
        { no: 6, madde: "Düşme durdurma sistemleri (kemer, halat, ankraj) periyodik muayene kayıtları", isaret: "YOK", dayanak: "İş Ekipmanları Yön. Ek-3 / Yılda en az 1", tarih: "2026-08-24" },
        { no: 7, madde: "Solunum koruyucu filtre değişim kayıtları ve sızdırmazlık (fit) testleri", isaret: "YOK", dayanak: "KKD Yön.", tarih: "2026-08-24" },
        { no: 8, madde: "KKD kullanmama durumunda düzenlenen uyarı ve tutanak kayıtları", isaret: "YOK", dayanak: "6331 s.K. m.19", tarih: "2026-08-24" }
      ]},
      { ad: "BÖLÜM 7 İŞ EKİPMANLARI PERİYODİK KONTROLLERİ", maddeler: [
        { no: 1, madde: "Kaldırma-iletme ekipmanları (vinç, caraskal, forklift, transpalet)", isaret: "YOK", dayanak: "İş Ekipmanları Yön. Ek-3 / Yılda 1 (aksi belirtilmedikçe)", tarih: "2026-08-24" },
        { no: 2, madde: "Kaldırma aksesuarları (sapan, çelik halat, zincir, kanca)", isaret: "YOK", dayanak: "İş Ekipmanları Yön. Ek-3 / Yılda 1", tarih: "2026-08-24" },
        { no: 3, madde: "Basınçlı kaplar: kompresör, hava tankı, hidrofor, genleşme tankı", isaret: "YOK", dayanak: "İş Ekipmanları Yön. Ek-3 / Yılda 1", tarih: "2026-08-24" },
        { no: 4, madde: "Kazanlar, emniyet vanaları ve basınç göstergeleri", isaret: "YOK", dayanak: "İş Ekipmanları Yön. Ek-3 / Yılda 1", tarih: "2026-08-24" },
        { no: 5, madde: "Yangın söndürme cihazları kontrol ve dolum kayıtları", isaret: "YOK", dayanak: "TS ISO 11602-2 / Kontrol 6 ayda 1 • dolum periyodik", tarih: "2026-08-24" },
        { no: 6, madde: "Yangın algılama-alarm, hidrant, sprinkler ve yangın pompası testleri", isaret: "YOK", dayanak: "Binaların Yangından Korunması Yön. / Aylık test • yıllık kontrol", tarih: "2026-08-24" },
        { no: 7, madde: "Elektrik tesisatı genel kontrolü ve pano termal kamera ölçümü", isaret: "YOK", dayanak: "Elektrik Tesislerinde Topraklamalar Yön. / Yılda 1", tarih: "2026-08-24" },
        { no: 8, madde: "Topraklama ve süreklilik ölçümleri (jeneratör ve seyyar cihazlar dâhil)", isaret: "YOK", dayanak: "Topraklamalar Yön. / Sabit tesis: yılda 1", tarih: "2026-08-24" },
        { no: 9, madde: "Yıldırımdan korunma (paratoner) tesisatı ölçüm raporu", isaret: "YOK", dayanak: "İş Ekipmanları Yön. Ek-3 / Yılda 1", tarih: "2026-08-24" },
        { no: 10, madde: "Kaçak akım koruma rölesi test kayıtları", isaret: "YOK", dayanak: "İş Ekipmanları Yön. Ek-3 / Ayda 1 (test butonu)", tarih: "2026-08-24" },
        { no: 11, madde: "Jeneratör, UPS ve akü grubu bakım-test kayıtları", isaret: "YOK", dayanak: "İş Ekipmanları Yön. / Üretici periyoduna göre", tarih: "2026-08-24" },
        { no: 12, madde: "Asansör periyodik kontrolü ve etiket durumu", isaret: "YOK", dayanak: "Asansör İşletme ve Bakım Yön. / Yılda 1", tarih: "2026-08-24" },
        { no: 13, madde: "Havalandırma, aspirasyon ve klima sistemleri bakım kayıtları", isaret: "YOK", dayanak: "İşyeri Bina ve Eklentileri Yön.", tarih: "2026-08-24" },
        { no: 14, madde: "Platform, korkuluk, sabit merdiven ve çalışma iskelesi kontrol kayıtları", isaret: "YOK", dayanak: "İş Ekipmanları Yön. Ek-2", tarih: "2026-08-24" },
        { no: 15, madde: "Araç ve iş makinesi bakım-muayene kayıtları, operatör belgeleri", isaret: "YOK", dayanak: "İş Ekipmanları Yön.", tarih: "2026-08-24" },
        { no: 16, madde: "Periyodik kontrolü yapan kişilerin yetki belgeleri (rapor ekinde)", isaret: "YOK", dayanak: "İş Ekipmanları Yön. m.13", tarih: "2026-08-24" }
      ]},
      { ad: "BÖLÜM 8 ORTAM ÖLÇÜMLERİ VE İŞ HİJYENİ", maddeler: [
        { no: 1, madde: "Ölçüm yapan laboratuvarın Bakanlık yetki belgesi ve akreditasyon kapsamı", isaret: "YOK", dayanak: "İş Hijyeni Ölçüm Yön. / Geçerlilik kontrolü", tarih: "2026-08-24" },
        { no: 2, madde: "Gürültü maruziyet ölçüm raporu ve maruziyet haritası", isaret: "YOK", dayanak: "Gürültü Yön. / Risk değ. periyoduna göre", tarih: "2026-08-24" },
        { no: 3, madde: "Toz ölçümü (solunabilir ve toplam toz)", isaret: "YOK", dayanak: "Tozla Mücadele Yön.", tarih: "2026-08-24" },
        { no: 4, madde: "Kimyasal maruziyet ölçümleri (klor, H₂S, amonyak, çözücü buharları vb.)", isaret: "YOK", dayanak: "Kimyasal Maddeler Yön.", tarih: "2026-08-24" },
        { no: 5, madde: "Titreşim ölçümü (el-kol ve tüm vücut)", isaret: "YOK", dayanak: "Titreşim Yön.", tarih: "2026-08-24" },
        { no: 6, madde: "Aydınlatma ölçüm raporu", isaret: "YOK", dayanak: "İşyeri Bina ve Eklentileri Yön.", tarih: "2026-08-24" },
        { no: 7, madde: "Termal konfor ölçümü (sıcaklık, nem, hava akım hızı)", isaret: "YOK", dayanak: "İşyeri Bina ve Eklentileri Yön.", tarih: "2026-08-24" },
        { no: 8, madde: "Ölçüm sonuçlarının sınır değerlerle karşılaştırılması ve DÖF kayıtları", isaret: "YOK", dayanak: "İş Hijyeni Ölçüm Yön. m.14", tarih: "2026-08-24" },
        { no: 9, madde: "Sağlık ve güvenlik işaretlerinin yerinde, okunur ve güncel olduğunun kontrolü", isaret: "YOK", dayanak: "Sağlık ve Güvenlik İşaretleri Yön.", tarih: "2026-08-24" }
      ]},
      { ad: "BÖLÜM 9 ÇALIŞMA İZİN SİSTEMİ VE TEHLİKELİ İŞLER", maddeler: [
        { no: 1, madde: "Çalışma izni (PTW) prosedürü, yetkili imza listesi ve form setleri", isaret: "YOK", dayanak: "6331 s.K. m.10 • Risk Değ. Yön.", tarih: "2026-08-24" },
        { no: 2, madde: "Kapalı / dar alana giriş izinleri ve gaz ölçüm kayıtları (O₂, LEL, H₂S, CO)", isaret: "YOK", dayanak: "İş Ekipmanları Yön. • Risk Değ. Yön. / Her giriş öncesi", tarih: "2026-08-24" },
        { no: 3, madde: "Sıcak iş (kaynak, kesme, taşlama) izin formları ve yangın gözcüsü kaydı", isaret: "YOK", dayanak: "Binaların Yangından Korunması Yön. / İş bazlı", tarih: "2026-08-24" },
        { no: 4, madde: "Yüksekte çalışma izni ve düşmeyi önleme / kurtarma planı", isaret: "YOK", dayanak: "İş Ekipmanları Yön. Ek-2 / İş bazlı", tarih: "2026-08-24" },
        { no: 5, madde: "Kazı, iksa ve şevlendirme çalışma izni ile altyapı sorgu yazıları", isaret: "YOK", dayanak: "Yapı İşlerinde İSG Yön. Ek-4 / İş bazlı", tarih: "2026-08-24" },
        { no: 6, madde: "LOTO (enerji kesme-kilitleme-etiketleme) prosedürü, kilit-etiket envanteri ve uygulama kayıtları", isaret: "YOK", dayanak: "İş Ekipmanları Yön. m.8 / Her müdahalede", tarih: "2026-08-24" },
        { no: 7, madde: "Elektrikte çalışma izni, arc-flash risk analizi ve yetkili personel listesi", isaret: "YOK", dayanak: "Elektrik Kuvvetli Akım Tesisleri Yön.", tarih: "2026-08-24" },
        { no: 8, madde: "Gaz ölçüm cihazı kalibrasyon sertifikaları ve bump test kayıtları", isaret: "YOK", dayanak: "İş Ekipmanları Yön. / Kalibrasyon yıllık • bump test günlük", tarih: "2026-08-24" },
        { no: 9, madde: "Kapalı alan kurtarma ekipmanı (tripod, vinç, temiz hava solunum cihazı) kontrol kayıtları", isaret: "YOK", dayanak: "İş Ekipmanları Yön. Ek-3 / Yılda 1", tarih: "2026-08-24" },
        { no: 10, madde: "Tek başına çalışma ve gözcü (watchman) uygulama talimatı", isaret: "YOK", dayanak: "Risk Değ. Yön.", tarih: "2026-08-24" }
      ]},
      { ad: "BÖLÜM 10 KİMYASAL, BİYOLOJİK VE PATLAYICI ORTAM", maddeler: [
        { no: 1, madde: "Kimyasal madde envanteri (miktar, CAS no, depolama yeri)", isaret: "YOK", dayanak: "Kimyasal Maddeler Yön. m.6 / Sürekli güncel", tarih: "2026-08-24" },
        { no: 2, madde: "Türkçe ve 16 bölümlü güncel güvenlik bilgi formları (GBF/SDS)", isaret: "YOK", dayanak: "GBF Hazırlanması Hk. Yön. / Sürekli güncel", tarih: "2026-08-24" },
        { no: 3, madde: "GBF'lerin kullanım noktalarında erişilebilirliği ve CLP etiketleme kontrolü", isaret: "YOK", dayanak: "SEA (CLP) Yön.", tarih: "2026-08-24" },
        { no: 4, madde: "Kimyasal depolama uygunluğu (ayrıştırma, havalandırma, sızdırmazlık havuzu)", isaret: "YOK", dayanak: "Kimyasal Maddeler Yön. m.7", tarih: "2026-08-24" },
        { no: 5, madde: "Acil duş ve göz yıkama ünitesi test/kontrol kayıtları", isaret: "YOK", dayanak: "Kimyasal Maddeler Yön. / Haftalık test önerilir", tarih: "2026-08-24" },
        { no: 6, madde: "Dökülme-saçılma müdahale seti envanteri ve müdahale talimatı", isaret: "YOK", dayanak: "Kimyasal Maddeler Yön. m.8", tarih: "2026-08-24" },
        { no: 7, madde: "Patlamadan Korunma Dokümanı (PKD) ve bölge (zone) sınıflandırma haritası", isaret: "YOK", dayanak: "Patlayıcı Ortamlar Yön. m.10 / Çürütücü, gaz deposu, klor odası", tarih: "2026-08-24" },
        { no: 8, madde: "Ex-proof ekipman envanteri, uygunluk ve bakım kayıtları", isaret: "YOK", dayanak: "Patlayıcı Ortamlar Yön. Ek-3", tarih: "2026-08-24" },
        { no: 9, madde: "Biyolojik etken risk değerlendirmesi ve maruz kalan çalışan listesi", isaret: "YOK", dayanak: "Biyolojik Etkenler Yön. m.5, 11 / Atıksu: Grup 2/3 etkenler", tarih: "2026-08-24" },
        { no: 10, madde: "Hijyen tesisleri: el yıkama, duş, kirli-temiz soyunma alanı ayrımı kontrolü", isaret: "YOK", dayanak: "Biyolojik Etkenler Yön. m.9", tarih: "2026-08-24" },
        { no: 11, madde: "Klor gazı sızıntı algılama-alarm sistemi ve kaçış maskesi kontrol kayıtları", isaret: "YOK", dayanak: "Kimyasal Maddeler Yön. m.8 / Periyodik test", tarih: "2026-08-24" },
        { no: 12, madde: "Tehlikeli ve tıbbi atık yönetim kayıtları, ulusal atık beyanı", isaret: "YOK", dayanak: "Atık Yönetimi Yön. / Yıllık beyan", tarih: "2026-08-24" }
      ]},
      { ad: "BÖLÜM 11 İŞ KAZASI, RAMAK KALA VE MESLEK HASTALIĞI", maddeler: [
        { no: 1, madde: "İş kazası SGK bildirim kayıtları", isaret: "VAR", dayanak: "6331 s.K. m.14 / Kazadan sonra 3 iş günü", tarih: "2026-08-24" },
        { no: 2, madde: "İş kazası inceleme ve kök neden analizi raporları", isaret: "VAR", dayanak: "6331 s.K. m.14 / Her kaza için", tarih: "2026-08-24" },
        { no: 3, madde: "Ramak kala bildirim formları ve değerlendirme kayıtları", isaret: "YOK", dayanak: "6331 s.K. m.14 / Sürekli", tarih: "2026-08-24" },
        { no: 4, madde: "Meslek hastalığı şüphesi bildirim kayıtları", isaret: "YOK", dayanak: "6331 s.K. m.14 / Öğrenilmesinden itibaren 3 iş günü", tarih: "2026-08-24" },
        { no: 5, madde: "Ölümlü veya ağır yaralanmalı kazada kolluk kuvvetlerine bildirim", isaret: "YOK", dayanak: "6331 s.K. m.14 / Derhâl", tarih: "2026-08-24" },
        { no: 6, madde: "Kaza sıklık ve ağırlık oranı istatistikleri, trend analizi", isaret: "VAR", dayanak: "6331 s.K. m.14 / Aylık / yıllık", tarih: "2026-08-24" },
        { no: 7, madde: "Kaza sonrası düzeltici faaliyetler ve etkinlik doğrulama kayıtları", isaret: "VAR", dayanak: "6331 s.K. m.10", tarih: "2026-08-24" },
        { no: 8, madde: "İş kazası ve olay kayıt defteri / dijital kayıt sistemi", isaret: "VAR", dayanak: "6331 s.K. m.14 / Sürekli", tarih: "2026-08-24" }
      ]},
      { ad: "BÖLÜM 12 PERSONEL A.Ş.'NİN KENDİ ALT İŞVERENLERİ, ZİYARETÇİ VE STAJYERLER", maddeler: [
        { no: 1, madde: "Personel A.Ş. tarafından çalıştırılan alt işverenin İSG şartnamesi ve sözleşme hükümleri", isaret: "YOK", dayanak: "6331 s.K. m.23", tarih: "2026-08-24" },
        { no: 2, madde: "Alt işveren çalışan listesi, SGK bildirimleri, eğitim ve sağlık raporları", isaret: "KD", dayanak: "6331 s.K. m.23 / İşe başlamadan önce", tarih: "2026-08-24" },
        { no: 3, madde: "Alt işveren risk değerlendirmesi ve asıl işverenle koordinasyon tutanakları", isaret: "YOK", dayanak: "Risk Değ. Yön. m.14", tarih: "2026-08-24" },
        { no: 4, madde: "Ortak kullanım alanlarında İSG koordinasyon toplantı kayıtları", isaret: "YOK", dayanak: "6331 s.K. m.23", tarih: "2026-08-24" },
        { no: 5, madde: "Yapı işlerinde sağlık ve güvenlik planı ile koordinatör atama belgeleri", isaret: "YOK", dayanak: "Yapı İşlerinde İSG Yön. / Proje bazlı", tarih: "2026-08-24" },
        { no: 6, madde: "Ziyaretçi ve stajyer giriş kayıtları, İSG bilgilendirme formları", isaret: "YOK", dayanak: "6331 s.K. m.5", tarih: "2026-08-24" },
        { no: 7, madde: "Alt işverene yönelik İSG saha denetimi ve uygunsuzluk tutanakları", isaret: "YOK", dayanak: "6331 s.K. m.23 / Periyodik", tarih: "2026-08-24" }
      ]},
      { ad: "BÖLÜM 13 İŞYERİ ORTAMI, SOSYAL TESİS VE ERGONOMİ", maddeler: [
        { no: 1, madde: "Soyunma yeri, duş, WC, yemekhane ve dinlenme alanı uygunluk kontrolü", isaret: "YOK", dayanak: "İşyeri Bina ve Eklentileri Yön.", tarih: "2026-08-24" },
        { no: 2, madde: "İçme ve kullanma suyu analiz raporları", isaret: "YOK", dayanak: "İnsani Tüketim Amaçlı Sular Yön. / Periyodik", tarih: "2026-08-24" },
        { no: 3, madde: "Su deposu temizlik ve dezenfeksiyon kayıtları", isaret: "YOK", dayanak: "İnsani Tüketim Amaçlı Sular Yön. / Yılda en az 1", tarih: "2026-08-24" },
        { no: 4, madde: "Hijyen eğitimi belgeleri (yemekhane ve gıda personeli)", isaret: "YOK", dayanak: "Hijyen Eğitimi Yön.", tarih: "2026-08-24" },
        { no: 5, madde: "Haşere ve kemirgen mücadelesi (ilaçlama) kayıtları ve firma yetki belgesi", isaret: "YOK", dayanak: "Biyosidal Ürünler Yön. / Periyodik", tarih: "2026-08-24" },
        { no: 6, madde: "Elle taşıma iş analizi ve ergonomi değerlendirme raporu", isaret: "YOK", dayanak: "Elle Taşıma İşleri Yön.", tarih: "2026-08-24" },
        { no: 7, madde: "Ekranlı araçlarla çalışma değerlendirmesi ve göz muayeneleri (ofis birimleri)", isaret: "YOK", dayanak: "Ekranlı Araçlarla Çalışmalar Yön.", tarih: "2026-08-24" },
        { no: 8, madde: "İşyeri düzeni, temizlik ve saha denetim (turne) formları", isaret: "YOK", dayanak: "İSG Hizmetleri Yön. m.9 / Periyodik", tarih: "2026-08-24" }
      ]}
    ]
  },
  {
    kod: "ASKI-2", ad: "ASKİ-2 — Dosya Kontrol Listesi", kaynak: "İSG Dosya Kontrol Checklisti (Excel: aski-2.xlsx) · Sayfadaki birim: ASKİ-2",
    duzenleyen: "Kontrolü yapan: A Sınıfı İş Güvenliği Uzmanı Oğuzhan ÖNAY · İSG uzmanı: A sınıfı İş Güvenliği Uzmanı Barış TAŞDEMİR", sicilNo: "",
    isyeriAdi: "ASKİ-2", asilIsveren: "",
    kontrolTarihi: "2026-09-23", sonrakiKontrol: "",
    eslesme: ["ASKİ-2", "ASKİ 2"],
    genelDegerlendirme: "Kontrol özeti (107 madde): 16 var/uygun, 52 eksik, 22 güncellenecek, 17 uygulanamaz.",
    bolumler: [
      { ad: "İşyeri ve İSG Organizasyonu", maddeler: [
        { no: 1, madde: "İşyerine ait temel bilgiler", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 2, madde: "SGK işyeri sicil bilgileri", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 3, madde: "NACE kodu / faaliyet bilgisi", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 4, madde: "Tehlike sınıfı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 5, madde: "Çalışan sayısı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 6, madde: "İSG profesyonellerinin görevlendirme kayıtları", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 7, madde: "İSG-KATİP sözleşmeleri / görevlendirmeleri", isaret: "VAR" }
      ]},
      { ad: "Çalışan temsilcisi", maddeler: [
        { no: 8, madde: "Çalışan Temsilcisi Atama yazısı", isaret: "YOK", not: "Evrakta tarih yazmıyor" },
        { no: 9, madde: "Çalışan temsilcisi Eğitim yazısı", isaret: "YOK", not: "eğitim tarihi ve doktor imzası yok" },
        { no: 10, madde: "Çalışan temsilcisi talimatları", isaret: "VAR" },
        { no: 11, madde: "Çalışan temsilcisi test", isaret: "VAR" },
        { no: 12, madde: "Baş Çalışan Temsilcisi yazısı", isaret: "YOK", not: "Evrakta tarih yazmıyor" }
      ]},
      { ad: "Yıllık planlar", maddeler: [
        { no: 13, madde: "Yıllık değerlendirme raporu", isaret: "VAR" },
        { no: 14, madde: "Yıllık çalışma planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği gereği güncellenmesi gerekmektedir." },
        { no: 15, madde: "Yıllı Eğitim planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği gereği güncellenmesi gerekmektedir." }
      ]},
      { ad: "Risk Değerlendirmesi", maddeler: [
        { no: 16, madde: "Risk değerlendirmesi", isaret: "YOK", not: "çalışan temsilcisi imza eksik sadece baş çalışan temsilcisi var doktor imzası yok bilgi sahibi çalışan imzası yok" },
        { no: 17, madde: "Ekip görevlendirmeleri", isaret: "VAR" },
        { no: 18, madde: "Risk değerlendirmesi yenileme kayıtları", isaret: "VAR" },
        { no: 19, madde: "Tespit edilen riskler", isaret: "VAR" },
        { no: 20, madde: "Alınacak önlemler", isaret: "VAR" },
        { no: 21, madde: "Düzeltici / önleyici faaliyetler", isaret: "VAR" },
        { no: 22, madde: "Revizyon kayıtları", isaret: "VAR" }
      ]},
      { ad: "Acil Durum", maddeler: [
        { no: 23, madde: "Acil durum planı", isaret: "YOK", not: "doktor imzası yok" },
        { no: 24, madde: "Acil durum ekipleri", isaret: "GUNCELLENECEK", not: "Tarihi geçmiş olmasından dolayı ve iş veren değişikliğinden dolayı" },
        { no: 25, madde: "Görevlendirme listeleri", isaret: "GUNCELLENECEK", not: "Kişiler kontrol edilmeli sayı yetersiz ise yada personel işten ayrılmış ise bunlar güncellenmeli" },
        { no: 26, madde: "Acil durum krokileri", isaret: "YOK" },
        { no: 27, madde: "Kaçış yolları ve toplanma alanı", isaret: "YOK" },
        { no: 28, madde: "Acil durum iletişim bilgileri", isaret: "VAR" },
        { no: 29, madde: "Tatbikat kayıtları", isaret: "YOK", not: "yıl içerisinde tatbikat yapılmamıştır." },
        { no: 30, madde: "Tatbikat sonuçları ve değerlendirmeler", isaret: "YOK", not: "yıl içerisinde tatbikat yapılmamıştır." }
      ]},
      { ad: "Eğitim Dosyası", maddeler: [
        { no: 31, madde: "İSG eğitim planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği gereği güncellenmesi gerekmektedir." },
        { no: 32, madde: "Eğitim katılım tutanakları", isaret: "GUNCELLENECEK", not: "eğitim devam ediyor" },
        { no: 33, madde: "Eğitim içerikleri", isaret: "GUNCELLENECEK", not: "eğitim devam ediyor" },
        { no: 34, madde: "Eğitim değerlendirme kayıtları", isaret: "GUNCELLENECEK", not: "eğitim devam ediyor" },
        { no: 35, madde: "Eğitim sertifikaları / belgeleri", isaret: "GUNCELLENECEK", not: "eğitim devam ediyor" },
        { no: 36, madde: "İşe başlama eğitimleri", isaret: "KD" },
        { no: 37, madde: "İlave eğitimler (gerekirse)", isaret: "VAR", not: "eğitim devam ediyor" },
        { no: 38, madde: "Özel eğitim gerektiren çalışanlara ait kayıtlar", isaret: "KD" }
      ]},
      { ad: "Sağlık Gözetimi", maddeler: [
        { no: 39, madde: "İşe giriş sağlık raporları", isaret: "GUNCELLENECEK", not: "2026 yılında girecek" },
        { no: 40, madde: "Periyodik muayene kayıtları", isaret: "GUNCELLENECEK", not: "2026 yılında girecek" },
        { no: 41, madde: "Sağlık gözetimine ilişkin kayıtlar", isaret: "GUNCELLENECEK", not: "2026 yılında girecek" },
        { no: 42, madde: "Yapılan işe / riske göre gerekli tetkik sonuçları", isaret: "GUNCELLENECEK", not: "2026 yılında girecek" },
        { no: 43, madde: "Özel politika gerektiren çalışanlara ilişkin kayıtlar", isaret: "YOK" }
      ]},
      { ad: "Olay Kayıtları", maddeler: [
        { no: 44, madde: "İş kazası kayıtları", isaret: "YOK", not: "evrak yok" },
        { no: 45, madde: "İş kazası bildirimleri", isaret: "VAR" },
        { no: 46, madde: "Kaza araştırma ve inceleme raporları", isaret: "YOK", not: "evrak yok" },
        { no: 47, madde: "Kök neden analizleri", isaret: "YOK", not: "evrak yok" },
        { no: 48, madde: "Ramak kala kayıtları", isaret: "YOK", not: "evrak yok" },
        { no: 49, madde: "Alınan düzeltici / önleyici faaliyetler", isaret: "YOK", not: "evrak yok" },
        { no: 50, madde: "Takip kayıtları", isaret: "YOK", not: "evrak yok" }
      ]},
      { ad: "Periyodik Kontroller", maddeler: [
        { no: 51, madde: "Kaldırma ve iletme araçları periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 52, madde: "Basınçlı kaplar periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 53, madde: "Elektrik tesisatı periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 54, madde: "Topraklama ölçüm / kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 55, madde: "Paratoner kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 56, madde: "Yangın tesisatı ve ekipmanları kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 57, madde: "Havalandırma tesisatı kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 58, madde: "Diğer iş ekipmanlarının periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" }
      ]},
      { ad: "Ölçüm ve Analizler", maddeler: [
        { no: 59, madde: "Gürültü ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 60, madde: "Toz ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 61, madde: "Termal konfor ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 62, madde: "Aydınlatma ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 63, madde: "Titreşim ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 64, madde: "Kimyasal maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 65, madde: "Kişisel maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 66, madde: "Gerekli diğer ölçüm ve analizler", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" }
      ]},
      { ad: "KKD Dosyası", maddeler: [
        { no: 67, madde: "KKD ihtiyaçlarının belirlenmesi", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 68, madde: "KKD teslim / kullanım kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 69, madde: "KKD kullanım eğitimleri", isaret: "VAR", not: "Temel İSG eğitiminde var" },
        { no: 70, madde: "KKD uygunluk belgeleri", isaret: "YOK", not: "İhale sonrası ilgili daire bşk.larına alınan KKDlerin uygun beyanaları dosyaya koyulmalı" },
        { no: 71, madde: "Kullanım ve bakım talimatları", isaret: "YOK", not: "KKDlerin içlerinden bunlarla alakalı birer adet örnek alınmalı" },
        { no: 72, madde: "KKD zimmet kayıtları", isaret: "YOK", not: "Dağıtımdan sonra KKD lerin zimmetlenmesi için ilgili daire bşk.larına yazı yazılmalı" }
      ]},
      { ad: "Talimatlar ve Prosedürler", maddeler: [
        { no: 73, madde: "İş güvenliği talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 74, madde: "Makine kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 75, madde: "İşe özel çalışma talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 76, madde: "Acil durum talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 77, madde: "Kimyasal kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 78, madde: "Yüksekte çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 79, madde: "Kapalı alan çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 80, madde: "Sıcak çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" }
      ]},
      { ad: "Kimyasal Maddeler", maddeler: [
        { no: 81, madde: "Güncel güvenlik bilgi formları (SDS/GBF)", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 82, madde: "Kimyasal envanteri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 83, madde: "Etiketleme kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 84, madde: "Kimyasal depolama kuralları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 85, madde: "Maruziyet değerlendirmeleri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 86, madde: "Kimyasal risklere yönelik eğitim ve talimatlar", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" }
      ]},
      { ad: "İSG Kurulu ve Toplantılar", maddeler: [
        { no: 87, madde: "Kurul oluşturma belgeleri", isaret: "YOK", not: "İSG uzmanı değişikliği ve doktor değişikliği nediyle değişmeli imza yok" },
        { no: 88, madde: "Kurul üyeleri ve görevlendirmeler", isaret: "YOK", not: "İSG uzmanı değişikliği ve doktor değişikliği nediyle değişmeli imza yok" },
        { no: 89, madde: "Kurul toplantı tutanakları", isaret: "YOK", not: "Davet yazısı yok doktor imzası yok" },
        { no: 90, madde: "Alınan kararlar", isaret: "YOK", not: "Davet yazısı yok doktor imzası yok" },
        { no: 91, madde: "Kararların takip kayıtları", isaret: "YOK", not: "Davet yazısı yok doktor imzası yok" },
        { no: 92, madde: "Yıllık çalışma planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği gereği güncellenmesi gerekmektedir." },
        { no: 93, madde: "Yıllık değerlendirme raporu", isaret: "VAR" }
      ]},
      { ad: "Saha Kontrolleri", maddeler: [
        { no: 94, madde: "Saha gözlem formları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 95, madde: "Tespit ve öneriler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 96, madde: "Uygunsuzluk kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 97, madde: "Fotoğraflı tespitler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 98, madde: "Düzeltici faaliyetler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 99, madde: "Faaliyetlerin kapanış / takip kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 100, madde: "Onaylı defter kayıtları", isaret: "YOK", not: "doktor imzası yok nüshalar yok" }
      ]},
      { ad: "Son Kontrol", maddeler: [
        { no: 101, madde: "Risk değerlendirmesi güncel mi?", isaret: "GUNCELLENECEK", not: "Güncellenmesi önerilir." },
        { no: 102, madde: "Acil durum planı güncel mi?", isaret: "YOK", not: "güncel değil" },
        { no: 103, madde: "Eğitim kayıtları tamam mı?", isaret: "YOK", not: "tarihi geçmiş" },
        { no: 104, madde: "Sağlık gözetimleri takip ediliyor mu?", isaret: "VAR" },
        { no: 105, madde: "Periyodik kontrollerin süresi geçmemiş mi?", isaret: "YOK", not: "Herhangi bir periyodik kontrol gerektiren ekipman listesi bulunmamaktadır." },
        { no: 106, madde: "Kaza ve ramak kala kayıtları tutuluyor mu?", isaret: "KD", not: "işyerinde böyle bi uygulama yok" },
        { no: 107, madde: "Saha tespitleri kapatılıyor mu?", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." }
      ]}
    ]
  },
  {
    kod: "AYBEL", ad: "Aybel — Dosya Kontrol Listesi", kaynak: "İSG Dosya Kontrol Checklisti (Excel: Aybel.xlsx) · Sayfadaki birim: AYBEL",
    duzenleyen: "Kontrolü yapan: A Sınıfı İş Güvenliği Uzmanı Oğuzhan ÖNAY · İSG uzmanı: A sınıfı İş Güvenliği Uzmanı Volkan DENİZ", sicilNo: "",
    isyeriAdi: "Aybel", asilIsveren: "",
    kontrolTarihi: "2026-09-18", sonrakiKontrol: "",
    eslesme: ["Aybel"],
    genelDegerlendirme: "Kontrol özeti (107 madde): 41 var/uygun, 33 eksik, 14 güncellenecek, 19 uygulanamaz.",
    bolumler: [
      { ad: "İşyeri ve İSG Organizasyonu", maddeler: [
        { no: 1, madde: "İşyerine ait temel bilgiler", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 2, madde: "SGK işyeri sicil bilgileri", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 3, madde: "NACE kodu / faaliyet bilgisi", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 4, madde: "Tehlike sınıfı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 5, madde: "Çalışan sayısı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 6, madde: "İSG profesyonellerinin görevlendirme kayıtları", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 7, madde: "İSG-KATİP sözleşmeleri / görevlendirmeleri", isaret: "VAR" }
      ]},
      { ad: "Çalışan temsilcisi", maddeler: [
        { no: 8, madde: "Çalışan Temsilcisi Atama yazısı", isaret: "VAR" },
        { no: 9, madde: "Çalışan temsilcisi Eğitim yazısı", isaret: "VAR" },
        { no: 10, madde: "Çalışan temsilcisi talimatları", isaret: "VAR" },
        { no: 11, madde: "Çalışan temsilcisi test", isaret: "VAR" },
        { no: 12, madde: "Baş Çalışan Temsilcisi yazısı", isaret: "VAR" }
      ]},
      { ad: "Yıllık planlar", maddeler: [
        { no: 13, madde: "Yıllık değerlendirme raporu", isaret: "VAR" },
        { no: 14, madde: "Yıllık çalışma planı", isaret: "GUNCELLENECEK", not: "yönetmelik değişikliği olduğundan dolayı" },
        { no: 15, madde: "Yıllı Eğitim planı", isaret: "GUNCELLENECEK", not: "yönetmelik değişikliği olduğundan dolayı" }
      ]},
      { ad: "Risk Değerlendirmesi", maddeler: [
        { no: 16, madde: "Risk değerlendirmesi", isaret: "VAR" },
        { no: 17, madde: "Ekip görevlendirmeleri", isaret: "VAR" },
        { no: 18, madde: "Risk değerlendirmesi yenileme kayıtları", isaret: "VAR" },
        { no: 19, madde: "Tespit edilen riskler", isaret: "VAR" },
        { no: 20, madde: "Alınacak önlemler", isaret: "VAR" },
        { no: 21, madde: "Düzeltici / önleyici faaliyetler", isaret: "VAR" },
        { no: 22, madde: "Revizyon kayıtları", isaret: "VAR" }
      ]},
      { ad: "Acil Durum", maddeler: [
        { no: 23, madde: "Acil durum planı", isaret: "VAR" },
        { no: 24, madde: "Acil durum ekipleri", isaret: "VAR", not: "personeller kontrol edilmelidir." },
        { no: 25, madde: "Görevlendirme listeleri", isaret: "VAR", not: "personeller kontrol edilmelidir." },
        { no: 26, madde: "Acil durum krokileri", isaret: "GUNCELLENECEK", not: "Planlar eski güncellenmesi gerekiyor" },
        { no: 27, madde: "Kaçış yolları ve toplanma alanı", isaret: "GUNCELLENECEK", not: "Planlar eski güncellenmesi gerekiyor" },
        { no: 28, madde: "Acil durum iletişim bilgileri", isaret: "VAR", not: "personeller kontrol edilmelidir." },
        { no: 29, madde: "Tatbikat kayıtları", isaret: "YOK" },
        { no: 30, madde: "Tatbikat sonuçları ve değerlendirmeler", isaret: "YOK" }
      ]},
      { ad: "Eğitim Dosyası", maddeler: [
        { no: 31, madde: "İSG eğitim planı", isaret: "GUNCELLENECEK", not: "yönetmelik değişikliği olduğundan dolayı" },
        { no: 32, madde: "Eğitim katılım tutanakları", isaret: "VAR" },
        { no: 33, madde: "Eğitim içerikleri", isaret: "VAR" },
        { no: 34, madde: "Eğitim değerlendirme kayıtları", isaret: "VAR" },
        { no: 35, madde: "Eğitim sertifikaları / belgeleri", isaret: "KD" },
        { no: 36, madde: "İşe başlama eğitimleri", isaret: "KD" },
        { no: 37, madde: "İlave eğitimler (gerekirse)", isaret: "KD" },
        { no: 38, madde: "Özel eğitim gerektiren çalışanlara ait kayıtlar", isaret: "KD" }
      ]},
      { ad: "Sağlık Gözetimi", maddeler: [
        { no: 39, madde: "İşe giriş sağlık raporları", isaret: "VAR" },
        { no: 40, madde: "Periyodik muayene kayıtları", isaret: "VAR" },
        { no: 41, madde: "Sağlık gözetimine ilişkin kayıtlar", isaret: "VAR" },
        { no: 42, madde: "Yapılan işe / riske göre gerekli tetkik sonuçları", isaret: "VAR" },
        { no: 43, madde: "Özel politika gerektiren çalışanlara ilişkin kayıtlar", isaret: "YOK" }
      ]},
      { ad: "Olay Kayıtları", maddeler: [
        { no: 44, madde: "İş kazası kayıtları", isaret: "VAR" },
        { no: 45, madde: "İş kazası bildirimleri", isaret: "VAR" },
        { no: 46, madde: "Kaza araştırma ve inceleme raporları", isaret: "YOK" },
        { no: 47, madde: "Kök neden analizleri", isaret: "YOK" },
        { no: 48, madde: "Ramak kala kayıtları", isaret: "VAR" },
        { no: 49, madde: "Alınan düzeltici / önleyici faaliyetler", isaret: "YOK" },
        { no: 50, madde: "Takip kayıtları", isaret: "KD", not: "Kaza sonrası personellere İLGİLİ raporlar yapılmalı ve kayıt altına alınmalıdır." }
      ]},
      { ad: "Periyodik Kontroller", maddeler: [
        { no: 51, madde: "Kaldırma ve iletme araçları periyodik kontrol raporları", isaret: "YOK", not: "İlgili birimde yapılacak (varsa) periyodik muyene gerektiren ekipmanlar belirlenip ilgili birime yazı yazılmalıdır." },
        { no: 52, madde: "Basınçlı kaplar periyodik kontrol raporları", isaret: "YOK", not: "İlgili birimde yapılacak (varsa) periyodik muyene gerektiren ekipmanlar belirlenip ilgili birime yazı yazılmalıdır." },
        { no: 53, madde: "Elektrik tesisatı periyodik kontrol raporları", isaret: "YOK", not: "İlgili birimde yapılacak (varsa) periyodik muyene gerektiren ekipmanlar belirlenip ilgili birime yazı yazılmalıdır." },
        { no: 54, madde: "Topraklama ölçüm / kontrol raporları", isaret: "YOK", not: "İlgili birimde yapılacak (varsa) periyodik muyene gerektiren ekipmanlar belirlenip ilgili birime yazı yazılmalıdır." },
        { no: 55, madde: "Paratoner kontrol raporları", isaret: "YOK", not: "İlgili birimde yapılacak (varsa) periyodik muyene gerektiren ekipmanlar belirlenip ilgili birime yazı yazılmalıdır." },
        { no: 56, madde: "Yangın tesisatı ve ekipmanları kontrol raporları", isaret: "YOK", not: "İlgili birimde yapılacak (varsa) periyodik muyene gerektiren ekipmanlar belirlenip ilgili birime yazı yazılmalıdır." },
        { no: 57, madde: "Havalandırma tesisatı kontrol raporları", isaret: "YOK", not: "İlgili birimde yapılacak (varsa) periyodik muyene gerektiren ekipmanlar belirlenip ilgili birime yazı yazılmalıdır." },
        { no: 58, madde: "Diğer iş ekipmanlarının periyodik kontrol raporları", isaret: "YOK", not: "İlgili birimde yapılacak (varsa) periyodik muyene gerektiren ekipmanlar belirlenip ilgili birime yazı yazılmalıdır." }
      ]},
      { ad: "Ölçüm ve Analizler", maddeler: [
        { no: 59, madde: "Gürültü ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 60, madde: "Toz ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 61, madde: "Termal konfor ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 62, madde: "Aydınlatma ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 63, madde: "Titreşim ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 64, madde: "Kimyasal maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 65, madde: "Kişisel maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 66, madde: "Gerekli diğer ölçüm ve analizler", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" }
      ]},
      { ad: "KKD Dosyası", maddeler: [
        { no: 67, madde: "KKD ihtiyaçlarının belirlenmesi", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 68, madde: "KKD teslim / kullanım kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 69, madde: "KKD kullanım eğitimleri", isaret: "VAR", not: "Temel İSG eğitiminde var" },
        { no: 70, madde: "KKD uygunluk belgeleri", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 71, madde: "Kullanım ve bakım talimatları", isaret: "YOK", not: "KKDlerin içlerinden bunlarla alakalı birer adet örnek alınmalı" },
        { no: 72, madde: "KKD zimmet kayıtları", isaret: "YOK", not: "Dağıtımdan sonra KKD lerin zimmetlenmesi için ilgili daire bşk.larına yazı yazılmalı" }
      ]},
      { ad: "Talimatlar ve Prosedürler", maddeler: [
        { no: 73, madde: "İş güvenliği talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 74, madde: "Makine kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 75, madde: "İşe özel çalışma talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 76, madde: "Acil durum talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 77, madde: "Kimyasal kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 78, madde: "Yüksekte çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 79, madde: "Kapalı alan çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 80, madde: "Sıcak çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" }
      ]},
      { ad: "Kimyasal Maddeler", maddeler: [
        { no: 81, madde: "Güncel güvenlik bilgi formları (SDS/GBF)", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 82, madde: "Kimyasal envanteri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 83, madde: "Etiketleme kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 84, madde: "Kimyasal depolama kuralları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 85, madde: "Maruziyet değerlendirmeleri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 86, madde: "Kimyasal risklere yönelik eğitim ve talimatlar", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" }
      ]},
      { ad: "İSG Kurulu ve Toplantılar", maddeler: [
        { no: 87, madde: "Kurul oluşturma belgeleri", isaret: "VAR" },
        { no: 88, madde: "Kurul üyeleri ve görevlendirmeler", isaret: "VAR" },
        { no: 89, madde: "Kurul toplantı tutanakları", isaret: "VAR" },
        { no: 90, madde: "Alınan kararlar", isaret: "VAR" },
        { no: 91, madde: "Kararların takip kayıtları", isaret: "VAR" },
        { no: 92, madde: "Yıllık çalışma planı", isaret: "VAR" },
        { no: 93, madde: "Yıllık değerlendirme raporu", isaret: "VAR" }
      ]},
      { ad: "Saha Kontrolleri", maddeler: [
        { no: 94, madde: "Saha gözlem formları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 95, madde: "Tespit ve öneriler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 96, madde: "Uygunsuzluk kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 97, madde: "Fotoğraflı tespitler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 98, madde: "Düzeltici faaliyetler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 99, madde: "Faaliyetlerin kapanış / takip kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 100, madde: "Onaylı defter kayıtları", isaret: "VAR" }
      ]},
      { ad: "Son Kontrol", maddeler: [
        { no: 101, madde: "Risk değerlendirmesi güncel mi?", isaret: "VAR" },
        { no: 102, madde: "Acil durum planı güncel mi?", isaret: "GUNCELLENECEK", not: "işveren değişikliği ve firma değişikliği" },
        { no: 103, madde: "Eğitim kayıtları tamam mı?", isaret: "VAR" },
        { no: 104, madde: "Sağlık gözetimleri takip ediliyor mu?", isaret: "VAR" },
        { no: 105, madde: "Periyodik kontrollerin süresi geçmemiş mi?", isaret: "GUNCELLENECEK" },
        { no: 106, madde: "Kaza ve ramak kala kayıtları tutuluyor mu?", isaret: "VAR" },
        { no: 107, madde: "Saha tespitleri kapatılıyor mu?", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." }
      ]}
    ]
  },
  {
    kod: "AYULAS", ad: "Ayulaş — Dosya Kontrol Listesi", kaynak: "İSG Dosya Kontrol Checklisti (Excel: ayulaş.xlsx) · Sayfadaki birim: AYULAŞ",
    duzenleyen: "Kontrolü yapan: A Sınıfı İş Güvenliği Uzmanı Oğuzhan ÖNAY · İSG uzmanı: B sınıfı İş Güvenliği Uzmanı Mustafa ADIGÜZEL", sicilNo: "",
    isyeriAdi: "Ayulaş", asilIsveren: "",
    kontrolTarihi: "2026-09-17", sonrakiKontrol: "",
    eslesme: ["Ayulaş"],
    genelDegerlendirme: "Kontrol özeti (107 madde): 42 var/uygun, 26 eksik, 20 güncellenecek, 19 uygulanamaz.",
    bolumler: [
      { ad: "İşyeri ve İSG Organizasyonu", maddeler: [
        { no: 1, madde: "İşyerine ait temel bilgiler", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 2, madde: "SGK işyeri sicil bilgileri", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 3, madde: "NACE kodu / faaliyet bilgisi", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 4, madde: "Tehlike sınıfı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 5, madde: "Çalışan sayısı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 6, madde: "İSG profesyonellerinin görevlendirme kayıtları", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 7, madde: "İSG-KATİP sözleşmeleri / görevlendirmeleri", isaret: "VAR" }
      ]},
      { ad: "Çalışan temsilcisi", maddeler: [
        { no: 8, madde: "Çalışan Temsilcisi Atama yazısı", isaret: "VAR" },
        { no: 9, madde: "Çalışan temsilcisi Eğitim yazısı", isaret: "VAR" },
        { no: 10, madde: "Çalışan temsilcisi talimatları", isaret: "VAR" },
        { no: 11, madde: "Çalışan temsilcisi test", isaret: "VAR" },
        { no: 12, madde: "Baş Çalışan Temsilcisi yazısı", isaret: "VAR" }
      ]},
      { ad: "Yıllık planlar", maddeler: [
        { no: 13, madde: "Yıllık değerlendirme raporu", isaret: "YOK", not: "2025 Yılı yıllık değerlendirme raporu yok" },
        { no: 14, madde: "Yıllık çalışma planı", isaret: "VAR" },
        { no: 15, madde: "Yıllı Eğitim planı", isaret: "VAR" }
      ]},
      { ad: "Risk Değerlendirmesi", maddeler: [
        { no: 16, madde: "Risk değerlendirmesi", isaret: "VAR" },
        { no: 17, madde: "Ekip görevlendirmeleri", isaret: "VAR" },
        { no: 18, madde: "Risk değerlendirmesi yenileme kayıtları", isaret: "VAR" },
        { no: 19, madde: "Tespit edilen riskler", isaret: "VAR" },
        { no: 20, madde: "Alınacak önlemler", isaret: "VAR" },
        { no: 21, madde: "Düzeltici / önleyici faaliyetler", isaret: "VAR" },
        { no: 22, madde: "Revizyon kayıtları", isaret: "VAR" }
      ]},
      { ad: "Acil Durum", maddeler: [
        { no: 23, madde: "Acil durum planı", isaret: "GUNCELLENECEK", not: "İşveren vekili değişikliği ve kurum unvan değişikliğinden dolayı" },
        { no: 24, madde: "Acil durum ekipleri", isaret: "GUNCELLENECEK", not: "İşveren vekili değişikliği ve kurum unvan değişikliğinden dolayı" },
        { no: 25, madde: "Görevlendirme listeleri", isaret: "GUNCELLENECEK", not: "İşveren vekili değişikliği ve kurum unvan değişikliğinden dolayı sorumluluk alanları yazmıyor" },
        { no: 26, madde: "Acil durum krokileri", isaret: "GUNCELLENECEK", not: "Planlar eski güncellenmesi gerekiyor" },
        { no: 27, madde: "Kaçış yolları ve toplanma alanı", isaret: "GUNCELLENECEK", not: "Planlar eski güncellenmesi gerekiyor" },
        { no: 28, madde: "Acil durum iletişim bilgileri", isaret: "GUNCELLENECEK", not: "İşveren vekili değişikliği ve kurum unvan değişikliğinden dolayı" },
        { no: 29, madde: "Tatbikat kayıtları", isaret: "YOK", not: "23.09.2025 de tatbikat yapılmış" },
        { no: 30, madde: "Tatbikat sonuçları ve değerlendirmeler", isaret: "GUNCELLENECEK", not: "Mart 2025 tarihinde yapılmış en son" }
      ]},
      { ad: "Eğitim Dosyası", maddeler: [
        { no: 31, madde: "İSG eğitim planı", isaret: "VAR" },
        { no: 32, madde: "Eğitim katılım tutanakları", isaret: "VAR" },
        { no: 33, madde: "Eğitim içerikleri", isaret: "VAR" },
        { no: 34, madde: "Eğitim değerlendirme kayıtları", isaret: "VAR" },
        { no: 35, madde: "Eğitim sertifikaları / belgeleri", isaret: "KD" },
        { no: 36, madde: "İşe başlama eğitimleri", isaret: "KD" },
        { no: 37, madde: "İlave eğitimler (gerekirse)", isaret: "KD" },
        { no: 38, madde: "Özel eğitim gerektiren çalışanlara ait kayıtlar", isaret: "KD" }
      ]},
      { ad: "Sağlık Gözetimi", maddeler: [
        { no: 39, madde: "İşe giriş sağlık raporları", isaret: "VAR" },
        { no: 40, madde: "Periyodik muayene kayıtları", isaret: "VAR" },
        { no: 41, madde: "Sağlık gözetimine ilişkin kayıtlar", isaret: "VAR" },
        { no: 42, madde: "Yapılan işe / riske göre gerekli tetkik sonuçları", isaret: "VAR" },
        { no: 43, madde: "Özel politika gerektiren çalışanlara ilişkin kayıtlar", isaret: "YOK" }
      ]},
      { ad: "Olay Kayıtları", maddeler: [
        { no: 44, madde: "İş kazası kayıtları", isaret: "VAR" },
        { no: 45, madde: "İş kazası bildirimleri", isaret: "VAR" },
        { no: 46, madde: "Kaza araştırma ve inceleme raporları", isaret: "VAR" },
        { no: 47, madde: "Kök neden analizleri", isaret: "VAR" },
        { no: 48, madde: "Ramak kala kayıtları", isaret: "VAR" },
        { no: 49, madde: "Alınan düzeltici / önleyici faaliyetler", isaret: "VAR" },
        { no: 50, madde: "Takip kayıtları", isaret: "KD", not: "Kaza sonrası personellere İLGİLİ raporlar yapılmalı ve kayıt altına alınmalıdır." }
      ]},
      { ad: "Periyodik Kontroller", maddeler: [
        { no: 51, madde: "Kaldırma ve iletme araçları periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 52, madde: "Basınçlı kaplar periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 53, madde: "Elektrik tesisatı periyodik kontrol raporları", isaret: "GUNCELLENECEK", not: "nazilli otopark ve kuşadası otopark var diğerleri yok" },
        { no: 54, madde: "Topraklama ölçüm / kontrol raporları", isaret: "GUNCELLENECEK", not: "nazilli otopark ve kuşadası otopark var diğerleri yok" },
        { no: 55, madde: "Paratoner kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 56, madde: "Yangın tesisatı ve ekipmanları kontrol raporları", isaret: "YOK", not: "nazilli otopark ve kuşadası otopark var diğerleri yok" },
        { no: 57, madde: "Havalandırma tesisatı kontrol raporları", isaret: "GUNCELLENECEK", not: "nazilli otopark ve kuşadası otopark var diğerleri yok" },
        { no: 58, madde: "Diğer iş ekipmanlarının periyodik kontrol raporları", isaret: "GUNCELLENECEK", not: "nazilli otopark ve kuşadası otopark var diğerleri yok" }
      ]},
      { ad: "Ölçüm ve Analizler", maddeler: [
        { no: 59, madde: "Gürültü ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 60, madde: "Toz ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 61, madde: "Termal konfor ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 62, madde: "Aydınlatma ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 63, madde: "Titreşim ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 64, madde: "Kimyasal maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 65, madde: "Kişisel maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 66, madde: "Gerekli diğer ölçüm ve analizler", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" }
      ]},
      { ad: "KKD Dosyası", maddeler: [
        { no: 67, madde: "KKD ihtiyaçlarının belirlenmesi", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 68, madde: "KKD teslim / kullanım kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 69, madde: "KKD kullanım eğitimleri", isaret: "VAR", not: "Temel İSG eğitiminde var" },
        { no: 70, madde: "KKD uygunluk belgeleri", isaret: "YOK", not: "İhale sonrası ilgili daire bşk.larına alınan KKDlerin uygun beyanaları dosyaya koyulmalı" },
        { no: 71, madde: "Kullanım ve bakım talimatları", isaret: "YOK", not: "KKDlerin içlerinden bunlarla alakalı birer adet örnek alınmalı" },
        { no: 72, madde: "KKD zimmet kayıtları", isaret: "YOK", not: "Dağıtımdan sonra KKD lerin zimmetlenmesi için ilgili daire bşk.larına yazı yazılmalı" }
      ]},
      { ad: "Talimatlar ve Prosedürler", maddeler: [
        { no: 73, madde: "İş güvenliği talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 74, madde: "Makine kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 75, madde: "İşe özel çalışma talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 76, madde: "Acil durum talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 77, madde: "Kimyasal kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 78, madde: "Yüksekte çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 79, madde: "Kapalı alan çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 80, madde: "Sıcak çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" }
      ]},
      { ad: "Kimyasal Maddeler", maddeler: [
        { no: 81, madde: "Güncel güvenlik bilgi formları (SDS/GBF)", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 82, madde: "Kimyasal envanteri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 83, madde: "Etiketleme kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 84, madde: "Kimyasal depolama kuralları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 85, madde: "Maruziyet değerlendirmeleri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 86, madde: "Kimyasal risklere yönelik eğitim ve talimatlar", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" }
      ]},
      { ad: "İSG Kurulu ve Toplantılar", maddeler: [
        { no: 87, madde: "Kurul oluşturma belgeleri", isaret: "VAR" },
        { no: 88, madde: "Kurul üyeleri ve görevlendirmeler", isaret: "VAR" },
        { no: 89, madde: "Kurul toplantı tutanakları", isaret: "VAR" },
        { no: 90, madde: "Alınan kararlar", isaret: "VAR" },
        { no: 91, madde: "Kararların takip kayıtları", isaret: "VAR" },
        { no: 92, madde: "Yıllık çalışma planı", isaret: "VAR" },
        { no: 93, madde: "Yıllık değerlendirme raporu", isaret: "VAR" }
      ]},
      { ad: "Saha Kontrolleri", maddeler: [
        { no: 94, madde: "Saha gözlem formları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 95, madde: "Tespit ve öneriler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 96, madde: "Uygunsuzluk kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 97, madde: "Fotoğraflı tespitler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 98, madde: "Düzeltici faaliyetler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 99, madde: "Faaliyetlerin kapanış / takip kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 100, madde: "Onaylı defter kayıtları", isaret: "VAR" }
      ]},
      { ad: "Son Kontrol", maddeler: [
        { no: 101, madde: "Risk değerlendirmesi güncel mi?", isaret: "VAR" },
        { no: 102, madde: "Acil durum planı güncel mi?", isaret: "GUNCELLENECEK", not: "işveren değişikliği ve firma değişikliği" },
        { no: 103, madde: "Eğitim kayıtları tamam mı?", isaret: "VAR" },
        { no: 104, madde: "Sağlık gözetimleri takip ediliyor mu?", isaret: "VAR" },
        { no: 105, madde: "Periyodik kontrollerin süresi geçmemiş mi?", isaret: "GUNCELLENECEK" },
        { no: 106, madde: "Kaza ve ramak kala kayıtları tutuluyor mu?", isaret: "VAR" },
        { no: 107, madde: "Saha tespitleri kapatılıyor mu?", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." }
      ]}
    ]
  },
  {
    kod: "CEVRE-KORUMA-KADROLU", ad: "Çevre Koruma ve Kontrol Dairesi Kadrolu — Dosya Kontrol Listesi", kaynak: "İSG Dosya Kontrol Checklisti (Excel: çevre koruma ve kontrol dairesi kadrolu.xlsx) · Sayfadaki birim: ÇEVRE KORUMA VE KONTROL DAİRESİ BŞK. KADROLU",
    duzenleyen: "Kontrolü yapan: A Sınıfı İş Güvenliği Uzmanı Oğuzhan ÖNAY · İSG uzmanı: B sınıfı İş Güvenliği Uzmanı Mustafa ADIGÜZEL", sicilNo: "",
    isyeriAdi: "Çevre Koruma ve Kontrol Dairesi Kadrolu", asilIsveren: "",
    kontrolTarihi: "2026-09-17", sonrakiKontrol: "",
    eslesme: ["Çevre Koruma ve Kontrol Dairesi Kadrolu", "Çevre Koruma Kadrolu"],
    genelDegerlendirme: "Kontrol özeti (107 madde): 9 var/uygun, 39 eksik, 30 güncellenecek, 29 uygulanamaz.",
    bolumler: [
      { ad: "İşyeri ve İSG Organizasyonu", maddeler: [
        { no: 1, madde: "İşyerine ait temel bilgiler", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 2, madde: "SGK işyeri sicil bilgileri", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 3, madde: "NACE kodu / faaliyet bilgisi", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 4, madde: "Tehlike sınıfı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 5, madde: "Çalışan sayısı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 6, madde: "İSG profesyonellerinin görevlendirme kayıtları", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 7, madde: "İSG-KATİP sözleşmeleri / görevlendirmeleri", isaret: "YOK", not: "İşyeri hekiminin sözleşmesi" }
      ]},
      { ad: "Çalışan temsilcisi", maddeler: [
        { no: 8, madde: "Çalışan Temsilcisi Atama yazısı", isaret: "GUNCELLENECEK", not: "İşveren değişikliğinden dolayı güncellenmesi gerekmektedir." },
        { no: 9, madde: "Çalışan temsilcisi Eğitim yazısı", isaret: "GUNCELLENECEK", not: "İşveren değişikliğinden dolayı güncellenmesi gerekmektedir." },
        { no: 10, madde: "Çalışan temsilcisi talimatları", isaret: "GUNCELLENECEK", not: "İşveren değişikliğinden dolayı güncellenmesi gerekmektedir." },
        { no: 11, madde: "Çalışan temsilcisi test", isaret: "GUNCELLENECEK", not: "İşveren değişikliğinden dolayı güncellenmesi gerekmektedir." },
        { no: 12, madde: "Baş Çalışan Temsilcisi yazısı", isaret: "GUNCELLENECEK", not: "İşveren değişikliğinden dolayı güncellenmesi gerekmektedir." }
      ]},
      { ad: "Yıllık planlar", maddeler: [
        { no: 13, madde: "Yıllık değerlendirme raporu", isaret: "VAR" },
        { no: 14, madde: "Yıllık çalışma planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği gereği güncellenmesi gerekmektedir." },
        { no: 15, madde: "Yıllı Eğitim planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği gereği güncellenmesi gerekmektedir." }
      ]},
      { ad: "Risk Değerlendirmesi", maddeler: [
        { no: 16, madde: "Risk değerlendirmesi", isaret: "GUNCELLENECEK", not: "işveren değişikliği ve süre yaklaşmış veya geçmiş olmasından dolayı güncellenmelidir." },
        { no: 17, madde: "Ekip görevlendirmeleri", isaret: "GUNCELLENECEK", not: "işveren değişikliği ve süre yaklaşmış veya geçmiş olmasından dolayı güncellenmelidir." },
        { no: 18, madde: "Risk değerlendirmesi yenileme kayıtları", isaret: "GUNCELLENECEK", not: "işveren değişikliği ve süre yaklaşmış veya geçmiş olmasından dolayı güncellenmelidir." },
        { no: 19, madde: "Tespit edilen riskler", isaret: "GUNCELLENECEK", not: "işveren değişikliği ve süre yaklaşmış veya geçmiş olmasından dolayı güncellenmelidir." },
        { no: 20, madde: "Alınacak önlemler", isaret: "GUNCELLENECEK", not: "işveren değişikliği ve süre yaklaşmış veya geçmiş olmasından dolayı güncellenmelidir." },
        { no: 21, madde: "Düzeltici / önleyici faaliyetler", isaret: "GUNCELLENECEK", not: "işveren değişikliği ve süre yaklaşmış veya geçmiş olmasından dolayı güncellenmelidir." },
        { no: 22, madde: "Revizyon kayıtları", isaret: "GUNCELLENECEK", not: "işveren değişikliği ve süre yaklaşmış veya geçmiş olmasından dolayı güncellenmelidir." }
      ]},
      { ad: "Acil Durum", maddeler: [
        { no: 23, madde: "Acil durum planı", isaret: "GUNCELLENECEK", not: "Tarihi geçmiş olmasından dolayı ve iş veren değişikliğinden dolayı" },
        { no: 24, madde: "Acil durum ekipleri", isaret: "GUNCELLENECEK", not: "Tarihi geçmiş olmasından dolayı ve iş veren değişikliğinden dolayı" },
        { no: 25, madde: "Görevlendirme listeleri", isaret: "GUNCELLENECEK", not: "Kişiler kontrol edilmeli sayı yetersiz ise yada personel işten ayrılmış ise bunlar güncellenmeli" },
        { no: 26, madde: "Acil durum krokileri", isaret: "GUNCELLENECEK", not: "Planlar eski güncellenmesi gerekiyor" },
        { no: 27, madde: "Kaçış yolları ve toplanma alanı", isaret: "GUNCELLENECEK", not: "Planlar eski güncellenmesi gerekiyor" },
        { no: 28, madde: "Acil durum iletişim bilgileri", isaret: "GUNCELLENECEK", not: "Tarihi geçmiş olmasından dolayı ve iş veren değişikliğinden dolayı" },
        { no: 29, madde: "Tatbikat kayıtları", isaret: "YOK", not: "yıl içerisinde tatbikat yapılmamıştır." },
        { no: 30, madde: "Tatbikat sonuçları ve değerlendirmeler", isaret: "YOK", not: "yıl içerisinde tatbikat yapılmamıştır." }
      ]},
      { ad: "Eğitim Dosyası", maddeler: [
        { no: 31, madde: "İSG eğitim planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği gereği güncellenmesi gerekmektedir." },
        { no: 32, madde: "Eğitim katılım tutanakları", isaret: "YOK", not: "Eğitim tarihi geçmiş" },
        { no: 33, madde: "Eğitim içerikleri", isaret: "YOK", not: "Eğitim tarihi geçmiş" },
        { no: 34, madde: "Eğitim değerlendirme kayıtları", isaret: "YOK", not: "Eğitim tarihi geçmiş" },
        { no: 35, madde: "Eğitim sertifikaları / belgeleri", isaret: "YOK", not: "Eğitim tarihi geçmiş" },
        { no: 36, madde: "İşe başlama eğitimleri", isaret: "KD" },
        { no: 37, madde: "İlave eğitimler (gerekirse)", isaret: "YOK", not: "Eğitim tarihi geçmiş" },
        { no: 38, madde: "Özel eğitim gerektiren çalışanlara ait kayıtlar", isaret: "KD" }
      ]},
      { ad: "Sağlık Gözetimi", maddeler: [
        { no: 39, madde: "İşe giriş sağlık raporları", isaret: "VAR" },
        { no: 40, madde: "Periyodik muayene kayıtları", isaret: "VAR" },
        { no: 41, madde: "Sağlık gözetimine ilişkin kayıtlar", isaret: "VAR" },
        { no: 42, madde: "Yapılan işe / riske göre gerekli tetkik sonuçları", isaret: "VAR" },
        { no: 43, madde: "Özel politika gerektiren çalışanlara ilişkin kayıtlar", isaret: "YOK" }
      ]},
      { ad: "Olay Kayıtları", maddeler: [
        { no: 44, madde: "İş kazası kayıtları", isaret: "KD", not: "iş kazası yok" },
        { no: 45, madde: "İş kazası bildirimleri", isaret: "KD", not: "iş kazası yok" },
        { no: 46, madde: "Kaza araştırma ve inceleme raporları", isaret: "KD", not: "iş kazası yok" },
        { no: 47, madde: "Kök neden analizleri", isaret: "KD", not: "iş kazası yok" },
        { no: 48, madde: "Ramak kala kayıtları", isaret: "KD", not: "iş kazası yok" },
        { no: 49, madde: "Alınan düzeltici / önleyici faaliyetler", isaret: "KD", not: "iş kazası yok" },
        { no: 50, madde: "Takip kayıtları", isaret: "KD", not: "iş kazası yok" }
      ]},
      { ad: "Periyodik Kontroller", maddeler: [
        { no: 51, madde: "Kaldırma ve iletme araçları periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 52, madde: "Basınçlı kaplar periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 53, madde: "Elektrik tesisatı periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 54, madde: "Topraklama ölçüm / kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 55, madde: "Paratoner kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 56, madde: "Yangın tesisatı ve ekipmanları kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 57, madde: "Havalandırma tesisatı kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 58, madde: "Diğer iş ekipmanlarının periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" }
      ]},
      { ad: "Ölçüm ve Analizler", maddeler: [
        { no: 59, madde: "Gürültü ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 60, madde: "Toz ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 61, madde: "Termal konfor ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 62, madde: "Aydınlatma ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 63, madde: "Titreşim ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 64, madde: "Kimyasal maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 65, madde: "Kişisel maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 66, madde: "Gerekli diğer ölçüm ve analizler", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" }
      ]},
      { ad: "KKD Dosyası", maddeler: [
        { no: 67, madde: "KKD ihtiyaçlarının belirlenmesi", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 68, madde: "KKD teslim / kullanım kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 69, madde: "KKD kullanım eğitimleri", isaret: "VAR", not: "Temel İSG eğitiminde var" },
        { no: 70, madde: "KKD uygunluk belgeleri", isaret: "YOK", not: "İhale sonrası ilgili daire bşk.larına alınan KKDlerin uygun beyanaları dosyaya koyulmalı" },
        { no: 71, madde: "Kullanım ve bakım talimatları", isaret: "YOK", not: "KKDlerin içlerinden bunlarla alakalı birer adet örnek alınmalı" },
        { no: 72, madde: "KKD zimmet kayıtları", isaret: "YOK", not: "Dağıtımdan sonra KKD lerin zimmetlenmesi için ilgili daire bşk.larına yazı yazılmalı" }
      ]},
      { ad: "Talimatlar ve Prosedürler", maddeler: [
        { no: 73, madde: "İş güvenliği talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 74, madde: "Makine kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 75, madde: "İşe özel çalışma talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 76, madde: "Acil durum talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 77, madde: "Kimyasal kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 78, madde: "Yüksekte çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 79, madde: "Kapalı alan çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 80, madde: "Sıcak çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" }
      ]},
      { ad: "Kimyasal Maddeler", maddeler: [
        { no: 81, madde: "Güncel güvenlik bilgi formları (SDS/GBF)", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 82, madde: "Kimyasal envanteri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 83, madde: "Etiketleme kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 84, madde: "Kimyasal depolama kuralları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 85, madde: "Maruziyet değerlendirmeleri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 86, madde: "Kimyasal risklere yönelik eğitim ve talimatlar", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" }
      ]},
      { ad: "İSG Kurulu ve Toplantılar", maddeler: [
        { no: 87, madde: "Kurul oluşturma belgeleri", isaret: "KD" },
        { no: 88, madde: "Kurul üyeleri ve görevlendirmeler", isaret: "KD" },
        { no: 89, madde: "Kurul toplantı tutanakları", isaret: "KD" },
        { no: 90, madde: "Alınan kararlar", isaret: "KD" },
        { no: 91, madde: "Kararların takip kayıtları", isaret: "KD" },
        { no: 92, madde: "Yıllık çalışma planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği gereği güncellenmesi gerekmektedir." },
        { no: 93, madde: "Yıllık değerlendirme raporu", isaret: "VAR" }
      ]},
      { ad: "Saha Kontrolleri", maddeler: [
        { no: 94, madde: "Saha gözlem formları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 95, madde: "Tespit ve öneriler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 96, madde: "Uygunsuzluk kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 97, madde: "Fotoğraflı tespitler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 98, madde: "Düzeltici faaliyetler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 99, madde: "Faaliyetlerin kapanış / takip kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 100, madde: "Onaylı defter kayıtları", isaret: "VAR" }
      ]},
      { ad: "Son Kontrol", maddeler: [
        { no: 101, madde: "Risk değerlendirmesi güncel mi?", isaret: "GUNCELLENECEK", not: "Güncellenmesi önerilir." },
        { no: 102, madde: "Acil durum planı güncel mi?", isaret: "YOK", not: "güncel değil" },
        { no: 103, madde: "Eğitim kayıtları tamam mı?", isaret: "YOK", not: "tarihi geçmiş" },
        { no: 104, madde: "Sağlık gözetimleri takip ediliyor mu?", isaret: "VAR" },
        { no: 105, madde: "Periyodik kontrollerin süresi geçmemiş mi?", isaret: "YOK", not: "Herhangi bir periyodik kontrol gerektiren ekipman listesi bulunmamaktadır." },
        { no: 106, madde: "Kaza ve ramak kala kayıtları tutuluyor mu?", isaret: "KD", not: "işyerinde böyle bi uygulama yok" },
        { no: 107, madde: "Saha tespitleri kapatılıyor mu?", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." }
      ]}
    ]
  },
  {
    kod: "CEVRE-KORUMA", ad: "Çevre Koruma ve Kontrol Dairesi — Dosya Kontrol Listesi", kaynak: "İSG Dosya Kontrol Checklisti (Excel: çevre koruma ve kontrol dairesi.xlsx) · Sayfadaki birim: ÇEVRE KORUMA VE KONTROL DAİRESİ BŞK.",
    duzenleyen: "Kontrolü yapan: A Sınıfı İş Güvenliği Uzmanı Oğuzhan ÖNAY · İSG uzmanı: B sınıfı İş Güvenliği Uzmanı Mustafa ADIGÜZEL", sicilNo: "",
    isyeriAdi: "Çevre Koruma ve Kontrol Dairesi", asilIsveren: "",
    kontrolTarihi: "2026-09-15", sonrakiKontrol: "",
    eslesme: ["Çevre Koruma ve Kontrol Dairesi"],
    genelDegerlendirme: "Kontrol özeti (107 madde): 37 var/uygun, 35 eksik, 16 güncellenecek, 19 uygulanamaz.",
    bolumler: [
      { ad: "İşyeri ve İSG Organizasyonu", maddeler: [
        { no: 1, madde: "İşyerine ait temel bilgiler", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 2, madde: "SGK işyeri sicil bilgileri", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 3, madde: "NACE kodu / faaliyet bilgisi", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 4, madde: "Tehlike sınıfı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 5, madde: "Çalışan sayısı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 6, madde: "İSG profesyonellerinin görevlendirme kayıtları", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 7, madde: "İSG-KATİP sözleşmeleri / görevlendirmeleri", isaret: "VAR" }
      ]},
      { ad: "Çalışan temsilcisi", maddeler: [
        { no: 8, madde: "Çalışan Temsilcisi Atama yazısı", isaret: "GUNCELLENECEK", not: "Sendika Temsilcisi değişimi sonrası güncellenecek" },
        { no: 9, madde: "Çalışan temsilcisi Eğitim yazısı", isaret: "GUNCELLENECEK", not: "Sendika Temsilcisi değişimi sonrası güncellenecek" },
        { no: 10, madde: "Çalışan temsilcisi talimatları", isaret: "GUNCELLENECEK", not: "Sendika Temsilcisi değişimi sonrası güncellenecek" },
        { no: 11, madde: "Çalışan temsilcisi test", isaret: "GUNCELLENECEK", not: "Sendika Temsilcisi değişimi sonrası güncellenecek" },
        { no: 12, madde: "Baş Çalışan Temsilcisi yazısı", isaret: "GUNCELLENECEK", not: "Sendika Temsilcisi değişimi sonrası güncellenecek" }
      ]},
      { ad: "Yıllık planlar", maddeler: [
        { no: 13, madde: "Yıllık değerlendirme raporu", isaret: "VAR" },
        { no: 14, madde: "Yıllık çalışma planı", isaret: "VAR" },
        { no: 15, madde: "Yıllı Eğitim planı", isaret: "VAR" }
      ]},
      { ad: "Risk Değerlendirmesi", maddeler: [
        { no: 16, madde: "Risk değerlendirmesi", isaret: "VAR" },
        { no: 17, madde: "Ekip görevlendirmeleri", isaret: "VAR" },
        { no: 18, madde: "Risk değerlendirmesi yenileme kayıtları", isaret: "VAR" },
        { no: 19, madde: "Tespit edilen riskler", isaret: "VAR" },
        { no: 20, madde: "Alınacak önlemler", isaret: "VAR" },
        { no: 21, madde: "Düzeltici / önleyici faaliyetler", isaret: "VAR" },
        { no: 22, madde: "Revizyon kayıtları", isaret: "VAR" }
      ]},
      { ad: "Acil Durum", maddeler: [
        { no: 23, madde: "Acil durum planı", isaret: "VAR" },
        { no: 24, madde: "Acil durum ekipleri", isaret: "VAR" },
        { no: 25, madde: "Görevlendirme listeleri", isaret: "VAR", not: "Kişiler kontrol edilmeli sayı yetersiz ise yada personel işten ayrılmış ise bunlar güncellenmeli" },
        { no: 26, madde: "Acil durum krokileri", isaret: "GUNCELLENECEK", not: "Planlar eski güncellenmesi gerekiyor" },
        { no: 27, madde: "Kaçış yolları ve toplanma alanı", isaret: "GUNCELLENECEK", not: "Planlar eski güncellenmesi gerekiyor" },
        { no: 28, madde: "Acil durum iletişim bilgileri", isaret: "VAR" },
        { no: 29, madde: "Tatbikat kayıtları", isaret: "VAR", not: "23.09.2025 de tatbikat yapılmış" },
        { no: 30, madde: "Tatbikat sonuçları ve değerlendirmeler", isaret: "VAR", not: "23.09.2025 de tatbikat yapılmış" }
      ]},
      { ad: "Eğitim Dosyası", maddeler: [
        { no: 31, madde: "İSG eğitim planı", isaret: "VAR" },
        { no: 32, madde: "Eğitim katılım tutanakları", isaret: "VAR" },
        { no: 33, madde: "Eğitim içerikleri", isaret: "VAR" },
        { no: 34, madde: "Eğitim değerlendirme kayıtları", isaret: "VAR" },
        { no: 35, madde: "Eğitim sertifikaları / belgeleri", isaret: "KD" },
        { no: 36, madde: "İşe başlama eğitimleri", isaret: "KD" },
        { no: 37, madde: "İlave eğitimler (gerekirse)", isaret: "KD" },
        { no: 38, madde: "Özel eğitim gerektiren çalışanlara ait kayıtlar", isaret: "KD" }
      ]},
      { ad: "Sağlık Gözetimi", maddeler: [
        { no: 39, madde: "İşe giriş sağlık raporları", isaret: "VAR" },
        { no: 40, madde: "Periyodik muayene kayıtları", isaret: "VAR" },
        { no: 41, madde: "Sağlık gözetimine ilişkin kayıtlar", isaret: "VAR" },
        { no: 42, madde: "Yapılan işe / riske göre gerekli tetkik sonuçları", isaret: "VAR" },
        { no: 43, madde: "Özel politika gerektiren çalışanlara ilişkin kayıtlar", isaret: "YOK" }
      ]},
      { ad: "Olay Kayıtları", maddeler: [
        { no: 44, madde: "İş kazası kayıtları", isaret: "YOK", not: "en son evrak 02.05.2023 tarihli daha sonrasında yaşanan iş kazaları dosyada yok" },
        { no: 45, madde: "İş kazası bildirimleri", isaret: "YOK", not: "en son evrak 02.05.2023 tarihli daha sonrasında yaşanan iş kazaları dosyada yok" },
        { no: 46, madde: "Kaza araştırma ve inceleme raporları", isaret: "YOK", not: "en son evrak 02.05.2023 tarihli daha sonrasında yaşanan iş kazaları dosyada yok" },
        { no: 47, madde: "Kök neden analizleri", isaret: "YOK", not: "en son evrak 02.05.2023 tarihli daha sonrasında yaşanan iş kazaları dosyada yok" },
        { no: 48, madde: "Ramak kala kayıtları", isaret: "YOK", not: "en son evrak 02.05.2023 tarihli daha sonrasında yaşanan iş kazaları dosyada yok" },
        { no: 49, madde: "Alınan düzeltici / önleyici faaliyetler", isaret: "YOK", not: "en son evrak 02.05.2023 tarihli daha sonrasında yaşanan iş kazaları dosyada yok" },
        { no: 50, madde: "Takip kayıtları", isaret: "KD", not: "Kaza sonrası personellere İLGİLİ raporlar yapılmalı ve kayıt altına alınmalıdır." }
      ]},
      { ad: "Periyodik Kontroller", maddeler: [
        { no: 51, madde: "Kaldırma ve iletme araçları periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 52, madde: "Basınçlı kaplar periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 53, madde: "Elektrik tesisatı periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 54, madde: "Topraklama ölçüm / kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 55, madde: "Paratoner kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 56, madde: "Yangın tesisatı ve ekipmanları kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 57, madde: "Havalandırma tesisatı kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 58, madde: "Diğer iş ekipmanlarının periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" }
      ]},
      { ad: "Ölçüm ve Analizler", maddeler: [
        { no: 59, madde: "Gürültü ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 60, madde: "Toz ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 61, madde: "Termal konfor ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 62, madde: "Aydınlatma ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 63, madde: "Titreşim ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 64, madde: "Kimyasal maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 65, madde: "Kişisel maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 66, madde: "Gerekli diğer ölçüm ve analizler", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" }
      ]},
      { ad: "KKD Dosyası", maddeler: [
        { no: 67, madde: "KKD ihtiyaçlarının belirlenmesi", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 68, madde: "KKD teslim / kullanım kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 69, madde: "KKD kullanım eğitimleri", isaret: "VAR", not: "Temel İSG eğitiminde var" },
        { no: 70, madde: "KKD uygunluk belgeleri", isaret: "YOK", not: "İhale sonrası ilgili daire bşk.larına alınan KKDlerin uygun beyanaları dosyaya koyulmalı" },
        { no: 71, madde: "Kullanım ve bakım talimatları", isaret: "YOK", not: "KKDlerin içlerinden bunlarla alakalı birer adet örnek alınmalı" },
        { no: 72, madde: "KKD zimmet kayıtları", isaret: "YOK", not: "Dağıtımdan sonra KKD lerin zimmetlenmesi için ilgili daire bşk.larına yazı yazılmalı" }
      ]},
      { ad: "Talimatlar ve Prosedürler", maddeler: [
        { no: 73, madde: "İş güvenliği talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 74, madde: "Makine kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 75, madde: "İşe özel çalışma talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 76, madde: "Acil durum talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 77, madde: "Kimyasal kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 78, madde: "Yüksekte çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 79, madde: "Kapalı alan çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 80, madde: "Sıcak çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" }
      ]},
      { ad: "Kimyasal Maddeler", maddeler: [
        { no: 81, madde: "Güncel güvenlik bilgi formları (SDS/GBF)", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 82, madde: "Kimyasal envanteri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 83, madde: "Etiketleme kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 84, madde: "Kimyasal depolama kuralları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 85, madde: "Maruziyet değerlendirmeleri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 86, madde: "Kimyasal risklere yönelik eğitim ve talimatlar", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" }
      ]},
      { ad: "İSG Kurulu ve Toplantılar", maddeler: [
        { no: 87, madde: "Kurul oluşturma belgeleri", isaret: "GUNCELLENECEK", not: "Sendika Temsilcisi değişimi sonrası güncellenecek" },
        { no: 88, madde: "Kurul üyeleri ve görevlendirmeler", isaret: "GUNCELLENECEK", not: "Sendika Temsilcisi değişimi sonrası güncellenecek" },
        { no: 89, madde: "Kurul toplantı tutanakları", isaret: "VAR" },
        { no: 90, madde: "Alınan kararlar", isaret: "VAR" },
        { no: 91, madde: "Kararların takip kayıtları", isaret: "VAR" },
        { no: 92, madde: "Yıllık çalışma planı", isaret: "VAR" },
        { no: 93, madde: "Yıllık değerlendirme raporu", isaret: "VAR" }
      ]},
      { ad: "Saha Kontrolleri", maddeler: [
        { no: 94, madde: "Saha gözlem formları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 95, madde: "Tespit ve öneriler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 96, madde: "Uygunsuzluk kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 97, madde: "Fotoğraflı tespitler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 98, madde: "Düzeltici faaliyetler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 99, madde: "Faaliyetlerin kapanış / takip kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 100, madde: "Onaylı defter kayıtları", isaret: "VAR" }
      ]},
      { ad: "Son Kontrol", maddeler: [
        { no: 101, madde: "Risk değerlendirmesi güncel mi?", isaret: "VAR", not: "Güncellenmesi önerilir." },
        { no: 102, madde: "Acil durum planı güncel mi?", isaret: "VAR" },
        { no: 103, madde: "Eğitim kayıtları tamam mı?", isaret: "VAR" },
        { no: 104, madde: "Sağlık gözetimleri takip ediliyor mu?", isaret: "VAR" },
        { no: 105, madde: "Periyodik kontrollerin süresi geçmemiş mi?", isaret: "YOK", not: "Herhangi bir periyodik kontrol gerektiren ekipman listesi bulunmamaktadır." },
        { no: 106, madde: "Kaza ve ramak kala kayıtları tutuluyor mu?", isaret: "VAR" },
        { no: 107, madde: "Saha tespitleri kapatılıyor mu?", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." }
      ]}
    ]
  },
  {
    kod: "DESTEK-HIZMETLERI", ad: "Destek Hizmetleri — Dosya Kontrol Listesi", kaynak: "İSG Dosya Kontrol Checklisti (Excel: destek hizmetleri sicil.xlsx) · Sayfadaki birim: DESTEK HİZMETLERİ ADLI SİCİL",
    duzenleyen: "Kontrolü yapan: A Sınıfı İş Güvenliği Uzmanı Oğuzhan ÖNAY · İSG uzmanı: B sınıfı İş Güvenliği Uzmanı Neslihan GİLİK", sicilNo: "",
    isyeriAdi: "Destek Hizmetleri", asilIsveren: "",
    kontrolTarihi: "2026-09-18", sonrakiKontrol: "",
    eslesme: ["Destek Hizmetleri"],
    genelDegerlendirme: "Kontrol özeti (107 madde): 35 var/uygun, 31 eksik, 22 güncellenecek, 19 uygulanamaz.",
    bolumler: [
      { ad: "İşyeri ve İSG Organizasyonu", maddeler: [
        { no: 1, madde: "İşyerine ait temel bilgiler", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 2, madde: "SGK işyeri sicil bilgileri", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 3, madde: "NACE kodu / faaliyet bilgisi", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 4, madde: "Tehlike sınıfı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 5, madde: "Çalışan sayısı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 6, madde: "İSG profesyonellerinin görevlendirme kayıtları", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 7, madde: "İSG-KATİP sözleşmeleri / görevlendirmeleri", isaret: "VAR" }
      ]},
      { ad: "Çalışan temsilcisi", maddeler: [
        { no: 8, madde: "Çalışan Temsilcisi Atama yazısı", isaret: "VAR" },
        { no: 9, madde: "Çalışan temsilcisi Eğitim yazısı", isaret: "VAR" },
        { no: 10, madde: "Çalışan temsilcisi talimatları", isaret: "VAR" },
        { no: 11, madde: "Çalışan temsilcisi test", isaret: "VAR" },
        { no: 12, madde: "Baş Çalışan Temsilcisi yazısı", isaret: "VAR" }
      ]},
      { ad: "Yıllık planlar", maddeler: [
        { no: 13, madde: "Yıllık değerlendirme raporu", isaret: "VAR" },
        { no: 14, madde: "Yıllık çalışma planı", isaret: "VAR" },
        { no: 15, madde: "Yıllı Eğitim planı", isaret: "VAR" }
      ]},
      { ad: "Risk Değerlendirmesi", maddeler: [
        { no: 16, madde: "Risk değerlendirmesi", isaret: "VAR" },
        { no: 17, madde: "Ekip görevlendirmeleri", isaret: "VAR" },
        { no: 18, madde: "Risk değerlendirmesi yenileme kayıtları", isaret: "VAR" },
        { no: 19, madde: "Tespit edilen riskler", isaret: "VAR" },
        { no: 20, madde: "Alınacak önlemler", isaret: "VAR" },
        { no: 21, madde: "Düzeltici / önleyici faaliyetler", isaret: "VAR" },
        { no: 22, madde: "Revizyon kayıtları", isaret: "VAR" }
      ]},
      { ad: "Acil Durum", maddeler: [
        { no: 23, madde: "Acil durum planı", isaret: "VAR" },
        { no: 24, madde: "Acil durum ekipleri", isaret: "GUNCELLENECEK", not: "İsimler kontrol edilecek ve eksikler tamamlanacak" },
        { no: 25, madde: "Görevlendirme listeleri", isaret: "GUNCELLENECEK", not: "İsimler kontrol edilecek ve eksikler tamamlanacak" },
        { no: 26, madde: "Acil durum krokileri", isaret: "GUNCELLENECEK", not: "Planlar eski güncellenmesi gerekiyor" },
        { no: 27, madde: "Kaçış yolları ve toplanma alanı", isaret: "GUNCELLENECEK", not: "Planlar eski güncellenmesi gerekiyor" },
        { no: 28, madde: "Acil durum iletişim bilgileri", isaret: "GUNCELLENECEK", not: "İsimler kontrol edilecek ve eksikler tamamlanacak" },
        { no: 29, madde: "Tatbikat kayıtları", isaret: "YOK", not: "Tatbikat yok" },
        { no: 30, madde: "Tatbikat sonuçları ve değerlendirmeler", isaret: "YOK", not: "Tatbikat yok" }
      ]},
      { ad: "Eğitim Dosyası", maddeler: [
        { no: 31, madde: "İSG eğitim planı", isaret: "VAR" },
        { no: 32, madde: "Eğitim katılım tutanakları", isaret: "VAR" },
        { no: 33, madde: "Eğitim içerikleri", isaret: "VAR" },
        { no: 34, madde: "Eğitim değerlendirme kayıtları", isaret: "VAR" },
        { no: 35, madde: "Eğitim sertifikaları / belgeleri", isaret: "KD" },
        { no: 36, madde: "İşe başlama eğitimleri", isaret: "KD" },
        { no: 37, madde: "İlave eğitimler (gerekirse)", isaret: "KD" },
        { no: 38, madde: "Özel eğitim gerektiren çalışanlara ait kayıtlar", isaret: "KD" }
      ]},
      { ad: "Sağlık Gözetimi", maddeler: [
        { no: 39, madde: "İşe giriş sağlık raporları", isaret: "GUNCELLENECEK", not: "2026 Ekim ayında yapılacak" },
        { no: 40, madde: "Periyodik muayene kayıtları", isaret: "GUNCELLENECEK", not: "2026 Ekim ayında yapılacak" },
        { no: 41, madde: "Sağlık gözetimine ilişkin kayıtlar", isaret: "GUNCELLENECEK", not: "2026 Ekim ayında yapılacak" },
        { no: 42, madde: "Yapılan işe / riske göre gerekli tetkik sonuçları", isaret: "GUNCELLENECEK", not: "2026 Ekim ayında yapılacak" },
        { no: 43, madde: "Özel politika gerektiren çalışanlara ilişkin kayıtlar", isaret: "YOK" }
      ]},
      { ad: "Olay Kayıtları", maddeler: [
        { no: 44, madde: "İş kazası kayıtları", isaret: "VAR" },
        { no: 45, madde: "İş kazası bildirimleri", isaret: "VAR" },
        { no: 46, madde: "Kaza araştırma ve inceleme raporları", isaret: "VAR" },
        { no: 47, madde: "Kök neden analizleri", isaret: "VAR" },
        { no: 48, madde: "Ramak kala kayıtları", isaret: "VAR" },
        { no: 49, madde: "Alınan düzeltici / önleyici faaliyetler", isaret: "VAR" },
        { no: 50, madde: "Takip kayıtları", isaret: "KD", not: "Kaza sonrası personellere İLGİLİ raporlar yapılmalı ve kayıt altına alınmalıdır." }
      ]},
      { ad: "Periyodik Kontroller", maddeler: [
        { no: 51, madde: "Kaldırma ve iletme araçları periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 52, madde: "Basınçlı kaplar periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 53, madde: "Elektrik tesisatı periyodik kontrol raporları", isaret: "GUNCELLENECEK", not: "nazilli otopark ve kuşadası otopark var diğerleri yok" },
        { no: 54, madde: "Topraklama ölçüm / kontrol raporları", isaret: "GUNCELLENECEK", not: "nazilli otopark ve kuşadası otopark var diğerleri yok" },
        { no: 55, madde: "Paratoner kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 56, madde: "Yangın tesisatı ve ekipmanları kontrol raporları", isaret: "YOK", not: "nazilli otopark ve kuşadası otopark var diğerleri yok" },
        { no: 57, madde: "Havalandırma tesisatı kontrol raporları", isaret: "GUNCELLENECEK", not: "nazilli otopark ve kuşadası otopark var diğerleri yok" },
        { no: 58, madde: "Diğer iş ekipmanlarının periyodik kontrol raporları", isaret: "GUNCELLENECEK", not: "nazilli otopark ve kuşadası otopark var diğerleri yok" }
      ]},
      { ad: "Ölçüm ve Analizler", maddeler: [
        { no: 59, madde: "Gürültü ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 60, madde: "Toz ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 61, madde: "Termal konfor ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 62, madde: "Aydınlatma ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 63, madde: "Titreşim ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 64, madde: "Kimyasal maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 65, madde: "Kişisel maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 66, madde: "Gerekli diğer ölçüm ve analizler", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" }
      ]},
      { ad: "KKD Dosyası", maddeler: [
        { no: 67, madde: "KKD ihtiyaçlarının belirlenmesi", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 68, madde: "KKD teslim / kullanım kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 69, madde: "KKD kullanım eğitimleri", isaret: "VAR", not: "Temel İSG eğitiminde var" },
        { no: 70, madde: "KKD uygunluk belgeleri", isaret: "YOK", not: "İhale sonrası ilgili daire bşk.larına alınan KKDlerin uygun beyanaları dosyaya koyulmalı" },
        { no: 71, madde: "Kullanım ve bakım talimatları", isaret: "YOK", not: "KKDlerin içlerinden bunlarla alakalı birer adet örnek alınmalı" },
        { no: 72, madde: "KKD zimmet kayıtları", isaret: "YOK", not: "Dağıtımdan sonra KKD lerin zimmetlenmesi için ilgili daire bşk.larına yazı yazılmalı" }
      ]},
      { ad: "Talimatlar ve Prosedürler", maddeler: [
        { no: 73, madde: "İş güvenliği talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 74, madde: "Makine kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 75, madde: "İşe özel çalışma talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 76, madde: "Acil durum talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 77, madde: "Kimyasal kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 78, madde: "Yüksekte çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 79, madde: "Kapalı alan çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 80, madde: "Sıcak çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" }
      ]},
      { ad: "Kimyasal Maddeler", maddeler: [
        { no: 81, madde: "Güncel güvenlik bilgi formları (SDS/GBF)", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 82, madde: "Kimyasal envanteri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 83, madde: "Etiketleme kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 84, madde: "Kimyasal depolama kuralları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 85, madde: "Maruziyet değerlendirmeleri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 86, madde: "Kimyasal risklere yönelik eğitim ve talimatlar", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" }
      ]},
      { ad: "İSG Kurulu ve Toplantılar", maddeler: [
        { no: 87, madde: "Kurul oluşturma belgeleri", isaret: "YOK", not: "İmza eksik" },
        { no: 88, madde: "Kurul üyeleri ve görevlendirmeler", isaret: "YOK", not: "İmza eksik" },
        { no: 89, madde: "Kurul toplantı tutanakları", isaret: "YOK", not: "İmza eksik" },
        { no: 90, madde: "Alınan kararlar", isaret: "YOK", not: "İmza eksik" },
        { no: 91, madde: "Kararların takip kayıtları", isaret: "YOK", not: "İmza eksik" },
        { no: 92, madde: "Yıllık çalışma planı", isaret: "VAR" },
        { no: 93, madde: "Yıllık değerlendirme raporu", isaret: "VAR" }
      ]},
      { ad: "Saha Kontrolleri", maddeler: [
        { no: 94, madde: "Saha gözlem formları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 95, madde: "Tespit ve öneriler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 96, madde: "Uygunsuzluk kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 97, madde: "Fotoğraflı tespitler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 98, madde: "Düzeltici faaliyetler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 99, madde: "Faaliyetlerin kapanış / takip kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 100, madde: "Onaylı defter kayıtları", isaret: "VAR" }
      ]},
      { ad: "Son Kontrol", maddeler: [
        { no: 101, madde: "Risk değerlendirmesi güncel mi?", isaret: "VAR" },
        { no: 102, madde: "Acil durum planı güncel mi?", isaret: "GUNCELLENECEK", not: "işveren değişikliği ve firma değişikliği" },
        { no: 103, madde: "Eğitim kayıtları tamam mı?", isaret: "VAR" },
        { no: 104, madde: "Sağlık gözetimleri takip ediliyor mu?", isaret: "VAR" },
        { no: 105, madde: "Periyodik kontrollerin süresi geçmemiş mi?", isaret: "GUNCELLENECEK" },
        { no: 106, madde: "Kaza ve ramak kala kayıtları tutuluyor mu?", isaret: "VAR" },
        { no: 107, madde: "Saha tespitleri kapatılıyor mu?", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." }
      ]}
    ]
  },
  {
    kod: "DIGER-DAIRE-BASKANLIGI", ad: "Diğer Daire Başkanlıkları — Dosya Kontrol Listesi", kaynak: "İSG Dosya Kontrol Checklisti (Excel: DİĞER DAİRE BŞK..xlsx) · Sayfadaki birim: DİĞER DAİRE BŞK. ADLI SİCİL",
    duzenleyen: "Kontrolü yapan: A Sınıfı İş Güvenliği Uzmanı Oğuzhan ÖNAY · İSG uzmanı: B sınıfı İş Güvenliği Uzmanı Neslihan GİLİK", sicilNo: "",
    isyeriAdi: "Diğer Daire Başkanlıkları", asilIsveren: "",
    kontrolTarihi: "2026-09-18", sonrakiKontrol: "",
    eslesme: ["Diğer Daire Başkanlıkları", "Diğer Daire Bşk."],
    genelDegerlendirme: "Kontrol özeti (107 madde): 35 var/uygun, 31 eksik, 22 güncellenecek, 19 uygulanamaz.",
    bolumler: [
      { ad: "İşyeri ve İSG Organizasyonu", maddeler: [
        { no: 1, madde: "İşyerine ait temel bilgiler", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 2, madde: "SGK işyeri sicil bilgileri", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 3, madde: "NACE kodu / faaliyet bilgisi", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 4, madde: "Tehlike sınıfı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 5, madde: "Çalışan sayısı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 6, madde: "İSG profesyonellerinin görevlendirme kayıtları", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 7, madde: "İSG-KATİP sözleşmeleri / görevlendirmeleri", isaret: "VAR" }
      ]},
      { ad: "Çalışan temsilcisi", maddeler: [
        { no: 8, madde: "Çalışan Temsilcisi Atama yazısı", isaret: "YOK", not: "Vicdan Çetav imza eksik" },
        { no: 9, madde: "Çalışan temsilcisi Eğitim yazısı", isaret: "VAR" },
        { no: 10, madde: "Çalışan temsilcisi talimatları", isaret: "VAR" },
        { no: 11, madde: "Çalışan temsilcisi test", isaret: "VAR" },
        { no: 12, madde: "Baş Çalışan Temsilcisi yazısı", isaret: "VAR" }
      ]},
      { ad: "Yıllık planlar", maddeler: [
        { no: 13, madde: "Yıllık değerlendirme raporu", isaret: "VAR" },
        { no: 14, madde: "Yıllık çalışma planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliğine göre güncellenecek" },
        { no: 15, madde: "Yıllı Eğitim planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliğine göre güncellenecek" }
      ]},
      { ad: "Risk Değerlendirmesi", maddeler: [
        { no: 16, madde: "Risk değerlendirmesi", isaret: "VAR" },
        { no: 17, madde: "Ekip görevlendirmeleri", isaret: "VAR" },
        { no: 18, madde: "Risk değerlendirmesi yenileme kayıtları", isaret: "VAR" },
        { no: 19, madde: "Tespit edilen riskler", isaret: "VAR" },
        { no: 20, madde: "Alınacak önlemler", isaret: "VAR" },
        { no: 21, madde: "Düzeltici / önleyici faaliyetler", isaret: "VAR" },
        { no: 22, madde: "Revizyon kayıtları", isaret: "VAR" }
      ]},
      { ad: "Acil Durum", maddeler: [
        { no: 23, madde: "Acil durum planı", isaret: "GUNCELLENECEK" },
        { no: 24, madde: "Acil durum ekipleri", isaret: "GUNCELLENECEK", not: "İsimler kontrol edilecek ve eksikler tamamlanacak" },
        { no: 25, madde: "Görevlendirme listeleri", isaret: "GUNCELLENECEK", not: "İsimler kontrol edilecek ve eksikler tamamlanacak" },
        { no: 26, madde: "Acil durum krokileri", isaret: "GUNCELLENECEK", not: "Planlar eski güncellenmesi gerekiyor" },
        { no: 27, madde: "Kaçış yolları ve toplanma alanı", isaret: "GUNCELLENECEK", not: "Planlar eski güncellenmesi gerekiyor" },
        { no: 28, madde: "Acil durum iletişim bilgileri", isaret: "GUNCELLENECEK", not: "İsimler kontrol edilecek ve eksikler tamamlanacak" },
        { no: 29, madde: "Tatbikat kayıtları", isaret: "YOK", not: "Tatbikat yok" },
        { no: 30, madde: "Tatbikat sonuçları ve değerlendirmeler", isaret: "YOK", not: "Tatbikat yok" }
      ]},
      { ad: "Eğitim Dosyası", maddeler: [
        { no: 31, madde: "İSG eğitim planı", isaret: "VAR" },
        { no: 32, madde: "Eğitim katılım tutanakları", isaret: "VAR" },
        { no: 33, madde: "Eğitim içerikleri", isaret: "VAR" },
        { no: 34, madde: "Eğitim değerlendirme kayıtları", isaret: "VAR" },
        { no: 35, madde: "Eğitim sertifikaları / belgeleri", isaret: "KD" },
        { no: 36, madde: "İşe başlama eğitimleri", isaret: "KD" },
        { no: 37, madde: "İlave eğitimler (gerekirse)", isaret: "KD" },
        { no: 38, madde: "Özel eğitim gerektiren çalışanlara ait kayıtlar", isaret: "KD" }
      ]},
      { ad: "Sağlık Gözetimi", maddeler: [
        { no: 39, madde: "İşe giriş sağlık raporları", isaret: "GUNCELLENECEK", not: "2026 KASIM ayında yapılacak" },
        { no: 40, madde: "Periyodik muayene kayıtları", isaret: "GUNCELLENECEK", not: "2026 KASIM ayında yapılacak" },
        { no: 41, madde: "Sağlık gözetimine ilişkin kayıtlar", isaret: "GUNCELLENECEK", not: "2026 KASIM ayında yapılacak" },
        { no: 42, madde: "Yapılan işe / riske göre gerekli tetkik sonuçları", isaret: "GUNCELLENECEK", not: "2026 KASIM ayında yapılacak" },
        { no: 43, madde: "Özel politika gerektiren çalışanlara ilişkin kayıtlar", isaret: "YOK" }
      ]},
      { ad: "Olay Kayıtları", maddeler: [
        { no: 44, madde: "İş kazası kayıtları", isaret: "VAR" },
        { no: 45, madde: "İş kazası bildirimleri", isaret: "VAR" },
        { no: 46, madde: "Kaza araştırma ve inceleme raporları", isaret: "VAR" },
        { no: 47, madde: "Kök neden analizleri", isaret: "VAR" },
        { no: 48, madde: "Ramak kala kayıtları", isaret: "VAR" },
        { no: 49, madde: "Alınan düzeltici / önleyici faaliyetler", isaret: "VAR" },
        { no: 50, madde: "Takip kayıtları", isaret: "KD", not: "Kaza sonrası personellere İLGİLİ raporlar yapılmalı ve kayıt altına alınmalıdır." }
      ]},
      { ad: "Periyodik Kontroller", maddeler: [
        { no: 51, madde: "Kaldırma ve iletme araçları periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 52, madde: "Basınçlı kaplar periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 53, madde: "Elektrik tesisatı periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 54, madde: "Topraklama ölçüm / kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 55, madde: "Paratoner kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 56, madde: "Yangın tesisatı ve ekipmanları kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 57, madde: "Havalandırma tesisatı kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 58, madde: "Diğer iş ekipmanlarının periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" }
      ]},
      { ad: "Ölçüm ve Analizler", maddeler: [
        { no: 59, madde: "Gürültü ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 60, madde: "Toz ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 61, madde: "Termal konfor ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 62, madde: "Aydınlatma ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 63, madde: "Titreşim ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 64, madde: "Kimyasal maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 65, madde: "Kişisel maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 66, madde: "Gerekli diğer ölçüm ve analizler", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" }
      ]},
      { ad: "KKD Dosyası", maddeler: [
        { no: 67, madde: "KKD ihtiyaçlarının belirlenmesi", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 68, madde: "KKD teslim / kullanım kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 69, madde: "KKD kullanım eğitimleri", isaret: "VAR", not: "Temel İSG eğitiminde var" },
        { no: 70, madde: "KKD uygunluk belgeleri", isaret: "YOK", not: "İhale sonrası ilgili daire bşk.larına alınan KKDlerin uygun beyanaları dosyaya koyulmalı" },
        { no: 71, madde: "Kullanım ve bakım talimatları", isaret: "YOK", not: "KKDlerin içlerinden bunlarla alakalı birer adet örnek alınmalı" },
        { no: 72, madde: "KKD zimmet kayıtları", isaret: "YOK", not: "Dağıtımdan sonra KKD lerin zimmetlenmesi için ilgili daire bşk.larına yazı yazılmalı" }
      ]},
      { ad: "Talimatlar ve Prosedürler", maddeler: [
        { no: 73, madde: "İş güvenliği talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 74, madde: "Makine kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 75, madde: "İşe özel çalışma talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 76, madde: "Acil durum talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 77, madde: "Kimyasal kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 78, madde: "Yüksekte çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 79, madde: "Kapalı alan çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 80, madde: "Sıcak çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" }
      ]},
      { ad: "Kimyasal Maddeler", maddeler: [
        { no: 81, madde: "Güncel güvenlik bilgi formları (SDS/GBF)", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 82, madde: "Kimyasal envanteri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 83, madde: "Etiketleme kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 84, madde: "Kimyasal depolama kuralları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 85, madde: "Maruziyet değerlendirmeleri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 86, madde: "Kimyasal risklere yönelik eğitim ve talimatlar", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" }
      ]},
      { ad: "İSG Kurulu ve Toplantılar", maddeler: [
        { no: 87, madde: "Kurul oluşturma belgeleri", isaret: "VAR" },
        { no: 88, madde: "Kurul üyeleri ve görevlendirmeler", isaret: "VAR" },
        { no: 89, madde: "Kurul toplantı tutanakları", isaret: "VAR" },
        { no: 90, madde: "Alınan kararlar", isaret: "VAR" },
        { no: 91, madde: "Kararların takip kayıtları", isaret: "VAR" },
        { no: 92, madde: "Yıllık çalışma planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliğine göre güncellenecek" },
        { no: 93, madde: "Yıllık değerlendirme raporu", isaret: "VAR" }
      ]},
      { ad: "Saha Kontrolleri", maddeler: [
        { no: 94, madde: "Saha gözlem formları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 95, madde: "Tespit ve öneriler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 96, madde: "Uygunsuzluk kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 97, madde: "Fotoğraflı tespitler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 98, madde: "Düzeltici faaliyetler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 99, madde: "Faaliyetlerin kapanış / takip kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 100, madde: "Onaylı defter kayıtları", isaret: "VAR" }
      ]},
      { ad: "Son Kontrol", maddeler: [
        { no: 101, madde: "Risk değerlendirmesi güncel mi?", isaret: "VAR" },
        { no: 102, madde: "Acil durum planı güncel mi?", isaret: "GUNCELLENECEK", not: "işveren değişikliği ve firma değişikliği" },
        { no: 103, madde: "Eğitim kayıtları tamam mı?", isaret: "VAR" },
        { no: 104, madde: "Sağlık gözetimleri takip ediliyor mu?", isaret: "VAR" },
        { no: 105, madde: "Periyodik kontrollerin süresi geçmemiş mi?", isaret: "GUNCELLENECEK" },
        { no: 106, madde: "Kaza ve ramak kala kayıtları tutuluyor mu?", isaret: "VAR" },
        { no: 107, madde: "Saha tespitleri kapatılıyor mu?", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." }
      ]}
    ]
  },
  {
    kod: "GUVENLIK", ad: "Güvenlik — Dosya Kontrol Listesi", kaynak: "İSG Dosya Kontrol Checklisti (Excel: güvenlik.xlsx) · Sayfadaki birim: VETERİNERLİK DAİRESİ BŞK. ADLI SİCİL",
    duzenleyen: "Kontrolü yapan: A Sınıfı İş Güvenliği Uzmanı Oğuzhan ÖNAY · İSG uzmanı: A sınıfı İş Güvenliği Uzmanı Rabia Gamze GİRGİN", sicilNo: "",
    isyeriAdi: "Güvenlik", asilIsveren: "",
    kontrolTarihi: "2026-09-16", sonrakiKontrol: "",
    eslesme: ["Güvenlik", "Özel Güvenlik"],
    genelDegerlendirme: "Kontrol özeti (108 madde): 43 var/uygun, 31 eksik, 7 güncellenecek, 27 uygulanamaz.",
    bolumler: [
      { ad: "İşyeri ve İSG Organizasyonu", maddeler: [
        { no: 1, madde: "İşyerine ait temel bilgiler", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 2, madde: "SGK işyeri sicil bilgileri", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 3, madde: "NACE kodu / faaliyet bilgisi", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 4, madde: "Tehlike sınıfı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 5, madde: "Çalışan sayısı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 6, madde: "İSG profesyonellerinin görevlendirme kayıtları", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 7, madde: "İSG-KATİP sözleşmeleri / görevlendirmeleri", isaret: "VAR" },
        { no: 8, madde: "İSG Kurulu belgeleri (kurul yükümlülüğü varsa)", isaret: "VAR" }
      ]},
      { ad: "Çalışan temsilcisi", maddeler: [
        { no: 9, madde: "Çalışan Temsilcisi Atama yazısı", isaret: "VAR" },
        { no: 10, madde: "Çalışan temsilcisi Eğitim yazısı", isaret: "YOK", not: "Ali Arıcı yedek çalışan temsilcisi eğitimi" },
        { no: 11, madde: "Çalışan temsilcisi talimatları", isaret: "VAR" },
        { no: 12, madde: "Çalışan temsilcisi test", isaret: "VAR" },
        { no: 13, madde: "Baş Çalışan Temsilcisi yazısı", isaret: "VAR" }
      ]},
      { ad: "Yıllık planlar", maddeler: [
        { no: 14, madde: "Yıllık değerlendirme raporu", isaret: "VAR" },
        { no: 15, madde: "Yıllık çalışma planı", isaret: "VAR" },
        { no: 16, madde: "Yıllı Eğitim planı", isaret: "YOK", not: "eğitim planı ilk sayfası eksik" }
      ]},
      { ad: "Risk Değerlendirmesi", maddeler: [
        { no: 17, madde: "Risk değerlendirmesi", isaret: "VAR" },
        { no: 18, madde: "Ekip görevlendirmeleri", isaret: "YOK", not: "bilgi sahibi çalışan imzalatılacak" },
        { no: 19, madde: "Risk değerlendirmesi yenileme kayıtları", isaret: "YOK", not: "bilgi sahibi çalışan imzalatılacak" },
        { no: 20, madde: "Tespit edilen riskler", isaret: "VAR" },
        { no: 21, madde: "Alınacak önlemler", isaret: "VAR" },
        { no: 22, madde: "Düzeltici / önleyici faaliyetler", isaret: "VAR" },
        { no: 23, madde: "Revizyon kayıtları", isaret: "VAR" }
      ]},
      { ad: "Acil Durum", maddeler: [
        { no: 24, madde: "Acil durum planı", isaret: "VAR" },
        { no: 25, madde: "Acil durum ekipleri", isaret: "VAR" },
        { no: 26, madde: "Görevlendirme listeleri", isaret: "VAR" },
        { no: 27, madde: "Acil durum krokileri", isaret: "YOK", not: "Kısmen birimlerin var çoğunluk olarak yok" },
        { no: 28, madde: "Kaçış yolları ve toplanma alanı", isaret: "YOK", not: "Kısmen birimlerin var çoğunluk olarak yok" },
        { no: 29, madde: "Acil durum iletişim bilgileri", isaret: "VAR" },
        { no: 30, madde: "Tatbikat kayıtları", isaret: "YOK", not: "23.07.2025 tarihinde yapılmış en son" },
        { no: 31, madde: "Tatbikat sonuçları ve değerlendirmeler", isaret: "YOK", not: "Tatbikat raporu yok" }
      ]},
      { ad: "Eğitim Dosyası", maddeler: [
        { no: 32, madde: "İSG eğitim planı", isaret: "YOK", not: "eğitim planı ilk sayfası eksik" },
        { no: 33, madde: "Eğitim katılım tutanakları", isaret: "VAR" },
        { no: 34, madde: "Eğitim içerikleri", isaret: "VAR" },
        { no: 35, madde: "Eğitim değerlendirme kayıtları", isaret: "VAR" },
        { no: 36, madde: "Eğitim sertifikaları / belgeleri", isaret: "KD" },
        { no: 37, madde: "İşe başlama eğitimleri", isaret: "KD" },
        { no: 38, madde: "İlave eğitimler (gerekirse)", isaret: "KD" },
        { no: 39, madde: "Özel eğitim gerektiren çalışanlara ait kayıtlar", isaret: "KD" }
      ]},
      { ad: "Sağlık Gözetimi", maddeler: [
        { no: 40, madde: "İşe giriş sağlık raporları", isaret: "VAR" },
        { no: 41, madde: "Periyodik muayene kayıtları", isaret: "VAR" },
        { no: 42, madde: "Sağlık gözetimine ilişkin kayıtlar", isaret: "VAR" },
        { no: 43, madde: "Yapılan işe / riske göre gerekli tetkik sonuçları", isaret: "VAR" },
        { no: 44, madde: "Özel politika gerektiren çalışanlara ilişkin kayıtlar", isaret: "YOK" }
      ]},
      { ad: "Olay Kayıtları", maddeler: [
        { no: 45, madde: "İş kazası kayıtları", isaret: "VAR" },
        { no: 46, madde: "İş kazası bildirimleri", isaret: "VAR" },
        { no: 47, madde: "Kaza araştırma ve inceleme raporları", isaret: "VAR" },
        { no: 48, madde: "Kök neden analizleri", isaret: "VAR" },
        { no: 49, madde: "Ramak kala kayıtları", isaret: "YOK", not: "Ramak kala kayıtları tutulmuyor." },
        { no: 50, madde: "Alınan düzeltici / önleyici faaliyetler", isaret: "VAR" },
        { no: 51, madde: "Takip kayıtları", isaret: "KD", not: "Kaza sonrası personellere İLGİLİ raporlar yapılmalı ve kayıt altına alınmalıdır." }
      ]},
      { ad: "Periyodik Kontroller", maddeler: [
        { no: 52, madde: "Kaldırma ve iletme araçları periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 53, madde: "Basınçlı kaplar periyodik kontrol raporları", isaret: "YOK", not: "Kompresörlerin periyodik kontrolleri yapılmış eksiklerde ilgili daireye bildirilmiştir." },
        { no: 54, madde: "Elektrik tesisatı periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 55, madde: "Topraklama ölçüm / kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 56, madde: "Paratoner kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 57, madde: "Yangın tesisatı ve ekipmanları kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 58, madde: "Havalandırma tesisatı kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 59, madde: "Diğer iş ekipmanlarının periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" }
      ]},
      { ad: "Ölçüm ve Analizler", maddeler: [
        { no: 60, madde: "Gürültü ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 61, madde: "Toz ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 62, madde: "Termal konfor ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 63, madde: "Aydınlatma ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 64, madde: "Titreşim ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 65, madde: "Kimyasal maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 66, madde: "Kişisel maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 67, madde: "Gerekli diğer ölçüm ve analizler", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" }
      ]},
      { ad: "KKD Dosyası", maddeler: [
        { no: 68, madde: "KKD ihtiyaçlarının belirlenmesi", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 69, madde: "KKD teslim / kullanım kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 70, madde: "KKD kullanım eğitimleri", isaret: "VAR", not: "Temel İSG eğitiminde var" },
        { no: 71, madde: "KKD uygunluk belgeleri", isaret: "YOK", not: "İhale sonrası ilgili daire bşk.larına alınan KKDlerin uygun beyanaları dosyaya koyulmalı" },
        { no: 72, madde: "Kullanım ve bakım talimatları", isaret: "YOK", not: "KKDlerin içlerinden bunlarla alakalı birer adet örnek alınmalı" },
        { no: 73, madde: "KKD zimmet kayıtları", isaret: "YOK", not: "Dağıtımdan sonra KKD lerin zimmetlenmesi için ilgili daire bşk.larına yazı yazılmalı" }
      ]},
      { ad: "Talimatlar ve Prosedürler", maddeler: [
        { no: 74, madde: "İş güvenliği talimatları", isaret: "VAR" },
        { no: 75, madde: "Makine kullanım talimatları", isaret: "KD" },
        { no: 76, madde: "İşe özel çalışma talimatları", isaret: "KD" },
        { no: 77, madde: "Acil durum talimatları", isaret: "KD" },
        { no: 78, madde: "Kimyasal kullanım talimatları", isaret: "KD" },
        { no: 79, madde: "Yüksekte çalışma prosedürleri", isaret: "KD" },
        { no: 80, madde: "Kapalı alan çalışma prosedürleri", isaret: "KD" },
        { no: 81, madde: "Sıcak çalışma prosedürleri", isaret: "KD" }
      ]},
      { ad: "Kimyasal Maddeler", maddeler: [
        { no: 82, madde: "Güncel güvenlik bilgi formları (SDS/GBF)", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 83, madde: "Kimyasal envanteri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 84, madde: "Etiketleme kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 85, madde: "Kimyasal depolama kuralları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 86, madde: "Maruziyet değerlendirmeleri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 87, madde: "Kimyasal risklere yönelik eğitim ve talimatlar", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" }
      ]},
      { ad: "İSG Kurulu ve Toplantılar", maddeler: [
        { no: 88, madde: "Kurul oluşturma belgeleri", isaret: "VAR" },
        { no: 89, madde: "Kurul üyeleri ve görevlendirmeler", isaret: "VAR" },
        { no: 90, madde: "Kurul toplantı tutanakları", isaret: "VAR" },
        { no: 91, madde: "Alınan kararlar", isaret: "VAR" },
        { no: 92, madde: "Kararların takip kayıtları", isaret: "VAR" },
        { no: 93, madde: "Yıllık çalışma planı", isaret: "VAR" },
        { no: 94, madde: "Yıllık değerlendirme raporu", isaret: "VAR" }
      ]},
      { ad: "Saha Kontrolleri", maddeler: [
        { no: 95, madde: "Saha gözlem formları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 96, madde: "Tespit ve öneriler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 97, madde: "Uygunsuzluk kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 98, madde: "Fotoğraflı tespitler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 99, madde: "Düzeltici faaliyetler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 100, madde: "Faaliyetlerin kapanış / takip kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 101, madde: "Onaylı defter kayıtları", isaret: "VAR" }
      ]},
      { ad: "Son Kontrol", maddeler: [
        { no: 102, madde: "Risk değerlendirmesi güncel mi?", isaret: "VAR" },
        { no: 103, madde: "Acil durum planı güncel mi?", isaret: "VAR" },
        { no: 104, madde: "Eğitim kayıtları tamam mı?", isaret: "VAR" },
        { no: 105, madde: "Sağlık gözetimleri takip ediliyor mu?", isaret: "VAR" },
        { no: 106, madde: "Periyodik kontrollerin süresi geçmemiş mi?", isaret: "YOK", not: "takip edilmelidir. Eksik varsa yapılmalıdır." },
        { no: 107, madde: "Kaza ve ramak kala kayıtları tutuluyor mu?", isaret: "KD", not: "daire bşk.larında böyle bi evrak tutulmuyor." },
        { no: 108, madde: "Saha tespitleri kapatılıyor mu?", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." }
      ]}
    ]
  },
  {
    kod: "HALK-EKMEK", ad: "Halk Ekmek — Dosya Kontrol Listesi", kaynak: "İSG Dosya Kontrol Checklisti (Excel: halk ekmek.xlsx) · Sayfadaki birim: HALK EKMEK",
    duzenleyen: "Kontrolü yapan: A Sınıfı İş Güvenliği Uzmanı Oğuzhan ÖNAY · İSG uzmanı: B sınıfı İş Güvenliği Uzmanı Dilek YILMAZ", sicilNo: "",
    isyeriAdi: "Halk Ekmek", asilIsveren: "",
    kontrolTarihi: "2026-09-18", sonrakiKontrol: "",
    eslesme: ["Halk Ekmek"],
    genelDegerlendirme: "Kontrol özeti (107 madde): 23 var/uygun, 34 eksik, 31 güncellenecek, 19 uygulanamaz.",
    bolumler: [
      { ad: "İşyeri ve İSG Organizasyonu", maddeler: [
        { no: 1, madde: "İşyerine ait temel bilgiler", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 2, madde: "SGK işyeri sicil bilgileri", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 3, madde: "NACE kodu / faaliyet bilgisi", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 4, madde: "Tehlike sınıfı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 5, madde: "Çalışan sayısı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 6, madde: "İSG profesyonellerinin görevlendirme kayıtları", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 7, madde: "İSG-KATİP sözleşmeleri / görevlendirmeleri", isaret: "VAR" }
      ]},
      { ad: "Çalışan temsilcisi", maddeler: [
        { no: 8, madde: "Çalışan Temsilcisi Atama yazısı", isaret: "GUNCELLENECEK", not: "İşyeri unvan değişikliğinden dolayı" },
        { no: 9, madde: "Çalışan temsilcisi Eğitim yazısı", isaret: "GUNCELLENECEK", not: "İşyeri unvan değişikliğinden dolayı" },
        { no: 10, madde: "Çalışan temsilcisi talimatları", isaret: "GUNCELLENECEK", not: "İşyeri unvan değişikliğinden dolayı" },
        { no: 11, madde: "Çalışan temsilcisi test", isaret: "GUNCELLENECEK", not: "İşyeri unvan değişikliğinden dolayı" },
        { no: 12, madde: "Baş Çalışan Temsilcisi yazısı", isaret: "GUNCELLENECEK", not: "İşyeri unvan değişikliğinden dolayı" }
      ]},
      { ad: "Yıllık planlar", maddeler: [
        { no: 13, madde: "Yıllık değerlendirme raporu", isaret: "VAR" },
        { no: 14, madde: "Yıllık çalışma planı", isaret: "GUNCELLENECEK", not: "yönetmelik değişikliği olduğundan dolayı" },
        { no: 15, madde: "Yıllı Eğitim planı", isaret: "GUNCELLENECEK", not: "yönetmelik değişikliği olduğundan dolayı" }
      ]},
      { ad: "Risk Değerlendirmesi", maddeler: [
        { no: 16, madde: "Risk değerlendirmesi", isaret: "GUNCELLENECEK", not: "İşyeri unvan değişikliğinden dolayı" },
        { no: 17, madde: "Ekip görevlendirmeleri", isaret: "GUNCELLENECEK", not: "İşyeri unvan değişikliğinden dolayı" },
        { no: 18, madde: "Risk değerlendirmesi yenileme kayıtları", isaret: "GUNCELLENECEK", not: "İşyeri unvan değişikliğinden dolayı" },
        { no: 19, madde: "Tespit edilen riskler", isaret: "GUNCELLENECEK", not: "İşyeri unvan değişikliğinden dolayı" },
        { no: 20, madde: "Alınacak önlemler", isaret: "GUNCELLENECEK", not: "İşyeri unvan değişikliğinden dolayı" },
        { no: 21, madde: "Düzeltici / önleyici faaliyetler", isaret: "GUNCELLENECEK", not: "İşyeri unvan değişikliğinden dolayı" },
        { no: 22, madde: "Revizyon kayıtları", isaret: "GUNCELLENECEK", not: "İşyeri unvan değişikliğinden dolayı" }
      ]},
      { ad: "Acil Durum", maddeler: [
        { no: 23, madde: "Acil durum planı", isaret: "GUNCELLENECEK", not: "İşyeri unvan değişikliğinden dolayı" },
        { no: 24, madde: "Acil durum ekipleri", isaret: "GUNCELLENECEK", not: "İşyeri unvan değişikliğinden dolayı" },
        { no: 25, madde: "Görevlendirme listeleri", isaret: "GUNCELLENECEK", not: "İşyeri unvan değişikliğinden dolayı" },
        { no: 26, madde: "Acil durum krokileri", isaret: "GUNCELLENECEK", not: "İşyeri unvan değişikliğinden dolayı" },
        { no: 27, madde: "Kaçış yolları ve toplanma alanı", isaret: "GUNCELLENECEK", not: "İşyeri unvan değişikliğinden dolayı" },
        { no: 28, madde: "Acil durum iletişim bilgileri", isaret: "GUNCELLENECEK", not: "İşyeri unvan değişikliğinden dolayı" },
        { no: 29, madde: "Tatbikat kayıtları", isaret: "YOK" },
        { no: 30, madde: "Tatbikat sonuçları ve değerlendirmeler", isaret: "YOK" }
      ]},
      { ad: "Eğitim Dosyası", maddeler: [
        { no: 31, madde: "İSG eğitim planı", isaret: "GUNCELLENECEK", not: "yönetmelik değişikliği olduğundan dolayı" },
        { no: 32, madde: "Eğitim katılım tutanakları", isaret: "VAR" },
        { no: 33, madde: "Eğitim içerikleri", isaret: "VAR" },
        { no: 34, madde: "Eğitim değerlendirme kayıtları", isaret: "VAR" },
        { no: 35, madde: "Eğitim sertifikaları / belgeleri", isaret: "KD" },
        { no: 36, madde: "İşe başlama eğitimleri", isaret: "KD" },
        { no: 37, madde: "İlave eğitimler (gerekirse)", isaret: "KD" },
        { no: 38, madde: "Özel eğitim gerektiren çalışanlara ait kayıtlar", isaret: "KD" }
      ]},
      { ad: "Sağlık Gözetimi", maddeler: [
        { no: 39, madde: "İşe giriş sağlık raporları", isaret: "VAR" },
        { no: 40, madde: "Periyodik muayene kayıtları", isaret: "VAR" },
        { no: 41, madde: "Sağlık gözetimine ilişkin kayıtlar", isaret: "VAR" },
        { no: 42, madde: "Yapılan işe / riske göre gerekli tetkik sonuçları", isaret: "VAR" },
        { no: 43, madde: "Özel politika gerektiren çalışanlara ilişkin kayıtlar", isaret: "YOK" }
      ]},
      { ad: "Olay Kayıtları", maddeler: [
        { no: 44, madde: "İş kazası kayıtları", isaret: "VAR" },
        { no: 45, madde: "İş kazası bildirimleri", isaret: "VAR" },
        { no: 46, madde: "Kaza araştırma ve inceleme raporları", isaret: "YOK" },
        { no: 47, madde: "Kök neden analizleri", isaret: "YOK" },
        { no: 48, madde: "Ramak kala kayıtları", isaret: "VAR" },
        { no: 49, madde: "Alınan düzeltici / önleyici faaliyetler", isaret: "YOK" },
        { no: 50, madde: "Takip kayıtları", isaret: "KD", not: "Kaza sonrası personellere İLGİLİ raporlar yapılmalı ve kayıt altına alınmalıdır." }
      ]},
      { ad: "Periyodik Kontroller", maddeler: [
        { no: 51, madde: "Kaldırma ve iletme araçları periyodik kontrol raporları", isaret: "YOK", not: "İlgili birimde yapılacak (varsa) periyodik muyene gerektiren ekipmanlar belirlenip ilgili birime yazı yazılmalıdır." },
        { no: 52, madde: "Basınçlı kaplar periyodik kontrol raporları", isaret: "YOK", not: "İlgili birimde yapılacak (varsa) periyodik muyene gerektiren ekipmanlar belirlenip ilgili birime yazı yazılmalıdır." },
        { no: 53, madde: "Elektrik tesisatı periyodik kontrol raporları", isaret: "YOK", not: "İlgili birimde yapılacak (varsa) periyodik muyene gerektiren ekipmanlar belirlenip ilgili birime yazı yazılmalıdır." },
        { no: 54, madde: "Topraklama ölçüm / kontrol raporları", isaret: "YOK", not: "İlgili birimde yapılacak (varsa) periyodik muyene gerektiren ekipmanlar belirlenip ilgili birime yazı yazılmalıdır." },
        { no: 55, madde: "Paratoner kontrol raporları", isaret: "YOK", not: "İlgili birimde yapılacak (varsa) periyodik muyene gerektiren ekipmanlar belirlenip ilgili birime yazı yazılmalıdır." },
        { no: 56, madde: "Yangın tesisatı ve ekipmanları kontrol raporları", isaret: "YOK", not: "İlgili birimde yapılacak (varsa) periyodik muyene gerektiren ekipmanlar belirlenip ilgili birime yazı yazılmalıdır." },
        { no: 57, madde: "Havalandırma tesisatı kontrol raporları", isaret: "YOK", not: "İlgili birimde yapılacak (varsa) periyodik muyene gerektiren ekipmanlar belirlenip ilgili birime yazı yazılmalıdır." },
        { no: 58, madde: "Diğer iş ekipmanlarının periyodik kontrol raporları", isaret: "YOK", not: "İlgili birimde yapılacak (varsa) periyodik muyene gerektiren ekipmanlar belirlenip ilgili birime yazı yazılmalıdır." }
      ]},
      { ad: "Ölçüm ve Analizler", maddeler: [
        { no: 59, madde: "Gürültü ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 60, madde: "Toz ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 61, madde: "Termal konfor ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 62, madde: "Aydınlatma ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 63, madde: "Titreşim ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 64, madde: "Kimyasal maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 65, madde: "Kişisel maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 66, madde: "Gerekli diğer ölçüm ve analizler", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" }
      ]},
      { ad: "KKD Dosyası", maddeler: [
        { no: 67, madde: "KKD ihtiyaçlarının belirlenmesi", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 68, madde: "KKD teslim / kullanım kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 69, madde: "KKD kullanım eğitimleri", isaret: "VAR", not: "Temel İSG eğitiminde var" },
        { no: 70, madde: "KKD uygunluk belgeleri", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 71, madde: "Kullanım ve bakım talimatları", isaret: "YOK", not: "KKDlerin içlerinden bunlarla alakalı birer adet örnek alınmalı" },
        { no: 72, madde: "KKD zimmet kayıtları", isaret: "YOK", not: "Dağıtımdan sonra KKD lerin zimmetlenmesi için ilgili daire bşk.larına yazı yazılmalı" }
      ]},
      { ad: "Talimatlar ve Prosedürler", maddeler: [
        { no: 73, madde: "İş güvenliği talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 74, madde: "Makine kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 75, madde: "İşe özel çalışma talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 76, madde: "Acil durum talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 77, madde: "Kimyasal kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 78, madde: "Yüksekte çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 79, madde: "Kapalı alan çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 80, madde: "Sıcak çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" }
      ]},
      { ad: "Kimyasal Maddeler", maddeler: [
        { no: 81, madde: "Güncel güvenlik bilgi formları (SDS/GBF)", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 82, madde: "Kimyasal envanteri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 83, madde: "Etiketleme kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 84, madde: "Kimyasal depolama kuralları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 85, madde: "Maruziyet değerlendirmeleri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 86, madde: "Kimyasal risklere yönelik eğitim ve talimatlar", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" }
      ]},
      { ad: "İSG Kurulu ve Toplantılar", maddeler: [
        { no: 87, madde: "Kurul oluşturma belgeleri", isaret: "VAR" },
        { no: 88, madde: "Kurul üyeleri ve görevlendirmeler", isaret: "VAR" },
        { no: 89, madde: "Kurul toplantı tutanakları", isaret: "VAR" },
        { no: 90, madde: "Alınan kararlar", isaret: "VAR" },
        { no: 91, madde: "Kararların takip kayıtları", isaret: "VAR" },
        { no: 92, madde: "Yıllık çalışma planı", isaret: "VAR" },
        { no: 93, madde: "Yıllık değerlendirme raporu", isaret: "VAR" }
      ]},
      { ad: "Saha Kontrolleri", maddeler: [
        { no: 94, madde: "Saha gözlem formları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 95, madde: "Tespit ve öneriler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 96, madde: "Uygunsuzluk kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 97, madde: "Fotoğraflı tespitler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 98, madde: "Düzeltici faaliyetler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 99, madde: "Faaliyetlerin kapanış / takip kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 100, madde: "Onaylı defter kayıtları", isaret: "VAR" }
      ]},
      { ad: "Son Kontrol", maddeler: [
        { no: 101, madde: "Risk değerlendirmesi güncel mi?", isaret: "GUNCELLENECEK", not: "İşyeri unvan değişikliğinden dolayı" },
        { no: 102, madde: "Acil durum planı güncel mi?", isaret: "GUNCELLENECEK", not: "işveren değişikliği ve firma değişikliği" },
        { no: 103, madde: "Eğitim kayıtları tamam mı?", isaret: "VAR" },
        { no: 104, madde: "Sağlık gözetimleri takip ediliyor mu?", isaret: "YOK" },
        { no: 105, madde: "Periyodik kontrollerin süresi geçmemiş mi?", isaret: "GUNCELLENECEK" },
        { no: 106, madde: "Kaza ve ramak kala kayıtları tutuluyor mu?", isaret: "VAR" },
        { no: 107, madde: "Saha tespitleri kapatılıyor mu?", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." }
      ]}
    ]
  },
  {
    kod: "ITFAIYE", ad: "İtfaiye Dairesi Başkanlığı — Dosya Kontrol Listesi", kaynak: "İSG Dosya Kontrol Checklisti (Excel: itfaiye dairesi bşk..xlsx) · Sayfadaki birim: İTFAİYE DAİRESİ BŞK. ADLI SİCİL",
    duzenleyen: "Kontrolü yapan: A Sınıfı İş Güvenliği Uzmanı Oğuzhan ÖNAY · İSG uzmanı: A sınıfı İş Güvenliği Uzmanı Tülay ACAR", sicilNo: "",
    isyeriAdi: "İtfaiye Dairesi Başkanlığı", asilIsveren: "",
    kontrolTarihi: "2026-09-16", sonrakiKontrol: "",
    eslesme: ["İtfaiye Dairesi Başkanlığı", "İtfaiye"],
    genelDegerlendirme: "Kontrol özeti (108 madde): 50 var/uygun, 28 eksik, 8 güncellenecek, 22 uygulanamaz.",
    bolumler: [
      { ad: "İşyeri ve İSG Organizasyonu", maddeler: [
        { no: 1, madde: "İşyerine ait temel bilgiler", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 2, madde: "SGK işyeri sicil bilgileri", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 3, madde: "NACE kodu / faaliyet bilgisi", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 4, madde: "Tehlike sınıfı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 5, madde: "Çalışan sayısı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 6, madde: "İSG profesyonellerinin görevlendirme kayıtları", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 7, madde: "İSG-KATİP sözleşmeleri / görevlendirmeleri", isaret: "GUNCELLENECEK", not: "Tülay ACAR sözleşme eski güncellenmesi gerekiyor" },
        { no: 8, madde: "İSG Kurulu belgeleri (kurul yükümlülüğü varsa)", isaret: "YOK", not: "Kurul atama formu Abdullah ÇAĞLAR imza eksik" }
      ]},
      { ad: "Çalışan temsilcisi", maddeler: [
        { no: 9, madde: "Çalışan Temsilcisi Atama yazısı", isaret: "VAR" },
        { no: 10, madde: "Çalışan temsilcisi Eğitim yazısı", isaret: "VAR" },
        { no: 11, madde: "Çalışan temsilcisi talimatları", isaret: "VAR" },
        { no: 12, madde: "Çalışan temsilcisi test", isaret: "VAR" },
        { no: 13, madde: "Baş Çalışan Temsilcisi yazısı", isaret: "VAR" }
      ]},
      { ad: "Yıllık planlar", maddeler: [
        { no: 14, madde: "Yıllık değerlendirme raporu", isaret: "VAR" },
        { no: 15, madde: "Yıllık çalışma planı", isaret: "VAR" },
        { no: 16, madde: "Yıllı Eğitim planı", isaret: "VAR" }
      ]},
      { ad: "Risk Değerlendirmesi", maddeler: [
        { no: 17, madde: "Risk değerlendirmesi", isaret: "VAR" },
        { no: 18, madde: "Ekip görevlendirmeleri", isaret: "YOK", not: "Tayfun KÜÇÜKÇAL Destek elemanı şefi imza eksik bilgi sahibi çalışan eğitim eksik" },
        { no: 19, madde: "Risk değerlendirmesi yenileme kayıtları", isaret: "YOK", not: "Tayfun KÜÇÜKÇAL Destek elemanı şefi imza eksik bilgi sahibi çalışan eğitim eksik" },
        { no: 20, madde: "Tespit edilen riskler", isaret: "VAR" },
        { no: 21, madde: "Alınacak önlemler", isaret: "VAR" },
        { no: 22, madde: "Düzeltici / önleyici faaliyetler", isaret: "VAR" },
        { no: 23, madde: "Revizyon kayıtları", isaret: "VAR" }
      ]},
      { ad: "Acil Durum", maddeler: [
        { no: 24, madde: "Acil durum planı", isaret: "YOK", not: "Destek elemanı şefi Tayfun KÜÇÜKÇAL" },
        { no: 25, madde: "Acil durum ekipleri", isaret: "VAR" },
        { no: 26, madde: "Görevlendirme listeleri", isaret: "VAR" },
        { no: 27, madde: "Acil durum krokileri", isaret: "YOK", not: "Kısmen birimlerin var çoğunluk olarak yok" },
        { no: 28, madde: "Kaçış yolları ve toplanma alanı", isaret: "YOK", not: "Kısmen birimlerin var çoğunluk olarak yok" },
        { no: 29, madde: "Acil durum iletişim bilgileri", isaret: "VAR" },
        { no: 30, madde: "Tatbikat kayıtları", isaret: "KD" },
        { no: 31, madde: "Tatbikat sonuçları ve değerlendirmeler", isaret: "KD" }
      ]},
      { ad: "Eğitim Dosyası", maddeler: [
        { no: 32, madde: "İSG eğitim planı", isaret: "VAR" },
        { no: 33, madde: "Eğitim katılım tutanakları", isaret: "VAR" },
        { no: 34, madde: "Eğitim içerikleri", isaret: "VAR" },
        { no: 35, madde: "Eğitim değerlendirme kayıtları", isaret: "VAR" },
        { no: 36, madde: "Eğitim sertifikaları / belgeleri", isaret: "KD" },
        { no: 37, madde: "İşe başlama eğitimleri", isaret: "KD" },
        { no: 38, madde: "İlave eğitimler (gerekirse)", isaret: "KD" },
        { no: 39, madde: "Özel eğitim gerektiren çalışanlara ait kayıtlar", isaret: "KD" }
      ]},
      { ad: "Sağlık Gözetimi", maddeler: [
        { no: 40, madde: "İşe giriş sağlık raporları", isaret: "VAR" },
        { no: 41, madde: "Periyodik muayene kayıtları", isaret: "VAR" },
        { no: 42, madde: "Sağlık gözetimine ilişkin kayıtlar", isaret: "VAR" },
        { no: 43, madde: "Yapılan işe / riske göre gerekli tetkik sonuçları", isaret: "VAR" },
        { no: 44, madde: "Özel politika gerektiren çalışanlara ilişkin kayıtlar", isaret: "YOK", not: "işyeri hekimi ilgilenecek" }
      ]},
      { ad: "Olay Kayıtları", maddeler: [
        { no: 45, madde: "İş kazası kayıtları", isaret: "VAR" },
        { no: 46, madde: "İş kazası bildirimleri", isaret: "VAR" },
        { no: 47, madde: "Kaza araştırma ve inceleme raporları", isaret: "VAR" },
        { no: 48, madde: "Kök neden analizleri", isaret: "VAR" },
        { no: 49, madde: "Ramak kala kayıtları", isaret: "YOK", not: "Ramak kala kayıtları tutulmuyor." },
        { no: 50, madde: "Alınan düzeltici / önleyici faaliyetler", isaret: "VAR" },
        { no: 51, madde: "Takip kayıtları", isaret: "KD", not: "Kaza sonrası personellere İLGİLİ raporlar yapılmalı ve kayıt altına alınmalıdır." }
      ]},
      { ad: "Periyodik Kontroller", maddeler: [
        { no: 52, madde: "Kaldırma ve iletme araçları periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 53, madde: "Basınçlı kaplar periyodik kontrol raporları", isaret: "VAR", not: "Kompresörlerin periyodik kontrolleri yapılmış eksiklerde ilgili daireye bildirilmiştir." },
        { no: 54, madde: "Elektrik tesisatı periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 55, madde: "Topraklama ölçüm / kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 56, madde: "Paratoner kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 57, madde: "Yangın tesisatı ve ekipmanları kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 58, madde: "Havalandırma tesisatı kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 59, madde: "Diğer iş ekipmanlarının periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" }
      ]},
      { ad: "Ölçüm ve Analizler", maddeler: [
        { no: 60, madde: "Gürültü ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 61, madde: "Toz ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 62, madde: "Termal konfor ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 63, madde: "Aydınlatma ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 64, madde: "Titreşim ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 65, madde: "Kimyasal maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 66, madde: "Kişisel maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 67, madde: "Gerekli diğer ölçüm ve analizler", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" }
      ]},
      { ad: "KKD Dosyası", maddeler: [
        { no: 68, madde: "KKD ihtiyaçlarının belirlenmesi", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 69, madde: "KKD teslim / kullanım kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 70, madde: "KKD kullanım eğitimleri", isaret: "VAR", not: "Temel İSG eğitiminde var" },
        { no: 71, madde: "KKD uygunluk belgeleri", isaret: "YOK", not: "İhale sonrası ilgili daire bşk.larına alınan KKDlerin uygun beyanaları dosyaya koyulmalı" },
        { no: 72, madde: "Kullanım ve bakım talimatları", isaret: "YOK", not: "KKDlerin içlerinden bunlarla alakalı birer adet örnek alınmalı" },
        { no: 73, madde: "KKD zimmet kayıtları", isaret: "YOK", not: "Dağıtımdan sonra KKD lerin zimmetlenmesi için ilgili daire bşk.larına yazı yazılmalı" }
      ]},
      { ad: "Talimatlar ve Prosedürler", maddeler: [
        { no: 74, madde: "İş güvenliği talimatları", isaret: "VAR" },
        { no: 75, madde: "Makine kullanım talimatları", isaret: "VAR" },
        { no: 76, madde: "İşe özel çalışma talimatları", isaret: "VAR" },
        { no: 77, madde: "Acil durum talimatları", isaret: "VAR" },
        { no: 78, madde: "Kimyasal kullanım talimatları", isaret: "VAR" },
        { no: 79, madde: "Yüksekte çalışma prosedürleri", isaret: "VAR" },
        { no: 80, madde: "Kapalı alan çalışma prosedürleri", isaret: "VAR" },
        { no: 81, madde: "Sıcak çalışma prosedürleri", isaret: "VAR" }
      ]},
      { ad: "Kimyasal Maddeler", maddeler: [
        { no: 82, madde: "Güncel güvenlik bilgi formları (SDS/GBF)", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 83, madde: "Kimyasal envanteri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 84, madde: "Etiketleme kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 85, madde: "Kimyasal depolama kuralları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 86, madde: "Maruziyet değerlendirmeleri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 87, madde: "Kimyasal risklere yönelik eğitim ve talimatlar", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" }
      ]},
      { ad: "İSG Kurulu ve Toplantılar", maddeler: [
        { no: 88, madde: "Kurul oluşturma belgeleri", isaret: "VAR" },
        { no: 89, madde: "Kurul üyeleri ve görevlendirmeler", isaret: "VAR" },
        { no: 90, madde: "Kurul toplantı tutanakları", isaret: "YOK", not: "Haziran ayı kurul kararları imza eksik" },
        { no: 91, madde: "Alınan kararlar", isaret: "VAR" },
        { no: 92, madde: "Kararların takip kayıtları", isaret: "VAR" },
        { no: 93, madde: "Yıllık çalışma planı", isaret: "VAR" },
        { no: 94, madde: "Yıllık değerlendirme raporu", isaret: "VAR" }
      ]},
      { ad: "Saha Kontrolleri", maddeler: [
        { no: 95, madde: "Saha gözlem formları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 96, madde: "Tespit ve öneriler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 97, madde: "Uygunsuzluk kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 98, madde: "Fotoğraflı tespitler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 99, madde: "Düzeltici faaliyetler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 100, madde: "Faaliyetlerin kapanış / takip kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 101, madde: "Onaylı defter kayıtları", isaret: "VAR" }
      ]},
      { ad: "Son Kontrol", maddeler: [
        { no: 102, madde: "Risk değerlendirmesi güncel mi?", isaret: "VAR", not: "Güncellenmesi önerilir." },
        { no: 103, madde: "Acil durum planı güncel mi?", isaret: "VAR" },
        { no: 104, madde: "Eğitim kayıtları tamam mı?", isaret: "VAR" },
        { no: 105, madde: "Sağlık gözetimleri takip ediliyor mu?", isaret: "VAR" },
        { no: 106, madde: "Periyodik kontrollerin süresi geçmemiş mi?", isaret: "YOK", not: "takip edilmelidir. Eksik varsa yapılmalıdır." },
        { no: 107, madde: "Kaza ve ramak kala kayıtları tutuluyor mu?", isaret: "KD", not: "daire bşk.larında böyle bi evrak tutulmuyor." },
        { no: 108, madde: "Saha tespitleri kapatılıyor mu?", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." }
      ]}
    ]
  },
  {
    kod: "MAKINE-IKMAL", ad: "Makine İkmal ve Fen İşleri — Dosya Kontrol Listesi", kaynak: "İSG Dosya Kontrol Checklisti (Excel: makine ikmal ve fen işleri.xlsx) · Sayfadaki birim: MAKİNE İKMAL VE FEN İŞLERİ SİCİLİ",
    duzenleyen: "Kontrolü yapan: A Sınıfı İş Güvenliği Uzmanı Oğuzhan ÖNAY · İSG uzmanı: A sınıfı İş Güvenliği Uzmanı Volkan DENİZ", sicilNo: "",
    isyeriAdi: "Makine İkmal ve Fen İşleri", asilIsveren: "",
    kontrolTarihi: "2026-09-18", sonrakiKontrol: "",
    eslesme: ["Makine İkmal ve Fen İşleri", "Makine İkmal"],
    genelDegerlendirme: "Kontrol özeti (107 madde): 42 var/uygun, 27 eksik, 19 güncellenecek, 19 uygulanamaz.",
    bolumler: [
      { ad: "İşyeri ve İSG Organizasyonu", maddeler: [
        { no: 1, madde: "İşyerine ait temel bilgiler", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 2, madde: "SGK işyeri sicil bilgileri", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 3, madde: "NACE kodu / faaliyet bilgisi", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 4, madde: "Tehlike sınıfı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 5, madde: "Çalışan sayısı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 6, madde: "İSG profesyonellerinin görevlendirme kayıtları", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 7, madde: "İSG-KATİP sözleşmeleri / görevlendirmeleri", isaret: "VAR" }
      ]},
      { ad: "Çalışan temsilcisi", maddeler: [
        { no: 8, madde: "Çalışan Temsilcisi Atama yazısı", isaret: "GUNCELLENECEK", not: "sendika temsilcisi değişikliği oluduğu için" },
        { no: 9, madde: "Çalışan temsilcisi Eğitim yazısı", isaret: "GUNCELLENECEK", not: "sendika temsilcisi değişikliği oluduğu için" },
        { no: 10, madde: "Çalışan temsilcisi talimatları", isaret: "GUNCELLENECEK", not: "sendika temsilcisi değişikliği oluduğu için" },
        { no: 11, madde: "Çalışan temsilcisi test", isaret: "GUNCELLENECEK", not: "sendika temsilcisi değişikliği oluduğu için" },
        { no: 12, madde: "Baş Çalışan Temsilcisi yazısı", isaret: "GUNCELLENECEK", not: "sendika temsilcisi değişikliği oluduğu için" }
      ]},
      { ad: "Yıllık planlar", maddeler: [
        { no: 13, madde: "Yıllık değerlendirme raporu", isaret: "VAR" },
        { no: 14, madde: "Yıllık çalışma planı", isaret: "GUNCELLENECEK", not: "yönetmelik değişikliği olduğundan dolayı" },
        { no: 15, madde: "Yıllı Eğitim planı", isaret: "GUNCELLENECEK", not: "yönetmelik değişikliği olduğundan dolayı" }
      ]},
      { ad: "Risk Değerlendirmesi", maddeler: [
        { no: 16, madde: "Risk değerlendirmesi", isaret: "VAR" },
        { no: 17, madde: "Ekip görevlendirmeleri", isaret: "VAR" },
        { no: 18, madde: "Risk değerlendirmesi yenileme kayıtları", isaret: "VAR" },
        { no: 19, madde: "Tespit edilen riskler", isaret: "VAR" },
        { no: 20, madde: "Alınacak önlemler", isaret: "VAR" },
        { no: 21, madde: "Düzeltici / önleyici faaliyetler", isaret: "VAR" },
        { no: 22, madde: "Revizyon kayıtları", isaret: "VAR" }
      ]},
      { ad: "Acil Durum", maddeler: [
        { no: 23, madde: "Acil durum planı", isaret: "VAR" },
        { no: 24, madde: "Acil durum ekipleri", isaret: "VAR", not: "personeller kontrol edilmelidir." },
        { no: 25, madde: "Görevlendirme listeleri", isaret: "VAR", not: "personeller kontrol edilmelidir." },
        { no: 26, madde: "Acil durum krokileri", isaret: "GUNCELLENECEK", not: "Planlar eski güncellenmesi gerekiyor" },
        { no: 27, madde: "Kaçış yolları ve toplanma alanı", isaret: "GUNCELLENECEK", not: "Planlar eski güncellenmesi gerekiyor" },
        { no: 28, madde: "Acil durum iletişim bilgileri", isaret: "VAR", not: "personeller kontrol edilmelidir." },
        { no: 29, madde: "Tatbikat kayıtları", isaret: "YOK" },
        { no: 30, madde: "Tatbikat sonuçları ve değerlendirmeler", isaret: "YOK" }
      ]},
      { ad: "Eğitim Dosyası", maddeler: [
        { no: 31, madde: "İSG eğitim planı", isaret: "GUNCELLENECEK", not: "yönetmelik değişikliği olduğundan dolayı" },
        { no: 32, madde: "Eğitim katılım tutanakları", isaret: "VAR" },
        { no: 33, madde: "Eğitim içerikleri", isaret: "VAR" },
        { no: 34, madde: "Eğitim değerlendirme kayıtları", isaret: "VAR" },
        { no: 35, madde: "Eğitim sertifikaları / belgeleri", isaret: "KD" },
        { no: 36, madde: "İşe başlama eğitimleri", isaret: "KD" },
        { no: 37, madde: "İlave eğitimler (gerekirse)", isaret: "KD" },
        { no: 38, madde: "Özel eğitim gerektiren çalışanlara ait kayıtlar", isaret: "KD" }
      ]},
      { ad: "Sağlık Gözetimi", maddeler: [
        { no: 39, madde: "İşe giriş sağlık raporları", isaret: "VAR" },
        { no: 40, madde: "Periyodik muayene kayıtları", isaret: "VAR" },
        { no: 41, madde: "Sağlık gözetimine ilişkin kayıtlar", isaret: "VAR" },
        { no: 42, madde: "Yapılan işe / riske göre gerekli tetkik sonuçları", isaret: "VAR" },
        { no: 43, madde: "Özel politika gerektiren çalışanlara ilişkin kayıtlar", isaret: "YOK" }
      ]},
      { ad: "Olay Kayıtları", maddeler: [
        { no: 44, madde: "İş kazası kayıtları", isaret: "VAR" },
        { no: 45, madde: "İş kazası bildirimleri", isaret: "VAR" },
        { no: 46, madde: "Kaza araştırma ve inceleme raporları", isaret: "YOK" },
        { no: 47, madde: "Kök neden analizleri", isaret: "YOK" },
        { no: 48, madde: "Ramak kala kayıtları", isaret: "VAR" },
        { no: 49, madde: "Alınan düzeltici / önleyici faaliyetler", isaret: "YOK" },
        { no: 50, madde: "Takip kayıtları", isaret: "KD", not: "Kaza sonrası personellere İLGİLİ raporlar yapılmalı ve kayıt altına alınmalıdır." }
      ]},
      { ad: "Periyodik Kontroller", maddeler: [
        { no: 51, madde: "Kaldırma ve iletme araçları periyodik kontrol raporları", isaret: "VAR", not: "makine ikmal bakım onarım dairesinde var fen işleri için belirlenmelidir." },
        { no: 52, madde: "Basınçlı kaplar periyodik kontrol raporları", isaret: "VAR", not: "makine ikmal bakım onarım dairesinde var fen işleri için belirlenmelidir." },
        { no: 53, madde: "Elektrik tesisatı periyodik kontrol raporları", isaret: "YOK", not: "daire bşk. Yapmalıdır." },
        { no: 54, madde: "Topraklama ölçüm / kontrol raporları", isaret: "VAR", not: "makine ikmal bakım onarım dairesinde var fen işleri için belirlenmelidir." },
        { no: 55, madde: "Paratoner kontrol raporları", isaret: "YOK", not: "daire bşk. Yapmalıdır." },
        { no: 56, madde: "Yangın tesisatı ve ekipmanları kontrol raporları", isaret: "YOK", not: "daire bşk. Yapmalıdır." },
        { no: 57, madde: "Havalandırma tesisatı kontrol raporları", isaret: "YOK", not: "daire bşk. Yapmalıdır." },
        { no: 58, madde: "Diğer iş ekipmanlarının periyodik kontrol raporları", isaret: "VAR", not: "makine ikmal bakım onarım dairesinde var fen işleri için belirlenmelidir." }
      ]},
      { ad: "Ölçüm ve Analizler", maddeler: [
        { no: 59, madde: "Gürültü ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 60, madde: "Toz ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 61, madde: "Termal konfor ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 62, madde: "Aydınlatma ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 63, madde: "Titreşim ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 64, madde: "Kimyasal maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 65, madde: "Kişisel maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 66, madde: "Gerekli diğer ölçüm ve analizler", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" }
      ]},
      { ad: "KKD Dosyası", maddeler: [
        { no: 67, madde: "KKD ihtiyaçlarının belirlenmesi", isaret: "VAR" },
        { no: 68, madde: "KKD teslim / kullanım kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 69, madde: "KKD kullanım eğitimleri", isaret: "VAR", not: "Temel İSG eğitiminde var" },
        { no: 70, madde: "KKD uygunluk belgeleri", isaret: "VAR" },
        { no: 71, madde: "Kullanım ve bakım talimatları", isaret: "YOK", not: "KKDlerin içlerinden bunlarla alakalı birer adet örnek alınmalı" },
        { no: 72, madde: "KKD zimmet kayıtları", isaret: "YOK", not: "Dağıtımdan sonra KKD lerin zimmetlenmesi için ilgili daire bşk.larına yazı yazılmalı" }
      ]},
      { ad: "Talimatlar ve Prosedürler", maddeler: [
        { no: 73, madde: "İş güvenliği talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 74, madde: "Makine kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 75, madde: "İşe özel çalışma talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 76, madde: "Acil durum talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 77, madde: "Kimyasal kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 78, madde: "Yüksekte çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 79, madde: "Kapalı alan çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 80, madde: "Sıcak çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" }
      ]},
      { ad: "Kimyasal Maddeler", maddeler: [
        { no: 81, madde: "Güncel güvenlik bilgi formları (SDS/GBF)", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 82, madde: "Kimyasal envanteri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 83, madde: "Etiketleme kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 84, madde: "Kimyasal depolama kuralları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 85, madde: "Maruziyet değerlendirmeleri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 86, madde: "Kimyasal risklere yönelik eğitim ve talimatlar", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" }
      ]},
      { ad: "İSG Kurulu ve Toplantılar", maddeler: [
        { no: 87, madde: "Kurul oluşturma belgeleri", isaret: "VAR" },
        { no: 88, madde: "Kurul üyeleri ve görevlendirmeler", isaret: "VAR" },
        { no: 89, madde: "Kurul toplantı tutanakları", isaret: "VAR" },
        { no: 90, madde: "Alınan kararlar", isaret: "VAR" },
        { no: 91, madde: "Kararların takip kayıtları", isaret: "VAR" },
        { no: 92, madde: "Yıllık çalışma planı", isaret: "VAR" },
        { no: 93, madde: "Yıllık değerlendirme raporu", isaret: "VAR" }
      ]},
      { ad: "Saha Kontrolleri", maddeler: [
        { no: 94, madde: "Saha gözlem formları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 95, madde: "Tespit ve öneriler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 96, madde: "Uygunsuzluk kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 97, madde: "Fotoğraflı tespitler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 98, madde: "Düzeltici faaliyetler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 99, madde: "Faaliyetlerin kapanış / takip kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 100, madde: "Onaylı defter kayıtları", isaret: "VAR" }
      ]},
      { ad: "Son Kontrol", maddeler: [
        { no: 101, madde: "Risk değerlendirmesi güncel mi?", isaret: "VAR" },
        { no: 102, madde: "Acil durum planı güncel mi?", isaret: "GUNCELLENECEK", not: "işveren değişikliği ve firma değişikliği" },
        { no: 103, madde: "Eğitim kayıtları tamam mı?", isaret: "VAR" },
        { no: 104, madde: "Sağlık gözetimleri takip ediliyor mu?", isaret: "VAR" },
        { no: 105, madde: "Periyodik kontrollerin süresi geçmemiş mi?", isaret: "GUNCELLENECEK" },
        { no: 106, madde: "Kaza ve ramak kala kayıtları tutuluyor mu?", isaret: "VAR" },
        { no: 107, madde: "Saha tespitleri kapatılıyor mu?", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." }
      ]}
    ]
  },
  {
    kod: "PARK-BAHCELER-KADROLU", ad: "Park ve Bahçeler Kadrolusu — Dosya Kontrol Listesi", kaynak: "İSG Dosya Kontrol Checklisti (Excel: park ve bahçeler kadrolular.xlsx) · Sayfadaki birim: PARK VE BAHÇELER KADROLU",
    duzenleyen: "Kontrolü yapan: A Sınıfı İş Güvenliği Uzmanı Oğuzhan ÖNAY · İSG uzmanı: B sınıfı İş Güvenliği Uzmanı Buse ŞENOL", sicilNo: "",
    isyeriAdi: "Park ve Bahçeler Kadrolusu", asilIsveren: "",
    kontrolTarihi: "2026-09-18", sonrakiKontrol: "",
    eslesme: ["Park ve Bahçeler Kadrolusu", "Park Bahçeler Kadrolular"],
    genelDegerlendirme: "Kontrol özeti (107 madde): 28 var/uygun, 37 eksik, 20 güncellenecek, 22 uygulanamaz.",
    bolumler: [
      { ad: "İşyeri ve İSG Organizasyonu", maddeler: [
        { no: 1, madde: "İşyerine ait temel bilgiler", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 2, madde: "SGK işyeri sicil bilgileri", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 3, madde: "NACE kodu / faaliyet bilgisi", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 4, madde: "Tehlike sınıfı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 5, madde: "Çalışan sayısı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 6, madde: "İSG profesyonellerinin görevlendirme kayıtları", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 7, madde: "İSG-KATİP sözleşmeleri / görevlendirmeleri", isaret: "YOK", not: "İşyeri hekiminin sözleşmesi yok" }
      ]},
      { ad: "Çalışan temsilcisi", maddeler: [
        { no: 8, madde: "Çalışan Temsilcisi Atama yazısı", isaret: "VAR" },
        { no: 9, madde: "Çalışan temsilcisi Eğitim yazısı", isaret: "VAR" },
        { no: 10, madde: "Çalışan temsilcisi talimatları", isaret: "VAR" },
        { no: 11, madde: "Çalışan temsilcisi test", isaret: "VAR" },
        { no: 12, madde: "Baş Çalışan Temsilcisi yazısı", isaret: "VAR" }
      ]},
      { ad: "Yıllık planlar", maddeler: [
        { no: 13, madde: "Yıllık değerlendirme raporu", isaret: "YOK", not: "işyeri hekiminin imzası yok" },
        { no: 14, madde: "Yıllık çalışma planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği gereği güncellenmesi gerekmektedir." },
        { no: 15, madde: "Yıllı Eğitim planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği gereği güncellenmesi gerekmektedir." }
      ]},
      { ad: "Risk Değerlendirmesi", maddeler: [
        { no: 16, madde: "Risk değerlendirmesi", isaret: "YOK", not: "işyeri hekiminin imzası yok" },
        { no: 17, madde: "Ekip görevlendirmeleri", isaret: "YOK", not: "işyeri hekiminin imzası yok" },
        { no: 18, madde: "Risk değerlendirmesi yenileme kayıtları", isaret: "VAR" },
        { no: 19, madde: "Tespit edilen riskler", isaret: "GUNCELLENECEK", not: "imza eksikleri ve personellerin işten ayrılmasından dolayı" },
        { no: 20, madde: "Alınacak önlemler", isaret: "GUNCELLENECEK", not: "imza eksikleri ve personellerin işten ayrılmasından dolayı" },
        { no: 21, madde: "Düzeltici / önleyici faaliyetler", isaret: "GUNCELLENECEK", not: "imza eksikleri ve personellerin işten ayrılmasından dolayı" },
        { no: 22, madde: "Revizyon kayıtları", isaret: "VAR" }
      ]},
      { ad: "Acil Durum", maddeler: [
        { no: 23, madde: "Acil durum planı", isaret: "YOK", not: "işyeri hekiminin imzası yok" },
        { no: 24, madde: "Acil durum ekipleri", isaret: "GUNCELLENECEK", not: "Listeler kontrol edilecek ve çıkan personellerin yerine yenileri seçilecek" },
        { no: 25, madde: "Görevlendirme listeleri", isaret: "GUNCELLENECEK" },
        { no: 26, madde: "Acil durum krokileri", isaret: "GUNCELLENECEK" },
        { no: 27, madde: "Kaçış yolları ve toplanma alanı", isaret: "GUNCELLENECEK" },
        { no: 28, madde: "Acil durum iletişim bilgileri", isaret: "GUNCELLENECEK" },
        { no: 29, madde: "Tatbikat kayıtları", isaret: "YOK", not: "yıl içerisinde tatbikat yapılmamıştır." },
        { no: 30, madde: "Tatbikat sonuçları ve değerlendirmeler", isaret: "YOK", not: "yıl içerisinde tatbikat yapılmamıştır." }
      ]},
      { ad: "Eğitim Dosyası", maddeler: [
        { no: 31, madde: "İSG eğitim planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği gereği güncellenmesi gerekmektedir." },
        { no: 32, madde: "Eğitim katılım tutanakları", isaret: "VAR" },
        { no: 33, madde: "Eğitim içerikleri", isaret: "VAR" },
        { no: 34, madde: "Eğitim değerlendirme kayıtları", isaret: "VAR" },
        { no: 35, madde: "Eğitim sertifikaları / belgeleri", isaret: "VAR" },
        { no: 36, madde: "İşe başlama eğitimleri", isaret: "KD" },
        { no: 37, madde: "İlave eğitimler (gerekirse)", isaret: "VAR" },
        { no: 38, madde: "Özel eğitim gerektiren çalışanlara ait kayıtlar", isaret: "KD" }
      ]},
      { ad: "Sağlık Gözetimi", maddeler: [
        { no: 39, madde: "İşe giriş sağlık raporları", isaret: "VAR" },
        { no: 40, madde: "Periyodik muayene kayıtları", isaret: "VAR" },
        { no: 41, madde: "Sağlık gözetimine ilişkin kayıtlar", isaret: "VAR" },
        { no: 42, madde: "Yapılan işe / riske göre gerekli tetkik sonuçları", isaret: "VAR" },
        { no: 43, madde: "Özel politika gerektiren çalışanlara ilişkin kayıtlar", isaret: "YOK" }
      ]},
      { ad: "Olay Kayıtları", maddeler: [
        { no: 44, madde: "İş kazası kayıtları", isaret: "VAR" },
        { no: 45, madde: "İş kazası bildirimleri", isaret: "VAR" },
        { no: 46, madde: "Kaza araştırma ve inceleme raporları", isaret: "VAR" },
        { no: 47, madde: "Kök neden analizleri", isaret: "VAR" },
        { no: 48, madde: "Ramak kala kayıtları", isaret: "VAR" },
        { no: 49, madde: "Alınan düzeltici / önleyici faaliyetler", isaret: "VAR" },
        { no: 50, madde: "Takip kayıtları", isaret: "VAR" }
      ]},
      { ad: "Periyodik Kontroller", maddeler: [
        { no: 51, madde: "Kaldırma ve iletme araçları periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 52, madde: "Basınçlı kaplar periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 53, madde: "Elektrik tesisatı periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 54, madde: "Topraklama ölçüm / kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 55, madde: "Paratoner kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 56, madde: "Yangın tesisatı ve ekipmanları kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 57, madde: "Havalandırma tesisatı kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 58, madde: "Diğer iş ekipmanlarının periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" }
      ]},
      { ad: "Ölçüm ve Analizler", maddeler: [
        { no: 59, madde: "Gürültü ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 60, madde: "Toz ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 61, madde: "Termal konfor ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 62, madde: "Aydınlatma ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 63, madde: "Titreşim ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 64, madde: "Kimyasal maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 65, madde: "Kişisel maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 66, madde: "Gerekli diğer ölçüm ve analizler", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" }
      ]},
      { ad: "KKD Dosyası", maddeler: [
        { no: 67, madde: "KKD ihtiyaçlarının belirlenmesi", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 68, madde: "KKD teslim / kullanım kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 69, madde: "KKD kullanım eğitimleri", isaret: "VAR", not: "Temel İSG eğitiminde var" },
        { no: 70, madde: "KKD uygunluk belgeleri", isaret: "YOK", not: "İhale sonrası ilgili daire bşk.larına alınan KKDlerin uygun beyanaları dosyaya koyulmalı" },
        { no: 71, madde: "Kullanım ve bakım talimatları", isaret: "YOK", not: "KKDlerin içlerinden bunlarla alakalı birer adet örnek alınmalı" },
        { no: 72, madde: "KKD zimmet kayıtları", isaret: "YOK", not: "Dağıtımdan sonra KKD lerin zimmetlenmesi için ilgili daire bşk.larına yazı yazılmalı" }
      ]},
      { ad: "Talimatlar ve Prosedürler", maddeler: [
        { no: 73, madde: "İş güvenliği talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 74, madde: "Makine kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 75, madde: "İşe özel çalışma talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 76, madde: "Acil durum talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 77, madde: "Kimyasal kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 78, madde: "Yüksekte çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 79, madde: "Kapalı alan çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 80, madde: "Sıcak çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" }
      ]},
      { ad: "Kimyasal Maddeler", maddeler: [
        { no: 81, madde: "Güncel güvenlik bilgi formları (SDS/GBF)", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 82, madde: "Kimyasal envanteri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 83, madde: "Etiketleme kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 84, madde: "Kimyasal depolama kuralları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 85, madde: "Maruziyet değerlendirmeleri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 86, madde: "Kimyasal risklere yönelik eğitim ve talimatlar", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" }
      ]},
      { ad: "İSG Kurulu ve Toplantılar", maddeler: [
        { no: 87, madde: "Kurul oluşturma belgeleri", isaret: "KD" },
        { no: 88, madde: "Kurul üyeleri ve görevlendirmeler", isaret: "KD" },
        { no: 89, madde: "Kurul toplantı tutanakları", isaret: "KD" },
        { no: 90, madde: "Alınan kararlar", isaret: "KD" },
        { no: 91, madde: "Kararların takip kayıtları", isaret: "KD" },
        { no: 92, madde: "Yıllık çalışma planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği gereği güncellenmesi gerekmektedir." },
        { no: 93, madde: "Yıllık değerlendirme raporu", isaret: "YOK", not: "işyeri hekiminin imzası yok" }
      ]},
      { ad: "Saha Kontrolleri", maddeler: [
        { no: 94, madde: "Saha gözlem formları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 95, madde: "Tespit ve öneriler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 96, madde: "Uygunsuzluk kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 97, madde: "Fotoğraflı tespitler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 98, madde: "Düzeltici faaliyetler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 99, madde: "Faaliyetlerin kapanış / takip kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 100, madde: "Onaylı defter kayıtları", isaret: "VAR" }
      ]},
      { ad: "Son Kontrol", maddeler: [
        { no: 101, madde: "Risk değerlendirmesi güncel mi?", isaret: "GUNCELLENECEK", not: "Güncellenmesi önerilir." },
        { no: 102, madde: "Acil durum planı güncel mi?", isaret: "VAR" },
        { no: 103, madde: "Eğitim kayıtları tamam mı?", isaret: "VAR" },
        { no: 104, madde: "Sağlık gözetimleri takip ediliyor mu?", isaret: "VAR" },
        { no: 105, madde: "Periyodik kontrollerin süresi geçmemiş mi?", isaret: "YOK", not: "Herhangi bir periyodik kontrol gerektiren ekipman listesi bulunmamaktadır." },
        { no: 106, madde: "Kaza ve ramak kala kayıtları tutuluyor mu?", isaret: "KD", not: "işyerinde böyle bi uygulama yok" },
        { no: 107, madde: "Saha tespitleri kapatılıyor mu?", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." }
      ]}
    ]
  },
  {
    kod: "PARK-BAHCELER", ad: "Park ve Bahçeler Dairesi — Dosya Kontrol Listesi", kaynak: "İSG Dosya Kontrol Checklisti (Excel: park ve bahçeler dairesi.xlsx) · Sayfadaki birim: PARK VE BAHÇELER ADLI SİCİL",
    duzenleyen: "Kontrolü yapan: A Sınıfı İş Güvenliği Uzmanı Oğuzhan ÖNAY · İSG uzmanı: B sınıfı İş Güvenliği Uzmanı Buse ŞENOL", sicilNo: "",
    isyeriAdi: "Park ve Bahçeler Dairesi", asilIsveren: "",
    kontrolTarihi: "2026-09-18", sonrakiKontrol: "",
    eslesme: ["Park ve Bahçeler Dairesi", "Park ve Bahçeler"],
    genelDegerlendirme: "Kontrol özeti (107 madde): 37 var/uygun, 31 eksik, 22 güncellenecek, 17 uygulanamaz.",
    bolumler: [
      { ad: "İşyeri ve İSG Organizasyonu", maddeler: [
        { no: 1, madde: "İşyerine ait temel bilgiler", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 2, madde: "SGK işyeri sicil bilgileri", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 3, madde: "NACE kodu / faaliyet bilgisi", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 4, madde: "Tehlike sınıfı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 5, madde: "Çalışan sayısı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 6, madde: "İSG profesyonellerinin görevlendirme kayıtları", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 7, madde: "İSG-KATİP sözleşmeleri / görevlendirmeleri", isaret: "VAR" }
      ]},
      { ad: "Çalışan temsilcisi", maddeler: [
        { no: 8, madde: "Çalışan Temsilcisi Atama yazısı", isaret: "VAR" },
        { no: 9, madde: "Çalışan temsilcisi Eğitim yazısı", isaret: "VAR" },
        { no: 10, madde: "Çalışan temsilcisi talimatları", isaret: "VAR" },
        { no: 11, madde: "Çalışan temsilcisi test", isaret: "VAR" },
        { no: 12, madde: "Baş Çalışan Temsilcisi yazısı", isaret: "VAR" }
      ]},
      { ad: "Yıllık planlar", maddeler: [
        { no: 13, madde: "Yıllık değerlendirme raporu", isaret: "VAR" },
        { no: 14, madde: "Yıllık çalışma planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği gereği güncellenmesi gerekmektedir." },
        { no: 15, madde: "Yıllı Eğitim planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği gereği güncellenmesi gerekmektedir." }
      ]},
      { ad: "Risk Değerlendirmesi", maddeler: [
        { no: 16, madde: "Risk değerlendirmesi", isaret: "GUNCELLENECEK", not: "imza eksikleri ve personellerin işten ayrılmasından dolayı" },
        { no: 17, madde: "Ekip görevlendirmeleri", isaret: "GUNCELLENECEK", not: "imza eksikleri ve personellerin işten ayrılmasından dolayı" },
        { no: 18, madde: "Risk değerlendirmesi yenileme kayıtları", isaret: "VAR" },
        { no: 19, madde: "Tespit edilen riskler", isaret: "GUNCELLENECEK", not: "imza eksikleri ve personellerin işten ayrılmasından dolayı" },
        { no: 20, madde: "Alınacak önlemler", isaret: "GUNCELLENECEK", not: "imza eksikleri ve personellerin işten ayrılmasından dolayı" },
        { no: 21, madde: "Düzeltici / önleyici faaliyetler", isaret: "GUNCELLENECEK", not: "imza eksikleri ve personellerin işten ayrılmasından dolayı" },
        { no: 22, madde: "Revizyon kayıtları", isaret: "VAR" }
      ]},
      { ad: "Acil Durum", maddeler: [
        { no: 23, madde: "Acil durum planı", isaret: "VAR" },
        { no: 24, madde: "Acil durum ekipleri", isaret: "GUNCELLENECEK", not: "Listeler kontrol edilecek ve çıkan personellerin yerine yenileri seçilecek" },
        { no: 25, madde: "Görevlendirme listeleri", isaret: "GUNCELLENECEK" },
        { no: 26, madde: "Acil durum krokileri", isaret: "GUNCELLENECEK" },
        { no: 27, madde: "Kaçış yolları ve toplanma alanı", isaret: "GUNCELLENECEK" },
        { no: 28, madde: "Acil durum iletişim bilgileri", isaret: "GUNCELLENECEK" },
        { no: 29, madde: "Tatbikat kayıtları", isaret: "YOK", not: "yıl içerisinde tatbikat yapılmamıştır." },
        { no: 30, madde: "Tatbikat sonuçları ve değerlendirmeler", isaret: "YOK", not: "yıl içerisinde tatbikat yapılmamıştır." }
      ]},
      { ad: "Eğitim Dosyası", maddeler: [
        { no: 31, madde: "İSG eğitim planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği gereği güncellenmesi gerekmektedir." },
        { no: 32, madde: "Eğitim katılım tutanakları", isaret: "VAR" },
        { no: 33, madde: "Eğitim içerikleri", isaret: "VAR" },
        { no: 34, madde: "Eğitim değerlendirme kayıtları", isaret: "VAR" },
        { no: 35, madde: "Eğitim sertifikaları / belgeleri", isaret: "VAR" },
        { no: 36, madde: "İşe başlama eğitimleri", isaret: "KD" },
        { no: 37, madde: "İlave eğitimler (gerekirse)", isaret: "VAR" },
        { no: 38, madde: "Özel eğitim gerektiren çalışanlara ait kayıtlar", isaret: "KD" }
      ]},
      { ad: "Sağlık Gözetimi", maddeler: [
        { no: 39, madde: "İşe giriş sağlık raporları", isaret: "VAR" },
        { no: 40, madde: "Periyodik muayene kayıtları", isaret: "VAR" },
        { no: 41, madde: "Sağlık gözetimine ilişkin kayıtlar", isaret: "VAR" },
        { no: 42, madde: "Yapılan işe / riske göre gerekli tetkik sonuçları", isaret: "VAR" },
        { no: 43, madde: "Özel politika gerektiren çalışanlara ilişkin kayıtlar", isaret: "YOK" }
      ]},
      { ad: "Olay Kayıtları", maddeler: [
        { no: 44, madde: "İş kazası kayıtları", isaret: "VAR" },
        { no: 45, madde: "İş kazası bildirimleri", isaret: "VAR" },
        { no: 46, madde: "Kaza araştırma ve inceleme raporları", isaret: "VAR" },
        { no: 47, madde: "Kök neden analizleri", isaret: "VAR" },
        { no: 48, madde: "Ramak kala kayıtları", isaret: "VAR" },
        { no: 49, madde: "Alınan düzeltici / önleyici faaliyetler", isaret: "VAR" },
        { no: 50, madde: "Takip kayıtları", isaret: "VAR" }
      ]},
      { ad: "Periyodik Kontroller", maddeler: [
        { no: 51, madde: "Kaldırma ve iletme araçları periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 52, madde: "Basınçlı kaplar periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 53, madde: "Elektrik tesisatı periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 54, madde: "Topraklama ölçüm / kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 55, madde: "Paratoner kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 56, madde: "Yangın tesisatı ve ekipmanları kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 57, madde: "Havalandırma tesisatı kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 58, madde: "Diğer iş ekipmanlarının periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" }
      ]},
      { ad: "Ölçüm ve Analizler", maddeler: [
        { no: 59, madde: "Gürültü ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 60, madde: "Toz ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 61, madde: "Termal konfor ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 62, madde: "Aydınlatma ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 63, madde: "Titreşim ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 64, madde: "Kimyasal maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 65, madde: "Kişisel maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 66, madde: "Gerekli diğer ölçüm ve analizler", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" }
      ]},
      { ad: "KKD Dosyası", maddeler: [
        { no: 67, madde: "KKD ihtiyaçlarının belirlenmesi", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 68, madde: "KKD teslim / kullanım kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 69, madde: "KKD kullanım eğitimleri", isaret: "VAR", not: "Temel İSG eğitiminde var" },
        { no: 70, madde: "KKD uygunluk belgeleri", isaret: "YOK", not: "İhale sonrası ilgili daire bşk.larına alınan KKDlerin uygun beyanaları dosyaya koyulmalı" },
        { no: 71, madde: "Kullanım ve bakım talimatları", isaret: "YOK", not: "KKDlerin içlerinden bunlarla alakalı birer adet örnek alınmalı" },
        { no: 72, madde: "KKD zimmet kayıtları", isaret: "YOK", not: "Dağıtımdan sonra KKD lerin zimmetlenmesi için ilgili daire bşk.larına yazı yazılmalı" }
      ]},
      { ad: "Talimatlar ve Prosedürler", maddeler: [
        { no: 73, madde: "İş güvenliği talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 74, madde: "Makine kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 75, madde: "İşe özel çalışma talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 76, madde: "Acil durum talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 77, madde: "Kimyasal kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 78, madde: "Yüksekte çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 79, madde: "Kapalı alan çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 80, madde: "Sıcak çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" }
      ]},
      { ad: "Kimyasal Maddeler", maddeler: [
        { no: 81, madde: "Güncel güvenlik bilgi formları (SDS/GBF)", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 82, madde: "Kimyasal envanteri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 83, madde: "Etiketleme kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 84, madde: "Kimyasal depolama kuralları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 85, madde: "Maruziyet değerlendirmeleri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 86, madde: "Kimyasal risklere yönelik eğitim ve talimatlar", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" }
      ]},
      { ad: "İSG Kurulu ve Toplantılar", maddeler: [
        { no: 87, madde: "Kurul oluşturma belgeleri", isaret: "VAR" },
        { no: 88, madde: "Kurul üyeleri ve görevlendirmeler", isaret: "VAR" },
        { no: 89, madde: "Kurul toplantı tutanakları", isaret: "VAR" },
        { no: 90, madde: "Alınan kararlar", isaret: "VAR" },
        { no: 91, madde: "Kararların takip kayıtları", isaret: "VAR" },
        { no: 92, madde: "Yıllık çalışma planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği gereği güncellenmesi gerekmektedir." },
        { no: 93, madde: "Yıllık değerlendirme raporu", isaret: "VAR" }
      ]},
      { ad: "Saha Kontrolleri", maddeler: [
        { no: 94, madde: "Saha gözlem formları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 95, madde: "Tespit ve öneriler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 96, madde: "Uygunsuzluk kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 97, madde: "Fotoğraflı tespitler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 98, madde: "Düzeltici faaliyetler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 99, madde: "Faaliyetlerin kapanış / takip kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 100, madde: "Onaylı defter kayıtları", isaret: "VAR" }
      ]},
      { ad: "Son Kontrol", maddeler: [
        { no: 101, madde: "Risk değerlendirmesi güncel mi?", isaret: "GUNCELLENECEK", not: "Güncellenmesi önerilir." },
        { no: 102, madde: "Acil durum planı güncel mi?", isaret: "VAR" },
        { no: 103, madde: "Eğitim kayıtları tamam mı?", isaret: "VAR" },
        { no: 104, madde: "Sağlık gözetimleri takip ediliyor mu?", isaret: "VAR" },
        { no: 105, madde: "Periyodik kontrollerin süresi geçmemiş mi?", isaret: "YOK", not: "Herhangi bir periyodik kontrol gerektiren ekipman listesi bulunmamaktadır." },
        { no: 106, madde: "Kaza ve ramak kala kayıtları tutuluyor mu?", isaret: "KD", not: "işyerinde böyle bi uygulama yok" },
        { no: 107, madde: "Saha tespitleri kapatılıyor mu?", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." }
      ]}
    ]
  },
  {
    kod: "SOSAL-HIZMETLER", ad: "Sosyal Hizmetler — Dosya Kontrol Listesi", kaynak: "İSG Dosya Kontrol Checklisti (Excel: sosyal hizmetler.xlsx) · Sayfadaki birim: SOSYAL HİZMETLER DAİRESİ BŞK. ADLI SİCİL",
    duzenleyen: "Kontrolü yapan: A Sınıfı İş Güvenliği Uzmanı Oğuzhan ÖNAY · İSG uzmanı: B sınıfı İş Güvenliği Uzmanı Yağmur DUMANCI", sicilNo: "",
    isyeriAdi: "Sosyal Hizmetler", asilIsveren: "",
    kontrolTarihi: "2026-09-14", sonrakiKontrol: "",
    eslesme: ["Sosyal Hizmetler"],
    genelDegerlendirme: "Kontrol özeti (108 madde): 35 var/uygun, 44 eksik, 10 güncellenecek, 19 uygulanamaz.",
    bolumler: [
      { ad: "İşyeri ve İSG Organizasyonu", maddeler: [
        { no: 1, madde: "İşyerine ait temel bilgiler", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 2, madde: "SGK işyeri sicil bilgileri", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 3, madde: "NACE kodu / faaliyet bilgisi", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 4, madde: "Tehlike sınıfı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 5, madde: "Çalışan sayısı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 6, madde: "İSG profesyonellerinin görevlendirme kayıtları", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 7, madde: "İSG-KATİP sözleşmeleri / görevlendirmeleri", isaret: "GUNCELLENECEK", not: "Yağmur dumancı sözleşme eski güncellenmesi gerekiyor" },
        { no: 8, madde: "İSG Kurulu belgeleri (kurul yükümlülüğü varsa)", isaret: "YOK", not: "Kurul atama formu Abdullah ÇAĞLAR imza eksik" }
      ]},
      { ad: "Çalışan temsilcisi", maddeler: [
        { no: 9, madde: "Çalışan Temsilcisi Atama yazısı", isaret: "VAR" },
        { no: 10, madde: "Çalışan temsilcisi Eğitim yazısı", isaret: "YOK", not: "Eğitim Tarihi ve eğitim yeri yazmıyor ve izma eksik" },
        { no: 11, madde: "Çalışan temsilcisi talimatları", isaret: "YOK", not: "Personel imza eksik" },
        { no: 12, madde: "Çalışan temsilcisi test", isaret: "YOK", not: "Testler cevaplanmamış" },
        { no: 13, madde: "Baş Çalışan Temsilcisi yazısı", isaret: "VAR" }
      ]},
      { ad: "Yıllık planlar", maddeler: [
        { no: 14, madde: "Yıllık değerlendirme raporu", isaret: "VAR" },
        { no: 15, madde: "Yıllık çalışma planı", isaret: "VAR" },
        { no: 16, madde: "Yıllı Eğitim planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği sonrası yenilenmesi gerekiyor" }
      ]},
      { ad: "Risk Değerlendirmesi", maddeler: [
        { no: 17, madde: "Risk değerlendirmesi", isaret: "VAR" },
        { no: 18, madde: "Ekip görevlendirmeleri", isaret: "VAR" },
        { no: 19, madde: "Risk değerlendirmesi yenileme kayıtları", isaret: "VAR" },
        { no: 20, madde: "Tespit edilen riskler", isaret: "VAR" },
        { no: 21, madde: "Alınacak önlemler", isaret: "VAR" },
        { no: 22, madde: "Düzeltici / önleyici faaliyetler", isaret: "VAR" },
        { no: 23, madde: "Revizyon kayıtları", isaret: "VAR" }
      ]},
      { ad: "Acil Durum", maddeler: [
        { no: 24, madde: "Acil durum planı", isaret: "YOK", not: "Destek elemanı şefi Ahmet ÇAKALCI imza eksik" },
        { no: 25, madde: "Acil durum ekipleri", isaret: "VAR" },
        { no: 26, madde: "Görevlendirme listeleri", isaret: "YOK", not: "Koruma, Kurtarma ve Söndürme ekipleri listesinde sorumluluk alanları boş" },
        { no: 27, madde: "Acil durum krokileri", isaret: "YOK", not: "Kısmen birimlerin var çoğunluk olarak yok" },
        { no: 28, madde: "Kaçış yolları ve toplanma alanı", isaret: "YOK", not: "Kısmen birimlerin var çoğunluk olarak yok" },
        { no: 29, madde: "Acil durum iletişim bilgileri", isaret: "VAR" },
        { no: 30, madde: "Tatbikat kayıtları", isaret: "YOK", not: "2026 yılı içerisinde tatbikat kaydı bulunmamıştır. En son yapılan tatbikar 14.03.2025" },
        { no: 31, madde: "Tatbikat sonuçları ve değerlendirmeler", isaret: "YOK", not: "2026 yılı içerisinde tatbikat kaydı bulunmamıştır. En son yapılan tatbikar 14.03.2025" }
      ]},
      { ad: "Eğitim Dosyası", maddeler: [
        { no: 32, madde: "İSG eğitim planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği sonrası yenilenmesi gerekiyor" },
        { no: 33, madde: "Eğitim katılım tutanakları", isaret: "VAR" },
        { no: 34, madde: "Eğitim içerikleri", isaret: "VAR" },
        { no: 35, madde: "Eğitim değerlendirme kayıtları", isaret: "VAR" },
        { no: 36, madde: "Eğitim sertifikaları / belgeleri", isaret: "KD" },
        { no: 37, madde: "İşe başlama eğitimleri", isaret: "KD" },
        { no: 38, madde: "İlave eğitimler (gerekirse)", isaret: "KD" },
        { no: 39, madde: "Özel eğitim gerektiren çalışanlara ait kayıtlar", isaret: "KD" }
      ]},
      { ad: "Sağlık Gözetimi", maddeler: [
        { no: 40, madde: "İşe giriş sağlık raporları", isaret: "VAR" },
        { no: 41, madde: "Periyodik muayene kayıtları", isaret: "VAR" },
        { no: 42, madde: "Sağlık gözetimine ilişkin kayıtlar", isaret: "VAR" },
        { no: 43, madde: "Yapılan işe / riske göre gerekli tetkik sonuçları", isaret: "VAR" },
        { no: 44, madde: "Özel politika gerektiren çalışanlara ilişkin kayıtlar", isaret: "YOK" }
      ]},
      { ad: "Olay Kayıtları", maddeler: [
        { no: 45, madde: "İş kazası kayıtları", isaret: "VAR" },
        { no: 46, madde: "İş kazası bildirimleri", isaret: "VAR" },
        { no: 47, madde: "Kaza araştırma ve inceleme raporları", isaret: "YOK", not: "Kaza sonrası personellere İLGİLİ raporlar yapılmalı ve kayıt altına alınmalıdır." },
        { no: 48, madde: "Kök neden analizleri", isaret: "YOK", not: "Kaza sonrası personellere İLGİLİ raporlar yapılmalı ve kayıt altına alınmalıdır." },
        { no: 49, madde: "Ramak kala kayıtları", isaret: "YOK", not: "Kaza sonrası personellere İLGİLİ raporlar yapılmalı ve kayıt altına alınmalıdır." },
        { no: 50, madde: "Alınan düzeltici / önleyici faaliyetler", isaret: "YOK", not: "Kaza sonrası personellere İLGİLİ raporlar yapılmalı ve kayıt altına alınmalıdır." },
        { no: 51, madde: "Takip kayıtları", isaret: "KD", not: "Kaza sonrası personellere İLGİLİ raporlar yapılmalı ve kayıt altına alınmalıdır." }
      ]},
      { ad: "Periyodik Kontroller", maddeler: [
        { no: 52, madde: "Kaldırma ve iletme araçları periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 53, madde: "Basınçlı kaplar periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 54, madde: "Elektrik tesisatı periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 55, madde: "Topraklama ölçüm / kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 56, madde: "Paratoner kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 57, madde: "Yangın tesisatı ve ekipmanları kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 58, madde: "Havalandırma tesisatı kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 59, madde: "Diğer iş ekipmanlarının periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" }
      ]},
      { ad: "Ölçüm ve Analizler", maddeler: [
        { no: 60, madde: "Gürültü ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 61, madde: "Toz ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 62, madde: "Termal konfor ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 63, madde: "Aydınlatma ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 64, madde: "Titreşim ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 65, madde: "Kimyasal maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 66, madde: "Kişisel maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 67, madde: "Gerekli diğer ölçüm ve analizler", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" }
      ]},
      { ad: "KKD Dosyası", maddeler: [
        { no: 68, madde: "KKD ihtiyaçlarının belirlenmesi", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 69, madde: "KKD teslim / kullanım kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 70, madde: "KKD kullanım eğitimleri", isaret: "VAR", not: "Temel İSG eğitiminde var" },
        { no: 71, madde: "KKD uygunluk belgeleri", isaret: "YOK", not: "İhale sonrası ilgili daire bşk.larına alınan KKDlerin uygun beyanaları dosyaya koyulmalı" },
        { no: 72, madde: "Kullanım ve bakım talimatları", isaret: "YOK", not: "KKDlerin içlerinden bunlarla alakalı birer adet örnek alınmalı" },
        { no: 73, madde: "KKD zimmet kayıtları", isaret: "YOK", not: "Dağıtımdan sonra KKD lerin zimmetlenmesi için ilgili daire bşk.larına yazı yazılmalı" }
      ]},
      { ad: "Talimatlar ve Prosedürler", maddeler: [
        { no: 74, madde: "İş güvenliği talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 75, madde: "Makine kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 76, madde: "İşe özel çalışma talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 77, madde: "Acil durum talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 78, madde: "Kimyasal kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 79, madde: "Yüksekte çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 80, madde: "Kapalı alan çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 81, madde: "Sıcak çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" }
      ]},
      { ad: "Kimyasal Maddeler", maddeler: [
        { no: 82, madde: "Güncel güvenlik bilgi formları (SDS/GBF)", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 83, madde: "Kimyasal envanteri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 84, madde: "Etiketleme kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 85, madde: "Kimyasal depolama kuralları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 86, madde: "Maruziyet değerlendirmeleri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 87, madde: "Kimyasal risklere yönelik eğitim ve talimatlar", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" }
      ]},
      { ad: "İSG Kurulu ve Toplantılar", maddeler: [
        { no: 88, madde: "Kurul oluşturma belgeleri", isaret: "VAR" },
        { no: 89, madde: "Kurul üyeleri ve görevlendirmeler", isaret: "YOK", not: "Kurul atama formu Abdullah ÇAĞLAR imza eksik" },
        { no: 90, madde: "Kurul toplantı tutanakları", isaret: "VAR" },
        { no: 91, madde: "Alınan kararlar", isaret: "VAR" },
        { no: 92, madde: "Kararların takip kayıtları", isaret: "VAR" },
        { no: 93, madde: "Yıllık çalışma planı", isaret: "VAR" },
        { no: 94, madde: "Yıllık değerlendirme raporu", isaret: "VAR" }
      ]},
      { ad: "Saha Kontrolleri", maddeler: [
        { no: 95, madde: "Saha gözlem formları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 96, madde: "Tespit ve öneriler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 97, madde: "Uygunsuzluk kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 98, madde: "Fotoğraflı tespitler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 99, madde: "Düzeltici faaliyetler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 100, madde: "Faaliyetlerin kapanış / takip kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 101, madde: "Onaylı defter kayıtları", isaret: "VAR" }
      ]},
      { ad: "Son Kontrol", maddeler: [
        { no: 102, madde: "Risk değerlendirmesi güncel mi?", isaret: "VAR", not: "Güncellenmesi önerilir." },
        { no: 103, madde: "Acil durum planı güncel mi?", isaret: "VAR" },
        { no: 104, madde: "Eğitim kayıtları tamam mı?", isaret: "VAR" },
        { no: 105, madde: "Sağlık gözetimleri takip ediliyor mu?", isaret: "VAR" },
        { no: 106, madde: "Periyodik kontrollerin süresi geçmemiş mi?", isaret: "YOK", not: "Herhangi bir periyodik kontrol gerektiren ekipman listesi bulunmamaktadır." },
        { no: 107, madde: "Kaza ve ramak kala kayıtları tutuluyor mu?", isaret: "VAR" },
        { no: 108, madde: "Saha tespitleri kapatılıyor mu?", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." }
      ]}
    ]
  },
  {
    kod: "ULASIM", ad: "Ulaşım Dairesi Başkanlığı — Dosya Kontrol Listesi", kaynak: "İSG Dosya Kontrol Checklisti (Excel: ulaşım dairesi bşk..xlsx) · Sayfadaki birim: ULAŞIM DAİRESİ ADLI SİCİL",
    duzenleyen: "Kontrolü yapan: A Sınıfı İş Güvenliği Uzmanı Oğuzhan ÖNAY · İSG uzmanı: B sınıfı İş Güvenliği Uzmanı Buse ŞENOL", sicilNo: "",
    isyeriAdi: "Ulaşım Dairesi Başkanlığı", asilIsveren: "",
    kontrolTarihi: "2026-09-18", sonrakiKontrol: "",
    eslesme: ["Ulaşım Dairesi Başkanlığı", "Ulaşım"],
    genelDegerlendirme: "Kontrol özeti (107 madde): 34 var/uygun, 39 eksik, 17 güncellenecek, 17 uygulanamaz.",
    bolumler: [
      { ad: "İşyeri ve İSG Organizasyonu", maddeler: [
        { no: 1, madde: "İşyerine ait temel bilgiler", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 2, madde: "SGK işyeri sicil bilgileri", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 3, madde: "NACE kodu / faaliyet bilgisi", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 4, madde: "Tehlike sınıfı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 5, madde: "Çalışan sayısı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 6, madde: "İSG profesyonellerinin görevlendirme kayıtları", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 7, madde: "İSG-KATİP sözleşmeleri / görevlendirmeleri", isaret: "VAR" }
      ]},
      { ad: "Çalışan temsilcisi", maddeler: [
        { no: 8, madde: "Çalışan Temsilcisi Atama yazısı", isaret: "YOK", not: "Gökhan Sezer imzası eksik" },
        { no: 9, madde: "Çalışan temsilcisi Eğitim yazısı", isaret: "YOK", not: "Gökhan Sezer imzası eksik" },
        { no: 10, madde: "Çalışan temsilcisi talimatları", isaret: "YOK", not: "Gökhan Sezer imzası eksik" },
        { no: 11, madde: "Çalışan temsilcisi test", isaret: "YOK", not: "Gökhan Sezer imzası eksik" },
        { no: 12, madde: "Baş Çalışan Temsilcisi yazısı", isaret: "VAR" }
      ]},
      { ad: "Yıllık planlar", maddeler: [
        { no: 13, madde: "Yıllık değerlendirme raporu", isaret: "VAR" },
        { no: 14, madde: "Yıllık çalışma planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği gereği güncellenmesi gerekmektedir." },
        { no: 15, madde: "Yıllı Eğitim planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği gereği güncellenmesi gerekmektedir." }
      ]},
      { ad: "Risk Değerlendirmesi", maddeler: [
        { no: 16, madde: "Risk değerlendirmesi", isaret: "YOK", not: "işyeri hekimi imza eksik" },
        { no: 17, madde: "Ekip görevlendirmeleri", isaret: "YOK", not: "işyeri hekimi imza eksik" },
        { no: 18, madde: "Risk değerlendirmesi yenileme kayıtları", isaret: "VAR" },
        { no: 19, madde: "Tespit edilen riskler", isaret: "VAR" },
        { no: 20, madde: "Alınacak önlemler", isaret: "VAR" },
        { no: 21, madde: "Düzeltici / önleyici faaliyetler", isaret: "VAR" },
        { no: 22, madde: "Revizyon kayıtları", isaret: "VAR" }
      ]},
      { ad: "Acil Durum", maddeler: [
        { no: 23, madde: "Acil durum planı", isaret: "YOK", not: "Destek elemanı imzası eksik" },
        { no: 24, madde: "Acil durum ekipleri", isaret: "GUNCELLENECEK", not: "Listeler kontrol edilecek ve çıkan personellerin yerine yenileri seçilecek" },
        { no: 25, madde: "Görevlendirme listeleri", isaret: "GUNCELLENECEK" },
        { no: 26, madde: "Acil durum krokileri", isaret: "GUNCELLENECEK" },
        { no: 27, madde: "Kaçış yolları ve toplanma alanı", isaret: "GUNCELLENECEK" },
        { no: 28, madde: "Acil durum iletişim bilgileri", isaret: "GUNCELLENECEK" },
        { no: 29, madde: "Tatbikat kayıtları", isaret: "YOK", not: "yıl içerisinde tatbikat yapılmamıştır." },
        { no: 30, madde: "Tatbikat sonuçları ve değerlendirmeler", isaret: "YOK", not: "yıl içerisinde tatbikat yapılmamıştır." }
      ]},
      { ad: "Eğitim Dosyası", maddeler: [
        { no: 31, madde: "İSG eğitim planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği gereği güncellenmesi gerekmektedir." },
        { no: 32, madde: "Eğitim katılım tutanakları", isaret: "VAR" },
        { no: 33, madde: "Eğitim içerikleri", isaret: "VAR" },
        { no: 34, madde: "Eğitim değerlendirme kayıtları", isaret: "VAR" },
        { no: 35, madde: "Eğitim sertifikaları / belgeleri", isaret: "VAR" },
        { no: 36, madde: "İşe başlama eğitimleri", isaret: "KD" },
        { no: 37, madde: "İlave eğitimler (gerekirse)", isaret: "VAR" },
        { no: 38, madde: "Özel eğitim gerektiren çalışanlara ait kayıtlar", isaret: "KD" }
      ]},
      { ad: "Sağlık Gözetimi", maddeler: [
        { no: 39, madde: "İşe giriş sağlık raporları", isaret: "VAR" },
        { no: 40, madde: "Periyodik muayene kayıtları", isaret: "VAR" },
        { no: 41, madde: "Sağlık gözetimine ilişkin kayıtlar", isaret: "VAR" },
        { no: 42, madde: "Yapılan işe / riske göre gerekli tetkik sonuçları", isaret: "VAR" },
        { no: 43, madde: "Özel politika gerektiren çalışanlara ilişkin kayıtlar", isaret: "YOK" }
      ]},
      { ad: "Olay Kayıtları", maddeler: [
        { no: 44, madde: "İş kazası kayıtları", isaret: "VAR" },
        { no: 45, madde: "İş kazası bildirimleri", isaret: "VAR" },
        { no: 46, madde: "Kaza araştırma ve inceleme raporları", isaret: "VAR" },
        { no: 47, madde: "Kök neden analizleri", isaret: "VAR" },
        { no: 48, madde: "Ramak kala kayıtları", isaret: "VAR" },
        { no: 49, madde: "Alınan düzeltici / önleyici faaliyetler", isaret: "VAR" },
        { no: 50, madde: "Takip kayıtları", isaret: "VAR" }
      ]},
      { ad: "Periyodik Kontroller", maddeler: [
        { no: 51, madde: "Kaldırma ve iletme araçları periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 52, madde: "Basınçlı kaplar periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 53, madde: "Elektrik tesisatı periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 54, madde: "Topraklama ölçüm / kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 55, madde: "Paratoner kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 56, madde: "Yangın tesisatı ve ekipmanları kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 57, madde: "Havalandırma tesisatı kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 58, madde: "Diğer iş ekipmanlarının periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" }
      ]},
      { ad: "Ölçüm ve Analizler", maddeler: [
        { no: 59, madde: "Gürültü ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 60, madde: "Toz ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 61, madde: "Termal konfor ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 62, madde: "Aydınlatma ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 63, madde: "Titreşim ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 64, madde: "Kimyasal maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 65, madde: "Kişisel maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 66, madde: "Gerekli diğer ölçüm ve analizler", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" }
      ]},
      { ad: "KKD Dosyası", maddeler: [
        { no: 67, madde: "KKD ihtiyaçlarının belirlenmesi", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 68, madde: "KKD teslim / kullanım kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 69, madde: "KKD kullanım eğitimleri", isaret: "VAR", not: "Temel İSG eğitiminde var" },
        { no: 70, madde: "KKD uygunluk belgeleri", isaret: "YOK", not: "İhale sonrası ilgili daire bşk.larına alınan KKDlerin uygun beyanaları dosyaya koyulmalı" },
        { no: 71, madde: "Kullanım ve bakım talimatları", isaret: "YOK", not: "KKDlerin içlerinden bunlarla alakalı birer adet örnek alınmalı" },
        { no: 72, madde: "KKD zimmet kayıtları", isaret: "YOK", not: "Dağıtımdan sonra KKD lerin zimmetlenmesi için ilgili daire bşk.larına yazı yazılmalı" }
      ]},
      { ad: "Talimatlar ve Prosedürler", maddeler: [
        { no: 73, madde: "İş güvenliği talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 74, madde: "Makine kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 75, madde: "İşe özel çalışma talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 76, madde: "Acil durum talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 77, madde: "Kimyasal kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 78, madde: "Yüksekte çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 79, madde: "Kapalı alan çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 80, madde: "Sıcak çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" }
      ]},
      { ad: "Kimyasal Maddeler", maddeler: [
        { no: 81, madde: "Güncel güvenlik bilgi formları (SDS/GBF)", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 82, madde: "Kimyasal envanteri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 83, madde: "Etiketleme kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 84, madde: "Kimyasal depolama kuralları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 85, madde: "Maruziyet değerlendirmeleri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 86, madde: "Kimyasal risklere yönelik eğitim ve talimatlar", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" }
      ]},
      { ad: "İSG Kurulu ve Toplantılar", maddeler: [
        { no: 87, madde: "Kurul oluşturma belgeleri", isaret: "VAR" },
        { no: 88, madde: "Kurul üyeleri ve görevlendirmeler", isaret: "VAR" },
        { no: 89, madde: "Kurul toplantı tutanakları", isaret: "YOK", not: "7.ay kurul kararlarında imza eksik" },
        { no: 90, madde: "Alınan kararlar", isaret: "VAR" },
        { no: 91, madde: "Kararların takip kayıtları", isaret: "VAR" },
        { no: 92, madde: "Yıllık çalışma planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği gereği güncellenmesi gerekmektedir." },
        { no: 93, madde: "Yıllık değerlendirme raporu", isaret: "VAR" }
      ]},
      { ad: "Saha Kontrolleri", maddeler: [
        { no: 94, madde: "Saha gözlem formları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 95, madde: "Tespit ve öneriler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 96, madde: "Uygunsuzluk kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 97, madde: "Fotoğraflı tespitler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 98, madde: "Düzeltici faaliyetler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 99, madde: "Faaliyetlerin kapanış / takip kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 100, madde: "Onaylı defter kayıtları", isaret: "VAR" }
      ]},
      { ad: "Son Kontrol", maddeler: [
        { no: 101, madde: "Risk değerlendirmesi güncel mi?", isaret: "GUNCELLENECEK", not: "Güncellenmesi önerilir." },
        { no: 102, madde: "Acil durum planı güncel mi?", isaret: "VAR" },
        { no: 103, madde: "Eğitim kayıtları tamam mı?", isaret: "VAR" },
        { no: 104, madde: "Sağlık gözetimleri takip ediliyor mu?", isaret: "VAR" },
        { no: 105, madde: "Periyodik kontrollerin süresi geçmemiş mi?", isaret: "YOK", not: "Herhangi bir periyodik kontrol gerektiren ekipman listesi bulunmamaktadır." },
        { no: 106, madde: "Kaza ve ramak kala kayıtları tutuluyor mu?", isaret: "KD", not: "işyerinde böyle bi uygulama yok" },
        { no: 107, madde: "Saha tespitleri kapatılıyor mu?", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." }
      ]}
    ]
  },
  {
    kod: "VETERINERLIK-AYPAS", ad: "Veterinerlik İşleri (Aypaş) — Dosya Kontrol Listesi", kaynak: "İSG Dosya Kontrol Checklisti (Excel: veterinerlik aypaş.xlsx) · Sayfadaki birim: VETERİNERLİK DAİRESİ BŞK. ADLI SİCİL",
    duzenleyen: "Kontrolü yapan: A Sınıfı İş Güvenliği Uzmanı Oğuzhan ÖNAY · İSG uzmanı: A sınıfı İş Güvenliği Uzmanı Rabia Gamze GİRGİN", sicilNo: "",
    isyeriAdi: "Veterinerlik İşleri (Aypaş)", asilIsveren: "",
    kontrolTarihi: "2026-09-16", sonrakiKontrol: "",
    eslesme: ["Veterinerlik Aypaş", "Veterinerlik İşleri", "Veterinerlik"],
    genelDegerlendirme: "Kontrol özeti (108 madde): 34 var/uygun, 43 eksik, 11 güncellenecek, 20 uygulanamaz.",
    bolumler: [
      { ad: "İşyeri ve İSG Organizasyonu", maddeler: [
        { no: 1, madde: "İşyerine ait temel bilgiler", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 2, madde: "SGK işyeri sicil bilgileri", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 3, madde: "NACE kodu / faaliyet bilgisi", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 4, madde: "Tehlike sınıfı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 5, madde: "Çalışan sayısı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 6, madde: "İSG profesyonellerinin görevlendirme kayıtları", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 7, madde: "İSG-KATİP sözleşmeleri / görevlendirmeleri", isaret: "YOK", not: "Hüseyin BABACAN sözleşme eksik" },
        { no: 8, madde: "İSG Kurulu belgeleri (kurul yükümlülüğü varsa)", isaret: "VAR" }
      ]},
      { ad: "Çalışan temsilcisi", maddeler: [
        { no: 9, madde: "Çalışan Temsilcisi Atama yazısı", isaret: "VAR" },
        { no: 10, madde: "Çalışan temsilcisi Eğitim yazısı", isaret: "VAR" },
        { no: 11, madde: "Çalışan temsilcisi talimatları", isaret: "VAR" },
        { no: 12, madde: "Çalışan temsilcisi test", isaret: "VAR" },
        { no: 13, madde: "Baş Çalışan Temsilcisi yazısı", isaret: "VAR" }
      ]},
      { ad: "Yıllık planlar", maddeler: [
        { no: 14, madde: "Yıllık değerlendirme raporu", isaret: "VAR" },
        { no: 15, madde: "Yıllık çalışma planı", isaret: "GUNCELLENECEK", not: "yeni yönetmeliğe göre güncellenecek" },
        { no: 16, madde: "Yıllı Eğitim planı", isaret: "GUNCELLENECEK", not: "yeni yönetmeliğe göre güncellenecek" }
      ]},
      { ad: "Risk Değerlendirmesi", maddeler: [
        { no: 17, madde: "Risk değerlendirmesi", isaret: "VAR" },
        { no: 18, madde: "Ekip görevlendirmeleri", isaret: "YOK", not: "bilgi sahibi çalışan imzalatılacak" },
        { no: 19, madde: "Risk değerlendirmesi yenileme kayıtları", isaret: "YOK", not: "bilgi sahibi çalışan imzalatılacak" },
        { no: 20, madde: "Tespit edilen riskler", isaret: "VAR" },
        { no: 21, madde: "Alınacak önlemler", isaret: "VAR" },
        { no: 22, madde: "Düzeltici / önleyici faaliyetler", isaret: "VAR" },
        { no: 23, madde: "Revizyon kayıtları", isaret: "VAR" }
      ]},
      { ad: "Acil Durum", maddeler: [
        { no: 24, madde: "Acil durum planı", isaret: "YOK", not: "Çalışan temsilcisi ve destek elemanı şefi imzalayacak" },
        { no: 25, madde: "Acil durum ekipleri", isaret: "YOK", not: "Sayısı yetersiz" },
        { no: 26, madde: "Görevlendirme listeleri", isaret: "YOK", not: "Sayısı yetersiz" },
        { no: 27, madde: "Acil durum krokileri", isaret: "YOK", not: "Kısmen birimlerin var çoğunluk olarak yok" },
        { no: 28, madde: "Kaçış yolları ve toplanma alanı", isaret: "YOK", not: "Kısmen birimlerin var çoğunluk olarak yok" },
        { no: 29, madde: "Acil durum iletişim bilgileri", isaret: "VAR" },
        { no: 30, madde: "Tatbikat kayıtları", isaret: "YOK" },
        { no: 31, madde: "Tatbikat sonuçları ve değerlendirmeler", isaret: "YOK" }
      ]},
      { ad: "Eğitim Dosyası", maddeler: [
        { no: 32, madde: "İSG eğitim planı", isaret: "GUNCELLENECEK", not: "yeni yönetmeliğe göre güncellenecek" },
        { no: 33, madde: "Eğitim katılım tutanakları", isaret: "VAR" },
        { no: 34, madde: "Eğitim içerikleri", isaret: "VAR" },
        { no: 35, madde: "Eğitim değerlendirme kayıtları", isaret: "VAR" },
        { no: 36, madde: "Eğitim sertifikaları / belgeleri", isaret: "KD" },
        { no: 37, madde: "İşe başlama eğitimleri", isaret: "KD" },
        { no: 38, madde: "İlave eğitimler (gerekirse)", isaret: "KD" },
        { no: 39, madde: "Özel eğitim gerektiren çalışanlara ait kayıtlar", isaret: "KD" }
      ]},
      { ad: "Sağlık Gözetimi", maddeler: [
        { no: 40, madde: "İşe giriş sağlık raporları", isaret: "VAR" },
        { no: 41, madde: "Periyodik muayene kayıtları", isaret: "VAR" },
        { no: 42, madde: "Sağlık gözetimine ilişkin kayıtlar", isaret: "VAR" },
        { no: 43, madde: "Yapılan işe / riske göre gerekli tetkik sonuçları", isaret: "VAR" },
        { no: 44, madde: "Özel politika gerektiren çalışanlara ilişkin kayıtlar", isaret: "YOK" }
      ]},
      { ad: "Olay Kayıtları", maddeler: [
        { no: 45, madde: "İş kazası kayıtları", isaret: "VAR" },
        { no: 46, madde: "İş kazası bildirimleri", isaret: "VAR" },
        { no: 47, madde: "Kaza araştırma ve inceleme raporları", isaret: "YOK", not: "personel imza için gelecek" },
        { no: 48, madde: "Kök neden analizleri", isaret: "YOK", not: "personel imza için gelecek" },
        { no: 49, madde: "Ramak kala kayıtları", isaret: "YOK", not: "Ramak kala kayıtları tutulmuyor." },
        { no: 50, madde: "Alınan düzeltici / önleyici faaliyetler", isaret: "VAR" },
        { no: 51, madde: "Takip kayıtları", isaret: "KD", not: "Kaza sonrası personellere İLGİLİ raporlar yapılmalı ve kayıt altına alınmalıdır." }
      ]},
      { ad: "Periyodik Kontroller", maddeler: [
        { no: 52, madde: "Kaldırma ve iletme araçları periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 53, madde: "Basınçlı kaplar periyodik kontrol raporları", isaret: "YOK", not: "Kompresörlerin periyodik kontrolleri yapılmış eksiklerde ilgili daireye bildirilmiştir." },
        { no: 54, madde: "Elektrik tesisatı periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 55, madde: "Topraklama ölçüm / kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 56, madde: "Paratoner kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 57, madde: "Yangın tesisatı ve ekipmanları kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 58, madde: "Havalandırma tesisatı kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 59, madde: "Diğer iş ekipmanlarının periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" }
      ]},
      { ad: "Ölçüm ve Analizler", maddeler: [
        { no: 60, madde: "Gürültü ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 61, madde: "Toz ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 62, madde: "Termal konfor ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 63, madde: "Aydınlatma ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 64, madde: "Titreşim ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 65, madde: "Kimyasal maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 66, madde: "Kişisel maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 67, madde: "Gerekli diğer ölçüm ve analizler", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" }
      ]},
      { ad: "KKD Dosyası", maddeler: [
        { no: 68, madde: "KKD ihtiyaçlarının belirlenmesi", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 69, madde: "KKD teslim / kullanım kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 70, madde: "KKD kullanım eğitimleri", isaret: "VAR", not: "Temel İSG eğitiminde var" },
        { no: 71, madde: "KKD uygunluk belgeleri", isaret: "YOK", not: "İhale sonrası ilgili daire bşk.larına alınan KKDlerin uygun beyanaları dosyaya koyulmalı" },
        { no: 72, madde: "Kullanım ve bakım talimatları", isaret: "YOK", not: "KKDlerin içlerinden bunlarla alakalı birer adet örnek alınmalı" },
        { no: 73, madde: "KKD zimmet kayıtları", isaret: "YOK", not: "Dağıtımdan sonra KKD lerin zimmetlenmesi için ilgili daire bşk.larına yazı yazılmalı" }
      ]},
      { ad: "Talimatlar ve Prosedürler", maddeler: [
        { no: 74, madde: "İş güvenliği talimatları", isaret: "YOK", not: "Daire bşkanlığının tesisleri ziyaret edilecek ve talimatlar hazırlanılacak" },
        { no: 75, madde: "Makine kullanım talimatları", isaret: "YOK", not: "Daire bşkanlığının tesisleri ziyaret edilecek ve talimatlar hazırlanılacak" },
        { no: 76, madde: "İşe özel çalışma talimatları", isaret: "YOK", not: "Daire bşkanlığının tesisleri ziyaret edilecek ve talimatlar hazırlanılacak" },
        { no: 77, madde: "Acil durum talimatları", isaret: "YOK", not: "Daire bşkanlığının tesisleri ziyaret edilecek ve talimatlar hazırlanılacak" },
        { no: 78, madde: "Kimyasal kullanım talimatları", isaret: "YOK", not: "Daire bşkanlığının tesisleri ziyaret edilecek ve talimatlar hazırlanılacak" },
        { no: 79, madde: "Yüksekte çalışma prosedürleri", isaret: "YOK", not: "Daire bşkanlığının tesisleri ziyaret edilecek ve talimatlar hazırlanılacak" },
        { no: 80, madde: "Kapalı alan çalışma prosedürleri", isaret: "YOK", not: "Daire bşkanlığının tesisleri ziyaret edilecek ve talimatlar hazırlanılacak" },
        { no: 81, madde: "Sıcak çalışma prosedürleri", isaret: "YOK", not: "Daire bşkanlığının tesisleri ziyaret edilecek ve talimatlar hazırlanılacak" }
      ]},
      { ad: "Kimyasal Maddeler", maddeler: [
        { no: 82, madde: "Güncel güvenlik bilgi formları (SDS/GBF)", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 83, madde: "Kimyasal envanteri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 84, madde: "Etiketleme kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 85, madde: "Kimyasal depolama kuralları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 86, madde: "Maruziyet değerlendirmeleri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 87, madde: "Kimyasal risklere yönelik eğitim ve talimatlar", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" }
      ]},
      { ad: "İSG Kurulu ve Toplantılar", maddeler: [
        { no: 88, madde: "Kurul oluşturma belgeleri", isaret: "VAR" },
        { no: 89, madde: "Kurul üyeleri ve görevlendirmeler", isaret: "YOK", not: "kurul davet formlarında imza eksik" },
        { no: 90, madde: "Kurul toplantı tutanakları", isaret: "VAR" },
        { no: 91, madde: "Alınan kararlar", isaret: "VAR" },
        { no: 92, madde: "Kararların takip kayıtları", isaret: "VAR" },
        { no: 93, madde: "Yıllık çalışma planı", isaret: "GUNCELLENECEK", not: "yeni yönetmeliğe göre güncellenecek" },
        { no: 94, madde: "Yıllık değerlendirme raporu", isaret: "VAR" }
      ]},
      { ad: "Saha Kontrolleri", maddeler: [
        { no: 95, madde: "Saha gözlem formları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 96, madde: "Tespit ve öneriler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 97, madde: "Uygunsuzluk kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 98, madde: "Fotoğraflı tespitler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 99, madde: "Düzeltici faaliyetler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 100, madde: "Faaliyetlerin kapanış / takip kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 101, madde: "Onaylı defter kayıtları", isaret: "VAR" }
      ]},
      { ad: "Son Kontrol", maddeler: [
        { no: 102, madde: "Risk değerlendirmesi güncel mi?", isaret: "VAR" },
        { no: 103, madde: "Acil durum planı güncel mi?", isaret: "VAR" },
        { no: 104, madde: "Eğitim kayıtları tamam mı?", isaret: "VAR" },
        { no: 105, madde: "Sağlık gözetimleri takip ediliyor mu?", isaret: "VAR" },
        { no: 106, madde: "Periyodik kontrollerin süresi geçmemiş mi?", isaret: "YOK", not: "takip edilmelidir. Eksik varsa yapılmalıdır." },
        { no: 107, madde: "Kaza ve ramak kala kayıtları tutuluyor mu?", isaret: "KD", not: "daire bşk.larında böyle bi evrak tutulmuyor." },
        { no: 108, madde: "Saha tespitleri kapatılıyor mu?", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." }
      ]}
    ]
  },
  {
    kod: "VETERINERLIK-KADROLU", ad: "Veterinerlik Kadrolu — Dosya Kontrol Listesi", kaynak: "İSG Dosya Kontrol Checklisti (Excel: veterinerlik kadrolu.xlsx) · Sayfadaki birim: VETERİNERLİK HİZMETLERİ KADROLU",
    duzenleyen: "Kontrolü yapan: A Sınıfı İş Güvenliği Uzmanı Oğuzhan ÖNAY · İSG uzmanı: B sınıfı İş Güvenliği Uzmanı Rabia Gamze GİRGİN", sicilNo: "",
    isyeriAdi: "Veterinerlik Kadrolu", asilIsveren: "",
    kontrolTarihi: "2026-09-17", sonrakiKontrol: "",
    eslesme: ["Veterinerlik Kadrolu"],
    genelDegerlendirme: "Kontrol özeti (107 madde): 28 var/uygun, 34 eksik, 16 güncellenecek, 29 uygulanamaz.",
    bolumler: [
      { ad: "İşyeri ve İSG Organizasyonu", maddeler: [
        { no: 1, madde: "İşyerine ait temel bilgiler", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 2, madde: "SGK işyeri sicil bilgileri", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 3, madde: "NACE kodu / faaliyet bilgisi", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 4, madde: "Tehlike sınıfı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 5, madde: "Çalışan sayısı", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 6, madde: "İSG profesyonellerinin görevlendirme kayıtları", isaret: "KD", not: "ilk 5 madde hakkında dosyanın ilk başına ilgili sicilde hangi daire bşk.larının olduğu hangi iş kollarında çalışmaların olduğu gibi bir yazı eklenmesi önerilir." },
        { no: 7, madde: "İSG-KATİP sözleşmeleri / görevlendirmeleri", isaret: "VAR" }
      ]},
      { ad: "Çalışan temsilcisi", maddeler: [
        { no: 8, madde: "Çalışan Temsilcisi Atama yazısı", isaret: "VAR" },
        { no: 9, madde: "Çalışan temsilcisi Eğitim yazısı", isaret: "VAR" },
        { no: 10, madde: "Çalışan temsilcisi talimatları", isaret: "VAR" },
        { no: 11, madde: "Çalışan temsilcisi test", isaret: "VAR" },
        { no: 12, madde: "Baş Çalışan Temsilcisi yazısı", isaret: "VAR" }
      ]},
      { ad: "Yıllık planlar", maddeler: [
        { no: 13, madde: "Yıllık değerlendirme raporu", isaret: "VAR" },
        { no: 14, madde: "Yıllık çalışma planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği gereği güncellenmesi gerekmektedir." },
        { no: 15, madde: "Yıllı Eğitim planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği gereği güncellenmesi gerekmektedir." }
      ]},
      { ad: "Risk Değerlendirmesi", maddeler: [
        { no: 16, madde: "Risk değerlendirmesi", isaret: "VAR" },
        { no: 17, madde: "Ekip görevlendirmeleri", isaret: "VAR" },
        { no: 18, madde: "Risk değerlendirmesi yenileme kayıtları", isaret: "VAR" },
        { no: 19, madde: "Tespit edilen riskler", isaret: "VAR" },
        { no: 20, madde: "Alınacak önlemler", isaret: "VAR" },
        { no: 21, madde: "Düzeltici / önleyici faaliyetler", isaret: "VAR" },
        { no: 22, madde: "Revizyon kayıtları", isaret: "VAR" }
      ]},
      { ad: "Acil Durum", maddeler: [
        { no: 23, madde: "Acil durum planı", isaret: "YOK", not: "imza eksik" },
        { no: 24, madde: "Acil durum ekipleri", isaret: "GUNCELLENECEK", not: "diş hekimliklerinden de personel seçilecek" },
        { no: 25, madde: "Görevlendirme listeleri", isaret: "GUNCELLENECEK", not: "diş hekimliklerinden de personel seçilecek" },
        { no: 26, madde: "Acil durum krokileri", isaret: "YOK", not: "acil durum planı yok" },
        { no: 27, madde: "Kaçış yolları ve toplanma alanı", isaret: "GUNCELLENECEK", not: "acil durum planı yok" },
        { no: 28, madde: "Acil durum iletişim bilgileri", isaret: "GUNCELLENECEK", not: "diş hekimliklerinden de personel seçilecek" },
        { no: 29, madde: "Tatbikat kayıtları", isaret: "YOK", not: "tatbikat yok" },
        { no: 30, madde: "Tatbikat sonuçları ve değerlendirmeler", isaret: "YOK", not: "tatbikat yok" }
      ]},
      { ad: "Eğitim Dosyası", maddeler: [
        { no: 31, madde: "İSG eğitim planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği gereği güncellenmesi gerekmektedir." },
        { no: 32, madde: "Eğitim katılım tutanakları", isaret: "VAR" },
        { no: 33, madde: "Eğitim içerikleri", isaret: "VAR" },
        { no: 34, madde: "Eğitim değerlendirme kayıtları", isaret: "VAR" },
        { no: 35, madde: "Eğitim sertifikaları / belgeleri", isaret: "VAR" },
        { no: 36, madde: "İşe başlama eğitimleri", isaret: "KD" },
        { no: 37, madde: "İlave eğitimler (gerekirse)", isaret: "VAR" },
        { no: 38, madde: "Özel eğitim gerektiren çalışanlara ait kayıtlar", isaret: "KD" }
      ]},
      { ad: "Sağlık Gözetimi", maddeler: [
        { no: 39, madde: "İşe giriş sağlık raporları", isaret: "VAR" },
        { no: 40, madde: "Periyodik muayene kayıtları", isaret: "VAR" },
        { no: 41, madde: "Sağlık gözetimine ilişkin kayıtlar", isaret: "VAR" },
        { no: 42, madde: "Yapılan işe / riske göre gerekli tetkik sonuçları", isaret: "VAR" },
        { no: 43, madde: "Özel politika gerektiren çalışanlara ilişkin kayıtlar", isaret: "YOK" }
      ]},
      { ad: "Olay Kayıtları", maddeler: [
        { no: 44, madde: "İş kazası kayıtları", isaret: "KD", not: "iş kazası yok" },
        { no: 45, madde: "İş kazası bildirimleri", isaret: "KD", not: "iş kazası yok" },
        { no: 46, madde: "Kaza araştırma ve inceleme raporları", isaret: "KD", not: "iş kazası yok" },
        { no: 47, madde: "Kök neden analizleri", isaret: "KD", not: "iş kazası yok" },
        { no: 48, madde: "Ramak kala kayıtları", isaret: "KD", not: "iş kazası yok" },
        { no: 49, madde: "Alınan düzeltici / önleyici faaliyetler", isaret: "KD", not: "iş kazası yok" },
        { no: 50, madde: "Takip kayıtları", isaret: "KD", not: "iş kazası yok" }
      ]},
      { ad: "Periyodik Kontroller", maddeler: [
        { no: 51, madde: "Kaldırma ve iletme araçları periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 52, madde: "Basınçlı kaplar periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 53, madde: "Elektrik tesisatı periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 54, madde: "Topraklama ölçüm / kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 55, madde: "Paratoner kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 56, madde: "Yangın tesisatı ve ekipmanları kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 57, madde: "Havalandırma tesisatı kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" },
        { no: 58, madde: "Diğer iş ekipmanlarının periyodik kontrol raporları", isaret: "YOK", not: "İlgili daire bşk.larında yapılması gereken ekipmanlar çıkarılarak daire bşk. Üst yazı ile teslim edilmelidir. (tek yazı yönetmelik yazıp göndermek uygun değilidir.)" }
      ]},
      { ad: "Ölçüm ve Analizler", maddeler: [
        { no: 59, madde: "Gürültü ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 60, madde: "Toz ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 61, madde: "Termal konfor ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 62, madde: "Aydınlatma ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 63, madde: "Titreşim ölçümü", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 64, madde: "Kimyasal maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 65, madde: "Kişisel maruziyet ölçümleri", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" },
        { no: 66, madde: "Gerekli diğer ölçüm ve analizler", isaret: "KD", not: "İlgili daire bşk.larına ortam ölçümlerini yapılması için yazı yazılmalıdır (biz alt işveren olduğumuz için yazmamız yeterlidir.)" }
      ]},
      { ad: "KKD Dosyası", maddeler: [
        { no: 67, madde: "KKD ihtiyaçlarının belirlenmesi", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 68, madde: "KKD teslim / kullanım kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında KKD ihtiyacı olan birimler belirlenmeli ve alınması için dairelere üst yazı yazılmalı." },
        { no: 69, madde: "KKD kullanım eğitimleri", isaret: "VAR", not: "Temel İSG eğitiminde var" },
        { no: 70, madde: "KKD uygunluk belgeleri", isaret: "YOK", not: "İhale sonrası ilgili daire bşk.larına alınan KKDlerin uygun beyanaları dosyaya koyulmalı" },
        { no: 71, madde: "Kullanım ve bakım talimatları", isaret: "YOK", not: "KKDlerin içlerinden bunlarla alakalı birer adet örnek alınmalı" },
        { no: 72, madde: "KKD zimmet kayıtları", isaret: "YOK", not: "Dağıtımdan sonra KKD lerin zimmetlenmesi için ilgili daire bşk.larına yazı yazılmalı" }
      ]},
      { ad: "Talimatlar ve Prosedürler", maddeler: [
        { no: 73, madde: "İş güvenliği talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 74, madde: "Makine kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 75, madde: "İşe özel çalışma talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 76, madde: "Acil durum talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 77, madde: "Kimyasal kullanım talimatları", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 78, madde: "Yüksekte çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 79, madde: "Kapalı alan çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" },
        { no: 80, madde: "Sıcak çalışma prosedürleri", isaret: "YOK", not: "İşe uygun isg talimatları hazırlanmalı. (hazırlandı ise birer örneği dosyaya koyulmalı)" }
      ]},
      { ad: "Kimyasal Maddeler", maddeler: [
        { no: 81, madde: "Güncel güvenlik bilgi formları (SDS/GBF)", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 82, madde: "Kimyasal envanteri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 83, madde: "Etiketleme kayıtları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 84, madde: "Kimyasal depolama kuralları", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 85, madde: "Maruziyet değerlendirmeleri", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" },
        { no: 86, madde: "Kimyasal risklere yönelik eğitim ve talimatlar", isaret: "YOK", not: "İlgili daire bşk.larında kullanılan Kimyasalların SDS formları istenmeli ve dosyalanmalı özellikle kreş ve otizim merkezlerindekiler" }
      ]},
      { ad: "İSG Kurulu ve Toplantılar", maddeler: [
        { no: 87, madde: "Kurul oluşturma belgeleri", isaret: "KD" },
        { no: 88, madde: "Kurul üyeleri ve görevlendirmeler", isaret: "KD" },
        { no: 89, madde: "Kurul toplantı tutanakları", isaret: "KD" },
        { no: 90, madde: "Alınan kararlar", isaret: "KD" },
        { no: 91, madde: "Kararların takip kayıtları", isaret: "KD" },
        { no: 92, madde: "Yıllık çalışma planı", isaret: "GUNCELLENECEK", not: "Yönetmelik değişikliği gereği güncellenmesi gerekmektedir." },
        { no: 93, madde: "Yıllık değerlendirme raporu", isaret: "VAR" }
      ]},
      { ad: "Saha Kontrolleri", maddeler: [
        { no: 94, madde: "Saha gözlem formları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 95, madde: "Tespit ve öneriler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 96, madde: "Uygunsuzluk kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 97, madde: "Fotoğraflı tespitler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 98, madde: "Düzeltici faaliyetler", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 99, madde: "Faaliyetlerin kapanış / takip kayıtları", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." },
        { no: 100, madde: "Onaylı defter kayıtları", isaret: "VAR" }
      ]},
      { ad: "Son Kontrol", maddeler: [
        { no: 101, madde: "Risk değerlendirmesi güncel mi?", isaret: "GUNCELLENECEK", not: "Güncellenmesi önerilir." },
        { no: 102, madde: "Acil durum planı güncel mi?", isaret: "YOK", not: "imza eksik" },
        { no: 103, madde: "Eğitim kayıtları tamam mı?", isaret: "VAR" },
        { no: 104, madde: "Sağlık gözetimleri takip ediliyor mu?", isaret: "VAR" },
        { no: 105, madde: "Periyodik kontrollerin süresi geçmemiş mi?", isaret: "YOK", not: "Herhangi bir periyodik kontrol gerektiren ekipman listesi bulunmamaktadır." },
        { no: 106, madde: "Kaza ve ramak kala kayıtları tutuluyor mu?", isaret: "KD", not: "işyerinde böyle bi uygulama yok" },
        { no: 107, madde: "Saha tespitleri kapatılıyor mu?", isaret: "GUNCELLENECEK", not: "Ayda bir saha gözlem gönderilmesi önerilir." }
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

  /* Word/Excel işaretini uygulama durumuna çevirir: VAR→var, YOK/GÜNCELLENECEK→eksik,
     K-D ve UYGULANAMAZ→yok (kapsam dışı). Boş işaret incelenmedi kalır. */
  ISG.listeDurumKod = function (isaret) {
    var deger = String(isaret || '').toUpperCase();
    if (deger === 'VAR') { return 'var'; }
    if (deger === 'YOK' || deger === 'GUNCELLENECEK') { return 'eksik'; }
    if (deger === 'KD' || deger === 'K/D' || deger === 'UYGULANAMAZ') { return 'yok'; }
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

  /* İşyerine uygulanmış hazır listelerin özeti: hangi şablondan kaç madde
     üretilmiş, bölümlere nasıl dağılmış. "Listeyi geri al" ekranı bu özeti
     kullanır; yanlış işyerine/bölüme eklenen liste tek tek sayılmaz. */
  ISG.listeUygulananOzeti = function (dosyalar) {
    var gruplar = Object.create(null);
    var siralar = [];
    (dosyalar || []).forEach(function (dosya) {
      var kod = dosya && dosya.sablon;
      if (!kod) { return; }
      var ozet = gruplar[kod];
      if (!ozet) {
        ozet = gruplar[kod] = {
          kod: kod,
          ad: (ISG.listeSablonBul(kod) || {}).ad || kod,
          adet: 0,
          bolumler: Object.create(null),
          bolumSirasi: []
        };
        siralar.push(ozet);
      }
      ozet.adet += 1;
      var bolum = dosya.bolum || "Bölüm belirtilmemiş";
      if (!ozet.bolumler[bolum]) {
        ozet.bolumler[bolum] = { ad: bolum, adet: 0 };
        ozet.bolumSirasi.push(bolum);
      }
      ozet.bolumler[bolum].adet += 1;
    });
    siralar.forEach(function (ozet) {
      ozet.bolumler = ozet.bolumSirasi.map(function (ad) { return ozet.bolumler[ad]; });
      delete ozet.bolumSirasi;
    });
    return siralar;
  };

  ISG.KONTROL_LISTESI_SABLONLARI = SABLONLAR;})(window);
