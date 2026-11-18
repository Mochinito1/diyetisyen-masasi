import PageTitle from '../../components/ui/PageTitle'
import { card } from '../../components/ui/styles'
import { latestWeight } from '../../lib/dossier'
import { parseNum } from '../../lib/format'
import { toCalcInput } from '../calculator/profile'
import MeasurementsCard from '../clients/dossier/Measurements'
import { useBrand } from '../settings/useBrand'
import ClientPicker from './ClientPicker'
import ProfileSummary from './ProfileSummary'
import NextAppointment from './NextAppointment'
import Onboarding from './Onboarding'
import { usePortalClient } from './usePortalClient'

const ACT: Record<string, string> = { '1.2': 'Hareketsiz', '1.375': 'Hafif aktif', '1.55': 'Orta aktif', '1.725': 'Çok aktif', '1.9': 'Aşırı aktif' }
const GOAL: Record<string, string> = { '0': 'Kiloyu koru', '-250': 'Yavaş ver (−250 kcal)', '-500': 'Kilo ver (−500 kcal)', '-750': 'Hızlı ver (−750 kcal)', '250': 'Yavaş al (+250 kcal)', '500': 'Kilo al (+500 kcal)' }
const PHYS: Record<string, string> = { g1: 'Gebelik, 1. trimester', g2: 'Gebelik, 2. trimester', g3: 'Gebelik, 3. trimester', emz: 'Emzirme' }

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
          <div className="grid items-stretch gap-4 lg:grid-cols-[340px_1fr]">
            <div className="flex flex-col rounded-xl border border-stone-200 bg-white p-4 md:p-5">
              <h2 className="font-display text-lg font-bold">Diyetisyeninizin belirlediği değerler</h2>
              <p className="mb-2 text-xs text-stone-500">Hedefiniz diyetisyeniniz tarafından hesaplanır ve güncellenir.</p>
              <dl className="flex flex-1 flex-col text-sm">
                {([
                  ['Cinsiyet', p.sex === 'K' ? 'Kadın' : p.sex === 'E' ? 'Erkek' : '–'],
                  ['Yaş', p.age || '–'],
                  ['Boy', p.h ? `${p.h} cm` : '–'],
                  ['Kilo', p.w ? `${p.w} kg` : '–'],
                  ['Fiziksel aktivite', ACT[p.act] ?? p.act],
                  ['Hedef', GOAL[p.goal] ?? p.goal],
                  ...(p.phys !== 'none' ? [['Fizyolojik durum', PHYS[p.phys]] as const] : []),
                ] as const).map(([k, v]) => (
                  <div key={k} className="flex flex-1 items-center justify-between gap-3 border-b border-stone-200 py-2.5 last:border-0">
                    <dt className="text-stone-500">{k}</dt><dd className="text-right font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <ProfileSummary input={toCalcInput(client.profile)} />
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