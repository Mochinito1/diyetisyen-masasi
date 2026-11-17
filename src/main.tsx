import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './app/App'
import { RoleProvider } from './app/role'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <RoleProvider>
        <App />
      </RoleProvider>
    </HashRouter>
  </StrictMode>,
)