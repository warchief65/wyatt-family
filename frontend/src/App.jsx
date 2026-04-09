import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import AppNav from '@/components/layout/AppNav'
import AppFooter from '@/components/layout/AppFooter'
import AppRouter from '@/router'
import { useAuthStore } from '@/stores/auth'

export default function App() {
  const location = useLocation()
  const restoreSession = useAuthStore(s => s.restoreSession)

  useEffect(() => { restoreSession() }, [])

  // Scroll to top on route change
  useEffect(() => { window.scrollTo(0, 0) }, [location.pathname])

  return (
    <div id="wyatt-app">
      <AppNav />
      <main>
        <AppRouter />
      </main>
      <AppFooter />
    </div>
  )
}
