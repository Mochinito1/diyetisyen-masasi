import { useState } from 'react'
import { fmt, parseNum } from '../../lib/format'
import type { CalcResult } from '../../lib/formulas'
import type { MenuItem } from '../../lib/menu'
import { TEMPLATES, buildTemplate, recommendTemplate, type AnyTemplate, type BuildResult } from '../../lib/templates'
import type { useFoodData } from '../../lib/useFoodData'
import { useCustomTemplates } from './useCustomTemplates'

type FoodCtx = NonNullable<ReturnType<typeof useFoodData>>

const field = 'rounded-lg border border-stone-300 bg-white px-3 py-2 focus:border-brand-500 focus:outline-none'
const btn = 'rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-stone-100'

interface Props {
  food: FoodCtx
  hidden: (f: import('../../lib/foods').Food) => boolean
  result: CalcResult | null
  sex: string
  phys: string
  menu: MenuItem[]
  onApply: (items: MenuItem[], mode: 'replace' | 'add') => void
  onClose: () => void
}

export default function TemplatePanel({ food, hidden, result, sex, phys, menu, onApply, onClose }: Props) {
  const custom = useCustomTemplates()
  const all: AnyTemplate[] = [...TEMPLATES, ...custom.list]
  const rec = recommendTemplate(sex, phys)
  const [sel, setSel] = useState(rec)
  const [kcal, setKcal] = useState('')
  const [mode, setMode] = useState<'replace' | 'add'>('replace')
  const [done, setDone] = useState<BuildResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  const clientTarget = result && !result.infant && result.target ? result.target : null
  const target = parseNum(kcal) ?? clientTarget

  const apply = () => {
    const t = all.find((x) => x.id === sel)
    if (!t) return
    const r = buildTemplate(t, target, { byCode: food.byCode, groups: food.groups, idx: food.idx, macro: { c: 50, p: 20 }, hidden })
    onApply(r.items, mode)
    setDone(r)
  }

  const saveCustom = () => {
    if (!name.trim() || !menu.length) return
    const id = `c-${Date.now()}`
    custom.add({ id, name: name.trim(), desc: desc.trim() || 'Kendi şablonum', custom: true, items: menu })
    setSaving(false)
    setName('')
    setDesc('')
    setSel(id)
  }

  return (
    <div className="rounded-2xl border border-brand-500 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Şablon uygula</h2>
          <p className="text-xs text-stone-500">
            Şablon, danışanın hedef kalorisine göre ölçeklenir. Sonucu mutlaka düzenleyin.
          </p>
        </div>
        <button className={btn} onClick={onClose}>Kapat</button>
      </div>

      <div className="mt-3 space-y-2">
        {all.map((t) => (
          <label key={t.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${sel === t.id ? 'border-brand-500 bg-brand-50' : 'border-stone-200'}`}>
            <input type="radio" name="tpl" className="mt-1 accent-brand-500" checked={sel === t.id} onChange={() => setSel(t.id)} />
            <span className="flex-1">
              <b>{t.name}</b>
              {rec === t.id && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">Danışana uygun</span>}
              {'custom' in t && <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold">Benim şablonum</span>}
              <span className="block text-sm text-stone-500">{t.desc}</span>
            </span>
            {'custom' in t && (
              <button
                className={btn}
                onClick={(e) => {
                  e.preventDefault()
                  if (confirm(`“${t.name}” şablonu silinsin mi?`)) {
                    custom.remove(t.id)
                    if (sel === t.id) setSel(rec)
                  }
                }}
              >
                Sil
              </button>
            )}
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <label className="block w-36 text-xs font-semibold">
          Hedef kcal
          <input
            className={`${field} mt-1 w-full`}
            inputMode="numeric"
            maxLength={4}
            placeholder={clientTarget ? String(clientTarget) : '1800'}
            value={kcal}
            onChange={(e) => setKcal(e.target.value.replace(/\D/g, ''))}
          />
        </label>
        <p className="pb-2 text-xs text-stone-500">
          {clientTarget ? `Boş bırakırsanız danışan hedefi (${fmt(clientTarget)} kcal) kullanılır.` : 'Danışan hedefi hesaplanamadı, kalori yazın ya da boş bırakıp şablonu olduğu gibi alın.'}
        </p>
      </div>

      <div className="mt-4 flex overflow-hidden rounded-lg border border-stone-300 text-sm font-semibold sm:w-96">
        {(['replace', 'add'] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 ${mode === m ? 'bg-brand-500 text-white' : 'bg-white text-stone-600'}`}>
            {m === 'replace' ? 'Menüyü değiştir' : 'Mevcut menüye ekle'}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white" onClick={apply}>Uygula</button>
        <button className={btn} disabled={!menu.length} onClick={() => setSaving(!saving)}>Mevcut menüyü şablon olarak kaydet</button>
      </div>

      {saving && (
        <div className="mt-3 space-y-2 rounded-xl border border-stone-200 p-3">
          <input className={`${field} w-full`} placeholder="Şablon adı" value={name} onChange={(e) => setName(e.target.value)} />
          <input className={`${field} w-full`} placeholder="Kısa açıklama (isteğe bağlı)" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <div className="flex gap-2">
            <button className="rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white disabled:opacity-40" disabled={!name.trim()} onClick={saveCustom}>Kaydet</button>
            <button className={btn} onClick={() => setSaving(false)}>Vazgeç</button>
          </div>
        </div>
      )}

      {done && (
        <div className="mt-4 rounded-xl bg-emerald-100 p-3 text-sm text-emerald-800">
          Şablon uygulandı: <b>{fmt(done.kcal)} kcal</b> · Protein %{fmt(done.pp)} · Karbonhidrat %{fmt(done.cp)} · Yağ %{fmt(done.fp)}
          {done.skipped.length > 0 && <div className="mt-1">Eklenemeyen besinler: {done.skipped.join(', ')}</div>}
        </div>
      )}
    </div>
  )
}