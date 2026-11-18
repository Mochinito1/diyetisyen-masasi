import { useState } from 'react'
import Modal from '../components/ui/Modal'
import { kvkkAydinlatma, kvkkRiza } from '../lib/brand'
import { DEMO_DIETITIAN } from '../lib/dietitians'
import { loadBrandOf } from '../features/settings/useBrand'
import { cloudEnabled } from '../lib/cloud'
import { useAuth } from './auth'

type Mode = 'login' | 'create' | 'forgot' | 'apply'
const field = 'mt-1 w-full rounded-[7px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-[15px] focus:border-brand-500 focus:outline-none'
const EMPTY = { u: '', p: '', p2: '', ad: '', title: '', note: '' }

const SUBTITLE: Record<Mode, string> = {
  login: 'Hesabınızla giriş yapın',
  create: 'Yeni hesap oluşturun',
  forgot: 'Şifrenizi yenileyin',
  apply: 'Diyetisyen başvurusu',
}
const SUBMIT: Record<Mode, string> = { login: 'Giriş yap', create: 'Hesap oluştur', forgot: 'Şifreyi yenile', apply: 'Başvuruyu gönder' }

/** Giriş, hesap oluşturma, şifre yenileme ve diyetisyen başvurusu ekranı */
export default function Login() {
  const auth = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [v, setV] = useState(EMPTY)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [kvkk, setKvkk] = useState(false)
  const [riza, setRiza] = useState(false)
  const [read, setRead] = useState<'kvkk' | 'riza' | null>(null)
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
        const r = await auth.register({ u: v.u, ad: v.ad, p: v.p, p2: v.p2, kvkk, riza })
        if (r) setErr(r)
      } else if (mode === 'apply') {
        const r = await auth.apply({ u: v.u, ad: v.ad, p: v.p, p2: v.p2, title: v.title, note: v.note })
        if (r) setErr(r)
        else { setMode('login'); setMsg('Başvurunuz alındı. Yönetici onayladığında bu kullanıcı adı ve şifreyle giriş yapabilirsiniz.'); setV({ ...EMPTY, u: v.u }) }
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
        <p className="mb-4 mt-1 text-xs text-stone-500">{SUBTITLE[mode]}</p>

        <div className="space-y-3">
          {mode === 'login' && <>{input('u', 'Kullanıcı adı', 'text', 'username')}{input('p', 'Şifre', 'password', 'current-password')}</>}
          {mode === 'create' && (
            <>
              {input('ad', 'Ad soyad', 'text', 'name')}
              {input('u', 'Kullanıcı adı (3-20 harf, rakam, . _ -)', 'text', 'username')}
              {input('p', 'Şifre (en az 8 karakter)', 'password', 'new-password')}
              {input('p2', 'Şifre tekrar', 'password', 'new-password')}
              <div className="space-y-2 rounded-lg bg-stone-100 p-3">
                <p className="text-left text-xs text-stone-500">Onay kutuları, metni açıp “Okudum, onaylıyorum” dedikten sonra işaretlenir.</p>
                <label className="flex cursor-pointer items-start gap-2 text-left text-sm">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-500" checked={kvkk} onChange={(e) => (e.target.checked ? setRead('kvkk') : setKvkk(false))} />
                  <span><button type="button" className="font-semibold text-brand-500 underline" onClick={() => setRead('kvkk')}>KVKK aydınlatma metnini</button> okudum ve onaylıyorum.</span>
                </label>
                <label className="flex cursor-pointer items-start gap-2 text-left text-sm">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-500" checked={riza} onChange={(e) => (e.target.checked ? setRead('riza') : setRiza(false))} />
                  <span><button type="button" className="font-semibold text-brand-500 underline" onClick={() => setRead('riza')}>Açık rıza metnini</button> okudum ve onaylıyorum.</span>
                </label>
              </div>
            </>
          )}
          {mode === 'apply' && (
            <>
              <p className="rounded-lg bg-stone-100 p-3 text-left text-xs text-stone-600">Başvurunuz yönetici panelinde incelenir. Onaylandığında aşağıda belirleyeceğiniz kullanıcı adı ve şifreyle diyetisyen olarak giriş yaparsınız.</p>
              {input('ad', 'Ad soyad', 'text', 'name')}
              {input('title', 'Unvan / diploma bilgisi (örn. Dyt., Ankara Üniv. Beslenme ve Diyetetik)')}
              {input('u', 'Kullanıcı adı (3-20 harf, rakam, . _ -)', 'text', 'username')}
              {input('p', 'Şifre (en az 8 karakter)', 'password', 'new-password')}
              {input('p2', 'Şifre tekrar', 'password', 'new-password')}
              {input('note', 'Not (isteğe bağlı)')}
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
          {busy ? 'Bekleyin…' : SUBMIT[mode]}
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
          <div className="mt-3 border-t border-stone-200 pt-3 text-sm">
            Diyetisyen misiniz? <button type="button" className="font-semibold text-brand-500 underline" onClick={() => go('apply')}>Başvurun</button>
          </div>
        )}

        {read && (
          <Modal title={read === 'kvkk' ? 'KVKK aydınlatma metni' : 'Açık rıza metni'} onClose={() => setRead(null)}>
            <pre className="max-h-[52vh] overflow-auto whitespace-pre-wrap rounded-lg border border-stone-200 bg-stone-50 p-3 text-left text-sm">{read === 'kvkk' ? kvkkAydinlatma(loadBrandOf(DEMO_DIETITIAN)) : kvkkRiza(loadBrandOf(DEMO_DIETITIAN), v.ad.trim())}</pre>
            <div className="mt-4 flex gap-2">
              <button type="button" className="rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white" onClick={() => { if (read === 'kvkk') setKvkk(true); else setRiza(true); setRead(null) }}>Okudum, onaylıyorum</button>
              <button type="button" className="rounded-lg border border-stone-300 bg-white px-4 py-2 font-semibold" onClick={() => setRead(null)}>Kapat</button>
            </div>
          </Modal>
        )}
        <p className="mt-4 text-xs text-stone-500">{cloudEnabled ? 'Eğitim sürümü: hesaplar ve veriler Supabase sunucusunda saklanır; her cihazdan aynı hesapla girebilirsiniz. Gerçek danışan verisi girmeyin.' : 'Eğitim sürümü: hesaplar ve veriler yalnızca bu tarayıcıda saklanır, şifre hiçbir yere gönderilmez. Gerçek danışan verisi girmeyin.'}</p>
      </form>
    </div>
  )
}