import type { Food } from './foods'
import { foodUnits, makeItem, portion, totals, type Meal, type MenuItem } from './menu'

/** Şablonda besinler TürKomp kodlarıyla anılır; liste ise ilk bulunan (uygun) alternatif seçilir. */
const K = {
  PEYNIR: '01.02.0003', YUMURTA: '02.01.0007', DOMATES: '08.01.0015', SALATALIK: '08.01.0021',
  EKMEK: ['06.02.0027', '06.02.0013', '13.02.0004'], EKMEK_TUZSUZ: ['13.02.0021', '06.02.0027'],
  ZEYTIN: '09.02.0054', ELMA: '09.01.0015', CEVIZ: '09.01.0010', BADEM: '09.02.0009',
  MERCIMEK: '07.02.0001', NOHUT: '07.02.0003', BULGUR: ['12.02.0058', '06.02.0003'], PIRINC: '06.02.0003',
  TAVUK: ['03.01.0040', '03.01.0018'], MARUL: '08.01.0044', YAG: '05.02.0010', YOGURT: '01.02.0016',
  AYRAN: ['01.02.0022', '01.02.0016'], KABAK: '08.01.0027', BIBER: '08.01.0005',
  BALIK: ['04.01.0011', '04.01.0001', '03.01.0040'], PORTAKAL: '09.01.0042', MUZ: '09.01.0037',
  SUT: '01.01.0001', BROKOLI: '08.01.0012', ISPANAK: '08.01.0023', MAKARNA: ['13.02.0022', '06.02.0026'],
}

type Codes = string | string[]
export interface Template {
  id: string
  name: string
  desc: string
  /** [öğün, kod(lar), miktar]: miktar ilk ev ölçüsü cinsinden, ölçü yoksa ya da ≥50 ise gram */
  items: [Meal, Codes, number][]
}
export interface CustomTemplate {
  id: string
  name: string
  desc: string
  custom: true
  items: MenuItem[]
}
export type AnyTemplate = Template | CustomTemplate

export const TEMPLATES: Template[] = [
  {
    id: 'denge', name: 'Dengeli günlük menü',
    desc: 'Akdeniz tarzı genel başlangıç menüsü. Danışanın hedef kalorisine göre ölçeklenir.',
    items: [
      ['Kahvaltı', K.PEYNIR, 1.5], ['Kahvaltı', K.YUMURTA, 1], ['Kahvaltı', K.DOMATES, 1], ['Kahvaltı', K.SALATALIK, 1], ['Kahvaltı', K.EKMEK, 2], ['Kahvaltı', K.ZEYTIN, 4],
      ['Ara öğün 1', K.ELMA, 1], ['Ara öğün 1', K.CEVIZ, 3],
      ['Öğle', K.MERCIMEK, 3], ['Öğle', K.BULGUR, 3], ['Öğle', K.TAVUK, 1], ['Öğle', K.MARUL, 3], ['Öğle', K.YAG, 1], ['Öğle', K.YOGURT, 1],
      ['Ara öğün 2', K.AYRAN, 1],
      ['Akşam', K.KABAK, 1], ['Akşam', K.BIBER, 2], ['Akşam', K.BALIK, 1], ['Akşam', K.YAG, 1], ['Akşam', K.EKMEK, 1],
    ],
  },
  {
    id: 'gebelik', name: 'Gebelik',
    desc: 'Süt ürünleri, demir ve folat kaynakları öne çıkar. Kalori hedefi danışanın gebelik durumuna göre gelir.',
    items: [
      ['Kahvaltı', K.SUT, 1], ['Kahvaltı', K.YUMURTA, 1], ['Kahvaltı', K.PEYNIR, 1.5], ['Kahvaltı', K.DOMATES, 1], ['Kahvaltı', K.SALATALIK, 1], ['Kahvaltı', K.EKMEK, 2], ['Kahvaltı', K.ZEYTIN, 4],
      ['Ara öğün 1', K.PORTAKAL, 1], ['Ara öğün 1', K.CEVIZ, 4],
      ['Öğle', K.MERCIMEK, 3], ['Öğle', K.BULGUR, 3], ['Öğle', K.TAVUK, 1], ['Öğle', K.ISPANAK, 3], ['Öğle', K.YAG, 1], ['Öğle', K.YOGURT, 1],
      ['Ara öğün 2', K.AYRAN, 1], ['Ara öğün 2', K.MUZ, 1],
      ['Akşam', K.BALIK, 1], ['Akşam', K.KABAK, 1], ['Akşam', K.BROKOLI, 100], ['Akşam', K.YAG, 1], ['Akşam', K.EKMEK, 1],
    ],
  },
  {
    id: 'insulin', name: 'İnsülin direnci / diyabet',
    desc: 'Daha az rafine karbonhidrat, baklagil ve lif, protein ve sebze ağırlıklı. Hekim planına göre düzenleyin.',
    items: [
      ['Kahvaltı', K.YUMURTA, 2], ['Kahvaltı', K.PEYNIR, 1.5], ['Kahvaltı', K.DOMATES, 1], ['Kahvaltı', K.SALATALIK, 1], ['Kahvaltı', K.EKMEK, 1], ['Kahvaltı', K.CEVIZ, 3],
      ['Ara öğün 1', K.ELMA, 1], ['Ara öğün 1', K.BADEM, 0.5],
      ['Öğle', K.NOHUT, 3], ['Öğle', K.TAVUK, 1], ['Öğle', K.BROKOLI, 150], ['Öğle', K.MARUL, 3], ['Öğle', K.YAG, 1], ['Öğle', K.YOGURT, 1],
      ['Ara öğün 2', K.AYRAN, 1],
      ['Akşam', K.BALIK, 1], ['Akşam', K.KABAK, 1], ['Akşam', K.MERCIMEK, 2], ['Akşam', K.MARUL, 3], ['Akşam', K.YAG, 1],
    ],
  },
  {
    id: 'hipertansiyon', name: 'Hipertansiyon (düşük sodyum)',
    desc: 'Salamura ürünler ve tuzlu peynir yok, potasyumdan zengin sebze ve meyve ağırlıklı.',
    items: [
      ['Kahvaltı', K.YUMURTA, 1], ['Kahvaltı', K.YOGURT, 1], ['Kahvaltı', K.DOMATES, 1], ['Kahvaltı', K.SALATALIK, 1], ['Kahvaltı', K.EKMEK_TUZSUZ, 2], ['Kahvaltı', K.CEVIZ, 4],
      ['Ara öğün 1', K.MUZ, 1],
      ['Öğle', K.MERCIMEK, 3], ['Öğle', K.BULGUR, 3], ['Öğle', K.TAVUK, 1], ['Öğle', K.MARUL, 3], ['Öğle', K.YAG, 1],
      ['Ara öğün 2', K.PORTAKAL, 1], ['Ara öğün 2', K.BADEM, 0.5],
      ['Akşam', K.BALIK, 1], ['Akşam', K.KABAK, 1], ['Akşam', K.BROKOLI, 100], ['Akşam', K.YAG, 1], ['Akşam', K.EKMEK_TUZSUZ, 1],
    ],
  },
  {
    id: 'colyak', name: 'Çölyak (glutensiz)',
    desc: 'Gluten içeren tahıllar yerine pirinç ve glutensiz ürünler. Etiket kontrolü yine gereklidir.',
    items: [
      ['Kahvaltı', K.PEYNIR, 1.5], ['Kahvaltı', K.YUMURTA, 1], ['Kahvaltı', K.DOMATES, 1], ['Kahvaltı', K.SALATALIK, 1], ['Kahvaltı', ['13.02.0004'], 2], ['Kahvaltı', K.ZEYTIN, 4],
      ['Ara öğün 1', K.ELMA, 1], ['Ara öğün 1', K.CEVIZ, 3],
      ['Öğle', K.MERCIMEK, 3], ['Öğle', K.PIRINC, 3], ['Öğle', K.TAVUK, 1], ['Öğle', K.MARUL, 3], ['Öğle', K.YAG, 1], ['Öğle', K.YOGURT, 1],
      ['Ara öğün 2', K.AYRAN, 1],
      ['Akşam', K.KABAK, 1], ['Akşam', K.BIBER, 2], ['Akşam', K.BALIK, 1], ['Akşam', K.YAG, 1], ['Akşam', K.MAKARNA, 3],
    ],
  },
]

/** Danışana en uygun hazır şablon (hastalık seçimi eklenince genişleyecek) */
export function recommendTemplate(sex: string, phys: string): string {
  if (sex === 'K' && phys.startsWith('g')) return 'gebelik'
  return 'denge'
}

export interface BuildCtx {
  byCode: Map<string, Food>
  groups: string[]
  idx: Record<string, number>
  macro: { c: number; p: number }
  /** Danışan için uygun olmayan besin mi? (hastalık kuralları eklenince kullanılacak) */
  hidden?: (f: Food) => boolean
}

export interface BuildResult {
  items: MenuItem[]
  skipped: string[]
  base: number
  kcal: number
  /** Enerjiden gelen yüzdeler */
  pp: number
  cp: number
  fp: number
}

interface Raw {
  F: Food
  meal: Meal
  u: string
  q: number
  g: number
}

/**
 * Şablonu hedef kaloriye ve makro yüzdelerine göre ölçekler.
 * Kurallar: sayılabilir birimler (adet, orta boy) tam sayı, diğerleri 0,5 adım, gram 5 g adım;
 * meyve/sebze/yağ/kuruyemiş gerçekçi üst sınırla kısıtlanır; protein kaynakları (et, balık, yumurta) menüden çıkmaz.
 */
export function buildTemplate(t: AnyTemplate, target: number | null, ctx: BuildCtx): BuildResult {
  const skipped: string[] = []
  const hid = (f: Food) => ctx.hidden?.(f) ?? false
  const gname = (f: Food) => ctx.groups[f.groups[0]] ?? ''
  const short = (f: Food) => f.name.replace(/\s*\(.*$/, '').trim()

  let raw: Raw[]
  if ('custom' in t) {
    raw = t.items.flatMap((it): Raw[] => {
      const F = ctx.byCode.get(it.code)
      if (!F) return []
      if (hid(F)) { skipped.push(short(F)); return [] }
      return [{ F, meal: it.meal, u: it.u, q: it.q, g: it.g }]
    })
  } else {
    raw = t.items.flatMap(([meal, codes, qty]): Raw[] => {
      const cl = Array.isArray(codes) ? codes : [codes]
      const foods = cl.map((c) => ctx.byCode.get(c)).filter((f): f is Food => !!f)
      const F = foods.find((f) => !hid(f))
      if (!F) { skipped.push(foods[0] ? short(foods[0]) : cl[0]); return [] }
      const L = foodUnits(F, ctx.groups)
      const u = L.length > 1 && qty < 50 ? L[0].u : 'g'
      return [{ F, meal, u, q: qty, g: u === 'g' ? qty : qty * L[0].g }]
    })
  }

  const base = raw.reduce((a, x) => a + portion(x.F, x.g).kcal, 0) || 1
  const CNT = (x: Raw) => x.u !== 'g' && /adet|orta boy|büyük boy|küçük boy|tane|\(iç\)|^iç/.test(x.u) && !/dilim/.test(x.u)
  const stepOf = (x: Raw) => (x.u === 'g' ? 5 : CNT(x) ? 1 : 0.5)
  const rnd = (x: Raw, q: number) => { const st = stepOf(x); return Math.max(st, Math.round(q / st) * st) }
  const PROTG = (x: Raw) => /^(Et |Balık|Yumurta)/.test(gname(x.F))

  const capOf = (x: Raw) => {
    const g0 = gname(x.F)
    const nm = x.F.name.toLocaleLowerCase('tr')
    const g = x.u === 'g'
    let ab: number | null = null
    if (/^Meyve/.test(g0)) ab = g ? 250 : 2
    else if (/^Sebze/.test(g0))
      ab = /marul|ıspanak|roka|tere|semizotu|dereotu|maydanoz|nane|lahana|kıvırcık|salata/.test(nm) || /avuç/.test(x.u) ? (g ? 150 : 3) : g ? 300 : 2.5
    else if (/^Sıvı ve katı yağlar/.test(g0)) ab = g ? 30 : 3
    else if (/^Yağlı tohumlar/.test(g0) && /ceviz|badem|fındık|fıstık|kaju/.test(nm)) ab = g ? 60 : 6
    const q0 = x.q
    if (/^Tahıl/.test(g0)) ab = g ? 150 : /dilim/.test(x.u) ? 3 : 6
    else if (/^Yağlı tohumlar/.test(g0) && ab == null) ab = g ? 100 : 6
    if (ab == null) return Math.max(q0, 0.5) * (PROTG(x) ? 3 : 2)
    const c = Math.max(q0, Math.min(q0 * 2, ab))
    return CNT(x) ? Math.max(1, Math.floor(c)) : c
  }
  const CAP = raw.map(capOf)
  const mk = (k: number) => raw.map((x, i) => Math.min(CAP[i], rnd(x, x.q * k)))
  /** birim başına değerler (gram başına doğrusal) */
  const per = raw.map((x) => {
    const pt = portion(x.F, 1)
    const ug = x.g / (x.q || 1)
    return { k: pt.kcal * ug, p: pt.p * ug, c: pt.c * ug, f: pt.f * ug }
  })
  const mp = ctx.macro.p || 20
  const mcc = ctx.macro.c || 50
  const mf = Math.max(0, 100 - mp - mcc)
  const k0 = target ? target / base : 1
  const FLO = raw.map((x) => (PROTG(x) ? Math.max(stepOf(x), rnd(x, x.q * Math.min(1, k0) * 0.75)) : stepOf(x)))

  let q: number[]
  if (!target) {
    q = raw.map((x) => x.q)
  } else {
    let k = k0
    let bq: number[] = mk(k)
    let be = 1e9
    for (let n = 0; n < 8; n++) {
      const qq = mk(k)
      const tot = qq.reduce((a, v, i) => a + v * per[i].k, 0)
      const e = Math.abs(tot - target)
      if (e < be) { be = e; bq = qq }
      if (e / target < 0.02) break
      k *= target / tot
    }
    q = bq
    const q0 = raw.map((x) => x.q * k0)
    const meals = raw.map((x) => x.meal)
    const tot = () => q.reduce((a, v, i) => ({ k: a.k + v * per[i].k, p: a.p + v * per[i].p, c: a.c + v * per[i].c, f: a.f + v * per[i].f }), { k: 0, p: 0, c: 0, f: 0 })
    const cost = (t2: { k: number; p: number; c: number; f: number }, qq: number[]) => {
      const ek = (100 * Math.abs(t2.k - target)) / target
      const mk4 = 4 * t2.p + 4 * t2.c + 9 * t2.f || 1
      const sp = (400 * t2.p) / mk4, sc = (400 * t2.c) / mk4, sf = (900 * t2.f) / mk4
      let c = 10 * ek * ek + 3 * ((sp - mp) ** 2 + (sc - mcc) ** 2 + (sf - mf) ** 2)
      for (let i = 0; i < qq.length; i++) {
        const r = Math.log((qq[i] + 0.25) / (q0[i] + 0.25))
        c += 0.6 * r * r
      }
      return c
    }
    let cur = cost(tot(), q)
    for (let it = 0; it < 500; it++) {
      const T = tot()
      let bi = -1, bv = 0, bc = cur
      for (let i = 0; i < q.length; i++) {
        const st = stepOf(raw[i])
        for (const nv of [q[i] + st, q[i] - st, q[i] + 2 * st, q[i] - 2 * st, 0]) {
          if (nv < 0 || nv === q[i] || (nv > 0 && nv < FLO[i]) || nv > CAP[i] + 1e-9) continue
          if (nv === 0 && PROTG(raw[i])) continue
          if (nv === 0 && !q.some((v, j) => j !== i && v > 0 && meals[j] === meals[i])) continue
          const d = nv - q[i]
          const t2 = { k: T.k + d * per[i].k, p: T.p + d * per[i].p, c: T.c + d * per[i].c, f: T.f + d * per[i].f }
          const old = q[i]
          q[i] = nv
          const c2 = cost(t2, q)
          q[i] = old
          if (c2 < bc - 1e-9) { bc = c2; bi = i; bv = nv }
        }
      }
      if (bi < 0) break
      q[bi] = bv
      cur = bc
    }
  }

  const items: MenuItem[] = []
  raw.forEach((x, i) => {
    if (q[i] > 0) items.push(makeItem(x.F, ctx.groups, q[i], x.u, x.meal))
  })
  const T = totals(items, ctx.byCode, ctx.idx)
  const mb = 4 * T.p + 4 * T.c + 9 * T.f || 1
  return { items, skipped, base, kcal: T.kcal, pp: (400 * T.p) / mb, cp: (400 * T.c) / mb, fp: (900 * T.f) / mb }
}