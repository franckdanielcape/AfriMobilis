'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase/client';
import styles from './controles.module.css';

interface Controle {
    id: string;
    date_controle: string;
    lieu: string;
    resultat: 'conforme' | 'non_conforme' | 'avertissement';
    note: string;
    immatriculation: string;
    marque: string;
    modele: string;
    agent_nom: string;
    agent_prenom: string;
    proprietaire_nom: string;
    proprietaire_prenom: string;
}

interface Stats {
    total_controles: number;
    conformes: number;
    non_conformes: number;
    avertissements: number;
    taux_conformite: number;
}

export default function ControlesPage() {
    const router = useRouter();
    const [controles, setControles] = useState<Controle[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ id: string; role: string; ville_id: string } | null>(null);
    const [filtreResultat, setFiltreResultat] = useState<string>('');

    useEffect(() => {
        const fetchUserAndControles = async () => {
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
            await fetchControles(profile.ville_id);
            await fetchStats(profile.ville_id);
        };

        fetchUserAndControles();
    }, [router]);

    const fetchControles = async (villeId: string) => {
        try {
            let url = `/api/controles?ville_id=${villeId}&limit=50`;
            if (filtreResultat) {
                url += `&resultat=${filtreResultat}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setControles(data.data);
            }
        } catch (error) {
            console.error('Erreur fetch controles:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async (villeId: string) => {
        try {
            const response = await fetch(`/api/controles/stats?ville_id=${villeId}`);
            const data = await response.json();

            if (data.success) {
                setStats(data.stats.globales);
            }
        } catch (error) {
            console.error('Erreur fetch stats:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce contrôle ?')) {
            return;
        }

        try {
            const response = await fetch(`/api/controles/${id}`, {
                method: 'DELETE'
            });

            if (response.ok && user?.ville_id) {
                await fetchControles(user.ville_id);
                await fetchStats(user.ville_id);
            }
        } catch (error) {
            console.error('Erreur suppression:', error);
        }
    };

    const getResultatBadge = (resultat: string) => {
        switch (resultat) {
            case 'conforme':
                return <span className={styles.badgeConforme}>Conforme</span>;
            case 'non_conforme':
                return <span className={styles.badgeNonConforme}>Non conforme</span>;
            case 'avertissement':
                return <span className={styles.badgeAvertissement}>Avertissement</span>;
            default:
                return <span>{resultat}</span>;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Chargement des contrôles...</p>
            </div>
        );
    }

    const canCreate = ['chef_ligne', 'admin_syndicat', 'super_chef_de_ligne', 'agent_terrain'].includes(user?.role || '');

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Contrôles Terrain</h1>
                    <p className={styles.subtitle}>
                        Historique des contrôles effectués sur les véhicules
                    </p>
                </div>
                {canCreate && (
                    <Link href="/dashboard/controles/nouveau" className={styles.btnPrimary}>
                        + Nouveau contrôle
                    </Link>
                )}
            </div>

            {stats && (
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{stats.total_controles}</div>
                        <div className={styles.statLabel}>Total contrôles (30j)</div>
                    </div>
                    <div className={`${styles.statCard} ${styles.statConforme}`}>
                        <div className={styles.statValue}>{stats.conformes}</div>
                        <div className={styles.statLabel}>Conformes</div>
                    </div>
                    <div className={`${styles.statCard} ${styles.statNonConforme}`}>
                        <div className={styles.statValue}>{stats.non_conformes}</div>
                        <div className={styles.statLabel}>Non conformes</div>
                    </div>
                    <div className={`${styles.statCard} ${styles.statAvertissement}`}>
                        <div className={styles.statValue}>{stats.avertissements}</div>
                        <div className={styles.statLabel}>Avertissements</div>
                    </div>
                    <div className={`${styles.statCard} ${styles.statTaux}`}>
                        <div className={styles.statValue}>{stats.taux_conformite}%</div>
                        <div className={styles.statLabel}>Taux de conformité</div>
                    </div>
                </div>
            )}

            <div className={styles.filters}>
                <label>Filtrer par résultat:</label>
                <select 
                    value={filtreResultat} 
                    onChange={(e) => {
                        setFiltreResultat(e.target.value);
                        if (user?.ville_id) fetchControles(user.ville_id);
                    }}
                    className={styles.select}
                >
                    <option value="">Tous les résultats</option>
                    <option value="conforme">Conforme</option>
                    <option value="non_conforme">Non conforme</option>
                    <option value="avertissement">Avertissement</option>
                </select>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Véhicule</th>
                            <th>Propriétaire</th>
                            <th>Résultat</th>
                            <th>Lieu</th>
                            <th>Agent</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {controles.length === 0 ? (
                            <tr>
                                <td colSpan={7} className={styles.empty}>
                                    Aucun contrôle enregistré
                                </td>
                            </tr>
                        ) : (
                            controles.map((controle) => (
                                <tr key={controle.id}>
                                    <td>{formatDate(controle.date_controle)}</td>
                                    <td>
                                        <strong>{controle.immatriculation}</strong>
                                        <br />
                                        <small>{controle.marque} {controle.modele}</small>
                                    </td>
                                    <td>
                                        {controle.proprietaire_prenom} {controle.proprietaire_nom}
                                    </td>
                                    <td>{getResultatBadge(controle.resultat)}</td>
                                    <td>{controle.lieu || '-'}</td>
                                    <td>
                                        {controle.agent_prenom} {controle.agent_nom}
                                    </td>
                                    <td>
                                        <button 
                                            className={styles.btnDelete}
                                            onClick={() => handleDelete(controle.id)}
                                        >
                                            Supprimer
                                        </button>
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
