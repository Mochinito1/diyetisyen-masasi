/**
 * Supabase bağlantısı. Proje URL'si ve "anon (public)" anahtar herkese açık olacak şekilde tasarlanmıştır;
 * veriyi koruyan şey supabase/schema.sql içindeki satır düzeyi güvenlik kurallarıdır (RLS). "service_role" anahtarını ASLA buraya yazmayın.
 * Boş bırakılırsa uygulama eski yerel (tarayıcıda saklanan) modda çalışır.
 */
export const SUPABASE_URL = ''
export const SUPABASE_ANON_KEY = ''
