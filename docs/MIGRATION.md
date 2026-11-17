# Eski uygulamadan React'a taşıma planı

Kaynak: `docs/legacy/index.html` (4052 satır, ~280 fonksiyon). Veri (TürKomp) ayrıldı: `src/data/turkomp.json`.
Kayıtlar tarayıcıda (localStorage) tutulacak. Eski `window.claude.db` çağrıları `src/lib/storage.ts` arkasına alınır.
Site şimdilik **herkese açık değil**: otomatik yayın kapalı, `npm run dev` ile yerelde test edilir.

| Aşama | Modül | Eski kod (satır) | Durum |
|---|---|---|---|
| 1 | Besinler (arama, grup, sıralama) | 971-1027 | yapıldı (temel; değer sütunu seçimi, filtre, kopyalama yok) |
| 2 | Hesaplama (BMH, makro, yaş kuralları, koşullar) | 749-870 | BMH/makro/uyarılar yapıldı; hastalık ve yaş kuralları (besin uygunluğu) bekliyor |
| 3 | Danışan listesi ve dosyası, anamnez, tahlil, antropometri | 1654-2000 | bekliyor |
| 4 | Menü, ev ölçüleri, değişim, şablonlar | 1121-1500, 2799 | menü + ev ölçüleri + 5 şablon + kendi şablonum yapıldı; öğün değişimi (swap) yapıldı; besin eş anlamlıları bekliyor |
| 5 | Randevu ve seans takibi | 1988-2062 | bekliyor |
| 6 | PDF/yazdırma, klinik markası, KVKK | 2214-2410 | bekliyor |
| 7 | Danışan portalı, talepler, giriş/roller | 2636-3300 | bekliyor (yerel taklit) |
| 8 | Yönetici paneli | 3709-3990 | bekliyor |

Eski sürümde claude.ai'ye özgü olan (db yetenekleri, uçtan uca şifreleme, çok hesaplı giriş)
statik sitede anlamlı değil; 7 ve 8. aşamada tek tarayıcıda çalışan basit bir taklit düşünülecek.