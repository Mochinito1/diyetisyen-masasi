/** Tüm uygulama verisi (localStorage "dm." anahtarları) tek JSON dosyası olarak dışa/içe aktarılır. */
const PREFIX = 'dm.'

export function exportData(): string {
  const data: Record<string, unknown> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!
    if (!k.startsWith(PREFIX)) continue
    try { data[k] = JSON.parse(localStorage.getItem(k)!) } catch { data[k] = localStorage.getItem(k) }
  }
  return JSON.stringify({ app: 'diyetisyen-masasi', version: 1, exported: new Date().toISOString(), data }, null, 2)
}

/** Yedeği geri yükler; mevcut "dm." verisinin üzerine yazar. Geçersizse hata mesajı döner. */
export function importData(text: string): { ok: true; keys: number } | { ok: false; error: string } {
  let obj: { app?: string; data?: Record<string, unknown> }
  try { obj = JSON.parse(text) } catch { return { ok: false, error: 'Dosya okunamadı (geçerli bir JSON değil).' } }
  if (obj.app !== 'diyetisyen-masasi' || !obj.data || typeof obj.data !== 'object') return { ok: false, error: 'Bu dosya Diyetisyen Masası yedeği değil.' }
  const entries = Object.entries(obj.data).filter(([k]) => k.startsWith(PREFIX))
  for (const [k, v] of entries) localStorage.setItem(k, JSON.stringify(v))
  return { ok: true, keys: entries.length }
}