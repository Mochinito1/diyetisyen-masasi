import { card } from '../../components/ui/styles'
import { CONDITIONS, CONDITION_GROUPS, ageGroup, ageRulesText, activeConditions } from '../../lib/rules'
import { parseNum } from '../../lib/format'
import type { Client } from './types'

/** Hastalık ve diyet seçimi: besin listesi bu seçime göre süzülür */
export default function ConditionsCard({ client, onChange }: { client: Client; onChange: (conds: string[]) => void }) {
  const age = parseNum(client.profile.age)
  const active = activeConditions(client.conds, client.profile.sex, age, client.profile.phys)
  const toggle = (id: string) => onChange(client.conds.includes(id) ? client.conds.filter((c) => c !== id) : [...client.conds, id])
  const ageTxt = ageRulesText(age)

  return (
    <div className={card}>
      <h2 className="font-display text-lg font-bold">Hastalık ve diyet seçimi</h2>
      <p className="mb-3 text-xs text-stone-500">Danışanı kaydederken hastalığını veya diyetini seçin. Besin listesi ve menü buna göre otomatik süzülür.</p>
      {CONDITION_GROUPS.map((g) => (
        <div key={g} className="mt-3">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-500">{g}</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {CONDITIONS.filter((c) => c.group === g).map((c) => {
              const on = active.some((a) => a.id === c.id)
              return (
                <button
                  key={c.id}
                  aria-pressed={on}
                  disabled={c.auto}
                  onClick={() => toggle(c.id)}
                  title={c.auto ? 'Cinsiyet, yaş ve fizyolojik durumdan otomatik belirlenir' : c.desc}
                  className={`rounded-full border px-3 py-1 text-sm font-semibold ${on ? 'border-brand-500 bg-brand-500 text-white' : 'border-stone-300 bg-white text-stone-700'} ${c.auto ? 'cursor-default' : ''}`}
                >
                  {c.name}
                </button>
              )
            })}
          </div>
        </div>
      ))}
      {active.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-stone-100 pt-3">
          {active.map((c) => (
            <div key={c.id} className="text-sm"><b>{c.short}:</b> <span className="text-stone-500">{c.desc}</span></div>
          ))}
        </div>
      )}
      {age != null && (
        <div className="mt-4 border-t border-stone-100 pt-3 text-sm">
          <b>{ageGroup(age)}</b>
          <ul className="mt-1 list-disc pl-5 text-stone-500">{ageTxt.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      )}
    </div>
  )
}