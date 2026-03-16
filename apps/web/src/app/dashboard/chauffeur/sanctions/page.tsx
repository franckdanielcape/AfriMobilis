'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import styles from './sanctions.module.css';

interface Sanction {
    id: string;
    type_sanction: 'avertissement' | 'legere' | 'lourde' | 'suspension';
    motif: string;
    description?: string;
    statut: 'en_attente' | 'valide' | 'annule';
    date_incident: string;
    date_creation: string;
    vehicule_immatriculation?: string;
    agent_prenom?: string;
    agent_nom?: string;
}

export default function ChauffeurSanctionsPage(): JSX.Element {
    const router = useRouter();
    const [sanctions, setSanctions] = useState<Sanction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'en_attente' | 'valide'>('all');
    const [stats, setStats] = useState({
        total: 0,
        enAttente: 0,
        validees: 0,
    });

    const fetchSanctions = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                router.push('/login');
                return;
            }

            const response = await fetch('/api/chauffeur/sanctions', {
                headers: {
                    'x-user-id': session.user.id,
                },
            });

            if (response.ok) {
                const data = await response.json();
                const sanctionsData = data.sanctions || [];
                setSanctions(sanctionsData);
                
                // Calculer les stats
                setStats({
                    total: sanctionsData.length,
                    enAttente: sanctionsData.filter((s: Sanction) => s.statut === 'en_attente').length,
                    validees: sanctionsData.filter((s: Sanction) => s.statut === 'valide').length,
                });
            }
        } catch (error) {
            console.error('Erreur récupération sanctions:', error);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchSanctions();
    }, [fetchSanctions]);

    // Helpers
    const getTypeLabel = (type: string): string => {
        const labels: Record<string, string> = {
            avertissement: '⚠️ Avertissement',
            legere: '📋 Sanction légère',
            lourde: '⚠️ Sanction lourde',
            suspension: '🚫 Suspension',
        };
        return labels[type] || type;
    };

    const getTypeClass = (type: string): string => {
        switch (type) {
            case 'avertissement':
                return styles.typeAvertissement;
            case 'legere':
                return styles.typeLegere;
            case 'lourde':
                return styles.typeLourde;
            case 'suspension':
                return styles.typeSuspension;
            default:
                return '';
        }
    };

    const getStatutBadge = (statut: string): string => {
        const badges: Record<string, string> = {
            en_attente: '⏳ En attente de validation',
            valide: '✅ Validée',
            annule: '❌ Annulée',
        };
        return badges[statut] || statut;
    };

    const filteredSanctions = sanctions.filter(s => {
        if (filter === 'all') return true;
        return s.statut === filter;
    });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>⚠️ Mes Sanctions</h1>
                <p className={styles.subtitle}>
                    Consultez vos avertissements et sanctions
                </p>
            </div>

            {/* Alertes */}
            {stats.enAttente > 0 && (
                <div className={styles.alert}>
                    <span className={styles.alertIcon}>🔔</span>
                    <div>
                        <strong>Validation en attente</strong>
                        <p>Vous avez {stats.enAttente} sanction{stats.enAttente > 1 ? 's' : ''} en attente de validation par un administrateur.</p>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{stats.total}</span>
                    <span className={styles.statLabel}>Total</span>
                </div>
                <div className={`${styles.statCard} ${styles.statCardWarning}`}>
                    <span className={styles.statValue}>{stats.enAttente}</span>
                    <span className={styles.statLabel}>En attente</span>
                </div>
                <div className={`${styles.statCard} ${styles.statCardDanger}`}>
                    <span className={styles.statValue}>{stats.validees}</span>
                    <span className={styles.statLabel}>Validées</span>
                </div>
            </div>

            {/* Filtres */}
            <div className={styles.filters}>
                <button
                    className={`${styles.filterBtn} ${filter === 'all' ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilter('all')}
                >
                    Toutes ({stats.total})
                </button>
                <button
                    className={`${styles.filterBtn} ${filter === 'en_attente' ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilter('en_attente')}
                >
                    En attente ({stats.enAttente})
                </button>
                <button
                    className={`${styles.filterBtn} ${filter === 'valide' ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilter('valide')}
                >
                    Validées ({stats.validees})
                </button>
            </div>

            {/* Liste des sanctions */}
            <div className={styles.sanctionsList}>
                {loading ? (
                    <div className={styles.loading}>Chargement...</div>
                ) : filteredSanctions.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>✅</span>
                        <h3>Aucune sanction</h3>
                        <p>Vous n&apos;avez aucune sanction enregistrée. Continuez comme ça !</p>
                    </div>
                ) : (
                    filteredSanctions.map((sanction) => (
                        <div 
                            key={sanction.id} 
                            className={`${styles.sanctionCard} ${getTypeClass(sanction.type_sanction)}`}
                        >
                            <div className={styles.sanctionHeader}>
                                <span className={styles.typeBadge}>
                                    {getTypeLabel(sanction.type_sanction)}
                                </span>
                                <span className={styles.statutBadge}>
                                    {getStatutBadge(sanction.statut)}
                                </span>
                            </div>

                            <div className={styles.sanctionBody}>
                                <h3 className={styles.motif}>{sanction.motif}</h3>
                                
                                {sanction.description && (
                                    <p className={styles.description}>{sanction.description}</p>
                                )}

                                <div className={styles.details}>
                                    {sanction.vehicule_immatriculation && (
                                        <p>
                                            <span className={styles.label}>Véhicule :</span>
                                            {sanction.vehicule_immatriculation}
                                        </p>
                                    )}
                                    <p>
                                        <span className={styles.label}>Date de l&apos;incident :</span>
                                        {new Date(sanction.date_incident).toLocaleDateString('fr-FR')}
                                    </p>
                                    <p>
                                        <span className={styles.label}>Signalé par :</span>
                                        {sanction.agent_prenom} {sanction.agent_nom}
                                    </p>
                                    <p>
                                        <span className={styles.label}>Date de signalement :</span>
                                        {new Date(sanction.date_creation).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                            </div>

                            {sanction.statut === 'valide' && (
                                <div className={styles.sanctionFooter}>
                                    <span className={styles.warningText}>
                                        ⚠️ Cette sanction est validée et fait partie de votre dossier.
                                    </span>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Info */}
            <div className={styles.infoBox}>
                <h4>📋 Informations</h4>
                <ul>
                    <li>Les avertissements et sanctions sont décidés par les agents de terrain ou les chefs de ligne.</li>
                    <li>Une sanction en attente sera validée ou annulée par un administrateur.</li>
                    <li>En cas de contestation, contactez votre chef de ligne ou le syndicat.</li>
                    <li>Le cumul de sanctions peut entraîner des mesures disciplinaires.</li>
                </ul>
            </div>
        </div>
    );
}
