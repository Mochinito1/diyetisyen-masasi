# Supabase kurulumu

Site GitHub Pages'te kalır; hesaplar ve veriler Supabase'te (PostgreSQL) saklanır. Böylece aynı hesapla telefondan da bilgisayardan da girilir.

## Mimari

- **Giriş:** Supabase Auth (e-posta + şifre). Kullanıcı adından geçerli bir e-posta türetilir (`u<hex>@diyetisyen-masasi.app`); gerçek e-posta gerekmez, e-posta gönderilmez.
- **Tablolar:** `profiles` (hesaplar), `applications` (diyetisyen başvuruları), `clients` (danışan kaydı, JSON), `appointments`, `settings` (klinik bilgileri ve çalışma saatleri).
- **Güvenlik (RLS):** Kurallar [supabase/schema.sql](../supabase/schema.sql) içindedir.
  - Danışan kaydını yalnızca **danışanın kendisi**, **seçtiği diyetisyen** ve **yönetici** okuyup yazabilir.
  - Randevuları aynı kişiler görür. Danışan, seçtiği diyetisyenin dolu saatlerini isim/not olmadan görür (`appointment_slots` görünümü).
  - Diyetisyen başvurusu `pending` açılır; yönetici onaylayana kadar giriş yapılamaz. Kimse kendini yönetici yapamaz.
- **Eşitleme:** Uygulama kodu eskisi gibi tarayıcıdaki `dm.*` anahtarlarını kullanır. Girişte sunucudaki (kuralla süzülmüş) veri indirilir, kayıtlar 0,4 sn içinde sunucuya gönderilir. Başka cihazdaki değişiklik, sayfa yenilenince görünür. Aynı kaydı iki cihazdan aynı anda değiştirirseniz son kaydeden kazanır.
- **Cihazda kalanlar:** Besin dosyası eklemeleri, kaldırılan besinler, menü şablonları, tema gibi tercihler cihaza özeldir.

## Adımlar

1. <https://supabase.com> → **New project** (bölge: Frankfurt). Veritabanı şifresini kaydedin.
2. **Authentication → Sign In / Providers → Email**: **Confirm email** seçeneğini **kapatın**. (Kapatılmazsa hesap açılamaz.)
3. **SQL Editor** → [supabase/schema.sql](../supabase/schema.sql) dosyasının tamamını yapıştırıp **Run**. Tekrar çalıştırmak güvenlidir.
4. **Project Settings → API**: **Project URL** ve **anon public** anahtarını alın ve [src/lib/supabaseConfig.ts](../src/lib/supabaseConfig.ts) dosyasına yazın.
   - Anon anahtar herkese açık olacak şekilde tasarlanmıştır; veriyi RLS kuralları korur.
   - **`service_role` anahtarını asla repoya yazmayın.**
5. Siteden normal bir hesap açın (örn. kullanıcı adı `yonetici`), sonra **SQL Editor**'da yönetici yapın:

   ```sql
   update public.profiles set kind = 'admin', client_id = null where username = 'yonetici';
   delete from public.clients where owner_user = (select id from public.profiles where username = 'yonetici');
   ```

6. Çıkış yapıp `yonetici` ile yeniden girin: Yönetim sekmesi açılır.

## Notlar

- "Şifremi unuttum", kullanıcı adı ve ad soyad eşleşirse şifreyi yeniler (`reset_password` fonksiyonu). E-posta doğrulaması olmadığı için eğitim sürümüne özgü, zayıf bir yöntemdir; gerçek kullanımda e-posta bağlantısı kullanın.
- Yönetici bir hesabı sildiğinde (`admin_delete_user`) kullanıcı ve danışan kaydı sunucudan kalıcı olarak silinir; aynı kullanıcı adıyla yeniden hesap açılabilir.
- Gerçek danışan sağlık verisi için KVKK'ya uygun, Türkiye'de barındırılan bir sistem gerekir. Bu proje eğitim amaçlıdır.

## Pasife alma (yönetici)

Yönetim → Diyetisyenler listesinde her diyetisyenin yanında **Pasife al / Aktif et** düğmesi vardır. Pasife alınan diyetisyen danışanların listesinde görünmez ve giriş yapamaz; aktif edilince her şey eskisi gibi döner. Bu özellik için Supabase'de şemanın bir kez güncellenmesi gerekir: `supabase/schema.sql` dosyasının en altındaki iki `alter table` satırını SQL Editor'da çalıştırın (tekrar çalıştırmak güvenlidir).
