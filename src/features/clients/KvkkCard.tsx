import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import { btn, btnPrimary, card } from '../../components/ui/styles'
import { fmtDay } from '../../lib/dossier'
import { kvkkAydinlatma } from '../../lib/brand'
import { todayStr } from '../../lib/appointments'
import { useBrand } from '../settings/useBrand'

export interface Kvkk {
  ay: string
  riza: string
}

/** KVKK: aydınlatma metninin okunup onaylanması ve açık rıza kaydı */
export default function KvkkCard({ value, onChange }: { value: Kvkk; onChange: (k: Kvkk) => void }) {
  const { brand } = useBrand()
  const [open, setOpen] = useState(false)
  const date = (k: keyof Kvkk) => (value[k] ? <span className="text-xs text-stone-500"> · {fmtDay(value[k])}</span> : null)
  return (
    <div className={card}>
      <h2 className="font-display text-lg font-bold">KVKK: aydınlatma ve açık rıza</h2>
      <div className="mt-2 space-y-1">
        <label className="flex cursor-pointer items-start gap-2 py-1.5 text-sm">
          <input type="checkbox" className="mt-1 accent-brand-500" checked={!!value.ay} onChange={(e) => onChange({ ...value, ay: e.target.checked ? todayStr() : '' })} />
          <span><button type="button" className="font-bold text-brand-500 underline" onClick={() => setOpen(true)}>Aydınlatma metni</button> okundu ve onaylandı{date('ay')}</span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 py-1.5 text-sm">
          <input type="checkbox" className="mt-1 accent-brand-500" checked={!!value.riza} onChange={(e) => onChange({ ...value, riza: e.target.checked ? todayStr() : '' })} />
          <span>Açık rıza alındı{date('riza')}</span>
        </label>
      </div>
      <p className="mt-3 rounded-lg bg-amber-100 p-3 text-xs text-amber-800">
        Bu eğitim uygulaması verileri yalnızca bu tarayıcıda saklar; sunucu, şifreleme ve erişim kaydı yoktur. Gerçek danışan sağlık verisi için KVKK’ya uygun, Türkiye’de barındırılan bir sistem gerekir.
      </p>
      {open && (
        <Modal title="Aydınlatma metni" onClose={() => setOpen(false)}>
          <p className="mb-2 text-xs text-stone-500">{value.ay ? 'Bu metin onaylandı.' : 'Metnin tamamını okuyup en altta onaylayın.'}</p>
          <pre className="max-h-[52vh] overflow-auto whitespace-pre-wrap rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm">{kvkkAydinlatma(brand)}</pre>
          <div className="mt-4 flex gap-2">
            {value.ay
              ? <button className={btnPrimary} onClick={() => setOpen(false)}>Kapat</button>
              : <><button className={btnPrimary} onClick={() => { onChange({ ...value, ay: todayStr() }); setOpen(false) }}>Okudum, onaylıyorum</button><button className={btn} onClick={() => setOpen(false)}>Vazgeç</button></>}
          </div>
        </Modal>
      )}
    </div>
  )
}