import { Link } from 'react-router-dom'
import { useRole } from '../../app/role'
import PageTitle from '../../components/ui/PageTitle'
import { field } from '../../components/ui/styles'
import { parseNum } from '../../lib/format'
import { calculate } from '../../lib/formulas'
import { useFoodData } from '../../lib/useFoodData'
import { toCalcInput } from '../calculator/profile'
import { useClients } from '../clients/useClients'
import { useSelectedClient } from '../clients/useSelectedClient'
import { useEvaluation } from '../foods/useEvaluation'
import { useRemovedFoods } from '../foods/useRemovedFoods'
import MenuEditor from './MenuEditor'

export default function Menu() {
  const { role } = useRole()
  const { clients, upsert } = useClients()
  const { client, choose } = useSelectedClient(clients)
  const food = useFoodData()
  const removed = useRemovedFoods()
  const evalr = useEvaluation(food, client, removed.set)

  if (role === 'danisan')
    return (
      <>
        <PageTitle title="Menü" sub="Diyetisyeninin hazırladığı menü burada görünecek" />
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">
          Danışan portalındaki menü (öğün tikleri, su takibi) sonraki aşamada eklenecek.
        </div>
      </>
    )

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
      <label className="mb-4 block max-w-xs text-sm font-semibold">
        Danışan
        <select className={`${field} mt-1 w-full`} value={client.id} onChange={(e) => choose(e.target.value)}>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
      {!food || !evalr ? (
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