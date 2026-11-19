/** Hedef kiloya göre otomatik tempo ve stabilizasyon */

export type Phase = 'lose' | 'gain' | 'stabilize'

/** Hedef kiloya bu kadar yaklaşınca (kg) stabilizasyon dönemine geçilir */
export const STABLE_BAND_KG = 0.5
const KCAL_PER_KG = 7700

export interface AutoGoal {
  /** profile.goal ile aynı biçim: günlük kcal farkı */
  goal: string
  phase: Phase
  /** mevcut kilo − hedef kilo (kg); pozitifse verilecek, negatifse alınacak */
  gapKg: number
}

/** Geçerli bir hedef kilo mu? (kg) */
export const validTarget = (tw: number | null | undefined): tw is number => tw != null && Number.isFinite(tw) && tw >= 30 && tw <= 300

/**
 * Mevcut kilo ve hedef kilodan güvenli bir tempo seçer:
 * - verme: ≤ 4 kg kaldıysa −250, daha fazlaysa −500 kcal/gün (yaklaşık 0,25 ve 0,45 kg/hafta)
 * - alma: ≤ 3 kg kaldıysa +250, daha fazlaysa +500 kcal/gün
 * - hedefin ±0,5 kg yakınında: stabilizasyon (bakım kalorisi)
 */
export function autoGoal(weightKg: number, targetKg: number): AutoGoal {
  const gap = weightKg - targetKg
  if (Math.abs(gap) <= STABLE_BAND_KG) return { goal: '0', phase: 'stabilize', gapKg: gap }
  if (gap > 0) return { goal: gap <= 4 ? '-250' : '-500', phase: 'lose', gapKg: gap }
  return { goal: -gap <= 3 ? '250' : '500', phase: 'gain', gapKg: gap }
}

/** Günlük kcal farkıyla hedefe tahmini süre (hafta); fark 0 ise null */
export function weeksToGoal(gapKg: number, deltaKcal: number): number | null {
  const perWeek = (Math.abs(deltaKcal) * 7) / KCAL_PER_KG
  if (!perWeek || Math.abs(gapKg) <= STABLE_BAND_KG) return null
  return Math.ceil(Math.abs(gapKg) / perWeek)
}
