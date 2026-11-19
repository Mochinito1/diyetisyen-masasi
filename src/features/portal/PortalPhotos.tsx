import { useEffect, useRef, useState } from 'react'
import { cloudEnabled, cloudPhotoUrl } from '../../lib/cloud'
import { MAX_PHOTOS_PER_MEAL, leftText } from '../../lib/photos'
import type { MealPhoto } from '../clients/types'

/** Tek fotoğraf küçük resmi; dokununca büyür. Bulutta resim, kısa süreli imzalı bağlantıyla alınır. */
export function PhotoThumb({ photo, onRemove, size = 64 }: { photo: MealPhoto; onRemove?: () => void; size?: number }) {
  const [src, setSrc] = useState<string | null>(photo.data ?? null)
  const [big, setBig] = useState(false)
  useEffect(() => {
    let live = true
    if (!photo.data && photo.path && cloudEnabled) void cloudPhotoUrl(photo.path).then((u) => { if (live) setSrc(u) })
    return () => { live = false }
  }, [photo.data, photo.path])

  return (
    <>
      <div className="relative flex-none" style={{ width: size, height: size }}>
        <button className="block h-full w-full overflow-hidden rounded-xl border border-stone-300 bg-stone-100" onClick={() => src && setBig(true)} aria-label="Fotoğrafı büyüt">
          {src ? <img src={src} alt="Öğün fotoğrafı" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-[10px] text-stone-500">…</span>}
        </button>
        {onRemove && (
          <button className="absolute -right-1.5 -top-1.5 grid place-items-center rounded-full border border-stone-300 bg-white p-0 text-sm font-bold leading-none text-red-700 shadow" style={{ width: 24, height: 24, minWidth: 0, minHeight: 0 }} aria-label="Fotoğrafı sil" onClick={() => confirm('Bu fotoğraf silinsin mi?') && onRemove()}>×</button>
        )}
      </div>
      {big && src && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4" role="dialog" aria-label="Fotoğraf" onClick={() => setBig(false)}>
          <img src={src} alt="Öğün fotoğrafı" className="max-h-full max-w-full rounded-xl" />
          <span className="absolute bottom-4 rounded-full bg-black/60 px-3 py-1 text-xs text-white">{leftText(photo)} sonra silinecek · kapatmak için dokun</span>
        </div>
      )}
    </>
  )
}

/** Danışan: bir öğünün fotoğrafları ve "Fotoğraf ekle" düğmesi */
export default function PortalPhotos({ photos, busy, error, onPick, onRemove }: {
  photos: MealPhoto[]
  busy: boolean
  error: string
  onPick: (f: File) => void
  onRemove: (id: string) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const full = photos.length >= MAX_PHOTOS_PER_MEAL
  return (
    <div className="mb-2">
      <div className="flex flex-wrap items-center gap-2">
        {photos.map((p) => <PhotoThumb key={p.id} photo={p} onRemove={() => onRemove(p.id)} />)}
        <button className="h-16 min-w-[4rem] flex-1 rounded-xl border border-dashed border-stone-300 px-3 text-sm font-semibold text-stone-600 hover:border-brand-500 hover:text-brand-500 disabled:opacity-50" disabled={busy || full} onClick={() => ref.current?.click()}>
          {busy ? 'Yükleniyor…' : full ? `En fazla ${MAX_PHOTOS_PER_MEAL} fotoğraf` : '📷 Fotoğraf ekle'}
        </button>
        <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onPick(f) }} />
      </div>
      {photos.length > 0 && <p className="mt-1 text-[11px] text-stone-500">Fotoğraflar eklendikten 4 saat sonra otomatik silinir.</p>}
      {error && <p className="mt-1 text-xs text-red-700" role="alert">{error}</p>}
    </div>
  )
}
