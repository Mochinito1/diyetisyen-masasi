import { Link } from 'react-router-dom'
import { useRole } from '../../app/role'
import PageTitle from '../../components/ui/PageTitle'
import { field } from '../../components/ui/styles'
import { fmt, parseNum } from '../../lib/format'
import { calculate } from '../../lib/formulas'
import { useFoodData } from '../../lib/useFoodData'
import { toCalcInput } from '../calculator/profile'
import { useClients } from '../clients/useClients'
import { useSelectedClient } from '../clients/useSelectedClient'
import { useEvaluation } from '../foods/useEvaluation'
import { useRemovedFoods } from '../foods/useRemovedFoods'
import PortalMenu from '../portal/PortalMenu'
import MenuEditor from './MenuEditor'

export default function Menu() {
  const { role } = useRole()
  const { clients, upsert } = useClients()
  const { client, choose } = useSelectedClient(clients)
  const food = useFoodData()
  const removed = useRemovedFoods()
  const evalr = useEvaluation(food, client, removed.set)

  if (role === 'danisan') return <PortalMenu />

  if (!client)
    return (
      <>
        <PageTitle title="Menü" sub="Danışanın hedefine göre menü oluşturun" />
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">
          Önce bir danışan ekleyin.{' '}
          <Link to="/danisanlar" className="font-semibold text-brand-500 underline">Danışanlara git</Link>
        </div>
      </>
    )

  const result = calculate(toCalcInput(client.profile))
  const age = parseNum(client.profile.age)

  return (
    <>
      <PageTitle title="Menü" sub="Besin ekleyin, öğünlere dağıtın, hedefle karşılaştırın" />
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-stone-200 bg-white p-3">
        <label className="flex items-center gap-2 text-sm font-semibold">
          Danışan
          <select className={`${field} rounded-xl py-1.5`} value={client.id} onChange={(e) => choose(e.target.value)}>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
          {result?.target && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">Hedef {fmt(result.target)} kcal</span>}
          {result?.adult && result.category && <span className="rounded-full bg-stone-100 px-2.5 py-1">BKİ {fmt(result.bmi, 1)} · {result.category}</span>}
          {evalr?.conds.map((c) => <span key={c.id} className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">{c.short}</span>)}
          {!result?.target && <span className="py-1 text-stone-500">Hedef için danışanın bilgilerini tamamlayın.</span>}
        </div>
      </div>      {!food || !evalr ? (
        <p className="text-stone-500">Besin listesi yükleniyor…</p>
      ) : (
        <MenuEditor
          key={client.id}
          client={client}
          result={result}
          age={age}
          food={food}
          ev={evalr.map}
          onChange={(patch) => upsert({ ...client, ...patch, updated: Date.now() })}
        />
      )}
    </>
  )
}