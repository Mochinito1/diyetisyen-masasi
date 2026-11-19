// Diyetisyen Masası: basit çevrimdışı önbellek. Sadece kendi sitesinin dosyaları saklanır; Supabase ve diğer istekler doğrudan ağa gider.
const CACHE = 'dm-shell-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== location.origin) return

  // Sayfa açılışı: önce ağ (hep güncel sürüm), çevrimdışıysa önbellekteki sayfa
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(new Request(self.registration.scope), copy))
        return res
      }).catch(() => caches.match(new Request(self.registration.scope))),
    )
    return
  }

  // Dosyalar (adı içeriğe göre değişen js/css, simgeler): önce önbellek, yoksa ağdan alıp sakla
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)) }
      return res
    })),
  )
})
