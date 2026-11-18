/** localStorage için basit, güvenli okuma/yazma */
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

let onSave: ((key: string) => void) | null = null
/** Bulut eşitlemesi: her başarılı kayıttan sonra çağrılır */
export function setSaveListener(fn: ((key: string) => void) | null) { onSave = fn }

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    onSave?.(key)
  } catch {
    /* kota dolu ya da gizli sekme: sessizce geç */
  }
}