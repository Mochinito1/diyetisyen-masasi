/** Hesap kuralları: giriş modundan bağımsız saf yardımcılar */
export const normUser = (u: string) => u.trim().toLowerCase()
export const userError = (u: string) =>
  /^[a-z0-9._-]{3,20}$/.test(u) ? '' : 'Kullanıcı adı 3-20 karakter olmalı; yalnızca harf, rakam, nokta, alt çizgi ve tire.'
export const pwError = (p: string, p2: string) => (p.length < 8 ? 'Şifre en az 8 karakter olmalı.' : p !== p2 ? 'Şifreler aynı değil.' : '')
export const withTitle = (a: { ad: string; unvan?: string }) => (a.unvan ? `${a.unvan} ${a.ad}` : a.ad)
export const cleanName = (s: string) => s.trim().replace(/\s+/g, ' ')
