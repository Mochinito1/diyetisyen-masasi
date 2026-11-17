export interface UnitOpt {
  u: string
  g: number
}

/** Ev ölçüleri: besin adına (küçük harf) uyan ilk kural kullanılır. Değerler yaklaşık gramdır. */
const UR: [RegExp, [string, number][]][] = [
  [/^süt, (inek|keçi|koyun|manda)/, [['su bardağı', 200], ['çay bardağı', 100], ['yemek kaşığı', 15]]],
  [/^ayran|^kefir|^yayık/, [['su bardağı', 200], ['çay bardağı', 100]]],
  [/^yoğurt/, [['kase', 150], ['yemek kaşığı', 25], ['su bardağı', 200]]],
  [/^(?!börek)(.*peynir|^çökelek|.*kaşar)/, [['dilim (kibrit kutusu)', 30], ['yemek kaşığı', 15]]],
  [/^yumurta, tavuk, tam/, [['adet', 50]]],
  [/^yumurta, tavuk, beyaz/, [['adet (ak)', 30]]],
  [/^yumurta, tavuk, sarı/, [['adet (sarı)', 18]]],
  [/^yumurta, bıldırcın/, [['adet', 10]]],
  [/^ekmek/, [['orta boy dilim', 30], ['ince dilim', 20], ['kalın dilim', 40]]],
  [/^simit/, [['adet', 110]]],
  [/^bazlama/, [['adet', 80]]],
  [/^lavaş/, [['adet (orta)', 60]]],
  [/^(mercimek|nohut|fasulye|barbunya|bezelye|bakla|börülce).*kuru/, [['yemek kaşığı (kuru)', 15], ['su bardağı (kuru)', 180]]],
  [/^(bulgur|pirinç, )/, [['yemek kaşığı (kuru)', 15], ['su bardağı (kuru)', 170]]],
  [/^makarna/, [['yemek kaşığı (kuru)', 10], ['su bardağı (kuru)', 100]]],
  [/^yulaf, /, [['yemek kaşığı', 10], ['su bardağı', 90]]],
  [/tarhana/, [['yemek kaşığı (kuru)', 8]]],
  [/^(buğday, un|un,|arpa unu|yulaf unu|pirinç unu|çavdar unu)/, [['yemek kaşığı', 10], ['su bardağı', 110]]],
  [/^(elma|armut)/, [['orta boy', 150]]],
  [/^portakal(?! suyu)/, [['orta boy', 150]]],
  [/^mandarin|^mandalina/, [['orta boy', 70]]],
  [/^muz/, [['orta boy (soyulmuş)', 100]]],
  [/^şeftali/, [['orta boy', 150]]],
  [/^kayısı.*(kuru|günkurusu)|^kuru kayısı/, [['adet (kuru)', 8]]],
  [/^kayısı/, [['adet', 35]]],
  [/^erik.*kuru/, [['adet (kuru)', 8]]],
  [/^erik/, [['adet', 30]]],
  [/^incir.*kuru|^incir, kuru/, [['adet (kuru)', 20]]],
  [/^incir/, [['adet', 50]]],
  [/^çilek(?! suyu)/, [['adet', 12]]],
  [/^kivi/, [['adet', 70]]],
  [/^karpuz/, [['orta dilim', 250]]],
  [/^kavun/, [['orta dilim', 200]]],
  [/^hurma, kuru/, [['adet', 8]]],
  [/^ceviz/, [['adet (iç)', 4], ['avuç', 30]]],
  [/^(badem, iç|fındık, iç|fındık iç|antep fıstığı|fıstık|kaju|kabak çekirdeği|ay çekirdeği|susam)/, [['avuç', 30], ['yemek kaşığı', 10]]],
  [/^(tereyağı|margarin)/, [['yemek kaşığı', 15], ['çay kaşığı', 5]]],
  [/^bal,/, [['yemek kaşığı', 20], ['çay kaşığı', 7]]],
  [/pekmez|^reçel|^marmelat/, [['yemek kaşığı', 25], ['çay kaşığı', 8]]],
  [/^tahin,/, [['yemek kaşığı', 15], ['çay kaşığı', 5]]],
  [/^şeker, beyaz/, [['küp', 4], ['çay kaşığı', 5], ['yemek kaşığı', 12]]],
  [/salçası/, [['yemek kaşığı', 20]]],
  [/^zeytin ezmesi/, [['yemek kaşığı', 15]]],
  [/^zeytin, /, [['adet (orta)', 4]]],
  [/^domates, sofralık, kiraz/, [['adet', 15]]],
  [/^domates, sofralık/, [['orta boy', 120]]],
  [/^salatalık$/, [['orta boy', 100]]],
  [/^biber, çarliston/, [['adet', 30]]],
  [/^biber, (dolma|kırmızı)/, [['orta boy', 100]]],
  [/^havuç/, [['orta boy', 80]]],
  [/^patates, sofralık/, [['orta boy', 150]]],
  [/^soğan, (sarı|mor)/, [['orta boy', 100]]],
  [/^kabak, yazlık/, [['orta boy', 150]]],
  [/^patlıcan/, [['orta boy', 200]]],
  [/^mısır, tatlı$/, [['su bardağı (tane)', 150]]],
  [/^(ıspanak|roka|marul|semizotu|maydanoz|dereotu|nane)/, [['avuç dolusu', 30]]],
  [/^(dana eti|piliç eti|hindi eti|kuzu eti|koyun eti)/, [['porsiyon (çiğ, avuç içi)', 120]]],
  [/^kasap köfte/, [['adet (köfte)', 30]]],
  [/^hamsi$/, [['adet', 12], ['porsiyon (çiğ)', 120]]],
  [/^(ton balığı|sardalya), konserve/, [['küçük kutu (süzülmüş)', 80]]],
  [/^(levrek|çipura|alabalık|istavrit|palamut|uskumru|mezgit|barbun|somon|kalkan|hamsi)/, [['porsiyon (çiğ)', 120]]],
  [/^çay, siyah/, [['çay kaşığı (kuru)', 3]]],
  [/^kahve, çözünebilir/, [['çay kaşığı', 2]]],
  [/^su, /, [['su bardağı', 200]]],
]

const OIL_GROUP = 'Sıvı ve katı yağlar'

/** Bir besin için seçilebilir ölçüler. Son seçenek her zaman gramdır. */
export function unitsFor(name: string, firstGroup = ''): UnitOpt[] {
  const n = name.toLocaleLowerCase('tr')
  let u: [string, number][] | null = null
  for (const [re, list] of UR) {
    if (re.test(n)) {
      u = list
      break
    }
  }
  if (!u && firstGroup === OIL_GROUP) u = [['yemek kaşığı', 10], ['tatlı kaşığı', 5], ['çay kaşığı', 3]]
  return [...(u ?? []).map(([unit, g]) => ({ u: unit, g })), { u: 'g', g: 1 }]
}