import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useVehicules } from '../hooks/useVehicules';
import { Button } from '../components/ui';
import type { Vehicule } from '../types';

const statusColors: Record<string, string> = {
    conforme: 'bg-green-100 text-green-800',
    bientot_expire: 'bg-yellow-100 text-yellow-800',
    non_conforme: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
    conforme: 'Conforme',
    bientot_expire: 'Bientôt expiré',
    non_conforme: 'Non conforme',
};

export default function Vehicules() {
    const { user } = useAuth();
    const { vehicules, affectations, loading, error, refresh } = useVehicules(user?.id);
    const [searchTerm, setSearchTerm] = useState('');
    const [filtreStatut, setFiltreStatut] = useState<string>('tous');

    const vehiculesFiltres = vehicules.filter((v: Vehicule) => {
        const matchStatut = filtreStatut === 'tous' || v.statut === filtreStatut;
        const matchSearch = 
            v.immatriculation.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.modele.toLowerCase().includes(searchTerm.toLowerCase());
        return matchStatut && matchSearch;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-slate-600">Chargement de vos véhicules...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
                <Button onClick={refresh} variant="secondary" className="mt-2">
                    Réessayer
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">🚕 Mes Véhicules</h1>
                    <p className="text-slate-600">Gérez votre flotte et suivez la conformité</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white px-4 py-2 rounded-lg border text-center">
                        <div className="text-2xl font-bold text-slate-900">{vehicules.length}</div>
                        <div className="text-sm text-slate-500">Total</div>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg border text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {vehicules.filter((v: Vehicule) => v.statut === 'actif').length}
                        </div>
                        <div className="text-sm text-slate-500">Actifs</div>
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border">
                <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                    <input
                        type="text"
                        placeholder="Rechercher un véhicule..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                    />
                </div>
                <select
                    value={filtreStatut}
                    onChange={(e) => setFiltreStatut(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                >
                    <option value="tous">Tous les statuts</option>
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                    <option value="maintenance">En maintenance</option>
                </select>
            </div>

            {/* Liste */}
            {vehiculesFiltres.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border">
                    <div className="text-6xl mb-4">🚕</div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun véhicule trouvé</h3>
                    <p className="text-slate-600">
                        {searchTerm || filtreStatut !== 'tous'
                            ? 'Essayez d\'autres critères de recherche'
                            : 'Contactez votre syndicat pour ajouter des véhicules'}
                    </p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vehiculesFiltres.map((vehicule: Vehicule) => {
                        const chauffeur = affectations[vehicule.id];
                        
                        return (
                            <div key={vehicule.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="bg-sky-100 text-sky-800 px-3 py-1 rounded font-mono font-semibold">
                                        {vehicule.immatriculation}
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                                        vehicule.statut === 'actif' ? 'bg-green-100 text-green-800' :
                                        vehicule.statut === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-slate-100 text-slate-800'
                                    }`}>
                                        {vehicule.statut}
                                    </span>
                                </div>

                                {/* Info */}
                                <div className="mb-4">
                                    <h3 className="font-semibold text-slate-900">
                                        {vehicule.marque} {vehicule.modele}
                                        {vehicule.annee && <span className="text-slate-500"> ({vehicule.annee})</span>}
                                    </h3>
                                </div>

                                {/* Chauffeur */}
                                <div className="mb-4 p-3 bg-slate-50 rounded">
                                    <div className="text-xs text-slate-500 mb-1">Chauffeur</div>
                                    {chauffeur ? (
                                        <div>
                                            <div className="font-medium text-slate-900">
                                                👤 {chauffeur.chauffeur.prenom} {chauffeur.chauffeur.nom}
                                            </div>
                                            {chauffeur.chauffeur.telephone && (
                                                <div className="text-sm text-slate-600">
                                                    📞 {chauffeur.chauffeur.telephone}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500 text-sm">Aucun chauffeur</span>
                                            <Button size="sm" variant="ghost">+ Inviter</Button>
                                        </div>
                                    )}
                                </div>

                                {/* Conformité */}
                                <div className="mb-4">
                                    <div className="text-xs text-slate-500 mb-1">Conformité</div>
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${statusColors[vehicule.statut_conformite] || 'bg-slate-100'}`}>
                                        {statusLabels[vehicule.statut_conformite] || vehicule.statut_conformite}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button variant="secondary" size="sm" className="flex-1">
                                        📄 Détails
                                    </Button>
                                    {chauffeur && (
                                        <Button variant="secondary" size="sm" className="flex-1">
                                            💰 Versements
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
