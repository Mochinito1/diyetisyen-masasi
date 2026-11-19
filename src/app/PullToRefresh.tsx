import { useEffect, useRef, useState } from 'react'

const TRIGGER = 80 // parmak hareketi (px); gösterge bunun yarısı kadar iner
const MAX = 110

/**
 * Aşağı çekerek yenileme. Tarayıcının kendi hareketi kapalıdır (sayfa ve alt menü yerinde kalır);
 * yalnızca küçük bir gösterge iner. Sayfa en üstteyken, bırakınca yeterince çekildiyse yeniler.
 */
export default function PullToRefresh() {
  const [dist, setDist] = useState(0)
  const [busy, setBusy] = useState(false)
  const start = useRef<number | null>(null)
  const cur = useRef(0)

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      const t = e.target as Element | null
      if (window.scrollY > 0 || e.touches.length !== 1 || t?.closest?.('.fixed, nav, input, textarea, select, [role="dialog"]')) { start.current = null; return }
      start.current = e.touches[0].clientY
      cur.current = 0
    }
    const onMove = (e: TouchEvent) => {
      if (start.current == null) return
      const dy = e.touches[0].clientY - start.current
      if (dy <= 0 || window.scrollY > 0) { cur.current = 0; setDist(0); return }
      cur.current = Math.min(MAX, dy * 0.5)
      setDist(cur.current)
    }
    const onEnd = () => {
      if (start.current == null) return
      start.current = null
      if (cur.current >= TRIGGER * 0.5) {
        setBusy(true)
        setDist(48)
        setTimeout(() => location.reload(), 150)
      } else setDist(0)
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    window.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [])

  if (dist <= 0 && !busy) return null
  const ready = dist >= 40
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center" style={{ transform: `translateY(${Math.max(dist - 36, 0)}px)` }} role="status" aria-live="polite">
      <span className="mt-2 grid h-9 w-9 place-items-center rounded-full border border-stone-200 bg-white text-brand-500 shadow-md" style={{ opacity: Math.min(1, dist / 40) }}>
        <svg className={busy ? 'animate-spin' : ''} style={busy ? undefined : { transform: `rotate(${dist * 4}deg)` }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 3v6h-6" /></svg>
        <span className="sr-only">{busy ? 'Yenileniyor' : ready ? 'Bırak, yenilensin' : 'Yenilemek için çek'}</span>
      </span>
    </div>
  )
}
