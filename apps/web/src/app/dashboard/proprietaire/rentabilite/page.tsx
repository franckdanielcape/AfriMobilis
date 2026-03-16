'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui';
import styles from './rentabilite.module.css';

interface Stats {
    total_vehicules: number;
    vehicules_actifs: number;
    total_versements_attendus: number;
    total_versements_recus: number;
    taux_recouvrement: number;
    nombre_versements_en_retard: number;
    montant_retard: number;
    total_pannes: number;
    pannes_en_cours: number;
    cout_total_pannes: number;
    periode_debut: string;
    periode_fin: string;
}

interface VersementMois {
    mois: string;
    mois_label: string;
    attendus: number;
    recus: number;
    retard: number;
}

interface PerformanceVehicule {
    vehicule_id: string;
    immatriculation: string;
    marque: string;
    modele: string;
    statut: string;
    chauffeur_nom: string;
    total_versements_attendus: number;
    total_versements_recus: number;
    taux_recouvrement: number;
    nb_pannes: number;
    cout_pannes: number;
}

interface PanneType {
    type_panne: string;
    nombre: number;
    cout_total: number;
}

export default function RentabilitePage(): JSX.Element {
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [versementsMois, setVersementsMois] = useState<VersementMois[]>([]);
    const [performanceVehicules, setPerformanceVehicules] = useState<PerformanceVehicule[]>([]);
    const [pannesType, setPannesType] = useState<PanneType[]>([]);
    const [loading, setLoading] = useState(true);
    const [periode, setPeriode] = useState<'annee' | 'trimestre' | 'mois'>('annee');
    const [isAuthorized, setIsAuthorized] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                router.push('/login');
                return;
            }

            // Calculer les dates selon la période
            const today = new Date();
            let dateDebut = '';
            
            switch (periode) {
                case 'mois':
                    dateDebut = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                    break;
                case 'trimestre':
                    const quarter = Math.floor(today.getMonth() / 3);
                    dateDebut = new Date(today.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
                    break;
                case 'annee':
                default:
                    dateDebut = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
                    break;
            }

            const dateFin = today.toISOString().split('T')[0];

            const response = await fetch(
                `/api/proprietaire/rentabilite?date_debut=${dateDebut}&date_fin=${dateFin}`,
                {
                    headers: {
                        'x-user-id': session.user.id,
                    },
                }
            );

            if (response.status === 403) {
                setIsAuthorized(false);
                return;
            }

            if (response.ok) {
                const data = await response.json();
                setStats(data.stats);
                setVersementsMois(data.versements_par_mois || []);
                setPerformanceVehicules(data.performance_vehicules || []);
                setPannesType(data.pannes_par_type || []);
            }
        } catch (error) {
            console.error('Erreur récupération données:', error);
        } finally {
            setLoading(false);
        }
    }, [periode, router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (!isAuthorized) {
        return (
            <div className={styles.container}>
                <div className={styles.unauthorized}>
                    <h2>⛔ Accès refusé</h2>
                    <p>Cette page est réservée aux propriétaires.</p>
                </div>
            </div>
        );
    }

    // Format currency
    const formatFCFA = (amount: number): string => {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
    };

    // Trouver le max pour les barres de progression
    const maxVersement = Math.max(...versementsMois.map(v => v.attendus || 1), 1);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>💰 Rentabilité</h1>
                    <p className={styles.subtitle}>
                        Suivi de vos revenus et dépenses
                    </p>
                </div>
                <div className={styles.periodeSelector}>
                    <button
                        className={`${styles.periodeBtn} ${periode === 'annee' ? styles.periodeBtnActive : ''}`}
                        onClick={() => setPeriode('annee')}
                    >
                        Cette année
                    </button>
                    <button
                        className={`${styles.periodeBtn} ${periode === 'trimestre' ? styles.periodeBtnActive : ''}`}
                        onClick={() => setPeriode('trimestre')}
                    >
                        Ce trimestre
                    </button>
                    <button
                        className={`${styles.periodeBtn} ${periode === 'mois' ? styles.periodeBtnActive : ''}`}
                        onClick={() => setPeriode('mois')}
                    >
                        Ce mois
                    </button>
                </div>
            </div>

            {loading ? (
                <div className={styles.loading}>Chargement...</div>
            ) : !stats ? (
                <div className={styles.empty}>Aucune donnée disponible</div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className={styles.kpiGrid}>
                        <div className={`${styles.kpiCard} ${styles.kpiRevenus}`}>
                            <span className={styles.kpiIcon}>💵</span>
                            <div className={styles.kpiContent}>
                                <span className={styles.kpiValue}>{formatFCFA(stats.total_versements_recus)}</span>
                                <span className={styles.kpiLabel}>Revenus reçus</span>
                                <span className={styles.kpiSub}>
                                    sur {formatFCFA(stats.total_versements_attendus)} attendus
                                </span>
                            </div>
                        </div>

                        <div className={`${styles.kpiCard} ${styles.kpiTaux}`}>
                            <span className={styles.kpiIcon}>📊</span>
                            <div className={styles.kpiContent}>
                                <span className={styles.kpiValue}>{stats.taux_recouvrement}%</span>
                                <span className={styles.kpiLabel}>Taux de recouvrement</span>
                                <div className={styles.progressBar}>
                                    <div 
                                        className={styles.progressFill} 
                                        style={{ width: `${Math.min(stats.taux_recouvrement, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={`${styles.kpiCard} ${styles.kpiRetard}`}>
                            <span className={styles.kpiIcon}>⚠️</span>
                            <div className={styles.kpiContent}>
                                <span className={styles.kpiValue}>{stats.nombre_versements_en_retard}</span>
                                <span className={styles.kpiLabel}>Versements en retard</span>
                                <span className={styles.kpiSub}>
                                    {formatFCFA(stats.montant_retard)}
                                </span>
                            </div>
                        </div>

                        <div className={`${styles.kpiCard} ${styles.kpiPannes}`}>
                            <span className={styles.kpiIcon}>🔧</span>
                            <div className={styles.kpiContent}>
                                <span className={styles.kpiValue}>{formatFCFA(stats.cout_total_pannes)}</span>
                                <span className={styles.kpiLabel}>Coût des pannes</span>
                                <span className={styles.kpiSub}>
                                    {stats.total_pannes} pannes ({stats.pannes_en_cours} en cours)
                                </span>
                            </div>
                        </div>

                        <div className={`${styles.kpiCard} ${styles.kpiVehicules}`}>
                            <span className={styles.kpiIcon}>🚗</span>
                            <div className={styles.kpiContent}>
                                <span className={styles.kpiValue}>{stats.vehicules_actifs}</span>
                                <span className={styles.kpiLabel}>Véhicules actifs</span>
                                <span className={styles.kpiSub}>
                                    sur {stats.total_vehicules} total
                                </span>
                            </div>
                        </div>

                        <div className={`${styles.kpiCard} ${styles.kpiBenefice}`}>
                            <span className={styles.kpiIcon}>💚</span>
                            <div className={styles.kpiContent}>
                                <span className={styles.kpiValue}>
                                    {formatFCFA(stats.total_versements_recus - stats.cout_total_pannes)}
                                </span>
                                <span className={styles.kpiLabel}>Bénéfice net estimé</span>
                                <span className={styles.kpiSub}>
                                    Recettes - Pannes
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Graphique Versements */}
                    <div className={styles.section}>
                        <h2>📈 Évolution des versements</h2>
                        <div className={styles.chartContainer}>
                            {versementsMois.length === 0 ? (
                                <p className={styles.noData}>Aucune donnée pour cette période</p>
                            ) : (
                                <div className={styles.barChart}>
                                    {versementsMois.map((mois) => (
                                        <div key={mois.mois} className={styles.barGroup}>
                                            <div className={styles.barWrapper}>
                                                {/* Barre attendus */}
                                                <div 
                                                    className={styles.barAttendus}
                                                    style={{ 
                                                        height: `${(mois.attendus / maxVersement) * 200}px`,
                                                        minHeight: mois.attendus > 0 ? '4px' : '0'
                                                    }}
                                                    title={`Attendus: ${formatFCFA(mois.attendus)}`}
                                                />
                                                {/* Barre reçus */}
                                                <div 
                                                    className={styles.barRecus}
                                                    style={{ 
                                                        height: `${(mois.recus / maxVersement) * 200}px`,
                                                        minHeight: mois.recus > 0 ? '4px' : '0'
                                                    }}
                                                    title={`Reçus: ${formatFCFA(mois.recus)}`}
                                                />
                                            </div>
                                            <span className={styles.barLabel}>{mois.mois_label}</span>
                                            {mois.retard > 0 && (
                                                <span className={styles.barRetard}>
                                                    ⚠️ {formatFCFA(mois.retard)}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className={styles.chartLegend}>
                                <span><span className={styles.legendAttendus} /> Attendus</span>
                                <span><span className={styles.legendRecus} /> Reçus</span>
                            </div>
                        </div>
                    </div>

                    {/* Performance par véhicule */}
                    <div className={styles.section}>
                        <h2>🚗 Performance par véhicule</h2>
                        <div className={styles.tableContainer}>
                            {performanceVehicules.length === 0 ? (
                                <p className={styles.noData}>Aucun véhicule enregistré</p>
                            ) : (
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Véhicule</th>
                                            <th>Chauffeur</th>
                                            <th>Versements attendus</th>
                                            <th>Versements reçus</th>
                                            <th>Taux recouvrement</th>
                                            <th>Pannes</th>
                                            <th>Coût pannes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {performanceVehicules.map((v) => (
                                            <tr key={v.vehicule_id}>
                                                <td>
                                                    <strong>{v.immatriculation}</strong>
                                                    <br />
                                                    <small>{v.marque} {v.modele}</small>
                                                    <br />
                                                    <span className={`${styles.badge} ${v.statut === 'actif' ? styles.badgeSuccess : styles.badgeWarning}`}>
                                                        {v.statut}
                                                    </span>
                                                </td>
                                                <td>{v.chauffeur_nom}</td>
                                                <td>{formatFCFA(v.total_versements_attendus)}</td>
                                                <td className={v.total_versements_recus >= v.total_versements_attendus ? styles.success : styles.warning}>
                                                    {formatFCFA(v.total_versements_recus)}
                                                </td>
                                                <td>
                                                    <div className={styles.tauxCell}>
                                                        <span className={v.taux_recouvrement >= 90 ? styles.success : v.taux_recouvrement >= 70 ? styles.warning : styles.danger}>
                                                            {v.taux_recouvrement}%
                                                        </span>
                                                        <div className={styles.miniProgress}>
                                                            <div 
                                                                className={styles.miniProgressFill}
                                                                style={{ 
                                                                    width: `${Math.min(v.taux_recouvrement, 100)}%`,
                                                                    background: v.taux_recouvrement >= 90 ? '#10b981' : v.taux_recouvrement >= 70 ? '#f59e0b' : '#dc2626'
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{v.nb_pannes}</td>
                                                <td>{formatFCFA(v.cout_pannes)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Pannes par type */}
                    {pannesType.length > 0 && (
                        <div className={styles.section}>
                            <h2>🔧 Répartition des pannes</h2>
                            <div className={styles.pannesGrid}>
                                {pannesType.map((panne) => (
                                    <div key={panne.type_panne} className={styles.panneCard}>
                                        <span className={styles.panneType}>{panne.type_panne}</span>
                                        <span className={styles.panneNombre}>{panne.nombre} panne{panne.nombre > 1 ? 's' : ''}</span>
                                        <span className={styles.panneCout}>{formatFCFA(panne.cout_total)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
