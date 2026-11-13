import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import UserProvider from './context/UserProvider.jsx'
import PreferencesProvider from './context/PreferencesProvider.jsx'
import CategoriesProvider from './context/CategoriesProvider.jsx'
import PlanProvider from './context/PlanProvider.jsx'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UserProvider>
          <PreferencesProvider>
            <CategoriesProvider>
              <PlanProvider>
                <App />
              </PlanProvider>
            </CategoriesProvider>
          </PreferencesProvider>
        </UserProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
