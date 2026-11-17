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