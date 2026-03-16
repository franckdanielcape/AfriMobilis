'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase/client';
import styles from './sanctions.module.css';

interface Sanction {
    id: string;
    date_creation: string;
    type_sanction: 'avertissement' | 'legere' | 'lourde' | 'suspension';
    motif: string;
    statut: 'en_attente' | 'valide' | 'annule';
    immatriculation: string;
    chauffeur_nom: string;
    chauffeur_prenom: string;
    createur_nom: string;
    createur_prenom: string;
}

interface Stats {
    total_sanctions: number;
    en_attente: number;
    validees: number;
    avertissements: number;
    legeres: number;
    lourdes: number;
    suspensions: number;
}

export default function SanctionsPage() {
    const router = useRouter();
    const [sanctions, setSanctions] = useState<Sanction[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ id: string; role: string; ville_id: string } | null>(null);
    const [filtreStatut, setFiltreStatut] = useState<string>('');

    useEffect(() => {
        const fetchUserAndSanctions = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('id, role, ville_id')
                .eq('id', session.user.id)
                .single();

            if (!profile) {
                router.push('/login');
                return;
            }

            setUser(profile);
            await fetchSanctions(profile.ville_id);
            await fetchStats(profile.ville_id);
        };

        fetchUserAndSanctions();
    }, [router]);

    const fetchSanctions = async (villeId: string) => {
        try {
            let url = `/api/sanctions?ville_id=${villeId}&limit=50`;
            if (filtreStatut) {
                url += `&statut=${filtreStatut}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setSanctions(data.data);
            }
        } catch (error) {
            console.error('Erreur fetch sanctions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async (villeId: string) => {
        try {
            const response = await fetch(`/api/sanctions/stats?ville_id=${villeId}`);
            const data = await response.json();

            if (data.success) {
                setStats(data.stats.globales);
            }
        } catch (error) {
            console.error('Erreur fetch stats:', error);
        }
    };

    const handleValider = async (id: string, valide: boolean) => {
        try {
            const response = await fetch(`/api/sanctions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    statut: valide ? 'valide' : 'annule',
                    valide_par: user?.id
                })
            });

            if (response.ok && user?.ville_id) {
                await fetchSanctions(user.ville_id);
                await fetchStats(user.ville_id);
            }
        } catch (error) {
            console.error('Erreur validation:', error);
        }
    };

    const getTypeBadge = (type_sanction: string) => {
        switch (type_sanction) {
            case 'avertissement':
                return <span className={styles.badgeAvertissement}>Avertissement</span>;
            case 'legere':
                return <span className={styles.badgeLegere}>Légère</span>;
            case 'lourde':
                return <span className={styles.badgeLourde}>Lourde</span>;
            case 'suspension':
                return <span className={styles.badgeSuspension}>Suspension</span>;
            default:
                return <span>{type}</span>;
        }
    };

    const getStatutBadge = (statut: string) => {
        switch (statut) {
            case 'en_attente':
                return <span className={styles.badgeEnAttente}>En attente</span>;
            case 'valide':
                return <span className={styles.badgeValide}>Validée</span>;
            case 'annule':
                return <span className={styles.badgeAnnule}>Annulée</span>;
            default:
                return <span>{statut}</span>;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Chargement des sanctions...</p>
            </div>
        );
    }

    const canCreate = ['agent_terrain', 'chef_ligne', 'admin_syndicat', 'super_chef_de_ligne'].includes(user?.role || '');
    const canValidate = ['chef_ligne', 'admin_syndicat', 'super_chef_de_ligne', 'super_admin'].includes(user?.role || '');

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Sanctions et Avertissements</h1>
                    <p className={styles.subtitle}>
                        Gestion des infractions et sanctions
                    </p>
                </div>
                {canCreate && (
                    <Link href="/dashboard/sanctions/nouveau" className={styles.btnPrimary}>
                        + Nouvelle sanction
                    </Link>
                )}
            </div>

            {stats && (
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{stats.total_sanctions}</div>
                        <div className={styles.statLabel}>Total (30j)</div>
                    </div>
                    <div className={`${styles.statCard} ${styles.statEnAttente}`}>
                        <div className={styles.statValue}>{stats.en_attente}</div>
                        <div className={styles.statLabel}>En attente</div>
                    </div>
                    <div className={`${styles.statCard} ${styles.statValide}`}>
                        <div className={styles.statValue}>{stats.validees}</div>
                        <div className={styles.statLabel}>Validées</div>
                    </div>
                    <div className={`${styles.statCard} ${styles.statAvertissement}`}>
                        <div className={styles.statValue}>{stats.avertissements}</div>
                        <div className={styles.statLabel}>Avertissements</div>
                    </div>
                    <div className={`${styles.statCard} ${styles.statLourde}`}>
                        <div className={styles.statValue}>{stats.lourdes}</div>
                        <div className={styles.statLabel}>Lourdes</div>
                    </div>
                </div>
            )}

            <div className={styles.filters}>
                <label>Filtrer par statut:</label>
                <select 
                    value={filtreStatut} 
                    onChange={(e) => {
                        setFiltreStatut(e.target.value);
                        if (user?.ville_id) fetchSanctions(user.ville_id);
                    }}
                    className={styles.select}
                >
                    <option value="">Tous les statuts</option>
                    <option value="en_attente">En attente</option>
                    <option value="valide">Validée</option>
                    <option value="annule">Annulée</option>
                </select>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Véhicule</th>
                            <th>Chauffeur</th>
                            <th>Type</th>
                            <th>Motif</th>
                            <th>Statut</th>
                            <th>Créée par</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sanctions.length === 0 ? (
                            <tr>
                                <td colSpan={8} className={styles.empty}>
                                    Aucune sanction enregistrée
                                </td>
                            </tr>
                        ) : (
                            sanctions.map((sanction) => (
                                <tr key={sanction.id}>
                                    <td>{formatDate(sanction.date_creation)}</td>
                                    <td>{sanction.immatriculation}</td>
                                    <td>
                                        {sanction.chauffeur_prenom} {sanction.chauffeur_nom}
                                    </td>
                                    <td>{getTypeBadge(sanction.type_sanction)}</td>
                                    <td>{sanction.motif}</td>
                                    <td>{getStatutBadge(sanction.statut)}</td>
                                    <td>
                                        {sanction.createur_prenom} {sanction.createur_nom}
                                    </td>
                                    <td>
                                        {sanction.statut === 'en_attente' && canValidate && (
                                            <>
                                                <button 
                                                    className={styles.btnValider}
                                                    onClick={() => handleValider(sanction.id, true)}
                                                >
                                                    Valider
                                                </button>
                                                <button 
                                                    className={styles.btnAnnuler}
                                                    onClick={() => handleValider(sanction.id, false)}
                                                >
                                                    Annuler
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
