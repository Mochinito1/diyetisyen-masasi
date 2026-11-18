/** Tüm uygulama verisi (localStorage "dm." anahtarları) tek JSON dosyası olarak dışa/içe aktarılır. */
const PREFIX = 'dm.'
/** Diyetisyen yedeğine hiçbir zaman girmeyen anahtarlar: başkalarının hesapları ve oturum bilgisi */
const PRIVATE = ['dm.accounts', 'dm.applications', 'dm.session', 'dm.impRole', 'dm.accountsReset']
const DEMO_OWNER = 'diyetisyen'
const clientOwner = (c: { dietitian?: string }) => (c.dietitian === undefined ? DEMO_OWNER : c.dietitian)

/**
 * Yedek dosyası. `owner` verilirse (diyetisyen hesabı) yalnızca o diyetisyenin danışanları ve randevuları ile kendi ayarları girer;
 * başka diyetisyenlerin danışan verisi ve hesaplar yedeğe sızmaz.
 */
export function exportData(owner?: string): string {
  const data: Record<string, unknown> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!
    if (!k.startsWith(PREFIX)) continue
    if (owner && (PRIVATE.includes(k) || (k.startsWith('dm.brand.') && k !== `dm.brand.${owner}`) || (k.startsWith('dm.availability.') && k !== `dm.availability.${owner}`))) continue
    let v: unknown
    try { v = JSON.parse(localStorage.getItem(k)!) } catch { v = localStorage.getItem(k) }
    if (owner && k === 'dm.clients' && Array.isArray(v)) v = v.filter((c: { dietitian?: string }) => clientOwner(c) === owner)
    if (owner && k === 'dm.appointments' && Array.isArray(v)) {
      const mine = new Set(((data['dm.clients'] ?? JSON.parse(localStorage.getItem('dm.clients') ?? '[]')) as { id: string; dietitian?: string }[]).filter((c) => clientOwner(c) === owner).map((c) => c.id))
      v = v.filter((a: { clientId: string; dietitian?: string }) => (a.dietitian ?? DEMO_OWNER) === owner && mine.has(a.clientId))
    }
    data[k] = v
  }
  return JSON.stringify({ app: 'diyetisyen-masasi', version: 1, exported: new Date().toISOString(), data }, null, 2)
}

/**
 * Yedeği geri yükler. Yönetici: mevcut "dm." verisinin üzerine yazar. Diyetisyen (`owner`): yalnızca kendi danışan/randevu kayıtlarını
 * mevcut verilerle birleştirir ve kendi ayarlarını geri alır; başkalarının verisine ve hesaplara dokunamaz.
 */
export function importData(text: string, owner?: string): { ok: true; keys: number } | { ok: false; error: string } {
  let obj: { app?: string; data?: Record<string, unknown> }
  try { obj = JSON.parse(text) } catch { return { ok: false, error: 'Dosya okunamadı (geçerli bir JSON değil).' } }
  if (obj.app !== 'diyetisyen-masasi' || !obj.data || typeof obj.data !== 'object') return { ok: false, error: 'Bu dosya Diyetisyen Masası yedeği değil.' }
  const entries = Object.entries(obj.data).filter(([k]) => k.startsWith(PREFIX))
  let n = 0
  for (const [k, v] of entries) {
    if (!owner) { localStorage.setItem(k, JSON.stringify(v)); n++; continue }
    if (PRIVATE.includes(k) || (k.startsWith('dm.brand.') && k !== `dm.brand.${owner}`) || (k.startsWith('dm.availability.') && k !== `dm.availability.${owner}`)) continue
    if ((k === 'dm.clients' || k === 'dm.appointments') && Array.isArray(v)) {
      const cur: { id: string; dietitian?: string }[] = (() => { try { return JSON.parse(localStorage.getItem(k) ?? '[]') } catch { return [] } })()
      const mineIn = (v as { id: string; dietitian?: string }[]).filter((x) => (k === 'dm.clients' ? clientOwner(x) : x.dietitian ?? DEMO_OWNER) === owner)
      const ids = new Set(mineIn.map((x) => x.id))
      // Aynı kimlik başka birine aitse üzerine yazılmaz
      const others = cur.filter((x) => !ids.has(x.id) || (k === 'dm.clients' ? clientOwner(x) : x.dietitian ?? DEMO_OWNER) !== owner)
      const keepIds = new Set(others.map((x) => x.id))
      localStorage.setItem(k, JSON.stringify([...others, ...mineIn.filter((x) => !keepIds.has(x.id) || !others.some((o) => o.id === x.id))]))
      n++
      continue
    }
    localStorage.setItem(k, JSON.stringify(v)); n++
  }
  return { ok: true, keys: n }
}