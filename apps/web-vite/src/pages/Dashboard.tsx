import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    // TODO: Récupérer l'utilisateur depuis Supabase
    setUser({ email: 'user@example.com' });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Bonjour, {user?.email || 'Utilisateur'}
          </h1>
          <p className="text-slate-600">Grand-Bassam, Côte d&apos;Ivoire</p>
        </div>
        <span className="text-sm text-green-600 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          En ligne
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/vehicules" className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Véhicules</p>
              <p className="text-3xl font-bold text-sky-600">--</p>
            </div>
            <div className="text-3xl">🚕</div>
          </div>
        </Link>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Chauffeurs</p>
              <p className="text-3xl font-bold text-green-600">--</p>
            </div>
            <div className="text-3xl">👨‍✈️</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Versements ce mois</p>
              <p className="text-3xl font-bold text-purple-600">--</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Bienvenue sur AfriMobilis</h3>
        <p className="text-slate-600">
          Votre plateforme de gestion de taxis pour Grand-Bassam. 
          Cette version est en cours de développement. Les fonctionnalités 
          complètes seront disponibles prochainement.
        </p>
      </div>
    </div>
  );
}
