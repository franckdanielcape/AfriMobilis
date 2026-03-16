'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import styles from './proprietaire.module.css';

interface DashboardStats {
    totalVehicules: number;
    vehiculesActifs: number;
    totalChauffeurs: number;
    chauffeursActifs: number;
    versementsMois: number;
    versementsAttendus: number;
    pannesEnCours: number;
    conformiteAlertes: number;
}

interface Vehicule {
    id: string;
    immatriculation: string;
    marque: string;
    modele: string;
    statut: string;
}

interface Versement {
    id: string;
    montant: number;
    date_versement: string;
    vehicule_id: string;
}

interface Panne {
    id: string;
    type_panne: string;
    date_declaration: string;
    vehicule_id: string;
}

type ActiviteType = 'versement' | 'panne';

interface Activite {
    type: ActiviteType;
    date: string;
    data: Versement | Panne;
}

export default function ProprietaireDashboard() {
    const router = useRouter();
    const { isLoading: authLoading, profile } = useAuthGuard({ requiredRole: 'proprietaire' });
    
    const [stats, setStats] = useState<DashboardStats>({
        totalVehicules: 0,
        vehiculesActifs: 0,
        totalChauffeurs: 0,
        chauffeursActifs: 0,
        versementsMois: 0,
        versementsAttendus: 0,
        pannesEnCours: 0,
        conformiteAlertes: 0,
    });
    const [loading, setLoading] = useState(true);
    const [vehiculesRecents, setVehiculesRecents] = useState<Vehicule[]>([]);
    const [activiteRecente, setActiviteRecente] = useState<Activite[]>([]);

    useEffect(() => {
        if (!profile?.id) return;
        
        fetchDashboardData();
    }, [profile]);

    const fetchDashboardData = async () => {
        try {
            // Récupérer les véhicules du propriétaire
            const { data: vehicules, error: vError } = await supabase
                .from('vehicules')
                .select('*')
                .eq('proprietaire_id', profile?.id);

            if (vError) throw vError;

            // Récupérer les chauffeurs liés aux véhicules
            const vehiculeIds = vehicules?.map(v => v.id) || [];
            
            const { data: affectations, error: aError } = await supabase
                .from('affectations')
                .select('*, chauffeur:profiles!chauffeur_id(*)')
                .in('vehicule_id', vehiculeIds)
                .is('date_fin', null);

            if (aError) throw aError;

            // Récupérer les versements du mois
            const debutMois = new Date();
            debutMois.setDate(1);
            debutMois.setHours(0, 0, 0, 0);

            const { data: versements, error: verseError } = await supabase
                .from('versements')
                .select('*')
                .in('vehicule_id', vehiculeIds)
                .gte('date_versement', debutMois.toISOString());

            if (verseError) throw verseError;

            // Récupérer les pannes en cours
            const { data: pannes, error: pError } = await supabase
                .from('pannes')
                .select('*')
                .in('vehicule_id', vehiculeIds)
                .eq('statut', 'en_cours');

            if (pError) throw pError;

            // Calculer les stats
            const versementsTotal = versements?.reduce((sum, v) => sum + (v.montant || 0), 0) || 0;
            const versementsAttendus = (vehicules?.length || 0) * 50000; // Ex: 50 000 FCFA par véhicule/mois

            setStats({
                totalVehicules: vehicules?.length || 0,
                vehiculesActifs: vehicules?.filter(v => v.statut === 'actif').length || 0,
                totalChauffeurs: affectations?.length || 0,
                chauffeursActifs: affectations?.filter(a => a.statut === 'actif').length || 0,
                versementsMois: versementsTotal,
                versementsAttendus: versementsAttendus,
                pannesEnCours: pannes?.length || 0,
                conformiteAlertes: vehicules?.filter(v => v.statut_conformite === 'bientot_expire').length || 0,
            });

            setVehiculesRecents((vehicules as Vehicule[])?.slice(0, 3) || []);
            
            // Activité récente (combine versements et pannes)
            const activites: Activite[] = [
                ...(versements as Versement[])?.map(v => ({ type: 'versement' as const, date: v.date_versement, data: v })) || [],
                ...(pannes as Panne[])?.map(p => ({ type: 'panne' as const, date: p.date_declaration, data: p })) || [],
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
            
            setActiviteRecente(activites);
        } catch (error) {
            console.error('Erreur chargement dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return <div className={styles.loading}>Chargement de votre espace...</div>;
    }

    const tauxRecouvrement = stats.versementsAttendus > 0 
        ? Math.round((stats.versementsMois / stats.versementsAttendus) * 100) 
        : 0;

    return (
        <div className={styles.container}>
            {/* Header avec actions rapides */}
            <div className={styles.header}>
                <div>
                    <h1>Bienvenue, {profile?.prenom} 👋</h1>
                    <p>Gérez votre flotte et suivez vos revenus</p>
                </div>
                <div className={styles.quickActions}>
                    <Link href="/dashboard/proprietaire/chauffeurs/inviter" className="btn-primary">
                        + Inviter un chauffeur
                    </Link>
                    <Link href="/dashboard/proprietaire/pannes/nouvelle" className="btn-secondary">
                        🚨 Déclarer une panne
                    </Link>
                </div>
            </div>

            {/* Alertes */}
            {(stats.conformiteAlertes > 0 || stats.pannesEnCours > 0) && (
                <div className={styles.alerts}>
                    {stats.conformiteAlertes > 0 && (
                        <div className={`${styles.alert} ${styles.warning}`}>
                            <span>⚠️</span>
                            <span>{stats.conformiteAlertes} véhicule(s) avec documents expirant bientôt</span>
                            <Link href="/dashboard/conformite">Voir →</Link>
                        </div>
                    )}
                    {stats.pannesEnCours > 0 && (
                        <div className={`${styles.alert} ${styles.error}`}>
                            <span>🔧</span>
                            <span>{stats.pannesEnCours} panne(s) en cours de résolution</span>
                            <Link href="/dashboard/pannes">Voir →</Link>
                        </div>
                    )}
                </div>
            )}

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>🚕</div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats.totalVehicules}</span>
                        <span className={styles.statLabel}>Véhicules ({stats.vehiculesActifs} actifs)</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>👨‍✈️</div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats.totalChauffeurs}</span>
                        <span className={styles.statLabel}>Chauffeurs ({stats.chauffeursActifs} actifs)</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>💰</div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats.versementsMois.toLocaleString()} FCFA</span>
                        <span className={styles.statLabel}>Versements ce mois</span>
                        <div className={styles.progressBar}>
                            <div 
                                className={styles.progressFill} 
                                style={{ width: `${Math.min(tauxRecouvrement, 100)}%` }}
                            />
                        </div>
                        <span className={styles.progressLabel}>{tauxRecouvrement}% de l&apos;objectif</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>📈</div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats.versementsAttendus.toLocaleString()} FCFA</span>
                        <span className={styles.statLabel}>Objectif mensuel</span>
                    </div>
                </div>
            </div>

            {/* Contenu principal */}
            <div className={styles.mainGrid}>
                {/* Véhicules récents */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>🚕 Mes véhicules</h2>
                        <Link href="/dashboard/proprietaire/vehicules">Voir tout →</Link>
                    </div>
                    
                    {vehiculesRecents.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>Aucun véhicule enregistré</p>
                            <p className={styles.emptyHint}>Contactez votre syndicat pour ajouter des véhicules</p>
                        </div>
                    ) : (
                        <div className={styles.vehiculesList}>
                            {vehiculesRecents.map((v) => (
                                <div key={v.id} className={styles.vehiculeCard}>
                                    <div className={styles.vehiculeIcon}>🚕</div>
                                    <div className={styles.vehiculeInfo}>
                                        <span className={styles.vehiculePlate}>{v.immatriculation}</span>
                                        <span className={styles.vehiculeModel}>{v.marque} {v.modele}</span>
                                    </div>
                                    <span className={`${styles.badge} ${styles[v.statut]}`}>
                                        {v.statut}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Activité récente */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>📋 Activité récente</h2>
                    </div>
                    
                    {activiteRecente.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>Aucune activité récente</p>
                        </div>
                    ) : (
                        <div className={styles.activiteList}>
                            {activiteRecente.map((act, idx) => (
                                <div key={idx} className={styles.activiteItem}>
                                    <span className={styles.activiteIcon}>
                                        {act.type === 'versement' ? '💰' : '🔧'}
                                    </span>
                                    <div className={styles.activiteContent}>
                                        <span className={styles.activiteText}>
                                            {act.type === 'versement' 
                                                ? `Versement de ${(act.data as Versement).montant?.toLocaleString()} FCFA`
                                                : `Panne déclarée: ${(act.data as Panne).type_panne}`
                                            }
                                        </span>
                                        <span className={styles.activiteDate}>
                                            {new Date(act.date).toLocaleDateString('fr-FR')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Menu rapide */}
            <div className={styles.quickMenu}>
                <h3>⚡ Actions rapides</h3>
                <div className={styles.quickLinks}>
                    <Link href="/dashboard/proprietaire/vehicules" className={styles.quickLink}>
                        <span>🚕</span>
                        <span>Gérer mes véhicules</span>
                    </Link>
                    <Link href="/dashboard/proprietaire/chauffeurs" className={styles.quickLink}>
                        <span>👨‍✈️</span>
                        <span>Mes chauffeurs</span>
                    </Link>
                    <Link href="/dashboard/proprietaire/versements" className={styles.quickLink}>
                        <span>💰</span>
                        <span>Suivi des versements</span>
                    </Link>
                    <Link href="/dashboard/proprietaire/pannes" className={styles.quickLink}>
                        <span>🔧</span>
                        <span>Pannes & Maintenance</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
