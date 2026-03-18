import { Link } from 'react-router-dom'

export default function Admin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">🚧 Administration</h1>
        <p className="text-gray-600 mb-6">Module en cours de développement</p>
        <Link 
          to="/dashboard" 
          className="text-blue-600 hover:text-blue-700 font-semibold"
        >
          ← Retour au dashboard
        </Link>
      </div>
    </div>
  )
}

