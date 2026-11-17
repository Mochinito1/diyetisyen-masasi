# Eski uygulamadan React'a taşıma planı

Kaynak: `docs/legacy/index.html` (claude.ai'deki "Diyetisyen Masası" artifact'ı, 4052 satır).
Hedef: eski uygulamadaki tüm özellikler. Kayıtlar tarayıcıda (localStorage) tutulur; eski `window.claude.db` çağrıları
statik sitede karşılığı olmadığı için yerel taklitle değiştirildi.
Site şimdilik **herkese açık değil**: otomatik yayın kapalı, `npm run dev` ile yerelde test edilir.

Durum: ✅ yapıldı · 🟡 farklı biçimde · ⬜ yapılmadı

## Diyetisyen paneli

| Özellik | Durum |
|---|---|
| Hesaplama: BMH (Mifflin, Harris, Schofield), TDEE, hedef, makro, sodyum, uyarılar | ✅ |
| Hastalık/alerji/diyet seçimi (20 koşul), yaş kuralları, gebelik otomatiği, besin uygunluğu (gizle/uyar/öne çıkar) | ✅ |
| Besinler: arama (eş anlamlılı), grup, sıralama, değer sütunu seçimi ve hazır setler, değer filtresi, miktar, kopyala, ayrıntı penceresi, menüye ekle, listeden kaldır/geri al | ✅ |
| Danışan listesi, kayıt, düzenleme, silme, arama, sıralama, son görüşme | ✅ |
| Danışan dosyası: anamnez, tahlil (bayraklı), antropometri geçmişi + grafik + CSV içe aktarma, seans notları, genel not | ✅ |
| KVKK: aydınlatma metni okuma/onay, açık rıza kaydı, metin şablonları | ✅ |
| Menü: besin ekle, ev ölçüleri, öğünler, hedef çubukları, uyarılar, mikro tablo, not, kopyala | ✅ |
| Menü: öğün değişimi (swap), 5 hazır şablon + kaloriye ölçekleme, kendi şablonum | ✅ |
| PDF / yazdırma (klinik logosu, rengi, alt not) | 🟡 tarayıcının yazdır penceresi, "PDF olarak kaydet" ile |
| Klinik markası, mesaj şablonları (WhatsApp / SMS / kopyala) | ✅ |
| Randevu: gün/hafta/ay görünümü, ekle, onayla/reddet, geldi/gelmedi/iptal, çalışma saatleri, 14 gün, hatırlatma mesajı, uzun süredir gelmeyenler | ✅ |
| Danışan portalı kartı: son 7 gün öğün ve su takibi | ✅ |
| Ana sayfa: özet kartlar, son danışanlar, örnek danışan | ✅ |
| Danışan aktarımı (diyetisyen hesapları arası) | ⬜ tek diyetisyenli yerel sürümde anlamsız |

## Danışan portalı

| Özellik | Durum |
|---|---|
| Randevu: takvimden gün ve saat, talep, 24 saat kuralı, iptal | ✅ |
| İlk giriş (onboarding), profil, hedefler salt okunur, antropometri takibi | ✅ |
| Menü: öğün "Yedim" tiki, su takibi (8 bardak), diyetisyen notu | ✅ |
| Ayarlar: kişisel bilgiler, hastalık/diyet seçimi, KVKK onayı | ✅ |
| Diyetisyen olmak için başvuru | ✅ |
| Diyetisyen seçme / değiştirme | ⬜ tek diyetisyen |
| Şifre, gerçek giriş | ⬜ rol geçişi (test modu) ile karşılandı |

## Yönetici paneli

| Özellik | Durum |
|---|---|
| Diyetisyenler / danışanlar listesi, "hesabına gir" | ✅ |
| Başvurular: onayla / reddet | ✅ |
| Besin dosyası: besin ekle ve CSV içe aktarma | 🟡 eski sürümde xlsx; burada CSV |
| Hesap sil | ✅ |

## Altyapı

| Özellik | Durum |
|---|---|
| Karanlık / açık tema | ✅ |
| Telefon, tablet, masaüstü (duyarlı düzen) | ✅ |
| Rol geçişi (Yönetici / Diyetisyen / Danışan), test modu | ✅ |
| JSON yedek alma ve geri yükleme | ✅ |
| Uçtan uca şifreleme, çok hesaplı paylaşım | ⬜ gerekmiyor: veri zaten tarayıcıda kalır |
| Pişmiş besin değerleri (TürKomp'ta yok) | ⬜ veri sınırı |