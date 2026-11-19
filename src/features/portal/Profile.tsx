import PageTitle from '../../components/ui/PageTitle'
import { card } from '../../components/ui/styles'
import { latestWeight } from '../../lib/dossier'
import { parseNum } from '../../lib/format'
import { autoGoal, validTarget, weeksToGoal } from '../../lib/goalPlan'
import { calculate } from '../../lib/formulas'
import { fmt } from '../../lib/format'
import { toCalcInput, type Profile as ProfileData } from '../calculator/profile'
import MeasurementsCard from '../clients/dossier/Measurements'
import { useBrand } from '../settings/useBrand'
import ClientPicker from './ClientPicker'
import PortalLabs from './PortalLabs'
import ProfileSummary from './ProfileSummary'
import NextAppointment from './NextAppointment'
import Onboarding from './Onboarding'
import { usePortalClient } from './usePortalClient'

const ACT: Record<string, string> = { '1.2': 'Hareketsiz', '1.375': 'Hafif aktif', '1.55': 'Orta aktif', '1.725': 'Çok aktif', '1.9': 'Aşırı aktif' }
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
          <div className="grid items-stretch gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="flex flex-col rounded-xl border border-stone-200 bg-white p-4 md:p-5">
              <h2 className="font-display text-lg font-bold">Değerlerin</h2>
              <p className="mb-2 text-xs text-stone-500">Fiziksel aktivite ve hedef kilonu sen yazabilirsin; günlük kalori hedefin buna göre yeniden hesaplanır.</p>
              <dl className="text-sm">
                {([
                  ['Cinsiyet', p.sex === 'K' ? 'Kadın' : p.sex === 'E' ? 'Erkek' : '–'],
                  ['Yaş', p.age || '–'],
                  ['Boy', p.h ? `${p.h} cm` : '–'],
                  ['Kilo', p.w ? `${p.w} kg` : '–'],
                  ['Fiziksel aktivite', (
                    <select
                      aria-label="Fiziksel aktivite"
                      className="h-9 max-w-[11.5rem] rounded-xl border border-stone-300 bg-white px-2.5 text-right text-sm font-semibold focus:border-brand-500 focus:outline-none"
                      value={p.act}
                      onChange={(e) => update({ profile: { ...client.profile, act: e.target.value } })}
                    >
                      {Object.entries(ACT).map(([k, label]) => <option key={k} value={k}>{label} ({k.replace('.', ',')})</option>)}
                    </select>
                  )],
                  ['Hedef', (
                    <span className="flex items-center gap-1.5">
                      <input
                        aria-label="Hedef (kg)"
                        inputMode="decimal"
                        maxLength={5}
                        placeholder="hedef kilon"
                        className="h-9 w-24 rounded-xl border border-stone-300 bg-white px-2.5 text-right text-sm font-semibold focus:border-brand-500 focus:outline-none"
                        value={p.tw ?? ''}
                        onChange={(e) => update({ profile: { ...client.profile, tw: e.target.value.replace(/[^0-9.,]/g, '') } })}
                      />
                      <span className="text-sm text-stone-500">kg</span>
                    </span>
                  )],
                  ...(p.phys !== 'none' ? [['Fizyolojik durum', PHYS[p.phys]] as const] : []),
                ] as const).map(([k, v]) => (
                  <div key={k} className="flex min-h-[2.75rem] items-center justify-between gap-3 border-b border-stone-200 py-1.5 last:border-0">
                    <dt className="text-stone-500">{k}</dt><dd className="text-right font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
              <GoalPlan p={p} />
            </div>
            <ProfileSummary input={toCalcInput(client.profile)} macroPct={client.macro} />
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
          <div className="mt-4">
            <PortalLabs labs={client.lab} sex={client.profile.sex} onChange={(lab) => update({ lab })} />
          </div>
        </>
      )}
    </>
  )
}
/** Hedef kilo girildiyse: kalan kilo, tempo, tahmini süre ve hedefe ulaşınca stabilizasyon kalorisi */
function GoalPlan({ p }: { p: ProfileData }) {
  const w = parseNum(p.w)
  const tw = p.tw ? parseNum(p.tw) : null
  const h = parseNum(p.h)
  if (p.tw && !validTarget(tw)) return <p className="mt-3 text-xs text-amber-800">Hedef 30 ile 300 kg arasında olmalı.</p>
  if (w == null || !validTarget(tw)) return null
  const ag = autoGoal(w, tw)
  const now = calculate(toCalcInput(p))
  const keep = calculate(toCalcInput({ ...p, w: String(tw), tw: undefined, goal: '0' }))
  if (!now?.target) return null
  const weeks = weeksToGoal(ag.gapKg, now.adj ?? 0)
  const perWeek = now.weeklyKg ? Math.abs(now.weeklyKg) : 0
  const low = h && tw / ((h / 100) * (h / 100)) < 18.5
  const stab = ag.phase === 'stabilize'
  const Tile = ({ label, value, unit }: { label: string; value: string; unit: string }) => (
    <div className="rounded-xl bg-white/60 px-2 py-2 text-center dark:bg-black/20">
      <div className="text-[10px] font-bold uppercase tracking-wide text-stone-500">{label}</div>
      <div className="mt-0.5 text-base font-bold leading-tight">{value}</div>
      <div className="text-[11px] text-stone-500">{unit}</div>
    </div>
  )
  return (
    <div className="mt-auto pt-4" aria-label="Hedef planı">
      <div className="rounded-2xl border border-brand-500/40 bg-brand-500/10 p-3">
        <div className="flex items-center justify-between gap-2">
          <b className="text-sm">{stab ? 'Hedefindesin' : 'Hedef planın'}</b>
          <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-[11px] font-semibold">{stab ? 'Stabilizasyon' : `${fmt(w, 1)} → ${fmt(tw, 1)} kg`}</span>
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          <Tile label={stab ? 'Fark' : 'Kalan'} value={fmt(Math.abs(ag.gapKg), 1)} unit="kg" />
          <Tile label="Günlük" value={fmt(now.target)} unit="kcal" />
          <Tile label={stab ? 'Tempo' : 'Süre'} value={stab ? 'Koru' : weeks ? `~${weeks}` : '–'} unit={stab ? 'kilonu' : 'hafta'} />
        </div>
        <ul className="mt-2.5 space-y-1.5 text-xs text-stone-600">
          {!stab && perWeek > 0 && <li className="flex gap-2"><span aria-hidden>•</span><span>Haftada yaklaşık <b>{fmt(perWeek, 2)} kg</b> değişim</span></li>}
          {!stab && keep?.target ? <li className="flex gap-2"><span aria-hidden>•</span><span>Hedefe ulaşınca günlük <b>{fmt(keep.target)} kcal</b> ile kilonu korursun</span></li> : null}
          <li className="flex gap-2"><span aria-hidden>•</span><span>Kilon değiştikçe plan kendiliğinden güncellenir</span></li>
        </ul>
        {low && <p className="mt-2 rounded-lg bg-amber-500/15 px-2 py-1.5 text-xs font-semibold text-amber-800">Bu hedef BKİ 18,5'in altında; diyetisyeninle konuşmanı öneririz.</p>}
      </div>
    </div>
  )
}
