import { useState } from 'react'
import { useAuth } from '../../app/auth'
import { btnPrimary, card, field } from '../../components/ui/styles'
import { changePassword } from '../../lib/auth'

/** Şifre değişikliği: mevcut şifre doğrulanır, yeni şifre en az 8 karakter olmalı */
export default function PasswordCard() {
  const { session } = useAuth()
  const [v, setV] = useState({ current: '', p: '', p2: '' })
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof v, x: string) => setV((prev) => ({ ...prev, [k]: x }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy || !session) return
    setErr(''); setMsg(''); setBusy(true)
    try {
      const r = await changePassword({ u: session.u, ...v })
      if (r.ok) { setMsg('Şifreniz değiştirildi.'); setV({ current: '', p: '', p2: '' }) } else setErr(r.error)
    } finally { setBusy(false) }
  }

  const input = (k: keyof typeof v, label: string, ac: string) => (
    <label className="block text-sm font-semibold">{label}
      <input className={`${field} mt-1 w-full font-normal`} type="password" autoComplete={ac} value={v[k]} onChange={(e) => set(k, e.target.value)} />
    </label>
  )

  return (
    <form onSubmit={submit} className={card}>
      <h2 className="font-display text-lg font-bold">Şifre Değişikliği</h2>
      <div className="mt-3 space-y-3">
        {input('current', 'Mevcut şifre', 'current-password')}
        {input('p', 'Yeni şifre (en az 8 karakter)', 'new-password')}
        {input('p2', 'Yeni şifre tekrar', 'new-password')}
      </div>
      {err && <div role="alert" className="mt-3 rounded-lg bg-red-100 p-3 text-sm text-red-800">{err}</div>}
      {msg && <div role="status" className="mt-3 rounded-lg bg-emerald-100 p-3 text-sm text-emerald-800">{msg}</div>}
      <button type="submit" disabled={busy || !v.current || !v.p} className={`${btnPrimary} mt-3`}>{busy ? 'Bekleyin…' : 'Şifreyi değiştir'}</button>
    </form>
  )
}