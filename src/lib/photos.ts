import type { MealPhoto } from '../features/clients/types'

/** Öğün fotoğrafları eklendikten bu süre sonra silinir (ve süre dolunca hiçbir yerde gösterilmez) */
export const PHOTO_TTL_MS = 4 * 60 * 60 * 1000
/** Bir öğüne en fazla bu kadar fotoğraf eklenebilir */
export const MAX_PHOTOS_PER_MEAL = 3
const MAX_SIDE = 1024

export const isFresh = (p: MealPhoto, now = Date.now()) => now - p.ts < PHOTO_TTL_MS

/** Kalan süreyi "3 sa 20 dk" biçiminde yazar */
export function leftText(p: MealPhoto, now = Date.now()): string {
  const min = Math.max(0, Math.ceil((p.ts + PHOTO_TTL_MS - now) / 60000))
  const h = Math.floor(min / 60)
  return h > 0 ? `${h} sa ${min % 60} dk` : `${min} dk`
}

/** Fotoğrafı tarayıcıda küçültür (en uzun kenar 1024 px) ve JPEG'e çevirir; telefon fotoğrafları yaklaşık 100 KB olur */
export async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Yalnızca fotoğraf eklenebilir.')
  let src: ImageBitmap | HTMLImageElement
  if (typeof createImageBitmap === 'function') {
    src = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } else {
    src = await new Promise<HTMLImageElement>((ok, no) => {
      const img = new Image()
      img.onload = () => ok(img)
      img.onerror = () => no(new Error('Fotoğraf okunamadı.'))
      img.src = URL.createObjectURL(file)
    })
  }
  const w0 = 'naturalWidth' in src ? src.naturalWidth : src.width
  const h0 = 'naturalHeight' in src ? src.naturalHeight : src.height
  const k = Math.min(1, MAX_SIDE / Math.max(w0, h0))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w0 * k))
  canvas.height = Math.max(1, Math.round(h0 * k))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Fotoğraf işlenemedi.')
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height)
  return await new Promise<Blob>((ok, no) => canvas.toBlob((b) => (b ? ok(b) : no(new Error('Fotoğraf işlenemedi.'))), 'image/jpeg', 0.72))
}

export const blobToDataUrl = (b: Blob) =>
  new Promise<string>((ok, no) => {
    const r = new FileReader()
    r.onload = () => ok(String(r.result))
    r.onerror = () => no(new Error('Fotoğraf okunamadı.'))
    r.readAsDataURL(b)
  })
