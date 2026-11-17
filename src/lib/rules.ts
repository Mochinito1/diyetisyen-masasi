import type { Food, FoodData } from './foods'
import { fmtVal } from './format'

/** Kural motorunun gördüğü besin: küçük harf ad, grup metni ve bileşen değerleri (ad -> değer) */
export interface RuleFood {
  code: string
  ln: string
  gl: string
  /** bileşen adı -> değer; olmayan değer NaN değil, yok */
  n: Record<string, number>
  kcal: number
  na: number
  sug: number
}

export function toRuleFood(f: Food, d: FoodData): RuleFood {
  const n: Record<string, number> = {}
  for (const k of Object.keys(f.v)) n[d.comps[+k][0]] = f.v[k]
  const sugars = ['Glukoz', 'Fruktoz', 'Sakaroz', 'Maltoz'].map((k) => n[k]).filter((x) => x != null)
  return {
    code: f.code,
    ln: f.name.toLocaleLowerCase('tr'),
    gl: f.groups.map((g) => d.groups[g]).join(' | ').toLocaleLowerCase('tr'),
    n,
    kcal: n['Enerji (kcal)'] ?? NaN,
    na: n['Sodyum, Na'] ?? (n['Tuz'] != null ? n['Tuz'] / 2.5 : NaN),
    sug: sugars.length ? sugars.reduce((a, b) => a + b, 0) : NaN,
  }
}

type Level = 'hide' | 'warn'
type RuleOut = [Level, string] | null
export interface Verdict {
  lvl: 'hide' | 'warn' | 'good'
  msg: string
  cond: string
}
export interface Evaluation {
  st: 'ok' | 'warn' | 'hide'
  res: Verdict[]
  boost: string[]
  safe: string[]
}

/** Eksik değer NaN sayılır; karşılaştırmalar yanlış döner */
const x = (F: RuleFood, k: string): number => F.n[k] ?? NaN
const fv = fmtVal

const B = '(^|[^a-zçğıöşüâîû])'
const R = (w: string) => new RegExp(`${B}(${w})`)
const has = (F: RuleFood, re: RegExp) => re.test(F.ln)

const rGlu = R('buğday|arpa|çavdar|tritikale|siyez|bulgur|irmik|makarna|ekmek|bazlama|lavaş|yufka|börek|milföy|katmer|pide|simit|galeta|bisküvi|kek|kraker|gofret|tarhana|mantı|kadayıf|baklava|güllaç|boza|bira|müsli|tam tahıllı|şehriye|kepek|ruşeym|aşure')
const rGluM = R('sucuk|salam|sosis|jambon|köfte|döner|bulyon|et suyu|tavuk suyu|çorba|soya kıyma|krem şanti|kahve kreması|puding|jöle|lokum|likör|dondurma|kabartma|mısır gevreği|baharat karışımı')
function gluten(F: RuleFood): 'safe' | 'yes' | 'maybe' | null {
  if (/glutensiz/.test(F.ln)) return 'safe'
  if (has(F, R('yulaf')) && !has(F, R('ekmek'))) return 'maybe'
  if (has(F, R('ekmek')) && /mısır/.test(F.ln)) return 'maybe'
  if (has(F, rGlu)) return 'yes'
  if (has(F, rGluM)) return 'maybe'
  return null
}
const rDairy = R('süt|yoğurt|peynir|kaymak|tereyağı|ayran|kefir|çökelek|dondurma|muhallebi|kazandibi|keşkül|krem|tulum|kaşar|lor')
const isDairy = (F: RuleFood) => (F.gl.includes('süt ve süt ürünleri') || has(F, rDairy)) && !/insan/.test(F.ln)
const isEgg = (F: RuleFood) => (F.gl.includes('yumurta') || /yumurta/.test(F.ln) || /mayonez/.test(F.ln)) && !/yumurtasız/.test(F.ln)
const rNut = R('fıstı|fındı|badem|ceviz|pikan|kaju')
const isNut = (F: RuleFood) => rNut.test(F.ln.replace(/hindistan cevizi/g, ''))
const isMeat = (F: RuleFood) =>
  F.gl.includes('et ve et ürünleri') || F.gl.includes('balık') ||
  has(F, R('kavurma|pastırma|sucuk|döner|bulyon|et suyu|tavuk suyu|köfte|etli|sakatat|jambon|salam|sosis'))
const isAlc = (F: RuleFood) => x(F, 'Alkol') > 0 || has(F, R('bira|şarap|rakı|likör|hardaliye'))
const isSweet = (F: RuleFood) =>
  F.gl.includes('şeker ve şekerli') ||
  has(F, R('pekmez|reçel|marmelat|lokum|pestil|baklava|helva|kazandibi|sütlaç|muhallebi|keşkül|şekeri|pişmaniye|cezerye|kadayıf|aşure|güllaç|kola|limonata|toz meşrubat|aromalı içecek|likör|çikolata|gofret|tatlı'))
const isSakatat = (F: RuleFood) => /sakatat/.test(F.ln)
const diab = (F: RuleFood) => /diyabetik|şekersiz|tatlandırıcılı/.test(F.ln)

export interface Condition {
  id: string
  group: string
  name: string
  short: string
  desc: string
  /** Seçilmez, danışan bilgisinden otomatik eklenir */
  auto?: boolean
  rules: ((F: RuleFood) => RuleOut)[]
  boost?: (F: RuleFood) => string | null
  safe?: (F: RuleFood) => string | null
}

export const CONDITIONS: Condition[] = [
  { id: 'colyak', group: 'Alerji ve intolerans', name: 'Çölyak / gluten hassasiyeti', short: 'Çölyak',
    desc: 'Buğday, arpa, çavdar, tritikale, bulgur, irmik ve bunlardan yapılan ekmek, makarna, hamur işi ve tatlılar gizlenir. İşlenmiş et, hazır çorba, yulaf gibi çapraz bulaşma veya katkı riski olanlar uyarı alır. Glutensiz etiketli ürünler öne çıkarılır. Dosyada gluten verisi yoktur, kural besin adına dayanır.',
    rules: [(F) => { const g = gluten(F); if (g === 'yes') return ['hide', 'Gluten içerir']; if (g === 'maybe') return ['warn', 'Gluten bulaşı veya katkı riski, etiketi kontrol edin']; return null }],
    safe: (F) => (gluten(F) === 'safe' ? 'Glutensiz ürün' : null) },
  { id: 'laktoz', group: 'Alerji ve intolerans', name: 'Laktoz intoleransı', short: 'Laktoz',
    desc: 'Laktozu 2 g/100 g ve üzeri olanlar gizlenir, 0,5–2 g arası uyarı alır. Laktoz değeri olmayan süt ürünleri uyarılır. Laktozsuz ürünler uygundur.',
    rules: [(F) => {
      if (/laktozsuz/.test(F.ln)) return null
      const l = x(F, 'Laktoz')
      if (l >= 2) return ['hide', `Laktoz ${fv(l)} g`]
      if (l >= 0.5) return ['warn', `Düşük laktoz ${fv(l)} g, tolerans kişiye göre değişir`]
      if (isNaN(l) && isDairy(F)) return ['warn', 'Süt ürünü, laktoz değeri dosyada yok']
      return null
    }],
    safe: (F) => (/laktozsuz/.test(F.ln) ? 'Laktozsuz ürün' : null) },
  { id: 'sut', group: 'Alerji ve intolerans', name: 'Süt proteini alerjisi', short: 'Süt alerjisi',
    desc: 'Süt, yoğurt, peynir, ayran, kefir, kaymak, tereyağı, dondurma, sütlü çikolata ve süt içeren tatlılar gizlenir. Laktozsuz ürünler de süt proteini taşıdığı için gizlenir.',
    rules: [(F) => (isDairy(F) ? ['hide', 'Süt ürünü'] : null)] },
  { id: 'yumurta', group: 'Alerji ve intolerans', name: 'Yumurta alerjisi', short: 'Yumurta alerjisi',
    desc: 'Yumurta ürünleri ve mayonez gizlenir. Kek, bisküvi, hamur işi ve muhallebi gibi yumurta içerebilen ürünler uyarı alır.',
    rules: [(F) => { if (isEgg(F)) return ['hide', 'Yumurta içerir']; if (has(F, R('kek|bisküvi|gofret|katmer|börek|mantı|kadayıf|baklava|puding|muhallebi|dondurma'))) return ['warn', 'Yumurta içerebilir']; return null }] },
  { id: 'yemis', group: 'Alerji ve intolerans', name: 'Fıstık ve kabuklu yemiş alerjisi', short: 'Yemiş alerjisi',
    desc: 'Yer fıstığı, fındık, badem, ceviz, antep fıstığı, çam fıstığı, pikan ve bunları içeren ürünler gizlenir. Çikolata, gofret, bisküvi ve müsli iz miktar riski için uyarılır.',
    rules: [(F) => { if (isNut(F)) return ['hide', 'Yemiş içerir']; if (has(F, R('çikolata|gofret|bisküvi|müsli|baklava'))) return ['warn', 'İz miktar yemiş riski']; return null }] },
  { id: 'deniz', group: 'Alerji ve intolerans', name: 'Balık ve deniz ürünü alerjisi', short: 'Deniz ürünü alerjisi',
    desc: 'Balık, karides, midye ve konserve balıklar gizlenir.',
    rules: [(F) => (F.gl.includes('balık') ? ['hide', 'Balık veya deniz ürünü'] : null)] },
  { id: 'susam', group: 'Alerji ve intolerans', name: 'Susam alerjisi', short: 'Susam alerjisi',
    desc: 'Susam, tahin, tahin helvası ve simit gizlenir. Diğer helvalar uyarılır.',
    rules: [(F) => { if (has(F, R('susam|tahin|simit'))) return ['hide', 'Susam içerir']; if (has(F, R('helva'))) return ['warn', 'Susam içerebilir']; return null }] },

  { id: 'diyabet', group: 'Metabolik ve klinik', name: 'Diyabet / insülin direnci', short: 'Diyabet',
    desc: 'Glukoz, fruktoz, sakaroz ve maltoz toplamı 15 g/100 g ve üzeri olanlar, şekerli ürünler ve tatlılar gizlenir. Şekeri 8 g ve üzeri veya karbonhidratı 50 g ve üzeri olanlar porsiyon kontrolü için uyarılır. Diyabetik etiketli ürünler öne çıkarılır.',
    rules: [(F) => {
      if (diab(F)) return null
      const s = F.sug, c = x(F, 'Karbonhidrat')
      if (s >= 15) return ['hide', `Şeker ${fv(s)} g/100 g`]
      if (F.gl.includes('içecekler') && s >= 5) return ['hide', 'Şekerli içecek']
      if (isNaN(s) && isSweet(F)) return ['hide', 'Şekerli ürün veya tatlı']
      if (s >= 8) return ['warn', `Şeker ${fv(s)} g, porsiyonu sınırlayın`]
      if (c >= 50) return ['warn', `Karbonhidrat ${fv(c)} g, porsiyon ve glisemik yük`]
      return null
    }],
    safe: (F) => (diab(F) ? 'Diyabetik ürün' : null) },
  { id: 'hipertansiyon', group: 'Metabolik ve klinik', name: 'Hipertansiyon / sodyum kısıtı', short: 'Hipertansiyon',
    desc: 'Sodyumu 600 mg/100 g ve üzeri olanlar gizlenir, 300–600 mg arası uyarı alır. Sodyum değeri yoksa tuz değerinden hesaplanır.',
    rules: [(F) => { const n = F.na; if (n >= 600) return ['hide', `Sodyum ${fv(n)} mg`]; if (n >= 300) return ['warn', `Sodyum ${fv(n)} mg`]; return null }] },
  { id: 'bobrek', group: 'Metabolik ve klinik', name: 'Kronik böbrek hastalığı', short: 'Böbrek',
    desc: 'Potasyumu 400 mg, fosforu 300 mg, sodyumu 600 mg/100 g ve üzeri olanlar gizlenir. Potasyum 250 mg, fosfor 200 mg veya protein 15 g ve üzeri uyarı alır. Eşikler evreye göre değişir, uzman onayı gerekir.',
    rules: [(F) => {
      const k = x(F, 'Potasyum, K'), p = x(F, 'Fosfor, P'), pr = x(F, 'Protein')
      if (k >= 400) return ['hide', `Potasyum ${fv(k)} mg`]
      if (p >= 300) return ['hide', `Fosfor ${fv(p)} mg`]
      if (F.na >= 600) return ['hide', `Sodyum ${fv(F.na)} mg`]
      if (k >= 250) return ['warn', `Potasyum ${fv(k)} mg`]
      if (p >= 200) return ['warn', `Fosfor ${fv(p)} mg`]
      if (pr >= 15) return ['warn', `Protein ${fv(pr)} g`]
      return null
    }] },
  { id: 'kolesterol', group: 'Metabolik ve klinik', name: 'Yüksek kolesterol / kalp hastalığı', short: 'Kolesterol',
    desc: 'Kolesterolü 100 mg veya doymuş yağı 6 g/100 g ve üzeri olanlar gizlenir. Kolesterol 50 mg veya doymuş yağ 3 g ve üzeri uyarı alır.',
    rules: [(F) => {
      const c = x(F, 'Kolesterol'), s = x(F, 'Yağ asitleri, toplam doymuş')
      if (c >= 100) return ['hide', `Kolesterol ${fv(c)} mg`]
      if (s >= 6) return ['hide', `Doymuş yağ ${fv(s)} g`]
      if (c >= 50) return ['warn', `Kolesterol ${fv(c)} mg`]
      if (s >= 3) return ['warn', `Doymuş yağ ${fv(s)} g`]
      return null
    }] },
  { id: 'gut', group: 'Metabolik ve klinik', name: 'Gut / yüksek ürik asit', short: 'Gut',
    desc: 'Sakatat, sardalya, hamsi, midye, bira ve et suyu gizlenir. Kırmızı et, karides, alkol, baklagil ve şekerli içecekler uyarılır. Dosyada pürin verisi yoktur, kural besin adına dayanır.',
    rules: [(F) => {
      if (isSakatat(F) || has(F, R('sardalya|hamsi|midye|bira|bulyon|et suyu'))) return ['hide', 'Yüksek pürin']
      if (isAlc(F) || has(F, R('karides|mercimek|nohut|soya kıyma|kola|limonata')) || has(F, R('dana|sığır|koyun|kuzu|keçi'))) return ['warn', 'Pürin veya fruktoz yükü']
      return null
    }] },
  { id: 'pku', group: 'Metabolik ve klinik', name: 'Fenilketonüri (PKU)', short: 'PKU',
    desc: 'Proteini 5 g/100 g ve üzeri olanlar ve aspartam içerenler gizlenir. Protein 1,5–5 g arası uyarı alır. PKU etiketli özel ürünler öne çıkarılır. Fenilalanin hesabı diyetisyen tarafından yapılmalıdır.',
    rules: [(F) => {
      if (/pku/.test(F.ln)) return null
      const p = x(F, 'Protein')
      if (x(F, 'Aspartam') > 0) return ['hide', 'Aspartam (fenilalanin kaynağı)']
      if (p >= 5) return ['hide', `Protein ${fv(p)} g`]
      if (p >= 1.5) return ['warn', `Protein ${fv(p)} g, miktarı hesaplayın`]
      return null
    }],
    safe: (F) => (/pku/.test(F.ln) ? 'PKU ürünü' : null) },
  { id: 'obezite', group: 'Metabolik ve klinik', name: 'Fazla kilo / obezite', short: 'Kilo yönetimi',
    desc: 'Hiçbir besin gizlenmez. Enerji yoğunluğu 400 kcal/100 g ve üzeri olanlar ile şekerli ürünler uyarılır.',
    rules: [(F) => { if (F.kcal >= 400) return ['warn', `Yüksek enerji yoğunluğu ${fv(F.kcal)} kcal`]; if (F.sug >= 15) return ['warn', 'Yüksek şeker']; return null }] },

  { id: 'gebelik', group: 'Fizyolojik durum', name: 'Gebelik / emzirme', short: 'Gebelik', auto: true,
    desc: 'Alkol ve A vitamini aşırı olan karaciğer gizlenir. Kafein, işlenmiş et, pastörize olmayabilecek peynirler, çiğ ürünler ve ton balığı uyarılır.',
    rules: [(F) => {
      if (isAlc(F)) return ['hide', 'Alkol']
      if (x(F, 'Retinol') >= 3000) return ['hide', 'Çok yüksek A vitamini (retinol)']
      if (has(F, R('kahve|kola|çay, siyah|çikolata'))) return ['warn', 'Kafein içerir']
      if (has(F, R('pastırma|sucuk|salam|sosis|jambon|kavurma'))) return ['warn', 'İşlenmiş et, iyi pişirilmeli']
      if (has(F, R('tulum|çökelek|otlu|beyaz peynir|peynir, beyaz|keçi|koyun'))) return ['warn', 'Pastörize olduğundan emin olun']
      if (has(F, R('ton balığı'))) return ['warn', 'Civa riski, sınırlayın']
      if (has(F, R('çiğ'))) return ['warn', 'Çiğ ürün']
      return null
    }] },

  { id: 'vejetaryen', group: 'Beslenme tercihi', name: 'Vejetaryen', short: 'Vejetaryen',
    desc: 'Et, balık, sakatat, et suyu ve et ürünleri gizlenir. Mantı ve jöle gibi hayvansal katkı içerebilenler uyarılır.',
    rules: [(F) => { if (isMeat(F)) return ['hide', 'Et veya balık ürünü']; if (has(F, R('mantı|jöle|baharat karışımı'))) return ['warn', 'Hayvansal içerik olabilir']; return null }] },
  { id: 'vegan', group: 'Beslenme tercihi', name: 'Vegan', short: 'Vegan',
    desc: 'Et ve balığın yanı sıra süt ürünleri, yumurta ve bal gizlenir.',
    rules: [(F) => {
      if (isMeat(F)) return ['hide', 'Et veya balık ürünü']
      if (isDairy(F)) return ['hide', 'Süt ürünü']
      if (isEgg(F)) return ['hide', 'Yumurta']
      if (has(F, R('bal,'))) return ['hide', 'Bal']
      if (has(F, R('mantı|jöle|kek|bisküvi|gofret'))) return ['warn', 'Hayvansal içerik olabilir']
      return null
    }] },

  { id: 'anemi', group: 'Öne çıkarılacak besinler', name: 'Demir eksikliği', short: 'Demir',
    desc: 'Demiri 3 mg/100 g ve üzeri olanlar yeşil etiketle öne çıkarılır, hiçbir besin gizlenmez.', rules: [],
    boost: (F) => (x(F, 'Demir, Fe') >= 3 ? `Demir kaynağı, ${fv(x(F, 'Demir, Fe'))} mg` : null) },
  { id: 'osteoporoz', group: 'Öne çıkarılacak besinler', name: 'Kemik sağlığı / kalsiyum', short: 'Kalsiyum',
    desc: 'Kalsiyumu 150 mg/100 g ve üzeri olanlar öne çıkarılır.', rules: [],
    boost: (F) => (x(F, 'Kalsiyum, Ca') >= 150 ? `Kalsiyum kaynağı, ${fv(x(F, 'Kalsiyum, Ca'))} mg` : null) },
  { id: 'lif', group: 'Öne çıkarılacak besinler', name: 'Kabızlık / lif artırma', short: 'Lif',
    desc: 'Diyet lifi 5 g/100 g ve üzeri olanlar öne çıkarılır.', rules: [],
    boost: (F) => (x(F, 'Lif, toplam diyet') >= 5 ? `Lif kaynağı, ${fv(x(F, 'Lif, toplam diyet'))} g` : null) },
]

export const CONDITION_GROUPS = [...new Set(CONDITIONS.map((c) => c.group))]

export const ageGroup = (a: number) =>
  a < 1 ? 'Bebek (0–1 yaş)' : a < 4 ? 'Küçük çocuk (1–3 yaş)' : a < 12 ? 'Çocuk (4–11 yaş)' : a < 18 ? 'Ergen (12–17 yaş)' : a < 65 ? 'Erişkin (18–64 yaş)' : 'Yaşlı (65+ yaş)'

export function ageRulesText(a: number | null): string[] {
  if (a == null) return []
  if (a < 1) return ['Bal gizlenir (botulizm riski)', 'Tuz ve sodyum 300 mg/100 g üzeri gizlenir', 'Şeker, çikolata, şekerli içecek, meyve suyu, çay, kahve, alkol gizlenir', 'Bütün kuruyemiş, tohum ve çerez gizlenir (boğulma riski)', 'İşlenmiş et ürünleri (sucuk, salam, sosis, pastırma) gizlenir', 'İnek sütü, ayran ve kefir ana içecek olarak uyarılır']
  if (a < 4) return ['Alkol, kafeinli içecekler ve cips gizlenir', 'Bütün kuruyemiş, tohum ve çerez gizlenir (4 yaşa kadar boğulma riski)', 'Sodyum 600 mg/100 g üzeri gizlenir', 'İşlenmiş et ürünleri ve şekerli ürünler uyarılır']
  if (a < 12) return ['Alkol, kola ve kahve gizlenir', 'Siyah çay ve enerji içeceği uyarılır', 'Sodyum 600 mg/100 g üzeri uyarılır']
  if (a < 18) return ['Alkol gizlenir', 'Kola, kahve, siyah çay uyarılır (kafein)', 'Sodyum 600 mg/100 g üzeri uyarılır']
  if (a >= 65) return ['Sodyum 400 mg/100 g üzeri uyarılır', 'Alkol uyarılır', 'Protein ve kalsiyum kaynakları öne çıkarılır']
  return ['Erişkinler için yaşa özel kısıt uygulanmaz']
}

type AgeOut = { lvl: 'hide' | 'warn' | 'boost'; msg: string }
export function ageRules(F: RuleFood, a: number | null): AgeOut[] {
  const o: AgeOut[] = []
  if (a == null || isNaN(a)) return o
  const add = (lvl: 'hide' | 'warn', msg: string) => o.push({ lvl, msg })
  const caffeine = has(F, R('kahve|kola|çay, siyah|enerji'))
  const wholeNut =
    (isNut(F) || has(F, R('ayçiçeği tohumu|çerez|leblebi|susam tohumu|keten tohumu|mısır, cin|haşhaş'))) &&
    !has(F, R('ezme|yağ|tahin|kreması|helva|baklava|çikolata|gofret|lokum|cezerye')) && !/ceviz.*ayran|ayran/.test(F.ln)
  const proc = has(F, R('sucuk|salam|sosis|jambon|pastırma|kavurma'))
  if (a < 18 && isAlc(F)) add('hide', '18 yaş altı için alkol')
  if (a < 1) {
    if (has(F, R('bal,'))) add('hide', '12 ay altı: bal (botulizm)')
    if (F.na >= 300) add('hide', `Bebek için sodyum yüksek (${fv(F.na)} mg)`)
    if (has(F, R('tuz,'))) add('hide', 'Bebek beslenmesinde tuz kullanılmaz')
    if ((F.gl.includes('içecekler') && !/su,/.test(F.ln)) || has(F, R('çikolata|gofret|lokum|pestil|cips|reçel|marmelat|toz meşrubat|limonata'))) add('hide', 'Bebek için uygun değil (şeker, kafein veya katkı)')
    if (has(F, R('şeker,'))) add('hide', 'Bebek için şeker önerilmez')
    if (/ suyu/.test(F.ln) && F.gl.includes('meyve')) add('hide', '12 ay altı meyve suyu önerilmez')
    if (wholeNut) add('hide', 'Boğulma riski')
    if (proc) add('hide', 'Bebek için işlenmiş et uygun değil')
    if (has(F, R('süt, inek|süt, pastörize|süt, uht|ayran|kefir'))) add('warn', '12 ay altı ana içecek olarak verilmez')
  } else if (a < 4) {
    if (caffeine) add('hide', 'Küçük çocuk için kafein')
    if (has(F, R('cips'))) add('hide', 'Küçük çocuk için uygun değil')
    if (wholeNut) add('hide', '4 yaş altı boğulma riski')
    if (F.na >= 600) add('hide', `Sodyum yüksek (${fv(F.na)} mg)`)
    if (proc) add('warn', 'İşlenmiş et, tuz ve nitrit')
    if (isSweet(F) && F.sug >= 15) add('warn', 'Şeker yüksek')
  } else if (a < 12) {
    if (has(F, R('kola|kahve|enerji'))) add('hide', 'Çocuk için kafein')
    if (has(F, R('çay, siyah'))) add('warn', 'Kafein')
    if (F.na >= 600) add('warn', `Sodyum yüksek (${fv(F.na)} mg)`)
  } else if (a < 18) {
    if (caffeine) add('warn', 'Kafein')
    if (F.na >= 600) add('warn', `Sodyum yüksek (${fv(F.na)} mg)`)
  } else if (a >= 65) {
    if (F.na >= 400) add('warn', `Yaşlı için sodyum ${fv(F.na)} mg`)
    if (isAlc(F)) add('warn', 'Alkol')
    if (x(F, 'Protein') >= 15 || x(F, 'Kalsiyum, Ca') >= 150) o.push({ lvl: 'boost', msg: 'Yaşlılar için protein veya kalsiyum kaynağı' })
  }
  return o
}

/** Danışanın etkin koşulları: seçilenler + (kadın, yetişkin, gebelik/emzirme seçiliyse) otomatik gebelik */
export function activeConditions(selected: string[], sex: string, age: number | null, phys: string): Condition[] {
  const set = new Set(selected)
  if (sex === 'K' && age != null && age >= 18 && phys !== 'none') set.add('gebelik')
  else set.delete('gebelik')
  return CONDITIONS.filter((c) => set.has(c.id))
}

/** Bir besinin danışana uygunluğu */
export function evaluateFood(F: RuleFood, conds: Condition[], age: number | null, removed: ReadonlySet<string>): Evaluation {
  const res: Verdict[] = []
  const boost: string[] = []
  const safe: string[] = []
  for (const c of conds) {
    for (const rl of c.rules) {
      const o = rl(F)
      if (o) res.push({ lvl: o[0], msg: o[1], cond: c.short })
    }
    const b = c.boost?.(F)
    if (b) boost.push(b)
    const s = c.safe?.(F)
    if (s) safe.push(s)
  }
  for (const o of ageRules(F, age)) {
    if (o.lvl === 'boost') boost.push(o.msg)
    else res.push({ lvl: o.lvl, msg: o.msg, cond: 'Yaş' })
  }
  if (removed.has(F.code)) res.push({ lvl: 'hide', msg: 'Diyetisyen listeden kaldırdı', cond: 'Liste' })
  const st = res.some((q) => q.lvl === 'hide') ? 'hide' : res.length ? 'warn' : 'ok'
  return { st, res, boost, safe }
}