import { useState } from 'react'
import PageTitle from '../../components/ui/PageTitle'
import CalcResults from './CalcResults'
import ProfileFields from './ProfileFields'
import { EMPTY_PROFILE, toCalcInput, type Profile } from './profile'

export default function Calculator() {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE)
  return (
    <>
      <PageTitle title="Hesaplama" sub="BMH, günlük enerji ihtiyacı, hedef kalori ve makro dağılımı. Danışan seçmeden de kullanabilirsiniz." />
      <div className="grid gap-6 md:grid-cols-[380px_1fr]">
        <div className="h-fit rounded-2xl border border-stone-200 bg-white p-5">
          <ProfileFields value={profile} onChange={setProfile} />
        </div>
        <CalcResults input={toCalcInput(profile)} />
      </div>
    </>
  )
}