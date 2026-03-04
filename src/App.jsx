import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AppLayout from './components/AppLayout'
import LoginPage from './pages/LoginPage'
import SetupPage from './pages/SetupPage'
import DashboardPage from './pages/DashboardPage'
import CondominiPage from './pages/CondominiPage'
import AttivitaPage from './pages/AttivitaPage'
import ImpostazioniPage from './pages/ImpostazioniPage'

function ProtectedRoute({ children }) {
  const { user, studio, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" />
  if (!studio) return <Navigate to="/setup" />
  return <AppLayout>{children}</AppLayout>
}

function SetupRoute({ children }) {
  const { user, studio, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" />
  if (studio) return <Navigate to="/" />
  return children
}

function PublicRoute({ children }) {
  const { user, studio, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (user && studio) return <Navigate to="/" />
  if (user && !studio) return <Navigate to="/setup" />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/setup" element={<SetupRoute><SetupPage /></SetupRoute>} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/condomini" element={<ProtectedRoute><CondominiPage /></ProtectedRoute>} />
      <Route path="/attivita" element={<ProtectedRoute><AttivitaPage /></ProtectedRoute>} />
      <Route path="/impostazioni" element={<ProtectedRoute><ImpostazioniPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
