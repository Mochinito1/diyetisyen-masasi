import PageTitle from '../../components/ui/PageTitle'
import { card } from '../../components/ui/styles'
import { latestWeight } from '../../lib/dossier'
import { parseNum } from '../../lib/format'
import CalcResults from '../calculator/CalcResults'
import { toCalcInput } from '../calculator/profile'
import MeasurementsCard from '../clients/dossier/Measurements'
import { useBrand } from '../settings/useBrand'
import ClientPicker from './ClientPicker'
import NextAppointment from './NextAppointment'
import Onboarding from './Onboarding'
import { usePortalClient } from './usePortalClient'

const ACT: Record<string, string> = { '1.2': 'Hareketsiz', '1.375': 'Hafif aktif', '1.55': 'Orta aktif', '1.725': 'Çok aktif', '1.9': 'Aşırı aktif' }
const GOAL: Record<string, string> = { '0': 'Kiloyu koru', '-250': 'Yavaş ver', '-500': 'Kilo ver', '-750': 'Hızlı ver', '250': 'Yavaş al', '500': 'Kilo al' }

export default function Profile() {
  const { clients, client, choose, update } = usePortalClient()
  const { brand } = useBrand()
  if (!client)
    return (
      <>
        <PageTitle title="Profil" sub="Diyetisyeninin belirlediği hedef ve ölçülerin" />
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">Test için önce diyetisyen rolünde bir danışan ekleyin.</div>
      </>
    )
  const p = client.profile
  return (
    <>
      <PageTitle title="Profil" sub={brand.name ? `Diyetisyenin: ${brand.name}` : 'Diyetisyeninin belirlediği hedef ve ölçülerin'} />
      <ClientPicker clients={clients} value={client.id} onChange={choose} />
      {!client.onb ? (
        <Onboarding client={client} onDone={(c) => update(c)} />
      ) : (
        <>
          <NextAppointment clientId={client.id} />
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <div className={`${card} h-fit`}>
              <h2 className="font-display text-lg font-bold">Bilgilerin</h2>
              <p className="mb-2 text-xs text-stone-500">Bu değerleri diyetisyenin belirler. Değişiklik için ona danış.</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                {([
                  ['Cinsiyet', p.sex === 'K' ? 'Kadın' : p.sex === 'E' ? 'Erkek' : '–'], ['Yaş', p.age || '–'], ['Boy', p.h ? `${p.h} cm` : '–'],
                  ['Kilo', p.w ? `${p.w} kg` : '–'], ['Aktivite', ACT[p.act] ?? p.act], ['Hedef', GOAL[p.goal] ?? p.goal],
                ] as const).map(([k, v]) => (
                  <div key={k} className="contents"><dt className="text-stone-500">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>
                ))}
              </dl>
            </div>
            <CalcResults input={toCalcInput(client.profile)} />
          </div>
          <div className="mt-4">
            <MeasurementsCard
              meas={client.meas}
              sex={client.profile.sex}
              heightCm={parseNum(client.profile.h)}
              onChange={(meas) => {
                const w = latestWeight(meas)
                update({ meas, ...(w != null ? { profile: { ...client.profile, w: String(w) } } : {}) })
              }}
            />
          </div>
        </>
      )}
    </>
  )
}