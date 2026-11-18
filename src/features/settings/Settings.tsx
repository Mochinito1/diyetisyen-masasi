import { useState } from 'react'
import PageTitle from '../../components/ui/PageTitle'
import { btn, card, field } from '../../components/ui/styles'
import { exportData, importData } from '../../lib/backup'
import { cloudEnabled } from '../../lib/cloud'
import { kvkkAydinlatma, kvkkRiza, type Brand } from '../../lib/brand'
import { useAuth } from '../../app/auth'
import { useRole } from '../../app/role'
import PortalSettings from '../portal/PortalSettings'
import { useBrand } from './useBrand'

/** Logoyu en çok 240 px genişliğe küçültüp PNG data URL'ine çevirir */
function logoFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const s = Math.min(1, 240 / img.width)
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * s)
      c.height = Math.round(img.height * s)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/png'))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Görsel okunamadı')) }
    img.src = url
  })
}

export default function Settings() {
  const { role } = useRole()
  return role === 'danisan' ? <PortalSettings /> : <DietitianSettings />
}

function DietitianSettings() {
  const { brand, update } = useBrand()
  const { session } = useAuth()
  const scope = session?.kind === 'diyetisyen' ? session.u : undefined
  const [msg, setMsg] = useState('')
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 2500) }

  const txt = (k: keyof Brand, label: string, ph = '') => (
    <label className="block text-sm font-semibold">{label}
      <input className={`${field} mt-1 w-full font-normal`} placeholder={ph} value={String(brand[k])} onChange={(e) => update({ [k]: e.target.value })} />
    </label>
  )
  const area = (k: 'tpl' | 'tpl2' | 'tpl3' | 'foot', label: string, hint?: string) => (
    <label className="block text-sm font-semibold">{label}
      <textarea className={`${field} mt-1 min-h-20 w-full font-normal`} value={brand[k]} onChange={(e) => update({ [k]: e.target.value })} />
      {hint && <span className="text-xs font-normal text-stone-500">{hint}</span>}
    </label>
  )
  const copy = async (t: string) => {
    try { await navigator.clipboard.writeText(t); flash('Kopyalandı') } catch { flash('Kopyalanamadı') }
  }

  const download = () => {
    const blob = new Blob([exportData(scope)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `diyetisyen-masasi-yedek-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const restore = async (f: File | undefined) => {
    if (!f) return
    if (!confirm('Yedek geri yüklenecek. Aynı anahtarlı mevcut veriler (danışanlar, randevular, ayarlar) üzerine yazılır. Devam edilsin mi?')) return
    const r = importData(await f.text(), scope)
    if (!r.ok) return flash(r.error)
    flash(`${r.keys} veri grubu geri yüklendi. Sayfa yenileniyor…`)
    setTimeout(() => location.reload(), 900)
  }

  return (
    <>
      <PageTitle title="Ayarlar" sub="Klinik bilgileri, mesaj şablonları, KVKK metinleri ve yedekleme" />
      <div className="grid items-start gap-4 md:grid-cols-2">
        <div className={card}>
          <h2 className="font-display text-lg font-bold">Klinik ve PDF ayarları</h2>
          <p className="mb-3 text-xs text-stone-500">Yazdırılabilir diyet listesinin başlığında, alt bilgisinde ve hatırlatma mesajlarında kullanılır. {cloudEnabled ? 'Sunucuda saklanır.' : 'Bu tarayıcıda saklanır.'}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {txt('clinic', 'Klinik / marka adı', 'Örn. Ayşe Yılmaz Beslenme ve Diyet')}
            {txt('name', 'Diyetisyen adı ve unvanı', 'Örn. Dyt. Ayşe Yılmaz')}
            {txt('phone', 'Telefon', '05XX XXX XX XX')}
            {txt('web', 'Web sitesi veya Instagram', 'ornek.com · @hesapadi')}
            {txt('addr', 'Adres (isteğe bağlı)')}
            {txt('link', 'Varsayılan online görüşme linki', 'https://meet.google.com/...')}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {brand.logo ? <img src={brand.logo} alt="Logo" className="max-h-14 max-w-36 rounded border border-stone-200 bg-white object-contain p-1" /> : <span className="text-sm text-stone-500">Logo yok</span>}
            <label className={`${btn} cursor-pointer`}>Logo seç
              <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) { try { update({ logo: await logoFromFile(f) }) } catch { flash('Logo okunamadı') } } }} />
            </label>
            {brand.logo && <button className={btn} onClick={() => update({ logo: '' })}>Kaldır</button>}
            <label className="ml-auto text-sm font-semibold">Vurgu rengi
              <input type="color" className="ml-2 h-9 w-12 rounded border border-stone-300 bg-white p-0.5 align-middle" value={brand.color} onChange={(e) => update({ color: e.target.value })} />
            </label>
          </div>
          <div className="mt-3">{area('foot', 'PDF alt notu')}</div>
        </div>

        <div className={card}>
          <h2 className="font-display text-lg font-bold">Mesaj şablonları</h2>
          <p className="mb-3 text-xs text-stone-500">Mesajlar kendiliğinden gönderilmez: WhatsApp düğmesi hazır mesajla sohbeti açar, gönder tuşuna siz basarsınız.</p>
          <div className="space-y-3">
            {area('tpl', 'Randevu hatırlatma mesajı', '{ad} {tarih} {saat} {link} {klinik} yazılabilir.')}
            {area('tpl2', '“Uzun süredir gelmeyen” mesajı')}
            {area('tpl3', 'PDF gönderme mesajı')}
          </div>
        </div>

        <div className={card}>
          <h2 className="font-display text-lg font-bold">KVKK metin şablonları</h2>
          <p className="mb-3 text-xs text-stone-500">Klinik adınız ve iletişim bilgileriniz yukarıdan gelir. Metinleri kopyalayıp kendi belgenize yapıştırabilirsiniz.</p>
          {([['Aydınlatma metni', kvkkAydinlatma(brand)], ['Açık rıza beyanı', kvkkRiza(brand)]] as const).map(([t, x]) => (
            <div key={t} className="mb-4">
              <div className="mb-1 flex items-center justify-between"><b>{t}</b><button className={btn} onClick={() => copy(x)}>Kopyala</button></div>
              <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm">{x}</pre>
            </div>
          ))}
        </div>

        <div className={card}>
          <h2 className="font-display text-lg font-bold">Yedekleme</h2>
          <p className="mb-3 text-xs text-stone-500">{cloudEnabled ? 'Veriler Supabase sunucusunda saklanır; yedek almak yine de iyi bir alışkanlıktır. Yedek dosyası danışan sağlık verisi içerir, güvenli saklayın.' : 'Tüm veriler yalnızca bu tarayıcıda durur. Tarayıcı verisi silinirse kaybolur, bu yüzden düzenli yedek alın. Yedek dosyası danışan sağlık verisi içerir, güvenli saklayın.'}</p>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white" onClick={download}>Yedeği indir (JSON)</button>
            <label className={`${btn} cursor-pointer py-2`}>Yedekten geri yükle
              <input type="file" accept="application/json,.json" hidden onChange={(e) => { restore(e.target.files?.[0]); e.target.value = '' }} />
            </label>
          </div>
        </div>
      </div>
      {msg && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-50 shadow-lg" role="status">{msg}</div>}
    </>
  )
}