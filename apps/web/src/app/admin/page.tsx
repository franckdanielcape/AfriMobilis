'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import styles from './page.module.css';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        syndicats: 0,
        lignes: 0,
        vehicules: 0,
        users: 0,
    });

    useEffect(() => {
        const fetchStats = async () => {
            // In a real scenario, use an RPC or specific counts. 
            // For MVP, we do simple counts.
            const [{ count: synCount }, { count: ligCount }, { count: vehCount }, { count: usrCount }] = await Promise.all([
                supabase.from('syndicats').select('*', { count: 'exact', head: true }),
                supabase.from('lignes').select('*', { count: 'exact', head: true }),
                supabase.from('vehicules').select('*', { count: 'exact', head: true }),
                supabase.from('users').select('*', { count: 'exact', head: true }),
            ]);

            setStats({
                syndicats: synCount || 0,
                lignes: ligCount || 0,
                vehicules: vehCount || 0,
                users: usrCount || 0,
            });
        };

        fetchStats();
    }, []);

    return (
        <div className="fade-in">
            <h2 style={{ marginBottom: 'var(--space-6)', fontFamily: 'var(--font-heading)' }}>Vue d&apos;ensemble</h2>

            <div className={styles.statsGrid}>
                <div className={`${styles.statCard} glass-panel`}>
                    <div className={styles.statIcon}>🏢</div>
                    <div className={styles.statInfo}>
                        <div className={styles.statTitle}>Syndicats Actifs</div>
                        <div className={styles.statValue}>{stats.syndicats}</div>
                    </div>
                </div>

                <div className={`${styles.statCard} glass-panel`}>
                    <div className={styles.statIcon}>🛣️</div>
                    <div className={styles.statInfo}>
                        <div className={styles.statTitle}>Lignes Desservies</div>
                        <div className={styles.statValue}>{stats.lignes}</div>
                    </div>
                </div>

                <div className={`${styles.statCard} glass-panel`}>
                    <div className={styles.statIcon}>🚕</div>
                    <div className={styles.statInfo}>
                        <div className={styles.statTitle}>Véhicules Enregistrés</div>
                        <div className={styles.statValue}>{stats.vehicules}</div>
                    </div>
                </div>

                <div className={`${styles.statCard} glass-panel`}>
                    <div className={styles.statIcon}>👥</div>
                    <div className={styles.statInfo}>
                        <div className={styles.statTitle}>Utilisateurs</div>
                        <div className={styles.statValue}>{stats.users}</div>
                    </div>
                </div>
            </div>

            <div className={styles.recentSection}>
                <h3 style={{ marginBottom: 'var(--space-4)', fontFamily: 'var(--font-heading)' }}>Activités récentes</h3>
                <div className="glass-panel" style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Les logs d&apos;activité apparaîtront ici. (Création de syndicats, affectations, etc.)
                </div>
            </div>
        </div>
    );
}
