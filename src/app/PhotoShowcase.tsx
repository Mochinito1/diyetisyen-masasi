import { useState } from 'react'

const U = (id: string, w: number) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`

interface Photo { id: string; alt: string; cap: string }

const PHOTOS: Photo[] = [
  { id: 'photo-1512621776951-a57141f2eefd', alt: 'Renkli sebzeli sağlıklı kase', cap: 'Dengeli ve renkli tabak' },
  { id: 'photo-1517836357463-d25dfeac3438', alt: 'Ağırlık antrenmanı', cap: 'Güç antrenmanı' },
  { id: 'photo-1490645935967-10de6ba17061', alt: 'Avokadolu ve yumurtalı sağlıklı tabak', cap: 'Taze ve doyurucu' },
  { id: 'photo-1571019613454-1cb2f99b2d8b', alt: 'Evde egzersiz yapan kadın', cap: 'Evde hareket' },
  { id: 'photo-1498837167922-ddd27525d352', alt: 'Taze sebze ve yeşillik çeşitleri', cap: 'Mevsiminde sebze' },
  { id: 'photo-1490474418585-ba9bad8fd0ea', alt: 'Meyve tabağı', cap: 'Meyve ile tatlı ihtiyacı' },
  { id: 'photo-1476480862126-209bfaa8edc8', alt: 'Merdiven çıkan spor ayakkabıları', cap: 'Her adım sayılır' },
]

function Pic({ p, w, className }: { p: Photo; w: number; className: string }) {
  const [bad, setBad] = useState(false)
  return (
    <figure className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 to-stone-100 ${className}`}>
      {!bad && (
        <img src={U(p.id, w)} alt={p.alt} loading="lazy" onError={() => setBad(true)} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      )}
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(0,0,0,0.72)] to-transparent px-3 pb-2.5 pt-8 text-sm font-semibold text-[#ffffff]">{p.cap}</figcaption>
    </figure>
  )
}

/** Anasayfa vitrin alanı: yemek, spor ve diyetisyenlik temalı örnek fotoğraflar (yer tutucu) */
export default function PhotoShowcase() {
  const [hero, ...rest] = PHOTOS
  return (
    <section aria-label="Vitrin" className="grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-[repeat(2,minmax(0,190px))] lg:grid-rows-[repeat(2,minmax(0,230px))]">
      <div className="relative col-span-2 row-span-2 min-h-[260px] md:min-h-0">
        <Pic p={hero} w={1100} className="h-full w-full" />
        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-[rgba(0,0,0,0.55)] to-transparent p-5 pb-12 text-[#ffffff]">
          <p className="font-display text-xl font-bold leading-snug drop-shadow md:text-3xl">Dengeli beslen,<br />hareket et, iyi hisset.</p>
          <p className="mt-1 text-sm drop-shadow">Kişiye özel beslenme planı ve takip</p>
        </div>
      </div>
      {rest.slice(0, 4).map((p) => <Pic key={p.id} p={p} w={600} className="aspect-[4/3] md:aspect-auto" />)}
    </section>
  )
}
