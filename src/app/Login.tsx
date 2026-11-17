import { useState } from 'react'
import { useAuth } from './auth'
import { DEMO, type AccountKind } from '../lib/auth'

type Mode = 'login' | 'create' | 'forgot'
const field = 'mt-1 w-full rounded-[7px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-[15px] focus:border-brand-500 focus:outline-none'

/** Giriş, hesap oluşturma ve şifre yenileme ekranı */
export default function Login() {
  const auth = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [v, setV] = useState({ u: '', p: '', p2: '', ad: '', kind: 'diyetisyen' as AccountKind })
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof v, x: string) => setV((prev) => ({ ...prev, [k]: x }))

  const go = (m: Mode) => { setMode(m); setErr(''); setMsg(''); setV((prev) => ({ ...prev, p: '', p2: '' })) }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setErr(''); setMsg(''); setBusy(true)
    try {
      if (mode === 'login') {
        const r = await auth.login(v.u, v.p)
        if (r) setErr(r)
      } else if (mode === 'create') {
        const r = await auth.register({ u: v.u, ad: v.ad, p: v.p, p2: v.p2, kind: v.kind })
        if (r) setErr(r)
      } else {
        const r = await auth.reset({ u: v.u, ad: v.ad, p: v.p, p2: v.p2 })
        if (r) setErr(r)
        else { setMode('login'); setMsg('Şifreniz yenilendi. Yeni şifrenizle giriş yapın.'); setV((prev) => ({ ...prev, p: '', p2: '' })) }
      }
    } finally { setBusy(false) }
  }

  const input = (id: keyof typeof v, label: string, type = 'text', ac = 'off') => (
    <label className="block text-left text-xs font-semibold text-stone-500">{label}
      <input className={field} type={type} autoComplete={ac} value={v[id]} onChange={(e) => set(id, e.target.value)} />
    </label>
  )

  return (
    <div className="grid min-h-screen place-items-center bg-stone-50 p-4">
      <form onSubmit={submit} className="w-full max-w-[420px] rounded-xl border border-stone-200 bg-white p-6 text-center shadow-sm">
        <h1 className="font-display text-[28px] font-bold leading-tight">Diyetisyen Masası</h1>
        <p className="mb-4 mt-1 text-xs text-stone-500">
          {mode === 'login' ? 'Hesabınızla giriş yapın' : mode === 'create' ? 'Yeni hesap oluşturun' : 'Şifrenizi yenileyin'}
        </p>

        <div className="space-y-3">
          {mode === 'login' && <>{input('u', 'Kullanıcı adı', 'text', 'username')}{input('p', 'Şifre', 'password', 'current-password')}</>}
          {mode === 'create' && (
            <>
              {input('ad', 'Ad soyad', 'text', 'name')}
              {input('u', 'Kullanıcı adı (3-20 harf, rakam, . _ -)', 'text', 'username')}
              <div className="text-left text-xs font-semibold text-stone-500">Hesap türü
                <div className="mt-1 flex overflow-hidden rounded-[7px] border border-stone-300">
                  {([['diyetisyen', 'Diyetisyen'], ['danisan', 'Danışan']] as const).map(([k, l]) => (
                    <button key={k} type="button" aria-pressed={v.kind === k} onClick={() => set('kind', k)} className={`flex-1 py-2 text-sm font-semibold ${v.kind === k ? 'bg-brand-500 text-white' : 'bg-stone-50 text-stone-600'}`}>{l}</button>
                  ))}
                </div>
              </div>
              {input('p', 'Şifre (en az 8 karakter)', 'password', 'new-password')}
              {input('p2', 'Şifre tekrar', 'password', 'new-password')}
            </>
          )}
          {mode === 'forgot' && (
            <>
              {input('u', 'Kullanıcı adı', 'text', 'username')}
              {input('ad', 'Hesabı açarken yazdığınız ad soyad', 'text', 'name')}
              {input('p', 'Yeni şifre (en az 8 karakter)', 'password', 'new-password')}
              {input('p2', 'Yeni şifre tekrar', 'password', 'new-password')}
            </>
          )}
        </div>

        {err && <div role="alert" className="mt-3 rounded-lg bg-red-100 p-3 text-left text-sm text-red-800">{err}</div>}
        {msg && <div role="status" className="mt-3 rounded-lg bg-emerald-100 p-3 text-left text-sm text-emerald-800">{msg}</div>}

        <button type="submit" disabled={busy} className="mt-4 w-full rounded-[7px] bg-brand-500 py-3 text-[15px] font-semibold text-white hover:brightness-110 disabled:opacity-60">
          {busy ? 'Bekleyin…' : mode === 'login' ? 'Giriş yap' : mode === 'create' ? 'Hesap oluştur' : 'Şifreyi yenile'}
        </button>

        <div className="mt-3 flex justify-between gap-3 text-sm">
          {mode === 'login' ? (
            <>
              <button type="button" className="text-brand-500 underline" onClick={() => go('create')}>Hesap oluştur</button>
              <button type="button" className="text-brand-500 underline" onClick={() => go('forgot')}>Şifremi unuttum</button>
            </>
          ) : <button type="button" className="text-brand-500 underline" onClick={() => go('login')}>Girişe dön</button>}
        </div>

        {mode === 'login' && (
          <details className="mt-4 border-t border-stone-200 pt-3 text-left text-sm">
            <summary className="cursor-pointer font-semibold">Demo hesaplar</summary>
            <div className="mt-2 text-[13px]">
              <b>Diyetisyen:</b> {DEMO.dyt[0]} / {DEMO.dyt[1]}<br />
              <b>Danışan:</b> {DEMO.dan[0]} / {DEMO.dan[1]}<br />
              <b>Yönetici:</b> {DEMO.adm[0]} / {DEMO.adm[1]}
              <p className="mt-2 text-stone-500">Yönetici hesabı ayrıca “şu rol olarak görüntüle” ile diyetisyen ve danışan ekranlarına geçebilir.</p>
            </div>
          </details>
        )}
        <p className="mt-4 text-xs text-stone-500">Eğitim sürümü: hesaplar ve veriler yalnızca bu tarayıcıda saklanır, şifre hiçbir yere gönderilmez. Gerçek danışan verisi girmeyin.</p>
      </form>
    </div>
  )
}