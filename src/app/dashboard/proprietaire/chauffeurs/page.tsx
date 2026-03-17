'use client';

import { useLayoutEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Button } from '@/components/ui';
import styles from './chauffeurs.module.css';

interface Vehicule {
    id: string;
    immatriculation: string;
    marque: string;
}

interface AffectationRow {
    chauffeur_id: string;
    date_debut: string;
    vehicule_id: string;
    vehicule: Vehicule[];
}

interface ProfilRow {
    id: string;
    nom?: string;
    prenom?: string;
    telephone?: string;
    email?: string;
    statut?: string;
}

interface Chauffeur {
    id: string;
    nom: string;
    prenom: string;
    telephone: string;
    email: string;
    statut: string;
    vehicule?: Vehicule;
    date_affectation?: string;
}

export default function ProprietaireChauffeurs() {
    const router = useRouter();
    const { isLoading: authLoading, profile } = useAuthGuard({ requiredRole: 'proprietaire' });
    
    const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filtreStatut, setFiltreStatut] = useState<string>('tous');

    const fetchChauffeurs = async () => {
        if (!profile?.id) return;
        
        try {
            // 1. Récupérer les véhicules du propriétaire
            const { data: vehicules, error: vError } = await supabase
                .from('vehicules')
                .select('id')
                .eq('proprietaire_id', profile.id);

            if (vError) throw vError;
            const vehiculeIds = (vehicules as Array<{ id: string }> | null)?.map((v: { id: string }) => v.id) || [];

            if (vehiculeIds.length === 0) {
                setChauffeurs([]);
                setLoading(false);
                return;
            }

            // 2. Récupérer les affectations actives avec les infos chauffeurs
            const { data: affectations, error: aError } = await supabase
                .from('affectations')
                .select(`
                    chauffeur_id,
                    date_debut,
                    vehicule_id,
                    vehicule:vehicules!inner(id, immatriculation, marque)
                `)
                .in('vehicule_id', vehiculeIds)
                .is('date_fin', null);

            if (aError) throw aError;

            // 3. Récupérer les profils des chauffeurs
            const chauffeurIds = (affectations as AffectationRow[] | null)?.map((a: AffectationRow) => a.chauffeur_id) || [];
            
            if (chauffeurIds.length > 0) {
                const { data: profils, error: pError } = await supabase
                    .from('profiles')
                    .select('*')
                    .in('id', chauffeurIds);

                if (pError) throw pError;

                // Combiner les données
                const chauffeursComplet: Chauffeur[] = (affectations as AffectationRow[] | null)?.map((aff: AffectationRow) => {
                    const profil = (profils as ProfilRow[] | null)?.find((p: ProfilRow) => p.id === aff.chauffeur_id);
                    return {
                        id: aff.chauffeur_id,
                        nom: profil?.nom || 'N/A',
                        prenom: profil?.prenom || 'N/A',
                        telephone: profil?.telephone || 'Non renseigné',
                        email: profil?.email || 'Non renseigné',
                        statut: profil?.statut || 'actif',
                        vehicule: aff.vehicule?.[0],
                        date_affectation: aff.date_debut,
                    };
                }) || [];

                setChauffeurs(chauffeursComplet);
            }
        } catch {
            // Erreur silencieuse - les données restent vides
        } finally {
            setLoading(false);
        }
    };

    useLayoutEffect(() => {
        if (!profile?.id) return;
        fetchChauffeurs();
    }, [profile]);

    const handleRetirerChauffeur = async (chauffeurId: string, vehiculeId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir retirer ce chauffeur du véhicule ?')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('affectations')
                .update({ date_fin: new Date().toISOString() })
                .eq('chauffeur_id', chauffeurId)
                .eq('vehicule_id', vehiculeId)
                .is('date_fin', null);

            if (error) throw error;

            // Rafraîchir la liste
            fetchChauffeurs();
        } catch {
            alert('Erreur lors du retrait du chauffeur');
        }
    };

    const chauffeursFiltres = chauffeurs.filter(c => {
        const matchStatut = filtreStatut === 'tous' || c.statut === filtreStatut;
        const matchSearch = 
            c.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.telephone.includes(searchTerm) ||
            c.vehicule?.immatriculation.toLowerCase().includes(searchTerm.toLowerCase());
        return matchStatut && matchSearch;
    });

    if (authLoading || loading) {
        return <div className={styles.loading}>Chargement de vos chauffeurs...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>👨‍✈️ Mes Chauffeurs</h1>
                    <p>Gérez les chauffeurs affectés à vos véhicules</p>
                </div>
                <Button 
                    variant="primary"
                    onClick={() => router.push('/dashboard/proprietaire/chauffeurs/inviter')}
                >
                    + Inviter un chauffeur
                </Button>
            </div>

            {/* Stats rapides */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{chauffeurs.length}</span>
                    <span className={styles.statLabel}>Chauffeurs actifs</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>
                        {chauffeurs.filter(c => c.statut === 'actif').length}
                    </span>
                    <span className={styles.statLabel}>En service</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>
                        {chauffeurs.filter(c => !c.vehicule).length}
                    </span>
                    <span className={styles.statLabel}>Sans véhicule</span>
                </div>
            </div>

            {/* Filtres */}
            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <span>🔍</span>
                    <input
                        type="text"
                        placeholder="Rechercher un chauffeur..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <select 
                    value={filtreStatut} 
                    onChange={(e) => setFiltreStatut(e.target.value)}
                    className={styles.select}
                >
                    <option value="tous">Tous les statuts</option>
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                    <option value="suspendu">Suspendu</option>
                </select>
            </div>

            {/* Liste des chauffeurs */}
            {chauffeursFiltres.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>👨‍✈️</div>
                    <h3>Aucun chauffeur trouvé</h3>
                    <p>
                        {searchTerm 
                            ? 'Essayez d&apos;autres critères de recherche'
                            : 'Invitez des chauffeurs à rejoindre votre flotte'
                        }
                    </p>
                    <Button 
                        variant="primary"
                        onClick={() => router.push('/dashboard/proprietaire/chauffeurs/inviter')}
                    >
                        Inviter un chauffeur
                    </Button>
                </div>
            ) : (
                <div className={styles.chauffeursList}>
                    {chauffeursFiltres.map((chauffeur) => (
                        <div key={chauffeur.id} className={styles.chauffeurCard}>
                            <div className={styles.chauffeurHeader}>
                                <div className={styles.avatar}>
                                    {chauffeur.prenom[0]}{chauffeur.nom[0]}
                                </div>
                                <div className={styles.chauffeurInfo}>
                                    <h3>{chauffeur.prenom} {chauffeur.nom}</h3>
                                    <span className={`${styles.statutBadge} ${styles[chauffeur.statut]}`}>
                                        {chauffeur.statut}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.chauffeurDetails}>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>📞 Téléphone</span>
                                    <span className={styles.detailValue}>{chauffeur.telephone}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>✉️ Email</span>
                                    <span className={styles.detailValue}>{chauffeur.email}</span>
                                </div>
                                
                                {chauffeur.vehicule ? (
                                    <div className={styles.vehiculeInfo}>
                                        <span className={styles.detailLabel}>🚕 Véhicule assigné</span>
                                        <div className={styles.vehiculeCardSmall}>
                                            <span className={styles.plate}>{chauffeur.vehicule.immatriculation}</span>
                                            <span className={styles.model}>{chauffeur.vehicule.marque}</span>
                                        </div>
                                        <span className={styles.affectationDate}>
                                            Depuis le {new Date(chauffeur.date_affectation || '').toLocaleDateString('fr-FR')}
                                        </span>
                                    </div>
                                ) : (
                                    <div className={styles.noVehicule}>
                                        <span>Aucun véhicule assigné</span>
                                    </div>
                                )}
                            </div>

                            <div className={styles.chauffeurActions}>
                                <button 
                                    className={styles.actionBtn}
                                    onClick={() => router.push(`/dashboard/proprietaire/chauffeurs/${chauffeur.id}`)}
                                >
                                    📄 Profil
                                </button>
                                <button 
                                    className={styles.actionBtn}
                                    onClick={() => router.push(`/dashboard/proprietaire/versements?chauffeur=${chauffeur.id}`)}
                                >
                                    💰 Versements
                                </button>
                                {chauffeur.vehicule && (
                                    <button 
                                        className={`${styles.actionBtn} ${styles.danger}`}
                                        onClick={() => handleRetirerChauffeur(chauffeur.id, chauffeur.vehicule!.id)}
                                    >
                                        ❌ Retirer
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
