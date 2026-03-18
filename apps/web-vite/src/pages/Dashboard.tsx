import { Link } from 'react-router-dom'

export function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">🚕 AfriMobilis</h1>
          <div className="space-x-4">
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              Déconnexion
            </Link>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Tableau de bord</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Véhicules</h3>
            <p className="text-3xl font-bold text-blue-600">--</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Chauffeurs</h3>
            <p className="text-3xl font-bold text-green-600">--</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Versements</h3>
            <p className="text-3xl font-bold text-purple-600">--</p>
          </div>
        </div>
        
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600">
            Bienvenue sur AfriMobilis. Le tableau de bord complet sera disponible prochainement.
          </p>
        </div>
      </main>
    </div>
  )
}
