import { fold } from './text'

/** Eş anlamlılar (arama): anahtar → alternatif kelimeler; çok kelimeli alternatifte tüm kelimeler geçmeli */
const SYN_RAW: Record<string, string[]> = {
  'tavuk': ['piliç eti', 'piliç'], 'piliç': ['piliç eti'], 'civciv': ['piliç eti'],
  'kıyma': ['dana eti', 'sığır eti', 'kuzu eti', 'koyun eti', 'soya kıyma'],
  'dana': ['sığır'], 'sığır': ['dana'], 'biftek': ['dana eti', 'sığır eti'], 'bonfile': ['dana eti', 'sığır eti'], 'köfte': ['dana eti', 'sığır eti'],
  'kırmızıet': ['dana eti', 'sığır eti', 'kuzu eti', 'koyun eti'], 'kuzu': ['koyun'],
  'hindi': ['hindi eti'], 'et': ['dana eti', 'sığır eti', 'piliç eti', 'kuzu eti'],
  'balık': ['levrek', 'çipura', 'hamsi', 'sardalya', 'ton balığı', 'alabalık', 'karides', 'midye'], 'deniz ürünü': ['karides', 'midye', 'balık'],
  'sakatat': ['karaciğer', 'işkembe', 'sakatat'], 'ciğer': ['karaciğer'],
  'pilav': ['pirinç', 'bulgur'], 'pirinç': ['pilav'], 'spagetti': ['makarna'], 'erişte': ['makarna'], 'şehriye': ['makarna'], 'noodle': ['makarna'],
  'tahıl': ['buğday', 'yulaf', 'arpa', 'çavdar', 'pirinç', 'bulgur', 'mısır'], 'kepekli': ['kepek'],
  'lor': ['çökelek', 'peynir'], 'beyaz peynir': ['peynir'], 'süzme': ['yoğurt', 'çökelek'], 'laktoz': ['süt'],
  'inek sütü': ['süt, inek'], 'tereyağ': ['tereyağı'], 'sade yağ': ['tereyağı'], 'sıvıyağ': ['ayçiçek yağı', 'zeytinyağı', 'mısır yağı'], 'sıvı yağ': ['ayçiçek yağı', 'zeytinyağı'], 'yağ': ['zeytinyağı', 'ayçiçek yağı'],
  'zeytinyağ': ['zeytinyağı'], 'ayçiçeği': ['ayçiçek'],
  'kuruyemiş': ['ceviz', 'badem', 'fındık', 'antep fıstığı', 'fıstık', 'kaju'], 'çerez': ['ceviz', 'badem', 'fındık', 'antep fıstığı'], 'yer fıstığı': ['fıstık'],
  'kuru üzüm': ['üzüm, kuru', 'kuru üzüm'], 'kuru kayısı': ['kayısı, kuru', 'kayısı'], 'kuru incir': ['incir'],
  'mandalina': ['portakal'], 'greyfurt': ['limon', 'portakal'],
  'bal': ['bal, çiçek', 'bal, çam'], 'reçel': ['marmelat'],
  'şeker': ['toz şeker', 'pancar'], 'tatlı': ['baklava', 'sütlaç', 'kek', 'puding'], 'çikolata': ['kakao'],
  'patates': ['patates, sofralık'], 'domates': ['domates, sofralık'], 'kabak': ['balkabağı'], 'mantar': ['mantar, beyaz'],
  'fasulye': ['barbunya'], 'baklagil': ['nohut', 'mercimek', 'fasulye', 'barbunya', 'börülce'], 'garbanzo': ['nohut'],
  'cips': ['patates'], 'kraker': ['bisküvi'], 'simit': ['simit'], 'tost': ['ekmek', 'kaşar'], 'sandviç': ['ekmek'], 'hamburger': ['ekmek', 'dana eti'],
  'ayran': ['yoğurt'], 'kefir': ['kefir'], 'kahve': ['kahve'], 'meyve suyu': ['portakal suyu', 'elma suyu', 'kayısı suyu'],
  'yumurta': ['yumurta, tavuk'], 'omlet': ['yumurta, tavuk'], 'ketçap': ['domates'],
  'tahin': ['susam'], 'pekmez': ['pekmez'], 'helva': ['tahin'], 'kakao': ['kakao'], 'soya': ['soya'], 'tofu': ['soya'],
}

const SYN: Record<string, string[]> = {}
for (const k of Object.keys(SYN_RAW)) SYN[fold(k)] = SYN_RAW[k].map(fold)

/** Kelime + eş anlamlıları + "-ı/-si" ek toleransı */
const synAlts = (t: string): string[] => {
  const a = [t, ...(SYN[t] ?? [])]
  if (t.length >= 5 && /(si|su)$/.test(t)) a.push(t.slice(0, -2))
  else if (t.length >= 4 && /[iu]$/.test(t)) a.push(t.slice(0, -1))
  return a
}

const altHit = (h: string, alt: string) => {
  const w = alt.split(/[\s,]+/).filter(Boolean)
  return w.length > 0 && w.every((x) => h.includes(x))
}

/** Sorguyu gruplara ayırır: çok kelimeli anahtarlar önce eşleşir; her grup en az bir alternatifle tutmalı */
function synGroups(q: string): string[][] {
  let qs = ` ${fold(q).trim()} `
  const groups: string[][] = []
  Object.keys(SYN).filter((k) => k.includes(' ')).sort((a, b) => b.length - a.length).forEach((k) => {
    if (qs.includes(` ${k} `)) {
      qs = qs.replace(` ${k} `, ' ')
      groups.push([k, ...SYN[k]])
    }
  })
  qs.trim().split(/\s+/).filter(Boolean).forEach((t) => groups.push(synAlts(t)))
  return groups
}

/** `hay`: besinin katlanmış (fold) ad + bilimsel + yöresel + kod metni */
export function matchHay(hay: string, q: string): boolean {
  const g = synGroups(q)
  return g.length === 0 || g.every((al) => al.some((a) => altHit(hay, a)))
}

/** İlk kelimenin eş anlamlısıyla başlayan besin: sıralamada öne alınır */
export function synStartsWith(foldedName: string, q: string): boolean {
  const qf = fold(q).trim()
  const t = SYN[qf] ? qf : qf.split(/\s+/)[0]
  if (!t || !SYN[t]) return false
  return SYN[t].some((a) => foldedName.startsWith(a))
}