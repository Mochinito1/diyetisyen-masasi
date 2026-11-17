import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRole } from '../../app/role'
import PageTitle from '../../components/ui/PageTitle'
import { load, save } from '../../lib/storage'
import { useFoodData } from '../../lib/useFoodData'
import { useClients } from '../clients/useClients'
import { calculate } from '../../lib/formulas'
import { toCalcInput } from '../calculator/profile'
import { parseNum } from '../../lib/format'
import MenuEditor from './MenuEditor'

const KEY = 'dm.menuClient'

export default function Menu() {
  const { role } = useRole()
  const { clients, upsert } = useClients()
  const food = useFoodData()
  const [sel, setSel] = useState<string>(() => load<string>(KEY, ''))

  if (role === 'danisan')
    return (
      <>
        <PageTitle title="Menü" sub="Diyetisyeninin hazırladığı menü burada görünecek" />
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">
          Danışan portalındaki menü (öğün tikleri, su takibi) sonraki aşamada eklenecek.
        </div>
      </>
    )

  if (clients.length === 0)
    return (
      <>
        <PageTitle title="Menü" sub="Danışanın hedefine göre menü oluşturun" />
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">
          Önce bir danışan ekleyin.{' '}
          <Link to="/danisanlar" className="font-semibold text-brand-500 underline">Danışanlara git</Link>
        </div>
      </>
    )

  const client = clients.find((c) => c.id === sel) ?? clients[0]
  const choose = (id: string) => {
    setSel(id)
    save(KEY, id)
  }
  const result = calculate(toCalcInput(client.profile))
  const age = parseNum(client.profile.age)

  return (
    <>
      <PageTitle title="Menü" sub="Besin ekleyin, öğünlere dağıtın, hedefle karşılaştırın" />
      <label className="mb-4 block max-w-xs text-sm font-semibold">
        Danışan
        <select
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 focus:border-brand-500 focus:outline-none"
          value={client.id}
          onChange={(e) => choose(e.target.value)}
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
      {!food ? (
        <p className="text-stone-500">Besin listesi yükleniyor…</p>
      ) : (
        <MenuEditor
          key={client.id}
          client={client}
          result={result}
          age={age}
          food={food}
          onChange={(patch) => upsert({ ...client, ...patch, updated: Date.now() })}
        />
      )}
    </>
  )
}