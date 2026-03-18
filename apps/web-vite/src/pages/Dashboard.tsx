import { Link, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

// Sous-pages du dashboard
function DashboardHome() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Tableau de bord</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Véhicules</p>
              <p className="text-3xl font-bold text-blue-600">--</p>
            </div>
            <div className="text-3xl">🚕</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Chauffeurs</p>
              <p className="text-3xl font-bold text-green-600">--</p>
            </div>
            <div className="text-3xl">👨‍✈️</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Versements</p>
              <p className="text-3xl font-bold text-purple-600">--</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Bienvenue sur AfriMobilis</h3>
        <p className="text-gray-600">
          Votre plateforme de gestion de taxis pour Grand-Bassam. 
          Cette version est en cours de développement. Les fonctionnalités 
          complètes seront disponibles prochainement.
        </p>
      </div>
    </div>
  )
}

function VehiclesPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestion des Véhicules</h2>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <p className="text-gray-600">Liste des véhicules à implémenter...</p>
      </div>
    </div>
  )
}

function DriversPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestion des Chauffeurs</h2>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <p className="text-gray-600">Liste des chauffeurs à implémenter...</p>
      </div>
    </div>
  )
}

function PaymentsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Versements</h2>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <p className="text-gray-600">Historique des versements à implémenter...</p>
      </div>
    </div>
  )
}

// Composant de navigation
function Sidebar() {
  const location = useLocation()
  
  const menuItems = [
    { path: '/dashboard', label: 'Accueil', icon: '🏠' },
    { path: '/dashboard/vehicles', label: 'Véhicules', icon: '🚕' },
    { path: '/dashboard/drivers', label: 'Chauffeurs', icon: '👨‍✈️' },
    { path: '/dashboard/payments', label: 'Versements', icon: '💰' },
    { path: '/dashboard/admin', label: 'Administration', icon: '⚙️' },
  ]
  
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-3xl">🚕</span>
          <span className="text-xl font-bold text-gray-800">AfriMobilis</span>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                location.pathname === item.path
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="absolute bottom-0 w-64 p-6 border-t border-gray-200">
        <Link
          to="/login"
          onClick={() => localStorage.removeItem('auth')}
          className="flex items-center gap-3 text-red-600 hover:text-red-700"
        >
          <span>🚪</span>
          <span>Déconnexion</span>
        </Link>
      </div>
    </aside>
  )
}

export function Dashboard() {
  const [user, setUser] = useState<any>(null)
  
  useEffect(() => {
    // TODO: Récupérer l'utilisateur depuis Supabase
    setUser({ email: 'user@example.com' })
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Bonjour, {user?.email || 'Utilisateur'}
            </h1>
            <p className="text-gray-600">Grand-Bassam, Côte d&apos;Ivoire</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">🟢 En ligne</span>
          </div>
        </header>
        
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/admin" element={<div>Administration (à venir)</div>} />
        </Routes>
      </main>
    </div>
  )
}

