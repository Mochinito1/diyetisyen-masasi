import { card } from '../../components/ui/styles'
import { ageGroup, ageRulesText, activeConditions } from '../../lib/rules'
import { parseNum } from '../../lib/format'
import ConditionsSelect from './ConditionsSelect'
import type { Client } from './types'

/** Hastalık ve diyet seçimi (diyetisyen düzenleme ekranı): besin listesi bu seçime göre süzülür */
export default function ConditionsCard({ client, onChange }: { client: Client; onChange: (conds: string[], condsDone: string[]) => void }) {
  const age = parseNum(client.profile.age)
  const active = activeConditions(client.conds, client.profile.sex, age, client.profile.phys)
  const ageTxt = ageRulesText(age)
  const auto = active.filter((c) => c.auto)

  return (
    <div className={card}>
      <h2 className="font-display text-lg font-bold">Hastalık ve diyet seçimi</h2>
      <p className="mb-3 text-xs text-stone-500">Danışanı kaydederken hastalığını veya diyetini seçin. Besin listesi buna göre otomatik süzülür.</p>
      <ConditionsSelect client={client} onChange={onChange} />
      {auto.length > 0 && (
        <p className="mt-3 rounded-lg bg-brand-50 p-2.5 text-xs text-brand-600">
          {auto.map((c) => c.name).join(', ')}: cinsiyet, yaş ve fizyolojik durumdan otomatik eklendi.
        </p>
      )}
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