# Eski uygulamadan React'a taşıma planı

Kaynak: `docs/legacy/index.html` (4052 satır, ~280 fonksiyon; claude.ai'deki "Diyetisyen Masası" artifact'ı).
Hedef: eski uygulamadaki **tüm özellikler**. Veri (TürKomp) ayrıldı: `src/data/turkomp.json`.
Kayıtlar tarayıcıda (localStorage) tutulur; eski `window.claude.db` çağrıları statik sitede karşılığı olmadığı için yerel taklitle değiştirilir.
Site şimdilik **herkese açık değil**: otomatik yayın kapalı, `npm run dev` ile yerelde test edilir.

Durum: ✅ yapıldı · 🟡 kısmen · ⬜ bekliyor

## Diyetisyen paneli

| Özellik | Eski kod (satır) | Durum |
|---|---|---|
| Hesaplama: BMH (Mifflin, Harris, Schofield), TDEE, hedef, makro, sodyum, uyarılar | 749-870 | ✅ |
| Yaş kuralları ve hastalık/diyet seçimi, besin uygunluğu (gizle/uyar) | 600-870 | ⬜ |
| Besinler tablosu: arama, grup, sıralama | 971-1027 | 🟡 |
| Besinler: değer sütunu seçimi, değer filtresi, miktar (g), listeyi kopyala, besin detay penceresi | 960-1120 | ⬜ |
| Danışan listesi, kayıt, düzenleme, silme, arama, sıralama | 1654-1830 | ✅ |
| Danışan dosyası: anamnez, tahlil (referans bayrakları), antropometri geçmişi ve grafik, seans notları | 1841-1960 | ⬜ |
| Ana sayfa: kısayollar, son danışanlar, örnek danışan yükleme | 1802-1840 | 🟡 (kısayollar var) |
| Menü: besin ekle, ev ölçüleri, öğünler, hedef çubukları, uyarılar, mikro tablo, not, kopyala | 1121-1310 | ✅ |
| Menü: öğün değişimi (swap) | 1310-1362 | ✅ |
| Menü: şablonlar (5 hazır), kaloriye ölçekleme, kendi şablonum | 1364-1491, 2115-2135 | ✅ |
| Besin arama eş anlamlıları (tavuk → piliç eti ...) | SYN_RAW | ⬜ |
| PDF / yazdırma, klinik markası (logo, ad), paylaşım | 2214-2410 | ⬜ |
| KVKK aydınlatma ve rıza metinleri | 2139-2183 | ⬜ |
| Randevu: takvim, gün listesi, ekle, onayla/reddet, geldi/gelmedi/iptal, çalışma saatleri, 14 gün | 1988-2062 | ✅ |
| Randevu: WhatsApp/SMS hatırlatma mesajı, "uzun süredir gelmeyenler" | 1992-2002, 2056 | ⬜ |
| Danışan aktarımı, besin ekle/gizle | 3288-3460 | ⬜ |

## Danışan portalı

| Özellik | Eski kod | Durum |
|---|---|---|
| Randevu: takvimden gün ve saat, talep, 24 saat kuralı, iptal | 3086-3140 | ✅ |
| Onboarding (ilk giriş), Profil (hedefler salt okunur, antropometri takibi) | 2923-3050 | ⬜ |
| Menü: öğün "Yedim" tiki, su takibi, diyetisyen son 7 günü görür | 3062-3086 | ⬜ |
| Ayarlar çekmecesi: diyetisyen seçme, KVKK onayı, diyetisyen değiştirme, şifre | 3582-3640 | ⬜ |
| Başvuru (diyetisyen olmak isteyen) | 3787-3830 | ⬜ |

## Yönetici paneli

| Özellik | Eski kod | Durum |
|---|---|---|
| Diyetisyenler / danışanlar listesi, rol değiştirme | 3709-3770 | ⬜ |
| Başvurular: onayla / reddet | 3769-3830 | ⬜ |
| Besin dosyası içe aktarma (xlsx) | 3826-3926 | ⬜ |
| Hesap silme | 3927-3990 | ⬜ |

## Altyapı

| Özellik | Durum |
|---|---|
| Karanlık / açık tema | ✅ |
| Rol geçişi (Yönetici / Diyetisyen / Danışan), test modu | ✅ |
| Gerçek giriş (kullanıcı adı + şifre), hesaplar | ⬜ (yerel taklit düşünülecek) |
| Uçtan uca şifreleme, çok hesaplı paylaşım | gerekmiyor: statik sitede veri zaten tarayıcıda kalır |
| Dışa / içe aktarma (JSON yedek) | ⬜ |