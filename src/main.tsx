import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './app/App'
import { AuthProvider } from './app/auth'
import { RoleProvider } from './app/role'
import { ThemeProvider } from './app/theme'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <ThemeProvider>
        <AuthProvider>
          <RoleProvider>
            <App />
          </RoleProvider>
        </AuthProvider>
      </ThemeProvider>
    </HashRouter>
  </StrictMode>,
)
// PWA: yalnızca yayın sürümünde çevrimdışı önbellek. Yeni sürüm gelince sayfa bir kez kendini yeniler.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const had = !!navigator.serviceWorker.controller
  let reloaded = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!had || reloaded) return
    reloaded = true
    location.reload()
  })
  window.addEventListener('load', () => { navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch(() => {}) })
}
