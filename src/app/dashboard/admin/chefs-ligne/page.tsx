'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Input } from '@/components/ui';
import styles from './chefs-ligne.module.css';

interface ChefLigne {
    id: string;
    nom: string;
    prenom: string;
    telephone: string;
    email: string;
    syndicat_id: string;
    syndicat_nom?: string;
    ville?: string;
    status: 'actif' | 'suspendu' | 'inactif';
    created_at: string;
}

interface Syndicat {
    id: string;
    nom: string;
    ville: string;
}

// Données de démonstration pour test
const DEMO_CHEFS: ChefLigne[] = [
    {
        id: '1',
        nom: 'Kouassi',
        prenom: 'Jean',
        telephone: '+225 07 12 34 56 78',
        email: 'jean.kouassi@afrimobilis.local',
        syndicat_id: '1',
        syndicat_nom: 'Syndicat des Taxis de Bassam Centre',
        ville: 'Grand-Bassam',
        status: 'actif',
        created_at: '2024-01-15T10:00:00Z'
    },
    {
        id: '2',
        nom: 'Yao',
        prenom: 'Marie',
        telephone: '+225 07 23 45 67 89',
        email: 'marie.yao@afrimobilis.local',
        syndicat_id: '2',
        syndicat_nom: 'Syndicat des Taxis de Bassam Nord',
        ville: 'Grand-Bassam',
        status: 'actif',
        created_at: '2024-02-20T14:30:00Z'
    },
    {
        id: '3',
        nom: 'Koné',
        prenom: 'Amadou',
        telephone: '+225 07 34 56 78 90',
        email: 'amadou.kone@afrimobilis.local',
        syndicat_id: '1',
        syndicat_nom: 'Syndicat des Taxis de Bassam Centre',
        ville: 'Grand-Bassam',
        status: 'suspendu',
        created_at: '2024-03-10T09:15:00Z'
    }
];

const DEMO_SYNDICATS: Syndicat[] = [
    { id: '1', nom: 'Syndicat des Taxis de Bassam Centre', ville: 'Grand-Bassam' },
    { id: '2', nom: 'Syndicat des Taxis de Bassam Nord', ville: 'Grand-Bassam' },
    { id: '3', nom: 'Syndicat des Taxis de Bassam Sud', ville: 'Grand-Bassam' }
];

export default function ChefsLignePage() {
    const [chefs, setChefs] = useState<ChefLigne[]>([]);
    const [_syndicats, setSyndicats] = useState<Syndicat[]>([]);
    const [loading, setLoading] = useState(true);
    const [_error, setError] = useState<string | null>(null);
    const [useDemo, setUseDemo] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchChefs();
        fetchSyndicats();
    }, []);

    const fetchChefs = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Utiliser l'API pour récupérer les chefs (bypass RLS)
            const response = await fetch('/api/chefs');
            const result = await response.json();
            
            if (!response.ok || !result.success) {
                console.error('Erreur API chefs:', result.error);
                setChefs(DEMO_CHEFS);
                setUseDemo(true);
                setLoading(false);
                return;
            }

            const chefsData = result.data || [];

            // Récupérer les syndicats via API
            const syndicatsResponse = await fetch('/api/syndicats');
            const syndicatsResult = await syndicatsResponse.json();
            const syndicatsData = syndicatsResult.success ? syndicatsResult.data : [];
            
            interface SyndicatData {
                id: string;
                nom?: string;
                zone?: string;
            }
            const syndicatsMap = Object.fromEntries(syndicatsData.map((s: SyndicatData) => [s.id, s]));

            interface ChefData {
                id: string;
                telephone?: string;
                phone?: string;
                syndicat_id?: string;
                status?: 'actif' | 'suspendu' | 'inactif';
            }
            const formattedChefs = chefsData.map((chef: ChefData) => ({
                ...chef,
                telephone: chef.telephone || chef.phone || '-',
                syndicat_nom: syndicatsMap[chef.syndicat_id || '']?.nom || 'Non assigné',
                ville: syndicatsMap[chef.syndicat_id || '']?.zone || '-',
                status: chef.status || 'actif'
            }));

            setChefs(formattedChefs);
            setUseDemo(false);
        } catch (error: unknown) {
            console.error('Erreur fetch chefs:', error instanceof Error ? error.message : error);
            setChefs(DEMO_CHEFS);
            setUseDemo(true);
        } finally {
            setLoading(false);
        }
    };

    const fetchSyndicats = async () => {
        try {
            // Utiliser l'API pour récupérer les syndicats (bypass RLS)
            const response = await fetch('/api/syndicats');
            const result = await response.json();
            
            if (!response.ok || !result.success) {
                console.error('Erreur API syndicats:', result.error);
                setSyndicats(DEMO_SYNDICATS);
                return;
            }
            
            const data = result.data || [];
            
            // Si pas de données, utiliser les données de démo
            if (data.length === 0) {
                setSyndicats(DEMO_SYNDICATS);
                return;
            }
            
            // Filtrer les actifs et formatter
            interface SyndicatApi {
                id: string;
                nom?: string;
                statut?: string;
                zone?: string;
                zone_geographique?: { region?: string };
            }
            const actifs = data.filter((s: SyndicatApi) => s.statut === 'actif' || !s.statut);
            const formatted = actifs.map((s: SyndicatApi) => ({
                id: s.id,
                nom: s.nom,
                ville: s.zone || s.zone_geographique?.region || 'Grand-Bassam'
            }));
            
            setSyndicats(formatted.length > 0 ? formatted : DEMO_SYNDICATS);
        } catch (error: unknown) {
            console.error('Erreur fetch syndicats:', error instanceof Error ? error.message : error);
            setSyndicats(DEMO_SYNDICATS);
        }
    };

    const handleToggleStatus = async (chefId: string, currentStatus: string) => {
        if (useDemo) {
            // Mode démo : simuler le changement localement
            const newStatus = currentStatus === 'actif' ? 'suspendu' : 'actif';
            setChefs(prev => prev.map(c => 
                c.id === chefId ? { ...c, status: newStatus as 'actif' | 'suspendu' | 'inactif' } : c
            ));
            return;
        }

        const newStatus = currentStatus === 'actif' ? 'suspendu' : 'actif';
        
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ status: newStatus })
                .eq('id', chefId);

            if (error) throw error;
            fetchChefs();
        } catch (error) {
            console.error('Erreur toggle status:', error);
            alert('Erreur lors du changement de statut');
        }
    };

    const filteredChefs = chefs.filter(chef => 
        chef.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chef.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chef.telephone?.includes(searchTerm) ||
        chef.syndicat_nom?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            'actif': styles.statusActif,
            'suspendu': styles.statusSuspendu,
            'inactif': styles.statusInactif
        };
        return badges[status] || styles.statusInactif;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>👑 Liste des Chefs de Ligne</h1>
                    <p className={styles.subtitle}>
                        Vue d&apos;ensemble de tous les chefs de ligne et leurs syndicats affiliés
                    </p>
                </div>
            </div>

            {/* Info */}
            <div className={styles.infoGuide}>
                <p className={styles.guideNote}>
                    💡 Pour créer un nouveau Chef de Ligne, rendez-vous dans la section <strong>&quot;Villes & Syndicats&quot;</strong>.
                </p>
            </div>

            {useDemo && (
                <div className={styles.demoBanner}>
                    <span>🚀 Mode Démonstration</span>
                    <p>
                        Les données affichées sont fictives. 
                        Configurez Supabase pour utiliser la base de données réelle.
                    </p>
                </div>
            )}

            <div className={styles.searchBar}>
                <Input
                    type="text"
                    placeholder="Rechercher par nom, téléphone ou syndicat..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            {loading ? (
                <div className={styles.loading}>Chargement...</div>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Contact</th>
                                <th>Syndicat</th>
                                <th>Ville</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredChefs.map((chef) => (
                                <tr key={chef.id}>
                                    <td>
                                        <div className={styles.userCell}>
                                            <div className={styles.avatar}>
                                                {chef.prenom?.[0]}{chef.nom?.[0]}
                                            </div>
                                            <div>
                                                <div className={styles.userName}>
                                                    {chef.prenom} {chef.nom}
                                                </div>
                                                <div className={styles.userDate}>
                                                    {new Date(chef.created_at).toLocaleDateString('fr-FR')}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.contactCell}>
                                            <span>📞 {chef.telephone}</span>
                                            {chef.email && <span>✉️ {chef.email}</span>}
                                        </div>
                                    </td>
                                    <td>{chef.syndicat_nom || 'Non assigné'}</td>
                                    <td>{chef.ville || '-'}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${getStatusBadge(chef.status)}`}>
                                            {chef.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button 
                                                className={styles.actionBtn}
                                                onClick={() => handleToggleStatus(chef.id, chef.status)}
                                                title={chef.status === 'actif' ? 'Suspendre' : 'Activer'}
                                            >
                                                {chef.status === 'actif' ? '🚫' : '✅'}
                                            </button>
                                            <button className={styles.actionBtn} title="Voir détails">
                                                👁️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredChefs.length === 0 && (
                        <div className={styles.emptyState}>
                            <p>Aucun chef de ligne trouvé</p>
                            {searchTerm && <span>Essayez une autre recherche</span>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
