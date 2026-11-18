import { useState } from 'react'
import { calculate, type CalcInput } from '../../lib/formulas'
import ProfileSummary, { DEFAULT_MACRO } from '../portal/ProfileSummary'

/** Diyetisyen hesaplama sonuçları: danışan profilindeki görünümün aynısı; makro dağılımı kaydırıcılarla ayarlanır.
 *  macro/onMacro verilirse (danışan kaydı) seçim danışana kaydedilir, verilmezse yalnızca bu ekranda geçerlidir. */
export default function CalcResults({ input, macro, onMacro }: { input: CalcInput; macro?: { c: number; p: number }; onMacro?: (m: { c: number; p: number }) => void }) {
  const [local, setLocal] = useState(DEFAULT_MACRO)
  const r = calculate(input)
  if (!r)
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">
        Cinsiyet, yaş, boy ve kilo girince sonuçlar burada görünür.
      </div>
    )
  return <ProfileSummary input={input} macroPct={macro ?? local} onMacro={onMacro ?? setLocal} />
}
