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
  const pw = parseNum(p.w)
  const ptw = p.tw ? parseNum(p.tw) : null
  const twAuto = pw != null && validTarget(ptw) ? autoGoal(pw, ptw) : null
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
              <p className="mb-2 text-xs text-stone-500">Hedefiniz diyetisyeniniz tarafından hesaplanır ve güncellenir. Fiziksel aktivite düzeyini ve hedefinizi (kilo verme, koruma, alma) siz değiştirebilirsiniz; günlük kalori hedefiniz buna göre yeniden hesaplanır.</p>
              <dl className="flex flex-1 flex-col text-sm">
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
                  ['Hedef kilo', (
                    <span className="flex items-center gap-1.5">
                      <input
                        aria-label="Hedef kilo (kg)"
                        inputMode="decimal"
                        maxLength={5}
                        placeholder="örn. 70"
                        className="h-9 w-24 rounded-xl border border-stone-300 bg-white px-2.5 text-right text-sm font-semibold focus:border-brand-500 focus:outline-none"
                        value={p.tw ?? ''}
                        onChange={(e) => update({ profile: { ...client.profile, tw: e.target.value.replace(/[^0-9.,]/g, '') } })}
                      />
                      <span className="text-sm text-stone-500">kg</span>
                    </span>
                  )],
                  ['Hedef', (
                    <select
                      aria-label="Hedef"
                      className="h-9 max-w-[11.5rem] rounded-xl border border-stone-300 bg-white px-2.5 text-right text-sm font-semibold focus:border-brand-500 focus:outline-none"
                      value={twAuto ? twAuto.goal : p.goal}
                      disabled={!!twAuto}
                      onChange={(e) => update({ profile: { ...client.profile, goal: e.target.value } })}
                    >
                      {(['-750', '-500', '-250', '0', '250', '500'] as const).map((k) => <option key={k} value={k}>{GOAL[k]}</option>)}
                    </select>
                  )],
                  ...(p.phys !== 'none' ? [['Fizyolojik durum', PHYS[p.phys]] as const] : []),
                ] as const).map(([k, v]) => (
                  <div key={k} className="flex flex-1 items-center justify-between gap-3 border-b border-stone-200 py-2.5 last:border-0">
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
/** Hedef kilo girildiyse: kalan kilo, önerilen tempo, tahmini süre ve hedefe ulaşınca stabilizasyon kalorisi */
function GoalPlan({ p }: { p: ProfileData }) {
  const w = parseNum(p.w)
  const tw = p.tw ? parseNum(p.tw) : null
  const h = parseNum(p.h)
  if (p.tw && !validTarget(tw)) return <p className="mt-2 text-xs text-amber-800">Hedef kilo 30 ile 300 kg arasında olmalı.</p>
  if (w == null || !validTarget(tw)) return null
  const ag = autoGoal(w, tw)
  const now = calculate(toCalcInput(p))
  const keep = calculate(toCalcInput({ ...p, w: String(tw), tw: undefined, goal: '0' }))
  if (!now?.target) return null
  const weeks = weeksToGoal(ag.gapKg, now.adj ?? 0)
  const perWeek = now.weeklyKg ? Math.abs(now.weeklyKg) : 0
  const low = h && tw / ((h / 100) * (h / 100)) < 18.5
  return (
    <div className="mt-3 rounded-xl border border-brand-500/40 bg-brand-500/10 p-3 text-sm" aria-label="Hedef kilo planı">
      {ag.phase === 'stabilize' ? (
        <>
          <b>Hedef kilondasın: stabilizasyon dönemi</b>
          <p className="mt-0.5 text-xs text-stone-600">Kilonu korumak için günlük yaklaşık <b>{fmt(now.target)} kcal</b> yeterli. Kilon hedefinden ±{fmt(0.5, 1)} kg uzaklaşırsa plan otomatik güncellenir.</p>
        </>
      ) : (
        <>
          <b>{fmt(Math.abs(ag.gapKg), 1)} kg {ag.phase === 'lose' ? 'vermen' : 'alman'} gerekiyor</b> <span className="text-stone-500">({fmt(w, 1)} → {fmt(tw, 1)} kg)</span>
          <ul className="mt-1 space-y-0.5 text-xs text-stone-600">
            <li>Şimdiki tempo: günlük <b>{fmt(now.target)} kcal</b>, haftada yaklaşık {fmt(perWeek, 2)} kg{weeks ? <> · tahmini <b>{weeks} hafta</b></> : null}</li>
            {keep?.target ? <li>Hedefe ulaşınca stabilizasyon: günlük yaklaşık <b>{fmt(keep.target)} kcal</b> ile kilonu korursun</li> : null}
            <li>Kilon değiştikçe tempo kendiliğinden güncellenir; hedefe yaklaşınca stabilizasyona geçilir.</li>
          </ul>
        </>
      )}
      {low && <p className="mt-1.5 text-xs font-semibold text-amber-800">Bu hedef kilo BKİ 18,5'in altında kalıyor; diyetisyeninle konuşmanı öneririz.</p>}
    </div>
  )
}
