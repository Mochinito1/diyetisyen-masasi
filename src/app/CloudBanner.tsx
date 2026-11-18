import { useEffect, useState } from 'react'

/** Bulut eşitleme hatalarını (kaydedilemeyen veri vb.) görünür kılar */
export default function CloudBanner() {
  const [msg, setMsg] = useState('')
  useEffect(() => {
    const on = (e: Event) => setMsg(String((e as CustomEvent).detail ?? 'Bilinmeyen hata'))
    window.addEventListener('dm-cloud-error', on)
    return () => window.removeEventListener('dm-cloud-error', on)
  }, [])
  if (!msg) return null
  return (
    <div role="alert" className="bg-red-100 px-4 py-2 text-sm text-red-800">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3">
        <span className="min-w-0 flex-1"><b>Sunucuya kaydedilemedi:</b> {msg}. Sayfayı yenileyip tekrar deneyin; sorun sürerse çıkış yapıp yeniden girin.</span>
        <button className="rounded-lg border border-red-300 px-2 py-0.5 font-semibold" onClick={() => setMsg('')}>Kapat</button>
      </div>
    </div>
  )
}