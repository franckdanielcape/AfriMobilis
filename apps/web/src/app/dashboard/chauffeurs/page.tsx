'use client';

import { useLayoutEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { Button, Input } from '@/components/ui';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import styles from '../vehicules/vehicules.module.css';

interface Chauffeur {
    id: string;
    nom?: string;
    prenom?: string;
    telephone?: string;
    email?: string;
    created_at: string;
}

export default function ChauffeursPage() {
    const router = useRouter();
    // Selon le CDC, seuls les Chefs de Ligne peuvent VOIR la liste des chauffeurs
    // mais la CREATION est réservée au propriétaire
    const { isLoading: authLoading, profile } = useAuthGuard({ 
        requiredRole: ['chef_de_ligne', 'chef_ligne', 'admin_syndicat', 'super_chef_de_ligne', 'super_admin'] 
    });
    
    const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchChauffeurs = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('profiles')
            .select('id, nom, prenom, telephone, email, created_at')
            .eq('role', 'chauffeur')
            .order('created_at', { ascending: false });
        setChauffeurs(data || []);
        setLoading(false);
    };

    useLayoutEffect(() => {
        const frameId = requestAnimationFrame(() => {
            fetchChauffeurs();
        });
        return () => cancelAnimationFrame(frameId);
    }, []);

    // NOTE: Selon le CDC, la création de chauffeurs est réservée au PROPRIÉTAIRE
    // Cette page est en lecture seule pour les Chefs de Ligne
    // La création se fait via /dashboard/proprietaire/chauffeurs/nouveau

    if (authLoading) return <div className={styles.emptyState}>Vérification des accès...</div>;

    return (
        <div className="fade-in">
            <div className={styles.header}>
                <h2>Gestion des Chauffeurs</h2>
                {/* NOTE: Le bouton de création est SUPPRIMÉ car selon le CDC, 
                    seul le PROPRIÉTAIRE peut créer des chauffeurs.
                    La création se fait via /dashboard/proprietaire/chauffeurs/nouveau */}
            </div>
            
            <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <p style={{ margin: 0, color: '#92400e', fontSize: '0.9rem' }}>
                    💡 <strong>Information :</strong> Selon le règlement, les chauffeurs sont créés par les propriétaires de véhicules. 
                    Cette page permet uniquement de consulter la liste des chauffeurs enregistrés.
                </p>
            </div>

            <div className={`${styles.tableContainer} glass-panel`}>
                {loading ? <div className={styles.emptyState}>Chargement…</div> :
                    chauffeurs.length === 0 ? <div className={styles.emptyState}>Aucun chauffeur enregistré.</div> : (
                        <table className={styles.table}>
                            <thead>
                                <tr><th>Nom & Prénom</th><th>Téléphone</th><th>Email</th><th>Enregistré le</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {chauffeurs.map(c => (
                                    <tr key={c.id}>
                                        <td style={{ fontWeight: 600 }}>{c.prenom} {c.nom}</td>
                                        <td>{c.telephone || '—'}</td>
                                        <td>{c.email || '—'}</td>
                                        <td>{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                                        <td><Button variant="ghost" size="sm">Fiche</Button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
            </div>
        </div>
    );
}
